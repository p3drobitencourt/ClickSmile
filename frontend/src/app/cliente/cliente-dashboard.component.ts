import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import * as L from 'leaflet';
import { AuthService } from '../auth/auth.service';
import { AgendamentoService } from '../services/agendamento';
import { ChatMessageView, ChatService, SessaoChatStatus } from '../services/chat.service';
import { DentistDirectoryService, DentistSummary, ScheduleSlot } from '../services/dentist-directory.service';
import { HttpClient } from '@angular/common/http';
import { RuntimeConfigService } from '../services/runtime-config.service';
import { ChangeDetectorRef, NgZone } from '@angular/core';
import { MeusAgendamentosComponent } from './meus-agendamentos.component';

import { DashboardStateService, DashboardTab } from '../services/dashboard-state.service';

export interface DaySchedule {
  dateObj: Date;
  dateString: string;
  weekday: string;
  dayAndMonth: string;
  slots: ScheduleSlot[];
}

@Component({
  selector: 'app-cliente-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, MeusAgendamentosComponent],
  templateUrl: './cliente-dashboard.component.html',
  styleUrl: './cliente-dashboard.component.scss',
})
export class ClienteDashboardComponent implements OnInit, OnDestroy {
  activeTab: DashboardTab = 'BUSCAR';
  
  dentists: DentistSummary[] = [];
  selectedDentist: DentistSummary | null = null;
  
  // Substitui calendarSlots puros
  calendarSlots: ScheduleSlot[] = [];
  groupedSchedule: DaySchedule[] = [];
  
  // Loading flags
  isLoadingDentists = false;
  isLoadingSlots = false;
  hasError = false; // Flag for robust error handling
  
  messages: ChatMessageView[] = [];
  draftMessage = '';
  bookingStatus = 'Escolha um especialista para começar.';
  roomId = '';
  currentUserId = '';
  currentUserLabel = 'Cliente';
  sessionStatus: SessaoChatStatus | null = null;
  SessaoChatStatus = SessaoChatStatus; 
  userLocation: {lat: number, lng: number} | undefined;
  private map: L.Map | undefined;
  private marker: L.Marker | undefined;
  
  // Custom marker icon to fix Angular asset path issues for Leaflet
  private defaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
  private chatSubscription?: Subscription;
  private sessionStatusSub?: Subscription;

  // Optimistic ID para o Slot
  reservingSlotIso: string | null = null;

  diagnosticsResult = '';

  constructor(
    private auth: AuthService,
    private agendamentoService: AgendamentoService,
    private dentistDirectory: DentistDirectoryService,
    private chatService: ChatService,
    private http: HttpClient,
    private runtime: RuntimeConfigService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private dashboardState: DashboardStateService
  ) {}

  runDiagnostics(): void {
    this.diagnosticsResult = 'Iniciando teste de conectividade (aguarde até 60s se o Render estiver dormindo)...\n\n';
    const dentistaUrl = this.runtime.api('/api/public/dentistas');
    
    const startDentista = Date.now();
    this.http.get<any[]>(dentistaUrl, { observe: 'response' }).subscribe({
      next: (res) => {
        const time = Date.now() - startDentista;
        this.diagnosticsResult += `[✅ Dentistas] Status: ${res.status} | Tempo: ${time}ms | Array Size: ${res.body?.length || 0}\n`;
        if (res.body?.length === 0) {
           this.diagnosticsResult += `   -> ⚠️ O array está VAZIO. Ninguém com perfil DENTISTA foi retornado pelo banco!\n`;
        } else {
           this.diagnosticsResult += `   -> Dados da primeira posição: ${JSON.stringify(res.body?.[0])}\n`;
        }
      },
      error: (err) => {
        this.diagnosticsResult += `[❌ Dentistas] Erro HTTP: ${err.status} | StatusText: ${err.statusText} | Mensagem: ${err.message}\n`;
      }
    });

    const agendamentosUrl = this.runtime.api(`/api/agendamentos/paciente/${this.currentUserId}`);
    const startAg = Date.now();
    this.http.get<any[]>(agendamentosUrl, { observe: 'response' }).subscribe({
      next: (res) => {
        const time = Date.now() - startAg;
        this.diagnosticsResult += `[✅ Agendamentos] Status: ${res.status} | Tempo: ${time}ms | Array Size: ${res.body?.length || 0}\n`;
      },
      error: (err) => {
        this.diagnosticsResult += `[❌ Agendamentos] Erro HTTP: ${err.status} | StatusText: ${err.statusText} | Mensagem: ${err.message}\n`;
      }
    });
  }

  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.currentUserId = this.auth.getSubject() ?? '';
    this.currentUserLabel = this.auth.getEmail() ?? 'Cliente';

    if (!this.currentUserId) {
      return; 
    }
    
    // Listen to custom events from Leaflet popups
    document.addEventListener('selectDentist', (e: any) => {
      this.ngZone.run(() => {
        const id = e.detail;
        const d = this.dentists.find(x => x.id === id);
        if (d) {
          this.selectDentist(d);
        }
      });
    });

    this.isLoadingDentists = true;
    this.hasError = false;

    this.dashboardState.activeTab$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(tab => {
      this.setActiveTab(tab);
      this.cdr.detectChanges();
    });

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          this.ngZone.run(() => {
            this.userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            this.loadDentists(pos.coords.latitude, pos.coords.longitude);
          });
        },
        () => {
          this.ngZone.run(() => {
            this.loadDentists(); 
          });
        }
      );
    } else {
      this.loadDentists();
    }
  }

  setActiveTab(tab: DashboardTab): void {
    this.activeTab = tab;
    // Resize map when entering the BUSCAR tab if map already exists
    if (tab === 'BUSCAR' && this.selectedDentist) {
      setTimeout(() => {
        if (this.map) {
          this.map.invalidateSize();
        }
      }, 100);
    }
  }

  private loadDentists(lat?: number, lng?: number): void {
    this.dentistDirectory.listDentists(lat, lng).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (dentists) => {
        this.isLoadingDentists = false;
        if (dentists && dentists.length > 0) {
          this.dentists = dentists;
          this.voltarAoMapa();
        } else if (lat !== undefined && lng !== undefined) {
          // Se a busca por proximidade não retornar ninguém, busca todos os dentistas
          this.isLoadingDentists = true;
          this.loadDentists();
        } else {
          this.dentists = [];
          this.voltarAoMapa();
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Falha ao carregar especialistas:', err);
        this.isLoadingDentists = false;
        this.hasError = true;
        this.cdr.detectChanges();
      }
    });
  }

  ngOnDestroy(): void {
    this.chatSubscription?.unsubscribe();
    this.sessionStatusSub?.unsubscribe();
  }

  selectDentist(dentist: DentistSummary): void {
    if (!dentist) return; 
    this.selectedDentist = dentist;
    this.bookingStatus = `Agenda de ${dentist.nome} carregada.`;
    this.roomId = ''; 
    this.sessionStatus = null;
    this.chatService.sessionStatus$.next(null);
    this.messages = [];
    
    // Strictly after selectedDentist is confirmed
    this.loadSlots(dentist.id);
  }

  carregarChatDoAgendamento(dentistaId: string): void {
    let d = this.dentists.find(x => x.id === dentistaId);
    if (!d) {
      // Mock minimalista se não achou na lista principal
      d = {
        id: dentistaId,
        nome: 'Especialista da Consulta',
        especialidade: 'Odontologia'
      };
    }
    
    // Seta a tab ativa primeiro
    if (this.activeTab !== 'CHAT_AGENDA') {
       this.dashboardState.setActiveTab('CHAT_AGENDA');
    }

    this.selectDentist(d);
    
    // Inicia o chat automaticamente se for necessário
    setTimeout(() => {
       if (!this.roomId) {
           this.iniciarChat();
       }
    }, 300);
  }

  voltarAoMapa(): void {
    this.selectedDentist = null;
    
    setTimeout(() => {
      let lat = -23.5505; // Default SP
      let lng = -46.6333;
      if (this.userLocation) {
        lat = this.userLocation.lat;
        lng = this.userLocation.lng;
      } else if (this.dentists.length > 0 && this.dentists[0].latitude && this.dentists[0].longitude) {
        lat = this.dentists[0].latitude;
        lng = this.dentists[0].longitude;
      }
      this.initMap(lat, lng);
    }, 100);
  }

  private initMap(lat: number, lng: number): void {
    const container = document.getElementById('dentist-map');
    if (!container) return;

    if (this.map) {
      this.map.remove();
    }

    this.map = L.map('dentist-map').setView([lat, lng], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    // Add marker for user
    if (this.userLocation) {
      const userIcon = L.icon({
        ...this.defaultIcon.options,
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png'
      });
      L.marker([this.userLocation.lat, this.userLocation.lng], { icon: userIcon })
        .addTo(this.map)
        .bindPopup('Sua Localização')
        .openPopup();
    }

    // Add markers for dentists
    this.dentists.forEach(d => {
      if (d.latitude && d.longitude) {
        L.marker([d.latitude, d.longitude], { icon: this.defaultIcon })
          .addTo(this.map!)
          .bindPopup(`<b>${d.nome}</b><br>${d.especialidade}<br><button class="mt-2 px-2 py-1 bg-blue-600 text-white rounded text-xs border-none cursor-pointer" onclick="document.dispatchEvent(new CustomEvent('selectDentist', {detail: '${d.id}'}))">Agendar</button>`);
      }
    });
    
    // Resize just in case
    setTimeout(() => {
      if (this.map) {
        this.map.invalidateSize();
      }
    }, 200);
  }

  iniciarChat(): void {
    if (!this.selectedDentist) return;
    this.chatService.solicitarChat(this.currentUserId, this.selectedDentist.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(response => {
      this.roomId = response.id;
      this.sessionStatus = response.status;
      this.chatService.sessionStatus$.next(response.status);
      this.bindChat(this.selectedDentist!);
    });
  }

  devAceitarChat(): void {
    if (!this.roomId) return;
    this.chatService.aceitarChat(this.roomId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(response => {
      this.sessionStatus = response.status;
      this.chatService.sessionStatus$.next(response.status);
    });
  }

  devEnviarConvite(): void {
    if (!this.roomId || !this.selectedDentist) return;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    this.chatService.enviarConviteDev(this.roomId, this.selectedDentist.id, this.selectedDentist.nome, this.currentUserId, tomorrow.toISOString());
  }

  aceitarConvite(dataHora: string): void {
    if (!this.roomId) return;
    this.chatService.aceitarConviteAgendamento(this.roomId, dataHora).subscribe({
      next: () => {
        this.bookingStatus = `Consulta aceita para ${new Date(dataHora).toLocaleString('pt-BR')}.`;
      },
      error: (err) => {
        alert('Não foi possível agendar. O horário pode ter sido ocupado por outro cliente. Erro: ' + (err.error || err.message));
      }
    });
  }

  sendMessage(): void {
    if (!this.selectedDentist || !this.draftMessage.trim()) {
      return;
    }
    this.chatService.send(
      this.roomId,
      this.currentUserId,
      this.currentUserLabel,
      this.selectedDentist.id,
      this.draftMessage.trim()
    );
    this.draftMessage = '';
  }

  bookSlot(startIso: string): void {
    if (!this.selectedDentist) return;

    this.reservingSlotIso = startIso;

    this.agendamentoService.criar({
      clienteId: this.currentUserId,
      dentistaId: this.selectedDentist.id,
      dataHora: startIso,
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.bookingStatus = `Consulta agendada para ${new Date(startIso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}.`;
        this.reservingSlotIso = null;
        this.loadSlots(this.selectedDentist?.id ?? '');
      },
      error: () => {
        this.reservingSlotIso = null;
        this.bookingStatus = 'Não foi possível reservar esse horário. Tente outro slot.';
      },
    });
  }

  initials(name: string): string {
    if (!name) return '';
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
  }

  private loadSlots(dentistId: string): void {
    this.isLoadingSlots = true;
    this.calendarSlots = [];
    this.groupedSchedule = [];
    
    if (this.selectedDentist && this.selectedDentist.slots) {
      this.calendarSlots = this.selectedDentist.slots;
      this.groupSlotsByDay(this.calendarSlots);
    }
    this.isLoadingSlots = false;
  }

  private groupSlotsByDay(slots: ScheduleSlot[]): void {
    const map = new Map<string, DaySchedule>();
    
    slots.forEach(slot => {
      if (slot.title !== 'Disponível') return;

      const dateObj = new Date(slot.start);
      // Ensure we format localized strings safely (assuming pt-BR locale mostly for this app)
      const dateString = dateObj.toISOString().split('T')[0];

      if (!map.has(dateString)) {
        const weekdayStr = dateObj.toLocaleDateString('pt-BR', { weekday: 'short' });
        const dayAndMonth = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

        map.set(dateString, {
          dateObj,
          dateString,
          weekday: weekdayStr.charAt(0).toUpperCase() + weekdayStr.slice(1).replace('.', ''),
          dayAndMonth,
          slots: []
        });
      }

      map.get(dateString)?.slots.push(slot);
    });

    // Converter para array e ordenar por data
    this.groupedSchedule = Array.from(map.values()).sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
    
    // Sort slots within each day
    this.groupedSchedule.forEach(day => {
      day.slots.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    });
  }

  getSlotTime(isoString: string): string {
    return new Date(isoString).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  private bindChat(dentist: DentistSummary): void {
    this.chatSubscription?.unsubscribe();
    this.chatSubscription = this.chatService
      .connect(this.roomId, this.currentUserId, dentist.nome)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((messages) => {
        this.messages = messages;
        this.cdr.detectChanges();
      });

    this.sessionStatusSub?.unsubscribe();
    this.sessionStatusSub = this.chatService.sessionStatus$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(status => {
        if (status) {
          this.sessionStatus = status;
          this.cdr.detectChanges();
        }
      });
  }

  buscarCep(cep: string): void {
    const rawCep = cep.replace(/\D/g, '');
    if (rawCep.length === 8) {
      console.log('Buscando CEP...', rawCep);
      // O ViaCepService deverá ser implementado ou injetado aqui
      // fetch(`https://viacep.com.br/ws/${rawCep}/json/`)...
    }
  }
}

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
import { MeusAgendamentosComponent } from './meus-agendamentos.component';

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

  constructor(
    private auth: AuthService,
    private agendamentoService: AgendamentoService,
    private dentistDirectory: DentistDirectoryService,
    private chatService: ChatService
  ) {}

  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.currentUserId = this.auth.getSubject() ?? '';
    this.currentUserLabel = this.auth.getEmail() ?? 'Cliente';

    if (!this.currentUserId) {
      return; 
    }

    this.isLoadingDentists = true;
    this.hasError = false;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          this.userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          this.loadDentists(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          this.loadDentists(); 
        }
      );
    } else {
      this.loadDentists();
    }
  }

  private loadDentists(lat?: number, lng?: number): void {
    this.dentistDirectory.listDentists(lat, lng).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (dentists) => {
        this.isLoadingDentists = false;
        if (dentists && dentists.length > 0) {
          this.dentists = dentists;
          // Garante que a chamada loadSlots() ocorra APÓS a confirmação de que selectedDentist existe
          this.selectDentist(dentists[0]);
        } else if (lat !== undefined && lng !== undefined) {
          // Se a busca por proximidade não retornar ninguém, busca todos os dentistas
          this.isLoadingDentists = true;
          this.loadDentists();
        } else {
          this.dentists = [];
        }
      },
      error: (err) => {
        console.error('Falha ao carregar especialistas:', err);
        this.isLoadingDentists = false;
        this.hasError = true;
      }
    });
  }

  ngOnDestroy(): void {
    this.chatSubscription?.unsubscribe();
    this.sessionStatusSub?.unsubscribe();
  }

  selectDentist(dentist: DentistSummary): void {
    if (!dentist) return; // Proteção extra contra null/undefined
    this.selectedDentist = dentist;
    this.bookingStatus = `Agenda de ${dentist.nome} carregada.`;
    this.roomId = ''; 
    this.sessionStatus = null;
    this.chatService.sessionStatus$.next(null);
    this.messages = [];
    
    // Strictly after selectedDentist is confirmed
    this.loadSlots(dentist.id);

    // Init map
    if (dentist.latitude && dentist.longitude) {
      setTimeout(() => this.initMap(dentist.latitude!, dentist.longitude!), 100);
    }
  }

  private initMap(lat: number, lng: number): void {
    const container = document.getElementById('dentist-map');
    if (!container) return;

    if (this.map) {
      this.map.remove();
    }

    this.map = L.map('dentist-map').setView([lat, lng], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    this.marker = L.marker([lat, lng], { icon: this.defaultIcon }).addTo(this.map);
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
    this.dentistDirectory.getSlots(dentistId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (slots) => {
        this.isLoadingSlots = false;
        // Previne explicitamente passar undefined, garantindo [] como fallback
        this.calendarSlots = slots || [];
        this.groupSlotsByDay(this.calendarSlots);
      },
      error: (err) => {
        console.error('Falha ao carregar agenda do dentista:', err);
        this.isLoadingSlots = false;
        this.hasError = true;
        this.calendarSlots = [];
      }
    });
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
      .subscribe((messages) => (this.messages = messages));

    this.sessionStatusSub?.unsubscribe();
    this.sessionStatusSub = this.chatService.sessionStatus$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(status => {
        if (status) {
          this.sessionStatus = status;
        }
      });
  }
}

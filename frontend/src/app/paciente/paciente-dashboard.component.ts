import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, DestroyRef, signal, effect, ChangeDetectorRef, NgZone } from '@angular/core';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import * as L from 'leaflet';
import 'leaflet.heat';
import { AuthService } from '../auth/auth.service';
import { AgendamentoService } from '../services/agendamento';
import { ChatMessageView, ChatService, SessaoChatStatus } from '../services/chat.service';
import { DentistDirectoryService, DentistSummary, ScheduleSlot } from '../services/dentist-directory.service';
import { RuntimeConfigService } from '../services/runtime-config.service';
import { MeusAgendamentosComponent } from './meus-agendamentos.component';
import { SkeletonCardComponent } from '../shared/components/skeleton-card.component';
import { DashboardStateService, DashboardTab } from '../services/dashboard-state.service';

export interface DaySchedule {
  dateObj: Date;
  dateString: string;
  weekday: string;
  dayAndMonth: string;
  slots: ScheduleSlot[];
}

@Component({
  selector: 'app-paciente-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule, FormsModule, MeusAgendamentosComponent, SkeletonCardComponent],
  templateUrl: './paciente-dashboard.component.html',
  styleUrl: './paciente-dashboard.component.scss',
})
export class PacienteDashboardComponent implements OnInit, OnDestroy {
  activeTab: DashboardTab = 'BUSCAR';
  
  dentists: DentistSummary[] = [];
  selectedDentist: DentistSummary | null = null;
  
  calendarSlots: ScheduleSlot[] = [];
  groupedSchedule: DaySchedule[] = [];
  
  isLoadingDentists = false;
  isLoadingSlots = false;
  hasError = false; 
  
  messages: ChatMessageView[] = [];
  draftMessage = '';
  bookingStatus = 'Escolha um especialista para começar.';
  roomId = '';
  currentUserId = '';
  currentUserLabel = 'Cliente';
  sessionStatus: SessaoChatStatus | null = null;
  SessaoChatStatus = SessaoChatStatus; 
  userLocation: {lat: number, lng: number} | undefined;
  
  // Location UX
  locationState: 'PENDING' | 'GRANTED' | 'DENIED' | 'PROMPTING' = 'PROMPTING';

  // Filters
  filters = {
    nome: '',
    especialidade: '',
    distanciaMax: 30
  };
  sortOption: 'nearest' | 'availability' | 'name' = 'nearest';
  
  private map: L.Map | undefined;
  private heatLayer: any;
  
  hoveredDentistaId = signal<string | null>(null);
  private markerMap = new Map<string, L.Marker>();
  
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

  reservingSlotIso: string | null = null;

  constructor(
    private auth: AuthService,
    private agendamentoService: AgendamentoService,
    private dentistDirectory: DentistDirectoryService,
    private chatService: ChatService,
    private http: HttpClient,
    private runtime: RuntimeConfigService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private dashboardState: DashboardStateService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.setupMarkerEffects();
  }

  private destroyRef = inject(DestroyRef);

  private setupMarkerEffects() {
    effect(() => {
      const activeId = this.hoveredDentistaId();
      this.markerMap.forEach((marker, id) => {
        if (id === activeId) {
          const activeIcon = L.divIcon({
            className: 'custom-active-marker',
            html: `<div class="w-8 h-8 bg-blue-600 rounded-full border-2 border-white shadow-lg shadow-blue-500/50 flex items-center justify-center animate-bounce">
                     <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" /></svg>
                   </div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 32]
          });
          marker.setIcon(activeIcon);
          marker.setZIndexOffset(1000);
        } else {
          marker.setIcon(this.defaultIcon);
          marker.setZIndexOffset(0);
        }
      });
    });
  }

  ngOnInit(): void {
    this.currentUserId = this.auth.getSubject() ?? '';
    this.currentUserLabel = this.auth.getEmail() ?? 'Cliente';

    if (!this.currentUserId) return; 

    this.dashboardState.activeTab$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(tab => {
      this.setActiveTab(tab);
      this.cdr.detectChanges();
    });

    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const tab = params['tab']?.toUpperCase();
      if (tab === 'BUSCAR' || tab === 'CHAT_AGENDA' || tab === 'PERFIL') {
        if (this.activeTab !== tab) {
          this.dashboardState.setActiveTab(tab as DashboardTab);
        }
      } else {
        this.router.navigate([], { relativeTo: this.route, queryParams: { tab: 'buscar' }, queryParamsHandling: 'merge' });
      }
    });
  }

  requestLocation() {
    this.locationState = 'PENDING';
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          this.ngZone.run(() => {
            this.userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            this.locationState = 'GRANTED';
            this.loadDentists(pos.coords.latitude, pos.coords.longitude);
          });
        },
        () => {
          this.ngZone.run(() => {
            this.locationState = 'DENIED';
            this.loadDentists(); 
          });
        }
      );
    } else {
      this.locationState = 'DENIED';
      this.loadDentists();
    }
  }

  get filteredDentists(): DentistSummary[] {
    let result = this.dentists.filter(d => {
      if (this.filters.nome && !d.nome.toLowerCase().includes(this.filters.nome.toLowerCase())) return false;
      if (this.filters.especialidade && d.especialidade.toLowerCase() !== this.filters.especialidade.toLowerCase() && this.filters.especialidade !== 'Todas') return false;
      if (this.filters.distanciaMax < 30 && d.distanciaKm && d.distanciaKm > this.filters.distanciaMax) return false;
      return true;
    });

    result.sort((a, b) => {
      if (this.sortOption === 'nearest') {
        return (a.distanciaKm || 999) - (b.distanciaKm || 999);
      } else if (this.sortOption === 'name') {
        return a.nome.localeCompare(b.nome);
      }
      return 0;
    });
    return result;
  }

  applyFilters() {
    this.updateMapMarkers();
  }

  get especialidadesUnicas(): string[] {
    const specs = this.dentists.map(d => d.especialidade).filter(Boolean);
    return ['Todas', ...Array.from(new Set(specs))];
  }

  setActiveTab(tab: DashboardTab): void {
    this.activeTab = tab;
    if (tab === 'BUSCAR' && !this.selectedDentist) {
      setTimeout(() => {
        if (this.map) this.map.invalidateSize();
      }, 100);
    }
  }

  onCardMouseEnter(id: string): void {
    this.hoveredDentistaId.set(id);
  }

  onCardMouseLeave(): void {
    this.hoveredDentistaId.set(null);
  }

  loadDentists(lat?: number, lng?: number): void {
    this.isLoadingDentists = true;
    this.hasError = false;
    this.dentistDirectory.listDentists(lat, lng).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (dentists) => {
        this.isLoadingDentists = false;
        if (dentists && dentists.length > 0) {
          this.dentists = dentists;
        } else if (lat !== undefined && lng !== undefined) {
          this.isLoadingDentists = true;
          this.loadDentists(); // Fallback to global
          return;
        } else {
          this.dentists = [];
        }
        this.voltarAoMapa();
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
    if (this.map) {
      this.map.remove();
    }
  }

  selectDentist(dentist: DentistSummary): void {
    if (!dentist) return; 
    this.selectedDentist = dentist;
    this.bookingStatus = \`Agenda de \${dentist.nome} carregada.\`;
    this.roomId = ''; 
    this.sessionStatus = null;
    this.chatService.sessionStatus$.next(null);
    this.messages = [];
    
    this.loadSlots(dentist.id);
  }

  carregarChatDoAgendamento(dentistaId: string): void {
    let d = this.dentists.find(x => x.id === dentistaId);
    if (!d) {
      d = { id: dentistaId, nome: 'Especialista da Consulta', especialidade: 'Odontologia' } as DentistSummary;
    }
    
    if (this.activeTab !== 'CHAT_AGENDA') {
       this.dashboardState.setActiveTab('CHAT_AGENDA');
    }

    this.selectDentist(d!);
    
    setTimeout(() => {
       if (!this.roomId) {
           this.iniciarChat(d!);
       }
    }, 300);
  }

  voltarAoMapa(): void {
    this.selectedDentist = null;
    
    setTimeout(() => {
      let lat = -23.5505;
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

    this.updateMapMarkers();
  }

  private updateMapMarkers(): void {
    if (!this.map) return;
    
    // Clear existing
    this.markerMap.forEach(m => m.remove());
    this.markerMap.clear();
    if (this.heatLayer) {
      this.map.removeLayer(this.heatLayer);
    }

    const heatData: any[] = [];
    const bounds = L.latLngBounds([]);

    this.filteredDentists.forEach(d => {
      if (d.latitude && d.longitude) {
        const marker = L.marker([d.latitude, d.longitude], { icon: this.defaultIcon })
          .addTo(this.map!)
          .on('click', () => {
             this.ngZone.run(() => this.selectDentist(d));
          });
        
        // Custom popup not needed since click opens the detail panel directly now
        marker.bindTooltip(\`<b>\${d.nome}</b><br>\${d.especialidade}\`);
        this.markerMap.set(d.id, marker);
        heatData.push([d.latitude, d.longitude, 1]); // intensity 1
        bounds.extend([d.latitude, d.longitude]);
      }
    });

    if (this.userLocation) {
      bounds.extend([this.userLocation.lat, this.userLocation.lng]);
    }

    if (heatData.length > 0) {
      this.heatLayer = (L as any).heatLayer(heatData, {radius: 40, blur: 25, maxZoom: 14}).addTo(this.map);
    }

    if (bounds.isValid() && this.map) {
      this.map.fitBounds(bounds, { padding: [50, 50] });
    }
  }

  iniciarChat(dentist: DentistSummary): void {
    this.chatService.solicitarChat(this.currentUserId, dentist.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(response => {
      this.roomId = response.id;
      this.sessionStatus = response.status;
      this.chatService.sessionStatus$.next(response.status);
      this.bindChat(dentist);
      
      // Auto-navigate to CHAT_AGENDA if not already there
      if (this.activeTab !== 'CHAT_AGENDA') {
         this.dashboardState.setActiveTab('CHAT_AGENDA');
      }
    });
  }

  aceitarConvite(dataHora: string): void {
    if (!this.roomId) return;
    this.chatService.aceitarConviteAgendamento(this.roomId, dataHora).subscribe({
      next: () => {
        this.bookingStatus = \`Consulta aceita para \${new Date(dataHora).toLocaleString('pt-BR')}.\`;
      },
      error: (err) => {
        alert('Não foi possível agendar. O horário pode ter sido ocupado por outro cliente. Erro: ' + (err.error || err.message));
      }
    });
  }

  sendMessage(): void {
    if (!this.selectedDentist || !this.draftMessage.trim()) return;
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
        this.bookingStatus = \`Consulta agendada para \${new Date(startIso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}.\`;
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
    return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');
  }

  private loadSlots(dentistId: string): void {
    this.isLoadingSlots = true;
    this.calendarSlots = [];
    this.groupedSchedule = [];
    
    // We could fetch them again if they are missing, but public API usually loads them?
    // According to public API logic, slots are pre-loaded in DentistSummary
    if (this.selectedDentist && this.selectedDentist.slots) {
      this.calendarSlots = this.selectedDentist.slots;
      this.groupSlotsByDay(this.calendarSlots);
    } else {
      // If not, we can call dentistDirectory.getSlots (not implemented in the controller though, but let's see)
      this.dentistDirectory.getSlots(dentistId).subscribe(slots => {
         this.calendarSlots = slots;
         this.groupSlotsByDay(this.calendarSlots);
      });
    }
    this.isLoadingSlots = false;
  }

  private groupSlotsByDay(slots: ScheduleSlot[]): void {
    const map = new Map<string, DaySchedule>();
    slots.forEach(slot => {
      // Assuming 'title' logic from old code
      const dateObj = new Date(slot.start);
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

    this.groupedSchedule = Array.from(map.values()).sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
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
    }
  }
}

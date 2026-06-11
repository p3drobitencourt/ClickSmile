import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { CalendarOptions, EventClickArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import { FullCalendarModule } from '@fullcalendar/angular';
import { Subscription } from 'rxjs';
import { GoogleMapsModule } from '@angular/google-maps';
import { AuthService } from '../auth/auth.service';
import { AgendamentoService } from '../services/agendamento';
import { ChatMessageView, ChatService, SessaoChatStatus } from '../services/chat.service';
import { DentistDirectoryService, DentistSummary, ScheduleSlot } from '../services/dentist-directory.service';
import { MeusAgendamentosComponent } from './meus-agendamentos.component';

@Component({
  selector: 'app-cliente-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, FullCalendarModule, MeusAgendamentosComponent, GoogleMapsModule],
  templateUrl: './cliente-dashboard.component.html',
  styleUrl: './cliente-dashboard.component.scss',
})
export class ClienteDashboardComponent implements OnInit, OnDestroy {
  dentists: DentistSummary[] = [];
  selectedDentist: DentistSummary | null = null;
  calendarSlots: ScheduleSlot[] = [];
  messages: ChatMessageView[] = [];
  draftMessage = '';
  bookingStatus = 'Escolha um especialista para começar.';
  roomId = '';
  currentUserId = '';
  currentUserLabel = 'Cliente';
  sessionStatus: SessaoChatStatus | null = null;
  SessaoChatStatus = SessaoChatStatus; // Expose to template
  userLocation: google.maps.LatLngLiteral | undefined;
  mapOptions: google.maps.MapOptions = {
    zoom: 12,
    mapId: 'DEMO_MAP_ID',
  };
  private chatSubscription?: Subscription;
  private sessionStatusSub?: Subscription;

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'timeGridWeek',
    height: 'auto',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'timeGridWeek,dayGridMonth',
    },
    slotMinTime: '07:00:00',
    slotMaxTime: '20:00:00',
    nowIndicator: true,
    editable: false,
    selectable: false,
    events: [],
    eventClick: (arg) => this.handleSlotClick(arg),
  };

  constructor(
    private auth: AuthService,
    private agendamentoService: AgendamentoService,
    private dentistDirectory: DentistDirectoryService,
    private chatService: ChatService
  ) {}

  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.currentUserId = this.auth.getSubject() ?? crypto.randomUUID();
    this.currentUserLabel = this.auth.getEmail() ?? 'Cliente';

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          this.userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          this.loadDentists(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          this.loadDentists(); // Fallback without location
        }
      );
    } else {
      this.loadDentists();
    }
  }

  private loadDentists(lat?: number, lng?: number): void {
    this.dentistDirectory.listDentists(lat, lng).pipe(takeUntilDestroyed(this.destroyRef)).subscribe((dentists) => {
      this.dentists = dentists;
      if (dentists.length > 0) {
        this.selectDentist(dentists[0]);
      }
    });
  }

  ngOnDestroy(): void {
    this.chatSubscription?.unsubscribe();
    this.sessionStatusSub?.unsubscribe();
  }

  selectDentist(dentist: DentistSummary): void {
    this.selectedDentist = dentist;
    this.bookingStatus = `Agenda de ${dentist.nome} carregada.`;
    // We will establish the roomId after starting the chat
    this.roomId = ''; 
    this.sessionStatus = null;
    this.chatService.sessionStatus$.next(null);
    this.messages = [];
    
    this.loadSlots(dentist.id);
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

  // Developer Tool: Simulate dentist accept
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
    if (!this.selectedDentist) {
      return;
    }

    // Optimistic UI Update
    const originalEvents = this.calendarOptions.events;
    const optimisticEvents = (Array.isArray(originalEvents) ? originalEvents : []).map((evt: any) => {
      if (evt.start === startIso) {
        return { ...evt, title: 'Reservando...', backgroundColor: '#f59e0b', borderColor: '#f59e0b' };
      }
      return evt;
    });
    this.calendarOptions = { ...this.calendarOptions, events: optimisticEvents };

    this.agendamentoService.criar({
      clienteId: this.currentUserId,
      dentistaId: this.selectedDentist.id,
      dataHora: startIso,
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.bookingStatus = `Consulta agendada para ${new Date(startIso).toLocaleString('pt-BR')}.`;
        this.loadSlots(this.selectedDentist?.id ?? '');
      },
      error: () => {
        // Revert Optimistic UI
        this.calendarOptions = { ...this.calendarOptions, events: originalEvents };
        this.bookingStatus = 'Não foi possível reservar esse horário. Tente outro slot.';
      },
    });
  }

  initials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
  }

  private handleSlotClick(arg: EventClickArg): void {
    const start = arg.event.start?.toISOString();
    if (!start || arg.event.title !== 'Disponível') {
      return;
    }

    this.bookSlot(start);
  }

  private loadSlots(dentistId: string): void {
    this.dentistDirectory.getSlots(dentistId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe((slots) => {
      this.calendarSlots = slots;
      this.calendarOptions = {
        ...this.calendarOptions,
        events: slots.map((slot) => ({
          title: slot.title,
          start: slot.start,
          end: slot.end,
          display: 'block',
          backgroundColor: slot.tone === 'success' ? '#10b981' : slot.tone === 'warning' ? '#f59e0b' : '#38bdf8',
          borderColor: slot.tone === 'success' ? '#10b981' : slot.tone === 'warning' ? '#f59e0b' : '#38bdf8',
          textColor: '#ffffff',
        })),
      };
    });
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

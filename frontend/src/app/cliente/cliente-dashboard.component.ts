import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { GoogleMapsModule } from '@angular/google-maps';
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
  imports: [CommonModule, FormsModule, MeusAgendamentosComponent, GoogleMapsModule],
  templateUrl: './cliente-dashboard.component.html',
  styleUrl: './cliente-dashboard.component.scss',
})
export class ClienteDashboardComponent implements OnInit, OnDestroy {
  dentists: DentistSummary[] = [];
  selectedDentist: DentistSummary | null = null;
  
  // Substitui calendarSlots puros
  calendarSlots: ScheduleSlot[] = [];
  groupedSchedule: DaySchedule[] = [];
  
  messages: ChatMessageView[] = [];
  draftMessage = '';
  bookingStatus = 'Escolha um especialista para começar.';
  roomId = '';
  currentUserId = '';
  currentUserLabel = 'Cliente';
  sessionStatus: SessaoChatStatus | null = null;
  SessaoChatStatus = SessaoChatStatus; 
  userLocation: google.maps.LatLngLiteral | undefined;
  mapOptions: google.maps.MapOptions = {
    zoom: 12,
    mapId: 'DEMO_MAP_ID',
  };
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
    this.dentistDirectory.listDentists(lat, lng).pipe(takeUntilDestroyed(this.destroyRef)).subscribe((dentists) => {
      if (dentists.length > 0) {
        this.dentists = dentists;
        this.selectDentist(dentists[0]);
      } else if (lat !== undefined && lng !== undefined) {
        // Se a busca por proximidade não retornar ninguém, busca todos os dentistas
        this.loadDentists();
      } else {
        this.dentists = [];
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
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
  }

  private loadSlots(dentistId: string): void {
    this.dentistDirectory.getSlots(dentistId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe((slots) => {
      this.calendarSlots = slots;
      this.groupSlotsByDay(slots);
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

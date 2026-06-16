import { NgFor, NgIf } from '@angular/common';
import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { CalendarOptions, DateSelectArg, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import { FullCalendarModule } from '@fullcalendar/angular';
import { AgendamentoService } from '../services/agendamento';
import {
  AgendamentoResumo,
  AgendaPacienteOption,
  AgendaProfissionalOption,
} from '../services/agendamento.models';
import { AuthService } from '../auth/auth.service';
import { Router } from '@angular/router';
import { ChatService } from '../services/chat.service';

type MetricTone = 'primary' | 'success' | 'teal';

interface MetricCard {
  label: string;
  value: string | number;
  delta: string;
  tone: MetricTone;
}

interface ChatItem {
  name: string;
  preview: string;
  time: string;
  badge: string;
  unread: boolean;
}

interface BookingDraft {
  patientId: string;
  dentistId: string;
  date: string;
  time: string;
  notes: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [FullCalendarModule, FormsModule, NgFor, NgIf],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardComponent implements OnInit {
  readonly sidebarCollapsed = signal(false);
  readonly chatOpen = signal(true);
  readonly bookingOpen = signal(true);
  readonly selectedDentist = signal('');
  readonly selectedRangeLabel = signal('Segunda a sexta, 08:00 - 18:00');
  readonly events = signal<EventInput[]>([]);
  readonly metrics = signal<MetricCard[]>([]);
  readonly activeChats = signal<ChatItem[]>([]);
  readonly dentists = signal<AgendaProfissionalOption[]>([]);
  readonly patients = signal<AgendaPacienteOption[]>([]);
  readonly booking = signal<BookingDraft>({
    patientId: '',
    dentistId: '',
    date: '',
    time: '',
    notes: '',
  });
  readonly saveState = signal<'idle' | 'saving' | 'saved' | 'error'>('idle');
  readonly saveMessage = signal('');

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'timeGridWeek',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'timeGridWeek,timeGridDay',
    },
    editable: false,
    selectable: true,
    height: 'auto',
    slotMinTime: '07:00:00',
    slotMaxTime: '20:00:00',
    allDaySlot: false,
    nowIndicator: true,
    selectMirror: true,
    eventDisplay: 'block',
    select: this.handleDateSelect.bind(this),
    events: this.events(),
  };

  private destroyRef = inject(DestroyRef);
  private auth = inject(AuthService);
  private router = inject(Router);
  private chat = inject(ChatService);

  constructor(private agendamentoService: AgendamentoService) {}

  ngOnInit() {
    const userId = this.auth.getSubject();
    if (!userId) {
      this.router.navigate(['/login']);
      return;
    }
    
    // Assumindo que este ID é validado, buscamos os agendamentos dele.
    // Como os IDs agora são strings UUID, vamos tratar.
    this.carregarAgendamentosEPopulate(userId);
  }

  carregarAgendamentosEPopulate(dentistaId: string) {
    this.agendamentoService.listarPorDentista(dentistaId).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (res) => {
        // Render events
        const events = res.map((agendamento) => this.toCalendarEvent(agendamento));
        this.events.set(events);
        this.syncCalendarEvents();

        // Extract Patients
        const uniquePatients = new Map<number, AgendaPacienteOption>();
        res.forEach(agendamento => {
          if (agendamento.cliente && !uniquePatients.has(agendamento.cliente.id!)) {
             uniquePatients.set(agendamento.cliente.id!, { 
               id: agendamento.cliente.id!, 
               nome: agendamento.cliente.nome || 'Paciente Sem Nome'
             });
          }
        });
        this.patients.set(Array.from(uniquePatients.values()));

        // Computar metricas básicas (ex: consultas de hoje)
        const todayStr = new Date().toISOString().split('T')[0];
        const consultasHoje = res.filter(a => a.dataHora?.startsWith(todayStr)).length;
        
        this.metrics.set([
          { label: 'Consultas hoje', value: consultasHoje, delta: '-', tone: 'primary' },
          { label: 'Total de Pacientes', value: uniquePatients.size, delta: '-', tone: 'success' },
          { label: 'Total Agendamentos', value: res.length, delta: '-', tone: 'teal' },
        ]);

        // Assinar WebSocket de chats do dentista para mockar chat real
        this.chat.escutarSolicitacoes(dentistaId);
        this.chat.solicitacoes$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(solicitacoes => {
           this.activeChats.set(solicitacoes.map((s, idx) => ({
             name: `Cliente #${s.clienteId.substring(0, 5)}`,
             preview: `Status: ${s.status}`,
             time: 'Agora',
             badge: '1',
             unread: true
           })));
        });
      },
      error: (err) => {
        console.error('Erro na comunicacao com o backend Java:', err);
        this.events.set([]);
        this.syncCalendarEvents();
      },
    });
  }

  toggleSidebar() {
    this.sidebarCollapsed.update((value) => !value);
  }

  toggleChat() {
    this.chatOpen.update((value) => !value);
  }

  toggleBooking() {
    this.bookingOpen.update((value) => !value);
  }

  trackByIndex(index: number) {
    return index;
  }

  handleDateSelect(selectInfo: DateSelectArg) {
    const start = new Date(selectInfo.start);
    this.booking.update((current) => ({
      ...current,
      date: this.formatDate(start),
      time: this.formatTime(start),
    }));
    this.bookingOpen.set(true);
  }

  setDentist(dentistId: string) {
    const dentist = this.dentists().find((item) => String(item.id) === dentistId);
    this.booking.update((current) => ({ ...current, dentistId }));
    if (dentist) {
      this.selectedDentist.set(dentist.nome);
    }
  }

  setBookingDate(value: string) {
    this.booking.update((current) => ({ ...current, date: value }));
  }

  setBookingTime(value: string) {
    this.booking.update((current) => ({ ...current, time: value }));
  }

  setPatient(patientId: string) {
    this.booking.update((current) => ({ ...current, patientId }));
  }

  setNotes(notes: string) {
    this.booking.update((current) => ({ ...current, notes }));
  }

  criarAgendamento() {
    const draft = this.booking();

    if (!draft.patientId || !draft.dentistId || !draft.date || !draft.time) {
      this.saveState.set('error');
      this.saveMessage.set('Preencha paciente, dentista, data e hora para salvar.');
      return;
    }

    this.saveState.set('saving');
    this.saveMessage.set('');

    const dateTime = `${draft.date}T${draft.time}`;

    this.agendamentoService
      .criar({
        clienteId: Number(draft.patientId),
        dentistaId: Number(draft.dentistId),
        dataHora: new Date(dateTime).toISOString(),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saveState.set('saved');
          this.saveMessage.set('Agendamento criado com sucesso.');
          this.booking.update((current) => ({ ...current, notes: '' }));
          const userId = this.auth.getSubject();
          if (userId) this.carregarAgendamentosEPopulate(userId);
        },
        error: () => {
          this.saveState.set('error');
          this.saveMessage.set('Nao foi possivel salvar agora. Tente novamente.');
        },
      });
  }

  private syncCalendarEvents() {
    this.calendarOptions = {
      ...this.calendarOptions,
      events: this.events(),
    };
  }

  private toCalendarEvent(agendamento: AgendamentoResumo): EventInput {
    return {
      title: this.formatarTitulo(agendamento),
      start: agendamento.dataHora,
      backgroundColor: this.pickEventTone(agendamento.status),
      borderColor: this.pickEventTone(agendamento.status),
    };
  }

  private formatarTitulo(agendamento: AgendamentoResumo): string {
    const cliente = agendamento?.cliente;

    if (cliente?.nome) {
      return `Cliente: ${cliente.nome}`;
    }

    if (cliente?.id) {
      return `Cliente: ${cliente.id}`;
    }

    return 'Agendamento';
  }

  private pickEventTone(status?: string): string {
    if (status === 'CONFIRMADO') {
      return '#14b8a6';
    }

    if (status === 'CANCELADO') {
      return '#f43f5e';
    }

    return '#8b5cf6';
  }

  private formatDate(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private formatTime(date: Date): string {
    return date.toTimeString().slice(0, 5);
  }
}
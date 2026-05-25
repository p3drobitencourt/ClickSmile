import { NgFor, NgIf } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DateSelectArg, EventInput } from '@fullcalendar/core';
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
  readonly selectedDentist = signal('Dra. Marina Santos');
  readonly selectedRangeLabel = signal('Segunda a sexta, 08:00 - 18:00');
  readonly events = signal<EventInput[]>(this.criarEventosDemo());
  readonly metrics = signal<MetricCard[]>([
    { label: 'Consultas hoje', value: 18, delta: '+12%', tone: 'primary' },
    { label: 'Pacientes novos', value: 7, delta: '+3', tone: 'success' },
    { label: 'Faturamento', value: 'R$ 24,8k', delta: '+18%', tone: 'teal' },
  ]);
  readonly activeChats = signal<ChatItem[]>([
    {
      name: 'Ana Pereira',
      preview: 'Posso remarcar a limpeza para quinta?',
      time: '2 min',
      badge: '2',
      unread: true,
    },
    {
      name: 'Lucas Mendes',
      preview: 'Confirmei a consulta de hoje às 14h.',
      time: '11 min',
      badge: '',
      unread: false,
    },
  ]);
  readonly dentists = signal<AgendaProfissionalOption[]>([
    { id: 1, nome: 'Dra. Marina Santos' },
    { id: 2, nome: 'Dr. Felipe Rocha' },
    { id: 3, nome: 'Dra. Camila Nunes' },
  ]);
  readonly patients = signal<AgendaPacienteOption[]>([
    { id: 2, nome: 'Ana Pereira' },
    { id: 7, nome: 'Lucas Mendes' },
    { id: 11, nome: 'Juliana Costa' },
  ]);
  readonly booking = signal<BookingDraft>({
    patientId: '',
    dentistId: '1',
    date: '',
    time: '',
    notes: '',
  });
  readonly saveState = signal<'idle' | 'saving' | 'saved' | 'error'>('idle');
  readonly saveMessage = signal('');

  calendarOptions: any = {
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

  constructor(private agendamentoService: AgendamentoService) {}

  ngOnInit() {
    this.carregarAgendamentos(1);
  }

  carregarAgendamentos(dentistaId: number) {
    this.agendamentoService.listarPorDentista(dentistaId).subscribe({
      next: (res) => {
        const events = res.map((agendamento) => this.toCalendarEvent(agendamento));
        this.events.set(events.length > 0 ? events : this.criarEventosDemo());
        this.syncCalendarEvents();
      },
      error: (err) => {
        console.error('Erro na comunicacao com o backend Java:', err);
        this.events.set(this.criarEventosDemo());
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
      .subscribe({
        next: () => {
          this.saveState.set('saved');
          this.saveMessage.set('Agendamento criado com sucesso.');
          this.booking.update((current) => ({ ...current, notes: '' }));
          this.carregarAgendamentos(Number(draft.dentistId));
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

  private criarEventosDemo(): EventInput[] {
    const hoje = new Date();
    const amanha = new Date(hoje);
    amanha.setDate(hoje.getDate() + 1);

    const depoisDeAmanha = new Date(hoje);
    depoisDeAmanha.setDate(hoje.getDate() + 2);

    const criarHorario = (data: Date, horas: number, minutos: number) => {
      const instante = new Date(data);
      instante.setHours(horas, minutos, 0, 0);
      return instante.toISOString();
    };

    return [
      {
        title: 'Consulta inicial - Ana Pereira',
        start: criarHorario(amanha, 9, 0),
        backgroundColor: '#8b5cf6',
        borderColor: '#8b5cf6',
      },
      {
        title: 'Retorno - Bruno Lima',
        start: criarHorario(amanha, 11, 30),
        backgroundColor: '#14b8a6',
        borderColor: '#14b8a6',
      },
      {
        title: 'Limpeza - Juliana Costa',
        start: criarHorario(depoisDeAmanha, 14, 0),
        backgroundColor: '#0ea5e9',
        borderColor: '#0ea5e9',
      },
    ];
  }
}
import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AgendaAdminService, AgendaFormPayload, AgendaRule } from '../services/agenda-admin.service';
import { RuntimeConfigService } from '../services/runtime-config.service';
import { AuthService } from '../auth/auth.service';
import { ChatService } from '../services/chat.service';

import { CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import { FullCalendarModule } from '@fullcalendar/angular';

import { DentistaAgendaComponent } from './components/dentista-agenda.component';
import { DentistaMetricsComponent } from './components/dentista-metrics.component';
import { DentistaChatRequestsComponent } from './components/dentista-chat-requests.component';

@Component({
  selector: 'app-dentista-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    FullCalendarModule,
    DentistaAgendaComponent, 
    DentistaMetricsComponent, 
    DentistaChatRequestsComponent
  ],
  templateUrl: './dentista-dashboard.component.html',
  styleUrl: '../cliente/cliente-dashboard.component.scss', // Reuse the grid container styles
})
export class DentistaDashboardComponent implements OnInit {
  loading = true;
  saving = false;
  dentistaId = '';
  payload: AgendaFormPayload = {
    dentistaId: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo',
    slotDurationMin: 30,
    horaInicioPadrao: '08:00',
    horaFimPadrao: '18:00',
    regras: [],
  };

  weekdays = ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY'];

  mockRequests: any[] = [];

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin],
    initialView: 'timeGridWeek',
    height: 'auto',
    headerToolbar: { left: 'prev,next today', center: 'title', right: 'timeGridWeek' },
    slotMinTime: '07:00:00',
    slotMaxTime: '20:00:00',
    nowIndicator: true,
    editable: false,
    selectable: false,
    events: [],
  };

  constructor(
    private service: AgendaAdminService, 
    private runtime: RuntimeConfigService,
    private auth: AuthService,
    private chat: ChatService
  ) {}

  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.dentistaId = this.auth.getSubject() ?? '';

    if (this.dentistaId) {
      this.chat.escutarAgendamentos(this.dentistaId);
      this.chat.agendamentos$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(agendamentos => {
        const novosEventos = agendamentos.map(a => ({
          title: `Consulta: ${a.clienteNome || 'Agendada'}`,
          start: a.inicioAt,
          end: a.fimAt,
          backgroundColor: '#3b82f6',
          borderColor: '#2563eb',
          textColor: '#ffffff'
        }));
        
        // Push diretamente no array de eventos
        this.calendarOptions = {
          ...this.calendarOptions,
          events: [...(this.calendarOptions.events as any[]), ...novosEventos]
        };
      });

      this.load();
    } else {
      this.loading = false;
    }
  }

  load() {
    this.loading = true;
    this.service.getByDentist(this.dentistaId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (a) => {
        if (a) {
          this.payload = {
            dentistaId: a.dentistaId || this.dentistaId,
            timezone: a.timezone || this.payload.timezone,
            slotDurationMin: a.slotDurationMin || 30,
            horaInicioPadrao: a.horaInicioPadrao || '08:00',
            horaFimPadrao: a.horaFimPadrao || '18:00',
            regras: a.regras || [],
          };
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  saveAgenda(updatedPayload: AgendaFormPayload) {
    this.saving = true;
    this.payload = updatedPayload;
    this.payload.dentistaId = this.dentistaId;
    this.service.save(this.payload).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => { this.saving = false; },
      error: () => { this.saving = false; }
    });
  }

  acceptChat(roomId: string) {
    console.log('Accepted chat:', roomId);
  }
}

import { Component, OnInit, inject, DestroyRef, ViewEncapsulation } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AgendaAdminService, AgendaFormPayload, AgendaRule } from '../services/agenda-admin.service';
import { RuntimeConfigService } from '../services/runtime-config.service';
import { AuthService } from '../auth/auth.service';
import { ChatService } from '../services/chat.service';

import { CalendarOptions, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { FullCalendarModule } from '@fullcalendar/angular';

import { DentistaAgendaComponent } from './components/dentista-agenda.component';
import { DentistaMetricsComponent } from './components/dentista-metrics.component';
import { DentistaChatRequestsComponent } from './components/dentista-chat-requests.component';
import { AgendamentoService } from '../services/agendamento';
import { ToastService } from '../shared/toast.service';

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
  styleUrl: './dentista-dashboard.component.scss',
  encapsulation: ViewEncapsulation.None
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



  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'timeGridWeek',
    height: '800px',
    expandRows: true,
    headerToolbar: { left: 'prev,next today', center: 'title', right: 'timeGridWeek' },
    slotMinTime: '07:00:00',
    slotMaxTime: '20:00:00',
    slotDuration: '00:15:00',
    slotLabelInterval: '01:00',
    nowIndicator: true,
    editable: true,
    droppable: true,
    eventDurationEditable: false,
    selectable: false,
    events: [],
    eventContent: this.renderEventContent.bind(this),
    eventDrop: this.onEventDrop.bind(this)
  };

  constructor(
    private service: AgendaAdminService, 
    private runtime: RuntimeConfigService,
    private auth: AuthService,
    public chat: ChatService,
    private agendamentoService: AgendamentoService,
    private toast: ToastService
  ) {}

  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.dentistaId = this.auth.getSubject() ?? '';

    if (this.dentistaId) {
      this.chat.escutarAgendamentos(this.dentistaId);
      this.chat.agendamentos$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(agendamentos => {
        const novosEventos: EventInput[] = agendamentos.map(a => ({
          id: a.id,
          title: `Consulta: ${a.clienteNome || 'Agendada'}`,
          start: a.inicioAt,
          end: a.fimAt,
          backgroundColor: 'transparent',
          borderColor: 'transparent',
          textColor: '#ffffff',
          extendedProps: {
            pacienteNome: a.clienteNome || 'Novo Paciente',
            tipo: 'Avaliação Inicial',
            status: a.status || 'PENDING'
          }
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

  renderEventContent(arg: any) {
    const props = arg.event.extendedProps;
    const timeText = arg.timeText;
    
    const isConfirmed = props.status === 'ACTIVE' || props.status === 'CONFIRMED';
    const statusColor = isConfirmed ? 'text-emerald-400' : 'text-amber-400';
    const statusText = isConfirmed ? 'Confirmado' : 'Aguardando';
    const bgColor = isConfirmed ? 'bg-slate-800' : 'bg-slate-900';
    const borderColor = isConfirmed ? 'border-emerald-500/30' : 'border-amber-500/30';

    const container = document.createElement('div');
    container.className = `w-full h-full p-2 flex flex-col justify-start rounded-md border ${bgColor} ${borderColor} shadow-sm overflow-hidden text-xs text-slate-200 cursor-move`;
    
    container.innerHTML = `
      <div class="font-bold truncate" title="${props.pacienteNome}">${props.pacienteNome}</div>
      <div class="text-[10px] text-slate-400 mt-1 truncate">${props.tipo}</div>
      <div class="flex items-center justify-between mt-auto pt-1">
        <span class="font-semibold text-blue-300 text-[10px]">${timeText}</span>
        <span class="font-semibold ${statusColor} text-[10px]">${statusText}</span>
      </div>
    `;

    return { domNodes: [container] };
  }

  onEventDrop(info: any) {
    const eventId = info.event.id;
    if (!eventId) {
      info.revert();
      return;
    }

    const newStart = info.event.start;
    if (!newStart) {
      info.revert();
      return;
    }

    // Resolva o offset de Timezone convertendo para string
    // A API espera uma data/hora local ISO sem o Z final que mude o timezone 
    // ou um ZonedDateTime correto. Compensando offset local:
    const offset = newStart.getTimezoneOffset() * 60000;
    const localISOTime = new Date(newStart.getTime() - offset).toISOString().slice(0, -1);

    // Patch API
    this.agendamentoService.reagendarPatch(eventId, localISOTime).subscribe({
      next: () => {
        this.toast.show('Horário atualizado com sucesso.', 'success');
      },
      error: (err: any) => {
        if (err.status === 409 || err.status === 400) {
          this.toast.show('Horário indisponível ou já agendado. Conflito detectado!', 'error');
        } else {
          this.toast.show('Erro ao reagendar consulta.', 'error');
        }
        info.revert();
      }
    });
  }

}

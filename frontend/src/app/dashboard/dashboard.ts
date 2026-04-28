import { Component, OnInit } from '@angular/core';
import { AgendamentoService } from '../services/agendamento';
import { FullCalendarModule } from 'primeng/fullcalendar';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [FullCalendarModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  events: any[] = [];
  calendarOptions: any;
  private readonly demoEvents = this.criarEventosDemo();

  constructor(private agendamentoService: AgendamentoService) {}

  ngOnInit() {
    this.calendarOptions = {
      plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
      initialView: 'timeGridWeek',
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'timeGridWeek,timeGridDay'
      },
      editable: false,
      selectable: true,
      select: this.handleDateSelect.bind(this),
      events: this.demoEvents
    };
    
    this.carregarAgendamentos(1); 
  }

  carregarAgendamentos(dentistaId: number) {
    this.agendamentoService.listarPorDentista(dentistaId).subscribe({
      next: (res) => {
        const events = res.map((agendamento) => ({
          title: this.formatarTitulo(agendamento),
          start: agendamento.dataHora
        }));

        this.events = events.length > 0 ? events : this.demoEvents;
        this.calendarOptions = { ...this.calendarOptions, events: this.events };
      },
      error: (err) => {
        console.error('Erro na comunicacao com o backend Java:', err);
        this.events = this.demoEvents;
        this.calendarOptions = { ...this.calendarOptions, events: this.events };
      }
    });
  }

  handleDateSelect(selectInfo: any) {
    if (confirm(`Confirmar agendamento para ${selectInfo.startStr}?`)) {
      this.agendamentoService.criar({
        clienteId: 2, 
        dentistaId: 1, 
        dataHora: selectInfo.startStr
      }).subscribe(() => this.carregarAgendamentos(1));
    }
  }

  private formatarTitulo(agendamento: any): string {
    const cliente = agendamento?.cliente;

    if (cliente?.nome) {
      return `Cliente: ${cliente.nome}`;
    }

    if (cliente?.id) {
      return `Cliente: ${cliente.id}`;
    }

    return 'Agendamento';
  }

  private criarEventosDemo(): any[] {
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
        title: 'Consulta inicial',
        start: criarHorario(amanha, 9, 0),
        color: '#0f766e'
      },
      {
        title: 'Retorno',
        start: criarHorario(amanha, 11, 30),
        color: '#0284c7'
      },
      {
        title: 'Limpeza',
        start: criarHorario(depoisDeAmanha, 14, 0),
        color: '#7c3aed'
      }
    ];
  }
}
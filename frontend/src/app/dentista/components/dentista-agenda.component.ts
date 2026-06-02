import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AgendaFormPayload, AgendaRule } from '../../services/agenda-admin.service';

@Component({
  selector: 'app-dentista-agenda',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dentista-agenda.component.html',
  styleUrl: '../dentista-dashboard.component.scss'
})
export class DentistaAgendaComponent {
  @Input() loading = false;
  @Input() saving = false;
  @Input() dentistaId = '';
  @Input() payload!: AgendaFormPayload;
  @Output() onSave = new EventEmitter<AgendaFormPayload>();

  weekdays = ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY'];

  toggleDay(dia: string) {
    const idx = this.payload.regras.findIndex(r => r.diaSemana === dia);
    if (idx >= 0) {
      this.payload.regras.splice(idx, 1);
    } else {
      const r: AgendaRule = { diaSemana: dia, ativo: true, inicio: '08:00', fim: '18:00' };
      this.payload.regras.push(r);
    }
  }

  isDayActive(dia: string): boolean {
    return !!this.payload.regras.find(r => r.diaSemana === dia);
  }

  getRule(dia: string): AgendaRule | undefined {
    return this.payload.regras.find(r => r.diaSemana === dia);
  }

  updateTime(dia: string, field: 'inicio' | 'fim', event: any) {
    const r = this.getRule(dia);
    if (r) {
      r[field] = event.target.value;
    }
  }

  translateDay(dia: string): string {
    const map: Record<string, string> = {
      'MONDAY': 'Segunda', 'TUESDAY': 'Terça', 'WEDNESDAY': 'Quarta',
      'THURSDAY': 'Quinta', 'FRIDAY': 'Sexta', 'SATURDAY': 'Sábado', 'SUNDAY': 'Domingo'
    };
    return map[dia] || dia;
  }

  save() {
    this.onSave.emit(this.payload);
  }
}

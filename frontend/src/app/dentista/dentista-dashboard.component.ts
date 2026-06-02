import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AgendaAdminService, AgendaFormPayload, AgendaRule } from '../services/agenda-admin.service';
import { RuntimeConfigService } from '../services/runtime-config.service';

import { DentistaAgendaComponent } from './components/dentista-agenda.component';
import { DentistaMetricsComponent } from './components/dentista-metrics.component';
import { DentistaChatRequestsComponent } from './components/dentista-chat-requests.component';

@Component({
  selector: 'app-dentista-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, DentistaAgendaComponent, DentistaMetricsComponent, DentistaChatRequestsComponent],
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

  mockRequests = [
    { roomId: 'req-001', clienteId: 'pac1000' },
    { roomId: 'req-002', clienteId: 'pac1001' }
  ];

  constructor(private service: AgendaAdminService, private runtime: RuntimeConfigService) {}

  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.dentistaId = (this.runtime as any)['DENTISTA_ID'] || '';
    if (!this.dentistaId) {
      this.dentistaId = crypto.randomUUID();
    }
    this.load();
  }

  load() {
    this.loading = true;
    this.service.getByDentist(this.dentistaId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (a) => {
        this.payload = {
          dentistaId: a.dentistaId,
          timezone: a.timezone || this.payload.timezone,
          slotDurationMin: a.slotDurationMin || 30,
          horaInicioPadrao: a.horaInicioPadrao || '08:00',
          horaFimPadrao: a.horaFimPadrao || '18:00',
          regras: a.regras || [],
        };
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

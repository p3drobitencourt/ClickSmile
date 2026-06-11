import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { AgendaAdminService, AgendaFormPayload } from '../services/agenda-admin.service';
import { RuntimeConfigService } from '../services/runtime-config.service';
import { DentistaAgendaComponent } from './components/dentista-agenda.component';

@Component({
  selector: 'app-agenda-view',
  standalone: true,
  imports: [CommonModule, DentistaAgendaComponent],
  template: `
    <div class="dashboard-container">
      <header class="hero-panel" style="margin-bottom: 24px;">
        <div>
          <p class="eyebrow">Agenda</p>
          <h1>Agenda Semanal</h1>
        </div>
      </header>
      <div class="agenda-wrapper">
        <app-dentista-agenda 
          *ngIf="!loading"
          [loading]="loading" 
          [saving]="saving" 
          [dentistaId]="dentistaId" 
          [payload]="payload"
          (onSave)="saveAgenda($event)">
        </app-dentista-agenda>
      </div>
    </div>
  `,
  styleUrl: '../cliente/cliente-dashboard.component.scss' // reusing the layout container styles
})
export class AgendaViewComponent implements OnInit {
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

  private service = inject(AgendaAdminService);
  private runtime = inject(RuntimeConfigService);
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
}

import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { AgendaAdminService, AgendaFormPayload } from '../services/agenda-admin.service';
import { AuthService } from '../auth/auth.service';
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
        <div *ngIf="loading" class="loading-skeleton">
          <span class="spinner" style="width: 32px; height: 32px; border-width: 3px; border-top-color: #38bdf8;"></span>
          <p>Carregando informações...</p>
        </div>
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
  styleUrl: './dentista-theme.scss'
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

  weekdays = ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY'];

  private service = inject(AgendaAdminService);
  private auth = inject(AuthService);
  private destroyRef = inject(DestroyRef);
  private cdr = inject(import('@angular/core').ChangeDetectorRef);

  ngOnInit(): void {
    this.dentistaId = this.auth.getSubject() ?? '';
    
    if(this.dentistaId) {
      this.load();
    } else {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  load() {
    this.loading = true;
    this.service.getByDentist(this.dentistaId).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
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
        } else {
          this.payload.dentistaId = this.dentistaId;
        }

        if (!this.payload.regras || this.payload.regras.length === 0) {
          this.payload.regras = this.weekdays.map(d => ({
            diaSemana: d,
            ativo: false,
            inicio: this.payload.horaInicioPadrao || '08:00',
            fim: this.payload.horaFimPadrao || '18:00',
          }));
        }

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching agenda:', err);
        this.loading = false;
        this.cdr.detectChanges();
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

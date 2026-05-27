import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AgendaAdminService, AgendaFormPayload, AgendaRule } from '../services/agenda-admin.service';
import { RuntimeConfigService } from '../services/runtime-config.service';

@Component({
  selector: 'app-dentista-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dentista-dashboard.component.html',
  styleUrl: './dentista-dashboard.component.scss',
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

  constructor(private service: AgendaAdminService, private runtime: RuntimeConfigService) {}

  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    // tentamos inferir dentistaId do runtime (dev) ou gerar um placeholder
    // RuntimeConfigService expõe variáveis em window.__RUNTIME__, usamos acesso direto
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

  toggleDay(dia: string) {
    const idx = this.payload.regras.findIndex(r => r.diaSemana === dia);
    if (idx >= 0) {
      this.payload.regras.splice(idx, 1);
    } else {
      const r: AgendaRule = { diaSemana: dia, ativo: true, inicio: '08:00', fim: '18:00' };
      this.payload.regras.push(r);
    }
  }

  save() {
    this.saving = true;
    this.payload.dentistaId = this.dentistaId;
    this.service.save(this.payload).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => { this.saving = false; },
      error: () => { this.saving = false; }
    });
  }
}

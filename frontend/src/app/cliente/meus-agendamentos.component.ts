import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../auth/auth.service';
import { AgendamentoService } from '../services/agendamento';
import { AgendamentoResumo } from '../services/agendamento.models';

@Component({
  selector: 'app-meus-agendamentos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './meus-agendamentos.component.html',
  styleUrl: './meus-agendamentos.component.scss',
})
export class MeusAgendamentosComponent implements OnInit {
  agendamentos: AgendamentoResumo[] = [];
  loading = true;

  constructor(
    private auth: AuthService,
    private agendamentoService: AgendamentoService
  ) {}

  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    const userId = this.auth.getSubject();
    if (userId) {
      this.loadAgendamentos(userId);
    } else {
      this.loading = false;
    }
  }

  private loadAgendamentos(userId: string) {
    this.agendamentoService.listarPorPaciente(userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.agendamentos = data.sort((a, b) => new Date(a.inicioAt).getTime() - new Date(b.inicioAt).getTime());
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        }
      });
  }
}

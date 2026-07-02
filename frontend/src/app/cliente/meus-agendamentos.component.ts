import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, DestroyRef, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../auth/auth.service';
import { AgendamentoService } from '../services/agendamento';
import { AgendamentoResumo } from '../services/agendamento.models';
import { ToastService } from '../shared/toast.service';

@Component({
  selector: 'app-meus-agendamentos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './meus-agendamentos.component.html',
  styleUrl: './meus-agendamentos.component.scss',
})
export class MeusAgendamentosComponent implements OnInit {
  @Output() abrirChat = new EventEmitter<string>();
  
  agendamentos: AgendamentoResumo[] = [];
  loading = true;

  showCancelModal = false;
  selectedCancelId: number | string | null = null;
  cancelLoading = false;

  private toast = inject(ToastService);

  constructor(
    private auth: AuthService,
    private agendamentoService: AgendamentoService,
    private cdr: ChangeDetectorRef
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
          this.agendamentos = data.sort((a, b) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime());
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
  }

  iniciarChat(dentistaId?: string) {
    if (dentistaId) {
      this.abrirChat.emit(dentistaId);
    }
  }

  confirmCancel(id: number | string) {
    this.selectedCancelId = id;
    this.showCancelModal = true;
  }

  closeModal() {
    this.showCancelModal = false;
    this.selectedCancelId = null;
  }

  executeCancel() {
    if (!this.selectedCancelId) return;
    this.cancelLoading = true;
    
    this.agendamentoService.cancelar(this.selectedCancelId as string).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
         const item = this.agendamentos.find(a => a.id === this.selectedCancelId);
         if (item) item.status = 'CANCELADO';
         this.toast.show('Agendamento cancelado com sucesso.', 'success');
         this.cancelLoading = false;
         this.closeModal();
      },
      error: () => {
         this.toast.show('Erro ao cancelar agendamento.', 'error');
         this.cancelLoading = false;
         this.closeModal();
      }
    });
  }
}

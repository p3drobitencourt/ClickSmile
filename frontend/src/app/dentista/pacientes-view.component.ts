import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DentistaChatRequestsComponent } from './components/dentista-chat-requests.component';
import { DentistaMetricsComponent } from './components/dentista-metrics.component';
import { ChatService, SessaoChatResponseDTO } from '../services/chat.service';
import { AgendamentoService } from '../services/agendamento';
import { AuthService } from '../auth/auth.service';
import { ToastService } from '../shared/toast.service';

@Component({
  selector: 'app-pacientes-view',
  standalone: true,
  imports: [CommonModule, DentistaChatRequestsComponent, DentistaMetricsComponent],
  template: `
    <div class="h-full bg-slate-900 text-slate-200 p-4 lg:p-6 overflow-y-auto">
      <header class="bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-700 mb-6">
        <div>
          <p class="text-sm font-semibold text-blue-500 uppercase tracking-wider mb-1">Pacientes</p>
          <h1 class="text-2xl font-bold text-slate-100 m-0">Meus Pacientes</h1>
        </div>
      </header>
      
      <app-dentista-metrics 
        [consultasHoje]="5" 
        [taxaAceitacao]="92" 
        [ganhosProjetados]="'1.250,00'">
      </app-dentista-metrics>

      <div class="mt-6">
        <app-dentista-chat-requests 
          [requests]="solicitacoes" 
          (onAccept)="acceptChat($event)">
        </app-dentista-chat-requests>
      </div>
    </div>
  `
})
export class PacientesViewComponent implements OnInit {
  solicitacoes: SessaoChatResponseDTO[] = [];

  private chatService = inject(ChatService);
  private authService = inject(AuthService);
  private agendamentoService = inject(AgendamentoService);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  ngOnInit() {
    this.chatService.solicitacoes$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(reqs => {
      this.solicitacoes = reqs.filter(r => r.status === 'PENDING');
    });
  }

  acceptChat(roomId: string) {
    this.chatService.aceitarChat(roomId).subscribe({
      next: (res) => {
        // Agora que aceitou, marca uma "Avaliação Inicial" para amanha as 08:00
        const amanha = new Date();
        amanha.setDate(amanha.getDate() + 1);
        amanha.setHours(8, 0, 0, 0);
        
        // Remove the 'Z' to respect local time offset required by backend
        const dataHoraIso = new Date(amanha.getTime() - (amanha.getTimezoneOffset() * 60000)).toISOString().slice(0, 19);

        const dentistaId = this.authService.getSubject() ?? '';
        
        this.agendamentoService.criar({
          clienteId: res.clienteId,
          dentistaId: dentistaId,
          dataHora: dataHoraIso
        }).subscribe({
           next: () => {
             this.toast.show('Chat aceito! Uma Avaliação Inicial foi criada na sua Agenda Kanban (Trello).', 'success');
           },
           error: () => this.toast.show('Chat aceito, mas erro ao criar agendamento.', 'warning')
        });
      },
      error: () => this.toast.show('Erro ao aceitar solicitação de chat.', 'error')
    });
  }
}

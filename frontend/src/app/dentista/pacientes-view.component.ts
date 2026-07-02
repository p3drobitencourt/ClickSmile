import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DentistaChatRequestsComponent } from './components/dentista-chat-requests.component';
import { DentistaMetricsComponent } from './components/dentista-metrics.component';
import { ChatService, SessaoChatResponseDTO } from '../services/chat.service';
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
          [requests]="solicitacoes">
        </app-dentista-chat-requests>
      </div>
    </div>
  `
})
export class PacientesViewComponent implements OnInit {
  solicitacoes: SessaoChatResponseDTO[] = [];

  private chatService = inject(ChatService);
  private destroyRef = inject(DestroyRef);

  ngOnInit() {
    this.chatService.solicitacoes$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(reqs => {
      this.solicitacoes = reqs.filter(r => r.status === 'PENDING' || r.status === 'ACTIVE');
    });
  }
}

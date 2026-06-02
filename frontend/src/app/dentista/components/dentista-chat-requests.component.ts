import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dentista-chat-requests',
  standalone: true,
  imports: [CommonModule],
  template: `
    <article class="surface-panel">
      <h3>Solicitações de Chat</h3>
      <div class="requests-list" *ngIf="requests.length > 0; else noRequests">
        <div class="request-card" *ngFor="let req of requests">
          <div class="info">
            <strong>Paciente {{ req.clienteId | slice:0:8 }}...</strong>
            <small>Aguardando resposta</small>
          </div>
          <button class="btn-accept" (click)="onAccept.emit(req.roomId)">Aceitar</button>
        </div>
      </div>
      <ng-template #noRequests>
        <p class="empty-state">Nenhuma solicitação pendente.</p>
      </ng-template>
    </article>
  `,
  styles: [`
    .surface-panel {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 1.5rem;
      box-shadow: 0 1px 3px 0 rgba(0,0,0,0.05);
      margin-bottom: 2rem;
      h3 { margin: 0 0 1rem 0; color: #0f172a; font-size: 1.25rem; }
    }
    .requests-list { display: flex; flex-direction: column; gap: 1rem; }
    .request-card {
      display: flex; justify-content: space-between; align-items: center;
      padding: 1rem; border-radius: 12px; background: #f8fafc; border: 1px solid #e2e8f0;
    }
    .info { display: flex; flex-direction: column; }
    .info strong { color: #0f172a; font-size: 0.95rem; }
    .info small { color: #f59e0b; font-size: 0.8rem; font-weight: 500; }
    .btn-accept {
      background: #10b981; color: white; border: none; padding: 0.5rem 1rem;
      border-radius: 8px; font-weight: 600; cursor: pointer;
    }
    .btn-accept:hover { background: #059669; }
    .empty-state { color: #64748b; text-align: center; padding: 2rem 0; }
  `]
})
export class DentistaChatRequestsComponent {
  @Input() requests: any[] = [];
  @Output() onAccept = new EventEmitter<string>();
}

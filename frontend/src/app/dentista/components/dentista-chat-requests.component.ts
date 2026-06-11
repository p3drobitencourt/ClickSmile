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
  styleUrl: '../dentista-theme.scss'
})
export class DentistaChatRequestsComponent {
  @Input() requests: any[] = [];
  @Output() onAccept = new EventEmitter<string>();
}

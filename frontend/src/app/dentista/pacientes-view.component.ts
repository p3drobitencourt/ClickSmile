import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DentistaChatRequestsComponent } from './components/dentista-chat-requests.component';
import { DentistaMetricsComponent } from './components/dentista-metrics.component';

@Component({
  selector: 'app-pacientes-view',
  standalone: true,
  imports: [CommonModule, DentistaChatRequestsComponent, DentistaMetricsComponent],
  template: `
    <div class="dashboard-container">
      <header class="hero-panel" style="margin-bottom: 24px;">
        <div>
          <p class="eyebrow">Pacientes</p>
          <h1>Meus Pacientes</h1>
        </div>
      </header>
      
      <app-dentista-metrics 
        [consultasHoje]="5" 
        [taxaAceitacao]="92" 
        [ganhosProjetados]="'1.250,00'">
      </app-dentista-metrics>

      <div class="chat-wrapper" style="margin-top: 24px;">
        <app-dentista-chat-requests 
          [requests]="mockRequests" 
          (onAccept)="acceptChat($event)">
        </app-dentista-chat-requests>
      </div>
    </div>
  `,
  styleUrl: '../cliente/cliente-dashboard.component.scss' // reusing the layout container styles
})
export class PacientesViewComponent {
  mockRequests = [
    { roomId: 'req-001', clienteId: 'pac1000' },
    { roomId: 'req-002', clienteId: 'pac1001' }
  ];

  acceptChat(roomId: string) {
    console.log('Accepted chat:', roomId);
  }
}

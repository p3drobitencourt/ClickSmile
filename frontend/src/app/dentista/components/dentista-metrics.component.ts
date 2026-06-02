import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dentista-metrics',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="metrics-grid">
      <div class="metric-card">
        <p>Consultas Hoje</p>
        <h3>{{ consultasHoje }}</h3>
      </div>
      <div class="metric-card">
        <p>Taxa de Aceitação</p>
        <h3>{{ taxaAceitacao }}%</h3>
      </div>
      <div class="metric-card">
        <p>Ganhos Projetados</p>
        <h3>R$ {{ ganhosProjetados }}</h3>
      </div>
    </div>
  `,
  styles: [`
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    .metric-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 1.5rem;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
      
      p { margin: 0 0 0.5rem 0; color: #64748b; font-size: 0.9rem; font-weight: 500; }
      h3 { margin: 0; color: #0f172a; font-size: 1.8rem; font-weight: 700; }
    }
  `]
})
export class DentistaMetricsComponent {
  @Input() consultasHoje = 0;
  @Input() taxaAceitacao = 0;
  @Input() ganhosProjetados = '0,00';
}

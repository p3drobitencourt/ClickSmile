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
  styleUrl: '../dentista-theme.scss'
})
export class DentistaMetricsComponent {
  @Input() consultasHoje = 0;
  @Input() taxaAceitacao = 0;
  @Input() ganhosProjetados = '0,00';
}

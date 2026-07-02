import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dentista-metrics',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-700">
        <p class="text-sm text-slate-400 font-medium mb-1">Consultas Hoje</p>
        <h3 class="text-3xl font-bold text-slate-100 m-0">{{ consultasHoje }}</h3>
      </div>
      <div class="bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-700">
        <p class="text-sm text-slate-400 font-medium mb-1">Taxa de Aceitação</p>
        <h3 class="text-3xl font-bold text-slate-100 m-0">{{ taxaAceitacao }}%</h3>
      </div>
      <div class="bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-700">
        <p class="text-sm text-slate-400 font-medium mb-1">Ganhos Projetados</p>
        <h3 class="text-3xl font-bold text-emerald-400 m-0">R$ {{ ganhosProjetados }}</h3>
      </div>
    </div>
  `
})
export class DentistaMetricsComponent {
  @Input() consultasHoje = 0;
  @Input() taxaAceitacao = 0;
  @Input() ganhosProjetados = '0,00';
}

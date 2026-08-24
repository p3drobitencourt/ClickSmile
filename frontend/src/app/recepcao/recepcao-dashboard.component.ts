import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RecepcaoService, AgendaDiaDentista } from './services/recepcao.service';

@Component({
  selector: 'app-recepcao-dashboard',
  standalone: true,
  imports: [CommonModule],
  providers: [DatePipe],
  template: `
    <div class="h-full bg-slate-900 text-slate-200 p-4 lg:p-6 overflow-y-auto">
      <header class="bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-700 mb-6 flex justify-between items-center">
        <div>
          <p class="text-sm font-semibold text-emerald-500 uppercase tracking-wider mb-1">Recepção</p>
          <h1 class="text-2xl font-bold text-slate-100 m-0">Painel Consolidado</h1>
        </div>
        <div class="flex items-center gap-3">
          <label class="text-sm text-slate-400">Data:</label>
          <input type="date" [value]="dataSelecionada" (change)="onDateChange($event)"
                 class="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all">
        </div>
      </header>

      <div *ngIf="loading" class="flex justify-center p-12">
        <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
      </div>

      <div *ngIf="!loading && agendas.length === 0" class="text-center p-12 bg-slate-800 rounded-xl border border-slate-700">
        <p class="text-slate-400">Nenhum dentista com agenda disponível para esta data.</p>
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-2 gap-6" *ngIf="!loading && agendas.length > 0">
        <div *ngFor="let agenda of agendas" class="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-lg flex flex-col h-[500px]">
          <div class="bg-slate-800/80 p-4 border-b border-slate-700 flex items-center justify-between sticky top-0 z-10 backdrop-blur-sm">
            <h2 class="text-lg font-semibold text-slate-100 flex items-center gap-2">
              <span class="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm font-bold">
                {{ agenda.dentistaNome.charAt(0) }}
              </span>
              Dr(a). {{ agenda.dentistaNome }}
            </h2>
            <span class="text-xs font-medium px-2 py-1 bg-slate-700 text-slate-300 rounded-full">
              {{ agenda.agendamentos.length }} agendamentos
            </span>
          </div>
          
          <div class="p-4 flex-1 overflow-y-auto custom-scrollbar">
            <div *ngIf="agenda.agendamentos.length === 0" class="flex flex-col items-center justify-center h-full text-slate-500 gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p class="text-sm">Agenda livre</p>
            </div>

            <div class="space-y-3">
              <div *ngFor="let ag of agenda.agendamentos" 
                   class="p-3 rounded-lg border border-slate-700/50 bg-slate-900/50 hover:border-emerald-500/30 hover:bg-slate-800 transition-colors group">
                <div class="flex justify-between items-start mb-2">
                  <span class="text-emerald-400 font-mono font-bold">{{ ag.inicioAt | date:'HH:mm' }}</span>
                  <span class="text-xs px-2 py-1 rounded-full font-medium"
                        [ngClass]="{
                          'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20': ag.status === 'CONFIRMADO',
                          'bg-amber-500/10 text-amber-400 border border-amber-500/20': ag.status === 'PENDENTE'
                        }">
                    {{ ag.status }}
                  </span>
                </div>
                <p class="text-slate-200 font-medium truncate">{{ ag.pacienteNome }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar {
      width: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background-color: #334155;
      border-radius: 20px;
    }
  `]
})
export class RecepcaoDashboardComponent implements OnInit {
  dataSelecionada: string;
  agendas: AgendaDiaDentista[] = [];
  loading = false;

  private recepcaoService = inject(RecepcaoService);

  constructor() {
    const today = new Date();
    this.dataSelecionada = today.toISOString().split('T')[0];
  }

  ngOnInit() {
    this.carregarAgendas();
  }

  onDateChange(event: any) {
    this.dataSelecionada = event.target.value;
    this.carregarAgendas();
  }

  carregarAgendas() {
    this.loading = true;
    this.recepcaoService.listarAgendasDoDia(this.dataSelecionada).subscribe({
      next: (dados) => {
        this.agendas = dados;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }
}

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RecepcaoService, Paciente } from './services/recepcao.service';

@Component({
  selector: 'app-recepcao-pacientes',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="h-full bg-slate-900 text-slate-200 p-4 lg:p-6 overflow-y-auto">
      <header class="bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-700 mb-6 flex justify-between items-center">
        <div>
          <p class="text-sm font-semibold text-emerald-500 uppercase tracking-wider mb-1">Recepção</p>
          <h1 class="text-2xl font-bold text-slate-100 m-0">Pacientes da Clínica</h1>
        </div>
        <button class="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-emerald-500/20 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Novo Paciente
        </button>
      </header>

      <div *ngIf="loading" class="flex justify-center p-12">
        <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
      </div>

      <div class="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-lg" *ngIf="!loading">
        <div class="p-4 border-b border-slate-700">
          <div class="relative">
            <input type="text" placeholder="Buscar paciente por nome..." 
                   (input)="onSearch($event)"
                   class="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-slate-500 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-900/50 text-slate-400 text-xs uppercase tracking-wider">
              <th class="p-4 font-semibold">Paciente</th>
              <th class="p-4 font-semibold">Contato</th>
              <th class="p-4 font-semibold text-right">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-700/50">
            <tr *ngFor="let paciente of pacientesFiltrados" class="hover:bg-slate-800/80 transition-colors">
              <td class="p-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg">
                    {{ paciente.nome.charAt(0) }}
                  </div>
                  <div>
                    <p class="font-medium text-slate-200">{{ paciente.nome }}</p>
                    <p class="text-xs text-slate-500 font-mono">ID: {{ paciente.id.substring(0,8) }}</p>
                  </div>
                </div>
              </td>
              <td class="p-4">
                <p class="text-sm text-slate-300">{{ paciente.email }}</p>
                <p class="text-xs text-slate-500">{{ paciente.telefone || 'Sem telefone' }}</p>
              </td>
              <td class="p-4 text-right">
                <button class="text-emerald-400 hover:text-emerald-300 text-sm font-medium">Ver Histórico</button>
              </td>
            </tr>
            <tr *ngIf="pacientesFiltrados.length === 0">
              <td colspan="3" class="p-8 text-center text-slate-500">Nenhum paciente encontrado.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class RecepcaoPacientesComponent implements OnInit {
  pacientes: Paciente[] = [];
  pacientesFiltrados: Paciente[] = [];
  loading = false;
  termo = '';

  private recepcaoService = inject(RecepcaoService);

  ngOnInit() {
    this.carregarPacientes();
  }

  carregarPacientes() {
    this.loading = true;
    this.recepcaoService.listarPacientes().subscribe({
      next: (dados) => {
        this.pacientes = dados;
        this.pacientesFiltrados = dados;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  onSearch(event: any) {
    this.termo = event.target.value.toLowerCase();
    this.pacientesFiltrados = this.pacientes.filter(p => p.nome.toLowerCase().includes(this.termo));
  }
}

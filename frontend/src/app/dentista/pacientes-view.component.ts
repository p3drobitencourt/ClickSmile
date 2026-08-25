import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DentistaChatRequestsComponent } from './components/dentista-chat-requests.component';
import { DentistaMetricsComponent } from './components/dentista-metrics.component';
import { ChatService, SessaoChatResponseDTO } from '../services/chat.service';
import { ToastService } from '../shared/toast.service';import { HttpClient } from '@angular/common/http';
import { AuthService } from '../auth/auth.service';
import { RuntimeConfigService } from '../services/runtime-config.service';

@Component({
  selector: 'app-pacientes-view',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="h-full bg-slate-900 text-slate-200 p-4 lg:p-6 overflow-y-auto">
      <header class="bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-700 mb-6">
        <div>
          <p class="text-sm font-semibold text-blue-500 uppercase tracking-wider mb-1">Pacientes</p>
          <h1 class="text-2xl font-bold text-slate-100 m-0">Meus Pacientes</h1>
        </div>
      </header>
      
      <div *ngIf="loading" class="flex justify-center p-12">
        <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
      </div>

      <div class="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-lg mt-6" *ngIf="!loading">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-900/50 text-slate-400 text-xs uppercase tracking-wider">
              <th class="p-4 font-semibold">Paciente</th>
              <th class="p-4 font-semibold text-right">Última Consulta</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-700/50">
            <tr *ngFor="let paciente of pacientes" class="hover:bg-slate-800/80 transition-colors">
              <td class="p-4 flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-lg">
                  {{ paciente.nome.charAt(0) }}
                </div>
                <div>
                  <p class="font-medium text-slate-200">{{ paciente.nome }}</p>
                </div>
              </td>
              <td class="p-4 text-right text-slate-400 text-sm">
                {{ paciente.ultimaConsulta | date:'dd/MM/yyyy HH:mm' }}
              </td>
            </tr>
            <tr *ngIf="pacientes.length === 0">
              <td colspan="2" class="p-8 text-center text-slate-500">Nenhum paciente agendado até o momento.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class PacientesViewComponent implements OnInit {
  pacientes: { id: string, nome: string, ultimaConsulta: string }[] = [];
  loading = false;

  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private runtime = inject(RuntimeConfigService);

  ngOnInit() {
    this.carregarPacientes();
  }

  carregarPacientes() {
    this.loading = true;
    this.auth.getProfile().then((user: any) => {
      this.http.get<any[]>(this.runtime.api(`/api/agendamentos/dentista/${user.id}`)).subscribe({
        next: (agendamentos: any[]) => {
          const mapa = new Map<string, any>();
          
          agendamentos.forEach((ag: any) => {
            const pId = ag.pacienteId;
            if (!mapa.has(pId)) {
              mapa.set(pId, { id: pId, nome: ag.pacienteNome, ultimaConsulta: ag.inicioAt });
            } else {
              const existente = mapa.get(pId);
              if (new Date(ag.inicioAt) > new Date(existente.ultimaConsulta)) {
                existente.ultimaConsulta = ag.inicioAt;
              }
            }
          });
          
          this.pacientes = Array.from(mapa.values());
          this.loading = false;
        },
        error: () => this.loading = false
      });
    }).catch(() => this.loading = false);
  }
}

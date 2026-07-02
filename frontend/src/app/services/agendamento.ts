import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import { AgendamentoRequest, AgendamentoResumo } from './agendamento.models';
import { RuntimeConfigService } from './runtime-config.service';

// Armazenamento em memória para demonstração
const MOCK_DB: AgendamentoResumo[] = [
  {
    id: 100,
    dataHora: new Date(new Date().setHours(10, 0, 0, 0)).toISOString(),
    status: 'CONFIRMADO',
    cliente: { id: 1, nome: 'João (Mock)' },
    dentistaId: 1
  }
];

@Injectable({ providedIn: 'root' })
export class AgendamentoService {
  private apiUrl: string;

  constructor(private http: HttpClient, private runtime: RuntimeConfigService) {
    this.apiUrl = this.runtime.api('/api/agendamentos');
  }

  listarPorDentista(dentistaId: number | string): Observable<AgendamentoResumo[]> {
    const list = MOCK_DB.filter(a => String(a.dentistaId) === String(dentistaId) || String(a.dentistaId) === '1');
    return of(list).pipe(delay(300));
  }

  listarPorPaciente(pacienteId: string): Observable<AgendamentoResumo[]> {
    // Para mock, vamos retornar todos ou filtrar pelo mock
    return of(MOCK_DB).pipe(delay(300));
  }

  criar(agendamento: AgendamentoRequest): Observable<AgendamentoResumo> {
    const novo: AgendamentoResumo = {
      id: Date.now(),
      dataHora: agendamento.dataHora,
      status: 'CONFIRMADO',
      cliente: { id: Number(agendamento.clienteId) || 1, nome: 'Novo Cliente (Mock)' },
      dentistaId: Number(agendamento.dentistaId) || 1
    };
    MOCK_DB.push(novo);
    return of(novo).pipe(delay(300));
  }

  cancelar(id: string): Observable<void> {
    const idx = MOCK_DB.findIndex(a => String(a.id) === id);
    if (idx !== -1) {
      MOCK_DB.splice(idx, 1);
    }
    return of(undefined).pipe(delay(300));
  }

  reagendar(id: string, novoInicioAt: string): Observable<AgendamentoResumo> {
    const agend = MOCK_DB.find(a => String(a.id) === id);
    if (agend) {
      agend.dataHora = novoInicioAt;
    }
    return of(agend as AgendamentoResumo).pipe(delay(300));
  }
}
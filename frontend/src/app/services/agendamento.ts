import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AgendamentoRequest, AgendamentoResumo } from './agendamento.models';
import { RuntimeConfigService } from './runtime-config.service';

@Injectable({ providedIn: 'root' })
export class AgendamentoService {
  private apiUrl: string;

  constructor(private http: HttpClient, private runtime: RuntimeConfigService) {
    this.apiUrl = this.runtime.api('/api/agendamentos');
  }

  listarPorDentista(dentistaId: number | string): Observable<AgendamentoResumo[]> {
    return this.http.get<AgendamentoResumo[]>(`${this.apiUrl}/dentista/${dentistaId}`);
  }

  listarPorPaciente(pacienteId: string): Observable<AgendamentoResumo[]> {
    return this.http.get<AgendamentoResumo[]>(`${this.apiUrl}/paciente/${pacienteId}`);
  }

  criar(agendamento: AgendamentoRequest): Observable<AgendamentoResumo> {
    return this.http.post<AgendamentoResumo>(this.apiUrl, agendamento);
  }
}
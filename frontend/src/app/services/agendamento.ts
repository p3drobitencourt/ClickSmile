import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AgendamentoRequest, AgendamentoResumo } from './agendamento.models';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AgendamentoService {
  private apiUrl = `${environment.apiUrl}/agendamentos`;

  constructor(private http: HttpClient) {}

  listarPorDentista(dentistaId: number): Observable<AgendamentoResumo[]> {
    return this.http.get<AgendamentoResumo[]>(`${this.apiUrl}/dentista/${dentistaId}`);
  }

  criar(agendamento: AgendamentoRequest): Observable<AgendamentoResumo> {
    return this.http.post<AgendamentoResumo>(this.apiUrl, agendamento);
  }
}
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AgendamentoRequest {
  clienteId: number;
  dentistaId: number;
  dataHora: string;
}

@Injectable({ providedIn: 'root' })
export class AgendamentoService {
  private apiUrl = 'http://localhost:8080/api/agendamentos';

  constructor(private http: HttpClient) {}

  listarPorDentista(dentistaId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/dentista/${dentistaId}`);
  }

  criar(agendamento: AgendamentoRequest): Observable<any> {
    return this.http.post(this.apiUrl, agendamento);
  }
}
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RuntimeConfigService } from './runtime-config.service';

export interface AgendaRule {
  diaSemana: string;
  ativo: boolean;
  inicio: string;
  pausaInicio?: string | null;
  pausaFim?: string | null;
  fim: string;
}

export interface AgendaFormPayload {
  dentistaId: string;
  timezone: string;
  slotDurationMin: number;
  horaInicioPadrao: string;
  horaFimPadrao: string;
  regras: AgendaRule[];
}

export interface AgendaPayload extends AgendaFormPayload {
  id?: string;
}

@Injectable({ providedIn: 'root' })
export class AgendaAdminService {
  private baseUrl: string;

  constructor(private http: HttpClient, private runtime: RuntimeConfigService) {
    this.baseUrl = this.runtime.api('/api/agendas');
  }

  getByDentist(dentistaId: string): Observable<AgendaPayload> {
    return this.http.get<AgendaPayload>(`${this.baseUrl}/dentista/${dentistaId}`);
  }

  save(payload: AgendaFormPayload): Observable<AgendaPayload> {
    return this.http.put<AgendaPayload>(this.baseUrl, payload);
  }
}

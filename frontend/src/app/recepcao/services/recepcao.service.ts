import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RuntimeConfigService } from '../../services/runtime-config.service';
import { AgendamentoDTO } from '../../services/agendamento.models';

export interface Paciente {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
}

export interface AgendaDiaDentista {
  dentistaId: string;
  dentistaNome: string;
  agendamentos: AgendamentoDTO[];
}

@Injectable({
  providedIn: 'root'
})
export class RecepcaoService {
  private http = inject(HttpClient);
  private runtime = inject(RuntimeConfigService);

  listarPacientes(): Observable<Paciente[]> {
    return this.http.get<Paciente[]>(this.runtime.api('/api/recepcao/pacientes'));
  }

  listarAgendasDoDia(data: string): Observable<AgendaDiaDentista[]> {
    return this.http.get<AgendaDiaDentista[]>(this.runtime.api(`/api/recepcao/agendas/dia?data=${data}`));
  }
}

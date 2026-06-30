import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of } from 'rxjs';
import { RuntimeConfigService } from './runtime-config.service';

export interface DentistSummary {
  id: string;
  nome: string;
  email: string;
  cro: string;
  especialidade: string;
  agendaResumo: string;
  color: string;
  latitude?: number;
  longitude?: number;
  distanciaKm?: number;
}

export interface ScheduleSlot {
  start: string;
  end: string;
  title: string;
  tone: 'primary' | 'success' | 'warning';
}

export interface RegraDto {
  ativo: boolean;
  diaSemana: string;
  inicio: string;
  fim: string;
  pausaInicio?: string;
  pausaFim?: string;
}

export interface AgendaDto {
  regras?: RegraDto[];
  slotDurationMin?: number;
}

@Injectable({ providedIn: 'root' })
export class DentistDirectoryService {
  constructor(private http: HttpClient, private runtime: RuntimeConfigService) {}

  listDentists(lat?: number, lng?: number): Observable<DentistSummary[]> {
    let url = this.runtime.api('/api/public/dentistas');
    if (lat !== undefined && lng !== undefined) {
      url += `?lat=${lat}&lng=${lng}`;
    }
    return this.http.get<DentistSummary[]>(url).pipe(
      catchError(() => of([]))
    );
  }

  getSlots(dentistId: string): Observable<ScheduleSlot[]> {
    const url = this.runtime.api(`/api/agendamentos/dentista/${dentistId}/slots`);
    return this.http.get<ScheduleSlot[]>(url).pipe(
      catchError(() => of([]))
    );
  }
}

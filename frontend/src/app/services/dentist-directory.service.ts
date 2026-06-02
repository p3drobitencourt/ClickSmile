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
  private fallbackDentists: DentistSummary[] = [
    {
      id: '11111111-1111-1111-1111-111111111111',
      nome: 'Dra. Marina Santos',
      email: 'marina@clicksmile.local',
      cro: 'CRO-12345',
      especialidade: 'Ortodontia',
      agendaResumo: 'Seg-Sex | 08:00 - 18:00',
      color: '#38bdf8',
    },
    {
      id: '22222222-2222-2222-2222-222222222222',
      nome: 'Dr. Felipe Rocha',
      email: 'felipe@clicksmile.local',
      cro: 'CRO-54321',
      especialidade: 'Implantodontia',
      agendaResumo: 'Ter-Sáb | 09:00 - 17:30',
      color: '#34d399',
    },
    {
      id: '33333333-3333-3333-3333-333333333333',
      nome: 'Dra. Camila Nunes',
      email: 'camila@clicksmile.local',
      cro: 'CRO-99991',
      especialidade: 'Clínica Geral',
      agendaResumo: 'Seg-Qui | 10:00 - 19:00',
      color: '#a78bfa',
    },
  ];

  constructor(private http: HttpClient, private runtime: RuntimeConfigService) {}

  listDentists(lat?: number, lng?: number): Observable<DentistSummary[]> {
    let url = this.runtime.api('/api/public/dentistas');
    if (lat !== undefined && lng !== undefined) {
      url += `?lat=${lat}&lng=${lng}`;
    }
    return this.http.get<DentistSummary[]>(url).pipe(
      catchError(() => of(this.fallbackDentists))
    );
  }

  getSlots(dentistId: string): Observable<ScheduleSlot[]> {
    const url = this.runtime.api(`/api/agendamentos/dentista/${dentistId}/slots`);
    return this.http.get<ScheduleSlot[]>(url).pipe(
      catchError(() => of(this.buildMockSlots(dentistId)))
    );
  }

  private buildMockSlots(dentistId: string): ScheduleSlot[] {
    const tone = dentistId.endsWith('1') ? 'primary' : dentistId.endsWith('2') ? 'success' : 'warning';
    const slots: ScheduleSlot[] = [];
    const base = new Date();

    for (let offset = 0; offset < 5; offset += 1) {
      const date = new Date(base);
      date.setDate(base.getDate() + offset + 1);
      const start = new Date(date);
      start.setHours(8 + offset, 0, 0, 0);
      const end = new Date(start);
      end.setMinutes(start.getMinutes() + 30);
      slots.push({
        start: start.toISOString(),
        end: end.toISOString(),
        title: 'Disponível',
        tone,
      });
    }

    return slots;
  }
}

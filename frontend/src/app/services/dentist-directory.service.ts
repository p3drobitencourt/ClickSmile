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
}

export interface ScheduleSlot {
  start: string;
  end: string;
  title: string;
  tone: 'primary' | 'success' | 'warning';
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

  listDentists(): Observable<DentistSummary[]> {
    const url = this.runtime.api('/api/public/dentistas');
    return this.http.get<DentistSummary[]>(url).pipe(
      catchError(() => of(this.fallbackDentists))
    );
  }

  getSlots(dentistId: string): Observable<ScheduleSlot[]> {
    const url = this.runtime.api(`/api/agendas/dentista/${dentistId}`);
    return this.http.get<any>(url).pipe(
      map((agenda) => this.buildSlotsFromAgenda(agenda, dentistId)),
      catchError(() => of(this.buildMockSlots(dentistId)))
    );
  }

  private buildSlotsFromAgenda(agenda: any, dentistId: string): ScheduleSlot[] {
    if (!agenda?.regras?.length) {
      return this.buildMockSlots(dentistId);
    }

    return this.buildEventsFromRules(agenda.regras, agenda.slotDurationMin || 30);
  }

  private buildEventsFromRules(regras: any[], slotDuration: number): ScheduleSlot[] {
    const slots: ScheduleSlot[] = [];
    const now = new Date();
    const horizon = 7;

    for (let dayOffset = 0; dayOffset < horizon; dayOffset += 1) {
      const day = new Date(now);
      day.setDate(now.getDate() + dayOffset);
      const weekday = day.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
      const rule = regras.find((item) => item.ativo && item.diaSemana === weekday);

      if (!rule) {
        continue;
      }

      const start = this.composeDate(day, rule.inicio);
      const end = this.composeDate(day, rule.fim);
      const pauseStart = rule.pausaInicio ? this.composeDate(day, rule.pausaInicio) : null;
      const pauseEnd = rule.pausaFim ? this.composeDate(day, rule.pausaFim) : null;

      let cursor = new Date(start);
      while (cursor < end) {
        const next = new Date(cursor);
        next.setMinutes(next.getMinutes() + slotDuration);
        if (next > end) {
          break;
        }

        if (pauseStart && pauseEnd && cursor < pauseEnd && next > pauseStart) {
          cursor = new Date(pauseEnd);
          continue;
        }

        slots.push({
          start: cursor.toISOString(),
          end: next.toISOString(),
          title: 'Slot disponível',
          tone: 'success',
        });

        cursor = next;
      }
    }

    return slots;
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

  private composeDate(day: Date, localTime: string) {
    const [hours, minutes] = localTime.split(':').map((value) => Number(value));
    const result = new Date(day);
    result.setHours(hours, minutes, 0, 0);
    return result;
  }
}

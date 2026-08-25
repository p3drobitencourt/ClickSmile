import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RuntimeConfigService } from '../services/runtime-config.service';

export interface AdminMetrics {
  totalPacientes: number;
  novosPacientes: number;
  totalDentistas: number;
  totalAgendamentos: number;
  agendamentosConcluidos: number;
  agendamentosCancelados: number;
  taxaCancelamento: number;
}

export interface AdminUsuario {
  id: string;
  nome: string;
  email: string;
  perfil: string;
  status: string;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);
  private runtime = inject(RuntimeConfigService);

  getMetricas(startDate?: string, endDate?: string): Observable<AdminMetrics> {
    let url = this.runtime.api('/api/admin/metricas');
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    if (params.toString()) {
      url += '?' + params.toString();
    }
    return this.http.get<AdminMetrics>(url);
  }

  getUsuarios(): Observable<AdminUsuario[]> {
    const url = this.runtime.api('/api/admin/usuarios');
    return this.http.get<AdminUsuario[]>(url);
  }

  toggleUserStatus(userId: string, newStatus: string): Observable<any> {
    const url = this.runtime.api(`/api/admin/usuarios/${userId}/status`);
    return this.http.patch(url, { status: newStatus });
  }
}

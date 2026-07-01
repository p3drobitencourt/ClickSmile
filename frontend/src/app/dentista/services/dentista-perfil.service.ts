import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DentistaPerfilDTO {
  id?: string;
  nome: string;
  especialidade: string;
  bio: string;
  clinica: string;
  telefone?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  latitude?: number;
  longitude?: number;
}

@Injectable({ providedIn: 'root' })
export class DentistaPerfilService {
  constructor(private http: HttpClient) {}

  getPerfil(id: string): Observable<DentistaPerfilDTO> {
    return this.http.get<DentistaPerfilDTO>(`/api/dentistas/${id}/perfil`);
  }

  updatePerfil(id: string, perfil: DentistaPerfilDTO): Observable<DentistaPerfilDTO> {
    return this.http.put<DentistaPerfilDTO>(`/api/dentistas/${id}/perfil`, perfil);
  }
}

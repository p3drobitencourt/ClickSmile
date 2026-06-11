import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface LoginResponse {
  accessToken: string;
  email: string;
  perfil: string;
}

export interface UserProfile {
  id: string;
  email: string;
  perfil: string;
  tenantId: string;
}

export interface RegisterRequest {
  perfil: 'CLIENTE' | 'DENTISTA';
  nome: string;
  email: string;
  senha: string;
  telefone?: string;
  cro?: string;
  especialidade?: string;
  nomeClinica?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = '/api/auth';
  private refreshPromise: Promise<LoginResponse> | null = null;
  private accessToken: string | null = null;
  private role: string | null = null;
  private email: string | null = null;

  constructor(private http: HttpClient) {}

  login(email: string, senha: string) {
    return firstValueFrom(this.http.post<LoginResponse>(`${this.api}/login`, { email, senha }, { withCredentials: true }))
      .then(r => this.setSession(r));
  }

  register(payload: RegisterRequest) {
    return firstValueFrom(this.http.post<LoginResponse>(`${this.api}/register`, payload, { withCredentials: true }))
      .then(r => this.setSession(r));
  }

  logout() {
    this.clearSession();
    return firstValueFrom(this.http.post(`${this.api}/logout`, {}, { withCredentials: true }));
  }

  getAccessToken() {
    return this.accessToken;
  }

  getSubject() {
    if (!this.accessToken) {
      return null;
    }

    try {
      const payloadPart = this.accessToken.split('.')[1];
      const payload = JSON.parse(atob(payloadPart.replace(/-/g, '+').replace(/_/g, '/')));
      return typeof payload.sub === 'string' ? payload.sub : null;
    } catch {
      return null;
    }
  }

  refresh() {
    return firstValueFrom(this.http.post<LoginResponse>(`${this.api}/refresh`, {}, { withCredentials: true }))
      .then(r => this.setSession(r));
  }

  refreshOnce() {
    if (!this.refreshPromise) {
      this.refreshPromise = this.refresh().finally(() => { this.refreshPromise = null; });
    }
    return this.refreshPromise;
  }

  isAuthenticated() {
    return !!this.accessToken;
  }

  getRole() {
    return this.role;
  }

  getEmail() {
    return this.email;
  }

  bootstrapSession() {
    this.role = localStorage.getItem('clicksmile.role');
    this.email = localStorage.getItem('clicksmile.email');
    return this.refreshOnce().catch(() => undefined);
  }

  getProfile(): Promise<UserProfile | null> {
    if (!this.accessToken) {
      return Promise.resolve(null);
    }
    return firstValueFrom(this.http.get<UserProfile>('/api/usuarios/me', {
      headers: { Authorization: `Bearer ${this.accessToken}` }
    })).catch(() => null);
  }

  private setSession(response: LoginResponse) {
    this.accessToken = response.accessToken;
    this.role = response.perfil;
    this.email = response.email;
    localStorage.setItem('clicksmile.role', response.perfil);
    localStorage.setItem('clicksmile.email', response.email);
    return response;
  }

  clearSession() {
    this.accessToken = null;
    this.role = null;
    this.email = null;
    localStorage.removeItem('clicksmile.role');
    localStorage.removeItem('clicksmile.email');
  }
}

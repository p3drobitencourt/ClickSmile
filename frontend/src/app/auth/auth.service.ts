import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface LoginResponse {
  accessToken: string;
  email: string;
  perfil: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = '/api/auth';
  private refreshPromise: Promise<LoginResponse> | null = null;
  private accessToken: string | null = null;

  constructor(private http: HttpClient) {}

  login(email: string, senha: string) {
    return firstValueFrom(this.http.post<LoginResponse>(`${this.api}/login`, { email, senha }, { withCredentials: true }))
      .then(r => {
        this.accessToken = r.accessToken;
        return r;
      });
  }

  logout() {
    this.accessToken = null;
    return firstValueFrom(this.http.post(`${this.api}/logout`, {}, { withCredentials: true }));
  }

  getAccessToken() {
    return this.accessToken;
  }

  refresh() {
    return firstValueFrom(this.http.post<LoginResponse>(`${this.api}/refresh`, {}, { withCredentials: true }))
      .then(r => {
        this.accessToken = r.accessToken;
        return r;
      });
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
}

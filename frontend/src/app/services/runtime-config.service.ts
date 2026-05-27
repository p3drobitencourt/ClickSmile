import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class RuntimeConfigService {
  get backendUrl(): string {
    return environment.apiUrl || 'http://localhost:8080';
  }

  // helper to build API urls
  api(path: string): string {
    const base = this.backendUrl.replace(/\/+$/, '');
    return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
  }
}

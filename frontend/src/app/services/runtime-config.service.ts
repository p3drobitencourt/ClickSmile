import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class RuntimeConfigService {
  private runtime: any;

  constructor() {
    this.runtime = (window as any).__RUNTIME__ || {};
  }

  get backendUrl(): string {
    return this.runtime.backendUrl || 'http://localhost:8080';
  }

  // helper to build API urls
  api(path: string): string {
    const base = this.backendUrl.replace(/\/+$/, '');
    return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
  }
}

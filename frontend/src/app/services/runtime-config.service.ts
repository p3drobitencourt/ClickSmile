import { Injectable } from '@angular/core';

interface RuntimeConfig {
  backendUrl?: string;
  [key: string]: unknown;
}

interface CustomWindow extends Window {
  __RUNTIME__?: RuntimeConfig;
}

@Injectable({ providedIn: 'root' })
export class RuntimeConfigService {
  private runtime: RuntimeConfig;

  constructor() {
    const win = window as unknown as CustomWindow;
    this.runtime = win.__RUNTIME__ || {};
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

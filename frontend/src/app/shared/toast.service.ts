import { Injectable, signal } from '@angular/core';

type ToastTone = 'info' | 'success' | 'warning' | 'error';

export interface ToastMessage {
  id: number;
  title: string;
  message: string;
  tone: ToastTone;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly messages = signal<ToastMessage[]>([]);
  private nextId = 1;

  show(message: string, title = 'Aviso', tone: ToastTone = 'info', ttl = 5000) {
    const item: ToastMessage = {
      id: this.nextId++,
      title,
      message,
      tone,
    };

    this.messages.update((items) => [...items, item]);

    if (ttl > 0) {
      window.setTimeout(() => this.dismiss(item.id), ttl);
    }
  }

  dismiss(id: number) {
    this.messages.update((items) => items.filter((item) => item.id !== id));
  }
}

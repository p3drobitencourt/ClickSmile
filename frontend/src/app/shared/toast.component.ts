import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast-host',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-stack" aria-live="polite" aria-atomic="true">
      <article *ngFor="let toast of toastService.messages(); trackBy: trackById" class="toast" [class]="toast.tone">
        <div>
          <strong>{{ toast.title }}</strong>
          <p>{{ toast.message }}</p>
        </div>
        <button type="button" (click)="toastService.dismiss(toast.id)" aria-label="Fechar aviso">×</button>
      </article>
    </div>
  `,
  styles: [`
    .toast-stack {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 60;
      display: grid;
      gap: 12px;
      max-width: min(92vw, 420px);
    }

    .toast {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 16px;
      padding: 16px 18px;
      border-radius: 18px;
      border: 1px solid rgba(148, 163, 184, 0.18);
      background: rgba(2, 6, 23, 0.92);
      color: #e2e8f0;
      box-shadow: 0 18px 40px rgba(2, 6, 23, 0.32);
      backdrop-filter: blur(18px);
    }

    .toast strong {
      display: block;
      margin-bottom: 4px;
      font-size: 0.95rem;
    }

    .toast p {
      margin: 0;
      color: rgba(226, 232, 240, 0.8);
      line-height: 1.45;
      font-size: 0.92rem;
    }

    .toast button {
      border: 0;
      background: transparent;
      color: inherit;
      cursor: pointer;
      font-size: 1.1rem;
      line-height: 1;
      opacity: 0.8;
    }

    .info { border-left: 4px solid #38bdf8; }
    .success { border-left: 4px solid #34d399; }
    .warning { border-left: 4px solid #fbbf24; }
    .error { border-left: 4px solid #fb7185; }
  `]
})
export class ToastComponent {
  constructor(public toastService: ToastService) {}

  trackById(_: number, item: { id: number }) {
    return item.id;
  }
}

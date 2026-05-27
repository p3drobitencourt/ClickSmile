import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-logo',
  standalone: true,
  template: `
    <span class="logo" [style.width.px]="size" [style.height.px]="size" [attr.aria-label]="label" role="img">
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M12 32c0-11.046 8.954-20 20-20s20 8.954 20 20-8.954 20-20 20S12 43.046 12 32Z" stroke="currentColor" stroke-width="2.4"/>
        <path d="M18 31.5c2.8-7.4 8.7-11.1 14-11.1s11.2 3.7 14 11.1" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>
        <path d="M21.5 35.2c2.6 4.2 6.1 6.3 10.5 6.3s7.9-2.1 10.5-6.3" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/>
        <path d="M18 40.2c2.2 2.1 4.9 3.7 8 4.6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" opacity="0.85"/>
        <path d="M40.3 16.5l5.8 1.1 1.2 5.7 3.7-4.5 5.8 1.1-3.2-4.9 3.7-4.5-5.7-.1-3.2-4.9-1.2 5.7-5.7-.1Z" fill="currentColor" opacity="0.95"/>
      </svg>
    </span>
  `,
  styles: [`
    .logo {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: var(--cs-primary, #22c55e);
      flex: 0 0 auto;
    }

    svg {
      width: 100%;
      height: 100%;
      display: block;
    }
  `]
})
export class LogoComponent {
  @Input() size = 44;
  @Input() label = 'ClickSmile';
}

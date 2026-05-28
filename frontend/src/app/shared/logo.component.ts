import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-logo',
  standalone: true,
  template: `
    <span class="logo" [style.width.px]="size" [style.height.px]="size" [attr.aria-label]="label" role="img">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M7 13c1.5 2 3.5 3 5 3s3.5-1 5-3"></path>
        <path d="M12 4v2"></path>
        <path d="M17.66 6.34l-1.42 1.42"></path>
        <path d="M20 12h-2"></path>
        <path d="M17.66 17.66l-1.42-1.42"></path>
        <path d="M12 20v-2"></path>
        <path d="M6.34 17.66l1.42-1.42"></path>
        <path d="M4 12h2"></path>
        <path d="M6.34 6.34l1.42 1.42"></path>
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

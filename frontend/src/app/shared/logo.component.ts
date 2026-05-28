import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-logo',
  standalone: true,
  template: `
    <span class="logo" [style.width.px]="size" [style.height.px]="size" [attr.aria-label]="label" role="img">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <!-- Sparkle in the top right -->
        <path d="M16 4l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z" fill="currentColor" stroke="none"></path>
        <!-- Smiling mouth -->
        <path d="M7 12c1.5 3 4 5 7 5 3.5 0 5-2.5 5-2.5"></path>
      </svg>
    </span>
  `,
  styles: [`
    .logo {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: var(--cs-success, #10b981);
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

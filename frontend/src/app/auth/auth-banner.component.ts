import { Component } from '@angular/core';

@Component({
  selector: 'app-auth-banner',
  standalone: true,
  template: `
    <section class="auth-banner">
      <p class="eyebrow">Clinic OS</p>
      <h1>Agenda, chat e acesso em um fluxo só.</h1>
      <p>
        ClickSmile foi desenhado para operar em clínicas com múltiplos perfis, com uma camada visual mais forte
        e com experiência de primeira sessão clara para cliente e dentista.
      </p>
      <div class="chips">
        <span>JWT RSA-256</span>
        <span>FullCalendar</span>
        <span>STOMP</span>
        <span>Tailwind UI</span>
      </div>
    </section>
  `,
  styles: [`
    .auth-banner {
      display: grid;
      gap: 14px;
      padding: 28px;
      border-radius: 28px;
      border: 1px solid rgba(148, 163, 184, 0.16);
      background: linear-gradient(180deg, rgba(15, 23, 42, 0.82), rgba(2, 6, 23, 0.72));
      box-shadow: 0 20px 54px rgba(2, 6, 23, 0.3);
    }

    .eyebrow {
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 0.22em;
      font-size: 0.76rem;
      color: #7dd3fc;
    }

    h1 {
      margin: 0;
      max-width: 12ch;
      font-size: clamp(2.6rem, 5vw, 4.4rem);
      line-height: 0.95;
      letter-spacing: -0.08em;
      color: #f8fafc;
    }

    p {
      margin: 0;
      max-width: 54ch;
      color: rgba(226, 232, 240, 0.78);
      line-height: 1.7;
    }

    .chips {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 6px;
    }

    .chips span {
      padding: 9px 12px;
      border-radius: 999px;
      background: rgba(15, 23, 42, 0.78);
      border: 1px solid rgba(148, 163, 184, 0.16);
      color: #dbeafe;
      font-size: 0.86rem;
    }
  `]
})
export class AuthBannerComponent {}

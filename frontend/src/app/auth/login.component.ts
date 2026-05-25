import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <div class="mx-auto mt-12 max-w-md rounded-xl border border-slate-700 bg-slate-900/80 p-6 text-slate-100">
    <h2 class="mb-1 text-2xl">Entrar</h2>
    <p class="mb-4 text-sm text-slate-400">Acesse sua conta ClickSmile</p>
    <form (ngSubmit)="doLogin()">
      <label class="mb-2 block">Email</label>
      <input [(ngModel)]="email" name="email" class="mb-3 w-full rounded border border-slate-600 bg-slate-950 p-2" />
      <label class="mb-2 block">Senha</label>
      <input [(ngModel)]="senha" name="senha" type="password" class="mb-4 w-full rounded border border-slate-600 bg-slate-950 p-2" />
      <p *ngIf="erro" class="mb-3 text-sm text-rose-400">{{ erro }}</p>
      <button [disabled]="loading" class="w-full rounded bg-indigo-600 px-4 py-2 text-white disabled:opacity-60">
        {{ loading ? 'Entrando...' : 'Entrar' }}
      </button>
    </form>
  </div>
  `
})
export class LoginComponent {
  email = '';
  senha = '';
  loading = false;
  erro = '';

  constructor(private auth: AuthService, private router: Router) {}

  doLogin() {
    this.loading = true;
    this.erro = '';
    this.auth.login(this.email, this.senha).then(() => {
      const onboardingConcluido = localStorage.getItem('onboardingConcluido') === 'true';
      this.router.navigateByUrl(onboardingConcluido ? '/' : '/onboarding');
    }).catch(() => {
      this.erro = 'Falha no login. Confira e-mail e senha.';
    }).finally(() => {
      this.loading = false;
    });
  }
}

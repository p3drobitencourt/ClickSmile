import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="mx-auto max-w-3xl p-6 text-slate-100">
      <h1 class="mb-2 text-3xl font-semibold">Onboarding da Clínica</h1>
      <p class="mb-6 text-slate-400">Vamos configurar seu ambiente em menos de 2 minutos.</p>

      <form class="grid gap-4 rounded-xl border border-slate-700 bg-slate-900/70 p-6" (ngSubmit)="concluir()">
        <label class="grid gap-2">
          <span>Nome da clínica</span>
          <input [(ngModel)]="clinica" name="clinica" required class="rounded border border-slate-600 bg-slate-950 p-2" />
        </label>

        <label class="grid gap-2">
          <span>CNPJ</span>
          <input [(ngModel)]="cnpj" name="cnpj" required class="rounded border border-slate-600 bg-slate-950 p-2" />
        </label>

        <label class="grid gap-2">
          <span>Telefone</span>
          <input [(ngModel)]="telefone" name="telefone" required class="rounded border border-slate-600 bg-slate-950 p-2" />
        </label>

        <button class="mt-2 rounded bg-indigo-600 px-4 py-2 font-medium hover:bg-indigo-500" type="submit">
          Concluir e ir para Dashboard
        </button>
      </form>
    </section>
  `
})
export class OnboardingComponent {
  clinica = '';
  cnpj = '';
  telefone = '';

  constructor(private router: Router) {}

  concluir() {
    // Placeholder local until backend onboarding endpoint is implemented.
    localStorage.setItem('onboardingConcluido', 'true');
    this.router.navigateByUrl('/');
  }
}

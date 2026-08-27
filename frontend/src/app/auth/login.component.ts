import { CommonModule } from '@angular/common';
import { Component, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from './auth.service';
import { LogoComponent } from '../shared/logo.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LogoComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  loading = false;
  erro = '';

  form: FormGroup;

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router, private cdr: ChangeDetectorRef) {
    this.form = this.fb.nonNullable.group({
      email: ['', [Validators.required, Validators.email]],
      senha: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  async submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.erro = 'Informe e-mail e senha válidos.';
      return;
    }

    this.loading = true;
    this.erro = '';

    try {
      const value = this.form.getRawValue();
      await this.auth.login(value.email, value.senha);
      const role = this.auth.getRole();
      if (role === 'DENTISTA') {
        await this.router.navigateByUrl('/dentista');
      } else if (role === 'PACIENTE') {
        await this.router.navigateByUrl('/paciente');
      } else if (role === 'RECEPCAO') {
        await this.router.navigateByUrl('/recepcao');
      } else if (role === 'TENANT_ADMIN') {
        await this.router.navigateByUrl('/admin');
      } else {
        await this.router.navigateByUrl('/');
      }
    } catch (err: unknown) {
      const e = err as { error?: { detail?: string; message?: string }, message?: string };
      let msg = e?.error?.detail || e?.error?.message || e?.message || 'Falha no login. Verifique os dados.';
      
      const errResponse = err as any;
      if (errResponse && errResponse.status === 401) {
          msg = 'Credenciais inválidas. Verifique seu e-mail e senha.';
      }

      // Se for um erro de Chunk (nova versão na Vercel), force o reload da página
      if (msg.includes('Failed to fetch dynamically imported module') || msg.includes('ChunkLoadError')) {
         const role = this.auth.getRole();
         if (role === 'DENTISTA') window.location.href = '/dentista';
         else if (role === 'PACIENTE') window.location.href = '/paciente';
         else if (role === 'RECEPCAO') window.location.href = '/recepcao';
         else if (role === 'TENANT_ADMIN') window.location.href = '/admin';
         else window.location.href = '/';
         return;
      }

      this.erro = msg;
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }
}

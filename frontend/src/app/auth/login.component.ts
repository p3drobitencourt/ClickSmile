import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
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

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
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
      await this.router.navigateByUrl(role === 'DENTISTA' ? '/dentista' : '/cliente');
    } catch (err: unknown) {
      const e = err as { error?: { detail?: string; message?: string }, message?: string };
      this.erro = e?.error?.detail || e?.error?.message || e?.message || 'Falha no login. Verifique os dados.';
    } finally {
      this.loading = false;
    }
  }
}

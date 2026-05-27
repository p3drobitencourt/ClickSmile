import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthBannerComponent } from './auth-banner.component';
import { AuthService } from './auth.service';
import { LogoComponent } from '../shared/logo.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, AuthBannerComponent, LogoComponent],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  loading = false;
  erro = '';

  form: FormGroup;

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    this.form = this.fb.nonNullable.group({
      perfil: ['CLIENTE' as 'CLIENTE' | 'DENTISTA', Validators.required],
      nome: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      senha: ['', [Validators.required, Validators.minLength(8)]],
      telefone: [''],
      cro: [''],
      especialidade: [''],
      nomeClinica: [''],
    });
  }

  get perfil() {
    return this.form.get('perfil')?.value;
  }

  async submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.erro = 'Revise os campos obrigatórios para concluir o cadastro.';
      return;
    }

    this.loading = true;
    this.erro = '';

    try {
      const value = this.form.getRawValue();
      await this.auth.register({
        perfil: value.perfil,
        nome: value.nome,
        email: value.email,
        senha: value.senha,
        telefone: value.perfil === 'CLIENTE' ? value.telefone : undefined,
        cro: value.perfil === 'DENTISTA' ? value.cro : undefined,
        especialidade: value.perfil === 'DENTISTA' ? value.especialidade : undefined,
        nomeClinica: value.nomeClinica,
      });

      await this.router.navigateByUrl('/onboarding');
    } catch (err: unknown) {
      const e = err as { error?: { detail?: string; message?: string }, message?: string };
      this.erro = e?.error?.detail || e?.error?.message || e?.message || 'Não foi possível concluir o cadastro.';
    } finally {
      this.loading = false;
    }
  }
}

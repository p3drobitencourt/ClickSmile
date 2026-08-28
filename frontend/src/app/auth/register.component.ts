import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from './auth.service';
import { LogoComponent } from '../shared/logo.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LogoComponent],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent implements OnInit {
  loading = false;
  erro = '';
  clinicas: {id: string, nomeFantasia: string, cnpj: string}[] = [];

  form: FormGroup;

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router, private cdr: ChangeDetectorRef) {
    this.form = this.fb.nonNullable.group({
      perfil: ['PACIENTE' as 'PACIENTE' | 'DENTISTA' | 'RECEPCAO' | 'TENANT_ADMIN', Validators.required],
      nome: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      senha: ['', [Validators.required, Validators.minLength(6)]],
      telefone: ['', [Validators.pattern('^\\d{10,11}$')]],
      cro: [''],
      especialidade: [''],
      nomeClinica: [''],
      cnpj: ['', [Validators.pattern('^\\d{14}$')]],
      tenantId: [''],
      cpf: ['', [Validators.pattern('^\\d{11}$')]]
    });
  }

  get perfil() {
    return this.form.get('perfil')?.value;
  }

  async ngOnInit() {
    try {
      this.clinicas = await this.auth.getClinicas();
    } catch (e) {
      console.error('Erro ao carregar clínicas', e);
    }
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
      const sanitizeNumbers = (val?: string) => val ? val.replace(/\D/g, '') : undefined;
      const value = this.form.getRawValue();
      await this.auth.register({
        perfil: value.perfil,
        nome: value.nome.trim(),
        email: value.email.trim(),
        senha: value.senha,
        telefone: value.perfil === 'PACIENTE' ? sanitizeNumbers(value.telefone) : undefined,
        cro: value.perfil === 'DENTISTA' ? value.cro?.trim() : undefined,
        especialidade: value.perfil === 'DENTISTA' ? value.especialidade?.trim() : undefined,
        nomeClinica: value.perfil !== 'PACIENTE' ? value.nomeClinica?.trim() : undefined,
        cnpj: value.perfil !== 'PACIENTE' ? sanitizeNumbers(value.cnpj) : undefined,
        cpf: value.perfil === 'PACIENTE' ? sanitizeNumbers(value.cpf) : undefined,
        tenantId: value.perfil === 'PACIENTE' ? value.tenantId : undefined,
      });

      if (value.perfil === 'PACIENTE') {
        await this.router.navigateByUrl('/paciente');
      } else if (value.perfil === 'TENANT_ADMIN') {
        await this.router.navigateByUrl('/admin');
      } else {
        await this.router.navigateByUrl('/onboarding');
      }
    } catch (err: unknown) {
      const e = err as { error?: { detail?: string; message?: string }, message?: string };
      const errResponse = err as any;
      let msg = e?.error?.detail || e?.error?.message || e?.message || 'Não foi possível concluir o cadastro.';

      if (errResponse && errResponse.status === 409) {
        msg = 'E-mail ou CNPJ já cadastrado. Verifique os dados e tente novamente.';
      }

      this.erro = msg;
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }
}

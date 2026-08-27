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
      senha: ['', [Validators.required, Validators.minLength(8)]],
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
      const value = this.form.getRawValue();
      await this.auth.register({
        perfil: value.perfil,
        nome: value.nome,
        email: value.email,
        senha: value.senha,
        telefone: value.perfil === 'PACIENTE' ? value.telefone : undefined,
        cro: value.perfil === 'DENTISTA' ? value.cro : undefined,
        especialidade: value.perfil === 'DENTISTA' ? value.especialidade : undefined,
        nomeClinica: value.nomeClinica,
        cnpj: value.perfil === 'DENTISTA' ? value.cnpj : undefined,
        cpf: value.perfil === 'PACIENTE' ? value.cpf : undefined,
        tenantId: undefined, // Ignorar o tenantId do HTML para PACIENTE por segurança (o DTO proíbe injetar tenantId via payload no PACIENTE)
      });

      if (value.perfil === 'PACIENTE') {
        await this.router.navigateByUrl('/paciente');
      } else {
        await this.router.navigateByUrl('/onboarding');
      }
    } catch (err: unknown) {
      const e = err as { error?: { detail?: string; message?: string }, message?: string };
      const errResponse = err as any;
      let msg = e?.error?.detail || e?.error?.message || e?.message || 'Não foi possível concluir o cadastro.';
      
      if (errResponse && errResponse.status === 409) {
          msg = 'E-mail já cadastrado. Tente recuperar sua senha ou usar outro e-mail.';
      } else if (errResponse && errResponse.status === 400) {
          msg = 'Dados inválidos. Verifique se o CPF, CNPJ ou Telefone contêm apenas números e têm o tamanho correto.';
      }
      
      this.erro = msg;
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }
}

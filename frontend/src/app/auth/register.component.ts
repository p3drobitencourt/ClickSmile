import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from './auth.service';
import { LogoComponent } from '../shared/logo.component';
import { Subscription } from 'rxjs';

export function sanitizedPhoneValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;
    const digits = value.replace(/\D/g, '');
    if (digits.length === 10 || digits.length === 11) return null;
    return { invalidPhone: true };
  };
}

export function sanitizedCnpjValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;
    const digits = value.replace(/\D/g, '');
    if (digits.length === 14) return null;
    return { invalidCnpj: true };
  };
}

export function sanitizedCpfValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;
    const digits = value.replace(/\D/g, '');
    if (digits.length === 11) return null;
    return { invalidCpf: true };
  };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LogoComponent],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent implements OnInit, OnDestroy {
  loading = false;
  erro = '';
  clinicas: {id: string, nomeFantasia: string, cnpj: string}[] = [];

  form: FormGroup;
  private sub: Subscription;

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router, private cdr: ChangeDetectorRef) {
    this.form = this.fb.nonNullable.group({
      perfil: ['PACIENTE' as 'PACIENTE' | 'DENTISTA' | 'RECEPCAO' | 'TENANT_ADMIN', Validators.required],
      nome: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      senha: ['', [Validators.required, Validators.minLength(6)]],
      telefone: [''],
      cro: [''],
      especialidade: [''],
      nomeClinica: [''],
      cnpj: [''],
      tenantId: [''],
      cpf: ['', [sanitizedCpfValidator()]]
    });

    this.sub = this.form.get('perfil')!.valueChanges.subscribe(perfil => {
      this.updateConditionalValidators(perfil);
    });
    
    this.updateConditionalValidators(this.perfil);
  }

  ngOnDestroy() {
    if (this.sub) this.sub.unsubscribe();
  }

  private updateConditionalValidators(perfil: string) {
    const telefone = this.form.get('telefone');
    const tenantId = this.form.get('tenantId');
    const cro = this.form.get('cro');
    const especialidade = this.form.get('especialidade');
    const nomeClinica = this.form.get('nomeClinica');
    const cnpj = this.form.get('cnpj');
    
    telefone?.clearValidators();
    tenantId?.clearValidators();
    cro?.clearValidators();
    especialidade?.clearValidators();
    nomeClinica?.clearValidators();
    cnpj?.clearValidators();

    if (perfil === 'PACIENTE') {
      telefone?.setValidators([Validators.required, sanitizedPhoneValidator()]);
      tenantId?.setValidators([Validators.required]);
    } else if (perfil === 'DENTISTA') {
      nomeClinica?.setValidators([Validators.required]);
      cnpj?.setValidators([Validators.required, sanitizedCnpjValidator()]);
      cro?.setValidators([Validators.required]);
      especialidade?.setValidators([Validators.required]);
    } else if (perfil === 'TENANT_ADMIN') {
      nomeClinica?.setValidators([Validators.required]);
      cnpj?.setValidators([Validators.required, sanitizedCnpjValidator()]);
    }

    telefone?.updateValueAndValidity();
    tenantId?.updateValueAndValidity();
    cro?.updateValueAndValidity();
    especialidade?.updateValueAndValidity();
    nomeClinica?.updateValueAndValidity();
    cnpj?.updateValueAndValidity();
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

      // Removida a conversão genérica do 409 para dar prioridade à mensagem real do backend (CRO, CNPJ, Email, etc.)
      
      this.erro = msg;
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }
}

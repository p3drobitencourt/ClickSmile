import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegisterComponent } from './register.component';
import { ReactiveFormsModule } from '@angular/forms';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { expect, vi } from 'vitest';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let authServiceSpy: any;
  let routerSpy: any;

  beforeEach(async () => {
    authServiceSpy = {
      getClinicas: vi.fn().mockResolvedValue([{ id: '123', nomeFantasia: 'Clinica Teste', cnpj: '11111111111111' }]),
      register: vi.fn().mockResolvedValue(undefined)
    };
    routerSpy = {
      navigateByUrl: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, RegisterComponent],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('A) PACIENTE com todos os campos válidos e telefone formatado => formulário válido', () => {
    component.form.patchValue({
      perfil: 'PACIENTE',
      nome: 'Teste Paciente',
      email: 'teste@gmail.com',
      senha: 'password123',
      telefone: '(11) 99999-9999',
      tenantId: '123'
    });
    expect(component.form.valid).toBe(true);
  });

  it('B) PACIENTE com telefone "11999999999" => formulário válido', () => {
    component.form.patchValue({
      perfil: 'PACIENTE',
      nome: 'Teste Paciente',
      email: 'teste@gmail.com',
      senha: 'password123',
      telefone: '11999999999',
      tenantId: '123'
    });
    expect(component.form.valid).toBe(true);
  });

  it('C) PACIENTE com telefone "(11) 999" => formulário inválido', () => {
    component.form.patchValue({
      perfil: 'PACIENTE',
      nome: 'Teste Paciente',
      email: 'teste@gmail.com',
      senha: 'password123',
      telefone: '(11) 999',
      tenantId: '123'
    });
    expect(component.form.valid).toBe(false);
    expect(component.form.get('telefone')?.hasError('invalidPhone')).toBe(true);
  });

  it('D) PACIENTE sem telefone => formulário inválido', () => {
    component.form.patchValue({
      perfil: 'PACIENTE',
      nome: 'Teste Paciente',
      email: 'teste@gmail.com',
      senha: 'password123',
      telefone: '',
      tenantId: '123'
    });
    expect(component.form.valid).toBe(false);
    expect(component.form.get('telefone')?.hasError('required')).toBe(true);
  });

  it('E) PACIENTE sem clínica (tenantId) => formulário inválido', () => {
    component.form.patchValue({
      perfil: 'PACIENTE',
      nome: 'Teste Paciente',
      email: 'teste@gmail.com',
      senha: 'password123',
      telefone: '11999999999',
      tenantId: ''
    });
    expect(component.form.valid).toBe(false);
    expect(component.form.get('tenantId')?.hasError('required')).toBe(true);
  });

  it('F) O payload enviado por auth.register() deve conter telefone sanitizado', async () => {
    component.form.patchValue({
      perfil: 'PACIENTE',
      nome: 'Teste Paciente',
      email: 'teste@gmail.com',
      senha: 'password123',
      telefone: '(11) 99999-9999',
      tenantId: '123'
    });
    
    await component.submit();

    expect(authServiceSpy.register).toHaveBeenCalledWith(expect.objectContaining({
      telefone: '11999999999',
      tenantId: '123'
    }));
  });

  it('G) TENANT_ADMIN sem nomeClinica/CNPJ => formulário inválido', () => {
    component.form.patchValue({
      perfil: 'TENANT_ADMIN',
      nome: 'Teste Admin',
      email: 'admin@gmail.com',
      senha: 'password123'
    });
    expect(component.form.valid).toBe(false);
    expect(component.form.get('nomeClinica')?.hasError('required')).toBe(true);
    expect(component.form.get('cnpj')?.hasError('required')).toBe(true);
  });

  it('H) DENTISTA sem CRO/especialidade => formulário inválido', () => {
    component.form.patchValue({
      perfil: 'DENTISTA',
      nome: 'Teste Dentista',
      email: 'dentista@gmail.com',
      senha: 'password123',
      nomeClinica: 'Clinica A',
      cnpj: '11111111111111'
    });
    expect(component.form.valid).toBe(false);
    expect(component.form.get('cro')?.hasError('required')).toBe(true);
    expect(component.form.get('especialidade')?.hasError('required')).toBe(true);
  });

  it('I) Campos específicos de outro perfil ocultos não devem tornar o formulário inválido', () => {
    component.form.patchValue({
      perfil: 'PACIENTE',
      nome: 'Teste Paciente',
      email: 'teste@gmail.com',
      senha: 'password123',
      telefone: '11999999999',
      tenantId: '123',
      cro: '',
      especialidade: '',
      nomeClinica: '',
      cnpj: ''
    });
    expect(component.form.valid).toBe(true);
  });

  it('J) status 409 + detail "Já existe um dentista com este CRO." => exibe exatamente essa mensagem', async () => {
    authServiceSpy.register.mockRejectedValue({ status: 409, error: { detail: 'Já existe um dentista com este CRO.' } });
    component.form.patchValue({ perfil: 'DENTISTA', nome: 'A', email: 'a@a.com', senha: '123', cro: 'CRO-123', especialidade: 'Ortodontia', nomeClinica: 'B', cnpj: '11111111111111' });
    
    await component.submit();

    expect(component.erro).toBe('Já existe um dentista com este CRO.');
  });

  it('K) status 409 + detail "Já existe uma clínica com este CNPJ." => exibe exatamente essa mensagem', async () => {
    authServiceSpy.register.mockRejectedValue({ status: 409, error: { detail: 'Já existe uma clínica com este CNPJ.' } });
    component.form.patchValue({ perfil: 'DENTISTA', nome: 'A', email: 'a@a.com', senha: '123', cro: 'CRO-123', especialidade: 'Ortodontia', nomeClinica: 'B', cnpj: '11111111111111' });
    
    await component.submit();

    expect(component.erro).toBe('Já existe uma clínica com este CNPJ.');
  });

  it('L) status 409 + detail "Já existe um usuário com este e-mail." => exibe exatamente essa mensagem', async () => {
    authServiceSpy.register.mockRejectedValue({ status: 409, error: { detail: 'Já existe um usuário com este e-mail.' } });
    component.form.patchValue({ perfil: 'DENTISTA', nome: 'A', email: 'a@a.com', senha: '123', cro: 'CRO-123', especialidade: 'Ortodontia', nomeClinica: 'B', cnpj: '11111111111111' });
    
    await component.submit();

    expect(component.erro).toBe('Já existe um usuário com este e-mail.');
  });
});

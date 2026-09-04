import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-perfil-paciente',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-cs-bg min-h-screen p-6">
      <div class="bg-cs-surface border border-cs-border rounded-lg shadow-md p-8 max-w-4xl mx-auto">
        <h2 class="text-2xl font-bold mb-8 text-cs-text">Configurações de Perfil</h2>
        
        <form class="space-y-8">
          <!-- Seção: Dados Pessoais -->
          <div>
            <h3 class="text-lg font-semibold text-cs-text border-b border-cs-border pb-2 mb-4">Dados Pessoais</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="flex flex-col gap-2">
                <label for="nome" class="text-cs-text text-sm font-medium">Nome Completo</label>
                <input type="text" id="nome" name="nome" placeholder="Seu nome" class="bg-cs-bg border border-cs-border text-cs-text rounded-md p-2.5 focus:ring-2 focus:ring-cs-primary outline-none">
              </div>
              <div class="flex flex-col gap-1">
                <label for="email" class="text-sm font-medium text-cs-muted">Email</label>
                <input type="email" id="email" name="email" placeholder="seu@email.com" class="bg-cs-bg border border-cs-border text-cs-text rounded-md p-2.5 focus:ring-2 focus:ring-cs-primary outline-none">
              </div>
              <div class="flex flex-col gap-1">
                <label for="telefone" class="text-sm font-medium text-cs-muted">Telefone</label>
                <input type="text" id="telefone" name="telefone" placeholder="(00) 00000-0000" class="bg-cs-bg border border-cs-border text-cs-text rounded-md p-2.5 focus:ring-2 focus:ring-cs-primary outline-none">
              </div>
              <div class="flex flex-col gap-1">
                <label for="nascimento" class="text-sm font-medium text-cs-muted">Data de Nascimento</label>
                <input type="date" id="nascimento" name="nascimento" class="bg-cs-bg border border-cs-border text-cs-text rounded-md p-2.5 focus:ring-2 focus:ring-cs-primary outline-none [color-scheme:dark]">
              </div>
            </div>
          </div>

          <!-- Seção: Endereço -->
          <div>
            <h3 class="text-lg font-semibold text-cs-text border-b border-cs-border pb-2 mb-4">Endereço</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div class="flex flex-col gap-2 md:col-span-1">
                <label for="cep" class="text-cs-text text-sm font-medium">CEP</label>
                <input type="text" id="cep" name="cep" placeholder="00000-000" class="bg-cs-bg border border-cs-border text-cs-text rounded-md p-2.5 focus:ring-2 focus:ring-cs-primary outline-none">
              </div>
              <div class="flex flex-col gap-1 md:col-span-2">
                <label for="rua" class="text-sm font-medium text-cs-muted">Rua</label>
                <input type="text" id="rua" name="rua" placeholder="Nome da rua" class="bg-cs-bg border border-cs-border text-cs-text rounded-md p-2.5 focus:ring-2 focus:ring-cs-primary outline-none">
              </div>
              <div class="flex flex-col gap-1">
                <label for="numero" class="text-sm font-medium text-cs-muted">Número</label>
                <input type="text" id="numero" name="numero" placeholder="123" class="bg-cs-bg border border-cs-border text-cs-text rounded-md p-2.5 focus:ring-2 focus:ring-cs-primary outline-none">
              </div>
              <div class="flex flex-col gap-1 md:col-span-2">
                <label for="bairro" class="text-sm font-medium text-cs-muted">Bairro</label>
                <input type="text" id="bairro" name="bairro" placeholder="Seu bairro" class="bg-cs-bg border border-cs-border text-cs-text rounded-md p-2.5 focus:ring-2 focus:ring-cs-primary outline-none">
              </div>
              <div class="flex flex-col gap-1 md:col-span-3">
                <label for="cidade" class="text-sm font-medium text-cs-muted">Cidade e UF</label>
                <div class="flex gap-2">
                  <input type="text" id="cidade" name="cidade" placeholder="Cidade" class="flex-1 bg-cs-bg border border-cs-border text-cs-text rounded-md p-2.5 focus:ring-2 focus:ring-cs-primary outline-none">
                  <input type="text" id="estado" name="estado" placeholder="UF" maxlength="2" class="w-16 bg-cs-bg border border-cs-border text-cs-text rounded-md p-2.5 focus:ring-2 focus:ring-cs-primary outline-none text-center">
                </div>
              </div>
            </div>
          </div>

          <!-- Botão de Salvar -->
          <div class="flex justify-end pt-4">
            <button type="button" class="bg-cs-primary hover:bg-cs-primary-hover text-white font-semibold py-2 px-6 rounded shadow cursor-pointer border-none transition-colors">
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class PerfilPacienteComponent {}

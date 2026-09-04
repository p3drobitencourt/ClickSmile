import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard-paciente',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="bg-cs-bg text-cs-text min-h-screen p-6">
      <h1 class="text-2xl font-bold mb-6">Olá! Bem-vindo(a) ao ClickSmile.</h1>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div class="bg-cs-surface border border-cs-border rounded-xl shadow-md p-6 flex flex-col items-center text-center">
          <div class="w-16 h-16 rounded-full bg-cs-primary/20 text-cs-primary flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          <h2 class="text-lg font-bold mb-2">Buscar Dentistas</h2>
          <p class="text-sm text-cs-muted mb-4">Encontre profissionais qualificados próximos a você e agende sua consulta online.</p>
          <a routerLink="/paciente/buscar" class="mt-auto bg-cs-primary hover:bg-cs-primary-hover text-white py-2 px-6 rounded font-semibold no-underline w-full transition-colors">
            Iniciar Busca
          </a>
        </div>

        <div class="bg-cs-surface border border-cs-border rounded-xl shadow-md p-6 flex flex-col items-center text-center">
          <div class="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </div>
          <h2 class="text-lg font-bold mb-2">Minhas Consultas</h2>
          <p class="text-sm text-cs-muted mb-4">Acompanhe seus próximos agendamentos e gerencie seu tratamento.</p>
          <a routerLink="/paciente/consultas" class="mt-auto bg-emerald-600 hover:bg-emerald-500 text-white py-2 px-6 rounded font-semibold no-underline w-full transition-colors">
            Ver Agenda
          </a>
        </div>

        <div class="bg-cs-surface border border-cs-border rounded-xl shadow-md p-6 flex flex-col items-center text-center">
          <div class="w-16 h-16 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
          </div>
          <h2 class="text-lg font-bold mb-2">Mensagens</h2>
          <p class="text-sm text-cs-muted mb-4">Converse com dentistas, tire dúvidas e negocie orçamentos antes da consulta.</p>
          <a routerLink="/paciente/chat" class="mt-auto bg-blue-600 hover:bg-blue-500 text-white py-2 px-6 rounded font-semibold no-underline w-full transition-colors">
            Abrir Chat
          </a>
        </div>
      </div>
    </div>
  `
})
export class DashboardPacienteComponent {}

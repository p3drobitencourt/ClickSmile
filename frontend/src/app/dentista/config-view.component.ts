import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DentistaPerfilService, DentistaPerfilDTO } from './services/dentista-perfil.service';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-config-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="dashboard-container">
      <header class="hero-panel" style="margin-bottom: 24px;">
        <div>
          <p class="eyebrow">Configurações</p>
          <h1>Perfil do Especialista</h1>
        </div>
      </header>

      <div *ngIf="loading" class="loading-skeleton">
        <span class="spinner" style="width: 32px; height: 32px; border-width: 3px; border-top-color: #38bdf8;"></span>
        <p>Carregando informações do perfil...</p>
      </div>

      <div class="settings-grid" *ngIf="!loading">
        <article class="surface-panel config-panel">
          <h3>Informações Pessoais</h3>
          
          <div class="input-group">
            <label>Nome Completo</label>
            <input type="text" [(ngModel)]="perfil.nome" placeholder="Dr. João Silva" />
          </div>

          <div class="input-group">
            <label>Especialidade</label>
            <input type="text" [(ngModel)]="perfil.especialidade" placeholder="Ortodontista, Implantodontista..." />
          </div>

          <div class="input-group">
            <label>Breve Biografia</label>
            <textarea [(ngModel)]="perfil.bio" rows="3" placeholder="Fale um pouco sobre sua experiência..."></textarea>
          </div>
        </article>

        <article class="surface-panel config-panel">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
            <h3 style="margin: 0;">Dados da Clínica</h3>
            <button class="btn-primary" (click)="salvar()" [disabled]="saving">
              <span *ngIf="saving" class="spinner"></span>
              {{ saving ? 'Salvando...' : 'Salvar Perfil' }}
            </button>
          </div>
          
          <div class="input-group">
            <label>Nome da Clínica</label>
            <input type="text" [(ngModel)]="perfil.clinica" placeholder="Sorriso Metálico Odontologia" />
          </div>

          <div class="input-group">
            <label>Telefone de Contato</label>
            <input type="tel" [(ngModel)]="perfil.telefone" placeholder="(11) 99999-9999" />
          </div>

          <div class="input-group">
            <label>Endereço Completo</label>
            <input type="text" [(ngModel)]="perfil.endereco" placeholder="Av. Paulista, 1000 - Bela Vista, São Paulo - SP" />
          </div>
        </article>
      </div>
    </div>
  `,
  styleUrl: './dentista-theme.scss'
})
export class ConfigViewComponent implements OnInit {
  loading = true;
  saving = false;
  dentistaId = '';
  
  perfil: DentistaPerfilDTO = {
    nome: '',
    especialidade: '',
    bio: '',
    clinica: '',
    telefone: '',
    endereco: ''
  };

  private perfilService = inject(DentistaPerfilService);
  private authService = inject(AuthService);

  async ngOnInit() {
    this.dentistaId = this.authService.getSubject() || '';
    if (this.dentistaId) {
      this.perfilService.getPerfil(this.dentistaId).subscribe({
        next: (data) => {
          if (data) {
            this.perfil = { ...this.perfil, ...data };
          }
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        }
      });
    } else {
      this.loading = false;
    }
  }

  salvar() {
    if (!this.dentistaId) return;
    this.saving = true;
    this.perfilService.updatePerfil(this.dentistaId, this.perfil).subscribe({
      next: (data) => {
        this.perfil = { ...this.perfil, ...data };
        this.saving = false;
      },
      error: () => {
        this.saving = false;
      }
    });
  }
}

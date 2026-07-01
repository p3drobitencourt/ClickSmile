import { Component, OnInit, inject, ChangeDetectorRef, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, switchMap, takeUntil } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { DentistaPerfilService, DentistaPerfilDTO } from './services/dentista-perfil.service';
import { AuthService } from '../auth/auth.service';
import { ViaCepService } from '../services/viacep.service';
import { NominatimService } from '../services/nominatim.service';

@Component({
  selector: 'app-config-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="dashboard-container max-w-4xl mx-auto p-4 lg:p-8">
      <header class="mb-8">
        <div>
          <p class="text-sm font-semibold text-blue-600 uppercase tracking-wider">Configurações</p>
          <h1 class="text-3xl font-bold text-slate-800 mt-1">Perfil do Especialista</h1>
        </div>
      </header>

      <div *ngIf="loading" class="flex flex-col items-center justify-center py-12 gap-4">
        <span class="spinner w-8 h-8 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin"></span>
        <p class="text-slate-500 font-medium">Carregando informações do perfil...</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6" *ngIf="!loading">
        <!-- Coluna Esquerda: Dados Principais -->
        <div class="flex flex-col gap-6">
          <article class="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 class="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Informações Pessoais</h3>
            
            <div class="flex flex-col gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
                <input type="text" [(ngModel)]="perfil.nome" placeholder="Dr. João Silva" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Especialidade</label>
                <input type="text" [(ngModel)]="perfil.especialidade" placeholder="Ortodontista, Implantodontista..." class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Breve Biografia</label>
                <textarea [(ngModel)]="perfil.bio" rows="3" placeholder="Fale um pouco sobre sua experiência..." class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"></textarea>
              </div>
            </div>
          </article>

          <article class="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 class="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Dados da Clínica</h3>
            
            <div class="flex flex-col gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Nome da Clínica</label>
                <input type="text" [(ngModel)]="perfil.clinica" placeholder="Sorriso Metálico Odontologia" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Telefone de Contato</label>
                <input type="tel" [(ngModel)]="perfil.telefone" placeholder="(11) 99999-9999" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
              </div>
            </div>
          </article>
        </div>

        <!-- Coluna Direita: Endereço -->
        <article class="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit">
          <div class="flex justify-between items-center border-b border-slate-100 pb-2 mb-4">
            <h3 class="text-lg font-bold text-slate-800">Endereço e Localização</h3>
            
            <!-- Indicador de Geo -->
            <div class="flex items-center gap-2 text-xs font-medium px-2 py-1 rounded-md"
                 [ngClass]="(perfil.latitude && perfil.longitude) ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'">
              <span class="relative flex h-2 w-2" *ngIf="geoLoading">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              <svg *ngIf="!geoLoading" xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
              </svg>
              {{ geoLoading ? 'Buscando...' : (perfil.latitude ? 'Geolocalizado' : 'Não localizado') }}
            </div>
          </div>
          
          <div class="flex flex-col gap-4">
            <div class="w-1/2">
              <label class="block text-sm font-medium text-slate-700 mb-1">CEP</label>
              <input type="text" [(ngModel)]="perfil.cep" (blur)="onCepBlur()" placeholder="00000-000" maxlength="9" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
              <p *ngIf="cepLoading" class="text-xs text-blue-600 mt-1">Buscando CEP...</p>
            </div>

            <div class="grid grid-cols-12 gap-3">
              <div class="col-span-9">
                <label class="block text-sm font-medium text-slate-700 mb-1">Rua / Logradouro</label>
                <input type="text" [(ngModel)]="perfil.logradouro" (ngModelChange)="onAddressChange()" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
              </div>
              <div class="col-span-3">
                <label class="block text-sm font-medium text-slate-700 mb-1">Número</label>
                <input type="text" [(ngModel)]="perfil.numero" (ngModelChange)="onAddressChange()" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Complemento</label>
              <input type="text" [(ngModel)]="perfil.complemento" placeholder="Sala, Andar, etc." class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
            </div>

            <div class="grid grid-cols-12 gap-3">
              <div class="col-span-5">
                <label class="block text-sm font-medium text-slate-700 mb-1">Bairro</label>
                <input type="text" [(ngModel)]="perfil.bairro" (ngModelChange)="onAddressChange()" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
              </div>
              <div class="col-span-5">
                <label class="block text-sm font-medium text-slate-700 mb-1">Cidade</label>
                <input type="text" [(ngModel)]="perfil.cidade" (ngModelChange)="onAddressChange()" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
              </div>
              <div class="col-span-2">
                <label class="block text-sm font-medium text-slate-700 mb-1">UF</label>
                <input type="text" [(ngModel)]="perfil.estado" (ngModelChange)="onAddressChange()" maxlength="2" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
              </div>
            </div>

            <!-- Coordenadas Hidden (apenas para verificação de desenvolvimento, idealmente oculto ou readonly) -->
            <div class="mt-2 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-500">
              <div class="flex justify-between items-center mb-1">
                <strong>Coordenadas Atuais</strong>
                <button type="button" class="text-blue-600 hover:underline" (click)="triggerGeocodeNow()" [disabled]="geoLoading">Atualizar Local</button>
              </div>
              <div>Lat: {{ perfil.latitude || 'N/D' }}</div>
              <div>Lon: {{ perfil.longitude || 'N/D' }}</div>
            </div>

            <button class="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm" (click)="salvar()" [disabled]="saving">
              <svg *ngIf="saving" class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>{{ saving ? 'Salvando...' : 'Salvar Alterações' }}</span>
            </button>
          </div>
        </article>
      </div>
    </div>
  `
})
export class ConfigViewComponent implements OnInit {
  loading = true;
  saving = false;
  cepLoading = false;
  geoLoading = false;
  dentistaId = '';
  
  perfil: DentistaPerfilDTO = {
    nome: '',
    especialidade: '',
    bio: '',
    clinica: '',
    telefone: '',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: ''
  };

  private addressSubject = new Subject<void>();
  
  private perfilService = inject(DentistaPerfilService);
  private authService = inject(AuthService);
  private viaCepService = inject(ViaCepService);
  private nominatimService = inject(NominatimService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  ngOnInit() {
    this.dentistaId = this.authService.getSubject() || '';
    if (this.dentistaId) {
      this.perfilService.getPerfil(this.dentistaId).pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({
        next: (data) => {
          if (data) {
            this.perfil = { ...this.perfil, ...data };
          }
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error fetching perfil:', err);
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      this.loading = false;
      this.cdr.detectChanges();
    }

    // Pipeline para geolocalização automática via Nominatim
    this.addressSubject.pipe(
      takeUntilDestroyed(this.destroyRef),
      debounceTime(1500),
      filter(() => this.isAddressComplete()),
      switchMap(() => {
        this.geoLoading = true;
        this.cdr.detectChanges();
        const addressQuery = `${this.perfil.logradouro}, ${this.perfil.numero}, ${this.perfil.bairro}, ${this.perfil.cidade}, ${this.perfil.estado}, Brasil`;
        return this.nominatimService.buscarCoordenadas(addressQuery);
      })
    ).subscribe({
      next: (results) => {
        if (results && results.length > 0) {
          this.perfil.latitude = parseFloat(results[0].lat);
          this.perfil.longitude = parseFloat(results[0].lon);
        } else {
          console.warn('Geocodificação não encontrou resultados exatos.');
        }
        this.geoLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erro no Nominatim:', err);
        this.geoLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onCepBlur() {
    if (!this.perfil.cep) return;
    const clean = this.perfil.cep.replace(/\D/g, '');
    if (clean.length === 8) {
      this.cepLoading = true;
      this.viaCepService.buscarCep(clean).subscribe({
        next: (res) => {
          if (!res.erro) {
            this.perfil.logradouro = res.logradouro;
            this.perfil.bairro = res.bairro;
            this.perfil.cidade = res.localidade;
            this.perfil.estado = res.uf;
            this.onAddressChange(); // Dispara check de geolocalização se o número já estiver preenchido
          }
          this.cepLoading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.cepLoading = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  onAddressChange() {
    this.addressSubject.next();
  }

  triggerGeocodeNow() {
    if (this.isAddressComplete()) {
      this.addressSubject.next();
    }
  }

  isAddressComplete(): boolean {
    return !!(this.perfil.logradouro && this.perfil.numero && this.perfil.bairro && this.perfil.cidade && this.perfil.estado);
  }

  salvar() {
    if (!this.dentistaId) return;
    this.saving = true;
    this.perfilService.updatePerfil(this.dentistaId, this.perfil).subscribe({
      next: (data) => {
        this.perfil = { ...this.perfil, ...data };
        this.saving = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.saving = false;
        this.cdr.detectChanges();
      }
    });
  }
}

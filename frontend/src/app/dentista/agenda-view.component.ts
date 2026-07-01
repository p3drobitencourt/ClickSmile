import { Component, OnInit, inject, DestroyRef, ChangeDetectorRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { AgendaAdminService, AgendaFormPayload } from '../services/agenda-admin.service';
import { AuthService } from '../auth/auth.service';
import { DentistaAgendaComponent } from './components/dentista-agenda.component';
import { ChatService, ChatMessageView, SessaoChatStatus } from '../services/chat.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-agenda-view',
  standalone: true,
  imports: [CommonModule, FormsModule, DentistaAgendaComponent],
  template: `
    <div class="dashboard-container" style="display:flex; gap: 24px;">
      <div style="flex: 2;">
        <header class="hero-panel" style="margin-bottom: 24px;">
          <div>
            <p class="eyebrow">Agenda</p>
            <h1>Agenda Semanal</h1>
          </div>
        </header>
        <div class="agenda-wrapper">
          <div *ngIf="loading" class="loading-skeleton">
            <span class="spinner" style="width: 32px; height: 32px; border-width: 3px; border-top-color: #38bdf8;"></span>
            <p>Carregando informações...</p>
          </div>
          
          <div *ngIf="errorMessage" class="error-panel" style="background: #fee2e2; border: 1px solid #ef4444; color: #b91c1c; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin-top: 0;">Erro na comunicação com o servidor</h3>
            <p>Copie o texto abaixo e envie para análise:</p>
            <pre style="background: #f87171; color: #fff; padding: 12px; border-radius: 4px; overflow-x: auto; font-size: 12px;">{{ errorMessage }}</pre>
            <button (click)="load()" class="btn-primary" style="margin-top: 12px;">Tentar Novamente</button>
          </div>

          <app-dentista-agenda 
            *ngIf="!loading && !errorMessage"
            [loading]="loading" 
            [saving]="saving" 
            [dentistaId]="dentistaId" 
            [payload]="payload"
            (onSave)="saveAgenda($event)">
          </app-dentista-agenda>
        </div>
      </div>

      <div style="flex: 1; display:flex; flex-direction:column; gap: 16px;">
        <header class="hero-panel" style="padding: 1.5rem;">
          <div>
            <p class="eyebrow">Mensagens</p>
            <h2>Chat Online</h2>
          </div>
        </header>
        
        <article class="surface-panel" style="display:flex; flex-direction:column; height: 500px; padding:0;">
          <div *ngIf="activeChats.length === 0" style="padding: 2rem; text-align: center; color: #64748b; margin: auto;">
            Nenhuma solicitação de chat no momento.
          </div>
          
          <div *ngIf="activeChats.length > 0" style="display:flex; flex-direction:column; height: 100%;">
            <div style="display:flex; border-bottom: 1px solid #e2e8f0; overflow-x: auto; padding: 8px;">
              <button *ngFor="let chatId of activeChats" 
                      (click)="selectChat(chatId)"
                      [style.background]="selectedChatId === chatId ? '#e0f2fe' : 'transparent'"
                      [style.border]="'none'"
                      [style.padding]="'8px 12px'"
                      [style.borderRadius]="'6px'"
                      [style.cursor]="'pointer'"
                      [style.fontWeight]="selectedChatId === chatId ? 'bold' : 'normal'"
                      [style.color]="selectedChatId === chatId ? '#0284c7' : '#475569'">
                {{ chatRooms[chatId].clienteNome || 'Cliente' }}
              </button>
            </div>
            
            <div *ngIf="selectedChatId" style="flex:1; overflow-y:auto; padding: 16px; display:flex; flex-direction:column; gap: 8px;">
              <div *ngFor="let msg of chatRooms[selectedChatId].messages"
                   [style.alignSelf]="msg.mine ? 'flex-end' : 'flex-start'"
                   [style.background]="msg.isSystem ? 'transparent' : (msg.mine ? '#38bdf8' : '#f1f5f9')"
                   [style.color]="msg.isSystem ? '#94a3b8' : (msg.mine ? '#fff' : '#1e293b')"
                   [style.padding]="msg.isSystem ? '4px' : '8px 12px'"
                   [style.borderRadius]="'12px'"
                   [style.fontSize]="msg.isSystem ? '12px' : '14px'"
                   [style.maxWidth]="'80%'">
                <strong *ngIf="!msg.isSystem && !msg.mine" style="font-size: 11px; display:block; color:#64748b;">{{ msg.senderName }}</strong>
                {{ msg.message }}
              </div>
            </div>
            
            <form *ngIf="selectedChatId" (ngSubmit)="sendMessage()" style="display:flex; padding: 12px; border-top: 1px solid #e2e8f0; gap: 8px;">
              <input type="text" name="chatMsg" [(ngModel)]="draftMessage" placeholder="Escreva a resposta..." style="flex:1; padding: 8px; border: 1px solid #cbd5e1; border-radius: 6px;" autocomplete="off" />
              <button type="submit" class="btn-primary" [disabled]="!draftMessage.trim()">Enviar</button>
            </form>
          </div>
        </article>
      </div>
    </div>
  `,
  styleUrl: './dentista-theme.scss'
})
export class AgendaViewComponent implements OnInit {
  loading = true;
  saving = false;
  dentistaId = '';
  errorMessage = '';
  payload: AgendaFormPayload = {
    dentistaId: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo',
    slotDurationMin: 30,
    horaInicioPadrao: '08:00',
    horaFimPadrao: '18:00',
    regras: [],
  };

  weekdays = ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY'];

  activeChats: string[] = [];
  chatRooms: Record<string, { clienteNome: string; messages: ChatMessageView[] }> = {};
  selectedChatId: string | null = null;
  draftMessage = '';

  private service = inject(AgendaAdminService);
  private chatService = inject(ChatService);
  private auth = inject(AuthService);
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.dentistaId = this.auth.getSubject() ?? '';
    
    if(this.dentistaId) {
      this.load();
      this.listenToChats();
    } else {
      this.errorMessage = 'Erro: Não foi possível obter o ID do dentista (Token inválido ou não autenticado).';
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  private listenToChats() {
    this.chatService.connectDentista(this.dentistaId).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(update => {
       if (update) {
         if (!this.activeChats.includes(update.roomId)) {
           this.activeChats.push(update.roomId);
           this.chatRooms[update.roomId] = { clienteNome: update.clienteNome, messages: [] };
         }
         this.chatRooms[update.roomId].messages = update.messages;
         if (!this.selectedChatId) {
           this.selectedChatId = update.roomId;
         }
         this.cdr.detectChanges();
       }
    });
  }

  selectChat(chatId: string) {
    this.selectedChatId = chatId;
  }

  sendMessage() {
    if (!this.selectedChatId || !this.draftMessage.trim()) return;
    this.chatService.send(
      this.selectedChatId,
      this.dentistaId,
      'Dentista',
      this.dentistaId,
      this.draftMessage.trim()
    );
    this.draftMessage = '';
  }

  load() {
    this.loading = true;
    this.errorMessage = '';
    this.service.getByDentist(this.dentistaId).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (a) => {
        if (a) {
          this.payload = {
            dentistaId: a.dentistaId || this.dentistaId,
            timezone: a.timezone || this.payload.timezone,
            slotDurationMin: a.slotDurationMin || 30,
            horaInicioPadrao: a.horaInicioPadrao || '08:00',
            horaFimPadrao: a.horaFimPadrao || '18:00',
            regras: a.regras || [],
          };
        } else {
          this.payload.dentistaId = this.dentistaId;
        }

        if (!this.payload.regras || this.payload.regras.length === 0) {
          this.payload.regras = this.weekdays.map(d => ({
            diaSemana: d,
            ativo: false,
            inicio: this.payload.horaInicioPadrao || '08:00',
            fim: this.payload.horaFimPadrao || '18:00',
          }));
        }

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching agenda:', err);
        this.errorMessage = JSON.stringify({
          status: err.status,
          message: err.message,
          url: err.url,
          name: err.name,
          error: err.error
        }, null, 2);
        
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  saveAgenda(updatedPayload: AgendaFormPayload) {
    this.saving = true;
    this.payload = updatedPayload;
    this.payload.dentistaId = this.dentistaId;
    this.service.save(this.payload).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => { this.saving = false; },
      error: (err) => {
        this.errorMessage = 'Erro ao salvar: ' + JSON.stringify(err);
        this.saving = false; 
      }
    });
  }
}

import { Component, OnInit, OnDestroy, inject, DestroyRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { ChatService, ChatMessageView, SessaoChatStatus } from '../../services/chat.service';

@Component({
  selector: 'app-chat-paciente',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="h-[calc(100vh-80px)] flex flex-col md:flex-row bg-cs-bg border-t border-cs-border">
      
      <!-- Lista de Sessões (Sidebar) -->
      <div class="w-full md:w-1/3 lg:w-1/4 border-r border-cs-border flex flex-col bg-cs-surface h-full">
        <div class="p-4 border-b border-cs-border bg-cs-surface">
          <h2 class="text-lg font-bold text-cs-text m-0">Mensagens</h2>
        </div>
        
        <div class="flex-1 overflow-y-auto p-2" *ngIf="sessoes.length > 0; else noSessions">
          <div *ngFor="let s of sessoes" 
               (click)="selecionarSessao(s)"
               [class.bg-cs-primary-10]="selectedRoomId === s.id"
               [class.border-cs-primary]="selectedRoomId === s.id"
               class="p-3 mb-2 rounded-lg border border-transparent cursor-pointer hover:bg-cs-bg transition-colors flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-cs-primary text-white flex items-center justify-center font-bold">
              {{ s.dentistaNome?.charAt(0) || 'D' }}
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="text-sm font-semibold text-cs-text m-0 truncate">{{ s.dentistaNome || 'Dentista' }}</h3>
              <p class="text-xs text-cs-muted m-0 truncate">Status: {{ s.status }}</p>
            </div>
          </div>
        </div>
        <ng-template #noSessions>
          <div class="flex-1 flex flex-col items-center justify-center p-6 text-center opacity-50">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-cs-muted mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            <p class="text-sm text-cs-muted">Nenhuma conversa encontrada.</p>
          </div>
        </ng-template>
      </div>

      <!-- Área de Chat Ativa -->
      <div class="flex-1 flex flex-col bg-cs-bg h-full relative" *ngIf="selectedSessao; else noSelection">
        
        <!-- Chat Header -->
        <div class="p-4 border-b border-cs-border bg-cs-surface flex justify-between items-center z-10">
          <div>
            <h3 class="text-lg font-bold text-cs-text m-0">{{ selectedSessao.dentistaNome || 'Dentista' }}</h3>
            <span class="text-xs px-2 py-0.5 rounded font-medium"
                  [ngClass]="{
                    'bg-emerald-900 text-emerald-100': sessionStatus === 'ACTIVE',
                    'bg-amber-900 text-amber-100': sessionStatus === 'PENDING',
                    'bg-red-900 text-red-100': sessionStatus === 'REJECTED' || sessionStatus === 'CLOSED'
                  }">
              {{ sessionStatus }}
            </span>
          </div>
        </div>

        <!-- Chat Messages -->
        <div class="flex-1 overflow-y-auto p-4 space-y-4" id="chat-messages-container">
          
          <div *ngIf="sessionStatus === 'PENDING'" class="bg-amber-900/20 border border-amber-900 text-amber-200 p-3 rounded-lg text-sm text-center mb-4">
            Aguardando o dentista aceitar a conversa...
          </div>
          
          <div *ngIf="sessionStatus === 'REJECTED' || sessionStatus === 'CLOSED'" class="bg-red-900/20 border border-red-900 text-red-200 p-3 rounded-lg text-sm text-center mb-4">
            Esta conversa foi encerrada ou recusada.
          </div>

          <ng-container *ngFor="let msg of messages">
            <div *ngIf="msg.isSystem" class="text-center my-2">
              <span class="bg-cs-surface text-cs-muted text-xs py-1 px-3 rounded-full border border-cs-border">
                {{ msg.message }}
              </span>
            </div>

            <div *ngIf="!msg.isSystem && !msg.isInvite" class="flex flex-col max-w-[80%]" [ngClass]="msg.mine ? 'ml-auto items-end' : 'mr-auto items-start'">
              <span class="text-xs text-cs-muted mb-1 px-1">{{ msg.senderName }}</span>
              <div class="p-3 rounded-2xl" [ngClass]="msg.mine ? 'bg-cs-primary text-white rounded-tr-none' : 'bg-cs-surface border border-cs-border text-cs-text rounded-tl-none'">
                <p class="m-0 text-sm whitespace-pre-wrap">{{ msg.message }}</p>
              </div>
              <span class="text-[10px] text-cs-muted mt-1 px-1">{{ msg.sentAt | date:'shortTime' }}</span>
            </div>

            <!-- Card de Convite de Agendamento -->
            <div *ngIf="msg.isInvite" class="flex flex-col max-w-[85%] mx-auto my-4 w-full">
              <div class="bg-cs-surface border border-cs-primary/30 rounded-xl overflow-hidden shadow-sm">
                <div class="bg-cs-primary/10 px-4 py-3 border-b border-cs-border flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-cs-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  <strong class="text-sm text-cs-text">Convite de Agendamento</strong>
                </div>
                <div class="p-4">
                  <p class="text-sm text-cs-text m-0 mb-3">O dentista sugeriu um horário para sua consulta:</p>
                  <div class="bg-cs-bg rounded p-3 text-center mb-4 border border-cs-border">
                    <strong class="text-base text-cs-primary block">{{ msg.inviteDataHora | date:'EEEE, dd/MM/yyyy' }}</strong>
                    <span class="text-sm text-cs-text">{{ msg.inviteDataHora | date:'HH:mm' }}</span>
                  </div>
                  <button (click)="aceitarConvite(msg.inviteDataHora!)" class="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2 px-4 rounded transition-colors cursor-pointer border-none text-sm">
                    Aceitar Horário
                  </button>
                </div>
              </div>
            </div>
          </ng-container>
        </div>

        <!-- Chat Input -->
        <div class="p-4 border-t border-cs-border bg-cs-surface">
          <div class="flex gap-2">
            <input type="text" [(ngModel)]="draftMessage" (keyup.enter)="sendMessage()" 
                   [disabled]="sessionStatus !== 'ACTIVE'"
                   placeholder="Digite sua mensagem..." 
                   class="flex-1 bg-cs-bg border border-cs-border text-cs-text rounded-full px-4 py-2 focus:ring-2 focus:ring-cs-primary outline-none disabled:opacity-50">
            
            <button (click)="sendMessage()" 
                    [disabled]="sessionStatus !== 'ACTIVE' || !draftMessage.trim()"
                    class="bg-cs-primary hover:bg-cs-primary-hover text-white rounded-full w-10 h-10 flex items-center justify-center disabled:opacity-50 transition-colors border-none cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            </button>
          </div>
        </div>
      </div>

      <ng-template #noSelection>
        <div class="flex-1 flex flex-col items-center justify-center p-8 text-center bg-cs-bg">
          <div class="w-20 h-20 bg-cs-surface rounded-full flex items-center justify-center mb-4 border border-cs-border shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-cs-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
          </div>
          <h3 class="text-xl font-bold text-cs-text mb-2">Selecione uma conversa</h3>
          <p class="text-cs-muted max-w-md mx-auto">
            Escolha uma conversa na lista ao lado para continuar o atendimento ou busque um dentista para iniciar um novo contato.
          </p>
        </div>
      </ng-template>

    </div>
  `
})
export class ChatPacienteComponent implements OnInit, OnDestroy {
  sessoes: any[] = [];
  selectedSessao: any = null;
  selectedRoomId: string | null = null;
  
  messages: ChatMessageView[] = [];
  draftMessage = '';
  sessionStatus: SessaoChatStatus | null = null;
  currentUserId = '';
  
  private destroyRef = inject(DestroyRef);
  private chatSubscription?: Subscription;
  private sessionStatusSub?: Subscription;

  constructor(
    private chatService: ChatService,
    private auth: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.currentUserId = this.auth.getSubject() ?? '';
    this.loadSessoes();
  }

  loadSessoes() {
    this.chatService.getSessoesAtivas().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.sessoes = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Erro ao buscar sessoes', err)
    });
  }

  selecionarSessao(sessao: any) {
    this.selectedSessao = sessao;
    this.selectedRoomId = sessao.id;
    this.sessionStatus = sessao.status;
    this.messages = [];
    
    this.bindChat(sessao.id, sessao.dentistaNome);
  }

  private bindChat(roomId: string, dentistaNome: string): void {
    this.chatSubscription?.unsubscribe();
    this.chatSubscription = this.chatService
      .connect(roomId, this.currentUserId, 'Paciente')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((messages) => {
        this.messages = messages;
        this.scrollToBottom();
        this.cdr.detectChanges();
      });

    this.sessionStatusSub?.unsubscribe();
    this.sessionStatusSub = this.chatService.sessionStatus$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(status => {
        if (status) {
          this.sessionStatus = status;
          this.cdr.detectChanges();
        }
      });
  }

  sendMessage(): void {
    if (!this.selectedRoomId || !this.draftMessage.trim()) return;
    this.chatService.send(
      this.selectedRoomId,
      this.currentUserId,
      'Paciente', // Sender name
      this.selectedSessao.dentistaId,
      this.draftMessage.trim()
    );
    this.draftMessage = '';
  }

  aceitarConvite(dataHora: string): void {
    if (!this.selectedRoomId) return;
    this.chatService.aceitarConviteAgendamento(this.selectedRoomId, dataHora).subscribe({
      next: () => {
        // Confirmação via Toast idealmente
      },
      error: (err) => {
        console.error('Erro ao aceitar convite', err);
      }
    });
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const container = document.getElementById('chat-messages-container');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 100);
  }

  ngOnDestroy() {
    this.chatSubscription?.unsubscribe();
    this.sessionStatusSub?.unsubscribe();
  }
}

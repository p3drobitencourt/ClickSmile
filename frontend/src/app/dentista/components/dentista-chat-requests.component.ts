import { Component, Input, OnInit, inject, signal, effect, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ChatService, SessaoChatResponseDTO, ChatMessageView, SessaoChatStatus } from '../../services/chat.service';
import { RxStomp } from '@stomp/rx-stomp';
import { AuthService } from '../../auth/auth.service';
import { IMessage } from '@stomp/stompjs';

@Component({
  selector: 'app-dentista-chat-requests',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <article class="bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-700 h-[600px] flex flex-col">
      <h3 class="text-lg font-bold text-slate-100 mb-4 border-b border-slate-700 pb-2 flex-shrink-0">Triagem e Atendimento</h3>
      
      <div class="grid grid-cols-12 gap-4 flex-grow overflow-hidden">
        
        <!-- Coluna Esquerda: Lista de Solicitações (col-span-4) -->
        <div class="col-span-4 flex flex-col overflow-y-auto border-r border-slate-700 pr-2 space-y-3">
          <div *ngIf="requests.length === 0" class="text-center p-4 bg-slate-900/50 rounded-lg border border-slate-700/50 border-dashed">
            <p class="text-slate-400 text-sm">Nenhuma solicitação pendente.</p>
          </div>

          <div *ngFor="let req of requests" 
               class="flex flex-col p-3 rounded-lg border cursor-pointer transition-colors"
               [ngClass]="selectedRequest()?.id === req.id ? 'bg-slate-700 border-blue-500' : 'bg-slate-900 border-slate-700 hover:border-slate-600'"
               (click)="selectRequest(req)">
            <strong class="text-slate-200 text-sm">Paciente {{ req.clienteId | slice:0:8 }}...</strong>
            
            <div class="flex items-center justify-between mt-2">
              <span class="text-xs text-amber-500 flex items-center gap-1" *ngIf="req.status === 'PENDING'">
                <span class="animate-pulse h-1.5 w-1.5 bg-amber-500 rounded-full"></span> Aguardando
              </span>
              <span class="text-xs text-emerald-400 flex items-center gap-1" *ngIf="req.status === 'ACTIVE'">
                <span class="h-1.5 w-1.5 bg-emerald-400 rounded-full"></span> Ativo
              </span>
              
              <button *ngIf="req.status === 'PENDING'" 
                      class="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium border-none cursor-pointer transition-colors"
                      (click)="acceptChat(req, $event)">
                Aceitar
              </button>
            </div>
          </div>
        </div>

        <!-- Coluna Direita: ChatMessageComponent Inline (col-span-8) -->
        <div class="col-span-8 flex flex-col h-full bg-slate-900 rounded-lg border border-slate-700 overflow-hidden" *ngIf="selectedRequest(); else emptyChat">
          
          <div class="bg-slate-800 border-b border-slate-700 p-3 flex justify-between items-center shadow-sm">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-full bg-blue-900 flex items-center justify-center text-blue-300 font-bold text-sm">
                P
              </div>
              <strong class="text-slate-200 text-sm">Paciente {{ selectedRequest()?.clienteId | slice:0:8 }}</strong>
            </div>
          </div>

          <!-- Mensagens -->
          <div class="flex-grow overflow-y-auto p-4 space-y-3 flex flex-col">
            <div *ngFor="let msg of chatMessages()" 
                 class="max-w-[75%] rounded-lg p-3 text-sm shadow-sm"
                 [ngClass]="msg.isSystem ? 'bg-slate-800 text-slate-300 self-center text-center text-xs border border-slate-700 mx-auto' : (msg.mine ? 'bg-emerald-800 text-emerald-50 self-end rounded-br-none' : 'bg-slate-700 text-slate-100 self-start rounded-bl-none')">
              
              <div *ngIf="msg.isSystem" class="font-semibold text-blue-400 mb-1 flex items-center justify-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                Sistema
              </div>
              
              {{ msg.message }}
              <div class="text-[10px] mt-1 opacity-70 text-right" [ngClass]="msg.isSystem ? 'text-center' : ''">
                {{ msg.sentAt | date:'HH:mm' }}
              </div>
            </div>
          </div>

          <!-- Input (Somente se ativo) -->
          <div class="p-3 bg-slate-800 border-t border-slate-700 flex gap-2" *ngIf="selectedRequest()?.status === 'ACTIVE'">
            <input type="text" [(ngModel)]="newMessage" (keyup.enter)="sendMessage()" placeholder="Digite sua mensagem..." 
                   class="flex-grow px-3 py-2 bg-slate-900 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm" />
            <button (click)="sendMessage()" class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 transform rotate-90" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </button>
          </div>
        </div>

        <ng-template #emptyChat>
          <div class="col-span-8 flex items-center justify-center bg-slate-900 rounded-lg border border-slate-700 border-dashed">
            <p class="text-slate-500 flex flex-col items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Selecione uma solicitação para visualizar o chat
            </p>
          </div>
        </ng-template>

      </div>
    </article>
  `
})
export class DentistaChatRequestsComponent implements OnInit {
  @Input() requests: SessaoChatResponseDTO[] = [];
  
  selectedRequest = signal<SessaoChatResponseDTO | null>(null);
  chatMessages = signal<ChatMessageView[]>([]);
  newMessage = '';

  private chatService = inject(ChatService);
  private rxStomp!: RxStomp;
  private authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);
  private dentistaId = '';

  ngOnInit() {
    this.dentistaId = this.authService.getSubject() || '';
    this.rxStomp = this.chatService.getRxStomp();
  }

  selectRequest(req: SessaoChatResponseDTO) {
    this.selectedRequest.set(req);
    // Reload messages from server history
    this.chatService.getHistorico(req.id).subscribe(hist => {
      this.chatMessages.set(hist);
    });

    if (req.status === 'ACTIVE') {
      this.subscribeToChat();
    }
  }

  acceptChat(req: SessaoChatResponseDTO, event: Event) {
    event.stopPropagation();
    this.chatService.aceitarChat(req.id).subscribe(updated => {
      // O backend transacional já cria a agenda e retorna o status ACTIVE
      const updatedReq = { ...req, status: SessaoChatStatus.ACTIVE };
      
      // Update requests list locally to reflect changes
      const idx = this.requests.findIndex(r => r.id === req.id);
      if (idx !== -1) {
        this.requests[idx] = updatedReq;
      }
      
      this.selectedRequest.set(updatedReq);
      this.chatMessages.set([]); // Limpa para evitar flickering, RXSTOMP trará o SYSTEM
      this.subscribeToChat();
    });
  }

  private subscribeToChat() {
    const req = this.selectedRequest();
    if (!req) return;

    this.rxStomp.watch('/user/queue/mensagens')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((msg: IMessage) => {
        try {
          const parsed = JSON.parse(msg.body);
          if (parsed.roomId === req.id) {
            const view = this.chatService.parseMessageForComponent(parsed, this.dentistaId);
            this.chatMessages.update(msgs => [...msgs, view]);
          }
        } catch (e) {
          console.error('Error parsing STOMP message', e);
        }
      });
      
    // Fetch historico again just in case there are missing messages
    this.chatService.getHistorico(req.id).subscribe(hist => {
      this.chatMessages.set(hist);
    });
  }

  sendMessage() {
    const req = this.selectedRequest();
    if (!req || req.status !== SessaoChatStatus.ACTIVE || !this.newMessage.trim()) return;

    this.chatService.send(req.id, this.dentistaId, 'Dentista', req.clienteId, this.newMessage.trim());
    this.newMessage = '';
  }
}

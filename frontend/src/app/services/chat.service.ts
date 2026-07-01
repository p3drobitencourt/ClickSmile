import { Injectable, OnDestroy } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { RuntimeConfigService } from './runtime-config.service';

export interface ChatMessageView {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  message: string;
  sentAt: string;
  mine: boolean;
  isInvite?: boolean;
  isSystem?: boolean;
  inviteDataHora?: string;
}

export enum SessaoChatStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  REJECTED = 'REJECTED',
  CLOSED = 'CLOSED'
}

export interface SessaoChatResponseDTO {
  id: string;
  clienteId: string;
  dentistaId: string;
  status: SessaoChatStatus;
}

@Injectable({ providedIn: 'root' })
export class ChatService implements OnDestroy {
  private client: Client | null = null;
  private connectedRoom: string | null = null;
  private messages$ = new BehaviorSubject<ChatMessageView[]>([]);
  public sessionStatus$ = new BehaviorSubject<SessaoChatStatus | null>(null);
  public solicitacoes$ = new BehaviorSubject<SessaoChatResponseDTO[]>([]);
  private reconnectAttempt = 0;
  private maxReconnectDelay = 30000;
  private chatSubscription: any = null;
  private statusSubscription: any = null;
  private solicitacoesSubscription: any = null;
  public agendamentos$ = new BehaviorSubject<any[]>([]);
  private agendamentosSubscription: any = null;

  constructor(private runtime: RuntimeConfigService, private http: HttpClient) {}

  connect(roomId: string, currentUserId: string, senderName: string): Observable<ChatMessageView[]> {
    if (this.connectedRoom !== roomId) {
      this.connectedRoom = roomId;
      this.messages$.next([]);
      this.client?.deactivate();
      this.reconnectAttempt = 0;

      // Load history first
      this.http.get<ChatMessageView[]>(this.runtime.api(`/api/mensagens/historico/${roomId}`))
        .subscribe((history) => {
          const formattedHistory = history.map(msg => {
            const parsed = { ...msg, mine: msg.senderId === currentUserId, isInvite: false, isSystem: false, inviteDataHora: undefined };
            if (parsed.message.startsWith('[INVITE]')) {
              parsed.isInvite = true;
              try {
                const data = JSON.parse(parsed.message.replace('[INVITE]', ''));
                parsed.inviteDataHora = data.dataHora;
              } catch(e) {}
            } else if (parsed.message.startsWith('[SYSTEM]')) {
              parsed.isSystem = true;
              parsed.message = parsed.message.replace('[SYSTEM]', '').trim();
            }
            return parsed;
          });
          this.messages$.next(formattedHistory);
          this.initStompClient(roomId, currentUserId, senderName);
        });
    }

    return this.messages$.asObservable();
  }

  private initStompClient(roomId: string, currentUserId: string, senderName: string) {
    this.client = new Client({
      webSocketFactory: () => new SockJS(this.runtime.api('/ws')),
      reconnectDelay: 1000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.client.beforeConnect = () => {
      // Exponential backoff logic
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempt), this.maxReconnectDelay);
      this.client!.reconnectDelay = delay;
    };

    this.client.onWebSocketClose = () => {
      this.reconnectAttempt++;
    };

    this.client.onConnect = () => {
      this.reconnectAttempt = 0;
      
      // Clean up previous subscriptions if any
      if (this.chatSubscription) this.chatSubscription.unsubscribe();
      if (this.statusSubscription) this.statusSubscription.unsubscribe();

      // Listen for chat messages
      this.chatSubscription = this.client?.subscribe(`/topic/chat.${roomId}`, (message: IMessage) => {
        let payload = JSON.parse(message.body) as ChatMessageView;
        payload.mine = payload.senderId === currentUserId;
        
        if (payload.message.startsWith('[INVITE]')) {
          payload.isInvite = true;
          try {
            const data = JSON.parse(payload.message.replace('[INVITE]', ''));
            payload.inviteDataHora = data.dataHora;
          } catch(e) {}
        } else if (payload.message.startsWith('[SYSTEM]')) {
          payload.isSystem = true;
          payload.message = payload.message.replace('[SYSTEM]', '').trim();
        }

        const currentMessages = this.messages$.value;
        if (!currentMessages.some(m => m.id === payload.id)) {
          this.messages$.next([...currentMessages, payload]);
        }
      });

      // Listen for session status updates
      this.statusSubscription = this.client?.subscribe(`/topic/chat.${roomId}.status`, (message: IMessage) => {
        const payload = JSON.parse(message.body) as SessaoChatResponseDTO;
        this.sessionStatus$.next(payload.status);
      });
    };

    this.client.activate();
  }

  solicitarChat(clienteId: string, dentistaId: string): Observable<SessaoChatResponseDTO> {
    const url = this.runtime.api('/api/chat/iniciar');
    return this.http.post<SessaoChatResponseDTO>(url, { clienteId, dentistaId });
  }

  aceitarChat(roomId: string): Observable<SessaoChatResponseDTO> {
    const url = this.runtime.api(`/api/chat/sessao/${roomId}/aceitar`);
    return this.http.post<SessaoChatResponseDTO>(url, {});
  }

  aceitarConviteAgendamento(roomId: string, dataHora: string): Observable<any> {
    const url = this.runtime.api(`/api/chat/sessao/${roomId}/agendar`);
    return this.http.post(url, { dataHora });
  }

  enviarConviteDev(roomId: string, dentistaId: string, dentistaNome: string, clienteId: string, dataHora: string): void {
    if (this.client?.connected) {
      this.client.publish({
        destination: '/app/chat.invite',
        body: JSON.stringify({
          roomId,
          dentistaId,
          dentistaNome,
          clienteId,
          dataHora
        }),
      });
    }
  }

  escutarSolicitacoes(dentistaId: string): void {
    if (!this.client?.connected) {
      // Connect specifically for listening if not connected
      this.client = new Client({
        webSocketFactory: () => new SockJS(this.runtime.api('/ws')),
        reconnectDelay: 1000,
      });
      this.client.onConnect = () => {
        if (this.solicitacoesSubscription) this.solicitacoesSubscription.unsubscribe();
        this.solicitacoesSubscription = this.client?.subscribe(`/topic/dentista.${dentistaId}.solicitacoes`, (message: IMessage) => {
          const payload = JSON.parse(message.body) as SessaoChatResponseDTO;
          this.solicitacoes$.next([...this.solicitacoes$.value, payload]);
        });
      };
      this.client.activate();
    } else {
      if (this.solicitacoesSubscription) this.solicitacoesSubscription.unsubscribe();
      this.solicitacoesSubscription = this.client?.subscribe(`/topic/dentista.${dentistaId}.solicitacoes`, (message: IMessage) => {
        const payload = JSON.parse(message.body) as SessaoChatResponseDTO;
        this.solicitacoes$.next([...this.solicitacoes$.value, payload]);
      });
    }
  }

  escutarAgendamentos(dentistaId: string): void {
    const subscribeToTopic = () => {
      if (this.agendamentosSubscription) this.agendamentosSubscription.unsubscribe();
      this.agendamentosSubscription = this.client?.subscribe(`/topic/dentista.${dentistaId}.agendamentos`, (message: IMessage) => {
        try {
          const payload = JSON.parse(message.body);
          if (payload.dentistaId === dentistaId) {
            this.agendamentos$.next([...this.agendamentos$.value, payload]);
          }
        } catch (e) {
          console.error('Failed to parse agendamento payload', e);
        }
      });
    };

    if (!this.client?.connected) {
      this.client = new Client({
        webSocketFactory: () => new SockJS(this.runtime.api('/ws')),
        reconnectDelay: 1000,
      });
      this.client.onConnect = () => {
        subscribeToTopic();
      };
      this.client.activate();
    } else {
      subscribeToTopic();
    }
  }

  // Novo método para Dentista
  public dentistaChats$ = new BehaviorSubject<{roomId: string, clienteNome: string, messages: ChatMessageView[]} | null>(null);
  private roomSubscriptions: Record<string, any> = {};

  connectDentista(dentistaId: string): Observable<any> {
    this.escutarSolicitacoes(dentistaId);
    
    this.solicitacoes$.subscribe(solicitacoes => {
      solicitacoes.forEach(req => {
        if (!this.roomSubscriptions[req.id]) {
          // Fetch history
          this.http.get<ChatMessageView[]>(this.runtime.api(`/api/mensagens/historico/${req.id}`))
            .subscribe((history) => {
              const formattedHistory = history.map(msg => {
                const parsed = { ...msg, mine: msg.senderId === dentistaId, isInvite: false, isSystem: false, inviteDataHora: undefined };
                return parsed;
              });
              this.dentistaChats$.next({ roomId: req.id, clienteNome: 'Cliente', messages: formattedHistory });
              
              if (this.client?.connected) {
                this.roomSubscriptions[req.id] = this.client.subscribe(`/topic/chat.${req.id}`, (message: IMessage) => {
                  let payload = JSON.parse(message.body) as ChatMessageView;
                  payload.mine = payload.senderId === dentistaId;
                  
                  // Pega o history mais recente para append
                  let currentMessages: ChatMessageView[] = [];
                  // Na verdade, apenas emite o update
                  this.http.get<ChatMessageView[]>(this.runtime.api(`/api/mensagens/historico/${req.id}`)).subscribe(h => {
                    const hF = h.map(msg => {
                      const parsed = { ...msg, mine: msg.senderId === dentistaId, isInvite: false, isSystem: false, inviteDataHora: undefined };
                      return parsed;
                    });
                    this.dentistaChats$.next({ roomId: req.id, clienteNome: 'Cliente', messages: hF });
                  });
                });
              }
            });
        }
      });
    });

    return this.dentistaChats$.asObservable();
  }

  send(roomId: string, senderId: string, senderName: string, recipientId: string, message: string) {
    const payload: ChatMessageView = {
      id: crypto.randomUUID(),
      roomId,
      senderId,
      senderName,
      recipientId,
      message,
      sentAt: new Date().toISOString(),
      mine: true,
    };

    if (this.sessionStatus$.value !== SessaoChatStatus.ACTIVE) {
      console.warn('Cannot send message: Chat session is not active.');
      return;
    }

    this.messages$.next([...this.messages$.value, payload]);

    if (this.client?.connected) {
      this.client.publish({
        destination: '/app/chat.send',
        body: JSON.stringify(payload),
      });
    }
  }

  ngOnDestroy(): void {
    if (this.chatSubscription) this.chatSubscription.unsubscribe();
    if (this.statusSubscription) this.statusSubscription.unsubscribe();
    if (this.solicitacoesSubscription) this.solicitacoesSubscription.unsubscribe();
    if (this.agendamentosSubscription) this.agendamentosSubscription.unsubscribe();
    this.client?.deactivate();
  }
}

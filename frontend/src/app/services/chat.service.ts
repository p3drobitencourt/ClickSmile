import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subscription, of } from 'rxjs';
import { RuntimeConfigService } from './runtime-config.service';
import { WebSocketService } from './web-socket.service';
import { IMessage } from '@stomp/rx-stomp';
import { AuthService } from '../auth/auth.service';

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
  private connectedRoom: string | null = null;
  private messages$ = new BehaviorSubject<ChatMessageView[]>([]);
  public sessionStatus$ = new BehaviorSubject<SessaoChatStatus | null>(null);
  public solicitacoes$ = new BehaviorSubject<SessaoChatResponseDTO[]>([]);
  public agendamentos$ = new BehaviorSubject<any[]>([]);

  private rxSubscriptions: Subscription[] = [];
  private tokenInitialized = false;

  constructor(
    private runtime: RuntimeConfigService,
    private http: HttpClient,
    private rxStomp: WebSocketService,
    private auth: AuthService
  ) {
    this.ensureConnection();
  }

  private ensureConnection() {
    if (!this.tokenInitialized) {
      const token = this.auth.getAccessToken();
      if (token) {
        this.rxStomp.initConnection(token);
        this.tokenInitialized = true;
      }
    }
  }

  connect(roomId: string, currentUserId: string, senderName: string): Observable<ChatMessageView[]> {
    this.ensureConnection();

    if (this.connectedRoom !== roomId) {
      this.connectedRoom = roomId;
      this.messages$.next([]);
      this.clearRoomSubscriptions();

      // Load history
      this.http.get<ChatMessageView[]>(this.runtime.api(`/api/mensagens/historico/${roomId}`))
        .subscribe((history) => {
          const formattedHistory = history.map(msg => this.parseMessage(msg, currentUserId));
          this.messages$.next(formattedHistory);
          this.listenToUserMessages(currentUserId);
          this.listenToSessionStatus(roomId);
        });
    }

    return this.messages$.asObservable();
  }

  private listenToUserMessages(currentUserId: string) {
    // Only subscribe once to /user/queue/mensagens
    // This serves both client and dentist as long as they are the intended recipient
    const sub = this.rxStomp.watch('/user/queue/mensagens').subscribe((message: IMessage) => {
      let payload = JSON.parse(message.body) as ChatMessageView;
      payload = this.parseMessage(payload, currentUserId);

      // Only add if it belongs to the current room in context for client
      if (this.connectedRoom && payload.roomId === this.connectedRoom) {
        const currentMessages = this.messages$.value;
        if (!currentMessages.some(m => m.id === payload.id)) {
          this.messages$.next([...currentMessages, payload]);
        }
      }
    });
    this.rxSubscriptions.push(sub);
  }

  private listenToSessionStatus(roomId: string) {
    const sub = this.rxStomp.watch('/user/queue/status').subscribe((message: IMessage) => {
      const payload = JSON.parse(message.body) as SessaoChatResponseDTO;
      if (payload.id === roomId) {
        this.sessionStatus$.next(payload.status);
      }
    });
    this.rxSubscriptions.push(sub);
  }

  private parseMessage(msg: ChatMessageView, currentUserId: string): ChatMessageView {
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
  }

  private clearRoomSubscriptions() {
    this.rxSubscriptions.forEach(sub => sub.unsubscribe());
    this.rxSubscriptions = [];
  }

  solicitarChat(clienteId: string, dentistaId: string): Observable<SessaoChatResponseDTO> {
    const url = this.runtime.api('/api/chat/iniciar');
    return this.http.post<SessaoChatResponseDTO>(url, { clienteId, dentistaId });
  }

  aceitarChat(roomId: string): Observable<SessaoChatResponseDTO> {
    // MOCK INTERCEPTOR
    const mock = this.solicitacoes$.value.find(x => x.id === roomId);
    if (mock) {
      mock.status = SessaoChatStatus.ACTIVE;
      this.solicitacoes$.next([...this.solicitacoes$.value]);
      
      // Inject some initial chat history for the mock
      const history: ChatMessageView[] = [{
        id: 'msg-1', roomId, senderId: mock.clienteId, senderName: 'Novo Cliente', recipientId: mock.dentistaId,
        message: 'Olá doutor, gostaria de agendar uma avaliação inicial.',
        sentAt: new Date().toISOString(), mine: false
      }];
      this.dentistaChats$.next({ roomId, clienteNome: 'Novo Cliente', messages: history });
      return of(mock);
    }

    const url = this.runtime.api(`/api/chat/sessao/${roomId}/aceitar`);
    return this.http.post<SessaoChatResponseDTO>(url, {});
  }

  aceitarConviteAgendamento(roomId: string, dataHora: string): Observable<any> {
    const url = this.runtime.api(`/api/chat/sessao/${roomId}/agendar`);
    return this.http.post(url, { dataHora });
  }

  enviarConviteDev(roomId: string, dentistaId: string, dentistaNome: string, clienteId: string, dataHora: string): void {
    this.ensureConnection();
    this.rxStomp.publish({
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

  escutarSolicitacoes(dentistaId: string): void {
    this.ensureConnection();
    const sub = this.rxStomp.watch('/user/queue/solicitacoes').subscribe((message: IMessage) => {
      const payload = JSON.parse(message.body) as SessaoChatResponseDTO;
      this.solicitacoes$.next([...this.solicitacoes$.value, payload]);
    });
    this.rxSubscriptions.push(sub);
  }

  escutarAgendamentos(dentistaId: string): void {
    this.ensureConnection();
    const sub = this.rxStomp.watch('/user/queue/agendamentos').subscribe((message: IMessage) => {
      try {
        const payload = JSON.parse(message.body);
        if (payload.dentistaId === dentistaId) {
          this.agendamentos$.next([...this.agendamentos$.value, payload]);
        }
      } catch (e) {
        console.error('Failed to parse agendamento payload', e);
      }
    });
    this.rxSubscriptions.push(sub);
  }

  public dentistaChats$ = new BehaviorSubject<{roomId: string, clienteNome: string, messages: ChatMessageView[]} | null>(null);
  private roomSubscriptions: Record<string, any> = {};

  connectDentista(dentistaId: string): Observable<any> {
    this.ensureConnection();
    this.escutarSolicitacoes(dentistaId);
    
    // MOCK DATA INJECTION se estiver vazio
    if (this.solicitacoes$.value.length === 0) {
      this.solicitacoes$.next([
         { id: 'mock-room-' + Date.now(), clienteId: 'cliente-01', dentistaId, status: SessaoChatStatus.PENDING }
      ]);
    }
    
    // Also listen to messages globally for the dentist
    const sub = this.rxStomp.watch('/user/queue/mensagens').subscribe((message: IMessage) => {
      let payload = JSON.parse(message.body) as ChatMessageView;
      payload = this.parseMessage(payload, dentistaId);
      
      this.http.get<ChatMessageView[]>(this.runtime.api(`/api/mensagens/historico/${payload.roomId}`)).subscribe(h => {
        const hF = h.map(msg => this.parseMessage(msg, dentistaId));
        this.dentistaChats$.next({ roomId: payload.roomId, clienteNome: 'Cliente', messages: hF });
      });
    });
    this.rxSubscriptions.push(sub);

    this.solicitacoes$.subscribe(solicitacoes => {
      solicitacoes.forEach(req => {
        if (!this.roomSubscriptions[req.id]) {
          // Fetch history
          this.http.get<ChatMessageView[]>(this.runtime.api(`/api/mensagens/historico/${req.id}`))
            .subscribe((history) => {
              const formattedHistory = history.map(msg => this.parseMessage(msg, dentistaId));
              this.dentistaChats$.next({ roomId: req.id, clienteNome: 'Cliente', messages: formattedHistory });
              this.roomSubscriptions[req.id] = true;
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

    if (this.sessionStatus$.value !== SessaoChatStatus.ACTIVE && senderName !== 'Dentista') {
      console.warn('Cannot send message: Chat session is not active.');
      // O dentista pode enviar mensagens em resposta sem o check de status local
    }

    this.messages$.next([...this.messages$.value, payload]);
    
    // MOCK INTERCEPTOR: Se for sala mock, não envia pro STOMP
    if (roomId.startsWith('mock-room-')) {
      const curChats = this.dentistaChats$.value;
      if (curChats && curChats.roomId === roomId) {
         this.dentistaChats$.next({ ...curChats, messages: [...curChats.messages, payload] });
      }
      return;
    }

    this.ensureConnection();
    this.rxStomp.publish({
      destination: '/app/chat.send',
      body: JSON.stringify(payload),
    });
  }

  ngOnDestroy(): void {
    this.clearRoomSubscriptions();
    this.rxStomp.deactivate();
  }
}

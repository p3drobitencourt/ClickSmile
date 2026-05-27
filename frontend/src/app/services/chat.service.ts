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
}

@Injectable({ providedIn: 'root' })
export class ChatService implements OnDestroy {
  private client: Client | null = null;
  private connectedRoom: string | null = null;
  private messages$ = new BehaviorSubject<ChatMessageView[]>([]);
  private reconnectAttempt = 0;
  private maxReconnectDelay = 30000;

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
          const formattedHistory = history.map(msg => ({ ...msg, mine: msg.senderId === currentUserId }));
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
      this.client?.subscribe(`/topic/chat.${roomId}`, (message: IMessage) => {
        const payload = JSON.parse(message.body) as ChatMessageView;
        const currentMessages = this.messages$.value;
        // Avoid duplicate rendering
        if (!currentMessages.some(m => m.id === payload.id)) {
          this.messages$.next([...currentMessages, { ...payload, mine: payload.senderId === currentUserId }]);
        }
      });
    };

    this.client.activate();
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

    this.messages$.next([...this.messages$.value, payload]);

    if (this.client?.connected) {
      this.client.publish({
        destination: '/app/chat.send',
        body: JSON.stringify(payload),
      });
    }
  }

  ngOnDestroy(): void {
    this.client?.deactivate();
  }
}

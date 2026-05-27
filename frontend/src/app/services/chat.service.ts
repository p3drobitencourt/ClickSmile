import { Injectable, OnDestroy } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { BehaviorSubject, Observable } from 'rxjs';
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

  constructor(private runtime: RuntimeConfigService) {}

  connect(roomId: string, currentUserId: string, senderName: string): Observable<ChatMessageView[]> {
    if (this.connectedRoom !== roomId) {
      this.connectedRoom = roomId;
      this.messages$.next([]);
      this.client?.deactivate();
      this.client = new Client({
        webSocketFactory: () => new SockJS(this.runtime.api('/ws')),
        reconnectDelay: 3000,
      });

      this.client.onConnect = () => {
        this.client?.subscribe(`/topic/chat.${roomId}`, (message: IMessage) => {
          const payload = JSON.parse(message.body) as ChatMessageView;
          this.messages$.next([...this.messages$.value, { ...payload, mine: payload.senderId === currentUserId }]);
        });
      };

      this.client.activate();

      this.messages$.next([
        {
          id: 'seed-1',
          roomId,
          senderId: 'system',
          senderName: 'ClickSmile',
          recipientId: currentUserId,
          message: `Conversa iniciada com ${senderName}.`,
          sentAt: new Date().toISOString(),
          mine: false,
        },
      ]);
    }

    return this.messages$.asObservable();
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

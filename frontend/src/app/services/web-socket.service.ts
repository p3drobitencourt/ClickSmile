import { Injectable } from '@angular/core';
import { RxStomp, RxStompConfig } from '@stomp/rx-stomp';
import { RuntimeConfigService } from './runtime-config.service';
import SockJS from 'sockjs-client';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService extends RxStomp {
  constructor(private runtime: RuntimeConfigService) {
    super();
  }

  public initConnection(token: string) {
    const rxStompConfig: RxStompConfig = {
      webSocketFactory: () => new SockJS(this.runtime.api('/ws-clicksmile')),
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      reconnectDelay: 1000,
      debug: (msg: string): void => {
        // console.log(new Date(), msg);
      }
    };

    this.configure(rxStompConfig);
    this.activate();
  }
}

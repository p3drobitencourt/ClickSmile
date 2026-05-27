import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ChatService } from './chat.service';
import { RuntimeConfigService } from './runtime-config.service';

describe('ChatService', () => {
  let service: ChatService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ChatService,
        {
          provide: RuntimeConfigService,
          useValue: { api: (path: string) => `http://localhost:8080${path}` }
        }
      ]
    });
    service = TestBed.inject(ChatService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should deactivate STOMP client on destroy', () => {
    // We mock the client to spy on deactivate
    (service as any).client = { deactivate: jasmine.createSpy('deactivate') };
    
    service.ngOnDestroy();
    
    expect((service as any).client.deactivate).toHaveBeenCalled();
  });
});

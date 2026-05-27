import { TestBed } from '@angular/core/testing';
import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';
import { MessageService } from 'primeng/api';
import { of, throwError, Observable } from 'rxjs';
import { Router } from '@angular/router';

describe('authInterceptor', () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let messageServiceSpy: jasmine.SpyObj<MessageService>;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getAccessToken', 'refresh']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    messageServiceSpy = jasmine.createSpyObj('MessageService', ['add']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: MessageService, useValue: messageServiceSpy }
      ]
    });
  });

  it('should add Authorization header if token exists', (done) => {
    authServiceSpy.getAccessToken.and.returnValue('mock-token');

    const next: HttpHandlerFn = (req: HttpRequest<unknown>): Observable<HttpEvent<unknown>> => {
      expect(req.headers.get('Authorization')).toBe('Bearer mock-token');
      return of(new HttpResponse({ status: 200 }));
    };

    const req = new HttpRequest('GET', '/api/test');
    TestBed.runInInjectionContext(() => {
      authInterceptor(req, next).subscribe(() => done());
    });
  });

  it('should handle 409 conflict error', (done) => {
    authServiceSpy.getAccessToken.and.returnValue(null);

    const next: HttpHandlerFn = (req: HttpRequest<unknown>): Observable<HttpEvent<unknown>> => {
      return throwError(() => new HttpErrorResponse({ status: 409 }));
    };

    const req = new HttpRequest('GET', '/api/test');
    TestBed.runInInjectionContext(() => {
      authInterceptor(req, next).subscribe({
        error: (err) => {
          expect(messageServiceSpy.add).toHaveBeenCalledWith(jasmine.objectContaining({
            severity: 'error',
            summary: 'Conflito de Horário'
          }));
          done();
        }
      });
    });
  });
});

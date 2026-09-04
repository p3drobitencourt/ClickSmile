import { TestBed } from '@angular/core/testing';
import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';
import { ToastService } from '../shared/toast.service';
import { of, throwError, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { vi } from 'vitest';

describe('authInterceptor', () => {
  let authServiceSpy: any;
  let routerSpy: any;
  let toastServiceSpy: any;

  beforeEach(() => {
    authServiceSpy = {
      getAccessToken: vi.fn(),
      refresh: vi.fn()
    };
    routerSpy = { navigate: vi.fn() };
    toastServiceSpy = { show: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ToastService, useValue: toastServiceSpy }
      ]
    });
  });

  it('should add Authorization header if token exists', (done) => {
    authServiceSpy.getAccessToken.mockReturnValue('mock-token');

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
    authServiceSpy.getAccessToken.mockReturnValue(null);

    const next: HttpHandlerFn = (req: HttpRequest<unknown>): Observable<HttpEvent<unknown>> => {
      return throwError(() => new HttpErrorResponse({ status: 409 }));
    };

    const req = new HttpRequest('GET', '/api/test');
    TestBed.runInInjectionContext(() => {
      authInterceptor(req, next).subscribe({
        error: (err) => {
          expect(toastServiceSpy.show).toHaveBeenCalledWith(
            'Este horário acabou de ser reservado por outra pessoa. Por favor, escolha outro.',
            'Conflito de Agendamento',
            'warning'
          );
          done();
        }
      });
    });
  });
});


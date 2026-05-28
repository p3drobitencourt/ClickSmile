import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { MessageService } from 'primeng/api';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const messageService = inject(MessageService);

  // Auth endpoints should not trigger refresh-on-401 recursion.
  const isAuthEndpoint =
    req.url.includes('/api/auth/login') ||
    req.url.includes('/api/auth/refresh') ||
    req.url.includes('/api/auth/logout') ||
    req.url.includes('/auth/login') ||
    req.url.includes('/auth/refresh') ||
    req.url.includes('/auth/logout');

  const token = authService.getAccessToken();
  const authReq = token ? req.clone({ headers: req.headers.set('Authorization', 'Bearer ' + token) }) : req;

  return next(authReq).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse) {
        if (!isAuthEndpoint && err.status === 401) {
          // try refresh once
          return from(authService.refreshOnce()).pipe(
            switchMap(() => {
              const newToken = authService.getAccessToken();
              const retryReq = newToken ? req.clone({ headers: req.headers.set('Authorization', 'Bearer ' + newToken) }) : req;
              return next(retryReq);
            }),
            catchError(e => throwError(() => e))
          );
        } else if (err.status === 409) {
          messageService.add({
            severity: 'warn',
            summary: 'Conflito de Agendamento',
            detail: 'Este horário acabou de ser reservado por outra pessoa. Por favor, escolha outro.',
            life: 5000
          });
        } else if (err.status >= 500) {
          const traceId = err.headers.get('X-Trace-Id');
          messageService.add({
            severity: 'error',
            summary: 'Erro Interno',
            detail: `Ocorreu um erro inesperado no servidor.${traceId ? ' (Trace ID: ' + traceId + ')' : ''}`
          });
        }
      }
      return throwError(() => err);
    })
  );
};

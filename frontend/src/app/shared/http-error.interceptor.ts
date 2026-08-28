import { Injectable, inject } from '@angular/core';
import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { ToastService } from './toast.service';

@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {
  private toast = inject(ToastService);
  private auth = inject(AuthService);
  private router = inject(Router);

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((err: unknown) => {
        if (err instanceof HttpErrorResponse) {
          const isAuthEndpoint = /\/api\/auth\/(login|register|refresh|logout)(?:$|\/)/i.test(req.url);
          let detail = 'Falha inesperada na requisição.';

          if (err.error) {
            if (typeof err.error === 'string') {
              detail = err.error;
            } else if (err.error.message) {
              detail = err.error.message;
            } else if (err.error.detail) {
              detail = err.error.detail;
            }
          } else if (err.message) {
            detail = err.message;
          }

          if (err.status === 0) {
            this.toast.show('Não foi possível alcançar a API. Verifique o backend.', 'Rede indisponível', 'warning');
          } else if (err.status === 401 && !isAuthEndpoint) {
            this.toast.show('Sua sessão expirou. Faça login novamente.', 'Sessão expirada', 'error');
            this.auth.clearSession();
            this.router.navigateByUrl('/login');
          } else if (err.status === 409 && req.url.includes('/agendamentos')) {
            this.toast.show('Horário já reservado', 'Conflito', 'warning');
          } else if (err.status >= 500) {
            this.toast.show(detail, 'Erro no servidor', 'error');
          } else if (err.status !== 401) {
            this.toast.show(detail, 'Operação não concluída', 'warning');
          }
        }

        return throwError(() => err);
      })
    );
  }
}

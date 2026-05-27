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
          const detail = err.error?.detail || err.error?.message || err.message || 'Falha inesperada na requisição.';

          if (err.status === 0) {
            this.toast.show('Não foi possível alcançar a API. Verifique o backend.', 'Rede indisponível', 'warning');
          } else if (err.status === 401) {
            this.toast.show('Sua sessão expirou ou o acesso não foi autorizado.', 'Acesso negado', 'error');
            if (this.auth.isAuthenticated()) {
              this.auth.logout().catch(() => undefined);
            }
            this.router.navigateByUrl('/login');
          } else if (err.status === 409) {
            // Conflito de agendamento (concorrência)
            this.toast.show('Horário já reservado', 'Conflito', 'warning');
          } else if (err.status >= 500) {
          } else if (err.status >= 500) {
            this.toast.show(detail, 'Erro no servidor', 'error');
          } else {
            this.toast.show(detail, 'Operação não concluída', 'warning');
          }
        }

        return throwError(() => err);
      })
    );
  }
}

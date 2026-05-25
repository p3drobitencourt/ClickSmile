import { Injectable, inject } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Observable, from, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AuthInterceptor implements HttpInterceptor {
  private auth = inject(AuthService);

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Auth endpoints should not trigger refresh-on-401 recursion.
    const isAuthEndpoint = req.url.includes('/api/auth/login') || req.url.includes('/api/auth/refresh') || req.url.includes('/api/auth/logout');

    const token = this.auth.getAccessToken();
    const authReq = token ? req.clone({ headers: req.headers.set('Authorization', 'Bearer ' + token) }) : req;

    return next.handle(authReq).pipe(
      catchError((err: any) => {
        if (!isAuthEndpoint && err instanceof HttpErrorResponse && err.status === 401) {
          // try refresh once
          return from(this.auth.refreshOnce()).pipe(
            switchMap(() => {
              const newToken = this.auth.getAccessToken();
              const retryReq = newToken ? req.clone({ headers: req.headers.set('Authorization', 'Bearer ' + newToken) }) : req;
              return next.handle(retryReq);
            }),
            catchError(e => throwError(() => e))
          );
        }
        return throwError(() => err);
      })
    );
  }
}

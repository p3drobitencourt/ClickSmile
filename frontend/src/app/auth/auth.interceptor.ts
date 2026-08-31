import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  // Auth endpoints should not trigger refresh-on-401 recursion.
  const isAuthEndpoint =
    req.url.includes('/api/auth/login') ||
    req.url.includes('/api/auth/refresh') ||
    req.url.includes('/api/auth/logout') ||
    req.url.includes('/auth/login') ||
    req.url.includes('/auth/refresh') ||
    req.url.includes('/auth/logout') ||
    req.url.includes('/api/auth/register');

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
            catchError((e: unknown) => {
              // Ensure we throw the 401 from the refresh attempt so HttpErrorInterceptor can clear session
              if (e instanceof HttpErrorResponse && e.status === 401) {
                  return throwError(() => Object.assign({}, e, { isRefreshFailure: true }));
              }
              return throwError(() => e);
            })
          );
        }
      }
      return throwError(() => err);
    })
  );
};

import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from './auth/auth.interceptor';
import { RuntimePrefixInterceptor } from './services/runtime-prefix.interceptor';
import { HttpErrorInterceptor } from './shared/http-error.interceptor';
import { APP_INITIALIZER } from '@angular/core';
import { AuthService } from './auth/auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes), 
    provideHttpClient(withInterceptorsFromDi()),
    { provide: HTTP_INTERCEPTORS, useClass: RuntimePrefixInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: HttpErrorInterceptor, multi: true },
    { provide: APP_INITIALIZER, useFactory: (auth: AuthService) => () => auth.bootstrapSession(), deps: [AuthService], multi: true }
  ]
};
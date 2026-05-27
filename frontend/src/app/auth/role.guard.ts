import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from './auth.service';

function goLogin(router: Router): UrlTree {
  return router.parseUrl('/login');
}

function goHome(router: Router, role?: string | null): UrlTree {
  if (role === 'DENTISTA') {
    return router.parseUrl('/dentista');
  }

  if (role === 'CLIENTE') {
    return router.parseUrl('/cliente');
  }

  return router.parseUrl('/login');
}

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.isAuthenticated() ? true : goLogin(router);
};

export const clienteGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.isAuthenticated() && auth.getRole() === 'CLIENTE' ? true : goHome(router, auth.getRole());
};

export const dentistaGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.isAuthenticated() && auth.getRole() === 'DENTISTA' ? true : goHome(router, auth.getRole());
};

export const homeGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return goLogin(router);
  }

  return goHome(router, auth.getRole());
};

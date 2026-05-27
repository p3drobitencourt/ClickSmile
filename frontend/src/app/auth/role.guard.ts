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

export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.isAuthenticated() ? true : goLogin(router);
};

export const clienteGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return goLogin(router);
  }

  const profile = await auth.getProfile();
  return profile?.perfil === 'CLIENTE' ? true : goHome(router, profile?.perfil);
};

export const dentistaGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return goLogin(router);
  }

  const profile = await auth.getProfile();
  return profile?.perfil === 'DENTISTA' ? true : goHome(router, profile?.perfil);
};

export const homeGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return goLogin(router);
  }

  const profile = await auth.getProfile();
  return goHome(router, profile?.perfil);
};

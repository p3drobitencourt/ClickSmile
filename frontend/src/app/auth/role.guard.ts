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

  if (role === 'PACIENTE') {
    return router.parseUrl('/paciente');
  }

  if (role === 'RECEPCAO') {
    return router.parseUrl('/recepcao');
  }

  if (role === 'TENANT_ADMIN') {
    return router.parseUrl('/admin');
  }

  return router.parseUrl('/login');
}

export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.isAuthenticated() ? true : goLogin(router);
};

export const pacienteGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return goLogin(router);
  }

  const profile = await auth.getProfile();
  return profile?.perfil === 'PACIENTE' ? true : goLogin(router);
};

export const dentistaGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return goLogin(router);
  }

  const profile = await auth.getProfile();
  return profile?.perfil === 'DENTISTA' ? true : goLogin(router);
};

export const recepcaoGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return goLogin(router);
  }

  const profile = await auth.getProfile();
  return profile?.perfil === 'RECEPCAO' ? true : goLogin(router);
};

export const adminGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return goLogin(router);
  }

  const profile = await auth.getProfile();
  return profile?.perfil === 'TENANT_ADMIN' ? true : goLogin(router);
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

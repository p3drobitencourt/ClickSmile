import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { authGuard, pacienteGuard, dentistaGuard } from './role.guard';
import { AuthService } from './auth.service';
import { vi } from 'vitest';

describe('Role Guards', () => {
  let authServiceSpy: any;
  let routerSpy: any;

  beforeEach(() => {
    authServiceSpy = {
      isAuthenticated: vi.fn(),
      getProfile: vi.fn()
    };
    routerSpy = { parseUrl: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });
  });

  describe('authGuard', () => {
    it('should allow access if authenticated', async () => {
      authServiceSpy.isAuthenticated.mockReturnValue(true);
      const result = await TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
      expect(result).toBe(true);
    });

    it('should redirect to login if not authenticated', async () => {
      authServiceSpy.isAuthenticated.mockReturnValue(false);
      routerSpy.parseUrl.mockReturnValue('mock-url' as any);
      const result = await TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
      expect(result).toBe('mock-url');
      expect(routerSpy.parseUrl).toHaveBeenCalledWith('/login');
    });
  });

  describe('pacienteGuard', () => {
    it('should allow access if authenticated and profile is PACIENTE', async () => {
      authServiceSpy.isAuthenticated.mockReturnValue(true);
      authServiceSpy.getProfile.mockReturnValue(Promise.resolve({ perfil: 'PACIENTE', id: '1', email: 'test@test.com', tenantId: '1' }));
      const result = await TestBed.runInInjectionContext(() => pacienteGuard({} as any, {} as any));
      expect(result).toBe(true);
    });

    it('should redirect if authenticated but profile is DENTISTA', async () => {
      authServiceSpy.isAuthenticated.mockReturnValue(true);
      authServiceSpy.getProfile.mockReturnValue(Promise.resolve({ perfil: 'DENTISTA', id: '1', email: 'test@test.com', tenantId: '1' }));
      routerSpy.parseUrl.mockReturnValue('mock-dentista-url' as any);
      const result = await TestBed.runInInjectionContext(() => pacienteGuard({} as any, {} as any));
      expect(result).toBe('mock-dentista-url');
      expect(routerSpy.parseUrl).toHaveBeenCalledWith('/dentista');
    });
  });
});


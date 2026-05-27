import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { authGuard, clienteGuard, dentistaGuard } from './role.guard';
import { AuthService } from './auth.service';

describe('Role Guards', () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['isAuthenticated', 'getProfile']);
    routerSpy = jasmine.createSpyObj('Router', ['parseUrl']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });
  });

  describe('authGuard', () => {
    it('should allow access if authenticated', async () => {
      authServiceSpy.isAuthenticated.and.returnValue(true);
      const result = await TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
      expect(result).toBeTrue();
    });

    it('should redirect to login if not authenticated', async () => {
      authServiceSpy.isAuthenticated.and.returnValue(false);
      routerSpy.parseUrl.and.returnValue('mock-url' as any);
      const result = await TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
      expect(result).toBe('mock-url');
      expect(routerSpy.parseUrl).toHaveBeenCalledWith('/login');
    });
  });

  describe('clienteGuard', () => {
    it('should allow access if authenticated and profile is CLIENTE', async () => {
      authServiceSpy.isAuthenticated.and.returnValue(true);
      authServiceSpy.getProfile.and.returnValue(Promise.resolve({ perfil: 'CLIENTE', id: '1', email: 'test@test.com', tenantId: '1' }));
      const result = await TestBed.runInInjectionContext(() => clienteGuard({} as any, {} as any));
      expect(result).toBeTrue();
    });

    it('should redirect if authenticated but profile is DENTISTA', async () => {
      authServiceSpy.isAuthenticated.and.returnValue(true);
      authServiceSpy.getProfile.and.returnValue(Promise.resolve({ perfil: 'DENTISTA', id: '1', email: 'test@test.com', tenantId: '1' }));
      routerSpy.parseUrl.and.returnValue('mock-dentista-url' as any);
      const result = await TestBed.runInInjectionContext(() => clienteGuard({} as any, {} as any));
      expect(result).toBe('mock-dentista-url');
      expect(routerSpy.parseUrl).toHaveBeenCalledWith('/dentista');
    });
  });
});

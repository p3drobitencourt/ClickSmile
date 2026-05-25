import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login.component';
import { authGuard } from './auth/auth.guard';
import { OnboardingComponent } from './onboarding/onboarding.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'onboarding', component: OnboardingComponent, canActivate: [authGuard] },
  { path: '', loadComponent: () => import('./dashboard/dashboard').then(m => m.DashboardComponent), canActivate: [authGuard] },
  { path: '**', redirectTo: '' }
];
import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login.component';
import { RegisterComponent } from './auth/register.component';
import { authGuard, clienteGuard, dentistaGuard } from './auth/role.guard';
import { OnboardingComponent } from './onboarding/onboarding.component';
import { DashboardComponent } from './dashboard/dashboard';
import { HomeRedirectComponent } from './auth/home-redirect.component';

const DentistaDashboardComponent = () => import('./dentista/dentista-dashboard.component').then((m) => m.DentistaDashboardComponent);
const ClienteDashboardComponent = () => import('./cliente/cliente-dashboard.component').then((m) => m.ClienteDashboardComponent);
const CorporateLayoutComponent = () => import('./shared/layouts/corporate-layout.component').then((m) => m.CorporateLayoutComponent);

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'onboarding', component: OnboardingComponent, canActivate: [authGuard] },
  { 
    path: '', 
    loadComponent: CorporateLayoutComponent,
    children: [
      { path: 'cliente', loadComponent: ClienteDashboardComponent, canActivate: [clienteGuard] },
      { path: 'dentista', loadComponent: DentistaDashboardComponent, canActivate: [dentistaGuard] }
    ]
  },
  { path: '', component: HomeRedirectComponent },
  { path: '**', redirectTo: '' }
];
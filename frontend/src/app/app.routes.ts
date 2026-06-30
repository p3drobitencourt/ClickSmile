import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login.component';
import { RegisterComponent } from './auth/register.component';
import { authGuard, clienteGuard, dentistaGuard, adminGuard } from './auth/role.guard';
import { OnboardingComponent } from './onboarding/onboarding.component';
import { DashboardComponent } from './dashboard/dashboard';
import { HomeRedirectComponent } from './auth/home-redirect.component';

const AgendaViewComponent = () => import('./dentista/agenda-view.component').then((m) => m.AgendaViewComponent);
const PacientesViewComponent = () => import('./dentista/pacientes-view.component').then((m) => m.PacientesViewComponent);
const ConfigViewComponent = () => import('./dentista/config-view.component').then((m) => m.ConfigViewComponent);

const ClienteDashboardComponent = () => import('./cliente/cliente-dashboard.component').then((m) => m.ClienteDashboardComponent);
const CorporateLayoutComponent = () => import('./shared/layouts/corporate-layout.component').then((m) => m.CorporateLayoutComponent);
const AdminDashboardComponent = () => import('./admin/admin-dashboard.component').then((m) => m.AdminDashboardComponent);

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'onboarding', component: OnboardingComponent, canActivate: [authGuard] },
  { 
    path: '', 
    loadComponent: CorporateLayoutComponent,
    children: [
      { path: '', component: HomeRedirectComponent, pathMatch: 'full' },
      { path: 'cliente', loadComponent: ClienteDashboardComponent, canActivate: [clienteGuard] },
      { 
        path: 'dentista', 
        canActivate: [dentistaGuard],
        children: [
          { path: '', redirectTo: 'agenda', pathMatch: 'full' },
          { path: 'agenda', loadComponent: AgendaViewComponent },
          { path: 'pacientes', loadComponent: PacientesViewComponent },
          { path: 'configuracoes', loadComponent: ConfigViewComponent }
        ]
      },
      { path: 'admin', loadComponent: AdminDashboardComponent, canActivate: [adminGuard] }
    ]
  },
  { path: '**', redirectTo: '' }
];
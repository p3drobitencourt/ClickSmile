import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login.component';
import { RegisterComponent } from './auth/register.component';
import { authGuard, pacienteGuard, dentistaGuard, recepcaoGuard, adminGuard } from './auth/role.guard';
import { OnboardingComponent } from './onboarding/onboarding.component';
import { DashboardComponent } from './dashboard/dashboard';
import { HomeRedirectComponent } from './auth/home-redirect.component';

const DentistaPainelGeralComponent = () => import('./dentista/dentista-painel-geral.component').then((m) => m.DentistaPainelGeralComponent);
const PacientesViewComponent = () => import('./dentista/pacientes-view.component').then((m) => m.PacientesViewComponent);
const ConfigViewComponent = () => import('./dentista/config-view.component').then((m) => m.ConfigViewComponent);

const BuscarDentistasComponent = () => import('./paciente/buscar-dentistas.component').then((m) => m.BuscarDentistasComponent);
const ConsultasPacienteComponent = () => import('./paciente/meus-agendamentos.component').then((m) => m.MeusAgendamentosComponent);
const ChatPacienteComponent = () => import('./paciente/chat/chat-paciente.component').then((m) => m.ChatPacienteComponent);
const PerfilPacienteComponent = () => import('./paciente/perfil/perfil-paciente.component').then((m) => m.PerfilPacienteComponent);
const DashboardPacienteComponent = () => import('./paciente/dashboard/dashboard.component').then((m) => m.DashboardPacienteComponent);
const CorporateLayoutComponent = () => import('./shared/layouts/corporate-layout.component').then((m) => m.CorporateLayoutComponent);
const AdminDashboardComponent = () => import('./admin/admin-dashboard.component').then((m) => m.AdminDashboardComponent);

const RecepcaoDashboardComponent = () => import('./recepcao/recepcao-dashboard.component').then((m) => m.RecepcaoDashboardComponent);
const RecepcaoPacientesComponent = () => import('./recepcao/recepcao-pacientes.component').then((m) => m.RecepcaoPacientesComponent);

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'onboarding', component: OnboardingComponent, canActivate: [authGuard] },
  { 
    path: '', 
    loadComponent: CorporateLayoutComponent,
    children: [
      { path: '', component: HomeRedirectComponent, pathMatch: 'full' },
      { 
        path: 'paciente', 
        canActivate: [pacienteGuard],
        children: [
          { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
          { path: 'dashboard', loadComponent: DashboardPacienteComponent },
          { path: 'buscar', loadComponent: BuscarDentistasComponent },
          { path: 'consultas', loadComponent: ConsultasPacienteComponent },
          { path: 'chat', loadComponent: ChatPacienteComponent },
          { path: 'perfil', loadComponent: PerfilPacienteComponent }
        ]
      },
      { 
        path: 'dentista', 
        canActivate: [dentistaGuard],
        children: [
          { path: '', redirectTo: 'agenda', pathMatch: 'full' },
          { path: 'agenda', loadComponent: DentistaPainelGeralComponent },
          { path: 'pacientes', loadComponent: PacientesViewComponent },
          { path: 'configuracoes', loadComponent: ConfigViewComponent }
        ]
      },
      { 
        path: 'recepcao', 
        canActivate: [recepcaoGuard],
        children: [
          { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
          { path: 'dashboard', loadComponent: RecepcaoDashboardComponent },
          { path: 'pacientes', loadComponent: RecepcaoPacientesComponent }
        ]
      },
      { path: 'admin', loadComponent: AdminDashboardComponent, canActivate: [adminGuard] }
    ]
  },
  { path: '**', redirectTo: '' }
];
import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../auth/auth.service';
import { Subscription } from 'rxjs';
import { DashboardStateService, DashboardTab } from '../../services/dashboard-state.service';


import { ThemeService } from '../services/theme.service';

@Component({
  selector: 'app-corporate-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './corporate-layout.component.html',
  styleUrl: './corporate-layout.component.scss',
})
export class CorporateLayoutComponent implements OnInit, OnDestroy {
  isDentista = false;
  isAdmin = false;
  isRecepcao = false;
  userEmail = '';
  activeTab: DashboardTab = 'BUSCAR';
  
  private auth = inject(AuthService);
  private router = inject(Router);
  private dashboardState = inject(DashboardStateService);
  public themeService = inject(ThemeService);
  private sub = new Subscription();

  ngOnInit() {
    this.userEmail = this.auth.getEmail() || 'Usuário';
    this.isDentista = this.auth.getRole() === 'DENTISTA';
    this.isAdmin = this.auth.getRole() === 'ADMIN' || this.auth.getRole() === 'TENANT_ADMIN';
    this.isRecepcao = this.auth.getRole() === 'RECEPCAO';
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  logout(event: Event) {
    event.preventDefault();
    this.auth.clearSession();
    this.router.navigate(['/login']);
  }

  toggleTheme(event: Event) {
    event.preventDefault();
    this.themeService.toggleTheme();
  }

}

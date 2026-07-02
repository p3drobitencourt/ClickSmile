import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../auth/auth.service';
import { Subscription } from 'rxjs';
import { DashboardStateService, DashboardTab } from '../../services/dashboard-state.service';


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
  userEmail = '';
  activeTab: DashboardTab = 'BUSCAR';
  
  private auth = inject(AuthService);
  private router = inject(Router);
  private dashboardState = inject(DashboardStateService);
  private sub = new Subscription();

  ngOnInit() {
    this.userEmail = this.auth.getEmail() || 'Usuário';
    this.isDentista = this.auth.getRole() === 'DENTISTA';
    this.isAdmin = this.auth.getRole() === 'ADMIN';
    
    if (!this.isDentista && !this.isAdmin) {
      this.sub.add(
        this.dashboardState.activeTab$.subscribe(tab => this.activeTab = tab)
      );
    }
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  setTab(tab: DashboardTab, event: Event) {
    event.preventDefault();
    this.dashboardState.setActiveTab(tab);
    // If the user is somewhere else inside /cliente, force navigation back to the root of /cliente
    if (this.router.url !== '/cliente') {
      this.router.navigate(['/cliente']);
    }
  }

  logout(event: Event) {
    event.preventDefault();
    this.auth.clearSession();
    this.router.navigate(['/login']);
  }
}

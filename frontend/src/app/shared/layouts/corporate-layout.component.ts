import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../auth/auth.service';
import { Subscription } from 'rxjs';

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

  private auth = inject(AuthService);
  private router = inject(Router);

  ngOnInit() {
    this.userEmail = this.auth.getEmail() || 'Usuário';
    this.isDentista = this.auth.getRole() === 'DENTISTA';
    this.isAdmin = this.auth.getRole() === 'ADMIN';
  }

  ngOnDestroy() {
  }

  logout(event: Event) {
    event.preventDefault();
    this.auth.clearSession();
    this.router.navigate(['/login']);
  }
}

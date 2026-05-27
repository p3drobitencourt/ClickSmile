import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-home-redirect',
  standalone: true,
  template: '<div class="p-6 text-slate-200">Redirecting...</div>',
})
export class HomeRedirectComponent implements OnInit {
  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    const role = this.auth.getRole();

    if (role === 'DENTISTA') {
      void this.router.navigateByUrl('/dentista');
      return;
    }

    if (role === 'CLIENTE') {
      void this.router.navigateByUrl('/cliente');
      return;
    }

    void this.router.navigateByUrl('/login');
  }
}
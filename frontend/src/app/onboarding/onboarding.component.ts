import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './onboarding.component.html',
  styleUrl: './onboarding.component.scss'
})
export class OnboardingComponent {
  clinica = '';
  cnpj = '';
  telefone = '';

  constructor(private router: Router) {}

  concluir() {
    // Placeholder local until backend onboarding endpoint is implemented.
    localStorage.setItem('onboardingConcluido', 'true');
    this.router.navigateByUrl('/');
  }
}

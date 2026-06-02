import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { AdminService, AdminMetrics, AdminUsuario } from './admin.service';
import { ToastService } from '../shared/toast.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
})
export class AdminDashboardComponent implements OnInit {
  metrics: AdminMetrics | null = null;
  usuarios: AdminUsuario[] = [];
  loading = true;

  private service = inject(AdminService);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.loadData();
  }

  loadData() {
    this.loading = true;
    
    // Load metrics
    this.service.getMetricas().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => { this.metrics = data; },
      error: () => this.toast.show('Erro ao carregar métricas', 'error')
    });

    // Load users
    this.service.getUsuarios().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => { 
        this.usuarios = data;
        this.loading = false;
      },
      error: () => {
        this.toast.show('Erro ao carregar usuários', 'error');
        this.loading = false;
      }
    });
  }

  toggleBlock(u: AdminUsuario) {
    const newStatus = u.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
    this.service.toggleUserStatus(u.id, newStatus).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        u.status = newStatus;
        this.toast.show(`Usuário ${newStatus === 'BLOCKED' ? 'bloqueado' : 'desbloqueado'} com sucesso!`, 'success');
      },
      error: () => this.toast.show('Erro ao alterar status do usuário', 'error')
    });
  }
}

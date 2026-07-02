import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dentista-chat-requests',
  standalone: true,
  imports: [CommonModule],
  template: `
    <article class="bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-700">
      <h3 class="text-lg font-bold text-slate-100 mb-4 border-b border-slate-700 pb-2">Solicitações de Chat</h3>
      
      <div class="flex flex-col gap-3" *ngIf="requests.length > 0; else noRequests">
        <div class="flex justify-between items-center bg-slate-900 border border-slate-700 p-4 rounded-lg" *ngFor="let req of requests">
          <div class="flex flex-col">
            <strong class="text-slate-200">Paciente {{ req.clienteId | slice:0:8 }}...</strong>
            <span class="text-xs text-amber-500 mt-1 flex items-center gap-1">
              <span class="animate-pulse h-1.5 w-1.5 bg-amber-500 rounded-full"></span>
              Aguardando resposta
            </span>
          </div>
          <button class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm font-medium border-none cursor-pointer transition-colors" (click)="onAccept.emit(req.roomId)">Aceitar</button>
        </div>
      </div>
      
      <ng-template #noRequests>
        <div class="text-center p-8 bg-slate-900/50 rounded-lg border border-slate-700/50 border-dashed">
          <p class="text-slate-400">Nenhuma solicitação pendente.</p>
        </div>
      </ng-template>
    </article>
  `
})
export class DentistaChatRequestsComponent {
  @Input() requests: any[] = [];
  @Output() onAccept = new EventEmitter<string>();
}

import { Component } from '@angular/core';

@Component({
  selector: 'app-skeleton-card',
  standalone: true,
  template: `
    <div class="animate-pulse flex flex-col bg-slate-800 rounded-xl shadow-sm border border-slate-700 p-6 w-full">
      <div class="flex items-center space-x-4 mb-4">
        <div class="rounded-full bg-slate-700 h-12 w-12 shrink-0"></div>
        <div class="flex-1 space-y-3 py-1">
          <div class="h-3 bg-slate-700 rounded w-3/4"></div>
          <div class="h-3 bg-slate-700 rounded w-1/2"></div>
        </div>
      </div>
      <div class="space-y-3 flex-1 mt-2">
        <div class="h-2 bg-slate-700 rounded w-full"></div>
        <div class="h-2 bg-slate-700 rounded w-5/6"></div>
        <div class="h-2 bg-slate-700 rounded w-4/6"></div>
      </div>
      <div class="mt-6 flex justify-end">
        <div class="h-8 bg-slate-700 rounded w-24"></div>
      </div>
    </div>
  `
})
export class SkeletonCardComponent {}

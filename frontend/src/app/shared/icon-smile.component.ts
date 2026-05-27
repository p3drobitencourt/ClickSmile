import { Component } from '@angular/core';

@Component({
  selector: 'app-icon-smile',
  standalone: true,
  template: `
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="64" height="64" rx="12" fill="url(#g)" />
      <path d="M20 30c2 4 8 8 14 8s12-4 14-8" stroke="#0369A1" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="22" cy="26" r="2.5" fill="#022c3a" />
      <circle cx="42" cy="26" r="2.5" fill="#022c3a" />
      <path d="M50 12c2 0 6 4 6 6" stroke="#fef08a" stroke-width="2" stroke-linecap="round"/>
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#e6eef0" />
          <stop offset="100%" stop-color="#eef2ff" />
        </linearGradient>
      </defs>
    </svg>
  `,
  styles: [':host{display:inline-block;line-height:0}']
})
export class IconSmileComponent {}

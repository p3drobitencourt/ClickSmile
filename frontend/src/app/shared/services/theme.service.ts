import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_KEY = 'clicksmile-theme';
  isDarkMode = signal<boolean>(true);

  constructor() {
    this.initTheme();
  }

  private initTheme() {
    const savedTheme = localStorage.getItem(this.THEME_KEY);
    if (savedTheme) {
      this.isDarkMode.set(savedTheme === 'dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.isDarkMode.set(prefersDark);
    }
    this.applyTheme(this.isDarkMode());
  }

  toggleTheme() {
    this.isDarkMode.update(dark => {
      const newDark = !dark;
      this.applyTheme(newDark);
      localStorage.setItem(this.THEME_KEY, newDark ? 'dark' : 'light');
      return newDark;
    });
  }

  private applyTheme(isDark: boolean) {
    if (isDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }
}

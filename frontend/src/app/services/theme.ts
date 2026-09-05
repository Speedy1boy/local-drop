import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  isDark = signal<boolean>(false);

  constructor() {
    const saved = localStorage.getItem('localdrop_theme');
    if (saved) {
      this.setDark(saved === 'dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.setDark(prefersDark);
    }
  }

  toggle() {
    this.setDark(!this.isDark());
  }

  private setDark(dark: boolean) {
    this.isDark.set(dark);
    localStorage.setItem('localdrop_theme', dark ? 'dark' : 'light');
    if (dark) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }
}
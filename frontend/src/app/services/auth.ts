import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../config';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  
  isAuthenticated = signal<boolean>(!!localStorage.getItem('localdrop_token'));
  loginError = signal<string>('');

  login(pin: string) {
    this.http.post<{token: string}>(`${API_URL}/auth/login`, { pin }).subscribe({
      next: (res) => {
        localStorage.setItem('localdrop_token', res.token);
        this.isAuthenticated.set(true);
        this.loginError.set('');
        window.location.reload();
      },
      error: () => {
        this.loginError.set('Неверный PIN-код');
      }
    });
  }

  logout() {
    localStorage.removeItem('localdrop_token');
    this.isAuthenticated.set(false);
    window.location.reload();
  }
}
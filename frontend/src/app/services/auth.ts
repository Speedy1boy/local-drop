import { Injectable, signal, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { API_URL } from '../config';
import { firstValueFrom } from 'rxjs';
import { io, Socket } from 'socket.io-client';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private socket: Socket;
  
  isAuthenticated = signal<boolean>(!!localStorage.getItem('localdrop_token'));
  loginError = signal<string>('');
  userRole = signal<'admin' | 'guest' | null>(null);
  sessionId = signal<string | null>(null);
  
  isBanned = signal<boolean>(false);
  banMessage = signal<string>('Доступ запрещен.');

  isServerOnline = signal<boolean>(false);

  constructor() {
    this.decodeToken();
    this.socket = io(API_URL);
    
    this.socket.on('connect', () => {
      this.isServerOnline.set(true);
    });

    this.socket.on('disconnect', () => {
      this.isServerOnline.set(false);
    });

    this.socket.on('connect_error', () => {
      this.isServerOnline.set(false);
    });

    this.socket.on('forceLogout', (data: any) => {
      const sid = typeof data === 'string' ? data : data.sessionId;
      const banned = typeof data === 'string' ? false : data.isBanned;
      const reason = data.reason;
      
      if (this.sessionId() === sid) {
        localStorage.removeItem('localdrop_token');
        this.isAuthenticated.set(false);
        this.userRole.set(null);
        this.sessionId.set(null);
        
        if (banned) {
          this.isBanned.set(true);
          const suffix = (reason && reason !== 'Заблокирован администратором' && reason !== 'Brute force PIN') 
            ? `. Причина: ${reason}` 
            : '';
          this.banMessage.set(`Ваш IP заблокирован администратором${suffix}`);
        } else {
          window.location.reload();
        }
      }
    });
  }

  async initApp(): Promise<void> {
    try {
      await firstValueFrom(this.http.get(`${API_URL}/auth/ping`));
      this.isServerOnline.set(true);
    } catch (err: any) {
      if (err.status === 403) {
        this.isBanned.set(true);
        this.banMessage.set(err.error?.message || 'Ваш IP-адрес заблокирован навсегда.');
      }
    }
  }

  login(pin: string) {
    this.http.post<{token: string, role: 'admin' | 'guest'}>(`${API_URL}/auth/login`, { pin }).subscribe({
      next: (res) => {
        localStorage.setItem('localdrop_token', res.token);
        this.decodeToken();
        this.isAuthenticated.set(true);
        this.loginError.set('');
        window.location.reload();
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 503) {
          this.loginError.set(err.error?.message || 'Сайт на обслуживании.');
          return;
        }
        if (err.status === 403) {
          this.isBanned.set(true);
          this.banMessage.set(err.error?.message || 'Ваш IP-адрес заблокирован.');
          return;
        }
        this.loginError.set(err.error?.message || 'Неверный PIN-код');
      }
    });
  }

  logout() {
    localStorage.removeItem('localdrop_token');
    this.isAuthenticated.set(false);
    this.userRole.set(null);
    this.sessionId.set(null);
    window.location.reload();
  }

  private decodeToken() {
    const token = localStorage.getItem('localdrop_token');
    if (!token) return;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      this.userRole.set(payload.role || 'guest');
      this.sessionId.set(payload.sessionId || null);
    } catch {}
  }
}
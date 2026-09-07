import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../config';
import { firstValueFrom } from 'rxjs';
import { io, Socket } from 'socket.io-client';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private http = inject(HttpClient);
  private socket: Socket;

  sessions = signal<any[]>([]);
  logs = signal<any[]>([]);
  blockedIps = signal<any[]>([]);

  constructor() {
    this.socket = io(API_URL);
    this.socket.on('adminUpdate', (entity: string) => {
      if (entity === 'sessions') this.loadSessions();
      if (entity === 'logs') this.loadLogs();
      if (entity === 'bans') this.loadBlockedIps();
    });
  }

  async loadSessions() {
    const data = await firstValueFrom(this.http.get<any[]>(`${API_URL}/admin/sessions`));
    this.sessions.set(data);
  }

  async killSession(id: string) {
    await firstValueFrom(this.http.delete(`${API_URL}/admin/sessions/${id}`));
  }

  async banSession(id: string, reason?: string) {
    await firstValueFrom(this.http.post(`${API_URL}/admin/ban-session/${id}`, { reason }));
  }

  async banIp(ip: string, reason?: string) {
    await firstValueFrom(this.http.post(`${API_URL}/admin/ban-ip`, { ip, reason }));
  }

  async loadLogs() {
    const data = await firstValueFrom(this.http.get<any[]>(`${API_URL}/admin/security-logs`));
    this.logs.set(data);
  }

  async loadBlockedIps() {
    const data = await firstValueFrom(this.http.get<any[]>(`${API_URL}/admin/blocked-ips`));
    this.blockedIps.set(data);
  }

  async unblockIp(ip: string) {
    await firstValueFrom(this.http.post(`${API_URL}/admin/unblock-ip`, { ip }));
  }

  async resetAllGuests() {
    await firstValueFrom(this.http.post(`${API_URL}/admin/reset-guests`, {}));
  }

  async changePin(newPin: string) {
    await firstValueFrom(this.http.post(`${API_URL}/admin/change-pin`, { newPin }));
  }

  async toggleMaintenance(enabled: boolean) {
    return firstValueFrom(this.http.post<{success: boolean, maintenance: boolean}>(`${API_URL}/admin/toggle-maintenance`, { enabled }));
  }

  async cleanupDuplicates() {
    return firstValueFrom(this.http.post<{deleted: number}>(`${API_URL}/admin/maintenance/duplicates`, {}));
  }

  async cleanupZombies() {
    return firstValueFrom(this.http.post<{zombies: number, ghosts: number}>(`${API_URL}/admin/maintenance/zombies`, {}));
  }

  async cleanupClipboard() {
    return firstValueFrom(this.http.post<{deleted: number}>(`${API_URL}/admin/maintenance/clipboard`, {}));
  }
}
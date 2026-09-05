import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { io, Socket } from 'socket.io-client';
import { ClipboardItem } from '@local-drop/shared';
import { API_URL } from '../config';

@Injectable({
  providedIn: 'root'
})
export class ClipboardService {
  private http = inject(HttpClient);
  private socket: Socket;
  
  items = signal<ClipboardItem[]>([]);

  constructor() {
    this.socket = io(API_URL);
    this.fetchInitialData();

    this.socket.on('clipboardUpdated', (newItem: ClipboardItem) => {
      this.items.update(current => {
        if (current.find(item => item.id === newItem.id)) {
          return current;
        }
        return [newItem, ...current];
      });
    });

    this.socket.on('clipboardDeleted', (deletedId: string) => {
      this.items.update(current => current.filter(item => item.id !== deletedId));
    });
  }

  sendText(content: string) {
    this.http.post<ClipboardItem>(`${API_URL}/clipboard`, { content, type: 'text' }).subscribe();
  }

  deleteItem(id: string) {
    this.http.delete(`${API_URL}/clipboard/${id}`).subscribe();
  }

  private fetchInitialData() {
    this.http.get<ClipboardItem[]>(`${API_URL}/clipboard`).subscribe({
      next: (data) => this.items.set(data),
      error: (err) => console.error(err)
    });
  }
}
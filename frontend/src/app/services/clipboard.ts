import { Injectable, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';

export interface ClipboardItem {
  id: string;
  content: string;
  type: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class ClipboardService {
  private socket: Socket;
  
  items = signal<ClipboardItem[]>([]);

  constructor() {
    this.socket = io('http://localhost:3000');

    this.fetchInitialData();

    this.socket.on('clipboardUpdated', (newItem: ClipboardItem) => {
      this.items.update(current => [newItem, ...current]);
    });

    this.socket.on('clipboardDeleted', (deletedId: string) => {
      this.items.update(current => current.filter(item => item.id !== deletedId));
    });
  }

  sendText(content: string) {
    this.socket.emit('newClipboardItem', { content, type: 'text' });
  }

  deleteItem(id: string) {
    fetch(`http://localhost:3000/clipboard/${id}`, { method: 'DELETE' });
  }

  private async fetchInitialData() {
    try {
      const response = await fetch('http://localhost:3000/clipboard');
      const data = await response.json();
      this.items.set(data);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    }
  }
}
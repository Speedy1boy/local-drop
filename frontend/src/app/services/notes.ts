import { Injectable, signal, inject, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { io, Socket } from 'socket.io-client';
import { NoteItem } from '@local-drop/shared';
import { API_URL } from '../config';

@Injectable({ providedIn: 'root' })
export class NotesService {
  private http = inject(HttpClient);
  private socket: Socket;
  
  notes = signal<NoteItem[]>([]);
  
  allTags = computed(() => {
    const tags = new Set<string>();
    this.notes().forEach(n => n.tags.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  });

  constructor() {
    this.socket = io(API_URL);
    this.loadNotes();

    this.socket.on('note_created', (note: NoteItem) => {
      this.notes.update(curr => [note, ...curr]);
    });

    this.socket.on('note_updated', (updated: NoteItem) => {
      this.notes.update(curr => curr.map(n => n.id === updated.id ? updated : n));
    });

    this.socket.on('note_deleted', (id: string) => {
      this.notes.update(curr => curr.filter(n => n.id !== id));
    });
  }

  loadNotes() {
    this.http.get<NoteItem[]>(`${API_URL}/notes`).subscribe(data => this.notes.set(data));
  }

  saveNote(id: string | null, payload: any) {
    if (id) {
      this.http.put(`${API_URL}/notes/${id}`, payload).subscribe();
    } else {
      this.http.post(`${API_URL}/notes`, payload).subscribe();
    }
  }

  deleteNote(id: string) {
    this.http.delete(`${API_URL}/notes/${id}`).subscribe();
  }
}
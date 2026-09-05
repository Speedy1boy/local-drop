import { Injectable, signal, inject } from '@angular/core';
import { HttpClient, HttpEventType, HttpRequest } from '@angular/common/http';
import { FileItem } from '@local-drop/shared';
import { io, Socket } from 'socket.io-client';
import { API_URL } from '../config';

@Injectable({
  providedIn: 'root'
})
export class FilesService {
  private http = inject(HttpClient);
  private socket: Socket;
  
  files = signal<FileItem[]>([]);
  uploadProgress = signal<number | null>(null);

  constructor() {
    this.socket = io(API_URL);
    this.loadFiles();

    this.socket.on('fileUploaded', (newFile: FileItem) => {
      this.files.update(current => [newFile, ...current]);
    });

    this.socket.on('fileDeleted', (deletedId: string) => {
      this.files.update(current => current.filter(f => f.id !== deletedId));
    });
  }

  loadFiles() {
    this.http.get<FileItem[]>(`${API_URL}/files`).subscribe({
      next: (data) => this.files.set(data),
      error: (err) => console.error(err)
    });
  }

  uploadFile(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const req = new HttpRequest('POST', `${API_URL}/files/upload`, formData, {
      reportProgress: true
    });

    this.http.request(req).subscribe({
      next: (event: any) => {
        if (event.type === HttpEventType.UploadProgress) {
          const percentDone = Math.round(100 * event.loaded / event.total);
          this.uploadProgress.set(percentDone);
        } else if (event.type === HttpEventType.Response) {
          this.uploadProgress.set(null);
        }
      },
      error: () => this.uploadProgress.set(null)
    });
  }

  deleteFile(id: string) {
    this.http.delete(`${API_URL}/files/${id}`).subscribe();
  }
}
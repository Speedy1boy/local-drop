import { Injectable, signal, inject } from '@angular/core';
import { HttpClient, HttpEventType, HttpRequest } from '@angular/common/http';

export interface FileItem {
  id: string;
  originalName: string;
  fileName: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class FilesService {
  private http = inject(HttpClient);
  
  files = signal<FileItem[]>([]);
  uploadProgress = signal<number | null>(null);

  constructor() {
    this.loadFiles();
  }

  loadFiles() {
    this.http.get<FileItem[]>('http://localhost:3000/files').subscribe({
      next: (data) => this.files.set(data),
      error: (err) => console.error(err)
    });
  }

  uploadFile(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const req = new HttpRequest('POST', 'http://localhost:3000/files/upload', formData, {
      reportProgress: true
    });

    this.http.request(req).subscribe({
      next: (event: any) => {
        if (event.type === HttpEventType.UploadProgress) {
          const percentDone = Math.round(100 * event.loaded / event.total);
          this.uploadProgress.set(percentDone);
        } else if (event.type === HttpEventType.Response) {
          this.uploadProgress.set(null);
          this.files.update(current => [event.body, ...current]);
        }
      },
      error: () => this.uploadProgress.set(null)
    });
  }

  deleteFile(id: string) {
    this.http.delete(`http://localhost:3000/files/${id}`).subscribe(() => {
      this.files.update(current => current.filter(f => f.id !== id));
    });
  }
}
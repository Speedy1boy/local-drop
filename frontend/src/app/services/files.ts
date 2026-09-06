import { Injectable, signal, inject } from '@angular/core';
import { HttpClient, HttpEventType, HttpRequest } from '@angular/common/http';
import { FileItem, FolderItem, CreateFolderPayload } from '@local-drop/shared';
import { io, Socket } from 'socket.io-client';
import { API_URL } from '../config';
import { firstValueFrom } from 'rxjs';

interface GetContentsResponse {
  folders: FolderItem[];
  files: FileItem[];
}

@Injectable({
  providedIn: 'root'
})
export class FilesService {
  private http = inject(HttpClient);
  private socket: Socket;
  
  folders = signal<FolderItem[]>([]);
  files = signal<FileItem[]>([]);
  uploadProgress = signal<number | null>(null);
  
  currentFolderId = signal<string | null>(null);

  constructor() {
    this.socket = io(API_URL);
    this.loadContents();
    
    this.socket.on('fileMoved', (movedFile: FileItem) => {
      if (movedFile.folderId === this.currentFolderId()) {
        const exists = this.files().some(f => f.id === movedFile.id);
        if (!exists) this.files.update(curr => [movedFile, ...curr]);
      } else {
        this.files.update(curr => curr.filter(f => f.id !== movedFile.id));
      }
    });

    this.socket.on('folderMoved', (movedFolder: FolderItem) => {
      if (movedFolder.parentId === this.currentFolderId()) {
        const exists = this.folders().some(f => f.id === movedFolder.id);
        if (!exists) this.folders.update(curr => [movedFolder, ...curr]);
      } else {
        this.folders.update(curr => curr.filter(f => f.id !== movedFolder.id));
      }
    });
    
    this.socket.on('fileUploaded', (newFile: FileItem) => {
      if (newFile.folderId === this.currentFolderId()) {
        this.files.update(current => [newFile, ...current]);
      }
    });

    this.socket.on('fileDeleted', (deletedId: string) => {
      this.files.update(current => current.filter(f => f.id !== deletedId));
    });

    this.socket.on('folderCreated', (newFolder: FolderItem) => {
      if (newFolder.parentId === this.currentFolderId()) {
        this.folders.update(current => [newFolder, ...current]);
      }
    });

    this.socket.on('folderDeleted', (deletedId: string) => {
      this.folders.update(current => current.filter(f => f.id !== deletedId));
    });
  }

  loadContents(folderId: string | null = null) {
    this.currentFolderId.set(folderId);
    
    let url = `${API_URL}/files`;
    if (folderId) {
      url += `?folderId=${folderId}`;
    }

    this.http.get<GetContentsResponse>(url).subscribe({
      next: (data) => {
        this.folders.set(data.folders);
        this.files.set(data.files);
      },
      error: (err) => console.error(err)
    });
  }

  uploadFile(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const folderId = this.currentFolderId();
      if (folderId) {
        formData.append('folderId', folderId);
      }

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
            resolve();
          }
        },
        error: (err) => {
          this.uploadProgress.set(null);
          reject(err);
        }
      });
    });
  }

  deleteFile(id: string) {
    this.http.delete(`${API_URL}/files/${id}`).subscribe();
  }

  createFolder(name: string): Promise<FolderItem> {
    const payload: CreateFolderPayload = {
      name,
      parentId: this.currentFolderId()
    };
    return firstValueFrom(this.http.post<FolderItem>(`${API_URL}/files/folder`, payload));
  }

  deleteFolder(id: string) {
    this.http.delete(`${API_URL}/files/folder/${id}`).subscribe();
  }

  moveFile(fileId: string, folderId: string | null): Promise<FileItem> {
    return firstValueFrom(this.http.patch<FileItem>(`${API_URL}/files/${fileId}/move`, { folderId }));
  }

  moveFolder(folderId: string, parentId: string | null): Promise<FolderItem> {
    return firstValueFrom(this.http.patch<FolderItem>(`${API_URL}/files/folder/${folderId}/move`, { parentId }));
  }
}
import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog } from '@angular/material/dialog';
import { FilesService } from '../../services/files';
import { DragDropDirective } from '../../directives/drag-drop';
import { API_URL } from '../../config';
import { FileItem } from '@local-drop/shared';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog';
import { FileViewerDialog } from '../file-viewer/file-viewer';
import { Overlay } from '@angular/cdk/overlay';

@Component({
  selector: 'app-files',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatCardModule, MatProgressBarModule, DragDropDirective],
  templateUrl: './files.html',
  styleUrl: './files.scss'
})
export class FilesComponent {
  filesService = inject(FilesService);
  dialog = inject(MatDialog);
  apiUrl = API_URL;
  private overlay = inject(Overlay);
  
  hoveredGifs = signal<Set<string>>(new Set());

  failedMedia = signal<Set<string>>(new Set());

  onMediaError(id: string) {
    this.failedMedia.update(set => {
      const newSet = new Set(set);
      newSet.add(id);
      return newSet;
    });
  }
  
  onFileDropped(file: File) {
    this.filesService.uploadFile(file);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.filesService.uploadFile(input.files[0]);
    }
  }

  isImage(mimeType: string): boolean { return mimeType.startsWith('image/') && mimeType !== 'image/gif'; }
  isGif(mimeType: string): boolean { return mimeType === 'image/gif'; }
  isVideo(mimeType: string): boolean { return mimeType.startsWith('video/'); }

  onGifHover(id: string, isHovering: boolean) {
    this.hoveredGifs.update(set => {
      const newSet = new Set(set);
      if (isHovering) newSet.add(id);
      else newSet.delete(id);
      return newSet;
    });
  }

  isGifPlaying(id: string): boolean {
    return this.hoveredGifs().has(id);
  }

  onDownload(event: Event, file: FileItem) {
    event.stopPropagation();
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Скачивание файла',
        message: `Сохранить файл "${file.originalName}" на устройство?`,
        confirmText: 'Скачать'
      },
      width: '400px',
      scrollStrategy: this.overlay.scrollStrategies.noop() 
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) window.open(`${this.apiUrl}/files/download/${file.fileName}`, '_blank');
    });
  }

  onDelete(event: Event, id: string, name: string) {
    event.stopPropagation();
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Удаление файла',
        message: `Вы уверены, что хотите безвозвратно удалить файл "${name}"?`,
        confirmText: 'Удалить',
        color: 'warn'
      },
      width: '400px',
      scrollStrategy: this.overlay.scrollStrategies.noop() 
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) this.filesService.deleteFile(id);
    });
  }

  openViewer(file: FileItem) {
    const dialogRef = this.dialog.open(FileViewerDialog, {
      data: { file, url: `${this.apiUrl}/files/download/${file.fileName}` },
      panelClass: 'fullscreen-dialog',
      backdropClass: 'dark-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.block(),
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'delete') {
        this.filesService.deleteFile(file.id);
      }
    });
  }

  formatBytes(bytes: number, decimals = 2) {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  }
}
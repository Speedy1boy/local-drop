import { Component, Inject, inject, HostListener } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { FileItem } from '@local-drop/shared';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog';
import { Overlay } from '@angular/cdk/overlay';
import { FilesService } from '../../services/files';
import { API_URL } from '../../config';

@Component({
  selector: 'app-file-viewer',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatDialogModule],
  templateUrl: './file-viewer.html',
  styleUrl: './file-viewer.scss'
})
export class FileViewerDialog {
  private overlay = inject(Overlay);
  dialog = inject(MatDialog);
  filesService = inject(FilesService);

  currentFile: FileItem;
  currentIndex: number = 0;
  rotation: number = 0;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { file: FileItem, url: string },
    private dialogRef: MatDialogRef<FileViewerDialog>
  ) {
    this.currentFile = data.file;
    this.currentIndex = this.filesService.files().findIndex(f => f.id === this.currentFile.id);
  }

  get isImage() { return this.currentFile.mimeType.startsWith('image/'); }
  get isVideo() { return this.currentFile.mimeType.startsWith('video/'); }
  get isAudio() { return this.currentFile.mimeType.startsWith('audio/'); }
  get url() { return `${API_URL}/files/download/${this.currentFile.fileName}`; }

  get hasNext() { return this.currentIndex < this.filesService.files().length - 1; }
  get hasPrev() { return this.currentIndex > 0; }
  get isRotatedSideways(): boolean { return Math.abs((this.rotation / 90) % 2) === 1; }
  
  next() {
    if (this.hasNext) {
      this.currentIndex++;
      this.updateCurrentFile();
    }
  }

  prev() {
    if (this.hasPrev) {
      this.currentIndex--;
      this.updateCurrentFile();
    }
  }

  updateCurrentFile() {
    this.currentFile = this.filesService.files()[this.currentIndex];
    this.rotation = 0;
  }

  rotate() {
    this.rotation += 90;
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'ArrowRight') this.next();
    if (event.key === 'ArrowLeft') this.prev();
  }

  onDownload() {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Скачивание файла',
        message: `Сохранить файл "${this.currentFile.originalName}" на устройство?`,
        confirmText: 'Скачать'
      },
      width: '400px',
      scrollStrategy: this.overlay.scrollStrategies.noop()
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) window.open(this.url, '_blank');
    });
  }

  onDelete() {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Удаление файла',
        message: `Вы уверены, что хотите безвозвратно удалить файл "${this.currentFile.originalName}"?`,
        confirmText: 'Удалить',
        color: 'warn'
      },
      width: '400px',
      scrollStrategy: this.overlay.scrollStrategies.noop()
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) this.dialogRef.close({ action: 'delete', id: this.currentFile.id });
    });
  }
}
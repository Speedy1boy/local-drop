import { Component, Inject, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { FileItem } from '@local-drop/shared';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog';
import { Overlay } from '@angular/cdk/overlay';

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

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { file: FileItem, url: string },
    private dialogRef: MatDialogRef<FileViewerDialog>
  ) {}

  get isImage() { return this.data.file.mimeType.startsWith('image/'); }
  get isVideo() { return this.data.file.mimeType.startsWith('video/'); }
  get isAudio() { return this.data.file.mimeType.startsWith('audio/'); }
  get url() { return this.data.url; }

  onDownload() {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Скачивание файла',
        message: `Сохранить файл "${this.data.file.originalName}" на устройство?`,
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
        message: `Вы уверены, что хотите безвозвратно удалить файл "${this.data.file.originalName}"?`,
        confirmText: 'Удалить',
        color: 'warn'
      },
      width: '400px',
      scrollStrategy: this.overlay.scrollStrategies.noop()
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) this.dialogRef.close('delete');
    });
  }
}
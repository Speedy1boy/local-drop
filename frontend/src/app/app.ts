import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ClipboardService } from './services/clipboard';
import { FilesService } from './services/files';
import { DragDropDirective } from './directives/drag-drop';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    FormsModule,
    DatePipe,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressBarModule,
    DragDropDirective
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  clipboardService = inject(ClipboardService);
  filesService = inject(FilesService);
  newContent = '';

  send() {
    if (this.newContent.trim()) {
      this.clipboardService.sendText(this.newContent);
      this.newContent = '';
    }
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
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

  formatBytes(bytes: number, decimals = 2) {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  }
}
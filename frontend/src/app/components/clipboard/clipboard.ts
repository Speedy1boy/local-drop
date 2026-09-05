import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { ClipboardService } from '../../services/clipboard';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog';
import { Overlay } from '@angular/cdk/overlay';

@Component({
  selector: 'app-clipboard',
  standalone: true,
  imports: [
    FormsModule, 
    DatePipe, 
    MatInputModule, 
    MatButtonModule, 
    MatIconModule, 
    MatCardModule, 
    MatSnackBarModule
  ],
  templateUrl: './clipboard.html',
  styleUrl: './clipboard.scss'
})
export class ClipboardComponent {
  clipboardService = inject(ClipboardService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private overlay = inject(Overlay);
  
  newContent = '';

  send() {
    if (this.newContent.trim()) {
      this.clipboardService.sendText(this.newContent);
      this.newContent = '';
    }
  }

  deleteItem(id: string) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Удаление записи',
        message: 'Вы уверены, что хотите удалить эту запись из буфера обмена?',
        confirmText: 'Удалить',
        color: 'warn'
      },
      width: '400px',
      scrollStrategy: this.overlay.scrollStrategies.noop()
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) this.clipboardService.deleteItem(id);
    });
  }

  copyToClipboard(text: string) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => this.showSuccess());
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      textArea.style.top = '-9999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        const successful = document.execCommand('copy');
        if (successful) this.showSuccess();
      } catch (err) {
        this.snackBar.open('Не удалось скопировать', 'Закрыть', { duration: 3000 });
      }
      document.body.removeChild(textArea);
    }
  }

  private showSuccess() {
    this.snackBar.open('Скопировано в буфер обмена', 'ОК', {
      duration: 2000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }
}
import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-folder-dialog',
  standalone: true,
  imports: [MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule, FormsModule],
  template: `
    <!-- Динамический заголовок -->
    <h2 mat-dialog-title>{{ data?.name ? 'Переименовать папку' : 'Создать папку' }}</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" style="width: 100%; margin-top: 8px;">
        <mat-label>Название папки</mat-label>
        <input matInput [(ngModel)]="folderName" (keydown.enter)="save()" autofocus>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Отмена</button>
      <button mat-flat-button color="primary" (click)="save()" [disabled]="!folderName.trim()">Сохранить</button>
    </mat-dialog-actions>
  `
})
export class FolderDialogComponent {
  folderName = '';

  constructor(
    private dialogRef: MatDialogRef<FolderDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data?: { name: string }
  ) {
    if (data && data.name) {
      this.folderName = data.name;
    }
  }
  
  save() {
    if (this.folderName.trim()) {
      this.dialogRef.close(this.folderName.trim());
    }
  }
}
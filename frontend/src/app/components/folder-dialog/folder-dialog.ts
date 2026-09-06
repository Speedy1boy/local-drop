import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-folder-dialog',
  standalone: true,
  imports: [MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule, FormsModule],
  template: `
    <h2 mat-dialog-title>Создать папку</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" style="width: 100%; margin-top: 8px;">
        <mat-label>Название папки</mat-label>
        <input matInput [(ngModel)]="folderName" (keydown.enter)="save()" autofocus>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Отмена</button>
      <button mat-flat-button color="primary" (click)="save()" [disabled]="!folderName.trim()">Создать</button>
    </mat-dialog-actions>
  `
})
export class FolderDialogComponent {
  folderName = '';
  constructor(private dialogRef: MatDialogRef<FolderDialogComponent>) {}
  
  save() {
    if (this.folderName.trim()) {
      this.dialogRef.close(this.folderName.trim());
    }
  }
}
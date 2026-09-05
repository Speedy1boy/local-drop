import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatButtonModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <p>{{ data.message }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Отмена</button>
      <button mat-flat-button [color]="data.color || 'primary'" (click)="onConfirm()">
        {{ data.confirmText }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    p { font-size: 16px; margin: 8px 0 0 0; color: var(--mat-sys-on-surface-variant); }
  `]
})
export class ConfirmDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { title: string, message: string, confirmText: string, color?: string },
    private dialogRef: MatDialogRef<ConfirmDialogComponent>
  ) {}

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
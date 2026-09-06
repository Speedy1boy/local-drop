import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TextFieldModule } from '@angular/cdk/text-field';
import { NoteItem } from '@local-drop/shared';

@Component({
  selector: 'app-note-viewer',
  standalone: true,
  imports: [FormsModule, MatButtonModule, MatIconModule, MatInputModule, MatChipsModule, MatDialogModule, TextFieldModule],
  templateUrl: './note-viewer.html',
  styleUrl: './note-viewer.scss'
})
export class NoteViewerDialog {
  title = '';
  content = '';
  tags: string[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: NoteItem | null,
    private dialogRef: MatDialogRef<NoteViewerDialog>
  ) {
    if (data) {
      this.title = data.title || '';
      this.content = data.content || '';
      this.tags = data.tags ? [...data.tags] : [];
    }
  }

  addTag(event: any) {
    const value = (event.value || '').trim();
    if (value && !this.tags.includes(value)) {
      this.tags.push(value);
    }
    event.chipInput!.clear();
  }

  removeTag(tag: string) {
    this.tags = this.tags.filter(t => t !== tag);
  }

  onSave() {
    this.dialogRef.close({
      title: this.title.trim(),
      content: this.content.trim(),
      tags: this.tags
    });
  }
}
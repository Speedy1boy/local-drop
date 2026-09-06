import { Component, inject, signal, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialog } from '@angular/material/dialog';
import { NotesService } from '../../services/notes';
import { NoteItem } from '@local-drop/shared';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog';
import { NoteViewerDialog } from '../note-viewer/note-viewer';
import { Overlay } from '@angular/cdk/overlay';

@Component({
  selector: 'app-notes',
  standalone: true,
  imports: [
    DatePipe, 
    MatButtonModule, 
    MatIconModule, 
    MatCardModule, 
    MatChipsModule,
    MatInputModule,
    MatFormFieldModule
  ],
  templateUrl: './notes.html',
  styleUrl: './notes.scss'
})
export class NotesComponent {
  notesService = inject(NotesService);
  dialog = inject(MatDialog);
  
  selectedTag = signal<string | null>(null);
  searchQuery = signal<string>('');
  private overlay = inject(Overlay);

  filteredNotes = computed(() => {
    const tag = this.selectedTag();
    const query = this.searchQuery().toLowerCase().trim();
    let notes = this.notesService.notes();

    if (tag) {
      notes = notes.filter(n => Array.isArray(n.tags) && n.tags.includes(tag));
    }

    if (query) {
      notes = notes.filter(n => {
        const titleMatch = n.title?.toLowerCase().includes(query) || false;
        const contentMatch = n.content?.toLowerCase().includes(query) || false;
        const tagMatch = Array.isArray(n.tags) && n.tags.some(t => t.toLowerCase().includes(query));
        
        return titleMatch || contentMatch || tagMatch;
      });
    }

    return notes;
  });

  setFilter(tag: string | null) {
    this.selectedTag.set(tag);
  }

  updateSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  openNoteDialog(note: NoteItem | null = null) {
    const dialogRef = this.dialog.open(NoteViewerDialog, {
      data: note,
      width: '600px',
      maxWidth: '95vw',
      scrollStrategy: this.overlay.scrollStrategies.noop() 
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.notesService.saveNote(note ? note.id : null, result);
      }
    });
  }

  onDelete(event: Event, id: string) {
    event.stopPropagation();
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Удаление заметки',
        message: 'Вы уверены, что хотите удалить эту заметку?',
        confirmText: 'Удалить',
        color: 'warn'
      },
      width: '400px',
      scrollStrategy: this.overlay.scrollStrategies.noop() 
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) this.notesService.deleteNote(id);
    });
  }
}
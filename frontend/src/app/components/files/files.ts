import { Component, HostListener, inject, signal, computed, ViewChild, ElementRef, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FilesService } from '../../services/files';
import { DragDropDirective } from '../../directives/drag-drop';
import { API_URL } from '../../config';
import { FileItem, FolderItem } from '@local-drop/shared';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog';
import { FileViewerDialog } from '../file-viewer/file-viewer';
import { Overlay } from '@angular/cdk/overlay';
import { FolderDialogComponent } from '../folder-dialog/folder-dialog';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-files',
  standalone: true,
  imports: [
    MatButtonModule, 
    MatIconModule, 
    MatCardModule, 
    MatProgressBarModule, 
    MatSnackBarModule, 
    MatFormFieldModule, 
    MatInputModule, 
    FormsModule, 
    DragDropDirective
  ],
  templateUrl: './files.html',
  styleUrl: './files.scss',
  animations: [
    trigger('itemAnim', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('250ms ease-out', style({ opacity: 1 }))
      ])
    ])
  ]
})
export class FilesComponent implements OnInit {
  filesService = inject(FilesService);
  dialog = inject(MatDialog);
  private overlay = inject(Overlay);
  private snackBar = inject(MatSnackBar);

  ngOnInit() {
    this.breadcrumbs.set([]);
    this.filesService.loadContents(null);
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'instant' }), 0);
  }

  apiUrl = API_URL;
  
  hoveredGifs = signal<Set<string>>(new Set());
  failedMedia = signal<Set<string>>(new Set());
  stagedFile = signal<File | null>(null);

  breadcrumbs = signal<{ id: string, name: string }[]>([]);
  
  draggedItem = signal<{id: string, type: 'file' | 'folder'} | null>(null);
  hoveredDropZoneId = signal<string | undefined>(undefined);

  searchQuery = signal('');
  activeFilter = signal<'all' | 'image' | 'video' | 'doc'>('all');

  isBreadcrumbsScrolled = signal(false);

  private clickTimeout: any;

  onFolderClick(folder: FolderItem) {
    if (this.clickTimeout) {
      clearTimeout(this.clickTimeout);
      this.clickTimeout = null;
      this.openFolder(folder);
    } else {
      this.clickTimeout = setTimeout(() => {
        this.clickTimeout = null;
      }, 300);
    }
  }

  onBreadcrumbsScroll(event: Event) {
    const el = event.target as HTMLElement;
    this.isBreadcrumbsScrolled.set(el.scrollLeft > 5);
  }

  filteredFolders = computed(() => {
    if (this.activeFilter() !== 'all') {
      return [];
    }
    const query = this.searchQuery().toLowerCase();
    return this.filesService.folders().filter(f => f.name.toLowerCase().includes(query));
  });

  filteredFiles = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const filter = this.activeFilter();
    
    return this.filesService.files().filter(f => {
      const matchesQuery = f.originalName.toLowerCase().includes(query);
      
      let matchesFilter = true;
      if (filter === 'image') matchesFilter = f.mimeType.startsWith('image/');
      else if (filter === 'video') matchesFilter = f.mimeType.startsWith('video/');
      else if (filter === 'doc') matchesFilter = !f.mimeType.startsWith('image/') && !f.mimeType.startsWith('video/');

      return matchesQuery && matchesFilter;
    });
  });

  @ViewChild('breadcrumbsContainer') breadcrumbsContainer!: ElementRef<HTMLDivElement>;

  private scrollBreadcrumbsToEnd() {
    setTimeout(() => {
      if (this.breadcrumbsContainer) {
        const el = this.breadcrumbsContainer.nativeElement;
        el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' });
      }
    }, 10);
  }

  onDragStart(event: DragEvent, id: string, type: 'file' | 'folder') {
    event.stopPropagation(); 
    this.draggedItem.set({ id, type });
    event.dataTransfer?.setData('text/plain', id);
  }

  onDragOverZone(event: DragEvent, zoneId: string | null) {
    event.preventDefault();
    const item = this.draggedItem();
    if (item?.type === 'folder' && item.id === zoneId) return;
    this.hoveredDropZoneId.set(zoneId === null ? 'root' : zoneId);
  }

  onDragLeaveZone() {
    this.hoveredDropZoneId.set(undefined);
  }

  async onDrop(event: DragEvent, targetFolderId: string | null) {
    event.preventDefault();
    this.hoveredDropZoneId.set(undefined);
    
    const item = this.draggedItem();
    if (!item) return;

    if (item.type === 'folder' && item.id === targetFolderId) {
      this.draggedItem.set(null);
      return;
    }

    try {
      if (item.type === 'file') {
        await this.filesService.moveFile(item.id, targetFolderId);
        this.filesService.files.update(curr => curr.filter(f => f.id !== item.id));
      } else {
        await this.filesService.moveFolder(item.id, targetFolderId);
        this.filesService.folders.update(curr => curr.filter(f => f.id !== item.id));
      }
      this.snackBar.open('Перемещено', 'ОК', { duration: 2000 });
    } catch (e) {
      this.snackBar.open('Ошибка при перемещении', 'Закрыть', { duration: 3000 });
    }
    
    this.draggedItem.set(null);
  }

  onDragEnd() {
    this.draggedItem.set(null);
    this.hoveredDropZoneId.set(undefined);
  }

  openFolder(folder: FolderItem) {
    this.breadcrumbs.update(crumbs => [...crumbs, { id: folder.id, name: folder.name }]);
    this.filesService.loadContents(folder.id);
    this.scrollBreadcrumbsToEnd();
  }

  goToBreadcrumb(index: number) {
    if (index === -1) {
      this.breadcrumbs.set([]);
      this.filesService.loadContents(null);
      this.isBreadcrumbsScrolled.set(false)
    } else {
      const crumbs = this.breadcrumbs();
      const targetFolder = crumbs[index];
      this.breadcrumbs.set(crumbs.slice(0, index + 1));
      this.filesService.loadContents(targetFolder.id);
    }
    this.scrollBreadcrumbsToEnd();
  }

  createFolder() {
    const dialogRef = this.dialog.open(FolderDialogComponent, { 
      width: '400px',
      scrollStrategy: this.overlay.scrollStrategies.noop()
    });
    
    dialogRef.afterClosed().subscribe(async name => {
      if (name) {
        try {
          await this.filesService.createFolder(name);
          this.snackBar.open(`Папка "${name}" создана`, 'ОК', { duration: 3000 });
        } catch (e) {
          this.snackBar.open('Ошибка при создании папки', 'Закрыть', { duration: 3000 });
        }
      }
    });
  }

  onDeleteFolder(event: Event, id: string, name: string) {
    event.stopPropagation();
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Удаление папки',
        message: `Удалить папку "${name}" и ВСЕ файлы внутри нее? Это действие необратимо.`,
        confirmText: 'Удалить',
        color: 'warn'
      },
      width: '400px',
      scrollStrategy: this.overlay.scrollStrategies.noop()
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) this.filesService.deleteFolder(id);
    });
  }

  onRenameFolder(event: Event, folder: FolderItem) {
    event.stopPropagation();
    const dialogRef = this.dialog.open(FolderDialogComponent, {
      width: '400px',
      data: { name: folder.name },
      scrollStrategy: this.overlay.scrollStrategies.noop()
    });

    dialogRef.afterClosed().subscribe(async newName => {
      if (newName && newName !== folder.name) {
        try {
          await this.filesService.renameFolder(folder.id, newName);
          this.snackBar.open('Папка переименована', 'ОК', { duration: 2000 });
        } catch (e) {
          this.snackBar.open('Ошибка при переименовании', 'Закрыть', { duration: 3000 });
        }
      }
    });
  }

  @HostListener('window:paste', ['$event'])
  onPaste(event: ClipboardEvent) {
    const files = event.clipboardData?.files;
    if (files && files.length > 0) this.stagedFile.set(files[0]);
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
      if (this.stagedFile()) {
        this.stagedFile.set(null);
        event.preventDefault();
      }
    }
  }
  
  @HostListener('window:keydown.enter', ['$event'])
  onEnter(event: Event) {
    const keyboardEvent = event as KeyboardEvent;
    if (this.stagedFile()) {
      event.preventDefault();
      this.confirmUpload(keyboardEvent);
    }
  }

  onMediaError(id: string) {
    this.failedMedia.update(set => {
      const newSet = new Set(set);
      newSet.add(id);
      return newSet;
    });
  }
  
  onFileDropped(file: File) { this.stagedFile.set(file); }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) this.stagedFile.set(input.files[0]);
    input.value = '';
  }

  cancelUpload(event: Event) {
    event.stopPropagation();
    this.stagedFile.set(null);
  }

  async confirmUpload(event: Event) {
    event.stopPropagation();
    const file = this.stagedFile();
    if (!file) return;

    try {
      await this.filesService.uploadFile(file);
      this.snackBar.open('Файл успешно загружен!', 'ОК', { duration: 3000 });
      this.stagedFile.set(null); 
    } catch (error) {
      this.snackBar.open('Ошибка при загрузке файла', 'Закрыть', { duration: 5000 });
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
  isGifPlaying(id: string): boolean { return this.hoveredGifs().has(id); }

  onDownload(event: Event, file: FileItem) {
    event.stopPropagation();
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Скачивание файла', message: `Сохранить файл "${file.originalName}" на устройство?`, confirmText: 'Скачать' },
      width: '400px', scrollStrategy: this.overlay.scrollStrategies.noop() 
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) window.open(`${this.apiUrl}/files/download/${file.fileName}`, '_blank');
    });
  }

  onDelete(event: Event, id: string, name: string) {
    event.stopPropagation();
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Удаление файла', message: `Удалить файл "${name}"?`, confirmText: 'Удалить', color: 'warn' },
      width: '400px', scrollStrategy: this.overlay.scrollStrategies.noop() 
    });
    dialogRef.afterClosed().subscribe(result => { if (result) this.filesService.deleteFile(id); });
  }

  openViewer(file: FileItem) {
    const dialogRef = this.dialog.open(FileViewerDialog, {
      data: { file, url: `${this.apiUrl}/files/download/${file.fileName}` },
      panelClass: 'fullscreen-dialog', backdropClass: 'dark-backdrop', scrollStrategy: this.overlay.scrollStrategies.block(), autoFocus: false
    });
    dialogRef.afterClosed().subscribe(result => { if (result?.action === 'delete') this.filesService.deleteFile(result.id); });
  }

  formatBytes(bytes: number, decimals = 2) {
    if (!+bytes) return '0 Bytes';
    const k = 1024, dm = decimals < 0 ? 0 : decimals, sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'], i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  }
}
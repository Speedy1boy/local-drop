import { Component, OnInit, inject, ViewChild, computed, HostListener, TemplateRef, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Overlay } from '@angular/cdk/overlay';
import { AdminService } from '../../services/admin';
import { AuthService } from '../../services/auth';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    DatePipe, FormsModule, MatTabsModule, MatCardModule, 
    MatButtonModule, MatIconModule, MatTableModule, MatSortModule,
    MatSnackBarModule, MatInputModule, MatSlideToggleModule, MatDialogModule
  ],
  templateUrl: './admin.html',
  styleUrl: './admin.scss'
})
export class AdminComponent implements OnInit {
  adminService = inject(AdminService);
  authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  dialog = inject(MatDialog);
  private overlay = inject(Overlay);

  newPin = '';
  maintenanceMode = false;
  activeTabIndex = 0;

  sessionColumns = ['role', 'ip', 'userAgent', 'lastActive', 'actions'];
  logColumns = ['createdAt', 'ip', 'action', 'details', 'actions'];
  blockedColumns = ['createdAt', 'ip', 'userAgent', 'reason', 'actions'];

  colWidths: { [key: string]: number } = JSON.parse(localStorage.getItem('admin_col_widths') || '{}');

  sessionSearch = signal('');
  blockSearch = signal('');
  logSearch = signal('');

  @ViewChild('sessionSort') sessionSort!: MatSort;
  @ViewChild('logSort') logSort!: MatSort;
  @ViewChild('blockSort') blockSort!: MatSort;
  @ViewChild('banDialogTemplate') banDialogTemplate!: TemplateRef<any>;
  @ViewChild('banIpDialogTemplate') banIpDialogTemplate!: TemplateRef<any>;

  dsSessions = computed(() => {
    const ds = new MatTableDataSource(this.adminService.sessions());
    ds.sort = this.sessionSort;
    ds.filter = this.sessionSearch().trim().toLowerCase();
    return ds;
  });

  dsLogs = computed(() => {
    const ds = new MatTableDataSource(this.adminService.logs());
    ds.sort = this.logSort;
    ds.filter = this.logSearch().trim().toLowerCase();
    return ds;
  });

  dsBlocked = computed(() => {
    const ds = new MatTableDataSource(this.adminService.blockedIps());
    ds.sort = this.blockSort;
    ds.filter = this.blockSearch().trim().toLowerCase();
    return ds;
  });

  isResizing = false;
  currentCol = '';
  startX = 0;
  startWidth = 0;

  banReason = '';
  sessionToBan: string | null = null;
  
  ipToBan = '';
  manualBanReason = '';

  ngOnInit() {
    const savedTab = localStorage.getItem('admin_tab_index');
    if (savedTab) this.activeTabIndex = parseInt(savedTab, 10);

    this.adminService.loadSessions();
    this.adminService.loadLogs();
    this.adminService.loadBlockedIps();
  }

  onTabChange(index: number) {
    this.activeTabIndex = index;
    localStorage.setItem('admin_tab_index', index.toString());
  }

  applySessionSearch(event: Event) { this.sessionSearch.set((event.target as HTMLInputElement).value); }
  applyBlockSearch(event: Event) { this.blockSearch.set((event.target as HTMLInputElement).value); }
  applyLogSearch(event: Event) { this.logSearch.set((event.target as HTMLInputElement).value); }

  onResizeStart(event: MouseEvent, col: string) {
    event.stopPropagation();
    event.preventDefault();
    this.isResizing = true;
    this.currentCol = col;
    this.startX = event.pageX;
    const th = (event.target as HTMLElement).closest('th');
    this.startWidth = th ? th.offsetWidth : 100;
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (!this.isResizing) return;
    const newWidth = this.startWidth + (event.pageX - this.startX);
    this.colWidths[this.currentCol] = Math.max(60, newWidth);
  }

  @HostListener('document:mouseup')
  onMouseUp() {
    if (this.isResizing) {
      this.isResizing = false;
      localStorage.setItem('admin_col_widths', JSON.stringify(this.colWidths));
    }
  }

  getColWidth(col: string) {
    return this.colWidths[col] ? `${this.colWidths[col]}px` : 'auto';
  }

  killSession(id: string) {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Отключить устройство', message: 'Выкинуть пользователя из системы?', confirmText: 'Отключить', color: 'warn' },
      width: '400px', scrollStrategy: this.overlay.scrollStrategies.noop()
    });
    ref.afterClosed().subscribe(res => {
      if (res) this.adminService.killSession(id);
    });
  }

  banSession(id: string) {
    this.sessionToBan = id;
    this.banReason = '';
    this.dialog.open(this.banDialogTemplate, {
      width: '400px',
      scrollStrategy: this.overlay.scrollStrategies.noop()
    });
  }

  confirmBan() {
    if (this.sessionToBan) {
      this.adminService.banSession(this.sessionToBan, this.banReason);
      this.dialog.closeAll();
      this.sessionToBan = null;
      this.banReason = '';
    }
  }

  openBanIpDialog(ip?: string) {
    this.ipToBan = ip || '';
    this.manualBanReason = '';
    this.dialog.open(this.banIpDialogTemplate, {
      width: '400px',
      scrollStrategy: this.overlay.scrollStrategies.noop()
    });
  }

  confirmBanIp() {
    if (this.ipToBan.trim()) {
      this.adminService.banIp(this.ipToBan.trim(), this.manualBanReason);
      this.dialog.closeAll();
      this.ipToBan = '';
      this.manualBanReason = '';
    }
  }

  cancelBan() {
    this.dialog.closeAll();
    this.sessionToBan = null;
    this.banReason = '';
    this.ipToBan = '';
    this.manualBanReason = '';
  }

  unblockIp(ip: string) {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Разблокировать IP', message: `Снять блокировку с ${ip}?`, confirmText: 'Разблокировать' },
      width: '400px', scrollStrategy: this.overlay.scrollStrategies.noop()
    });
    ref.afterClosed().subscribe(res => {
      if (res) this.adminService.unblockIp(ip);
    });
  }

  resetAllGuests() {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Сброс гостей', message: 'Все гости будут выкинуты на экран входа. Продолжить?', confirmText: 'Сбросить', color: 'warn' },
      width: '400px', scrollStrategy: this.overlay.scrollStrategies.noop()
    });
    ref.afterClosed().subscribe(res => {
      if (res) {
        this.adminService.resetAllGuests();
        this.snackBar.open('Доступы сброшены', 'ОК', { duration: 3000 });
      }
    });
  }

  async changePin() {
    await this.adminService.changePin(this.newPin);
    this.newPin = '';
    this.snackBar.open('ПИН-код изменен', 'ОК', { duration: 3000 });
  }

  async toggleMaintenance() {
    const res = await this.adminService.toggleMaintenance(this.maintenanceMode);
    this.snackBar.open(res.maintenance ? 'Режим обслуживания ВКЛЮЧЕН' : 'Режим обслуживания ВЫКЛЮЧЕН', 'ОК', { duration: 3000 });
  }

  cleanupDuplicates() {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Удалить дубликаты', message: 'Система удалит файлы с одинаковым названием и размером.', confirmText: 'Удалить', color: 'primary' },
      width: '400px', scrollStrategy: this.overlay.scrollStrategies.noop()
    });
    ref.afterClosed().subscribe(async res => {
      if (res) {
        const response = await this.adminService.cleanupDuplicates();
        this.snackBar.open(`Удалено дубликатов: ${response.deleted}`, 'ОК', { duration: 3000 });
      }
    });
  }

  cleanupZombies() {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Очистить Зомби-файлы', message: 'Будут удалены файлы на диске без записей в БД и наоборот.', confirmText: 'Очистить', color: 'warn' },
      width: '400px', scrollStrategy: this.overlay.scrollStrategies.noop()
    });
    ref.afterClosed().subscribe(async res => {
      if (res) {
        const response = await this.adminService.cleanupZombies();
        this.snackBar.open(`Удалено с диска: ${response.zombies}, удалено из БД: ${response.ghosts}`, 'ОК', { duration: 4000 });
      }
    });
  }

  cleanupClipboard() {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Очистить буфер', message: 'Удалить все записи буфера обмена старше 7 дней?', confirmText: 'Очистить', color: 'warn' },
      width: '400px', scrollStrategy: this.overlay.scrollStrategies.noop()
    });
    ref.afterClosed().subscribe(async res => {
      if (res) {
        const response = await this.adminService.cleanupClipboard();
        this.snackBar.open(`Удалено записей: ${response.deleted}`, 'ОК', { duration: 3000 });
      }
    });
  }
}
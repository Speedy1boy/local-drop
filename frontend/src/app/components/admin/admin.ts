import { Component, OnInit, inject, ViewChild, computed } from '@angular/core';
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
import { MatDialog } from '@angular/material/dialog';
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
    MatSnackBarModule, MatInputModule, MatSlideToggleModule
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
  logColumns = ['createdAt', 'ip', 'action', 'details'];
  blockedColumns = ['createdAt', 'ip', 'userAgent', 'reason', 'actions'];

  colWidths: { [key: string]: number } = JSON.parse(localStorage.getItem('admin_col_widths') || '{}');

  @ViewChild('sessionSort') sessionSort!: MatSort;
  @ViewChild('logSort') logSort!: MatSort;
  @ViewChild('blockSort') blockSort!: MatSort;

  dsSessions = computed(() => {
    const ds = new MatTableDataSource(this.adminService.sessions());
    ds.sort = this.sessionSort;
    return ds;
  });

  dsLogs = computed(() => {
    const ds = new MatTableDataSource(this.adminService.logs());
    ds.sort = this.logSort;
    return ds;
  });

  dsBlocked = computed(() => {
    const ds = new MatTableDataSource(this.adminService.blockedIps());
    ds.sort = this.blockSort;
    return ds;
  });

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

  saveColWidth(col: string, event: MouseEvent) {
    const th = (event.target as HTMLElement).closest('th');
    if (th) {
      this.colWidths[col] = th.offsetWidth;
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
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Заблокировать навсегда', message: 'Пользователь будет выкинут, а его IP заблокирован навсегда.', confirmText: 'Забанить', color: 'warn' },
      width: '400px', scrollStrategy: this.overlay.scrollStrategies.noop()
    });
    ref.afterClosed().subscribe(res => {
      if (res) this.adminService.banSession(id);
    });
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
}
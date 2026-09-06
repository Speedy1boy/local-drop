import { Component, inject, signal, computed } from '@angular/core';
import { trigger, style, animate, transition } from '@angular/animations';
import { BreakpointObserver } from '@angular/cdk/layout';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from './services/auth';
import { ThemeService } from './services/theme';
import { LoginComponent } from './components/login/login';
import { ClipboardComponent } from './components/clipboard/clipboard';
import { FilesComponent } from './components/files/files';
import { NotesComponent } from './components/notes/notes';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    LoginComponent,
    ClipboardComponent,
    FilesComponent,
    NotesComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  animations: [
    trigger('pageAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(15px)' }),
        animate('400ms cubic-bezier(0.2, 0, 0, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class App {
  authService = inject(AuthService);
  themeService = inject(ThemeService);
  private breakpointObserver = inject(BreakpointObserver);

  activeView: 'clipboard' | 'files' | 'notes' = 'clipboard'; 
  
  protected readonly window = window;
  isMobile = signal<boolean>(false);
  isSidenavOpen = signal<boolean>(true);
  savedSidenavPosition = signal<'start' | 'end'>('start');

  actualSidenavPosition = computed(() => {
    if (this.isMobile()) return 'start';
    return this.savedSidenavPosition();
  });

  constructor() {
    const savedPos = localStorage.getItem('localdrop_sidenav_pos');
    if (savedPos === 'start' || savedPos === 'end') {
      this.savedSidenavPosition.set(savedPos);
    }

    const savedView = localStorage.getItem('localdrop_active_view');
    if (savedView === 'clipboard' || savedView === 'files' || savedView === 'notes') {
      this.activeView = savedView;
    }

    const isTouchDevice = () => window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;

    this.breakpointObserver
      .observe([
        '(max-width: 767px)', 
        '(max-width: 950px) and (orientation: landscape)'
      ])
      .pipe(takeUntilDestroyed())
      .subscribe(result => {
        const isMobileSize = result.matches;
        const isHorizontalPhone = isTouchDevice() && window.innerHeight < 500;
        const mobile = isMobileSize || isHorizontalPhone;
        
        this.isMobile.set(mobile);
        this.isSidenavOpen.set(!mobile);
      });
  }

  toggleSidenav() {
    this.isSidenavOpen.update(v => !v);
  }

  togglePosition() {
    const newPos = this.savedSidenavPosition() === 'start' ? 'end' : 'start';
    this.savedSidenavPosition.set(newPos);
    localStorage.setItem('localdrop_sidenav_pos', newPos);
  }

  selectView(view: 'clipboard' | 'files' | 'notes') {
    this.activeView = view;
    localStorage.setItem('localdrop_active_view', view);
    
    if (this.isMobile()) {
      this.isSidenavOpen.set(false);
    }
  }
}
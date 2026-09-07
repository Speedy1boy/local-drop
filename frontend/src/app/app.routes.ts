import { Routes, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './services/auth';

const authGuard = () => {
  const authService = inject(AuthService);
  if (authService.isBanned()) return false;
  if (authService.isAuthenticated()) return true;
  inject(Router).navigate(['/login']);
  return false;
};

const noAuthGuard = () => {
  const authService = inject(AuthService);
  if (authService.isBanned()) return false;
  if (!authService.isAuthenticated()) return true;
  inject(Router).navigate(['/files']);
  return false;
};

const adminGuard = () => {
  const authService = inject(AuthService);
  if (authService.isBanned()) return false;
  if (authService.userRole() === 'admin') return true;
  inject(Router).navigate(['/files']);
  return false;
};

export const routes: Routes = [
  { 
    path: 'login', 
    loadComponent: () => import('./components/login/login').then(m => m.LoginComponent),
    canActivate: [noAuthGuard]
  },
  { 
    path: 'files', 
    loadComponent: () => import('./components/files/files').then(m => m.FilesComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'notes', 
    loadComponent: () => import('./components/notes/notes').then(m => m.NotesComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'clipboard', 
    loadComponent: () => import('./components/clipboard/clipboard').then(m => m.ClipboardComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'admin', 
    loadComponent: () => import('./components/admin/admin').then(m => m.AdminComponent),
    canActivate: [adminGuard]
  },
  { path: '', redirectTo: '/files', pathMatch: 'full' },
  { path: '**', redirectTo: '/files' }
];
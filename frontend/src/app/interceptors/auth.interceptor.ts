import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { AuthService } from '../services/auth';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = localStorage.getItem('localdrop_token');

  let authReq = req;
  if (token) {
    authReq = req.clone({ headers: req.headers.set('Authorization', `Bearer ${token}`) });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      
      if (error.status === 403) {
        authService.isBanned.set(true);
        authService.banMessage.set(error.error?.message || 'Ваш IP-адрес заблокирован навсегда.');
      }

      if (error.status === 401 && !req.url.includes('login') && !req.url.includes('ping')) {
        authService.logout();
      }

      return throwError(() => error);
    })
  );
};
import { Pipe, PipeTransform, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Observable, of } from 'rxjs';
import { map, catchError, shareReplay } from 'rxjs/operators';

@Pipe({
  name: 'secureMedia',
  standalone: true
})
export class SecureMediaPipe implements PipeTransform {
  private http = inject(HttpClient);
  private sanitizer = inject(DomSanitizer);
  
  private cache = new Map<string, Observable<SafeUrl | null>>();

  transform(url: string): Observable<SafeUrl | null> {
    if (!url) return of(null);

    if (!this.cache.has(url)) {
      const request = this.http.get(url, { responseType: 'blob' }).pipe(
        map(blob => {
          const objectUrl = URL.createObjectURL(blob);
          return this.sanitizer.bypassSecurityTrustUrl(objectUrl);
        }),
        catchError(() => of(null)),
        shareReplay(1)
      );
      this.cache.set(url, request);
    }

    return this.cache.get(url)!;
  }
}
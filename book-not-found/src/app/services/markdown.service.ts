import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable()
export class MarkdownService {
  private docsPath = 'assets/docs/';

  constructor(private http: HttpClient) {}

  getMarkdownFile(filename: string): Observable<string> {
    return this.http.get(`${this.docsPath}${filename}`, { responseType: 'text' }).pipe(
      catchError(() => of('# Error\nFailed to load markdown file.'))
    );
  }

  getAvailableFiles(): Observable<string[]> {
    // In a real application, this would be an API call
    // For now, we'll return a static list
    return of(['getting-started.md']);
  }

  saveMarkdownFile(filename: string, content: string): Observable<boolean> {
    // In a real application, this would be an API call
    // For now, we'll just log to console
    console.log(`Saving ${filename} with content:`, content);
    return of(true);
  }
}

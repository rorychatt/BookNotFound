import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { tap, catchError } from 'rxjs/operators';

export interface QuestionResponse {
  answer: string;
  certainty: number;
  model: string;
}

export interface FeedbackRequest {
  question_id: string;
  feedback: boolean;
  suggested_changes?: string;
}

export interface MarkdownContent {
  content: string;
}

export interface Suggestion {
  id: string;
  filename: string;
  original_content: string;
  suggested_content: string;
  feedback_context: string;
  created_at: string;
  status: 'pending' | 'applied' | 'rejected';
}

export interface FeedbackHistory {
  id: string;
  question: string;
  feedback: boolean;
  suggested_changes?: string;
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl || 'http://localhost:8000';

  constructor(private http: HttpClient) { }

  getMarkdownFiles(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/api/markdown/files`);
  }

  getMarkdown(filename: string): Observable<MarkdownContent> {
    return this.http.get<MarkdownContent>(`${this.apiUrl}/api/markdown/${filename}`);
  }

  getFeedbackHistory(filename: string): Observable<FeedbackHistory[]> {
    return this.http.get<FeedbackHistory[]>(`${this.apiUrl}/api/feedback/history/${filename}`);
  }

  applySuggestion(suggestionId: string): Observable<{ status: string }> {
    return this.http.post<{ status: string }>(`${this.apiUrl}/api/suggestions/${suggestionId}/apply`, {});
  }

  rejectSuggestion(suggestionId: string): Observable<{ status: string }> {
    return this.http.post<{ status: string }>(`${this.apiUrl}/api/suggestions/${suggestionId}/reject`, {});
  }

  askQuestion(question: string, context?: string): Observable<QuestionResponse> {
    console.log('Sending question to API:', { question, context });
    return this.http.post<QuestionResponse>(`${this.apiUrl}/api/ask`, {
      question,
      context
    }).pipe(
      tap(response => console.log('Received response:', response)),
      catchError(error => {
        console.error('Error asking question:', error);
        throw error;
      })
    );
  }

  submitFeedback(feedback: FeedbackRequest): Observable<{ status: string }> {
    return this.http.post<{ status: string }>(`${this.apiUrl}/api/feedback`, feedback);
  }

  getSuggestions(): Observable<{ suggestions: Suggestion[] }> {
    return this.http.get<{ suggestions: Suggestion[] }>(`${this.apiUrl}/api/suggestions`);
  }
} 
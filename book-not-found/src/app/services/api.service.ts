import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { tap, catchError } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';

export interface MarkdownFilesResponse {
  files: string[];
}

export interface QuestionResponse {
  answer: string;
  certainty: number;
  model: string;
  matching_file: string | null;
  needs_new_doc: boolean;
  suggested_keywords: string[] | null;
}

export interface FeedbackRequest {
  fileName: string | null;
  isPositive: boolean;
  feedbackText: string;
  suggestedChanges?: string;
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

  getMarkdownFiles(): Observable<MarkdownFilesResponse> {
    return this.http.get<MarkdownFilesResponse>(`${this.apiUrl}/api/markdown/files`);
  }

  async getMarkdown(filename: string): Promise<{ content: string; keywords: string[] }> {
    const response = await firstValueFrom(
      this.http.get<{ content: string; keywords: string[] }>(`${this.apiUrl}/api/markdown/${filename}`)
    );
    return response;
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

  async askQuestion(question: string): Promise<QuestionResponse> {
    const response = await firstValueFrom(
      this.http.post<QuestionResponse>(`${this.apiUrl}/api/question`, { question })
    );
    return response;
  }

  async submitFeedback(feedback: FeedbackRequest): Promise<void> {
    await firstValueFrom(
      this.http.post<void>(`${this.apiUrl}/api/feedback`, {
        file_name: feedback.fileName,
        is_positive: feedback.isPositive,
        feedback_text: feedback.feedbackText,
        suggested_changes: feedback.suggestedChanges
      })
    );
  }

  getSuggestions(): Observable<{ suggestions: Suggestion[] }> {
    return this.http.get<{ suggestions: Suggestion[] }>(`${this.apiUrl}/api/suggestions`);
  }

  async saveMarkdown(filename: string, content: string): Promise<void> {
    await firstValueFrom(
      this.http.post<void>(`${this.apiUrl}/api/markdown/${filename}`, { content })
    );
  }
} 
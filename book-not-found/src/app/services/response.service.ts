import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ResponseData {
  answer: string;
  certainty: number;
  matchingFile: string | null;
  needsNewDoc: boolean;
  suggestedKeywords: string[] | null;
  originalQuestion: string;
}

@Injectable({
  providedIn: 'root'
})
export class ResponseService {
  private responseSubject = new BehaviorSubject<ResponseData | null>(null);
  response$ = this.responseSubject.asObservable();

  updateResponse(response: ResponseData) {
    this.responseSubject.next(response);
  }

  clearResponse() {
    this.responseSubject.next(null);
  }
} 
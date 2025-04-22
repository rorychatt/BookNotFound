import { Component, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService, QuestionResponse } from '../../services/api.service';
import { ResponseService } from '../../services/response.service';

@Component({
  selector: 'app-question-form',
  templateUrl: './question-form.component.html',
  styleUrls: ['./question-form.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class QuestionFormComponent {
  @Output() questionAnswered = new EventEmitter<QuestionResponse & { question: string }>();
  question: string = '';
  isLoading: boolean = false;
  error: string | null = null;

  constructor(
    private apiService: ApiService,
    private responseService: ResponseService
  ) {}

  async onSubmit() {
    if (!this.question.trim()) return;
    
    this.isLoading = true;
    this.error = null;

    try {
      const response = await this.apiService.askQuestion(this.question);
      const fullResponse = { ...response, question: this.question };
      
      this.questionAnswered.emit(fullResponse);
      this.responseService.updateResponse({
        answer: response.answer,
        certainty: response.certainty,
        matchingFile: response.matching_file,
        needsNewDoc: response.needs_new_doc,
        suggestedKeywords: response.suggested_keywords,
        originalQuestion: this.question
      });

      // Clear the form
      this.question = '';
    } catch (err) {
      this.error = 'Failed to get answer. Please try again.';
      console.error('Error:', err);
    } finally {
      this.isLoading = false;
    }
  }
}

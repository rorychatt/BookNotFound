import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-feedback-window',
  templateUrl: './feedback-window.component.html',
  styleUrls: ['./feedback-window.component.scss']
})
export class FeedbackWindowComponent {
  @Input() matchingFile: string | null = null;
  @Input() originalQuestion: string = '';
  @Input() answer: string = '';
  @Output() feedbackSubmitted = new EventEmitter<void>();

  isPositive: boolean | null = null;
  feedbackText: string = '';
  suggestedChanges: string = '';
  showEditor: boolean = false;
  originalContent: string = '';
  isLoading: boolean = false;
  error: string | null = null;

  constructor(private apiService: ApiService) {}

  async submitFeedback() {
    if (this.isPositive === null) return;

    this.isLoading = true;
    this.error = null;

    try {
      await this.apiService.submitFeedback({
        file_name: this.matchingFile,
        is_positive: this.isPositive,
        feedback_text: this.feedbackText,
        suggested_changes: this.showEditor ? this.suggestedChanges : undefined,
        original_content: this.originalContent
      });

      // Reset form
      this.feedbackText = '';
      this.suggestedChanges = '';
      this.isPositive = null;
      this.showEditor = false;
      
      // Emit event to notify parent component
      this.feedbackSubmitted.emit();
    } catch (err) {
      this.error = 'Failed to submit feedback. Please try again.';
      console.error('Error:', err);
    } finally {
      this.isLoading = false;
    }
  }
} 
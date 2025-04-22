import { Component, Input } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MarkdownModule } from 'ngx-markdown';
import { MarkdownEditorComponent } from '../markdown-editor/markdown-editor.component';

@Component({
  selector: 'app-feedback-window',
  templateUrl: './feedback-window.component.html',
  styleUrls: ['./feedback-window.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, MarkdownModule, MarkdownEditorComponent]
})
export class FeedbackWindowComponent {
  @Input() matchingFile: string | null = null;
  @Input() originalQuestion: string = '';
  @Input() answer: string = '';

  feedbackText: string = '';
  suggestedChanges: string = '';
  isPositive: boolean | null = null;
  isLoading: boolean = false;
  error: string | null = null;
  showEditor: boolean = false;

  constructor(private apiService: ApiService) {}

  async submitFeedback() {
    if (this.isPositive === null) return;

    this.isLoading = true;
    this.error = null;

    try {
      await this.apiService.submitFeedback({
        fileName: this.matchingFile,
        isPositive: this.isPositive,
        feedbackText: this.feedbackText,
        suggestedChanges: this.suggestedChanges
      });

      // Reset form
      this.feedbackText = '';
      this.suggestedChanges = '';
      this.isPositive = null;
      this.showEditor = false;
    } catch (err) {
      this.error = 'Failed to submit feedback. Please try again.';
      console.error('Error:', err);
    } finally {
      this.isLoading = false;
    }
  }

  setFeedbackType(isPositive: boolean) {
    this.isPositive = isPositive;
  }

  toggleEditor() {
    this.showEditor = !this.showEditor;
    if (this.showEditor) {
      this.suggestedChanges = this.answer;
    }
  }
}

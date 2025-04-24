import { Component, Input } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MarkdownModule } from 'ngx-markdown';
import { MarkdownEditorComponent } from '../markdown-editor/markdown-editor.component';
import { v4 as uuidv4 } from 'uuid';

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
  originalContent: string = '';

  constructor(private apiService: ApiService) {}

  onContentChange(content: string) {
    console.log('Content changed:', content);
    this.suggestedChanges = content;
  }

  async submitFeedback() {
    if (this.isPositive === null) return;
    
    console.log('Submitting feedback with changes:', this.suggestedChanges);

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

  async toggleEditor() {
    this.showEditor = !this.showEditor;
    if (this.showEditor && this.matchingFile) {
      try {
        // Load the actual file content
        const response = await this.apiService.getMarkdown(this.matchingFile);
        this.originalContent = response.content;
        this.suggestedChanges = response.content;
      } catch (err) {
        console.error('Error loading file content:', err);
        this.error = 'Failed to load file content. Please try again.';
        this.showEditor = false;
      }
    }
  }
}

import { Component, Input, Output, EventEmitter } from '@angular/core';
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
  @Output() feedbackSubmitted = new EventEmitter<void>();

  feedbackText: string = '';
  suggestedChanges: string = '';
  isPositive: boolean | null = null;
  isLoading: boolean = false;
  error: string | null = null;
  showEditor: boolean = false;
  originalContent: string = '';
  hasChanges: boolean = false;

  constructor(private apiService: ApiService) {}

  onContentChange(content: string) {
    if (!content || !this.originalContent) {
      this.hasChanges = false;
      this.suggestedChanges = content || '';
      return;
    }

    // Simple direct comparison first
    if (content !== this.originalContent) {
      this.hasChanges = true;
      this.suggestedChanges = content;
      console.log('Changes detected - content is different from original');
      return;
    }

    this.hasChanges = false;
    this.suggestedChanges = content;
    console.log('No changes detected - content matches original');
  }

  setFeedbackType(isPositive: boolean) {
    console.log('Setting feedback type:', isPositive);
    this.isPositive = isPositive;
  }

  async toggleEditor() {
    this.showEditor = !this.showEditor;
    if (this.showEditor && this.matchingFile) {
      try {
        const response = await this.apiService.getMarkdown(this.matchingFile);
        this.originalContent = response.content;
        this.suggestedChanges = response.content;
        this.hasChanges = false;
        console.log('Editor toggled, content loaded:', {
          originalContent: this.originalContent,
          suggestedChanges: this.suggestedChanges,
          hasChanges: this.hasChanges
        });
      } catch (err) {
        console.error('Error loading file content:', err);
        this.error = 'Failed to load file content. Please try again.';
        this.showEditor = false;
      }
    }
  }

  async submitFeedback() {
    console.log('Submit attempted with state:', {
      isPositive: this.isPositive,
      hasChanges: this.hasChanges,
      showEditor: this.showEditor,
      feedbackText: this.feedbackText
    });

    if (this.isPositive === null) {
      console.log('Cannot submit: No feedback type selected');
      return;
    }

    if (this.showEditor && !this.hasChanges) {
      console.log('Cannot submit: Editor active but no changes detected');
      return;
    }

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
      this.hasChanges = false;
      
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

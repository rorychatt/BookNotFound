import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService, Suggestion, FeedbackHistory, MarkdownFilesResponse } from '../../services/api.service';
import { FormsModule } from '@angular/forms';
import { MarkdownComponent } from 'ngx-markdown';
import { MarkdownEditorComponent } from '../markdown-editor/markdown-editor.component';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, MarkdownComponent, MarkdownEditorComponent],
  templateUrl: './admin-panel.component.html',
  styleUrl: './admin-panel.component.scss'
})
export class AdminPanelComponent implements OnInit {
  markdownFiles = signal<string[]>([]);
  selectedFile: string | null = null;
  suggestions = signal<Suggestion[]>([]);
  selectedSuggestion: Suggestion | null = null;
  originalContent: string = '';
  editedContent: string = '';
  feedbackHistory = signal<FeedbackHistory[]>([]);

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadMarkdownFiles();
  }

  loadMarkdownFiles() {
    this.apiService.getMarkdownFiles().subscribe({
      next: (response: MarkdownFilesResponse) => {
        this.markdownFiles.set(response.files);
        console.log('Loaded markdown files:', response.files);
      },
      error: (error) => {
        console.error('Error loading markdown files:', error);
      }
    });
  }

  onFileSelect(filename: string) {
    this.selectedFile = filename;
    this.loadFileContent(filename);
    this.loadSuggestions(filename);
    this.loadFeedbackHistory(filename);
  }

  async loadFileContent(filename: string) {
    try {
      const content = await this.apiService.getMarkdown(filename);
      this.originalContent = content.content;
      this.editedContent = content.content;
      console.log('Loaded file content:', content);
    } catch (error) {
      console.error('Error loading file content:', error);
    }
  }

  loadSuggestions(filename: string) {
    this.apiService.getSuggestions().subscribe({
      next: (response) => {
        this.suggestions.set(response.suggestions.filter(s => s.filename === filename));
        console.log('Loaded suggestions:', this.suggestions());
      },
      error: (error) => {
        console.error('Error loading suggestions:', error);
      }
    });
  }

  loadFeedbackHistory(filename: string) {
    this.apiService.getFeedbackHistory(filename).subscribe({
      next: (history) => {
        this.feedbackHistory.set(history || []);
        console.log('Loaded feedback history:', history);
      },
      error: (error) => {
        console.error('Error loading feedback history:', error);
      }
    });
  }

  onSuggestionSelect(suggestion: Suggestion) {
    this.selectedSuggestion = suggestion;
  }

  applySuggestion(suggestion: Suggestion) {
    this.apiService.applySuggestion(suggestion.id).subscribe({
      next: (response) => {
        console.log('Applied suggestion:', response);
        this.loadFileContent(this.selectedFile!);
        this.loadSuggestions(this.selectedFile!);
      },
      error: (error) => {
        console.error('Error applying suggestion:', error);
      }
    });
  }

  rejectSuggestion(suggestion: Suggestion) {
    this.apiService.rejectSuggestion(suggestion.id).subscribe({
      next: (response) => {
        console.log('Rejected suggestion:', response);
        this.loadSuggestions(this.selectedFile!);
      },
      error: (error) => {
        console.error('Error rejecting suggestion:', error);
      }
    });
  }
}

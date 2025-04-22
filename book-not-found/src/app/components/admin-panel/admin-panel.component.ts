import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService, Suggestion } from '../../services/api.service';
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
  markdownFiles: string[] = [];
  selectedFile: string | null = null;
  suggestions: Suggestion[] = [];
  selectedSuggestion: Suggestion | null = null;
  originalContent: string = '';
  feedbackHistory: any[] = [];

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadMarkdownFiles();
  }

  loadMarkdownFiles() {
    this.apiService.getMarkdownFiles().subscribe({
      next: (files) => {
        this.markdownFiles = files;
        console.log('Loaded markdown files:', files);
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

  loadFileContent(filename: string) {
    this.apiService.getMarkdown(filename).subscribe({
      next: (content) => {
        this.originalContent = content.content;
        console.log('Loaded file content:', content);
      },
      error: (error) => {
        console.error('Error loading file content:', error);
      }
    });
  }

  loadSuggestions(filename: string) {
    this.apiService.getSuggestions().subscribe({
      next: (response) => {
        this.suggestions = response.suggestions.filter(s => s.filename === filename);
        console.log('Loaded suggestions:', this.suggestions);
      },
      error: (error) => {
        console.error('Error loading suggestions:', error);
      }
    });
  }

  loadFeedbackHistory(filename: string) {
    this.apiService.getFeedbackHistory(filename).subscribe({
      next: (history) => {
        this.feedbackHistory = history;
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

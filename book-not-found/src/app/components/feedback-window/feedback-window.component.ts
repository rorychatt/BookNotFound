import { Component, OnInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Declare Monaco Editor types
declare const monaco: any;

@Component({
  selector: 'app-feedback-window',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './feedback-window.component.html',
  styleUrl: './feedback-window.component.scss'
})
export class FeedbackWindowComponent implements OnInit {
  feedback: string = '';
  proposedChanges: string = '';
  editor: any;

  constructor(private ngZone: NgZone) {}

  ngOnInit() {
    // Load Monaco Editor script
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/monaco-editor@latest/min/vs/loader.js';
    script.onload = () => this.initMonaco();
    document.head.appendChild(script);
  }

  private initMonaco() {
    // @ts-ignore
    require.config({ paths: { vs: 'https://unpkg.com/monaco-editor@latest/min/vs' } });
    // @ts-ignore
    require(['vs/editor/editor.main'], () => {
      this.createEditor();
    });
  }

  private createEditor() {
    this.ngZone.run(() => {
      const container = document.getElementById('monaco-proposed-changes');
      if (container) {
        this.editor = monaco.editor.create(container, {
          value: this.proposedChanges,
          language: 'markdown',
          theme: 'vs-dark',
          automaticLayout: true,
          minimap: { enabled: false },
          lineNumbers: 'on',
          roundedSelection: true,
          scrollBeyondLastLine: false,
          readOnly: false,
          fontSize: 14
        });

        // Add change listener
        this.editor.onDidChangeModelContent(() => {
          this.ngZone.run(() => {
            this.proposedChanges = this.editor.getValue();
          });
        });
      }
    });
  }

  submitFeedback() {
    const feedback = {
      feedback: this.feedback,
      proposedChanges: this.editor ? this.editor.getValue() : this.proposedChanges
    };
    console.log('Submitting feedback:', feedback);
    // TODO: Implement actual feedback submission
  }

  setFeedbackType(type: 'positive' | 'negative') {
    console.log('Feedback type:', type);
    // TODO: Implement feedback type handling
  }
}

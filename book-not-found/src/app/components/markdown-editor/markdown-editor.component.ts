import { Component, OnInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';
import { MarkdownService } from '../../services/markdown.service';

// Declare Monaco Editor types
declare const monaco: any;

@Component({
  selector: 'app-markdown-editor',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  providers: [MarkdownService],
  templateUrl: './markdown-editor.component.html',
  styleUrl: './markdown-editor.component.scss'
})
export class MarkdownEditorComponent implements OnInit {
  markdownContent: string = '';
  htmlContent: SafeHtml = '';
  isPreviewMode: boolean = false;
  editor: any;
  currentFile: string = 'getting-started.md';

  constructor(
    private markdownService: MarkdownService,
    private sanitizer: DomSanitizer,
    private ngZone: NgZone
  ) {}

  ngOnInit() {
    // Load Monaco Editor script
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/monaco-editor@latest/min/vs/loader.js';
    script.onload = () => this.initMonaco();
    document.head.appendChild(script);

    // Load initial markdown content
    this.loadMarkdownFile(this.currentFile);
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
      const container = document.getElementById('monaco-editor-container');
      if (container) {
        this.editor = monaco.editor.create(container, {
          value: this.markdownContent,
          language: 'markdown',
          theme: 'vs-dark',
          automaticLayout: true
        });

        this.editor.onDidChangeModelContent(() => {
          this.ngZone.run(() => {
            this.markdownContent = this.editor.getValue();
            this.updatePreview();
          });
        });
      }
    });
  }

  loadMarkdownFile(filename: string) {
    this.markdownService.getMarkdownFile(filename).subscribe(
      (content) => {
        this.markdownContent = content;
        if (this.editor) {
          this.editor.setValue(content);
        }
        this.updatePreview();
        this.currentFile = filename;
      }
    );
  }

  saveCurrentFile() {
    this.markdownService.saveMarkdownFile(this.currentFile, this.markdownContent).subscribe(
      (success) => {
        if (success) {
          console.log('File saved successfully');
        } else {
          console.error('Failed to save file');
        }
      }
    );
  }

  updatePreview() {
    const html = marked(this.markdownContent, { async: false });
    this.htmlContent = this.sanitizer.bypassSecurityTrustHtml(html as string);
  }

  togglePreview() {
    this.isPreviewMode = !this.isPreviewMode;
  }
}

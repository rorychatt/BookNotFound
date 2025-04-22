import { Component, OnInit, NgZone, Input, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
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
export class MarkdownEditorComponent implements OnInit, OnChanges {
  @Input() initialContent: string = '';
  @Input() content: string = '';
  @Output() contentChange = new EventEmitter<string>();
  markdownContent: string = '';
  originalContent: string = '';
  htmlContent: SafeHtml = '';
  originalHtmlContent: SafeHtml = '';
  diffEditor: any;
  currentFile: string = 'getting-started.md';
  originalTimestamp: Date = new Date();

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

  ngOnChanges(changes: SimpleChanges) {
    if (changes['content'] && changes['content'].currentValue) {
      this.originalContent = changes['content'].currentValue;
      this.markdownContent = changes['content'].currentValue;
      this.originalTimestamp = new Date();
      
      if (this.diffEditor) {
        const originalModel = monaco.editor.createModel(this.originalContent, 'markdown');
        const modifiedModel = monaco.editor.createModel(this.markdownContent, 'markdown');
        this.diffEditor.setModel({
          original: originalModel,
          modified: modifiedModel
        });
      }
      
      this.updatePreview();
    }
  }

  private initMonaco() {
    // @ts-ignore
    require.config({ paths: { vs: 'https://unpkg.com/monaco-editor@latest/min/vs' } });
    // @ts-ignore
    require(['vs/editor/editor.main'], () => {
      this.createDiffEditor();
    });
  }

  private createDiffEditor() {
    this.ngZone.run(() => {
      const container = document.getElementById('monaco-diff-editor');
      if (container) {
        this.diffEditor = monaco.editor.createDiffEditor(container, {
          theme: 'vs-dark',
          automaticLayout: true,
          renderSideBySide: true,
          originalEditable: false,
          enableSplitViewResizing: true,
          minimap: { enabled: false }
        });

        // Set up models for original and modified content
        const originalModel = monaco.editor.createModel(this.originalContent, 'markdown');
        const modifiedModel = monaco.editor.createModel(this.markdownContent, 'markdown');
        
        this.diffEditor.setModel({
          original: originalModel,
          modified: modifiedModel
        });

        // Add change listener for preview updates
        modifiedModel.onDidChangeContent(() => {
          this.ngZone.run(() => {
            this.markdownContent = modifiedModel.getValue();
            this.updatePreview();
          });
        });
      }
    });
  }

  loadMarkdownFile(filename: string) {
    this.markdownService.getMarkdownFile(filename).subscribe(
      (content) => {
        this.originalContent = content;
        this.markdownContent = content;
        this.originalTimestamp = new Date();
        
        if (this.diffEditor) {
          const originalModel = monaco.editor.createModel(content, 'markdown');
          const modifiedModel = monaco.editor.createModel(content, 'markdown');
          this.diffEditor.setModel({
            original: originalModel,
            modified: modifiedModel
          });
        }
        
        this.updatePreview();
        this.currentFile = filename;
      }
    );
  }

  saveCurrentFile() {
    const modifiedModel = this.diffEditor.getModifiedEditor().getModel();
    const modifiedContent = modifiedModel.getValue();

    this.markdownService.saveMarkdownFile(this.currentFile, modifiedContent).subscribe(
      (success) => {
        if (success) {
          console.log('File saved successfully');
          // Update original content after successful save
          this.originalContent = modifiedContent;
          this.originalTimestamp = new Date();
          
          // Update the diff editor models
          const originalModel = monaco.editor.createModel(modifiedContent, 'markdown');
          this.diffEditor.getModel().original.dispose();
          this.diffEditor.setModel({
            original: originalModel,
            modified: modifiedModel
          });
          
          this.updatePreview();
        } else {
          console.error('Failed to save file');
        }
      }
    );
  }

  updatePreview() {
    const html = marked(this.markdownContent, { async: false });
    this.htmlContent = this.sanitizer.bypassSecurityTrustHtml(html as string);
    
    const originalHtml = marked(this.originalContent, { async: false });
    this.originalHtmlContent = this.sanitizer.bypassSecurityTrustHtml(originalHtml as string);
  }

  onContentChange(newContent: string) {
    this.content = newContent;
    this.contentChange.emit(newContent);
  }
}

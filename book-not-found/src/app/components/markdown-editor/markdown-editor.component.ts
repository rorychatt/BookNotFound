import { Component, OnInit, NgZone, Input, OnChanges, SimpleChanges, Output, EventEmitter, Inject, OnDestroy } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';
import { ApiService } from '../../services/api.service';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';

// Declare Monaco Editor types
declare const monaco: any;

@Component({
  selector: 'app-markdown-editor',
  standalone: true,
  imports: [],
  providers: [],
  templateUrl: './markdown-editor.component.html',
  styleUrl: './markdown-editor.component.scss'
})
export class MarkdownEditorComponent implements OnInit, OnChanges, OnDestroy {
  @Input() initialContent: string = '';
  @Input() content: string = '';
  @Input() matchingFile: string | null = null;
  @Output() contentChange = new EventEmitter<string>();
  markdownContent: string = '';
  originalContent: string = '';
  htmlContent: SafeHtml = '';
  originalHtmlContent: SafeHtml = '';
  diffEditor: any;
  currentFile: string = '';
  originalTimestamp: Date = new Date();
  isViewMode: boolean = false;
  private originalModel: any;
  private modifiedModel: any;
  private isInitialized: boolean = false;

  constructor(
    private apiService: ApiService,
    @Inject(DomSanitizer) private sanitizer: DomSanitizer,
    private ngZone: NgZone,
    private route: ActivatedRoute,
    private location: Location
  ) {}

  goBack(): void {
    this.location.back();
  }

  ngOnInit() {
    // Subscribe to route query parameters
    this.route.queryParams.subscribe(params => {
      this.isViewMode = params['mode'] === 'view';
      if (params['file']) {
        this.currentFile = params['file'];
        this.loadMarkdownFile(params['file']);
      } else if (params['keywords']) {
        // Create new document with suggested keywords
        const keywords = params['keywords'].split(',');
        const question = params['question'] || '';
        this.initializeNewDocument(keywords, question);
        // Generate a filename from the question
        this.currentFile = this.generateFilename(question);
      }

      // Only load Monaco editor if not in view mode
      if (!this.isViewMode) {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/monaco-editor@latest/min/vs/loader.js';
        script.onload = () => this.initMonaco();
        document.head.appendChild(script);
      }
    });
  }

  private generateFilename(title: string): string {
    // Convert title to kebab case and limit length
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50) + '.md';
  }

  private initializeNewDocument(keywords: string[], question: string) {
    const template = `# ${question || 'New Document'}

## Keywords
${keywords.map(k => `- ${k}`).join('\n')}

## Content
Start writing your documentation here...
`;
    this.originalContent = template;
    this.markdownContent = template;
    this.updatePreview();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['content'] && changes['content'].currentValue) {
      const newContent = changes['content'].currentValue;
      
      // Only update original content if editor hasn't been initialized
      if (!this.isInitialized) {
        this.originalContent = newContent;
      }
      
      // Only update content if it's different to avoid cursor reset
      if (this.markdownContent !== newContent) {
        this.markdownContent = newContent;
        
        if (this.diffEditor && this.modifiedModel) {
          const currentPosition = this.diffEditor.getModifiedEditor().getPosition();
          this.modifiedModel.setValue(newContent);
          if (currentPosition) {
            this.diffEditor.getModifiedEditor().setPosition(currentPosition);
            this.diffEditor.getModifiedEditor().revealPositionInCenter(currentPosition);
          }
        }
        
        this.updatePreview();
      }
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

        // Ensure we have valid content to display
        this.originalContent = this.content || this.initialContent || '';
        this.markdownContent = this.originalContent;

        // Set up models for original and modified content with explicit content
        this.originalModel = monaco.editor.createModel(this.originalContent, 'markdown');
        this.modifiedModel = monaco.editor.createModel(this.markdownContent, 'markdown');
        
        // Set the models for the diff editor
        this.diffEditor.setModel({
          original: this.originalModel,
          modified: this.modifiedModel
        });

        // Add change listener for preview updates
        this.modifiedModel.onDidChangeContent(() => {
          this.ngZone.run(() => {
            try {
              const newContent = this.modifiedModel.getValue();
              if (newContent !== this.markdownContent) {
                this.markdownContent = newContent;
                this.contentChange.emit(newContent);
                this.updatePreview();
              }
            } catch (error) {
              console.warn('Error handling content change:', error);
            }
          });
        });

        // Initial preview update
        this.updatePreview();
        this.isInitialized = true;
      }
    });
  }

  async loadMarkdownFile(filename: string) {
    try {
      const response = await this.apiService.getMarkdown(filename);
      const content = response.content || '';
      
      // Update the content variables
      this.originalContent = content;
      this.markdownContent = content;
      this.originalTimestamp = new Date();
      
      if (this.diffEditor && !this.isViewMode) {
        try {
          // Dispose of old models first
          if (this.originalModel) {
            this.originalModel.dispose();
          }
          if (this.modifiedModel) {
            this.modifiedModel.dispose();
          }
          
          // Create new models with explicit content
          this.originalModel = monaco.editor.createModel(content, 'markdown');
          this.modifiedModel = monaco.editor.createModel(content, 'markdown');
          
          // Update the diff editor models
          this.diffEditor.setModel({
            original: this.originalModel,
            modified: this.modifiedModel
          });

          // Force a layout update
          this.diffEditor.layout();
        } catch (error) {
          console.warn('Error updating editor models:', error);
        }
      }
      
      // Update the preview
      this.updatePreview();
    } catch (error) {
      console.error('Error loading markdown file:', error);
    }
  }

  async saveCurrentFile() {
    if (this.isViewMode) return;

    try {
      const modifiedContent = this.modifiedModel.getValue();
      let fileToSave = this.matchingFile;
      
      // Only generate a new filename for new documents
      if (!fileToSave) {
        fileToSave = this.generateFilename(modifiedContent.split('\n')[0] || 'new-document');
      }

      await this.apiService.saveMarkdown(fileToSave, modifiedContent);
      console.log('File saved successfully');
      
      // Update original content after successful save
      this.originalContent = modifiedContent;
      this.markdownContent = modifiedContent;
      
      // Update the models
      if (this.originalModel) {
        this.originalModel.setValue(modifiedContent);
      }
      
      // Emit the change
      this.contentChange.emit(modifiedContent);
      this.updatePreview();
    } catch (error) {
      console.error('Failed to save file:', error);
    }
  }

  updatePreview() {
    try {
      // Always keep original content unchanged
      const originalHtml = marked(this.originalContent || '', { async: false });
      this.originalHtmlContent = this.sanitizer.bypassSecurityTrustHtml(originalHtml as string);

      // Update modified preview with current content
      const modifiedHtml = marked(this.markdownContent || this.originalContent || '', { async: false });
      this.htmlContent = this.sanitizer.bypassSecurityTrustHtml(modifiedHtml as string);
    } catch (error) {
      console.warn('Error updating preview:', error);
    }
  }

  onContentChange(newContent: string) {
    if (this.isViewMode) return;
    this.markdownContent = newContent;
    this.content = newContent;
    this.contentChange.emit(newContent);
    this.updatePreview();
  }

  ngOnDestroy() {
    if (this.diffEditor) {
      try {
        if (this.originalModel) {
          this.originalModel.dispose();
        }
        if (this.modifiedModel) {
          this.modifiedModel.dispose();
        }
        this.diffEditor.dispose();
      } catch (error) {
        console.warn('Error during editor cleanup:', error);
      }
    }
  }
}

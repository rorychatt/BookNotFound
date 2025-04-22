import { Component, Input } from '@angular/core';
import { QuestionResponse } from '../../services/api.service';
import { CommonModule } from '@angular/common';
import { MarkdownComponent } from 'ngx-markdown';

@Component({
  selector: 'app-response-window',
  templateUrl: './response-window.component.html',
  styleUrls: ['./response-window.component.scss'],
  standalone: true,
  imports: [CommonModule, MarkdownComponent]
})
export class ResponseWindowComponent {
  @Input() response: QuestionResponse | null = null;
  @Input() markdownContent: string | null = null;
  @Input() markdownDate: string | null = null;

  get certaintyClass(): string {
    if (!this.response) return '';
    const certainty = this.response.certainty;
    if (certainty >= 0.8) return 'text-success';
    if (certainty >= 0.5) return 'text-warning';
    return 'text-error';
  }

  get certaintyText(): string {
    if (!this.response) return '';
    const certainty = this.response.certainty;
    if (certainty >= 0.8) return 'High Confidence';
    if (certainty >= 0.5) return 'Medium Confidence';
    return 'Low Confidence';
  }
}

import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { ResponseService, ResponseData } from '../../services/response.service';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MarkdownModule } from 'ngx-markdown';
import { FeedbackWindowComponent } from '../feedback-window/feedback-window.component';

@Component({
  selector: 'app-response-window',
  templateUrl: './response-window.component.html',
  styleUrls: ['./response-window.component.scss'],
  standalone: true,
  imports: [CommonModule, MarkdownModule, FeedbackWindowComponent]
})
export class ResponseWindowComponent implements OnInit, OnDestroy {
  @Input() response: ResponseData | null = null;
  private subscription: Subscription | null = null;
  showFeedback: boolean = false;

  constructor(
    private responseService: ResponseService,
    private router: Router
  ) {}

  ngOnInit() {
    this.subscription = this.responseService.response$.subscribe(
      response => this.response = response
    );
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  onCreateNewDoc() {
    if (this.response?.suggestedKeywords) {
      // Navigate to markdown editor with suggested keywords
      this.router.navigate(['/editor'], {
        queryParams: {
          keywords: this.response.suggestedKeywords.join(','),
          question: this.response.originalQuestion
        }
      });
    }
  }

  onViewExistingDoc() {
    if (this.response?.matchingFile) {
      this.router.navigate(['/editor'], {
        queryParams: {
          file: this.response.matchingFile,
          mode: 'view'
        }
      });
    }
  }

  onGiveFeedback() {
    this.showFeedback = true;
  }

  get certaintyClass(): string {
    if (!this.response) return '';
    const certainty = this.response.certainty;
    if (certainty >= 0.8) return 'high-certainty';
    if (certainty >= 0.5) return 'medium-certainty';
    return 'low-certainty';
  }

  get certaintyText(): string {
    if (!this.response) return '';
    const certainty = this.response.certainty;
    if (certainty >= 0.8) return 'High Confidence';
    if (certainty >= 0.5) return 'Medium Confidence';
    return 'Low Confidence';
  }
}

import { Component } from '@angular/core';

@Component({
  selector: 'app-response-window',
  templateUrl: './response-window.component.html',
  styleUrls: ['./response-window.component.css']
})
export class ResponseWindowComponent {
  showFeedback = false;

  onGiveFeedback(): void {
    this.showFeedback = true;
  }

  onFeedbackSubmitted(): void {
    this.showFeedback = false;
  }
} 
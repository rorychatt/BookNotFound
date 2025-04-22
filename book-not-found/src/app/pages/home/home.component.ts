import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuestionFormComponent } from '../../components/question-form/question-form.component';
import { ResponseWindowComponent } from '../../components/response-window/response-window.component';
import { FeedbackWindowComponent } from '../../components/feedback-window/feedback-window.component';
import { QuestionResponse } from '../../services/api.service';
import { ResponseData } from '../../services/response.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    QuestionFormComponent,
    ResponseWindowComponent,
    FeedbackWindowComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  currentResponse: ResponseData | null = null;

  onQuestionAnswered(response: QuestionResponse & { question: string }) {
    console.log('Home received response:', response);
    this.currentResponse = {
      answer: response.answer,
      certainty: response.certainty,
      matchingFile: response.matching_file,
      needsNewDoc: response.needs_new_doc,
      suggestedKeywords: response.suggested_keywords,
      originalQuestion: response.question
    };
  }
}

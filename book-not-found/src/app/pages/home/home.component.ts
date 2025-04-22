import { Component } from '@angular/core';
import { QuestionFormComponent } from '../../components/question-form/question-form.component';
import { ResponseWindowComponent } from '../../components/response-window/response-window.component';
import { FeedbackWindowComponent } from '../../components/feedback-window/feedback-window.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    QuestionFormComponent,
    ResponseWindowComponent,
    FeedbackWindowComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {}

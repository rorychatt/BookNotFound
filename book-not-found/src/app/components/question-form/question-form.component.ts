import { Component, EventEmitter, Output, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ApiService, QuestionResponse } from '../../services/api.service';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-question-form',
  templateUrl: './question-form.component.html',
  styleUrls: ['./question-form.component.scss'],
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule]
})
export class QuestionFormComponent implements OnDestroy {
  @Output() questionAnswered = new EventEmitter<QuestionResponse>();
  
  questionForm: FormGroup;
  isLoading = false;
  error: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService
  ) {
    this.questionForm = this.fb.group({
      question: ['', [Validators.required, Validators.minLength(3)]]
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSubmit(): void {
    if (this.questionForm.valid) {
      console.log('Submitting question form:', this.questionForm.value);
      this.isLoading = true;
      this.error = null;
      
      const question = this.questionForm.get('question')?.value;
      console.log('Question to be sent:', question);
      
      this.apiService.askQuestion(question)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            console.log('Question answered successfully:', response);
            this.questionAnswered.emit(response);
            this.isLoading = false;
            this.questionForm.reset();
          },
          error: (err) => {
            console.error('Error in question form:', err);
            this.error = 'Failed to get an answer. Please try again.';
            this.isLoading = false;
          }
        });
    } else {
      console.log('Form is invalid:', this.questionForm.errors);
    }
  }
}

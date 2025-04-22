import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResponseWindowComponent } from './response-window.component';

describe('ResponseWindowComponent', () => {
  let component: ResponseWindowComponent;
  let fixture: ComponentFixture<ResponseWindowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResponseWindowComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResponseWindowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

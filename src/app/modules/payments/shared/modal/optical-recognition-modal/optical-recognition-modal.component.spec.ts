import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OpticalRecognitionModalComponent } from './optical-recognition-modal.component';

describe('OpticalRecognitionModalComponent', () => {
  let component: OpticalRecognitionModalComponent;
  let fixture: ComponentFixture<OpticalRecognitionModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OpticalRecognitionModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(OpticalRecognitionModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

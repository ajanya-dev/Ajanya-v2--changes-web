import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IntroTourButtonComponent } from './intro-tour-button.component';

describe('IntroTourButtonComponent', () => {
  let component: IntroTourButtonComponent;
  let fixture: ComponentFixture<IntroTourButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IntroTourButtonComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(IntroTourButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

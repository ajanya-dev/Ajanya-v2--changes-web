import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IntroPaymentTableComponent } from './intro-payment-table.component';

describe('IntroPaymentTableComponent', () => {
  let component: IntroPaymentTableComponent;
  let fixture: ComponentFixture<IntroPaymentTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IntroPaymentTableComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(IntroPaymentTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

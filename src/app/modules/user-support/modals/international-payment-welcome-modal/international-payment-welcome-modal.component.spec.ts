import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InternationalPaymentWelcomeModalComponent } from './international-payment-welcome-modal.component';

describe('InternationalPaymentWelcomeModalComponent', () => {
  let component: InternationalPaymentWelcomeModalComponent;
  let fixture: ComponentFixture<InternationalPaymentWelcomeModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InternationalPaymentWelcomeModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(InternationalPaymentWelcomeModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

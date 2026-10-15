import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreditCardPricingComponent } from './credit-card-pricing.component';

describe('CreditCardPricingComponent', () => {
  let component: CreditCardPricingComponent;
  let fixture: ComponentFixture<CreditCardPricingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreditCardPricingComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CreditCardPricingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

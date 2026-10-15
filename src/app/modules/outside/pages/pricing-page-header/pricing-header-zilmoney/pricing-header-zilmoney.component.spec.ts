import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PricingHeaderZilmoneyComponent } from './pricing-header-zilmoney.component';

describe('PricingHeaderZilmoneyComponent', () => {
  let component: PricingHeaderZilmoneyComponent;
  let fixture: ComponentFixture<PricingHeaderZilmoneyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PricingHeaderZilmoneyComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PricingHeaderZilmoneyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

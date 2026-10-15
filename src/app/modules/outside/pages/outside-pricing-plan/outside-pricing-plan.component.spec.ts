import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OutsidePricingPlanComponent } from './outside-pricing-plan.component';

describe('OutsidePricingPlanComponent', () => {
  let component: OutsidePricingPlanComponent;
  let fixture: ComponentFixture<OutsidePricingPlanComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OutsidePricingPlanComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(OutsidePricingPlanComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

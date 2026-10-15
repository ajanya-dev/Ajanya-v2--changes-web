import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PricingHeaderOcwComponent } from './pricing-header-ocw.component';

describe('PricingHeaderOcwComponent', () => {
  let component: PricingHeaderOcwComponent;
  let fixture: ComponentFixture<PricingHeaderOcwComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PricingHeaderOcwComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PricingHeaderOcwComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

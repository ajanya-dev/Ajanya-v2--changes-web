import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerificationCenterSubscriptionComponent } from './verification-center-subscription.component';

describe('VerificationCenterSubscriptionComponent', () => {
  let component: VerificationCenterSubscriptionComponent;
  let fixture: ComponentFixture<VerificationCenterSubscriptionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerificationCenterSubscriptionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(VerificationCenterSubscriptionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

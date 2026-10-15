import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { outsidePricingPlanGuard } from './outside-pricing-plan.guard';

describe('outsidePricingPlanGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() =>
      outsidePricingPlanGuard(...guardParameters)
    );

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});

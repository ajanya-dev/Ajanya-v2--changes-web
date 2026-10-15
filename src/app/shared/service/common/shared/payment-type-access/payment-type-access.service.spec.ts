/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { PaymentTypeAccessService } from './payment-type-access.service';

describe('Service: PaymentTypeAccess', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PaymentTypeAccessService]
    });
  });

  it('should ...', inject(
    [PaymentTypeAccessService],
    (service: PaymentTypeAccessService) => {
      expect(service).toBeTruthy();
    }
  ));
});

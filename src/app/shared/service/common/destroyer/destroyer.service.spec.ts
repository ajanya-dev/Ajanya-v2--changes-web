/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { DestroyerService } from './destroyer.service';

describe('Service: Destroyer', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DestroyerService]
    });
  });

  it('should ...', inject([DestroyerService], (service: DestroyerService) => {
    expect(service).toBeTruthy();
  }));
});

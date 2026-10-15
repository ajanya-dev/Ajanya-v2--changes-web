import { TestBed } from '@angular/core/testing';

import { ClickTrackingService } from './click-tracking.service';

describe('ClickTrackingService', () => {
  let service: ClickTrackingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ClickTrackingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

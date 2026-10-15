import { TestBed } from '@angular/core/testing';

import { CommonLayoutToggleService } from './common-layout-toggle.service';

describe('CommonLayoutToggleService', () => {
  let service: CommonLayoutToggleService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CommonLayoutToggleService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

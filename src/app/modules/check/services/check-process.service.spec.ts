import { TestBed } from '@angular/core/testing';

import { CheckProcessService } from './check-process.service';

describe('CheckProcessService', () => {
  let service: CheckProcessService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CheckProcessService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

import { TestBed } from '@angular/core/testing';

import { ZilSignService } from './zil-sign.service';

describe('ZilSignService', () => {
  let service: ZilSignService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ZilSignService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

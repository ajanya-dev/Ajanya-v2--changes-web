import { TestBed } from '@angular/core/testing';

import { AuthV3Service } from './auth-v3.service';

describe('AuthV3Service', () => {
  let service: AuthV3Service;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthV3Service);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

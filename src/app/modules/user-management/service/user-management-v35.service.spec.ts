import { TestBed } from '@angular/core/testing';

import { UserManagementV35Service } from './user-management-v35.service';

describe('UserManagementV35Service', () => {
  let service: UserManagementV35Service;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UserManagementV35Service);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

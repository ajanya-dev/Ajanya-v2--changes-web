import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserManagementListV35Component } from './user-management-list-v35.component';

describe('UserManagementListV35Component', () => {
  let component: UserManagementListV35Component;
  let fixture: ComponentFixture<UserManagementListV35Component>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [UserManagementListV35Component]
    });
    fixture = TestBed.createComponent(UserManagementListV35Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

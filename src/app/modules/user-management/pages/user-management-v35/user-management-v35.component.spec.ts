import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserManagementV35Component } from './user-management-v35.component';

describe('UserManagementV35Component', () => {
  let component: UserManagementV35Component;
  let fixture: ComponentFixture<UserManagementV35Component>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [UserManagementV35Component]
    });
    fixture = TestBed.createComponent(UserManagementV35Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

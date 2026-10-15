import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PayrollStatementVerificationV4Component } from './payroll-statement-verification-v4.component';

describe('PayrollStatementVerificationV4Component', () => {
  let component: PayrollStatementVerificationV4Component;
  let fixture: ComponentFixture<PayrollStatementVerificationV4Component>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PayrollStatementVerificationV4Component]
    });
    fixture = TestBed.createComponent(PayrollStatementVerificationV4Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

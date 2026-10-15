import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PayrollStatementVerificationComponent } from './payroll-statement-verification.component';

describe('PayrollStatementVerificationComponent', () => {
  let component: PayrollStatementVerificationComponent;
  let fixture: ComponentFixture<PayrollStatementVerificationComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PayrollStatementVerificationComponent]
    });
    fixture = TestBed.createComponent(PayrollStatementVerificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

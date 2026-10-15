import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerificationCenterBankAccountsComponent } from './verification-center-bank-accounts.component';

describe('VerificationCenterBankAccountsComponent', () => {
  let component: VerificationCenterBankAccountsComponent;
  let fixture: ComponentFixture<VerificationCenterBankAccountsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerificationCenterBankAccountsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(VerificationCenterBankAccountsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

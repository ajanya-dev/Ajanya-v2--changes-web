import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { PlaidConfirmationModalComponent } from './plaid-confirmation-modal.component';

describe('PlaidConfirmationModalComponent', () => {
  let component: PlaidConfirmationModalComponent;
  let fixture: ComponentFixture<PlaidConfirmationModalComponent>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<PlaidConfirmationModalComponent>>;

  const mockBankData = {
    accounts: [
      {
        institutionName: 'Test Bank',
        accountHolderName: 'John Doe',
        accountName: 'Test Checking',
        maskedAccountNumber: '1234',
        accountType: 'checking' as const,
        verificationStatus: true,
        accountId: 'acc_123'
      }
    ]
  };

  beforeEach(async () => {
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [
        PlaidConfirmationModalComponent,
        FontAwesomeModule
      ],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockBankData }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PlaidConfirmationModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display bank account information', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Test Bank');
    expect(compiled.textContent).toContain('John Doe');
    expect(compiled.textContent).toContain('Test Checking');
    expect(compiled.textContent).toContain('****1234');
  });

  it('should call dialogRef.close with back action when onBack is called', () => {
    component.onBack();
    expect(mockDialogRef.close).toHaveBeenCalledWith({ action: 'back' });
  });

  it('should call dialogRef.close with cancel action when onCancel is called', () => {
    component.onCancel();
    expect(mockDialogRef.close).toHaveBeenCalledWith({ action: 'cancel' });
  });

  it('should call dialogRef.close with confirm action when onConfirm is called', (done) => {
    component.onConfirm();
    expect(component.confirming).toBeTruthy();

    setTimeout(() => {
      expect(mockDialogRef.close).toHaveBeenCalledWith({
        action: 'confirm',
        confirmed: true,
        accounts: mockBankData.accounts
      });
      done();
    }, 600);
  });

  it('should return correct account type display', () => {
    expect(component.getAccountTypeDisplay('checking')).toBe('Checking');
    expect(component.getAccountTypeDisplay('savings')).toBe('Savings');
    expect(component.getAccountTypeDisplay('unknown')).toBe('Account');
  });

  it('should return correct verification text', () => {
    expect(component.getVerificationText(true)).toBe('Verified');
    expect(component.getVerificationText(false)).toBe('Pending Verification');
  });

  it('should show verification badge for verified accounts', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Verified');
  });

  it('should show pending status for unverified accounts', () => {
    const unverifiedData = {
      accounts: [{
        ...mockBankData.accounts[0],
        verificationStatus: false
      }]
    };
    
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [PlaidConfirmationModalComponent, FontAwesomeModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: unverifiedData }
      ]
    });

    fixture = TestBed.createComponent(PlaidConfirmationModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Pending Verification');
  });
});
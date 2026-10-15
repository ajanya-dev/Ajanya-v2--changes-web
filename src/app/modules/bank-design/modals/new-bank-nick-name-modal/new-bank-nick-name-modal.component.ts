import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { Component, Inject, OnDestroy, OnInit, signal, inject } from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogClose,
  MatDialogActions
} from '@angular/material/dialog';
import { Router } from '@angular/router';
import { of, Subscription } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { BankAccountsService } from 'src/app/shared/service/bankAccounts/bank-accounts.service';
import { GettingStartedService } from 'src/app/shared/service/getting-started/getting-started.service';
import { ICheckBody } from 'src/app/models/bank-design';
import { IConfirmAlert } from 'src/app/models/alert';
import { BankVerifyModalComponent } from 'src/app/shared/bank-modal/modals/bank-verify-modal/bank-verify-modal.component';
import { NgIf } from '@angular/common';
import { ControlMessageComponent } from '../../../../shared/components/control-message/control-message/control-message.component';
import { PostHogService } from 'src/app/core/services/posthog.service';
import { Moengage } from 'src/app/data/data/moengage';

@Component({
  selector: 'app-new-bank-nick-name-modal',
  templateUrl: './new-bank-nick-name-modal.component.html',
  styleUrls: ['./new-bank-nick-name-modal.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatDialogClose,
    ControlMessageComponent,
    MatDialogActions,
    NgIf
  ]
})
export class NewBankNickNameModalComponent implements OnInit, OnDestroy {
  checkForm: UntypedFormGroup;
  subscriptions: Subscription[] = [];
  formData = new FormData();
  btnDisabled = false;
  phoneNumber: string | Blob;

  num: string;
  num1: string;
  num2: string;
  num3: string;

  // Bank setup tracking
  bankSetupInitiatedTime = performance.now();
  stepsCompleted = signal(0);
  selectedBankName = signal<string | null>(null);
  isBankSetupCancelled = signal<boolean>(false);
  isFirstBankAttempt = signal<boolean>(false);
  bankCountBefore = signal<number>(0);
  isBankSetupInitiated = signal<boolean>(false);

  private postHogService = inject(PostHogService);


  constructor(
    @Inject(MAT_DIALOG_DATA) public checkBodyData: ICheckBody,
    private fb: UntypedFormBuilder,
    private bankAccService: BankAccountsService,
    public dialogRef: MatDialogRef<NewBankNickNameModalComponent>,
    private router: Router,
    private alert: AlertService,
    private gettingStartedService: GettingStartedService,
    private matDialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.bankSetupInitiatedTime = performance.now();
    this.initForm();
    this.getBankData();
    this.selectedBankName.set(this.checkBodyData?.checkBody?.bankName || null);
  }

  initForm() {
    this.checkForm = this.fb.group({
      nickName: [
        '',
        [Validators.required, ValidationService.noWhitespaceValidator]
      ]
    });
  }

  ConvertToFormDataSignature(base64: string) {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i += 1) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/jpg' });
    const imageFile = new File([blob], 'profile_pic_img.jpg', {
      type: 'image/jpg'
    });

    this.formData.append('signatureImage', imageFile);
  }

  ConvertToFormDataLogo(base64: string) {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i += 1) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/jpg' });
    const imageFile = new File([blob], 'profile_pic_img.jpg', {
      type: 'image/jpg'
    });

    this.formData.append('logoImage', imageFile);
  }

  submit() {
    this.checkForm.markAllAsTouched();
    if (this.checkForm.invalid) {
      return;
    }

    if (this.checkBodyData?.checkBody.signatureImage != '') {
      this.formData.append(
        'signatureUrl',
        this.checkBodyData?.checkBody.signatureImage
      );
    }

    if (this.checkBodyData?.checkBody.logoImage != '') {
      this.formData.append('logoUrl', this.checkBodyData?.checkBody.logoImage);
    }

    const val = this.checkForm.value;

    this.formData.append('bankAccountNickName', val.nickName);
    this.formData.append(
      'bankAccountAddressLine1',
      this.checkBodyData?.checkBody.bankAccountAddressLine1
    );
    this.formData.append(
      'bankAccountAddressLine2',
      this.checkBodyData?.checkBody.bankAccountAddressLine2
    );
    this.formData.append(
      'bankAccountCity',
      this.checkBodyData?.checkBody.bankAccountCity
    );
    this.formData.append(
      'bankAccountName',
      this.checkBodyData?.checkBody.bankAccountName
    );
    this.formData.append(
      'bankAccountNumber',
      this.checkBodyData?.checkBody.bankAccountNumber
    );

    this.formData.append(
      'bankAccountState',
      this.checkBodyData?.checkBody.bankAccountState
    );
    this.formData.append(
      'bankAccountZip',
      this.checkBodyData?.checkBody.bankAccountZip
    );
    this.formData.append(
      'bankAddress1',
      this.checkBodyData?.checkBody.bankAddress
    );
    this.formData.append('bankCity', this.checkBodyData?.checkBody.bankCity);
    this.formData.append('bankState', this.checkBodyData?.checkBody.bankState);
    this.formData.append('bankName', this.checkBodyData?.checkBody.bankName);
    this.formData.append(
      'checkSerialNumber',
      this.checkBodyData?.checkBody.checkSerialNumber
    );
    this.formData.append(
      'bankRoutingNumber',
      this.checkBodyData?.checkBody.bankRoutingNumber
    );
    this.formData.append('bankZip', this.checkBodyData?.checkBody.bankZip);
    this.formData.append(
      'bankAccountType',
      this.checkBodyData?.checkBody.bankAccountType
    );

    this.formData.append(
      'transitNumber',
      this.checkBodyData?.checkBody.transitNumber
    );
    this.formData.append(
      'financialNumber',
      this.checkBodyData?.checkBody.financialNumber
    );
    this.formData.append('country', this.checkBodyData?.checkBody.country);
    this.formData.append(
      'bankIdentity',
      this.checkBodyData?.checkBody.bankIdentity
    );
    this.formData.append('checkType', this.checkBodyData?.checkBody.checkType);

    if (this.checkForm.valid) {
      this.btnDisabled = true;
      this.subscriptions.push(
        this.bankAccService
          .AddBank(this.formData)
          .pipe(
            catchError((err) => {
              if (err) {
                this.btnDisabled = false;
              }
              if (err.error.errorCode == 987) {
                const data = {
                  title: 'The Bank Account already exist.',
                  content: 'Would You Like To Add It Again',
                  width: '370px',
                  doneMsg: 'Yes',
                  cancelMsg: 'No'
                };
                const response = this.alert.confirmAlert(data);
                response.afterClosed().subscribe((result) => {
                  if (result) {
                    this.formData.append('allowDuplicate', '1');
                    this.submit();
                  }
                });
              }
              return of(false);
            }),
            finalize(() => {
              this.btnDisabled = false;
            })
          )
          .subscribe((res) => {
            this.formData.delete('signatureUrl');
            this.formData.delete('logoUrl');
            this.formData.delete('bankAccountNickName');
            this.formData.delete('bankAccountAddressLine1');
            this.formData.delete('bankAccountAddressLine2');
            this.formData.delete('bankAccountCity');
            this.formData.delete('bankAccountName');
            this.formData.delete('bankAccountNumber');
            this.formData.delete('bankAccountState');
            this.formData.delete('bankAccountZip');
            this.formData.delete('bankCity');
            this.formData.delete('bankAccountType');
            this.formData.delete('bankName');
            this.formData.delete('checkSerialNumber');
            this.formData.delete('bankRoutingNumber');
            this.formData.delete('bankZip');
            this.formData.delete('transitNumber');
            this.formData.delete('finantialInstNumber');
            this.formData.delete('country');
            this.formData.delete('checkType');

            if (res.success) {
              // Mark as successfully completed to prevent abandonment tracking
              this.isBankSetupCancelled.set(true);
              this.gettingStartedService.updatedGettingStartedData = 2;
              this.dialogRef.close();
              if (!res.data.is_neo_bank) {
                const verifyData: IConfirmAlert = {
                  title: 'Verify this bank account?',
                  content:
                    'Verify the bank account through convenient method and unlock all payment methods.',
                  doneMsg: 'Verify Now',
                  cancelMsg: 'Do Later',
                  icon: 'success'
                };

                const response = this.alert.confirmAlert(verifyData);
                response.afterClosed().subscribe((result) => {
                  if (result == true) {
                    this.matDialog
                      .open(BankVerifyModalComponent, {
                        maxWidth: '500px',
                        width: '95%',
                        data: {
                          encrypted_bankacc_id: res.data.id,
                          fromYodlee: false
                        },
                        disableClose: true
                      })
                      .afterClosed()
                      .subscribe(() => {
                        this.redirectPage();
                      });
                  } else {
                    this.redirectPage();
                  }
                });
              } else {
                this.redirectPage();
              }
            }
          })
      );
    }
  }

  /**
   * redirects to appropriate pages with available data.
   */
  redirectPage() {
    if (this.checkBodyData.returnUrl) {
      this.router.navigate([this.checkBodyData.returnUrl]);
    } else {
      this.router.navigate(['/manage/verification/index']);
    }
  }

  backtickDesble(evt: { which: number; keyCode: number }): boolean {
    const charCode = evt.which ? evt.which : evt.keyCode;
    if (charCode == 96) {
      return false;
    }
    return true;
  }

  trackBankInitiation(): void {
    this.isBankSetupInitiated.set(true);
    this.postHogService.trackBankSetupInitiated({
      ...this.postHogService.customerPayloadFromStorage(),
      bank_add_method: 'manual',
      is_first_bank_attempt: this.isFirstBankAttempt(),
      bank_count_before: this.bankCountBefore()
    });
  }

  triggerBankSetupAbandoned(): void {
    const duration = performance.now() - this.bankSetupInitiatedTime;
    this.postHogService.trackBankSetupAbandoned({
      ...this.postHogService.customerPayloadFromStorage(),
      setup_duration_seconds: Math.round(duration / 1000),
      exit_reason: 'user_exit',
      bank_selected: this.selectedBankName(),
      steps_completed: this.stepsCompleted(),
      error_code: null,
      bank_selected_type: this.getBankSelectedType(this.selectedBankName()),
      bank_add_method: 'manual'
    });
  }

  getBankSelectedType(bankName: string | null): string | null {
    if(!bankName) {
      return null;
    }

    if(Moengage.creditUnionPatterns.some(pattern => bankName.toLowerCase().includes(pattern))) {
      return 'credit_union';
    }
    if(Moengage.majorPatterns.some(pattern => bankName.toLowerCase().includes(pattern))) {
      return 'major';
    }
    return 'regional';
  }

  getBankData(){
    this.subscriptions.push(
    this.bankAccService.getBankAccounts(1, '').subscribe({
      next: (res) => {
        if(res.success){
          const isFirstBankAttempt = this.isFirstBankAttemptChecker(res?.totalCount || 0, res?.data?.[0]?.fullAccountNumber || '');
          this.isFirstBankAttempt.set(isFirstBankAttempt);
          this.bankCountBefore.set(res?.totalCount || 0);
          this.trackBankInitiation();
        }
      }
    }));
  }

  isFirstBankAttemptChecker(totalCount: number, bankAccountNumber: string | number): boolean {
    if(totalCount === 0) return true;
    if(totalCount === 1 && (bankAccountNumber).toString() === '1111111111') return true;
    return false;
  }

  ngOnDestroy(): void {
    // Track abandonment only if setup was initiated but not successfully completed
    if (this.isBankSetupInitiated() && !this.isBankSetupCancelled()) {
      this.triggerBankSetupAbandoned();
    }
    
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}

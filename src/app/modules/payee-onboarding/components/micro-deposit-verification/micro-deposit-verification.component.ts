import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  inject
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { BankAccountsService } from 'src/app/shared/service/bankAccounts/bank-accounts.service';
import {
  IBankAccountEditDetails,
  IConfirmMicroDeposit
} from 'src/app/models/bank';
import { Router } from '@angular/router';
import { Subject, finalize, takeUntil } from 'rxjs';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { CommonInputFieldComponent } from 'src/app/shared/v3/common-input-field/common-input-field.component';
import { V35ControlMessageComponent } from 'src/app/shared/v3/control-message-v35/control-message-v35.component';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import {
  IPayeeOnBoardingDetails,
  PayeeOnboardingService
} from '../../services/payee-onboarding.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';

interface IConfirmMicroDepositForm {
  bankAccountId: FormControl<string | null | undefined>;
  amount1: FormControl<number | null>;
  amount2: FormControl<number | null>;
  externalLogin: FormControl<string | null | undefined>;
}

@Component({
  selector: 'app-micro-deposit-verification',
  templateUrl: './micro-deposit-verification.component.html',
  standalone: true,
  imports: [
    CommonModule,
    CommonInputFieldComponent,
    FormsModule,
    ReactiveFormsModule,
    V35ControlMessageComponent,
    CommonButtonV35Component
  ],
  styleUrls: ['./micro-deposit-verification.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MicroDepositVerificationComponent implements OnInit, OnDestroy {
  private payeeOnBoardingService = inject(PayeeOnboardingService);
  private bankAccountService = inject(BankAccountsService);
  private alertService = inject(AlertService);
  private router = inject(Router);
  private localStorageService = inject(LocalStorageService);

  confirmMicroDepositForm = new FormGroup<IConfirmMicroDepositForm>({
    bankAccountId: new FormControl(
      this.payeeOnBoardingService.payeeOnboardingSignal().initiatorId,
      [Validators.required]
    ),
    amount1: new FormControl(null, [Validators.required]),
    amount2: new FormControl(null, [Validators.required]),
    externalLogin: new FormControl(
      this.payeeOnBoardingService.payeeOnboardingSignal().externalToken,
      Validators.required
    )
  });

  maskedBankAccountNumber = '';
  payeeOnBoardingDetails?: Partial<IPayeeOnBoardingDetails>;
  formSubmitting = false;
  dataLoading = false;
  bankAccountForMD: IBankAccountEditDetails;
  destroy$ = new Subject<boolean>();

  ngOnInit(): void {
    this.getPayeeOnBoardingDetails();
  }

  /**
   * @description Method to get the bank account details for micro deposit.
   */
  getBankData(bankAcId: string) {
    this.dataLoading = true;
    this.bankAccountService
      .viewBankById(bankAcId)
      .pipe(
        finalize(() => {
          this.dataLoading = false;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        this.bankAccountForMD = res.data;
        this.maskedBankAccountNumber = this.createMaskedValue(
          this.bankAccountForMD.bankAccountNumber,
          3
        );
      });
  }

  /**
   * @description Method to create masked values from a string or number.
   * @param originalValue - Value to be masked. Can be a string or number.
   * @param visibleLastDigits - Number of digits in the end that should be made visible.
   * Default is zero.
   * @param maskCharacter - Character to use as mask. Default is 'X'.
   * @returns Masked value as string.
   */
  createMaskedValue(
    originalValue: string | number,
    visibleLastDigits = 0,
    maskCharacter = 'X'
  ): string {
    if (typeof originalValue === 'number')
      originalValue = originalValue.toString();

    let maskedValue = '';
    const maskLimit = originalValue.length - visibleLastDigits;
    for (let i = 0; i < originalValue.length; i += 1) {
      maskedValue += i < maskLimit ? maskCharacter : originalValue[i];
    }
    return maskedValue;
  }

  getPayeeOnBoardingDetails() {
    toObservable(this.payeeOnBoardingService.payeeOnboardingSignal)
      .pipe(takeUntil(this.destroy$))
      .subscribe((val) => {
        this.payeeOnBoardingDetails = val;
        if (val) {
          if (val.initiatorId) {
            this.getBankData(val.initiatorId);
          }
        }
      });
  }

  /**
   * @description Method to process micro deposit.
   */
  processMicroDeposit() {
    this.confirmMicroDepositForm.markAllAsTouched();
    if (this.confirmMicroDepositForm.invalid) return;

    const formValue = this.confirmMicroDepositForm.getRawValue();
    const sendingData = {
      external_login: formValue.externalLogin,
      amount1: formValue.amount1,
      amount2: formValue.amount2,
      bankAccountId: formValue.bankAccountId
    };

    this.formSubmitting = true;
    this.bankAccountService
      .confirmMicroDeposit(<IConfirmMicroDeposit>sendingData)
      .pipe(
        finalize(() => {
          this.formSubmitting = false;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        if (res.success) {
          this.alertService.successAlert({
            content: 'Your bank account verified successfully.'
          });
          ['payeeObInitId', 'payeeObExtToken', 'payeeObInitFrom'].forEach(
            (val) => {
              this.localStorageService.removeItem(val);
            }
          );
          this.payeeOnBoardingService.ngOnDestroy();
          this.router.navigate(['/manage/wallet/transactions']);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
  }
}

import { NgClass, NgOptimizedImage, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faBuildingColumns } from '@fortawesome/pro-thin-svg-icons';
import { faCircleInfo } from '@fortawesome/pro-solid-svg-icons';
import { finalize, Subject, takeUntil } from 'rxjs';
import { AuthV3Service } from 'src/app/modules/auth/services/auth-v3.service';
import {
  IPayeeBankVerificationInfo,
  IPayeeBankVerificationSavePayload
} from 'src/app/modules/outside/model/outside';
import { IPlaidCallBackResAccount } from 'src/app/shared/plaid/service/plaid.service';
import {
  IPlaidOutsideSuccess,
  PlaidOutsideService
} from 'src/app/shared/plaid/service/plaid-outside.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { OutsideService } from 'src/app/shared/service/outisde/outside.service';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { CommonInputFieldComponent } from 'src/app/shared/v3/common-input-field/common-input-field.component';
import { V35ControlMessageComponent } from 'src/app/shared/v3/control-message-v35/control-message-v35.component';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-payee-bank-verification',
  standalone: true,
  imports: [
    CommonInputFieldComponent,
    V35ControlMessageComponent,
    FormsModule,
    ReactiveFormsModule,
    CommonButtonV35Component,
    NgOptimizedImage,
    FaIconComponent,
    NgClass,
    NgTemplateOutlet
  ],
  templateUrl: './payee-bank-verification.component.html',
  styleUrl: './payee-bank-verification.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PayeeBankVerificationComponent implements OnInit, OnDestroy {
  private outsideService = inject(OutsideService);
  private plaidOutsideService = inject(PlaidOutsideService);
  private alertService = inject(AlertService);
  private route = inject(ActivatedRoute);
  public authV3Service = inject(AuthV3Service);

  private token = '';
  private destroy$ = new Subject();

  env = environment;
  logoPath = signal('assets/main/app_logo.svg');
  faBuildingColumns = faBuildingColumns;
  faCircleInfo = faCircleInfo;

  isLoading = signal(false);
  isSubmit = signal(false);
  isLoadingPlaid = signal(false);
  linkValid = signal(false);
  bankVerified = signal(false);
  microDepositPending = signal(false);
  microDepositAlreadyPending = signal(false);
  bankAccountId = signal<string | null>(null);

  selectedType = signal<'manual' | 'instant'>('manual');

  private plaidKey = '';

  verificationInfo = computed(() => {
    if (this.selectedType() === 'instant') {
      return {
        title: 'Verify instantly',
        description:
          'Securely log in to your bank through Plaid to confirm you own this account. Verification is instant — nothing to wait for.'
      };
    }
    return {
      title: 'Verify with micro-deposits',
      description:
        'We will send two small deposits to this bank account within 1–3 business days. Once they arrive, you will receive an email to confirm the amounts and complete the verification.'
    };
  });

  bankAccountType = [
    { value: 'businessChecking', name: 'Business Checking' },
    { value: 'businessSavings', name: 'Business Savings' },
    { value: 'personalChecking', name: 'Personal Checking' },
    { value: 'personalSavings', name: 'Personal Savings' }
  ];

  bankOptions = [
    {
      id: 'manual' as const,
      icon: 'fa-building-columns',
      title: 'Verify Manually',
      content: 'Confirm small deposits sent to your bank account'
    },
    {
      id: 'instant' as const,
      svg: true,
      title: 'Verify Instantly',
      content: 'Log in to your bank securely through Plaid'
    }
  ];

  bankForm = new FormGroup({
    holderName: new FormControl('', [Validators.required, ValidationService.personNameValidator]),
    routingNumber: new FormControl('', [Validators.required]),
    accountNumber: new FormControl('', [Validators.required]),
    accountType: new FormControl('', [Validators.required])
  });

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
    this.setLogo();
    this.getInfo();
  }

  private setLogo(): void {
    if (this.env.isItWhiteLabel) {
      this.logoPath.set(
        `assets/white_label/${this.env.env_id}/assets/app_logo.png`
      );
    } else {
      this.logoPath.set(
        this.authV3Service.appConfig?.websiteLogo ?? 'assets/main/app_logo.svg'
      );
    }
  }

  private getInfo(): void {
    if (!this.token) {
      this.linkValid.set(false);
      return;
    }
    this.isLoading.set(true);
    this.outsideService
      .getPayeeBankVerificationInfo(this.token)
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (res) => {
          this.linkValid.set(res.success);
          if (res.success && res.data) {
            if (res.data.micro_deposit_pending) {
              this.microDepositAlreadyPending.set(true);
              return;
            }
            this.prefillForm(res.data);
            this.bankAccountId.set(res.data.bank_account_id ?? null);
          }
        },
        error: () => this.linkValid.set(false)
      });
  }

  private prefillForm(info: IPayeeBankVerificationInfo): void {
    this.bankForm.patchValue({
      holderName: info.payee_name ?? '',
      routingNumber: info.routing_number ?? '',
      accountNumber: info.account_number ?? '',
      accountType: info.account_type ?? ''
    });
    this.bankForm.controls.holderName.disable();
    this.bankForm.controls.routingNumber.disable();
    this.bankForm.controls.accountNumber.disable();
    this.bankForm.controls.accountType.disable();
  }

  onSelectType(type: 'manual' | 'instant'): void {
    this.selectedType.set(type);
    if (type === 'instant') {
      this.openPlaid();
    }
  }

  private openPlaid(): void {
    this.isLoadingPlaid.set(true);
    this.outsideService
      .getPayeeVerificationPlaidToken(this.token)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (!res.success || !res.data.token) {
            this.isLoadingPlaid.set(false);
            this.notifyFailure((res as { errorMsg?: string }).errorMsg);
            return;
          }
          this.plaidKey = res.data.key;
          this.runPlaid(res.data.token);
        },
        error: (err) => {
          this.isLoadingPlaid.set(false);
          this.notifyFailure(this.errorMessage(err));
        }
      });
  }

  private runPlaid(linkToken: string): void {
    this.plaidOutsideService
      .open(linkToken)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) =>
          result ? this.exchangePlaidToken(result) : this.isLoadingPlaid.set(false),
        error: (err) => {
          this.isLoadingPlaid.set(false);
          this.notifyFailure(this.errorMessage(err));
        }
      });
  }

  /** §6b — exchange the Plaid public token; the account is registered and its id returned. */
  private exchangePlaidToken(result: IPlaidOutsideSuccess): void {
    this.outsideService
      .payeeVerificationPlaidCallback({
        public_token: result.publicToken,
        key: this.plaidKey,
        institutionName: result.metadata.institution?.name || null,
        institutionId: result.metadata.institution?.institution_id || null,
        metadata: result.metadata
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (!res.success) {
            this.isLoadingPlaid.set(false);
            this.notifyFailure((res as { errorMsg?: string }).errorMsg);
            return;
          }
          this.verifyPlaid(
            this.bankAccountId() ?? '',
            res.data.accounts,
          );
        },
        error: (err) => {
          this.isLoadingPlaid.set(false);
          this.notifyFailure(this.errorMessage(err));
        }
      });
  }

  /** §6c — match the Plaid account to the payee bank account and mark it verified. */
  private verifyPlaid(
    selectedBankId: string,
    accounts: IPlaidCallBackResAccount[],
  ): void {
    this.isSubmit.set(true);
    this.outsideService
      .verifyPayeeVerificationPlaid({
        token: this.token,
        selectedBankId,
        accounts
      })
      .pipe(
        finalize(() => {
          this.isLoadingPlaid.set(false);
          this.isSubmit.set(false);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.bankVerified.set(true);
          } else {
            this.notifyFailure((res as { errorMsg?: string }).errorMsg);
          }
        },
        error: (err) => this.notifyFailure(this.errorMessage(err))
      });
  }

  submit(): void {
    if (this.selectedType() === 'instant') {
      this.openPlaid();
      return;
    }

    this.bankForm.markAllAsTouched();
    if (this.bankForm.invalid) return;

    const formValue = this.bankForm.getRawValue();
    const payload: IPayeeBankVerificationSavePayload = {
      token: this.token,
      account_name: formValue.holderName as string,
      routing_number: formValue.routingNumber as string,
      account_number: formValue.accountNumber as string,
      account_type: formValue.accountType as string,
      bank_name: ''
    };

    this.isSubmit.set(true);
    this.outsideService
      .savePayeeBankMicroDeposit(payload)
      .pipe(
        finalize(() => this.isSubmit.set(false)),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (res) => {
          if (!res.success) {
            this.notifyFailure((res as { errorMsg?: string }).errorMsg);
            return;
          }
          if (res.data.type === 'md') {
            this.microDepositPending.set(true);
          } else {
            this.bankVerified.set(true);
          }
        },
        error: (err) => this.notifyFailure(this.errorMessage(err))
      });
  }

  private notifyFailure(message?: string | null): void {
    this.alertService.failedAlert({
      content: message || 'Something went wrong. Please try again.'
    });
  }

  private errorMessage(err: unknown): string | undefined {
    return err instanceof HttpErrorResponse
      ? err.error?.errorMsg ?? err.error?.message
      : undefined;
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}

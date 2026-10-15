import { NgClass } from '@angular/common';
import {
  Component,
  EventEmitter,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  inject,
  input,
  output,
  signal
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { EMPTY, Subject, Subscription, debounceTime, distinctUntilChanged, filter, finalize, firstValueFrom, forkJoin, switchMap, takeUntil, tap } from 'rxjs';
import { NonNullableFormValue } from 'src/app/models/api';
import { IV3DropDownOnReady } from 'src/app/models/common';
import {
  ICardOnBoardingStatus,
  ICreateGiftCard,
  IWalletData
} from 'src/app/models/wallet';
import { CVSourceType } from 'src/app/modules/common-verification/model/common-verification';
import {
  IPayeeDetailsEvent,
  IPayeeDropdown
} from 'src/app/modules/payee/payee-v2/model/payee';
import { PayeeDataV35Service } from 'src/app/modules/payee/payee-v3/v35-services/payee-data-v35.service';
import {
  IPaymentConfig,
  IPaymentSuccessData
} from 'src/app/modules/payments/model/payments';
import { RainCardSelectBusinessComponent } from 'src/app/modules/wallet/wallet-v3/modals-v35/existing-business/raincard-select-businesss.component';
import { WalletDataV35Service } from 'src/app/modules/wallet/wallet-v3/services/wallet-data-v35.service';
import { AmountInputComponent } from 'src/app/shared/components/amount-input/amount-input.component';
import { NewPhoneInputComponent } from 'src/app/shared/components/new-phone-input/new-phone-input.component';
import { PayeeDropdownV3Component } from 'src/app/shared/components/v3/drop-downs/payee-dropdown-v3/payee-dropdown-v3.component';
import { WalletDropdownV3Component } from 'src/app/shared/components/v3/drop-downs/wallet-dropdown-v3/wallet-dropdown-v3.component';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { CommonVerificationService } from 'src/app/shared/service/common/common-verification.service';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { WalletService } from 'src/app/shared/service/wallet/wallet.service';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { V35ControlMessageComponent } from 'src/app/shared/v3/control-message-v35/control-message-v35.component';
import { BillService } from 'src/app/shared/service/Bill/bill.service';
import { ActivatedRoute } from '@angular/router';
import { CheckAddAttachmentCommonModalComponent } from 'src/app/modules/check/modal/check-activity-modals/check-add-attachment-common-modal/check-add-attachment-common-modal.component';
import { AddCommentsModalComponent } from 'src/app/shared/modal/comments-modal/add-comments-modal/add-comments-modal.component';
import { IAttachmentItem } from 'src/app/models/common';
import { IComments } from 'src/app/data/data/cloud-quick-pay';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { OtpModalComponent } from '../../../../../cloud-bank/cloud-bank-v2/modals/otp-modal/otp-modal.component';

@Component({
  selector: 'app-wallet-virtual-card-rain-v3',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    AmountInputComponent,
    WalletDropdownV3Component,
    PayeeDropdownV3Component,
    FaIconComponent,
    V35ControlMessageComponent,
    NgClass,
    CommonButtonV35Component,
    NewPhoneInputComponent,
    NgClass
  ],
  templateUrl: './wallet-virtual-card-rain-v3.component.html',
  styleUrl: './wallet-virtual-card-rain-v3.component.scss'
})
export class WalletVirtualCardRainV3Component
  implements OnInit, OnChanges, OnDestroy
{
  public payeeDataService = inject(PayeeDataV35Service);

  private paymentsService = inject(PaymentsService);
  private walletService = inject(WalletService);
  private alertService = inject(AlertService);
  private router = inject(Router);
  private verificationService = inject(CommonVerificationService);
  private dialog = inject(MatDialog);
  private walletDataService = inject(WalletDataV35Service);
  private billService = inject(BillService);
  private activatedRoute = inject(ActivatedRoute);
  private payeeService = inject(PayeeService);

  paymentConfig = input<IPaymentConfig | undefined>(undefined);
  payeeDetailsEvents = output<IPayeeDetailsEvent | false>();
  success = output<IPaymentSuccessData>();
  reset = output<void>();
  subscriptions: Subscription[] = [];

  loading = signal(false);
  submitting = signal(false);
  initialLoading = signal(false);
  onBoardingStatus = signal<ICardOnBoardingStatus | undefined>(undefined);

  @Output() loadingState = new EventEmitter<boolean>();
  destroy$ = new Subject<boolean>();

  form = new FormGroup(
    {
      amount: new FormControl<number | null>(null, [
        Validators.required,
        Validators.min(10)
      ]),
      payee: new FormControl<IPayeeDropdown | null>(null, [
        Validators.required
      ]),
      wallet: new FormControl<IWalletData | null>(null, [Validators.required]),
      payeeEmail: new FormControl('', [ValidationService.emailValidator]),
      payeePhone: new FormControl('', [ValidationService.phoneMinLength]),
      cardLimitType: new FormControl('onetime', [Validators.required]),
      // Bill-related form controls
      commentIds: new FormControl([]),
      attachmentIds: new FormControl([]),
    },
    {
      validators: [
        (form) => {
          if (
            !form.get('payeeEmail')?.value &&
            !form.get('payeePhone')?.value
          ) {
            return { phoneEmailValidation: true };
          }

          return null;
        }
      ]
    }
  );

  // Bill-related properties
  bills: string[] = [];
  isBillCheck: boolean = false;
  thirdPartyProviderType: number;
  attachmentCount: number;
  createdExistingAttachments: any[] = [];
  createdExistingComments: any[] = [];
  commentsCount: number;
  sessionKey: string | undefined;

  ngOnInit(): void {
    this.getOnboardingStatus();
    this.observeFormChanges();
    this.billFetch();
  }

 /**
   * @description Fetch the bill details and populating all fields with the bill details
   */
 billFetch() {
  this.subscriptions.push(
    this.activatedRoute.queryParams.subscribe((response) => {
      if (response?.billId) {
        this.bills = [response.billId];
        if (typeof response.billId === 'string') {
          this.bills = response.billId.split(',');
        }
        this.form.controls.amount.disable();
        this.getBillBulkPaymentData();
      }
    })
  );
}


getBillBulkPaymentData() {
  this.subscriptions.push(
    this.billService
      .getBillBulkPaymentData(this.bills)
      .subscribe((res) => {
        if (res) {
          this.isBillCheck = true;
          this.form.controls.amount.setValue(
            res.data.totalAmount as number
          );
          this.thirdPartyProviderType = res.data.providerType;
          this.attachmentCount = res.data.attachments.length;
          this.commentsCount = res.data.comment_count;
          this.loadBillAttachments(); 
          const { payeeId } = res.data.payee;
          this.populatePayeeDetails(payeeId, res.data.payee.payeeName);
        }
      })
  );
}



  populatePayeeDetails(payeeId: string, payeeName: string) {
    this.payeeService
    .getPayees(1, payeeName)
    .pipe(takeUntil(this.destroy$))
    .subscribe((res2) => {
      const payee = res2.data.find(
        (el: IPayeeDropdown) => el.id === payeeId
      );
      if (payee) {
        this.form.controls.payee.setValue(payee);
        this.payeeDetailsEvents.emit({
          payeeDropdownDetails: payee,
          isMoreDetailsLoading: false
        });
      }
    });
 
  }

  /**
   * @description Loads bill attachments using the existing bill service API
   */
  loadBillAttachments() {
    if (this.bills && this.bills.length > 0) {
      const billId = this.bills[0];
      this.billService.getAttachments(billId)
        .pipe(takeUntil(this.destroy$))
        .subscribe((res) => {
          if (res.success && res.data) {
            this.createdExistingAttachments = res.data.map((attachment) => ({
              ...attachment,
              id: attachment.encrypted_id,
              fileName: attachment.file_name,
              billAttach: true
            }));
          }
        });
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes) return;

    if (changes?.paymentConfig && changes.paymentConfig.currentValue?.paymentFormValue) {
      const {paymentFormValue} = changes.paymentConfig.currentValue;
      if(paymentFormValue && Object.keys(paymentFormValue).length > 0) {
        setTimeout(() => {
          if(this.form) {
            this.form.patchValue({...paymentFormValue});
          }
        }, 0);
      }
    }
  }

  observeFormChanges() {
    this.form.controls.payee.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((val) => {
        this.payeeSelect(val ?? undefined);
      });

    this.form.controls.wallet.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(500),
        distinctUntilChanged(),
        filter((val) => val !== undefined),
        switchMap((val) => {
          this.walletDataService.walletDataSignal.set(val ?? undefined);
          return this.walletSelect(val ?? undefined);
        })
      )
      .subscribe();
  }

  getOnboardingStatus() {
    this.initialLoading.set(true);
    this.loadingState.emit(true);  // Notify parent to disable dropdowns
    this.form.disable();

    this.walletService
      .getCardOnboardingStatus()
      .pipe(
        finalize(() => {
          this.initialLoading.set(false);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(({ success, data }) => {
        if (!success) {
          this.loadingState.emit(false); // Done, re-enable dropdowns
          return;
        }

        this.onBoardingStatus.set(data);

        const { status } = data;

        if (status !== 'Approved') {
          const ref = this.alertService.confirmAlert({
            title: 'Not Approved',
            doneMsg: 'Apply Now',
            content:
              "You're not currently approved to make this payment. Do you want to apply for this feature?"
          });

          ref.afterClosed().subscribe((res) => {
            this.loadingState.emit(false);  // Done, re-enable dropdowns
            if (res) {
              this.router.navigate(['manage', 'virtual-card']);
            } else {
              this.reset.emit();
            }
          });

          return;
        }

        this.form.enable({ emitEvent: false });
        this.loadingState.emit(false);  // Done, re-enable dropdowns
      });
  }

  populateOnEdit(ev: IV3DropDownOnReady, id: string) {
    if (ev.setItemWithId) {
      ev.setItemWithId(id);
    }
  }

  payeeSelect(payee?: IPayeeDropdown) {
    if (!payee) return;

    if (payee) {
      this.payeeDetailsEvents.emit({
        payeeDropdownDetails: payee,
        isMoreDetailsLoading: true
      });

      this.form.controls.payeeEmail.setValue(payee.email ?? null);
      this.form.controls.payeePhone.setValue(payee.phone ?? null);
    } else {
      this.form.controls.payee.reset();
      this.payeeDetailsEvents.emit({
        payeeDropdownDetails: undefined,
        isMoreDetailsLoading: false
      });
    }
  }

  walletSelect(wallet?: IWalletData) {
    if (!wallet) return EMPTY;

    return forkJoin([
      this.walletService.getCardOnboardingStatus(wallet.uuId),
      this.verificationService.applicationStatus()
    ])
      .pipe(
        takeUntil(this.destroy$),
        tap(([onboardingStatus, applicationStatus]) => {
          const { success, data } = onboardingStatus;
          if (!success) return;
  
          if (
            !data.wallet_onboard ||
            (Array.isArray(data.wallet_onboard) &&
              data.wallet_onboard.length === 0)
          ) {
            const ref = this.alertService.confirmAlert({
              title: 'Not Approved',
              doneMsg: 'Apply Now',
              content:
                'This wallet is not approved for card issuing. To create virtual cards using this wallet, please apply for card program access or switch to an approved wallet'
            });
  
            ref.afterClosed().subscribe((res) => {
              if (res) {
                this.openRainCardOnboarding(applicationStatus.data);
              } else {
                this.form.controls.wallet.reset();
              }
            });
  
            return;
          }
  
          const { status } = data.wallet_onboard;
          if (status && status !== 'approved' && status !== 'completed') {
            this.alertService.infoAlert({
              content:
                'Wallet verification is pending. Virtual card can be created only after approval.'
            });
            this.form.controls.wallet.reset();
          }
        })
      );
  }

  openRainCardOnboarding(kycKybStatus: {
    kybStatus: number;
    kycStatus: number;
  }) {
    const ref = this.dialog.open(RainCardSelectBusinessComponent, {
      maxWidth: '515px',
      width: '100%',
      maxHeight: '85%',
      disableClose: true,
      autoFocus: false,
      data: {
        sourceType: CVSourceType.rain_card,
        applicationStatus: kycKybStatus,
        mode: 'map',
        from: 'home',
        kybRecords: this.onBoardingStatus()?.active_user_kyb_records
      }
    });

    ref.afterClosed().subscribe((res) => {
      if (!res || !res.success) return;

      if (res.proceedPayment) {
        this.submitPayment();
        return;
      }

      this.form.controls.wallet.reset();
      this.alertService.successAlert({
        content:
          'Your wallet is currently under on review. Once approved, you will be able to make this payment.'
      });
    });
  }

  async submitPayment() {
    this.form.markAllAsTouched();

    if (this.form.invalid) return;

    const { wallet, payee, ...formValue } = this.form
      .value as NonNullableFormValue<typeof this.form.value>;

    const confirmation = await firstValueFrom(
      this.paymentsService
        .openPaymentConfirmationModal({
          amount: <number>this.form.value.amount,
          accNumber: wallet.bankAccountNumber,
          bankName: wallet.bankAccountName ?? '',
          payeeName: payee.name,
          paymentMethod: 'Virtual Card',
          type: 'wallet'
        })
        .afterClosed()
    );

    if (!confirmation) return;

    const cardDetails: ICreateGiftCard = {
      walletId: wallet.uuId,
      cardType: 'virtual',
      limitAmount: formValue.amount,
      cardLimitType: formValue.cardLimitType,
      payeeId: payee.id,
      payeeEmail: formValue.payeeEmail,
      payeePhone: formValue.payeePhone,
      session_key: this.sessionKey ? this.sessionKey : undefined
    };

    this.loading.set(true);
    this.paymentsService.isPaymentProcessingSubject.next(true);

    this.walletService
      .createGiftCard(cardDetails)
      .pipe(
        finalize(() => {
          this.loading.set(false);
          this.paymentsService.isPaymentProcessingSubject.next(false);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (res) => {
          // Check for OTP verification required (error code 112)
          if (!res.success && res.errorCode === '112') {
            this.sessionKey = res.session_key;
            const dialog = this.dialog.open(OtpModalComponent, {
              maxWidth: '410px',
              width: '100%',
              disableClose: true,
              autoFocus: false,
              data: res
            });
            dialog.afterClosed().subscribe((result) => {
              if (result) {
                this.submitPayment();
              }
            });
            return;
          }

          if (!res.success) return;

          this.success.emit({
            title: 'Your Payment is Completed',
            content:
              'Your payment has been completed. Please check the status in your records.'
          });
        },
        error: (err) => {
          // Handle HTTP errors (4xx, 5xx)
          if (err?.error?.errorCode === 112 || err?.error?.errorCode === '112') {
            this.sessionKey = err.error.session_key;
            const dialog = this.dialog.open(OtpModalComponent, {
              maxWidth: '410px',
              width: '100%',
              disableClose: true,
              autoFocus: false,
              data: err.error
            });
            dialog.afterClosed().subscribe((result) => {
              if (result) {
                this.submitPayment();
              }
            });
          }
        }
      });
  }

  /**
   * @description Open modal for adding attachment and gives the added data when its closed
   */
  openAddAttachment() {
    if (this.isBillCheck && this.bills && this.bills.length > 0) {
      // For bill payments, use the bill-specific attachment modal
      const dialogRef = this.dialog.open(CheckAddAttachmentCommonModalComponent, {
        maxWidth: '600px',
        width: '93%',
        data: {
          billId: this.bills[0],
          existingData: this.createdExistingAttachments
        }
      });

      dialogRef.afterClosed().subscribe((res) => {
        if (res) {
          this.createdExistingAttachments = res.existingData;
          this.attachmentCount = res.existingData.length;
        }
      });
    } else {
      // For regular payments, use the existing service
      this.paymentsService
        .openAddAttachment(this.createdExistingAttachments, '')
        .pipe(takeUntil(this.destroy$))
        .subscribe((attachments: IAttachmentItem[]) => {
          this.createdExistingAttachments = attachments;
          this.attachmentCount = attachments.length;
        });
    }
  }

  /**
   * @description Open modal for adding comment and gives the added data when its closed
   */
  openAddComment() {
    if (this.isBillCheck && this.bills && this.bills.length > 0) {
      // For bill payments, use the bill-specific comment modal
      const dialogRef = this.dialog.open(AddCommentsModalComponent, {
        maxWidth: '600px',
        width: '93%',
        data: {
          billId: this.bills[0],
          existingData: this.createdExistingComments
        }
      });

      dialogRef.afterClosed().subscribe((res) => {
        if (res) {
          this.createdExistingComments = res.existingData;
          this.commentsCount = res.existingData.length;
        }
      });
    } else {
      // For regular payments, use the existing service
      this.paymentsService
        .openAddComment(this.createdExistingComments, '')
        .pipe(takeUntil(this.destroy$))
        .subscribe((comments: IComments[]) => {
          this.createdExistingComments = comments;
          this.commentsCount = comments.length;
        });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }
}

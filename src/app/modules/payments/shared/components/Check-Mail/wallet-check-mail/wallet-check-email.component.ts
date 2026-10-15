import { DatePipe, NgClass } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  inject
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { finalize, delay, debounceTime } from 'rxjs/operators';
import { IComments } from 'src/app/data/data/cloud-quick-pay';
import { IAttachmentItem, IV3DropDownOnReady } from 'src/app/models/common';
import { ICategoryDropdown } from 'src/app/modules/category/model/category';
import { CVSourceType } from 'src/app/modules/common-verification/model/common-verification';
import {
  IPayeeDetailsEvent,
  IPayeeDropdown,
  IPayeeEditedData,
  IPayeeView,
  IPayeeViewInfo
} from 'src/app/modules/payee/payee-v2/model/payee';
import {
  IPaymentConfig,
  IUpdatePaymentBody,
  TPaymentProcessingContext
} from 'src/app/modules/payments/model/payments';
import { IWalletData } from 'src/app/models/wallet';
import { CategoryAddModalComponent } from 'src/app/shared/modal/category-modal/category-add-modal/category-add-modal.component';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { PsbService } from 'src/app/shared/service/psb/psb.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { BillService } from 'src/app/shared/service/Bill/bill.service';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatBadge } from '@angular/material/badge';
import { MatTooltip } from '@angular/material/tooltip';
import { PayeeModalService } from 'src/app/shared/service/payee-modal/payee-modal.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { PayeeDataV35Service } from 'src/app/modules/payee/payee-v3/v35-services/payee-data-v35.service';
import { faClockRotateLeft } from '@fortawesome/pro-regular-svg-icons';
import { environment } from 'src/environments/environment';
import { PersonaHelperService } from 'src/app/shared/persona-v4/service/persona-helper.service';
import { MatSelectModule } from '@angular/material/select';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { CheckEmailModalComponent } from 'src/app/modules/check/modal/check-email-modal/check-email-modal.component';
import { CommonButtonV35Component } from '../../../../../../shared/v3/buttons/common-button-v35/common-button-v35.component';
import { CategoryDropdownV3Component } from '../../../../../../shared/components/v3/drop-downs/category-dropdown-v3/category-dropdown-v3.component';
import { PayeeDropdownV3Component } from '../../../../../../shared/components/v3/drop-downs/payee-dropdown-v3/payee-dropdown-v3.component';
import { WalletDropdownV3Component } from '../../../../../../shared/components/v3/drop-downs/wallet-dropdown-v3/wallet-dropdown-v3.component';
import { V35ControlMessageComponent } from '../../../../../../shared/v3/control-message-v35/control-message-v35.component';
import { AmountInputComponent } from '../../../../../../shared/components/amount-input/amount-input.component';
import { faCircleQuestion } from '@fortawesome/pro-solid-svg-icons';
import { CheckAddAttachmentCommonModalComponent } from 'src/app/modules/check/modal/check-activity-modals/check-add-attachment-common-modal/check-add-attachment-common-modal.component';
import { AddCommentsModalComponent } from 'src/app/shared/modal/comments-modal/add-comments-modal/add-comments-modal.component';
interface IPaymentForm {
  amount: FormControl<string | null>;
  payee: FormControl<IPayeeDropdown | null>;
  wallet: FormControl<IWalletData | null>;
  memo: FormControl<string | null>;
  payeeEmail: FormControl<string | null>;
  payeeIdNumber: FormControl<string | null>;
  invoiceNumber: FormControl<string | null>;
  address1: FormControl<string | null>;
  address2: FormControl<string | null>;
  country: FormControl<string | null>;
  city: FormControl<string | null>;
  state: FormControl<string | null>;
  zip: FormControl<string | null>;
  payeePhone: FormControl<string | null>;
  category: FormControl<ICategoryDropdown | null>;
  // Bill-related form controls
  commentIds: FormControl<string[] | null>;
  attachmentIds: FormControl<string[] | null>;
  chequeInvoiceNumber: FormControl<string | null>;
}

@Component({
  standalone: true,
  selector: 'app-wallet-check-email',
  templateUrl: './wallet-check-email.component.html',
  styleUrls: ['./wallet-check-email.component.scss'],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    AmountInputComponent,
    NgClass,
    V35ControlMessageComponent,
    WalletDropdownV3Component,
    FaIconComponent,
    PayeeDropdownV3Component,
    CategoryDropdownV3Component,
    MatTooltip,
    MatBadge,
    CommonButtonV35Component,
    MatSelectModule
  ]
})

export class WalletCheckEmailComponent
  implements OnInit, OnDestroy, OnChanges
{
  @Output() success = new EventEmitter<
    boolean | { title?: string; content?: string }
  >();

  @Output() payeeDetailsEvents = new EventEmitter<IPayeeDetailsEvent | false>();
  @Output() calculateFee = new EventEmitter();
  @Input() paymentConfig: IPaymentConfig;
  @Input() changedInfo: IPayeeEditedData | undefined;

  private psbService = inject(PsbService);
  private alertService = inject(AlertService);
  private router = inject(Router);
  private matDialog = inject(MatDialog);
  paymentsService = inject(PaymentsService);
  sharedService = inject(SharedService);
  datePipe = inject(DatePipe);
  dialog = inject(MatDialog);
  public payeeDataService = inject(PayeeDataV35Service);
  private payeeService = inject(PayeeService);
  private billService = inject(BillService);
  private payeeModalService = inject(PayeeModalService);
  private activatedRoute = inject(ActivatedRoute);
  private personaHelperService = inject(PersonaHelperService);
  private localStorageService = inject(LocalStorageService);
  private validationService = inject(ValidationService);
  private checkService = inject(CheckService);

  paymentForm: FormGroup<IPaymentForm>;
  subscriptions: Subscription[] = [];
  payee: IPayeeDropdown;
  payeeDetails: IPayeeView;
  loading = false;
  faHistory = faClockRotateLeft;
  faCircleQuestion=faCircleQuestion;

  /**
   * @description Is is payee details edited or not
   */
  isEditPayee = false;
  payeeAddressLoading = false;
  selectedPayeeDetails: IPayeeDropdown;
  dateToday = this.datePipe.transform(new Date(), 'yyyy-MM-dd');
  paymentProcessingContext: string;
  createdExistingAttachments: IAttachmentItem[] = [];
  createdExistingComments: IComments[] = [];
  encId: string;
  insertFromRemittance = false;
  newRemittanceFormat: boolean;
  remitanceTotal: number;
  hasRemittance = false;
  attachmentCount: number;
  commentsCount: number;
  // Bill-related properties
  bills: string[] = [];
  isBillCheck: boolean = false;
  thirdPartyProviderType: number;
  savedPaymentId: string | undefined;
  amountInputDisabled = false;
  proccessed = false;
  userPlugins = this.localStorageService.getItem('userPlugins');

  ngOnInit(): void {
    this.paymentsService.payeeDetails = undefined;
    this.initForm();
    this.getCount();
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
        this.amountInputDisabled = true;
        this.getBillBulkPaymentData();
      }
    })
  );
}


populatePayeeDetails(payeeId: string, payeeName: string) {
  this.subscriptions.push(
    this.payeeService
      .getPayees(1, payeeName)
      .subscribe((res2) => {
        const payee = res2.data.find(
          (el: IPayeeDropdown) => el.id === payeeId
        );
        this.selectPayee(payee as IPayeeDropdown, false);
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
          this.paymentForm.controls.amount.setValue(
            res.data.totalAmount as string
          );
          let {memo} = res.data;
 
          if (!this.userPlugins?.includes('no-bill-payment-memo-default') && !memo) {
            memo = `Payment for Bill ${res.data.invoiceNumbers}`;
          }

          this.paymentForm.controls.memo.setValue(memo);
          this.paymentForm.controls.chequeInvoiceNumber.setValue(
            res.data.invoiceNumbers
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


  /**
   * @description Loads bill attachments using the existing bill service API
   */
  loadBillAttachments() {
    if (this.bills && this.bills.length > 0) {
      const billId = this.bills[0];
      this.subscriptions.push(
        this.billService.getAttachments(billId).subscribe((res) => {
          if (res.success && res.data) {
            this.createdExistingAttachments = res.data.map((attachment) => ({
              ...attachment,
              id: attachment.encrypted_id,
              fileName: attachment.file_name,
              billAttach: true
            }));
          }
        })
      );
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes?.paymentConfig && changes.paymentConfig.currentValue?.paymentFormValue) {
      const {paymentFormValue} = changes.paymentConfig.currentValue;
      
      // Re-patch form when paymentConfig.paymentFormValue is updated
      if (paymentFormValue && Object.keys(paymentFormValue).length > 0) {
        setTimeout(() => {
          if (this.paymentForm) {
            this.paymentForm.patchValue({ ...paymentFormValue });
          }
        }, 0);
      }
    }
    
    if (changes?.changedInfo) {
      if (this.changedInfo?.selectedPayeeDetails?.id) {
        this.getPayeeDetails(this.changedInfo?.selectedPayeeDetails?.id, true);
        this.paymentForm.controls.payeeEmail.setValue(
          this.changedInfo?.selectedPayeeDetails?.email || ''
        );
      }
    }
  }

  /**
   * @description This function creates form controls for the payment form, sets up validators for each control, and subscribes to the changes in the "payee" control.
   */
  initForm() {
    this.paymentForm = new FormGroup<IPaymentForm>({
      amount: new FormControl(null, [
        Validators.required,
        Validators.min(0.01)
      ]),
      payee: new FormControl<IPayeeDropdown | null>(null, [
        Validators.required
      ]),
      wallet: new FormControl<IWalletData | null>(null, [Validators.required]),
      memo: new FormControl('', [Validators.maxLength(150)]),
      payeeEmail: new FormControl('', [
        Validators.required,
        ValidationService.emailValidator,
        this.validationService.validateDifferentEmail()
      ]),
      payeeIdNumber: new FormControl('', [Validators.maxLength(30)]) as FormControl,
      invoiceNumber: new FormControl(''),
      address1: new FormControl(''),
      address2: new FormControl(''),
      city: new FormControl(''),
      state: new FormControl(''),
      country: new FormControl(''),
      zip: new FormControl(''),
      payeePhone: new FormControl(''),
      category: new FormControl(null),
      // Bill-related form controls
      commentIds: new FormControl([]),
      attachmentIds: new FormControl([]),
      chequeInvoiceNumber: new FormControl(null)
    });
    this.subscriptions.push(
      this.paymentForm.controls.payee.valueChanges.subscribe((payee) => {
        if (payee && payee?.id) {
          this.selectedPayeeDetails = payee;
          this.payee = payee;
          this.getPayeeDetails(payee.id);
        }
      }),
      this.paymentForm.controls.amount.valueChanges.subscribe((val) => {
        this.paymentsService.hasAmount.update(() => Boolean(val));
      })
    );

    this.subscriptions.push(
      this.paymentForm.controls.amount.valueChanges
        .pipe(debounceTime(1500))
        .subscribe((val) => {
          const amount = Number(val);
          this.calculateFee.emit({
            amount,
            paymentSource: 'wallet',
            paymentMethod: 'email'
          });
        })
    );

    this.setCommonFormValues();
  }

  /**
   * @description Populate the dropdown by fetching the data using the id
   * @param ev
   * @param id
   */
  populateOnEdit(ev: IV3DropDownOnReady, id: string) {
    if (ev.setItemWithId) {
      ev.setItemWithId(id);
    }
  }

  /**
   * @description This function sets up form value changes subscription and patches the form with initial values.
   */
  setCommonFormValues() {
    this.subscriptions.push(
      this.paymentForm.valueChanges.subscribe((formValueChanges) => {
        this.paymentConfig.paymentFormValue = {
          ...this.paymentConfig.paymentFormValue,
          ...formValueChanges
        };
      })
    );
    if (this.paymentConfig.paymentFormValue) {
      this.paymentForm.patchValue(this.paymentConfig.paymentFormValue);
    }

    if (this.paymentConfig.mode === 'CLONE') {
      this.paymentForm.controls.invoiceNumber.setValue(null);
    }
  }

  /**
   * @description This function is triggered when a payee is selected from the payee dropdown component and assigns payee details to the payment form
   * @param payee -The selected payee details from the payee dropdown.
   * @param fromTemplate - Boolean indication whether the method is invoked from template or not (since template has form control already set to payee, we don't have to set it again, which might trigger infinite loops along with ngModel change, which obviously is something we don't want 😶 ).
   */
  selectPayee(payee: IPayeeDropdown, fromTemplate: boolean) {
    if (this.proccessed) {
      this.proccessed = false;
      return;
    }
    this.proccessed = true;

    if (!payee || !payee?.id) {
      return;
    }
    this.payee = payee;
    this.selectedPayeeDetails = payee;
    if (payee) {
      if (fromTemplate === false) {
        this.paymentForm.controls.payee.setValue(payee);
      }
      if (payee.email) {
        this.paymentForm.controls.payeeEmail.setValue(payee?.email);
      } else {
        this.paymentForm.controls.payeeEmail.setValue(null);
      }
      this.paymentForm.controls.payeeIdNumber.setValue(
        payee?.payeeIdNumber ?? null
      );
      this.getPayeeDetails(payee?.id, true);
      this.payeeDetailsEvents.emit({
        payeeDropdownDetails: payee,
        isMoreDetailsLoading: true
      });
    }
  }

  /**
   * @description This function is called to clear the selected payee and associated details in the payment form.
   */
  clearPayee(): void {
    this.paymentForm.controls.payeeEmail.reset();
    this.paymentForm.controls.payee.reset();
    this.paymentForm.controls.payeeIdNumber.reset();
    this.payeeDetailsEvents.emit({
      payeeDropdownDetails: undefined,
      isMoreDetailsLoading: false
    });
  }

  removeTrailingSpacesInForm() {
    if (this.paymentForm.controls.memo.value) {
      this.paymentForm.controls.memo.setValue(
        this.paymentForm.controls.memo.value.trim()
      );
    }
    if (this.paymentForm.controls.invoiceNumber.value) {
      this.paymentForm.controls.invoiceNumber.setValue(
        this.paymentForm.controls.invoiceNumber.value.trim()
      );
    }
  }

  selectWallet(wallet: IWalletData) {
    this.paymentForm.controls.wallet.setValue(wallet);
  }

  clearWallet() {
    this.paymentForm.controls.wallet.reset();
  }

  /**
   * @description  Submits the payment based on the provided payment processing context.
   * @param paymentProcessingContext -The payment processing context determines the action to be taken.
   *
   */
  submitPayment(
    paymentProcessingContext: TPaymentProcessingContext
  ) {
    this.paymentProcessingContext = paymentProcessingContext;
    if(this.paymentsService.checkForComplianceFreeze()){
      this.paymentsService.openComplianceFreezeModal();
      return;
    }
    this.removeTrailingSpacesInForm();
    if (this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      if (this.hasInvalidFields()) {
        return;
      }
    }

    switch (paymentProcessingContext) {
      case 'pay':
        this.savePayment(true);
        break;
      case 'updateAndPay':
        this.updatePayment(true);
        break;
      case 'save':
        this.savePayment(false);
        break;
      case 'update':
        this.updatePayment(false);
        break;
      default:
        break;
    }
  }

  hasValidAddress() {
    const keys = ['address1', 'city', 'state', 'country', 'zip'] as const;

    const form = this.paymentForm.controls;

    let flag = false;

    keys.forEach((key) => {
      if (form[key] && form[key].status === 'INVALID') {
        flag = true;
      }
    });

    if (flag) {
      this.subscriptions.push(
        this.alertService
          .warningAlert({
            content: `Address details are missing for the selected payee.`,
            cancelMsg: 'Cancel',
            doneMsg: 'Update Address',
            isCancel: true,
            isOk: true
          })
          .beforeClosed()
          .subscribe((response?: boolean) => {
            if (response) {
              this.payeeService.openPayeeEditModal.next({ page: 'addAddress' });
              this.payeeService.openPayeeEditModal.next(false);
            }
          })
      );
    }
  }

  /**
   * Method to check all fields are valid
   */
  hasInvalidFields() {
    const keys = [
      'wallet',
      'payee',
      'amount',
      'invoiceNumber',
      'payeeEmail',
      'memo',
      'payeeIdNumber'
    ] as const;

    const form = this.paymentForm.controls;

    let flag = false;

    keys.forEach((key) => {
      if (form[key] && form[key].status === 'INVALID') {
        flag = true;
      }
    });
    return flag;
  }

  /**
   *
   *@description Creates and returns the form body
   * This function retrieves the necessary values from the payment form and formats them into the desired structure.
   * @returns -The save payment body
   */
  createSavePaymentBody(): IUpdatePaymentBody {
    const paymentFormBody = this.paymentForm.value;

    return {
      transferType: 'check',
      amount: Number(paymentFormBody.amount),
      category: paymentFormBody.category?.id,
      description: paymentFormBody.memo ?? '',
      payee: paymentFormBody.payee?.id,
      paymentDueDate: this.dateToday ?? undefined,
      referenceNo: paymentFormBody.invoiceNumber ?? undefined,
      sourceId: paymentFormBody.wallet?.uuId,
      sourceType: 'wallet',
      items: this.insertFromRemittance
        ? this.paymentsService.remittanceData?.remitance
        : [],
      remittanceType: this.paymentsService.remittanceData?.remittanceType,
      attachmentIds: this.createdExistingAttachments.map(
        (attachment) => attachment.encrypted_id
      ),
      commentIds: this.createdExistingComments.map(
        (comment) => comment.encrypted_id
      ),
      payeeIdNumber: paymentFormBody.payeeIdNumber ?? undefined,
      payeeEmail: paymentFormBody.payeeEmail as string,
      paymentMethod: 'check_email',
      bills: this.billService.billId() ?? []
    };
  }

  /**
   * @description Saves the payment information without initiating the payment.
   */
  savePayment(fromPay: boolean) {
    if (this.isUserUnverified()) {
      this.goToVerify();
      return;
    }

    const sendingData = this.createSavePaymentBody();
    const proceedToSavePayment = (): void => {
      this.loading = true;
      this.paymentsService.isPaymentProcessingSubject.next(true);
      if(fromPay && this.paymentConfig.mode === 'EDIT'){
        this.completeTransactionUsingZilPaymentApi();
      } else {
        this.subscriptions.push(
          this.paymentsService.savePayment(sendingData).subscribe({
            next: (res) => {
              this.loading = false;
              this.paymentsService.isPaymentProcessingSubject.next(false);
              if (res.success) {
                if (!fromPay) {
                  this.success.emit({
                    title: 'Your Payment is Saved',
                    content:
                      'Your payment has been saved. Please check the status in your records.'
                  });
                } else {
                  this.savedPaymentId = res.data.id;
                  this.completeTransactionUsingZilPaymentApi();
                }
              }
            },
            error: (err) => {
              this.loading = false;
              this.paymentsService.isPaymentProcessingSubject.next(false);
              if (err?.error?.errorCode === 441) {
                if (environment.isV4Persona) {
                  this.personaHelperService
                    .openModal('kyc', CVSourceType.other, true)
                    .subscribe((res) => {
                      if (res?.data?.inquiry_id) {
                        this.savePayment(fromPay);
                      }
                    });
                } else {
                  this.router.navigateByUrl(
                    '/manage/users/verify-user-id?type=8'
                  );
                }
              }
            }
          })
        );
      }
    };

    if (fromPay) {
      const dialogRef = this.paymentsService.openPaymentConfirmationModal({
        accNumber:
          this.paymentConfig?.paymentFormValue?.wallet.bankAccountNumber,
        bankName: this.paymentConfig?.paymentFormValue?.wallet.walletName,
        payeeName: this.selectedPayeeDetails.name,
        paymentMethod: 'E-Check',
        amount: Number(sendingData.amount).toFixed(2),
        type: 'wallet'
      });
      dialogRef.afterClosed().subscribe((res) => {
        if (res) {
          proceedToSavePayment();
        }
      });
    } else {
      proceedToSavePayment();
    }
  }

  /**
   * @description Updates the payment information.
   * @param payAfterUpdate -Flag indicating whether to initiate the payment after updating.
   */
  updatePayment(payAfterUpdate: boolean) {
    if (this.paymentConfig.paymentDetails?.id) {
      const sendingData = this.createSavePaymentBody();
      this.loading = true;
      this.paymentsService.isPaymentProcessingSubject.next(true);
      this.paymentsService
        .updatePayment(this.paymentConfig.paymentDetails?.id, sendingData)
        .subscribe(
          (res) => {
            this.loading = false;
            this.paymentsService.isPaymentProcessingSubject.next(false);
            if (res.success) {
              if (payAfterUpdate) {
                const dialogRef =
                  this.paymentsService.openPaymentConfirmationModal({
                    accNumber:
                      this.paymentConfig?.paymentFormValue?.wallet
                        .bankAccountNumber,
                    bankName:
                      this.paymentConfig?.paymentFormValue?.wallet.walletName,
                    payeeName: this.selectedPayeeDetails.name,
                    paymentMethod: 'E-Check',
                    amount: Number(sendingData.amount).toFixed(2),
                    type: 'wallet'
                  });
                dialogRef.afterClosed().subscribe((resp) => {
                  if (resp) {
                    this.completeTransactionUsingZilPaymentApi();
                  }
                });
              } else {
                this.success.emit({
                  title: 'Your Payment has been Updated',
                  content:
                    'Your payment has been Updated. Please check the status in your records.'
                });
              }
            }
          },
          () => {
            this.loading = false;
            this.paymentsService.isPaymentProcessingSubject.next(false);
          }
        );
    }
  }

  /**
   * @description Completes the transaction using the Zil Payment API.
   */
  completeTransactionUsingZilPaymentApi() {
    if (this.paymentConfig.paymentDetails?.id || this.savedPaymentId) {
      const id =
        this.paymentConfig.paymentDetails?.id ??
        (this.savedPaymentId as string);
      const sendingData: { payee_email: string | undefined; bills: string[] } =
        {
          payee_email: this.paymentForm.value.payeeEmail ?? undefined,
          bills: []
        };
      sendingData.bills = this.billService.billId() ?? [];
      this.loading = true;
      this.paymentsService.isPaymentProcessingSubject.next(true);
      this.subscriptions.push(
        this.paymentsService
          .processPayment(id, sendingData)
          .pipe(
            finalize(() => {
              this.loading = false;
            })
          )
          .subscribe({
            next: (res) => {
              if (res.success) {
                this.success.emit(true);
                this.billService.billId.set(undefined);                
              }else{
                this.success.emit({
                  title: 'Your Payment is Saved',
                  content:
                    'Your payment has been saved. Please check the status in your records.'
                });
              }
              this.paymentsService.isPaymentProcessingSubject.next(false);
            },
            error: (err) => {
              this.loading = false;
              this.paymentsService.isPaymentProcessingSubject.next(false);
              if (
                !err.error.errorCode ||
                (err.error.errorCode !== 214 &&
                  err.error.errorCode !== 217 &&
                  err.error.errorCode !== 202)
              ) {
                this.alertService.warningAlert({
                  content: err.error?.errorMsg
                });
              }
            }
          })
      );
    }
  }

  getCheckEmail(checkId: string) {
    this.subscriptions.push(
      this.checkService
        .getEmails({ ids: [checkId] })
        .subscribe((data) => {
          if (data?.success) {
            const emailRows = data.data;
            const dialogRef = this.dialog.open(CheckEmailModalComponent, {
              maxWidth: '93%',
              width: '1232px',
              disableClose: true,
              data: {
                serverData: emailRows,
                paymentMethod: 'wallet_check_email'
              },
              panelClass: 'modal-overflow-visible'
            });
            dialogRef.afterClosed().subscribe((result) => {
              if (result) {
                this.success.emit(true);
                this.billService.billId.set(undefined);
              }else{
                this.success.emit({
                  title: 'Your Payment is Saved',
                  content:
                    'Your payment has been saved. Please check the status in your records.'
                });
              }
              this.paymentsService.isPaymentProcessingSubject.next(false);
            });
          }
        })
    );
  }

  openWarningAlert(content: string, doneMsg = 'OK') {
    return this.alertService.warningAlert({ content, doneMsg });
  }

  /**
   * @description  Makes a payment using the selected payee details and payment form data.
   * complete the payment using the psb service.
   */
  makePayment(): void {
    this.paymentForm.markAllAsTouched();
    if (this.paymentForm.invalid) return;

    const formData = this.paymentForm.value;
    const body = {
      type: 'wallet',
      walletId: formData.wallet?.uuId,
      amount: formData.amount,
      payees: [
        {
          id: formData.payee?.id,
          amount: formData.amount,
          email: formData.payeeEmail,
          memo: formData.memo,
          invoiceNumber: formData.invoiceNumber,
          bankAccount: '',
          payeeIdNumber: formData.payeeIdNumber
        }
      ],
      mode: '8'
    };

    this.loading = true;
    this.paymentsService.isPaymentProcessingSubject.next(true);
    this.subscriptions.push(
      this.psbService
        .completeTransaction(body)
        .pipe(
          finalize(() => {
            this.loading = false;
            this.paymentsService.isPaymentProcessingSubject.next(false);
          })
        )
        .subscribe({
          next: () => {
            this.onPaymentSuccess();
          },
          error: (err) => {
            this.onPaymentError(err?.error?.errorCode, err?.error?.errorMsg);
          }
        })
    );
  }

  onPaymentSuccess() {
    this.success.emit({
      title: 'Payment Success',
      content:
        'Your payment is initiated, Please check the status in your records'
    });
  }

  onPaymentError(errorCode: number, errorMsg: string): void {
    if (errorCode === 351 || errorCode === 101) {
      const action = this.alertService.warningAlert({ content: errorMsg });
      action.afterClosed().subscribe({
        next: (res) => {
          if (res) {
            this.router.navigate(['manage/common-verification'], {
              queryParams: { type: CVSourceType.other }
            });
          }
        }
      });
    }
  }

  catagoryDropDownChange(event: ICategoryDropdown): void {
    if (event === undefined) {
      this.paymentForm.controls.category.setValue(null);
    } else {
      this.paymentForm.controls.category.setValue(event);
    }
  }

  openCategoryModal(): void {
    const dialogRef = this.matDialog.open(CategoryAddModalComponent, {
      maxWidth: '500px',
      width: '93%'
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res?.success) {
        this.sharedService.setNewCategoryCreatedData({ categoryId: res.id });
        this.paymentForm.controls.category.setValue(res);
      }
    });
  }

  /** Gettting payee Details
   * - Being Called when payee selected and setting necessary payee address details to the payment form
   * @param payeeId -Id of selected payee
   */
  getPayeeDetails(payeeId: string, fromApi?: boolean): void {
    this.payeeAddressLoading = true;
    this.subscriptions.push(
      this.paymentsService
        .getPayeeDetails(payeeId, fromApi)
        .pipe(
          finalize(() => {
            this.payeeAddressLoading = false;
          }),
          delay(100)
        )
        .subscribe((res) => {
          this.payeeDetails = res;
          this.checkPayee(this.payeeDetails?.payee_information);
          if (this.payeeDetails) {
            this.paymentForm.controls.address1.setValue(
              this.payeeDetails?.payee_information?.payee_address_line_1
            );
            this.paymentForm.controls.address2.setValue(
              this.payeeDetails?.payee_information?.payee_address_line_2
            );
            this.paymentForm.controls.city.setValue(
              this.payeeDetails?.payee_information?.payee_city
            );
            this.paymentForm.controls.state.setValue(
              this.payeeDetails?.payee_information?.payee_state
            );
            this.paymentForm.controls.country.setValue(
              this.payeeDetails?.payee_information?.payee_country
            );
            this.paymentForm.controls.zip.setValue(
              this.payeeDetails?.payee_information?.payee_zip
            );
            this.paymentForm.controls.payeePhone.setValue(
              this.payeeDetails?.payee_information?.payee_phone
            );
            if (this.changedInfo?.selectedPayeeDetails?.id) {
              this.payeeDetailsEvents.emit({
                payeeDropdownDetails: this.changedInfo?.selectedPayeeDetails,
                isMoreDetailsLoading: false
              });
            } else {
              this.payeeDetailsEvents.emit({
                payeeDropdownDetails: this.selectedPayeeDetails,
                isMoreDetailsLoading: false
              });
            }
            this.paymentForm.controls.payeeIdNumber.setValue(
              this.payeeDetails?.payee_information.payee_id_number ?? null
            );
            this.paymentForm.controls.payeeEmail.setValue(
              res.payee_information.payee_email
            );
          }
        })
    );
  }

  /** Checking payee Address when selecting a payee
   * - So we can know if payee address is valid or not
   * @param payeeData -contains details of payee
   */
  checkPayee(payeeData: IPayeeViewInfo): void {
    if (
      !payeeData?.payee_address_line_1 ||
      !payeeData?.payee_city ||
      !payeeData?.payee_country ||
      !payeeData?.payee_state ||
      !payeeData?.payee_zip
    ) {
      this.isEditPayee = true;
    } else {
      this.isEditPayee = false;
    }
  }

  /**
   * @description Opens the dialog to edit a payee's details.
   * Updates the payment form and selected payee details with the edited information.
   * @param payeeId -The ID of the payee to be edited
   */
  onPayeeEdit(payeeId: string): void {
    this.subscriptions.push(
      this.payeeModalService
        .openEditPayee(payeeId, '', { edit: true, id: payeeId })
        .subscribe((payeeModal) => {
          if (payeeModal) {
            this.subscriptions.push(
              payeeModal.afterClosed().subscribe((result) => {
                if (result?.success) {
                  this.paymentForm.controls.payeeEmail.setValue(result?.email);
                  this.payee.email = result?.email;
                  this.getPayeeDetails(this.payee?.encryptedId || '');
                  this.payeeDetailsEvents.emit({
                    payeeDropdownDetails: result,
                    isMoreDetailsLoading: false
                  });
                }
              })
            );
          }
        })
    );
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
      this.subscriptions.push(
        this.paymentsService
          .openAddAttachment(this.createdExistingAttachments, this.encId, true)
          .subscribe((attachments: IAttachmentItem[]) => {
            this.createdExistingAttachments = attachments;
            this.attachmentCount = attachments.length;
          })
      );
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
      this.subscriptions.push(
        this.paymentsService
          .openAddComment(this.createdExistingComments, this.encId)
          .subscribe((comments: IComments[]) => {
            this.createdExistingComments = comments;
            this.commentsCount = comments.length;
          })
      );
    }
  }

  /**
   * @description Open modal for adding remittance and gives the added data when its closed
   */
  openAddRemitance() {
    const amount = Number(this.paymentForm.controls.amount.value);
    const remitanceData = {
      ...this.paymentsService.createRemitanceData(
        amount,
        this.insertFromRemittance || this.hasRemittance,
        this.paymentConfig.mode === 'EDIT'
      ),
      // check-mail keeps a fixed format and hides the format switch
      format: true,
      hideSwitchFormat: true
    };
    this.subscriptions.push(
      this.paymentsService
        .openAddRemitanceModal(remitanceData)
        .subscribe((res) => {
          if (res) {
            this.paymentsService.getRemitanceValue(res, this.paymentForm);
          } else {
            this.resetRemittanceData();
          }
          const allRemittances = res.data;
          this.hasRemittance = false;
          const formatedRemittances =
            this.paymentsService.checkRemittanceCount(allRemittances);
          this.hasRemittance = !!formatedRemittances.hasRemittance && res.insert;
          this.insertFromRemittance = this.hasRemittance;
          if (allRemittances && this.paymentsService.remittanceData) {
            this.paymentsService.remittanceData.remitance =
              formatedRemittances.remittanceList;
            this.paymentsService.updateRemittanceData(
              formatedRemittances.remittanceList,
              this.hasRemittance,
              this.paymentConfig.mode,
              this.encId,
              res.remittanceType
            );
          }
        })
    );
  }

  /**
   * @description -Resets remittance-related data to its initial state.
   */
  resetRemittanceData() {
    this.newRemittanceFormat = true;
    this.remitanceTotal = 0.0;
  }

  newPayeeAdd(event: IPayeeDropdown) {
    this.selectPayee(event, false);
  }

  /**
   * @description -Retrieves and sets the counts of attachments and comments.
   */
  getCount() {
    if (this.paymentConfig.paymentDetails?.zilpaymentId) {
      this.encId = this.paymentConfig.paymentDetails?.zilpaymentId;
      this.subscriptions.push(
        this.sharedService
          .getAttachment('zil-payments', this.encId)
          .subscribe((res) => {
            this.attachmentCount = res.data.length;
          })
      );
      this.subscriptions.push(
        this.sharedService
          .getZilPaymentsComments(this.encId)
          .subscribe((res) => {
            this.commentsCount = res.data.length;
          })
      );
      this.subscriptions.push(
        this.sharedService
          .getZilPaymentsRemitance(this.encId)
          .subscribe((res) => {
            this.paymentsService.remittanceData = {
              remitance: res.data?.items_by_array ?? [],
              remittanceType: res.data?.type
            };
            this.hasRemittance = !!res.data?.items_by_array;
          })
      );
    }
  }

  isUserUnverified(): boolean {
    const gettingStartedData =
      this.localStorageService.getItem('gettingStartedData');
    return gettingStartedData?.verification === 0;
  }

  goToVerify() {
    this.router.navigate(['/manage/users/verify-email-phone'], {
      queryParams: {
        returnUrl: '/manage/payments/main/pay/wallet/check_mail'
      }
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((el) => el.unsubscribe());
    this.paymentsService.remittanceData = undefined;
    this.paymentsService.hasAmount.update(() => false);
  }
}

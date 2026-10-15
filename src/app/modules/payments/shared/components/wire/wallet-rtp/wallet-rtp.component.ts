import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
  inject,
  input,
  signal
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { debounceTime, finalize } from 'rxjs/operators';
import { Utils } from 'src/app/data/utils';
import {
  IPaymentBody,
  IPaymentConfig,
  IUpdatePaymentBody
} from 'src/app/modules/payments/model/payments';
import {
  IPayeeBankDetails,
  IPayeeDetailsEvent,
  IPayeeDropdown,
  IPayeeEditedData,
  IPayeeView,
  IPayeeViewBank
} from 'src/app/modules/payee/payee-v2/model/payee';
import { IWalletData } from 'src/app/models/wallet';
import { DropDownPayeeBankComponent } from 'src/app/shared/components/drop-downs/drop-down-payee-bank/drop-down-payee-bank.component';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { PsbService } from 'src/app/shared/service/psb/psb.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { CategoryAddModalComponent } from 'src/app/shared/modal/category-modal/category-add-modal/category-add-modal.component';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { IAttachmentItem, IV3DropDownOnReady } from 'src/app/models/common';
import { IComments } from 'src/app/data/data/cloud-quick-pay';
import { IRemittanceDetails } from 'src/app/models/bank';
import { BillService } from 'src/app/shared/service/Bill/bill.service';
import { ActivatedRoute } from '@angular/router';
import { MatBadge } from '@angular/material/badge';
import { MatTooltip } from '@angular/material/tooltip';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { NgClass } from '@angular/common';
import { faClockRotateLeft } from '@fortawesome/pro-regular-svg-icons';
import { PayeeDataV35Service } from 'src/app/modules/payee/payee-v3/v35-services/payee-data-v35.service';
import { BankModalService } from 'src/app/shared/bank-modal/service/bank-modal.service';
// import { IndustryTypesDropdownComponent } from 'src/app/shared/components/v3/drop-downs/industry-types-dropdown/industry-types-dropdown.component';
import { faCircleExclamation, faCircleQuestion } from '@fortawesome/pro-solid-svg-icons';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { CommonButtonV35Component } from '../../../../../../shared/v3/buttons/common-button-v35/common-button-v35.component';
import { CategoryDropdownV3Component } from '../../../../../../shared/components/v3/drop-downs/category-dropdown-v3/category-dropdown-v3.component';
import { DropDownPayeeBankComponent as DropDownPayeeBankComponent_1 } from '../../../../../../shared/components/drop-downs/drop-down-payee-bank/drop-down-payee-bank.component';
import { PayeeDropdownV3Component } from '../../../../../../shared/components/v3/drop-downs/payee-dropdown-v3/payee-dropdown-v3.component';
import { WalletDropdownV3Component } from '../../../../../../shared/components/v3/drop-downs/wallet-dropdown-v3/wallet-dropdown-v3.component';
import { V35ControlMessageComponent } from '../../../../../../shared/v3/control-message-v35/control-message-v35.component';
import { AmountInputComponent } from '../../../../../../shared/components/amount-input/amount-input.component';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { CheckAddAttachmentCommonModalComponent } from 'src/app/modules/check/modal/check-activity-modals/check-add-attachment-common-modal/check-add-attachment-common-modal.component';
import { AddCommentsModalComponent } from 'src/app/shared/modal/comments-modal/add-comments-modal/add-comments-modal.component';

/**
 * @description This component handles the card to wire payment functionality.
 */
@Component({
  selector: 'app-wallet-rtp',
  templateUrl: './wallet-rtp.component.html',
  styleUrls: ['./wallet-rtp.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    AmountInputComponent,
    NgClass,
    V35ControlMessageComponent,
    WalletDropdownV3Component,
    FaIconComponent,
    PayeeDropdownV3Component,
    DropDownPayeeBankComponent_1,
    CategoryDropdownV3Component,
    MatTooltip,
    MatBadge,
    CommonButtonV35Component,
    // IndustryTypesDropdownComponent
  ]
})
export class WalletRtpComponent implements OnInit, OnDestroy, OnChanges {
  private psbService = inject(PsbService);
  private payeeService = inject(PayeeService);
  private dialog = inject(MatDialog);
  private alertService = inject(AlertService);
  private paymentsService = inject(PaymentsService);
  private sharedService = inject(SharedService);
  private billService = inject(BillService);
  private activatedRoute = inject(ActivatedRoute);
  payeeDataService = inject(PayeeDataV35Service);
  private bankModalService = inject(BankModalService);
  private validationService = inject(ValidationService);
  private checkService = inject(CheckService);
  private localStorageService = inject(LocalStorageService);

  @Output() payeeDetailsEvents = new EventEmitter<IPayeeDetailsEvent | false>();
  @Output() success = new EventEmitter<
    boolean | { title?: string; content?: string }
  >();

  @Output() calculateFee = new EventEmitter();
  @Output() openPersona = new EventEmitter<boolean>(false);
  @Output() verifyEmail = new EventEmitter<boolean>(false);
  @Input() changedInfo: IPayeeEditedData | undefined;

  userVerified = input<boolean>(false);
  kycStatus = input<number | undefined>(undefined);

  rtpForm: FormGroup;
  loading: boolean;
  subscriptions: Subscription[] = [];
  payeeDetails: IPayeeView | undefined;
  utils = Utils;
  isRtpInfoAdded = true;
  payeeBankDataList: IPayeeBankDetails[] = [];
  defaultCDPayeeBank: IPayeeViewBank;
  @Input() paymentConfig: IPaymentConfig;
  selectedPayeeDetails: IPayeeDropdown;
  selectedPayeeBank: string | undefined;
  attachmentCount: number;
  createdExistingAttachments: IAttachmentItem[] = [];
  createdExistingComments: IComments[] = [];
  commentsCount: number;
  // Bill-related properties
  bills: string[] = [];
  isBillCheck: boolean = false;
  thirdPartyProviderType: number;
  remitances: IRemittanceDetails[] | undefined;
  remitanceTotal: number;
  newRemittanceFormat: boolean;
  insertFromRemittance = false;
  encId: string;
  remittanceGrandTotal: number;
  remittanceType: number;
  editBankName: string | undefined;
  isRtpAllowed = signal(true);
  isRtpChecking = signal(false);
  selectedpayeeId: string;

  @ViewChild('payeeBankDropDown')
  payeeBankDropDownComponent: DropDownPayeeBankComponent;

  apiNo: number;
  hasRemitance: boolean;
  amountInputDisabled = false;
  faHistory = faClockRotateLeft;
  faCircleExclamation = faCircleExclamation;
  faCircleQuestion=faCircleQuestion;
  categorySetWithIdFunction: ((id: string) => void) | undefined;
  categoryId = signal<string | undefined>(undefined);
  isFetchingPayeeDetails = signal(false);
  fetchingPayeeId = signal<string | undefined>(undefined);
  bankAlertShownForPayeeId = signal<string | undefined>(undefined);
  userPlugins = this.localStorageService.getItem('userPlugins');

  ngOnInit(): void {
    this.initForm();
    this.getCount();
    this.paymentsService.payeeDetails = undefined;
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
        this.payeeSelect(payee as IPayeeDropdown, false);
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
          this.rtpForm.controls.amount.setValue(
            res.data.totalAmount as string
          );
          let {memo} = res.data;
 
          if (!this.userPlugins?.includes('no-bill-payment-memo-default') && !memo) {
            memo = `Payment for Bill ${res.data.invoiceNumbers}`;
          }

          this.rtpForm.controls.memo.setValue(memo);
          this.rtpForm.controls.chequeInvoiceNumber.setValue(
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
          if (this.rtpForm) {
            this.rtpForm.patchValue({ ...paymentFormValue });
          }
        },0);
      }
    }
    
    if (changes?.changedInfo) {
      if (this.changedInfo?.selectedPayeeDetails?.id) {
        this.getPayeeDetails(this.changedInfo?.selectedPayeeDetails?.id);
        this.rtpForm.controls.payeeEmail.setValue(
          this.changedInfo?.selectedPayeeDetails?.email
        );
      }
    }
    if (this.changedInfo?.selectedPayeeBank) {
      this.selectPayeeAccount(
        this.changedInfo?.selectedPayeeBank?.encrypted_id
      );
    }

    if (changes.changedInfo.currentValue?.selectedPayeeBank) {
      const index = this.payeeDetails?.bank_accounts.findIndex(
        (element) =>
          element.encrypted_id ===
          this.changedInfo?.selectedPayeeBank?.encrypted_id
      );
      if (this.payeeDetails) {
        this.payeeDetails.bank_accounts[index as number] =
          changes.changedInfo.currentValue.selectedPayeeBank;
      }
      this.selectPayeeAccount(
        this.changedInfo?.selectedPayeeBank?.encrypted_id
      );
    }
  }

  /**
   * @description This function creates form controls for the payment form, sets up validators for each control, and subscribes to the changes in the "payee" control.
   */
  initForm() {
    this.rtpForm = new FormGroup({
      amount: new FormControl('', [Validators.required, Validators.min(0.01)]),
      payee: new FormControl(null, [Validators.required]),
      wallet: new FormControl(null, [Validators.required]),
      memo: new FormControl('', [
        Validators.required,
        Validators.pattern(/.*\S/)
      ]),
      payeeEmail: new FormControl('', [
        Validators.required,
        ValidationService.emailValidator,
        this.validationService.validateDifferentEmail()
      ]),
      category: new FormControl(null),
      payeeBankAc: new FormControl(null, [Validators.required]),
      invoiceNumber: new FormControl(''),
      payeeIdNumber: new FormControl('', [Validators.maxLength(30)]),
      // industryType: new FormControl(null, Validators.required)
      // Bill-related form controls
      commentIds: new FormControl([]),
      attachmentIds: new FormControl([]),
      chequeInvoiceNumber: new FormControl(null)
    });
    this.subscriptions.push(
      this.rtpForm.controls.payee.valueChanges.subscribe((payee) => {
        if (payee && payee?.id && this.selectedPayeeDetails?.id !== payee?.id) {
          this.selectedPayeeDetails = payee;
          this.getPayeeDetails(payee.id);
        }
      }),
      this.rtpForm.controls.amount.valueChanges
        .pipe(debounceTime(1500))
        .subscribe((val) => {
          const amount = Number(val);
          this.calculateFee.emit({
            amount,
            paymentSource: 'wallet',
            paymentMethod: 'rtp'
          });
        }),
      this.rtpForm.controls.amount.valueChanges.subscribe((val) => {
        this.paymentsService.hasAmount.update(() => Boolean(val));
      })
    );
    this.checkPayeeBankChanges();
    this.setCommonFormValues();
  }

  checkPayeeBankChanges() {
    this.subscriptions.push(
      this.rtpForm.controls.payeeBankAc.valueChanges.subscribe((val) => {
        if (val) {
          this.verifyRTPEligibility(val?.routing_number, val?.is_allow_wire);
        }
      })
    );
  }

  /**
   * @description This function sets up form value changes subscription and patches the form with initial values.
   */
  setCommonFormValues() {
    this.rtpForm.valueChanges.subscribe((formValueChanges) => {
      this.paymentConfig.paymentFormValue = formValueChanges;
    });
    if (this.paymentConfig.paymentFormValue) {
      this.rtpForm.patchValue({ ...this.paymentConfig.paymentFormValue });
    }
    if (this.paymentConfig.memo) {
      this.rtpForm.controls.memo.setValue(this.paymentConfig.memo);
    }

    if (this.paymentConfig.mode === 'CLONE') {
      this.rtpForm.controls.invoiceNumber.setValue(null);
    }
  }

  /**
   * @description This function is triggered when a payee is selected from the payee dropdown component and assigns payee details to the payment form
   * @param event -The selected payee details from the payee dropdown.
   * @param fromTemplate - Boolean indication whether the method is invoked from template or not (since template has form control already set to payee, we don't have to set it again, which might trigger infinite loops along with ngModel change, which obviously is something we don't want 😶 ).
   */
  payeeSelect(event: IPayeeDropdown, fromTemplate: boolean) {
    if (this.selectedpayeeId === event?.id) {
      return;
    }
    this.selectedpayeeId = event?.id;
    this.bankAlertShownForPayeeId.set(undefined);
    this.rtpForm.controls.payeeBankAc.setValue(null);
    this.rtpForm.controls.payeeEmail.reset();
    this.payeeBankDropDownComponent.clearSelection();
    this.isRtpInfoAdded = true;
    if (event?.id) {
      if (fromTemplate === false) {
        this.rtpForm.controls.payee.setValue(event);
      }
      this.rtpForm.controls.payeeIdNumber.setValue(event?.payeeIdNumber);
      this.payeeDetailsEvents.emit({
        payeeDropdownDetails: event,
        isMoreDetailsLoading: true
      });
      this.selectedPayeeDetails = event;
      if (event.email) {
        this.rtpForm.controls.payeeEmail.setValue(event?.email);
      } else {
        this.rtpForm.controls.payeeEmail.setValue(null);
      }
      // this.rtpForm.controls.industryType.setValue(event?.merchantCategory);
    }
  }

  /**
   * @description Populate the dropdown by fetching the data using the id
   * @param ev
   * @param id
   */
  populateOnEdit(ev: IV3DropDownOnReady, id: string) {
    if (ev.setItemWithId && id) {
      ev.setItemWithId(id);
    }
  }

  /**
   * @description selects a payee account based on provided encrypted id
   * @param item -the encrypted id of the selected payee account
   *
   */
  selectPayeeAccount(item: string | undefined) {
    this.isRtpAllowed.set(true);
    this.selectedPayeeBank = undefined;
    this.editBankName = undefined;
    if (!item) return;
    const bankAccount =
      this.payeeDetails?.bank_accounts.find(
        (account) => account.encrypted_id === item
      ) ?? null;
    this.rtpForm.controls.payeeBankAc.setValue(bankAccount);
    this.payeeDetailsEvents.emit({
      payeeDropdownDetails: this.selectedPayeeDetails,
      isMoreDetailsLoading: false,
      payeeBankDetails: bankAccount
    });
    this.getPayeeBankData(this.selectedPayeeDetails.id);
  }

  /**
   * @description This function is called to clear the selected payee and associated details in the payment form.
   */
  clearPayeeSelect() {
    this.rtpForm.controls.payee.reset();
    this.rtpForm.controls.payeeEmail.reset();
    this.rtpForm.controls.payeeBankAc.reset();
    this.rtpForm.controls.payeeIdNumber.reset();
    this.fetchingPayeeId.set(undefined);
    this.isFetchingPayeeDetails.set(false);
    this.bankAlertShownForPayeeId.set(undefined);
    this.payeeBankDataList = [];
    this.isRtpInfoAdded = true;
    this.payeeDetailsEvents.emit({
      payeeDropdownDetails: undefined,
      isMoreDetailsLoading: false
    });
    // this.rtpForm.controls.industryType.setValue(null);
  }

  /**
   * @description Clears the selected payee account.
   * Resets the value of the payeeBankAc control in the paymentForm.
   */
  clearPayeeAccount() {
    this.rtpForm.controls.payeeBankAc.setValue(null);
    this.isRtpInfoAdded = true;
    this.payeeDetailsEvents.emit({
      payeeDropdownDetails: this.selectedPayeeDetails,
      isMoreDetailsLoading: false
    });
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
            if (res.data) {
              this.paymentsService.remittanceData = {
                remitance: res.data.items_by_array,
                remittanceType: res.data.type
              };
              this.hasRemitance = !!res.data.items_by_array;
            }
          })
      );
    }
  }

  walletSelect(event: IWalletData) {
    this.rtpForm.controls.wallet.setValue(event);
  }

  clearWallet() {
    this.rtpForm.controls.wallet.reset();
  }

  selectCategory(event: { id: string }) {
    this.rtpForm.controls.category.setValue(event);
  }

  /**
   * @description This function is used to fetch additional details of the selected payee based on the provided payee ID.
   * @param payeeId -The ID of the selected payee.
   */
  getPayeeDetails(payeeId: string) {
    if (this.isFetchingPayeeDetails() && this.fetchingPayeeId() === payeeId) {
      return;
    }
    this.isFetchingPayeeDetails.set(true);
    this.fetchingPayeeId.set(payeeId);
    this.payeeDetails = undefined;
    this.subscriptions.push(
      this.paymentsService
        .getPayeeDetails(payeeId, true)
        .pipe(debounceTime(100),
          finalize(() => {
            this.isFetchingPayeeDetails.set(false);
            this.fetchingPayeeId.set(undefined);
          })
        )
        .subscribe(
          (res) => {
            this.payeeDetails = res;
            this.getPayeeCategory(payeeId);
            if (this.payeeDetails) {
              if (res.bank_accounts.length === 0) {
                this.isRtpInfoAdded = true;
                this.rtpForm.controls.payeeBankAc.reset();
                this.payeeDetailsEvents.emit({
                  payeeDropdownDetails: this.selectedPayeeDetails,
                  isMoreDetailsLoading: false
                });
                if (res.payee_information.entity_type && !this.bankAlertShownForPayeeId()) {
                  this.bankAlertShownForPayeeId.set(payeeId);
                  const alert = this.alertService.warningAlert({
                    content:
                      'No bank accounts available for the selected payee',
                    doneMsg: 'Add Now',
                    isCancel: true,
                    cancelMsg: 'Cancel'
                  });
                  alert.afterClosed().subscribe((result) => {
                    if (result) {
                      this.addPayeeBankAc();
                    }
                  });
                }
              } else {
                this.bankAlertShownForPayeeId.set(undefined);
                const defaultBankAcIndex =
                  this.payeeDetails.bank_accounts?.findIndex(
                    (el) => el.is_default_for_direct_deposit
                  );
                if (this.paymentConfig?.paymentFormValue?.payeeBankAccount) {
                  this.onShowPayeeBank();
                } else if (defaultBankAcIndex > -1) {
                  this.rtpForm.controls.payeeBankAc.setValue(
                    this.payeeDetails?.bank_accounts[defaultBankAcIndex] ?? null
                  );
                  if (this.payeeDetails)
                    this.defaultCDPayeeBank =
                      this.payeeDetails.bank_accounts[defaultBankAcIndex];
                  const bankName = this.defaultCDPayeeBank?.bank_name ?? '';
                  const accountNumber =
                    this.defaultCDPayeeBank?.account_number ?? '';
                  this.selectedPayeeBank = `${bankName} - ${this.utils.getMaskedAcNo(
                    String(accountNumber)
                  )}`;
                }
                if (this.changedInfo?.selectedPayeeDetails?.id) {
                  this.payeeDetailsEvents.emit({
                    payeeDropdownDetails:
                      this.changedInfo?.selectedPayeeDetails,
                    isMoreDetailsLoading: false,
                    payeeBankDetails: this.rtpForm.controls.payeeBankAc.value
                  });
                } else {
                  this.payeeDetailsEvents.emit({
                    payeeDropdownDetails: this.selectedPayeeDetails,
                    isMoreDetailsLoading: false,
                    payeeBankDetails: this.rtpForm.controls.payeeBankAc.value
                  });
                }
              }
              this.rtpForm.controls.payeeIdNumber.setValue(
                this.payeeDetails?.payee_information.payee_id_number
              );
              this.rtpForm.controls.payeeEmail.setValue(
                res.payee_information.payee_email
              );
              // this.rtpForm.controls.industryType.setValue(
              //   res.payee_information.merchant_category
              // );
            }
          },
          () => {
            this.payeeDetailsEvents.emit({
              payeeDropdownDetails: this.rtpForm.controls.payee.value!,
              isMoreDetailsLoading: false
            });
          }
        ),
      this.payeeService.getPayeeBankData(payeeId).subscribe((res) => {
        if (res.success) {
          this.payeeBankDataList = res.data;
        }
      })
    );
  }

  verifyRTPEligibility(routingNumber: string, moreDetailsNeeded: number) {
    this.isRtpChecking.set(true);
    this.subscriptions.push(
      this.paymentsService
        .rtpStatusCheck(routingNumber)
        .pipe(finalize(() => this.isRtpChecking.set(false)))
        .subscribe((res) => {
          if (res.success) {
            this.isRtpAllowed.set(res.data.is_rtp_allowed);
            if (res.data?.is_rtp_allowed) {
              this.isRtpInfoAdded = !!(moreDetailsNeeded === 1);
            }
          }
        })
    );
  }

  /**
   * @description Function triggered when click pay button in payment table.
   * Used to populate selected payee bank instead of default bank account.
   */
  onShowPayeeBank(acc?: string) {
    if (this.payeeDetails) {
      if (acc) {
        const bank = this.payeeDetails.bank_accounts.filter(
          (item) => item.encrypted_id === acc
        );
        this.rtpForm.controls.payeeBankAc.setValue(bank[0] ?? null);
        const bankName = bank[0]?.bank_name ?? '';
        const accountNumber = bank[0]?.account_number ?? '';
        this.editBankName = `${bankName} - ${this.utils.getMaskedAcNo(
          accountNumber
        )}`;
      } else {
        const bank = this.payeeDetails.bank_accounts.filter(
          (item) =>
            item.encrypted_id ===
            this.paymentConfig?.paymentFormValue?.payeeBankAccount
        );
        this.rtpForm.controls.payeeBankAc.setValue(bank[0] ?? null);
        const bankName = bank[0]?.bank_name ?? '';
        const accountNumber = bank[0]?.account_number ?? '';
        this.editBankName = `${bankName} - ${this.utils.getMaskedAcNo(
          String(accountNumber)
        )}`;
      }
    }
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
          .openAddAttachment(this.createdExistingAttachments, this.encId)
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
    const amount = Number(this.rtpForm.controls.amount.value);
    const remitanceData = this.paymentsService.createRemitanceData(
      amount,
      this.insertFromRemittance || this.hasRemitance
    );
    this.subscriptions.push(
      this.paymentsService
        .openAddRemitanceModal(remitanceData)
        .subscribe((res) => {
          if (res) {
            this.paymentsService.getRemitanceValue(res, this.rtpForm);
          } else {
            this.resetRemittanceData();
          }
          const allRemittances = res.data;
          this.hasRemitance = false;
          const formatedRemittances =
            this.paymentsService.checkRemittanceCount(allRemittances);
          this.hasRemitance = !!formatedRemittances.hasRemittance && res.insert;
          this.insertFromRemittance = this.hasRemitance;
          if (allRemittances && this.paymentsService.remittanceData) {
            this.paymentsService.remittanceData.remitance =
              formatedRemittances.remittanceList;
            this.paymentsService.updateRemittanceData(
              formatedRemittances.remittanceList,
              this.hasRemitance,
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

  /**
   * @description Completes the transaction based on the specified action
   * Validates the payment form and checks if it's valid.
   * @param action -The action to perform for the transaction (1: Complete, 2: Save, 3: Update)
   */
  completeTransaction(action: number) {
    this.apiNo = action;
    this.removeTrailingSpacesInForm();
    if (this.rtpForm.invalid || !this.isRtpAllowed()) {
      this.rtpForm.markAllAsTouched();
      return;
    }
    if (!this.validateUserStatus()) {
      return;
    }

    const rtpFormBody = this.rtpForm.value;
    const commentIds: string[] = [];
    const attachmentIds: string[] = [];
    this.createdExistingComments.map((el) => commentIds.push(el.encrypted_id));
    this.createdExistingAttachments.forEach((el) => {
      if (el.encrypted_id !== undefined) {
        attachmentIds.push(el.encrypted_id);
      }
    });
    const enableWireBody = rtpFormBody.payeeBankAc;
    enableWireBody.id = enableWireBody.encrypted_id;
    const body: IPaymentBody = {
      type: 'wallet',
      walletId: rtpFormBody.wallet?.uuId,
      amount: rtpFormBody.amount,
      payees: [
        {
          id: rtpFormBody.payee?.id,
          amount: rtpFormBody.amount,
          email: rtpFormBody.payeeEmail,
          memo: rtpFormBody.memo,
          bankAccount: rtpFormBody.payeeBankAc?.encrypted_id,
          invoiceNumber: rtpFormBody.invoiceNumber
        }
      ],
      mode: '12',
      commentIds,
      attachmentIds,
      items: this.insertFromRemittance ? this.paymentsService.remittanceData?.remitance : [],
      remittanceType: this.paymentsService.remittanceData?.remittanceType
    };
    const saveTransactionBody: IUpdatePaymentBody = {
      amount: Number(rtpFormBody.amount),
      paymentDueDate: '2023-08-12',
      payee: rtpFormBody.payee?.id,
      payeeBankAccount: rtpFormBody.payeeBankAc?.encrypted_id,
      category: rtpFormBody.category?.id,
      description: rtpFormBody.memo,
      sourceType: 'wallet',
      sourceId: rtpFormBody.wallet?.uuId,
      transferType: 'RTP',
      commentIds,
      attachmentIds,
      items: this.insertFromRemittance ? this.paymentsService.remittanceData?.remitance : [],
      remittanceType: this.paymentsService.remittanceData?.remittanceType,
      referenceNo: rtpFormBody.invoiceNumber,
      payeeIdNumber: rtpFormBody.payeeIdNumber,
      payeeEmail: rtpFormBody.payeeEmail,
      bills: this.billService.billId() ?? []
    };
    const paymentId = this.paymentConfig.id ? this.paymentConfig.id : '';
    if (action === 1 && (!paymentId || this.paymentConfig?.mode === 'CLONE')) {
      const dialogRef = this.paymentsService.openPaymentConfirmationModal({
        accNumber:
        this.paymentConfig?.paymentFormValue?.wallet.bankAccountNumber,
      bankName: this.paymentConfig?.paymentFormValue?.wallet.walletName,
      payeeName: this.selectedPayeeDetails.name,
      paymentMethod: 'RTP',
      amount: Number(body.amount).toFixed(2),
      type: 'wallet'
    });

      dialogRef.afterClosed().subscribe((res) => {
        if (res) {
          body.payees[0].bills = this.billService.billId() ?? [];
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
              .subscribe(() => {
                this.success.emit();
                this.billService.billId.set(undefined);
              })
          );
        }
      });
    }
    if (action === 2) {
      this.loading = true;
      this.paymentsService.isPaymentProcessingSubject.next(true);
      this.subscriptions.push(
        this.paymentsService
          .savePayment(saveTransactionBody)
          .pipe(
            finalize(() => {
              this.loading = false;
              this.paymentsService.isPaymentProcessingSubject.next(false);
            })
          )
          .subscribe({
            next: (res) => {
              if (res?.success) {
                const successData = {
                  title: 'Your Payment is Saved',
                  content:
                    'Your payment has been saved. Please check the status in your records.'
                };
                this.success.emit(successData);
              } else {
                this.alertService.failedAlert({
                  content: 'Transaction failed'
                });
              }
            },
            error: () => {
              this.loading = false;
              this.paymentsService.isPaymentProcessingSubject.next(false);
              
            }
          })
      );
    }
    if (
      (action === 1 && paymentId && this.paymentConfig?.mode !== 'CLONE') ||
      action === 3
    ) {
      this.loading = true;
      this.paymentsService.isPaymentProcessingSubject.next(true);
      this.subscriptions.push(
        this.paymentsService
          .updatePayment(paymentId, saveTransactionBody)
          .subscribe({
            next: (res) => {
              if (res?.success) {
                if (action === 3) {
                  const successData = {
                    title: 'Your Payment has been Updated',
                    content:
                      'Your payment has been Updated. Please check the status in your records.'
                  };
                  this.success.emit(successData);
                  this.loading = false;
                  this.paymentsService.isPaymentProcessingSubject.next(false);
                } else {
                  const updatedPaymentBody = {
                    payee_bank_account_id:
                      rtpFormBody.payeeBankAc?.encrypted_id,
                    payee_email: rtpFormBody.payeeEmail
                  };
                  this.loading = true;
                  this.paymentsService.isPaymentProcessingSubject.next(true);
                  this.subscriptions.push(
                    this.paymentsService
                      .processPayment(paymentId, updatedPaymentBody)
                      .pipe(
                        finalize(() => {
                          this.loading = false;
                          this.paymentsService.isPaymentProcessingSubject.next(
                            false
                          );
                        })
                      )
                      .subscribe(
                        (PaymentRes) => {
                          if (PaymentRes?.success) {
                            this.success.emit();
                          }
                        },
                        () => {
                          this.loading = false;
                          this.paymentsService.isPaymentProcessingSubject.next(
                            false
                          );
                          
                        }
                      )
                  );
                }
              }
            },
            error: () => {
              this.loading = false;
              this.paymentsService.isPaymentProcessingSubject.next(false);
            }
          })
      );
    }
    // }
  }

  /**
   * @description  Enables wire transfer for the selected bank account.
   */
  enableRtp() {
    const rtpFormBody = this.rtpForm.value;
    const enableWireBody = rtpFormBody.payeeBankAc;
    enableWireBody.id = enableWireBody.encrypted_id;
    this.addNewBankAccount(true, enableWireBody);
  }

  /**
   * @description  Opens a dialog to add a new bank account for the payee.
   * @param editMode -Specifies whether the dialog is in edit mode or not.
   * @param datas -Optional. Contains the data of the payee bank account.
   */
  addNewBankAccount(editMode: boolean, datas?: IPayeeViewBank) {
    if (
      !this.payeeDetails?.payeeEncryptedId ||
      this.bankModalService.isBankPermissionChecking()
    )
      return;
    this.subscriptions.push(
      this.bankModalService
        .openAddBankNormalModal({
          editMode,
          id: this.payeeDetails?.payeeEncryptedId,
          account: datas,
          from: 'wire'
        })
        .subscribe((bankModal) => {
          if (bankModal) {
            this.subscriptions.push(
              bankModal.afterClosed().subscribe((response) => {
                if (response?.success) {
                  const newPayeeBankAc: IPayeeViewBank = {
                    encrypted_id: response.data.id,
                    account_number: response.data.accountNumber,
                    account_type: response.data.accountType,
                    bank_name: response.data.bankName,
                    routing_number: response.data.routingNumber,
                    is_allow_wire: response.data.isAllowWire,
                    address_line_1: response.data.bankAccountAddress1,
                    bank_account_address2: response.data.bankAccountAddress2,
                    bank_city: response.data.bankAccountCity,
                    bank_state: response.data.bankAccountState,
                    bank_zip: response.data.bankAccountZip,
                    country: response.data.bankAccountCountry,
                    first_name: response.data.bankAccountFirstName,
                    last_name: response.data.bankAccountLastName,
                    beneficiaryBankDetails: response.data.isAllowWire
                      ? {
                          addressLine1:
                            response.data.bankingInstituteAddressLine1,
                          addressLine2: response.data.bankAccountAddress2,
                          city: response.data.bankingInstituteCity,
                          country: response.data.bankingInstituteCountry,
                          state: response.data.bankingInstituteState,
                          zip: response.data.bankAccountZip,
                          bankingInstituteName: response.data
                            .bankingInstituteName
                            ? response.data.bankingInstituteName
                            : ''
                        }
                      : undefined
                  };
                  this.alertService.successAlert({
                    title: 'Success',
                    content: ' Bank account added successfully',
                    close: true,
                    timeout: 2000
                  });
                  this.isRtpInfoAdded = true;
                  this.onShowPayeeBank(response.data.id);
                  const bankAccount = this.payeeDetails?.bank_accounts.find(
                    (account) => account.encrypted_id === datas?.encrypted_id
                  );
                  if (bankAccount) {
                    bankAccount.is_allow_wire = 1;
                  }
                  this.rtpForm.controls.payeeBankAc.setValue(bankAccount);
                  const index = this.payeeDetails?.bank_accounts.findIndex(
                    (element) => element.encrypted_id === datas?.encrypted_id
                  );
                  if (this.payeeDetails) {
                    this.payeeDetails.bank_accounts[index as number] =
                      newPayeeBankAc;
                  }
                  this.selectPayeeAccount(datas?.encrypted_id);
                  this.getPayeeBankData(this.selectedPayeeDetails.id);
                  this.payeeDetailsEvents.emit({
                    payeeDropdownDetails: this.selectedPayeeDetails,
                    isMoreDetailsLoading: false,
                    payeeBankDetails: newPayeeBankAc
                  });
                }
              })
            );
          }
        })
    );
  }

  openCategoryModal(): void {
    const dialogRef = this.dialog.open(CategoryAddModalComponent, {
      maxWidth: '500px',
      width: '93%'
    });

    this.subscriptions.push(
      dialogRef.afterClosed().subscribe((res) => {
        if (res?.success) {
          this.sharedService.setNewCategoryCreatedData({ categoryId: res.id });
          this.rtpForm.controls.category.setValue(res);
        }
      })
    );
  }

  /**
   *
   * @description This function is used to add a new bank account for the selected payee.
   */
  addPayeeBankAc() {
    if (
      !this.payeeDetails?.payeeEncryptedId ||
      this.bankModalService.isBankPermissionChecking()
    )
      return;
    this.subscriptions.push(
      this.bankModalService
        .openAddBankNormalModal({
          editMode: false,
          id: this.payeeDetails?.payeeEncryptedId,
          from: 'wire'
        })
        .subscribe((bankModal) => {
          if (bankModal) {
            this.subscriptions.push(
              bankModal.afterClosed().subscribe((response) => {
                if (response?.success) {
                  const newPayeeBankAc: IPayeeViewBank = {
                    encrypted_id: response.data.id,
                    account_number: response.data.accountNumber,
                    account_type: response.data.accountType,
                    bank_name: response.data.bankName,
                    routing_number: response.data.routingNumber,
                    is_allow_wire: response.data.isAllowWire,
                    address_line_1: response.data.bankAccountAddress1,
                    bank_account_address2: response.data.bankAccountAddress2,
                    bank_city: response.data.bankAccountCity,
                    bank_state: response.data.bankAccountState,
                    bank_zip: response.data.bankAccountZip,
                    country: response.data.bankAccountCountry,
                    first_name: response.data.bankAccountFirstName,
                    last_name: response.data.bankAccountLastName,
                    beneficiaryBankDetails: response.data.isAllowWire
                      ? {
                          addressLine1:
                            response.data.bankingInstituteAddressLine1!,
                          addressLine2: response.data.bankAccountAddress2!,
                          city: response.data.bankingInstituteCity!,
                          country: response.data.bankingInstituteCountry!,
                          state: response.data.bankingInstituteState!,
                          zip: response.data.bankAccountZip!,
                          bankingInstituteName: response.data
                            .bankingInstituteName
                            ? response.data.bankingInstituteName
                            : ''
                        }
                      : undefined
                  };
                  this.payeeDetails?.bank_accounts.push(newPayeeBankAc);
                  this.rtpForm.controls.payeeBankAc.setValue(newPayeeBankAc);
                  this.getPayeeBankData(this.selectedPayeeDetails.id);
                  this.onShowPayeeBank(response.data.id);
                  this.payeeDetailsEvents.emit({
                    payeeDropdownDetails: this.selectedPayeeDetails,
                    isMoreDetailsLoading: false,
                    payeeBankDetails: newPayeeBankAc
                  });
                  this.alertService.successAlert({
                    title: 'Success',
                    content: ' Bank account added successfully',
                    close: true
                  });
                }
              })
            );
          }
        })
    );
  }

  getPayeeBankData(payeeId: string) {
    const selectedBankAcc: IPayeeViewBank =
      this.rtpForm.controls.payeeBankAc.value;
    this.subscriptions.push(
      this.payeeService.getPayeeBankData(payeeId).subscribe((res) => {
        if (res.success) {
          this.payeeBankDataList = res.data;
          const bankName = selectedBankAcc?.bank_name ?? '';
          const accountNumber = selectedBankAcc?.account_number ?? '';
          this.selectedPayeeBank = `${bankName} - ${this.utils.getMaskedAcNo(
            String(accountNumber)
          )}`;
        }
      })
    );
  }

  removeTrailingSpacesInForm() {
    if (this.rtpForm.controls.memo.value) {
      this.rtpForm.controls.memo.setValue(
        this.rtpForm.controls.memo.value.trim()
      );
    }
  }

  newPayeeAdd(event: IPayeeDropdown) {
    this.payeeSelect(event, false);
  }

  selectionChange(event: number) {
    // this.rtpForm.controls.industryType.setValue(event);
  }

  /**
   * Validates user status before proceeding with payment.
   * Checks for email verification and KYC status.
   *
   * @returns {boolean} True if all validations pass, false otherwise
   */
  validateUserStatus(): boolean {
    if (!this.userVerified()) {
      this.verifyEmail.emit(true);
      return false;
    }

    if (this.kycStatus() === null) {
      this.openPersona.emit(true);
      return false;
    }

    return true;
  }

  getPayeeCategory(payeeId: string) {
    this.subscriptions.push(
      this.checkService.getPayeeCategory(payeeId).subscribe((res) => {
        if (res.data.id) {
          this.rtpForm.controls.category.setValue(res?.data);
          this.categoryId.set(res?.data?.id);
          if (this.categorySetWithIdFunction) {
            this.categorySetWithIdFunction(res?.data?.id);
          }
        } else {
          this.rtpForm.controls.category.setValue(null);
        }
      })
    );
  }

  setDropDownAPIAndBindId(ev: IV3DropDownOnReady, id: string|undefined) {
    if (ev.setItemWithId) {
      this.categorySetWithIdFunction = ev.setItemWithId;
    }
    if (ev.setItemWithId && id) {
      ev.setItemWithId(id);
    }
  }


  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
    this.paymentsService.remittanceData = undefined;
    this.paymentsService.hasAmount.update(() => false);
  }
}

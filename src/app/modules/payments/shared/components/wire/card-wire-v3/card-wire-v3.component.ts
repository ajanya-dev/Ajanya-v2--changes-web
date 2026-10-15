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
import { firstValueFrom, Subscription } from 'rxjs';
import { debounceTime, finalize, take } from 'rxjs/operators';
import { Utils } from 'src/app/data/utils';
import {
  IPayeeBankCreateBody,
  IPayeeBankDetails,
  IPayeeDetailsEvent,
  IPayeeDropdown,
  IPayeeEditedData,
  IPayeeView,
  IPayeeViewBank
} from 'src/app/modules/payee/payee-v2/model/payee';
import { IExistingCreditCards } from 'src/app/models/payment-switch-board';
import {
  ICalcPaymentFeeRequest,
  ICardPaymentReqDocRes,
  IPaymentBody,
  IPaymentConfig,
  IUpdatePaymentBody
} from 'src/app/modules/payments/model/payments';
import { DropDownPayeeBankComponent } from 'src/app/shared/components/drop-downs/drop-down-payee-bank/drop-down-payee-bank.component';
import { CategoryAddModalComponent } from 'src/app/shared/modal/category-modal/category-add-modal/category-add-modal.component';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { CybersourceService } from 'src/app/shared/service/cybersource/cybersource.service';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { IAttachmentItem, IV3DropDownOnReady } from 'src/app/models/common';
import { IComments } from 'src/app/data/data/cloud-quick-pay';
import { ScriptService } from 'src/app/core/services/script.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { BillService } from 'src/app/shared/service/Bill/bill.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonOnInitService } from 'src/app/shared/service/common-onInit/common-on-init.service';
import { MatBadge } from '@angular/material/badge';
import { MatTooltip } from '@angular/material/tooltip';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { ClickTrackingService } from 'src/app/shared/service/click-tracking/click-tracking.service';
import { faClockRotateLeft } from '@fortawesome/pro-regular-svg-icons';
import { PayeeDataV35Service } from 'src/app/modules/payee/payee-v3/v35-services/payee-data-v35.service';
import { BankModalService } from 'src/app/shared/bank-modal/service/bank-modal.service';
// import { IndustryTypesDropdownComponent } from 'src/app/shared/components/v3/drop-downs/industry-types-dropdown/industry-types-dropdown.component';
import { OtpModalComponent } from 'src/app/modules/cloud-bank/cloud-bank-v2/modals/otp-modal/otp-modal.component';
import { PersonaHelperService } from 'src/app/shared/persona-v4/service/persona-helper.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { environment } from 'src/environments/environment';
import { CVSourceType } from 'src/app/modules/common-verification/model/common-verification';
import {
  faCircleQuestion
} from '@fortawesome/pro-solid-svg-icons';
import { CommonButtonV35Component } from '../../../../../../shared/v3/buttons/common-button-v35/common-button-v35.component';
import { CategoryDropdownV3Component } from '../../../../../../shared/components/v3/drop-downs/category-dropdown-v3/category-dropdown-v3.component';
import { DropDownPayeeBankComponent as DropDownPayeeBankComponent_1 } from '../../../../../../shared/components/drop-downs/drop-down-payee-bank/drop-down-payee-bank.component';
import { PayeeDropdownV3Component } from '../../../../../../shared/components/v3/drop-downs/payee-dropdown-v3/payee-dropdown-v3.component';
import { CardsDropdownV3Component } from '../../../../../../shared/components/v3/drop-downs/cards-dropdown-v3/cards-dropdown-v3.component';
import { V35ControlMessageComponent } from '../../../../../../shared/v3/control-message-v35/control-message-v35.component';
import { AmountInputComponent } from '../../../../../../shared/components/amount-input/amount-input.component';
import { CardTransactionDocsPreviewModalComponent } from '../../../modal/card-transaction-docs-preview-modal/card-transaction-docs-preview-modal.component';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { CheckAddAttachmentCommonModalComponent } from 'src/app/modules/check/modal/check-activity-modals/check-add-attachment-common-modal/check-add-attachment-common-modal.component';
import { AddCommentsModalComponent } from 'src/app/shared/modal/comments-modal/add-comments-modal/add-comments-modal.component';

/**
 * @description This component handles the card to wire payment functionality.
 */
@Component({
  selector: 'app-card-wire-v3',
  templateUrl: './card-wire-v3.component.html',
  styleUrls: ['./card-wire-v3.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    AmountInputComponent,
    NgClass,
    V35ControlMessageComponent,
    CardsDropdownV3Component,
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
export class CardWireV3Component implements OnInit, OnDestroy, OnChanges {
  private payeeService = inject(PayeeService);
  private dialog = inject(MatDialog);
  private alertService = inject(AlertService);
  private cyberSourceService = inject(CybersourceService);
  private paymentsService = inject(PaymentsService);
  private sharedService = inject(SharedService);
  private datePipe = inject(DatePipe);
  private scriptService = inject(ScriptService);
  private localStorageService = inject(LocalStorageService);
  private billService = inject(BillService);
  private activatedRoute = inject(ActivatedRoute);
  private commonService = inject(CommonOnInitService);
  private clickTrackingService = inject(ClickTrackingService);
  public payeeDataService = inject(PayeeDataV35Service);
  private bankModalService = inject(BankModalService);
  private validationService = inject(ValidationService);
  private personaHelperService = inject(PersonaHelperService);
  private router = inject(Router);
  private checkService = inject(CheckService);
  private headerService = inject(HeaderService);

  @Output() payeeDetailsEvents = new EventEmitter<IPayeeDetailsEvent | false>();
  @Output() success = new EventEmitter<
    | boolean
    | {
        title: string;
        content: string;
      }
  >();

  @Input() paymentConfig: IPaymentConfig;
  @Input() changedInfo: IPayeeEditedData | undefined;
  @Input() isCurrentPaymentDisabled: false | string = false;
  @Output() calculateFee = new EventEmitter<ICalcPaymentFeeRequest>();
  @Output() openPersona = new EventEmitter<boolean>(false);
  @Output() verifyEmail = new EventEmitter<boolean>(false);
  @Output() newPaymentClick = new EventEmitter<void>();

  userVerified = input<boolean>(false);
  kycStatus = input<number | undefined>(undefined);

  paymentForm: FormGroup;
  loading: boolean;
  subscriptions: Subscription[] = [];
  payeeDetails: IPayeeView | undefined;
  utils = Utils;
  showDropDown = false;
  dropDownSearchInput = '';
  cardList: IExistingCreditCards[];
  transactionId: '';
  serviceFee: '';
  isWireAllowed = true;
  payeeBankDetails: IPayeeBankDetails[] = [];
  selectedPayeeBank: IPayeeBankCreateBody;
  defaultCDPayeeBank: IPayeeViewBank;
  selectedPayeeDetails: IPayeeDropdown;
  selectedPayeeBankData: string | undefined;
  attachmentCount: number;
  commentsCount: number;
  createdExistingAttachments: IAttachmentItem[] = [];
  createdExistingComments: IComments[] = [];
  // Bill-related properties
  bills: string[] = [];
  isBillCheck: boolean = false;
  thirdPartyProviderType: number;
  remitanceTotal: number;
  newRemittanceFormat: boolean;
  insertFromRemittance = false;
  encId: string;
  remittanceGrandTotal: number;
  remittanceType: number;
  editBankName: string | undefined;
  amountInputDisabled = false;
  selectedpayeeId: string;
  categorySetWithIdFunction: ((id: string) => void) | undefined;
  categoryId = signal<string | undefined>(undefined);
  userPlugins = this.localStorageService.getItem('userPlugins');

  faCircleQuestion=faCircleQuestion;

  purposeOfPaymentControl = new FormControl('', [Validators.required]);
  purposeOfPaymentOptions = signal<string[]>([]);

  @ViewChild('payeeBankDropDown')
  payeeBankDropDownComponent: DropDownPayeeBankComponent;

  @ViewChild(CardsDropdownV3Component)
  cardsDropdownV3Component: CardsDropdownV3Component;

  apiNo: number;
  readonly paymentMode = '6';
  hasRemitance: boolean;
  faHistory = faClockRotateLeft;
  merchantId: string;
  uploadedDocs: ICardPaymentReqDocRes;
  sessionKey: string;
  emailSessionKey: string;
  phoneSessionKey: string;
  signatureUrl: string;
  isBanned = false;
  public environment = environment;
  gatewayType: number | undefined;

  ngOnInit(): void {
    this.paymentsService.currentPaymentMehtod.set('CC_WIRE');
    this.paymentsService.payeeDetails = undefined;
    this.initForm();
    this.getCount();
    this.subscriptions.push(
      this.cyberSourceService.getExistingCards().subscribe((res) => {
        this.cardList = res.data;
      })
    );
    this.billFetch();
    this.getPurposeOfPayment();
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
                  this.syncPurposeDropdown(memo as string);
                  this.paymentForm.controls.chequeInvoiceNumber.setValue(
                    res.data.invoiceNumbers
                  );
                  this.thirdPartyProviderType = res.data.providerType;

                  this.attachmentCount = res.data.attachments.length;
                  this.commentsCount = res.data.comment_count;
                  
                  // Load bill attachments using existing API
                  this.loadBillAttachments(); 
                  const { payeeId } = res.data.payee;
                  
                  this.subscriptions.push(
                    this.payeeService
                      .getPayees(1, res.data.payee.payeeName)
                      .subscribe((res2) => {
                        const payee = res2.data.find(
                          (el: IPayeeDropdown) => el.id === payeeId
                        );
                        this.payeeSelect(payee as IPayeeDropdown, false);
                      })
                  );
                }
              })
          );
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
        this.getPayeeDetails(this.changedInfo?.selectedPayeeDetails?.id);
        this.paymentForm.controls.payeeEmail.setValue(
          this.changedInfo?.selectedPayeeDetails?.email
        );
      }
    }
    if (this.changedInfo?.selectedPayeeBank) {
      this.selectPayeeAccount(
        this.changedInfo?.selectedPayeeBank?.encrypted_id
      );
    }

    if (changes?.changedInfo?.currentValue?.selectedPayeeBank) {
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
    this.paymentForm = new FormGroup({
      amount: new FormControl('', [
        Validators.required,
        Validators.min(environment.isItDev ? 0.01 : 10),
        Validators.maxLength(9)
      ]),
      payee: new FormControl(null, [Validators.required]),
      card: new FormControl(null, [Validators.required]),
      memo: new FormControl('', [
        Validators.required,
        Validators.pattern(/.*\S/),
        Validators.maxLength(26),
        ValidationService.alphabetsAndSpacesValidator
      ]),
      invoiceNumber: new FormControl('', [
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
      payeeIdNumber: new FormControl('', [Validators.maxLength(30)]) as FormControl,
      // industryType: new FormControl(null, Validators.required)
      // Bill-related form controls
      commentIds: new FormControl([]),
      attachmentIds: new FormControl([]),
      chequeInvoiceNumber: new FormControl(null)
    });
    this.subscriptions.push(
      this.paymentForm.controls.payee.valueChanges.subscribe((payee) => {
        if (payee && payee?.id && this.selectedPayeeDetails?.id !== payee?.id) {
          this.selectedPayeeDetails = payee;
          this.getPayeeDetails(payee.id, false);
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
            mode: Number(this.paymentMode),
            fee1Label: 'Pass-through processing fee',
            fee2Label: 'Wire'
          });
          // Call decide-gateway API when amount changes
          this.paymentsService.fetchGatewayType(amount, (gatewayType) => {
            this.gatewayType = gatewayType;
          });
          if(!amount || amount === 0) {
            this.gatewayType = undefined;
          }
          // Call decide-gateway-by-trans-limit API (only runs when
          // creditCardGatewaySwitchingStatus === 3; guard is inside the service).
          this.paymentsService.checkTransLimitForCard({
            amount: Number(this.paymentForm.controls.amount.value),
            card: this.paymentForm.controls.card.value,
            cardControl: this.paymentForm.controls.card as FormControl<IExistingCreditCards | null>,
            dropdown: this.cardsDropdownV3Component as CardsDropdownV3Component,
            subscriptions: this.subscriptions
          });
        })
    );
    this.subscriptions.push(
      this.paymentForm.controls.card.valueChanges.subscribe((card) => {
        this.paymentsService.checkTransLimitForCard({
          amount: Number(this.paymentForm.controls.amount.value),
          card,
          cardControl: this.paymentForm.controls.card as FormControl<IExistingCreditCards | null>,
          dropdown: this.cardsDropdownV3Component as CardsDropdownV3Component,
          subscriptions: this.subscriptions
        });
        this.paymentsService.resolveCardPayeeBankVerificationRequired();
      })
    );
    this.setCommonFormValues();
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
            this.hasRemitance = !!res.data?.items_by_array;
          })
      );
    }
  }

  autoPopulateDropdown(ev: IV3DropDownOnReady, id: string) {
    if (ev.setItemWithId && id) {
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

    if (this.paymentConfig.mode === 'CLONE') {
      this.paymentForm.controls.invoiceNumber.setValue(null);
    }
  }

  getPurposeOfPayment() {
    this.paymentsService.getPurposeOfPayment((options) => {
      this.purposeOfPaymentOptions.set(options);
      this.syncPurposeDropdown(this.paymentConfig?.memo || this.paymentConfig?.paymentFormValue?.memo);
    });
  }

  allowAlphabetsAndSpaces(event: KeyboardEvent): boolean {
    const charCode = event.key;
    if (/^[a-zA-Z ]$/.test(charCode)) {
      return true;
    }
    event.preventDefault();
    return false;
  }

  onMemoPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedText = event.clipboardData?.getData('text') || '';
    const sanitized = pastedText.replace(/[^a-zA-Z ]/g, '');
    this.paymentForm.controls.memo.setValue(sanitized);
  }

  onPurposeChange(): void {
    const selected = this.purposeOfPaymentControl.value;
    if (selected && selected !== 'Other') {
      const sanitized = selected.replace(/[^a-zA-Z ]/g, '').replace(/\s+/g, ' ').trim();
      this.paymentForm.controls.memo.setValue(sanitized);
    } else {
      this.paymentForm.controls.memo.setValue('');
    }
  }

  syncPurposeDropdown(memoValue: string): void {
    if (!memoValue) return;
    if (this.purposeOfPaymentOptions().includes(memoValue)) {
      this.purposeOfPaymentControl.setValue(memoValue);
    } else {
      this.purposeOfPaymentControl.setValue('Other');
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
    this.paymentForm.controls.payeeBankAc.reset();
    this.paymentForm.controls.payeeEmail.reset();
    this.payeeBankDropDownComponent.clearSelection();
    this.selectedPayeeDetails = event;
    this.isWireAllowed = true;
    if (event?.id) {
      if (fromTemplate === false) {
        this.paymentForm.controls.payee.setValue(event);
      }
      this.paymentForm.controls.payeeIdNumber.setValue(event?.payeeIdNumber);
      this.payeeDetailsEvents.emit({
        payeeDropdownDetails: event,
        isMoreDetailsLoading: true
      });
      const payeeData = this.paymentForm.controls?.payee?.value;
      if(!payeeData?.company || !payeeData?.addressLine1 || !payeeData?.city || !payeeData?.state || !payeeData?.zip || !payeeData?.country) {
        this.paymentsService.checkAndHandleMissingPayeeInfo(payeeData);
      }
    }

    // this.paymentForm.controls.industryType.setValue(event?.merchantCategory);
    if (event?.email && event?.email !== '')
      this.paymentForm.controls.payeeEmail.setValue(event?.email);
  }

  /**
   * @description Selects a payee account based on the provided encrypted ID.
   * @param item -the encrypted id of the selected payee account
   */
  selectPayeeAccount(item: string | undefined) {
    this.selectedPayeeBankData = undefined;
    this.editBankName = undefined;
    if (!item) return;
    const bankAccount = this.payeeDetails?.bank_accounts.filter(
      (account) => account.encrypted_id === item
    )[0];
    this.isWireAllowed = bankAccount?.is_allow_wire === 1;
    this.paymentForm.controls.payeeBankAc.setValue(bankAccount);
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
    this.paymentForm.controls.payee.reset();
    this.paymentForm.controls.payeeEmail.reset();
    this.paymentForm.controls.payeeBankAc.reset();
    this.paymentForm.controls.payeeIdNumber.reset();
    this.payeeBankDetails = [];
    this.isWireAllowed = true;
    this.payeeDetailsEvents.emit({
      payeeDropdownDetails: undefined,
      isMoreDetailsLoading: false
    });
    // this.paymentForm.controls.industryType.setValue(null);
  }

  /**
   * @description Clears the selected payee account.
   * Resets the value of the payeeBankAc control in the paymentForm.
   */
  clearPayeeAccount() {
    this.paymentForm.controls.payeeBankAc.setValue(null);
    this.isWireAllowed = true;
    this.payeeDetailsEvents.emit({
      payeeDropdownDetails: this.selectedPayeeDetails,
      isMoreDetailsLoading: false
    });
  }

  cardSelect(event: IExistingCreditCards) {
    this.paymentForm.controls.card.setValue(event);
  }

  selectCategory(event: { id: string }) {
    this.paymentForm.controls.category.setValue(event);
  }

  /**
   * @description This function is used to fetch additional details of the selected payee based on the provided payee ID.
   * @param payeeId -The ID of the selected payee.
   */
  getPayeeDetails(payeeId: string, fromApi?: boolean, type?: string): void {
    this.payeeDetails = undefined;
    this.subscriptions.push(
      this.paymentsService
        .getPayeeDetails(payeeId, fromApi, type)
        .pipe(debounceTime(100))
        .subscribe(
          (res) => {
            this.payeeDetails = res;
            this.getPayeeCategory(payeeId);
            if (this.payeeDetails) {
              if (res.bank_accounts.length === 0) {
                this.isWireAllowed = true;
                this.paymentForm.controls.payeeBankAc.reset();
                if (this.changedInfo?.selectedPayeeDetails?.id) {
                  this.payeeDetailsEvents.emit({
                    payeeDropdownDetails:
                      this.changedInfo?.selectedPayeeDetails,
                    isMoreDetailsLoading: false,
                    payeeBankDetails:
                      this.paymentForm.controls.payeeBankAc.value
                  });
                } else {
                  this.payeeDetailsEvents.emit({
                    payeeDropdownDetails: this.selectedPayeeDetails,
                    isMoreDetailsLoading: false,
                    payeeBankDetails:
                      this.paymentForm.controls.payeeBankAc.value
                  });
                }
                if (this.paymentForm.value.payee.company && this.paymentForm.value.payee.addressLine1){
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
                const defaultBankAcIndex =
                  this.payeeDetails.bank_accounts?.findIndex(
                    (el) => el.is_default_for_direct_deposit
                  );
                if (this.paymentConfig?.paymentFormValue?.payeeBankAccount) {
                  this.onShowPayeeBank();
                } else if (defaultBankAcIndex > -1) {
                  this.paymentForm.controls.payeeBankAc.setValue(
                    this.payeeDetails?.bank_accounts[defaultBankAcIndex] ?? null
                  );
                }
                this.defaultCDPayeeBank =
                  this.payeeDetails.bank_accounts[defaultBankAcIndex];
                this.selectedPayeeBankData = `${
                  this.defaultCDPayeeBank.bank_name
                } - ${this.utils.getMaskedAcNo(
                  String(this.defaultCDPayeeBank.account_number)
                )}`;
                this.isWireAllowed =
                  this.defaultCDPayeeBank.is_allow_wire === 1;
                if (this.changedInfo?.selectedPayeeDetails?.id) {
                  this.payeeDetailsEvents.emit({
                    payeeDropdownDetails:
                      this.changedInfo?.selectedPayeeDetails,
                    isMoreDetailsLoading: false,
                    payeeBankDetails:
                      this.paymentForm.controls.payeeBankAc.value
                  });
                } else {
                  this.payeeDetailsEvents.emit({
                    payeeDropdownDetails: this.selectedPayeeDetails,
                    isMoreDetailsLoading: false,
                    payeeBankDetails:
                      this.paymentForm.controls.payeeBankAc.value
                  });
                }
              }
              this.paymentForm.controls.payeeIdNumber.setValue(
                this.payeeDetails?.payee_information.payee_id_number
              );
              this.paymentForm.controls.payeeEmail.setValue(
                res.payee_information.payee_email
              );
              // this.paymentForm.controls.industryType.setValue(
              //   res.payee_information.merchant_category
              // );
            }
          },
          () => {
            this.payeeDetailsEvents.emit({
              payeeDropdownDetails: this.paymentForm.controls.payee.value,
              isMoreDetailsLoading: false
            });
          }
        ),
      this.payeeService.getPayeeBankData(payeeId).subscribe((res) => {
        if (res.success) {
          this.payeeBankDetails = res.data;
        }
      })
    );
  }

  showBannedMessage() {
    this.isBanned = true;
    this.paymentForm.controls.payee.reset();
    this.paymentForm.controls.payeeEmail.reset();
    this.paymentForm.controls.payeeBankAc.reset();
    this.paymentForm.controls.payeeIdNumber.reset();
    this.payeeBankDetails = [];
    this.isWireAllowed = true;
    this.payeeDetailsEvents.emit({
      payeeDropdownDetails: undefined,
      isMoreDetailsLoading: false
    });
    this.alertService.failedAlert({
      content: 'Unfortunately we cannot support payment to this beneficiary as it violates our terms of service'
    }).afterClosed().subscribe(() => {
      this.isBanned = false;
    });
  }

  /**
   * @description Function triggered when click pay button in payment table.
   * Used to populate selected payee bank instead of default bank account.
   */
  onShowPayeeBank(encryptedId?: string) {
    if (this.payeeDetails) {
      if (encryptedId) {
        const bank = this.payeeDetails.bank_accounts.filter(
          (item) => item.encrypted_id === encryptedId
        );
        this.paymentForm.controls.payeeBankAc.setValue(bank[0] ?? null);
        this.editBankName = `${bank[0]?.bank_name} - ${this.utils.getMaskedAcNo(
          String(bank[0]?.account_number)
        )}`;
      } else {
        const bank = this.payeeDetails.bank_accounts.filter(
          (item) =>
            item.encrypted_id ===
            this.paymentConfig?.paymentFormValue?.payeeBankAccount
        );
        this.paymentForm.controls.payeeBankAc.setValue(bank[0] ?? null);
        this.editBankName = `${bank[0]?.bank_name} - ${this.utils.getMaskedAcNo(
          String(bank[0]?.account_number)
        )}`;
      }
    }
  }

  selectionChange(event: number) {
    // this.paymentForm.controls.industryType.setValue(event);
  }

  /**
   * @description Completes the transaction based on the specified action
   * Validates the payment form and checks if it's valid.
   * @param action -The action to perform for the transaction (1: Complete, 2: Save, 3: Update)
   */
  async submitPayment(action: number) {
    this.apiNo = action;
    if(this.paymentsService.checkForComplianceFreeze()){
      this.paymentsService.openComplianceFreezeModal();
      return;
    }
    this.removeTrailingSpacesInForm();
    this.purposeOfPaymentControl.markAsTouched();
    if (this.paymentForm.invalid || Number(this.paymentForm.value?.amount) < (environment.isItDev ? 0.01 : 10)) {
      this.paymentForm.markAllAsTouched();
      return;
    }

    if (!this.validateUserStatus()) {
      return;
    }
    if (this.isCurrentPaymentDisabled) {
      this.commonService.contactAlert(this.isCurrentPaymentDisabled);
      return;
    }

    this.loading = true;
    const bannedCheck = await firstValueFrom(this.paymentsService.bannedPayeeCheck(this.selectedPayeeDetails.id, this.paymentForm.controls.category.value?.id ?? ''));
    if (bannedCheck?.success && bannedCheck.is_banned_visa_bpsp) {
      this.isBanned = true;
      this.showBannedMessage();
      this.loading = false;
      this.paymentsService.isPaymentProcessingSubject.next(false);
      return;
    }
    this.loading = false;

    const cardFormBody = this.paymentForm.value;
    const payeeData = cardFormBody.payee;
    if(!payeeData.company) {
      const isCompanyMissing = this.paymentsService.checkAndHandleMissingPayeeInfo(payeeData);
      if (isCompanyMissing) {
        return;
      }
    } else {
      const isAddressMissing = this.paymentsService.checkAndHandleMissingAddress(payeeData);
      if (isAddressMissing) {
        return;
      }
    }

    const enableWireBody = cardFormBody.payeeBankAc;
    enableWireBody.id = enableWireBody.encrypted_id;
    const dueDate = this.datePipe.transform(Date.now(), 'yyyy-MM-dd') as string;
    const commentIds: string[] = [];
    const attachmentIds: string[] = [];
    this.createdExistingComments.map((el) => commentIds.push(el.encrypted_id));
    this.createdExistingAttachments.forEach((el) => {
      if (el.encrypted_id) {
        attachmentIds.push(el.encrypted_id);
      }
    });

    const saveTransactionBody: IUpdatePaymentBody = {
      amount: Number(cardFormBody.amount),
      paymentDueDate: dueDate,
      payee: cardFormBody.payee?.id,
      payeeBankAccount: cardFormBody.payeeBankAc?.encrypted_id,
      category: cardFormBody.category?.id,
      referenceNo: cardFormBody.invoiceNumber,
      description: cardFormBody.memo,
      sourceType: 'card',
      sourceId: cardFormBody.card.cardId,
      transferType: 'wire',
      payeeIdNumber: cardFormBody.payeeIdNumber,
      attachmentIds,
      commentIds,
      items: this.insertFromRemittance ? this.paymentsService.remittanceData?.remitance : [],
      remittanceType: this.paymentsService.remittanceData?.remittanceType,
      payeeEmail: cardFormBody.payeeEmail,
      bills: this.billService.billId() ?? []
    };
    if (cardFormBody?.amount < (environment.isItDev ? 0.01 : 10)) {
      this.alertService.failedAlert({
        title: 'Failed',
        content: 'Minimum transaction amount should be $' + (environment.isItDev ? '0.01' : '10.00')
      });
      this.loading = false;
      this.paymentsService.isPaymentProcessingSubject.next(false);
    } else {
      const paymentId = this.paymentConfig.id ? this.paymentConfig.id : '';
      if (!cardFormBody.payeeBankAc?.is_allow_wire) {
        const alert = this.alertService.infoAlert({
          content:
            'Please enter the beneficiary and beneficiary bank details below in order to proceed with the payment!'
        });
        this.subscriptions.push(
          alert.afterClosed().subscribe((res) => {
            if (res) {
              this.addNewBankAccount(true, enableWireBody);
            }
          })
        );
      } else {
        if (
          action === 1 &&
          (!paymentId || this.paymentConfig.mode === 'CLONE')
        ) {
          this.managePayment('COMPLETE-TRANSACTION');
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
              .subscribe((res) => {
                if (res?.success) {
                  // Track when the credit card promoting toast is clicked and the payment is done.

                  this.clickTrackingService
                    .ccToastClickedPaymentDone(res.data?.id)
                    ?.pipe(take(1))
                    ?.subscribe();

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
              })
          );
        }
        if (
          (action === 1 && paymentId && this.paymentConfig.mode !== 'CLONE') ||
          action === 3
        ) {
          this.loading = true;
          this.paymentsService.isPaymentProcessingSubject.next(true);
          this.subscriptions.push(
            this.paymentsService
              .updatePayment(paymentId as string, saveTransactionBody)
              .subscribe({
                next: (res) => {
                  if (res?.success) {
                    if (action === 3) {
                      const successData = {
                        title: 'Your Payment is Saved',
                        content:
                          'Your payment has been saved. Please check the status in your records.'
                      };
                      this.success.emit(successData);
                      this.loading = false;
                      this.paymentsService.isPaymentProcessingSubject.next(
                        false
                      );
                    } else {
                      this.managePayment('COMPLETE-TRANSACTION-WITH-ZIL');
                    }
                  } else {
                    this.alertService.failedAlert({
                      content: 'Transaction failed'
                    });
                    this.loading = false;
                    this.paymentsService.isPaymentProcessingSubject.next(false);
                  }
                },
                error: () => {
                  this.loading = false;
                  this.paymentsService.isPaymentProcessingSubject.next(false);
                }
              })
          );
        }
      }
    }
    //------------------------------------
  }

  /**
   * @description Function for managing payments with card. where ever we create a payment with card, we call this function first,
   * currently there are two places we make a payment.
   * 1. Direct payment.
   * 2. Payment after updateing saved payment.
   * From this function, firstly we checking if there is any documents required to make a payment with this card.
   * if required, we opens a modal and collects all the required documents and submits from the modal. and gets the response from the modal,
   * and with the response, we completes the payment.
   * if not required, we simply make the payment normally. without documents details.
   * @param shouldGoTo - This is for as mentioned, there are two places we make a payment. so we have calling this function from two places.
   * and in both two places we are calling two different apis. so we have to know from where the function got called. this param used to know that.
   */
  async managePayment(
    shouldGoTo: 'COMPLETE-TRANSACTION' | 'COMPLETE-TRANSACTION-WITH-ZIL'
  ) {

    const bannedCheck = await firstValueFrom(this.paymentsService.bannedPayeeCheck(this.selectedPayeeDetails.id, this.paymentForm.controls.category.value?.id ?? ''));
    if (bannedCheck?.success && bannedCheck.is_banned_visa_bpsp) {
      this.isBanned = true;
      this.showBannedMessage();
      this.paymentsService.isPaymentProcessingSubject.next(false);
      return;
    }

    const card = this.paymentForm.controls.card.value;
    const amount = this.paymentForm.controls.amount.value;
    const invoiceNumber = this.paymentForm.controls.invoiceNumber.value;
    const mode = this.paymentMode;

    const body = {
      cardId: card?.cardId ?? '',
      amount: amount ?? '',
      paymentType: 'rail'
    };
    const dialogRef = this.paymentsService.openPaymentConfirmationModal({
      accNumber: this.paymentConfig?.paymentFormValue?.card?.cardMasked,
      bankName: this.paymentConfig?.paymentFormValue?.card?.nickName,
      payeeName: this.selectedPayeeDetails.name,
      paymentMethod: 'Wire',
      amount: Number(body.amount).toFixed(2),
      type: 'card',
      isPayeeBankVerified: !(
        this.paymentsService.isPayeeBankVerificationRequired &&
        this.paymentForm.controls.payeeBankAc.value?.verified !== 1
      )
    });
    dialogRef.afterClosed().subscribe((res) => {
      if (res) {
        this.loading = true;
        this.paymentsService.isPaymentProcessingSubject.next(true);
        this.subscriptions.push(
          this.paymentsService.getRequiredDocumentsDetails(body).subscribe({
            next: (res) => {
              if (res.success) {
                const invoiceRequired =
                  res.data.required_docs.includes('invoice');
                const cardRequired = res.data.required_docs.includes('card');
                if (cardRequired || invoiceRequired) {
                  if (card) {
                    this.loading = false;
                    this.paymentsService.isPaymentProcessingSubject.next(false);
                    const dialogRef =
                      this.commonService.openVerifyCardInvoiceModal(
                        card,
                        amount,
                        mode,
                        invoiceNumber,
                        res.data.required_docs,
                        this.selectedPayeeDetails
                      );
                    this.subscriptions.push(
                      dialogRef.afterClosed().subscribe((data) => {
                        if (data?.success) {
                          this.uploadedDocs = data?.data;
                          this.signatureUrl = data?.authSign as string;
                          this.loading = true;
                          this.paymentsService.isPaymentProcessingSubject.next(
                            true
                          );
                          if (shouldGoTo === 'COMPLETE-TRANSACTION') {
                            this.completeTransaction(data?.data);
                          } else {
                            this.completeTransactionUsingZilPaymentApi(
                              data?.data
                            );
                          }
                        } else if (data?.success === false) {
                          this.alertService.failedAlert({
                            content:
                              "Sorry.! Couldn't verify your documents, Please Verify all the documents to make a payment"
                          });
                        }
                      })
                    );
                  } else {
                    this.loading = false;
                    this.paymentsService.isPaymentProcessingSubject.next(false);
                  }
                } else if (shouldGoTo === 'COMPLETE-TRANSACTION') {
                  this.completeTransaction();
                } else {
                  this.completeTransactionUsingZilPaymentApi();
                }
              } else {
                this.loading = false;
                this.paymentsService.isPaymentProcessingSubject.next(false);
              }
            },
            error: (err) => {
              if (err?.error?.errorCode === 442) {
                this.alertService
                  .infoAlert({
                    content:
                      'You need to verify your business before making a payment',
                    isOk: true,
                    isCancel: true,
                    cancelMsg: 'Cancel',
                    doneMsg: 'Enable Now'
                  })
                  .afterClosed()
                  .subscribe((res) => {
                    if (res) {
                      this.openKybModal(shouldGoTo);
                    }
                  });
              }

              this.loading = false;
              this.paymentsService.isPaymentProcessingSubject.next(false);
            }
          })
        );
      } else {
        this.loading = false;
        this.paymentsService.isPaymentProcessingSubject.next(false);
      }
    });
  }

  openKybModal(
    shouldGoTo: 'COMPLETE-TRANSACTION' | 'COMPLETE-TRANSACTION-WITH-ZIL'
  ) {
    if (environment.isV4Persona) {
      this.personaHelperService
        .openModal('kyb', CVSourceType.credit_card)
        .subscribe((res) => {
          if (res?.data?.inquiry_id) {
            this.managePayment(shouldGoTo);
          }
        });
    } else {
      this.router.navigateByUrl('/manage/users/verify-user-id?type=5');
    }
  }

  /**
   * @description Complete transaction function for card payment with old api.
   * @param documents - Optional parameter. its possible that is there might be documents details, and there might not be. so its optional.
   * if there is documents details, we simply pass it backend, else it will be undefined.
   */
  completeTransaction(documents?: ICardPaymentReqDocRes, isAgree = 0) {
    const cardFormBody = this.paymentForm.value;
    const commentIds: string[] = [];
    const attachmentIds: string[] = [];
    this.createdExistingComments.map((el) => commentIds.push(el.encrypted_id));
    this.createdExistingAttachments.forEach((el) => {
      if (el.encrypted_id) {
        attachmentIds.push(el.encrypted_id);
      }
    });

    const body: IPaymentBody = {
      amount: cardFormBody.amount,
      cardId: cardFormBody.card.cardId,
      category: cardFormBody.category?.id ?? '',
      payees: [
        {
          id: cardFormBody.payee?.id,
          amount: cardFormBody.amount,
          email: cardFormBody.payeeEmail,
          memo: cardFormBody.memo,
          invoiceNumber: cardFormBody.invoiceNumber,
          bankAccount: cardFormBody.payeeBankAc?.encrypted_id,
          category: cardFormBody.category?.id ?? '',
          payeeIdNumber: cardFormBody.payeeIdNumber,
          bills: []
        }
      ],
      mode: '6',
      documents,
      commentIds,
      attachmentIds,
      items: this.insertFromRemittance ? this.paymentsService.remittanceData?.remitance : [],
      remittanceType: this.paymentsService.remittanceData?.remittanceType,
      session_key: this.sessionKey ?? '',
      otp_type: this.emailSessionKey ? 'phone' : 'email',
      email_otp_session_key: this.emailSessionKey ?? '',
      phone_otp_session_key: this.phoneSessionKey ?? '',
      document_preview_agree:isAgree
    };
    body.payees[0].bills = this.billService.billId() ?? [];
    this.loading = true;
    this.paymentsService.isPaymentProcessingSubject.next(true);
    this.subscriptions.push(
      this.cyberSourceService
        .capturePayment(body)
        .pipe(
          finalize(() => {
            this.loading = false;
            this.paymentsService.isPaymentProcessingSubject.next(false);
            this.cyberSourceService.replaceIdempotencyKey();
          })
        )
        .subscribe(
          (res) => {
            // Track when the credit card promoting toast is clicked and the payment is done.
            this.clickTrackingService
              .ccToastClickedPaymentDone(res.data?.payment_ids[0])
              ?.pipe(take(1))
              ?.subscribe();

            this.scriptService.trackMatomoEvent(
              'Creditcard',
              'CreditcardUser',
              'CreditcardUser',
              this.localStorageService.getItem('userId')
            );
            
            this.success.emit();
            this.sessionKey = '';
            this.emailSessionKey = '';
            this.phoneSessionKey = '';
            this.billService.billId.set(undefined);
          },
          (err) => {
            this.paymentsService.afterGetingError(
              err?.error?.errorCode,
              err?.error?.errorMsg
            );
            if (err.error.errorCode === '808') { 
              const dialog = this.dialog.open(CardTransactionDocsPreviewModalComponent, { 
                maxWidth: '750px', 
                width: '100%', 
                disableClose: true, 
                autoFocus: false, 
                data: {...body, authSign: this.signatureUrl} 
              }); 
              dialog.afterClosed().subscribe((result) => { 
                if (result) { 
                  this.completeTransaction(this.uploadedDocs, 1); 
                } 
              }); 
            } 
            if (err.error.errorCode === '112') {
              this.sessionKey = err.error.session_key;
              const dialog = this.dialog.open(OtpModalComponent, {
                maxWidth: '410px',
                width: '100%',
                disableClose: true,
                autoFocus: false,
                data: {...err.error,type:'card-transaction',mode:this.emailSessionKey ? 'phone': 'email'}
              });
              dialog.afterClosed().subscribe((result) => {
                if (result.success) {
                  if(this.emailSessionKey){
                    this.phoneSessionKey = result?.session_key ?? err.error.session_key;
                  }else{
                    this.emailSessionKey = result?.session_key ?? err.error.session_key;
                  }
                  this.completeTransaction(this.uploadedDocs);
                }
              });
            }
            if (err.error.errorCode === 816) {
              const alert = this.alertService.failedAlert({
                content: err.error.errorMsg,
                isOk: true,
                isCancel: false,
                doneMsg: 'Try Again'
              });
              alert.afterClosed().subscribe((res) => {
                if (res) {
                  this.headerService.setHeaderValueChanged(true);
                  this.newPaymentClick.emit();
                }
              });
            }

            // this is very rare case scenario
            if (err.error.errorCode === 783) {
              this.alertService.failedAlert({ 
                content: err.error.errorMsg,
                isOk: true,
                isCancel: false,
                doneMsg: 'Try Again'
              })
              .afterClosed()
              .subscribe((res) => {
                if (res) {
                  this.headerService.setHeaderValueChanged(true);
                  window.location.reload();
                }
              });
            }

          }
        )
    );
  }

  /**
   * @description Complete transaction function for card payment with Zil payments api.
   * @param documents - Optional parameter. its possible that is there might be documents details, and there might not be. so its optional.
   * if there is documents details, we simply pass it backend, else it will be undefined.
   */
  completeTransactionUsingZilPaymentApi(documents?: ICardPaymentReqDocRes,isAgree = 0) {    
    const cardFormBody = this.paymentForm.value;
    if (this.paymentConfig.paymentDetails?.id) {
      const updatedPaymentBody = {
        payee_bank_account_id: cardFormBody.payeeBankAc?.encrypted_id,
        payee_email: cardFormBody.payeeEmail,
        documents,
        otp_and_docs_preview_section_in_credit_card:1,
        otp_type:this.emailSessionKey ? 'phone': 'email',
        email_otp_session_key:this.emailSessionKey ?? '',
        phone_otp_session_key: this.phoneSessionKey ?? '',
        document_preview_agree:isAgree
      };
      this.loading = true;
      this.paymentsService.isPaymentProcessingSubject.next(true);
      this.subscriptions.push(
        this.paymentsService
          .processCardPayment(
            this.paymentConfig.paymentDetails?.id,
            updatedPaymentBody
          )
          .pipe(
            finalize(() => {
              this.loading = false;
              this.paymentsService.isPaymentProcessingSubject.next(false);
              this.paymentsService.replaceIdempotencyKey();
            })
          )
          .subscribe(
            (res) => {
              if (res?.success) {
                // this.scriptService.trackMatomoEvent(
                //   'Creditcard',
                //   'CreditcardUser',
                //   'CreditcardUser',
                //   this.localStorageService.getItem('userId')
                // );
                
                this.success.emit();
                this.sessionKey = '';
                this.emailSessionKey = '';
                this.phoneSessionKey = '';
                this.billService.billId.set(undefined);
              }
            },
            (err) => {
              this.paymentsService.afterGetingError(
                err?.error?.errorCode,
                err?.error?.errorMsg
              );
              if (err.error.errorCode === '112') {
                this.sessionKey = err.error.session_key;
                const dialog = this.dialog.open(OtpModalComponent, {
                  maxWidth: '410px',
                  width: '100%',
                  disableClose: true,
                  autoFocus: false,
                  data: {...err.error,type:'card-transaction',mode:this.emailSessionKey ? 'phone': 'email'}
                });
                dialog.afterClosed().subscribe((result) => {
                  if (result.success) {
                    if(this.emailSessionKey){
                      this.phoneSessionKey = result?.session_key ?? err.error.session_key;
                    }else{
                      this.emailSessionKey = result?.session_key ?? err.error.session_key;
                    }
                    this.completeTransactionUsingZilPaymentApi(this.uploadedDocs,0);
                  }
                });
              }
              if (err.error.errorCode === '808') {
                const dialog = this.dialog.open(CardTransactionDocsPreviewModalComponent, {
                  maxWidth: '750px',
                  width: '100%',
                  disableClose: true,
                  autoFocus: false,
                  data: {...cardFormBody,authSign:this.signatureUrl,zil_payment_uuid:this.paymentConfig.paymentDetails?.id}
                });
                dialog.afterClosed().subscribe((result) => {
                  if (result) {
                    this.completeTransactionUsingZilPaymentApi(this.uploadedDocs,1);
                  }
                });
              }
              if (err.error.errorCode === 816) {
                const alert = this.alertService.failedAlert({
                  content: err.error.errorMsg,
                  isOk: true,
                  isCancel: false,
                  doneMsg: 'Try Again'
                });
                alert.afterClosed().subscribe((res) => {
                  if (res) {
                    this.headerService.setHeaderValueChanged(true);
                    this.newPaymentClick.emit();
                  }
                });
              }

            // this is very rare case scenario
              if (err.error.errorCode === 783) {
                this.alertService.failedAlert({ 
                  content: err.error.errorMsg,
                  isOk: true,
                  isCancel: false,
                  doneMsg: 'Try Again'
                })
                .afterClosed()
                .subscribe((res) => {
                  if (res) {
                    this.headerService.setHeaderValueChanged(true);
                    window.location.reload();
                  }
                });
              }            
            }
          )
      );
    }
  }

  /**
   * @description  Enables wire transfer for the selected bank account.
   */
  enableWire() {
    const cardFormBody = this.paymentForm.value;
    const enableWireBody = cardFormBody.payeeBankAc;
    enableWireBody.id = enableWireBody.encrypted_id;
    this.addNewBankAccount(true, enableWireBody);
  }

  /**
   * @description Open modal for adding attachment and gives the added data when its closed
   */

  openAddAttachment() {
    if (this.isBillCheck && this.bills && this.bills.length > 0) {
      // Use the same modal as bank-ac-check for bill attachments
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
   * @description Open modal for adding comments and gives the added data when its closed
   */

  openAddComment() {
    if (this.isBillCheck && this.bills && this.bills.length > 0) {
      // Use the same modal as bank-ac-check for bill comments
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
    const remitanceData = this.paymentsService.createRemitanceData(
      amount,
      this.insertFromRemittance || this.hasRemitance,
      this.paymentConfig.mode === 'EDIT'
    );
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
                  this.isWireAllowed = true;
                  const bankAccount = this.payeeDetails?.bank_accounts.filter(
                    (account) => account.encrypted_id === datas?.encrypted_id
                  )[0];
                  if (bankAccount) {
                    bankAccount.is_allow_wire = 1;
                  }
                  this.paymentForm.controls.payeeBankAc.setValue(bankAccount);
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

  openCategoryModal(): void {
    const dialogRef = this.dialog.open(CategoryAddModalComponent, {
      maxWidth: '500px',
      width: '93%'
    });

    this.subscriptions.push(
      dialogRef.afterClosed().subscribe((res) => {
        if (res?.success) {
          this.sharedService.setNewCategoryCreatedData({ categoryId: res.id });
          this.paymentForm.controls.category.setValue(res);
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
                  this.paymentForm.controls.payeeBankAc.setValue(
                    newPayeeBankAc
                  );
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
    const selectedBankAcc = this.paymentForm.controls.payeeBankAc.value;
    this.subscriptions.push(
      this.payeeService.getPayeeBankData(payeeId).subscribe((res) => {
        if (res.success) {
          this.payeeBankDetails = res.data;
          this.selectedPayeeBankData = `${
            selectedBankAcc.bank_name
          } - ${this.utils.getMaskedAcNo(
            String(selectedBankAcc.account_number)
          )}`;
          this.editBankName = this.selectedPayeeBankData;
        }
      })
    );
  }

  newPayeeAdd(event: IPayeeDropdown) {
    this.payeeSelect(event, false);
  }

  addCardEvent(event: IExistingCreditCards) {
    this.paymentForm.controls.card.setValue(event);
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
          this.paymentForm.controls.category.setValue(res?.data);
          this.categoryId.set(res?.data?.id);
          if (this.categorySetWithIdFunction) {
            this.categorySetWithIdFunction(res?.data?.id);
          }
        } else {
          this.paymentForm.controls.category.setValue(null);
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
    this.paymentsService.currentPaymentMehtod.set('CC_WIRE');
  }
}

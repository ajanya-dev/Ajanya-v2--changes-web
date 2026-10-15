import { IExistingCreditCards } from 'src/app/models/payment-switch-board';
import {
  Component,
  OnInit,
  inject,
  OnDestroy,
  Output,
  EventEmitter,
  Input,
  OnChanges,
  SimpleChanges,
  input,
  Renderer2,
  signal,
  ViewChild
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
import {
  IPayeeDetailsEvent,
  IPayeeDropdown,
  IPayeeEditedData,
  IPayeeView,
  IPayeeViewInfo
} from 'src/app/modules/payee/payee-v2/model/payee';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CVSourceType } from 'src/app/modules/common-verification/model/common-verification';
import { ICategoryDropdown } from 'src/app/modules/category/model/category';
import { CategoryAddModalComponent } from 'src/app/shared/modal/category-modal/category-add-modal/category-add-modal.component';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { DatePipe, NgClass } from '@angular/common';
import { IAttachmentItem, IV3DropDownOnReady } from 'src/app/models/common';
import { IComments } from 'src/app/data/data/cloud-quick-pay';
import {
  ICardPaymentReqDocRes,
  IPaymentConfig,
  IUpdatePaymentBody,
  TPaymentProcessingContext
} from 'src/app/modules/payments/model/payments';
// import { ScriptService } from 'src/app/core/services/script.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { IShippingTypes } from 'src/app/modules/business-tools/plexe/model/plexe';
import { MatSelectModule } from '@angular/material/select';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { BillService } from 'src/app/shared/service/Bill/bill.service';
import { MatBadge } from '@angular/material/badge';
import { MatTooltip } from '@angular/material/tooltip';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { CommonOnInitService } from 'src/app/shared/service/common-onInit/common-on-init.service';
import { ClickTrackingService } from 'src/app/shared/service/click-tracking/click-tracking.service';
// import { IndustryTypesDropdownComponent } from 'src/app/shared/components/v3/drop-downs/industry-types-dropdown/industry-types-dropdown.component';
import { faClockRotateLeft } from '@fortawesome/pro-regular-svg-icons';
import { PayeeDataV35Service } from 'src/app/modules/payee/payee-v3/v35-services/payee-data-v35.service';
import { PayeeModalService } from 'src/app/shared/service/payee-modal/payee-modal.service';
import { PersonaHelperService } from 'src/app/shared/persona-v4/service/persona-helper.service';
import { environment } from 'src/environments/environment';
import {
  ThreeDSComplete,
  ThreeDsInstance
} from 'src/app/modules/cards/components/v35/models/cards-ocw-v35.interface';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { CardPaymentService } from 'src/app/shared/service/card-payment/card-payment.service';
import { OtpModalComponent } from 'src/app/modules/cloud-bank/cloud-bank-v2/modals/otp-modal/otp-modal.component';
import {
  faCircleQuestion
} from '@fortawesome/pro-solid-svg-icons';
import { CommonButtonV35Component } from '../../../../../../shared/v3/buttons/common-button-v35/common-button-v35.component';
import { CategoryDropdownV3Component } from '../../../../../../shared/components/v3/drop-downs/category-dropdown-v3/category-dropdown-v3.component';
import { PayeeDropdownV3Component } from '../../../../../../shared/components/v3/drop-downs/payee-dropdown-v3/payee-dropdown-v3.component';
import { CardsDropdownV3Component } from '../../../../../../shared/components/v3/drop-downs/cards-dropdown-v3/cards-dropdown-v3.component';
import { V35ControlMessageComponent } from '../../../../../../shared/v3/control-message-v35/control-message-v35.component';
import { AmountInputComponent } from '../../../../../../shared/components/amount-input/amount-input.component';
import { CardTransactionDocsPreviewModalComponent } from '../../../modal/card-transaction-docs-preview-modal/card-transaction-docs-preview-modal.component';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { CheckAddAttachmentCommonModalComponent } from 'src/app/modules/check/modal/check-activity-modals/check-add-attachment-common-modal/check-add-attachment-common-modal.component';
import { AddCommentsModalComponent } from 'src/app/shared/modal/comments-modal/add-comments-modal/add-comments-modal.component';
import { CybersourceService } from 'src/app/shared/service/cybersource/cybersource.service';

export interface IPostData {
  access_key: string;
  profile_id: string;
  transaction_uuid: string;
  signed_field_names: string;
  unsigned_field_names: string;
  signed_date_time: string;
  locale: string;
  transaction_type: string;
  reference_number: number;
  amount: number;
  currency: string;
  consumer_id: string;
  customer_ip_address: string;
  merchant_defined_data5: string;
  payment_token: string;
  allow_payment_token_update: boolean;
  signature: string;
  id: string;
  serviceFee: number;
}

/**
 * @description This component handles the card to check payment functionality.
 */
@Component({
  selector: 'app-card-check-v3',
  templateUrl: './card-check-v3.component.html',
  styleUrls: ['./card-check-v3.component.scss'],
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
    CategoryDropdownV3Component,
    MatTooltip,
    MatBadge,
    CommonButtonV35Component,
    // IndustryTypesDropdownComponent,
    MatSelectModule
  ]
})
export class CardCheckV3Component implements OnInit, OnDestroy, OnChanges {
  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() success = new EventEmitter();
  @Output() payeeDetailsEvents = new EventEmitter<IPayeeDetailsEvent | false>();
  @Output() calculateFee = new EventEmitter();
  @Input() changedInfo: IPayeeEditedData | undefined;
  @Input() paymentConfig: IPaymentConfig;
  @Input() isCurrentPaymentDisabled: false | string = false;
  @Output() openPersona = new EventEmitter<boolean>(false);
  @Output() verifyEmail = new EventEmitter<boolean>(false);
  @Output() newPaymentClick = new EventEmitter<void>();

  userVerified = input<boolean>(false);
  kycStatus = input<number | undefined>(undefined);

  private alertService = inject(AlertService);
  private router = inject(Router);
  paymentsService = inject(PaymentsService);
  sharedService = inject(SharedService);
  datePipe = inject(DatePipe);
  dialog = inject(MatDialog);
  // private scriptService = inject(ScriptService);
  private localStorageService = inject(LocalStorageService);
  private payeeService = inject(PayeeService);
  private billService = inject(BillService);
  private commonService = inject(CommonOnInitService);
  private activatedRoute = inject(ActivatedRoute);
  private clickTrackingService = inject(ClickTrackingService);
  private payeeModalService = inject(PayeeModalService);
  private cardPaymentService = inject(CardPaymentService);
  private renderer = inject(Renderer2);
  private headerService = inject(HeaderService);
  public payeeDataService = inject(PayeeDataV35Service);
  private validationService = inject(ValidationService);
  private personaHelperService = inject(PersonaHelperService);
  private checkService = inject(CheckService);
  public cyberSourceService = inject(CybersourceService);

  dateToday = this.datePipe.transform(new Date(), 'yyyy-MM-dd');

  subscriptions: Subscription[] = [];
  transactionId: string;
  cardList: IExistingCreditCards[] = [];
  paymentForm: FormGroup;
  loading = false;
  payeeAddressLoading = false;
  selectedCard: IExistingCreditCards;
  cardAuthorization = false;
  isEditPayee = false;
  payeeDetails: IPayeeView;
  selectedPayeeDetails: IPayeeDropdown;
  paymentProcessingContext: string;
  readonly paymentMode = '8';
  remitanceTotal: number;
  newRemittanceFormat: boolean;
  hasRemittance = false;
  attachmentCount: number;
  commentsCount: number;
  createdExistingAttachments: IAttachmentItem[] = [];
  createdExistingComments: IComments[] = [];
  // Bill-related properties
  bills: string[] = [];
  isBillCheck: boolean = false;
  thirdPartyProviderType: number;
  encId: string;
  insertFromRemittance = false;
  savedPaymentId: string | undefined;
  amountInputDisabled = false;

  shippingTypeList: IShippingTypes[] = [];
  formattedShippingTypeList: any[] = [];
  shippingTypes = {
    FEDEX_NEXT_DAY_PM: 'FedEx Next Day PM',
    USPS_PRIORITY_MAIL: 'USPS Priority Mail',
    USPS_FIRST_CLASS_MAIL: 'USPS First-Class Mail',
    USPS_FIRST_CLASS_WITH_TRACKING: 'USPS First-Class Mail® with Tracking',
    USPS_EXPRESS_MAIL: 'USPS Express Mail'
  };

  faHistory = faClockRotateLeft;
  faCircleQuestion=faCircleQuestion;

  purposeOfPaymentControl = new FormControl('', [Validators.required]);
  purposeOfPaymentOptions = signal<string[]>([]);

  proccessed = false;
  categorySetWithIdFunction: ((id: string) => void) | undefined;
  categoryId = signal<string | undefined>(undefined);

  threeDSInstance: ThreeDsInstance | null = null;
  uploadedDocs: ICardPaymentReqDocRes;
  signatureUrl:string;
  sessionKey: string;
  emailSessionKey: string;
  phoneSessionKey: string;
  isBanned = false;
  public environment = environment;
  gatewayType: number | undefined;
  userPlugins = this.localStorageService.getItem('userPlugins');

  @ViewChild(CardsDropdownV3Component)
  cardsDropdownV3Component: CardsDropdownV3Component;

  ngOnInit(): void {
    this.initForm();
    this.getCount();
    this.billFetch();
    this.paymentsService.currentPaymentMehtod.set('CC_CHECK');
    this.getShippingTypes();
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
          this.syncPurposeDropdown(memo as string);
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
            this.syncPurposeDropdown(this.paymentConfig?.memo || paymentFormValue?.memo);
          }
        }, 0);
      }
    }
    
    if (changes?.changedInfo) {
      if (this.changedInfo?.selectedPayeeDetails?.id) {
        this.getPayeeDetails(this.changedInfo?.selectedPayeeDetails?.id, true);
        this.paymentForm.controls.payeeEmail.setValue(
          this.changedInfo?.selectedPayeeDetails?.email
        );
      }
    }
  }

  /**
   * @description This function creates form controls for the payment form, sets up validators for each control, and subscribes to the changes in the "payee" control.
   */
  initForm() {
    this.paymentForm = new FormGroup({
      card: new FormControl('', [Validators.required]),
      payee: new FormControl(null, [Validators.required]),
      amount: new FormControl('', [
        Validators.required,
        Validators.min(environment.isItDev ? 0.01 : 10),
        Validators.maxLength(9)
      ]),
      invoiceNumber: new FormControl('', [Validators.required]),
      memo: new FormControl('', [Validators.required, ValidationService.alphabetsAndSpacesValidator,Validators.maxLength(26)]),
      payeeEmail: new FormControl('', [
        Validators.required,
        ValidationService.emailValidator,
        this.validationService.validateDifferentEmail()
      ]),
      address1: new FormControl('', [Validators.required]),
      address2: new FormControl(''),
      city: new FormControl('', [Validators.required]),
      state: new FormControl('', [Validators.required]),
      country: new FormControl('', [Validators.required]),
      payeePhone: new FormControl(''),
      zip: new FormControl('', [Validators.required]),
      category: new FormControl(null),
      payeeIdNumber: new FormControl('', [Validators.maxLength(30)]) as FormControl,
      shippingType: new FormControl<string | null>(null, Validators.required),
      // industryType: new FormControl(null, Validators.required)
      // Bill-related form controls
      commentIds: new FormControl([]),
      attachmentIds: new FormControl([]),
      chequeInvoiceNumber: new FormControl(null)
    });
    this.subscriptions.push(
      this.paymentForm.controls.payee.valueChanges.subscribe((payee) => {
        if (payee && payee?.id) {
          this.selectedPayeeDetails = payee;
          this.getPayeeDetails(payee.id, false,);
        }
      }),
      this.paymentForm.controls.amount.valueChanges.subscribe((val) => {
        this.paymentsService.hasAmount.update(() => Boolean(val));
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
      })
    );
    this.getAmountChanges();
    this.getShippingTypeChanges();
    this.setCommonFormValues();
  }

  getAmountChanges(): void {
    this.subscriptions.push(
      this.paymentForm.controls.amount.valueChanges
        .pipe(debounceTime(1500))
        .subscribe((val) => {
          const amount = Number(val);
          if (this.paymentForm.controls.shippingType.value) {
            this.calculateFee.emit({
              amount,
              mode: Number(this.paymentMode),
              fee1Label: 'Pass-through processing fee',
              fee2Label: 'Mail',
              shippingType: this.paymentForm.controls.shippingType.value
            });
          }
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
  }

  getShippingTypeChanges(): void {
    this.subscriptions.push(
      this.paymentForm.controls.shippingType.valueChanges
        .pipe(debounceTime(1500))
        .subscribe((val) => {
          const amount = Number(this.paymentForm.controls.amount.value);
          if (amount > 0 && val) {
            this.calculateFee.emit({
              amount,
              mode: Number(this.paymentMode),
              fee1Label: 'Pass-through processing fee',
              fee2Label: 'Mail',
              shippingType: val
            });
          }
        })
    );
  }

  getShippingTypes() {
    this.subscriptions.push(
      this.sharedService.getWalletShippingTypes().subscribe((response) => {
        this.shippingTypeList = response.data.map((item: IShippingTypes) => ({
          ...item,
          cost: parseFloat(item.cost).toFixed(2)
        }));

        this.formattedShippingTypeList = this.shippingTypeList.map(
          (item: any) => {
            const code = item.carrier_code as keyof typeof this.shippingTypes;
            const formattedName = this.shippingTypes[code] || item.name;
            return {
              ...item,
              displayName: formattedName
            };
          }
        );
      })
    );
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
    this.paymentForm.valueChanges.subscribe((formValueChanges) => {
      this.paymentConfig.paymentFormValue = {
        ...this.paymentConfig.paymentFormValue,
        ...formValueChanges
      };
    });

    if (this.paymentConfig.mode === 'CLONE') {
      this.paymentForm.controls.invoiceNumber.setValue(null);
    }
    this.paymentForm.controls.shippingType.setValue(null);
  }

  getPurposeOfPayment() {
    this.paymentsService.getPurposeOfPayment((options) => {
      this.purposeOfPaymentOptions.set(options);
      this.syncPurposeDropdown(this.paymentConfig?.memo || this.paymentConfig?.paymentFormValue?.memo);
    });
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

  syncPurposeDropdown(memoValue: string | undefined): void {
    if (!memoValue || !this.purposeOfPaymentOptions().length) return;
    if (this.purposeOfPaymentOptions().includes(memoValue)) {
      this.purposeOfPaymentControl.setValue(memoValue);
    } else {
      this.purposeOfPaymentControl.setValue('Other');
    }
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

  /**
   * @description This function is triggered when a card is selected from the dropdown.
   * @param card -The selected card details from the card dropdown component.
   */
  selectCard(card: IExistingCreditCards) {
    this.paymentForm.controls.card.setValue(card);
    this.paymentForm.controls.card.markAsTouched();
    this.selectedCard = card;
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
    this.selectedPayeeDetails = payee;
    this.paymentForm.controls.payeeEmail.setValue(payee?.email);
    if (payee) {
      if (fromTemplate === false) {
        this.paymentForm.controls.payee.setValue(payee);
      }
      this.paymentForm.controls.payeeIdNumber.setValue(
        payee?.payeeIdNumber ?? null
      );
      this.selectedPayeeDetails = payee;
      this.payeeDetailsEvents.emit({
        payeeDropdownDetails: payee,
        isMoreDetailsLoading: true
      });
      this.getPayeeDetails(payee.id, false, 'card_rail');
      // this.paymentForm.controls.industryType.setValue(payee?.merchantCategory);
      const payeeData = this.paymentForm.controls?.payee?.value;
      if(!payeeData?.company || !payeeData?.addressLine1 || !payeeData?.city || !payeeData?.state || !payeeData?.zip || !payeeData?.country) {
      this.paymentsService.checkAndHandleMissingPayeeInfo(payeeData);
      }
    }
  }

  /**
   * @description This function is called to clear the selected payee and associated details in the payment form.
   */
  removePayee() {
    this.paymentForm.controls.payee.setValue('');
    this.paymentForm.controls.payeeEmail.setValue('');
    this.paymentForm.controls.payee.reset();
    this.paymentForm.controls.payeeIdNumber.setValue(null);
    this.payeeDetailsEvents.emit({
      payeeDropdownDetails: undefined,
      isMoreDetailsLoading: false
    });
    // this.paymentForm.controls.industryType.setValue(null);
  }

  /**
   * @description  Submits the payment based on the provided payment processing context.
   * @param paymentProcessingContext -The payment processing context determines the action to be taken.
   *
   */
  async submitPayment(paymentProcessingContext: TPaymentProcessingContext) {
    if(this.paymentsService.checkForComplianceFreeze()){
      this.paymentsService.openComplianceFreezeModal();
      return;
    }
    this.paymentProcessingContext = paymentProcessingContext;
    this.removeTrailingSpacesInForm();
    this.purposeOfPaymentControl.markAsTouched();

    const payeeData = this.paymentForm.controls?.payee?.value;

    if (!payeeData?.company) {
      const isCompanyMissing =
        this.paymentsService.checkAndHandleMissingPayeeInfo(payeeData);
      if (isCompanyMissing) {
        return;
      }
    } else {
      const isAddressMissing = this.paymentsService.checkAndHandleMissingAddress(payeeData);
      if (isAddressMissing) {
        return;
      }
    }

    if (this.paymentForm.invalid || Number(this.paymentForm.value?.amount) < (environment.isItDev ? 0.01 : 10)) {
      this.paymentForm.markAllAsTouched();
      return;
    }
    // if (this.purposeOfPaymentControl.value === 'Other' && !this.paymentForm.controls.memo.value) {
    //   this.paymentForm.controls.memo.markAsTouched();
    //   return;
    // }

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

    switch (paymentProcessingContext) {
      case 'pay':
        this.managePayment('COMPLETE-TRANSACTION');
        break;
      case 'updateAndPay':
        this.updatePayment(true);
        break;
      case 'save':
        this.savePayment(false);
        break;
      case 'update':
        this.updatePayment();
        break;
      default:
        break;
    }
  }

  hasValidAddress() {
    const keys = ['address1', 'city', 'state', 'country', 'zip'];
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
      'card',
      'payee',
      'amount',
      'invoiceNumber',
      'memo',
      'payeeEmail',
      'payeeIdNumber'
    ];
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
    const paymentLimit = this.paymentsService?.paymentLimit?.checkMailSend;
    const shippingType = this.paymentForm.controls.shippingType.value;
    if (parseFloat(amount) > parseFloat(paymentLimit)) {
      this.alertService.failedAlert({
        content: `Maximum send limit for Check Mail is $${paymentLimit} reached. Please contact customer support.`
      });
      this.loading = false;
      this.paymentsService.isPaymentProcessingSubject.next(false);
      return;
    }

    if (!card || !amount) return;

    const headerData = this.headerService._headerData.getValue();
    let threeDSRes: undefined | ThreeDSComplete;

    if (headerData && headerData.allow_three_ds_testing === 1) {
      this.loading = true;
      const res = await this.cardPaymentService.validateCardWith3ds(
        card,
        amount,
        headerData.nmi_gatewayjs_checkout_key,
        this.renderer,
        (instance) => {
          this.threeDSInstance = instance;
        },
        () => {
          this.cardPaymentService.hasThreeDsChallenge.set(true);
        }
      );
      this.loading = false;
      this.cardPaymentService.hasThreeDsChallenge.set(false);

      if (res.instance) {
        res.instance.unmount();
        this.threeDSInstance = null;
      }

      if (!res.success) {
        this.alertService.failedAlert({
          content:
            res.message || 'Something went wrong while verifying your card'
        });
        return;
      }

      threeDSRes = res.data ?? undefined;
    }

    const body = {
      cardId: card?.cardId ?? '',
      amount: amount ?? '',
      paymentType: 'rail',
      shippingType: shippingType as string
    };

    const dialogRef = this.paymentsService.openPaymentConfirmationModal({
      accNumber: this.paymentConfig?.paymentFormValue?.card?.cardMasked,
      bankName: this.paymentConfig?.paymentFormValue?.card?.nickName,
      payeeName: this.selectedPayeeDetails.name,
      paymentMethod:'Check Mail',
      amount: Number(body.amount).toFixed(2),
      type: 'card',
      shippingType: body.shippingType 
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res) {
        this.loading = true;
        this.paymentsService.isPaymentProcessingSubject.next(true);
        this.subscriptions.push(
          this.paymentsService
            .getRequiredDocumentsDetails(body)
            .pipe(
              finalize(() => {
                this.loading = false;
                this.paymentsService.isPaymentProcessingSubject.next(false);
              })
            )
            .subscribe({
              next: (res) => {
                if (res.success) {
                  const invoiceRequired =
                    res.data.required_docs.includes('invoice');
                  const cardRequired = res.data.required_docs.includes('card');
                  if (cardRequired || invoiceRequired) {
                    if (card) {
                      const dialogRef =
                        this.commonService.openVerifyCardInvoiceModal(
                          card,
                          amount,
                          mode,
                          invoiceNumber,
                          res.data.required_docs,
                          this.selectedPayeeDetails
                        );
                      dialogRef.afterClosed().subscribe((data) => {
                        if (data?.success) {
                          this.uploadedDocs = data?.data;
                          this.signatureUrl = data?.authSign as string;
                          if (shouldGoTo === 'COMPLETE-TRANSACTION') {
                            this.savePayment(true, data?.data, threeDSRes);
                          } else {
                            this.completeTransactionUsingZilPaymentApi(
                              data?.data,
                              threeDSRes
                            );
                          }
                        } else if (data?.success === false) {
                          this.alertService.failedAlert({
                            content:
                              "Sorry.! Couldn't verify your documents, Please Verify all the documents to make a payment"
                          });
                        }
                      });
                    }
                  } else if (shouldGoTo === 'COMPLETE-TRANSACTION') {
                    this.savePayment(true, undefined, threeDSRes);
                  } else {
                    this.completeTransactionUsingZilPaymentApi(
                      undefined,
                      threeDSRes
                    );
                  }
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
                        // this.managePayment(shouldGoTo);
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
   * @description Creates and returns the payment body for saving a payment.
   * This function retrieves the necessary values from the payment form and formats them into the desired structure.
   * @returns -The payment body for saving a payment.
   */
  createSavePaymentBody(isAgree=0): IUpdatePaymentBody {
    const paymentFormBody = this.paymentForm.value;

    return {
      transferType: 'checkMail',
      amount: Number(paymentFormBody.amount),
      category: paymentFormBody.category?.id,
      description: paymentFormBody.memo ?? '',
      payee: paymentFormBody.payee?.id,
      paymentDueDate: this.dateToday ?? undefined,
      referenceNo: paymentFormBody.invoiceNumber,
      sourceId: paymentFormBody.card?.cardId,
      sourceType: 'card',
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
      payeeEmail: paymentFormBody.payeeEmail,
      shippingType: paymentFormBody.shippingType as string,
      bills: this.billService.billId() ?? []
    };
  }

  /**
   * @description Saves the payment information without initiating the payment.
   */
  savePayment(
    fromPay: boolean,
    data?: ICardPaymentReqDocRes,
    threeDsData?: ThreeDSComplete,
    isAgree?:number
  ) {
    const sendingData = this.createSavePaymentBody(isAgree);
    this.loading = true;
    this.paymentsService.isPaymentProcessingSubject.next(true);
    if (this.paymentForm.value?.amount < (environment.isItDev ? 0.01 : 10)) {
      this.alertService.failedAlert({
        title: 'Failed',
        content: 'Minimum transaction amount should be $' + (environment.isItDev ? '0.01' : '10.00')
      });
      this.loading = false;
      this.paymentsService.isPaymentProcessingSubject.next(false);
    } else {
      this.subscriptions.push(
        this.paymentsService.savePayment(sendingData).subscribe({
          next: (res) => {
            this.loading = false;
            this.paymentsService.isPaymentProcessingSubject.next(false);

            // Track when the credit card promoting toast is clicked and the payment is done.
            this.clickTrackingService
              .ccToastClickedPaymentDone(res.data?.id)
              ?.pipe(take(1))
              ?.subscribe();

            if (res.success) {
              if (!fromPay) {
                this.success.emit({
                  title: 'Your Payment is Saved',
                  content:
                    'Your payment has been saved. Please check the status in your records.'
                });
              } else {
                this.savedPaymentId = res.data.id;
                this.completeTransactionUsingZilPaymentApi(data, threeDsData);
              }
            }
          },
          error: (err) => {
            this.loading = false;
            this.paymentsService.isPaymentProcessingSubject.next(false);
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
                  this.savePayment(true,this.uploadedDocs);
                }
              });
            }
            if (err.error.errorCode === '808') {
              const card = this.paymentForm.controls.card.value;
              const modalData = {
                amount:this.paymentForm.controls.amount.value,
                invoiceNumber:this.paymentForm.controls.invoiceNumber.value,
                memo:this.paymentForm.controls.memo.value,
                authSign: this.signatureUrl,
                cardId: card?.cardId ?? '',
                payee_phone:'',
                mode:this.paymentMode,
                email_otp_session_key:this.emailSessionKey,
                phone_otp_session_key:this.phoneSessionKey,
                payees:[
                  {
                    id:this.selectedPayeeDetails?.id,
                    memo:this.paymentForm.controls.memo.value,
                    amount:this.paymentForm.controls.amount.value,
                    invoiceNumber:this.paymentForm.controls.invoiceNumber.value,
                    email:this.selectedPayeeDetails?.email,
                    phone:this.selectedPayeeDetails?.phone,
                  }
                ]
              };
              const dialog = this.dialog.open(CardTransactionDocsPreviewModalComponent, {
                maxWidth: '750px',
                width: '100%',
                disableClose: true,
                autoFocus: false,
                data: modalData
              });
              dialog.afterClosed().subscribe((result) => {
                if (result) {
                  this.savePayment(true,this.uploadedDocs,undefined,1);
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
        })
      );
    }
  }

  /**
   * @description Updates the payment details
   * @param payAfterUpdate -Indicates whether to process the payment after updating.If true the payment will be processed and updated.
   */
  updatePayment(payAfterUpdate?: boolean) {
    if (this.paymentConfig.paymentDetails?.id) {
      if (this.paymentForm.value?.amount < (environment.isItDev ? 0.01 : 10)) {
        this.alertService.failedAlert({
          title: 'Failed',
          content: 'Minimum transaction amount should be $' + (environment.isItDev ? '0.01' : '10.00')
        });
        this.loading = false;
        this.paymentsService.isPaymentProcessingSubject.next(false);
      } else {
        const sendingData = this.createSavePaymentBody();
        this.loading = true;
        this.paymentsService.isPaymentProcessingSubject.next(true);
        this.subscriptions.push(
          this.paymentsService
            .updatePayment(this.paymentConfig.paymentDetails?.id, sendingData)
            .subscribe({
              next: (res) => {
                if (res.success) {
                  if (payAfterUpdate) {
                    this.managePayment('COMPLETE-TRANSACTION-WITH-ZIL');
                  } else {
                    this.success.emit({
                      title: 'Your Payment has been Updated',
                      content:
                        'Your payment has been Updated. Please check the status in your records.'
                    });
                    this.loading = false;
                    this.paymentsService.isPaymentProcessingSubject.next(false);
                  }
                } else {
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
    } else {
      this.loading = false;
      this.paymentsService.isPaymentProcessingSubject.next(false);
    }
  }

  /**
   * @description Complete transaction function for card payment with Zil payments api.
   * @param documents - Optional parameter. its possible that is there might be documents details, and there might not be. so its optional.
   * if there is documents details, we simply pass it backend, else it will be undefined.
   */
  completeTransactionUsingZilPaymentApi(
    documents?: ICardPaymentReqDocRes,
    threeDsData?: ThreeDSComplete,
    isAgree = 0
  ) {
    if (this.paymentConfig.paymentDetails?.id || this.savedPaymentId) {
      const id =
        this.paymentConfig.paymentDetails?.id ??
        (this.savedPaymentId as string);
      const sendingData: {
        payee_bank_account_id: string;
        payee_email: string | undefined;
        documents: ICardPaymentReqDocRes | undefined;
        three_ds_data?: ThreeDSComplete;
        bills: string[];
        email_otp_session_key:string;
        phone_otp_session_key:string;
        otp_and_docs_preview_section_in_credit_card:number;
        otp_type:string;
        document_preview_agree:number;
        category:string;
      } = {
        payee_bank_account_id: this.paymentForm.value.payeeBankAc?.encrypted_id,
        payee_email: this.paymentForm.value.payeeEmail ?? undefined,
        documents,
        three_ds_data: threeDsData,
        bills: [],
        email_otp_session_key:this.emailSessionKey,
        phone_otp_session_key:this.phoneSessionKey,
        otp_and_docs_preview_section_in_credit_card:1,
        otp_type:this.emailSessionKey ? 'phone': 'email',
        document_preview_agree:isAgree,
        category: this.paymentForm.value.category?.id ?? ''
      };
      sendingData.bills = this.billService.billId() ?? [];
      this.loading = true;
      this.checkService.activeMailPayeeId = this.selectedPayeeDetails?.id ?? null;
      this.paymentsService.isPaymentProcessingSubject.next(true);
      this.subscriptions.push(
        this.paymentsService
          .processCardPayment(id, sendingData)
          .pipe(
            finalize(() => {
              this.loading = false;
              this.paymentsService.isPaymentProcessingSubject.next(false);
              this.paymentsService.replaceIdempotencyKey();
            })
          )
          .subscribe({
            next: (res) => {
              this.loading = false;
              this.paymentsService.isPaymentProcessingSubject.next(false);
              if (res.success) {
                this.success.emit(true);
                // this.scriptService.trackMatomoEvent(
                //   'Creditcard',
                //   'CreditcardUser',
                //   'CreditcardUser',
                //   this.localStorageService.getItem('userId')
                // );
                this.billService.billId.set(undefined);
              }
            },
           error: (err) => {
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
                    this.completeTransactionUsingZilPaymentApi(this.uploadedDocs);
                  }
                });
              }
              if (err.error.errorCode === '808') {
                const payees = [
                  {
                    id:this.selectedPayeeDetails?.id,
                    memo:this.paymentForm.controls.memo.value,
                    amount:this.paymentForm.controls.amount.value,
                    invoiceNumber:this.paymentForm.controls.invoiceNumber.value,
                    email:this.selectedPayeeDetails?.email,
                    phone:this.selectedPayeeDetails?.phone,
                  }
                ];
                const card = this.paymentForm.controls.card.value;
                const dialog = this.dialog.open(CardTransactionDocsPreviewModalComponent, {
                  maxWidth: '750px',
                  width: '100%',
                  disableClose: true,
                  autoFocus: false,
                  data: {...sendingData,authSign:this.signatureUrl,zil_payment_uuid:this.paymentConfig.paymentDetails?.id,payees,amount:this.paymentForm.controls.amount.value,cardId: card?.cardId ?? '',mode:this.paymentMode}
                });
                dialog.afterClosed().subscribe((result) => {
                  if (result) {
                    this.completeTransactionUsingZilPaymentApi(this.uploadedDocs,undefined,1);
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
          })
      );
    }
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

  catagoryDropDownChange(event: ICategoryDropdown): void {
    if (event === undefined) {
      this.paymentForm.controls.category.setValue(null);
    } else {
      this.paymentForm.controls.category.setValue(event);
    }
  }

  openCategoryModal(): void {
    const dialogRef = this.dialog.open(CategoryAddModalComponent, {
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

  onSuccess() {
    this.success.emit({
      title: 'Payment Success',
      content:
        'Your payment is initiated, Please check the status in your records'
    });
  }

  onError(errorCode: number, errorMsg: string): void {
    if (errorCode === 351 || errorCode === 101) {
      const action = this.alertService.warningAlert({ content: errorMsg });
      action.afterClosed().subscribe((res) => {
        if (res) {
          this.router.navigate(['manage/common-verification'], {
            queryParams: { type: CVSourceType.other }
          });
        }
      });
    }
  }

  /**
   * @description This function is used to fetch additional details of the selected payee based on the provided payee ID.
   * @param payeeId -The ID of the selected payee.
   */
  getPayeeDetails(payeeId: string, fromApi?: boolean, type?: string): void {
    this.payeeAddressLoading = true;
    this.subscriptions.push(
      this.paymentsService
        .getPayeeDetails(payeeId, fromApi, type)
        .pipe(
          finalize(() => {
            this.payeeAddressLoading = false;
          })
        )
        .subscribe((res) => {
          this.payeeDetails = res;
          this.getPayeeCategory(payeeId);
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
            // this.paymentForm.controls.industryType.setValue(
            //   res.payee_information.merchant_category
            // );
          }
        })
    );
  }

  showBannedMessage() {
    this.isBanned = true;
    this.paymentForm.controls.payee.reset();
    this.paymentForm.controls.payeeEmail.setValue('');
    this.paymentForm.controls.payeeIdNumber.setValue(null);
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
                  this.selectedPayeeDetails.email = result?.email;
                  this.getPayeeDetails(
                    this.selectedPayeeDetails?.encryptedId || ''
                  );
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

  addCardEvent(event: IExistingCreditCards) {
    this.selectCard(event);
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

  selectionChange(event: number) {
    // this.paymentForm.controls.industryType.setValue(event);
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
    this.threeDSInstance && this.threeDSInstance.unmount();
    this.subscriptions.forEach((el) => el.unsubscribe());
    this.paymentsService.remittanceData = undefined;
    this.paymentsService.hasAmount.update(() => false);
    this.paymentsService.currentPaymentMehtod.set(undefined);
    this.paymentForm.controls.shippingType.setValue(null);
  }
}

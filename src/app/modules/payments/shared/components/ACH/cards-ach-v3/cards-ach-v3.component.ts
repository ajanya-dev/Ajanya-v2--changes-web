import { DatePipe, NgClass } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  Renderer2,
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
import { Subscription, debounceTime, firstValueFrom } from 'rxjs';
import { finalize, take } from 'rxjs/operators';
import { Utils } from 'src/app/data/utils';
import { ICategoryDropdown } from 'src/app/modules/category/model/category';
import {
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
  IPaymentConfig,
  IUpdatePaymentBody,
  TPaymentProcessingContext,
  IPaymentSuccessData,
  ICardPaymentReqDocRes,
  IPaymentBody,
  ThreeDSPayload
} from 'src/app/modules/payments/model/payments';
import { CategoryAddModalComponent } from 'src/app/shared/modal/category-modal/category-add-modal/category-add-modal.component';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { CybersourceService } from 'src/app/shared/service/cybersource/cybersource.service';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { DropDownCardComponent } from 'src/app/shared/components/drop-downs/drop-down-card/drop-down-card.component';

import { IAttachmentItem, IV3DropDownOnReady } from 'src/app/models/common';
import { IComments } from 'src/app/data/data/cloud-quick-pay';
import { IRemittanceDetails } from 'src/app/models/bank';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { DropDownPayeeBankComponent } from 'src/app/shared/components/drop-downs/drop-down-payee-bank/drop-down-payee-bank.component';
// import { ScriptService } from 'src/app/core/services/script.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { BillService } from 'src/app/shared/service/Bill/bill.service';
import { ActivatedRoute, Router } from '@angular/router';
import { MatBadge } from '@angular/material/badge';
import { MatTooltip } from '@angular/material/tooltip';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { CommonOnInitService } from 'src/app/shared/service/common-onInit/common-on-init.service';
import { ClickTrackingService } from 'src/app/shared/service/click-tracking/click-tracking.service';
import { PayeeDataV35Service } from 'src/app/modules/payee/payee-v3/v35-services/payee-data-v35.service';
import { faClockRotateLeft } from '@fortawesome/pro-regular-svg-icons';
import { BankModalService } from 'src/app/shared/bank-modal/service/bank-modal.service';
import {
  faCircleInfo,
  faCircleQuestion
} from '@fortawesome/pro-solid-svg-icons';
import { environment } from 'src/environments/environment';
import { PersonaHelperService } from 'src/app/shared/persona-v4/service/persona-helper.service';
import { CVSourceType } from 'src/app/modules/common-verification/model/common-verification';
// import { IndustryTypesDropdownComponent } from 'src/app/shared/components/v3/drop-downs/industry-types-dropdown/industry-types-dropdown.component';
import { Store } from '@ngrx/store';
import { payeesActions } from 'src/app/modules/store/payees/payees.actions';
import { OtpModalComponent } from 'src/app/modules/cloud-bank/cloud-bank-v2/modals/otp-modal/otp-modal.component';
import { NewPhoneInputComponent } from 'src/app/shared/components/new-phone-input/new-phone-input.component';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import {
  ThreeDSComplete,
  ThreeDsInstance
} from 'src/app/modules/cards/components/v35/models/cards-ocw-v35.interface';
import { CardPaymentService } from 'src/app/shared/service/card-payment/card-payment.service';
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

interface ICardsForm {
  amount: FormControl<string | null | undefined>;
  payee: FormControl<IPayeeDropdown | null>;
  card: FormControl<IExistingCreditCards | null>;
  memo: FormControl<string | null>;
  payeeEmail: FormControl<string | null>;
  payeeNumber: FormControl<string | null>;
  send_sms: FormControl<boolean | null>;
  payeeBankAc: FormControl<IPayeeViewBank | null>;
  invoiceNumber: FormControl<string | null>;
  category: FormControl<ICategoryDropdown | null>;
  payeeIdNumber: FormControl<string | null | undefined>;
  // isSameDay: FormControl<boolean | null>;
  // industryType: FormControl<string | number | null>;
  // Bill-related form controls
  commentIds: FormControl<string[] | null>;
  attachmentIds: FormControl<string[] | null>;
  chequeInvoiceNumber: FormControl<string | null>;
}

/**
 * @description This component handles the functionality for card-to-ACH payments..
 */
@Component({
  selector: 'app-cards-ach-v3',
  templateUrl: './cards-ach-v3.component.html',
  styleUrls: ['./cards-ach-v3.component.scss'],
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
    // IndustryTypesDropdownComponent,
    NewPhoneInputComponent,
    MatSlideToggleModule
  ]
})
export class CardsAchV3Component implements OnInit, OnDestroy, OnChanges {
  private cyberSourceService = inject(CybersourceService);
  private dialog = inject(MatDialog);
  private alertService = inject(AlertService);
  private paymentsService = inject(PaymentsService);
  private sharedService = inject(SharedService);
  private datePipe = inject(DatePipe);
  private payeeService = inject(PayeeService);
  // private scriptService = inject(ScriptService);
  private localStorageService = inject(LocalStorageService);
  private billService = inject(BillService);
  private activatedRoute = inject(ActivatedRoute);
  private commonService = inject(CommonOnInitService);
  private clickTrackingService = inject(ClickTrackingService);
  private bankModalService = inject(BankModalService);
  payeeDataService = inject(PayeeDataV35Service);
  private personaHelperService = inject(PersonaHelperService);
  private router = inject(Router);
  private renderer = inject(Renderer2);
  private cardPaymentService = inject(CardPaymentService);
  private headerService = inject(HeaderService);
  private validationService = inject(ValidationService);
  private store = inject(Store);
  private checkService = inject(CheckService);

  @Output() success = new EventEmitter<IPaymentSuccessData>();
  @Input() paymentConfig: IPaymentConfig;
  @Output() payeeDetailsEvents = new EventEmitter<IPayeeDetailsEvent | false>();
  @Input() selectedCard: IExistingCreditCards;
  @Input() changedInfo: IPayeeEditedData | undefined;
  @Input() isCurrentPaymentDisabled: false | string = false;
  @Output() calculateFee = new EventEmitter<ICalcPaymentFeeRequest>();
  @Output() openPersona = new EventEmitter<boolean>(false);
  @Output() verifyEmail = new EventEmitter<boolean>(false);
  @Output() newPaymentClick = new EventEmitter<void>();

  isSameDay = input(false);

  faCircleQuestion = faCircleQuestion;
  faCircleInfo = faCircleInfo;
  
  purposeOfPaymentControl = new FormControl('', [Validators.required]);
  purposeOfPaymentOptions = signal<string[]>([]);

  userVerified = input<boolean>(false);
  kycStatus = input<number | undefined>(undefined);

  subscriptions: Subscription[] = [];
  cardList: IExistingCreditCards[] = [];

  paymentForm: FormGroup<ICardsForm>;
  documentsForm: FormGroup;
  loading: boolean;
  payeeDetails: IPayeeView | undefined;
  utils = Utils;
  transactionId: string;
  serviceFee: string;
  createdExistingAttachments: IAttachmentItem[] = [];
  createdExistingComments: IComments[] = [];
  remitances: IRemittanceDetails[] | undefined;
  remitanceTotal: number;
  newRemittanceFormat: boolean;
  insertFromRemittance = false;
  attachmentCount: number;
  commentsCount: number;
  // Bill-related properties
  bills: string[] = [];
  isBillCheck: boolean = false;
  thirdPartyProviderType: number;
  payeeBankDetails: IPayeeBankDetails[] = [];
  selectedPayeeBankData: string | undefined;
  remittanceGrandTotal: number;
  remittanceType: number;
  phoneValidation: { [key: string]: boolean } | null;
  message: string = 'Please enter the phone number';
  toggleOn = signal<boolean>(false);
  categorySetWithIdFunction: ((id: string) => void) | undefined;
  categoryId = signal<string | undefined>(undefined);
  uploadedDocs:ICardPaymentReqDocRes;
  signatureUrl:string;
  sessionKey:string;
  emailSessionKey:string;
  phoneSessionKey:string;
  gatewayType: number | undefined;

  /**
   * @description The action variable holds the action that the user wants to perform.
   *
   */
  paymentProcessingContext: string;
  dateToday = this.datePipe.transform(new Date(), 'yyyy-MM-dd');
  selectedPayeeDetails: IPayeeDropdown;
  readonly paymentMode = '1';
  encId: string;
  hasRemitance = false;
  editBankName: string | undefined;
  amountInputDisabled = false;
  faHistory = faClockRotateLeft;
  proccessed = false;
  isBanned = false;
  public environment = environment;
  userPlugins = this.localStorageService.getItem('userPlugins');


  threeDSInstance: ThreeDsInstance | null = null;

  /**
   * Access DropDownCardComponent
   */
  @ViewChild(DropDownCardComponent)
  dropDownCardComponent: DropDownCardComponent;

  /**
   * Access DropDownCardComponent
   */
  @ViewChild('payeeBankDropDown')
  payeeBankDropDownComponent: DropDownPayeeBankComponent;

  @ViewChild('payeeDropdownV3Component')
  payeeDropdownV3Component: PayeeDropdownV3Component;

  @ViewChild(CardsDropdownV3Component)
  cardsDropdownV3Component: CardsDropdownV3Component;

  ngOnInit(): void {
    this.paymentsService.payeeDetails = undefined;
    this.initForm();
    this.getCount();
    this.paymentsService.payeeDetails = undefined;
    this.billFetch();
    this.paymentsService.currentPaymentMehtod.set('CC_ACH');
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
          }
        }, 0);
      }
    }
    
    if (changes?.changedInfo) {
      if (this.changedInfo?.selectedPayeeDetails?.id) {
        this.getPayeeDetails(this.changedInfo?.selectedPayeeDetails?.id);
        this.paymentForm.controls.payeeEmail.setValue(
          this.changedInfo?.selectedPayeeDetails?.email || ''
        );
      }

      if (changes?.changedInfo.currentValue.payeeDropdownDetails) {
        this.paymentForm.controls.payeeNumber.setValue(
          this.payeeDetails?.payee_information.payee_phone || ''
        );
      }
    }
    if (this.changedInfo?.selectedPayeeBank) {
      this.changeBankAccount(this.changedInfo?.selectedPayeeBank.encrypted_id);
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
      this.changeBankAccount(this.changedInfo?.selectedPayeeBank?.encrypted_id);
    }
  }

  /**
   * @description This function creates form controls for the payment form, sets up validators for each control, and subscribes to the changes in the "payee" control.
   */
  initForm() {
    this.paymentForm = new FormGroup<ICardsForm>({
      amount: new FormControl(null, [
        Validators.required,
        Validators.min(environment.isItDev ? 0.01 : 10),
        Validators.maxLength(9)
      ]),
      payee: new FormControl(null, [Validators.required]),
      card: new FormControl(null, [Validators.required]),
      memo: new FormControl('', [Validators.required, ValidationService.alphabetsAndSpacesValidator,Validators.maxLength(26)]),
      payeeEmail: new FormControl('', [
        Validators.required,
        ValidationService.emailValidator,
        this.validationService.validateDifferentEmail()
      ]),
      payeeNumber: new FormControl(null),
      send_sms: new FormControl(null),
      payeeBankAc: new FormControl(null),
      invoiceNumber: new FormControl(null, [Validators.required]),
      category: new FormControl(null),
      payeeIdNumber: new FormControl('', [Validators.maxLength(30)]) as FormControl,
      // isSameDay: new FormControl(false),
      // industryType: new FormControl(null, Validators.required)
      // Bill-related form controls
      commentIds: new FormControl([]),
      attachmentIds: new FormControl([]),
      chequeInvoiceNumber: new FormControl(null)
    });

    this.paymentForm.controls.send_sms.valueChanges.subscribe({
      next: (isSmsKey: boolean | null) => {
        const smsControl = this.paymentForm.get('payeeNumber');
        if (isSmsKey) {
          smsControl?.enable();
          smsControl?.setValidators([Validators.required]);
          this.toggleOn.set(true);
          this.paymentForm.controls.payeeNumber.setValue(
            this.payeeDetails?.payee_information.payee_phone || ''
          );
        } else {
          smsControl?.clearValidators();
          this.toggleOn.set(false);
          smsControl?.setValue(null);
          smsControl?.disable();
        }
        smsControl?.updateValueAndValidity();
      }
    });

    this.subscriptions.push(
      this.paymentForm.controls.amount.valueChanges
        .pipe(debounceTime(1500))
        .subscribe((val) => {
          const amount = Number(val);
          this.emitCalculateFee(
            amount,
            Number(this.paymentMode)
          );
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
        }),
      this.paymentForm.controls.amount.valueChanges.subscribe((val) => {
        this.paymentsService.hasAmount.update(() => Boolean(val));
      })
    );

    this.subscriptions.push(
      this.paymentForm.controls.payee.valueChanges.subscribe((payee) => {
        if (payee && payee?.id) {
          this.selectedPayeeDetails = payee;
          this.getPayeeDetails(payee.id, false);
        }
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
    if (!memoValue) return;
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

  emitCalculateFee(amount: number, mode: number) {
    this.calculateFee.emit({
      amount,
      mode,
      fee1Label: 'Pass-through processing fee',
      fee2Label: 'ACH',
      isSameDay: this.isSameDay() || false
    });
  }

  autoPopulateDropdown(ev: IV3DropDownOnReady, id: string) {
    if (ev.setItemWithId && id) {
      ev.setItemWithId(id);
    }
  }

  /**
   * @description checking and validating the phone number
   */
  getPhoneNumber() {
    this.phoneValidation = ValidationService.phoneMinLength(
      this.paymentForm.controls.payeeNumber
    );
    this.paymentForm.controls.payeeNumber.setValidators([
      Validators.required,
      ValidationService.phoneMinLength
    ]);
    this.message = 'This field requires 10 digits';
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
      if (this.paymentConfig.paymentFormValue.card) {
        this.cardList.push(this.paymentConfig.paymentFormValue.card);
      }
      this.paymentForm.patchValue({
        ...this.paymentConfig.paymentFormValue,
        isSameDay: !!this.isSameDay()
      });
    }

    if (this.paymentConfig.mode === 'CLONE') {
      this.paymentForm.controls.invoiceNumber.setValue(null);
    }
  }

  /**
   * @description This function is triggered when a payee is selected from the payee dropdown component and assigns payee details to the payment form
   * @param event -The selected payee details from the payee dropdown.
   * @param fromTemplate - Boolean indication whether the method is invoked from template or not (since template has form control already set to payee, we don't have to set it again, which might trigger infinite loops along with ngModel change, which obviously is something we don't want 😶 ).
   */
  payeeSelect(event: IPayeeDropdown, fromTemplate: boolean) {
    if (this.proccessed) {
      this.proccessed = false;
      return;
    }
    this.proccessed = true;

    this.payeeBankDropDownComponent.clearSelection();
    this.paymentForm.controls.payeeBankAc.reset();
    this.paymentForm.controls.payeeEmail.reset();
    this.paymentForm.controls.payeeBankAc.setValue(null);
    this.selectedPayeeDetails = event;
    if (event?.id) {
      if (fromTemplate === false) {
        this.paymentForm.controls.payee.setValue(event);
      }
      if (event.email) {
        this.paymentForm.controls.payeeEmail.setValue(event?.email);
      } else {
        this.paymentForm.controls.payeeEmail.setValue(null);
      }
      // this.paymentForm.controls.industryType.setValue(
      //   event?.merchantCategory as number
      // );
      this.paymentForm.controls.payeeIdNumber.setValue(event.payeeIdNumber);
      this.payeeDetailsEvents.emit({
        payeeDropdownDetails: event,
        isMoreDetailsLoading: true
      });
      const payeeData = this.paymentForm.controls?.payee?.value;
      if(!payeeData?.company || !payeeData?.addressLine1 || !payeeData?.city || !payeeData?.state || !payeeData?.zip || !payeeData?.country) {
        this.paymentsService.checkAndHandleMissingPayeeInfo(payeeData);
      }
    }
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
          .subscribe((attachments: IComments[]) => {
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
   * @description This function is called to clear the selected payee and associated details in the payment form.
   */
  clearPayee(): void {
    this.paymentForm.controls.payeeBankAc.reset();
    this.paymentForm.controls.payee.reset();
    this.paymentForm.controls.payeeEmail.reset();
    this.paymentForm.controls.payeeIdNumber.reset();
    this.payeeBankDetails = [];
    this.payeeDetailsEvents.emit({
      payeeDropdownDetails: undefined,
      isMoreDetailsLoading: false
    });
    // this.paymentForm.controls.industryType.setValue(null);
  }

  /**
   * @description This function is triggered when a card is selected from the dropdown.
   * @param event -The selected card details from the card dropdown component.
   */
  cardSelect(event: IExistingCreditCards) {
    this.paymentForm.controls.card.setValue(event);
  }

  /**
   * @description This function is used to fetch additional details of the selected payee based on the provided payee ID.
   * @param payeeId -The ID of the selected payee.
   */
  getPayeeDetails(payeeId: string, fromApi?: boolean, type?: string) {
    this.payeeDetails = undefined;
    this.subscriptions.push(
      this.paymentsService
        .getPayeeDetails(payeeId, true, type)
        .pipe(debounceTime(100))
        .subscribe((res) => {
          this.payeeDetails = res;
          this.getPayeeCategory(payeeId);
          if (this.payeeDetails) {
            this.paymentForm.controls.payeeNumber.setValue(
              this.payeeDetails.payee_information.payee_phone
            );
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
              const defaultCDPayeeBank =
                this.payeeDetails.bank_accounts[defaultBankAcIndex];
              this.selectedPayeeBankData = `${
                defaultCDPayeeBank.bank_name
              } - ${this.utils.getMaskedAcNo(
                String(defaultCDPayeeBank.account_number)
              )}`;
            }
            if (this.changedInfo?.selectedPayeeDetails?.id) {
              this.payeeDetailsEvents.emit({
                payeeDropdownDetails: this.changedInfo?.selectedPayeeDetails,
                isMoreDetailsLoading: false,
                payeeBankDetails: this.paymentForm.controls.payeeBankAc.value
              });
            } else {
              this.payeeDetailsEvents.emit({
                payeeDropdownDetails: this.selectedPayeeDetails,
                isMoreDetailsLoading: false,
                payeeBankDetails: this.paymentForm.controls.payeeBankAc.value
              });
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
        }),
      this.payeeService.getPayeeBankData(payeeId).subscribe((res) => {
        if (res.success) {
          this.payeeBankDetails = res.data;
        }
      })
    );
  }

  showBannedMessage(){
    this.isBanned = true;
    this.payeeBankDropDownComponent.clearSelection();
    this.paymentForm.controls.payeeBankAc.reset();
    this.paymentForm.controls.payeeBankAc.setValue(null);
    this.paymentForm.controls.payeeEmail.setValue(null);
    this.payeeDropdownV3Component.clearSelection();
    this.clearPayee();
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

  getPayeeBankData(payeeId: string) {
    const selectedBankAcc = this.paymentForm.controls.payeeBankAc.value;
    if (selectedBankAcc?.bank_name) {
      this.subscriptions.push(
        this.payeeService.getPayeeBankData(payeeId).subscribe((res) => {
          if (res.success) {
            this.payeeBankDetails = res.data;
            this.selectedPayeeBankData = `${selectedBankAcc?.bank_name} - ${this.utils.getMaskedAcNo(
              selectedBankAcc?.account_number as string
            )}`;
            this.editBankName = this.selectedPayeeBankData;
          }
        })
      );
    }
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
          id: this.payeeDetails?.payeeEncryptedId
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
                  if (this.selectedPayeeDetails) {
                    this.getPayeeBankData(this.selectedPayeeDetails.id);
                  }
                  this.payeeDetails?.bank_accounts.push(newPayeeBankAc);
                  this.onShowPayeeBank(response.data.id);
                  this.payeeDetailsEvents.emit({
                    payeeDropdownDetails: this.selectedPayeeDetails,
                    isMoreDetailsLoading: false,
                    payeeBankDetails: newPayeeBankAc
                  });
                  this.getPayeeBankDetails(newPayeeBankAc);
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

  getPurposeOfPayment() {
    this.paymentsService.getPurposeOfPayment((options) => {
      this.purposeOfPaymentOptions.set(options);
      this.syncPurposeDropdown(this.paymentConfig?.memo || this.paymentConfig?.paymentFormValue?.memo);
    });
  }

  /**
   * @description - method to add payee new bank account to existing list
   * @param newBank -newly added payee bank account
   */
  getPayeeBankDetails(newBank: IPayeeViewBank) {
    this.subscriptions.push(
      this.payeeService
        .getPayeeBankData(this.selectedPayeeDetails.id)
        .subscribe((res) => {
          if (res.success) {
            this.payeeBankDetails = res.data;
            this.selectedPayeeBankData = `${newBank?.bank_name} - ${this.utils.getMaskedAcNo(
              newBank?.account_number
            )}`;
            this.editBankName = this.selectedPayeeBankData;
          }
        })
    );
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
    if (
      this.paymentForm.invalid ||
      Number(this.paymentForm.value?.amount) < (environment.isItDev ? 0.01 : 10)
    ) {
      this.paymentForm.markAllAsTouched();
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

    const payeeData = this.paymentForm.controls?.payee?.value;
    if(!payeeData?.company) {
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

    if (!this.validateUserStatus()) {
      return;
    }
    if (this.isCurrentPaymentDisabled) {
      this.commonService.contactAlert(this.isCurrentPaymentDisabled);
      return;
    }

    switch (paymentProcessingContext) {
      case 'pay':
        this.managePayment('COMPLETE-TRANSACTION');
        break;
      case 'updateAndPay':
        this.updatePayment(true);
        break;
      case 'save':
        this.savePayment();
        break;
      case 'update':
        this.updatePayment();
        break;
      default:
        break;
    }
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
    const amount = <string>this.paymentForm.controls.amount.value;
    const invoiceNumber = <string>this.paymentForm.controls.invoiceNumber.value;
    const mode = this.paymentMode;

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
      transfer_type:'1', // 1 for ach
      payment_id:this.paymentConfig?.id ?? '' // payment id for update payment.Its is used to in case of user permission approvel required.
    };
    const dialogRef = this.paymentsService.openPaymentConfirmationModal({
      accNumber: this.paymentConfig?.paymentFormValue?.card.cardMasked,
      bankName: this.paymentConfig?.paymentFormValue?.card.nickName,
      payeeName: this.selectedPayeeDetails.name,
      paymentMethod: this.isSameDay() ? 'Same Day ACH' : 'ACH / Direct Deposit',
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
          this.paymentsService
            .getRequiredDocumentsDetails(body)
            .pipe(
              finalize(() => {
                this.paymentsService.isPaymentProcessingSubject.next(false);
                this.loading = false;
              })
            )
            .subscribe({
              next: (res) => {
                if (res.success) {
                  if(res?.data?.isApprovalRequired){
                    this.alertService.infoAlert({
                      title: 'Info!',
                      content:
                        'Administrator approval is required to process this payment.'
                    });
                    return;
                  }
                  const invoiceRequired =
                    res.data.required_docs.includes('invoice');
                  const cardRequired = res.data.required_docs.includes('card');
                  if (cardRequired || invoiceRequired) {
                    if (card) {
                      this.loading = false;
                      this.paymentsService.isPaymentProcessingSubject.next(
                        false
                      );
                      const dialogRef =
                        this.commonService.openVerifyCardInvoiceModal(
                          card,
                          amount,
                          mode,
                          invoiceNumber,
                          res.data.required_docs,
                          this.selectedPayeeDetails,
                          undefined,
                          this.isSameDay() ? 1 : 0
                        );
                      this.subscriptions.push(
                        dialogRef.afterClosed().subscribe((data) => {
                          if (data?.success) {
                            this.loading = true;
                            this.paymentsService.isPaymentProcessingSubject.next(
                              true
                            );
                            if (shouldGoTo === 'COMPLETE-TRANSACTION') {
                              this.uploadedDocs = data?.data;
                              this.signatureUrl = data?.authSign as string;
                              this.completeTransaction(data?.data, threeDSRes);
                            } else {
                              this.uploadedDocs = data?.data;
                              this.signatureUrl = data?.authSign as string;
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
                        })
                      );
                    } else {
                      this.loading = false;
                      this.paymentsService.isPaymentProcessingSubject.next(
                        false
                      );
                    }
                  } else if (shouldGoTo === 'COMPLETE-TRANSACTION') {
                    this.completeTransaction(undefined, threeDSRes);
                  } else {
                    this.completeTransactionUsingZilPaymentApi(
                      undefined,
                      threeDSRes
                    );
                  }
                }
              },

              error: (err) => {
                
                if (err?.error?.errorCode === 441) {
                  this.alertService
                    .failedAlert({
                      title: 'Failed',
                      content:
                        'You need to enable credit card before making a payment',
                      isOk: true,
                      isCancel: true,
                      cancelMsg: 'Cancel',
                      doneMsg: 'Enable Now'
                    })
                    .afterClosed()
                    .subscribe((res) => {
                      if (res) {
                        this.managePayment(shouldGoTo);
                      }
                    });
                }

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
        this.paymentsService.isPaymentProcessingSubject.next(false);
        this.loading = false;
      }
    });
  }

  /**
   * @description This function is called when a bank account is changed, and it updates the selected bank account for the payee.
   * @param event -The event object containing the details of the selected bank account.
   */
  changeBankAccount(event?: string): void {
    this.selectedPayeeBankData = undefined;
    this.editBankName = undefined;
    if (!event) return;
    const bankAc = this.payeeDetails?.bank_accounts.filter(
      (ele) => ele?.encrypted_id === event
    )[0];
    this.paymentForm.controls.payeeBankAc.setValue(bankAc ?? null);
    this.payeeDetailsEvents.emit({
      payeeDropdownDetails: this.selectedPayeeDetails,
      isMoreDetailsLoading: false,
      payeeBankDetails: bankAc
    });
    if (this.selectedPayeeDetails) {
      this.getPayeeBankData(this.selectedPayeeDetails.id);
    }
  }

  /**
   * @description  This function is called to clear the selected bank account for the payee.
   * @param event -The event object containing the details of the bank account to be cleared.
   */
  clearBankAccount(event: IPayeeViewBank): void {
    this.paymentForm.controls.payeeBankAc.setValue(null);
    if (event) {
      this.payeeDetailsEvents.emit({
        payeeDropdownDetails: this.selectedPayeeDetails,
        isMoreDetailsLoading: false
      });
    }
  }

  /**
   * @description Complete transaction function for card payment with old api.
   * @param documents - Optional parameter. its possible that is there might be documents details, and there might not be. so its optional.
   * if there is documents details, we simply pass it backend, else it will be undefined.
   */
  completeTransaction(
    documents?: ICardPaymentReqDocRes,
    threeDsData?: ThreeDSComplete,
    isAgree = 0
  ) {
    const paymentFormBody = this.paymentForm.value;
    const commentIds: string[] = [];
    const attachmentIds: string[] = [];
    this.createdExistingComments.map((el) => commentIds.push(el.encrypted_id));
    this.createdExistingAttachments.forEach((el) => {
      if (el.encrypted_id) {
        attachmentIds.push(el.encrypted_id);
      }
    });

    let threeDSPayload: ThreeDSPayload | undefined = undefined;

    if (threeDsData) {
      threeDSPayload = {
        cavv: threeDsData.cavv,
        xid: threeDsData.xid,
        eci: threeDsData.eci,
        cardholder_auth: threeDsData.cardHolderAuth,
        three_ds_version: threeDsData.threeDsVersion,
        directory_server_id: threeDsData.directoryServerId,
        cardholder_info: threeDsData.cardHolderInfo
      };
    }

    const body: IPaymentBody = {
      amount: this.paymentForm.controls.amount.value,
      cardId: this.paymentForm.controls.card.value?.cardId,
      send_sms: this.paymentForm.controls.send_sms.value,
      payee_phone: this.paymentForm.controls.payeeNumber.value,
      category: paymentFormBody.category?.id ?? '',
      payees: [
        {
          id: paymentFormBody.payee?.id,
          amount: paymentFormBody.amount,
          email: paymentFormBody.payeeEmail,
          phone: this.paymentForm.controls.payeeNumber.value,
          memo: paymentFormBody.memo,
          invoiceNumber: paymentFormBody.invoiceNumber,
          bankAccount: paymentFormBody.payeeBankAc?.encrypted_id,
          category: paymentFormBody.category?.id ?? '',
          payeeIdNumber: <string>paymentFormBody.payeeIdNumber,
          bills: []
        }
      ],
      mode: '1',
      commentIds,
      attachmentIds,
      items: this.insertFromRemittance ? this.paymentsService.remittanceData?.remitance : [],
      remittanceType: this.paymentsService.remittanceData?.remittanceType,
      documents,
      isSameDay: this.isSameDay() ? 1 : 0,
      three_ds_data: threeDSPayload,
      session_key: this.sessionKey ?? '',
      otp_type:this.emailSessionKey ? 'phone': 'email',
      email_otp_session_key:this.emailSessionKey ?? '',
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
            if (this.paymentForm.controls.payeeNumber.value) {
              this.store.dispatch(
                payeesActions.loadPayees({
                  searchTerm: '',
                  skipEmpty: true,
                  isReload: true
                })
              );
            }
          },
          (err) => {
            this.paymentsService.afterGetingError(
              err?.error?.errorCode,
              err?.error?.errorMsg
            );
            if (err.error.errorCode === 816) {
              const alert = this.alertService.failedAlert({
                content: err.error.errorMsg,
                isOk:true,
                isCancel:false,
                doneMsg: 'Try Again'
              });
              alert.afterClosed().subscribe((res) => {
                if (res) {
                  this.headerService.setHeaderValueChanged(true);
                  this.newPaymentClick.emit();
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
            if (err.error.errorCode === '808') {
              const dialog = this.dialog.open(CardTransactionDocsPreviewModalComponent, {
                maxWidth: '750px',
                width: '100%',
                disableClose: true,
                autoFocus: false,
                data: {...body,authSign:this.signatureUrl}
              });
              dialog.afterClosed().subscribe((result) => {
                if (result) {
                  this.completeTransaction(this.uploadedDocs,undefined,1);
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
   *
   *@description Creates and returns the payment body for saving a payment.
   * This function retrieves the necessary values from the payment form and formats them into the desired structure.
   * @returns -The payment body for saving a payment.
   */
  createSavePaymentBody(): IUpdatePaymentBody {
    const paymentFormBody = this.paymentForm.value;
    const commentIds: string[] = [];
    const attachmentIds: string[] = [];
    this.createdExistingComments.map((el) => commentIds.push(el.encrypted_id));
    this.createdExistingAttachments.forEach((el) => {
      if (el.encrypted_id) {
        attachmentIds.push(el.encrypted_id);
      }
    });

    return {
      transferType: 'ach',
      amount: Number(paymentFormBody.amount),
      category: paymentFormBody.category?.id,
      payeeBankAccount: paymentFormBody.payeeBankAc?.encrypted_id,
      description: paymentFormBody.memo ?? '',
      payee: paymentFormBody.payee?.id,
      paymentDueDate: this.dateToday ?? undefined,
      referenceNo: paymentFormBody.invoiceNumber ?? undefined,
      sourceId: paymentFormBody.card?.cardId,
      sourceType: 'card',
      payeeIdNumber: <string>paymentFormBody.payeeIdNumber,
      commentIds,
      attachmentIds,
      items: this.insertFromRemittance ? this.paymentsService.remittanceData?.remitance : [],
      remittanceType: this.paymentsService.remittanceData?.remittanceType,
      payeeEmail: paymentFormBody.payeeEmail as string,
      bills: this.billService.billId() ?? []
    };
  }

  /**
   * @description Saves the payment information without initiating the payment.
   */
  savePayment() {
    const sendingData = this.createSavePaymentBody();
    if ((sendingData?.amount ?? 0) < 10.0) {
      this.alertService.failedAlert({
        title: 'Failed',
        content: 'Minimum transaction amount should be $10.00'
      });
      this.loading = false;
      this.paymentsService.isPaymentProcessingSubject.next(false);
    } else {
      this.loading = true;
      this.paymentsService.isPaymentProcessingSubject.next(true);
      this.subscriptions.push(
        this.paymentsService
          .savePayment(sendingData)
          .pipe(
            finalize(() => {
              this.loading = false;
              this.paymentsService.isPaymentProcessingSubject.next(false);
            })
          )
          .subscribe({
            next: (res) => {
              //  Track when the credit card promoting toast is clicked and the payment is done.
              this.clickTrackingService
                .ccToastClickedPaymentDone(res.data?.id)
                ?.pipe(take(1))
                ?.subscribe();

              this.loading = false;
              this.paymentsService.isPaymentProcessingSubject.next(false);
              if (res.success) {
                this.success.emit({
                  title: 'Your Payment is Saved',
                  content:
                    'Your payment has been saved. Please check the status in your records.'
                });
              }
            },
            error: (err) => {
              if (err?.error?.errorCode === 441) {
                this.alertService
                  .failedAlert({
                    title: 'Failed',
                    content:
                      'You need to enable credit card before making a payment',
                    isOk: true,
                    isCancel: true,
                    cancelMsg: 'Cancel',
                    doneMsg: 'Enable Now'
                  })
                  .afterClosed()
                  .subscribe((res) => {
                    if (res) {
                      this.openKycModal();
                    }
                  });
              }
              this.loading = false;
              this.paymentsService.isPaymentProcessingSubject.next(false);
            }
          })
      );
    }
  }

  openKycModal() {
    if (environment.isV4Persona) {
      this.personaHelperService
        .openModal('kyc', CVSourceType.credit_card)
        .subscribe((res) => {
          if (res?.data?.inquiry_id) {
            this.savePayment();
          }
        });
    } else {
      this.router.navigateByUrl('/manage/users/verify-user-id?type=5');
    }
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
   * @description Updates the payment information.
   * @param payAfterUpdate -Flag indicating whether to initiate the payment after updating.
   */
  updatePayment(payAfterUpdate?: boolean) {
    if (this.paymentConfig.paymentDetails?.id) {
      const sendingData = this.createSavePaymentBody();
      this.loading = true;
      this.paymentsService.isPaymentProcessingSubject.next(true);
      if ((sendingData?.amount ?? 0) < 10.0) {
        this.alertService.failedAlert({
          title: 'Failed',
          content: 'Minimum transaction amount should be $10.00'
        });
        this.loading = false;
        this.paymentsService.isPaymentProcessingSubject.next(false);
      } else {
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

  /**
   * @description Complete transaction function for card payment with Zil payments api.
   * @param documents - Optional parameter. its possible that is there might be documents details, and there might not be. so its optional.
   * if there is documents details, we simply pass it backend, else it will be undefined.
   */
  completeTransactionUsingZilPaymentApi(
    documents?: ICardPaymentReqDocRes,
    threeDSRes?: ThreeDSComplete,
    isAgree = 0
  ) {
    if (this.paymentConfig.paymentDetails?.id) {
      const sendingData = {
        payee_bank_account_id: this.paymentForm.value.payeeBankAc?.encrypted_id,
        payee_email: this.paymentForm.value.payeeEmail ?? undefined,
        three_ds_data: threeDSRes,
        documents,
        session_key: this.sessionKey ?? '',
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
            sendingData
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
            if (res.success) {
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
              if (this.paymentForm.controls.payeeNumber.value) {
                this.store.dispatch(
                  payeesActions.loadPayees({
                    searchTerm: '',
                    skipEmpty: true,
                    isReload: true
                  })
                );
              }
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
                  this.completeTransactionUsingZilPaymentApi(this.uploadedDocs);
                }
              });
            }
            if (err.error.errorCode === '808') {
              const dialog = this.dialog.open(CardTransactionDocsPreviewModalComponent, {
                maxWidth: '750px',
                width: '100%',
                disableClose: true,
                autoFocus: false,
                data: {...sendingData,authSign:this.signatureUrl,zil_payment_uuid:this.paymentConfig.paymentDetails?.id}
              });
              dialog.afterClosed().subscribe((result) => {
                if (result) {
                  this.completeTransactionUsingZilPaymentApi(this.uploadedDocs,undefined,1);
                }
              });
            }
          }
        
        
        )
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

    this.subscriptions.push(
      dialogRef.afterClosed().subscribe((res) => {
        if (res?.success) {
          this.sharedService.setNewCategoryCreatedData({ categoryId: res.id });
          this.paymentForm.controls.category.setValue(res);
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
    this.paymentsService.isPaymentProcessingSubject.next(false);
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
      this.paymentsService.remittanceData = undefined;
    });
    this.paymentsService.hasAmount.update(() => false);
    this.paymentsService.currentPaymentMehtod.set(undefined);
    this.paymentsService.isSameDayAch.update(() => false);
  }
}

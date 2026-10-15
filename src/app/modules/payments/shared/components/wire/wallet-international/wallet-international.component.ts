/* eslint-disable @typescript-eslint/no-non-null-assertion */
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
import { HttpErrorResponse } from '@angular/common/http';
import { Subscription } from 'rxjs';
import {
  debounceTime,
  filter,
  finalize,
  take
} from 'rxjs/operators';
import { TransactionLimitCardComponent } from 'src/app/shared/components/transaction-limit-card/transaction-limit-card.component';
import { Utils } from 'src/app/data/utils';
import { IPaymentConfig } from 'src/app/modules/payments/model/payments';
import {
  IPayeeBankDetails,
  IPayeeDetailsEvent,
  IPayeeDropdown,
  IPayeeEditedData,
  IPayeeView,
  IPayeeViewBank
} from 'src/app/modules/payee/payee-v2/model/payee';
import {
  IInternationalCountry,
  IWalletData,
  IWalletInternationaPaymentAcceptPayload,
  IWalletInternationaPaymentCreate
} from 'src/app/models/wallet';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { IV3DropDownOnReady } from 'src/app/models/common';
import { Router } from '@angular/router';
import { MatTooltip } from '@angular/material/tooltip';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { NgClass, CommonModule } from '@angular/common';
import {
  faArrowUpArrowDown,
  faClockRotateLeft
} from '@fortawesome/pro-regular-svg-icons';
import { PayeeDataV35Service } from 'src/app/modules/payee/payee-v3/v35-services/payee-data-v35.service';
import { faCircleExclamation, faCircleQuestion, faEuroSign, faIndianRupeeSign, faP, faBuilding, faUser, faUserGroup } from '@fortawesome/pro-solid-svg-icons';
import {
  IInternationalBankAccountRequest,     
  IInternationalPayeeAccount,
  IInternationalPayeeBankJsonData,
  IInternationalPayeeBankResponse
} from 'src/app/modules/cloud-bank/cloud-bank-v2/model/internationalPayments';
import { IApiRes } from 'src/app/models/api';
import { V35CommonDropDownSelectorComponent } from 'src/app/shared/v3/v35-dropdown/v35-common-dropdown-selector.component';
import { WalletService } from 'src/app/shared/service/wallet/wallet.service';
import { IGettingStartedAPI } from 'src/app/models/getting-started';
import { LocalStorageKeys } from 'src/app/models/local-storage';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { AddRecipientModalComponent } from 'src/app/modules/international-payment/modal/add-recipient-modal/add-recipient-modal.component';
import { environment } from 'src/environments/environment';
import { PersonaHelperService } from 'src/app/shared/persona-v4/service/persona-helper.service';
import { CVSourceType } from 'src/app/modules/common-verification/model/common-verification';
import { NewPhoneInputComponent } from 'src/app/shared/components/new-phone-input/new-phone-input.component';
import { CommonButtonV35Component } from '../../../../../../shared/v3/buttons/common-button-v35/common-button-v35.component';
import { PayeeDropdownV3Component } from '../../../../../../shared/components/v3/drop-downs/payee-dropdown-v3/payee-dropdown-v3.component';
import { WalletDropdownV3Component } from '../../../../../../shared/components/v3/drop-downs/wallet-dropdown-v3/wallet-dropdown-v3.component';
import { V35ControlMessageComponent } from '../../../../../../shared/v3/control-message-v35/control-message-v35.component';
import { AmountInputComponent } from '../../../../../../shared/components/amount-input/amount-input.component';
import { MapSourceWithBusinessModalComponent } from '../../../modal/map-source-with-business-modal/map-source-with-business-modal.component';
import { BillService } from 'src/app/shared/service/Bill/bill.service';
import { ActivatedRoute } from '@angular/router';
import { CheckAddAttachmentCommonModalComponent } from 'src/app/modules/check/modal/check-activity-modals/check-add-attachment-common-modal/check-add-attachment-common-modal.component';
import { IAttachmentItem } from 'src/app/models/common';
import { IComments } from 'src/app/data/data/cloud-quick-pay';
import { AddCommentsModalComponent } from 'src/app/shared/modal/comments-modal/add-comments-modal/add-comments-modal.component';
import { ClickTrackingService } from 'src/app/shared/service/click-tracking/click-tracking.service';
import { OtpModalComponent } from 'src/app/modules/cloud-bank/cloud-bank-v2/modals/otp-modal/otp-modal.component';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';

/**
 * @description This component handles the card to wire payment functionality.
 */
@Component({
  selector: 'app-wallet-international',
  templateUrl: './wallet-international.component.html',
  styleUrls: ['./wallet-international.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    AmountInputComponent,
    NgClass,
    CommonModule,
    V35ControlMessageComponent,
    WalletDropdownV3Component,
    FaIconComponent,
    PayeeDropdownV3Component,
    MatTooltip,
    CommonButtonV35Component,
    V35CommonDropDownSelectorComponent,
    NewPhoneInputComponent,
    TransactionLimitCardComponent
  ]
})
export class WalletInternationalComponent
  implements OnInit, OnDestroy, OnChanges
{
  private payeeService = inject(PayeeService);
  private dialog = inject(MatDialog);
  private alertService = inject(AlertService);
  private paymentsService = inject(PaymentsService);
  payeeDataService = inject(PayeeDataV35Service);
  private validationService = inject(ValidationService);
  private walletService = inject(WalletService);
  private localStorageService = inject(LocalStorageService);
  private personaHelperService = inject(PersonaHelperService);
  private router = inject(Router);
  private billService = inject(BillService);
  private activatedRoute = inject(ActivatedRoute);
  private clickTrackingService = inject(ClickTrackingService);
  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);

  @Output() payeeDetailsEvents = new EventEmitter<IPayeeDetailsEvent | false>();
  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() success = new EventEmitter<
    boolean | { title?: string; content?: string }
  >();

  @Output() calculateFee = new EventEmitter();
  @Output() openPersona = new EventEmitter<boolean>(false);
  @Output() verifyEmail = new EventEmitter<boolean>(false);
  @Input() changedInfo: IPayeeEditedData | undefined;

  userVerified = input<boolean>(false);
  kycStatus = input<number | undefined>(undefined);

  internationalForm: FormGroup;
  loading: boolean;
  subscriptions: Subscription[] = [];
  payeeDetails: IPayeeView | undefined;
  utils = Utils;
  payeeBankDataList: IPayeeBankDetails[] = [];
  defaultCDPayeeBank: IPayeeViewBank;
  @Input() paymentConfig: IPaymentConfig;
  selectedPayeeDetails: IPayeeDropdown | undefined;
  internationalAccounts: IInternationalPayeeAccount[];
  sourceList = signal<{ code: string; description: string }[]>([]);
  purposeList = signal<{ code: string; description: string; category?: string }[]>([]);
  selectedPurpose: string;
  selectedSource: string;
  recipientTypes = signal<Array<{value: string, label: string, icon: string[]}>>([]);
  // Bill-related properties
  bills: string[] = [];
  isBillCheck: boolean = false;
  thirdPartyProviderType: number;
  attachmentCount: number;
  createdExistingAttachments: any[] = [];
  createdExistingComments: any[] = [];
  commentsCount: number; 

  selectedRecipientType = signal<string | null>(null);
  createdQuote = signal<IWalletInternationaPaymentCreate | undefined>(
    undefined
  );

  currenCountryPhoneLength = {} as { min: number; max: number };
  currentCountryCode: string;
  selectedPayeeBankData: string | undefined;
  exchangeRate: number;
  editBankName: string | undefined;
  isSourceLoadindg = signal(false);
  isPurposeLoading = signal(false);
  isMemoRequired = signal(false);
  selectedPurposeCategory = signal<string | null>(null);
  isSubmit = signal(false);
  isCreateQuote = signal(false);
  isAddressMissing = signal(false);  isLoadBank = signal(false);
  internationalAccountsList = signal<IInternationalPayeeAccount[]>([]);
  selectedRecipientBank: string | null = null;
  payeeInternationalAccounts = signal<IInternationalPayeeAccount[]>([]);

  isInternationalPaymentPersonalEnabled = signal(false);
  isInternationalPaymentBusinessEnabled = signal(false);

  faHistory = faClockRotateLeft;
  faCircleExclamation = faCircleExclamation;
  faExchange = faArrowUpArrowDown;
  faCircleQuestion=faCircleQuestion;
  faBuilding = faBuilding;
  faUser = faUser;
  faUserGroup = faUserGroup;

  selectedPurposeDescription = signal<string>('Maximum');
  // Source of Funds is only applicable for India and Philippines.
  private readonly sourceOfFundsCountries = ['IN', 'PH'];

  private readonly COUNTRIES_BUSINESS_CACHE_KEY = 'international_countries_business_data';
  private readonly COUNTRIES_PERSONAL_CACHE_KEY = 'international_countries_personal_data';

  
  private readonly MIN_INTERNATIONAL_WALLET_BALANCE = 10;
  insufficientBalance = signal(false);

  private countriesData = signal<{[key: string]: IInternationalCountry}>({});
  private isLoadingCountries = signal(false);
  paymentVersion = signal<string>('');
  payoutCurrencyCode = signal<string>('');

  userPlugins = this.localStorageService.getItem('userPlugins');

  @ViewChild('payeeDropDown')
  payeeDropDownComponent: PayeeDropdownV3Component;

  @ViewChild('purposeDropdown')
  purposeDropdown: V35CommonDropDownSelectorComponent;

  @ViewChild('limitCard') limitCard: TransactionLimitCardComponent;

  @ViewChild('amountInput') amountInput?: AmountInputComponent;

  currencyWithIcon = {
    INR: faIndianRupeeSign,
    EUR: faEuroSign,
    PHP: faP
  };

  ngOnInit(): void {
    this.initForm();
    this.setRecipientTypes();
    this.paymentsService.payeeDetails = undefined;
    this.billFetch();
  }

  setRecipientTypes(): void {
    // Initialize recipient types based on local storage
    const rippleBusinessEnabled = this.localStorageService.getItem('rippleBusinessInternationalPaymentEnabled');
    const ripplePersonalEnabled = this.localStorageService.getItem('ripplePersonalInternationalPaymentEnabled');

    this.isInternationalPaymentBusinessEnabled.set(rippleBusinessEnabled === 1 || rippleBusinessEnabled === '1');
    this.isInternationalPaymentPersonalEnabled.set(ripplePersonalEnabled === 1 || ripplePersonalEnabled === '1');
    
    const types: Array<{value: string, label: string, icon: string[]}> = [
      { value: 'business', label: 'Business', icon: ['fas', 'building'] },
      { value: 'personal', label: 'Personal', icon: ['fas', 'user'] }
    ];

    this.recipientTypes.set(types);
    this.subscriptions.push(
      this.internationalForm.controls.type?.valueChanges.
      pipe(debounceTime(500))
      .subscribe((value) => {
        if (value && !this.isInternationalPaymentEnabled(value)) {
          this.selectedRecipientType.set(value);
          this.showContactSupportAlert();
        }
      })
    );
  }

  isInternationalPaymentEnabled(type: string): boolean {
    return type === 'business' ? this.isInternationalPaymentBusinessEnabled() : this.isInternationalPaymentPersonalEnabled();
  }

  showContactSupportAlert(): void {
    const recipientTypeLabel =
      this.selectedRecipientType() === 'business' ? 'Business' : 'Personal';
    const data = {
      content: `${recipientTypeLabel} international payment is not enabled for this account. Please contact the support team to enable it.`,
      isOk: true,
      isCancel: true,
      doneMsg: 'Contact Now',
      cancelMsg: 'Not Now'
    };
    const dialog = this.alertService.infoAlert(data);
    dialog.afterClosed().subscribe((res) => {
      if (res) {
        this.dynamicWhiteLabelService.goToLiveChat();
      }
      this.internationalForm.controls.type.setValue(null);
      this.selectedRecipientType.set(null);
    });
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
          this.internationalForm.controls.amount.setValue(null);
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
            this.internationalForm.controls.amount.setValue(
              res.data.totalAmount as string
            );
            let {memo} = res.data;
 
            if (!this.userPlugins?.includes('no-bill-payment-memo-default') && !memo) {
              memo = `Payment for Bill ${res.data.invoiceNumbers}`;
            }

            this.internationalForm.controls.memo.setValue(memo);
            this.internationalForm.controls.chequeInvoiceNumber.setValue(
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
    // Handle paymentConfig changes for amount, memo, and other form values
    if (changes?.paymentConfig && this.paymentConfig?.paymentFormValue) {
      const formValue = this.paymentConfig.paymentFormValue;
      
      // Update amount if it exists in paymentConfig
      if (formValue.amount !== undefined && this.internationalForm?.controls?.amount) {
        this.internationalForm.controls.amount.setValue(formValue.amount);
      }
      
      // Update memo if it exists in paymentConfig
      if (formValue.memo !== undefined && this.internationalForm?.controls?.memo) {
        this.internationalForm.controls.memo.setValue(formValue.memo);
      }
      
      // Update payee if it exists in paymentConfig
      if (formValue.payee && this.internationalForm?.controls?.payee) {
        this.internationalForm.controls.payee.setValue(formValue.payee);
      }
      
      // Update payee email if it exists in paymentConfig
      if (formValue.payeeEmail !== undefined && this.internationalForm?.controls?.payeeEmail) {
        this.internationalForm.controls.payeeEmail.setValue(formValue.payeeEmail);
      }
    }

    if (changes?.changedInfo) {
      if (this.changedInfo?.selectedPayeeDetails?.id) {
        this.getPayeeDetails(this.changedInfo?.selectedPayeeDetails?.id);
        this.internationalForm.controls.payeeEmail.setValue(
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

    if (changes?.changedInfo?.currentValue?.updatedPayeePhone) {
      this.internationalForm.controls.payeePhone.setValue(
        changes.changedInfo.currentValue.updatedPayeePhone
      );
    }

    if (this.changedInfo?.selectedInternationalPayeeBank) {
      const formValue = this.internationalForm.value;
      if (
        formValue?.payeeBankAc?.beneficiaryBankDetails?.country ===
        this.changedInfo?.selectedInternationalPayeeBank?.beneficiaryBankDetails
          ?.country
      )
        return;
      this.internationalForm.controls.payeeBankAc.setValue(
        this.changedInfo?.selectedInternationalPayeeBank
      );
      this.createQuote();
    }
  }

  /**
   * @description This function creates form controls for the payment form, sets up validators for each control, and subscribes to the changes in the "payee" control.
   */
  initForm() {
    this.internationalForm = new FormGroup({
      amount: new FormControl(null, [
        Validators.required,
        Validators.min(10),
        Validators.maxLength(9)
      ]),
      payee: new FormControl(null, [Validators.required]),
      wallet: new FormControl(null, [Validators.required]),
      memo: new FormControl('', [
        Validators.maxLength(100),
        Validators.pattern(/^[A-Za-z0-9 -]+$/)
      ]),
      payeeEmail: new FormControl('', [
        Validators.required,
        ValidationService.emailValidator,
        this.validationService.validateDifferentEmail()
      ]),
      payeePhone: new FormControl(null, [
        ValidationService.customMinLength(
          this.currenCountryPhoneLength?.min ?? 10
        )
      ]  ),
      category: new FormControl(null),
      payeeBankAc: new FormControl(null, [Validators.required]),
      invoiceNumber: new FormControl(''),
      payeeIdNumber: new FormControl('', [Validators.maxLength(30)]),
      // industryType: new FormControl(null, Validators.required),
      purpose: new FormControl(null, Validators.required),
      // Validator applied dynamically via applySourceOfFundsValidation() (India/Philippines only).
      source: new FormControl(null),
      sourceOfCashName: new FormControl(''),
      type: new FormControl<string | null>(null, Validators.required),
      // Bill-related form controls
      commentIds: new FormControl([]),
      attachmentIds: new FormControl([]),
      chequeInvoiceNumber: new FormControl(null)
    });
    this.subscriptions.push(
      this.internationalForm.controls.payee.valueChanges.subscribe((payee) => {
        if (payee && payee?.id && this.selectedPayeeDetails?.id !== payee?.id) {
          this.selectedPayeeDetails = payee;
          this.getPayeeDetails(payee.id);
          this.checkPayeeAddress();
        }
        if (payee === null) {
          this.createdQuote.set(undefined);
        } else {
          this.createQuote();
        }
      }),
      this.internationalForm.controls.amount.valueChanges
        .pipe(debounceTime(1500))
        .subscribe((val) => {
          this.emitCalculateFee(Number(val));
          this.createQuote();
        }),
      this.internationalForm.controls.amount.valueChanges.subscribe((val) => {
        this.paymentsService.hasAmount.update(() => Boolean(val));
        this.limitCard?.clearState();
        this.refreshInsufficientBalance();
      }),
      this.internationalForm.controls.wallet.valueChanges.subscribe(
        (wallet: IWalletData | null) => {
          // International payments require the funding wallet to hold a minimum
          // balance. Reject the selection up-front and surface the error modal.
          if (wallet && this.isBelowInternationalMinBalance(wallet)) {
            this.alertService.failedAlert({
              title: 'Error',
              content: `Selected wallet has insufficient balance. A minimum balance of $${this.MIN_INTERNATIONAL_WALLET_BALANCE}.00 is required.`
            });
            this.internationalForm.controls.wallet.reset(null, {
              emitEvent: false
            });
            this.insufficientBalance.set(false);
            return;
          }
          this.refreshInsufficientBalance();
        }
      ),
      this.internationalForm.controls.payeeBankAc.valueChanges
        .pipe(
          debounceTime(1500),
          filter(() => !!this.internationalForm.controls.type.value) 
        )
        .subscribe(() => {
          this.createQuote();
        }),
      this.internationalForm.controls.type.valueChanges
        .pipe(debounceTime(1500))
        .subscribe((value) => {          
          if (value) {
            this.selectedRecipientType.set(value);
            // Clear in-memory countries data to force refetch with new type
            this.countriesData.set({});
            this.getInternationalPayeeAccounts(this.internationalForm.controls.payee.value?.id);
          }
        }),
      this.internationalForm.controls.type.valueChanges.subscribe((value) => {
        if (value) {
          // The limit is recipient-type specific, so clear the stale result.
          this.limitCard?.clearState();
          this.getSource();
          this.getPurpose();
        }
      })
    );
    this.setCommonFormValues();
  }

  checkPayeeAddress() {
    const payeeData = this.internationalForm.controls?.payee?.value;
    const keysToCheck = ['addressLine1', 'city', 'state', 'country', 'zip'];
    const isAnyKeyMissing = keysToCheck.some((key) => !payeeData[key]);

    if (isAnyKeyMissing) {
      this.isAddressMissing.set(true);
      // For cases where further action is required
      this.alertService
        .warningAlert({
          content: `Address details are missing for the selected payee.`,
          cancelMsg: 'Cancel',
          doneMsg: 'Update Address',
          isCancel: true,
          isOk: true
        })
        .afterClosed()
        .subscribe((res) => {
          this.payeeDetails = undefined;
          if (res) {
            this.payeeService.openPayeeEditModal.next({ page: 'addAddress' });
            this.payeeService.openPayeeEditModal.next(false);
          } else {
            this.payeeDropDownComponent.clearSelection();
            this.isAddressMissing.set(false);
          }
        });
    } else {
      this.isAddressMissing.set(false);
    }
  }

  createQuote() {
    const formValue = this.internationalForm.value;

    // Skip the quote API entirely when the wallet can't cover the amount — the
    // submit guard blocks it and the inline message already explains why.
    if (this.isAmountOverWalletBalance(Number(formValue.amount))) {
      this.createdQuote.set(undefined);
      this.isCreateQuote.set(false);
      return;
    }

    // If type is selected but no countries data is loaded, fetch it first
    if (formValue.type && Object.keys(this.countriesData()).length === 0) {
      // Check if we have cached data
      const cacheKey = formValue.type === 'personal' 
        ? this.COUNTRIES_PERSONAL_CACHE_KEY 
        : this.COUNTRIES_BUSINESS_CACHE_KEY;
      
      const cached = this.localStorageService.getItem(cacheKey as LocalStorageKeys);
      if (!cached) {
        // No cache, fetch from API
        this.fetchEnabledCountriesAndRetry('');
        return;
      }
      
      // Load from cache
      try {
        const parsedCache = JSON.parse(cached);
        this.countriesData.set(parsedCache);
      } catch (error) {
        this.fetchEnabledCountriesAndRetry('');
        return;
      }
    }
    
     // Get the country code from beneficiaryBankDetails
    const countryCode = formValue?.payeeBankAc?.beneficiaryBankDetails?.country;

    // Try to get currency from form first, then from cache
    let payoutCurrency = formValue?.payeeBankAc?.beneficiaryBankDetails?.currency ?? formValue?.payeeBankAc?.currency;

    // If currency is still not found and we have a country code, check cache
    if (!payoutCurrency && countryCode) {
      payoutCurrency = this.getCurrencyFromCache(countryCode);
      
      // If still no currency found, fetch countries data
      if (!payoutCurrency && formValue.type) {
        this.fetchEnabledCountriesAndRetry(countryCode);
        return; // Exit early to wait for countries to be fetched
      }
    }

    if(formValue.amount && formValue?.payee?.encryptedId && formValue?.payeeBankAc?.beneficiaryBankDetails?.country ){
      if(this.isAddressMissing()){
        this.checkPayeeAddress();
      }
    }
    this.payoutCurrencyCode.set(payoutCurrency);
    if (
      Number(formValue.amount) >= 10 &&
      formValue?.payee?.encryptedId &&
      formValue?.payeeBankAc?.beneficiaryBankDetails?.country &&
      !this.isAddressMissing()
    ) {
      const payload = {
        countryCode,
        payoutCurrencyCode: payoutCurrency,
        amount: Number(formValue.amount),
        type: formValue.type || undefined,
        isReceivingAmount: 0
      };
      this.onCreateQuote(payload);
    }
  }

  onCreateQuote(payload: { countryCode: string; payoutCurrencyCode: string; amount: number; type: string; isReceivingAmount: number}, isFromComplete = false) {
    this.isCreateQuote.set(true);
    this.walletService
      .createQuote(payload)
      .pipe(finalize(() => this.isCreateQuote.set(false)))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.createdQuote.set(res.data);
            this.paymentVersion.set(res.data.version);
            this.exchangeRate = Number(
              parseFloat(res.data.customer_exchange_rate).toFixed(2)
            );
            if (isFromComplete) {
              this.onComplete();
              return;
            }
            return;
          }
          this.createdQuote.set(undefined);
          this.clickTrackingService
            .trackInternationalPaymentTransactionNotDoneClick()
            .pipe(take(1))
            .subscribe();
          if (isFromComplete) {
            this.isSubmit.set(false);
          }
          const respFail = res as unknown as {
            errorCode?: number | string;
            errorMsg?: string;
          };
          if (respFail?.errorMsg) {
            this.alertService.failedAlert({
              content: respFail.errorMsg
            });
          }
        },
        error: (err: HttpErrorResponse) => {
          if(isFromComplete){
            this.isSubmit.set(false);
          }
          this.clickTrackingService.trackInternationalPaymentTransactionNotDoneClick().pipe(take(1)).subscribe();
          this.createdQuote.set(undefined);
          if (err.error?.errorCode === '271') {
            this.alertService
              .infoAlert({
                content: `International transfers aren't supported for the selected bank country.Please update your bank account country to continue.`,
                doneMsg: 'Update',
                isCancel: true
              })
              .afterClosed()
              .subscribe((res) => {
                if (res) {
                  this.addInternationalPayeeBankAc(
                    true,
                    this.internationalForm.value?.payeeBankAc?.encrypted_id
                  );
                } else {
                  this.clearBank();
                }
              });
            return;
          }
          // errorCode'd errors are handled by the global ErrorHandlingInterceptor; only show our own modal for errors without an errorCode (e.g. the over-limit 422 deferred via the isDisable422 header) so the two never stack.
          if (err?.error?.errorMsg && !err.error?.errorCode) {
            this.alertService.failedAlert({
              content: err.error.errorMsg
            });
          }
        }
      });
  }

  getPurpose() {
    const countryCode = this.internationalForm.value?.payeeBankAc?.beneficiaryBankDetails?.country;
    const type = this.internationalForm.value?.type;
    if (!countryCode || !type) return;
    this.isPurposeLoading.set(true);
    this.subscriptions.push(
      this.walletService
        .getPurpose({countryCode, type})
        .pipe(finalize(() => this.isPurposeLoading.set(false)))
        .subscribe((res) => {
          if (res.success) {
            // Transform the data to a format that works with your dropdown
            const transformedData = res.data.map((item) => {
              const key = Object.keys(item)[0];
              return {
                code: key,
                description: item[key],
                category: item.category
              };
            });
            this.purposeList.set(transformedData);
            const selectedPurposeCode = this.internationalForm.controls.purpose.value;
            if (selectedPurposeCode) {
              const selectedPurpose = transformedData.find(
                (item) => item.code === selectedPurposeCode
              );
              if (selectedPurpose) {
                this.applyPurposeCategoryValidation(
                  selectedPurpose.category ?? null
                );
              } else {
                // The selected purpose isn't offered for the new country/type — clear it so a stale purpose can't drive the limit check or be submitted.
                this.internationalForm.controls.purpose.setValue(null);
                this.selectedPurpose = '';
                this.applyPurposeCategoryValidation(null);
                this.purposeDropdown?.clearSelection();
                this.limitCard?.clearState();
              }
            }
          }
        })
    );
  }

  /**
   * @description Source of Funds is only required/shown for India and Philippines.
   * Reads the country from the currently selected recipient bank account.
   */
  isSourceOfFundsRequired(): boolean {
    const countryCode = this.internationalForm?.value?.payeeBankAc?.beneficiaryBankDetails?.country;
    return this.sourceOfFundsCountries.includes(countryCode);
  }

  /**
   * @description Applies/removes the required validator on the source control based on the
   * selected bank country, clearing any stale source value when it is not applicable.
   */
  private applySourceOfFundsValidation() {
    const sourceControl = this.internationalForm.controls.source;
    if (this.isSourceOfFundsRequired()) {
      sourceControl.setValidators([Validators.required]);
    } else {
      sourceControl.clearValidators();
      sourceControl.reset(null);
      this.internationalForm.controls.sourceOfCashName.reset('');
      this.selectedSource = '';
      this.sourceList.set([]);
    }
    sourceControl.updateValueAndValidity({ emitEvent: false });
  }

  getSource() {
    this.applySourceOfFundsValidation();
    const countryCode = this.internationalForm.value?.payeeBankAc?.beneficiaryBankDetails?.country;
    const type = this.internationalForm.value?.type;
    if (!countryCode || !type || !this.isSourceOfFundsRequired()) return;

    this.isSourceLoadindg.set(true);
    this.subscriptions.push(
      this.walletService
        .getSourceOfCash({countryCode, type})
        .pipe(finalize(() => this.isSourceLoadindg.set(false)))
        .subscribe((res) => {
          if (res.success) {
            // Transform the data to a format that works with your dropdown
            const transformedData = res.data.map((item) => {
              const key = Object.keys(item)[0];
              return {
                code: key,
                description: item[key]
              };
            });
            this.sourceList.set(transformedData);
          }
        })
    );
  }

  changeSource(event: string) {
    const selectedSource = JSON.parse(event) as {
      code: string;
      description: string;
    };
    this.internationalForm.controls.source.setValue(selectedSource.code);
    this.internationalForm.controls.sourceOfCashName.setValue(selectedSource.description);
  }

  changePurpose(event: string) {
    this.limitCard?.clearState();
    // Selection cleared (e.g. a trade purpose reverted for empty memo): reset dependent state and stop.
    if (!event) {
      this.selectedPurpose = '';
      this.internationalForm.controls.purpose.setValue('');
      this.applyPurposeCategoryValidation(null);
      return;
    }
    const selectedPurpose = JSON.parse(event) as {
      code: string;
      description: string;
      category?: string;
    };
    // Selecting a trade purpose makes the memo required (inline *); it is enforced on Submit, not by reverting the selection here.
    this.applyPurposeCategoryValidation(selectedPurpose.category ?? null);
    this.internationalForm.controls.purpose.setValue(selectedPurpose.code);
    this.selectedPurposeDescription.set(
      selectedPurpose.description || 'Maximum'
    );
    // The limit check runs on Submit (after memo & other required fields are filled), not on purpose selection.
  }

  /** Syncs the limit card's `amountUpdated` quote into the form/signals after the user re-creates the quote with a new amount; the card re-runs its own limit check. */
  onLimitCardAmountUpdated(event: {
    amount: number;
    quote: IWalletInternationaPaymentCreate;
  }): void {
    this.createdQuote.set(event.quote);
    this.paymentVersion.set(event.quote.version);
    this.exchangeRate = Number(
      parseFloat(event.quote.customer_exchange_rate).toFixed(2)
    );
    this.internationalForm.controls.amount.setValue(event.amount, {
      emitEvent: false
    });
    this.emitCalculateFee(Number(event.amount));
  }

  /** On the limit card's `limitCancelled` event (user cancelled the 305 prompt), focuses the amount field; deferred so it lands after the dialog finishes closing/restoring focus. */
  onLimitCancelled(): void {
    setTimeout(() => this.amountInput?.focusInput(), 0);
  }

  /** Emits `calculateFee` so the parent's Amount/Total bar stays in sync with the current amount; centralised so every amount-updating path can reuse it. */
  private emitCalculateFee(amount: number): void {
    this.calculateFee.emit({
      amount,
      paymentSource: 'wallet',
      paymentMethod: 'international'
    });
  }

  private applyPurposeCategoryValidation(category: string | null) {
    const isTrade = category === 'trade';
    this.isMemoRequired.set(isTrade);
    const memoControl = this.internationalForm.get('memo');
    memoControl?.setValidators([
      ...(isTrade ? [Validators.required] : []),
      Validators.maxLength(100),
      Validators.pattern(/^[A-Za-z0-9 -]+$/)
    ]);
    memoControl?.updateValueAndValidity({ emitEvent: false });
    this.selectedPurposeCategory.set(category);
  }

  /**
   * @description This function sets up form value changes subscription and patches the form with initial values.
   */
  setCommonFormValues() {
    this.internationalForm.valueChanges.subscribe((formValueChanges) => {
      this.paymentConfig.paymentFormValue = formValueChanges;
    });
    if (this.paymentConfig.paymentFormValue) {
      this.internationalForm.patchValue({
        ...this.paymentConfig.paymentFormValue
      });
    }
    if (this.paymentConfig.memo) {
      this.internationalForm.controls.memo.setValue(this.paymentConfig.memo);
    }
  }

  /**
   * @description This function is triggered when a payee is selected from the payee dropdown component and assigns payee details to the payment form
   * @param event -The selected payee details from the payee dropdown.
   * @param fromTemplate - Boolean indication whether the method is invoked from template or not (since template has form control already set to payee, we don't have to set it again, which might trigger infinite loops along with ngModel change, which obviously is something we don't want 😶 ).
   */
  payeeSelect(event: IPayeeDropdown, fromTemplate: boolean) {
    this.internationalForm.controls.payeeBankAc.setValue(null);
    this.internationalForm.controls.payeeEmail.reset();
    this.clearBank();
    if (event?.id) {
      if (fromTemplate === false) {
        this.internationalForm.controls.payee.setValue(event);
      }
      this.internationalForm.controls.payeeIdNumber.setValue(
        event?.payeeIdNumber
      );
      this.payeeDetailsEvents.emit({
        payeeDropdownDetails: event,
        isMoreDetailsLoading: true
      });
      this.selectedPayeeDetails = event;
      if (event.email) {
        this.internationalForm.controls.payeeEmail.setValue(event?.email);
      } else {
        this.internationalForm.controls.payeeEmail.setValue(null);
      }
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
    this.editBankName = undefined;
    if (!item) return;
    const bankAccount =
      this.payeeDetails?.bank_accounts.find(
        (account) => account.encrypted_id === item
      ) ?? null;
    this.internationalForm.controls.payeeBankAc.setValue(bankAccount);
    this.payeeDetailsEvents.emit({
      payeeDropdownDetails: this.selectedPayeeDetails,
      isMoreDetailsLoading: false,
      payeeBankDetails: bankAccount
    });
  }

  countryChange(event: { length: { min: number; max: number }; code: string }) {
    this.currenCountryPhoneLength = event.length;
    this.internationalForm.controls.payeePhone.setValidators([
      ValidationService.customMinLength(event.length?.min ?? 10)
    ]);
    this.internationalForm.controls.payeePhone.updateValueAndValidity();
  }

  /**
   * @description This function is called to clear the selected payee and associated details in the payment form.
   */
  onMemoInput(event: Event) {
    const memoInput = event.target as HTMLInputElement;
    memoInput.value = memoInput.value.replace(/[^A-Za-z0-9 -]/g, '');
    this.internationalForm.controls.memo.setValue(memoInput.value);
  }

  clearPayeeSelect() {
    this.selectedPayeeDetails = undefined;
    this.internationalForm.controls.payee.setValue(null);
    this.internationalForm.controls.payeeEmail.reset();
    this.internationalForm.controls.payeePhone.reset();
    this.internationalForm.controls.payeeBankAc.setValue(null);
    this.internationalForm.controls.type.setValue(null);
    this.selectedRecipientType.set(null);
    this.payeeBankDataList = [];
    this.payeeDetailsEvents.emit({
      payeeDropdownDetails: undefined,
      isMoreDetailsLoading: false
    });
    // this.internationalForm.controls.industryType.setValue(null);
    this.internationalAccounts = [];
    this.clearBank();
  }

  /**
   * @description Clears the selected payee account.
   * Resets the value of the payeeBankAc control in the paymentForm.
   */
  clearPayeeAccount() {
    this.internationalForm.controls.payeeBankAc.setValue(null);
    this.payeeDetailsEvents.emit({
      payeeDropdownDetails: this.selectedPayeeDetails,
      isMoreDetailsLoading: false
    });
  }

  walletSelect(event: IWalletData) {
    this.internationalForm.controls.wallet.setValue(event);
  }

  clearWallet() {
    this.internationalForm.controls.wallet.reset();
  }

  /** Parses a wallet balance string (e.g. "$1,250.00") into a number. */
  private parseBalance(value: string | number | null | undefined): number {
    return Number(String(value ?? '0').replace(/[$,]/g, ''));
  }

  /** True when the wallet's available balance is under the international minimum. */
  private isBelowInternationalMinBalance(wallet: IWalletData): boolean {
    const balance = this.parseBalance(
      wallet.availableBalance ?? wallet.currentBalance
    );
    return (
      !Number.isNaN(balance) && balance < this.MIN_INTERNATIONAL_WALLET_BALANCE
    );
  }

  isAmountOverWalletBalance(
    amount = Number(this.internationalForm?.controls?.amount?.value)
  ): boolean {
    const wallet = this.internationalForm?.controls?.wallet
      ?.value as IWalletData | null;
    if (!wallet || !amount || amount <= 0) return false;
    const balance = this.parseBalance(wallet.availableBalance);
    return !Number.isNaN(balance) && amount > balance;
  }

  /** Re-evaluates and stores the inline insufficient-balance state. */
  private refreshInsufficientBalance(): void {
    this.insufficientBalance.set(this.isAmountOverWalletBalance());
  }

  /**
   * @description This function is used to fetch additional details of the selected payee based on the provided payee ID.
   * @param payeeId -The ID of the selected payee.
   */
  getPayeeDetails(payeeId: string) {
    this.payeeDetails = undefined;
    this.subscriptions.push(
      this.paymentsService
        .getPayeeDetails(payeeId, true)
        .pipe(debounceTime(100))
        .subscribe(
          (res) => {
            this.payeeDetails = res;
            if (this.payeeDetails) {
              this.getInternationalPayeeAccounts(payeeId);
              this.internationalForm.controls.payeeIdNumber.setValue(
                this.payeeDetails?.payee_information.payee_id_number
              );
              this.internationalForm.controls.payeeEmail.setValue(
                res.payee_information.payee_email
              );
              this.internationalForm.controls.payeePhone.setValue(
                res.payee_information.payee_phone
              );
            }
          },
          () => {
            this.payeeDetailsEvents.emit({
              payeeDropdownDetails:
                this.internationalForm.controls.payee.value!,
              isMoreDetailsLoading: false
            });
          }
        )
    );
  }

  getInternationalPayeeAccounts(payeeId: string) {
    if(!payeeId || !this.selectedRecipientType()) return;
    this.isLoadBank.set(true);
    this.subscriptions.push(
      this.paymentsService.getInternationalBanksByRecipientType(payeeId, this.selectedRecipientType() as 'business' | 'personal')
        .pipe(finalize(() => this.isLoadBank.set(false)))
        .subscribe({
          next: (banks: IInternationalPayeeBankResponse[]) => {   
            // Convert object to array if needed (API sometimes returns object with numeric keys)
            let banksArray: IInternationalPayeeBankResponse[] = [];
            if (banks) {
              if (Array.isArray(banks)) {
                banksArray = banks;
              } else if (typeof banks === 'object') {
                // Convert object with numeric keys to array
                banksArray = Object.values(banks);
              }
            }
            
            if (banksArray && banksArray.length > 0) {
              // Transform the API response to match expected structure
              const transformedBanks = banksArray.map((bank: IInternationalPayeeBankResponse) => {
                // Parse json_data if it exists
                let parsedJsonData: IInternationalPayeeBankJsonData = {};
                const beneficiaryBankAddress= bank.beneficiaryBankDetails;
                if (bank.json_data) {
                  try {
                    parsedJsonData = JSON.parse(bank.json_data) as IInternationalPayeeBankJsonData;
                  } catch (error) {
                    parsedJsonData = {};
                  }
                }
                
                // Map the API response to IInternationalPayeeAccount structure
                const transformedBank: IInternationalPayeeAccount = {
                  payee_id: bank.payee_id || this.internationalForm.controls.payee.value?.id,
                  bank_name: bank.bank_name,
                  account_number: bank.account_number,
                  account_type: bank.account_type,
                  swift_or_bic: bank.swift_or_bic,
                  encrypted_id: bank.encrypted_id,
                  bank_identifier_type: bank.bank_identifier_type || 'swift',
                  bank_identifier_code: bank.swift_or_bic || bank.bank_identifier_code || '',
                  // Optional fields - convert null to undefined
                  routing_number: bank.routing_number ?? undefined,
                  payee_name: bank.payee_name ?? undefined,
                  payee_nationality: bank.payee_nationality ?? undefined,
                  currency: bank.currency ?? undefined,
                  payment_purpose: bank.payment_purpose ?? undefined,
                  country: bank.country ?? undefined,
                  location: bank.location ?? undefined,
                  pan: bank.pan ?? undefined,
                  ifsc: bank.ifsc ?? undefined,
                  contact_phone: bank.contact_phone ?? undefined,
                  purpose_code: bank.purpose_code ?? undefined,
                  // Create beneficiary from parsed json_data
                  beneficiary: {
                    addressLine1: parsedJsonData.address_line_1 || '',
                    addressLine2: parsedJsonData.address_line_2 || '',
                    city: parsedJsonData.city || '',
                    state: parsedJsonData.state || '',
                    zip: parsedJsonData.zip || '',
                    country: parsedJsonData.country || 'IN',
                    givenName: parsedJsonData.beneficiary_given_name || '',
                    familyName: parsedJsonData.beneficiary_family_name || '',
                    businessLegalName: parsedJsonData.business_legal_name || '',
                    organisationIdNumber: parsedJsonData.organisation_id_number || '',
                    dateOfIncorporation: parsedJsonData.date_of_incorporation || '',
                    countryOfIncorporation: parsedJsonData.country_of_incorporation || ''
                  },
                  // Create beneficiaryBankDetails
                  beneficiaryBankDetails: beneficiaryBankAddress
                };
                
                return transformedBank;
              });
              
              // Replace the old international_payee_accounts with transformed banks
              this.payeeInternationalAccounts.set(transformedBanks);
              // Filter by selected country and set default
              this.setInternationalBankList();
            } else {
              // No banks for this recipient type
              this.clearBank();
            }
          },
          error: () => {
            this.isLoadBank.set(false);
            this.clearBank();
          }
        })
    );
  }

  setInternationalBankList() {    
    const selectedCountryBanks = this.payeeInternationalAccounts();
    if (selectedCountryBanks.length === 0) return;
    if (selectedCountryBanks.length > 0) {
      this.internationalAccountsList.set(selectedCountryBanks);
      const defaultPayeeBank = selectedCountryBanks[0];
      this.internationalForm.controls.payeeBankAc.setValue(defaultPayeeBank);
      this.selectedRecipientBank = defaultPayeeBank?.encrypted_id;
      this.payeeDetailsEvents.emit({
        payeeDropdownDetails: this.selectedPayeeDetails,
        isMoreDetailsLoading: false,
        payeeInterBankData: defaultPayeeBank
      });
      this.getSource();
      this.getPurpose();
    }
  }

  clearBank() {
    this.internationalAccountsList.set([]);
    this.selectedRecipientBank = null;
    this.internationalForm.controls.payeeBankAc.setValue(undefined);
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
          .openAddAttachment(this.createdExistingAttachments, '')
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
          .openAddComment(this.createdExistingComments, '')
          .subscribe((comments: IComments[]) => {
            this.createdExistingComments = comments;
            this.commentsCount = comments.length;
          })
      );
    }
  }

  setDefaultBankForInternational(): void {
    if (
      this.payeeDetails &&
      this.payeeDetails.international_payee_accounts?.length > 0
    ) {
      this.internationalForm.controls.payeeBankAc.setValue(
        this.payeeDetails.international_payee_accounts[0]
      );
      const defaultPayeeBank =
        this.payeeDetails.international_payee_accounts[0];
      this.selectedPayeeBankData = `${
        defaultPayeeBank.bank_name
      } - ${this.utils.getMaskedAcNo(String(defaultPayeeBank.account_number))}`;
      this.payeeDetailsEvents.emit({
        payeeDropdownDetails: this.selectedPayeeDetails,
        isMoreDetailsLoading: false,
        payeeInterBankData: this.internationalForm.controls.payeeBankAc.value
      });
    } else {
      this.internationalForm.controls.payeeBankAc.setValue(undefined);
    }
  }

  clearInterBankAccount(event: IInternationalPayeeAccount): void {
    if (event) {
      this.payeeDetailsEvents.emit({
        payeeDropdownDetails: this.selectedPayeeDetails,
        isMoreDetailsLoading: false
      });
    }
  }

  changeInterBankAccount(event: string): void {
    const selectedBank = this.payeeInternationalAccounts().find(bank => bank.encrypted_id === event);
    this.internationalForm.controls.payeeBankAc.setValue(selectedBank);
    this.payeeDetailsEvents.emit({
      payeeDropdownDetails: this.selectedPayeeDetails,
      isMoreDetailsLoading: false,
      payeeInterBankData: selectedBank
    });
    this.getSource();
    this.getPurpose();
  }

  addInternationalPayeeBankAc(isEdit = false, accountId?: string): void {
    if (!this.payeeDetails?.payeeEncryptedId) {
      return;
    }
    const dialogRef = this.dialog.open(AddRecipientModalComponent, {
      maxWidth: '95%',
      width: '700px',
      disableClose: true,
      data: {
        editMode: isEdit,
        id: this.payeeDetails?.payeeEncryptedId,
        bankAcId: accountId ?? undefined,
        recipientType: this.selectedRecipientType() || 'business',
        mode: 'new-bank-account',
        payeeEmail: this.payeeDetails?.payee_information?.payee_email,
        payeePhone: this.payeeDetails?.payee_information?.payee_phone,
        recipientId: this.payeeDetails?.payeeEncryptedId
      }
    });

    dialogRef
      .afterClosed()
      .subscribe((response: IApiRes<IInternationalBankAccountRequest>) => {
        if (response.success) {
          
          this.internationalForm.controls.payeeBankAc.setValue(undefined);
          const newInternationalPayeeBancAc: IInternationalPayeeAccount = {
            payee_id: this.payeeDetails?.payeeEncryptedId,
            bank_name: response.data.bankName,
            account_number: response.data.accountNumber,
            swift_or_bic: response.data.identifierCode,
            account_type: response.data.accountType,
            bank_identifier_type: response.data.identifierType,
            bank_identifier_code: response.data.identifierCode,
            encrypted_id: response.data.id!,
            beneficiary: response.data.beneficiary,
            beneficiaryBankDetails: response.data.beneficiaryBankDetails,
            ifsc: response.data.ifsc
          };
          this.internationalAccountsList.update((currentAccounts) => [
            ...currentAccounts,
            newInternationalPayeeBancAc
          ]);
          this.selectedRecipientBank = newInternationalPayeeBancAc.encrypted_id;
          this.internationalForm.controls.payeeBankAc.setValue(
            newInternationalPayeeBancAc
          );
          this.payeeDetailsEvents.emit({
            payeeDropdownDetails: this.selectedPayeeDetails,
            isMoreDetailsLoading: false,
            payeeInterBankData: newInternationalPayeeBancAc
          });
          this.alertService.successAlert({
            title: 'Success',
            content: ' Bank account added successfully',
            close: true
          });
          this.getSource();
          this.getPurpose();
        } else {
          this.clearBank();
        }
      });
  }

  /**
   * @description Completes the transaction based on the specified action
   * Validates the payment form and checks if it's valid.
   * @param action -The action to perform for the transaction (1: Complete, 2: Save, 3: Update)
   */
  completeTransaction(busId?: string) {
    if(this.paymentsService.checkForComplianceFreeze()){
      this.paymentsService.openComplianceFreezeModal();
      return;
    }
    const formValue = this.internationalForm.value;
    if (this.internationalForm.invalid) {
      this.internationalForm.markAllAsTouched();
      return;
    }
    if (this.isAmountOverWalletBalance(Number(formValue.amount))) {
      this.alertService.failedAlert({
        title: 'Failed',
        content: 'Insufficient balance on wallet'
      });
      return;
    }
    if (!this.validateUserStatus()) {
      return;
    }

    // Run the transaction-limit check now (after all required fields, incl. memo, are filled); proceed only if it passes.
    this.limitCard?.checkLimit(formValue.purpose as string, undefined, () =>
      this.confirmAndComplete(busId)
    );
  }

  /** Opens the payment confirmation modal and, on confirm, completes the transaction. */
  private confirmAndComplete(busId?: string): void {
    const formValue = this.internationalForm.value;
    const dialogRef = this.paymentsService.openPaymentConfirmationModal({
      accNumber:
        this.paymentConfig?.paymentFormValue?.wallet.bankAccountNumber,
      bankName: this.paymentConfig?.paymentFormValue?.wallet.walletName,
      payeeName: this.selectedPayeeDetails?.name!,
      paymentMethod: 'International Payment',
      amount: Number(formValue.amount).toFixed(2),
      type: 'wallet'
    });
    dialogRef.afterClosed().subscribe((res) => {
      if (res) {
        this.onComplete(busId);
      }
    });
  }

  onComplete(busId?: string, isProceedPayment?: '0' | '1'){
    if(!this.createdQuote()?.quote_id){
      this.isSubmit.set(true);
      const formValue = this.internationalForm.value;
      const payload: { countryCode: string; payoutCurrencyCode: string; amount: number; type: string; isReceivingAmount: number} = {
        countryCode: formValue?.payeeBankAc?.beneficiaryBankDetails?.country,
        payoutCurrencyCode: formValue?.payeeBankAc?.beneficiaryBankDetails?.currency || this.payoutCurrencyCode(),
        amount: Number(formValue.amount),
        type: formValue.type,
        isReceivingAmount: 0
      };
      this.onCreateQuote(payload,true);
      return;
    }
    this.limitCard?.was305Cancelled.set(false);
    const effectiveProceed: '0' | '1' =
      isProceedPayment ?? this.limitCard?.proceedPayment() ?? '0';
    const formValue = this.internationalForm.value;
    const payload: IWalletInternationaPaymentAcceptPayload = {
      payeeId: formValue?.payee?.encryptedId,
      amount: Number(formValue.amount),
      payeeInternationalBankaccountId: formValue?.payeeBankAc?.encrypted_id,
      purpose: formValue?.purpose,
      purpose_category: this.selectedPurposeCategory() ?? undefined,
      quoteId: this.createdQuote()?.quote_id as string,
      walletId: formValue.wallet?.uuId,
      memo: formValue.memo,
      payeeEmail: formValue.payeeEmail,
      payeePhone: formValue.payeePhone,
      country: formValue?.payeeBankAc?.beneficiaryBankDetails?.country,
      businessId: busId,
      type: formValue.type,
      bills: this.bills || [],
      version: this.paymentVersion(),
      isProceedPayment: effectiveProceed
    };
    // Source of Funds is only sent for India and Philippines.
    if (this.isSourceOfFundsRequired()) {
      payload.sourceOfCash = formValue?.source;
      payload.sourceOfCashName = formValue.sourceOfCashName;
    }

    this.isSubmit.set(true);
    this.walletService
      .acceptQoute(payload)
      .pipe(finalize(() => this.isSubmit.set(false)))
      .subscribe({
        next: (resp) => {
          if (resp.success) {
            this.success.emit();
            this.clickTrackingService.trackInternationalPaymentTransactionDoneClick(resp.data.transaction_id).pipe(take(1)).subscribe();
            this.router.navigate(['manage/international-payment/index'],
              {
                queryParams: {
                  tab: 'recent-transactions'
                }
              }
            );
            return;
          }
          this.clickTrackingService.trackInternationalPaymentTransactionNotDoneClick().pipe(take(1)).subscribe();
          const respFail = resp as unknown as {
            errorCode?: number | string;
            errorMsg?: string;
          };
          this.alertService.failedAlert({
            content:
              respFail?.errorMsg || 'Transaction failed. Please try again.'
          });
        },
        error: (err: HttpErrorResponse) => {
          this.clickTrackingService.trackInternationalPaymentTransactionNotDoneClick().pipe(take(1)).subscribe();
          this.paymentsService.isPaymentProcessingSubject.next(false);
          const errorCode = err?.error?.errorCode;

          if (
            err?.status === 305 ||
            errorCode === 305 ||
            errorCode === '305'
          ) {
            this.limitCard?.isAwaiting305Confirmation.set(true);
            const dialog = this.alertService.confirmAlert({
              content:
                err?.error?.errorMsg ||
                'Transaction limit reached. Do you want to proceed?',
              doneMsg: 'Proceed',
              cancelMsg: 'Cancel'
            });
            dialog.afterClosed().subscribe((result) => {
              this.limitCard?.isAwaiting305Confirmation.set(false);
              if (result) {
                this.limitCard?.proceedPayment.set('1');
                this.onComplete(busId, '1');
              } else {
                this.limitCard?.was305Cancelled.set(true);
              }
            });
            return;
          }
          if (errorCode === 312 || errorCode === '312') {
            // Daily/transaction limit exceeded: show the editable limit card under the memo
            // so the user can lower the amount and re-submit, instead of a dead-end alert.
            this.limitCard?.transactionLimitMessage.set(
              err?.error?.errorMsg ||
                'Transaction limit exceeded for this purpose.'
            );
            return;
          }

          if (err.error?.errorCode === '266') {
            this.alertService
              .failedAlert({
                content: err.error?.errorMsg,
                doneMsg: 'Update'
              })
              .afterClosed()
              .subscribe((response) => {
                if (response) {
                  this.payeeService.openPayeeEditModal.next(true);
                  this.payeeService.openPayeeEditModal.next(false);
                }
              });
          }
          if (err.error?.errorCode === '267') {
            this.alertService
              .failedAlert({
                content: err.error?.errorMsg || `Some details are missing for the selected bank account. Please update your bank account to continue.`,
                doneMsg: 'Update',
                isCancel: true
              })
              .afterClosed()
              .subscribe((response) => {
                if (response) {
                  this.addInternationalPayeeBankAc(
                    true,
                    this.internationalForm.value?.payeeBankAc?.encrypted_id
                  );
                }
              });
          }
          if (err.error?.errorCode === 250) {
            this.alertService
              .failedAlert({
                content: `Please map your wallet with business`,
                doneMsg: 'Map',
                isCancel: true
              })
              .afterClosed()
              .subscribe((response) => {
                if (response) {
                  this.openBusinessList();
                }
              });
          }
          if (err.error.errorCode === '112') {
            const dialog = this.dialog.open(OtpModalComponent, {
              maxWidth: '410px',
              width: '100%',
              disableClose: true,
              autoFocus: false,
              data: err.error
            });
            dialog.afterClosed().subscribe((result) => {
              if (result) {
                this.onComplete(busId);
              }
            });
            return;
          }

          const handledCodes: Array<number | string> = [
            '266',
            '267',
            250,
            '250',
            '112',
            112
          ];
          // errorCode'd errors are handled by the global ErrorHandlingInterceptor; only show our own generic modal for errors without an errorCode so the two never stack.
          if (
            !handledCodes.includes(errorCode as number | string) &&
            err?.error?.errorMsg &&
            !errorCode
          ) {
            this.alertService.failedAlert({
              content: err.error.errorMsg
            });
          }
        }
      });
  }

  openBusinessList() {
    const dialog = this.dialog.open(MapSourceWithBusinessModalComponent, {
      maxWidth: '430px',
      width: '100%',
      disableClose: true,
      autoFocus: false,
      panelClass: 'paddingless-modal',
      data: {
        type: 'wallet',
        wallet: this.internationalForm.value.wallet
      }
    });
    dialog.afterClosed().subscribe((res) => {
      if (res.success) {
        const selectedBusinessId = res.business.id;
        this.completeTransaction(selectedBusinessId);
      }
    });
  }

  newPayeeAdd(event: IPayeeDropdown) {
    this.payeeSelect(event, false);
  }

  selectionChange(event: number) {
    // this.internationalForm.controls.industryType.setValue(event);
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

    const verificationStatus: IGettingStartedAPI =
      this.localStorageService.getItem('gettingStartedData');
    if (verificationStatus.kybStatus === null) {
      this.openKybModal();
      return false;
    }

    return true;
  }

  openKybModal() {
    if (environment.isV4Persona) {
      this.personaHelperService
        .openModal('kyb', CVSourceType.other)
        .subscribe();
    } else {
      this.router.navigateByUrl('/manage/users/verify-user-id?type=5');
    }
  }

  private getCurrencyFromCache(countryCode: string): string | null {
    try {
      // Determine which cache to use based on recipient type
      const recipientType = this.internationalForm.get('type')?.value;
      const cacheKey = recipientType === 'personal' 
        ? this.COUNTRIES_PERSONAL_CACHE_KEY 
        : this.COUNTRIES_BUSINESS_CACHE_KEY;
      
      const cached = this.localStorageService.getItem(cacheKey as LocalStorageKeys);
      if (!cached) {
        // If no cache, try in-memory data first
        const memoryData = this.countriesData();
        if (memoryData && Object.keys(memoryData).length > 0) {
          const countryEntry = Object.entries(memoryData).find(
            ([_, value]: [string, IInternationalCountry]) => value.countryCode === countryCode
          );
          if (countryEntry) {
            const [_, countryData] = countryEntry as [string, IInternationalCountry];
            return countryData.currency;
          }
        }
        return null;
      }

      const parsedCache= JSON.parse(cached) as IInternationalCountry;
      const countriesData = parsedCache;

      // Find the country by countryCode
      const countryEntry = Object.entries(countriesData).find(
        ([_, value]: [string, IInternationalCountry]) => value.countryCode === countryCode
      );

      if (countryEntry) {
        const [_, countryData] = countryEntry as [string, IInternationalCountry];
        return countryData.currency;
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  private fetchEnabledCountriesAndRetry(countryCode: string): void {
    if (this.isLoadingCountries()) return;
    
    const recipientType = this.internationalForm.get('type')?.value;
    const cacheKey = recipientType === 'personal' 
      ? this.COUNTRIES_PERSONAL_CACHE_KEY 
      : this.COUNTRIES_BUSINESS_CACHE_KEY;
    
    // Check cache first
    const cached = this.localStorageService.getItem(cacheKey as LocalStorageKeys);
    if (cached) {
        const parsedCache = JSON.parse(cached);
        this.countriesData.set(parsedCache);
        // Retry createQuote after loading from cache only if we have a country code
        if (countryCode) {
          this.createQuote();
        }
        return;
    }
    
    this.isLoadingCountries.set(true);
    
    // Choose API based on recipient type
    const countriesApi$ = recipientType === 'personal' 
      ? this.paymentsService.enabledInternationalPaymentCountriesPersonal()
      : this.paymentsService.enabledInternationalPaymentCountries();
    
    this.subscriptions.push(
      countriesApi$
        .pipe(finalize(() => this.isLoadingCountries.set(false)))
        .subscribe({
          next: (res) => {
            if (res.success) {
              // Store in cache
              this.localStorageService.setItem(cacheKey as LocalStorageKeys, JSON.stringify(res.data));
              
              // Store in memory
              this.countriesData.set(res.data);
              
              // Now retry createQuote with the fetched data only if we have a country code
              if (countryCode) {
                const currency = this.getCurrencyFromCache(countryCode);
                if (currency) {
                  this.createQuote();
                }
              }
            }
          },
          error: () => {
            this.alertService.failedAlert({
              content: 'Failed to fetch enabled countries. Please try again.',
              title: 'Error',
              doneMsg: 'OK'
            });
          }
        })
    );
  }


  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
    this.paymentsService.hasAmount.update(() => false);
  }
}

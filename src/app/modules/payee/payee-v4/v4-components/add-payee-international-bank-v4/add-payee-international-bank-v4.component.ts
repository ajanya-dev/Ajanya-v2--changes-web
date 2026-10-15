import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  Injector,
  OnInit,
  QueryList,
  signal,
  output,
  input,
  ViewChildren
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { debounceTime, distinctUntilChanged, finalize, take, filter } from 'rxjs/operators';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { GoogleAddressService } from 'src/app/core/services/google-address.service';
import { Utils } from 'src/app/data/utils';
import { IApiRes } from 'src/app/models/api';
import { CloudBankService } from 'src/app/shared/service/cloud-bank/cloud-bank.service';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { DOCUMENT, KeyValuePipe, NgClass } from '@angular/common';
import { fromEvent, forkJoin } from 'rxjs';
import { NgSelectComponent, NgSelectModule } from '@ng-select/ng-select';
import {
  faCircleExclamation,
  faXmark,
  faBuilding,
  faUser,
  faMapMarkerAlt,
  faAngleDown,
  faArrowLeft,
  faPenToSquare,
  faSpinner
} from '@fortawesome/pro-solid-svg-icons';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { CommonCountrySelectV4Component } from 'src/app/shared/V4/common-country-select-v4/common-country-select-v4.component';
import { CommonStateSelectV4Component } from 'src/app/shared/V4/common-state-select-v4/common-state-select-v4.component';
import { AddressAutocompleteV4Component } from 'src/app/shared/V4/address-autocomplete-v4/address-autocomplete-v4.component';
import { PhoneInputV4Component } from 'src/app/shared/V4/v4-phone-input/v4-phone-input.component';
import { IGoogleAddress } from 'src/app/modules/more/model/google-autocomplete';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { V4FailedAlertComponent } from 'src/app/shared/alert/v4-components/v4-failed-alert/v4-failed-alert.component';
import { V4WarningAlertComponent } from 'src/app/shared/alert/v4-components/v4-warning-alert/v4-warning-alert.component';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import {
  IBeneficiary,
  IBeneficiaryBankDetails,
  IInternationalBanksPayee
} from 'src/app/modules/cloud-bank/cloud-bank-v2/model/internationalPayments';

import { ICountriesCache, IPayeeAddressDetails, IAddress } from 'src/app/models/wallet';
import { WalletService } from 'src/app/shared/service/wallet/wallet.service';
import { IInternationalWirePayeeAccounts } from 'src/app/modules/payee/payee-v2/model/payee';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogClose,
  MatDialogModule,
  MatDialogRef,
  MatDialogState
} from '@angular/material/dialog';
import { LucideAngularModule, X } from 'lucide-angular';
import { MatTooltip } from '@angular/material/tooltip';
import { V4DatePickerComponent } from 'src/app/shared/V4/v4-date-picker/v4-date-picker.component';

export interface AddPayeeInternationalBankDialogData {
  payeeId: string;
  edit?: boolean;
  bankId?: string;
  accordionMode?: boolean;
  phoneError?: string;
  payeePhone?: string;
  payeeEmail?: string;
  /**
   * The recipient type the payment flow has already settled on. Account type means
   * the same thing here, so it's pre-selected and locked rather than asked twice.
   */
  paymentRecipientType?: 'business' | 'personal';
}

@Component({
  selector: 'app-add-payee-international-bank-v4',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    KeyValuePipe,
    FaIconComponent,
    CommonInputFieldV4Component,
    CommonCountrySelectV4Component,
    CommonStateSelectV4Component,
    CommonButtonV4Component,
    V4ControlMessageComponent,
    NgClass,
    MatDialogModule,
    MatDialogClose,
    LucideAngularModule,
    MatTooltip,
    AddressAutocompleteV4Component,
    NgSelectModule,
    PhoneInputV4Component,
    V4DatePickerComponent
  ],
  templateUrl: './add-payee-international-bank-v4.component.html',
  styleUrl: './add-payee-international-bank-v4.component.scss'
})
export class AddPayeeInternationalBankV4Component implements OnInit {
  readonly XIcon = X;

  private payeeService = inject(PayeeService);
  private googleAddressService = inject(GoogleAddressService);
  private cloudAccService = inject(CloudBankService);
  private paymentsService = inject(PaymentsService);
  private alertService = inject(V4AlertService);
  private dialog = inject(MatDialog);
  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);
  private walletService = inject(WalletService);
  private destroyRef = inject(DestroyRef);
  private injector = inject(Injector);
  private document = inject(DOCUMENT);

  private fieldToInputIdMap: Record<string, string> = {
    ifsc: 'branchCode',
    branchCode: 'branchCode',
    zip: 'beneficiaryBankZip',
    accountNumber: 'accountNumber',
    city: 'beneficiaryBankCity',
    state: 'beneficiaryBankState',
    addressLine1: 'beneficiaryBankStreet1',
    addressLine2: 'beneficiaryBankStreet2',
    bankName: 'bankName',
    routingOrSortCode: 'routingOrSortCode',
    organisationIdNumber: 'organisationIdNumber'
  };

  private dialogData = inject(MAT_DIALOG_DATA, {
    optional: true
  }) as AddPayeeInternationalBankDialogData | null;

  private dialogRef = inject(MatDialogRef, {
    optional: true
  }) as MatDialogRef<AddPayeeInternationalBankV4Component> | null;

  /** Whether the component is running as a standalone modal (not embedded inside another dialog) */
  get isModalMode(): boolean {
    return (
      !!this.dialogData &&
      'payeeId' in this.dialogData &&
      !this.dialogData.accordionMode
    );
  }

  /** Whether the component is opened as a dialog using the accordion (inline) layout */
  get isAccordionDialogMode(): boolean {
    return !!this.dialogData?.accordionMode;
  }

  showHeader = input(true);
  payeePhone = input<string>('');
  payeeEmail = input<string>('');

  payeeIdSignal = signal<string>('');
  payeeIdInput = input<string>('', { alias: 'payeeId' });

  payeeInternationalBankDetailsSignal = signal<IInternationalBanksPayee[]>([]);
  payeeInternationalBankDetailsInput = input<
    IInternationalBanksPayee[] | IInternationalWirePayeeAccounts[]
  >([], { alias: 'payeeInternationalBankDetails' });

  emptyInternationalBank = output<void>();
  /** Emits the saved bank's account type (business vs personal) for payment flows that must stay in sync. */
  InternationalBankSetupFinished = output<{ accountType: 'business' | 'personal'; phone: string | null }>();
  back = output<void>();
  /** Emits the current number of international bank accounts whenever the list changes. */
  bankCountChange = output<number>();

  constructor() {
    effect(() => {
      this.bankCountChange.emit(this.payeeInternationalBankDetailsSignal().length);
    });
  }

  /** When embedded in send payment, pre-select Business/Personal to match recipient type. */
  paymentRecipientTypeInput = input<'business' | 'personal' | null>(null, {
    alias: 'paymentRecipientType'
  });

  /**
   * The recipient type the payment flow fixed, if any: dialog data when opened as a
   * modal, the input when embedded. Non-null means Account Type is decided already —
   * it gets pre-selected and locked instead of being asked a second time.
   */
  readonly paymentRecipientType = computed<'business' | 'personal' | null>(
    () => this.dialogData?.paymentRecipientType ?? this.paymentRecipientTypeInput()
  );

  /** Account Type is not the user's to change when the payment flow already fixed it. */
  readonly isAccountTypeLocked = computed(() => !!this.paymentRecipientType());

  faXmark = faXmark;
  faCircleExclamation = faCircleExclamation;
  faSpinner = faSpinner;
  faBuilding = faBuilding;
  faUser = faUser;
  faMapMarkerAlt = faMapMarkerAlt;
  faAngleDown = faAngleDown;
  faArrowLeft = faArrowLeft;

  readonly todayDate = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();
  /** Beneficiary must be at least 18 years old (matches the old component's getMaxDateOfBirth()). */
  readonly maxDobDate = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 18);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();
  /** Beneficiary can't be older than 120 years (matches the old component's getMinDateOfBirth()). */
  readonly minDobDate = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 120);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();
  faPenToSquare = faPenToSquare;

  editMode: boolean;
  countries: string[] = [];
  phoneErrorMessages: { [key: string]: string } = {};
  newInternationalAcc = false;
  lastFocusedAutocomplete: 'bank' | 'beneficiary' | null = null;
  IsTableRemoved = false;
  IsEditMode = false;
  bankId?: string;
  indexId?: number;
  showingInternationalBankAccount?: IInternationalWirePayeeAccounts;
  private unsavedFullBankData: IInternationalWirePayeeAccounts[] = [];
  /** Set once a save has reported its result, so teardown can't overwrite it. */
  private isSetupFinished = false;

  relationshipList = signal<{ value: string; name: string }[]>([]);
  businessBanks: { label: string; value: string }[] = [];
  bicfiBanks: { label: string; value: string }[] = [];
  internationalPaymentsEnabledCountries = signal<ICountriesCache>({});

  /** Restricted country map ({ countryCode: name }) for the country select, derived from the enabled-countries cache. */
  enabledCountriesMap = computed<{ [code: string]: string }>(() => {
    const result: { [code: string]: string } = {};
    Object.entries(this.internationalPaymentsEnabledCountries()).forEach(
      ([name, data]) => {
        if (data?.countryCode) {
          result[data.countryCode] = name;
        }
      }
    );
    return result;
  });

  organisationIdTypes = signal<{ value: string; label: string }[]>([]);
  beneficiaryIdDocumentTypes = signal<{ value: string; label: string }[]>([]);

  utils = Utils;
  internationalBankAcForm: FormGroup;
  beneficiaryForm: FormGroup;
  beneficiaryBankForm: FormGroup;

  isLoading = signal(false);
  isSubmit = signal(false);
  isEditDataLoading = signal(false);
  isRelationshipLoading = signal(false);
  allowedcountries: Record<string, string> = {};
  isShowIfsc = false;
  isInvalidIban = signal(false);
  isInvalidIfsc = signal(false);
  isAddressLoading = signal(false);
  isAddressFromIFSCCheck = signal(false);
  isIfscChecking = signal(false);
  /**
   * IFSC the current bank address belongs to: the saved code on edit load, or the
   * last code whose lookup succeeded. Re-emits of this value (edit load, the IFSC
   * input mounting, value-accessor echoes) must not re-run the lookup, or it would
   * overwrite the stored address and blank a manually entered zip.
   */
  private lastResolvedIfsc: string | null = null;
  isIbanCountry = signal(false);
  ibanCheckingLoading = signal(false);
  isEnabledCountriesLoading = signal(false);
  isBusinessBanksLoading = signal(false);
  enabledCountryCode: string[] = [];
  selectedBankCountryCode = signal<string[]>([]);
  isCountryChanged = signal(false);
  isUkCountry = signal(false);
  isPhCountry = signal(false);
  isInCountry = signal(false);
  accountTypeOptions = computed(() => {
    const bothOptions = [
      { value: 'business', name: 'Business' },
      { value: 'personal', name: 'Personal' }
    ];
    const businessOnly = [{ value: 'business', name: 'Business' }];
    const pt = this.paymentRecipientType();
    if (pt === 'business') return businessOnly;
    if (pt === 'personal') return [{ value: 'personal', name: 'Personal' }];
    return this.isInCountry() || this.isPhCountry() ? bothOptions : businessOnly;
  });

  @ViewChildren(NgSelectComponent) ngSelects: QueryList<NgSelectComponent>;

  bankDetailsCollapsed = signal(false);
  beneficiaryDetailsCollapsed = signal(true);
  businessDetailsCollapsed = signal(true);
  addressDetailsCollapsed = signal(true);

  userHasBeneficiaryDetails = signal<boolean>(false);
  recipientBeneficiaryDetails = signal<IPayeeAddressDetails | undefined>(undefined);
  selectedAddress = signal<IAddress | undefined>(undefined);
  useExistingRecipientDetails = signal(false);
  detailsLoading = signal(false);

  /** Modal step: 'bankDetails' | 'beneficiaryDetails' | 'businessDetails' */
  modalStep = signal<'bankDetails' | 'beneficiaryDetails' | 'businessDetails'>(
    'bankDetails'
  );


  ngOnInit(): void {
    this.processPayeeIdInput();
    this.processPayeeInternationalBankDetailsInput();
    this.initFormGroup();
    this.applyDefaultPayeeContactDetails();

    toObservable(this.payeePhone, { injector: this.injector })
      .pipe(
        filter(phone => !!phone),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(phone => {
        const phoneCtrl = this.beneficiaryForm?.controls['beneficiaryPhone'];
        if (phoneCtrl) phoneCtrl.patchValue(phone, { emitEvent: false });
      });

    const paymentRt = this.paymentRecipientType();
    if (paymentRt === 'business' || paymentRt === 'personal') {
      this.internationalBankAcForm.patchValue(
        { accountType: paymentRt },
        { emitEvent: true }
      );
    }
    this.getAllowedCountries();

    // Handle edit mode from dialog first (before other mode checks)
    if (this.dialogData?.edit && this.dialogData?.bankId) {
      this.loadInternationalBankForEdit(this.dialogData.bankId);
    } else {
      // Only reset editMode if not in dialog edit mode
      if (this.payeeInternationalBankDetailsSignal()?.length === 0) {
        this.editMode = false;
      }

      if (!this.payeeIdSignal()) {
        this.loadStoredInternationalBankData();
      }

      // In modal/accordion mode (add), show the form directly
      if (this.isModalMode || this.dialogData?.accordionMode) {
        this.newInternationalAcc = true;
        this.IsTableRemoved = true;
      }
    }

    this.getEnabledPaymentCountries();

    effect(() => {
      const newType = this.paymentRecipientType();
      if (!newType) return;

      const currentFormType = this.internationalBankAcForm.get('accountType')?.value;
      if (newType === currentFormType) return;

      this.internationalBankAcForm.patchValue(
        { accountType: newType },
        { emitEvent: false }
      );
      this.beneficiaryBankForm.patchValue({ country: null, currency: null });
      this.isInCountry.set(false);
      this.isPhCountry.set(false);
      this.isIbanCountry.set(false);
      this.isUkCountry.set(false);
      this.getEnabledPaymentCountries();
    }, { injector: this.injector });

    // Modal mode (multi-step wizard) shows one autocomplete at a time.
    // Accordion/inline mode can show bank + beneficiary autocompletes simultaneously → needs count=2.
    this.googleAddressService.resetGoogleAutocompleteAPI(
      this.isModalMode ? undefined : 2
    );

    fromEvent<Event>(this.document, 'scroll', { capture: true })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        const target = event.target as HTMLElement;
        if (!target?.closest?.('.ng-dropdown-panel')) {
          this.closeAllDropdowns();
        }
      });

    this.destroyRef.onDestroy(() => {
      this.closeAllDropdowns();
      // A saved account already reported its result; the list it was saved into is
      // still loading, so an "empty" notification here would only contradict it.
      if (
        !this.isSetupFinished &&
        this.payeeInternationalBankDetailsSignal()?.length === 0
      ) {
        this.notifyEmptyInternationalBank();
      }
    });
  }

  private processPayeeIdInput(): void {
    if (this.isModalMode || this.dialogData?.accordionMode) {
      this.payeeIdSignal.set(this.dialogData?.payeeId ?? '');
    } else {
      const value = this.payeeIdInput();
      if (value) {
        this.payeeIdSignal.set(value);
      }
    }
  }

  private processPayeeInternationalBankDetailsInput(): void {
    if (this.isModalMode || this.dialogData?.accordionMode) {
      this.fetchInternationalBankDataForModal();
      return;
    }
    const value = this.payeeInternationalBankDetailsInput();
    if (value && Array.isArray(value)) {
      this.unsavedFullBankData = [];
      const converted = value.map((item, index) => {
        if ('bankName' in item && 'accountNumber' in item) {
          const wireAccount = item as IInternationalWirePayeeAccounts;
          this.unsavedFullBankData[index] = wireAccount;
          return {
            id: wireAccount.id || '',
            bank_name: wireAccount.bankName || '',
            bankName: wireAccount.bankName || '',
            payee_name: '',
            country: wireAccount.beneficiaryBankDetails?.country || '',
            account_number: wireAccount.accountNumber || '',
            currency: '',
            biz_id: ''
          } as IInternationalBanksPayee;
        }
        return item as IInternationalBanksPayee;
      });
      this.payeeInternationalBankDetailsSignal.set(converted);
    }
  }

  private fetchInternationalBankDataForModal(): void {
    this.payeeService
      .internationalBanksPayee(this.dialogData?.payeeId ?? '')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res?.data) {
          this.payeeInternationalBankDetailsSignal.set(res.data);
        }
      });
  }

  private loadInternationalBankForEdit(bankId: string): void {
    const payeeId = this.payeeIdSignal();
    if (!payeeId || !bankId) return;

    this.bankId = bankId;
    this.editMode = true;
    this.IsEditMode = true;
    this.IsTableRemoved = true;
    this.newInternationalAcc = false;
    this.isEditDataLoading.set(true);
    this.bankDetailsCollapsed.set(false);
    this.beneficiaryDetailsCollapsed.set(false);
    this.businessDetailsCollapsed.set(false);

    const countries$ = toObservable(this.internationalPaymentsEnabledCountries, { injector: this.injector }).pipe(
      filter(c => Object.keys(c).length > 0),
      take(1)
    );

    forkJoin({
      bankData: this.payeeService.getInternationalBank(payeeId, bankId),
      countries: countries$
    })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isEditDataLoading.set(false))
      )
      .subscribe(({ bankData }) => {
        if (bankData?.success) {
          this.showingInternationalBankAccount = bankData.data;
          this.beneficiaryBankForm.controls.country.setValue(
            bankData.data.beneficiaryBankDetails?.country
          );
          this.beneficiaryBankForm.controls.currency.setValue(
            bankData.data.currency
          );
          this.getInternationalPaymentDataList(
            bankData.data.accountType as 'business' | 'personal'
          );
          this.setInternationalBankValue();
          if (this.dialogData?.phoneError) {
            const phoneControl = this.beneficiaryForm.controls['beneficiaryPhone'];
            this.phoneErrorMessages = { serverError: this.dialogData.phoneError };
            phoneControl.setErrors({ serverError: true });
            phoneControl.markAsTouched();
            phoneControl.valueChanges
              .pipe(take(1), takeUntilDestroyed(this.destroyRef))
              .subscribe(() => {
                this.phoneErrorMessages = {};
                phoneControl.setErrors(null);
              });
            this.modalStep.set('beneficiaryDetails');
          }
        }
      });
  }

  loadStoredInternationalBankData(): void {
    this.payeeService.getInternationalbankData
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => {
        if (data && !data.payeeId) {
          const bankData: IInternationalBanksPayee = {
            id: data.id || '',
            bank_name: data.bankName || '',
            bankName: data.bankName || '',
            payee_name: '',
            country: data.beneficiaryBankDetails?.country || '',
            account_number: data.accountNumber || '',
            currency: '',
            biz_id: ''
          };

          const currentList = this.payeeInternationalBankDetailsSignal();
          const existingIndex = currentList.findIndex(
            (bank: IInternationalBanksPayee) =>
              (bank.id && bank.id === bankData.id) ||
              (bank.account_number === bankData.account_number &&
                bank.bank_name === bankData.bank_name)
          );

          if (existingIndex === -1) {
            this.payeeInternationalBankDetailsSignal.set([
              ...currentList,
              bankData
            ]);
          } else {
            const updatedList = [...currentList];
            updatedList[existingIndex] = bankData;
            this.payeeInternationalBankDetailsSignal.set(updatedList);
          }
        }
      });
  }

  getInternationalPaymentDataList(type: 'business' | 'personal') {
    const countryCode = this.beneficiaryBankForm.controls.country.value;
    const payoutCurrencyCode = this.beneficiaryBankForm.controls.currency.value;
    if (!countryCode || !payoutCurrencyCode) return;
    this.paymentsService
      .getInternationalPaymentDataList(type, {
        countryCode,
        payoutCurrencyCode
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            if (res.data.business_banks) {
              this.businessBanks = res.data.business_banks;
            }
            const bicfiBanks = (
              res.data as typeof res.data & {
                bicfi_banks?: { label: string; value: string }[];
              }
            ).bicfi_banks;
            if (bicfiBanks) {
              this.bicfiBanks = bicfiBanks;
            }

            if (
              res.data.relationships &&
              Array.isArray(res.data.relationships)
            ) {
              const transformedRelationships = res.data.relationships.map(
                (item) => ({
                  value: item.value,
                  name: item.label
                })
              );
              this.relationshipList.set(transformedRelationships);
            } else {
              this.relationshipList.set([]);
            }

            if (
              type === 'business' &&
              res.data.beneficiary_document_types &&
              Array.isArray(res.data.beneficiary_document_types)
            ) {
              this.organisationIdTypes.set(
                res.data.beneficiary_document_types.map((item) => ({
                  value: item.value,
                  label: item.label
                }))
              );
            } else if (type === 'business') {
              this.organisationIdTypes.set([]);
            }

            if (
              type === 'personal' &&
              res.data.beneficiary_document_types &&
              Array.isArray(res.data.beneficiary_document_types)
            ) {
              this.beneficiaryIdDocumentTypes.set(
                res.data.beneficiary_document_types.map((item) => ({
                  value: item.value,
                  label: item.label
                }))
              );
            } else if (type === 'personal') {
              this.beneficiaryIdDocumentTypes.set([]);
            }
          }
        },
        error: () => {
          if (type === 'business') {
            this.organisationIdTypes.set([]);
          }
          if (type === 'personal') {
            this.beneficiaryIdDocumentTypes.set([]);
          }
          this.relationshipList.set([]);
        }
      });
  }

  initFormGroup(): void {
    this.beneficiaryForm = new FormGroup({
      addressLine1: new FormControl('', [Validators.required, ValidationService.containsHtmlTag]),
      addressLine2: new FormControl('', [ValidationService.addressValidator]),
      city: new FormControl('', [Validators.required, ValidationService.addressValidator]),
      state: new FormControl('', [Validators.required]),
      zip: new FormControl('', [
        Validators.required,
        ValidationService.noWhitespaceValidator,
        ValidationService.zipValidatorInternational
      ]),
      country: new FormControl(null, [Validators.required]),
      businessLegalName: new FormControl(null, [ValidationService.containsHtmlTag]),
      organisationIdNumber: new FormControl(null, [ValidationService.containsHtmlTag]),
      organisationIdType: new FormControl(null),
      dateOfIncorporation: new FormControl(''),
      countryOfIncorporation: new FormControl(null),
      givenName: new FormControl('', [ValidationService.containsHtmlTag]),
      familyName: new FormControl('', [ValidationService.containsHtmlTag]),
      beneficiaryIdDocumentType: new FormControl(null),
      beneficiaryIdNumber: new FormControl(null, [ValidationService.containsHtmlTag]),
      beneficiaryEmail: new FormControl(null),
      beneficiaryPhone: new FormControl(null, [Validators.required]),
      beneficiaryDateOfBirth: new FormControl(null),
      beneficiaryPoBox: new FormControl(null, [ValidationService.containsHtmlTag])
    });

    this.beneficiaryBankForm = new FormGroup({
      addressLine1: new FormControl(null, [Validators.required, ValidationService.containsHtmlTag]),
      addressLine2: new FormControl(null, [ValidationService.addressValidator]),
      city: new FormControl(null, [Validators.required, ValidationService.addressValidator]),
      state: new FormControl(null, [Validators.required]),
      zip: new FormControl(null, [
        Validators.required,
        ValidationService.noWhitespaceValidator,
        this.zipValidator.bind(this)
      ]),
      country: new FormControl(null, [Validators.required]),
      branchCode: new FormControl(null, [ValidationService.containsHtmlTag]),
      identifierCode: new FormControl(null),
      currency: new FormControl(null, [Validators.required]),
      routingOrSortCode: new FormControl(null, [ValidationService.containsHtmlTag])
    });

    this.internationalBankAcForm = new FormGroup({
      id: new FormControl(null),
      accountNumber: new FormControl(null, [
        Validators.required,
        Validators.minLength(5),
        ValidationService.containsHtmlTag
      ]),
      accountType: new FormControl(null, [Validators.required]),
      bankName: new FormControl(null, [Validators.required, ValidationService.containsHtmlTag]),
      ifsc: new FormControl(null, [ValidationService.containsHtmlTag]),
      type: new FormControl('ripple', [Validators.required]),
      relationship: new FormControl(null, [Validators.required]),
      beneficiary: this.beneficiaryForm,
      beneficiaryBankDetails: this.beneficiaryBankForm
    });
    this.changeIfsc();
    this.changeCountry();
    this.changeIban();
    this.changeAccountType();
  }

  changeIfsc() {
    this.beneficiaryBankForm.controls.branchCode?.valueChanges
      .pipe(
        debounceTime(500),
        // A validity refresh elsewhere on the form re-emits the same IFSC. Re-running
        // the lookup on that would overwrite the bank address the user is editing.
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (this.beneficiaryBankForm.controls.country.value !== 'IN') {
          return;
        }
        if (res && res === this.lastResolvedIfsc) {
          // Address already belongs to this IFSC; restore the resolved state in
          // case an intermediate invalid code cleared it.
          this.isInvalidIfsc.set(false);
          this.internationalBankAcForm.controls.ifsc.setValue(res);
          this.isAddressFromIFSCCheck.set(true);
          return;
        }
        this.isAddressFromIFSCCheck.set(false);
        if (res) {
          this.checkIfsc(res);
        }
      });
  }

  changeIban() {
    this.internationalBankAcForm.controls.accountNumber?.valueChanges
      .pipe(debounceTime(500), takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        const beneficiaryCountry =
          this.beneficiaryBankForm.controls.country?.value;
        if (
          res &&
          beneficiaryCountry &&
          beneficiaryCountry !== 'IN' &&
          beneficiaryCountry !== 'PH' &&
          this.isIbanCountry()
        ) {
          this.checkIban(res);
        } else {
          this.isInvalidIban.set(false);
        }
      });
  }

  changeCountry() {
    this.beneficiaryBankForm.controls.country?.valueChanges
      .pipe(debounceTime(500), takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.isAddressFromIFSCCheck.set(false);
        if (!res || this.isEnabledCountriesLoading()) {
          this.selectedBankCountryCode.set([]);
          return;
        }
        const enabledCountries = this.internationalPaymentsEnabledCountries();
        if (!enabledCountries || Object.keys(enabledCountries).length === 0) {
          return;
        }
        const foundCountry = Object.values(enabledCountries).find(
          (countryData) => countryData.countryCode === res
        );

        if (enabledCountries) {
          if (foundCountry?.is_enabled === 0) {
            this.beneficiaryBankForm.controls.country.setValue(null);
            this.beneficiaryBankForm.controls.currency.setValue(null);
            this.alertService
              .infoAlert({
                content:
                  'International payments to the selected country are not enabled. Contact support to have this option activated for your account',
                isOk: true,
                isCancel: true,
                doneMsg: 'Contact Now',
                cancelMsg: 'Not Now'
              })
              .afterClosed()
              .subscribe((response) => {
                if (response) {
                  this.dynamicWhiteLabelService.goToLiveChat();
                }
              });
            return;
          }
          if (foundCountry) {
            this.isIbanCountry.set(foundCountry.iban === 1);
          } else {
            this.isIbanCountry.set(false);
          }
        }
        if (res !== 'IN' && res !== 'PH' && this.isIbanCountry()) {
          const iban =
            this.internationalBankAcForm.controls.accountNumber.value;
          this.checkIban(iban);
        } else {
          this.isInvalidIban.set(false);
        }
        if (res === 'GB') {
          this.beneficiaryBankForm.controls.routingOrSortCode.setValidators([
            Validators.required
          ]);
          this.isUkCountry.set(true);
        } else {
          this.beneficiaryBankForm.controls.routingOrSortCode.clearValidators();
          this.isUkCountry.set(false);
        }
        this.beneficiaryBankForm.controls.routingOrSortCode.updateValueAndValidity();
        this.isPhCountry.set(res === 'PH');
        this.isInCountry.set(res === 'IN');
        this.checkIfscRequired();
        if (this.editMode && res === 'IN') {
          this.isAddressFromIFSCCheck.set(true);
        }
        this.selectedBankCountryCode.set([res.toLowerCase()]);
        this.googleAddressService.updateCountryRestriction([res.toLowerCase()]);
        this.updateBeneficiaryNameValidation();
        this.getRecipientAddressDetails();
      });
  }

  changeAccountType() {
    this.internationalBankAcForm.controls.accountType?.valueChanges
      .pipe(debounceTime(500), takeUntilDestroyed(this.destroyRef))
      .subscribe((accountType) => {
        this.updateBeneficiaryNameValidation();
        if (accountType) {
          this.getInternationalPaymentDataList(accountType);
          this.getRecipientAddressDetails();
        }
      });
  }

  checkIfsc(ifsc: string) {
    const headerOptions = new HttpHeaders({
      'Content-Type': 'application/json',
      isDisable422: 'true'
    });
    const isIndia = this.beneficiaryBankForm.controls.country.value === 'IN';
    this.isIfscChecking.set(true);
    this.paymentsService
      .checkIfsc(ifsc, headerOptions)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.isInvalidIfsc.set(false);
            this.internationalBankAcForm.controls.ifsc.setValue(ifsc);
            if (isIndia) {
              this.getInternationalBankAddress(ifsc);
              return;
            }
          }
          this.isIfscChecking.set(false);
        },
        error: () => {
          this.isInvalidIfsc.set(true);
          this.internationalBankAcForm.controls.ifsc.setValue(null);
          this.isIfscChecking.set(false);
        }
      });
  }

  private getInternationalBankAddress(ifsc: string) {
    this.isAddressLoading.set(true);
    this.paymentsService
      .getInternationalBankAddress(ifsc)
      .pipe(
        finalize(() => {
          this.isAddressLoading.set(false);
          this.isIfscChecking.set(false);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res?.success) {
          // The lookup has no zip for some branches; keep whatever is already
          // entered instead of blanking it.
          const existingZip = this.beneficiaryBankForm.controls.zip.value;
          this.beneficiaryBankForm.patchValue({
            addressLine1: res.address ?? '',
            city: res.city ?? '',
            state: res.state ?? '',
            zip: res.zip || existingZip || ''
          });
          if (res.bank_name) {
            this.internationalBankAcForm.controls.bankName.setValue(res.bank_name);
          }
          this.lastResolvedIfsc = ifsc;
          this.isAddressFromIFSCCheck.set(true);
        }
      });
  }

  private applyTemporaryErrorHighlight(el: HTMLElement) {
    const prevBorder = el.style.borderColor;
    const prevShadow = el.style.boxShadow;
    el.style.borderColor = 'var(--v4-common-red-color)';
    el.style.boxShadow = '0 0 0 1px var(--v4-common-red-color)';
    const clear = () => {
      el.style.borderColor = prevBorder;
      el.style.boxShadow = prevShadow;
    };
    el.addEventListener('input', clear, { once: true });
    el.addEventListener('blur', clear, { once: true });
  }

  private focusWhenDialogsClosed(controlName: string) {
    const inputId = this.fieldToInputIdMap[controlName];
    if (!inputId) return;

    const runFocus = () =>
      setTimeout(() => {
        const el = this.document.getElementById(inputId) as HTMLElement | null;
        if (el) this.applyTemporaryErrorHighlight(el);
        el?.focus();
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 0);

    const alertDialogRef = this.dialog.openDialogs.find(
      (d) =>
        d.componentInstance instanceof V4FailedAlertComponent ||
        d.componentInstance instanceof V4WarningAlertComponent
    );
    if (!alertDialogRef) {
      runFocus();
      return;
    }
    alertDialogRef.afterClosed().pipe(take(1)).subscribe(() => runFocus());
  }

  private handleInternationalBankApiError(err: HttpErrorResponse) {
    this.isSubmit.set(false);
    const errorCode = err?.error?.errorCode as string | undefined;
    const controlName = err?.error?.errorField as string | undefined;
    if (errorCode === '266') {
      const phoneControl = this.beneficiaryForm.controls['beneficiaryPhone'];
      this.phoneErrorMessages = { serverError: err.error?.errorMsg };
      phoneControl.setErrors({ serverError: true });
      phoneControl.markAsTouched();
      phoneControl.valueChanges
        .pipe(take(1), takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          this.phoneErrorMessages = {};
          phoneControl.setErrors(null);
        });
    }
    if (controlName) {
      this.focusWhenDialogsClosed(controlName);
    }
  }

  checkIban(iban: string) {
    if (!iban) return;
    const headerOptions = new HttpHeaders({
      'Content-Type': 'application/json',
      isDisable422: 'true'
    });
    this.ibanCheckingLoading.set(true);
    this.paymentsService
      .checkIban(
        iban,
        this.beneficiaryBankForm.controls.country.value,
        headerOptions
      )
      .pipe(
        finalize(() => this.ibanCheckingLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.isInvalidIban.set(false);
          }
        },
        error: () => {
          this.isInvalidIban.set(true);
        }
      });
  }

  createInternationalPaymentBankAccount() {
    const formValue = { ...this.internationalBankAcForm.value };
    const accountType = this.internationalBankAcForm.get('accountType')?.value;

    const modifiedBeneficiary = this.cleanBeneficiaryData(
      formValue.beneficiary,
      accountType
    );

    const beneficiaryBankDetails = formValue.beneficiaryBankDetails as
      | (typeof formValue.beneficiaryBankDetails & { identifierCode?: string })
      | undefined;
    const identifierCode = beneficiaryBankDetails?.identifierCode || null;
    if (beneficiaryBankDetails) {
      delete beneficiaryBankDetails.identifierCode;
    }

    const sendingData = {
      ...formValue,
      beneficiary: modifiedBeneficiary,
      payeeId: this.payeeIdSignal(),
      payeePhone: (formValue.beneficiary as Record<string, unknown>)?.['beneficiaryPhone'] as string || null,
      identifierType: null,
      identifierCode
    };

    if (this.payeeIdSignal()) {
      this.payeeService
        .addPayeeInternationalBankAccount(sendingData)
        .pipe(
          finalize(() => this.isSubmit.set(false)),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe({
          next: (response: IApiRes<{ id: string }>) => {
            if (response.success) {
              this.payeeService.setInternationalbankData(
                sendingData as IInternationalWirePayeeAccounts
              );
              this.loadPayeeInternationalBankData();
              this.notifyInternationalBankSetupFinished();
              this.alertService.successAlert({ close: true, timeout: 2000, title: 'Success!', content: 'Bank account added successfully.' });
              if (!this.isModalMode && !this.dialogData?.accordionMode) {
                this.showBankList();
              }
            }
          },
          error: (err: HttpErrorResponse) =>
            this.handleInternationalBankApiError(err)
        });
    } else {
      this.unsavedFullBankData.push(
        sendingData as IInternationalWirePayeeAccounts
      );
      this.payeeService.setInternationalbankData(
        sendingData as IInternationalWirePayeeAccounts
      );

      this.notifyInternationalBankSetupFinished();
      this.isSubmit.set(false);
      if (!this.isModalMode && !this.dialogData?.accordionMode) {
        this.showBankList();
      }
    }
  }

  updateInternationalPaymentBankAccount() {
    const formValue = { ...this.internationalBankAcForm.value };
    const accountType = this.internationalBankAcForm.get('accountType')?.value;

    const modifiedBeneficiary = this.cleanBeneficiaryData(
      formValue.beneficiary,
      accountType
    );

    const beneficiaryBankDetails = formValue.beneficiaryBankDetails as
      | (typeof formValue.beneficiaryBankDetails & { identifierCode?: string })
      | undefined;
    const identifierCode = beneficiaryBankDetails?.identifierCode || null;
    if (beneficiaryBankDetails) {
      delete beneficiaryBankDetails.identifierCode;
    }

    const sendingData = {
      ...formValue,
      beneficiary: modifiedBeneficiary,
      payeeId: this.payeeIdSignal(),
      payeePhone: (formValue.beneficiary as Record<string, unknown>)?.['beneficiaryPhone'] as string || null,
      identifierType: null,
      identifierCode
    };

    if (this.bankId) {
      this.payeeService
        .updatePayeeInternationalBankAccount(this.bankId, sendingData)
        .pipe(
          finalize(() => this.isSubmit.set(false)),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.payeeService.setInternationalbankData(
                sendingData as IInternationalWirePayeeAccounts
              );
              this.loadPayeeInternationalBankData();
              this.notifyInternationalBankSetupFinished();
              this.alertService.successAlert({ close: true, timeout: 2000, title: 'Success!', content: 'Bank account updated successfully.' });
              if (!this.isModalMode && !this.dialogData?.accordionMode) {
                this.showBankList();
              }
            }
          },
          error: (err: HttpErrorResponse) =>
            this.handleInternationalBankApiError(err)
        });
    } else {
      this.payeeService.setInternationalbankData(
        sendingData as IInternationalWirePayeeAccounts
      );

      const bankData: IInternationalBanksPayee = {
        id: sendingData.id || '',
        bank_name: sendingData.bankName || '',
        bankName: sendingData.bankName || '',
        payee_name: '',
        country: formValue.beneficiaryBankDetails?.country || '',
        account_number: sendingData.accountNumber || '',
        currency: '',
        biz_id: ''
      };

      const currentList = this.payeeInternationalBankDetailsSignal();
      const existingIndex = (this.indexId !== undefined && this.indexId >= 0)
        ? this.indexId
        : currentList.findIndex(
            (bank: IInternationalBanksPayee) =>
              (bank.id && bank.id === bankData.id) ||
              (bank.account_number === bankData.account_number &&
                bank.bank_name === bankData.bank_name)
          );

      if (existingIndex !== -1) {
        const updatedList = [...currentList];
        updatedList[existingIndex] = bankData;
        this.unsavedFullBankData[existingIndex] = sendingData as IInternationalWirePayeeAccounts;
        this.payeeInternationalBankDetailsSignal.set(updatedList);
      } else {
        this.payeeInternationalBankDetailsSignal.set([
          ...currentList,
          bankData
        ]);
      }

      this.notifyInternationalBankSetupFinished();
      this.isSubmit.set(false);
      if (!this.isModalMode && !this.dialogData?.accordionMode) {
        this.showBankList();
      }
    }
  }

  loadPayeeInternationalBankData() {
    if (this.payeeIdSignal()) {
      this.payeeService
        .internationalBanksPayee(this.payeeIdSignal())
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((res) => {
          if (res?.success) {
            this.payeeInternationalBankDetailsSignal.set(res.data);
            this.payeeService.updatePayeeInternationalBankList.next(res.data);
          }
        });
    }
  }

  onSubmit() {
    const selectedCountry = this.beneficiaryBankForm.get('country')?.value;
    if (!selectedCountry) {
      this.beneficiaryBankForm.get('country')?.markAsTouched();
      this.bankDetailsCollapsed.set(false);
      return;
    }

    this.internationalBankAcForm.markAllAsTouched();
    this.beneficiaryForm.markAllAsTouched();
    this.beneficiaryBankForm.markAllAsTouched();

    const hasBasicFormErrors =
      this.internationalBankAcForm.invalid ||
      this.beneficiaryForm.invalid ||
      this.beneficiaryBankForm.invalid;

    if (hasBasicFormErrors) {
      this.bankDetailsCollapsed.set(false);
      this.beneficiaryDetailsCollapsed.set(false);
      this.businessDetailsCollapsed.set(false);
      this.addressDetailsCollapsed.set(false);
      this.scrollToFirstInvalidField();
      return;
    }

    this.internationalBankAcForm.markAllAsTouched();

    const accountType = this.internationalBankAcForm.get('accountType')?.value;
    const bankCountry = this.beneficiaryBankForm.get('country')?.value;

    let hasValidationErrors = false;

    if (accountType === 'business') {
      hasValidationErrors =
        this.internationalBankAcForm.invalid ||
        this.isInvalidIfsc() ||
        this.beneficiaryForm.controls.businessLegalName.invalid ||
        this.beneficiaryForm.controls.organisationIdType.invalid ||
        this.beneficiaryForm.controls.organisationIdNumber.invalid ||
        this.beneficiaryForm.controls.dateOfIncorporation.invalid ||
        this.beneficiaryForm.controls.countryOfIncorporation.invalid ||
        this.ibanCheckingLoading();
    } else if (accountType === 'personal') {
      hasValidationErrors =
        this.internationalBankAcForm.invalid ||
        this.isInvalidIfsc() ||
        this.beneficiaryForm.controls.beneficiaryIdDocumentType.invalid ||
        this.beneficiaryForm.controls.beneficiaryIdNumber.invalid ||
        this.ibanCheckingLoading();

      if (bankCountry === 'IN') {
        hasValidationErrors =
          hasValidationErrors ||
          this.beneficiaryForm.controls.givenName.invalid ||
          this.beneficiaryForm.controls.familyName.invalid;
      }
    } else {
      hasValidationErrors =
        this.internationalBankAcForm.invalid || this.ibanCheckingLoading();
    }

    if (hasValidationErrors) {
      this.scrollToFirstInvalidField();
      return;
    }

    this.isSubmit.set(true);

    if (this.editMode || this.IsEditMode) {
      this.updateInternationalPaymentBankAccount();
    } else {
      this.createInternationalPaymentBankAccount();
    }
  }

  onBeneficiaryAddressSelected(address: IGoogleAddress): void {
    if (this.lastFocusedAutocomplete === 'bank') return;
    this.beneficiaryForm.controls.addressLine1.patchValue(address.address);
    this.beneficiaryForm.controls.city.patchValue((address.city ?? '').trim());
    this.beneficiaryForm.controls.state.patchValue(
      (address.state ?? '').trim()
    );
    this.beneficiaryForm.controls.zip.patchValue((address.zip ?? '').trim());
    const countryName = (address.country ?? '').trim();
    const enabledCountries = this.internationalPaymentsEnabledCountries();
    const countryCode =
      Object.entries(enabledCountries).find(
        ([name]) => name.toLowerCase() === countryName.toLowerCase()
      )?.[1]?.countryCode ?? countryName;
    this.beneficiaryForm.controls.country.patchValue(countryCode);

    if (this.beneficiaryForm.controls.country.value === 'IN') {
      this.isShowIfsc = true;
      this.beneficiaryBankForm.controls.branchCode.setValidators([
        Validators.required
      ]);
    } else {
      this.isShowIfsc = false;
      this.beneficiaryBankForm.controls.branchCode.setValidators([]);
    }
    this.beneficiaryBankForm.controls.branchCode.updateValueAndValidity({
      emitEvent: false
    });
  }

  onBeneficiaryBankAddressSelected(address: IGoogleAddress): void {
    if (this.lastFocusedAutocomplete === 'beneficiary') return;
    this.beneficiaryBankForm.controls.addressLine1.patchValue(address.address);
    this.beneficiaryBankForm.controls.city.patchValue(
      (address.city ?? '').trim()
    );
    this.beneficiaryBankForm.controls.state.patchValue(
      (address.state ?? '').trim()
    );
    this.beneficiaryBankForm.controls.zip.patchValue(
      (address.zip ?? '').trim()
    );

    if (this.beneficiaryBankForm.controls.country.value === 'IN') {
      this.isShowIfsc = true;
      this.beneficiaryBankForm.controls.branchCode.setValidators([
        Validators.required
      ]);
    } else {
      this.isShowIfsc = false;
      this.beneficiaryBankForm.controls.branchCode.setValidators([]);
    }
    this.beneficiaryBankForm.controls.branchCode.updateValueAndValidity({
      emitEvent: false
    });

    const bankCountry = this.beneficiaryBankForm.controls.country.value;
    if (bankCountry === 'GB') {
      this.beneficiaryBankForm.controls.routingOrSortCode.setValidators([
        Validators.required
      ]);
      this.isUkCountry.set(true);
    } else {
      this.beneficiaryBankForm.controls.routingOrSortCode.clearValidators();
      this.isUkCountry.set(false);
    }
    this.beneficiaryBankForm.controls.routingOrSortCode.updateValueAndValidity();
    this.isPhCountry.set(bankCountry === 'PH');
    this.isInCountry.set(bankCountry === 'IN');
    this.updateBeneficiaryNameValidation();
  }

  getAllowedCountries() {
    this.cloudAccService.allowedCountries
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res && Object.keys(res).length === 0) {
          this.cloudAccService
            .getAllowedCountries()
            .pipe(take(1), takeUntilDestroyed(this.destroyRef))
            .subscribe((apiRes) => {
              if (apiRes?.data) {
                this.cloudAccService.allowedCountries.next(apiRes.data);
              }
            });
          return;
        }
        this.allowedcountries = res;
        this.countries = Object.keys(this.allowedcountries);
      });
  }

  getEnabledPaymentCountries() {
    const accountType =
      this.paymentRecipientType() ||
      this.internationalBankAcForm.get('accountType')?.value ||
      'business';

    this.isEnabledCountriesLoading.set(true);

    const countriesApi$ =
      accountType === 'personal'
        ? this.paymentsService.enabledInternationalPaymentCountriesPersonal()
        : this.paymentsService.enabledInternationalPaymentCountries();

    countriesApi$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.isEnabledCountriesLoading.set(false);
        if (res.success) {
          this.processCountriesData(res.data);
        }
      },
      error: () => {
        this.isEnabledCountriesLoading.set(false);
      }
    });
  }

  private processCountriesData(data: ICountriesCache) {
    this.internationalPaymentsEnabledCountries.set(data);
    this.enabledCountryCode = Object.values(data).map((country) =>
      country.countryCode.toLowerCase()
    );
    this.onBankCountryChange();
  }

  checkIfscRequired(): void {
    const beneficiaryCountry = this.beneficiaryForm.controls.country.value;
    const beneficiaryBankCountry =
      this.beneficiaryBankForm.controls.country.value;

    if (beneficiaryCountry === 'IN' || beneficiaryBankCountry === 'IN') {
      this.isShowIfsc = true;
      this.beneficiaryBankForm.controls.branchCode.setValidators([
        Validators.required
      ]);
    } else {
      this.isShowIfsc = false;
      this.beneficiaryBankForm.controls.branchCode.clearValidators();
    }

    this.beneficiaryBankForm.controls.branchCode.updateValueAndValidity({
      emitEvent: false
    });
  }

  private updateBeneficiaryNameValidation(): void {
    const accountType = this.internationalBankAcForm.get('accountType')?.value;
    const bankCountry = this.beneficiaryBankForm.get('country')?.value;
    const isPh = bankCountry === 'PH';

    const businessLegalNameControl =
      this.beneficiaryForm.get('businessLegalName');
    const organisationIdNumberControl = this.beneficiaryForm.get(
      'organisationIdNumber'
    );
    const organisationIdTypeControl =
      this.beneficiaryForm.get('organisationIdType');
    const dateOfIncorporationControl = this.beneficiaryForm.get(
      'dateOfIncorporation'
    );
    const countryOfIncorporationControl = this.beneficiaryForm.get(
      'countryOfIncorporation'
    );

    const givenNameControl = this.beneficiaryForm.get('givenName');
    const familyNameControl = this.beneficiaryForm.get('familyName');
    const idDocumentTypeControl = this.beneficiaryForm.get(
      'beneficiaryIdDocumentType'
    );
    const idNumberControl = this.beneficiaryForm.get('beneficiaryIdNumber');

    const emailControl = this.beneficiaryForm.get('beneficiaryEmail');
    const phoneControl = this.beneficiaryForm.get('beneficiaryPhone');
    // Beneficiary phone is required for every country (the API rejects an international payee without one).
    phoneControl?.setValidators([Validators.required]);
    const dobControl = this.beneficiaryForm.get('beneficiaryDateOfBirth');
    const poBoxControl = this.beneficiaryForm.get('beneficiaryPoBox');

    if (accountType === 'business') {
      businessLegalNameControl?.setValidators([Validators.required]);
      organisationIdNumberControl?.setValidators([Validators.required]);
      organisationIdTypeControl?.setValidators([Validators.required]);
      dateOfIncorporationControl?.setValidators([Validators.required]);
      countryOfIncorporationControl?.setValidators([Validators.required]);

      givenNameControl?.clearValidators();
      familyNameControl?.clearValidators();
      idDocumentTypeControl?.clearValidators();
      idNumberControl?.clearValidators();
      dobControl?.clearValidators();

      if (isPh) {
        emailControl?.setValidators([Validators.required, Validators.email]);
        poBoxControl?.setValidators([Validators.required]);
      } else {
        emailControl?.clearValidators();
        poBoxControl?.clearValidators();
      }
    } else if (accountType === 'personal') {
      if (bankCountry === 'IN' || bankCountry === 'PH') {
        givenNameControl?.setValidators([
          Validators.required,
          Validators.pattern(/^[a-zA-Z\s]+$/)
        ]);
        familyNameControl?.setValidators([
          Validators.required,
          Validators.pattern(/^[a-zA-Z\s]+$/)
        ]);
      } else {
        givenNameControl?.clearValidators();
        familyNameControl?.clearValidators();
      }

      idDocumentTypeControl?.setValidators([Validators.required]);
      idNumberControl?.setValidators([Validators.required]);

      businessLegalNameControl?.clearValidators();
      organisationIdNumberControl?.clearValidators();
      organisationIdTypeControl?.clearValidators();
      dateOfIncorporationControl?.clearValidators();
      countryOfIncorporationControl?.clearValidators();

      if (isPh) {
        emailControl?.setValidators([Validators.required, Validators.email]);
        dobControl?.setValidators([
          Validators.required,
          ValidationService.dateOfBirthValidator
        ]);
        poBoxControl?.setValidators([Validators.required]);
      } else {
        emailControl?.clearValidators();
        dobControl?.clearValidators();
        poBoxControl?.clearValidators();
      }
    } else {
      businessLegalNameControl?.clearValidators();
      organisationIdNumberControl?.clearValidators();
      organisationIdTypeControl?.clearValidators();
      dateOfIncorporationControl?.clearValidators();
      countryOfIncorporationControl?.clearValidators();
      givenNameControl?.clearValidators();
      familyNameControl?.clearValidators();
      idDocumentTypeControl?.clearValidators();
      idNumberControl?.clearValidators();
      emailControl?.clearValidators();
      dobControl?.clearValidators();
      poBoxControl?.clearValidators();
    }

    businessLegalNameControl?.updateValueAndValidity({ emitEvent: false });
    organisationIdNumberControl?.updateValueAndValidity({ emitEvent: false });
    organisationIdTypeControl?.updateValueAndValidity({ emitEvent: false });
    dateOfIncorporationControl?.updateValueAndValidity({ emitEvent: false });
    countryOfIncorporationControl?.updateValueAndValidity({ emitEvent: false });
    givenNameControl?.updateValueAndValidity({ emitEvent: false });
    familyNameControl?.updateValueAndValidity({ emitEvent: false });
    idDocumentTypeControl?.updateValueAndValidity({ emitEvent: false });
    idNumberControl?.updateValueAndValidity({ emitEvent: false });
    emailControl?.updateValueAndValidity({ emitEvent: false });
    phoneControl?.updateValueAndValidity({ emitEvent: false });
    dobControl?.updateValueAndValidity({ emitEvent: false });
    poBoxControl?.updateValueAndValidity({ emitEvent: false });
  }

  onBankCountryChange(): void {
    const selectedCountry = this.beneficiaryBankForm.controls.country.value;

    if (!selectedCountry || this.isEnabledCountriesLoading()) {
      return;
    }

    if (selectedCountry === 'IN') {
      this.isShowIfsc = true;
      this.beneficiaryBankForm.controls.branchCode.setValidators([
        Validators.required
      ]);
    } else {
      this.isShowIfsc = false;
      this.beneficiaryBankForm.controls.branchCode.clearValidators();
      this.isInvalidIfsc.set(false);
    }
    this.beneficiaryBankForm.controls.branchCode.updateValueAndValidity({
      emitEvent: false
    });

    if (selectedCountry === 'GB') {
      this.beneficiaryBankForm.controls.routingOrSortCode.setValidators([
        Validators.required
      ]);
      this.isUkCountry.set(true);
    } else {
      this.beneficiaryBankForm.controls.routingOrSortCode.clearValidators();
      this.isUkCountry.set(false);
    }
    this.beneficiaryBankForm.controls.routingOrSortCode.updateValueAndValidity();

    if (selectedCountry === 'PH') {
      this.beneficiaryBankForm.controls.identifierCode.setValidators([
        Validators.required
      ]);
    } else {
      this.beneficiaryBankForm.controls.identifierCode.clearValidators();
      this.beneficiaryBankForm.controls.identifierCode.setValue(null, {
        emitEvent: false
      });
      this.bicfiBanks = [];
    }
    this.beneficiaryBankForm.controls.identifierCode.updateValueAndValidity();

    this.isPhCountry.set(selectedCountry === 'PH');
    this.isInCountry.set(selectedCountry === 'IN');

    const isMultiAccountType =
      selectedCountry === 'IN' || selectedCountry === 'PH';
    if (!isMultiAccountType && !this.paymentRecipientType()) {
      this.internationalBankAcForm.patchValue({ accountType: 'business' });
    }

    if (selectedCountry && this.internationalPaymentsEnabledCountries()) {
      Object.entries(this.internationalPaymentsEnabledCountries()).forEach(
        ([, countryData]) => {
          if (countryData.countryCode === selectedCountry) {
            this.beneficiaryBankForm.controls.currency.setValue(
              countryData.currency
            );
            const accountType =
              this.internationalBankAcForm.get('accountType')?.value ||
              this.paymentRecipientType() ||
              'business';
            if (accountType) {
              this.getInternationalPaymentDataList(
                accountType as 'business' | 'personal'
              );
            }
          }
        }
      );
    }

    const enabledCountries = this.internationalPaymentsEnabledCountries();
    if (enabledCountries) {
      const foundCountry = Object.values(enabledCountries).find(
        (countryData) => countryData.countryCode === selectedCountry
      );
      if (foundCountry) {
        this.isIbanCountry.set(foundCountry.iban === 1);
      } else {
        this.isIbanCountry.set(false);
      }
    }
    setTimeout(() => {
      this.isCountryChanged.set(true);
    }, 0);

    this.selectedBankCountryCode.set([selectedCountry.toLowerCase()]);
    this.googleAddressService.updateCountryRestriction([selectedCountry.toLowerCase()]);
    this.updateBeneficiaryNameValidation();
  }

  zipValidator(control: FormControl) {
    if (!control.value) {
      return null;
    }
    const country = this.beneficiaryBankForm?.get('country')?.value;
    const minLength = country === 'PH' ? 4 : 5;
    const zip = String(control.value);
    if (control.value == null || control.value === '') {
      return true;
    }
    if (control.value.length < minLength || control.value.length > 10) {
      return { invalidZip: false };
    }

    if (zip.match(/[!@#$%^&*()_+=[\]{};':"\\|,.<>/?]/)) {
      return { invalidZip: false };
    }
    return true;
  }

  private cleanBeneficiaryData(beneficiary: IBeneficiary, accountType: string) {
    const bankCountry = this.beneficiaryBankForm.get('country')?.value;
    const isPh = bankCountry === 'PH';

    const cleanedBeneficiary: IBeneficiary = {
      addressLine1: beneficiary.addressLine1,
      addressLine2: beneficiary.addressLine2,
      city: beneficiary.city,
      state: beneficiary.state,
      zip: beneficiary.zip,
      country: beneficiary.country
    };

    if (accountType === 'business') {
      cleanedBeneficiary.businessLegalName = beneficiary.businessLegalName;
      cleanedBeneficiary.organisationIdNumber =
        beneficiary.organisationIdNumber;
      cleanedBeneficiary.dateOfIncorporation = beneficiary.dateOfIncorporation;
      cleanedBeneficiary.countryOfIncorporation =
        beneficiary.countryOfIncorporation;
      cleanedBeneficiary.idType = beneficiary.organisationIdType || '';
    } else if (accountType === 'personal') {
      cleanedBeneficiary.givenName = beneficiary.givenName;
      cleanedBeneficiary.familyName = beneficiary.familyName;
      cleanedBeneficiary.organisationIdNumber = beneficiary.beneficiaryIdNumber;
      cleanedBeneficiary.idType = beneficiary.beneficiaryIdDocumentType || '';
      if (isPh) {
        const b = beneficiary as unknown as Record<string, unknown>;
        cleanedBeneficiary.dateOfBirth = b.beneficiaryDateOfBirth as string;
      }
    }

    const b = beneficiary as unknown as Record<string, unknown>;
    if (b['beneficiaryPhone']) {
      cleanedBeneficiary.phone = b['beneficiaryPhone'] as string;
    }
    if (isPh) {
      cleanedBeneficiary.email = b['beneficiaryEmail'] as string;
      cleanedBeneficiary.poBox = b['beneficiaryPoBox'] as string;
    }

    return cleanedBeneficiary;
  }

  closeAllDropdowns(): void {
    this.ngSelects?.forEach((s) => s.close());
  }

  toggleCollapse(section: string) {
    if (section === 'bankDetails') {
      this.bankDetailsCollapsed.set(!this.bankDetailsCollapsed());
    } else if (section === 'beneficiaryDetails') {
      this.beneficiaryDetailsCollapsed.set(!this.beneficiaryDetailsCollapsed());
    } else if (section === 'businessDetails') {
      this.businessDetailsCollapsed.set(!this.businessDetailsCollapsed());
    } else if (section === 'addressDetails') {
      this.addressDetailsCollapsed.set(!this.addressDetailsCollapsed());
    }
  }

  NewBankAcc() {
    this.resetBankForms();
    this.newInternationalAcc = true;
    this.IsTableRemoved = true;
    this.editMode = false;
    this.IsEditMode = false;
  }

  /** True when the add/edit form is showing on top of a non-empty bank list. */
  private isFormOpenOverList(): boolean {
    return (
      (this.newInternationalAcc || this.editMode || this.IsEditMode) &&
      this.payeeInternationalBankDetailsSignal()?.length > 0
    );
  }

  /**
   * Return from the add/edit form to the bank list. Embedded in the payee modal
   * the component stays alive, so the form must be cleared here rather than by
   * being re-created; emitting `back` instead would collapse the whole section
   * and cancel the in-flight list reload.
   */
  private showBankList(): void {
    this.newInternationalAcc = false;
    this.IsTableRemoved = false;
    this.editMode = false;
    this.IsEditMode = false;
    this.resetBankForms();
  }

  private resetBankForms(): void {
    this.bankId = undefined;
    this.indexId = undefined;
    this.showingInternationalBankAccount = undefined;
    this.lastResolvedIfsc = null;
    this.internationalBankAcForm.reset({ type: 'ripple' }, { emitEvent: false });
    const recipientType = this.paymentRecipientType();
    if (recipientType) {
      this.internationalBankAcForm.patchValue(
        { accountType: recipientType },
        { emitEvent: false }
      );
    }
    this.isShowIfsc = false;
    this.isInCountry.set(false);
    this.isPhCountry.set(false);
    this.isUkCountry.set(false);
    this.isIbanCountry.set(false);
    this.isInvalidIfsc.set(false);
    this.isInvalidIban.set(false);
    this.isAddressFromIFSCCheck.set(false);
    this.selectedBankCountryCode.set([]);
    this.applyDefaultPayeeContactDetails();
  }

  editbtn(
    Bank: IInternationalWirePayeeAccounts | IInternationalBanksPayee,
    index: number
  ) {
    this.bankId = Bank?.id;
    this.indexId = index;

    this.editMode = true;
    this.IsEditMode = true;
    this.IsTableRemoved = true;

    if (this.payeeIdSignal() && this.bankId) {
      this.isEditDataLoading.set(true);
      this.payeeService
        .getInternationalBank(this.payeeIdSignal(), this.bankId)
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          finalize(() => this.isEditDataLoading.set(false))
        )
        .subscribe((res) => {
          if (res?.success) {
            this.showingInternationalBankAccount = res.data;
            this.beneficiaryBankForm.controls.country.setValue(
              res.data.beneficiaryBankDetails?.country
            );
            this.beneficiaryBankForm.controls.currency.setValue(
              res.data.currency
            );
            this.getInternationalPaymentDataList(
              res.data.accountType as 'business' | 'personal'
            );
            this.setInternationalBankValue();
          }
        });
    } else {
      const fullData = this.unsavedFullBankData[index];
      if (fullData) {
        this.showingInternationalBankAccount = fullData;
        this.patchBeneficiaryBankDetails(fullData.beneficiaryBankDetails);
        this.getInternationalPaymentDataList(fullData.accountType as 'business' | 'personal');
        this.setInternationalBankValue();
        const currentPhone = this.payeePhone();
        if (currentPhone) {
          this.beneficiaryForm?.controls['beneficiaryPhone']?.patchValue(currentPhone, { emitEvent: false });
        }
      }
    }
  }

  setInternationalBankValue() {
    const bankData = this.showingInternationalBankAccount;
    if (bankData) {
      this.internationalBankAcForm.patchValue({
        id: bankData.id,
        accountNumber: bankData.accountNumber,
        accountType: bankData.accountType,
        bankName: bankData.bankName,
        ifsc: bankData.ifsc,
        relationship: (bankData as unknown as Record<string, unknown>).relationship as string ?? null
      });

      if (bankData.beneficiary) {
        this.beneficiaryForm.patchValue(bankData.beneficiary);
        const b = bankData.beneficiary as unknown as Record<string, unknown>;
        // cleanBeneficiaryData renames organisationIdType/beneficiaryIdDocumentType → idType
        // map it back to the correct form control name
        if (b['idType']) {
          if (bankData.accountType === 'business') {
            this.beneficiaryForm.controls.organisationIdType?.patchValue(b['idType']);
          } else {
            this.beneficiaryForm.controls.beneficiaryIdDocumentType?.patchValue(b['idType']);
          }
        }
        if (b.phone) this.beneficiaryForm.controls['beneficiaryPhone']?.patchValue(b.phone, { emitEvent: false });
        if (b.email || (b as Record<string, unknown>)['payeeEmail']) this.beneficiaryForm.controls['beneficiaryEmail']?.patchValue(b.email ?? (b as Record<string, unknown>)['payeeEmail'], { emitEvent: false });
        if (b.poBox) this.beneficiaryForm.controls['beneficiaryPoBox']?.patchValue(b.poBox, { emitEvent: false });
        if (b.dateOfBirth) this.beneficiaryForm.controls['beneficiaryDateOfBirth']?.patchValue(b.dateOfBirth, { emitEvent: false });
      }

      if (bankData.beneficiaryBankDetails) {
        this.patchBeneficiaryBankDetails(bankData.beneficiaryBankDetails);
      }
      if (bankData.bankIdentifierCode) {
        this.beneficiaryBankForm.controls.identifierCode.patchValue(
          bankData.bankIdentifierCode
        );
      }
      if (bankData.json_data) {
        this.populateFormFields(
          bankData.accountType as 'business' | 'personal',
          bankData.json_data as unknown as Record<string, unknown>
        );
      }
      // The saved address already belongs to this IFSC; don't look it up again.
      this.lastResolvedIfsc =
        this.beneficiaryBankForm.controls.branchCode.value || bankData.ifsc || null;
    }
  }

  /**
   * Saved bank details carry the IFSC as branchCode. Patching it with events on
   * re-runs the IFSC lookup, which overwrites the stored bank address and blanks
   * the zip when the lookup returns none. Patch it silently instead.
   */
  private patchBeneficiaryBankDetails(
    details: IBeneficiaryBankDetails | undefined
  ) {
    if (!details) return;
    const { branchCode, ...rest } = details as IBeneficiaryBankDetails & {
      branchCode?: string;
    };
    this.beneficiaryBankForm.patchValue(rest);
    if (branchCode) {
      this.beneficiaryBankForm.controls.branchCode.patchValue(branchCode, {
        emitEvent: false
      });
    }
  }

  populateFormFields(
    accountType: 'business' | 'personal',
    jsonData: Record<string, unknown>
  ) {
    // Patch relationship (common to both account types)
    if (jsonData.relationship) {
      this.internationalBankAcForm.controls.relationship.patchValue(
        jsonData.relationship
      );
    }

    // Patch branch code / IFSC
    if (jsonData.branch_code) {
      this.beneficiaryBankForm.controls.branchCode.patchValue(
        jsonData.branch_code,
        { emitEvent: false }
      );
    }

    // Patch routing/sort code for UK accounts (applies to any account type)
    if (jsonData.routing_or_sort_code) {
      this.beneficiaryBankForm.patchValue({
        routingOrSortCode: jsonData.routing_or_sort_code
      });
    }

    if (accountType === 'business') {
      this.beneficiaryForm.patchValue({
        businessLegalName: jsonData.business_legal_name ?? null,
        organisationIdNumber: jsonData.organisation_id_number ?? null,
        organisationIdType: jsonData.id_type ?? null,
        dateOfIncorporation: jsonData.date_of_incorporation || null,
        countryOfIncorporation: jsonData.country_of_incorporation || null
      });
    } else {
      if (jsonData.beneficiary_given_name) {
        this.beneficiaryForm.controls.givenName.patchValue(
          jsonData.beneficiary_given_name
        );
      }
      if (jsonData.beneficiary_family_name) {
        this.beneficiaryForm.controls.familyName.patchValue(
          jsonData.beneficiary_family_name
        );
      }
      this.beneficiaryForm.controls.beneficiaryIdNumber.patchValue(
        jsonData.organisation_id_number ?? null
      );
      this.beneficiaryForm.controls.beneficiaryIdDocumentType.patchValue(
        jsonData.id_type ?? null
      );
      if (jsonData.date_of_birth) {
        this.beneficiaryForm.controls.beneficiaryDateOfBirth.patchValue(
          jsonData.date_of_birth
        );
      }
    }

    // PH-specific fields (both personal and business)
    if (jsonData.payee_email || jsonData.email) {
      this.beneficiaryForm.controls.beneficiaryEmail.patchValue(jsonData.payee_email ?? jsonData.email);
    }
    if (jsonData.payee_phone || jsonData.phone) {
      this.beneficiaryForm.controls.beneficiaryPhone.patchValue(jsonData.payee_phone ?? jsonData.phone);
    }
    if (jsonData.po_box) {
      this.beneficiaryForm.controls.beneficiaryPoBox.patchValue(
        jsonData.po_box
      );
    }
  }

  onBankModalDelete(bankId: string, i: number) {
    const alert = this.openConfirmAlert();
    alert.afterClosed().subscribe((res) => {
      if (res) {
        this.Ondelect(bankId, i);
      }
    });
  }

  Ondelect(bankId: string, index: number) {
    const removeAtIndex = () => {
      this.payeeInternationalBankDetailsSignal.set(
        this.payeeInternationalBankDetailsSignal().filter((_, i) => i !== index)
      );
      this.unsavedFullBankData = this.unsavedFullBankData.filter((_, i) => i !== index);
      if (this.payeeInternationalBankDetailsSignal().length === 0) {
        this.notifyEmptyInternationalBank();
      }
    };

    if (bankId) {
      this.payeeService
        .DeletePayeeIPBank(bankId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((res) => {
          if (res?.success) {
            removeAtIndex();
          }
        });
    } else {
      removeAtIndex();
    }
  }

  openConfirmAlert() {
    const data = {
      content: 'Are you sure you want to delete this bank account?',
      cancelMsg: 'No, Cancel!',
      doneMsg: 'Yes, Delete!'
    };
    return this.alertService.confirmAlert(data);
  }

  /** Validate bank details step fields and move to beneficiary step in modal mode */
  modalNextFromBankDetails(): void {
    const selectedCountry = this.beneficiaryBankForm.get('country')?.value;
    if (!selectedCountry) {
      this.beneficiaryBankForm.get('country')?.markAsTouched();
      return;
    }

    // Only validate bank-details-step-specific fields (not nested beneficiary form)
    const bankStepFields = [
      'accountNumber',
      'accountType',
      'bankName',
      'relationship'
    ];
    let hasErrors = false;

    bankStepFields.forEach((field) => {
      const ctrl = this.internationalBankAcForm.get(field);
      if (ctrl) {
        ctrl.markAsTouched();
        if (ctrl.invalid) hasErrors = true;
      }
    });

    // Validate beneficiaryBankDetails fields (bank address)
    const bankAddressFields = [
      'country',
      'addressLine1',
      'city',
      'state',
      'zip',
      'currency'
    ];
    bankAddressFields.forEach((field) => {
      const ctrl = this.beneficiaryBankForm.get(field);
      if (ctrl) {
        ctrl.markAsTouched();
        if (ctrl.invalid) hasErrors = true;
      }
    });

    // Validate branchCode if IFSC is required
    if (
      this.isShowIfsc ||
      (this.businessBanks.length > 0 &&
        this.beneficiaryBankForm.controls.country.value === 'PH')
    ) {
      const branchCtrl = this.beneficiaryBankForm.get('branchCode');
      if (branchCtrl) {
        branchCtrl.markAsTouched();
        if (branchCtrl.invalid) hasErrors = true;
      }
    }

    // Validate identifierCode (Beneficiary Bank BIC code) for Philippines
    if (this.beneficiaryBankForm.controls.country.value === 'PH') {
      const identifierCtrl = this.beneficiaryBankForm.get('identifierCode');
      if (identifierCtrl) {
        identifierCtrl.markAsTouched();
        if (identifierCtrl.invalid) hasErrors = true;
      }
    }

    if (hasErrors) {
      this.scrollToFirstInvalidField();
      return;
    }
    if (
      this.isInvalidIban() ||
      this.isInvalidIfsc() ||
      this.ibanCheckingLoading()
    )
      return;

    this.modalStep.set('beneficiaryDetails');
  }

  /** Validate beneficiary step fields and move to business step or submit */
  modalNextFromBeneficiaryDetails(): void {
    this.beneficiaryForm.markAllAsTouched();
    const accountType = this.internationalBankAcForm.get('accountType')?.value;
    const bankCountry = this.beneficiaryBankForm.get('country')?.value;

    if (accountType === 'personal') {
      if (
        this.beneficiaryForm.controls.beneficiaryIdDocumentType.invalid ||
        this.beneficiaryForm.controls.beneficiaryIdNumber.invalid
      ) {
        this.scrollToFirstInvalidField();
        return;
      }
      if (bankCountry === 'IN') {
        if (
          this.beneficiaryForm.controls.givenName.invalid ||
          this.beneficiaryForm.controls.familyName.invalid
        ) {
          this.scrollToFirstInvalidField();
          return;
        }
      }
    }

    // Check address fields
    if (
      this.beneficiaryForm.controls.addressLine1.invalid ||
      this.beneficiaryForm.controls.city.invalid ||
      this.beneficiaryForm.controls.state.invalid ||
      this.beneficiaryForm.controls.zip.invalid ||
      this.beneficiaryForm.controls.country.invalid
    ) {
      this.scrollToFirstInvalidField();
      return;
    }

    if (accountType === 'business') {
      this.modalStep.set('businessDetails');
    } else {
      // Personal — no business step, submit directly
      this.onSubmit();
    }
  }

  modalGoBack(): void {
    const step = this.modalStep();
    if (step === 'beneficiaryDetails') {
      this.modalStep.set('bankDetails');
    } else if (step === 'businessDetails') {
      this.modalStep.set('beneficiaryDetails');
    }
  }

  closeModal(): void {
    this.dialogRef?.close();
  }

  private scrollToFirstInvalidField(): void {
    setTimeout(() => {
      const firstInvalid = this.document.querySelector(
        '.intl-bank-wrapper .ng-invalid:not(form):not([formgroupname])'
      ) as HTMLElement | null;
      if (firstInvalid) {
        firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  }

  private resolveAccountTypeForEmit(): 'business' | 'personal' {
    const v = this.internationalBankAcForm?.get('accountType')?.value;
    return v === 'personal' ? 'personal' : 'business';
  }

  private notifyInternationalBankSetupFinished(): void {
    this.isSetupFinished = true;
    const accountType = this.resolveAccountTypeForEmit();
    const phone = this.beneficiaryForm.controls.beneficiaryPhone.value as string | null;
    if (this.isModalMode || this.dialogData?.accordionMode) {
      this.dialogRef?.close({ success: true, accountType, phone });
    } else {
      this.InternationalBankSetupFinished.emit({ accountType, phone });
    }
  }

  private notifyEmptyInternationalBank(): void {
    if (this.isModalMode || this.dialogData?.accordionMode) {
      // Closing again once the exit animation has begun replaces the result the
      // first close() settled on, so leave an already-closing dialog alone.
      if (this.dialogRef?.getState() !== MatDialogState.OPEN) return;
      this.dialogRef.close({ empty: true });
    } else {
      this.emptyInternationalBank.emit();
    }
  }

  backbutton() {
    if (this.isModalMode || this.dialogData?.accordionMode) {
      this.dialogRef?.close();
    } else if (this.isFormOpenOverList()) {
      this.showBankList();
    } else {
      this.back.emit();
    }
  }

  getRecipientAddressDetails() {
    if (this.editMode) return;
    const countryCode = this.beneficiaryBankForm.controls.country.value;
    const accountType = this.internationalBankAcForm.controls.accountType.value as 'business' | 'personal';
    const payeeId = this.payeeIdSignal();
    if (!payeeId || !countryCode || !accountType) return;
    this.userHasBeneficiaryDetails.set(false);
    this.useExistingRecipientDetails.set(false);
    this.resetBeneficiaryFormFields();
    this.applyDefaultPayeeContactDetails();
    this.detailsLoading.set(true);
    this.walletService.existingBeneficiaryDetails(countryCode, accountType, payeeId)
      .pipe(finalize(() => this.detailsLoading.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res.success) {
          this.recipientBeneficiaryDetails.set(res.data);
          const payeeAddress = res.data.payee_details.address;
          const hasValidPayeeAddress = Object.values(payeeAddress).some(v => v !== undefined && v !== null && v !== '');
          const existingBeneficiaryDetails = res.data.existing_beneficiary_details ?? [];
          // Fall back to the most recent prior beneficiary's address when the payee
          // itself has no saved address on file, so the checkbox still surfaces.
          const resolvedAddress = hasValidPayeeAddress
            ? payeeAddress
            : existingBeneficiaryDetails[0]?.address;
          this.selectedAddress.set(resolvedAddress ?? undefined);
          const hasPayeeName = !!res.data.payee_details.payee_name?.trim();
          this.userHasBeneficiaryDetails.set(hasValidPayeeAddress || existingBeneficiaryDetails.length > 0 || hasPayeeName);
          if (this.userHasBeneficiaryDetails()) {
            this.useExistingRecipientDetails.set(true);
            this.toggleUseExistingRecipientDetails({ target: { checked: true } } as unknown as Event);
          }
        }
      });
  }

  toggleUseExistingRecipientDetails(event: Event) {
    const isChecked = (event.target as HTMLInputElement).checked;
    this.useExistingRecipientDetails.set(isChecked);
    if (!isChecked) {
      this.resetBeneficiaryFormFields();
      return;
    }
    this.setFormData();
  }

  setFormData() {
    const payeeDetails = this.recipientBeneficiaryDetails()?.payee_details;
    const address = this.selectedAddress();
    const isPersonal = this.internationalBankAcForm.controls.accountType.value === 'personal';
    const isPH = this.beneficiaryBankForm.controls.country.value === 'PH';
    const country = address?.country ?? null;
    // Only the payee's own details are reused. Bank-account specific fields are
    // explicitly nulled so stale values never survive a re-check or account type switch.
    this.beneficiaryForm.patchValue({
      businessLegalName: !isPersonal ? payeeDetails?.payee_name ?? null : null,
      organisationIdNumber: null,
      organisationIdType: null,
      dateOfIncorporation: null,
      countryOfIncorporation: null,
      givenName: isPersonal ? payeeDetails?.payee_name ?? null : null,
      familyName: null,
      beneficiaryIdNumber: null,
      beneficiaryIdDocumentType: null,
      beneficiaryPoBox: null,
      beneficiaryDateOfBirth: null,
      beneficiaryEmail: isPH ? (payeeDetails?.payee_email || this.dialogData?.payeeEmail || this.payeeEmail() || null) : null,
      beneficiaryPhone: payeeDetails?.payee_phone || this.dialogData?.payeePhone || this.payeePhone() || null,
      addressLine1: address?.line1 ?? null,
      addressLine2: address?.line2 ?? null,
      city: address?.city ?? null,
      state: address?.state ?? null,
      zip: address?.zip ?? null
    }, { emitEvent: false });
    if (country) {
      this.beneficiaryForm.controls.country.setValue(country);
    }
  }

  private applyDefaultPayeeContactDetails(): void {
    const phone = this.dialogData?.payeePhone || this.payeePhone();
    const email = this.dialogData?.payeeEmail || this.payeeEmail();
    const phoneCtrl = this.beneficiaryForm?.controls['beneficiaryPhone'];
    const emailCtrl = this.beneficiaryForm?.controls['beneficiaryEmail'];
    if (phone && phoneCtrl && !phoneCtrl.value) phoneCtrl.patchValue(phone, { emitEvent: false });
    if (email && emailCtrl && !emailCtrl.value) emailCtrl.patchValue(email, { emitEvent: false });
  }

  resetBeneficiaryFormFields() {
    this.beneficiaryForm.patchValue({
      businessLegalName: null,
      organisationIdNumber: null,
      organisationIdType: null,
      dateOfIncorporation: null,
      countryOfIncorporation: null,
      givenName: null,
      familyName: null,
      beneficiaryIdDocumentType: null,
      beneficiaryIdNumber: null,
      beneficiaryPoBox: null,
      beneficiaryDateOfBirth: null,
      beneficiaryEmail: null,
      beneficiaryPhone: null,
      addressLine1: null,
      addressLine2: null,
      city: null,
      state: null,
      zip: null,
      country: null
    }, { emitEvent: false });
  }
}

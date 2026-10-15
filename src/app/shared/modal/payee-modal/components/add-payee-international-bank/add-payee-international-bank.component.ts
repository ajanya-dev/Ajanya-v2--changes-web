import {
  Component,
  computed,
  inject,
  OnChanges,
  OnDestroy,
  OnInit,
  signal,
  SimpleChanges,
  Output,
  EventEmitter,
  Input
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { Subscription } from 'rxjs';
import { debounceTime, finalize, take } from 'rxjs/operators';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { GoogleAddressService } from 'src/app/core/services/google-address.service';
import { Utils } from 'src/app/data/utils';
import { IApiRes } from 'src/app/models/api';
import { CloudBankService } from 'src/app/shared/service/cloud-bank/cloud-bank.service';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { KeyValuePipe, NgClass } from '@angular/common';
import {
  faCircleExclamation,
  faXmark,
  faBuilding,
  faUser,
  faMapMarkerAlt,
  faAngleDown
} from '@fortawesome/pro-solid-svg-icons';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { CommonInputFieldComponent } from 'src/app/shared/v3/common-input-field/common-input-field.component';
import { V35ControlMessageComponent } from 'src/app/shared/v3/control-message-v35/control-message-v35.component';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { HttpHeaders } from '@angular/common/http';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import {
  IBeneficiary,
  IInternationalBanksPayee
} from 'src/app/modules/cloud-bank/cloud-bank-v2/model/internationalPayments';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { LocalStorageKeys } from 'src/app/models/local-storage';
import { IAddress, IBeneficiaryDetails, ICountriesCache, IPayeeAddressDetails } from 'src/app/models/wallet';
import {
  IInternationalWirePayeeAccounts
} from 'src/app/modules/payee/payee-v2/model/payee';
import { MatDialog } from '@angular/material/dialog';
import { WarningAlertComponent } from 'src/app/shared/alert/components/warning-alert/warning-alert.component';
import { WalletService } from 'src/app/shared/service/wallet/wallet.service';
import { NewPhoneInputComponent } from 'src/app/shared/components/new-phone-input/new-phone-input.component';
import { CommonCountrySelectComponent } from 'src/app/shared/v3/common-country-select/common-country-select.component';
import { CommonStateSelectComponent } from 'src/app/shared/v3/common-state-select/common-state-select.component';

@Component({
  selector: 'app-add-payee-international-bank',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    KeyValuePipe,
    FaIconComponent,
    CommonInputFieldComponent,
    NewPhoneInputComponent,
    CommonButtonV35Component,
    V35ControlMessageComponent,
    NgClass,
    CommonCountrySelectComponent,
    CommonStateSelectComponent
  ],
  templateUrl: './add-payee-international-bank.component.html',
  styleUrl: './add-payee-international-bank.component.scss'
})
export class AddPayeeInternationalBankComponent implements OnInit, OnChanges, OnDestroy {
  private unsavedFullBankData: IInternationalWirePayeeAccounts[] = [];

  private payeeService = inject(PayeeService);
  private googleAddressService = inject(GoogleAddressService);
  private cloudAccService = inject(CloudBankService);
  private paymentsService = inject(PaymentsService);
  private alertService = inject(AlertService);
  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);
  private localStorageService = inject(LocalStorageService);
  private dialog = inject(MatDialog);
  private walletService = inject(WalletService);

  payeeIdSignal = signal<string>('');
  @Input() set payeeId(value: string) {
    this.payeeIdSignal.set(value || '');
  }

  get payeeId() {
    return this.payeeIdSignal();
  }

  @Input() payeeEmail = '';
  @Input() payeePhone = '';

  payeeInternationalBankDetailsSignal = signal<IInternationalBanksPayee[]>([]);
  @Input() set payeeInternationalBankDetails(
    value: IInternationalBanksPayee[] | IInternationalWirePayeeAccounts[]
  ) {
    if (value && Array.isArray(value)) {
      // Convert IInternationalWirePayeeAccounts[] to IInternationalBanksPayee[] if needed
      const converted = value.map((item, i) => {
        if ('bankName' in item && 'accountNumber' in item) {
          // It's IInternationalWirePayeeAccounts, convert it
          const wireAccount = item as IInternationalWirePayeeAccounts;
          this.unsavedFullBankData[i] = wireAccount;
          return {
            id: wireAccount.id || '',
            bank_name: wireAccount.bankName || '',
            bankName: wireAccount.bankName || '',
            payee_name: '',
            country: wireAccount.beneficiaryBankDetails?.country || '',
            account_number: wireAccount.accountNumber || '',
            currency: '', // Currency is not in IBeneficiaryBankDetails, will need to get from form
            biz_id: ''
          } as IInternationalBanksPayee;
        }
        return item as IInternationalBanksPayee;
      });
      this.payeeInternationalBankDetailsSignal.set(converted);
    }
  }

  get payeeInternationalBankDetails() {
    return this.payeeInternationalBankDetailsSignal();
  }

  @Output() emptyInternationalBank = new EventEmitter();
  @Output() InternationalBankSetupFinished = new EventEmitter<string | null>();
  @Output() back = new EventEmitter();

  phoneErrorMessages: { [key: string]: string } = {};
  // @Output() formValues = new EventEmitter<IInternationalWirePayeeAccounts>();

  faXmark = faXmark;
  faCircleExclamation = faCircleExclamation;
  faBuilding = faBuilding;
  faUser = faUser;
  faMapMarkerAlt = faMapMarkerAlt;
  faAngleDown = faAngleDown;

  editMode: boolean;
  subscriptions: Subscription[] = [];
  countries: string[] = [];
  newInternationalAcc = false;
  IsTableRemoved = false;
  IsEditMode = false;
  bankId: string;
  indexId: number;
  showingInternationalBankAccount: IInternationalWirePayeeAccounts;

  relationshipList = signal<{ value: string; name: string }[]>([]);
  businessBanks: { label: string; value: string }[] = [];
  bicfiBanks: { label: string; value: string }[] = [];
  internationalPaymentsEnabledCountries = signal<ICountriesCache>({});

  organisationIdTypes = signal<{ value: string; label: string }[]>([]);
  beneficiaryIdDocumentTypes = signal<{ value: string; label: string }[]>([]);

  utils = Utils;
  internationalBankAcForm: FormGroup;
  beneficiaryForm: FormGroup;
  beneficiaryBankForm: FormGroup;

  isLoading = signal(false);
  isSubmit = signal(false);
  isRelationshipLoading = signal(false);
  allowedcountries: Record<string, string> = {};
  isShowIfsc = false;
  isInvalidIban = signal(false);
  isInvalidIfsc = signal(false);
  isIbanCountry = signal(false);
  ibanCheckingLoading = signal(false);
  isEnabledCountriesLoading = signal(false);
  isBusinessBanksLoading = signal(false);
  enabledCountryCode: string[] = [];
  isCountryChanged = signal(false);
  isUkCountry = signal(false);

  bankDetailsCollapsed = signal(false);
  beneficiaryDetailsCollapsed = signal(true);
  businessDetailsCollapsed = signal(true);
  addressDetailsCollapsed = signal(true);
  isAddressFromIFSCCheck = signal<boolean>(false);
  isAddressLoading = signal<boolean>(false);


  fieldToInputIdMap: Record<string, string> = {
    ifsc: 'branchCode',
    zip: 'beneficiaryBankZip',
    accountNumber: 'accountNumber',
    city: 'beneficiaryBankCity',
    state: 'beneficiaryBankState',
    addressLine1: 'beneficiaryBankStreet1',
    addressLine2: 'beneficiaryBankStreet2',
    branchCode: 'branchCode',
    bankName: 'bankName',
    routingOrSortCode: 'routingOrSortCode',
    organisationIdNumber: 'organisationIdNumber'
  };
  
  userHasBeneficiaryDetails = signal<boolean>(false);
  recipientBeneficiaryDetails = signal<IPayeeAddressDetails | undefined>(undefined);
  userHasMultipleBeneficiaryDetails = computed(() => this.recipientBeneficiaryDetails()?.is_existing);
  existingList = computed(() => this.recipientBeneficiaryDetails()?.existing_beneficiary_details ?? []);
  selectedDetails = signal<IBeneficiaryDetails | undefined>(undefined);
  selectedAddressId = new FormControl<number | null>(null);
  selectedAddress = signal<IAddress | undefined>(undefined);
  useExistingRecipientDetails = signal(false);
  detailsLoading = signal(false);

  private readonly COUNTRIES_BUSINESS_CACHE_KEY =
    'international_countries_business_data';

  private readonly COUNTRIES_PERSONAL_CACHE_KEY =
    'international_countries_personal_data';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['payeePhone'] && !changes['payeePhone'].firstChange) {
      const phone = changes['payeePhone'].currentValue as string;
      const phoneCtrl = this.beneficiaryForm?.controls?.['payeePhone'];
      if (phone && phoneCtrl) phoneCtrl.patchValue(phone, { emitEvent: false });
    }
  }

  ngOnInit(): void {
    this.initFormGroup();
    this.applyDefaultPayeeContactDetails();
    this.getAllowedCountries();

    if (this.payeeInternationalBankDetailsSignal()?.length === 0) {
      this.editMode = false;
    }

    // Load stored international bank data when there's no payeeId
    if (!this.payeeIdSignal()) {
      this.loadStoredInternationalBankData();
    }

    this.getEnabledPaymentCountries();
    this.googleAddressService.resetGoogleAutocompleteAPI();
  }

  loadStoredInternationalBankData(): void {
    this.subscriptions.push(
      this.payeeService.getInternationalbankData.subscribe((data) => {
        if (data && !data.payeeId) {
          // Convert IInternationalWirePayeeAccounts to IInternationalBanksPayee format
          const bankData: IInternationalBanksPayee = {
            id: data.id || '',
            bank_name: data.bankName || '',
            bankName: data.bankName || '',
            payee_name: '',
            country: data.beneficiaryBankDetails?.country || '',
            account_number: data.accountNumber || '',
            currency: '', // Currency is stored separately in the form
            biz_id: ''
          };

          // Check if this bank already exists in the list
          const currentList = this.payeeInternationalBankDetailsSignal();
          const existingIndex = currentList.findIndex(
            (bank: IInternationalBanksPayee) =>
              (bank.id && bank.id === bankData.id) ||
              (bank.account_number === bankData.account_number &&
                bank.bank_name === bankData.bank_name)
          );

          if (existingIndex === -1) {
            // Add new bank to the list
            this.payeeInternationalBankDetailsSignal.set([
              ...currentList,
              bankData
            ]);
          } else {
            // Update existing bank
            const updatedList = [...currentList];
            updatedList[existingIndex] = bankData;
            this.payeeInternationalBankDetailsSignal.set(updatedList);
          }
        }
      })
    );
  }

  getInternationalPaymentDataList(type: 'business' | 'personal') {
    const countryCode = this.beneficiaryBankForm.controls.country.value;
    const payoutCurrencyCode = this.beneficiaryBankForm.controls.currency.value;
    if (!countryCode || !payoutCurrencyCode) return;
    this.isBusinessBanksLoading.set(true);
    this.subscriptions.push(
      this.paymentsService
        .getInternationalPaymentDataList(type, {
          countryCode,
          payoutCurrencyCode
        })
        .pipe(finalize(() => this.isBusinessBanksLoading.set(false)))
        .subscribe({
          next: (res) => {
            if (res.success && res.data) {
              if (res.data.business_banks) {
                this.businessBanks = res.data.business_banks;
              }
              if (res.data.bicfi_banks) {
                this.bicfiBanks = res.data.bicfi_banks;
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
        })
    );
  }

  initFormGroup(): void {
    this.beneficiaryForm = new FormGroup({
      addressLine1: new FormControl('', [Validators.required]),
      addressLine2: new FormControl(''),
      city: new FormControl('', [Validators.required]),
      state: new FormControl('', [Validators.required]),
      zip: new FormControl('', [
        Validators.required,
        ValidationService.noWhitespaceValidator,
        ValidationService.zipValidatorInternational
      ]),
      country: new FormControl('', [Validators.required]),
      businessLegalName: new FormControl(null),
      organisationIdNumber: new FormControl(null),
      organisationIdType: new FormControl(null),
      dateOfIncorporation: new FormControl(''),
      countryOfIncorporation: new FormControl(null),
      givenName: new FormControl(''),
      familyName: new FormControl(''),
      beneficiaryIdDocumentType: new FormControl(null),
      beneficiaryIdNumber: new FormControl(null),
      // Philippines specific fields
      payeeEmail: new FormControl(''),
      payeePhone: new FormControl(''),
      poBox: new FormControl(''),
      dateOfBirth: new FormControl('', [ValidationService.dateOfBirthValidator])
    });

    this.beneficiaryBankForm = new FormGroup({
      addressLine1: new FormControl(null, [Validators.required]),
      addressLine2: new FormControl(null),
      city: new FormControl(null, [Validators.required]),
      state: new FormControl(null, [Validators.required]),
      zip: new FormControl(null, [
        Validators.required,
        ValidationService.noWhitespaceValidator,
        this.zipValidator.bind(this)
      ]),
      country: new FormControl(null, [Validators.required]),
      branchCode: new FormControl(null),
      identifierCode: new FormControl(null),
      currency: new FormControl(null, [Validators.required]),
      routingOrSortCode: new FormControl(null)
    });

    this.internationalBankAcForm = new FormGroup({
      id: new FormControl(null),
      accountNumber: new FormControl(null, [
        Validators.required,
        Validators.minLength(5)
      ]),
      accountType: new FormControl(null, [Validators.required]),
      bankName: new FormControl(null, [Validators.required]),
      ifsc: new FormControl(null),
      type: new FormControl('ripple', [Validators.required]),
      relationship: new FormControl(null, [Validators.required]),
      beneficiary: this.beneficiaryForm,
      beneficiaryBankDetails: this.beneficiaryBankForm
    });
    this.changeIfsc();
    this.changeCountry();
    this.changeIban();
    this.changeAccountType();
    this.changeBeneficiaryAddress();
  }

  changeBeneficiaryAddress() {
    this.subscriptions.push(
      this.selectedAddressId.valueChanges.subscribe((id) => {
        if (id == null) {
          this.selectedDetails.set(undefined);
          return;
        }
        const beneficiaryData = this.existingList()?.find((item) => item.id === id);
        if (!beneficiaryData) {
          return;
        }
        this.selectedDetails.set(beneficiaryData);
        this.selectedAddress.set(beneficiaryData.address);
        this.setFormData();
      })
    );
  }

  changeIfsc() {
    this.isAddressFromIFSCCheck.set(false);
    this.subscriptions.push(
      this.beneficiaryBankForm.controls.branchCode?.valueChanges
        .pipe(debounceTime(500))
        .subscribe((res) => {
          if(this.beneficiaryBankForm.controls.country.value === 'IN'){
            if(res){
              this.checkIfsc(res);
            } else {
              this.isAddressFromIFSCCheck.set(false);
              this.beneficiaryBankForm.patchValue({
                addressLine1: null,
                city: null,
                state: null,
                zip: null
              });
            }
          }
        })
    );
  }

  changeIban() {
    this.subscriptions.push(
      this.internationalBankAcForm.controls.accountNumber?.valueChanges
        .pipe(debounceTime(500))
        .subscribe((res) => {
          const beneficiaryCountry =
            this.beneficiaryBankForm.controls.country?.value;
          if (
            res &&
            beneficiaryCountry &&
            beneficiaryCountry !== 'IN' &&
            beneficiaryCountry !== 'PH' &&
            beneficiaryCountry !== 'GB'
          ) {
            this.checkIban(res);
          }
        })
    );
  }

  changeCountry() {
    this.subscriptions.push(
      this.beneficiaryBankForm.controls.country?.valueChanges
        .pipe(debounceTime(500))
        .subscribe((res) => {
          this.getRecipientAddressDetails();
          if (!res || this.isEnabledCountriesLoading()) {
            return;
          }
          // Country changed: reset autocomplete so the bank-address field re-initializes with the new restriction.
          this.googleAddressService.resetGoogleAutocompleteAPI();
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
          if (res !== 'IN' && res !== 'PH' && res !== 'GB') {
            const iban =
              this.internationalBankAcForm.controls.accountNumber.value;
            this.checkIban(iban);
          } else {
            this.isInvalidIban.set(false);
          }
          if (res === 'GB') {
            this.isUkCountry.set(true);
          } else {
            this.isUkCountry.set(false);
          }
          if (res === 'IN') {
            this.isShowIfsc = true;
            this.beneficiaryBankForm.controls.branchCode.setValidators([
              Validators.required
            ]);
            this.beneficiaryBankForm.controls.branchCode.updateValueAndValidity({ emitEvent: false });
            this.beneficiaryBankForm.controls.branchCode.setValue(this.showingInternationalBankAccount.ifsc);
          } else {
            this.isShowIfsc = false;
            this.beneficiaryBankForm.controls.branchCode.setValidators([]);
            this.beneficiaryBankForm.controls.branchCode.updateValueAndValidity({ emitEvent: false });
            this.internationalBankAcForm.controls.ifsc.setValue(null);
            this.internationalBankAcForm.controls.ifsc.clearValidators();
            this.internationalBankAcForm.controls.ifsc.updateValueAndValidity();
          }
        })
    );
  }

  changeAccountType() {
    this.subscriptions.push(
      this.internationalBankAcForm.controls.accountType?.valueChanges
        .pipe(debounceTime(500))
        .subscribe((accountType) => {
          this.updateBeneficiaryNameValidation();
          if (accountType) {
            this.getInternationalPaymentDataList(accountType);
            this.getRecipientAddressDetails();
          }
        })
    );
  }

  checkIfsc(ifsc: string) {
    const headerOptions = new HttpHeaders({
      'Content-Type': 'application/json',
      isDisable422: 'true'
    });
    this.subscriptions.push(
      this.paymentsService.checkIfsc(ifsc, headerOptions).subscribe({
        next: (res) => {
          if (res.success) {
            this.isInvalidIfsc.set(false);
            this.internationalBankAcForm.controls.ifsc.setValue(ifsc);
            this.getInternationalBankAddress(ifsc);
          }
        },
        error: () => {
          this.isInvalidIfsc.set(true);
          this.internationalBankAcForm.controls.ifsc.setValue(null);
        }
      })
    );
  }

  checkIban(iban: string) {
    if (!iban) return;
    const headerOptions = new HttpHeaders({
      'Content-Type': 'application/json',
      isDisable422: 'true'
    });
    this.ibanCheckingLoading.set(true);
    this.subscriptions.push(
      this.paymentsService
        .checkIban(iban, this.beneficiaryBankForm.controls.country.value, headerOptions)
        .pipe(finalize(() => this.ibanCheckingLoading.set(false)))
        .subscribe({
          next: (res) => {
            if (res.success) {
              this.isInvalidIban.set(false);
            }
          },
          error: () => {
            this.isInvalidIban.set(true);
          }
        })
    );
  }

  createInternationalPaymentBankAccount() {
    const formValue = { ...this.internationalBankAcForm.value };
    const accountType = this.internationalBankAcForm.get('accountType')?.value;

    const modifiedBeneficiary = this.cleanBeneficiaryData(
      formValue.beneficiary,
      accountType
    );

    const identifierCode = formValue.beneficiaryBankDetails?.identifierCode || null;
    delete formValue.beneficiaryBankDetails?.identifierCode;

    const sendingData = {
      ...formValue,
      beneficiary: modifiedBeneficiary,
      payeeId: this.payeeIdSignal(),
      payeeEmail: formValue.beneficiary?.payeeEmail || null,
      payeePhone: formValue.beneficiary?.payeePhone || null,
      identifierType: null,
      identifierCode
    };

    if (this.payeeIdSignal()) {
      this.subscriptions.push(
        this.payeeService
          .addPayeeInternationalBankAccount(sendingData)
          .pipe(
            finalize(() => {
              this.isSubmit.set(false);
            })
          )
          .subscribe({
            next: (response: IApiRes<{ id: string }>) => {
              if (response.success) {
                this.payeeService.setInternationalbankData(
                  sendingData as IInternationalWirePayeeAccounts
                );
                this.loadPayeeInternationalBankData();
                this.InternationalBankSetupFinished.emit(sendingData.payeePhone || null);
                this.backbutton();
              }
            },
            error: (error) => {
              const controlName = error?.error?.errorField;
              if (controlName) {
                this.focusWhenDialogsClosed(controlName);
              }
              if (error.error.errorCode === '266') {
                const phoneControl = this.beneficiaryForm.controls['payeePhone'];
                this.phoneErrorMessages = { serverError: error.error.errorMsg };
                phoneControl.setErrors({ serverError: true });
                phoneControl.markAsTouched();
                const sub = phoneControl.valueChanges.pipe(take(1)).subscribe(() => {
                  this.phoneErrorMessages = {};
                  phoneControl.setErrors(null);
                });
                this.subscriptions.push(sub);
              }
            }
          })
      );
    } else {
      // No payeeId - store data and update local list
      this.payeeService.setInternationalbankData(
        sendingData as IInternationalWirePayeeAccounts
      );

      // Convert and add to local list
      const bankData: IInternationalBanksPayee = {
        id: sendingData.id || '',
        bank_name: sendingData.bankName || '',
        bankName: sendingData.bankName || '',
        payee_name: '',
        country: formValue.beneficiaryBankDetails?.country || '',
        account_number: sendingData.accountNumber || '',
        currency: '', // Currency is stored separately in the form
        biz_id: ''
      };

      this.payeeInternationalBankDetailsSignal.set([
        ...this.payeeInternationalBankDetailsSignal(),
        bankData
      ]);

      this.InternationalBankSetupFinished.emit();
      this.backbutton();
    }
  }

  private focusWhenDialogsClosed(controlName: string) {
    const runFocus = () => {
      const inputId = this.fieldToInputIdMap[controlName];
      if (!inputId) return;
      setTimeout(() => {
        const el = document.getElementById(inputId) as HTMLElement | null;
        if (el) {
          this.applyTemporaryErrorHighlight(el);
        }
        el?.focus();
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 0);
    };
    const warningDialogRef = this.dialog.openDialogs.find(
      (dialogRef) => dialogRef.componentInstance instanceof WarningAlertComponent
    );

    if (!warningDialogRef) {
      runFocus();
      return;
    }

    warningDialogRef
      .afterClosed()
      .pipe(take(1))
      .subscribe(() => runFocus());
  }

  private applyTemporaryErrorHighlight(element: HTMLElement) {
    const targetElement = element;
    const previousBorderColor = targetElement.style.borderColor;
    const previousBoxShadow = targetElement.style.boxShadow;

    targetElement.style.borderColor = 'var(--common-red-color)';
    targetElement.style.boxShadow = '0 0 0 1px var(--common-red-color)';

    const clearHighlight = () => {
      targetElement.style.borderColor = previousBorderColor;
      targetElement.style.boxShadow = previousBoxShadow;
    };

    targetElement.addEventListener('input', clearHighlight, { once: true });
    targetElement.addEventListener('blur', clearHighlight, { once: true });
  }

  getInternationalBankAddress(ifsc: string) {
    this.isAddressLoading.set(true);
    this.subscriptions.push(
      this.paymentsService
        .getInternationalBankAddress(ifsc)
        .pipe(finalize(() => this.isAddressLoading.set(false)))
        .subscribe((res) => {
          if (res.success) {
            this.beneficiaryBankForm.patchValue({
              addressLine1: res?.address ?? '',
              city: res?.city ?? '',
              state: res?.state ?? '',
              zip: res?.zip ?? ''
            });
            this.isAddressFromIFSCCheck.set(true);
          }
        })
    );
  }

  updateInternationalPaymentBankAccount() {
    const formValue = { ...this.internationalBankAcForm.value };
    const accountType = this.internationalBankAcForm.get('accountType')?.value;

    const modifiedBeneficiary = this.cleanBeneficiaryData(
      formValue.beneficiary,
      accountType
    );

    const identifierCode = formValue.beneficiaryBankDetails?.identifierCode || null;
    delete formValue.beneficiaryBankDetails?.identifierCode;

    const sendingData = {
      ...formValue,
      beneficiary: modifiedBeneficiary,
      payeeId: this.payeeIdSignal(),
      payeeEmail: formValue.beneficiary?.payeeEmail || null,
      payeePhone: formValue.beneficiary?.payeePhone || null,
      identifierType: null,
      identifierCode
    };

    if (this.bankId) {
      this.subscriptions.push(
        this.payeeService
          .updatePayeeInternationalBankAccount(this.bankId, sendingData)
          .pipe(
            finalize(() => {
              this.isSubmit.set(false);
            })
          )
          .subscribe({
            next: (response) => {
              if (response.success) {
                this.payeeService.setInternationalbankData(
                  sendingData as IInternationalWirePayeeAccounts
                );
                this.InternationalBankSetupFinished.emit(sendingData.payeePhone || null);
                this.backbutton();
              }
            },
            error: (error) => {
              const controlName = error?.error?.errorField;
              if (controlName) {
                this.focusWhenDialogsClosed(controlName);
              }
              if (error.error.errorCode === '266') {
                const phoneControl = this.beneficiaryForm.controls['payeePhone'];
                this.phoneErrorMessages = { serverError: error.error.errorMsg };
                phoneControl.setErrors({ serverError: true });
                phoneControl.markAsTouched();
                const sub = phoneControl.valueChanges.pipe(take(1)).subscribe(() => {
                  this.phoneErrorMessages = {};
                  phoneControl.setErrors(null);
                });
                this.subscriptions.push(sub);
              }
            }
          })
      );
    } else {
      // No bankId - store data and update local list
      this.payeeService.setInternationalbankData(
        sendingData as IInternationalWirePayeeAccounts
      );

      // Convert and update in local list
      const bankData: IInternationalBanksPayee = {
        id: sendingData.id || '',
        bank_name: sendingData.bankName || '',
        bankName: sendingData.bankName || '',
        payee_name: '',
        country: formValue.beneficiaryBankDetails?.country || '',
        account_number: sendingData.accountNumber || '',
        currency: '', // Currency is stored separately in the form
        biz_id: ''
      };

      // Update existing bank in the list
      const currentList = this.payeeInternationalBankDetailsSignal();
      const existingIndex = currentList.findIndex(
        (bank: IInternationalBanksPayee) =>
          (bank.id && bank.id === bankData.id) ||
          (bank.account_number === bankData.account_number &&
            bank.bank_name === bankData.bank_name)
      );

      if (existingIndex !== -1) {
        const updatedList = [...currentList];
        updatedList[existingIndex] = bankData;
        this.payeeInternationalBankDetailsSignal.set(updatedList);
      } else {
        this.payeeInternationalBankDetailsSignal.set([
          ...currentList,
          bankData
        ]);
      }

      this.unsavedFullBankData[this.indexId] = sendingData as IInternationalWirePayeeAccounts;

      this.InternationalBankSetupFinished.emit();
      this.backbutton();
    }
  }

  loadPayeeInternationalBankData() {
    if (this.payeeIdSignal()) {
      this.subscriptions.push(
        this.payeeService
          .internationalBanksPayee(this.payeeIdSignal())
          .subscribe((res) => {
            if (res?.success) {
              this.payeeInternationalBankDetailsSignal.set(res.data);
              this.payeeService.updatePayeeInternationalBankList.next(res.data);
            }
          })
      );
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
      if (bankCountry === 'PH') {
        hasValidationErrors =
          hasValidationErrors ||
          this.beneficiaryForm.controls.payeeEmail.invalid ||
          this.beneficiaryForm.controls.payeePhone.invalid ||
          this.beneficiaryForm.controls.poBox.invalid;
      }
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
      if (bankCountry === 'PH') {
        hasValidationErrors =
          hasValidationErrors ||
          this.beneficiaryForm.controls.payeeEmail.invalid ||
          this.beneficiaryForm.controls.payeePhone.invalid ||
          this.beneficiaryForm.controls.poBox.invalid ||
          this.beneficiaryForm.controls.dateOfBirth.invalid;
      }
    } else {
      hasValidationErrors =
        this.internationalBankAcForm.invalid || this.ibanCheckingLoading();
    }

    if (hasValidationErrors) {
      return;
    }

    this.isSubmit.set(true);

    if (this.editMode || this.IsEditMode) {
      this.updateInternationalPaymentBankAccount();
    } else {
      this.createInternationalPaymentBankAccount();
    }
  }

  loadGoogleAddress(address: HTMLInputElement) {
    // Reset first so the singleton service re-binds Google Autocomplete to this focused input.
    this.googleAddressService.resetGoogleAutocompleteAPI();
    this.googleAddressService.googleAutocomplete({
      addressElement: address,
      allowedCountries: undefined,
      displayShortName: true
    });

    const googleAddressSubscription =
      this.googleAddressService.googleAddress$.subscribe((res) => {
        this.beneficiaryForm.controls.addressLine1.patchValue(res.address);
        this.beneficiaryForm.controls.city.patchValue(res.city);
        this.beneficiaryForm.controls.state.patchValue(res.state);
        this.beneficiaryForm.controls.zip.patchValue(res.zip);
        this.beneficiaryForm.controls.country.patchValue(res.country);

        this.onBeneficiaryCountryChange();
        googleAddressSubscription.unsubscribe();
        this.googleAddressService.resetGoogleAutocompleteAPI();
      });
  }

  loadBeneficiaryBankAddress(address: HTMLInputElement) {
    // Reset first so the singleton service re-binds Google Autocomplete to this focused input.
    this.googleAddressService.resetGoogleAutocompleteAPI();
    // Restrict suggestions to the selected bank country (Google ignores the restriction beyond 5 countries).
    const selectedCountry = this.beneficiaryBankForm.controls.country.value as
      | string
      | null;
    this.googleAddressService.googleAutocomplete({
      addressElement: address,
      allowedCountries: selectedCountry
        ? [selectedCountry.toLowerCase()]
        : this.enabledCountryCode,
      displayShortName: true
    });

    const googleAddressSubscription =
      this.googleAddressService.googleAddress$.subscribe((res) => {
        this.beneficiaryBankForm.controls.addressLine1.patchValue(res.address);
        this.beneficiaryBankForm.controls.city.patchValue(res.city);
        this.beneficiaryBankForm.controls.state.patchValue(res.state);
        this.beneficiaryBankForm.controls.zip.patchValue(res.zip);
        this.beneficiaryBankForm.controls.country.patchValue(res.country);

        if (this.beneficiaryBankForm.controls.country.value === 'IN') {
          this.isShowIfsc = true;
          this.beneficiaryBankForm.controls.branchCode.setValidators([
            Validators.required
          ]);
          this.beneficiaryBankForm.controls.branchCode.updateValueAndValidity({ emitEvent: false });
          const existingBranchCode = this.beneficiaryBankForm.controls.branchCode.value;
          if (existingBranchCode) {
            this.checkIfsc(existingBranchCode);
          }
        } else {
          this.isShowIfsc = false;
          this.beneficiaryBankForm.controls.branchCode.setValidators([]);
          this.beneficiaryBankForm.controls.branchCode.updateValueAndValidity({ emitEvent: false });
        }

        googleAddressSubscription.unsubscribe();
        this.googleAddressService.resetGoogleAutocompleteAPI();
      });
  }

  getAllowedCountries() {
    this.subscriptions.push(
      this.cloudAccService.allowedCountries.subscribe((res) => {
        this.allowedcountries = res;
        this.countries = Object.keys(this.allowedcountries);
      })
    );
  }

  getEnabledPaymentCountries() {
    const accountType =
      this.internationalBankAcForm.get('accountType')?.value || 'business';

    // Ignore an empty cache so we re-fetch instead of showing an empty dropdown.
    const cachedData = this.getCachedCountriesData(accountType);

    if (cachedData && Object.keys(cachedData).length) {
      this.processCountriesData(cachedData);
      return;
    }

    this.isEnabledCountriesLoading.set(true);

    const countriesApi$ =
      accountType === 'personal'
        ? this.paymentsService.enabledInternationalPaymentCountriesPersonal()
        : this.paymentsService.enabledInternationalPaymentCountries();

    this.subscriptions.push(
      countriesApi$
        .pipe(finalize(() => this.isEnabledCountriesLoading.set(false)))
        .subscribe({
          next: (res) => {
            if (res.success && res.data && Object.keys(res.data).length) {
              this.storeCachedCountriesData(res.data, accountType);
              this.processCountriesData(res.data);
            } else {
              // API responded but no countries are enabled for this account type — surface it instead of leaving an empty dropdown.
              this.handleNoEnabledCountries(accountType);
            }
          }
        })
    );
  }

  /** Alerts the user (rather than showing an empty dropdown) when the enabled-countries API returns no usable data — HTTP 200 with `success: false` or an empty list, which the global error interceptor does not catch. */
  private handleNoEnabledCountries(accountType: string): void {
    const typeLabel = accountType === 'personal' ? 'Personal' : 'Business';
    this.alertService
      .infoAlert({
        content: `${typeLabel} international payments are not enabled for this account. Please contact support to have this option activated.`,
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
  }

  private processCountriesData(data: ICountriesCache) {
    this.internationalPaymentsEnabledCountries.set(data);
    this.enabledCountryCode = Object.values(data).map((country) =>
      country.countryCode.toLowerCase()
    );
    this.onBankCountryChange();
  }

  private getCachedCountriesData(accountType: string): ICountriesCache | null {
    try {
      const cacheKey =
        accountType === 'personal'
          ? this.COUNTRIES_PERSONAL_CACHE_KEY
          : this.COUNTRIES_BUSINESS_CACHE_KEY;

      const cached = this.localStorageService.getItem(
        cacheKey as LocalStorageKeys
      );

      if (!cached) return null;

      return JSON.parse(cached) as ICountriesCache;
    } catch (error) {
      return null;
    }
  }

  private storeCachedCountriesData(
    data: ICountriesCache,
    accountType: string
  ): void {
    const cacheKey =
      accountType === 'personal'
        ? this.COUNTRIES_PERSONAL_CACHE_KEY
        : this.COUNTRIES_BUSINESS_CACHE_KEY;

    this.localStorageService.setItem(
      cacheKey as LocalStorageKeys,
      JSON.stringify(data)
    );
  }

  /** Re-evaluates the IFSC requirement when the beneficiary country changes. */
  onBeneficiaryCountryChange(): void {
    this.checkIfscRequired();
  }

  checkIfscRequired(): void {
    const beneficiaryBankCountry =
      this.beneficiaryBankForm.controls.country.value;

    if (beneficiaryBankCountry === 'IN') {
      this.isShowIfsc = true;
      this.beneficiaryBankForm.controls.branchCode.setValidators([
        Validators.required
      ]);
    } else {
      this.isShowIfsc = false;
      this.beneficiaryBankForm.controls.branchCode.clearValidators();
    }

    this.beneficiaryBankForm.controls.branchCode.updateValueAndValidity({ emitEvent: false });
  }

  private updateBeneficiaryNameValidation(): void {
    const accountType = this.internationalBankAcForm.get('accountType')?.value;
    const bankCountry = this.beneficiaryBankForm.get('country')?.value;

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
    const payeeEmailControl = this.beneficiaryForm.get('payeeEmail');
    const payeePhoneControl = this.beneficiaryForm.get('payeePhone');
    const poBoxControl = this.beneficiaryForm.get('poBox');
    const dateOfBirthControl = this.beneficiaryForm.get('dateOfBirth');
    const isPhilippines = bankCountry === 'PH';

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
      dateOfBirthControl?.clearValidators();

      if (isPhilippines) {
        payeeEmailControl?.setValidators([
          Validators.required,
          ValidationService.emailValidator
        ]);
        payeePhoneControl?.setValidators([Validators.required]);
        poBoxControl?.setValidators([Validators.required]);
      } else {
        payeeEmailControl?.clearValidators();
        payeePhoneControl?.clearValidators();
        poBoxControl?.clearValidators();
      }
    } else if (accountType === 'personal') {
      if (bankCountry === 'IN') {
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
      if (isPhilippines) {
        payeeEmailControl?.setValidators([
          Validators.required,
          ValidationService.emailValidator
        ]);
        payeePhoneControl?.setValidators([Validators.required]);
        poBoxControl?.setValidators([Validators.required]);
        dateOfBirthControl?.setValidators([
          Validators.required,
          ValidationService.dateOfBirthValidator
        ]);
      } else {
        payeeEmailControl?.clearValidators();
        payeePhoneControl?.clearValidators();
        poBoxControl?.clearValidators();
        dateOfBirthControl?.clearValidators();
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
      payeeEmailControl?.clearValidators();
      payeePhoneControl?.clearValidators();
      poBoxControl?.clearValidators();
      dateOfBirthControl?.clearValidators();
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
    payeeEmailControl?.updateValueAndValidity({ emitEvent: false });
    payeePhoneControl?.updateValueAndValidity({ emitEvent: false });
    poBoxControl?.updateValueAndValidity({ emitEvent: false });
    dateOfBirthControl?.updateValueAndValidity({ emitEvent: false });
  }

  private resetCountrySpecificFields(): void {
    // Bank address auto-filled by IFSC lookup or Google autocomplete
    this.beneficiaryBankForm.patchValue({
      addressLine1: null,
      addressLine2: null,
      city: null,
      state: null,
      zip: null,
      branchCode: null,        // IFSC (IN) or bank-list selection (PH)
      routingOrSortCode: null, // UK-specific
      identifierCode: null,    // PH-specific
    }, { emitEvent: false });

    // IFSC and relationship on main form — IFSC is IN-only; relationship list reloads per country+type
    this.internationalBankAcForm.patchValue({
      ifsc: null,
      relationship: null,
      bankName:null
    }, { emitEvent: false });

    // Stale validation states from the previous country
    this.isInvalidIban.set(false);
    this.isInvalidIfsc.set(false);
    this.isAddressFromIFSCCheck.set(false);

    // Country-specific bank/relationship lists (reloaded for the new country)
    this.businessBanks = [];
    this.bicfiBanks = [];
    this.relationshipList.set([]);

    // Philippines-specific beneficiary fields; restore payee defaults where available
    this.beneficiaryForm.patchValue({
      payeeEmail: this.payeeEmail || null,
      payeePhone: this.payeePhone || null,
      poBox: null,
      dateOfBirth: null,
    }, { emitEvent: false });
  }

  onBankCountryChange(): void {
    const selectedCountry = this.beneficiaryBankForm.controls.country.value;

    if (!selectedCountry || this.isEnabledCountriesLoading()) {
      return;
    }

    // Reset country-specific fields on every user-triggered country change.
    if (this.isCountryChanged()) {
      this.resetCountrySpecificFields();
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
    if (selectedCountry === 'GB') {
      this.beneficiaryBankForm.controls.routingOrSortCode.setValidators([
        Validators.required
      ]);
      this.isUkCountry.set(true);
    } else {
      this.beneficiaryBankForm.controls.routingOrSortCode.clearValidators();
      this.isUkCountry.set(false);
    }
    if (selectedCountry === 'PH') {
      this.beneficiaryBankForm.controls.identifierCode.setValidators([
        Validators.required
      ]);
    } else {
      this.beneficiaryBankForm.controls.identifierCode.clearValidators();
    }
    this.beneficiaryBankForm.controls.branchCode.updateValueAndValidity({ emitEvent: false });
    this.beneficiaryBankForm.controls.routingOrSortCode.updateValueAndValidity();
    this.beneficiaryBankForm.controls.identifierCode.updateValueAndValidity();

    // When country changes to IN, validate any existing branchCode value as IFSC
    if (selectedCountry === 'IN') {
      const existingBranchCode = this.beneficiaryBankForm.controls.branchCode.value;
      if (existingBranchCode) {
        this.checkIfsc(existingBranchCode);
      }
    }

    if (selectedCountry && this.internationalPaymentsEnabledCountries()) {
      Object.entries(this.internationalPaymentsEnabledCountries()).forEach(
        ([, countryData]) => {
          if (countryData.countryCode === selectedCountry) {
            this.beneficiaryBankForm.controls.currency.setValue(
              countryData.currency
            );
            const accountType =
              this.internationalBankAcForm.get('accountType')?.value;
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
    }

    const bankCountry = this.beneficiaryBankForm.get('country')?.value;
    if (bankCountry === 'PH') {
      cleanedBeneficiary.poBox = beneficiary.poBox;
      if (accountType === 'personal') {
        cleanedBeneficiary.dateOfBirth = beneficiary.dateOfBirth;
      }
    }

    return cleanedBeneficiary;
  }

  getRecipientAddressDetails() {
    if(this.editMode) {
      return;
    }
    const countryCode = this.beneficiaryBankForm.controls.country.value;
    const accountType = this.internationalBankAcForm.controls.accountType.value;
    if (!this.payeeIdSignal() || !countryCode || !accountType) {
      return;
    }
    this.userHasBeneficiaryDetails.set(false);
    this.useExistingRecipientDetails.set(false);
    this.resetBeneficiaryForm();
    this.selectedAddressId.setValue(null, { emitEvent: false });
    this.detailsLoading.set(true);
    this.subscriptions.push(
      this.walletService
        .existingBeneficiaryDetails(countryCode, accountType, this.payeeIdSignal())
        .pipe(finalize(() => this.detailsLoading.set(false)))
        .subscribe((res) => {
          if (res.success) {
            this.recipientBeneficiaryDetails.set(res.data);
            this.selectedDetails.set(undefined);
            const payeeAddress = res.data?.payee_details?.address;
            const hasValidAddress =  Object.values(payeeAddress).some((value) => 
              value !== undefined && value !== null && value !== ''
            );
            this.userHasBeneficiaryDetails.set(
              hasValidAddress ||
              res.data.existing_beneficiary_details.length > 0 ||
              !!res.data.payee_details?.payee_name?.trim()
            );
            if(hasValidAddress){
              this.selectedAddress.set(payeeAddress);
            }
            if(res.data.existing_beneficiary_details.length > 0 && !res.data.is_existing){
              this.selectedAddress.set(res.data.existing_beneficiary_details[0].address);
              this.selectedDetails.set(res.data.existing_beneficiary_details[0]);
            }
            if (this.userHasBeneficiaryDetails()) {
              this.useExistingRecipientDetails.set(true);
              this.toggleUseExistingRecipientDetails({ target: { checked: true } } as unknown as Event);
            }
          }
        })
    );
  }

  toggleUseExistingRecipientDetails(event: Event) {
    const checkbox = event.target as HTMLInputElement;
    const isChecked = checkbox.checked;
    this.useExistingRecipientDetails.set(isChecked);
    if (!isChecked) {
      this.selectedAddressId.setValue(null, { emitEvent: false });
      this.resetBeneficiaryForm();
      return;
    }

    if (this.userHasMultipleBeneficiaryDetails()) {
      return;
    }

    this.setFormData();
  }

  setFormData() {
    const payeeDetails = this.recipientBeneficiaryDetails()?.payee_details;
    const existingBeneficiaryDetails = this.selectedDetails();
    const payeeAddress = this.selectedAddress();
    const isBusiness =
      this.internationalBankAcForm.controls.accountType.value === 'business';
    const isPersonal =
      this.internationalBankAcForm.controls.accountType.value === 'personal';
    const isPH = this.beneficiaryBankForm.controls.country.value === 'PH';
    this.beneficiaryForm.patchValue(
      {
        businessLegalName: isBusiness
          ? existingBeneficiaryDetails?.json_data?.business_legal_name ?? payeeDetails?.payee_name ?? null
          : null,
        organisationIdNumber: (isBusiness || isPersonal)
          ? existingBeneficiaryDetails?.json_data?.organisation_id_number ?? null
          : null,
        organisationIdType: isBusiness
          ? existingBeneficiaryDetails?.json_data?.id_type ?? null
          : null,
        dateOfIncorporation: isBusiness
          ? existingBeneficiaryDetails?.json_data?.date_of_incorporation ?? null
          : null,
        countryOfIncorporation: isBusiness
          ? existingBeneficiaryDetails?.json_data?.country_of_incorporation ?? null
          : null,
        givenName: isPersonal
          ? existingBeneficiaryDetails?.json_data?.beneficiary_given_name ?? payeeDetails?.payee_name ?? null
          : null,
        familyName: isPersonal
          ? existingBeneficiaryDetails?.json_data?.beneficiary_family_name ?? null
          : null,
        beneficiaryIdDocumentType: isPersonal
          ? existingBeneficiaryDetails?.json_data?.id_type ?? null
          : null,
        beneficiaryIdNumber: isPersonal
          ? existingBeneficiaryDetails?.json_data?.organisation_id_number ?? null
          : null,
        poBox: isPH ? existingBeneficiaryDetails?.json_data?.po_box ?? null : null,
        dateOfBirth: isPH ? existingBeneficiaryDetails?.json_data?.date_of_birth ?? null : null,
        payeeEmail: isPH ? payeeDetails?.payee_email ?? null : null,
        payeePhone: payeeDetails?.payee_phone ?? null,
        addressLine1: payeeAddress?.line1 ?? null,
        addressLine2: payeeAddress?.line2 ?? null,
        city: payeeAddress?.city ?? null,
        state: payeeAddress?.state ?? null,
        zip: payeeAddress?.zip ?? null,
        country: payeeAddress?.country ?? null
      },
      { emitEvent: false }
    );
  }

  resetBeneficiaryForm() {
    this.beneficiaryForm.patchValue(
      {
        businessLegalName: null,
        organisationIdNumber: null,
        organisationIdType: null,
        dateOfIncorporation: null,
        countryOfIncorporation: null,
        givenName: null,
        familyName: null,
        beneficiaryIdDocumentType: null,
        beneficiaryIdNumber: null,
        addressLine1: null,
        addressLine2: null,
        city: null,
        state: null,
        zip: null,
        country: null
      },
      { emitEvent: false }
    );
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
    this.newInternationalAcc = true;
    this.IsTableRemoved = true;
    this.editMode = false;
    this.applyDefaultPayeeContactDetails();
  }

  private applyDefaultPayeeContactDetails(): void {
    const payeeEmailControl = this.beneficiaryForm?.controls?.payeeEmail;
    const payeePhoneControl = this.beneficiaryForm?.controls?.payeePhone;

    if (payeeEmailControl && !payeeEmailControl.value && this.payeeEmail) {
      payeeEmailControl.patchValue(this.payeeEmail);
    }

    if (payeePhoneControl && !payeePhoneControl.value && this.payeePhone) {
      payeePhoneControl.patchValue(this.payeePhone);
    }
  }

  editbtn(
    Bank: IInternationalWirePayeeAccounts | IInternationalBanksPayee,
    index: number
  ) {
    this.bankId = Bank?.id;
    this.indexId = index;

    if (this.payeeIdSignal() && this.bankId) {
      this.subscriptions.push(
        this.payeeService
          .getInternationalBank(this.payeeIdSignal(), this.bankId)
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
          })
      );
    } else {
      this.showingInternationalBankAccount =
        this.unsavedFullBankData[index] ?? (Bank as IInternationalWirePayeeAccounts);
      this.setInternationalBankValue();
      this.beneficiaryForm.controls.payeePhone?.patchValue(this.payeePhone, { emitEvent: false });
    }
    this.editMode = true;
    this.IsEditMode = true;
    this.IsTableRemoved = true;
  }

  setInternationalBankValue() {
    // Set form values from showingInternationalBankAccount
    // This is a simplified version - you may need to map fields properly
    const bankData = this.showingInternationalBankAccount;
    if (bankData) {
      this.internationalBankAcForm.patchValue({
        id: bankData.id,
        accountNumber: bankData.accountNumber,
        accountType: bankData.accountType,
        bankName: bankData.bankName,
        relationship: (bankData as unknown as { relationship?: string }).relationship,
        ifsc: this.beneficiaryBankForm.controls.country.value === 'IN' ? bankData.ifsc : null
      });

      if (bankData.beneficiary) {
        this.beneficiaryForm.patchValue(bankData.beneficiary);
        if (bankData.beneficiary.idType) {
          const ctrl = bankData.accountType === 'business'
            ? this.beneficiaryForm.controls.organisationIdType
            : this.beneficiaryForm.controls.beneficiaryIdDocumentType;
          ctrl?.patchValue(bankData.beneficiary.idType, { emitEvent: false });
        }
        const storedPhone = bankData.beneficiary?.phone;
        if (storedPhone) this.beneficiaryForm.controls.payeePhone.patchValue(storedPhone, { emitEvent: false });
        this.onBeneficiaryCountryChange();
      }

      if (bankData.beneficiaryBankDetails) {
        this.beneficiaryBankForm.patchValue(bankData.beneficiaryBankDetails);
      }
      if (bankData.bankIdentifierCode) {
        this.beneficiaryBankForm.controls.identifierCode.patchValue(
          bankData.bankIdentifierCode
        );
      }
      if (bankData.json_data && typeof bankData.json_data === 'object') {
        this.populateFormFields(
          bankData.accountType as 'business' | 'personal',
          bankData.json_data as unknown as Record<string, unknown>
        );
      }
    }
  }

  populateFormFields(
    accountType: 'business' | 'personal',
    jsonData: Record<string, unknown>
  ) {
    if (accountType === 'business') {
      this.beneficiaryForm.patchValue({
        businessLegalName: jsonData.business_legal_name ?? null,
        organisationIdNumber: jsonData.organisation_id_number ?? null,
        organisationIdType: jsonData.id_type ?? null,
        dateOfIncorporation: jsonData.date_of_incorporation || null,
        countryOfIncorporation: jsonData.country_of_incorporation || null
      });

      this.beneficiaryBankForm.patchValue({
        routingOrSortCode: jsonData.routing_or_sort_code ?? null,
      });
    } else {
      // Personal account fields
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
      // For personal accounts, organisation_id_number maps to beneficiaryIdNumber
      this.beneficiaryForm.controls.beneficiaryIdNumber.patchValue(
        jsonData.organisation_id_number ?? null
      );
      this.beneficiaryForm.controls.beneficiaryIdDocumentType.patchValue(
        jsonData.id_type ?? null
      );
    }

    if (jsonData.payee_email) {
      this.beneficiaryForm.controls.payeeEmail.patchValue(jsonData.payee_email);
    }

    if (jsonData.payee_phone) {
      this.beneficiaryForm.controls.payeePhone.patchValue(jsonData.payee_phone);
    }

    if (jsonData.po_box) {
      this.beneficiaryForm.controls.poBox.patchValue(jsonData.po_box);
    }

    if (jsonData.date_of_birth) {
      this.beneficiaryForm.controls.dateOfBirth.patchValue(
        jsonData.date_of_birth
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
        this.emptyInternationalBank.emit();
      }
    };

    if (bankId) {
      this.subscriptions.push(
        this.payeeService.DeletePayeeIPBank(bankId).subscribe((res) => {
          if (res?.success) {
            removeAtIndex();
          }
        })
      );
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

  backbutton() {
    this.back.emit();
  }

  /**
   * Get maximum date for date of birth (18 years ago from today)
   * This ensures the person is at least 18 years old - they can't select dates more recent than 18 years ago
   */
  getMaxDateOfBirth(): string {
    const today = new Date();
    today.setFullYear(today.getFullYear() - 18);
    return today.toISOString().split('T')[0];
  }

    /**
   * Get minimum date for date of birth (120 years ago from today)
   * This ensures the date is not more than 120 years in the past
   */
    getMinDateOfBirth(): string {
      const today = new Date();
      today.setFullYear(today.getFullYear() - 120);
      return today.toISOString().split('T')[0];
    }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });

    if (this.payeeInternationalBankDetailsSignal()?.length === 0) {
      this.emptyInternationalBank.emit();
    }
  }
}

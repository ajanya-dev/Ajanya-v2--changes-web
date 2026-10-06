import {
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule,
  ValidatorFn,
  AbstractControl
} from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  finalize,
  filter,
  skip,
  take,
  switchMap
} from 'rxjs/operators';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose
} from '@angular/material/dialog';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { BankAccountsService } from 'src/app/shared/service/bankAccounts/bank-accounts.service';
import {
  IInternationalWirePayeeAccounts,
  INewPayee,
  IPayeeBankDetails,
  IPayeeDetails,
  IViewPayee
} from 'src/app/modules/payee/payee-v2/model/payee';
import { addPayeeData } from 'src/app/data/data/payee';
import { Utils } from 'src/app/data/utils';
import { IBankDropdown } from 'src/app/models/bank';
import { GettingStartedService } from 'src/app/shared/service/getting-started/getting-started.service';
import { CloudBankService } from 'src/app/shared/service/cloud-bank/cloud-bank.service';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { GoogleAddressService } from 'src/app/core/services/google-address.service';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { IInternationalBanksPayee } from 'src/app/modules/cloud-bank/cloud-bank-v2/model/internationalPayments';
import { IPayeeSingleBankData } from 'src/app/modules/check-draft/model/Checkdraft';
import { Params } from '@angular/router';
import { CommonOnInitService } from 'src/app/shared/service/common-onInit/common-on-init.service';
import { NgxMaskDirective } from 'ngx-mask';
import { NgSelectComponent, NgSelectModule } from '@ng-select/ng-select';
import { MatTooltip } from '@angular/material/tooltip';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { CommonModule } from '@angular/common';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import { WhiteLabelPipe } from 'src/app/pipes/white-label.pipe';
import { environment } from 'src/environments/environment';
import { ICategoryDropdown } from 'src/app/modules/category/model/category';
import { faLink, faShare } from '@fortawesome/pro-regular-svg-icons';
import {
  faCircleExclamation,
  faCopy,
  faEllipsis,
  faShareNodes,
  faUsers,
  faBuilding,
  faUser,
  faUserPlus,
  faLink as faLinkSolid
} from '@fortawesome/pro-solid-svg-icons';
import { TruncatePipe } from 'src/app/pipes/truncate.pipe';
import { Clipboard } from '@angular/cdk/clipboard';
import { CategoryDropdownV4Component } from 'src/app/shared/V4/dropdown/category-dropdown-v4/category-dropdown-v4.component';
import { AddBankDetailModalComponent } from 'src/app/shared/modal/payee-modal/modal/add-bank-detail-modal/add-bank-detail-modal.component';
import { PhoneInputV4Component } from 'src/app/shared/V4/v4-phone-input/v4-phone-input.component';
import { CommonAmountInputV4Component } from 'src/app/shared/V4/common-amount-input-v4/common-amount-input-v4.component';
import { SocialShareModalComponent } from 'src/app/shared/modal/social-share-modal/social-share-modal.component';
import { socialShareData } from 'src/app/shared/modal/social-share-modal/share-url-builder.util';
import {
  faWhatsapp,
  faFacebookF,
  faXTwitter,
  faLinkedinIn
} from '@fortawesome/free-brands-svg-icons';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonTabV4Component, ITabItem } from 'src/app/shared/V4/common-tab-v4/common-tab-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { V4CommonDropDownSelectorComponent } from 'src/app/shared/V4/v4-dropdown/v4-common-dropdown-selector.component';
import { CommonCountrySelectV4Component } from 'src/app/shared/V4/common-country-select-v4/common-country-select-v4.component';
import { CommonStateSelectV4Component } from 'src/app/shared/V4/common-state-select-v4/common-state-select-v4.component';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';
import { LucideAngularModule } from 'lucide-angular';
import { IGoogleAddress } from 'src/app/modules/more/model/google-autocomplete';
import { AddressAutocompleteV4Component } from 'src/app/shared/V4/address-autocomplete-v4/address-autocomplete-v4.component';
import { V4DatePickerComponent } from 'src/app/shared/V4/v4-date-picker/v4-date-picker.component';
import { RequestPayeeModalV4Component } from '../request-payee-modal-v4/request-payee-modal-v4.component';
import { AddPayeeBankV4Component } from '../../v4-components/add-payee-bank-v4/add-payee-bank-v4.component';
import { AddPayeeInternationalBankV4Component } from '../../v4-components/add-payee-international-bank-v4/add-payee-international-bank-v4.component';
import { shakeElement } from '../../../../payments-v4/send-receive-page/components/payments-section/send/field-focus/shake';

enum EPayeeType {
  customer = 1,
  vendor,
  employee
}

export interface IChildData {
  payeeType?: string | number;
  editMode?: boolean;
  dataLoaded?: boolean;
}

/** Payee save/update result emitted by payeeSaved and payeeUpdated */
export interface IPayeeSaveUpdateResult extends IViewPayee {
  success: boolean;
  payeeTypeId: string;
  /** Present when API returns it (spread from create/update response). */
  encryptedId?: string;
}

/** Data from dialog (MAT_DIALOG_DATA) or embedded config – unified for effectiveData */
export type AddPayeeModalEffectiveData =
  | {
      edit: boolean;
      id: string;
      type: string;
      slug?: string;
      page?:
        | 'addBankDetails'
        | 'addAddress'
        | 'addInternationalBankDetails'
        | 'addCompany'
        | 'payeeEmail'
        | 'payeePhone'
        | 'bryanCohenPayee';
      payeeType?: string;
      entityLabel?: string;
      payeeTypeOptions?: string[];
    }
  | {
      edit?: boolean;
      id?: string;
      type?: string;
      page?: string;
      payeeType?: string;
      entityLabel?: string;
      payeeTypeOptions?: string[];
    }
  | null;

/** How long the section the caller asked for stays marked. */
const FOCUS_HIGHLIGHT_MS = 2400;

@Component({
  selector: 'app-add-payee-modal-v4',
  templateUrl: './add-payee-modal-v4.component.html',
  styleUrls: ['./add-payee-modal-v4.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogClose,
    FaIconComponent,
    MatTooltip,
    PhoneInputV4Component,
    AddBankDetailModalComponent,
    AddPayeeInternationalBankV4Component,
    AddPayeeBankV4Component,
    NgSelectModule,
    CategoryDropdownV4Component,
    NgxMaskDirective,
    WhiteLabelPipe,
    TruncatePipe,
    CommonButtonV4Component,
    CommonTabV4Component,
    CommonInputFieldV4Component,
    V4CommonDropDownSelectorComponent,
    CommonCountrySelectV4Component,
    CommonStateSelectV4Component,
    V4ControlMessageComponent,
    CommonAmountInputV4Component,
    LucideAngularModule,
    AddressAutocompleteV4Component,
    V4DatePickerComponent
  ]
})
export class AddPayeeModalV4Component implements OnInit {
  // Dual-use: optional dialog injection
  public data = inject(MAT_DIALOG_DATA, { optional: true }) as {
    edit: boolean;
    id: string;
    type: string;
    slug?: string;
    page?:
      | 'addBankDetails'
      | 'addAddress'
      | 'addInternationalBankDetails'
      | 'addCompany'
      | 'payeeEmail'
      | 'payeePhone'
      | 'bryanCohenPayee';
    payeeType?: string;
    entityLabel?: string;
    payeeTypeOptions?: string[];
  } | null;

  private dialogRef = inject(MatDialogRef, {
    optional: true
  }) as MatDialogRef<AddPayeeModalV4Component> | null;

  // Embedded mode inputs/outputs
  isEmbedded = input(false);
  embeddedConfig = input<{
    edit?: boolean;
    id?: string;
    type?: string;
    page?: string;
    payeeType?: string;
    entityLabel?: string;
    payeeTypeOptions?: string[];
  } | null>(null);

  payeeSaved = output<IPayeeSaveUpdateResult>();
  payeeUpdated = output<IPayeeSaveUpdateResult>();
  closed = output<void>();

  private fb = inject(FormBuilder);
  private payeeService = inject(PayeeService);
  private alertService = inject(V4AlertService);
  private dialog = inject(MatDialog);
  private bankService = inject(BankAccountsService);
  private gettingStartedService = inject(GettingStartedService);
  private cloudBankService = inject(CloudBankService);
  private googleAddressService = inject(GoogleAddressService);
  private dataTableService = inject(V3DataTableService);
  private paymentsService = inject(PaymentsService);
  private commmonService = inject(CommonOnInitService);
  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);
  private clipBoard = inject(Clipboard);
  private localStorageService = inject(LocalStorageService);

  // Accordion state
  expandedSections = new Set<string>();

  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  bankAccounts: IBankDropdown[] = [];
  bankPage = 1;
  socialShareData = socialShareData;
  readonly quickShareIcons: Record<string, any> = {
    whatsapp: faWhatsapp,
    facebook: faFacebookF,
    x: faXTwitter,
    linkedin: faLinkedinIn
  };

  DefaultPayMethod = addPayeeData.loadDefaultPayMethod();
  customerType = addPayeeData.loadCustomerType();
  employeeType = addPayeeData.loadEmployeeType();
  employeePaymentSchedule = addPayeeData.loadEmployeePaymentShedule();
  employeeFilingStatus = addPayeeData.loadEmployeeFilingStatus();
  bankAccountType = addPayeeData.loadBankAccountType();
  vendor_1099 = addPayeeData.loadvendor_1099();
  vendorPaymentTerms = addPayeeData.loadvendorPaymentTerms();

  payeeForm: FormGroup;
  payeeType: string | number;
  selectedTabIndex: number;
  isRequestedBankInfo: string | boolean = '0';
  childData$ = new BehaviorSubject<IChildData>({
    payeeType: 'customer',
    editMode: false,
    dataLoaded: false
  });

  loading = false;
  moreBtn: boolean;
  searchTimeout: ReturnType<typeof setTimeout>;
  payeeId: string;
  bankId: string;
  @ViewChildren(NgSelectComponent) ngSelects: QueryList<NgSelectComponent>;
  @ViewChild(AddPayeeBankV4Component) bankComponent: AddPayeeBankV4Component;
  @ViewChild('payeePhoneField') payeePhoneField?: ElementRef<HTMLElement>;
  @ViewChild('formSectionsRef') formSectionsRef?: ElementRef<HTMLElement>;
  manualFormHeight: number | null = null;

  payeeGetData: IPayeeDetails;
  bankGetData: IPayeeBankDetails[] = [];
  editMode = false;
  dataLoaded = false;
  customerCategoryId: string;
  vendorCategoryId: string;
  employeeCategoryId: string;
  entityLabel: string = 'Payee';
  showPage:
    | 'main'
    | 'bank'
    | 'internationalBank'
    | 'moreInfoCustomer'
    | 'moreInfoVendor'
    | 'moreInfoEmployee' = 'main';

  isFinishedBank = false;
  isFinishedInternationalBank = false;
  bankActiveTab: 'domestic' | 'international' = 'domestic';
  /** Live counts shown on the bank tabs; seeded from parent loads, kept current by the child list components. */
  domesticBankCount = signal(0);
  internationalBankCount = signal(0);
  bankTabs = computed<ITabItem[]>(() => [
    { label: `Domestic (${this.domesticBankCount()})`, value: 'domestic' },
    { label: `International (${this.internationalBankCount()})`, value: 'international' }
  ]);
  payeePhoneErrorMessages: { [key: string]: string } = {};
  isFinishedAddress = false;
  isSendLink = false;
  reqCheck = false;
  addPayeeBank = false;
  loadingSendLink = signal(false);
  resendLink = signal<string | undefined>(undefined);
  urlCopied = signal(false);
  isAddressRequired = signal(false);
  isAddressCountryStateRequired = signal(false);
  isBusinessIsRequired = false;
  isBryancohen = false;
  env = environment;
  showEntityOption = signal<boolean>(false);
  currenCountryPhoneLength = {} as { min: number; max: number };
  requestCountryPhoneLength = {} as { min: number; max: number };

  payeeBankDetails: IPayeeBankDetails[] | IPayeeSingleBankData[] = [];
  payeeInternationalBankDetails:
    | IInternationalBanksPayee[]
    | IInternationalWirePayeeAccounts[] = [];

  requestPayeeForm: FormGroup;
  selectedTransferType = 'ach';

  transferTypes = [
    { id: 'ach', name: 'Add Manually', fun: () => this.addMySelf() },
    { id: 'wire', name: 'Send Link', fun: () => this.PayeeSelfMake() }
  ];

  payeeTypes = [
    { value: '2', type: 'vendor', name: 'Vendor', icon: faBuilding },
    { value: '3', type: 'employee', name: 'Employee', icon: faUser },
    { value: '1', type: 'customer', name: 'Customer/Anyone', icon: faUsers }
  ];

  prevValues: {
    addressFormData: { [key: string]: string | null };
    moreInfoFormData: { [key: string]: string | null };
  } = {
    addressFormData: {
      payeeAddress1: null,
      payeeAddress2: null,
      payeeCity: null,
      payeeState: null,
      payeeCountry: null,
      payeeZip: null
    },
    moreInfoFormData: {
      customerDefaultPayFromAcount: null,
      customerCategory: null,
      customerDefaultPayFromMethod: null,
      customerFirstName: null,
      customerLastName: null,
      customerType: null,
      customerCompanyName: null
    }
  };

  BankAccountData = output<{ requested: string | boolean }>();
  inputDataChange = output();

  utils = Utils;

  emailValidation: boolean;
  phoneValidation: { [key: string]: boolean } | null;
  payeeEmail: string;
  payeePhone: string;

  isWarningAlertOpen = true;
  isBrayanCohenCustomer = false;
  payeeTypePermisson: { [key: string]: number } = {
    customer: 1,
    employee: 1,
    vendor: 1
  };

  isPermissionLoading = signal(false);
  typePermissions: number[] = [];

  countries: string[] = [];
  allowedcountries: { [key: string]: string } = {};

  isCompassCustomer = false;
  whiteLabelName = environment.env_id === 'compass' ? 'Vendor' : 'Payee';
  faLink = faLink;
  faCopy = faCopy;
  faShare = faShare;
  faShareNod = faShareNodes;
  faCircleExclamation = faCircleExclamation;
  faEllipsis = faEllipsis;
  faUsers = faUsers;
  faBuilding = faBuilding;
  faUser = faUser;
  faUserPlus = faUserPlus;
  faLinkSolid = faLinkSolid;
  toggleMoreShare = signal(false);

  // Inline bank form state
  showBankForm = false;
  showIntlBankForm = false;

  private editInitialized = false;
  private isNgOnInitDone = false;

  constructor() {
    // In embedded mode, the `embeddedConfig` input signal may settle after
    // the child is created in a sibling control-flow branch. React to the
    // signal so edit data is loaded whenever the config arrives.
    effect(() => {
      const config = this.embeddedConfig();
      if (!config?.edit || !config?.id) return;
      if (this.editInitialized || !this.isNgOnInitDone) return;
      untracked(() => this.applyEditConfig(config));
    });
  }

  get effectiveData(): AddPayeeModalEffectiveData {
    return this.data ?? this.embeddedConfig();
  }

  /** "Add as" options to render. Defaults to all three types; callers can
   *  restrict the set by passing `payeeTypeOptions` (e.g. the Payees page
   *  excludes "Customer/Anyone"). */
  get visiblePayeeTypes() {
    const allowed = this.effectiveData?.payeeTypeOptions;
    if (allowed?.length) {
      return this.payeeTypes.filter((t) => allowed.includes(t.type));
    }
    return this.payeeTypes;
  }

  get payeeTypeTabs(): ITabItem[] {
    return this.visiblePayeeTypes.map((item) => ({
      label: item.name,
      value: item.value,
      disabled: this.payeeTypePermisson[item.type] === 0 && !this.editMode
    }));
  }

  get updateAddressOnly(): boolean {
    const d = this.effectiveData;
    return (
      d?.page === 'addAddress' ||
      d?.page === 'bryanCohenPayee' ||
      d?.page === 'addCompany'
    );
  }

  get activeTypeTitle(): string {
    const found = this.payeeTypes.find(
      (p) => p.value === String(this.payeeType)
    );
    if (found?.type === 'customer') return 'Customer';
    if (found?.type === 'vendor') return 'Vendor';
    if (found?.type === 'employee') return 'Employee';
    return this.entityLabel || 'Payee';
  }

  /**
   * @description Label for the legal name field, derived from the selected payee type.
   * The compass white-label flow keeps the generic label.
   */
  get legalNameLabel(): string {
    return this.isCompassCustomer
      ? 'Legal name'
      : `${this.activeTypeTitle} legal name`;
  }

  ngOnInit(): void {
    this.entityLabel = this.effectiveData?.entityLabel ?? 'Payee';
    this.checkPlugins();
    this.initFormGroup();
    this.subscribeToPhoneLookup();
    this.getBankAccounts();
    this.getAllowedCountries();
    this.googleAddressService.resetGoogleAutocompleteAPI();
    this.initForm();
    if (!this.effectiveData?.edit) {
      this.payeeService.setInternationalbankData(undefined);
      this.payeeService.setbankData(undefined);
      this.payeeType = this.effectiveData?.payeeType ?? 1;
      // If the default type isn't among the offered options, fall back to the
      // first available one (e.g. Payees page hides "Customer/Anyone").
      if (!this.visiblePayeeTypes.some((t) => t.value === String(this.payeeType))) {
        this.payeeType = this.visiblePayeeTypes[0]?.value ?? this.payeeType;
      }
      this.payeeService.updatePayeeInternationalBankList.next(undefined);
    }

    if (this.effectiveData && this.effectiveData.edit) {
      this.applyEditConfig(this.effectiveData);
    }

    this.loadPayeeLatestBankDetails();
    this.loadPayeeLatestInternationalBankDetails();
    this.resetPhoneNumber();
    if (this.effectiveData == null) {
      this.isFinishedBank = false;
      this.isFinishedInternationalBank = false;
    }
    if (this.effectiveData?.page) {
      if (
        this.effectiveData.page === 'addAddress' ||
        this.effectiveData?.page === 'bryanCohenPayee'
      ) {
        this.addAddress();
      } else if (this.effectiveData?.page === 'payeeEmail') {
        this.addEmail();
      } else if (this.effectiveData?.page === 'payeePhone') {
        this.addPhone();
      } else if (this.effectiveData?.page === 'addCompany') {
        this.addCompany();
      } else if (this.effectiveData.page === 'addBankDetails') {
        this.addBankDetails();
      } else if (this.effectiveData.page === 'addInternationalBankDetails') {
        this.addInternationalBankDetails();
      }
    }
    this.onAddedPayeeInternationalBankDetails();
    if (this.env.env_id !== 'compass') {
      this.changeEntityType();
    }

    this.watchAddressFields();
    this.isNgOnInitDone = true;
  }

  /**
   * Re-apply the all-or-nothing address rule as the user types. It used to run
   * only on load and when an address section was submitted, so a payee edited
   * from anywhere else could be saved with address line 1 alone: the required
   * validators were never added, the form was valid, and Update went through.
   *
   * `updateAddressCountryStateValidity` revalidates with `emitEvent: false`, so
   * this cannot feed itself.
   */
  private watchAddressFields(): void {
    [
      'payeeAddress1',
      'payeeAddress2',
      'payeeCity',
      'payeeState',
      'payeeCountry',
      'payeeZip'
    ].forEach((field) => {
      this.payeeForm
        .get(field)
        ?.valueChanges.pipe(
          distinctUntilChanged(),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe(() => this.updateAddressCountryStateValidity());
    });
  }

  /**
   * @description Makes payeeAddress1/payeeCity/payeeState/payeeCountry/payeeZip
   * required once any address field (including payeeAddress2) has a value.
   * payeeAddress2 itself stays optional. Skipped entirely for the compass
   * white-label flow.
   */
  updateAddressCountryStateValidity() {
    if (
      this.dynamicWhiteLabelService.dynamicWhiteLabelFlagChecker(
        'isCompassRequirement'
      )
    ) {
      this.isAddressCountryStateRequired.set(false);
      return;
    }

    const hasAnyAddressValue = [
      'payeeAddress1',
      'payeeAddress2',
      'payeeCity',
      'payeeState',
      'payeeCountry',
      'payeeZip'
    ].some((field) => !!this.payeeForm.get(field)?.value?.trim());

    [
      'payeeAddress1',
      'payeeCity',
      'payeeState',
      'payeeCountry',
      'payeeZip'
    ].forEach((field) => {
      const control = this.payeeForm.get(field);
      if (hasAnyAddressValue) {
        control?.addValidators(Validators.required);
      } else if (!this.isBusinessIsRequired && !this.updateAddressOnly) {
        control?.removeValidators(Validators.required);
      }
      control?.updateValueAndValidity({ emitEvent: false });
    });

    const missing =
      hasAnyAddressValue &&
      (!this.payeeForm.get('payeeAddress1')?.value ||
        !this.payeeForm.get('payeeCity')?.value ||
        !this.payeeForm.get('payeeState')?.value ||
        !this.payeeForm.get('payeeCountry')?.value ||
        !this.payeeForm.get('payeeZip')?.value);
    this.isAddressCountryStateRequired.set(missing);
  }

  closeModal(): void {
    if (this.dialogRef && !this.isEmbedded()) {
      this.dialogRef.close(false);
    } else {
      this.closed.emit();
    }
  }

  closeWithResult(result: IPayeeSaveUpdateResult): void {
    if (this.dialogRef && !this.isEmbedded()) {
      this.dialogRef.close(result);
    } else if (this.editMode) {
      this.payeeUpdated.emit(result);
    } else {
      this.payeeSaved.emit(result);
    }
  }

  toggleSection(section: string): void {
    if (this.expandedSections.has(section)) {
      this.expandedSections.delete(section);
    } else {
      this.expandedSections.add(section);
    }
  }

  expandSectionsWithErrors(): { firstSection: string | null; invalidFields: string[] } {
    const sectionFieldMap: Record<string, string[]> = {
      basic: ['payeeName', 'payeeNickName'],
      entity: [
        'payeeCompany',
        'customerAccountNumber',
        'vendorAccountNumber',
        'employeeAccountNumber'
      ],
      address: [
        'payeeAddress1',
        'payeeAddress2',
        'payeeCity',
        'payeeState',
        'payeeCountry',
        'payeeZip'
      ],
      tax: [
        'customerDefaultPayFromAcount',
        'customerCategory',
        'customerDefaultPayFromMethod',
        'customerFirstName',
        'customerLastName',
        'customerType',
        'customerCompanyName',
        'vendorDefaultPayAccount',
        'vendorCategory',
        'vendorDefaultPayMethod',
        'vendorFistName',
        'vendorLastName',
        'vendorType',
        'vendorPaymentTerms',
        'vendorTaxId',
        'vendor_1099',
        'vendorCompanyName',
        'employeeFirstName',
        'employeeLastName',
        'employeeDob',
        'employeeSsn',
        'employeeType',
        'employeeHourlyRate',
        'employeePaymentSchedule',
        'employeeFillingStatus',
        'employeeOvertimeRate',
        'employeeYtdEarning',
        'employeeYtdTax',
        'employeeDefaultPayAccount',
        'employeeCategory',
        'employeeDefaultPayMethod',
        'payeeCompanyWebsite'
      ]
    };

    const nonAccordionSections = new Set(['basic']);
    let firstSection: string | null = null;
    const invalidFields: string[] = [];
    Object.entries(sectionFieldMap).forEach(([section, fields]) => {
      const sectionInvalidFields = fields.filter(
        (field) => this.payeeForm.get(field)?.invalid
      );
      if (sectionInvalidFields.length > 0) {
        if (!nonAccordionSections.has(section)) {
          this.expandedSections.add(section);
        }
        if (!firstSection) {
          firstSection = section;
          invalidFields.push(...sectionInvalidFields);
        }
      }
    });
    return { firstSection, invalidFields };
  }

  private scrollToSection(section: string, invalidFields: string[]): void {
    setTimeout(() => {
      const id = section === 'basic' ? 'basic-section' : `accordion-${section}`;
      const el = document.getElementById(id);
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (el) {
        const wrapper = invalidFields
          .map((fieldName) =>
            el.querySelector<HTMLElement>(`[data-field="${fieldName}"]`)
          )
          .find((wrapperEl) => !!wrapperEl);
        if (wrapper) {
          shakeElement(wrapper);
        }
      }
    });
  }

  changeEntityType() {
    const addressFields = [
      'payeeAddress1',
      'payeeCity',
      'payeeState',
      'payeeCountry',
      'payeeZip'
    ];

    this.payeeForm.controls.entityType.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        const requiredFields = ['payeeCompany', ...addressFields];

        if (res === 'business') {
          this.isBusinessIsRequired = true;
          requiredFields.forEach((field) => {
            this.payeeForm.get(field)?.addValidators(Validators.required);
            this.payeeForm.get(field)?.updateValueAndValidity();
          });
          const anyAddressFieldEmpty = addressFields.some(
            (field) => !this.payeeForm.get(field)?.value
          );
          this.isAddressRequired.set(anyAddressFieldEmpty);
        } else {
          this.isBusinessIsRequired = false;
          const fieldsToRelax =
            this.effectiveData?.page === 'addCompany'
              ? addressFields // keep payeeCompany required in addCompany mode
              : requiredFields;
          fieldsToRelax.forEach((field) => {
            this.payeeForm.get(field)?.removeValidators(Validators.required);
            this.payeeForm.get(field)?.updateValueAndValidity();
          });
          this.isAddressRequired.set(false);
        }
      });

    // Listen to address field changes to clear "Address is required" when all fields are filled
    addressFields.forEach((field) => {
      this.payeeForm
        .get(field)
        ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          if (this.isAddressRequired()) {
            const anyAddressFieldEmpty = addressFields.some(
              (f) => !this.payeeForm.get(f)?.value
            );
            if (!anyAddressFieldEmpty) {
              this.isAddressRequired.set(false);
            }
          }
        });
    });
  }

  trackByFn(item: { id: string; name: string; fun: () => void }) {
    return item.id;
  }

  changeTransferType(item: { id: string; name: string; fun: () => void }) {
    this.selectedTransferType = item.id;
    item.fun();
  }

  resetPhoneNumber() {
    this.cloudBankService.phoneDetailsUpdater = {
      countryCode: '',
      phone: ''
    };
  }

  loadPayeeBankData() {
    if (this.payeeId) {
      this.payeeService
        .getPayeeBankData(this.payeeId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((res) => {
          if (res?.success) this.payeeBankDetails = res.data;
          if (this.payeeBankDetails.length > 0) {
            this.isFinishedBank = true;
          } else {
            this.isFinishedBank = false;
          }
          this.domesticBankCount.set(this.payeeBankDetails.length);
          this.setDefaultAccount();
        });
    }
  }

  setDefaultAccount() {
    this.paymentsService
      .getDefaultDDAccount()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res) {
          this.payeeBankDetails.forEach((bankData, index) => {
            if (bankData.id === res) {
              (
                this.payeeBankDetails[index] as IPayeeBankDetails
              ).defaultDDAccount = 1;
            } else {
              (
                this.payeeBankDetails[index] as IPayeeBankDetails
              ).defaultDDAccount = 0;
            }
          });
        }
      });
  }

  loadPayeeLatestBankDetails() {
    this.payeeBankDetails.splice(0, 1);
    this.payeeService.getbankData
      .pipe(skip(1), takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => {
        if (data) {
          if (!this.payeeId) {
            this.payeeBankDetails.push(
              data as IPayeeSingleBankData & IPayeeBankDetails
            );
            this.isFinishedBank = this.payeeBankDetails.length > 0;
            this.domesticBankCount.set(this.payeeBankDetails.length);
          } else {
            this.loadPayeeBankData();
          }
        }
      });
    this.payeeBankDetails = [];
  }

  onAddedPayeeInternationalBankDetails(): void {
    this.payeeService.updatePayeeInternationalBankList
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => {
        if (data) {
          this.payeeInternationalBankDetails = data;
          this.isFinishedInternationalBank = true;
          this.internationalBankCount.set(data.length);
        }
      });
  }

  loadPayeeInternationalBankData() {
    this.payeeService
      .internationalBanksPayee(this.payeeId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res?.success) {
          this.payeeInternationalBankDetails = res.data;
          this.isFinishedInternationalBank =
            this.payeeInternationalBankDetails.length > 0;
          this.internationalBankCount.set(this.payeeInternationalBankDetails.length);
        }
      });
  }

  loadPayeeLatestInternationalBankDetails() {
    this.payeeService.getInternationalbankData
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => {
        if (data && data?.payeeId === '') {
          const wireData = data as IInternationalWirePayeeAccounts;
          const idx = this.payeeInternationalBankDetails.findIndex((item) =>
            'accountNumber' in item &&
            item.accountNumber === wireData.accountNumber &&
            item.bankName === wireData.bankName
          );
          if (idx !== -1) {
            this.payeeInternationalBankDetails[idx] = data;
          } else {
            this.payeeInternationalBankDetails[
              this.payeeInternationalBankDetails.length
            ] = data;
          }
        } else if (data && data.payeeId !== '') {
          if (this.payeeInternationalBankDetails.length > 0) {
            this.payeeInternationalBankDetails[
              this.payeeInternationalBankDetails.findIndex(
                (acc) => acc.id === data.id
              )
            ] = data;
          } else {
            this.payeeInternationalBankDetails[
              this.payeeInternationalBankDetails.length
            ] = data;
          }
        }
        this.isFinishedInternationalBank =
          this.payeeInternationalBankDetails.length > 0;
        this.internationalBankCount.set(this.payeeInternationalBankDetails.length);
      });
    this.payeeInternationalBankDetails = [];
  }

  loadFormValue() {
    this.inputDataChange.emit(this.payeeForm.value);
  }

  private applyEditConfig(data: NonNullable<AddPayeeModalEffectiveData>): void {
    if (this.editInitialized) return;
    this.editInitialized = true;
    this.payeeId = data.id ?? '';
    this.childData$.next({ editMode: true });
    this.editMode = true;
    if (data.type === 'payeePhone') {
      this.payeeForm.controls.payeePhone.setValidators([Validators.required]);
    }
    this.loadPayeeData();
    this.loadPayeeBankData();
    this.loadPayeeInternationalBankData();
  }

  loadPayeeData() {
    this.dataLoaded = true;
    this.payeeService
      .getPayeeEditData(this.payeeId)
      .pipe(
        finalize(() => {
          this.childData$.next({ dataLoaded: true });
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res?.success) {
          if (res.data.payeeAddressLine1) {
            this.isFinishedAddress = true;
          }
          this.payeeGetData = res.data;
          this.payeeType = this.payeeGetData.payeeTypeId || 1;
          if (this.payeeGetData.entityType) {
            this.showEntityOption.set(false);
          } else {
            this.showEntityOption.set(true);
          }
          this.setCheckData();
          this.customerCategoryId = this.payeeGetData.customerCategory;
          this.vendorCategoryId = this.payeeGetData.vendorCategory;
          this.employeeCategoryId = this.payeeGetData.employeeCategory;
          this.patchPayeeIdNumber();
          if (res.data.payeeEmail || res.data.payeePhone) {
            this.requestPayeeForm.patchValue({
              payeeEmail: res.data.payeeEmail,
              payeePhone: res.data.payeePhone
            });
            this.getPhoneNumber();
            this.getEmail();
          }
          if (this.effectiveData?.page === 'bryanCohenPayee') {
            this.updateBryanCohenForm(String(this.payeeGetData.payeeTypeId));
          }
        }
      });
  }

  initFormGroup(): void {
    const userPlugins = this.localStorageService.getItem('userPlugins');
    this.isBryancohen = userPlugins?.includes('enterprise-bryancohen') ?? false;
    this.payeeForm = this.fb.group({
      payeeName: ['', [Validators.required, Validators.maxLength(this.editMode ? 191 : 100), ValidationService.whitespaceValidator,ValidationService.containsHtmlTag, ValidationService.personNameValidator]],
      payeeNickName: ['', this.isBryancohen ? [] : [Validators.required,Validators.maxLength(30), ValidationService.whitespaceValidator,ValidationService.containsHtmlTag]],
      payeeEmail: ['', ValidationService.emailValidator],
      payeePhone: [
        '',
        [
          ValidationService.customMinLength(
            this.currenCountryPhoneLength?.min ?? 10
          )
        ]
      ],
      payeeCompany: ['', this.updateAddressOnly ? Validators.required : []],
      payeeCompanyWebsite: ['', this.urlValidator()],
      payeeAddress1: ['', [ValidationService.addressValidator]],
      payeeAddress2: ['', [ValidationService.addressValidator]],
      payeeCity: ['', [ValidationService.addressValidator]],
      payeeState: [null],
      payeeCountry: [null],
      payeeZip: ['', [ValidationService.zipValidator]],
      payeeIdNumber: [''],
      bankData: this.fb.array([]),
      internationalWirePayeeAccounts: this.fb.array([]),
      customerAccountNumber: [''],
      vendorAccountNumber: [''],
      employeeAccountNumber: [''],
      isRequestedBankInfo: [''],
      entityType: [null],
      // Customer
      customerDefaultPayFromAcount: [null, []],
      customerCategory: ['', []],
      customerDefaultPayFromMethod: [null, []],
      customerFirstName: ['', []],
      customerLastName: ['', []],
      customerType: [null, []],
      customerCompanyName: ['', []],
      // Vendor
      vendorDefaultPayAccount: [null, []],
      vendorCategory: [null, []],
      vendorDefaultPayMethod: [null, []],
      vendorFistName: ['', []],
      vendorLastName: ['', []],
      vendorType: [null, []],
      vendorPaymentTerms: [null, []],
      vendorTaxId: ['', [Validators.minLength(9)]],
      vendor_1099: [null, []],
      vendorCompanyName: ['', []],
      // Employee
      employeeFirstName: ['', []],
      employeeLastName: ['', []],
      employeeDob: ['', []],
      employeeSsn: ['', [Validators.minLength(9)]],
      employeeType: [null, []],
      employeeHourlyRate: ['', []],
      employeePaymentSchedule: [null, []],
      employeeFillingStatus: [null, []],
      employeeOvertimeRate: ['', []],
      employeeYtdEarning: ['', []],
      employeeYtdTax: ['', []],
      employeeDefaultPayAccount: [null, []],
      employeeCategory: ['', []],
      employeeDefaultPayMethod: [null],
      permissionEmail: [0, []],
      permissionSms: [0, []]
    });
  }

  createPayeeBody(): INewPayee {
    const data = this.payeeForm.value;
    let vendor1099 = data?.vendor_1099;
    if (
      this.dynamicWhiteLabelService.dynamicWhiteLabelFlagChecker(
        'isCompassRequirement'
      )
    ) {
      this.payeeType = '2';
    }
    if (this.payeeType.toString() === '2') {
      if (vendor1099 === '' || vendor1099 === null) vendor1099 = '2';
    }
    if (vendor1099 !== '1' && vendor1099 !== '2') {
      vendor1099 = '';
    }

    const currentPhone = data.payeePhone;
    if (currentPhone && this.payeeInternationalBankDetails?.length) {
      this.payeeInternationalBankDetails = this.payeeInternationalBankDetails.map((bank) =>
        'beneficiary' in bank
          ? { ...bank, beneficiary: { ...bank.beneficiary, phone: currentPhone } }
          : bank
      ) as IInternationalBanksPayee[] | IInternationalWirePayeeAccounts[];
    }

    return {
      payeeTypeId: this.payeeType.toString(),
      name: data.payeeName,
      payeeNickName: data.payeeNickName,
      payeeEmail: data.payeeEmail,
      payeePhone: data.payeePhone,
      payeeCompanyName: data.payeeCompany,
      payeeAddressLine1: data.payeeAddress1,
      payeeAddressLine2: data.payeeAddress2,
      payeeCity: data.payeeCity,
      payeeState: data.payeeState,
      payeeCountry: data.payeeCountry,
      payeeZip: data.payeeZip,
      entityType: data.entityType,
      payeeCompanyWebsite: data.payeeCompanyWebsite,
      bankData: this.payeeBankDetails,
      internationalWirePayeeAccounts: this.payeeInternationalBankDetails,
      customerAccountNumber: data.customerAccountNumber,
      vendorAccountNumber: data.vendorAccountNumber,
      employeeAccountNumber: data.employeeAccountNumber,
      isRequestedBankInfo: this.isRequestedBankInfo,
      // Customer
      customerBankAccountId: data.customerDefaultPayFromAcount,
      customerDefaultPayMethod: data.customerDefaultPayFromMethod,
      customerFirstName: data.customerFirstName,
      customerLastName: data.customerLastName,
      customerType: data.customerType,
      customerCompanyName: data.customerCompanyName,
      customerCategory: data.customerCategory,
      // Vendor
      vendorBankAccountId: data.vendorDefaultPayAccount,
      vendorDefaultPayMethod: data.vendorDefaultPayMethod,
      vendorFirstName: data.vendorFistName,
      vendorLastName: data.vendorLastName,
      vendorType: data.vendorType,
      vendorPaymentTerms: data.vendorPaymentTerms,
      vendorTaxId: data.vendorTaxId,
      vendor_1099: vendor1099,
      vendorCompanyName: data.vendorCompanyName,
      vendorCategory: data.vendorCategory,
      // Employee
      employeeFirstName: data.employeeFirstName,
      employeeLastName: data.employeeLastName,
      employeeDob: data.employeeDob,
      employeeSsn: data.employeeSsn,
      employeeType: data.employeeType,
      employeeHourlyRate: data.employeeHourlyRate,
      employeePaymentSchedule: data.employeePaymentSchedule,
      employeeFillingStatus: data.employeeFillingStatus,
      employeeOvertimeRate: data.employeeOvertimeRate,
      employeeYtdEarning: data.employeeYtdEarning,
      employeeYtdTax: data.employeeYtdTax,
      employeeBankAccountId: data.employeeDefaultPayAccount,
      employeeCategory: data.employeeCategory,
      employeeDefaultPayMethod: data.employeeDefaultPayMethod,
      is_requested_bank_info: data.isRequestedBankInfo,
      permission_email: data.permissionEmail,
      permission_sms: data.permissionSms
    };
  }

  createRequestPayeeData(data: IViewPayee) {
    return {
      payee_id: data.id,
      payee_email: data.email,
      payee_phone: data.phone,
      permission_email: data.phone ? 1 : 0,
      permission_sms: data.email ? 1 : 0
    };
  }

  setCheckData() {
    if (this.payeeGetData.payeeTypeId === '1') this.selectedTabIndex = 0;
    else if (this.payeeGetData.payeeTypeId === '2') this.selectedTabIndex = 1;
    else if (this.payeeGetData.payeeTypeId === '3') this.selectedTabIndex = 2;
    else this.selectedTabIndex = 0;

    Object.keys(this.payeeGetData).forEach((item) => {
      if (
        this.payeeGetData[item as keyof IPayeeDetails] === '' ||
        this.payeeGetData[item as keyof IPayeeDetails] === null ||
        this.payeeGetData[item as keyof IPayeeDetails] === '0'
      ) {
        if (
          item === 'customerBankAccountId' ||
          item === 'vendorBankAccountId' ||
          item === 'employeeBankAccountId'
        ) {
          this.payeeGetData[item] = '';
        }
      }
    });
    setTimeout(() => {
      this.payeeForm.patchValue({
        payeeTypeId: this.payeeGetData.payeeTypeId,
        payeeName: this.payeeGetData.name,
        customerAccountNumber: this.payeeGetData.customerAccountNumber,
        payeeNickName: this.payeeGetData.payeeNickName,
        payeeEmail: this.payeeGetData.payeeEmail,
        payeePhone: this.checkPhoneNumber(this.payeeGetData.payeePhone),
        payeeCompany: this.payeeGetData.payeeCompanyName,
        payeeAddress1: this.payeeGetData.payeeAddressLine1,
        payeeAddress2: this.payeeGetData.payeeAddressLine2,
        payeeCity: this.payeeGetData.payeeCity,
        payeeState: this.payeeGetData.payeeState,
        payeeCountry: this.checkCountryName(this.payeeGetData.payeeCountry),
        payeeZip: this.payeeGetData.payeeZip,
        entityType: this.payeeGetData.entityType || null,
        payeeCompanyWebsite: this.payeeGetData.payeeCompanyWebsite,
        vendorAccountNumber: this.payeeGetData.vendorAccountNumber,
        employeeAccountNumber: this.payeeGetData.employeeAccountNumber,
        customerDefaultPayFromAcount: this.payeeGetData.customerBankAccountId
          ? this.payeeGetData.customerBankAccountId
          : null,
        customerDefaultPayFromMethod:
          this.payeeGetData.customerDefaultPayMethod || null,
        customerFirstName: this.payeeGetData.customerFirstName,
        customerLastName: this.payeeGetData.customerLastName,
        customerType: this.payeeGetData.customerType || null,
        customerCompanyName: this.payeeGetData.customerCompanyName,
        customerCategory: this.payeeGetData.customerCategory,
        vendorDefaultPayAccount: this.payeeGetData.vendorBankAccountId
          ? this.payeeGetData.vendorBankAccountId
          : null,
        vendorDefaultPayMethod:
          this.payeeGetData.vendorDefaultPayMethod || null,
        vendorFistName: this.payeeGetData.vendorFirstName,
        vendorLastName: this.payeeGetData.vendorLastName,
        vendorType: this.payeeGetData.vendorType || null,
        vendorPaymentTerms: this.payeeGetData.vendorPaymentTerms || null,
        vendorTaxId: this.payeeGetData.vendorTaxId,
        vendor_1099: this.payeeGetData.vendor_1099 || null,
        vendorCompanyName: this.payeeGetData.vendorCompanyName,
        vendorCategory: this.payeeGetData.vendorCategory || null,
        employeeFirstName: this.payeeGetData.employeeFirstName,
        employeeLastName: this.payeeGetData.employeeLastName,
        employeeDob: this.payeeGetData.employeeDob,
        employeeSsn: this.payeeGetData.employeeSsn,
        employeeType: this.payeeGetData.employeeType || null,
        employeeHourlyRate: this.payeeGetData.employeeHourlyRate,
        employeePaymentSchedule:
          this.payeeGetData.employeePaymentSchedule || null,
        employeeFillingStatus: this.payeeGetData.employeeFillingStatus || null,
        employeeOvertimeRate: this.payeeGetData.employeeOvertimeRate,
        employeeYtdEarning: this.payeeGetData.employeeYtdEarning,
        employeeYtdTax: this.payeeGetData.employeeYtdTax,
        employeeDefaultPayAccount: this.payeeGetData.employeeBankAccountId
          ? this.payeeGetData.employeeBankAccountId
          : null,
        employeeDefaultPayMethod:
          this.payeeGetData.employeeDefaultPayMethod || null,
        employeeCategory: this.payeeGetData.employeeCategory
      });
      this.prevValues.addressFormData = {
        payeeAddress1: this.payeeGetData.payeeAddressLine1,
        payeeAddress2: this.payeeGetData.payeeAddressLine2,
        payeeCity: this.payeeGetData.payeeCity,
        payeeState: this.payeeGetData.payeeState,
        payeeCountry: this.checkCountryName(this.payeeGetData.payeeCountry),
        payeeZip: this.payeeGetData.payeeZip
      };
      this.updateAddressCountryStateValidity();
    }, 100);

    setTimeout(() => {
      this.childData$.next({
        payeeType:
          EPayeeType[this.payeeGetData.payeeTypeId as unknown as number]
      });
      this.payeeType = this.payeeGetData.payeeTypeId || 1;
      this.dataLoaded = false;
    }, 100);
  }

  checkCountryName(country: string) {
    if (country === null || country === undefined || country === '') {
      return null;
    }
    const data = Object.entries(this.allowedcountries);
    let alphaNumericCode = '';
    data.forEach((res) => {
      if (res[0] === country || res[1] === country) {
        alphaNumericCode = res[0];
      }
    });
    return alphaNumericCode;
  }

  subscribeToPhoneLookup(): void {
    this.payeeForm.controls.payeePhone.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        filter((phone: string) => {
          const minLength = this.currenCountryPhoneLength?.min ?? 10;
          return phone?.replace(/[^0-9]/g, '').length >= minLength;
        }),
        switchMap((phone: string) =>
          this.cloudBankService.phoneNumberLookup(phone)
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  countryChange(event: { length: { min: number; max: number }; code: string }) {
    this.currenCountryPhoneLength = event.length;
    this.payeeForm.controls.payeePhone.setValidators([
      ValidationService.customMinLength(event.length?.min ?? 10)
    ]);
    this.payeeForm.controls.payeePhone.updateValueAndValidity();
  }

  onPayeeAddressSelected(address: IGoogleAddress): void {
    this.payeeForm.patchValue({
      payeeAddress1: address.address,
      payeeCity: (address.city ?? '').trim(),
      payeeState: (address.state ?? '').trim(),
      payeeZip: (address.zip ?? '').trim(),
      payeeCountry: this.checkCountryName(address.country)
    });
  }

  get fBankData() {
    return <FormArray>this.payeeForm.controls.bankData;
  }

  getBankData(ev: { requested: boolean }) {
    this.isRequestedBankInfo = ev.requested ? '1' : '0';
  }

  onTabClick(payeeTypeId: string): void {
    let accNo = '';
    const tabSelected = String(
      this.payeeTypes.filter((item) => item.value === payeeTypeId)[0].type
    );
    if (this.payeeType === 1) {
      accNo = this.payeeForm.controls.customerAccountNumber.value;
      this.payeeForm.controls.customerAccountNumber.setValue('');
    } else if (this.payeeType === 2) {
      accNo = this.payeeForm.controls.vendorAccountNumber.value;
      this.payeeForm.controls.vendorAccountNumber.setValue('');
    } else if (this.payeeType === 3) {
      accNo = this.payeeForm.controls.employeeAccountNumber.value;
      this.payeeForm.controls.employeeAccountNumber.setValue('');
    }
    if (tabSelected === 'customer') {
      this.payeeType = 1;
      this.payeeForm.controls.customerAccountNumber.setValue(accNo);
    } else if (tabSelected === 'vendor') {
      this.payeeType = 2;
      this.payeeForm.controls.vendorAccountNumber.setValue(accNo);
    } else if (tabSelected === 'employee') {
      this.payeeType = 3;
      this.payeeForm.controls.employeeAccountNumber.setValue(accNo);
    }
    setTimeout(() => {
      this.childData$.next({ payeeType: tabSelected });
    });
  }

  switchBankTab(tab: 'domestic' | 'international'): void {
    this.bankActiveTab = tab;
  }

  onSubmit(): void {
    // Address-only mode: skip full-form validation (hidden fields like
    // payeeNickName have Validators.required and would block submission).
    // Only validate the visible address fields, then call onUpdate().
    if (this.updateAddressOnly) {
      const requiredFields = [
        'payeeAddress1',
        'payeeCity',
        'payeeCountry',
        'payeeZip'
      ];
      if (this.effectiveData?.page === 'addCompany') {
        requiredFields.push('payeeCompany');
      }
      requiredFields.forEach((field) => {
        const control = this.payeeForm.get(field);
        control?.setValidators([Validators.required]);
        control?.markAsTouched();
        control?.updateValueAndValidity();
      });
      if (requiredFields.some((f) => this.payeeForm.get(f)?.invalid)) {
        return;
      }
      if (this.payeeForm.get('payeeCompany')?.value) {
        this.payeeForm.controls.entityType.setValue('business');
      }
      this.onUpdate();
      return;
    }

    const payeeFormValue = this.payeeForm.value;
    if (payeeFormValue.payeeCountry === 'US') {
      if (
        payeeFormValue.payeeZip &&
        (payeeFormValue.payeeZip.match(/[A-Z]/) ||
          payeeFormValue.payeeZip.match(/[a-z]/))
      ) {
        this.alertService.warningAlert({
          content: `Zip field only allow integer values for <br> United States`
        });
        return;
      }
    }

    this.payeeForm.markAllAsTouched();
    const { firstSection, invalidFields } = this.expandSectionsWithErrors();

    const markAsBtn = this.fBankData.controls.find((e) => {
      if (e.value.default_dd_account === '1') return true;
      return false;
    });

    if (
      this.payeeForm.invalid &&
      this.payeeForm.controls.payeeCountry.value !== 'UK' &&
      this.payeeForm.controls.payeeCountry.value !== 'United Kingdom'
    ) {
      if (firstSection) this.scrollToSection(firstSection, invalidFields);
      return;
    }

    if (!markAsBtn && this.fBankData.controls.length !== 0) {
      this.openWarningAlert('Please select a default bank account.');
      return;
    }

    if (this.isBrayanCohenCustomer && this.isPermissionDenied()) {
      return;
    }

    this.onAction();
  }

  onAction() {
    if (!this.editMode) {
      if (this.hasHolderNameMismatch()) {
        return;
      }
      this.onSave();
    } else {
      this.onUpdate();
    }
  }

  private hasHolderNameMismatch(): boolean {
    const legalName = this.payeeForm.controls.payeeName.value;
    const mismatch = this.payeeBankDetails.some(
      (bank) => !ValidationService.isLegalNameMatch(bank.bankName, legalName)
    );
    if (mismatch) {
      this.openWarningAlert(
        `The bank account holder name must match the payee's legal name "${legalName}". Please update the bank account before saving.`
      );
    }
    return mismatch;
  }

  onSave(): void {
    this.loading = true;
    this.payeeService
      .createPayee(this.createPayeeBody())
      .pipe(
        finalize(() => {
          this.loading = false;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          if (res.success === true) {
            this.paymentsService.editingPayeeId = res.data.id;
            this.payeeService.payeeTotalCountSignal.update((value) => value + 1);
            const result = {
              success: true,
              payeeTypeId: this.payeeType.toString(),
              ...res.data
            };
            this.closeWithResult(result);
            this.openSuccessAlert(`${this.whiteLabelName} Added.`);
            if (this.isRequestedBankInfo === '1') {
              const payeeReqData = this.createRequestPayeeData(res.data);
              this.payeeService
                .requestPayeeAdd(payeeReqData)
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe();
            }
            this.gettingStartedService.updatedGettingStartedData = 4;
          }
        },
        error: (err: HttpErrorResponse) => {
          this.loading = false;
          this.cdr.detectChanges();
          if (err?.error?.errorCode === '266') {
            this.alertService.failedAlert({
              content: err.error?.errorMsg,
              isCancel: true
            }).afterClosed().subscribe(() => {
              const ctrl = this.payeeForm.controls.payeePhone;
              this.payeePhoneErrorMessages = { serverError: err.error?.errorMsg };
              ctrl.setErrors({ serverError: true });
              ctrl.markAsTouched();
              setTimeout(() => {
                this.payeePhoneField?.nativeElement?.scrollIntoView({
                  behavior: 'smooth',
                  block: 'center'
                });
              });
              ctrl.valueChanges
                .pipe(take(1), takeUntilDestroyed(this.destroyRef))
                .subscribe(() => {
                  this.payeePhoneErrorMessages = {};
                  ctrl.setErrors(null);
                });
            });
          }
        }
      });
  }

  onUpdate(): void {
    if (this.effectiveData?.page === 'bryanCohenPayee') {
      this.payeeForm.markAllAsTouched();
      if (this.payeeForm.invalid) return;
    }
    this.loading = true;
    this.payeeService
      .updatePayee(this.payeeId, this.createPayeeBody())
      .pipe(
        finalize(() => {
          this.loading = false;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            const result = {
              success: true,
              payeeTypeId: this.payeeType.toString(),
              ...res.data
            };
            this.closeWithResult(result);
            this.openSuccessAlert(`${this.whiteLabelName} Updated.`);
            this.dataTableService.invalidateTableCache(DTTableId.payee);
          }
        },
        error: (err: HttpErrorResponse) => {
          this.loading = false;
          this.cdr.detectChanges();
          if (err?.error?.errorCode === '266') {
            this.alertService.failedAlert({
              content: err.error?.errorMsg,
              isCancel: true
            });
          }
        }
      });
  }

  openRequestModal(data: IViewPayee) {
    const dialogRef = this.dialog.open(RequestPayeeModalV4Component, {
      maxWidth: '440px',
      minWidth: '400px',
      width: '95%',
      panelClass: 'paddingless-modal-rounded',
      data: {
        payeeType: data.id,
        payeeEmail: data.email,
        payeePhone: data.phone
      },
      disableClose: true
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((r) => {
        if (r?.success) {
          this.isRequestedBankInfo = !this.isRequestedBankInfo;
          this.BankAccountData.emit({ requested: this.isRequestedBankInfo });
        }
      });
  }

  getBankAccounts() {
    this.bankService
      .getBankAccounts(this.bankPage)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => {
        if (data?.success) this.bankAccounts.push(...data.data);
      });
  }

  searchBank(e: string) {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.bankService
        .getBankAccounts(0, e)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((res) => {
          if (res?.success) {
            this.bankAccounts = res.data;
          }
        });
    }, 700);
  }

  onScrollToEndBank() {
    this.bankPage += 1;
    this.getBankAccounts();
  }

  numberOnly(event: { which: number; keyCode: number }): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }

  openSuccessAlert(content?: string, disable?: boolean, timeout?: number) {
    const data = {
      title: 'Success!',
      content,
      close: disable !== undefined ? disable : true,
      timeout: timeout !== undefined ? timeout : 1000
    };
    return this.alertService.successAlert(data);
  }

  openWarningAlert(content: string) {
    return this.alertService.warningAlert({ content });
  }

  addMoreInfo(payeeType: number | string) {
    this.prevValues.moreInfoFormData = {
      customerDefaultPayFromAcount:
        this.payeeForm.get('customerDefaultPayFromAcount')?.value ??
        (this.payeeGetData?.customerBankAccountId?.trim()
          ? this.payeeGetData?.customerBankAccountId
          : null),
      customerCategory:
        this.payeeForm.get('customerCategory')?.value ??
        this.payeeGetData?.customerCategory ??
        null,
      customerDefaultPayFromMethod:
        this.payeeForm.get('customerDefaultPayFromMethod')?.value ??
        this.payeeGetData?.customerDefaultPayMethod ??
        null,
      customerFirstName:
        this.payeeForm.get('customerFirstName')?.value ??
        this.payeeGetData?.customerFirstName ??
        null,
      customerLastName:
        this.payeeForm.get('customerLastName')?.value ??
        this.payeeGetData?.customerLastName ??
        null,
      customerType:
        this.payeeForm.get('customerType')?.value ??
        this.payeeGetData?.customerType ??
        null,
      customerCompanyName:
        this.payeeForm.get('customerCompanyName')?.value ??
        this.payeeGetData?.customerCompanyName ??
        null
    };
    if (payeeType === 1) {
      this.showPage = 'moreInfoCustomer';
    } else if (payeeType === 2) {
      this.showPage = 'moreInfoVendor';
    } else {
      this.showPage = 'moreInfoEmployee';
    }
  }

  catagoryDropDownChange(
    selectedCategory: ICategoryDropdown,
    type: string
  ): void {
    switch (type) {
      case 'customer':
        this.payeeForm.patchValue({
          customerCategory: selectedCategory?.id ?? null
        });
        break;
      case 'vendor':
        this.payeeForm.patchValue({
          vendorCategory: selectedCategory?.id ?? null
        });
        break;
      case 'employee':
        this.payeeForm.patchValue({
          employeeCategory: selectedCategory?.id ?? null
        });
        break;
      default:
        break;
    }
  }

  requestPayBtn(
    payeeEmailControl: FormControl | Params,
    payeeEmail: string,
    payeePhoneControl: FormControl | Params,
    payeePhone: string,
    event?: Event
  ) {
    const checkbox = event?.target as HTMLInputElement;
    const emailValidation = ValidationService.emailValidator(
      payeeEmailControl as FormControl
    );
    const phoneValidation = ValidationService.phoneMinLength(
      payeePhoneControl as FormControl
    );

    if (this.editMode) {
      this.openRequestPayeeModal(event);
      return;
    }

    if (!payeeEmail && !payeePhone) {
      this.isRequestedBankInfo = false;
      checkbox.checked = false;
      this.openWarningAlert('Please enter email or phone number.');
      return;
    }
    if (emailValidation?.invalidEmailAddress) {
      this.isRequestedBankInfo = false;
      checkbox.checked = false;
      this.openWarningAlert('Invalid Email Address');
      return;
    }
    if (phoneValidation && phoneValidation.invalidPhoneLength) {
      this.isRequestedBankInfo = false;
      checkbox.checked = false;
      this.openWarningAlert('Invalid Phone Number');
      return;
    }

    if (checkbox.checked) {
      this.isRequestedBankInfo = true;
      this.payeeForm.controls.isRequestedBankInfo.setValue(1);
      this.payeeForm.controls.permissionEmail.setValue(1);
      this.payeeForm.controls.permissionSms.setValue(1);
    } else {
      this.isRequestedBankInfo = false;
      this.payeeForm.controls.isRequestedBankInfo.setValue(0);
      this.payeeForm.controls.permissionEmail.setValue(0);
      this.payeeForm.controls.permissionSms.setValue(0);
    }
    this.BankAccountData.emit({ requested: this.isRequestedBankInfo });
  }

  requestPayeeAccount() {
    this.getSendLink(this.payeeType);
  }

  openRequestPayeeModal(event?: Event) {
    const { payeeEmail } = this.payeeForm.value;
    const { payeePhone } = this.payeeForm.value;
    const dialogRef = this.dialog.open(RequestPayeeModalV4Component, {
      maxWidth: '440px',
      minWidth: '400px',
      width: '95%',
      panelClass: 'paddingless-modal-rounded',
      data: {
        payeeType: this.payeeId,
        payeeEmail,
        payeePhone
      },
      disableClose: true
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((r) => {
        const checkbox = event?.target as HTMLInputElement;
        if (r?.success) {
          this.isRequestedBankInfo = !this.isRequestedBankInfo;
          this.BankAccountData.emit({ requested: this.isRequestedBankInfo });
          this.reqCheck = true;
          if (checkbox) {
            checkbox.checked = true;
          }
        } else {
          if (checkbox && !this.reqCheck) {
            checkbox.checked = false;
          }
          if (checkbox && this.reqCheck) {
            checkbox.checked = true;
          }
        }
      });
  }

  /**
   * Which section the caller asked for. Held for a moment after the scroll so
   * the section says so in colour — landing mid-form with nothing marked left
   * the user hunting for the field they had just been sent to fix.
   */
  focusedSection: string | null = null;

  private focusSection(
    section: string,
    selector: string,
    fieldId?: string,
    fieldSelector?: string
  ): void {
    this.focusedSection = section;
    setTimeout(() => {
      document
        .querySelector(selector)
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // A single field answers the email, phone and company gaps, so put the
      // caret in it. `preventScroll` leaves the smooth scroll above to do the
      // moving. The phone is reached by selector: its input belongs to a shared
      // component that takes no id of its own.
      let field: Element | null = null;
      if (fieldId) {
        field = document.getElementById(fieldId);
      } else if (fieldSelector) {
        field = document.querySelector(fieldSelector);
      }
      (field as HTMLInputElement | null)?.focus({ preventScroll: true });
    });
    setTimeout(() => {
      this.focusedSection = null;
      this.cdr.markForCheck();
    }, FOCUS_HIGHLIGHT_MS);
  }

  addEmail() {
    this.showPage = 'main';
    this.focusSection('basic', '.form-card.basic-section', 'payee-email');
  }

  addPhone() {
    this.showPage = 'main';
    this.focusSection(
      'basic',
      '.form-card.basic-section',
      undefined,
      '.form-card.basic-section app-phone-input-v4 input'
    );
  }

  addAddress() {
    this.showPage = 'main';
    this.expandedSections.add('address');
    this.focusSection('address', '.accordion-section.address-section');
  }

  addCompany() {
    this.showPage = 'main';
    this.expandedSections.add('entity');
    this.expandedSections.add('address');
    this.focusSection(
      'entity',
      '.accordion-section.entity-section',
      'payee-company'
    );
  }

  addBankDetails() {
    this.showPage = 'main';
    this.openAddBankForm();
    this.focusSection('banking', '.accordion-section.banking-section');
  }

  addInternationalBankDetails() {
    this.showPage = 'main';
    this.openAddIntlBankForm();
    setTimeout(() => {
      document
        .querySelector('.accordion-section.intl-banking-section')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  backbutton() {
    this.showPage = 'main';
  }

  addressAdded() {
    const addressFields = [
      'payeeAddress1',
      'payeeCity',
      'payeeState',
      'payeeCountry',
      'payeeZip'
    ];

    this.updateAddressCountryStateValidity();

    const hasAnyAddress = addressFields.some(
      (field) =>
        (this.payeeForm.controls[field].value || '').toString().trim() !== ''
    );

    const hasInvalidField = addressFields.some(
      (field) => this.payeeForm.get(field)?.invalid
    );

    const hasInvalidUrl = this.payeeForm.get('payeeCompanyWebsite')?.invalid;
    if (hasInvalidUrl) {
      this.isFinishedAddress = false;
      return;
    }

    if (this.isAddressRequired() || this.isAddressCountryStateRequired()) {
      addressFields.forEach((field) => {
        this.payeeForm.get(field)?.markAsTouched();
      });
    }

    if (!hasAnyAddress || hasInvalidField) {
      this.isFinishedAddress = false;
      return;
    }

    if (this.payeeForm.controls.payeeCountry.value === 'US') {
      const zip = this.payeeForm.controls.payeeZip.value;
      if (zip && (zip.match(/[A-Z]/) || zip.match(/[a-z]/))) {
        this.payeeForm.controls.payeeZip.setErrors({ invalidZip: true });
        this.payeeForm.controls.payeeZip.markAsTouched();
        return;
      }
    }

    this.isFinishedAddress = true;
    this.isAddressRequired.set(false);
    this.toggleSection('address');

    if (this.updateAddressOnly) {
      let updateAddressFields = addressFields;
      if (this.effectiveData?.page === 'addCompany') {
        updateAddressFields = [...addressFields, 'payeeCompany'];
      }

      updateAddressFields.forEach((field) => {
        const control = this.payeeForm.get(field);
        control?.setValidators([Validators.required]);
        control?.markAsTouched();
        control?.updateValueAndValidity();
      });

      const hasInvalid = updateAddressFields.some(
        (field) => this.payeeForm.get(field)?.invalid
      );
      const hasEmpty = updateAddressFields.some(
        (field) => !this.payeeForm.get(field)?.value?.trim()
      );
      if (!hasInvalid && !hasEmpty) {
        if (this.payeeForm.get('payeeCompany')?.value) {
          this.payeeForm.controls.entityType.setValue('business');
        }
        this.onUpdate();
      }
    } else {
      this.backbutton();
    }
  }

  moreInfoAdded() {
    let moreInfoFields: string[] = [];
    const payeeTypeStr = this.payeeType?.toString();

    if (payeeTypeStr === '1') {
      moreInfoFields = [
        'customerDefaultPayFromAcount',
        'customerCategory',
        'customerDefaultPayFromMethod',
        'customerFirstName',
        'customerLastName',
        'customerType',
        'payeeCompanyWebsite'
      ];
    } else if (payeeTypeStr === '2') {
      moreInfoFields = [
        'vendorDefaultPayAccount',
        'vendorCategory',
        'vendorDefaultPayMethod',
        'vendorFistName',
        'vendorLastName',
        'vendorType',
        'vendorPaymentTerms',
        'vendorTaxId',
        'vendor_1099',
        'payeeCompanyWebsite'
      ];
    } else {
      moreInfoFields = [
        'employeeFirstName',
        'employeeLastName',
        'employeeDob',
        'employeeSsn',
        'employeeType',
        'employeeHourlyRate',
        'employeePaymentSchedule',
        'employeeFillingStatus',
        'employeeDefaultPayAccount',
        'employeeCategory',
        'employeeDefaultPayMethod',
        'payeeCompanyWebsite'
      ];
    }

    const hasAnyData = moreInfoFields.some((field) => {
      const value = this.payeeForm.get(field)?.value;
      if (value === null || value === undefined) return false;
      if (typeof value === 'string') return value.trim() !== '';
      return true;
    });

    if (!hasAnyData) {
      return;
    }

    const hasErrors = moreInfoFields.some((field) => {
      const control = this.payeeForm.get(field);
      return control && control.invalid;
    });

    if (hasErrors) {
      moreInfoFields.forEach((field) => {
        this.payeeForm.get(field)?.markAsTouched();
      });
      return;
    }

    this.toggleSection('tax');
  }

  finishedIndicatorBank() {
    this.isFinishedBank = true;
  }

  removingBankIndicator() {
    this.isFinishedBank = false;
  }

  removingInternationalBankIndicator() {
    this.isFinishedInternationalBank = false;
  }

  finishedIndicatorInternationalBank(event: { accountType: 'business' | 'personal'; phone: string | null }) {
    this.isFinishedInternationalBank = true;
    if (event?.phone) {
      this.payeeForm.controls.payeePhone.setValue(event.phone, { emitEvent: false });
      this.payeePhone = event.phone;
    }
  }

  PayeeSelfMake() {
    const measuredHeight = this.formSectionsRef?.nativeElement.offsetHeight ?? null;
    if (measuredHeight !== null) {
      const maxAllowed = window.innerHeight * 0.85 - 260 - 20;
      this.manualFormHeight = Math.min(measuredHeight, maxAllowed);
    } else {
      this.manualFormHeight = null;
    }
    this.getSendLink(this.payeeType);
    this.isSendLink = true;
    const phone = this.payeeForm.get('payeePhone')?.value;
    const email = this.payeeForm.get('payeeEmail')?.value;
    if (phone) {
      this.requestPayeeForm.patchValue({ payeePhone: phone });
      this.getPhoneNumber();
    }
    if (email) {
      this.requestPayeeForm.patchValue({ payeeEmail: email });
      this.getEmail();
    }
  }

  addMySelf() {
    this.isSendLink = false;
  }

  initForm() {
    this.requestPayeeForm = this.fb.group({
      payeeType: ['1'],
      payeeEmail: [''],
      payeePhone: [''],
      emailCheck: new FormControl(false),
      phoneCheck: new FormControl(false)
    });

    this.requestPayeeForm.controls.payeePhone.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.getPhoneNumber());
  }

  setCheck(type: string) {
    if (type === 'email') {
      this.emailValidation = ValidationService.emailValidator(
        this.requestPayeeForm.controls.payeeEmail
      );
      if (
        this.requestPayeeForm.controls.emailCheck.value &&
        (this.emailValidation ||
          !this.requestPayeeForm.controls.payeeEmail.value)
      ) {
        this.requestPayeeForm.controls.emailCheck.patchValue(false);
      }
    } else {
      this.phoneValidation = ValidationService.phoneMinLength(
        this.requestPayeeForm.controls.payeePhone
      );
      if (
        this.requestPayeeForm.controls.phoneCheck.value &&
        (this.phoneValidation ||
          !this.requestPayeeForm.controls.payeePhone.value)
      ) {
        this.requestPayeeForm.controls.phoneCheck.patchValue(false);
      }
    }
  }

  getEmail() {
    this.payeeEmail = this.requestPayeeForm.controls.payeeEmail.value;
    this.emailValidation = ValidationService.emailValidator(
      this.requestPayeeForm.controls.payeeEmail
    );
    this.requestPayeeForm.controls.payeeEmail.setValidators([
      Validators.required,
      ValidationService.emailValidator
    ]);
    if (this.emailValidation) {
      this.requestPayeeForm.controls.emailCheck.patchValue(false);
    } else {
      this.requestPayeeForm.controls.emailCheck.patchValue(true);
    }
  }

  requestCountryChange(event: { length: { min: number; max: number }; code: string }) {
    this.requestCountryPhoneLength = event.length;
    this.getPhoneNumber();
  }

  getPhoneNumber() {
    this.payeePhone = this.requestPayeeForm.controls.payeePhone.value;
    const minLength = this.requestCountryPhoneLength?.min ?? 10;
    const customMinLengthValidator = ValidationService.customMinLength(minLength);
    const phoneLengthInvalid = !!customMinLengthValidator(
      this.requestPayeeForm.controls.payeePhone
    );
    this.requestPayeeForm.controls.payeePhone.setValidators([
      Validators.required,
      customMinLengthValidator
    ]);
    this.requestPayeeForm.controls.payeePhone.updateValueAndValidity({
      emitEvent: false
    });

    if (
      phoneLengthInvalid ||
      !this.requestPayeeForm.controls.payeePhone.value
    ) {
      this.requestPayeeForm.controls.phoneCheck.patchValue(false);
    } else {
      this.requestPayeeForm.controls.phoneCheck.patchValue(true);
    }
  }

  onSubmitself() {
    this.requestPayeeForm.markAsTouched();

    const emailChecked = this.requestPayeeForm.controls.emailCheck.value;
    const phoneChecked = this.requestPayeeForm.controls.phoneCheck.value;

    if (!emailChecked && !phoneChecked) {
      this.alertService.warningAlert({
        content: `Please enter either Email or Phone Number`
      });
      return;
    }
    const payeeDetails = {
      payeeType: this.payeeType.toString(),
      email: this.requestPayeeForm.controls.payeeEmail.value,
      sms: this.phoneNumberMask(
        this.requestPayeeForm.controls.payeePhone.value
      ),
      permission_email: emailChecked ? 1 : 0,
      permission_sms: phoneChecked ? 1 : 0,
      add_bank: this.addPayeeBank ? 1 : 0,
      payee_id: this.payeeId? this.payeeId:null
    };
    if (this.isBrayanCohenCustomer && this.isPermissionDenied()) return;
    this.loading = true;
    this.payeeService
      .requestPayeeDetails(payeeDetails)
      .pipe(
        finalize(() => {
          this.loading = false;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res?.success) {
          if (payeeDetails.permission_email && !payeeDetails.permission_sms) {
            this.alertService.successAlert({
              content: 'Email sent successfully.',
              close: true
            });
          } else if (
            payeeDetails.permission_sms &&
            !payeeDetails.permission_email
          ) {
            this.alertService.successAlert({
              content: 'SMS sent successfully.',
              close: true
            });
          } else {
            this.alertService.successAlert({
              content: 'Email and Sms sent successfully.',
              close: true
            });
          }
          this.closeModal();
        }
      });
  }

  phoneNumberMask(phone: string) {
    if (phone) {
      const num = String(phone).slice(-10);
      const num1 = num.substring(0, 3);
      const num2 = num.substring(3, 6);
      const num3 = num.substring(6, 10);
      return `(${num1}) ${num2}-${num3}`;
    }
    return '';
  }

  setPayeeIdNumber(payeeIdNumber: string) {
    switch (this.payeeType) {
      case 1:
      case 'customer':
        this.payeeForm.controls.customerAccountNumber.setValue(payeeIdNumber);
        this.payeeForm.controls.vendorAccountNumber.reset();
        this.payeeForm.controls.employeeAccountNumber.reset();
        break;
      case 2:
      case 'vendor':
        this.payeeForm.controls.vendorAccountNumber.setValue(payeeIdNumber);
        this.payeeForm.controls.customerAccountNumber.reset();
        this.payeeForm.controls.employeeAccountNumber.reset();
        break;
      case 3:
      case 'employee':
        this.payeeForm.controls.employeeAccountNumber.setValue(payeeIdNumber);
        this.payeeForm.controls.customerAccountNumber.reset();
        this.payeeForm.controls.vendorAccountNumber.reset();
        break;
      default:
        this.payeeForm.controls.customerAccountNumber.reset();
        this.payeeForm.controls.vendorAccountNumber.reset();
        this.payeeForm.controls.employeeAccountNumber.reset();
        break;
    }
  }

  resetToPrevForm(type: 'addressForm' | 'addMoreInfoForm') {
    if (type === 'addressForm') {
      this.payeeForm.patchValue({
        payeeAddress1: this.prevValues.addressFormData.payeeAddress1,
        payeeAddress2: this.prevValues.addressFormData.payeeAddress2,
        payeeCity: this.prevValues.addressFormData.payeeCity,
        payeeState: this.prevValues.addressFormData.payeeState,
        payeeCountry: this.prevValues.addressFormData.payeeCountry,
        payeeZip: this.prevValues.addressFormData.payeeZip
      });
      this.isFinishedAddress =
        !!this.payeeForm.get('payeeAddress1')?.value ||
        !!this.payeeForm.get('payeeAddress2')?.value ||
        !!this.payeeForm.get('payeeCity')?.value ||
        !!this.payeeForm.get('payeeState')?.value ||
        !!this.payeeForm.get('payeeCountry')?.value ||
        !!this.payeeForm.get('payeeZip')?.value;
      this.updateAddressCountryStateValidity();
    } else if (type === 'addMoreInfoForm') {
      this.payeeForm.patchValue({
        customerDefaultPayFromAcount:
          this.prevValues.moreInfoFormData.customerDefaultPayFromAcount,
        customerCategory: this.prevValues.moreInfoFormData.customerCategory,
        customerDefaultPayFromMethod:
          this.prevValues.moreInfoFormData.customerDefaultPayFromMethod,
        customerFirstName: this.prevValues.moreInfoFormData.customerFirstName,
        customerLastName: this.prevValues.moreInfoFormData.customerLastName,
        customerType: this.prevValues.moreInfoFormData.customerType,
        customerCompanyName:
          this.prevValues.moreInfoFormData.customerCompanyName
      });
      this.customerCategoryId =
        this.prevValues.moreInfoFormData.customerCategory ?? '';
    }
  }

  patchPayeeIdNumber() {
    let payeeIdNumber;
    if (this.payeeGetData.customerAccountNumber) {
      payeeIdNumber = this.payeeGetData.customerAccountNumber;
    } else if (this.payeeGetData.vendorAccountNumber) {
      payeeIdNumber = this.payeeGetData.vendorAccountNumber;
    } else {
      payeeIdNumber = this.payeeGetData.employeeAccountNumber;
    }
    this.payeeForm.controls.payeeIdNumber.setValue(payeeIdNumber);
  }

  checkPlugins(): void {
    if (this.commmonService.isBrayanCohenCustomer()) {
      this.isBrayanCohenCustomer = true;
      this.getPayeeTypePermissions();
    } else {
      this.isBrayanCohenCustomer = false;
    }
    if (
      this.dynamicWhiteLabelService.dynamicWhiteLabelFlagChecker(
        'isCompassRequirement'
      )
    ) {
      this.isCompassCustomer = true;
    } else {
      this.isCompassCustomer = false;
    }
  }

  getPayeeTypePermissions(): void {
    this.isPermissionLoading.set(true);
    this.payeeService
      .getPayeeTypePermission()
      .pipe(
        finalize(() => {
          this.isPermissionLoading.set(false);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.payeeTypePermisson = res.data;
          if (this.payeeTypePermisson.vendor) {
            this.typePermissions.push(2);
          }
          if (this.payeeTypePermisson.employee) {
            this.typePermissions.push(3);
          }
          if (this.payeeTypePermisson.customer) {
            this.typePermissions.push(1);
          }
          // Only set default payeeType if not explicitly provided via dialog data and not in edit mode
          if (!this.effectiveData?.payeeType && !this.editMode) {
            if (this.payeeTypePermisson.customer) {
              this.payeeType = 1;
            } else if (this.payeeTypePermisson.vendor) {
              this.payeeType = 2;
            } else if (this.payeeTypePermisson.employee) {
              this.payeeType = 3;
            }
          }
        }
      });
  }

  isPermissionDenied(): boolean {
    const payeeType = this.payeeTypes.find(
      (payee) => payee.value === String(this.payeeType)
    )?.type;
    if (!this.typePermissions.includes(Number(this.payeeType))) {
      if (this.isWarningAlertOpen) {
        this.alertService
          .warningAlert({
            content: `You don't have permission to update this payee with type as ${payeeType}.Please change payee type and update.`
          })
          .afterClosed()
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(() => {
            this.isWarningAlertOpen = true;
          });
        this.isWarningAlertOpen = false;
      }
      return true;
    }
    return false;
  }

  getAllowedCountries() {
    this.cloudBankService.allowedCountries
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res && Object.keys(res).length === 0) {
          this.cloudBankService
            .getAllowedCountries()
            .pipe(take(1), takeUntilDestroyed(this.destroyRef))
            .subscribe((apiRes) => {
              if (apiRes?.data) {
                this.cloudBankService.allowedCountries.next(apiRes.data);
              }
            });
          return;
        }
        this.allowedcountries = res;
        this.countries = Object.keys(this.allowedcountries);
      });
  }

  findCountryCode(countryName: string): string | undefined {
    if (
      Object.prototype.hasOwnProperty.call(this.allowedcountries, countryName)
    ) {
      return countryName;
    }
    const countryCode = Object.keys(this.allowedcountries).find(
      (code) => this.allowedcountries[code] === countryName
    );
    return countryCode || undefined;
  }

  getSendLink(payeeType: string | number) {
    const payload = {
      payee_type: String(payeeType),
      add_bank: this.addPayeeBank ? 1 : 0
    };
    this.loadingSendLink.set(true);
    this.payeeService
      .getPayeeSendLink(payload)
      .pipe(
        finalize(() => {
          this.loadingSendLink.set(false);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.resendLink.set(res.data);
        }
      });
  }

  copyLink(url?: string) {
    if (!url) return;
    this.clipBoard.copy(url);
    this.urlCopied.set(true);
    setTimeout(() => {
      this.urlCopied.set(false);
    }, 2000);
  }

  openSocialShareModal(url: string) {
    this.dialog.open(SocialShareModalComponent, {
      width: '448px',
      panelClass: 'paddingless-modal-rounded',
      data: {
        url,
        title: 'Share Payment Link'
      }
    });
  }

  updateBryanCohenForm(payeeType: string) {
    this.payeeForm.controls.payeePhone.clearValidators();
    this.payeeForm.controls.payeeEmail.clearValidators();
    this.payeeForm.controls.payeePhone.updateValueAndValidity();
    this.payeeForm.controls.payeeEmail.updateValueAndValidity();
    const bankList = {
      payeeAddress1: [Validators.required],
      payeeCity: [Validators.required],
      payeeState: [Validators.required],
      payeeCountry: [Validators.required],
      payeeZip: [Validators.required],
      employeeSsn: [Validators.required],
      vendorTaxId: [Validators.required]
    };

    Object.entries(bankList).forEach(([key, value]) => {
      const k = key as keyof typeof this.payeeForm.controls;
      this.payeeForm.controls[k].setValidators(value);
      this.payeeForm.controls[k].updateValueAndValidity();
    });

    if (payeeType === '1') {
      this.payeeForm.controls.employeeSsn.clearValidators();
      this.payeeForm.controls.vendorTaxId.clearValidators();
      this.payeeForm.controls.employeeSsn.updateValueAndValidity();
      this.payeeForm.controls.vendorTaxId.updateValueAndValidity();
    } else if (payeeType === '2') {
      this.payeeForm.controls.employeeSsn.clearValidators();
      this.payeeForm.controls.employeeSsn.updateValueAndValidity();
    } else if (payeeType === '3') {
      this.payeeForm.controls.vendorTaxId.clearValidators();
      this.payeeForm.controls.vendorTaxId.updateValueAndValidity();
    }
  }

  urlValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: string } | null => {
      if (!control.value) return null;
      const url = control.value;
      if (!url.startsWith('https://')) {
        return { invalidUrl: 'URL must start with https://' };
      }
      if (/^https:\/\/localhost/i.test(url)) {
        return { invalidUrl: 'localhost is not allowed' };
      }
      const hostPart = url.replace(/^https:\/\//i, '');
      const domainPattern =
        /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,6}/i;
      const ipPattern =
        /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
      if (!domainPattern.test(hostPart) && !ipPattern.test(hostPart)) {
        return { invalidUrl: 'Invalid domain or IP address' };
      }
      return null;
    };
  }

  checkPhoneNumber(phone: string): string {
    if (!phone || phone === 'undefined' || phone === 'null') {
      return '';
    }
    const phoneDigits = phone.replace(/[^0-9]/g, '');
    if (
      phone === '+' ||
      phone === '+1' ||
      phone === '1' ||
      phoneDigits.length === 0
    ) {
      return '';
    }
    if (phoneDigits.length === 10 && !phone.startsWith('+')) {
      return `+1${phoneDigits}`;
    }
    return phone;
  }

  shareUrlDirect(url: string, name: string) {
    if (!url) return;
    const item = this.socialShareData.find((i) => i.name === name);
    if (!item) return;
    const { productName } = this.env;
    const payorName = this.localStorageService.getItem('activeCompanyName');
    const message = `Hi! ${payorName} is ready to send your payment via ${productName}. Please use this secure link to quickly add your payment details. The link will expire in 24 hours.`;
    let shareUrl: string;
    if (name === 'WhatsApp') {
      shareUrl = item.url.replace(
        '{url}',
        encodeURIComponent(`${message} ${url}`)
      );
    } else if (name === 'Facebook') {
      shareUrl = item.url.replace('{url}', encodeURIComponent(url));
      shareUrl += `&quote=${encodeURIComponent(message)}`;
    } else if (name === 'X') {
      shareUrl = item.url.replace('{url}', encodeURIComponent(url));
      shareUrl += `&text=${encodeURIComponent(message)}`;
    } else if (name === 'LinkedIn') {
      shareUrl = item.url.replace('{url}', encodeURIComponent(url));
      shareUrl += `&summary=${encodeURIComponent(message)}`;
    } else if (name === 'Telegram') {
      shareUrl = item.url.replace(
        '{url}',
        encodeURIComponent(`${message} ${url}`)
      );
    } else {
      shareUrl = item.url.replace('{url}', encodeURIComponent(url));
    }
    window.open(shareUrl, '_blank');
  }

  toggleMoreShareCard() {
    this.toggleMoreShare.set(!this.toggleMoreShare());
  }

  trackByIndex(index: number) {
    return index;
  }

  onFormBodyScroll(): void {
    this.ngSelects?.forEach((select) => {
      if (select.isOpen) {
        select.close();
      }
    });
    this.bankComponent?.closeAllDropdowns();
  }

  openAddBankForm(): void {
    this.showBankForm = true;
    this.showIntlBankForm = false;
    if (!this.expandedSections.has('banking')) {
      this.expandedSections.add('banking');
    }
  }

  openAddIntlBankForm(): void {
    this.showIntlBankForm = true;
    this.showBankForm = false;
    this.bankActiveTab = 'international';
    if (!this.expandedSections.has('banking')) {
      this.expandedSections.add('banking');
    }
  }

  cancelBankForm(): void {
    this.showBankForm = false;
  }

  cancelIntlBankForm(): void {
    this.showIntlBankForm = false;
  }
}

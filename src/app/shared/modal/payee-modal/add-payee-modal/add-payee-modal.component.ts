import {
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
  inject,
  signal
} from '@angular/core';
import {
  UntypedFormArray,
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule,
  ValidatorFn,
  AbstractControl
} from '@angular/forms';
import { BehaviorSubject, Subscription } from 'rxjs';
import { finalize, take } from 'rxjs/operators';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialogActions
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
import { NgSelectModule } from '@ng-select/ng-select';
import { MatTooltip } from '@angular/material/tooltip';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatRadioGroup, MatRadioButton } from '@angular/material/radio';
import {
  NgOptimizedImage,
  NgClass,
  NgStyle,
  KeyValuePipe,
  LowerCasePipe
} from '@angular/common';
import { WhiteLabelDirective } from 'src/app/directive/white-label.directive';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import { WhiteLabelPipe } from 'src/app/pipes/white-label.pipe';
import { environment } from 'src/environments/environment';
import { ICategoryDropdown } from 'src/app/modules/category/model/category';
import { faLink, faShare } from '@fortawesome/pro-regular-svg-icons';
import { faCircleExclamation, faCopy, faEllipsis, faShareNodes } from '@fortawesome/pro-solid-svg-icons';
import { TruncatePipe } from 'src/app/pipes/truncate.pipe';
import { Clipboard } from '@angular/cdk/clipboard';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { AmountInputComponent } from 'src/app/shared/components/amount-input/amount-input.component';
import { AddPayeeInternationalBankComponent } from '../components/add-payee-international-bank/add-payee-international-bank.component';
import { RequestPayeeModalComponent } from '../modal/request-payee-modal/request-payee-modal.component';
import { DropDownCategoryComponent } from '../../../components/drop-downs/drop-down-category/drop-down-category.component';
import { AddBankDetailModalComponent } from '../modal/add-bank-detail-modal/add-bank-detail-modal.component';
import { NewPhoneInputComponent } from '../../../components/new-phone-input/new-phone-input.component';
import { ControlMessageComponent } from '../../../components/control-message/control-message/control-message.component';
import { AddPayeeModalPersonalDetailsCompComponent } from '../components/add-payee-modal-personal-details-comp/add-payee-modal-personal-details-comp.component';
import { CommonInputFieldComponent } from 'src/app/shared/v3/common-input-field/common-input-field.component';
import { V35ControlMessageComponent } from 'src/app/shared/v3/control-message-v35/control-message-v35.component';
import { CommonCountrySelectComponent } from 'src/app/shared/v3/common-country-select/common-country-select.component';
import { CommonStateSelectComponent } from 'src/app/shared/v3/common-state-select/common-state-select.component';
import { SocialShareModalComponent } from '../../social-share-modal/social-share-modal.component';
import { socialShareData } from '../../social-share-modal/share-url-builder.util';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';

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

/**
 * @description Modal component for adding payee.
 */
@Component({
  selector: 'app-add-payee-modal',
  templateUrl: './add-payee-modal.component.html',
  styleUrls: ['./add-payee-modal.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatDialogClose,
    NgOptimizedImage,
    NgClass,
    MatRadioGroup,
    MatRadioButton,
    AddPayeeModalPersonalDetailsCompComponent,
    FaIconComponent,
    MatTooltip,
    ControlMessageComponent,
    NewPhoneInputComponent,
    MatDialogActions,
    NgStyle,
    AddBankDetailModalComponent,
    AddPayeeInternationalBankComponent,
    NgSelectModule,
    DropDownCategoryComponent,
    NgxMaskDirective,
    KeyValuePipe,
    WhiteLabelDirective,
    WhiteLabelPipe,
    TruncatePipe,
    CommonButtonV35Component,
    CommonInputFieldComponent,
    V35ControlMessageComponent,
    CommonCountrySelectComponent,
    CommonStateSelectComponent,
    LowerCasePipe,
    AmountInputComponent
  ]
})
export class AddPayeeModalComponent implements OnInit, OnDestroy {
  data: {
    edit: boolean;
    id: string;
    type: string;
    slug?: string;
    page?:
      | 'addBankDetails'
      | 'addAddress'
      | 'addInternationalBankDetails'
      | 'addCompany'
      | 'bryanCohenPayee';
    payeeType?: string;
    entityLabel?: string;
  } = inject(MAT_DIALOG_DATA);

  private fb = inject(UntypedFormBuilder);
  private payeeService = inject(PayeeService);
  private alertService = inject(AlertService);
  private dialogRef = inject(MatDialogRef<AddPayeeModalComponent>);
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

  subscriptions: Subscription[] = [];
  bankAccounts: IBankDropdown[] = [];
  bankPage = 1;
  socialShareData = socialShareData;

  DefaultPayMethod = addPayeeData.loadDefaultPayMethod();
  customerType = addPayeeData.loadCustomerType();
  employeeType = addPayeeData.loadEmployeeType();
  employeePaymentSchedule = addPayeeData.loadEmployeePaymentShedule();
  employeeFilingStatus = addPayeeData.loadEmployeeFilingStatus();
  bankAccountType = addPayeeData.loadBankAccountType();
  vendor_1099 = addPayeeData.loadvendor_1099();
  vendorPaymentTerms = addPayeeData.loadvendorPaymentTerms();

  payeeForm: UntypedFormGroup;
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
  payeeGetData: IPayeeDetails;
  bankGetData: IPayeeBankDetails[] = [];
  editMode = false;
  dataLoaded = false;
  customerCategoryId: string;
  vendorCategoryId: string;
  employeeCategoryId: string;
  entityLabel: string = 'Payee';
  IsMainForm = true;
  IsAddressForm = true;
  IsBankForm = true;
  IsInternationalBankForm = true;
  addMoreInfoCustomer = true;
  addMoreInfoVendor = true;
  addMoreInfoEmployee = true;
  isFinishedBank = false;
  isFinishedInternationalBank = false;
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
  env = environment;
  showEntityOption = signal<boolean>(false);
  currenCountryPhoneLength = {} as { min: number; max: number };
  payeeBankDetails: IPayeeBankDetails[] | IPayeeSingleBankData[] = [];
  payeeInternationalBankDetails:
    | IInternationalBanksPayee[]
    | IInternationalWirePayeeAccounts[] = [];

  requestPayeeForm: UntypedFormGroup;
  selectedTransferType = 'ach';

  transferTypes = [
    { id: 'ach', name: 'Add Manually', fun: () => this.addMySelf() },
    { id: 'wire', name: ' Send Link', fun: () => this.PayeeSelfMake() }
  ];

  payeeTypes = [
    { value: '1', type: 'customer', name: 'Customer/AnyOne' },
    { value: '2', type: 'vendor', name: 'Vendor' },
    { value: '3', type: 'employee', name: 'Employee' }
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

  @Output() BankAccountData = new EventEmitter();
  @Output() inputDataChange = new EventEmitter();

  utils = Utils;

  // ----Send Email---- //
  emailValidation: boolean;
  phoneValidation: { [key: string]: boolean } | null;
  payeeEmail: string;
  payeePhone: string;
  // ----Send Email-Ends---- //

  isWarningAlertOpen = true;
  isBrayanCohenCustomer = false;
  payeeTypePermisson: { [key: string]: number } = {
    customer: 1,
    employee: 1,
    vendor: 1
  };

  isPermissionLoading = false;
  typePermissions: number[] = [];
  countries: string[] = [];
  allowedcountries: { [key: string]: string } = {};
  isCompassCustomer = false;
  whiteLabelName = environment.env_id === 'compass' ? 'Vendor' : 'Payee';
  faLink = faLink;
  faCopy = faCopy;
  faShare = faShare;
  faShareNod = faShareNodes
  faCircleExclamation = faCircleExclamation;
  faEllipsis = faEllipsis;
  updateAddressOnly =
    this.data?.page === 'addAddress' || this.data?.page === 'bryanCohenPayee' || this.data?.page === 'addCompany';
  toggleMoreShare = signal(false);

  ngOnInit(): void {
    this.entityLabel = this.data?.entityLabel ?? 'Payee';
    this.checkPlugins();
    this.initFormGroup();
    this.getBankAccounts();
    this.getAllowedCountries();
    this.googleAddressService.resetGoogleAutocompleteAPI();
    this.initForm();
    if (!this.data?.edit) {
      this.payeeService.setInternationalbankData(undefined);
      this.payeeService.setbankData(undefined);
      this.payeeType = this.data?.payeeType ?? 1;
      this.payeeService.updatePayeeInternationalBankList.next(undefined);
      this.getSendLink(this.payeeType);
    }

    if (this.data && this.data.edit) {
      this.payeeId = this.data.id;
      this.childData$.next({ editMode: true });
      this.editMode = true;
      if (this.data?.type === 'payeePhone') {
        this.payeeForm.controls.payeePhone.setValidators([Validators.required]);
      }

      this.loadPayeeData();
      this.loadPayeeBankData();
      this.loadPayeeInternationalBankData();
    }

    this.loadPayeeLatestBankDetails();
    this.loadPayeeLatestInternationalBankDetails();
    this.resetPhoneNumber();
    if (this.data == null) {
      this.isFinishedBank = false;      
      this.isFinishedInternationalBank = false;
    }
    if (this.data?.page) {
      if (
        this.data.page === 'addAddress' ||
        this.data?.page === 'bryanCohenPayee' ||
        this.data?.page === 'addCompany'
      ) {
        this.addAddress();
      } else if (this.data.page === 'addBankDetails') {
        this.addBankDetails();
      } else if (this.data.page === 'addInternationalBankDetails') {
        this.addInternationalBankDetails();
      }
    }
    this.onAddedPayeeInternationalBankDetails();
    if (this.env.env_id !== 'compass') {
      this.changeEntityType();
    }
    // Keep the live preview in sync when the state value changes (including the free-text fallback).
    this.subscriptions.push(
      this.payeeForm.controls.payeeState.valueChanges.subscribe(() =>
        this.loadFormValue()
      )
    );
  }

  /**
   * @description Makes payeeAddress1/payeeCity/payeeState/payeeCountry/payeeZip
   * required once any address field (including payeeAddress2) has a value.
   * payeeAddress2 itself stays optional. Skipped entirely for the compass
   * white-label flow, which uses its own inline address block.
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

  changeEntityType() {
    this.subscriptions.push(
      this.payeeForm.controls.entityType.valueChanges.subscribe((res) => {
        // List of fields to update validation
        const requiredFields = [
          'payeeCompany',
          'payeeAddress1',
          'payeeCity',
          'payeeState',
          'payeeCountry',
          'payeeZip'
        ];

        // List of address fields to check if empty
        const addressFields = [
          'payeeAddress1',
          'payeeCity',
          'payeeState',
          'payeeCountry',
          'payeeZip'
        ];

        if (res === 'business') {
          this.isBusinessIsRequired = true;
          // Add required validator to all fields
          requiredFields.forEach((field) => {
            this.payeeForm.get(field)?.addValidators(Validators.required);
            this.payeeForm.get(field)?.updateValueAndValidity();
          });

          // Check if any address field is empty
          const anyAddressFieldEmpty = addressFields.some(
            (field) => !this.payeeForm.get(field)?.value
          );

          // Set isAddressRequired to true only if any address field is empty
          this.isAddressRequired.set(anyAddressFieldEmpty);
        } else {
          this.isBusinessIsRequired = false;
          // Remove required validator from all fields
          requiredFields.forEach((field) => {
            this.payeeForm.get(field)?.removeValidators(Validators.required);
            this.payeeForm.get(field)?.updateValueAndValidity();
          });
          this.isAddressRequired.set(false);
        }
      })
    );
  }

  trackByFn(item: { id: string; name: string; fun: () => void }) {
    return item.id;
  }

  changeTransferType(item: { id: string; name: string; fun: () => void }) {
    this.selectedTransferType = item.id;
    item.fun();
  }

  /**
   * @description Method to reset phone.
   * Invokes the setter method `phoneDetailsUpdater` from cloud bank service with empty values.
   */
  resetPhoneNumber() {
    this.cloudBankService.phoneDetailsUpdater = {
      countryCode: '',
      phone: ''
    };
  }

  /**
   * @description Loads payee bank data and sets it to `this.bankGetData`.
   */
  loadPayeeBankData() {
    if (this.payeeId) {
      this.subscriptions.push(
        this.payeeService.getPayeeBankData(this.payeeId).subscribe((res) => {
          if (res?.success) this.payeeBankDetails = res.data;
          if (this.payeeBankDetails.length > 0) {
            this.isFinishedBank = true;
          } else {
            this.isFinishedBank = false;
          }
          this.setDefaultAccount();
        })
      );
    }
  }

  /**
   * Method to set Default account;
   */
  setDefaultAccount() {
    this.subscriptions.push(
      this.paymentsService.getDefaultDDAccount().subscribe((res) => {
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
      })
    );
  }

  /**
   * @description Loads the payees last updated bank account details.
   */
  loadPayeeLatestBankDetails() {
    this.payeeBankDetails.splice(0, 1);

    this.subscriptions.push(
      this.payeeService.getbankData.subscribe((data) => {
        if (data) {
          if (!this.payeeId) {
            this.payeeBankDetails.push(
              data as IPayeeSingleBankData & IPayeeBankDetails
            );
            if (this.payeeBankDetails.length > 0) {
              this.isFinishedBank = true;
            } else {
              this.isFinishedBank = false;
            }
          } else {
            this.loadPayeeBankData();
          }
          this.dataTableService.refreshV3DataTable();
        }
      })
    );
    this.payeeBankDetails = [];
  }

  onAddedPayeeInternationalBankDetails(): void {
    this.subscriptions.push(
      this.payeeService.updatePayeeInternationalBankList.subscribe((data) => {
        if (data) {          
          this.payeeInternationalBankDetails = data;
          this.isFinishedInternationalBank = true;
        }
      })
    );
  }

  /**
   * @description Loads the payee International bank account
   */
  loadPayeeInternationalBankData() {
    this.subscriptions.push(
      this.payeeService
        .internationalBanksPayee(this.payeeId)
        .subscribe((res) => {
          if (res?.success) {
            this.payeeInternationalBankDetails = res.data;
            if (this.payeeInternationalBankDetails.length > 0) {
              this.isFinishedInternationalBank = true;
            } else {
              this.isFinishedInternationalBank = false;
            }
          }
        })
    );
  }

  /**
   * @description Loads the payees last updated International bank account details.
   */
  loadPayeeLatestInternationalBankDetails() {
    this.subscriptions.push(
      this.payeeService.getInternationalbankData.subscribe((data) => {
        if (data && data?.payeeId === '') {
          const wireData = data as IInternationalWirePayeeAccounts;
          const idx = this.payeeInternationalBankDetails.findIndex((item: any) =>
            item.accountNumber === wireData.accountNumber && item.bankName === wireData.bankName
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
        if (this.payeeInternationalBankDetails.length > 0) {          
          this.isFinishedInternationalBank = true;
        } else {          
          this.isFinishedInternationalBank = false;
        }
      })
    );
    this.payeeInternationalBankDetails = [];
  }

  /**
   * @description Loads the payeeForms value
   */
  loadFormValue() {
    this.inputDataChange.emit(this.payeeForm.value);
  }

  /**
   * @description Loads payee data and sets it to `this.payeeGetData`.
   */
  loadPayeeData() {
    this.dataLoaded = true;
    this.subscriptions.push(
      this.payeeService
        .getPayeeEditData(this.payeeId)
        .pipe(
          finalize(() => {
            this.childData$.next({ dataLoaded: true });
          })
        )
        .subscribe((res) => {
          if (res?.success) {
            if (res.data.payeeAddressLine1) {
              this.isFinishedAddress = true;
            }
            this.payeeGetData = res.data;
            if (this.payeeGetData.entityType) {
              this.showEntityOption.set(false);
            } else {
              this.showEntityOption.set(true);
            }
            this.setCheckData();
            this.getSendLink(this.payeeGetData.payeeTypeId || 1);
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
            if (this.data?.page === 'bryanCohenPayee') {
              this.updateBryanCohenForm(String(this.payeeGetData.payeeTypeId));
            }
          }
        })
    );
  }

  /**
   * @description Updates payee form with data from `inputDataChange` event from child component.
   * @param event - `inputDataChange` event.
   */
  payeePersonalDetails(event: INewPayee) {
    this.payeeForm.patchValue({
      payeeName: event.payeeName,
      payeeNickName: event.payeeNickName,
      payeeEmail: event.payeeEmail,
      payeeAccountNo: event.payeeAccountNo,
      payeePhone: event.payeePhone,
      payeeCompany: event.payeeCompany,
      payeeAddress1: event.payeeAddress1,
      payeeCity: event.payeeCity,
      payeeState: event.payeeState,
      payeeZip: event.payeeZip,
      payeeIdNumber: event.payeeIdNumber
    });
    if (event.payeeEmail || event.payeePhone) {
      this.requestPayeeForm.patchValue({
        payeeEmail: event.payeeEmail,
        payeePhone: event.payeePhone
      });
      this.getPhoneNumber();
      this.getEmail();
    }
    this.setPayeeIdNumber(event.payeeIdNumber as string);
  }

  /**
   * @description Initializes payee form.
   */
  initFormGroup(): void {
    const userPlugins = this.localStorageService.getItem('userPlugins');
    const isBryancohen = userPlugins?.includes('enterprise-bryancohen');
    this.payeeForm = this.fb.group({
      payeeName: ['', [Validators.required, Validators.maxLength(this.editMode ? 191 : 100), ValidationService.whitespaceValidator, ValidationService.containsHtmlTag, ValidationService.personNameValidator]],
      payeeNickName: [
        '',
        isBryancohen
          ? []
          : [Validators.required, Validators.maxLength(30), ValidationService.whitespaceValidator, ValidationService.containsHtmlTag]
      ],
      payeeEmail: ['', ValidationService.emailValidator],
      payeePhone: ['', [
        ValidationService.customMinLength(
          this.currenCountryPhoneLength?.min ?? 10
        )
      ]],
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
      customerDefaultPayFromMethod: ['', []],
      customerFirstName: ['', []],
      customerLastName: ['', []],
      customerType: ['', []],
      customerCompanyName: ['', []],

      // Vendor
      vendorDefaultPayAccount: [null, []],
      vendorCategory: [null, []],
      vendorDefaultPayMethod: ['', []],
      vendorFistName: ['', []],
      vendorLastName: ['', []],
      vendorType: ['', []],
      vendorPaymentTerms: ['', []],
      vendorTaxId: ['', []],
      vendor_1099: ['', []],
      vendorCompanyName: ['', []],

      // Employee
      employeeFirstName: ['', []],
      employeeLastName: ['', []],
      employeeDob: ['', []],
      employeeSsn: ['', []],
      employeeType: ['', []],
      employeeHourlyRate: ['', []],
      employeePaymentSchedule: ['', []],
      employeeFillingStatus: ['', []],
      employeeOvertimeRate: ['', []],
      employeeYtdEarning: ['', []],
      employeeYtdTax: ['', []],
      employeeDefaultPayAccount: [null, []],
      employeeCategory: ['', []],
      employeeDefaultPayMethod: [''],
      permissionEmail: [0, []],
      permissionSms: [0, []]
    });
  }

  /**
   * @description Creates payee body object with data from `payeeForm` and returns it.
   * @returns payee body object.
   */
  createPayeeBody(): INewPayee {
    const data = this.payeeForm.value;
    let vendor_1099 = data?.vendor_1099;
    if (
      this.dynamicWhiteLabelService.dynamicWhiteLabelFlagChecker(
        'isCompassRequirement'
      )
    ) {
      this.payeeType = '2';
    }
    if (this.payeeType.toString() === '2') {
      if (vendor_1099 === '' || vendor_1099 === null) vendor_1099 = '2';
    }

    if (vendor_1099 !== '1' && vendor_1099 !== '2') {
      vendor_1099 = '';
    }

    const currentPhone = data.payeePhone;
    if (currentPhone && this.payeeInternationalBankDetails?.length) {
      this.payeeInternationalBankDetails = this.payeeInternationalBankDetails.map((bank) => {
        const b = bank as unknown as Record<string, unknown>;
        const beneficiary = b.beneficiary as Record<string, unknown> | undefined;
        return beneficiary
          ? { ...b, beneficiary: { ...beneficiary, phone: currentPhone } }
          : bank;
      }) as IInternationalBanksPayee[] | IInternationalWirePayeeAccounts[];
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
      vendor_1099,
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

  /**
   * @description Updates payeeForm with data from `this.payeeGetData`.
   */
  setCheckData() {
    if (this.payeeGetData.payeeTypeId === '1') this.selectedTabIndex = 0;
    else if (this.payeeGetData.payeeTypeId === '2') this.selectedTabIndex = 1;
    else if (this.payeeGetData.payeeTypeId === '3') this.selectedTabIndex = 2;
    else this.selectedTabIndex = 0;

    Object.keys(this.payeeGetData).forEach((item) => {
      // set null value to the bank drop downs
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
        entityType: this.payeeGetData.entityType,
        payeeCompanyWebsite: this.payeeGetData.payeeCompanyWebsite,

        vendorAccountNumber: this.payeeGetData.vendorAccountNumber,
        employeeAccountNumber: this.payeeGetData.employeeAccountNumber,

        customerDefaultPayFromAcount: this.payeeGetData.customerBankAccountId
          ? this.payeeGetData.customerBankAccountId
          : null,
        customerDefaultPayFromMethod:
          this.payeeGetData.customerDefaultPayMethod,
        customerFirstName: this.payeeGetData.customerFirstName,
        customerLastName: this.payeeGetData.customerLastName,
        customerType: this.payeeGetData.customerType,
        customerCompanyName: this.payeeGetData.customerCompanyName,
        customerCategory: this.payeeGetData.customerCategory,
        vendorDefaultPayAccount: this.payeeGetData.vendorBankAccountId
          ? this.payeeGetData.vendorBankAccountId
          : null,
        vendorDefaultPayMethod: this.payeeGetData.vendorDefaultPayMethod,
        vendorFistName: this.payeeGetData.vendorFirstName,
        vendorLastName: this.payeeGetData.vendorLastName,
        vendorType: this.payeeGetData.vendorType,
        vendorPaymentTerms: this.payeeGetData.vendorPaymentTerms,
        vendorTaxId: this.payeeGetData.vendorTaxId,
        vendor_1099: this.payeeGetData.vendor_1099,
        vendorCompanyName: this.payeeGetData.vendorCompanyName,
        vendorCategory: this.payeeGetData.vendorCategory,
        employeeFirstName: this.payeeGetData.employeeFirstName,
        employeeLastName: this.payeeGetData.employeeLastName,
        employeeDob: this.payeeGetData.employeeDob,
        employeeSsn: this.payeeGetData.employeeSsn,
        employeeType: this.payeeGetData.employeeType,
        employeeHourlyRate: this.payeeGetData.employeeHourlyRate,
        employeePaymentSchedule: this.payeeGetData.employeePaymentSchedule,
        employeeFillingStatus: this.payeeGetData.employeeFillingStatus,
        employeeOvertimeRate: this.payeeGetData.employeeOvertimeRate,
        employeeYtdEarning: this.payeeGetData.employeeYtdEarning,
        employeeYtdTax: this.payeeGetData.employeeYtdTax,
        employeeDefaultPayAccount: this.payeeGetData.employeeBankAccountId
          ? this.payeeGetData.employeeBankAccountId
          : null,
        employeeDefaultPayMethod: this.payeeGetData.employeeDefaultPayMethod,
        employeeCategory: this.payeeGetData.employeeCategory
      });
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

  /**
   * @description This method checks if the payeeCountry is in shortForm (US) or expanded from (United States)
   * @param country payeeCountry
   * @returns payeeCountry
   */
  checkCountryName(country: string) {
    if (country === null || country === undefined || country === '') {
      return null;
    }
    // Match the stored value (code or name, any case) case-insensitively; fall back to the raw value rather than '' so a non-matching or unloaded list never blanks the country.
    const target = String(country).toLowerCase().trim();
    const match = Object.entries(this.allowedcountries).find(
      ([code, name]) =>
        code.toLowerCase() === target || name.toLowerCase() === target
    );
    return match ? match[0] : country;
  }

  countryChange(event: { length: { min: number; max: number }; code: string }) {
    this.currenCountryPhoneLength = event.length;
    this.payeeForm.controls.payeePhone.setValidators([
      ValidationService.customMinLength(event.length?.min ?? 10)
    ]);
    this.payeeForm.controls.payeePhone.updateValueAndValidity();
  }

  /**
   * @description Loads google address for auto filling
   * @param address - payee first address input fields data
   */
  loadGoogleAddress(address: HTMLInputElement) {
    // Set US as priority by putting it first in the allowedCountries array
    this.googleAddressService.googleAutocomplete({
      addressElement: address,
      allowedCountries: this.countries,
      displayShortName: true
    });

    const googleAddressSubscription =
      this.googleAddressService.googleAddress$.subscribe((res) => {
        this.payeeForm.patchValue({
          payeeAddress1: res.address,
          payeeCity: res.city,
          payeeState: res.state,
          payeeZip: res.zip,
          payeeCountry: this.checkCountryName(res.country)
        });
        googleAddressSubscription.unsubscribe();
      });
  }

  /**
   * @description Sets payee country to either `United States` or `Canada`, based on country value passed in.
   * Sets empty for any other value.
   * @param value - payee country.
   * @returns - 'United States' or 'Canada' or ''.
   */
  selectedpayeeCountry(value: string) {
    const USA = ['united states', 'us', 'usa'];
    const ca = ['canada', 'ca'];

    const Payeecountry = value?.toLowerCase();

    if (USA.includes(Payeecountry)) {
      return 'United States';
    }
    if (ca.includes(Payeecountry)) {
      return 'Canada';
    }
    return '';
  }

  /**
   * @description Returns the form control `bankData` of `payeeForm`.
   * @returns form control - `bankData`.
   */
  get fBankData() {
    return <UntypedFormArray>this.payeeForm.controls.bankData;
  }

  /**
   * @description Method invoked when `BankAccountData` event is emitted from child component.
   * @param ev - `BankAccountData` event.
   */
  getBankData(ev: { requested: boolean }) {
    this.isRequestedBankInfo = ev.requested ? '1' : '0';
  }

  /**
   * @description Switches tabs between 'customer', 'vendor' and 'employee', when selected.
   */
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

    this.getSendLink(payeeTypeId);
  }

  /**
   * @description Method invoked when `save` or `update` is clicked in template.
   * Performs form validity check and country check.
   * Invokes `this.onAction` method to check for `editMode` and continue accordingly.
   */
  onSubmit(): void {
    const payeeFormValue = this.payeeForm.value;
    if (payeeFormValue.payeeCountry === 'United States') {
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

    const markAsBtn = this.fBankData.controls.find((e) => {
      // To Find selected one default bank acc
      if (e.value.default_dd_account === '1') return true;
      return false;
    });

    if (
      this.payeeForm.invalid &&
      this.payeeForm.controls.payeeCountry.value !== 'UK' &&
      this.payeeForm.controls.payeeCountry.value !== 'United Kingdom'
    ) {
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

  /**
   * @description If on `editMode`, invokes `this.onUpdate` method. Otherwise invokes `this.onSave` method.
   */
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
    const legalName = this.payeeForm.get('payeeName')?.value;
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

  /**
   * @description Method to create payee.
   * Submits the form data returned by `this.createPayeeBody()` to `createPayee` method of payee service.
   */
  onSave(): void {
    this.loading = true;
    this.subscriptions.push(
      this.payeeService
        .createPayee(this.createPayeeBody())
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe({
          next: (res) => {
            if (res.success === true) {
              this.paymentsService.editingPayeeId = res.data.id;
              this.payeeService.payeeTotalCountSignal.update(
                (value) => value + 1
              );
              this.dialogRef.close({
                success: true,
                payeeTypeId: this.payeeType.toString(),
                ...res.data
              });
              this.openSuccessAlert(`${this.whiteLabelName} Added.`);
              if (this.isRequestedBankInfo === '1') {
                const payeeReqData = this.createRequestPayeeData(res.data);
                this.payeeService.requestPayeeAdd(payeeReqData).subscribe();
              }
              this.gettingStartedService.updatedGettingStartedData = 4;
            }
          },
          error: (err) => {
            if (err.error.errorCode === '266') {
              this.alertService.failedAlert({
                content: err.error.errorMsg,
                isCancel: true
              }).afterClosed().subscribe(() => {
                const ctrl = this.payeeForm.controls.payeePhone;
                ctrl.setErrors({ serverError: err.error.errorMsg });
                ctrl.markAsTouched();

                ctrl.valueChanges.pipe(take(1)).subscribe(() => {
                  ctrl.setErrors(null);
                });
              });
            }
          }
        })
    );
  }

  /**
   * @description Method to update payee.
   * Submits the form data returned by `this.createPayeeBody()` to `updatePayee` method of payee service.
   */
  onUpdate(): void {
    if (this.data?.page === 'bryanCohenPayee') {
      this.payeeForm.markAllAsTouched();
      if (this.payeeForm.invalid) return;
    }
    this.loading = true;
    this.subscriptions.push(
      this.payeeService
        .updatePayee(this.payeeId, this.createPayeeBody())
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe({
          next: (res) => {
            if (res.success) {
              this.dialogRef.close({
                success: true,
                payeeTypeId: this.payeeType.toString(),
                ...res.data
              });
              this.openSuccessAlert(`${this.whiteLabelName} Updated.`);
              this.dataTableService.invalidateTableCache(DTTableId.payee);
            }
          },
          error: (error) => {
            if (error.error.errorCode === '266') {
              this.alertService.failedAlert({
                content: error.error.errorMsg,
                isCancel: true
              }).afterClosed().subscribe(() => {
                const ctrl = this.payeeForm.controls.payeePhone;
                ctrl.setErrors({ serverError: error.error.errorMsg });
                ctrl.markAsTouched();

                ctrl.valueChanges.pipe(take(1)).subscribe(() => {
                  ctrl.setErrors(null);
                });
              });
            }
          }
        })
    );
  }

  /**
   * @description Opens Modal for requesting payee bank info.
   * @param data - data containing payee contact info.
   */
  openRequestModal(data: IViewPayee) {
    const dialogRef = this.dialog.open(RequestPayeeModalComponent, {
      maxWidth: '370px',
      minWidth: '370px',
      width: '95%',
      data: {
        payeeType: data.id,
        payeeEmail: data.email,
        payeePhone: data.phone
      },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((r) => {
      if (r?.success) {
        this.isRequestedBankInfo = !this.isRequestedBankInfo;
        this.BankAccountData.emit({ requested: this.isRequestedBankInfo });
      }
    });
  }

  /**
   * @description Method to get bank accounts and set them to `this.bankAccounts[]`.
   */
  getBankAccounts() {
    this.subscriptions.push(
      this.bankService.getBankAccounts(this.bankPage).subscribe((data) => {
        if (data?.success) this.bankAccounts.push(...data.data);
      })
    );
  }

  /**
   * @description Method invoked when ng select input occurs.
   * Gets the list of bank accounts that matches the search term and sets them to `this.bankAccounts`.
   * @param e - input search string.
   */
  searchBank(e: string) {
    clearTimeout(this.searchTimeout);

    this.searchTimeout = setTimeout(() => {
      this.subscriptions.push(
        this.bankService
          .getBankAccounts(0, e)
          .pipe()
          .subscribe((res) => {
            if (res?.success) {
              this.bankAccounts = res.data;
            }
          })
      );
    }, 700);
  }

  /**
   * @description When scrolled to the end of list, loads more bank accounts.
   */
  onScrollToEndBank() {
    this.bankPage += 1;
    this.getBankAccounts();
  }

  /**
   * @description Formats the given phone number and returns it.
   * @returns formatted phone number string.
   */
  formatePhoneNum(): string {
    const data = this.payeeForm.value;
    let num = String(data.payeePhone);

    num = num.replace(/[^0-9]/g, '');

    const num1 = num.substring(0, 3);
    const num2 = num.substring(3, 6);
    const num3 = num.substring(6, 10);
    return data.payeePhone !== '' && data.payeePhone !== null
      ? `(${num1}) ${num2}-${num3}`
      : '';
  }

  /**
   * @description Method to make sure only number inputs are being given.
   * @param event - keypress event.
   * @returns - boolean.
   */
  numberOnly(event: { which: number; keyCode: number }): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }

  /**
   * @description Opens success alert dialog.
   * @param content - content to be displayed in the alert.
   * @param disable - sets boolean value of close property.
   * @param timeout - timeout value.
   * @returns success alert.
   */
  openSuccessAlert(content?: string, disable?: boolean, timeout?: number) {
    const data = {
      title: 'Success!',
      content,
      close: disable !== undefined ? disable : true,
      timeout: timeout !== undefined ? timeout : 1000
    };
    return this.alertService.successAlert(data);
  }

  /**
   * @description Opens warning alert for not selecting default bank account.
   * @returns warning alert.
   */
  openWarningAlert(content: string) {
    const data = {
      content
    };
    return this.alertService.warningAlert(data);
  }

  /**
   * @description Change the add more info filed based on payee type.
   * @param payeeType - selected payee type.
   */
  addMoreInfo(payeeType: number | string) {
    this.prevValues.moreInfoFormData = {
      customerDefaultPayFromAcount:
        this.payeeForm.get('customerDefaultPayFromAcount')?.value ??
        (this.payeeGetData?.customerBankAccountId.trim()
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
      this.showMoreInfoFieldsCustomer();
    } else if (payeeType === 2) {
      this.showMoreInfoFieldsVendor();
    } else {
      this.showMoreInfoFieldsEmployee();
    }
  }

  /**
   * @description Method to show or hide 'more info' in template.
   */
  showMoreInfoFieldsCustomer() {
    this.selectedTabIndex = 0;
    this.IsMainForm = false;
    this.addMoreInfoCustomer = false;
  }

  /**
   * @description Method to show or hide 'more info' in template.
   */
  showMoreInfoFieldsVendor() {
    this.selectedTabIndex = 1;
    this.IsMainForm = false;
    this.addMoreInfoVendor = false;
  }

  /**
   * @description Method to show or hide 'more info' in template.
   */
  showMoreInfoFieldsEmployee() {
    this.selectedTabIndex = 2;
    this.IsMainForm = false;
    this.addMoreInfoEmployee = false;
  }

  /**
   * @description Handles the category dropdown changes
   * @param selectedCategory - Selected category type.
   * @param type - 'employee' or 'customer' or 'vendor'.
   */
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

  /**
   * @description If in `editMode` opens dialog for requesting with existing data and exits.
   * Otherwise, checks whether phone and email are valid or not and
   * emits `BankAccountData` event.
   * @param payeeEmailControl - `payeeEmail` form control.
   * @param payeeEmail - payee email.
   * @param payeePhoneControl - `payeePhone` form control.
   * @param payeePhone - payee phone.
   * @param event - optional - input change event.
   */
  requestPayBtn(
    payeeEmailControl: UntypedFormControl | Params,
    payeeEmail: string,
    payeePhoneControl: UntypedFormControl | Params,
    payeePhone: string,
    event?: Event
  ) {
    const checkbox = event?.target as HTMLInputElement;
    const emailValidation = ValidationService.emailValidator(
      payeeEmailControl as UntypedFormControl
    )!;
    const phoneValidation = ValidationService.phoneMinLength(
      payeePhoneControl as UntypedFormControl
    )!;

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
    if (emailValidation.invalidEmailAddress) {
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

  /**
   * @description Opens dialog for requesting payee to add ban account info.
   */
  openRequestPayeeModal(event?: Event) {
    const { payeeEmail } = this.payeeForm.value;
    const { payeePhone } = this.payeeForm.value;
    const dialogRef = this.dialog.open(RequestPayeeModalComponent, {
      maxWidth: '370px',
      minWidth: '370px',
      width: '95%',
      data: {
        payeeType: this.payeeId,
        payeeEmail,
        payeePhone
      },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((r) => {
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
   * @description To open payeeaddress Infoform and to close the mainform
   */
  addAddress() {
    this.IsMainForm = false;
    this.IsAddressForm = false;
    this.IsBankForm = true;
    this.prevValues.addressFormData = {
      payeeCompany:
        this.payeeForm.get('payeeCompany')?.value ??
        this.payeeGetData?.payeeCompanyName ??
        null,
      payeeAddress1:
        this.payeeForm.get('payeeAddress1')?.value ??
        this.payeeGetData?.payeeAddressLine1 ??
        null,
      payeeAddress2:
        this.payeeForm.get('payeeAddressLine2')?.value ??
        this.payeeGetData?.payeeAddressLine2 ??
        null,
      payeeCity:
        this.payeeForm.get('payeeCity')?.value ??
        this.payeeGetData?.payeeCity ??
        null,
      payeeState:
        this.payeeForm.get('payeeState')?.value ??
        this.payeeGetData?.payeeState ??
        null,
      payeeCountry:
        this.payeeForm.get('payeeCountry')?.value ??
        this.payeeGetData?.payeeCountry ??
        null,
      payeeZip:
        this.payeeForm.get('payeeZip')?.value ??
        this.payeeGetData?.payeeZip ??
        null
    };
  }

  /**
   * @description To open payeebank Infoform and to close the mainform
   */
  addBankDetails() {
    this.IsMainForm = false;
    this.IsAddressForm = true;
    this.IsBankForm = false;
  }

  /**
   * @description To open internationalbank Infoform and to close the mainform
   */
  addInternationalBankDetails() {
    this.IsMainForm = false;
    this.IsAddressForm = true;
    this.IsBankForm = true;
    this.IsInternationalBankForm = false;
  }

  /**
   * @description To close and go back to mainform
   */
  backbutton() {
    this.IsMainForm = true;
    this.IsAddressForm = true;
    this.IsBankForm = true;
    this.addMoreInfoCustomer = true;
    this.addMoreInfoVendor = true;
    this.addMoreInfoEmployee = true;
    this.IsInternationalBankForm = true;
  }

  /**
   * @description To close the address form and to indicate the mainform that address form has been completed
   */
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
      (field) => this.payeeForm.controls[field].value?.trim() !== ''
    );

    const hasInvalidField = addressFields.some(
      (field) => this.payeeForm.get(field)?.invalid
    );

    const hasInvalidUrl = this.payeeForm.get('payeeCompanyWebsite')?.invalid;
    if (hasInvalidUrl) {
      this.isFinishedAddress = false;
      return;
    }

    // Mark fields as touched if address is required
    if (this.isAddressRequired() || this.isAddressCountryStateRequired()) {
      addressFields.forEach((field) => {
        this.payeeForm.get(field)?.markAsTouched();
      });
    }

    // Prevent navigation if any field is invalid or no address entered
    if (!hasAnyAddress || hasInvalidField) {
      this.isFinishedAddress = false;
      return;
    }

    this.isFinishedAddress = true;
    this.isAddressRequired.set(false);

    if (this.updateAddressOnly) {
      let updateAddressFields = addressFields;
      if(this.data?.page === 'addCompany'){
        updateAddressFields = [...addressFields, 'payeeCompany'];
      }

      updateAddressFields.forEach((field) => {
          const control = this.payeeForm.get(field);
          let fieldValidators = [Validators.required];
          if (field === 'payeeZip') {
            fieldValidators = [Validators.required, ValidationService.zipValidator];
          } else if (field === 'payeeAddress1') {
            fieldValidators = [Validators.required, ValidationService.addressValidator];
          }
          control?.setValidators(fieldValidators);
          control?.markAsTouched();
          control?.updateValueAndValidity();
        });

        const address2Control = this.payeeForm.get('payeeAddress2');
        address2Control?.setValidators([ValidationService.addressValidator]);
        address2Control?.markAsTouched();
        address2Control?.updateValueAndValidity();

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

  /**
   * @description To close the bank form and to indicate the mainform that bank form has been completed
   */
  finishedIndicatorBank() {
    this.isFinishedBank = true;
  }

  /**
   * @description To close the bank form and to indicate the mainform that bank form is empty
   */
  removingBankIndicator() {
    this.isFinishedBank = false;
  }

  /**
   * @description To close the bank form and to indicate the mainform that international bank form has been completed
   */
  removingInternationalBankIndicator() {    
    this.isFinishedInternationalBank = false;
  }

  /**
   * @description To close the internationalbank form and to indicate the mainform that international bank form has been completed
   */
  finishedIndicatorInternationalBank(payeePhone: string | null) {
    this.isFinishedInternationalBank = true;
    if (payeePhone) {
      this.payeePhone = payeePhone;
      this.payeeForm.controls.payeePhone.setValue(payeePhone, { emitEvent: false });
    }
  }

  /**
   * @description Switch to send link form to make send link option by only giving email and phone number info
   */
  PayeeSelfMake() {
    this.isSendLink = true;
  }

  /**
   * @description Switch back to add my self
   */
  addMySelf() {
    this.isSendLink = false;
  }

  //  **************Send Link*************** //

  /**
   * @description Initializeing the form of send link
   */
  initForm() {
    this.requestPayeeForm = this.fb.group({
      payeeType: ['1'],
      payeeEmail: [''],
      payeePhone: [''],
      emailCheck: new UntypedFormControl(''),
      phoneCheck: new UntypedFormControl('')
    });
  }

  /**
   * @description For checking the email and phone number
   * @param type - Email or Phone
   */
  setCheck(type: string) {
    if (type === 'email') {
      this.emailValidation = ValidationService.emailValidator(
        this.requestPayeeForm.controls.payeeEmail
      );
      if (
        this.requestPayeeForm.controls.emailCheck.value &&
        this.emailValidation
      ) {
        this.requestPayeeForm.controls.emailCheck.patchValue(false);
      }
    } else {
      this.phoneValidation = ValidationService.phoneNumberValidator(
        this.requestPayeeForm.controls.payeePhone
      );
      if (
        this.requestPayeeForm.controls.phoneCheck.value &&
        this.phoneValidation
      ) {
        this.requestPayeeForm.controls.phoneCheck.patchValue(false);
      }
    }
  }

  /**
   * @description checking and validating the email
   */
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

  /**
   * @description checking and validating the phone number
   */
  getPhoneNumber() {
    this.payeePhone = this.requestPayeeForm.controls.payeePhone.value;
    this.phoneValidation = ValidationService.phoneMinLength(
      this.requestPayeeForm.controls.payeePhone
    );
    this.requestPayeeForm.controls.payeePhone.setValidators([
      Validators.required,
      ValidationService.phoneMinLength
    ]);

    if (
      this.phoneValidation ||
      !this.requestPayeeForm.controls.payeePhone.value
    ) {
      this.requestPayeeForm.controls.phoneCheck.patchValue(false);
    } else {
      this.requestPayeeForm.controls.phoneCheck.patchValue(true);
    }
  }

  /**
   * @description Submiting the send Link
   */
  onSubmitself() {
    this.requestPayeeForm.markAsTouched();

    if (this.requestPayeeForm.controls.payeeEmail.value) {
      this.requestPayeeForm.controls.emailCheck.setValue(1);
    } else {
      this.requestPayeeForm.controls.emailCheck.setValue(0);
    }

    if (this.requestPayeeForm.controls.payeePhone.value) {
      this.requestPayeeForm.controls.phoneCheck.setValue(1);
    } else {
      this.requestPayeeForm.controls.phoneCheck.setValue(0);
    }

    if (
      !this.requestPayeeForm.controls.emailCheck.value &&
      !this.requestPayeeForm.controls.phoneCheck.value
    ) {
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
      permission_email: this.requestPayeeForm.controls.emailCheck.value,
      permission_sms: this.requestPayeeForm.controls.phoneCheck.value,
      add_bank: this.addPayeeBank ? 1 : 0,
      payee_id: this.editMode?this.payeeId:null
    };
    if (this.isBrayanCohenCustomer && this.isPermissionDenied()) return;
    this.loading = true;
    this.subscriptions.push(
      this.payeeService
        .requestPayeeDetails(payeeDetails)
        .pipe(
          finalize(() => {
            this.loading = false;
          })
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
            this.dialogRef.close();
          }
        })
    );
  }

  /**
   * @description Masking the phone number
   */
  phoneNumberMask(phone: string) {
    if (phone) {
      const num = String(phone).slice(-10);
      const num1 = num.substring(0, 3);
      const num2 = num.substring(3, 6);
      const num3 = num.substring(6, 10);
      const number = `(${num1}) ${num2}-${num3}`;
      return number;
    }
    return '';
  }

  /**
   * @description Method to set Payee ID/Acc Number according to type of payee.
   * @param payeeIdNumber - Payee ID/Acc Number - String to identify payee.
   */
  setPayeeIdNumber(payeeIdNumber: string) {
    switch (this.payeeType) {
      case 1 || 'customer':
        this.payeeForm.controls.customerAccountNumber.setValue(payeeIdNumber);
        this.payeeForm.controls.vendorAccountNumber.reset();
        this.payeeForm.controls.employeeAccountNumber.reset();
        break;
      case 2 || 'vendor':
        this.payeeForm.controls.vendorAccountNumber.setValue(payeeIdNumber);
        this.payeeForm.controls.customerAccountNumber.reset();
        this.payeeForm.controls.employeeAccountNumber.reset();
        break;
      case 3 || 'employee':
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
        payeeCompanyWebsite: this.prevValues.moreInfoFormData.payeeCompanyWebsite,
        customerCompanyName:
          this.prevValues.moreInfoFormData.customerCompanyName
      });
      this.customerCategoryId =
        this.prevValues.moreInfoFormData.customerCategory ?? '';
    }
  }

  /**
   * @description Method to update `payeeForm` with corresponding Payee ID/Acc Number.
   */
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

  /**
   * @description TrackBy and ngFor together allow Angular to detect the specific node element that needs to change or be added instead of rebuilding the whole array
   * @param index
   * @returns
   */
  trackByIndex(index: number) {
    return index;
  }

  /**
   * @description Used to check enterprise customer is bryancohen or not
   */
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

  /**
   * @description Used to retrieve and set permissions to user for creating or updating a payee based on payee type.
   */
  getPayeeTypePermissions(): void {
    this.isPermissionLoading = true;
    this.subscriptions.push(
      this.payeeService
        .getPayeeTypePermission()
        .pipe(
          finalize(() => {
            this.isPermissionLoading = false;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.payeeTypePermisson = res.data;
            if (this.payeeTypePermisson.vendor) {
              this.payeeType = 2;
              this.typePermissions.push(2);
            }
            if (this.payeeTypePermisson.employee) {
              this.payeeType = 3;
              this.typePermissions.push(3);
            }
            if (this.payeeTypePermisson.customer) {
              this.payeeType = 1;
              this.typePermissions.push(1);
            }
          }
        })
    );
  }

  /**
   * @description Checks whether the user has permission to create or update a payee with the selected payee type.
   * If permission is denied, it displays a warning alert to the user.
   * @returns {boolean}  Return true to indicate that permission is denied,otherwise permission is not denied.
   */
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
          .subscribe(() => {
            this.isWarningAlertOpen = true;
          });
        this.isWarningAlertOpen = false;
      }
      return true;
    }
    return false;
  }

  /**
   * @description Getting allowed countries data.
   */
  getAllowedCountries() {
    this.subscriptions.push(
      this.cloudBankService.allowedCountries.subscribe((res) => {
        this.allowedcountries = res;
        this.countries = Object.keys(this.allowedcountries)
      })
    );
  }

  getSendLink(payeeType: string | number) {
    const payload = {
      payee_type: String(payeeType),
      add_bank: this.addPayeeBank ? 1 : 0
    };
    this.loadingSendLink.set(true);
    this.subscriptions.push(
      this.payeeService
        .getPayeeSendLink(payload)
        .pipe(
          finalize(() => {
            this.loadingSendLink.set(false);
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.resendLink.set(res.data);
          }
        })
    );
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
        url: url,
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
    return (control: AbstractControl): {[key: string]: string} | null => {
      if (!control.value) {
        return null;
      }
  
      const url = control.value;
      
      if (!this.isHttps(url)) {
        return { invalidUrl: 'URL must start with https://' };
      }
  
      if (this.isLocalhost(url)) {
        return { invalidUrl: 'localhost is not allowed' };
      }
  
      if (!this.isValidDomainOrIp(url)) {
        return { invalidUrl: 'Invalid domain or IP address' };
      }
  
      return null;
    };
  }

  isHttps(url: string): boolean {
    return url.startsWith('https://');
  }

  isLocalhost(url: string): boolean {
    return /^https:\/\/localhost/i.test(url);
  }

  isValidDomainOrIp(url: string): boolean {
    // Remove 'https://' from the beginning of the URL
    const hostPart = url.replace(/^https:\/\//i, '');
    
    // Regular expression for domain names
    const domainPattern = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,6}/i;
    
    // Regular expression for IP addresses
    const ipPattern = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    
    return domainPattern.test(hostPart) || ipPattern.test(hostPart);
  }

  checkPhoneNumber(phone: string): string {
    if(!phone || phone === 'undefined' || phone === 'null') {
      return '';
    }
    
    const phoneDigits = phone.replace(/[^0-9]/g, '');

    if (phone === '+' || phone === '+1' || phone === '1' || phoneDigits.length === 0) {
      return '';
    }

    // Ensure proper formatting for US numbers
    if (phoneDigits.length === 10 && !phone.startsWith('+')) {
      return `+1${phoneDigits}`;
    } 

    return phone;
  }

  getIconShareClass(name: string) {
    return this.socialShareData.find(item => item.name === name)?.class;
  }

  shareUrlDirect(url: string, name: string) {
    if (!url) return;
    const item = this.socialShareData.find(item => item.name === name);
    if (!item) return;
    const productName = this.env.productName;
    const payorName = this.localStorageService.getItem('activeCompanyName');
    
    const message = `Hi! ${payorName} is ready to send your payment via ${productName}. Please use this secure link to quickly add your payment details. The link will expire in 24 hours.`;
    let shareUrl: string;

    if (name === 'WhatsApp') {
      shareUrl = item.url.replace('{url}', encodeURIComponent(`${message} ${url}`));
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
      shareUrl = item.url.replace('{url}', encodeURIComponent(`${message} ${url}`));
    } else {
      shareUrl = item.url.replace('{url}', encodeURIComponent(url));
    }
    window.open(shareUrl, '_blank');
  }

  toggleMoreShareCard() {
    this.toggleMoreShare.set(!this.toggleMoreShare());
  }

  /**
   * @description Unsubscribe all the subscribes
   */
  ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
import { V3DataTableService } from './../../../../../modules/v3-data-table/services/v3-data-table.service';
import {
  FormBuilder,
  FormGroup,
  ValidatorFn,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import {
  Component,
  OnInit,
  OnDestroy,
  EventEmitter,
  Output,
  Input,
  NgZone,
  inject,
  input
} from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialogActions
} from '@angular/material/dialog';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { Utils } from 'src/app/data/utils';
import { Subscription } from 'rxjs';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { BankAccountsService } from 'src/app/shared/service/bankAccounts/bank-accounts.service';
import { GoogleAddressService } from 'src/app/core/services/google-address.service';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import {
  ICreateDetails,
  IPayeeBankDetails,
  IPayeeBankEditData
} from 'src/app/modules/payee/payee-v2/model/payee';
import { finalize } from 'rxjs/operators';
import { MatCheckboxChange, MatCheckbox } from '@angular/material/checkbox';
import { IApiRes } from 'src/app/models/api';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { IPayeeSingleBankData } from 'src/app/modules/check-draft/model/Checkdraft';
import { MatRadioGroup, MatRadioButton } from '@angular/material/radio';
import { CommonCountryDropDownComponent } from '../../../../v3/common-country-drop-down/common-country-drop-down.component';
import { CommonCountrySelectComponent } from 'src/app/shared/v3/common-country-select/common-country-select.component';
import { CommonStateSelectComponent } from 'src/app/shared/v3/common-state-select/common-state-select.component';
import { MatTooltip } from '@angular/material/tooltip';
import { NgSelectModule } from '@ng-select/ng-select';
import { ControlMessageComponent } from '../../../../components/control-message/control-message/control-message.component';
import { NgStyle, NgClass } from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { CloudBankService } from 'src/app/shared/service/cloud-bank/cloud-bank.service';
import { WhiteLabelPipe } from 'src/app/pipes/white-label.pipe';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { NgxMaskDirective } from 'ngx-mask';
import { faXmark, faEye, faEyeSlash, faCircleInfo } from '@fortawesome/pro-solid-svg-icons';

interface IOptions {
  value: string | number;
  name: string;
}

/**
 * @description Modal component for adding payee bank account details (in add payee modal).
 */
@Component({
  selector: 'app-add-bank-detail-modal',
  templateUrl: './add-bank-detail-modal.component.html',
  styleUrls: ['./add-bank-detail-modal.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    FaIconComponent,
    MatDialogClose,
    MatCheckbox,
    NgStyle,
    ControlMessageComponent,
    NgxMaskDirective,
    NgSelectModule,
    MatTooltip,
    CommonCountryDropDownComponent,
    CommonButtonV35Component,
    MatRadioGroup,
    MatRadioButton,
    MatDialogActions,
    NgClass,
    WhiteLabelPipe,
    CommonCountrySelectComponent,
    CommonStateSelectComponent
  ]
})
export class AddBankDetailModalComponent implements OnInit, OnDestroy {
  public data: IPayeeBankEditData = inject(MAT_DIALOG_DATA);
  private bankAccService = inject(BankAccountsService);
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<AddBankDetailModalComponent>);
  private googleAddressService = inject(GoogleAddressService);
  private payeeService = inject(PayeeService);
  private alertService = inject(AlertService);
  private paymentsService = inject(PaymentsService);
  private dataTableService = inject(V3DataTableService);
  private cloudBankService = inject(CloudBankService);
  private ngZone = inject(NgZone);

  bankAccountType: IOptions[] = [
    { value: 'businessChecking', name: 'Business Checking' },
    { value: 'businessSavings', name: 'Business Savings' },
    { value: 'personalChecking', name: 'Personal Checking' },
    { value: 'personalSavings', name: 'Personal Savings' },
  ];

  faXmark = faXmark;
  faEye = faEye;
  faEyeSlash = faEyeSlash;
  faCircleInfo = faCircleInfo;
  readonly legalNameInfo =
    "The bank account holder name must be the payee's legal name. If it doesn't match, the payment will be held.";
  showAccountNumber = false;
  showConfirmAccountNumber = false;
  customPatternAccount = { 0: { pattern: new RegExp('\\d'), symbol: 'X' } };
  customPatternConfirm = { 0: { pattern: new RegExp('\\d'), symbol: 'X' } };

  payeeBankForm: FormGroup;
  /** Countries offered in the beneficiary Country dropdown (passed to `app-common-country-select` via `allowedCountries`). */
  receiverCountries: { [code: string]: string } = {
    US: 'United States',
    CA: 'Canada'
  };
  isApiLoading: boolean;
  editMode = false;
  payeeBankData: { editedData: boolean; data: string };
  confirm = false;
  subscriptions: Subscription[] = [];
  isWireChecked = false;
  wireUserDetails = false;
  wireBankDetails = false;
  beneficiaryBankDetailsAvailable = false;
  isBankAddingOrUpdating = false;
  isFromQuickPay = false;
  payeeData = true;
  isPayeeEditMode = false;
  res = '';
  indexId: number;
  checkColor: 'primary';
  public showingPayeeBankDetails: IPayeeSingleBankData;
  allowedcountries: { [key: string]: string } = {};

  @Output() back = new EventEmitter();
  @Output() addPayeeBankFinished = new EventEmitter();
  @Output() emptyPayeeBank = new EventEmitter();
  @Input() payeeBankDetails: IPayeeBankDetails[] = [];
  @Input() payeeId: string;
  @Input() entityLabel: string = 'Payee';
  @Input() payeeNameFromPayeeModal: string = '';
  payeeAddressFromPayeeModal = input<{
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  } | null>(null);

  utils = Utils;

  achList = [
    'bankName',
    'routingNumber',
    'accountNumber',
    'accountType',
    'confirmAccountNumber'
  ];

  bankUser = [
    'bankAccountFirstName',
    'bankAccountAddress1',
    'bankAccountCity',
    'bankAccountState',
    'bankAccountZip',
    'bankAccountCountry'
  ];

  bankDetails = [
    'bankingInstituteName',
    'bankingInstituteAddressLine1',
    'bankingInstituteCity',
    'bankingInstituteState',
    'bankingInstituteZip',
    'bankingInstituteCountry'
  ];

  ngOnInit(): void {
    if (this.data?.editMode) {
      this.editMode = true;
    }
    if (this.data?.isFromQuickPay) {
      this.isFromQuickPay = true;
    } else {
      this.isFromQuickPay = false;
    }
    if (this.payeeBankDetails?.length > 0) {
      this.editMode = true;
    }
    this.initFormGroup();
    this.loadAllowedCountries();
    if (!this.isFromQuickPay) {
      this.setBankData();
    } else {
      this.setBankDataForQuickPay();
    }
    this.checkWireEnabled();
    this.googleAddressService.resetGoogleAutocompleteAPI();
  }

  /** Loads the full list of allowed countries so the dropdown is not limited to US/CA. */
  loadAllowedCountries(): void {
    this.subscriptions.push(
      this.cloudBankService.allowedCountries.subscribe((res) => {
        this.allowedcountries = res;
      })
    );
  }

  /** Resolves a stored country value (ISO2 code or full name) to its ISO2 code, or returns it unchanged if no match. */
  findCountryCode(country: string): string {
    if (!country) {
      return country;
    }
    if (Object.prototype.hasOwnProperty.call(this.allowedcountries, country)) {
      return country;
    }
    const code = Object.keys(this.allowedcountries).find(
      (key) =>
        this.allowedcountries[key]?.toLowerCase() === country.toLowerCase()
    );
    return code ?? country;
  }

  /**
   * @description This function checks weather the wire option is enabled or not.
   */
  checkWireEnabled(): void {
    if (this.data?.account?.is_allow_wire || this.data?.from == 'wire') {
      this.isWireChecked = true;
    } else {
      this.isWireChecked = false;
    }
    this.lookupRoutingNumber(this.data?.account?.routing_number);
  }

  /**
   * @description Function to make bank data with wire details.
   * @param event - Checked Event
   */
  getChange(event: MatCheckboxChange): void {
    if (event.checked) {
      this.isWireChecked = true;
    } else {
      this.isWireChecked = false;
      (this.wireUserDetails = false), (this.wireBankDetails = false);
      for (const item of this.bankUser) {
        this.payeeBankForm.controls[item].clearValidators();
        this.payeeBankForm.controls[item].updateValueAndValidity();
      }
      for (const item of this.bankDetails) {
        this.payeeBankForm.controls[item].clearValidators();
        this.payeeBankForm.controls[item].updateValueAndValidity();
      }
    }
  }

  /**
   * @description Initializes payee bank form.
   */
  initFormGroup(): void {
    this.payeeBankForm = this.fb.group({
      id: [''],
      bankName: [
        this.payeeNameFromPayeeModal || '',
        [
          Validators.required,
          ValidationService.personNameValidator,
          ValidationService.legalNameMatchValidator(
            () => this.payeeNameFromPayeeModal
          )
        ]
      ],
      routingNumber: [
        '',
        [Validators.required, ValidationService.routingNumberValidator]
      ],
      routingbankName: [''],
      accountNumber: ['', [Validators.required, Validators.minLength(5)]],
      confirmAccountNumber: [
        '',
        [
          Validators.required,
          ValidationService.isMatchingValidator(
            'accountNumber',
            'Account number does not match'
          )
        ]
      ],
      accountType: [undefined, [Validators.required]],
      default_dd_account: 1,

      bankAccountFirstName: ['', [ValidationService.personNamePartValidator]],
      bankAccountLastName: ['', [ValidationService.personNamePartValidator]],
      bankAccountAddress1: [''],
      bankAccountAddress2: [''],
      bankAccountCity: [''],
      bankAccountState: [null],
      bankAccountZip: [''],
      bankAccountCountry: [''],

      bankingInstituteName: [''],
      bankingInstituteAddressLine1: [''],
      bankingInstituteAddressLine2: [''],
      bankingInstituteCity: [''],
      bankingInstituteState: [''],
      bankingInstituteZip: [''],
      bankingInstituteCountry: ['US']
    });
  }

  onAccountNumberFocus() {
    this.customPatternAccount = { 0: { pattern: new RegExp('\\d'), symbol: '' } };
  }

  onAccountNumberBlur() {
    if (!this.showAccountNumber) {
      this.customPatternAccount = { 0: { pattern: new RegExp('\\d'), symbol: 'X' } };
    }
  }

  toggleAccountNumber() {
    this.showAccountNumber = !this.showAccountNumber;
    this.customPatternAccount = {
      0: { pattern: new RegExp('\\d'), symbol: this.showAccountNumber ? '' : 'X' }
    };
  }

  onConfirmAccountNumberFocus() {
    this.customPatternConfirm = { 0: { pattern: new RegExp('\\d'), symbol: '' } };
  }

  onConfirmAccountNumberBlur() {
    if (!this.showConfirmAccountNumber) {
      this.customPatternConfirm = { 0: { pattern: new RegExp('\\d'), symbol: 'X' } };
    }
  }

  toggleConfirmAccountNumber() {
    this.showConfirmAccountNumber = !this.showConfirmAccountNumber;
    this.customPatternConfirm = {
      0: { pattern: new RegExp('\\d'), symbol: this.showConfirmAccountNumber ? '' : 'X' }
    };
  }

  /**
   * @description Updates `payeeBankForm` with data passed into dialog.
   * Invokes `this.routingNumber` and if not in edit mode.
   * @param bankdata - payees bank details.
   * @param inedx - index No
   */

  editbtn(bankdata: IPayeeSingleBankData | IPayeeBankDetails, index: number) {
    this.payeeService.bankToEdit = bankdata.id;
    this.showingPayeeBankDetails = bankdata as IPayeeSingleBankData;
    if (this.payeeId) {
      this.subscriptions.push(
        this.payeeService
          .getPayeeSingleBankData(this.payeeId, this.payeeService.bankToEdit)
          .subscribe((res) => {
            this.showingPayeeBankDetails = res.data as IPayeeSingleBankData;
            if (this.showingPayeeBankDetails?.isAllowWire) {
              this.isWireChecked = true;
            } else {
              this.isWireChecked = false;
            }
            this.indexId = index;
            if (!this.isFromQuickPay) {
              this.setBankData();
            } else {
              this.setBankDataForQuickPay();
            }

            this.editMode = false;
            this.payeeData = true;
            this.isPayeeEditMode = true;
            this.revalidateHolderName(true);
          })
      );
    } else {
      if (this.showingPayeeBankDetails?.isAllowWire) {
        this.isWireChecked = true;
      } else {
        this.isWireChecked = false;
      }
      this.indexId = index;
      if (!this.isFromQuickPay) {
        this.setBankData();
      } else {
        this.setBankDataForQuickPay();
      }
      this.editMode = false;
      this.payeeData = true;
      this.isPayeeEditMode = true;
      this.revalidateHolderName(true);
    }
  }

  revalidateHolderName(showError = false): void {
    const nameControl = this.payeeBankForm.controls.bankName;
    nameControl.updateValueAndValidity();
    if (showError) {
      nameControl.markAsTouched();
    }
  }

  /**
   * @description setting form value .
   */
  setBankData(): void {    
    const bankData = this.data;
    if (bankData?.edit) {
      this.editMode = true;
    }
    this.setFormValue(
      'id',
      bankData?.data?.id !== '' ? bankData?.data?.id : ''
    );
    this.setFormValue(
      'bankName',
      this.showingPayeeBankDetails?.bankName ?? this.payeeNameFromPayeeModal
    );
    this.setFormValue(
      'routingNumber',
      this.showingPayeeBankDetails?.routingNumber
        ? String(this.showingPayeeBankDetails?.routingNumber)
        : ''
    );
    this.setFormValue(
      'accountNumber',
      this.showingPayeeBankDetails?.accountNumber !== ''
        ? this.showingPayeeBankDetails?.accountNumber
        : ''
    );
    this.setFormValue(
      'accountType',
      this.showingPayeeBankDetails?.accountType !== '' && 
      typeof this.showingPayeeBankDetails?.accountType === 'string' &&
      !['CHECKING', 'BUSINESS', 'SAVINGS'].includes(this.showingPayeeBankDetails?.accountType) 
        ? this.showingPayeeBankDetails?.accountType : null
    );


    this.setFormValue(
      'bankAccountFirstName',
      this.showingPayeeBankDetails?.bankAccountFirstName !== ''
        ? this.showingPayeeBankDetails?.bankAccountFirstName
        : ''
    );
    this.setFormValue(
      'bankAccountLastName',
      this.showingPayeeBankDetails?.bankAccountLastName !== ''
        ? this.showingPayeeBankDetails?.bankAccountLastName
        : ''
    );
    this.setFormValue(
      'bankAccountAddress1',
      this.showingPayeeBankDetails?.bankAccountAddress1 !== ''
        ? this.showingPayeeBankDetails?.bankAccountAddress1
        : ''
    );
    this.setFormValue(
      'bankAccountAddress2',
      this.showingPayeeBankDetails?.bankAccountAddress2 !== ''
        ? this.showingPayeeBankDetails?.bankAccountAddress2
        : ''
    );
    this.setFormValue(
      'bankAccountCity',
      this.showingPayeeBankDetails?.bankAccountCity !== ''
        ? this.showingPayeeBankDetails?.bankAccountCity
        : ''
    );
    this.setFormValue(
      'bankAccountState',
      this.showingPayeeBankDetails?.bankAccountState !== ''
        ? this.showingPayeeBankDetails?.bankAccountState
        : ''
    );
    this.setFormValue(
      'bankAccountZip',
      this.showingPayeeBankDetails?.bankAccountZip !== ''
        ? this.showingPayeeBankDetails?.bankAccountZip
        : ''
    );
    this.setFormValue(
      'bankAccountCountry',
      this.showingPayeeBankDetails?.bankAccountCountry
        ? this.findCountryCode(this.showingPayeeBankDetails.bankAccountCountry)
        : ''
    );

    this.setFormValue(
      'bankingInstituteName',
      this.showingPayeeBankDetails?.bankingInstituteName !== ''
        ? this.showingPayeeBankDetails?.bankingInstituteName
        : ''
    );
    this.setFormValue(
      'bankingInstituteAddressLine1',
      this.showingPayeeBankDetails?.bankingInstituteAddressLine1 !== ''
        ? this.showingPayeeBankDetails?.bankingInstituteAddressLine1
        : ''
    );
    this.setFormValue(
      'bankingInstituteAddressLine2',
      this.showingPayeeBankDetails?.bankingInstituteAddressLine2 !== ''
        ? this.showingPayeeBankDetails?.bankingInstituteAddressLine2
        : ''
    );
    this.setFormValue(
      'bankingInstituteCity',
      this.showingPayeeBankDetails?.bankingInstituteCity !== ''
        ? this.showingPayeeBankDetails?.bankingInstituteCity
        : ''
    );
    this.setFormValue(
      'bankingInstituteState',
      this.showingPayeeBankDetails?.bankingInstituteState !== ''
        ? this.showingPayeeBankDetails?.bankingInstituteState
        : ''
    );
    this.setFormValue(
      'bankingInstituteZip',
      this.showingPayeeBankDetails?.bankingInstituteZip !== ''
        ? this.showingPayeeBankDetails?.bankingInstituteZip
        : ''
    );

    if (
      this.editMode &&
      this.payeeBankForm.controls.routingNumber.value !== null
    ) {
      this.lookupRoutingNumber(this.payeeBankForm.controls.routingNumber.value);
    }
    if (
      this.editMode &&
      this.payeeBankForm.controls.accountNumber.value !== null
    ) {
      this.payeeBankForm.controls.confirmAccountNumber.setValue(
        this.payeeBankForm.controls.accountNumber.value
      );
    }
  }

  /**
   * @description Setting data for quick pay.
   */
  setBankDataForQuickPay(): void {
    const bankData = this.data?.account;
    if (this.editMode) {      
      this.setFormValue(
        'id',
        bankData?.encrypted_id !== '' ? bankData?.encrypted_id : ''
      );
      this.setFormValue(
        'bankName',
        bankData?.bank_name !== '' ? bankData?.bank_name : ''
      );
      this.setFormValue(
        'routingNumber',
        bankData?.routing_number !== '' ? bankData?.routing_number : ''
      );
      this.setFormValue(
        'accountNumber',
        bankData?.account_number !== '' ? bankData?.account_number : ''
      );
      this.setFormValue(
        'accountType',
        bankData?.account_type !== '' && 
        typeof bankData?.account_type === 'string' &&
        !['CHECKING', 'BUSINESS', 'SAVINGS'].includes(bankData?.account_type) 
          ? bankData?.account_type : ''
      );
    }
  }

  autoFillBeneficiaryReceiver(): void {
    const address = this.payeeAddressFromPayeeModal();
    const form = this.payeeBankForm;
    form.patchValue({
      bankAccountFirstName:
        form.get('bankAccountFirstName')?.value || this.payeeNameFromPayeeModal,
      bankAccountAddress1:
        form.get('bankAccountAddress1')?.value || address?.addressLine1 || '',
      bankAccountAddress2:
        form.get('bankAccountAddress2')?.value || address?.addressLine2 || '',
      bankAccountCity:
        form.get('bankAccountCity')?.value || address?.city || '',
      bankAccountState:
        form.get('bankAccountState')?.value || address?.state || null,
      bankAccountZip: form.get('bankAccountZip')?.value || address?.zip || '',
      bankAccountCountry: this.normalizeReceiverCountry(
        form.get('bankAccountCountry')?.value || address?.country
      )
    });
  }

  /**
   * Restricts a country value to the receiver dropdown's allowed options (US/CA)
   */
  normalizeReceiverCountry(country?: string): string {
    if (!country) {
      return '';
    }
    const match = Object.keys(this.receiverCountries).find(
      (code) =>
        code.toLowerCase() === country.toLowerCase() ||
        this.receiverCountries[code].toLowerCase() === country.toLowerCase()
    );
    return match ?? '';
  }

  /**
   * @description Looks up routing number and with the fetched data, update `routingBankName` field of `payeeBankForm`.
   * @param routNo - routing number.
   */
  lookupRoutingNumber(routNo: string) {
    if (routNo?.length > 8) {
      this.subscriptions.push(
        this.bankAccService.getroutingNumber(routNo).subscribe((res) => {
          const bankDetails = res.data;
          if (res.success) {
            this.beneficiaryBankDetailsAvailable = true;
          }
          this.payeeBankForm.patchValue({
            bankingInstituteName: bankDetails.name,
            bankingInstituteAddressLine1: bankDetails.address,
            bankingInstituteCity: bankDetails.city,
            bankingInstituteState: bankDetails.state,
            bankingInstituteZip: bankDetails.zip
            // bankingInstituteCountry: bankDetails.country
          });
        })
      );
    } else if (!this.editMode) {
      this.payeeBankForm.patchValue({
        bankingInstituteName: '',
        bankingInstituteAddressLine1: '',
        bankingInstituteCity: '',
        bankingInstituteState: '',
        bankingInstituteZip: ''
        // bankingInstituteCountry: ''
      });
    }
  }

  /**
   * @description Looks up routing number and with the fetched data, update `routingBankName` field of `payeeBankForm`.
   * @param address - First address of the payee to fill the rest.
   * @param type - Type of bank.
   */
  loadGoogleAddress(
    address: HTMLInputElement,
    type: 'beneficiaryBank' | 'beneficiary'
  ) {
    this.googleAddressService.resetGoogleAutocompleteAPI();
    this.googleAddressService.googleAutocomplete({
      addressElement: address,
      displayShortName: true
    });
    const googleAddressSubscription =
      this.googleAddressService.googleAddress$.subscribe((res) => {
        this.ngZone.run(() => {
          if (type === 'beneficiary') {
            this.payeeBankForm.patchValue(
              {
                bankAccountAddress1: res.address,
                bankAccountCity: res.city,
                bankAccountState: res.state,
                bankAccountZip: res.zip,
                bankAccountCountry: res.country
              },
              { emitEvent: false }
            );
          } else {
            this.payeeBankForm.patchValue({
              bankingInstituteAddressLine1: res.address,
              bankingInstituteCity: res.city,
              bankingInstituteState: res.state,
              bankingInstituteZip: res.zip
            });
          }
          googleAddressSubscription.unsubscribe();
        });
      });
  }

  /**
   * @description Sets the value of the field with given name, in `payeeBankForm`.
   * @param name - name of the field.
   * @param value - value to be set.
   */
  setFormValue(name: string, value: string | number | null): void | undefined {
    if (name === 'bankAccountState' && !value) {
      return this.payeeBankForm.get(name)?.setValue(null);
    }
    return this.payeeBankForm.get(name)?.setValue(value);
  }

  formBody(allowUpdate?: boolean) {
    const formValues = this.payeeBankForm.value;
    const returnData = {
      id: formValues?.id,
      payeeId: this.payeeId,
      bankName: formValues?.bankName,
      routingNumber: formValues?.routingNumber,
      accountNumber: formValues?.accountNumber,
      accountType: formValues?.accountType,
      allowReccuring: allowUpdate ? 1 : 0,
      default_dd_account: 1,
      isAllowWire: this.isWireChecked ? 1 : 0,
      ...(this.isWireChecked && {
        bankAccountFirstName: formValues?.bankAccountFirstName,
        bankAccountLastName: formValues?.bankAccountLastName,
        bankAccountAddress1: formValues?.bankAccountAddress1,
        bankAccountAddress2: formValues?.bankAccountAddress2,
        bankAccountCity: formValues?.bankAccountCity,
        bankAccountState: formValues?.bankAccountState,
        bankAccountZip: formValues?.bankAccountZip,
        bankAccountCountry: formValues?.bankAccountCountry,

        bankingInstituteName: formValues?.bankingInstituteName,
        bankingInstituteAddressLine1: formValues?.bankingInstituteAddressLine1,
        bankingInstituteAddressLine2: formValues?.bankingInstituteAddressLine2,
        bankingInstituteCity: formValues?.bankingInstituteCity,
        bankingInstituteState: formValues?.bankingInstituteState,
        bankingInstituteZip: formValues?.bankingInstituteZip,
        bankingInstituteCountry: formValues?.bankingInstituteCountry
      })
    };
    return returnData;
  }

  /**
   * @description Function to update payee by checking weather it has payeeID or not.
   */
  updatePayeeBank(allowUpdate = false) {
    const sendingData = this.formBody(allowUpdate);
    this.isBankAddingOrUpdating = true;
    if (this.payeeId) {
      this.subscriptions.push(
        this.payeeService
          .updatePayeeBank(this.showingPayeeBankDetails?.id, sendingData)
          .pipe(
            finalize(() => {
              this.isBankAddingOrUpdating = false;
              this.isApiLoading = false;
            })
          )
          .subscribe({
            next:() => {
              this.payeeService.setbankData(sendingData as IPayeeSingleBankData);
              this.addPayeeBankFinished.emit();
              this.backbutton();
            },
            error: (err) => {
              if (err?.error?.errorCode === 987) {
                const data = {
                  content: `Updating the payee's bank account won't affect existing recurring payments. To update bank details for recurring payments, cancel and recreate them with the updated information.`,
                  doneMsg: 'Update',
                  cancelMsg: 'Cancel'
                };
                const response = this.alertService.confirmAlert(data);
                response.afterClosed().subscribe((result) => {
                  if (result) {
                    this.updatePayeeBank(true);
                  } else {
                    this.dialogRef.close();
                  }
                });
              }
            }
          })
      );
    } else {
      this.payeeService.setbankData(sendingData as IPayeeSingleBankData);
      this.payeeBankDetails.splice(this.indexId, 1);
      this.addPayeeBankFinished.emit();
      this.backbutton();
    }
  }
  /**
   * @description Creating payee with given details.
   */

  createBankAccount() {
    const sendingData = this.formBody();
    this.isBankAddingOrUpdating = true;

    if (this.payeeId) {
      this.subscriptions.push(
        this.payeeService.addPayeeBank(sendingData).subscribe({
          next: (res: IApiRes<ICreateDetails>) => {
            /**
             * @description updating the edited bank account id.
             */

            this.payeeService.bankToEdit = res.data.id;
            this.payeeService.setbankData(sendingData as IPayeeSingleBankData);
            this.addPayeeBankFinished.emit();
            this.backbutton();
          },
          error: (err) => {
            this.isBankAddingOrUpdating = false;
          }
        })
      );
    } else {
      this.payeeService.setbankData(sendingData as IPayeeSingleBankData);
      this.addPayeeBankFinished.emit();
      this.backbutton();
    }
  }

  /**
   * @description Submit button for submiting the form by checking weather it is wire or not and edit or not.
   */
  onSubmit(isWire: boolean) {
    this.revalidateHolderName();
    if (this.editMode === true && this.payeeData === true) {
      this.backbutton();
    }
    if (isWire) {
      if (!this.wireUserDetails) {
        for (const item of this.achList) {
          if (this.payeeBankForm.controls[item].invalid) {
            this.payeeBankForm.controls[item].markAsTouched();
            return;
          }
        }
        if (this.payeeBankForm.controls.confirmAccountNumber.invalid) {
          this.payeeBankForm.controls.confirmAccountNumber.markAsTouched();
          return;
        }
        this.wireUserDetails = true;
        this.autoFillBeneficiaryReceiver();
        for (const item of this.bankUser) {
          const validators: ValidatorFn[] = [Validators.required];
          if (item === 'bankAccountFirstName') {
            validators.push(ValidationService.personNamePartValidator);
          }
          this.payeeBankForm.controls[item].setValidators(validators);
          this.payeeBankForm.controls[item].updateValueAndValidity();
        }
        return;
      }

      if (this.wireUserDetails && !this.wireBankDetails) {
        this.payeeBankForm.markAllAsTouched();
        for (const item of this.bankUser) {
          if (this.payeeBankForm.controls[item].invalid) {
            this.payeeBankForm.controls[item].markAsTouched();
            return;
          }
        }
        this.wireBankDetails = true;
        for (const item of this.bankDetails) {
          this.payeeBankForm.controls[item].setValidators([
            Validators.required
          ]);
          this.payeeBankForm.controls[item].updateValueAndValidity();
        }
        if (!this.beneficiaryBankDetailsAvailable) {
          return;
        }
      }

      if (this.wireUserDetails && this.wireBankDetails) {
        for (const item of this.bankDetails) {
          if (this.payeeBankForm.controls[item].invalid) {
            this.payeeBankForm.controls[item].markAsTouched();
            return;
          }
        }
      }
      if (this.payeeBankForm.valid) {
        this.submitAction();
      }
    } else {
      if (this.payeeBankForm.invalid) {
        this.achList.forEach((item) => {
          if (this.payeeBankForm.controls[item].invalid) {
            this.payeeBankForm.controls[item].markAsTouched();
          }
        });
        return;
      }
      this.submitAction();
    }
  }

  /**
   * @description By looking the submit funtion it will finalise weather its a update or create.
   */
  submitAction(): void {
    if (!this.editMode && this.isPayeeEditMode) {
      this.updatePayeeBank();
    } else {
      this.createBankAccount();
    }
  }

  /**
   * @description Method invoked when confirm is clicked in template.
   * Updates `this.payeeBankData` with data from `payeeBankForm`.
   */
  confirmBtn() {
    if (this.payeeBankForm.valid) {
      if (this.editMode) {
        this.payeeBankData = {
          editedData: true,
          data: JSON.stringify(this.payeeBankForm.value)
        };
      } else {
        this.payeeBankData = {
          editedData: false,
          data: JSON.stringify(this.payeeBankForm.value)
        };
      }
      this.isApiLoading = true;
      this.dialogRef.close(this.payeeBankData);
      this.isApiLoading = false;
    }
  }

  /**
   * @description Method invoked when back button is clicked in template, to go back.
   */
  backBtn() {
    this.confirm = false;
    this.wireBankDetails = true;
    this.payeeBankForm.controls.confirmAccountNumber.setValidators([]);
    this.payeeBankForm.controls.confirmAccountNumber.setValue('');
  }

  /**
   * @description Function to go back.
   */
  goBack(): void {
    if (this.wireUserDetails && !this.wireBankDetails) {
      this.wireUserDetails = false;
      this.wireBankDetails = false;
    } else if (this.wireUserDetails && this.wireBankDetails) {
      this.wireUserDetails = true;
      this.wireBankDetails = false;
    }
  }

  /**
   * @description To switch new account.
   */
  NewBankAcc() {
    this.editMode = false;
    this.payeeData = true;
  }

  /**
   * @description Method invoked when delete icon is clicked in template.
   * Invokes `this.Ondelect(i, bankId)`, to delete payee bank account.
   * @param i - index.
   * @param bankId - bank ID.
   */
  onBankModalDelete(bankId: string, i: number) {
    const alert = this.openConfirmAlert();
    alert.afterClosed().subscribe((res) => {
      if (res) {
        this.Ondelect(bankId, i);
      }
    });
  }

  /**
   * @description Method to delete payee bank account.
   * @param index - index.
   * @param bankId - bank ID.
   * @returns
   */

  Ondelect(bankId: string, index: number) {
    if (this.payeeId && bankId) {
      this.subscriptions.push(
        this.payeeService
          .deletePayeeBank(this.payeeId, bankId)
          .pipe(
            finalize(() => {
              this.isApiLoading = false;
            })
          )
          .subscribe((res) => {
            if (res?.success) this.payeeBankDetails.splice(index, 1);
          })
      );
    } else {
      this.payeeBankDetails.splice(index, 1);
    }
  }

  /**
   * @description Opens confirmation alert dialog.
   * @param content - content for confirmation alert.
   * @returns confirmation alert.
   */
  openConfirmAlert() {
    const data = {
      content: 'Are you sure you want to delete this bank account?',
      cancelMsg: 'No, Cancel!',
      doneMsg: 'Yes, Delete!'
    };
    return this.alertService.confirmAlert(data);
  }

  /**
   * @description Method to make sure only numbers are being given as input.
   * @param event - keypress event.
   * @returns boolean.
   */
  numberOnly(event: { which: number; keyCode: number }): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }

  /**
   * @description Sets bank account types to `this.bankAccountType`.
   */
  loadBankAccountType(): void {
    this.bankAccountType = [
      { value: 'CHECKING', name: 'CHECKING' },
      { value: 'BUSINESS', name: 'BUSINESS' },
      { value: 'SAVINGS', name: 'SAVINGS' }
    ];
  }

  // payee default bank acc section //

  /**
   * @description Changes default bank account.
   * @param bankId - bank ID.
   */
  setCallDefaultBank(bankId: string) {
    const data = { bankId, payeeId: this.payeeId };
    this.isApiLoading = true;
    setTimeout(() => {
      this.subscriptions.push(
        this.payeeService
          .setDefaultDDBankAcc(data)
          .pipe(
            finalize(() => {
              this.isApiLoading = false;
            })
          )
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          .subscribe((res) => {
            if (res) {
              this.paymentsService.setDefaultDDAccount(bankId);
              this.dataTableService.refreshV3DataTable();
            }
          })
      );
    }, 500);
  }

  // payee default bank acc section ends //

  /**
   * @description Closes the dialog.
   */
  dailogClose() {
    this.dialogRef.close(false);
  }

  /**
   * @description Back button that emits the mainform.
   */
  backbutton() {
    this.back.emit();
  }

  /**
   * @description Unsubscribes all subscribes.
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    if (this.payeeBankDetails?.length === 0) {
      this.emptyPayeeBank.emit();
    }
  }
}

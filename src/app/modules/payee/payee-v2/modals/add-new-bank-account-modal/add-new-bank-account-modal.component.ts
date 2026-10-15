import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import {
  ValidatorFn,
  Validators,
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup
} from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialogActions
} from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { GoogleAddressService } from 'src/app/core/services/google-address.service';
import { Utils } from 'src/app/data/utils';
import { IPayeeViewInfo } from 'src/app/modules/payee/payee-v2/model/payee';
import { IPayeeSingleBankData } from 'src/app/modules/check-draft/model/Checkdraft';
import { BankAccountsService } from 'src/app/shared/service/bankAccounts/bank-accounts.service';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { MatTooltip } from '@angular/material/tooltip';
import { NgxMaskDirective } from 'ngx-mask';
import { NgStyle, NgClass } from '@angular/common';
import { MatCheckbox } from '@angular/material/checkbox';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { faEye, faEyeSlash, faCircleInfo } from '@fortawesome/pro-solid-svg-icons';
import { ControlMessageComponent } from '../../../../../shared/components/control-message/control-message/control-message.component';
import { CommonCountrySelectComponent } from 'src/app/shared/v3/common-country-select/common-country-select.component';
import { CommonStateSelectComponent } from 'src/app/shared/v3/common-state-select/common-state-select.component';

interface IInjectData{
  editMode: boolean;
  id: string;
  account?: { [key: string]: unknown };
  from?: string;
  isFromQuickPay: boolean;
  bankId?: string;
  legalNameEdit?: boolean;
}

interface IOptions {
  value: string | number;
  name: string;
}

@Component({
  selector: 'app-add-new-bank-account-modal',
  templateUrl: './add-new-bank-account-modal.component.html',
  styleUrls: ['./add-new-bank-account-modal.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatDialogClose,
    FaIconComponent,
    MatCheckbox,
    NgStyle,
    ControlMessageComponent,
    NgxMaskDirective,
    MatTooltip,
    MatDialogActions,
    NgClass,
    CommonCountrySelectComponent,
    CommonStateSelectComponent
  ]
})
export class AddNewBankAccountModalComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private payeeService = inject(PayeeService);
  private googleAddressService = inject(GoogleAddressService);
  private dialogRef = inject(MatDialogRef<AddNewBankAccountModalComponent>);
  private paymentsService = inject(PaymentsService);
  private bankAccService = inject(BankAccountsService);
  private alertService = inject(AlertService);
  public payeeBankDetails = inject<IInjectData>(MAT_DIALOG_DATA);

  bankAccountType: IOptions[] = [
    { value: 'businessChecking', name: 'Business Checking' },
    { value: 'businessSavings',  name: 'Business Savings' },
    { value: 'personalChecking', name: 'Personal Checking' },
    { value: 'personalSavings',  name: 'Personal Savings' },
  ];

  payeeBankForm: FormGroup;
  loading: boolean;
  editMode = false;
  payeeBankData: any;

  subscriptions: Subscription[] = [];
  faEye = faEye;
  faEyeSlash = faEyeSlash;
  faCircleInfo = faCircleInfo;
  showAccountNumber = false;
  showConfirmAccountNumber = false;
  customPatternAccount = { 0: { pattern: new RegExp('\\d'), symbol: 'X' } };
  customPatternConfirm = { 0: { pattern: new RegExp('\\d'), symbol: 'X' } };
  utils = Utils;
  wireUserDetails = false;
  wireBankDetails = false;
  isWireChecked = false;
  isFromQuickPay = false;
  beneficiaryBankDetailsAvailable = false;
  isLoading = false;
  legalNameEdit = false;
  bankLoading = false;
  readonly skeletonRows = Array.from({ length: 5 });

  readonly legalNameInfo =
    "The bank account holder name must be the payee's legal name. If it doesn't match, the payment will be held.";

  /** Countries offered in the receiver Country dropdown (passed to `app-common-country-select` via `allowedCountries`). */
  receiverCountries: { [code: string]: string } = {
    US: 'United States',
    CA: 'Canada'
  };

  payee_information: IPayeeViewInfo | undefined;
  payeeId: string;

  ngOnInit(): void {
    if (this.payeeBankDetails?.editMode) {
      this.editMode = true;
    }
    if (this.payeeBankDetails?.legalNameEdit && this.payeeBankDetails?.bankId) {
      this.legalNameEdit = true;
      this.editMode = true;
      this.paymentsService.editingPayeeId = this.payeeBankDetails.id;
      this.initFormGroup();
      this.loadBankForLegalNameEdit(
        this.payeeBankDetails.id,
        this.payeeBankDetails.bankId
      );
      return;
    }
    if (this.payeeBankDetails?.isFromQuickPay) {
      this.isFromQuickPay = true;
    } else {
      this.isFromQuickPay = false;
    }
    this.initFormGroup();
    if (!this.isFromQuickPay) {
      if (this.payeeBankDetails?.id) {
        this.paymentsService.editingPayeeId = this.payeeBankDetails?.id;
      }
      this.subscriptions.push(
        this.paymentsService
          .getPayeeDetails(this.paymentsService.editingPayeeId)
          .subscribe((res) => {
            this.payee_information = res.payee_information;
            this.setBankData();
            this.autoPopulateHolderName();
            this.revalidateHolderName(this.editMode);
          })
      );
    } else {
      this.setBankDataForQuickPay();
    }
    this.checkWireEnabled();
    this.googleAddressService.resetGoogleAutocompleteAPI();
  }

  checkWireEnabled(): void {
    if (
      this.payeeBankDetails.account?.is_allow_wire ||
      this.payeeBankDetails?.from === 'wire' ||
      this.payeeBankDetails?.from === 'domestic'
    ) {
      this.isWireChecked = true;
    } else {
      this.isWireChecked = false;
    }
    this.lookupRoutingNumber(
      this.payeeBankDetails?.account?.routing_number,
      're-enter'
    );
  }

  initFormGroup(): void {
    this.payeeBankForm = this.fb.group({
      id: [''],
      bankName: [
        '',
        [
          Validators.required,
          ValidationService.personNameValidator,
          ValidationService.legalNameMatchValidator(
            () => this.payee_information?.payee_name
          )
        ]
      ],
      routingNumber: [
        '',
        [Validators.required, ValidationService.routingNumberValidator]
      ],
      accountNumber: ['', [Validators.required]],
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
      accountType: ['', [Validators.required]],

      bankAccountFirstName: ['', [ValidationService.personNamePartValidator]],
      bankAccountLastName: ['', [ValidationService.personNamePartValidator]],
      bankAccountAddress1: [''],
      bankAccountAddress2: [''],
      bankAccountCity: [''],
      bankAccountState: [''],
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

  achList = ['bankName', 'routingNumber', 'accountNumber', 'accountType'];

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

  setBankData(): void {
    const bankData = this.payeeBankDetails?.account;    
    if (this.editMode) {
      if (this.payeeBankDetails.from === 'ach') {
        // Don't convert to uppercase when editing to preserve the original format
        this.payeeBankForm.patchValue(bankData as { [key: string]: unknown });
      } else {
        const bankData = Utils.camelToSnake(
          this.payeeBankDetails?.account as { [key: string]: unknown }
        );
        this.setFormValue('id', bankData.id != '' ? bankData.id : '');
        this.setFormValue(
          'bankName',
          bankData.bank_name != '' ? bankData.bank_name : ''
        );
        this.setFormValue(
          'routingNumber',
          bankData.routing_number != '' ? bankData.routing_number : ''
        );
        this.setFormValue(
          'accountNumber',
          bankData.account_number != '' ? bankData.account_number : ''
        );
        this.setFormValue(
          'accountType',
          bankData.account_type !== '' && 
          typeof bankData.account_type === 'string' &&
          !['CHECKING', 'BUSINESS', 'SAVINGS'].includes(bankData.account_type) 
            ? bankData.account_type : ''
        );

        this.setFormValue('bankAccountFirstName', bankData.bank_name);
        this.setFormValue(
          'bankAccountLastName',
          bankData.bank_account_last_name
        );
        this.setFormValue(
          'bankAccountAddress1',
          bankData.bank_account_address1
            ? bankData.bank_account_address1
            : this.payee_information?.payee_address_line_1
        );
        this.setFormValue(
          'bankAccountAddress2',
          bankData.bank_account_address2
            ? bankData.bank_account_address2
            : this.payee_information?.payee_address_line_2
        );
        this.setFormValue(
          'bankAccountCity',
          bankData.bank_account_city
            ? bankData.bank_account_city
            : this.payee_information?.payee_city
        );
        this.setFormValue(
          'bankAccountState',
          bankData.bank_account_state
            ? bankData.bank_account_state
            : this.payee_information?.payee_state
        );
        this.setFormValue(
          'bankAccountZip',
          bankData.bank_account_zip
            ? bankData.bank_account_zip
            : this.payee_information?.payee_zip
        );
        this.setFormValue(
          'bankAccountCountry',
          bankData.bank_account_country
            ? bankData.bank_account_country
            : this.payee_information?.payee_country
        );

        this.setFormValue(
          'bankingInstituteName',
          bankData.banking_institute_name != ''
            ? bankData.banking_institute_name
            : ''
        );

        this.setFormValue(
          'bankingInstituteAddressLine1',
          bankData.banking_institute_address_line1 != ''
            ? bankData.banking_institute_address_line1
            : ''
        );
        this.setFormValue(
          'bankingInstituteAddressLine2',
          bankData.banking_institute_address_line2 != ''
            ? bankData.banking_institute_address_line2
            : ''
        );
        this.setFormValue(
          'bankingInstituteCity',
          bankData.banking_institute_city != ''
            ? bankData.banking_institute_city
            : ''
        );
        this.setFormValue(
          'bankingInstituteState',
          bankData.banking_institute_state != ''
            ? bankData.banking_institute_state
            : ''
        );
        this.setFormValue(
          'bankingInstituteZip',
          bankData.banking_institute_zip != ''
            ? bankData.banking_institute_zip
            : ''
        );
        // this.setFormValue('bankingInstituteCountry', bankData.banking_institute_country != '' ? bankData.banking_institute_country : '');
      }
    }
  }

  loadBankForLegalNameEdit(payeeId: string, bankId: string): void {
    this.bankLoading = true;
    this.subscriptions.push(
      this.payeeService
        .getPayeeSingleBankData(payeeId, bankId)
        .pipe(
          finalize(() => {
            this.bankLoading = false;
          })
        )
        .subscribe((res) => {
          if (res?.success && res.data) {
            if (Number(res.data.verified) === 1) {
              this.alertService.successAlert({
                title: 'Already Verified',
                content:
                  'This bank account holder legal name has already been verified. No changes are needed.'
              });
              this.dialogRef.close(false);
              return;
            }
            this.populateFromSingleBank(res.data);
            this.applyLegalNameLock();
            this.revalidateHolderName(true);
          }
        })
    );
    this.subscriptions.push(
      this.paymentsService.getPayeeDetails(payeeId).subscribe((res) => {
        this.payee_information = res?.payee_information;
        this.revalidateHolderName(true);
      })
    );
  }

  revalidateHolderName(showError = false): void {
    const nameControl = this.payeeBankForm.controls.bankName;
    nameControl.updateValueAndValidity();
    if (showError) {
      nameControl.markAsTouched();
    }
  }

  populateFromSingleBank(d: IPayeeSingleBankData): void {
    this.isWireChecked = !!d.isAllowWire;
    this.payeeBankForm.patchValue({
      id: d.id,
      bankName: d.bankName,
      routingNumber: d.routingNumber,
      accountNumber: d.accountNumber,
      confirmAccountNumber: d.accountNumber,
      accountType:
        d.accountType &&
        typeof d.accountType === 'string' &&
        !['CHECKING', 'BUSINESS', 'SAVINGS'].includes(d.accountType)
          ? d.accountType
          : '',
      bankAccountFirstName: d.bankAccountFirstName,
      bankAccountLastName: d.bankAccountLastName,
      bankAccountAddress1: d.bankAccountAddress1,
      bankAccountAddress2: d.bankAccountAddress2,
      bankAccountCity: d.bankAccountCity,
      bankAccountState: d.bankAccountState,
      bankAccountZip: d.bankAccountZip,
      bankAccountCountry: d.bankAccountCountry,
      bankingInstituteName: d.bankingInstituteName,
      bankingInstituteAddressLine1: d.bankingInstituteAddressLine1,
      bankingInstituteAddressLine2: d.bankingInstituteAddressLine2,
      bankingInstituteCity: d.bankingInstituteCity,
      bankingInstituteState: d.bankingInstituteState,
      bankingInstituteZip: d.bankingInstituteZip,
      bankingInstituteCountry: d.bankingInstituteCountry
    });
  }

  applyLegalNameLock(): void {
    Object.keys(this.payeeBankForm.controls).forEach((name) => {
      if (name === 'bankName' || name === 'id') {
        return;
      }
      this.payeeBankForm.controls[name].disable({ emitEvent: false });
    });
  }

  autoPopulateHolderName(): void {
    if (this.editMode || !this.payee_information) {
      return;
    }
    if (!this.payeeBankForm.get('bankName')?.value) {
      this.setFormValue('bankName', this.payee_information.payee_name);
    }
  }

  autoFillBeneficiaryReceiver(): void {
    if (!this.payee_information) {
      return;
    }
    const info = this.payee_information;
    const form = this.payeeBankForm;
    form.patchValue({
      bankAccountFirstName:
        form.get('bankAccountFirstName')?.value || info.payee_name,
      bankAccountAddress1:
        form.get('bankAccountAddress1')?.value || info.payee_address_line_1,
      bankAccountAddress2:
        form.get('bankAccountAddress2')?.value || info.payee_address_line_2,
      bankAccountCity: form.get('bankAccountCity')?.value || info.payee_city,
      bankAccountState:
        form.get('bankAccountState')?.value || info.payee_state,
      bankAccountZip: form.get('bankAccountZip')?.value || info.payee_zip,
      bankAccountCountry: this.normalizeReceiverCountry(
        form.get('bankAccountCountry')?.value || info.payee_country
      )
    });
  }

  /**
   * Restricts a country value to the receiver dropdown's allowed options (US/CA).
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

  onFocus() {
    this.customPatternAccount = { 0: { pattern: new RegExp('\\d'), symbol: '' } };
  }

  onBlur() {
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

  setBankDataForQuickPay(): void {
    const bankData = this.payeeBankDetails?.account;
    if (this.editMode) {
      this.setFormValue(
        'id',
        bankData?.encrypted_id != '' ? bankData?.encrypted_id : ''
      );
      this.setFormValue(
        'bankName',
        bankData?.bank_name != '' ? bankData?.bank_name : ''
      );
      this.setFormValue(
        'routingNumber',
        bankData?.routing_number != '' ? bankData?.routing_number : ''
      );
      this.setFormValue(
        'accountNumber',
        bankData?.account_number != '' ? bankData?.account_number : ''
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

  setFormValue(name: string, value: any): any {
    return this.payeeBankForm.get(name)?.setValue(value);
  }

  formBody(allowUpdate?: boolean) {
    const formValues = this.legalNameEdit
      ? this.payeeBankForm.getRawValue()
      : this.payeeBankForm.value;
    const returnData = {
      id: formValues?.id,
      payeeId: this.paymentsService.editingPayeeId,
      bankName: formValues?.bankName,
      routingNumber: formValues?.routingNumber,
      accountNumber: formValues?.accountNumber,
      accountType: formValues?.accountType,
      allowReccuring: allowUpdate ? 1 : 0,
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

  updatePayeeBank(allowUpdate = false) {
    const sendingData = this.formBody(allowUpdate);
    this.isLoading = true;
    this.subscriptions.push(
      this.payeeService
        .updatePayeeBank(this.payeeBankForm.value.id, sendingData)
        .pipe(
          finalize(() => {
            this.isLoading = false;
          })
        )
        .subscribe({
          next: (res) => {
            if (res.success) {
              this.dialogRef.close({
                success: res.success,
                data: sendingData
              });
            }
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
  }

  createBankAccount() {
    const sendingData = this.formBody();
    this.isLoading = true;
    this.subscriptions.push(
      this.payeeService
        .addPayeeBank(sendingData)
        .pipe(finalize(() => (this.isLoading = false)))
        .subscribe((response) => {
          if (response.success) {
            sendingData.id = response.data.id;
            this.dialogRef.close({
              success: response.success,
              data: sendingData
            });
          }
        })
    );
  }

  onSubmit(isWire: boolean) {
    this.revalidateHolderName();
    if (this.legalNameEdit) {
      const nameControl = this.payeeBankForm.get('bankName');
      if (nameControl?.invalid) {
        nameControl.markAsTouched();
        return;
      }
      this.updatePayeeBank();
      return;
    }
    if (this.payeeBankForm) {
      const confirmAccountControl = this.payeeBankForm.get(
        'confirmAccountNumber'
      );
      if (confirmAccountControl) {
        if (
          confirmAccountControl.value !== this.payeeBankForm.value.accountNumber
        ) {
          confirmAccountControl.markAsTouched();
          return;
        }
      }
    }
    if (isWire) {
      if (!this.wireUserDetails) {
        for (const item of this.achList) {
          if (this.payeeBankForm.controls[item].invalid) {
            this.payeeBankForm.controls[item].markAsTouched();
            return;
          }
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
        this.subscriptions.push(
          this.bankAccService
            .getroutingNumber(this.payeeBankForm.controls.routingNumber.value)
            .subscribe((res) => {
              if (res.data.name !== 'Bank Name') {
                this.payeeBankForm.patchValue({
                  bankingInstituteName: res.data.name,
                  bankingInstituteAddressLine1: res.data.address,
                  bankingInstituteCity: res.data.city,
                  bankingInstituteState: res.data.state,
                  bankingInstituteZip: res.data.zip
                });
              }
            })
        );
        return;
      }

      if (this.wireUserDetails && !this.wireBankDetails) {
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
        this.payeeBankForm.markAllAsTouched();
        return;
      }
      this.submitAction();
    }
  }

  submitAction(): void {
    if (this.editMode) {
      this.updatePayeeBank();
    } else {
      this.createBankAccount();
    }
  }

  getChange(event: any): void {
    if (event?.checked) {
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

  goBack(): void {
    if (this.wireUserDetails && !this.wireBankDetails) {
      this.wireUserDetails = false;
      this.wireBankDetails = false;
    } else if (this.wireUserDetails && this.wireBankDetails) {
      this.wireUserDetails = true;
      this.wireBankDetails = false;
    }
  }

  numberOnly(event: any): any {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }

  // ******************** get bank Account details with routing number ********************* //

  lookupRoutingNumber(event: any, type?: 're-enter') {
    let routNo;
    if (type == 're-enter') {
      routNo = event;
    } else {
      routNo = event.target.value;
    }
    if (routNo?.length > 8) {
      this.bankAccService.getroutingNumber(routNo).subscribe((res) => {
        const bank_details = res.data;
        if (res.success) {
          this.beneficiaryBankDetailsAvailable = true;
        }
        this.payeeBankForm.patchValue({
          bankingInstituteName: bank_details.name,
          bankingInstituteAddressLine1: bank_details.address,
          bankingInstituteCity: bank_details.city,
          bankingInstituteState: bank_details.state,
          bankingInstituteZip: bank_details.zip
          // bankingInstituteCountry: bank_details.country
        });
      });
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
        if (type == 'beneficiary') {
          this.payeeBankForm.patchValue({
            bankAccountAddress1: res.address,
            bankAccountCity: res.city,
            bankAccountState: res.state,
            bankAccountZip: res.zip,
            bankAccountCountry: res.country
          });
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
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}

import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { Subscription } from 'rxjs';
import { GoogleAddressService } from 'src/app/core/services/google-address.service';
import { Utils } from 'src/app/data/utils';
import { IInternationalWirePayeeAccounts } from 'src/app/modules/payee/payee-v2/model/payee';
import { CloudBankService } from 'src/app/shared/service/cloud-bank/cloud-bank.service';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { IApiRes } from 'src/app/models/api';
import { ISwiftResponseData } from 'src/app/models/bank';
import { IInternationalBanksPayee } from 'src/app/modules/cloud-bank/cloud-bank-v2/model/internationalPayments';
import { CommonInputFieldComponent } from 'src/app/shared/v3/common-input-field/common-input-field.component';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { NgClass, KeyValuePipe } from '@angular/common';
import { MatRadioGroup } from '@angular/material/radio';
import { CommonButtonV35Component } from '../../../../v3/buttons/common-button-v35/common-button-v35.component';
import { ControlMessageComponent } from '../../../../components/control-message/control-message/control-message.component';
import { MatDialogClose, MatDialogActions } from '@angular/material/dialog';

interface IBeneficiaryForm {
  addressLine1: FormControl<string>;
  addressLine2: FormControl<string>;
  city: FormControl<string>;
  state: FormControl<string>;
  zip: FormControl<string>;
  country: FormControl<string>;
}

interface IInternationalBankAccForm {
  payeeId: FormControl<string>;
  id: FormControl<string>;
  accountNumber: FormControl<string>;
  identifierType: FormControl<string>;
  identifierCode: FormControl<string>;
  accountType: FormControl<string>;
  bankName: FormControl<string>;
  ifsc: FormControl<string>;
  beneficiary: FormGroup<IBeneficiaryForm>;
  beneficiaryBankDetails: FormGroup<IBeneficiaryForm>;
}
@Component({
  selector: 'app-add-payee-international-bank-account',
  templateUrl: './add-payee-international-bank-account.component.html',
  styleUrls: ['./add-payee-international-bank-account.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatDialogClose,
    ControlMessageComponent,
    CommonButtonV35Component,
    MatRadioGroup,
    MatDialogActions,
    NgClass,
    FaIconComponent,
    KeyValuePipe
  ]
})
export class AddPayeeInternationalBankAccountComponent
  implements OnInit, OnDestroy
{
  editMode: boolean;
  subscriptions: Subscription[] = [];
  countries: string[] = [];

  utils = Utils;
  internationalBankAcForm: FormGroup<IInternationalBankAccForm>;
  beneficiaryForm: FormGroup<IBeneficiaryForm>;
  beneficiaryBankForm: FormGroup<IBeneficiaryForm>;
  loading: boolean;
  newInternationalAcc = false;
  IsTableRemoved = false;
  allowedcountries: { [key: string]: string } = {};
  contryValue: string;
  bankContryValue: string;
  bankId: string;
  IsEditMode = false;
  res: IApiRes<ISwiftResponseData>;
  indexId: number;
  showingInternationalBankAccount: IInternationalWirePayeeAccounts;

  constructor(
    private payeeService: PayeeService,
    private googleAddressService: GoogleAddressService,
    private cloudAccService: CloudBankService,
    private alertService: AlertService
  ) {}

  @Output() back = new EventEmitter();
  @Output() InternationalBankSetupFinished = new EventEmitter();
  @Output() emptyInternationalBank = new EventEmitter();
  @Input() payeeId: string;
  @Input() payeeInternationalBankDetails: IInternationalBanksPayee[] = [];

  ngOnInit(): void {
    this.initFormGroup();
    this.getAllowedCountries();
    if (this.IsEditMode) {
      this.setBankData();
    }
    this.googleAddressService.resetGoogleAutocompleteAPI();
    if (this.payeeInternationalBankDetails?.length === 0) {
      this.editMode = false;
    }
  }

  /**
   * @description Initializeing Formgroup for internationalbank account.
   */
  initFormGroup(): void {
    this.beneficiaryForm = new FormGroup<IBeneficiaryForm>({
      addressLine1: new FormControl('', [Validators.required]) as FormControl,
      addressLine2: new FormControl('') as FormControl,
      city: new FormControl('', [Validators.required]) as FormControl,
      state: new FormControl('', [Validators.required]) as FormControl,
      zip: new FormControl('', [
        Validators.required,
        ValidationService.noWhitespaceValidator,
        ValidationService.zipValidatorInternational
      ]) as FormControl,
      country: new FormControl('', [Validators.required]) as FormControl
    });

    this.beneficiaryBankForm = new FormGroup<IBeneficiaryForm>({
      addressLine1: new FormControl('', [Validators.required]) as FormControl,
      addressLine2: new FormControl('') as FormControl,
      city: new FormControl('', [Validators.required]) as FormControl,
      state: new FormControl('', [Validators.required]) as FormControl,
      zip: new FormControl('', [
        Validators.required,
        ValidationService.noWhitespaceValidator,
        ValidationService.zipValidatorInternational
      ]) as FormControl,
      country: new FormControl('', [Validators.required]) as FormControl
    });

    this.internationalBankAcForm = new FormGroup<IInternationalBankAccForm>({
      payeeId: new FormControl(this.payeeId || '') as FormControl,
      id: new FormControl('') as FormControl,
      accountNumber: new FormControl('', [
        Validators.required,
        Validators.minLength(5)
      ]) as FormControl,
      identifierType: new FormControl('', [Validators.required]) as FormControl,
      identifierCode: new FormControl('', [Validators.required]) as FormControl,
      accountType: new FormControl('', [Validators.required]) as FormControl,
      bankName: new FormControl('', [Validators.required]) as FormControl,
      ifsc: new FormControl('') as FormControl,
      beneficiary: this.beneficiaryForm,
      beneficiaryBankDetails: this.beneficiaryBankForm
    });

    this.beneficiaryForm.controls.country.valueChanges.subscribe((res) => {
      this.contryValue = res;

      if (
        res === 'IN' ||
        this.beneficiaryBankForm.controls.country.value === 'IN'
      ) {
        this.internationalBankAcForm.controls.ifsc.setValidators([
          Validators.required
        ]);
      } else {
        this.internationalBankAcForm.controls.ifsc.clearValidators();
      }
      this.internationalBankAcForm.controls.ifsc.updateValueAndValidity();
    });

    this.beneficiaryBankForm.controls.country.valueChanges.subscribe((res) => {
      this.bankContryValue = res;
      try {
        this.beneficiaryBankForm.patchValue({ country: JSON.parse(res).value });
      } catch (error) {
        if (this.beneficiaryBankForm.controls.country.value !== res) {
          this.beneficiaryBankForm.patchValue({ country: res });
        }
      }
      if (
        res === 'IN' ||
        this.beneficiaryForm.controls.country.value === 'IN'
      ) {
        this.internationalBankAcForm.controls.ifsc.setValidators([
          Validators.required
        ]);
      } else {
        this.internationalBankAcForm.controls.ifsc.clearValidators();
      }
      this.internationalBankAcForm.controls.ifsc.updateValueAndValidity();
    });
  }

  /**
   * @description Getting internationalbank data and patchValue to form.
   */
  setBankData(): void {
    this.subscriptions.push(
      this.payeeService
        .getInternationalBank(this.payeeId, this.bankId)
        .subscribe((res) => {
          if (res?.success) {
            this.internationalBankAcForm.patchValue({
              ...res.data,
              identifierType: res.data.bankIdentifierType,
              identifierCode: res.data.bankIdentifierCode
            });
          }
        })
    );
  }

  /**
   * @description Method to set `this.internationalBankAcForm` values, for editing.
   */
  setInternationalBankValue() {
    this.internationalBankAcForm.setValue({
      payeeId: this.payeeId || '',
      id: this.showingInternationalBankAccount.id,
      accountNumber: this.showingInternationalBankAccount.accountNumber,
      identifierType:
        this.showingInternationalBankAccount.identifierType ||
        this.showingInternationalBankAccount.bankIdentifierType,
      identifierCode:
        this.showingInternationalBankAccount.identifierCode ||
        this.showingInternationalBankAccount.bankIdentifierCode,
      accountType: this.showingInternationalBankAccount.accountType,
      bankName: this.showingInternationalBankAccount.bankName,
      ifsc: this.showingInternationalBankAccount.ifsc,
      beneficiary: this.showingInternationalBankAccount.beneficiary,
      beneficiaryBankDetails:
        this.showingInternationalBankAccount.beneficiaryBankDetails
    });
  }

  /**
   * @description Updateing internationalbank account.
   */
  updateInternationalPaymentBankAccount() {
    const beneficiary = { ...this.internationalBankAcForm.value.beneficiary };
    const beneficiaryBankDetails = {
      ...this.internationalBankAcForm.value.beneficiaryBankDetails
    };
    const sendingData = {
      ...this.internationalBankAcForm.value,
      beneficiary,
      beneficiaryBankDetails
    };
    if (
      sendingData.beneficiaryBankDetails.country !==
      sendingData.beneficiaryBankDetails.country?.toUpperCase()
    ) {
      sendingData.beneficiaryBankDetails.country = Object.keys(
        this.allowedcountries
      ).find(
        (key) =>
          this.allowedcountries[key] ===
          sendingData.beneficiaryBankDetails.country
      );
    }
    if (this.bankId) {
      this.subscriptions.push(
        this.payeeService
          .updatePayeeInternationalBankAccount(
            this.bankId,
            sendingData as IInternationalWirePayeeAccounts
          )
          .subscribe(() => {
            this.payeeService.setInternationalbankData(
              sendingData as IInternationalWirePayeeAccounts
            );
            this.InternationalBankSetupFinished.emit();
            this.backbutton();
          })
      );
    } else {
      this.payeeService.setInternationalbankData(
        sendingData as IInternationalWirePayeeAccounts
      );
      if (this.editMode) {
        this.payeeInternationalBankDetails.splice(this.indexId, 1);
      }
      this.InternationalBankSetupFinished.emit();
      this.backbutton();
    }
  }

  loadPayeeInternationalBankData() {
    this.payeeService.internationalBanksPayee(this.payeeId).subscribe((res) => {
      if (res?.success) {
        this.payeeService.updatePayeeInternationalBankList.next(res.data);
      }
    });
  }

  /**
   * @description create internationalbank account.
   */
  createInternationalPaymentBankAccount() {
    const beneficiary = { ...this.internationalBankAcForm.value.beneficiary };
    const beneficiaryBankDetails = {
      ...this.internationalBankAcForm.value.beneficiaryBankDetails
    };
    const sendingData = {
      ...this.internationalBankAcForm.value,
      beneficiary,
      beneficiaryBankDetails
    };

    if (
      sendingData.beneficiaryBankDetails.country !==
      sendingData.beneficiaryBankDetails.country?.toUpperCase()
    ) {
      sendingData.beneficiaryBankDetails.country = Object.keys(
        this.allowedcountries
      ).find(
        (key) =>
          this.allowedcountries[key] ===
          sendingData.beneficiaryBankDetails.country
      );
    }
    if (this.payeeId) {
      this.subscriptions.push(
        this.payeeService
          .addPayeeInternationalBankAccount(
            sendingData as IInternationalWirePayeeAccounts
          )
          .subscribe(() => {
            this.payeeService.setInternationalbankData(
              sendingData as IInternationalWirePayeeAccounts
            );
            this.loadPayeeInternationalBankData();
            this.InternationalBankSetupFinished.emit();
            this.backbutton();
          })
      );
    } else {
      this.payeeService.setInternationalbankData(
        sendingData as IInternationalWirePayeeAccounts
      );
      this.InternationalBankSetupFinished.emit();
      this.backbutton();
    }
  }

  /**
   * @description Submit function for finishing all work.
   */
  onSubmit() {
    if (this.internationalBankAcForm.invalid) {
      this.internationalBankAcForm.markAllAsTouched();
      return;
    }
    this.loading = true;

    if (
      (this.editMode || this.IsEditMode) &&
      this.payeeInternationalBankDetails.length !== 0
    ) {
      this.updateInternationalPaymentBankAccount();
    } else {
      this.createInternationalPaymentBankAccount();
    }
  }

  /**
   * @description Load google address and autofill the inputs.
   * @param address - The data in the first input address.
   * @param addressInstance - auto fill instance by using number.
   */
  loadGoogleAddress(
    commonInputElement: CommonInputFieldComponent | HTMLInputElement,
    addressInstance: number
  ) {
    const address = commonInputElement as unknown as HTMLInputElement;
    this.googleAddressService.googleAutocomplete({
      addressElement: address,
      allowedCountries: this.countries,
      displayShortName: true,
      addressInstance
    });

    const googleAddressSubscription =
      this.googleAddressService.googleAddress$.subscribe((res) => {
        if (addressInstance === 0) {
          this.beneficiaryForm.controls.addressLine1.patchValue(
            res.address as string
          );
          this.beneficiaryForm.controls.city.patchValue(res.city);
          this.beneficiaryForm.controls.state.patchValue(res.state);
          this.beneficiaryForm.controls.zip.patchValue(res.zip);
          this.beneficiaryForm.controls.country.patchValue(res.country);
        }
        if (addressInstance === 1) {
          this.beneficiaryBankForm.controls.addressLine1.patchValue(
            res.address as string
          );
          this.beneficiaryBankForm.controls.city.patchValue(res.city);
          this.beneficiaryBankForm.controls.state.patchValue(res.state);
          this.beneficiaryBankForm.controls.zip.patchValue(res.zip);
          this.beneficiaryBankForm.controls.country.patchValue(res.country);
        }
        googleAddressSubscription.unsubscribe();
      });
  }

  /**
   * @description Getting allowed countries data.
   */
  getAllowedCountries() {
    this.subscriptions.push(
      this.cloudAccService.allowedCountries.subscribe((res) => {
        this.allowedcountries = res;
        this.countries = Object.keys(this.allowedcountries);
      })
    );
  }

  /**
   * @description To patch bank details using Swift code.
   * @param event - event value coming from the input
   */
  bankIdentifierCode(event: string) {
    if (event !== '') {
      this.payeeService
        .getPayeeIdentifierCodeDetails(event, 'swift')
        .subscribe((res) => {
          if (res.data && res.data.bankName) {
            this.beneficiaryBankForm.patchValue({
              addressLine1: res.data.address.line1,
              addressLine2: res.data.address.line2,
              city: res.data.address.city,
              state: res.data.address.state,
              country: res.data.address.country
            });
            this.internationalBankAcForm.patchValue({
              bankName: res.data.bankName,
              identifierType: res.data.type
            });
          } else {
            if (!this.showingInternationalBankAccount) return;
            const identifierType =
              this.showingInternationalBankAccount.identifierType ||
              this.showingInternationalBankAccount.bankIdentifierType;
            this.beneficiaryBankForm.setValue({
              ...this.showingInternationalBankAccount.beneficiaryBankDetails
            });
            this.internationalBankAcForm.patchValue({
              bankName: this.showingInternationalBankAccount.bankName,
              identifierType
            });
          }
        });
    }
  }

  /**
   * @description Method to add `active` class to the selected HTML element.
   * @param accountType - HTML element.
   */
  selectAccType(accountType: HTMLElement) {
    accountType.classList.add('active');
  }

  /**
   * @description Method to add `active` class to the selected HTML element.
   * @param type - HTML element.
   */
  selectIdentifierType(type: HTMLElement) {
    type.classList.add('active');
  }

  /**
   * @description Method to add `active` class to the selected HTML element.
   * @param type - HTML element.
   */
  selectBenfCountry(type: HTMLElement) {
    type.classList.add('active');
  }

  /**
   * @description Method to add `active` class to the selected HTML element.
   * @param type - HTML element.
   */
  selectBenfBankCountry(type: HTMLElement) {
    type.classList.add('active');
  }

  /**
   * @description function to emit the back.emit().
   */
  backbutton() {
    this.back.emit();
  }

  /**
   * @description function to open add modal in edit.
   */
  NewBankAcc() {
    this.newInternationalAcc = true;
    this.IsTableRemoved = true;
    this.editMode = false;
  }

  /**
   * @description function to edit bank account.
   * @param Bank - bank details
   * @param index - Index No
   */
  editbtn(
    Bank: IInternationalWirePayeeAccounts | IInternationalBanksPayee,
    index: number
  ) {
    this.bankId = Bank?.id;
    this.indexId = index;

    if (this.payeeId) {
      this.subscriptions.push(
        this.payeeService
          .getInternationalBank(this.payeeId, this.bankId)
          .subscribe((res) => {
            if (res?.success) {
              this.showingInternationalBankAccount = res.data;
              this.setInternationalBankValue();
            }
          })
      );
    } else {
      this.showingInternationalBankAccount =
        Bank as IInternationalWirePayeeAccounts;
      this.setInternationalBankValue();
    }
    this.editMode = true;
    this.IsEditMode = true;
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
   * @description Method to delete payee international bank account.
   * @param index - index.
   * @param bankId - bank ID.
   * @returns
   */

  Ondelect(bankId: string, index: number) {
    if (bankId) {
      this.subscriptions.push(
        this.payeeService.DeletePayeeIPBank(bankId).subscribe((res) => {
          if (res?.success) this.payeeInternationalBankDetails.splice(index, 1);
        })
      );
    } else {
      this.payeeInternationalBankDetails.splice(index, 1);
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
   * @description TrackBy and ngFor together allow Angular to detect the specific node element that needs to change or be added instead of rebuilding the whole array
   * @param index
   * @returns
   */
  trackByIndex(index: number) {
    return index;
  }

  /**
   * @description Unsubscribe all the subscribe.
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });

    if (this.payeeInternationalBankDetails?.length === 0) {
      this.emptyInternationalBank.emit();
    }
  }
}

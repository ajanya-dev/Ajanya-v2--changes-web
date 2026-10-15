import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import {
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
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
import { IApiRes } from 'src/app/models/api';
import { CloudBankService } from 'src/app/shared/service/cloud-bank/cloud-bank.service';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { NgIf, NgFor, NgClass, KeyValuePipe } from '@angular/common';
import { ControlMessageComponent } from '../../../../../shared/components/control-message/control-message/control-message.component';

@Component({
  selector: 'app-new-international-account',
  templateUrl: './new-international-account.component.html',
  styleUrls: ['./new-international-account.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatDialogClose,
    ControlMessageComponent,
    NgIf,
    NgFor,
    MatDialogActions,
    NgClass,
    KeyValuePipe
  ]
})
export class NewInternationalAccountComponent implements OnInit, OnDestroy {
  editMode: boolean;
  subscriptions: Subscription[] = [];
  countries: string[] = [];

  utils = Utils;
  internationalBankAcForm: UntypedFormGroup;
  beneficiaryForm: UntypedFormGroup;
  beneficiaryBankForm: UntypedFormGroup;

  loading: boolean;
  allowedcountries: Record<string, string> = {};
  isShowIfsc = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private __dialogRef: MatDialogRef<NewInternationalAccountComponent>,
    private _payeeService: PayeeService,
    private _googleAddressService: GoogleAddressService,
    private cloudAccService: CloudBankService
  ) {}

  ngOnInit(): void {
    this.initFormGroup();
    this.getAllowedCountries();
    this.editMode = this.data.editMode;
    if (this.editMode) {
      this.setBankData();
    }
    this._googleAddressService.resetGoogleAutocompleteAPI();
  }

  initFormGroup(): void {
    this.beneficiaryForm = new UntypedFormGroup({
      addressLine1: new UntypedFormControl('', [Validators.required]),
      addressLine2: new UntypedFormControl(''),
      city: new UntypedFormControl('', [Validators.required]),
      state: new UntypedFormControl('', [Validators.required]),
      zip: new UntypedFormControl('', [
        Validators.required,
        ValidationService.noWhitespaceValidator,
        ValidationService.zipValidatorInternational
      ]),
      country: new UntypedFormControl('', [Validators.required])
    });

    this.beneficiaryBankForm = new UntypedFormGroup({
      addressLine1: new UntypedFormControl('', [Validators.required]),
      addressLine2: new UntypedFormControl(''),
      city: new UntypedFormControl('', [Validators.required]),
      state: new UntypedFormControl('', [Validators.required]),
      zip: new UntypedFormControl('', [
        Validators.required,
        ValidationService.noWhitespaceValidator,
        ValidationService.zipValidatorInternational
      ]),
      country: new UntypedFormControl('', [Validators.required])
    });

    this.internationalBankAcForm = new UntypedFormGroup({
      id: new UntypedFormControl(undefined),
      accountNumber: new UntypedFormControl('', [
        Validators.required,
        Validators.minLength(5)
      ]),
      identifierType: new UntypedFormControl('', [Validators.required]),
      identifierCode: new UntypedFormControl('', [Validators.required]),
      accountType: new UntypedFormControl('', [Validators.required]),
      bankName: new UntypedFormControl('', [Validators.required]),
      ifsc: new UntypedFormControl(''),
      beneficiary: this.beneficiaryForm,
      beneficiaryBankDetails: this.beneficiaryBankForm
    });
  }

  setBankData(): void {
    this.subscriptions.push(
      this._payeeService
        .getInternationalBank(this.data.id, this.data.bankAcId)
        .subscribe((res: any) => {
          if (res?.success) {
            this.internationalBankAcForm.patchValue({
              ...res.data,
              identifierType: res.data.bankIdentifierType,
              identifierCode: res.data.bankIdentifierCode
            });
            if (
              res.data.beneficiary.country === 'IN' ||
              res.data.beneficiaryBankDetails.country === 'IN'
            ) {
              this.isShowIfsc = true;
              this.internationalBankAcForm.controls.ifsc.setValidators([
                Validators.required
              ]);
              this.internationalBankAcForm.controls.ifsc.updateValueAndValidity();
            } else {
              this.isShowIfsc = false;
              this.internationalBankAcForm.controls.ifsc.setValidators([]);
              this.internationalBankAcForm.controls.ifsc.updateValueAndValidity();
            }
          }
        })
    );
  }

  setFormValue(name: string, value: any): any {
    return this.internationalBankAcForm.get(name)?.setValue(value);
  }

  updateInternationalPaymentBankAccount() {
    const sendingData = {
      ...this.internationalBankAcForm.value,
      payeeId: this.data.id
    };
    this.subscriptions.push(
      this._payeeService
        .updatePayeeInternationalBankAccount(
          this.internationalBankAcForm.value.id,
          sendingData
        )
        .pipe(finalize(() => (this.loading = false)))
        .subscribe((response: any) => {
          if (response.success) {
            this.__dialogRef.close({
              success: response.success,
              data: sendingData
            });
          }
        })
    );
  }

  createInternationalPaymentBankAccount() {
    const sendingData = {
      ...this.internationalBankAcForm.value,
      payeeId: this.data.id
    };
    this.subscriptions.push(
      this._payeeService
        .addPayeeInternationalBankAccount(sendingData)
        .pipe(finalize(() => (this.loading = false)))
        .subscribe((response: IApiRes<{ id: string }>) => {
          if (response.success) {
            this.__dialogRef.close({
              success: response.success,
              data: { ...sendingData, id: response.data?.id }
            });
          }
        })
    );
  }

  onSubmit() {
    if (this.internationalBankAcForm.invalid) {
      this.internationalBankAcForm.markAllAsTouched();
      return;
    }
    this.loading = true;

    if (this.editMode) {
      this.updateInternationalPaymentBankAccount();
    } else {
      this.createInternationalPaymentBankAccount();
    }
  }

  loadGoogleAddress(address: HTMLInputElement, addressInstance: number) {
    this._googleAddressService.googleAutocomplete({
      addressElement: address,
      allowedCountries: this.countries,
      displayShortName: true,
      addressInstance: addressInstance
    });

    const googleAddressSubscription =
      this._googleAddressService.googleAddress$.subscribe((res) => {
        if (addressInstance === 0) {
          this.beneficiaryForm.controls.addressLine1.patchValue(res.address);
          this.beneficiaryForm.controls.city.patchValue(res.city);
          this.beneficiaryForm.controls.state.patchValue(res.state);
          this.beneficiaryForm.controls.zip.patchValue(res.zip);
          this.beneficiaryForm.controls.country.patchValue(res.country);
          if (this.beneficiaryForm.controls.country.value === 'IN') {
            this.isShowIfsc = true;
            this.internationalBankAcForm.controls.ifsc.setValidators([
              Validators.required
            ]);
            this.internationalBankAcForm.controls.ifsc.updateValueAndValidity();
          } else {
            this.isShowIfsc = false;
            this.internationalBankAcForm.controls.ifsc.setValidators([]);
            this.internationalBankAcForm.controls.ifsc.updateValueAndValidity();
          }
        }
        if (addressInstance === 1) {
          this.beneficiaryBankForm.controls.addressLine1.patchValue(
            res.address
          );
          this.beneficiaryBankForm.controls.city.patchValue(res.city);
          this.beneficiaryBankForm.controls.state.patchValue(res.state);
          this.beneficiaryBankForm.controls.zip.patchValue(res.zip);
          this.beneficiaryBankForm.controls.country.patchValue(res.country);
          if (this.beneficiaryBankForm.controls.country.value === 'IN') {
            this.isShowIfsc = true;
            this.internationalBankAcForm.controls.ifsc.setValidators([
              Validators.required
            ]);
            this.internationalBankAcForm.controls.ifsc.updateValueAndValidity();
          } else {
            this.isShowIfsc = false;
            this.internationalBankAcForm.controls.ifsc.setValidators([]);
            this.internationalBankAcForm.controls.ifsc.updateValueAndValidity();
          }
        }
        googleAddressSubscription.unsubscribe();
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

  selectAccType(accountType: HTMLElement) {
    accountType.classList.add('active');
  }

  selectIdentifierType(type: HTMLElement) {
    type.classList.add('active');
  }

  selectBenfCountry(type: HTMLElement) {
    type.classList.add('active');

    if (
      this.beneficiaryForm.controls.country.value === 'IN' ||
      this.beneficiaryBankForm.controls.country.value === 'IN'
    ) {
      this.isShowIfsc = true;
      this.internationalBankAcForm.controls.ifsc.setValidators([
        Validators.required
      ]);
      this.internationalBankAcForm.controls.ifsc.updateValueAndValidity();
    } else {
      this.isShowIfsc = false;
      this.internationalBankAcForm.controls.ifsc.setValidators([]);
      this.internationalBankAcForm.controls.ifsc.updateValueAndValidity();
    }
  }

  selectBenfBankCountry(type: HTMLElement) {
    type.classList.add('active');
    if (
      this.beneficiaryForm.controls.country.value === 'IN' ||
      this.beneficiaryBankForm.controls.country.value === 'IN'
    ) {
      this.isShowIfsc = true;
      this.internationalBankAcForm.controls.ifsc.setValidators([
        Validators.required
      ]);
      this.internationalBankAcForm.controls.ifsc.updateValueAndValidity();
    } else {
      this.isShowIfsc = false;
      this.internationalBankAcForm.controls.ifsc.setValidators([]);
      this.internationalBankAcForm.controls.ifsc.updateValueAndValidity();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}

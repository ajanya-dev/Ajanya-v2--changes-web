import { Component, NgZone, OnDestroy, OnInit, inject } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
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
import { of, Subscription } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { Utils } from 'src/app/data/utils';
import { NgClass, KeyValuePipe } from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { CloudBankService } from 'src/app/shared/service/cloud-bank/cloud-bank.service';
import { Params } from '@angular/router';
import { GoogleAddressService } from './../../../../../core/services/google-address.service';
import { IPayeeEdit } from '../../../model/check';
import { V35CommonDropDownSelectorComponent } from 'src/app/shared/v3/v35-dropdown/v35-common-dropdown-selector.component';
import { CommonCountrySelectComponent } from 'src/app/shared/v3/common-country-select/common-country-select.component';
import { CommonStateSelectComponent } from 'src/app/shared/v3/common-state-select/common-state-select.component';

@Component({
  selector: 'app-update-payee-modal',
  templateUrl: './update-payee-modal.component.html',
  styleUrls: ['./update-payee-modal.component.scss'],
  standalone: true,
  imports: [
    MatDialogClose,
    FaIconComponent,
    FormsModule,
    ReactiveFormsModule,
    MatDialogActions,
    NgClass,
    KeyValuePipe,
    V35CommonDropDownSelectorComponent,
    CommonCountrySelectComponent,
    CommonStateSelectComponent
  ]
})
export class UpdatePayeeModalComponent implements OnInit, OnDestroy {
  public datas: Params = inject(MAT_DIALOG_DATA);
  private cloudBankService = inject(CloudBankService);
  private fb = inject(FormBuilder);
  private googleAddressService = inject(GoogleAddressService);
  private checkService = inject(CheckService);
  private alert = inject(AlertService);
  private dialogRef = inject(MatDialogRef<UpdatePayeeModalComponent>);
  private ngZone = inject(NgZone);

  EditPayeeForm: FormGroup;
  subscriptions: Subscription[] = [];

  payeeAddress: { [key: string]: string }[] = [];
  err_msg: string;
  array: IPayeeEdit[] = [];
  /** Address Line 1 input -> its row index, so a selection can be routed back to its row. */
  private addressRows = new Map<HTMLInputElement, number>();

  disabled = false;
  isLoading = false;
  validZip: boolean;
  allowedcountries: { [key: string]: string } = {};
  utils = Utils;
  countryValue: string;
  zipValue: string;
  isCountryReadonly: boolean = false;  // Add property for readonly country

  countryDropdownConfig = {
    placeholder: 'Country',
    displayField: 'value',
    outputField: 'key',
    clearable: true,
    searchable: true,
  };

  ngOnInit(): void {
    this.initFormGroup();
    this.getAllowedCountries();
    this.payeeAddress = this.datas as { [key: string]: string }[];
    
    // Check if country should be readonly
    this.isCountryReadonly = this.datas?.isCountryReadonly === true;

    this.setCloneData();

    this.googleAddressService.resetGoogleAutocompleteAPI();
    this.listenToAddressSelection();
  }

  /**
   * Load Google Address API for the focused row.
   *
   * Bound per input element so every row gets its own dropdown no matter which one the user
   * touches first. Re-binding the same element is a no-op, so calling this on each focus is
   * safe. The row is remembered against its input, which is how `listenToAddressSelection`
   * routes a selection back to the row it came from.
   */
  addressFocus(ent: Event, i: number) {
    const address = ent.target as HTMLInputElement;
    this.addressRows.set(address, i);
    this.googleAddressService.attachAutocomplete({
      addressElement: address,
      allowedCountries: ['us', 'ca'],
      dropdownMinWidth: 400
    });
  }

  /**
   * One subscription for the whole table. The service emits every selection on a shared
   * subject, so `sourceElement` is what tells us which row - and filters out selections
   * made in a different component altogether.
   */
  private listenToAddressSelection() {
    this.subscriptions.push(
      this.googleAddressService.googleAddress$.subscribe((res) => {
        const i = res.sourceElement
          ? this.addressRows.get(res.sourceElement)
          : undefined;
        if (i === undefined) {
          return;
        }
        this.ngZone.run(() => {
          const invoiceType = this.getFormControls('item') as FormArray;
          const formGrp = invoiceType.controls[i] as FormGroup;
          formGrp.get('address_line_1')?.setValue(res.address);
          formGrp.get('city')?.setValue(res.city);
          formGrp.get('state')?.setValue(res.state);
          formGrp.get('zip')?.setValue(res.zip);
          formGrp
            .get('country')
            ?.setValue(this.selectedpayeeCountry(res.country) ?? res.country);
        });
      })
    );
  }

  /**
   * initFormGroup
   */

  initFormGroup() {
    this.EditPayeeForm = this.fb.group({
      item: this.fb.array([this.createPayeeMemoCtrl()])
    });
  }

  createPayeeMemoCtrl(): FormGroup {
    return this.fb.group({
      checkNo: [''],
      enc_id: [''],
      name: ['', [Validators.required]],
      PayeeCompanyName: [''],
      address_line_1: [''],
      address_line_2: [''],
      city: [''],
      state: [null, [Validators.required]],
      zip: ['', [Validators.required, Validators.minLength(5)]],
      country: ['',[Validators.required]],
      PayeePhone: [''],
      payeeEmail: ['']
    });
  }

  getFormControl() {
    return this.EditPayeeForm.get('item') as FormArray;
  }

  getFormControls(name: string) {
    return this.EditPayeeForm?.get(name);
  }

  getFormValue() {
    return this.EditPayeeForm.get('item')?.value;
  }

  get userFormGroups() {
    // return this.creditmemo.get('item') as FormArray
    return this.EditPayeeForm.get('item') as FormArray;
  }

  addCtrl() {
    this.userFormGroups.push(this.createPayeeMemoCtrl());
  }

  removeCtrl(i: number) {
    this.userFormGroups.removeAt(i);
  }

  /**
   *  Set Edit data
   */

  setCloneData() {
    if (this.datas !== null) {
      this.isLoading = true;
      if (this.datas.type === 'multi-update') {
        const ids = { cheque_ids: [], shipping_type: [] };

        this.datas.id.forEach((el: string) => {
          ids.cheque_ids.push(el as never);
          ids.shipping_type.push(this.datas.shippingType[el] as never);
        });

        this.subscriptions.push(
          this.checkService
            .payeevalidation(ids)
            .pipe(
              finalize(() => {
                this.isLoading = false;
              })
            )
            .subscribe((res) => {
            ids.cheque_ids.forEach((ele: string) => {
              this.array.push({
                checkNo: res.data[ele].data.cheque.cheque_serial_number,
                enc_id: res.data[ele].data.enc_payee_id,
                name: res.data[ele].data.name,
                address_line_1: res.data[ele].data.address.address_line_1,
                address_line_2: res.data[ele].data.address.address_line_2,
                city: res.data[ele].data.address.city,
                state: res.data[ele].data.address.state,
                zip: res.data[ele].data.address.zip,
                country: this.selectedpayeeCountry(
                  res.data[ele].data.address.country
                ) || ''
              });

              const filterArray = this.array.reduce((accumalator, current) => {
                if (
                  !accumalator.some(
                    (item: { enc_id: string; name: string }) =>
                      item.enc_id === current.enc_id &&
                      item.name === current.name
                  )
                ) {
                  accumalator.push(current as never);
                }
                return accumalator;
              }, []);

              this.addCtrl();
              this.removeCtrl(filterArray.length);

              this.array = filterArray;
            });

            this.EditPayeeForm.patchValue({
              item: this.array
            });
          })
        );
        // });
      } else {
        this.subscriptions.push(
          this.checkService
            .getpayee({
              ids: [this.datas.id],
              cheque_ids: [this.datas.checkid]
            })
            .pipe(
              finalize(() => {
                this.isLoading = false;
              })
            )
            .subscribe((res) => {
              res.data.forEach((ele: { [key: string]: string }) => {
                this.array.push({
                  checkNo: this.datas.checkNo,
                  enc_id: ele.enc_id,
                  name: ele.payee_name,
                  address_line_1: ele.payee_address_line_1,
                  address_line_2: ele.payee_address_line_2,
                  city: ele.payee_city,
                  state: ele.payee_state,
                  zip: ele.payee_zip,
                  country: this.selectedpayeeCountry(ele.payee_country) || ''
                });

                this.addCtrl();
                this.removeCtrl(res.data.length);
              });
              this.EditPayeeForm.patchValue({
                item: this.array
              });
            })
        );
      }
    }
  }

  selectedpayeeCountry(value: string) {
    if (!value) {
      return null;
    }
    const lowerValue = value.toLowerCase();

    const USA = ['united states', 'us', 'usa', 'united states of america'];
    const ca = ['canada', 'ca'];
    if (USA.includes(lowerValue)) {
      return 'United States';
    }
    if (ca.includes(lowerValue)) {
      return 'Canada';
    }

    // Match by iso2 key (e.g., 'IN' -> 'India')
    const upperValue = value.toUpperCase();
    if (this.allowedcountries[upperValue]) {
      return this.allowedcountries[upperValue];
    }

    // Match by full name, case-insensitive (e.g., 'india' -> 'India')
    const matchedKey = Object.keys(this.allowedcountries).find(
      (key) => this.allowedcountries[key]?.toLowerCase() === lowerValue
    );
    if (matchedKey) {
      return this.allowedcountries[matchedKey];
    }

    // Exact match (preserve existing behavior for edge cases)
    if (Object.values(this.allowedcountries).includes(value)) {
      return value;
    }

    return null;
  }

  /**
   * Header action: set every row's country to United States.
   *
   * The state selector reloads its options from the new country and clears any
   * state that does not belong to it, so rows previously set to another country
   * come back with an empty (required) state for the user to pick.
   */
  setAllCountriesToUnitedStates() {
    if (this.isCountryReadonly) {
      return;
    }
    this.getFormControl().controls.forEach((row) => {
      const countryControl = row.get('country');
      countryControl?.setValue('United States');
      countryControl?.markAsDirty();
    });
  }

  /**
   * Update
   */

  update() {
    const payeeData = this.EditPayeeForm.value.item;

    const control = this.EditPayeeForm.controls.item.value;
    for (let i = 0; i < control.length; i += 1) {
      if (
        control[i].country === 'United States' &&
        control[i].zip &&
        (control[i].zip.match(/[A-Z]/) || control[i].zip.match(/[a-z]/))
      ) {
        this.validZip = true;
        this.alert.warningAlert({
          content:
            `Zip field only allow integer values for` + '<br>' + `United States`
        });
        return;
      }
      this.validZip = false;
      if (control[i].zip === null || control[i].zip.length < 5) {
        this.validZip = true;
        this.alert.warningAlert({ content: `Invalid Zip on row ${i + 1}` });
        return;
      }
      this.validZip = false;
    }

    this.disabled = true;
    this.subscriptions.push(
      this.checkService
        .updatepayee(payeeData)
        .pipe(
          catchError(() => {
            this.disabled = false;
            return of(false);
          })
        )
        .subscribe((res) => {
          const Udata = {
            title: 'Success',
            content: 'Payee address updated',
            close: true,
            timeout: 2000
          };

          if (res.success) {
            this.alert.successAlert(Udata);
            this.dialogRef.close({ type: 'result', data: payeeData });
          }

          if (!res.success) {
            this.disabled = false;
          }
        })
    );

  }

  getAllowedCountries() {
    this.subscriptions.push(
      this.cloudBankService.allowedCountries.subscribe((res) => {
        this.allowedcountries = res;
      })
    );
  }

  /**
   * method for getting country code
   * @returns
   */
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

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
    // Drops the `.pac-container` dropdowns Google leaves on `body` when the modal closes.
    this.googleAddressService.resetGoogleAutocompleteAPI();
  }
}

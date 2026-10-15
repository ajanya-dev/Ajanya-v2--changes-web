import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormArray,
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose
} from '@angular/material/dialog';
import { of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { LucideAngularModule, LoaderCircle } from 'lucide-angular';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { Utils } from 'src/app/data/utils';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faUser, faXmark } from '@fortawesome/pro-solid-svg-icons';
import { CloudBankService } from 'src/app/shared/service/cloud-bank/cloud-bank.service';
import { Params } from '@angular/router';
import { CommonCountrySelectV4Component } from 'src/app/shared/V4/common-country-select-v4/common-country-select-v4.component';
import { CommonStateSelectV4Component } from 'src/app/shared/V4/common-state-select-v4/common-state-select-v4.component';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { IGoogleAddress } from 'src/app/modules/more/model/google-autocomplete';
import { AddressAutocompleteV4Component } from 'src/app/shared/V4/address-autocomplete-v4/address-autocomplete-v4.component';
import { GoogleAddressService } from '../../../../../core/services/google-address.service';
import { IPayeeEdit } from '../../../model/check';

type PayeeItemForm = FormGroup<{
  checkNo: FormControl<string>;
  enc_id: FormControl<string>;
  name: FormControl<string>;
  PayeeCompanyName: FormControl<string>;
  address_line_1: FormControl<string>;
  address_line_2: FormControl<string>;
  city: FormControl<string>;
  state: FormControl<string | null>;
  zip: FormControl<string>;
  country: FormControl<string>;
  PayeePhone: FormControl<string>;
  payeeEmail: FormControl<string>;
}>;

type EditPayeeFormType = FormGroup<{
  item: FormArray<PayeeItemForm>;
}>;

@Component({
  selector: 'app-update-payee-modal',
  templateUrl: './update-payee-modal-v4.component.html',
  styleUrls: ['./update-payee-modal-v4.component.scss'],
  standalone: true,
  imports: [
    MatDialogClose,
    FaIconComponent,
    FormsModule,
    ReactiveFormsModule,
    CommonButtonV4Component,
    CommonInputFieldV4Component,
    AddressAutocompleteV4Component,
    CommonCountrySelectV4Component,
    CommonStateSelectV4Component,
    LucideAngularModule
  ]
})
export class UpdatePayeeModalV4Component implements OnInit {
  public datas: Params = inject(MAT_DIALOG_DATA);
  private cloudBankService = inject(CloudBankService);
  private fb = inject(NonNullableFormBuilder);
  private googleAddressService = inject(GoogleAddressService);
  private checkService = inject(CheckService);
  private alert = inject(V4AlertService);
  private dialogRef = inject(MatDialogRef<UpdatePayeeModalV4Component>);
  private destroyRef = inject(DestroyRef);

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.googleAddressService.resetGoogleAutocompleteAPI();
    });
  }

  EditPayeeForm: EditPayeeFormType;

  payeeAddress: { [key: string]: string }[] = [];
  err_msg: string;
  array: IPayeeEdit[] = [];

  faUser = faUser;
  faXmark = faXmark;
  LoaderCircleIcon = LoaderCircle;
  disabled = signal(false);
  isLoading = signal(false);
  validZip: boolean;
  countries: string[] = [];
  allowedcountries: { [key: string]: string } = {};
  utils = Utils;
  countryValue: string;
  zipValue: string;
  isCountryReadonly = signal(false);

  ngOnInit(): void {
    this.googleAddressService.resetGoogleAutocompleteAPI();
    this.initFormGroup();
    this.getAllowedCountries();
    this.payeeAddress = this.datas as { [key: string]: string }[];

    // Check if country should be readonly
    this.isCountryReadonly.set(this.datas?.isCountryReadonly === true);

    this.setCloneData();
  }

  onAddressSelected(address: IGoogleAddress, i: number): void {
    const formGrp = this.itemArray.at(i);
    formGrp.controls.address_line_1.setValue(address.address ?? '');
    formGrp.controls.city.setValue(address.city ?? '');
    formGrp.controls.state.setValue(address.state ?? null);
    formGrp.controls.zip.setValue(address.zip ?? '');
    formGrp.controls.country.setValue(address.country ?? '');
  }

  /**
   * initFormGroup
   */

  initFormGroup() {
    this.EditPayeeForm = this.fb.group({
      item: this.fb.array<PayeeItemForm>([this.createPayeeMemoCtrl()])
    });
  }

  createPayeeMemoCtrl(): PayeeItemForm {
    return this.fb.group({
      checkNo: [''],
      enc_id: [''],
      name: ['', [Validators.required]],
      PayeeCompanyName: [''],
      address_line_1: [''],
      address_line_2: [''],
      city: [''],
      state: new FormControl<string | null>(null, [Validators.required]),
      zip: ['', [Validators.required, Validators.minLength(5)]],
      country: ['', [Validators.required]],
      PayeePhone: [''],
      payeeEmail: ['']
    });
  }

  get itemArray(): FormArray<PayeeItemForm> {
    return this.EditPayeeForm.controls.item;
  }

  addCtrl() {
    this.itemArray.push(this.createPayeeMemoCtrl());
  }

  removeCtrl(i: number) {
    this.itemArray.removeAt(i);
  }

  /**
   *  Set Edit data
   */

  setCloneData() {
    if (this.datas !== null) {
      this.isLoading.set(true);
      if (this.datas.type === 'multi-update') {
        const ids = { cheque_ids: [], shipping_type: [] };

        this.datas.id.forEach((el: string) => {
          ids.cheque_ids.push(el as never);
          ids.shipping_type.push(this.datas.shippingType[el] as never);
        });

        this.checkService
          .payeevalidation(ids)
          .pipe(
            finalize(() => {
              this.isLoading.set(false);
            }),
            takeUntilDestroyed(this.destroyRef)
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
                country:
                  this.selectedpayeeCountry(
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

            // Several checks render as a table - it needs the full row width.
            // The panel class lifts Material's default 80vw max-width, which
            // would otherwise clip the dialog on callers that don't set one.
            if (this.itemArray.length > 1) {
              this.dialogRef.addPanelClass('v4-address-table-modal');
              this.dialogRef.updateSize('1280px');
            }
          });
      } else {
        this.checkService
          .getpayee({
            ids: [this.datas.id],
            cheque_ids: [this.datas.checkid]
          })
          .pipe(
            finalize(() => {
              this.isLoading.set(false);
            }),
            takeUntilDestroyed(this.destroyRef)
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
          });
      }
    }
  }

  selectedpayeeCountry(value: string) {
    const USA = ['united states', 'us', 'usa', 'united states of america'];
    const ca = ['canada', 'ca'];

    const Payeecountry = value?.toLowerCase();

    if (USA.includes(Payeecountry)) {
      return 'United States';
    }
    if (ca.includes(Payeecountry)) {
      return 'Canada';
    }

    // Check if the value exists in allowed countries
    const countryExists = Object.values(this.allowedcountries).includes(value);
    return countryExists ? value : null;
  }

  /**
   * Header action: set every row's country to United States.
   *
   * The state selector reloads its options from the new country and clears any
   * state that does not belong to it, so rows previously set to another country
   * come back with an empty (required) state for the user to pick.
   */
  setAllCountriesToUnitedStates() {
    if (this.isCountryReadonly()) {
      return;
    }
    this.itemArray.controls.forEach((row) => {
      row.controls.country.setValue('United States');
      row.controls.country.markAsDirty();
    });
  }

  /**
   * Update
   */

  update() {
    const payeeData = this.itemArray.getRawValue();

    for (let i = 0; i < payeeData.length; i += 1) {
      if (
        payeeData[i].country === 'United States' &&
        payeeData[i].zip &&
        (payeeData[i].zip.match(/[A-Z]/) || payeeData[i].zip.match(/[a-z]/))
      ) {
        this.validZip = true;
        this.alert.warningAlert({
          content: `Zip field only allow integer values for<br>United States`
        });
        return;
      }
      this.validZip = false;
      if (payeeData[i].zip === null || payeeData[i].zip.length < 5) {
        this.validZip = true;
        this.alert.warningAlert({ content: `Invalid Zip on row ${i + 1}` });
        return;
      }
      this.validZip = false;
    }

    this.disabled.set(true);
    this.checkService
      .updatepayee(payeeData)
      .pipe(
        catchError(() => {
          this.disabled.set(false);
          return of(false);
        }),
        takeUntilDestroyed(this.destroyRef)
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
          this.disabled.set(false);
        }
      });
  }

  getAllowedCountries() {
    const currentCountries = this.cloudBankService.allowedCountries.getValue();
    if (currentCountries && Object.keys(currentCountries).length > 0) {
      this.setCountryData(currentCountries);
    } else {
      this.cloudBankService
        .getAllowedCountries()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((res) => {
          if (res?.data) {
            this.cloudBankService.allowedCountries.next(res.data);
            this.setCountryData(res.data);
          }
        });
    }
  }

  private setCountryData(res: { [key: string]: string }) {
    this.allowedcountries = res;
    this.countries = Object.keys(this.allowedcountries);
  }

  /**
   * Resolves a stored country value (ISO2 code or full name) to its ISO2 code,
   * used to drive the state select's [country] input.
   */
  /** Zip vs Postal Code labelling, driven by the first row like the v3 table. */
  isUnitedStates(): boolean {
    const country = this.itemArray.at(0)?.controls.country.value;
    return country === 'United States' || country === '';
  }

  findCountryCode(countryName: string): string | undefined {
    if (countryName in this.allowedcountries) {
      return countryName;
    }
    return Object.keys(this.allowedcountries).find(
      (code) => this.allowedcountries[code] === countryName
    );
  }
}

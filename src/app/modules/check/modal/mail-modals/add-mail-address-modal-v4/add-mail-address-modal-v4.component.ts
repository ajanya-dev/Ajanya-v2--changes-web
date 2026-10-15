import { GoogleAddressService } from 'src/app/core/services/google-address.service';
import {
  Component,
  OnInit,
  EventEmitter,
  Output,
  DestroyRef,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  FormGroup,
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
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { IApiRes } from 'src/app/models/api';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faXmark } from '@fortawesome/pro-solid-svg-icons';
import { CloudBankService } from 'src/app/shared/service/cloud-bank/cloud-bank.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { AddressAutocompleteV4Component } from 'src/app/shared/V4/address-autocomplete-v4/address-autocomplete-v4.component';
import { PhoneInputV4Component } from 'src/app/shared/V4/v4-phone-input/v4-phone-input.component';
import { IGoogleAddress } from 'src/app/modules/more/model/google-autocomplete';
import { CommonCountrySelectV4Component } from 'src/app/shared/V4/common-country-select-v4/common-country-select-v4.component';
import { CommonStateSelectV4Component } from 'src/app/shared/V4/common-state-select-v4/common-state-select-v4.component';
import { IMailSingleShippingAddress } from '../../../model/check';

@Component({
  selector: 'app-add-mail-address-modal',
  templateUrl: './add-mail-address-modal-v4.component.html',
  styleUrls: ['./add-mail-address-modal-v4.component.scss'],
  standalone: true,
  imports: [
    MatDialogClose,
    FaIconComponent,
    FormsModule,
    ReactiveFormsModule,
    CommonButtonV4Component,
    CommonInputFieldV4Component,
    AddressAutocompleteV4Component,
    PhoneInputV4Component,
    CommonCountrySelectV4Component,
    CommonStateSelectV4Component
  ]
})
export class AddMailAddressModalV4Component implements OnInit {
  private fb = inject(FormBuilder);
  private checkService = inject(CheckService);
  private alert = inject(V4AlertService);
  private googleAddressService = inject(GoogleAddressService);
  private dialogRef = inject(MatDialogRef<AddMailAddressModalV4Component>);
  private cloudBankService = inject(CloudBankService);
  private destroyRef = inject(DestroyRef);

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.googleAddressService.resetGoogleAutocompleteAPI();
    });
  }

  public data: {
    dataKey: 'mail-from' | 'mail-to';
    isForUpdate: boolean;
    id: string;
    isWalletCheckCustomAddress?: boolean;
    /**
     * Open on an address that has no record yet, in the shape the book takes.
     * For a save the server refused: there is nothing to fetch, and retyping
     * what was rejected is worse than correcting it.
     */
    prefill?: Partial<IMailSingleShippingAddress>;
  } = inject(MAT_DIALOG_DATA);

  @Output() addressEmit = new EventEmitter();

  faXmark = faXmark;

  allowedcountries: { [key: string]: string } = {};
  countries: string[] = [];

  mailForm: FormGroup;
  isMailFrom = signal(false);
  isForUpdate = signal(false);
  err_msg: string;
  disabled = signal(false);
  isSubmit = signal(false);
  isDeleting = signal(false);
  isWalletCheckCustomAddress = false;

  ngOnInit(): void {
    this.initFormGroup();
    this.getAllowedCountries();
    if (this.data) {
      this.isForUpdate.set(this.data.isForUpdate);
      this.setCloneData();
      if (!this.data.isForUpdate && this.data.prefill) {
        this.patchvalue({
          data: this.data.prefill
        } as IApiRes<IMailSingleShippingAddress>);
      }
    }
    this.isMailFrom.set(this.data.dataKey === 'mail-from');
    this.googleAddressService.resetGoogleAutocompleteAPI();
    if (this.data.isWalletCheckCustomAddress) {
      this.allowedcountries = {
        US: 'United States'
      };
      this.countries = Object.keys(this.allowedcountries);
    }
  }

  /**
   * @description Initiate mail form.
   */
  initFormGroup() {
    this.mailForm = this.fb.group({
      name: ['', [Validators.required]],
      CompanyName: [''],
      phone: ['', [ValidationService.phoneNumberValidator]],
      email: ['', [ValidationService.emailValidator]],
      addressLine1: ['', [Validators.required]],
      addressLine2: [''],
      city: ['', [Validators.required]],
      state: ['', [Validators.required]],
      Zip: ['', [Validators.required]],
      country: ['', [Validators.required]],
      note: ['']
    });
  }

  /**
   * @description Creates a credit memo body object based on the data from the mail form.
   */
  createCreditMemobody() {
    const data = this.mailForm.value;
    return {
      name: data.name,
      company_name: data.CompanyName,
      address_line_1: data.addressLine1,
      address_line_2: data.addressLine2,
      city: data.city,
      state: data.state,
      zip: data.Zip,
      country: data.country,
      phone: data.phone,
      email: data.email,
      note: data.note
    };
  }

  onAddressSelected(address: IGoogleAddress): void {
    this.mailForm.patchValue({
      addressLine1: address.address ?? '',
      city: address.city ?? '',
      state: address.state ?? '',
      Zip: address.zip ?? '',
      country: address.country ?? ''
    });
    if (address.country) {
      this.onCountryChange(address.country, true);
    }
  }

  /**
   * @description Sets the form data by fetching details for updating based on the provided data.
   */
  setCloneData() {
    if (this.isForUpdate()) {
      if (this.data !== null) {
        if (this.data.dataKey === 'mail-from') {
          this.checkService
            .getFromSingleId(this.data.id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((res) => {
              this.patchvalue(res);
            });
        } else {
          this.checkService
            .getToSingleId(this.data.id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((res) => {
              this.patchvalue(res);
            });
        }
      }
    }
  }

  /**
   * @description Populates the form fields with data retrieved from an API response.
   */
  patchvalue(res: IApiRes<IMailSingleShippingAddress>) {
    this.mailForm.patchValue({
      name: res.data.name,
      CompanyName: res.data.company_name,
      addressLine1: res.data.address_line_1,
      addressLine2: res.data.address_line_2,
      city: res.data.city,
      state: res.data.state,
      Zip: res.data.zip,
      country: res.data.country,
      phone: res.data.phone,
      email: res.data.email,
      note: res.data.note
    });
    if (res.data.country) {
      this.onCountryChange(res.data.country, true);
    }
  }

  /**
   * @description Submits the mail form data.
   */
  submit() {
    this.mailForm.markAllAsTouched();
    const datas = this.createCreditMemobody();

    if (
      this.mailForm.value.country === 'United States' &&
      (this.mailForm.value.Zip.match(/[A-Z]/) ||
        this.mailForm.value.Zip.match(/[a-z]/))
    ) {
      this.alert.warningAlert({
        content: `Zip field only allow integer values for<br>United States`
      });
      return;
    }

    if (this.mailForm.valid) {
      this.disabled.set(true);

      if (!this.isForUpdate()) {
        this.isSubmit.set(true);
        if (this.data.dataKey === 'mail-from') {
          this.checkService
            .addMailFrom(datas)
            .pipe(
              catchError((err) => {
                this.catcherror(err);
                return of(false);
              }),
              finalize(() => {
                this.isSubmit.set(false);
              }),
              takeUntilDestroyed(this.destroyRef)
            )
            .subscribe((res) => {
              const data = {
                title: 'Success',
                content: 'Mail From added ',
                close: true,
                timeout: 2000
              };

              if (res.success) {
                const close = this.alert.successAlert(data);

                close.afterClosed().subscribe((result) => {
                  if (result) {
                    this.dialogRef.close({
                      result,
                      data: datas,
                      type: 'mail-from',
                      id: res.data
                    });
                  }
                });
              }
            });
        } else {
          this.checkService
            .addMailTo(datas)
            .pipe(
              catchError((err) => {
                this.catcherror(err);
                return of(false);
              }),
              finalize(() => {
                this.isSubmit.set(false);
              }),
              takeUntilDestroyed(this.destroyRef)
            )
            .subscribe((res) => {
              const data = {
                title: 'Success',
                content: 'Mail To added ',
                close: true,
                timeout: 2000
              };

              if (res.success && res.message !== 'Updated') {
                const close = this.alert.successAlert(data);

                close.afterClosed().subscribe((result) => {
                  if (result) {
                    this.dialogRef.close({
                      result,
                      data: datas,
                      id: res.data,
                      type: 'mail-to'
                    });
                  }
                });
              }
            });
        }
      }
    }
  }

  /**
   * An undeliverable address comes back as a 422 with a business-logic
   * `errorCode`, which the interceptor deliberately passes over, so saying so
   * is this component's job. The server packs several reasons into one string
   * with `||` between them.
   *
   * A refusal on permission is the interceptor's, though — it already alerts on
   * a 403 and on code 171 — so this stays quiet there rather than stacking a
   * second popup on top of it.
   */
  catcherror(err: {
    status?: number;
    error?: {
      errorMsg?: string;
      errorCode?: number | string;
      permissionType?: string;
    };
  }) {
    this.disabled.set(false);
    const body = err?.error;
    if (
      err?.status === 403 ||
      !!body?.permissionType ||
      Number(body?.errorCode) === 171
    ) {
      this.err_msg = '';
      return;
    }
    this.err_msg = (body?.errorMsg ?? '')
      .split('||')
      .map((reason) => reason.trim())
      .filter(Boolean)
      .join('<br>');
    this.alert.failedAlert({
      content: this.err_msg || 'This address could not be saved.'
    });
  }

  /**
   * @description Updates existing 'Mail From' or 'Mail To' data.
   */
  Update() {
    this.mailForm.markAllAsTouched();
    const datas = this.createCreditMemobody();

    if (
      this.mailForm.value.country === 'United States' &&
      (this.mailForm.value.Zip.match(/[A-Z]/) ||
        this.mailForm.value.Zip.match(/[a-z]/))
    ) {
      this.alert.warningAlert({
        content: `Zip field only allow integer values for<br>United States`
      });
      return;
    }

    this.disabled.set(true);
    if (this.isForUpdate()) {
      this.isSubmit.set(true);
      if (this.data.dataKey === 'mail-from') {
        this.checkService
          .updateMailFrom(this.data.id, datas)
          .pipe(
            catchError((err) => {
              this.catcherror(err);
              return of(false);
            }),
            finalize(() => {
              this.isSubmit.set(false);
            }),
            takeUntilDestroyed(this.destroyRef)
          )
          .subscribe((res) => {
            const data = {
              title: 'Success',
              content: 'Mail From updated ',
              close: true,
              timeout: 2000
            };

            if (res.success) {
              const close = this.alert.successAlert(data);

              close.afterClosed().subscribe((result) => {
                if (result) {
                  this.dialogRef.close({
                    result,
                    data: datas,
                    id: this.data.id,
                    type: 'mail-from',
                    mode: 'update'
                  });
                }
              });
            }
          });
      } else {
        this.checkService
          .updateMailTo(this.data.id, datas)
          .pipe(
            catchError((err) => {
              this.catcherror(err);
              return of(false);
            }),
            finalize(() => {
              this.isSubmit.set(false);
            }),
            takeUntilDestroyed(this.destroyRef)
          )
          .subscribe((res) => {
            const data = {
              title: 'Success',
              content: 'Mail To updated ',
              close: true,
              timeout: 2000
            };

            if (res.success) {
              const close = this.alert.successAlert(data);

              close.afterClosed().subscribe((result) => {
                if (result) {
                  this.dialogRef.close({
                    result,
                    data: datas,
                    id: this.data.id,
                    type: 'mail-to',
                    mode: 'update'
                  });
                }
              });
            }
          });
      }
    }
  }

  /**
   * @description Deletes an address by displaying a confirmation alert.
   */
  deleteid() {
    const data = {
      content: 'Are you sure you want to delete?'
    };

    const confirm = this.alert.confirmAlert(data);

    confirm.afterClosed().subscribe((result) => {
      if (result) {
        if (this.isForUpdate()) {
          this.isDeleting.set(true);
          if (this.data.dataKey === 'mail-from') {
            this.checkService
              .deleteAddressFrom(this.data.id)
              .pipe(
                catchError((err) => {
                  this.delcatcherr(err);
                  return of(false);
                }),
                finalize(() => {
                  this.isDeleting.set(false);
                }),
                takeUntilDestroyed(this.destroyRef)
              )
              .subscribe((res) => {
                const datas = {
                  title: 'Success',
                  content: 'Address deleted ',
                  close: true,
                  timeout: 2000
                };

                if (res.success) {
                  const close = this.alert.successAlert(datas);

                  close.afterClosed().subscribe((results) => {
                    if (results) {
                      this.dialogRef.close({
                        type: 'delete',
                        mode: 'mail-from'
                      });
                    }
                  });
                }
              });
          } else {
            this.checkService
              .deleteAddressTo(this.data.id)
              .pipe(
                catchError((err) => {
                  this.delcatcherr(err);
                  return of(false);
                }),
                finalize(() => {
                  this.isDeleting.set(false);
                }),
                takeUntilDestroyed(this.destroyRef)
              )
              .subscribe((res) => {
                const dat = {
                  title: 'Success',
                  content: 'Address deleted ',
                  close: true,
                  timeout: 2000
                };

                if (res.success) {
                  const close = this.alert.successAlert(dat);

                  close.afterClosed().subscribe((response) => {
                    if (response) {
                      this.dialogRef.close({
                        type: 'delete',
                        mode: 'mail-To'
                      });
                    }
                  });
                }
              });
          }
        }
      }
    });
  }


  onCountryChange(country: string, preserveStateValue = false) {
    if (!country) return;
    const stateCtrl = this.mailForm.get('state');

    if (
      country === 'Canada' ||
      country === 'CA' ||
      country === 'United States' ||
      country === 'US'
    ) {
      stateCtrl?.setValidators([Validators.required]);
    } else {
      if (!preserveStateValue) {
        stateCtrl?.setValue('');
      }
      stateCtrl?.clearValidators();
    }
    stateCtrl?.updateValueAndValidity();
  }

  findCountryCode(countryName: string): string | undefined {
    if (countryName in this.allowedcountries) {
      return countryName;
    }
    return Object.keys(this.allowedcountries).find(
      (code) => this.allowedcountries[code] === countryName
    );
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

  delcatcherr(err: { error: { errorMsg: string } }) {
    this.err_msg = err.error.errorMsg;
  }
}

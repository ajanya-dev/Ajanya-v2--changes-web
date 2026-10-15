import { GoogleAddressService } from 'src/app/core/services/google-address.service';
import {
  Component,
  OnInit,
  EventEmitter,
  Output,
  OnDestroy,
  inject
} from '@angular/core';
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
  MatDialogClose,
  MatDialogActions
} from '@angular/material/dialog';
import { of, Subscription } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { IApiRes } from 'src/app/models/api';
import { IMailSingleShippingAddress } from '../../../model/check';
import { KeyValuePipe, NgClass } from '@angular/common';
import { NgxMaskDirective } from 'ngx-mask';
import { ControlMessageComponent } from '../../../../../shared/components/control-message/control-message/control-message.component';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { CloudBankService } from 'src/app/shared/service/cloud-bank/cloud-bank.service';

@Component({
  selector: 'app-add-mail-address-modal',
  templateUrl: './add-mail-address-modal.component.html',
  styleUrls: ['./add-mail-address-modal.component.scss'],
  standalone: true,
  imports: [
    MatDialogClose,
    FaIconComponent,
    FormsModule,
    ReactiveFormsModule,
    ControlMessageComponent,
    NgxMaskDirective,
    MatDialogActions,
    NgClass,
    KeyValuePipe
  ]
})
export class AddMailAddressModalComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private checkService = inject(CheckService);
  private alert = inject(AlertService);
  private googleAddressService = inject(GoogleAddressService);
  private dialogRef = inject(MatDialogRef<AddMailAddressModalComponent>);
  private cloudBankService = inject(CloudBankService);

  public data: {
    dataKey: 'mail-from' | 'mail-to';
    isForUpdate: boolean;
    id: string;
    isWalletCheckCustomAddress?: boolean;
  } = inject(MAT_DIALOG_DATA);

  @Output() addressEmit = new EventEmitter();

  allowedcountries: { [key: string]: string } = {};
  countries:string[] = [];
  mailForm: FormGroup;
  subscriptions: Subscription[] = [];
  isMailFrom: boolean;
  isForUpdate: boolean;
  err_msg: string;
  disabled = false;
  isSubmit = false;
  isWalletCheckCustomAddress: boolean=false;

  ngOnInit(): void {
    this.initFormGroup();
    this.getAllowedCountries();
    if (this.data) {
      this.isForUpdate = this.data.isForUpdate;
      this.setCloneData();
    }
    if (this.data.dataKey === 'mail-from') {
      this.isMailFrom = true;
    } else {
      this.isMailFrom = false;
    }
    this.googleAddressService.resetGoogleAutocompleteAPI();
    if(this.data.isWalletCheckCustomAddress){
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
      email: [''],
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

  /**
   * @description Loads Google Address API to autocomplete and populate address-related form fields.
   * @param {HTMLInputElement} address - The HTML input element associated with the address.
   */
  loadGoogleAddress(address: HTMLInputElement) {
    this.googleAddressService.googleAutocomplete({
      addressElement: address,
      allowedCountries: this.countries,
    });

    const googleAddressSubscription =
      this.googleAddressService.googleAddress$.subscribe((res) => {
        this.mailForm.patchValue({
          addressLine1: res.address,
          city: res.city,
          state: res.state,
          Zip: res.zip,
          country: res.country
        });
        googleAddressSubscription.unsubscribe();
      });
  }

  /**
   * @description Sets the form data by fetching details for updating based on the provided data.
   */
  setCloneData() {
    if (this.isForUpdate) {
      if (this.data != null) {
        if (this.data.dataKey === 'mail-from') {
          this.subscriptions.push(
            this.checkService.getFromSingleId(this.data.id).subscribe((res) => {
              this.patchvalue(res);
            })
          );
        } else {
          this.subscriptions.push(
            this.checkService.getToSingleId(this.data.id).subscribe((res) => {
              this.patchvalue(res);
            })
          );
        }
      }
    }
  }

  /**
   * @description  Populates the form fields with data retrieved from an API response.
   * @param {IApiRes<IMailSingleShippingAddress>} res - The API response containing data to be patched into the form.
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
  }

  /**
   * @description Submits the mail form data/
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
        content:
          `Zip field only allow integer values for` + '<br>' + `United States`
      });
      return;
    }

    if (this.mailForm.valid) {
      this.disabled = true;

      if (!this.isForUpdate) {
        this.isSubmit = true;
        if (this.data.dataKey === 'mail-from') {
          this.subscriptions.push(
            this.checkService
              .addMailFrom(datas)
              .pipe(
                catchError((err) => {
                  this.catcherror(err);
                  return of(false);
                }),
                finalize(() => {
                  this.isSubmit = false;
                })
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
              })
          );
        } else {
          this.subscriptions.push(
            this.checkService
              .addMailTo(datas)
              .pipe(
                catchError((err) => {
                  this.catcherror(err);
                  return of(false);
                }),
                finalize(() => {
                  this.isSubmit = false;
                })
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
              })
          );
        }
      }
    }
  }

  catcherror(err: { error: { errorMsg: string } }) {
    this.err_msg = err.error.errorMsg;
    this.disabled = false;
  }

  /**
   * @description Updates existing 'Mail From' or 'Mail To' data by marking form fields as touched,
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
        content:
          `Zip field only allow integer values for` + '<br>' + `United States`
      });
      return;
    }
    
    this.disabled = true;
    if (this.isForUpdate) {
      this.isSubmit = true;
      if (this.data.dataKey === 'mail-from') {
        this.subscriptions.push(
          this.checkService
            .updateMailFrom(this.data.id, datas)
            .pipe(
              catchError((err) => {
                this.catcherror(err);
                return of(false);
              }),
              finalize(() => {
                this.isSubmit = false;
              })
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
            })
        );
      } else {
        this.subscriptions.push(
          this.checkService
            .updateMailTo(this.data.id, datas)
            .pipe(
              catchError((err) => {
                this.catcherror(err);
                return of(false);
              }),
              finalize(() => {
                this.isSubmit = false;
              })
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
            })
        );
      }
    }
  }

  /**
   * @description Deletes an address by displaying a confirmation alert and making an API call for deletion.
   */
  deleteid() {
    const data = {
      content: 'Are you sure you want to delete?'
    };

    const confirm = this.alert.confirmAlert(data);

    confirm.afterClosed().subscribe((result) => {
      if (result) {
        if (this.isForUpdate) {
          this.isSubmit = true;
          if (this.data.dataKey === 'mail-from') {
            this.subscriptions.push(
              this.checkService
                .deleteAddressFrom(this.data.id)
                .pipe(
                  catchError((err) => {
                    this.delcatcherr(err);

                    return of(false);
                  }),
                  finalize(() => {
                    this.isSubmit = false;
                  })
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
                })
            );
          } else {
            this.subscriptions.push(
              this.checkService
                .deleteAddressTo(this.data.id)
                .pipe(
                  catchError((err) => {
                    this.delcatcherr(err);
                    return of(false);
                  }),
                  finalize(() => {
                    this.isSubmit = false;
                  })
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
                })
            );
          }
        }
      }
    });
  }

  getAllowedCountries() {
    this.subscriptions.push(
      this.cloudBankService.allowedCountries.subscribe((res) => {
        this.allowedcountries = res;
        this.countries = Object.keys(this.allowedcountries);
       
      })
    );
  }

  delcatcherr(err: { error: { errorMsg: string } }) {
    this.err_msg = err.error.errorMsg;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}

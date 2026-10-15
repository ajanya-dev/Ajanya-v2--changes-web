import { GoogleAddressService } from './../../../../../core/services/google-address.service';
import { Utils } from 'src/app/data/utils';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import {
  UntypedFormArray,
  UntypedFormBuilder,
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
import { of, Subscription } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { V35ControlMessageComponent } from 'src/app/shared/v3/control-message-v35/control-message-v35.component';
import { NgFor, NgClass } from '@angular/common';

@Component({
  selector: 'app-update-bank-modal',
  templateUrl: './update-bank-modal.component.html',
  styleUrls: ['./update-bank-modal.component.scss'],
  standalone: true,
  imports: [
    MatDialogClose,
    FormsModule,
    ReactiveFormsModule,
    NgFor,
    MatDialogActions,
    NgClass,
    V35ControlMessageComponent
  ]
})
export class UpdateBankModalComponent implements OnInit, OnDestroy {
  // @ViewChild('payeeaddressline1', )  mailSearchElementRef!: ElementRef;

  EditPayeeForm: UntypedFormGroup;
  subscriptions: Subscription[] = [];

  payeeAddress: any[] = [];
  err_msg: any;
  array: any[] = [];
  utils = Utils;

  disabled = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public datas: any,
    private fb: UntypedFormBuilder,
    private _googleAddressService: GoogleAddressService,
    private _checkService: CheckService,
    private _alert: AlertService,
    public dialogRef: MatDialogRef<UpdateBankModalComponent>
  ) {}

  ngOnInit(): void {
    this.initFormGroup();

    this.payeeAddress = this.datas;

    this.setCloneData();

    this._googleAddressService.resetGoogleAutocompleteAPI();
  }

  // Load Google Address API
  loadGoogleAddress(address: HTMLInputElement, i: number) {
    this._googleAddressService.googleAutocomplete({
      addressElement: address,
      allowedCountries: ['us', 'ca'],
      addressInstance: i,
      dropdownMinWidth: 300
    });

    const googleAddressSubscription =
      this._googleAddressService.googleAddress$.subscribe((res) => {
        const invoice_type = this.getFormControls('item') as UntypedFormArray;
        const formGrp = invoice_type.controls[i] as UntypedFormGroup;

        formGrp.get('address_line_1')?.setValue(res.address);
        formGrp.get('city')?.setValue(res.city);
        formGrp.get('state')?.setValue(res.state);
        formGrp.get('zip')?.setValue(res.zip);
        formGrp.get('country')?.setValue(res.country);

        googleAddressSubscription.unsubscribe();
      });
  }

  addressFocus(event: any, i: number) {
    const googlescript = document.querySelector(`#agmGoogleMapsApiScript`);
    googlescript?.setAttribute('data-id', event.target.id);

    const googleAddedScript = document.querySelector(
      '[data-id="' + event.target.id + '"]'
    );

    if (!googleAddedScript) {
      this.loadGoogleAddress(event.target, i);
    } else {
      googleAddedScript.remove();
    }
  }
  //********************************************* initFormGroup ******************************** */

  initFormGroup() {
    this.EditPayeeForm = this.fb.group({
      item: this.fb.array([this.createPayeeMemoCtrl()])
    });
  }

  createPayeeMemoCtrl(): UntypedFormGroup {
    return this.fb.group({
      checkNo: [''],
      enc_id: [''],
      name: ['', [Validators.required, ValidationService.personNameValidator]],
      address_line_1: [''],
      address_line_2: [''],
      city: [''],
      state: ['', [Validators.required]],
      zip: [''],
      country: ['']
    });
  }

  getFormControl() {
    return this.EditPayeeForm.get('item') as UntypedFormArray;
  }

  getFormControls(name: string) {
    return this.EditPayeeForm?.get(name);
  }
  getFormValue() {
    return this.EditPayeeForm.get('item')?.value;
  }

  get userFormGroups() {
    return this.EditPayeeForm.get('item') as UntypedFormArray;
  }

  addCtrl() {
    this.userFormGroups.push(this.createPayeeMemoCtrl());
  }

  removeCtrl(i: number) {
    this.userFormGroups.removeAt(i);
  }

  setCloneData() {
    if (this.datas !== null) {
      if (this.datas.type === 'multi-update') {
        this.subscriptions.push(
          this._checkService
            .getbank({ ids: this.datas.id })
            .subscribe((res: any) => {
              this.datas.invalidbank.forEach((ele: any) => {
                this.array.push({
                  checkNo: ele.cheque_sno,
                  enc_id: ele.bank_account_id,
                  name: ele.bank_name,
                  address_line_1: ele.address.address_line_1,
                  address_line_2: ele.address.address_line_2,
                  city: ele.address.city,
                  state: ele.address.state,
                  zip: ele.address.zip,
                  country: ele.address.country
                });

                this.addCtrl();
                this.removeCtrl(res.data.length);
              });
              this.EditPayeeForm.patchValue({
                item: this.array
              });
            })
        );
      } else {
        this.subscriptions.push(
          this._checkService
            .getbank({ ids: [this.datas.id] })
            .subscribe((res: any) => {
              res.data.forEach((ele: any) => {
                this.array.push({
                  checkNo: this.datas.checkNo,
                  enc_id: ele.enc_id,
                  name: ele.bank_account_account_name,
                  address_line_1: ele.bank_account_address_line_1,
                  address_line_2: ele.bank_account_address_line_2,
                  city: ele.bank_account_city,
                  state: ele.bank_account_state,
                  zip: ele.bank_account_zip,
                  country: ele.bank_account_country
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

  //********************************************* Update  ******************************** */

  update() {
    this.EditPayeeForm.markAllAsTouched();
    if (!this.EditPayeeForm.valid) return;

    const payeeData = this.EditPayeeForm.value.item;

    this.disabled = true;

    this.subscriptions.push(
      this._checkService
        .updatebank(payeeData)
        .pipe(
          catchError(() => {
            this.disabled = false;
            return of(false);
          })
        )
        .subscribe((res: any) => {
          const Udata = {
            title: 'Success',
            content: 'Bank address updated',
            close: true,
            timeout: 2000
          };

          if (res.success && res.message != 'Updated') {
            const close = this._alert.successAlert(Udata);

            close.afterClosed().subscribe((result) => {
              if (result) {
                this.dialogRef.close(result);
              }
            });
          } else {
            this.disabled = false;
          }
        })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}

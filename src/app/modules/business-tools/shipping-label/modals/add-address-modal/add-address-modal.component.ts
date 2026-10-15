import { Component, Inject, OnInit } from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose
} from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { GoogleAddressService } from 'src/app/core/services/google-address.service';
import { IShippingLabelAddress } from 'src/app/modules/business-tools/shipping-label/model/shipping-label';
import { ShippingLabelService } from 'src/app/shared/service/shipping-label/shipping-label.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { CommonCountryDropDownComponent } from '../../../../../shared/v3/common-country-drop-down/common-country-drop-down.component';
import { NgxMaskDirective } from 'ngx-mask';
import { ControlMessageComponent } from '../../../../../shared/components/control-message/control-message/control-message.component';

interface IData {
  mode: string;
  type: string;
  address: IShippingLabelAddress;
  addressId: string;
}
@Component({
  selector: 'app-add-address-modal',
  templateUrl: './add-address-modal.component.html',
  styleUrls: ['./add-address-modal.component.scss'],
  standalone: true,
  imports: [
    MatDialogClose,
    FormsModule,
    ReactiveFormsModule,
    ControlMessageComponent,
    NgxMaskDirective,
    CommonCountryDropDownComponent
  ]
})
export class AddAddressModalComponent implements OnInit {
  subscription: Subscription[] = [];
  addressForm: UntypedFormGroup;
  loading = false;
  returnAddressId: string | undefined;
  fromAddressId: string | undefined;

  constructor(
    @Inject(MAT_DIALOG_DATA) public _data: IData,
    private _dialogRef: MatDialogRef<AddAddressModalComponent>,
    private _fb: UntypedFormBuilder,
    private _shippingLabelService: ShippingLabelService,
    private _googleAddressService: GoogleAddressService
  ) {}

  ngOnInit(): void {
    this.initForm();
    if (this._data.mode === 'Edit') {
      this.setaddressForm(this._data.address);
    }
    this._googleAddressService.resetGoogleAutocompleteAPI();
  }

  /**
   * @description Initializes the form group for the form.
   */
  initForm() {
    this.addressForm = this._fb.group({
      name: ['', [Validators.required]],
      nickName: ['', [Validators.required]],
      company: [''],
      phone: [
        '',
        [Validators.required, ValidationService.phoneNumberValidator]
      ],
      email: ['', [ValidationService.emailValidator]],
      address1: ['', [Validators.required]],
      address2: [''],
      city: ['', [Validators.required]],
      state: ['', [Validators.required]],
      country: ['', [Validators.required]],
      zip: ['', [Validators.required]]
    });
  }

  /**
   * @description Set data in the form.
   */
  setaddressForm(data: IShippingLabelAddress) {
    this.addressForm.patchValue({
      name: data?.name,
      nickName: data?.nickName,
      company: data?.company,
      phone: data?.phone,
      email: data?.email,
      address1: data?.address1,
      address2: data?.address2,
      city: data?.city,
      state: data?.state,
      country: data?.country,
      zip: data?.zip
    });
  }

  /**
   * @description Creates address body in form.
   */
  createAddressBody() {
    const body = this.addressForm.value;
    return {
      name: body.name,
      nickName: body.nickName,
      company: body.company,
      phone: body.phone,
      email: body.email,
      address1: body.address1,
      address2: body.address2,
      city: body.city,
      state: body.state,
      country: body.country,
      zip: body.zip,
      isReturnAddressSame: body.isReturnAddressSame
    };
  }

  /**
   * @description Submit address.
   */
  addAddress() {
    this.addressForm.markAllAsTouched();
    if (this.addressForm.invalid) {
      return;
    }
    if (this._data.type === 'addreturn') {
      this.createReturnAddress();
    }
    if (this._data.type === 'viewreturn') {
      this.updateReturnaddress(this._data.addressId);
    }

    if (this._data.type === 'delivery') {
      this.updateDeliveryAddress(this._data.addressId);
    }

    if (this._data.type === 'from') {
      this.updateFromAddress(this._data.addressId);
    }

    if (this._data.type === 'addfrom') {
      this.createFromAddress();
    }
  }

  /**
   * @description Create from address.
   */
  createFromAddress() {
    this.loading = true;
    const body = this.createAddressBody();
    this.subscription.push(
      this._shippingLabelService
        .createFromAddress(body)
        .pipe(finalize(() => (this.loading = false)))
        .subscribe((res) => {
          if (res?.success) {
            this.fromAddressId = res?.data?.id;
            this._dialogRef.close({
              res,
              data: body,
              id: res?.data?.id,
              type: 'from'
            });
          }
        })
    );
  }

  /**
   * @description Create return address.
   */
  createReturnAddress() {
    this.loading = true;
    const body = this.createAddressBody();
    this.subscription.push(
      this._shippingLabelService
        .createReturnAddress(body)
        .pipe(finalize(() => (this.loading = false)))
        .subscribe((res) => {
          if (res?.success) {
            this.returnAddressId = res?.data?.id;
            this._dialogRef.close({
              res,
              data: body,
              id: res?.data?.id,
              type: 'return'
            });
          }
        })
    );
  }

  /**
   * @description Update return address.
   */
  updateReturnaddress(returnAddressId: string) {
    const body = this.createAddressBody();
    this.loading = true;
    this.subscription.push(
      this._shippingLabelService
        .updateReturnAddress(returnAddressId, body)
        .pipe(finalize(() => (this.loading = false)))
        .subscribe((res) => {
          if (res?.success) {
            this._dialogRef.close({ res, data: body, type: 'return' });
          }
        })
    );
  }

  /**
   * @description Update delivery address.
   */
  updateDeliveryAddress(deliverAddressId: string) {
    const body = this.createAddressBody();
    this.loading = true;
    this.subscription.push(
      this._shippingLabelService
        .updateDeliveryAddress(deliverAddressId, body)
        .pipe(finalize(() => (this.loading = false)))
        .subscribe((res) => {
          if (res?.success) {
            this._dialogRef.close({ res, data: body });
          }
        })
    );
  }

  /**
   * @description Update from address.
   */
  updateFromAddress(fromAddressId: string) {
    const body = this.createAddressBody();
    this.loading = true;
    this.subscription.push(
      this._shippingLabelService
        .updateFromAddress(fromAddressId, body)
        .pipe(finalize(() => (this.loading = false)))
        .subscribe((res) => {
          if (res?.success) {
            this._dialogRef.close({ res, data: body, type: 'from' });
          }
        })
    );
  }

  /**
   * @description Load Google Address API.
   */
  loadGoogleAddress(address: HTMLInputElement) {
    this._googleAddressService.googleAutocomplete({
      addressElement: address,
      allowedCountries: ['us']
    });
    const googleAddressSubscription =
      this._googleAddressService.googleAddress$.subscribe((res) => {
        this.addressForm.patchValue({
          address1: res.address,
          city: res.city,
          state: res.state,
          country: res.country,
          zip: res.zip
        });
        googleAddressSubscription.unsubscribe();
      });
  }
}

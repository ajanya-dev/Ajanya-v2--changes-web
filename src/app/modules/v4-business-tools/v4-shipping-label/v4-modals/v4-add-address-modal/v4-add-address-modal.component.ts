import { Component, OnInit, computed, inject, signal } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { LucideAngularModule } from 'lucide-angular';
import { Subscription, Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { IApiRes } from 'src/app/models/api';
import { GoogleAddressService } from 'src/app/core/services/google-address.service';
import { IShippingLabelAddress } from 'src/app/modules/business-tools/shipping-label/model/shipping-label';
import { ShippingLabelService } from 'src/app/shared/service/shipping-label/shipping-label.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { V4ShippingAddressFormComponent } from '../../v4-components/v4-shipping-address-form/v4-shipping-address-form.component';

/**
 * Which address the modal is working on. `addfrom` / `addreturn` create, the rest
 * update an existing record identified by `addressId`.
 */
export type V4AddressModalType =
  | 'addfrom'
  | 'from'
  | 'addreturn'
  | 'viewreturn'
  | 'delivery';

export interface IV4AddAddressModalData {
  mode: 'Add' | 'Edit';
  type: V4AddressModalType;
  address?: IShippingLabelAddress;
  /** Callers historically pass a single id or a one element array. Both are accepted. */
  addressId?: string | string[];
}

/**
 * V4 replacement for the shipping label `AddAddressModalComponent`. Same endpoints,
 * same close payload, so every existing caller keeps working.
 */
/** Controls of the address form, matching `IShippingLabelAddress`. */
interface IAddressForm {
  name: FormControl<string>;
  nickName: FormControl<string>;
  company: FormControl<string>;
  phone: FormControl<string>;
  email: FormControl<string>;
  address1: FormControl<string>;
  address2: FormControl<string>;
  city: FormControl<string>;
  state: FormControl<string>;
  country: FormControl<string>;
  zip: FormControl<string>;
}

@Component({
  selector: 'app-v4-add-address-modal',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    LucideAngularModule,
    CommonButtonV4Component,
    V4ShippingAddressFormComponent
  ],
  templateUrl: './v4-add-address-modal.component.html'
})
export class V4AddAddressModalComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<V4AddAddressModalComponent>);
  private fb = inject(FormBuilder);
  private shippingLabelService = inject(ShippingLabelService);
  private googleAddressService = inject(GoogleAddressService);

  data = inject<IV4AddAddressModalData>(MAT_DIALOG_DATA);

  subscriptions: Subscription[] = [];
  loading = signal<boolean>(false);

  isEditMode = computed(() => this.data?.mode === 'Edit');

  addressForm: FormGroup<IAddressForm> = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    nickName: ['', [Validators.required]],
    company: [''],
    phone: ['', [Validators.required, ValidationService.phoneNumberValidator]],
    email: ['', [ValidationService.emailValidator]],
    address1: ['', [Validators.required]],
    address2: [''],
    city: ['', [Validators.required]],
    state: ['', [Validators.required]],
    country: ['US', [Validators.required]],
    zip: ['', [Validators.required]]
  });

  ngOnInit(): void {
    if (this.isEditMode()) {
      this.setAddressForm(this.data.address);
    }
    this.googleAddressService.resetGoogleAutocompleteAPI();
  }

  /**
   * @description Set address data in form.
   */
  setAddressForm(data: IShippingLabelAddress | undefined): void {
    if (!data) return;
    this.addressForm.patchValue({
      name: data?.name,
      nickName: data?.nickName,
      company: data?.company,
      phone: data?.phone?.substring(data.phone.length - 10, data.phone.length),
      email: data?.email,
      address1: data?.address1,
      address2: data?.address2,
      city: data?.city,
      state: data?.state,
      country: data?.country || 'US',
      zip: data?.zip
    });
  }

  /**
   * @description Submit the address against the endpoint matching the modal type.
   */
  saveAddress(): void {
    this.addressForm.markAllAsTouched();
    if (this.addressForm.invalid) {
      return;
    }

    const body = this.addressForm.getRawValue();
    const request = this.addressRequest(body);
    if (!request) return;

    this.loading.set(true);
    this.subscriptions.push(
      request.pipe(finalize(() => this.loading.set(false))).subscribe((res) => {
        if (res?.success) {
          this.dialogRef.close({
            res,
            data: body,
            id: res?.data?.id,
            type: this.closeType()
          });
        }
      })
    );
  }

  closeModal(): void {
    this.dialogRef.close(false);
  }

  /**
   * @description Pick the create or update call for the address being edited.
   */
  private addressRequest(
    body: IShippingLabelAddress
  ): Observable<IApiRes<IShippingLabelAddress>> | null {
    const addressId = this.addressId();
    switch (this.data?.type) {
      case 'addfrom':
        return this.shippingLabelService.createFromAddress(body);
      case 'addreturn':
        return this.shippingLabelService.createReturnAddress(body);
      case 'from':
        return this.shippingLabelService.updateFromAddress(addressId, body);
      case 'viewreturn':
        return this.shippingLabelService.updateReturnAddress(addressId, body);
      case 'delivery':
        return this.shippingLabelService.updateDeliveryAddress(addressId, body);
      default:
        return null;
    }
  }

  /**
   * @description Callers pass either the id or a single element array holding it.
   */
  private addressId(): string {
    const id = this.data?.addressId;
    return String((Array.isArray(id) ? id[0] : id) ?? '');
  }

  /**
   * @description Callers branch on this to know which address came back.
   */
  private closeType(): string | undefined {
    switch (this.data?.type) {
      case 'addfrom':
      case 'from':
        return 'from';
      case 'addreturn':
      case 'viewreturn':
        return 'return';
      default:
        return undefined;
    }
  }
}

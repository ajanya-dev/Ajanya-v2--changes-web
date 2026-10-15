import {
  Component,
  DestroyRef,
  EventEmitter,
  OnChanges,
  Output,
  inject,
  input,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { finalize } from 'rxjs/operators';
import {
  IAddressDetails,
  IShippingData,
  IShippingLabelAddress,
  ShippingSteps
} from 'src/app/modules/business-tools/shipping-label/model/shipping-label';
import { ShippingLabelService } from 'src/app/shared/service/shipping-label/shipping-label.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { V4ShippingAddressFormComponent } from '../v4-shipping-address-form/v4-shipping-address-form.component';

/** Controls of the delivery address form, matching `IShippingLabelAddress`. */
interface IDeliveryAddressForm {
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
  selector: 'app-v4-delivery-address-step',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonButtonV4Component,
    V4ShippingAddressFormComponent
  ],
  templateUrl: './v4-delivery-address-step.component.html'
})
export class V4DeliveryAddressStepComponent implements OnChanges {
  private destroyRef = inject(DestroyRef);
  private fb = inject(FormBuilder);
  private shippingLabelService = inject(ShippingLabelService);

  shipping_data = input.required<IShippingData>();
  packageType = input.required<string>();
  @Output() emitData = new EventEmitter<IShippingData>();

  deliverAddrForm: FormGroup<IDeliveryAddressForm> = this.fb.nonNullable.group({
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

  loading = signal(false);
  isExistaddress = false;
  deliverAddressId: string | null | undefined;
  addressDetails: IAddressDetails | undefined;
  nextStep: ShippingSteps;
  prevStep: ShippingSteps;

  ngOnChanges(): void {
    this.setForm(this.shipping_data());
    if (this.shipping_data()?.data.nextStep === 'delivery_address') {
      this.resetDeliverForm(this.shipping_data());
    }
  }

  

  /**
   * @description Set address data in form.
   */
  setaddressForm(data: IShippingLabelAddress): void {
    this.deliverAddrForm.patchValue({
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
   * @description Set address form from an existing address selection.
   */
  setForm(shippingData: IShippingData): void {
    if (
      shippingData?.data.nextStep === 'delivery_address' &&
      shippingData?.data.prevStep === 'existing_addr' &&
      shippingData?.data?.selectedDeliveryAddress
    ) {
      this.setaddressForm(shippingData.data.selectedDeliveryAddress);
    }
  }

  /**
   * @description Reset the form when the selected address was deleted.
   */
  resetDeliverForm(shippingData: IShippingData): void {
    if (
      shippingData?.data.deletedDeliverId !== undefined &&
      shippingData?.data.deletedDeliverId ===
        shippingData?.data.addressDetails?.deliverAddressId
    ) {
      this.deliverAddrForm.reset({ country: 'US' });
      this.shipping_data().data.addressDetails = { deliverAddressId: null };
    }
  }

  /**
   * @description Click to next page.
   */
  nextstep(): void {
    this.isExistaddress = false;
    this.submit();
  }

  /**
   * @description Submit address form.
   */
  submit(): void {
    this.deliverAddrForm.markAllAsTouched();
    if (this.deliverAddrForm.invalid) {
      return;
    }
    this.addressDetails = this.shipping_data()?.data?.addressDetails;

    if (!this.addressDetails?.deliverAddressId) {
      this.createDeliveryAddress();
    } else {
      this.updateDeliveryAddress(this.addressDetails.deliverAddressId);
    }
  }

  /**
   * @description Add delivery address.
   */
  createDeliveryAddress(): void {
    this.loading.set(true);
    this.shippingLabelService
      .saveDeliveryAddress(this.deliverAddrForm.getRawValue())
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false))
      )
      .subscribe((res) => {
        if (res?.success) {
          this.deliverAddressId = res.data?.id;
          this.nextStep = 'from_address';
          this.prevStep = 'delivery_address';
          this.onNextStep();
        }
      });
  }

  /**
   * @description Update delivery address.
   */
  updateDeliveryAddress(deliverAddressId: string): void {
    this.loading.set(true);
    this.shippingLabelService
      .updateDeliveryAddress(
        deliverAddressId,
        this.deliverAddrForm.getRawValue()
      )
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false))
      )
      .subscribe((res) => {
        if (res?.success) {
          this.deliverAddressId = deliverAddressId;
          this.nextStep = 'from_address';
          this.onNextStep();
        }
      });
  }

  /**
   * @description Click to existing addresses page.
   */
  openExistingAddress(): void {
    this.isExistaddress = true;
    this.nextStep = 'existing_addr';
    this.prevStep = 'delivery_address';
    this.onNextStep();
  }

  /**
   * @description Pass data when moving to the next step.
   */
  onNextStep(): void {
    this.emitData.next({
      success: true,
      data: {
        nextStep: this.nextStep,
        prevStep: this.prevStep,
        addressDetails: {
          deliverAddressId: this.deliverAddressId,
          fromAddressId:
            this.shipping_data()?.data?.addressDetails?.fromAddressId
        },
        packageType: this.packageType(),
        selectedFromAddress: this.shipping_data()?.data?.selectedFromAddress,
        selectedDeliveryAddress:
          this.shipping_data()?.data?.selectedDeliveryAddress,
        carrierType: this.shipping_data()?.data?.carrierType,
        isExistaddress: this.isExistaddress,
        fromAddressExist: this.shipping_data()?.data?.fromAddressExist
      }
    });
  }
}

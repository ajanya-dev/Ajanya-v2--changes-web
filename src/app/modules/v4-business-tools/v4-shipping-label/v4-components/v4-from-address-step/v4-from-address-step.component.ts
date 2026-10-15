import {
  Component,
  DestroyRef,
  OnChanges,
  inject,
  input,
  output,
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
import { MatDialog } from '@angular/material/dialog';
import { MatTooltip } from '@angular/material/tooltip';
import { LucideAngularModule } from 'lucide-angular';
import { finalize } from 'rxjs/operators';
import {
  IShippingData,
  IShippingLabelAddress,
  ShippingSteps
} from 'src/app/modules/business-tools/shipping-label/model/shipping-label';
import { V4AddAddressModalComponent } from '../../v4-modals/v4-add-address-modal/v4-add-address-modal.component';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { ShippingLabelService } from 'src/app/shared/service/shipping-label/shipping-label.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { V4ShippingAddressFormComponent } from '../v4-shipping-address-form/v4-shipping-address-form.component';

/**
 * Controls of the from address form. Everything but `isReturnAddressSame` maps
 * onto `IShippingLabelAddress`, which is what the create endpoint takes.
 */
interface IFromAddressForm {
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
  isReturnAddressSame: FormControl<number>;
}

@Component({
  selector: 'app-v4-from-address-step',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    LucideAngularModule,
    MatTooltip,
    CommonButtonV4Component,
    V4ShippingAddressFormComponent
  ],
  templateUrl: './v4-from-address-step.component.html'
})
export class V4FromAddressStepComponent implements OnChanges {
  private destroyRef = inject(DestroyRef);
  private dialog = inject(MatDialog);
  private fb = inject(FormBuilder);
  private shippingLabelService = inject(ShippingLabelService);
  private alertService = inject(V4AlertService);

  shipping_data = input.required<IShippingData>();
  emitData = output<IShippingData>();

  fromAddrForm: FormGroup<IFromAddressForm> = this.fb.nonNullable.group({
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
    zip: ['', [Validators.required]],
    isReturnAddressSame: [1]
  });

  loading = signal(false);
  isReturnAddressSame = signal(true);
  isViewReturn = signal(false);
  isExistaddress = false;
  fromAddressExist = false;
  fromAddressId: string | null | undefined;
  returnAddressId: string | null | undefined;
  returnAddress: IShippingLabelAddress;
  nextStep: ShippingSteps;
  prevStep: ShippingSteps;

  ngOnChanges(): void {
    this.setSelectedAddress();
  }

  /**
   * @description Set address data in form.
   */
  setaddressForm(data: IShippingLabelAddress): void {
    this.fromAddrForm.patchValue({
      name: data?.name,
      company: data?.company,
      nickName: data?.nickName,
      phone: data?.phone?.substring(data.phone.length - 10, data.phone.length),
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
   * @description Prefill from an existing address or the user profile address.
   */
  setSelectedAddress(): void {
    const data = this.shipping_data()?.data;
    if (data?.nextStep !== 'from_address') return;

    if (data?.selectedFromAddress) {
      if (data?.prevStep === 'existing_addr') {
        this.setaddressForm(data.selectedFromAddress);
        this.fromAddressId = data.selectedFromAddress?.id;
        this.setFromData();
      }
      return;
    }

    if (
      data?.prevStep !== 'existing_addr' &&
      data?.prevStep !== 'from_address' &&
      data?.prevStep === 'delivery_address' &&
      !data?.fromAddressExist
    ) {
      this.getUserAddress();
      this.fromAddressExist = true;
    }
  }

  /**
   * @description Get user address to set in address form.
   */
  getUserAddress(): void {
    this.shippingLabelService
      .getUserAddress()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res.success) {
          this.setaddressForm(res?.result);
          this.fromAddressId = res?.result?.id;
          this.setFromData();
        }
      });
  }

  /**
   * @description Open existing from addresses page.
   */
  openExistingAddress(): void {
    this.isExistaddress = true;
    this.nextStep = 'existing_addr';
    this.prevStep = 'from_address';
    this.onNextStep();
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
    this.fromAddrForm.markAllAsTouched();
    if (this.fromAddrForm.invalid) {
      return;
    }

    if (
      !this.isViewReturn() &&
      !this.fromAddrForm.controls.isReturnAddressSame.value
    ) {
      this.alertService.warningAlert({
        content: 'Return address is required'
      });
      return;
    }
    this.createFromAddress();
  }

  /**
   * @description Create from address.
   */
  createFromAddress(): void {
    this.loading.set(true);
    this.shippingLabelService
      .createFromAddress(this.fromAddrForm.getRawValue())
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false))
      )
      .subscribe((res) => {
        if (res?.success) {
          if (res.data?.returnAddressId != null) {
            this.returnAddressId = res.data?.returnAddressId;
          }
          this.fromAddressId = res.data?.id;
          this.nextPage();
        }
      });
  }

  /**
   * @description Keep the collected address ids on the wizard payload.
   */
  setFromData(): void {
    if (!this.shipping_data()) return;
    this.shipping_data().data.addressDetails = {
      deliverAddressId:
        this.shipping_data().data.addressDetails?.deliverAddressId,
      fromAddressId: this.fromAddressId,
      returnAddressId: this.returnAddressId
    };
  }

  /**
   * @description Card and Letter skip the package details step.
   */
  nextPage(): void {
    const packageType = this.shipping_data()?.data?.packageType;
    this.nextStep =
      packageType === 'Card' || packageType === 'Letter'
        ? 'rate_page'
        : 'package_page';
    this.onNextStep();
  }

  /**
   * @description Click to back page.
   */
  backstep(): void {
    this.nextStep = 'delivery_address';
    this.prevStep = 'from_address';
    this.fromAddressExist = true;
    this.onNextStep();
  }

  /**
   * @description Passing data to the next page.
   */
  onNextStep(): void {
    this.emitData.emit({
      success: true,
      data: {
        nextStep: this.nextStep,
        prevStep: this.prevStep,
        addressDetails: {
          deliverAddressId:
            this.shipping_data()?.data?.addressDetails?.deliverAddressId,
          fromAddressId: this.fromAddressId,
          returnAddressId: this.returnAddressId
        },
        packageType: this.shipping_data()?.data?.packageType,
        selectedFromAddress: this.shipping_data()?.data?.selectedFromAddress,
        selectedDeliveryAddress:
          this.shipping_data()?.data?.selectedDeliveryAddress,
        carrierType: this.shipping_data()?.data?.carrierType,
        isExistaddress: this.isExistaddress,
        fromAddressExist: this.fromAddressExist
      }
    });
  }

  /**
   * @description Toggle whether the return address is the same as the from address.
   * Unchecking means one has to be entered, so the address modal is offered.
   */
  toggleReturnAddress(): void {
    const isSame = !this.isReturnAddressSame();
    this.isReturnAddressSame.set(isSame);
    this.fromAddrForm.controls.isReturnAddressSame.setValue(isSame ? 1 : 0);

    if (isSame) return;

    const alert = this.alertService.warningAlert({
      content: 'Please add Return Address'
    });
    alert.afterClosed().subscribe((res) => {
      if (res) {
        this.addAddress();
      }
    });
  }

  /**
   * @description Add return address.
   */
  addAddress(): void {
    const dialogRef = this.dialog.open(V4AddAddressModalComponent, {
      width: '700px',
      maxWidth: '95vw',
      autoFocus: false,
      panelClass: 'paddingless-modal-rounded',
      data: { mode: 'Add', type: 'addreturn' }
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (!res) return;
      this.alertService.successAlert({
        title: 'Success',
        content: 'Address added',
        close: true
      });
      this.returnAddress = res.data;
      this.returnAddressId = res.id;
      this.isViewReturn.set(true);
      this.isReturnAddressSame.set(false);
      this.fromAddrForm.controls.isReturnAddressSame.setValue(0);
      this.setFromData();
    });
  }

  /**
   * @description Edit return address.
   */
  editAddress(): void {
    const dialogRef = this.dialog.open(V4AddAddressModalComponent, {
      width: '700px',
      maxWidth: '95vw',
      autoFocus: false,
      panelClass: 'paddingless-modal-rounded',
      data: {
        mode: 'Edit',
        type: 'viewreturn',
        addressId: this.returnAddressId,
        address: this.returnAddress
      }
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (!res?.res?.success) return;
      this.alertService.successAlert({
        title: 'Success',
        content: 'Address updated',
        close: true
      });
      this.returnAddress = res.data;
      this.setFromData();
    });
  }
}

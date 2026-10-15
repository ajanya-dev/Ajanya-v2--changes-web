import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  inject,
  signal
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import {
  IAddressDetails,
  IShippingData,
  ShippingSteps
} from 'src/app/modules/business-tools/shipping-label/model/shipping-label';
import { ShippingLabelService } from 'src/app/shared/service/shipping-label/shipping-label.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';
import {
  IV4SelectOption,
  V4SelectDropdownComponent
} from 'src/app/shared/V4/v4-select-dropdown/v4-select-dropdown.component';

/** Controls of the parcel dimensions form. */
interface IPackageDetailsForm {
  length: FormControl<string>;
  width: FormControl<string>;
  height: FormControl<string>;
  weight: FormControl<string>;
  unit: FormControl<string>;
}

@Component({
  selector: 'app-v4-package-details-step',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonButtonV4Component,
    CommonInputFieldV4Component,
    V4ControlMessageComponent,
    V4SelectDropdownComponent
  ],
  templateUrl: './v4-package-details-step.component.html'
})
export class V4PackageDetailsStepComponent implements OnChanges, OnDestroy {
  private fb = inject(FormBuilder);
  private shippingLabelService = inject(ShippingLabelService);

  @Input() shipping_data: IShippingData;
  @Output() emitData = new EventEmitter<IShippingData>();

  packageForm: FormGroup<IPackageDetailsForm> = this.fb.nonNullable.group({
    length: ['', [Validators.required]],
    width: ['', [Validators.required]],
    height: ['', [Validators.required]],
    weight: ['', [Validators.required]],
    unit: ['lb']
  });

  /** Read-only mirror of the type picked on the first step, shown above the dimensions. */
  packageTypeControl = new FormControl<string>({ value: '', disabled: true });

  weightUnitOptions: IV4SelectOption[] = [
    { id: 'lb', value: 'lb', name: 'lb' },
    { id: 'oz', value: 'oz', name: 'oz' },
    { id: 'kg', value: 'kg', name: 'kg' },
    { id: 'gm', value: 'gm', name: 'gm' }
  ];

  subscriptions: Subscription[] = [];
  loading = signal(false);
  packageType: string | undefined;
  addressDetails: IAddressDetails | undefined;
  detailsAddressId: string | undefined;
  nextStep: ShippingSteps;

  ngOnChanges(): void {
    if (this.shipping_data?.data?.nextStep === 'package_page') {
      this.packageType = this.shipping_data?.data?.packageType;
      this.packageTypeControl.setValue(this.packageType ?? '');
      this.addressDetails = this.shipping_data?.data?.addressDetails;
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  onChangeUnit(unit: string): void {
    this.packageForm.controls.unit.setValue(unit);
  }

  /**
   * @description Click to next page.
   */
  nextstep(): void {
    this.packageForm.markAllAsTouched();
    if (this.packageForm.invalid) {
      return;
    }
    this.createParcel();
  }

  /**
   * @description Save the parcel dimensions.
   */
  createParcel(): void {
    const data = this.packageForm.getRawValue();
    const body = {
      deliverAddressId: this.addressDetails?.deliverAddressId,
      fromAddressId: this.addressDetails?.fromAddressId,
      returnAddressId: this.addressDetails?.returnAddressId,
      detailsAddressId: this.addressDetails?.detailsAddressId,
      length: data.length,
      width: data.width,
      height: data.height,
      weight: data.weight,
      unit: data.unit
    };
    this.loading.set(true);
    this.subscriptions.push(
      this.shippingLabelService
        .createParcel(body)
        .pipe(finalize(() => this.loading.set(false)))
        .subscribe((res) => {
          if (res?.success) {
            this.detailsAddressId = res?.data?.id;
            this.nextStep = 'rate_page';
            this.onNext();
          }
        })
    );
  }

  /**
   * @description Click to back page.
   */
  backstep(): void {
    this.nextStep = 'from_address';
    this.onNext();
  }

  /**
   * @description Pass data to the next page.
   */
  onNext(): void {
    this.emitData.next({
      success: true,
      data: {
        nextStep: this.nextStep,
        packageType: this.packageType,
        addressDetails: {
          deliverAddressId: this.addressDetails?.deliverAddressId,
          fromAddressId: this.addressDetails?.fromAddressId,
          returnAddressId: this.addressDetails?.returnAddressId,
          detailsAddressId: this.detailsAddressId
        },
        selectedFromAddress: this.shipping_data?.data?.selectedFromAddress,
        selectedDeliveryAddress:
          this.shipping_data?.data?.selectedDeliveryAddress
      }
    });
  }
}

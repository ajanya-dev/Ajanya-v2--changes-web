import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output
} from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { Utils } from 'src/app/data/utils';
import {
  IAddressDetails,
  IShippingData,
  ShippingSteps
} from 'src/app/modules/business-tools/shipping-label/model/shipping-label';
import { ShippingLabelService } from 'src/app/shared/service/shipping-label/shipping-label.service';
import { NgClass, NgIf } from '@angular/common';
import { ControlMessageComponent } from '../../../../../shared/components/control-message/control-message/control-message.component';
import { NgxMaskDirective } from 'ngx-mask';

@Component({
  selector: 'app-package-shipping-label',
  templateUrl: './package-shipping-label.component.html',
  styleUrls: ['./package-shipping-label.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    NgxMaskDirective,
    ControlMessageComponent,
    NgClass,
    NgIf
  ]
})
export class PackageShippingLabelComponent implements OnInit, OnChanges {
  @Input() shipping_data: IShippingData;
  @Output() emitData = new EventEmitter<IShippingData>();

  utils = Utils;
  subscriptions: Subscription[] = [];
  packageForm: UntypedFormGroup;
  currentStep: 'package' | 'rate' = 'package';
  typeName = 'USPS';
  typePlaceHolder = 'Select the postal service';
  postalType = [
    { value: '1', name: 'USPS' },
    { value: '2', name: 'Fedex' }
  ];
  packageType: string | undefined;
  loading = false;
  addressDetails: IAddressDetails | undefined;
  detailsAddressId: string | undefined;
  nextStep: ShippingSteps;
  prevStep: ShippingSteps;

  constructor(
    private _fb: UntypedFormBuilder,
    private _shippingLabelService: ShippingLabelService
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  ngOnChanges() {
    if (this.shipping_data?.data?.nextStep === 'package_page') {
      this.packageType = this.shipping_data?.data?.packageType;
      this.addressDetails = this.shipping_data?.data?.addressDetails;
    }
  }

  /**
   * @description Initializes the form group for the form.
   */
  initForm() {
    this.packageForm = this._fb.group({
      length: ['', [Validators.required]],
      width: ['', [Validators.required]],
      height: ['', [Validators.required]],
      weight: ['', [Validators.required]],
      unit: ['lb']
    });
  }

  /**
   * @description Creates data in from.
   */
  createParcelBody() {
    const data = this.packageForm.value;
    return {
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
  }

  /**
   * @description Click to next page.
   */
  nextstep() {
    this.submit();
  }

  /**
   * @description Submit form.
   */
  submit() {
    this.packageForm.markAllAsTouched();
    if (this.packageForm.invalid) {
      return;
    }
    this.createParcel();
  }

  /**
   * @description Add parcel in form.
   */
  createParcel() {
    this.loading = true;
    this.subscriptions.push(
      this._shippingLabelService
        .createParcel(this.createParcelBody())
        .pipe(finalize(() => (this.loading = false)))
        .subscribe((res) => {
          if (res?.success) {
            this.detailsAddressId = res?.data?.id;
            (this.nextStep = 'rate_page'), this.onNext();
          }
        })
    );
  }

  /**
   * @description Pass data to next page.
   */
  onNext(): void {
    const data: IShippingData = {
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
    };
    this.onEmit(data);
  }

  /**
   * @description Emit data to next page.
   */
  onEmit(data: IShippingData): void {
    this.emitData.next(data);
  }

  /**
   * @description Click to back page.
   */
  backstep() {
    (this.nextStep = 'from_address'), this.onNext();
  }
}

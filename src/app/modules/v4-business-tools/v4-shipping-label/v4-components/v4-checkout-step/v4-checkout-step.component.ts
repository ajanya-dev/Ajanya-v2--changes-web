import {
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule
} from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { finalize } from 'rxjs/operators';
import {
  IAddressDetails,
  ICarrierData,
  IGetPrintSize,
  IParcelDetails,
  IShippingData
} from 'src/app/modules/business-tools/shipping-label/model/shipping-label';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { ShippingLabelService } from 'src/app/shared/service/shipping-label/shipping-label.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';

/** Controls of the checkout step form. */
interface ICheckoutForm {
  parcelType: FormControl<IParcelDetails | null>;
  comment: FormControl<string>;
  printSize: FormControl<string>;
}

@Component({
  selector: 'app-v4-checkout-step',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    LucideAngularModule,
    CommonButtonV4Component,
    CommonInputFieldV4Component
  ],
  templateUrl: './v4-checkout-step.component.html'
})
export class V4CheckoutStepComponent implements OnChanges {
  private destroyRef = inject(DestroyRef);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private shippingLabelService = inject(ShippingLabelService);
  private alertService = inject(V4AlertService);

  @Input() shipping_data: IShippingData;
  @Output() emitData = new EventEmitter<IShippingData>();

  checkoutForm: FormGroup<ICheckoutForm> = this.fb.group({
    parcelType: this.fb.control<IParcelDetails | null>(null),
    comment: this.fb.nonNullable.control(''),
    printSize: this.fb.nonNullable.control('')
  });

  loading = signal(false);
  ratesLoading = signal(false);
  showNoResult = signal(false);

  uspsDetails = signal<IParcelDetails[]>([]);
  fedexDetails = signal<IParcelDetails[]>([]);
  printSizes = signal<IGetPrintSize[]>([]);
  selectedPrintSize = signal<string>('');
  selectedRateKey = signal<string>('');

  packageType: string | undefined;
  addressDetails: IAddressDetails | undefined;
  detailsAddressId: string | undefined;

  ngOnChanges(): void {
    if (this.shipping_data?.data?.nextStep === 'rate_page') {
      this.packageType = this.shipping_data.data.packageType;
      this.addressDetails = this.shipping_data.data.addressDetails;
      this.detailsAddressId =
        this.shipping_data.data.addressDetails?.detailsAddressId;
      this.getParcelDetails();
    }
  }

  rateKey(carrier: 'USPS' | 'FedEx', index: number): string {
    return `${carrier}_${index}`;
  }

  /**
   * @description Select a carrier service.
   */
  selectRate(
    carrier: 'USPS' | 'FedEx',
    index: number,
    parcel: IParcelDetails
  ): void {
    this.selectedRateKey.set(this.rateKey(carrier, index));
    this.checkoutForm.controls.parcelType.setValue(parcel);
    this.getPrintsizes(parcel);
  }

  /**
   * @description Get print sizes for the selected service.
   */
  getPrintsizes(parcelType: IParcelDetails): void {
    const carrier: ICarrierData = {
      carrierName: parcelType.carrier,
      packageCode: this.packageType,
      service: parcelType?.service
    };
    this.shippingLabelService
      .getPrintSizes(carrier)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        const sizes = res.data ?? [];
        this.printSizes.set(sizes);
        if (sizes.length) {
          this.checkoutForm.patchValue({ printSize: sizes[0].name });
          this.selectedPrintSize.set(sizes[0].name);
        }
      });
  }

  /**
   * @description Get the available rates.
   */
  getParcelDetails(): void {
    const data = this.addressDetails;
    const body = {
      detailsAddressId: data?.detailsAddressId,
      fromAddressId: data?.fromAddressId,
      returnAddressId: data?.returnAddressId,
      deliverAddressId: data?.deliverAddressId,
      packageCode: this.packageType,
      printSize: this.checkoutForm.controls.printSize.value
    };
    this.ratesLoading.set(true);
    this.shippingLabelService
      .buyShipment(body)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.ratesLoading.set(false))
      )
      .subscribe((res) => {
        if (!res.success) return;
        const usps = res.data?.services?.USPS ?? [];
        const fedex = res.data?.services?.FedEx ?? [];
        this.uspsDetails.set(usps);
        this.fedexDetails.set(fedex);
        this.detailsAddressId = res.data?.detailsAddressId;
        this.showNoResult.set(res?.rowCount === 0);
        if (res?.rowCount === 0) {
          this.printSizes.set([]);
          return;
        }

        if (usps.length) {
          this.selectRate('USPS', 0, usps[0]);
        } else if (fedex.length) {
          this.selectRate('FedEx', 0, fedex[0]);
        }
      });
  }

  /**
   * @description Print the label.
   */
  nextStep(): void {
    this.checkoutForm.markAllAsTouched();
    if (this.checkoutForm.invalid) {
      return;
    }
    this.printLabel();
  }

  printLabel(): void {
    const parcelType = this.checkoutForm.controls.parcelType.value;
    this.loading.set(true);
    this.shippingLabelService
      .printShipment({
        shipmentId: parcelType?.shipmentId,
        service: parcelType?.service,
        detailsAddressId: this.detailsAddressId,
        indexId: parcelType?.indexId,
        carrier: parcelType?.carrier,
        comment: this.checkoutForm.controls.comment.value
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false))
      )
      .subscribe((res) => {
        if (res?.success) {
          window.open(res?.data?.url);
          this.openSuccessAlert('Shipping Label Printed');
        }
      });
  }

  /**
   * @description Click to back page.
   */
  backstep(): void {
    const details = this.shipping_data;
    if (
      details.data.packageType === 'Card' ||
      details.data.packageType === 'Letter'
    ) {
      details.data.nextStep = 'from_address';
      details.data.prevStep = 'rate_page';
    } else {
      details.data.nextStep = 'package_page';
    }
    this.emitData.next(details);
  }

  private openSuccessAlert(content: string): void {
    this.alertService
      .successAlert({
        title: 'Success',
        content,
        doneMsg: 'OK',
        close: false
      })
      .afterClosed()
      .subscribe(() => {
        this.router.navigate(['/v4/manage/business-tools/shipping-label']);
      });
  }
}

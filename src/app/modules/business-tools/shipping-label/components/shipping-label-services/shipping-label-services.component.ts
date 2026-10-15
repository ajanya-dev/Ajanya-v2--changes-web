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
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import {
  IAddressDetails,
  ICarrierData,
  IGetPrintSize,
  IParcelDetails,
  IShippingData
} from 'src/app/modules/business-tools/shipping-label/model/shipping-label';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { ShippingLabelService } from 'src/app/shared/service/shipping-label/shipping-label.service';
import { ControlMessageComponent } from '../../../../../shared/components/control-message/control-message/control-message.component';
import { MatRadioGroup, MatRadioButton } from '@angular/material/radio';
import { NgIf, NgFor, NgClass } from '@angular/common';

@Component({
  selector: 'app-shipping-label-services',
  templateUrl: './shipping-label-services.component.html',
  styleUrls: ['./shipping-label-services.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    NgIf,
    MatRadioGroup,
    NgFor,
    MatRadioButton,
    ControlMessageComponent,
    NgClass
  ]
})
export class ShippingLabelServicesComponent implements OnInit, OnChanges {
  @Input() shipping_data: IShippingData;
  @Output() emitData = new EventEmitter<IShippingData>();

  subscriptions: Subscription[] = [];
  checkoutForm: UntypedFormGroup;
  typeName = 'USPS';
  typePlaceHolder = 'Select the postal service';
  carrierType = [
    { value: 'USPS', name: 'USPS' },
    { value: 'Fedex', name: 'Fedex' }
  ];
  packageType: string | undefined;
  loading = false;
  spinnerloading = false;
  addressDetails: IAddressDetails | undefined;
  uspsDetails: IParcelDetails[];
  fedexDetails: IParcelDetails[];
  parcelType: IParcelDetails;
  detailsAddressId: string | undefined;
  postalType: string;
  showNoResult = false;
  printSizes: IGetPrintSize[] | undefined;
  selectedSize: string;

  constructor(
    private _fb: UntypedFormBuilder,
    private _shippingLabelService: ShippingLabelService,
    private _alertService: AlertService,
    private _router: Router
  ) {}

  ngOnInit() {
    this.initForm();
    this.setCarrierType();
  }

  ngOnChanges() {
    if (this.shipping_data?.data?.nextStep === 'rate_page') {
      this.packageType = this.shipping_data.data.packageType;
      this.addressDetails = this.shipping_data.data.addressDetails;
      this.detailsAddressId =
        this.shipping_data.data.addressDetails?.detailsAddressId;
      this.getParcelDetails();
    }
  }

  /**
   * @description Initializes the form group for the form.
   */
  initForm() {
    this.checkoutForm = this._fb.group({
      parcelType: [''],
      comment: [''],
      printSize: ['', [Validators.required]]
    });
  }

  /**
   * @description creates data in form.
   */
  checkoutBody() {
    const data = this.addressDetails;
    return {
      detailsAddressId: data?.detailsAddressId,
      fromAddressId: data?.fromAddressId,
      returnAddressId: data?.returnAddressId,
      deliverAddressId: data?.deliverAddressId,
      packageCode: this.packageType,
      printSize: this.checkoutForm.value.printSize
    };
  }

  /**
   * @description Set datas for print function.
   */
  printBody() {
    this.parcelType = this.checkoutForm.controls.parcelType.value;
    return {
      shipmentId: this.parcelType?.shipmentId,
      service: this.parcelType?.service,
      detailsAddressId: this.detailsAddressId,
      indexId: this.parcelType?.indexId,
      carrier: this.parcelType?.carrier,
      comment: this.checkoutForm.controls.comment.value
    };
  }

  /**
   * @description Set parcel type to get print sizes.
   */
  setParceltType(event: { value: string }) {
    this.checkoutForm.controls.parcelType.setValue(event.value);
    this.parcelType = this.checkoutForm.controls.parcelType.value;
    if (this.parcelType) {
      this.getPrintsizes(this.parcelType);
    }
  }

  /**
   * @description Set carrier type.
   */
  setCarrierType() {
    this.postalType = this.carrierType[0].value;
    this.typeName = this.carrierType[0].name;
  }

  /**
   * @description Select print size.
   */
  onSelectPrintSize(event: string) {
    this.checkoutForm.controls.printSize.setValue(event);
  }

  /**
   * @description Get print size function.
   */
  getPrintsizes(parcelType: IParcelDetails) {
    const carrier: ICarrierData = {
      carrierName: parcelType.carrier,
      packageCode: this.packageType,
      service: parcelType?.service
    };
    this.subscriptions.push(
      this._shippingLabelService.getPrintSizes(carrier).subscribe((res) => {
        this.printSizes = res.data;
        this.checkoutForm.patchValue({
          printSize: res.data[0].name
        });
        this.selectedSize = res.data[0].name;
      })
    );
  }

  /**
   * @description Get parcel details.
   */
  getParcelDetails() {
    const body = this.checkoutBody();
    this.spinnerloading = true;
    this.subscriptions.push(
      this._shippingLabelService
        .buyShipment(body)
        .pipe(finalize(() => (this.spinnerloading = false)))
        .subscribe((res) => {
          if (res.success) {
            this.uspsDetails = res.data?.services?.USPS;
            this.fedexDetails = res.data?.services?.FedEx;
            this.detailsAddressId = res.data?.detailsAddressId;
            if (res?.rowCount == 0) {
              this.showNoResult = true;
              this.printSizes = undefined;
            } else {
              this.showNoResult = false;
            }
            if (!this.uspsDetails?.length) {
              this.checkoutForm.controls.parcelType.setValue(
                res.data?.services.FedEx[0]
              );
            }
            if (!this.fedexDetails?.length) {
              this.checkoutForm.controls.parcelType.setValue(
                res.data?.services.USPS[0]
              );
            }
            if (this.uspsDetails && this.fedexDetails) {
              this.checkoutForm.controls.parcelType.setValue(
                res.data?.services.USPS[0]
              );
            }
            this.parcelType = this.checkoutForm.controls.parcelType.value;
            if (this.parcelType) {
              this.getPrintsizes(this.parcelType);
            }
          }
        })
    );
  }

  /**
   * @description Click to next page.
   */
  nextStep() {
    if (!this.postalType) {
      this._alertService.warningAlert({ content: 'Carrier Field is required' });
      return;
    }
    if (this.checkoutForm.invalid) {
      return;
    }
    this.printLabel();
  }

  /**
   * @description Print label.
   */
  printLabel() {
    const body = this.printBody();
    this.loading = true;
    this.subscriptions.push(
      this._shippingLabelService
        .printShipment(body)
        .pipe(finalize(() => (this.loading = false)))
        .subscribe((res) => {
          if (res?.success) {
            window.open(res?.data?.url);
            this.openSuccessAlert('Shipping Label Printed');
          }
        })
    );
  }

  /**
   * @description Click to back page.
   */
  backstep() {
    const details = this.shipping_data;
    if (
      this.shipping_data.data.packageType == 'Card' ||
      this.shipping_data?.data.packageType === 'Letter'
    ) {
      (details.data.nextStep = 'from_address'),
        (details.data.prevStep = 'rate_page'),
        (details.data.carrierType = this.postalType);
    } else {
      details.data.nextStep = 'package_page';
    }
    this.emitData.next(details);
  }

  /**
   * @description Success alert.
   */
  openSuccessAlert(content: string): void {
    const data = {
      title: 'Success',
      content: content,
      doneMsg: 'OK',
      close: false
    };
    const success = this._alertService.successAlert(data);
    success.afterClosed().subscribe((res) => {
      if (res) {
        this._router.navigate(['manage/business-tools/shipping-label']);
      }
    });
  }

  /**
   * @description Emu data to next page.
   */
  onEmit(data: IShippingData): void {
    this.emitData.next(data);
  }
}

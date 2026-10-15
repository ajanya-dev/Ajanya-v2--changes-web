import { Component } from '@angular/core';
import {
  IShippingData,
  ShippingSteps
} from 'src/app/modules/business-tools/shipping-label/model/shipping-label';
import { ExistingShippingAddressComponent } from '../../components/existing-shipping-address/existing-shipping-address.component';
import { ShippingLabelServicesComponent } from '../../components/shipping-label-services/shipping-label-services.component';
import { PackageShippingLabelComponent } from '../../components/package-shipping-label/package-shipping-label.component';
import { FromAddressLabelComponent } from '../../components/from-address-label/from-address-label.component';
import { DeliveryAddressLabelComponent } from '../../components/delivery-address-label/delivery-address-label.component';
import { NgFor, NgClass } from '@angular/common';
import { OcwBackButtonComponent } from '../../../../../shared/components/ocw-back-button/ocw-back-button.component';

@Component({
  selector: 'app-create-shipping-index',
  templateUrl: './create-shipping-index.component.html',
  styleUrls: ['./create-shipping-index.component.scss'],
  standalone: true,
  imports: [
    OcwBackButtonComponent,
    NgFor,
    NgClass,
    DeliveryAddressLabelComponent,
    FromAddressLabelComponent,
    PackageShippingLabelComponent,
    ShippingLabelServicesComponent,
    ExistingShippingAddressComponent
  ]
})
export class CreateShippingLabelIndexComponent {
  shipping_data: IShippingData;
  steps = [
    { step: 1, name: 'Delivery Address' },
    { step: 2, name: 'From Address' },
    { step: 3, name: 'Package Details' },
    { step: 4, name: 'Checkout' }
  ];
  pageId: ShippingSteps = 'delivery_address';
  pageSteps: { [key: number]: ShippingSteps[] } = {
    1: ['delivery_address', 'existing_addr'],
    2: ['from_address'],
    3: ['package_page'],
    4: ['rate_page']
  };
  currentStep = 0;

  /**
   * @description Get emitted data.
   */
  getEmitedData(emited: IShippingData) {
    if (emited?.success) {
      this.pageId = emited.data.nextStep;
      this.shipping_data = emited;
      this.currentStep = this.getCurrentStep(this.pageId);
      this.hiddenStep(this.shipping_data);
    }
  }

  /**
   * @description Get current step.
   */
  getCurrentStep(pageId: ShippingSteps) {
    for (const step in this.pageSteps) {
      if (this.pageSteps[step]?.includes(pageId)) {
        return Number(step);
      }
    }
    return 1;
  }

  /**
   * @description Hidden step.
   */
  hiddenStep(shippingData: IShippingData) {
    if (
      this.shipping_data?.data.packageType === 'Card' ||
      this.shipping_data?.data.packageType === 'Letter'
    ) {
      if (
        shippingData?.data.nextStep === 'rate_page' &&
        !shippingData.data.carrierType
      ) {
        this.steps.splice(2, 1);
      }
    } else {
      this.steps.splice(2, 1, { step: 3, name: 'Package Details' });
      this.steps.splice(3, 1, { step: 4, name: 'Checkout' });
    }
  }
}

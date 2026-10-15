import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import {
  IAddressList,
  IShippingData,
  IShippingLabelAddress,
  ShippingSteps
} from 'src/app/modules/business-tools/shipping-label/model/shipping-label';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { ShippingLabelService } from 'src/app/shared/service/shipping-label/shipping-label.service';
import { AddAddressModalComponent } from '../../modals/add-address-modal/add-address-modal.component';
import { NgIf, NgFor, NgClass } from '@angular/common';

@Component({
  selector: 'app-existing-shipping-address',
  templateUrl: './existing-shipping-address.component.html',
  styleUrls: ['./existing-shipping-address.component.scss'],
  standalone: true,
  imports: [NgIf, NgFor, NgClass]
})
export class ExistingShippingAddressComponent implements OnChanges {
  @Input() shipping_data: IShippingData;
  @Output() emitData = new EventEmitter<IShippingData>();

  subscriptions: Subscription[] = [];
  spinnerloading = false;
  addressList: IAddressList[];
  selectedAddress: IShippingLabelAddress;
  selectedFromAddress: IShippingLabelAddress | undefined;
  selectedDeliveryAddress: IShippingLabelAddress | undefined;
  showNoResult = false;
  deliverAddressId: string | null | undefined;
  fromAddressId: string | null | undefined;
  deletedFromId: string | null | undefined;
  deletedDeliverId: string | null | undefined;
  nextStep: ShippingSteps;
  prevStep: ShippingSteps;

  constructor(
    private _dialog: MatDialog,
    private _shippingLabelService: ShippingLabelService,
    private alertService: AlertService
  ) {}

  ngOnChanges(): void {
    if (this.shipping_data?.data.isExistaddress) {
      if (this.shipping_data?.data?.prevStep === 'delivery_address') {
        this.getAllDeliveryAddress();
      }
      if (this.shipping_data?.data?.prevStep === 'from_address') {
        this.getAllFromAddress();
      }
    }
  }

  /**
   * @description Select existing address.
   */
  selectAddress(index: number, address: IShippingLabelAddress) {
    const activeElements = document.querySelectorAll('.active_address');
    activeElements.forEach((element) => {
      if (element.classList.contains('active_address')) {
        element.classList.remove('active_address');
      }
    });
    const packageParentElement = document.querySelector(
      `#parentElement_${index}`
    ) as HTMLDivElement;
    packageParentElement.classList.add('active_address');
    this.selectedAddress = address;
  }

  /**
   * @description Get all existing delivery addresses.
   */
  getAllDeliveryAddress() {
    this.spinnerloading = true;
    this.subscriptions.push(
      this._shippingLabelService
        .getAllDeliveryAddress()
        .pipe(finalize(() => (this.spinnerloading = false)))
        .subscribe((res) => {
          if (res) {
            this.addressList = res.data;
            this.selectedAddress = this.addressList[0];
            if (res?.rowCount == 0) {
              this.showNoResult = true;
            } else {
              this.showNoResult = false;
            }
          }
        })
    );
  }

  /**
   * @description Get all existing from addresses.
   */
  getAllFromAddress() {
    this.spinnerloading = true;
    this.subscriptions.push(
      this._shippingLabelService
        .getAllFromAddress()
        .pipe(finalize(() => (this.spinnerloading = false)))
        .subscribe((res) => {
          if (res) {
            this.addressList = res.data;
            this.selectedAddress = this.addressList[0];
            if (res?.rowCount == 0) {
              this.showNoResult = true;
            } else {
              this.showNoResult = false;
            }
          }
        })
    );
  }

  /**
   * @description Delete addresses.
   */
  deleteAddress(id: string) {
    const confirmation = this.alertService.confirmAlert({
      content: 'Are you sure you want to delete this address?'
    });
    confirmation.afterClosed().subscribe((res) => {
      if (res) {
        if (this.shipping_data?.data?.prevStep === 'delivery_address') {
          this.deleteDeliveryAddress(id);
        } else {
          this.deleteFromaddress(id);
        }
      }
    });
  }

  /**
   * @description Delete delivery address.
   */
  deleteDeliveryAddress(id: string) {
    this.subscriptions.push(
      this._shippingLabelService.deleteDeliveryAddress(id).subscribe((res) => {
        if (res.success) {
          this.deletedDeliverId = id;
          this.alertService.successAlert({
            title: 'Success',
            content: 'Address deleted',
            close: true
          });
          this.getAllDeliveryAddress();
        }
      })
    );
  }

  /**
   * @description Delete from address.
   */
  deleteFromaddress(id: string) {
    this.subscriptions.push(
      this._shippingLabelService.deleteFromAddress(id).subscribe((res) => {
        if (res?.success) {
          this.deletedFromId = id;
          this.alertService.successAlert({
            title: 'Success',
            content: 'Address deleted',
            close: true
          });
          this.getAllFromAddress();
        }
      })
    );
  }

  /**
   * @description Edit address.
   */
  editAddress(address: IShippingLabelAddress) {
    if (this.shipping_data?.data?.prevStep === 'delivery_address') {
      const dialogRef = this._dialog.open(AddAddressModalComponent, {
        maxWidth: '700px',
        width: '93%',
        data: {
          mode: 'Edit',
          address: address,
          type: 'delivery',
          addressId: address.id
        }
      });
      dialogRef.afterClosed().subscribe((res) => {
        if (res.res?.success) {
          this.alertService.successAlert({
            title: 'Success',
            content: 'Address updated',
            close: true
          });
          this.getAllDeliveryAddress();
        }
      });
    } else {
      const dialogRef = this._dialog.open(AddAddressModalComponent, {
        maxWidth: '700px',
        width: '93%',
        data: {
          mode: 'Edit',
          address: address,
          type: 'from',
          addressId: address.id
        }
      });
      dialogRef.afterClosed().subscribe((res) => {
        if (res.res?.success) {
          this.alertService.successAlert({
            title: 'Success',
            content: 'Address updated',
            close: true
          });
          this.getAllFromAddress();
        }
      });
    }
  }

  /**
   * @description Click to next step.
   */
  nextstep() {
    if (this.showNoResult) {
      const content = 'Please select a address';
      this.openWarningAlert(content);
      return;
    } else {
      if (this.shipping_data?.data?.prevStep === 'delivery_address') {
        this.nextStep = 'delivery_address';
        this.prevStep = 'existing_addr';
        this.deliverAddressId = this.selectedAddress.id;
        this.fromAddressId =
          this.shipping_data?.data?.addressDetails?.fromAddressId;
        this.selectedDeliveryAddress = this.selectedAddress;
        this.selectedFromAddress =
          this.shipping_data?.data?.selectedFromAddress;
      } else {
        this.nextStep = 'from_address';
        this.prevStep = 'existing_addr';
        this.deliverAddressId =
          this.shipping_data?.data?.addressDetails?.deliverAddressId;
        this.fromAddressId = this.selectedAddress.id;
        this.selectedDeliveryAddress =
          this.shipping_data?.data?.selectedDeliveryAddress;
        this.selectedFromAddress = this.selectedAddress;
      }
      this.onNext();
    }
  }

  /**
   * @description Passing datas to next page.
   */
  onNext(): void {
    const data: IShippingData = {
      success: true,
      data: {
        nextStep: this.nextStep,
        prevStep: this.prevStep,
        addressDetails: {
          deliverAddressId: this.deliverAddressId,
          fromAddressId: this.fromAddressId,
          returnAddressId:
            this.shipping_data?.data?.addressDetails?.returnAddressId
        },
        selectedDeliveryAddress: this.selectedDeliveryAddress,
        selectedFromAddress: this.selectedFromAddress,
        packageType: this.shipping_data?.data?.packageType,
        carrierType: this.shipping_data?.data?.carrierType,
        deletedDeliverId: this.deletedDeliverId,
        deletedFromId: this.deletedFromId
      }
    };
    this.onEmit(data);
  }

  /**
   * @description Passing datas to back page.
   */
  backstep() {
    if (this.shipping_data?.data?.prevStep === 'delivery_address') {
      this.nextStep = 'delivery_address';
      this.prevStep = 'delivery_address';
      this.deletedDeliverId = this.deletedDeliverId;
    } else {
      this.nextStep = 'from_address';
      this.prevStep = 'from_address';
      this.deletedFromId = this.deletedFromId;
    }
    this.deliverAddressId =
      this.shipping_data?.data?.addressDetails?.deliverAddressId;
    this.fromAddressId =
      this.shipping_data?.data?.addressDetails?.fromAddressId;
    this.onNext();
  }

  /**
   * @description Emit datas to next page.
   */
  onEmit(data: IShippingData): void {
    this.emitData.next(data);
  }

  /**
   * @description Warning alert.
   */
  openWarningAlert(content: string, doneMsg = 'OK') {
    return this.alertService.warningAlert({ content: content, doneMsg });
  }
}

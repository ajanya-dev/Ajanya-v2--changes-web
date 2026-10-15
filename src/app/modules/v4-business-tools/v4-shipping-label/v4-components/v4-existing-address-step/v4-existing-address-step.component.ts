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
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';

@Component({
  selector: 'app-v4-existing-address-step',
  standalone: true,
  imports: [LucideAngularModule, MatTooltip, CommonButtonV4Component],
  templateUrl: './v4-existing-address-step.component.html'
})
export class V4ExistingAddressStepComponent implements OnChanges {
  private destroyRef = inject(DestroyRef);
  private dialog = inject(MatDialog);
  private shippingLabelService = inject(ShippingLabelService);
  private alertService = inject(V4AlertService);

  shipping_data = input.required<IShippingData>();
  emitData = output<IShippingData>();

  loading = signal(false);
  addressList = signal<IShippingLabelAddress[]>([]);
  selectedAddressId = signal<string>('');
  showNoResult = signal(false);

  deliverAddressId: string | null | undefined;
  fromAddressId: string | null | undefined;
  deletedFromId: string | null | undefined;
  deletedDeliverId: string | null | undefined;
  nextStep: ShippingSteps;
  prevStep: ShippingSteps;

  get isDeliveryMode(): boolean {
    return this.shipping_data()?.data?.prevStep === 'delivery_address';
  }

  ngOnChanges(): void {
    if (!this.shipping_data()?.data.isExistaddress) return;
    if (this.shipping_data()?.data?.prevStep === 'delivery_address') {
      this.getAllDeliveryAddress();
    }
    if (this.shipping_data()?.data?.prevStep === 'from_address') {
      this.getAllFromAddress();
    }
  }

  selectAddress(address: IShippingLabelAddress): void {
    this.selectedAddressId.set(address.id ?? '');
  }

  /**
   * @description Get all existing delivery addresses.
   */
  getAllDeliveryAddress(): void {
    this.loading.set(true);
    this.shippingLabelService
      .getAllDeliveryAddress()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false))
      )
      .subscribe((res) => {
        if (res) {
          this.setAddressList(res.data, res?.rowCount);
        }
      });
  }

  /**
   * @description Get all existing from addresses.
   */
  getAllFromAddress(): void {
    this.loading.set(true);
    this.shippingLabelService
      .getAllFromAddress()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false))
      )
      .subscribe((res) => {
        if (res) {
          this.setAddressList(res.data, res?.rowCount);
        }
      });
  }

  private setAddressList(
    data: IShippingLabelAddress[],
    rowCount: number | undefined
  ): void {
    const list = data ?? [];
    this.addressList.set(list);
    this.selectedAddressId.set(list[0]?.id ?? '');
    this.showNoResult.set(rowCount === 0 || !list.length);
  }

  /**
   * @description Delete address.
   */
  deleteAddress(id: string, event: Event): void {
    event.stopPropagation();
    this.alertService
      .confirmAlert({
        title: 'Delete Address',
        content: 'Are you sure you want to delete this address?',
        doneMsg: 'Delete',
        cancelMsg: 'Cancel',
        icon: 'warn',
        isOk: true,
        isCancel: true
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (!confirmed) return;
        if (this.isDeliveryMode) {
          this.deleteDeliveryAddress(id);
        } else {
          this.deleteFromaddress(id);
        }
      });
  }

  deleteDeliveryAddress(id: string): void {
    this.shippingLabelService
      .deleteDeliveryAddress(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res.success) {
          this.deletedDeliverId = id;
          this.openSuccessAlert('Address deleted');
          this.getAllDeliveryAddress();
        }
      });
  }

  deleteFromaddress(id: string): void {
    this.shippingLabelService
      .deleteFromAddress(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res?.success) {
          this.deletedFromId = id;
          this.openSuccessAlert('Address deleted');
          this.getAllFromAddress();
        }
      });
  }

  /**
   * @description Edit address.
   */
  editAddress(address: IShippingLabelAddress, event: Event): void {
    event.stopPropagation();
    const dialogRef = this.dialog.open(V4AddAddressModalComponent, {
      width: '700px',
      maxWidth: '95vw',
      autoFocus: false,
      panelClass: 'paddingless-modal-rounded',
      data: {
        mode: 'Edit',
        address,
        type: this.isDeliveryMode ? 'delivery' : 'from',
        addressId: address.id
      }
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res?.res?.success) {
        this.openSuccessAlert('Address updated');
        if (this.isDeliveryMode) {
          this.getAllDeliveryAddress();
        } else {
          this.getAllFromAddress();
        }
      }
    });
  }

  /**
   * @description Click to next step.
   */
  nextstep(): void {
    if (this.showNoResult() || !this.selectedAddressId()) {
      this.alertService.warningAlert({ content: 'Please select a address' });
      return;
    }

    const selected = this.addressList().find(
      (item) => item.id === this.selectedAddressId()
    );
    const details = this.shipping_data()?.data;

    if (this.isDeliveryMode) {
      this.nextStep = 'delivery_address';
      this.prevStep = 'existing_addr';
      this.deliverAddressId = selected?.id;
      this.fromAddressId = details?.addressDetails?.fromAddressId;
      this.onNext(details?.selectedFromAddress, selected);
    } else {
      this.nextStep = 'from_address';
      this.prevStep = 'existing_addr';
      this.deliverAddressId = details?.addressDetails?.deliverAddressId;
      this.fromAddressId = selected?.id;
      this.onNext(selected, details?.selectedDeliveryAddress);
    }
  }

  /**
   * @description Click to back page.
   */
  backstep(): void {
    const details = this.shipping_data()?.data;
    this.nextStep = this.isDeliveryMode ? 'delivery_address' : 'from_address';
    this.prevStep = this.nextStep;
    this.deliverAddressId = details?.addressDetails?.deliverAddressId;
    this.fromAddressId = details?.addressDetails?.fromAddressId;
    this.onNext(details?.selectedFromAddress, details?.selectedDeliveryAddress);
  }

  /**
   * @description Passing data to the next page.
   */
  private onNext(
    selectedFromAddress: IShippingLabelAddress | undefined,
    selectedDeliveryAddress: IShippingLabelAddress | undefined
  ): void {
    this.emitData.emit({
      success: true,
      data: {
        nextStep: this.nextStep,
        prevStep: this.prevStep,
        addressDetails: {
          deliverAddressId: this.deliverAddressId,
          fromAddressId: this.fromAddressId,
          returnAddressId:
            this.shipping_data()?.data?.addressDetails?.returnAddressId
        },
        selectedDeliveryAddress,
        selectedFromAddress,
        packageType: this.shipping_data()?.data?.packageType,
        carrierType: this.shipping_data()?.data?.carrierType,
        deletedDeliverId: this.deletedDeliverId,
        deletedFromId: this.deletedFromId
      }
    });
  }

  private openSuccessAlert(content: string): void {
    this.alertService.successAlert({
      title: 'Success',
      content,
      close: true
    });
  }
}

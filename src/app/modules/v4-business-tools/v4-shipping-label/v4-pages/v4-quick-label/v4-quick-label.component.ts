import {
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  Validators
} from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltip } from '@angular/material/tooltip';
import { LucideAngularModule } from 'lucide-angular';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import {
  IAddressList,
  IBuyShipment,
  ICarrierData,
  IGetPrintSize,
  IGetQuickLabel,
  IParcelDetails,
  IShippingLabelAddress,
  QuickLabelOptions
} from 'src/app/modules/business-tools/shipping-label/model/shipping-label';
import { V4AddAddressModalComponent } from '../../v4-modals/v4-add-address-modal/v4-add-address-modal.component';
import { IViewPayee } from 'src/app/modules/payee/payee-v2/model/payee';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { PayeeModalService } from 'src/app/shared/service/payee-modal/payee-modal.service';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { ShippingLabelService } from 'src/app/shared/service/shipping-label/shipping-label.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';
import {
  IV4SelectOption,
  V4SelectDropdownComponent
} from 'src/app/shared/V4/v4-select-dropdown/v4-select-dropdown.component';
import { V4RadioGroupComponent } from 'src/app/shared/V4/v4-radio-button/v4-radio-button.component';
import { PayeeDropdownV4Component } from 'src/app/shared/components/v4/dropdowns/payee-dropdown-v4/payee-dropdown-v4.component';

/** From address list rows also carry a nick name that the shared model does not declare. */
type IFromAddressItem = IAddressList & { nickName?: string };

/** The parcel dimension controls, which are cleared and validated as a set. */
type TDimensionField = 'length' | 'width' | 'height' | 'weight';

@Component({
  selector: 'app-v4-quick-label',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    LucideAngularModule,
    MatTooltip,
    CommonButtonV4Component,
    CommonInputFieldV4Component,
    V4ControlMessageComponent,
    V4SelectDropdownComponent,
    V4RadioGroupComponent,
    PayeeDropdownV4Component
  ],
  templateUrl: './v4-quick-label.component.html'
})
export class V4QuickLabelComponent implements OnInit, OnDestroy {
  private dialog = inject(MatDialog);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private sharedService = inject(SharedService);
  private payeeService = inject(PayeeService);
  private payeeModalService = inject(PayeeModalService);
  private shippingLabelService = inject(ShippingLabelService);
  private alertService = inject(V4AlertService);
  private headerService = inject(HeaderService);

  subscriptions: Subscription[] = [];

  quickLabelForm = this.fb.nonNullable.group({
    shippingType: this.fb.nonNullable.control<IParcelDetails | ''>(''),
    payeeId: ['', Validators.required],
    fromAddress: ['', Validators.required],
    isReturnAddressSame: ['1'],
    printSize: [''],
    length: [''],
    width: [''],
    height: [''],
    weight: [''],
    unit: ['oz'],
    comment: ['']
  });

  shipOptions: QuickLabelOptions[] = [
    { code: 'card', name: 'Card', icon: 'credit-card' },
    { code: 'letter', name: 'Letter', icon: 'mail' },
    { code: 'SoftPack', name: 'Soft Package', icon: 'package' },
    { code: 'box', name: 'Box', icon: 'box' }
  ];

  packageCode = signal<string>(this.shipOptions[0].code);
  isDimensionVisible = computed(
    () => this.packageCode() === 'SoftPack' || this.packageCode() === 'box'
  );

  addressList = signal<IFromAddressItem[]>([]);
  shippingTypes = signal<IParcelDetails[]>([]);
  printSizes = signal<IGetPrintSize[]>([]);

  fromAddressOptions = computed<IV4SelectOption[]>(() =>
    this.addressList().map((item) => ({
      id: item.id,
      value: item.id,
      name: item.nickName ? `${item.name} (${item.nickName})` : item.name
    }))
  );

  shippingTypeOptions = computed<IV4SelectOption[]>(() =>
    this.shippingTypes().map((item, index) => ({
      id: String(index),
      value: String(index),
      name: `${item.service} — ${item.carrier} $${item.rate}`
    }))
  );

  printSizeOptions = computed<IV4SelectOption[]>(() =>
    this.printSizes().map((item) => ({
      id: item.id,
      value: item.id,
      name: item.name
    }))
  );

  weightUnitOptions: IV4SelectOption[] = [
    { id: 'oz', value: 'oz', name: 'oz' },
    { id: 'lb', value: 'lb', name: 'lb' },
    { id: 'kg', value: 'kg', name: 'kg' },
    { id: 'gm', value: 'gm', name: 'gm' }
  ];

  returnAddressOptions = [
    { id: '1', name: 'Return address same the from address' },
    { id: '2', name: 'Add new return address' }
  ];

  selectedPayee = signal<IViewPayee | undefined>(undefined);
  fromAddressData = signal<IShippingLabelAddress | undefined>(undefined);
  returnAddressData: IShippingLabelAddress;
  quickLabelShippingType = signal<IParcelDetails | undefined>(undefined);

  selectedShippingTypeValue = signal<string>('');
  selectedPrintSize = signal<string>('');
  selectedReturnOption = signal<string>('1');

  payeeId: string;
  /** Payee whose details are being fetched, used to drop repeated requests. */
  private loadingPayeeId: string | undefined;
  fromAddressId: string | undefined;
  returnAddressId: string;
  detailsAddressId: string;

  isViewReturn = signal(false);
  loading = signal(false);
  isDisable = false;
  isDisablePrint = false;

  ngOnInit(): void {
    this.headerService.isSubHeaderVisible.next({
      hidden: true,
      animation: false
    });
    this.getAllFromAddress();
    this.getUserAddress();
    this.getShippingList(this.packageCode());
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  /**
   * @description Select package to ship.
   */
  selectPackage(code: string): void {
    this.clear();
    this.packageCode.set(code);
    this.shippingTypes.set([]);
    this.printSizes.set([]);
    this.clearPrintSize();
    if (
      (code === 'letter' || code === 'card') &&
      this.quickLabelForm.value.payeeId &&
      this.quickLabelForm.value.fromAddress &&
      this.quickLabelForm.value.isReturnAddressSame
    ) {
      this.getShippingTypeDetails();
      this.isDisable = false;
    } else {
      this.getShippingList(code);
    }
    this.viewShippingType(code);
  }

  /**
   * @description View shipping type set validations.
   */
  viewShippingType(packageCode: string): void {
    const { controls } = this.quickLabelForm;
    const dimensionControls = [
      controls.printSize,
      controls.length,
      controls.width,
      controls.height,
      controls.weight
    ];

    if (packageCode === 'letter') {
      controls.shippingType.setValidators([Validators.required]);
      dimensionControls.forEach((control) => control.clearValidators());
    } else if (packageCode === 'SoftPack' || packageCode === 'box') {
      controls.shippingType.setValidators([Validators.required]);
      dimensionControls.forEach((control) =>
        control.setValidators([Validators.required])
      );
    } else {
      controls.shippingType.clearValidators();
      dimensionControls.forEach((control) => control.clearValidators());
    }

    controls.shippingType.updateValueAndValidity();
    dimensionControls.forEach((control) => control.updateValueAndValidity());
  }

  /**
   * @description Add dimensions and change dimensions.
   */
  onDimensionChange(newValue: string, field: TDimensionField): void {
    if (newValue === '') {
      this.isDisable = true;
      this.isDisablePrint = true;
      this.clear();
      this.clearPrintSize();
    }

    if (newValue === '0') {
      const alert = this.alertService.warningAlert({
        content: 'The entered value must be greater than one'
      });
      alert.afterClosed().subscribe((res) => {
        if (res) {
          this.quickLabelForm.controls[field]?.setValue('');
        }
      });
      return;
    }

    if (
      this.quickLabelForm.value.payeeId &&
      newValue &&
      this.quickLabelForm.value.fromAddress
    ) {
      this.getShippingList(this.packageCode());
      this.clear();
      this.shippingTypes.set([]);
      this.printSizes.set([]);
      this.clearPrintSize();
    }
  }

  /**
   * @description Change weight unit.
   */
  onChangeUnit(selectedUnit: string): void {
    if (!selectedUnit) return;
    this.quickLabelForm.controls.unit.setValue(selectedUnit);
    this.getShippingList(this.packageCode());
    this.clear();
    this.shippingTypes.set([]);
    this.printSizes.set([]);
  }

  /**
   * @description Set return address.
   */
  setReturnAddress(addressType: string | number): void {
    this.selectedReturnOption.set(String(addressType));
    if (String(addressType) === '2') {
      this.openAddressModal('Add', 'addreturn');
      this.clear();
      this.isDisable = true;
      this.isDisablePrint = true;
      this.clearPrintSize();
    } else {
      this.isDisable = false;
      this.isViewReturn.set(false);
      this.quickLabelForm.controls.isReturnAddressSame.setValue('1');
    }
  }

  /**
   * @description Select from address.
   */
  onSelectFrom(event: string): void {
    if (!event) {
      this.changeFrom();
      return;
    }
    this.quickLabelForm.controls.fromAddress.setValue(event);
    this.getShippingList(this.packageCode());
    this.getSingleFromAddress(event);
  }

  /**
   * @description Clear from address.
   */
  changeFrom(): void {
    this.fromAddressData.set(undefined);
    this.quickLabelForm.controls.fromAddress.setValue('');
    this.getShippingList(this.packageCode());
    this.clear();
    this.clearPrintSize();
  }

  /**
   * @description Select payee.
   */
  onPayeeChange(event: { id?: string } | null | undefined): void {
    if (event?.id !== undefined) {
      this.afterPayeeSelected(event.id);
      this.quickLabelForm.controls.payeeId.setValue(event.id);
      return;
    }
    this.clearPayee();
  }

  /**
   * @description Clear payee.
   */
  clearPayee(): void {
    this.selectedPayee.set(undefined);
    this.quickLabelForm.controls.payeeId.setValue('');
    this.getShippingList(this.packageCode());
    this.clear();
    this.clearPrintSize();
  }

  /**
   * @description Selecting payee.
   */
  afterPayeeSelected(payeeId: string): void {
    this.payeeId = payeeId;
    this.loadPayeeDetails(payeeId);
  }

  /**
   * @description Load selected payee details.
   *
   * The payee dropdown reports a single click twice — ng-select writes the value
   * into its form control (which emits `changeEvent`) before it fires its own
   * `(change)`, and the handler writes the value back. Both land in the same
   * call stack, so ignoring an id already being fetched keeps this to one
   * request, and therefore to one validation warning and one payee modal.
   */
  loadPayeeDetails(payeeId: string): void {
    if (!payeeId || this.loadingPayeeId === payeeId) return;
    this.loadingPayeeId = payeeId;
    this.subscriptions.push(
      this.payeeService
        .showPayee(payeeId)
        .pipe(
          finalize(() => {
            if (this.loadingPayeeId === payeeId) {
              this.loadingPayeeId = undefined;
            }
          })
        )
        .subscribe((res) => {
          if (res?.success) {
            this.selectedPayee.set(res.data);
            this.payeeId = res.data?.id;
            this.checkPayee(res.data);
          }
        })
    );
  }

  /**
   * @description Checking payee — every payee detail is mandatory to buy a label.
   */
  checkPayee(selectedPayee: IViewPayee): void {
    const missing = this.getPayeeValidationMessage(selectedPayee);
    if (!missing) {
      this.getShippingList(this.packageCode());
      return;
    }

    this.isDisable = true;
    this.isDisablePrint = true;
    this.clear();
    this.clearPrintSize();
    this.quickLabelForm.controls.payeeId.setValue('');
    const alert = this.alertService.warningAlert({ content: missing });
    alert.afterClosed().subscribe((res) => {
      if (res) {
        this.openPayeeModal(selectedPayee?.id, true);
      }
    });
  }

  private getPayeeValidationMessage(payee: IViewPayee): string {
    if (!payee.nickName && !payee.phone && !payee.addressLine1) {
      return 'Nick Name, Phone number and Address details are required for Delivery Address.';
    }
    if (payee.nickName && !payee.phone && !payee.addressLine1) {
      return 'Delivery Address Phone number and Address details are required.';
    }
    if (!payee.nickName && payee.phone && !payee.addressLine1) {
      return 'Delivery Address Nick Name and Address details are required.';
    }
    if (!payee.addressLine1 || !payee.country || !payee.state || !payee.zip) {
      return 'Please add address details to delivery address.';
    }
    if (!payee.phone) {
      return 'Phone number is required for delivery address.';
    }
    if (!payee.nickName) {
      return 'Nick name is required for delivery address.';
    }
    return '';
  }

  /**
   * @description Get single from address and validate it.
   */
  getSingleFromAddress(id: string): void {
    if (!id) return;
    this.subscriptions.push(
      this.shippingLabelService.getSingleFromAddress(id).subscribe((res) => {
        if (!res?.success) return;
        const address = res.data;
        this.fromAddressData.set(address);
        this.fromAddressId = address?.id;

        const missing = this.getFromAddressValidationMessage(address);
        if (!missing) return;

        const alert = this.alertService.warningAlert({ content: missing });
        alert.afterClosed().subscribe((confirmed) => {
          if (confirmed && this.fromAddressData()) {
            this.editAddress(
              this.fromAddressData() as IShippingLabelAddress,
              'Edit',
              'from'
            );
          }
        });
      })
    );
  }

  private getFromAddressValidationMessage(
    address: IShippingLabelAddress
  ): string {
    if (!address.nickName && !address.phone && !address.address1) {
      return 'Nick Name, Phone number and Address details are required for From Address.';
    }
    if (address.nickName && !address.phone && !address.address1) {
      return 'From Address Phone number and Address details are required.';
    }
    if (!address.nickName && address.phone && !address.address1) {
      return 'From Address Nick Name and Address details are required.';
    }
    if (!address.address1) {
      return 'Please add address details to from address.';
    }
    if (!address.phone) {
      return 'Phone number is required for delivery address.';
    }
    if (!address.nickName) {
      return 'Nick name is required for from address.';
    }
    return '';
  }

  /**
   * @description Decide whether the carrier list can be fetched for the current selection.
   */
  getShippingList(code: string): void {
    const { value } = this.quickLabelForm;
    const hasAddresses = !!value.payeeId && !!value.fromAddress;

    if (code === 'SoftPack' || code === 'box') {
      const hasDimensions =
        !!value.length &&
        !!value.width &&
        !!value.height &&
        !!value.weight &&
        !!value.unit;
      if (!hasAddresses || !hasDimensions) {
        this.isDisable = true;
        this.isDisablePrint = true;
        return;
      }
    } else if (!hasAddresses) {
      this.isDisable = true;
      this.isDisablePrint = true;
      return;
    }

    this.isDisable = false;
    this.getShippingTypeDetails();
  }

  /**
   * @description Get shipping type details.
   */
  getShippingTypeDetails(): void {
    if (
      (this.packageCode() === 'SoftPack' || this.packageCode() === 'box') &&
      this.isDisable
    ) {
      return;
    }

    const body =
      this.packageCode() === 'card' ? this.quickLabelBody() : this.quickLabel();

    this.subscriptions.push(
      this.shippingLabelService
        .getShippingTypeDetails(body)
        .subscribe((res) => {
          const services = res.data?.services ?? [];
          if (this.packageCode() === 'card' && services[0]) {
            this.quickLabelShippingType.set(services[0]);
            this.selectedShippingTypeValue.set('0');
            this.quickLabelForm.controls.shippingType.setValue(services[0]);
            this.isDisablePrint = false;
            this.getPrintsizes(services[0]);
          }
          this.detailsAddressId = res.data?.detailsAddressId;
          this.shippingTypes.set(services);
        })
    );
  }

  /**
   * @description Select shipping type.
   */
  onSelectShippingType(value: string): void {
    if (!value) {
      this.selectedShippingTypeValue.set('');
      this.clear();
      return;
    }
    const selected = this.shippingTypes()[Number(value)];
    if (!selected) return;
    this.selectedShippingTypeValue.set(value);
    this.isDisablePrint = false;
    this.quickLabelShippingType.set(selected);
    this.quickLabelForm.controls.shippingType.setValue(selected);
    this.getPrintsizes(selected);
  }

  /**
   * @description Select print size.
   */
  onSelectPrintSize(value: string): void {
    this.selectedPrintSize.set(value);
    this.quickLabelForm.controls.printSize.setValue(value);
  }

  /**
   * @description Get print sizes.
   */
  getPrintsizes(service: IParcelDetails): void {
    const carrier: ICarrierData = {
      carrierName: service.carrier,
      packageCode: this.packageCode(),
      service: service.service
    };
    this.subscriptions.push(
      this.shippingLabelService.getPrintSizes(carrier).subscribe((res) => {
        this.printSizes.set(res.data ?? []);
      })
    );
  }

  /**
   * @description Get from addresses.
   */
  getAllFromAddress(): void {
    this.subscriptions.push(
      this.shippingLabelService.getAllFromAddress().subscribe((res) => {
        if (res) {
          this.addressList.set((res.data ?? []) as IFromAddressItem[]);
        }
      })
    );
  }

  /**
   * @description Get the user default from address.
   */
  getUserAddress(): void {
    this.subscriptions.push(
      this.shippingLabelService.getUserDefaultAddress().subscribe((res) => {
        if (res.success && res.data) {
          this.fromAddressData.set(res.data);
          this.quickLabelForm.controls.fromAddress.setValue(res.data?.id);
          this.fromAddressId = res.data?.id;
        }
      })
    );
  }

  /**
   * @description Open payee modal.
   */
  openPayeeModal(selectedItem?: string, editMode?: boolean): void {
    const modal$ =
      editMode && selectedItem
        ? this.payeeModalService.openEditPayee(
            selectedItem,
            'addPayeeModal',
            { edit: true, id: selectedItem },
            true
          )
        : this.payeeModalService.openAddPayee('addPayeeModal', undefined, true);

    this.subscriptions.push(
      modal$.subscribe((dialogRef) => {
        if (!dialogRef) return;
        this.subscriptions.push(
          dialogRef.afterClosed().subscribe((res) => {
            if (res?.success) {
              this.isDisable = false;
              this.sharedService.setNewPayeeCreatedData({ payeeId: res.id });
              this.payeeId = res.id;
              this.quickLabelForm.controls.payeeId.setValue(res.id);
              this.afterPayeeSelected(res.id);
            } else {
              this.sharedService.setPayeeData(true);
            }
          })
        );
      })
    );
  }

  /**
   * @description Open address modal.
   */
  openAddressModal(mode: string, type: string): void {
    this.clear();
    this.isDisable = true;
    this.isDisablePrint = true;
    this.clearPrintSize();
    const dialogRef = this.dialog.open(V4AddAddressModalComponent, {
      width: '700px',
      maxWidth: '95vw',
      autoFocus: false,
      panelClass: 'paddingless-modal-rounded',
      data: { mode, type }
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res) {
        this.isDisable = false;
        this.getShippingList(this.packageCode());
        if (res.type === 'from') {
          this.fromAddressData.set(res.data);
          this.fromAddressId = res.id;
          this.getAllFromAddress();
          this.quickLabelForm.controls.fromAddress.setValue(res?.id);
        } else {
          this.isViewReturn.set(true);
          this.returnAddressData = res.data;
          this.returnAddressId = res.id;
          this.quickLabelForm.controls.isReturnAddressSame.setValue('0');
        }
      } else {
        this.selectedReturnOption.set('1');
        this.isDisable = false;
      }
    });
  }

  /**
   * @description Open edit address modal.
   */
  editAddress(
    address: IShippingLabelAddress,
    mode: string,
    type: string
  ): void {
    const dialogRef = this.dialog.open(V4AddAddressModalComponent, {
      width: '700px',
      maxWidth: '95vw',
      autoFocus: false,
      panelClass: 'paddingless-modal-rounded',
      data: {
        mode,
        address,
        type,
        addressId: type === 'from' ? this.fromAddressId : this.returnAddressId
      }
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res?.res?.success) {
        this.openSuccessAlert('Successfully updated.');
        if (res.type === 'from') {
          this.fromAddressData.set(res.data);
          this.getAllFromAddress();
          this.quickLabelForm.controls.fromAddress.setValue(res?.res?.data?.id);
        } else {
          this.returnAddressData = res.data;
          this.quickLabelForm.controls.isReturnAddressSame.setValue('0');
          this.getShippingTypeDetails();
        }
      } else {
        this.changeFrom();
      }
    });
  }

  /**
   * @description Print label.
   */
  printLabel(): void {
    this.quickLabelForm.markAllAsTouched();
    if (this.quickLabelForm.invalid) {
      return;
    }

    if (this.packageCode() === 'SoftPack' || this.packageCode() === 'box') {
      if (!this.quickLabelForm.value.printSize) {
        this.alertService.warningAlert({ content: 'Print size is required' });
        return;
      }
    }

    this.loading.set(true);
    this.subscriptions.push(
      this.shippingLabelService
        .printShipment(this.printBody())
        .pipe(finalize(() => this.loading.set(false)))
        .subscribe((res) => {
          if (res?.success) {
            window.open(res?.data?.url);
            this.openSuccessAlert('Quick Label Printed');
            this.goToList();
            return;
          }
          this.alertService.warningAlert({
            content:
              res?.errorMsg ||
              res?.message ||
              'Unable to print the label. Please try again.'
          });
        })
    );
  }

  goToList(): void {
    this.router.navigate(['/v4/manage/business-tools/shipping-label']);
  }

  /**
   * @description Creates quick label data body.
   */
  private quickLabelBody(): IGetQuickLabel {
    const data = this.quickLabelForm.getRawValue();
    return {
      deliverAddressId: data.payeeId,
      fromAddressId: data.fromAddress,
      isReturnAddressSame: Number(data.isReturnAddressSame),
      returnAddressId: this.returnAddressId,
      packageCode: this.packageCode()
    };
  }

  /**
   * @description Quick label body including the parcel dimensions.
   */
  private quickLabel(): IGetQuickLabel {
    const data = this.quickLabelForm.getRawValue();
    return {
      ...this.quickLabelBody(),
      length: data.length,
      height: data.height,
      width: data.width,
      weight: data.weight,
      unit: data.unit
    };
  }

  /**
   * @description Set data for print label.
   */
  private printBody(): IBuyShipment {
    const data = this.quickLabelShippingType();
    return {
      shipmentId: data?.shipmentId,
      service: data?.service,
      detailsAddressId: this.detailsAddressId,
      indexId: data?.indexId,
      carrier: data?.carrier,
      comment: this.quickLabelForm.controls.comment.value
    };
  }

  /**
   * @description Clear the selected carrier.
   */
  clear(): void {
    this.quickLabelShippingType.set(undefined);
    this.selectedShippingTypeValue.set('');
    this.quickLabelForm.controls.shippingType.setValue('');
    this.isDisablePrint = true;
    this.clearPrintSize();
  }

  /**
   * @description Clear print size.
   */
  clearPrintSize(): void {
    this.selectedPrintSize.set('');
    this.quickLabelForm.controls.printSize.setValue('');
  }

  /**
   * @description Phone number formatting.
   */
  formatePhoneNum(phone: string | undefined): string {
    if (!phone) return '';
    const num = String(phone).replace(/[^0-9]/g, '');
    return `(${num.substring(0, 3)}) ${num.substring(3, 6)}-${num.substring(6, 10)}`;
  }

  private openSuccessAlert(content: string) {
    return this.alertService.successAlert({
      title: 'Success',
      content,
      close: true,
      timeout: 2500
    });
  }
}

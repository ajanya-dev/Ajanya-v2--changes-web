import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import {
  UntypedFormBuilder,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { ISuccessAlert } from 'src/app/models/alert';
import { IViewPayee } from 'src/app/modules/payee/payee-v2/model/payee';
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
import { AddPayeeModalComponent } from 'src/app/shared/modal/payee-modal/add-payee-modal/add-payee-modal.component';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { ShippingLabelService } from 'src/app/shared/service/shipping-label/shipping-label.service';
import { AddAddressModalComponent } from '../../modals/add-address-modal/add-address-modal.component';
import { Utils } from 'src/app/data/utils';
import { MatRadioGroup, MatRadioButton } from '@angular/material/radio';
import { DropDownPayeeComponent } from '../../../../../shared/components/drop-downs/drop-down-payee/drop-down-payee.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { ControlMessageComponent } from '../../../../../shared/components/control-message/control-message/control-message.component';
import { NgxMaskDirective } from 'ngx-mask';
import { NgFor, NgClass, NgIf, DecimalPipe } from '@angular/common';
import { OcwBackButtonComponent } from '../../../../../shared/components/ocw-back-button/ocw-back-button.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPlus } from '@fortawesome/pro-solid-svg-icons';
@Component({
  selector: 'app-create-quick-label',
  templateUrl: 'create-quick-label.component.html',
  styleUrls: ['create-quick-label.component.scss'],
  standalone: true,
  imports: [
    OcwBackButtonComponent,
    NgFor,
    NgClass,
    FormsModule,
    ReactiveFormsModule,
    NgIf,
    NgxMaskDirective,
    ControlMessageComponent,
    NgSelectModule,
    DropDownPayeeComponent,
    MatRadioGroup,
    MatRadioButton,
    DecimalPipe,
    FontAwesomeModule
  ]
})
export class CreateQuickLabelComponent implements OnInit, OnDestroy {
  private dialog = inject(MatDialog);
  private fb = inject(UntypedFormBuilder);
  private sharedService = inject(SharedService);
  private payeeService = inject(PayeeService);
  private shippingLabelService = inject(ShippingLabelService);
  private alertService = inject(AlertService);
  private router = inject(Router);

  subscriptions: Subscription[] = [];
  selectedPayee: IViewPayee;
  payeeId: string;
  itemName: string | undefined;
  fromAddressData: IShippingLabelAddress;
  returnAddressData: IShippingLabelAddress;
  fromAddressId: string | undefined;
  returnAddressId: string;
  quickLabelForm = this.fb.group({
    shippingType: [''],
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

  addressList: IAddressList[];
  shippingTypes: IParcelDetails[];
  isViewReturn = false;
  loading = false;
  quickLabelShippingType: IParcelDetails;
  detailsAddressId: string;
  showNoResult = false;
  printSizes: IGetPrintSize[];
  selectedSize: string;
  shipOptions: QuickLabelOptions[] = [
    {
      code: 'card',
      name: 'Card',
      icon: '../../../../../../assets/images/quick-label/card.svg'
    },
    {
      code: 'letter',
      name: 'Letter',
      icon: '../../../../../../assets/images/quick-label/letter.svg'
    },
    {
      code: 'SoftPack',
      name: 'Soft Package',
      icon: '../../../../../../assets/images/quick-label/soft-package.svg'
    },
    {
      code: 'box',
      name: 'Box',
      icon: '../../../../../../assets/images/quick-label/box.svg'
    }
  ];
  packageCode = this.shipOptions[0].code;
  utils = Utils;
  useSameReturnAddress = true;
  Empty: IParcelDetails;
  emptySize: string;
  isSelectDelivery = false;
  isDisable = false;
  isDisablePrint = false;
  weightUnitList: { unit: string }[] = [
    { unit: 'oz' },
    { unit: 'lb' },
    { unit: 'kg' },
    { unit: 'gm' }
  ];
  faPlus = faPlus;

  ngOnInit(): void {
    this.getAllFromAddress();
    this.getUserAddress();
    this.getShippingList(this.packageCode);
  }

  /**
   * @description Add dimensions and change dimensions.
   */
  onDimensionChange(newValue: string, field: string): void {
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
      alert.afterClosed().subscribe((r) => {
        if (r) {
          if (field === 'length') {
            this.quickLabelForm.controls.length.setValue('');
          } else if (field === 'height') {
            this.quickLabelForm.controls.height.setValue('');
          } else if (field === 'width') {
            this.quickLabelForm.controls.width.setValue('');
          } else {
            this.quickLabelForm.controls.weight.setValue('');
          }
        }
      });
      return;
    }
    if (
      this.isSelectDelivery &&
      newValue &&
      this.quickLabelForm.value.fromAddress
    ) {
      this.getShippingList(this.packageCode);
      this.clear();
      this.shippingTypes = [];
      this.printSizes = [];
      this.clearPrintSize();
    }
  }

  /**
   * @description Set return address.
   */
  setReturnAddress(addressType: number): void {
    if (addressType === 2) {
      this.openAddressModal('Add', 'addreturn');
      this.useSameReturnAddress = false;
      this.clear();
      this.isDisable = true;
      this.isDisablePrint = true;
      this.clearPrintSize();
    } else {
      this.isDisable = false;
      this.isViewReturn = false;
    }
  }

  /**
   * @description Creates quick label data body.
   */
  quickLabelBody(): IGetQuickLabel {
    const data = this.quickLabelForm.value;
    return {
      deliverAddressId: data.payeeId,
      fromAddressId: data.fromAddress,
      isReturnAddressSame: data.isReturnAddressSame,
      returnAddressId: this.returnAddressId,
      packageCode: this.packageCode
    };
  }

  /**
   * @description Set quick label datas.
   */
  quickLabel(): IGetQuickLabel {
    const data = this.quickLabelForm.value;
    return {
      deliverAddressId: data.payeeId,
      fromAddressId: data.fromAddress,
      isReturnAddressSame: data.isReturnAddressSame,
      returnAddressId: this.returnAddressId,
      packageCode: this.packageCode,
      length: data.length,
      height: data.height,
      width: data.width,
      weight: data.weight,
      unit: data.unit
    };
  }

  /**
   * @description Set datas for print label.
   */
  printBody(): IBuyShipment {
    const data = this.quickLabelShippingType;
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
   * @description Select payee.
   */
  onPayeeChange(event: IViewPayee): void {
    if (event?.id !== undefined) {
      this.afterPayeeSelected(event);
      this.quickLabelForm.controls.payeeId.setValue(event?.id);
    } else {
      this.afterPayeeSelected(event);
      this.quickLabelForm.controls.payeeId.setValue('');
      return;
    }
    this.isSelectDelivery = true;
  }

  /**
   * @description clear print size.
   */
  clear(): void {
    this.quickLabelShippingType = this.Empty;
    this.isDisablePrint = true;
    this.clearPrintSize();
  }

  /**
   * @description change weight unit.
   */
  onChangeUnit(selectedUnit: string): void {
    if (selectedUnit) {
      this.getShippingList(this.packageCode);
      this.clear();
      this.shippingTypes = [];
      this.printSizes = [];
    }
  }

  /**
   * @description Select package to ship.
   */
  selectPackage(code: string): void {
    this.clear();
    this.packageCode = code;
    this.shippingTypes = [];
    this.printSizes = [];
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
    this.viewShippingType(this.packageCode);
  }

  /**
   * @description View shipping type set validations.
   */
  viewShippingType(packageCode: string): void {
    if (packageCode === 'letter') {
      this.quickLabelForm.controls.shippingType.setValidators([
        Validators.required
      ]);
      this.quickLabelForm.controls.shippingType.updateValueAndValidity();
      this.quickLabelForm.controls.printSize.clearValidators();
      this.quickLabelForm.controls.length.clearValidators();
      this.quickLabelForm.controls.width.clearValidators();
      this.quickLabelForm.controls.height.clearValidators();
      this.quickLabelForm.controls.weight.clearValidators();
      this.quickLabelForm.controls.printSize.updateValueAndValidity();
      this.quickLabelForm.controls.length.updateValueAndValidity();
      this.quickLabelForm.controls.width.updateValueAndValidity();
      this.quickLabelForm.controls.height.updateValueAndValidity();
      this.quickLabelForm.controls.weight.updateValueAndValidity();
    } else if (packageCode === 'SoftPack' || packageCode === 'box') {
      this.quickLabelForm.controls.shippingType.setValidators([
        Validators.required
      ]);
      this.quickLabelForm.controls.shippingType.updateValueAndValidity();
      this.quickLabelForm.controls.printSize.setValidators([
        Validators.required
      ]);
      this.quickLabelForm.controls.length.setValidators([Validators.required]);
      this.quickLabelForm.controls.width.setValidators([Validators.required]);
      this.quickLabelForm.controls.height.setValidators([Validators.required]);
      this.quickLabelForm.controls.weight.setValidators([Validators.required]);
      this.quickLabelForm.controls.printSize.updateValueAndValidity();
      this.quickLabelForm.controls.length.updateValueAndValidity();
      this.quickLabelForm.controls.width.updateValueAndValidity();
      this.quickLabelForm.controls.height.updateValueAndValidity();
      this.quickLabelForm.controls.weight.updateValueAndValidity();
    } else if (packageCode === 'card') {
      this.quickLabelForm.controls.printSize.clearValidators();
      this.quickLabelForm.controls.length.clearValidators();
      this.quickLabelForm.controls.width.clearValidators();
      this.quickLabelForm.controls.height.clearValidators();
      this.quickLabelForm.controls.weight.clearValidators();
      this.quickLabelForm.controls.shippingType.clearValidators();
      this.quickLabelForm.controls.shippingType.updateValueAndValidity();
      this.quickLabelForm.controls.printSize.updateValueAndValidity();
      this.quickLabelForm.controls.length.updateValueAndValidity();
      this.quickLabelForm.controls.width.updateValueAndValidity();
      this.quickLabelForm.controls.height.updateValueAndValidity();
      this.quickLabelForm.controls.weight.updateValueAndValidity();
    }
  }

  /**
   * @description Get shipping list data.
   */
  getShippingList(code: string): void {
    if (code === 'SoftPack' || code === 'box') {
      const formData = this.quickLabelForm.value;
      delete formData.comment;
      delete formData.shippingType;
      delete formData.printSize;
      const emptyKeys = Object.keys(formData).filter(
        (key) => formData[key] === '' || formData[key] === undefined
      );
      if (emptyKeys.length > 0) {
        this.isDisable = true;
        this.isDisablePrint = true;
      } else {
        this.isDisable = false;
        this.getShippingTypeDetails();
      }
    } else {
      if (
        !this.quickLabelForm.value.payeeId ||
        !this.quickLabelForm.value.fromAddress
      ) {
        this.isDisable = true;
        this.isDisablePrint = true;
      } else {
        this.isDisable = false;
        this.getShippingTypeDetails();
      }
    }
  }

  /**
   * @description Select shipping type.
   */
  onSelectShippingType(event: IParcelDetails): void {
    if (event) {
      this.isDisablePrint = false;
      this.quickLabelShippingType = event;
      this.quickLabelForm.controls.shippingType.setValue(event);
      this.getPrintsizes(event);
    }
  }

  /**
   * @description Select print size.
   */
  onSelectPrintSize(event: string): void {
    this.quickLabelForm.controls.printSize.setValue(event);
  }

  /**
   * @description Get single from address.
   */
  getSingleFromAddress(id: string): void {
    if (!id) {
      return;
    }
    this.subscriptions.push(
      this.shippingLabelService.getSingleFromAddress(id).subscribe((res) => {
        if (res?.success) {
          this.fromAddressData = res?.data;
          this.fromAddressId = res?.data?.id;
          if (
            !this.fromAddressData.nickName &&
            !this.fromAddressData.phone &&
            !this.fromAddressData.address1
          ) {
            const alert = this.alertService.warningAlert({
              content:
                'Nick Name, Phone number and Address details are required for From Address.'
            });
            alert.afterClosed().subscribe((r) => {
              if (r) {
                if (this.fromAddressData) {
                  this.editAddress(this.fromAddressData, 'Edit', 'from');
                }
              }
            });
          } else if (
            this.fromAddressData.nickName &&
            !this.fromAddressData.phone &&
            !this.fromAddressData.address1
          ) {
            const alert = this.alertService.warningAlert({
              content:
                'From Address Phone number and Address details are required.'
            });
            alert.afterClosed().subscribe((r) => {
              if (r) {
                if (this.fromAddressData) {
                  this.editAddress(this.fromAddressData, 'Edit', 'from');
                }
              }
            });
          } else if (
            !this.fromAddressData.nickName &&
            this.fromAddressData.phone &&
            !this.fromAddressData.address1
          ) {
            const alert = this.alertService.warningAlert({
              content:
                'From Address Nick Name and Address details are required.'
            });
            alert.afterClosed().subscribe((r) => {
              if (r) {
                if (this.fromAddressData) {
                  this.editAddress(this.fromAddressData, 'Edit', 'from');
                }
              }
            });
          } else if (!this.fromAddressData.address1) {
            const alert = this.alertService.warningAlert({
              content: 'Please add address details to from address.'
            });
            alert.afterClosed().subscribe((r) => {
              if (r) {
                if (this.fromAddressData) {
                  this.editAddress(this.fromAddressData, 'Edit', 'from');
                }
              }
            });
          } else if (!this.fromAddressData.phone) {
            const alert = this.alertService.warningAlert({
              content: 'Phone number is required for delivery address.'
            });
            alert.afterClosed().subscribe((r) => {
              if (r) {
                if (this.fromAddressData) {
                  this.editAddress(this.fromAddressData, 'Edit', 'from');
                }
              }
            });
          } else if (!this.fromAddressData.nickName) {
            const alert = this.alertService.warningAlert({
              content: 'Nick name is required for from address.'
            });
            alert.afterClosed().subscribe((r) => {
              if (r) {
                if (this.fromAddressData) {
                  this.editAddress(this.fromAddressData, 'Edit', 'from');
                }
              }
            });
          }
        }
      })
    );
  }

  /**
   * @description Select from address.
   */
  onSelectFrom(event: string): void {
    this.quickLabelForm.controls.fromAddress.setValue(event);
    this.getShippingList(this.packageCode);
    this.getSingleFromAddress(event);
  }

  /**
   * @description Clear print size.
   */
  clearPrintSize(): void {
    this.selectedSize = this.emptySize;
  }

  /**
   * @description Clear from address.
   */
  changeFrom(): void {
    this.fromAddressData = {
      id: '',
      address1: '',
      address2: '',
      city: '',
      company: '',
      country: '',
      email: '',
      name: '',
      nickName: '',
      phone: '',
      state: '',
      zip: '',
      returnAddressId: ''
    };
    this.itemName = undefined;
    this.quickLabelForm.controls.fromAddress.setValue('');
    this.getShippingList(this.packageCode);
    this.clear();
    this.clearPrintSize();
  }

  /**
   * @description Clear payee.
   */
  clearPayee() {
    this.getShippingList(this.packageCode);
    this.clear();
    this.clearPrintSize();
    this.quickLabelForm.controls.payeeId.setValue('');
  }

  /**
   * @description Selecting payee.
   */
  afterPayeeSelected(event: IViewPayee): void {
    this.selectedPayee = event;
    this.payeeId = event?.id;
    this.loadPayeeDetails(this.payeeId);
  }

  /**
   * @description Load selcted payee details.
   */
  loadPayeeDetails(payeeId: string): void {
    if (!payeeId) {
      return;
    }
    this.subscriptions.push(
      this.payeeService.showPayee(payeeId).subscribe((res) => {
        if (res?.success) {
          this.selectedPayee = res.data;
          this.payeeId = res.data?.id;
          this.checkPayee(this.selectedPayee);
        }
      })
    );
  }

  /**
   * @description Checking payee.
   */
  checkPayee(selectedPayee: IViewPayee): void {
    if (
      !selectedPayee.nickName &&
      !selectedPayee.phone &&
      !selectedPayee.addressLine1
    ) {
      this.isDisable = true;
      this.isDisablePrint = true;
      this.clear();
      this.clearPrintSize();
      this.quickLabelForm.controls.payeeId.setValue('');
      const alert = this.alertService.warningAlert({
        content:
          'Nick Name, Phone number and Address details are required for Delivery Address.'
      });
      alert.afterClosed().subscribe((r) => {
        if (r) {
          this.openPayeeModal(this.selectedPayee?.id, true);
        }
      });

    } else if (
      selectedPayee.nickName &&
      !selectedPayee.phone &&
      !selectedPayee.addressLine1
    ) {
      this.isDisable = true;
      this.isDisablePrint = true;
      this.clear();
      this.clearPrintSize();
      this.quickLabelForm.controls.payeeId.setValue('');
      const alert = this.alertService.warningAlert({
        content:
          'Delivery Address Phone number and Address details are required.'
      });
      alert.afterClosed().subscribe((r) => {
        if (r) {
          this.openPayeeModal(this.selectedPayee?.id, true);
        }
      });
    } else if (
      !selectedPayee.nickName &&
      selectedPayee.phone &&
      !selectedPayee.addressLine1
    ) {
      this.isDisable = true;
      this.isDisablePrint = true;
      this.clear();
      this.clearPrintSize();
      this.quickLabelForm.controls.payeeId.setValue('');
      const alert = this.alertService.warningAlert({
        content: 'Delivery Address Nick Name and Address details are required.'
      });
      alert.afterClosed().subscribe((r) => {
        if (r) {
          this.openPayeeModal(this.selectedPayee?.id, true);
        }
      });
    } else if (
      !selectedPayee.addressLine1 ||
      !selectedPayee.country ||
      !selectedPayee.state ||
      !selectedPayee.zip
    ) {
      this.isDisable = true;
      this.isDisablePrint = true;
      this.clear();
      this.clearPrintSize();
      this.quickLabelForm.controls.payeeId.setValue('');
      const alert = this.alertService.warningAlert({
        content: 'Please add address details to delivery address.'
      });
      alert.afterClosed().subscribe((r) => {
        if (r) {
          this.openPayeeModal(this.selectedPayee?.id, true);
        }
      });
    } else if (!selectedPayee.phone) {
      this.isDisable = true;
      this.isDisablePrint = true;
      this.clear();
      this.clearPrintSize();
      this.quickLabelForm.controls.payeeId.setValue('');
      const alert = this.alertService.warningAlert({
        content: 'Phone number is required for delivery address.'
      });
      alert.afterClosed().subscribe((r) => {
        if (r) {
          this.openPayeeModal(this.selectedPayee?.id, true);
        }
      });
    } else if (!selectedPayee.nickName) {
      this.isDisable = true;
      this.isDisablePrint = true;
      this.clear();
      this.clearPrintSize();
      this.quickLabelForm.controls.payeeId.setValue('');
      const alert = this.alertService.warningAlert({
        content: 'Nick name is required for delivery address.'
      });
      alert.afterClosed().subscribe((r) => {
        if (r) {
          this.openPayeeModal(this.selectedPayee?.id, true);
        }
      });
    } else {
      this.getShippingList(this.packageCode);
    }
  }

  /**
   * @description Get shipping type details.
   */
  getShippingTypeDetails(): void {
    if (
      (this.packageCode === 'SoftPack' || this.packageCode === 'box') &&
      this.isDisable
    ) {
      return;
    }

    const body =
      this.packageCode === ('card' || 'letter')
        ? this.quickLabelBody()
        : this.quickLabel();
    this.subscriptions.push(
      this.shippingLabelService
        .getShippingTypeDetails(body)
        .subscribe((res) => {
          if (this.packageCode === 'card') {
            this.quickLabelShippingType = res.data?.services[0];
            this.getPrintsizes(res.data?.services[0]);
          }
          this.detailsAddressId = res.data?.detailsAddressId;
          this.shippingTypes = res.data?.services;
          if (!this.shippingTypes.length) {
            this.alertService.warningAlert({
              content: 'Service is not available.'
            });
          }
        })
    );
  }

  /**
   * @description Get print sizes.
   */
  getPrintsizes(service: IParcelDetails): void {
    const carrier: ICarrierData = {
      carrierName: service.carrier,
      packageCode: this.packageCode,
      service: service.service
    };
    this.subscriptions.push(
      this.shippingLabelService.getPrintSizes(carrier).subscribe((res) => {
        this.printSizes = res.data;
      })
    );
  }

  /**
   * @description Get from adresses details.
   */
  getAllFromAddress(): void {
    this.subscriptions.push(
      this.shippingLabelService.getAllFromAddress().subscribe((res) => {
        if (res) {
          this.addressList = res.data;
        }
      })
    );
  }

  /**
   * @description Open payee modal.
   */
  openPayeeModal(selectedItem?: string, editMode?: boolean): void {
    const dialogRef = this.dialog.open(AddPayeeModalComponent, {
      maxWidth: '600px',
      width: '93%',
      disableClose: true,
      data: editMode ? { edit: editMode, id: selectedItem } : ''
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res?.success) {
        this.isDisable = false;
        this.sharedService.setNewPayeeCreatedData({ payeeId: res.id });
        this.payeeId = res.id;
        setTimeout(() => {
          this.onPayeeChange(res);
        }, 1000);
      } else {
        this.sharedService.setPayeeData(true);
        this.selectedPayee = {
          accountNumber: '',
          accountType: '',
          addressLine1: '',
          addressLine2: '',
          city: '',
          company: '',
          country: '',
          email: '',
          id: '',
          name: '',
          nickName: '',
          payeeIdNumber: '',
          phone: '',
          routingNumber: '',
          state: '',
          zip: ''
        };
      }
    });
  }

  /**
   * @description Open address modal.
   */
  openAddressModal(Mode: string, Type: string): void {
    this.clear();
    this.isDisable = true;
    this.isDisablePrint = true;
    this.clearPrintSize();
    const dialogRef = this.dialog.open(AddAddressModalComponent, {
      maxWidth: '700px',
      width: '93%',
      data: { mode: Mode, type: Type }
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res) {
        this.isDisable = false;
        this.getShippingList(this.packageCode);
        if (res.type === 'from') {
          this.fromAddressData = res.data;
          this.itemName = res.data?.name + ' ' + '(' + res.data?.nickName + ')';
          this.fromAddressId = res.id;
          this.getAllFromAddress();
          this.quickLabelForm.controls.fromAddress.setValue(res?.id);
        } else {
          this.isViewReturn = true;
          this.returnAddressData = res.data;
          this.returnAddressId = res.id;
          this.quickLabelForm.controls.isReturnAddressSame.setValue(0);
        }
      } else {
        this.useSameReturnAddress = true;
        this.isDisable = false;
      }
    });
  }

  /**
   * @description Open edit address modal.
   */
  editAddress(
    address: IShippingLabelAddress,
    Mode: string,
    Type: string
  ): void {
    const dialogRef = this.dialog.open(AddAddressModalComponent, {
      maxWidth: '700px',
      width: '93%',
      data: {
        mode: Mode,
        address,
        type: Type,
        addressId: [Type === 'from' ? this.fromAddressId : this.returnAddressId]
      }
    });
    dialogRef.afterClosed().subscribe((res) => {
      if (res.res?.success) {
        this.openSuccessAlert('Successfully updated.');
        if (res.type === 'from') {
          this.fromAddressData = res.data;
          this.itemName = res.data?.name + ' ' + '(' + res.data?.nickName + ')';
          this.getAllFromAddress();
          this.quickLabelForm.controls.fromAddress.setValue(res?.res?.data?.id);
        } else {
          this.returnAddressData = res.data;
          this.quickLabelForm.controls.isReturnAddressSame.setValue(0);
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

    if (this.packageCode === 'SoftPack' || this.packageCode === 'box') {
      if (!this.quickLabelForm.value.printSize) {
        this.alertService.warningAlert({
          content: 'Print size is required'
        });
        return;
      }
    }

    const body = this.printBody();
    this.loading = true;
    this.subscriptions.push(
      this.shippingLabelService
        .printShipment(body)
        .pipe(finalize(() => {this.loading = false;}))
        .subscribe((res) => {
          if (res?.success) {
            window.open(res?.data?.url);
            this.openSuccessAlert('Quick Label Printed');
            this.router.navigate(['manage/business-tools/shipping-label']);
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

  /**
   * @description Success alert.
   */
  openSuccessAlert(content: string) {
    const data: ISuccessAlert = {
      title: 'Success',
      content,
      close: true,
      timeout: 2500
    };
    return this.alertService.successAlert(data);
  }

  /**
   * @description Get user address.
   */
  getUserAddress(): void {
    this.subscriptions.push(
      this.shippingLabelService.getUserDefaultAddress().subscribe((res) => {
        if (res.success && res.data) {
          this.fromAddressData = res.data;
          if (!res.data?.nickName) {
            this.itemName = res.data?.name;
          } else {
            this.itemName =
              res.data?.name + ' ' + '(' + res.data?.nickName + ')';
          }
          this.quickLabelForm.controls.fromAddress.setValue(res?.data?.id);
          this.fromAddressId = res?.data?.id;
        }
      })
    );
  }

  /**
   * @description phone number formatting.
   */
  formatePhoneNum(phone: string): string {
    let num = String(phone);
    num = num.replace(/[^0-9]/g, '');
    const num1 = num.substring(0, 3);
    const num2 = num.substring(3, 6);
    const num3 = num.substring(6, 10);
    return phone !== '' && phone !== null
      ? '(' + num1 + ') ' + num2 + '-' + num3
      : '';
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}

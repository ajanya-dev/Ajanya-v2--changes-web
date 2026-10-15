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
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { GoogleAddressService } from 'src/app/core/services/google-address.service';
import {
  IAddressDetails,
  IShippingData,
  IShippingLabelAddress,
  ShippingSteps
} from 'src/app/modules/business-tools/shipping-label/model/shipping-label';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { ShippingLabelService } from 'src/app/shared/service/shipping-label/shipping-label.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { AddAddressModalComponent } from '../../modals/add-address-modal/add-address-modal.component';
import { MatCheckbox } from '@angular/material/checkbox';
import { NgIf, NgClass } from '@angular/common';
import { CommonCountryDropDownComponent } from '../../../../../shared/v3/common-country-drop-down/common-country-drop-down.component';
import { NgxMaskDirective } from 'ngx-mask';
import { ControlMessageComponent } from '../../../../../shared/components/control-message/control-message/control-message.component';

@Component({
  selector: 'app-from-address-label',
  templateUrl: './from-address-label.component.html',
  styleUrls: ['./from-address-label.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    ControlMessageComponent,
    NgxMaskDirective,
    CommonCountryDropDownComponent,
    NgIf,
    MatCheckbox,
    NgClass
  ]
})
export class FromAddressLabelComponent implements OnInit, OnChanges {
  @Input() shipping_data: IShippingData;
  @Output() emitData = new EventEmitter<IShippingData>();

  fromAddrForm: UntypedFormGroup;
  isShow = false;
  isExistaddress = false;
  loading = false;
  subscriptions: Subscription[] = [];
  addressDetails: IAddressDetails | undefined;
  fromAddressId: string | null | undefined;
  returnAddressId: string | null | undefined;
  selectedAddress: IShippingLabelAddress | null | undefined;
  isViewReturn = false;
  returnAddress: IShippingLabelAddress;
  nextStep: ShippingSteps;
  prevStep: ShippingSteps;
  fromAddressExist = false;

  constructor(
    private _dialog: MatDialog,
    private _fb: UntypedFormBuilder,
    private _shippingLabelService: ShippingLabelService,
    private _alertService: AlertService,
    private _googleAddressService: GoogleAddressService
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  ngOnChanges(): void {
    this.setSelectedAddress();
    this._googleAddressService.resetGoogleAutocompleteAPI();
  }

  /**
   * @description Initializes the form group for the fromaddress form.
   */
  initForm() {
    this.fromAddrForm = this._fb.group({
      name: ['', [Validators.required]],
      nickName: ['', [Validators.required]],
      company: [''],
      phone: [
        '',
        [Validators.required, ValidationService.phoneNumberValidator]
      ],
      email: ['', [ValidationService.emailValidator]],
      address1: ['', [Validators.required]],
      address2: [''],
      city: ['', [Validators.required]],
      state: ['', [Validators.required]],
      country: ['', [Validators.required]],
      zip: ['', [Validators.required]],
      isReturnAddressSame: [1]
    });
  }

  /**
   * @description Create address body in form.
   */
  createAddressBody() {
    const body = this.fromAddrForm.value;
    return {
      name: body.name,
      company: body.company,
      nickName: body.nickName,
      phone: body.phone,
      email: body.email,
      address1: body.address1,
      address2: body.address2,
      city: body.city,
      state: body.state,
      country: body.country,
      zip: body.zip,
      isReturnAddressSame: body.isReturnAddressSame
    };
  }

  /**
   * @description Set address data in form.
   */
  setaddressForm(data: IShippingLabelAddress) {
    this.fromAddrForm.patchValue({
      name: data?.name,
      company: data?.company,
      nickName: data.nickName,
      phone: data.phone.substring(data.phone.length - 10, data.phone.length),
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
   * @description Set selected address data in form.
   */
  setSelectedAddress() {
    this.selectedAddress = this.shipping_data?.data?.selectedFromAddress;
    if (this.shipping_data?.data?.nextStep === 'from_address') {
      if (this.selectedAddress) {
        if (this.shipping_data?.data?.prevStep === 'existing_addr') {
          this.setaddressForm(this.selectedAddress);
          this.fromAddressId = this.selectedAddress?.id;
          this.setFromData();
        }
      } else {
        if (this.shipping_data?.data?.prevStep != 'existing_addr') {
          if (
            this.shipping_data?.data?.prevStep != 'from_address' &&
            this.shipping_data?.data?.prevStep == 'delivery_address'
          ) {
            if (!this.shipping_data?.data?.fromAddressExist) {
              this.getUserAddress();
              this.fromAddressExist = !this.fromAddressExist;
            }
          }
        }
      }
    }
  }

  /**
   * @description Get user address to set in address form.
   */
  getUserAddress() {
    this.subscriptions.push(
      this._shippingLabelService.getUserAddress().subscribe((res) => {
        if (res.success) {
          this.setaddressForm(res?.result);
          this.fromAddressId = res?.result?.id;
          this.setFromData();
        }
      })
    );
  }

  /**
   * @description Open existing from addresses page.
   */
  openExistingAddress() {
    this.isExistaddress = !this.isExistaddress;
    if (this.isExistaddress) {
      (this.nextStep = 'existing_addr'),
        (this.prevStep = 'from_address'),
        this.onNextStep();
    }
  }

  /**
   * @description Click to next page.
   */
  nextstep() {
    this.isExistaddress = false;
    this.submit();
  }

  /**
   * @description Submit address form.
   */
  submit() {
    this.addressDetails = this.shipping_data.data.addressDetails;
    this.fromAddrForm.markAllAsTouched();
    if (this.fromAddrForm.invalid) {
      return;
    }

    if (!this.isViewReturn) {
      if (!this.fromAddrForm.controls.isReturnAddressSame.value) {
        this._alertService.warningAlert({
          content: 'Return address is required'
        });
        return;
      } else {
        this.createFromAddress();
      }
    } else {
      this.createFromAddress();
    }
  }

  /**
   * @description Create from address.
   */
  createFromAddress() {
    this.loading = true;
    this.subscriptions.push(
      this._shippingLabelService
        .createFromAddress(this.createAddressBody())
        .pipe(finalize(() => (this.loading = false)))
        .subscribe((res) => {
          if (res?.success) {
            if (res.data?.returnAddressId != null) {
              this.returnAddressId = res.data?.returnAddressId;
            }
            this.fromAddressId = res.data?.id;
            this.nextPage();
          }
        })
    );
  }

  /**
   * @description Set from address data.
   */
  setFromData() {
    const details = this.shipping_data;
    details.data.addressDetails = {
      deliverAddressId:
        this.shipping_data.data.addressDetails?.deliverAddressId,
      fromAddressId: this.fromAddressId,
      returnAddressId: this.returnAddressId
    };
  }

  /**
   * @description Click to next page.
   */
  nextPage() {
    if (
      this.shipping_data.data.packageType == 'Card' ||
      this.shipping_data?.data.packageType === 'Letter'
    ) {
      this.nextStep = 'rate_page';
    } else {
      this.nextStep = 'package_page';
    }
    this.onNextStep();
  }

  /**
   * @description Passing data to next page.
   */
  onNextStep() {
    const data: IShippingData = {
      success: true,
      data: {
        nextStep: this.nextStep,
        prevStep: this.prevStep,
        addressDetails: {
          deliverAddressId:
            this.shipping_data?.data?.addressDetails?.deliverAddressId,
          fromAddressId: this.fromAddressId,
          returnAddressId: this.returnAddressId
        },
        packageType: this.shipping_data?.data?.packageType,
        selectedFromAddress: this.shipping_data?.data?.selectedFromAddress,
        selectedDeliveryAddress:
          this.shipping_data?.data?.selectedDeliveryAddress,
        carrierType: this.shipping_data?.data?.carrierType,
        isExistaddress: this.isExistaddress,
        fromAddressExist: this.fromAddressExist
      }
    };
    this.onEmit(data);
  }

  /**
   * @description Click to back page.
   */
  backstep() {
    (this.nextStep = 'delivery_address'),
      (this.prevStep = 'from_address'),
      (this.fromAddressExist = true);
    this.onNextStep();
  }

  /**
   * @description select return address is same or not.
   */
  onChecked(event: any) {
    if (event.checked) {
      this.fromAddrForm.controls.isReturnAddressSame.setValue(1);
    } else {
      this.fromAddrForm.controls.isReturnAddressSame.setValue(0);
      if (this.fromAddrForm.value.isReturnAddressSame === 0) {
        const alert = this._alertService.warningAlert({
          content: 'Please add Return Address'
        });
        alert.afterClosed().subscribe((r) => {
          if (r) {
            this.addAddress();
          }
        });
        return;
      }
    }
  }

  /**
   * @description Add return address.
   */
  addAddress() {
    const dialogRef = this._dialog.open(AddAddressModalComponent, {
      maxWidth: '700px',
      width: '93%',
      data: { mode: 'Add', type: 'addreturn' }
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res) {
        this._alertService.successAlert({
          title: 'Success',
          content: 'Address added',
          close: true
        });
        this.returnAddress = res.data;
        this.returnAddressId = res.res.data?.id;
        this.isViewReturn = !this.isViewReturn;
      }
    });
    this.setFromData();
  }

  /**
   * @description Edt return address.
   */
  editAddress() {
    const dialogRef = this._dialog.open(AddAddressModalComponent, {
      maxWidth: '700px',
      width: '93%',
      data: {
        mode: 'Edit',
        type: 'viewreturn',
        returnAddressId: this.returnAddressId,
        address: this.returnAddress
      }
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res.success) {
        this._alertService.successAlert({
          title: 'Success',
          content: 'Address updated',
          close: true
        });
        this.returnAddressId = res?.data?.id;
        this.isViewReturn = !this.isViewReturn;
      }
    });
  }

  /**
   * @description Emit data.
   */
  onEmit(data: IShippingData): void {
    this.emitData.next(data);
  }

  /**
   * @description Load Google Address API.
   */
  loadGoogleAddress(address: HTMLInputElement) {
    this._googleAddressService.googleAutocomplete({
      addressElement: address,
      allowedCountries: ['us']
    });
    const googleAddressSubscription =
      this._googleAddressService.googleAddress$.subscribe((res) => {
        this.fromAddrForm.patchValue({
          address1: res.address,
          city: res.city,
          state: res.state,
          country: res.country,
          zip: res.zip
        });
        googleAddressSubscription.unsubscribe();
      });
  }
}

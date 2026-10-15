import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
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
import { GoogleAddressService } from 'src/app/core/services/google-address.service';
import {
  IAddressDetails,
  IShippingData,
  IShippingLabelAddress,
  shipOptions,
  ShippingSteps,
  IToolTipDimension
} from 'src/app/modules/business-tools/shipping-label/model/shipping-label';
import { ShippingLabelService } from 'src/app/shared/service/shipping-label/shipping-label.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { CommonCountryDropDownComponent } from '../../../../../shared/v3/common-country-drop-down/common-country-drop-down.component';
import { NgxMaskDirective } from 'ngx-mask';
import { ControlMessageComponent } from '../../../../../shared/components/control-message/control-message/control-message.component';
import { NgFor, NgClass, NgIf } from '@angular/common';
import { MatTooltip } from '@angular/material/tooltip';

@Component({
  selector: 'app-delivery-address-label',
  templateUrl: './delivery-address-label.component.html',
  styleUrls: ['./delivery-address-label.component.scss'],
  standalone: true,
  imports: [
    MatTooltip,
    NgFor,
    NgClass,
    FormsModule,
    ReactiveFormsModule,
    ControlMessageComponent,
    NgxMaskDirective,
    CommonCountryDropDownComponent,
    NgIf
  ]
})
export class DeliveryAddressLabelComponent
  implements OnInit, OnChanges, OnDestroy
{
  @Input() shipping_data: IShippingData;
  @Output() emitData = new EventEmitter<IShippingData>();

  deliverAddrForm: UntypedFormGroup;
  subscriptions: Subscription[] = [];
  shipOptions: shipOptions[] = [
    { name: 'Card', icon: '../../../../assets/images/shipping-label/card.svg' },
    {
      name: 'Letter',
      icon: '../../../../assets/images/shipping-label/letter.svg'
    },
    {
      name: 'Soft Package',
      icon: '../../../../assets/images/shipping-label/soft-pack.svg'
    },
    { name: 'Box', icon: '../../../../assets/images/shipping-label/box.svg' }
  ];
  isExistaddress = false;
  loading = false;
  selectedPackage: shipOptions;
  packageCode: string;
  selectedAddress: IShippingLabelAddress | null | undefined;
  deliverAddressId: string | null | undefined;
  addressDetails: IAddressDetails | undefined;
  clicked = false;
  nextStep: ShippingSteps;
  prevStep: ShippingSteps;
  cardDimension: IToolTipDimension;
  letterDimension: IToolTipDimension;

  constructor(
    private _fb: UntypedFormBuilder,
    private _shippingLabelService: ShippingLabelService,
    private _googleAddressService: GoogleAddressService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.getTooltipDimensions();
    this.getPackage();
    this._googleAddressService.resetGoogleAutocompleteAPI();
  }

  ngOnChanges() {
    this.setForm(this.shipping_data);
    if (this.shipping_data?.data.nextStep == 'delivery_address') {
      this.resetDeliverForm(this.shipping_data);
    }
  }

  /**
   * @description Initializes the form group for the form.
   */
  initForm() {
    this.deliverAddrForm = this._fb.group({
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
      zip: ['', [Validators.required]]
    });
  }

  /**
   * @description Create address body.
   */
  createAddressBody() {
    const body = this.deliverAddrForm.value;
    return {
      name: body.name,
      nickName: body.nickName,
      company: body.company,
      phone: body.phone,
      email: body.email,
      address1: body.address1,
      address2: body.address2,
      city: body.city,
      state: body.state,
      country: body.country,
      zip: body.zip
    };
  }

  /**
   * @description Set address data in form.
   */
  setaddressForm(data: IShippingLabelAddress) {
    this.deliverAddrForm.patchValue({
      name: data?.name,
      nickName: data?.nickName,
      company: data?.company,
      phone: data?.phone,
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
   * @description Get package type.
   */
  getPackage() {
    this.selectedPackage = this.shipOptions[0];
    this.packageCode = this.shipOptions[0].name;
  }

  /**
   * @description Select package type.
   */
  selectPackage(index: number, item: shipOptions) {
    const activeElements = document.querySelectorAll('.active_package');
    activeElements.forEach((element) => {
      if (element.classList.contains('active_package')) {
        element.classList.remove('active_package');
      }
    });
    const packageParentElement = document.querySelector(
      `#parentindexElement_${index}`
    ) as HTMLDivElement;
    packageParentElement.classList.add('active_package');
    this.selectedPackage = item;
    this.packageCode = item.name;
  }

  /**
   * @description Set address form.
   */
  setForm(shippingData: IShippingData) {
    if (shippingData?.data.nextStep == 'delivery_address') {
      if (shippingData?.data.prevStep == 'existing_addr') {
        this.selectedAddress = shippingData?.data?.selectedDeliveryAddress;
        if (this.selectedAddress) {
          this.setaddressForm(this.selectedAddress);
        }
      }
    }
  }

  /**
   * @description Reset address form.
   */
  resetDeliverForm(shipping_data: IShippingData) {
    if (shipping_data?.data.deletedDeliverId != undefined) {
      if (
        shipping_data?.data.deletedDeliverId ==
        shipping_data?.data.addressDetails?.deliverAddressId
      ) {
        this.deliverAddrForm.reset();
        this.shipping_data.data.addressDetails = {
          deliverAddressId: null
        };
      }
    }
  }

  /**
   * @description Get tooltip dimensions.
   */
  getTooltipDimensions() {
    this.subscriptions.push(
      this._shippingLabelService.getTooltipDimensions().subscribe((res) => {
        if (res.data) {
          res.data.forEach((e) => {
            if (e.package_code == 'Card') {
              this.cardDimension = e;
            }
            if (e.package_code == 'Letter') {
              this.letterDimension = e;
            }
          });
        }
      })
    );
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
    this.deliverAddrForm.markAllAsTouched();
    if (this.deliverAddrForm.invalid) {
      return;
    }
    this.addressDetails = this.shipping_data?.data?.addressDetails;

    if (!this.addressDetails?.deliverAddressId) {
      this.createDeliveryAddress();
    } else {
      this.updateDeliveryAddress(this.addressDetails?.deliverAddressId);
    }
  }

  /**
   * @description Add delivery address.
   */
  createDeliveryAddress() {
    this.loading = true;
    this.subscriptions.push(
      this._shippingLabelService
        .saveDeliveryAddress(this.createAddressBody())
        .pipe(finalize(() => (this.loading = false)))
        .subscribe((res) => {
          if (res?.success) {
            this.deliverAddressId = res.data?.id;
            this.nextStep = 'from_address';
            this.prevStep = 'delivery_address';
            this.onNextStep();
          }
        })
    );
  }

  /**
   * @description Update delivery address.
   */
  updateDeliveryAddress(deliverAddressId: string) {
    const body = this.createAddressBody();
    this.loading = true;
    this.subscriptions.push(
      this._shippingLabelService
        .updateDeliveryAddress(deliverAddressId, body)
        .pipe(finalize(() => (this.loading = false)))
        .subscribe((res) => {
          if (res?.success) {
            this.deliverAddressId = deliverAddressId;
            this.nextStep = 'from_address';
            this.onNextStep();
          }
        })
    );
  }

  /**
   * @description Pass data when move to next step.
   */
  onNextStep() {
    const shipdata: IShippingData = {
      success: true,
      data: {
        nextStep: this.nextStep,
        prevStep: this.prevStep,
        addressDetails: {
          deliverAddressId: this.deliverAddressId,
          fromAddressId: this.shipping_data?.data?.addressDetails?.fromAddressId
        },
        packageType: this.packageCode,
        selectedFromAddress: this.shipping_data?.data?.selectedFromAddress,
        selectedDeliveryAddress:
          this.shipping_data?.data?.selectedDeliveryAddress,
        carrierType: this.shipping_data?.data?.carrierType,
        isExistaddress: this.isExistaddress,
        fromAddressExist: this.shipping_data?.data?.fromAddressExist
      }
    };
    this.onEmit(shipdata);
  }

  /**
   * @description Click to existing addresses page.
   */
  openExistingAddress() {
    this.isExistaddress = !this.isExistaddress;
    if (this.isExistaddress) {
      (this.nextStep = 'existing_addr'),
        (this.prevStep = 'delivery_address'),
        this.onNextStep();
    }
  }

  /**
   * @description Emit datas.
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
        this.deliverAddrForm.patchValue({
          address1: res.address,
          city: res.city,
          state: res.state,
          country: res.country,
          zip: res.zip
        });
        googleAddressSubscription.unsubscribe();
      });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}

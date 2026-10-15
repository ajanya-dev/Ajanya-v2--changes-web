import { Component, DestroyRef, OnInit, inject, signal, computed } from '@angular/core';
// import { ElementRef, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, DatePipe } from '@angular/common';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Router } from '@angular/router';
import { distinctUntilChanged, finalize, skip, take } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
// import { MatDialogRef } from '@angular/material/dialog';
import { MatTooltip } from '@angular/material/tooltip';
import { MatBadge } from '@angular/material/badge';
import { LucideAngularModule } from 'lucide-angular';

import {
  ICheckAttachmentData,
  ICheckShipingTypes,
  IChequedata,
  IMailBulkShippingAddress,
  IMailShippingCalculations,
  INewCheck,
  IShippingCostCalculation
} from 'src/app/modules/check/model/check';
import { IBankDropdown } from 'src/app/models/bank';
import { IPayeeDropdown } from 'src/app/modules/payee/payee-v2/model/payee';
import { IGettingStartedAPI } from 'src/app/models/getting-started';
import { IViewPayee } from 'src/app/modules/payee/payee-v2/model/payee';

import { CheckService } from 'src/app/shared/service/check/check.service';
import { CommonOnInitService } from 'src/app/shared/service/common-onInit/common-on-init.service';
import { BankService } from 'src/app/shared/service/bank/bank.service';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CheckDesignService } from 'src/app/shared/service/check-design/check-design.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';

import { BankAcDropdownV4Component } from 'src/app/shared/components/v4/dropdowns/bank-ac-dropdown-v4/bank-ac-dropdown-v4.component';
import { PayeeDropdownV4Component } from 'src/app/shared/components/v4/dropdowns/payee-dropdown-v4/payee-dropdown-v4.component';
import { V4RadioGroupComponent, IV4RadioOption } from 'src/app/shared/V4/v4-radio-button/v4-radio-button.component';
import { V4CommonDropDownSelectorComponent } from 'src/app/shared/V4/v4-dropdown/v4-common-dropdown-selector.component';
import { AddMailAddressModalV4Component } from 'src/app/modules/check/modal/mail-modals/add-mail-address-modal-v4/add-mail-address-modal-v4.component';
import { CommonAmountInputV4Component } from 'src/app/shared/V4/common-amount-input-v4/common-amount-input-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { V4DatePickerComponent } from 'src/app/shared/V4/v4-date-picker/v4-date-picker.component';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';

import { V4AddAttachmentModalComponent, IV4AddAttachmentModalData } from 'src/app/shared/modal/v4-add-attachment-modal/v4-add-attachment-modal.component';
import { UpdatePayeeModalV4Component } from 'src/app/modules/check/modal/mail-modals/update-payee-modal-v4/update-payee-modal-v4.component';
import { UpdateBankModalV4Component } from 'src/app/modules/check/modal/mail-modals/update-bank-modal-v4/update-bank-modal-v4.component';
import { VirtualAccountConfirmationModalComponent } from 'src/app/modules/bank/bank-v2/modals/virtual-account-confirmation-modal/virtual-account-confirmation-modal.component';
import { TruncatePipe } from 'src/app/pipes/truncate.pipe';
import { Country } from 'src/app/data/data/country-list';
// import { SingleMailDraftService } from './single-mail-draft.service';

interface IAddress {
  bank_account_account_name: string;
  bank_account_address_line_1: string;
  bank_account_address_line_2: string;
  bank_account_city: string;
  bank_account_state: string;
  bank_account_zip: string;
  bank_account_country: string;
  enc_id: string;
}

interface IFormDataModel {
  bankAc?: {
    id?: string;
    accountNumber?: string;
    fullAccountNumber?: string;
    bankName?: string;
    bankId?: string;
    routingNumber?: string;
    statusDescription?: string;
    address?: IAddress;
    isItZil?: boolean;
  };
  payee?: {
    id?: string;
    name?: string;
    company?: string | null;
    email?: string | null;
    phone?: string | null;
    addressLine1?: string | null;
    addressLine2?: string | null;
    city?: string | null;
    state?: string | null;
    zip?: string | null;
    country?: string | null;
  };
  shippingType?: ICheckShipingTypes;
  shippingAddressFrom?: { name?: string; id?: string; country?: string; dec_id?: number };
  shippingAddressTo?: { name?: string; id?: string; country?: string; dec_id?: number };
  customShippingType?: ICheckShipingTypes;
  amount?: string | number;
  memo?: string;
  invoiceNumber?: string;
  checkNumber?: number;
  issueDate?: string;
  shippingAddressOption?: string;
}

@Component({
  selector: 'app-v4-single-mail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatTooltip,
    MatBadge,
    LucideAngularModule,
    BankAcDropdownV4Component,
    PayeeDropdownV4Component,
    V4RadioGroupComponent,
    V4CommonDropDownSelectorComponent,
    CommonAmountInputV4Component,
    CommonInputFieldV4Component,
    V4DatePickerComponent,
    CommonButtonV4Component,
    V4ControlMessageComponent,
    TruncatePipe
  ],
  templateUrl: './v4-single-mail.component.html',
  styleUrl: './v4-single-mail.component.scss'
})
export class V4SingleMailComponent implements OnInit {
  private checkService = inject(CheckService);
  private commonOnInitService = inject(CommonOnInitService);
  private bankService = inject(BankService);
  private payeeService = inject(PayeeService);
  private v4AlertService = inject(V4AlertService);
  private checkDesignService = inject(CheckDesignService);
  private headerService = inject(HeaderService);
  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);
  private localStorageService = inject(LocalStorageService);
  // private draftService = inject(SingleMailDraftService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private datePipe = inject(DatePipe);
  private destroyRef = inject(DestroyRef);

  // @ViewChild('cardArea') private cardArea?: ElementRef<HTMLElement>;

  // private centerAlertOnCard<T extends MatDialogRef<unknown, unknown>>(dialogRef: T): T {
  //   const origin = this.cardArea?.nativeElement;
  //   if (!origin) return dialogRef;
  //   const initialPane = document.getElementById(dialogRef.id)?.parentElement;
  //   if (initialPane) initialPane.style.visibility = 'hidden';
  //   requestAnimationFrame(() => {
  //     const pane = document.getElementById(dialogRef.id)?.parentElement;
  //     if (!pane) return;
  //     const cardRect = origin.getBoundingClientRect();
  //     const dialogRect = pane.getBoundingClientRect();
  //     const visibleTop = Math.max(0, cardRect.top);
  //     const visibleBottom = Math.min(window.innerHeight, cardRect.bottom);
  //     const visibleLeft = Math.max(0, cardRect.left);
  //     const visibleRight = Math.min(window.innerWidth, cardRect.right);
  //     const cardCenterY = (visibleTop + visibleBottom) / 2;
  //     const cardCenterX = (visibleLeft + visibleRight) / 2;
  //     const top = cardCenterY - dialogRect.height / 2;
  //     const left = cardCenterX - dialogRect.width / 2;
  //     const maxTop = window.innerHeight - dialogRect.height - 8;
  //     const maxLeft = window.innerWidth - dialogRect.width - 8;
  //     dialogRef.updatePosition({
  //       top: `${Math.max(8, Math.min(maxTop, top))}px`,
  //       left: `${Math.max(8, Math.min(maxLeft, left))}px`
  //     });
  //     pane.style.visibility = '';
  //   });
  //   return dialogRef;
  // }

  // ==================== STEPPER ====================
  currentStep = signal<1 | 2 | 3>(1);
  currentStepIndex = computed(() => this.currentStep() - 1);

  stepperSteps = [
    { key: 1, label: 'Bank & Payee' },
    { key: 2, label: 'Payment Info' },
    { key: 3, label: 'Review & Submit' }
  ];

  // ==================== LOADING STATES ====================
  isShippingTypesLoading = signal(false);
  isCreateCheckLoading = signal(false);
  isLoading = signal(false);
  isSendingMail = signal(false);
  isAttachmentLoading = signal<Record<string, boolean>>({});
  isEditPayeeLoading = signal(false);

  // ==================== FORM ====================
  dateToday = this.datePipe.transform(new Date(), 'yyyy-MM-dd');

  mailingForm = new FormGroup({
    bankAc: new FormControl<IBankDropdown | null>(null, [Validators.required]),
    payee: new FormControl<IPayeeDropdown | null>(null, [Validators.required]),
    shippingType: new FormControl(null, [Validators.required]),
    shippingAddressFrom: new FormControl<IMailBulkShippingAddress | null>(null),
    shippingAddressTo: new FormControl<IMailBulkShippingAddress | null>(null),
    customShippingType: new FormControl(null),
    amount: new FormControl(null, [Validators.required, Validators.min(0.01)]),
    memo: new FormControl(null),
    invoiceNumber: new FormControl<string | null>(null),
    checkNumber: new FormControl<number | null>(null, [Validators.required]),
    issueDate: new FormControl(this.dateToday, [Validators.required])
  });

  // ==================== SHIPPING DATA ====================
  shippingAddress = signal<'to-payee-address' | 'to-custom-address'>('to-payee-address');
  shippingTypeList = signal<ICheckShipingTypes[]>([]);
  shippingList = signal<ICheckShipingTypes[]>([]);
  customShippingTypeList = signal<ICheckShipingTypes[]>([]);

  shippingAddressOptions: IV4RadioOption[] = [
    { id: 'to-payee-address', name: 'Ship to Payee Address' },
    {
      id: 'to-custom-address',
      name: 'Ship to Custom Address',
      tooltip:
        'Send to separate addresses or mail multiple checks to one address in a single envelope.'
    }
  ];

  shippingAddressFromList = signal<IMailBulkShippingAddress[]>([]);
  shippingAddressToList = signal<IMailBulkShippingAddress[]>([]);

  usDefaultShippingType: number | undefined;
  caDefaultShippingType: number | undefined;

  // ==================== CUSTOM ELEMENTS ====================
  customFieldFlag = false;
  IsCustom = false;
  custom_elements: { id: number; custom_element: string }[] = [];
  customElementGroup: { [key: string]: string }[] = [];

  // ==================== ATTACHMENT ====================
  attachmentCount = 0;
  createdExistingAttachments: ICheckAttachmentData[] = [];

  // ==================== STEP 3 DATA ====================
  checkId = signal<string | null>(null);
  formData = signal<IFormDataModel | null>(null);
  checkDetailsResponse = signal<IChequedata | undefined>(undefined);
  attachments = signal<ICheckAttachmentData[]>([]);
  shippingCalculation = signal<IShippingCostCalculation | undefined>(undefined);
  isInvalidBank = signal(false);
  isInvalidPayee = signal(false);
  sortedShippingList = signal<ICheckShipingTypes[]>([]);
  selectedShippingType = new FormControl<string | null>(null);
  isQbAutoSubAccountMapping = signal(false);
  selectedPayee = signal<IPayeeDropdown | undefined>(undefined);

  // ==================== ERROR OVERRIDE FLAGS ====================
  isSubmitWithAlreadyExistedcheckNo = 0;
  isSubmitWithAlreadyExistedcheckfields = 0;
  costCalculation!: IMailShippingCalculations;

  // ==================== LIFECYCLE ====================

  ngOnInit(): void {
    this.headerService.isSubHeaderVisible.next({ hidden: true, animation: false });
    this.getHeaderData();
    this.loadShippingTypes();
    this.loadShippingAddressFrom();
    this.loadShippingAddressTo();
    this.loadCustomElements();
    this.subscribeBankChange();
    this.subscribePayeeChange();
    this.subscribeMailFromChange();
    this.subscribeMailToChange();
    this.subscribeShippingTypeChange();
    // this.restoreDraft();
  }

  // private restoreDraft(): void {
  //   const draft = this.draftService.peek();
  //   if (!draft) return;
  //   this.mailingForm.patchValue(draft.formValue as Partial<typeof this.mailingForm.value>);
  //   this.shippingAddress.set(draft.shippingAddress);
  //   this.IsCustom = draft.isCustom;
  //   this.attachmentCount = draft.attachmentCount;
  //   this.createdExistingAttachments = draft.attachments;
  //   if (draft.checkId) this.checkId.set(draft.checkId);
  //   if (draft.currentStep === 3 && draft.checkId) {
  //     this.storeFormData();
  //     this.currentStep.set(3);
  //     this.loadStep3Data(draft.checkId);
  //   } else {
  //     this.currentStep.set(draft.currentStep);
  //   }
  // }

  // ==================== INIT SUBSCRIPTIONS ====================

  private getHeaderData(): void {
    this.headerService._headerData
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res && res.enabledPlugins.includes('qb-auto-sub-account-mapping')) {
          this.isQbAutoSubAccountMapping.set(true);
        }
      });
  }

  private loadShippingTypes(): void {
    this.isShippingTypesLoading.set(true);
    this.checkService
      .getShippingType()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isShippingTypesLoading.set(false))
      )
      .subscribe((res) => {
        this.shippingTypeList.set(res.data);
        this.shippingList.set([]);
        this.customShippingTypeList.set([]);
        this.setDefaultShippingType(res.data);
      });
  }

  private setDefaultShippingType(shippingType: ICheckShipingTypes[]): void {
    const usTypes = shippingType.filter(
      (ele) => ele.country !== 'Canada' && ele.country !== 'International'
    );
    const defaultType = usTypes.find((ele) => ele.is_default_mailing_type);
    this.usDefaultShippingType = defaultType?.id || undefined;
    const caTypes = shippingType.filter((ele) => ele.country === 'Canada');
    const defaultCaType = caTypes.find((ele) => ele.is_default_mailing_type);
    this.caDefaultShippingType = defaultCaType?.id || 14;
  }

  private loadShippingAddressFrom(selectId?: string): void {
    this.checkService
      .getAddressFrom()
      .pipe(take(1))
      .subscribe((res) => {
        this.shippingAddressFromList.set(res.data);
        if (selectId) {
          const match = res.data.find((a) => String(a.id) === String(selectId));
          if (match) {
            this.mailingForm.controls.shippingAddressFrom.setValue(match);
          }
        }
      });
  }

  private loadShippingAddressTo(selectId?: string): void {
    this.checkService
      .getAddressTo()
      .pipe(take(1))
      .subscribe((res) => {
        const enriched = res.data.map((a) => ({
          ...a,
          countryName: this.resolveCountryName(a.country)
        }));
        this.shippingAddressToList.set(enriched);
        if (selectId) {
          const match = enriched.find((a) => String(a.id) === String(selectId));
          if (match) {
            this.mailingForm.controls.shippingAddressTo.setValue(match);
          }
        }
      });
  }

  private resolveCountryName(countryValue?: string): string {
    if (!countryValue) return '';
    const trimmed = countryValue.trim();
    if (!trimmed) return '';
    const list = Country.countryList();
    const match = list.find(
      (c) =>
        c.code?.toLowerCase() === trimmed.toLowerCase() ||
        c.name?.toLowerCase() === trimmed.toLowerCase()
    );
    return match?.name ?? trimmed;
  }

  private loadCustomElements(): void {
    this.checkDesignService
      .getCustomElements()
      .pipe(take(1))
      .subscribe((res) => {
        this.custom_elements = res.data.custom_elements;
        if (this.custom_elements.length !== 0) {
          this.customFieldFlag = true;
        }
        // const draftCustom = this.draftService.peek()?.customElementGroup;
        this.customElementGroup = this.custom_elements.map((item) => ({
          [item.custom_element]: ''
        }));
      });
  }

  private subscribeBankChange(): void {
    this.mailingForm.controls.bankAc.valueChanges
      .pipe(
        skip(1),
        distinctUntilChanged((prev, curr) => prev?.id === curr?.id),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res?.id) {
          if (res?.isItZil) {
            this.openZilBankWarningAlert();
            this.mailingForm.controls.bankAc.setValue(null, { emitEvent: false });
            return;
          }
          this.loadCheckSerialNo(res.id);
        }
      });
  }

  private isZilAlertOpen = false;

  private openZilBankWarningAlert(): void {
    if (this.isZilAlertOpen) return;
    this.isZilAlertOpen = true;
    // const ref = this.centerAlertOnCard(this.v4AlertService.warningAlert({
    //   content: 'Cannot use Zil bank account for single mail. Please select a different bank account.'
    // }));
    const ref = this.v4AlertService.warningAlert({
      content: 'Cannot use Zil bank account for single mail. Please select a different bank account.'
    });
    ref.afterClosed().subscribe(() => {
      this.isZilAlertOpen = false;
    });
  }

  private loadCheckSerialNo(bankId: string): void {
    this.bankService
      .getCheckSerialNo(bankId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res.success === true) {
          const checkSerialNo = res.data[0];
          this.mailingForm.controls.checkNumber.setValue(checkSerialNo.serialNo);
        }
      });
  }

  private subscribePayeeChange(): void {
    this.mailingForm.controls.payee.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((payee) => {
        this.mailingForm.controls.shippingType.setValue(null);
        if (payee?.id) {
          if (this.selectedPayee()?.id === payee?.id) return;
          this.selectedPayee.set(payee);
          this.sortedOption(payee?.country);
        } else {
          this.clearPayee();
        }
      });
  }

  private clearPayee(): void {
    this.selectedPayee.set(undefined);
    this.resetShippingDefaults();
  }

  private resetShippingDefaults(): void {
    this.shippingList.set([]);
    this.customShippingTypeList.set([]);
  }

  private sortedOption(value: string | undefined): void {
    if (!value) {
      this.shippingList.set(
        this.shippingTypeList().filter((address) => address.country === 'International')
      );
      return;
    }
    const USA = ['united states', 'us', 'usa', 'united states of america', 'US'];
    const ca = ['canada', 'ca'];
    const country = value?.toLowerCase() || '';
    let selectCountry;
    if (USA.includes(country)) {
      selectCountry = 'United States';
    } else if (ca.includes(country)) {
      selectCountry = 'Canada';
    } else {
      selectCountry = value;
    }

    if (selectCountry === 'Canada') {
      this.shippingList.set(
        this.shippingTypeList().filter((address) => address.country === 'Canada')
      );
    } else if (selectCountry === 'United States') {
      this.shippingList.set(
        this.shippingTypeList().filter(
          (address) => address.country !== 'Canada' && address.country !== 'International'
        )
      );
    } else {
      this.shippingList.set(
        this.shippingTypeList().filter((address) => address.country === 'International')
      );
    }
  }

  private subscribeMailToChange(): void {
    this.mailingForm.controls.shippingAddressTo.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        if (!value) {
          this.customShippingTypeList.set([]);
          return;
        }
        let address: any = value;
        if (typeof value === 'string') {
          try {
            address = JSON.parse(value);
          } catch {
            address = this.shippingAddressToList().find((a) => a.name === value);
          }
        }
        if (address?.id && this.mailingForm.controls.shippingAddressFrom.value) {
          this.getToSingleId(address.id);
        } else {
          this.customShippingTypeList.set([]);
        }
      });
  }

  private subscribeMailFromChange(): void {
    this.mailingForm.controls.shippingAddressFrom.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        const toValue = this.mailingForm.controls.shippingAddressTo.value;
        if (!value || !toValue) {
          this.customShippingTypeList.set([]);
          return;
        }
        let address: any = toValue;
        if (typeof toValue === 'string') {
          try {
            address = JSON.parse(toValue);
          } catch {
            address = this.shippingAddressToList().find((a) => a.name === toValue);
          }
        }
        if (address?.id) {
          this.getToSingleId(address.id);
        }
      });
  }

  private getToSingleId(id: string): void {
    this.checkService
      .getToSingleId(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res?.data?.country) {
          this.setCustomShippingType(res.data.country);
        }
      });
  }

  private setCustomShippingType(country: string): void {
    switch (country) {
      case 'United States':
        this.customShippingTypeList.set(
          this.shippingTypeList().filter(
            (type) => type.id === 4 || type.id === 5 || type.id === 12
          )
        );
        break;
      case 'Canada':
        this.customShippingTypeList.set(
          this.shippingTypeList().filter(
            (type) => type.id === 16 && type.country === 'Canada'
          )
        );
        break;
      default:
        this.customShippingTypeList.set(
          this.shippingTypeList().filter(
            (type) => type.id === 18 && type.country === 'International'
          )
        );
        break;
    }
  }

  private subscribeShippingTypeChange(): void {
    this.selectedShippingType.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        let selectedType: ICheckShipingTypes | undefined;
        if (value) {
          try {
            selectedType = JSON.parse(value);
          } catch {
            selectedType = this.sortedShippingList().find((type) => type.name === value);
          }
        }

        if (selectedType) {
          const updatedFormData = { ...this.formData(), shippingType: selectedType };
          this.formData.set(updatedFormData);
          this.calculateShippingCost();
        } else {
          const updatedFormData = { ...this.formData(), shippingType: undefined };
          this.formData.set(updatedFormData);
          this.shippingCalculation.set(undefined);
        }
      });
  }

  // ==================== SHIPPING ADDRESS TOGGLE ====================

  onShippingAddressChange(id: string | number): void {
    const addressId = id as 'to-payee-address' | 'to-custom-address';
    this.shippingAddress.set(addressId);
    if (addressId === 'to-custom-address') {
      this.updateCustomAddressValidation(true);
      this.updatePayeeAddressValidation(false);
    } else {
      this.updatePayeeAddressValidation(true);
      this.updateCustomAddressValidation(false);
    }
  }

  private updateCustomAddressValidation(isRequired: boolean): void {
    if (isRequired) {
      this.mailingForm.controls.shippingAddressTo.setValidators([Validators.required]);
      this.mailingForm.controls.shippingAddressFrom.setValidators([Validators.required]);
      this.mailingForm.controls.customShippingType.setValidators([Validators.required]);
    } else {
      this.mailingForm.controls.shippingAddressTo.clearValidators();
      this.mailingForm.controls.shippingAddressFrom.clearValidators();
      this.mailingForm.controls.customShippingType.clearValidators();
    }
    this.mailingForm.controls.shippingAddressTo.updateValueAndValidity();
    this.mailingForm.controls.shippingAddressFrom.updateValueAndValidity();
    this.mailingForm.controls.customShippingType.updateValueAndValidity();
  }

  private updatePayeeAddressValidation(isRequired: boolean): void {
    if (isRequired) {
      this.mailingForm.controls.shippingType.setValidators([Validators.required]);
    } else {
      this.mailingForm.controls.shippingType.clearValidators();
    }
    this.mailingForm.controls.shippingType.updateValueAndValidity();
  }

  // ==================== CUSTOM FIELDS ====================

  toggleCustomFields(toggle: boolean): void {
    this.IsCustom = toggle;
  }

  // ==================== ATTACHMENT ====================

  openAddAttachment(): void {
    // const dialogRef = this.centerAlertOnCard(
    //   this.dialog.open<V4AddAttachmentModalComponent, IV4AddAttachmentModalData>(
    //     V4AddAttachmentModalComponent,
    //     {
    //       width: '700px',
    //       maxWidth: '95vw',
    //       panelClass: 'paddingless-modal-rounded',
    //       data: {
    //         id: 0,
    //         type: 'checks',
    //         existingData: this.createdExistingAttachments as any,
    //         formFieldName: 'attachment'
    //       }
    //     }
    //   )
    // );
    const dialogRef = this.dialog.open<V4AddAttachmentModalComponent, IV4AddAttachmentModalData>(
      V4AddAttachmentModalComponent,
      {
        width: '700px',
        maxWidth: '95vw',
        panelClass: 'paddingless-modal-rounded',
        data: {
          id: 0,
          type: 'checks',
          existingData: this.createdExistingAttachments as any,
          formFieldName: 'attachment',
          isMail: true
        }
      }
    );
    dialogRef.afterClosed().subscribe((res) => {
      if (res) {
        this.createdExistingAttachments = res.existingData;
        this.attachmentCount = res.existingData.length;
      }
    });
  }

  // ==================== STEP NAVIGATION ====================

  onNextStep1(): void {
    // Only validate step 1 fields
    this.mailingForm.controls.bankAc.markAsTouched();
    this.mailingForm.controls.payee.markAsTouched();
    if (this.shippingAddress() === 'to-custom-address') {
      this.mailingForm.controls.shippingAddressFrom.markAsTouched();
      this.mailingForm.controls.shippingAddressTo.markAsTouched();
      this.mailingForm.controls.customShippingType.markAsTouched();
      if (
        this.mailingForm.controls.bankAc.invalid ||
        this.mailingForm.controls.payee.invalid ||
        this.mailingForm.controls.shippingAddressFrom.invalid ||
        this.mailingForm.controls.shippingAddressTo.invalid ||
        this.mailingForm.controls.customShippingType.invalid
      ) {
        return;
      }
    } else {
      this.mailingForm.controls.shippingType.markAsTouched();
      if (
        this.mailingForm.controls.bankAc.invalid ||
        this.mailingForm.controls.payee.invalid ||
        this.mailingForm.controls.shippingType.invalid
      ) {
        return;
      }
    }
    this.currentStep.set(2);
  }

  onNextStep2(): void {
    this.mailingForm.controls.amount.markAsTouched();
    this.mailingForm.controls.checkNumber.markAsTouched();
    this.mailingForm.controls.issueDate.markAsTouched();
    if (
      this.mailingForm.controls.amount.invalid ||
      this.mailingForm.controls.checkNumber.invalid ||
      this.mailingForm.controls.issueDate.invalid
    ) {
      return;
    }
    this.saveCheck();
  }

  onBackStep(step: 1 | 2 | 3): void {
    switch (step) {
      case 1:
        // this.draftService.clear();
        this.router.navigate(['/v4/manage/business-tools/mail-dashboard/index']);
        break;
      case 2:
        this.currentStep.set(1);
        break;
      case 3:
        this.currentStep.set(2);
        break;
    }
  }

  goToStep(step: 1 | 2): void {
    this.currentStep.set(step);
  }

  // ==================== STEP 2 → 3: CREATE CHECK ====================

  private saveCheck(): void {
    const verificationDetails: IGettingStartedAPI =
      this.localStorageService.getItem('gettingStartedData');
    if (verificationDetails.verification === 0) {
      // const alert = this.centerAlertOnCard(this.v4AlertService.warningAlert({
      //   content: 'Please verify your email and phone number to proceed.',
      //   doneMsg: 'Verify Now',
      //   isCancel: true,
      //   cancelMsg: 'Cancel'
      // }));
      const alert = this.v4AlertService.warningAlert({
        content: 'Please verify your email and phone number to proceed.',
        doneMsg: 'Verify Now',
        isCancel: true,
        cancelMsg: 'Cancel'
      });
      alert.afterClosed().subscribe((res) => {
        if (res) {
          this.commonOnInitService.openEmailPhoneVerificationModal();
        }
      });
      return;
    }

    this.isCreateCheckLoading.set(true);
    const payload = this.getCheckPayload();
    this.checkService
      .createCheck(payload)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isCreateCheckLoading.set(false))
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.checkId.set(res.data.id);
            this.storeFormData();
            this.currentStep.set(3);
            this.loadStep3Data(res.data.id);
          }
        },
        error: (e) => {
          if (e?.error.errorCode === 190) {
            // const warn = this.centerAlertOnCard(this.v4AlertService.confirmAlert({
            //   title: e.error.errorMsg,
            //   content: 'Do you want to proceed anyway?',
            //   doneMsg: 'OK',
            //   cancelMsg: 'Cancel'
            // }));
            const warn = this.v4AlertService.confirmAlert({
              title: e.error.errorMsg,
              content: 'Do you want to proceed anyway?',
              doneMsg: 'OK',
              cancelMsg: 'Cancel'
            });
            warn.afterClosed().subscribe((r) => {
              if (r) {
                this.isSubmitWithAlreadyExistedcheckfields = 1;
                this.saveCheck();
              }
            });
          }
          if (e?.error.errorCode === 213) {
            // const warn = this.centerAlertOnCard(this.v4AlertService.confirmAlert({
            //   title: e.error.errorMsg,
            //   content: 'Do you want to proceed anyway?',
            //   doneMsg: 'OK',
            //   cancelMsg: 'Cancel'
            // }));
            const warn = this.v4AlertService.confirmAlert({
              title: e.error.errorMsg,
              content: 'Do you want to proceed anyway?',
              doneMsg: 'OK',
              cancelMsg: 'Cancel'
            });
            warn.afterClosed().subscribe((r) => {
              if (r) {
                this.isSubmitWithAlreadyExistedcheckNo = 1;
                this.saveCheck();
              }
            });
          }
          if (e?.error.errorCode === 515) {
            this.openPayeeWarning(e?.error.errorMsg);
          }
          if (e?.error.errorCode === 731) {
            // this.centerAlertOnCard(this.v4AlertService.warningAlert({
            //     title: 'No Bank Account Found',
            //     content: e?.error.errorMsg,
            //     doneMsg: 'Add Bank Account',
            //     cancelMsg: 'Cancel',
            //     isCancel: true
            //   }))
            //   .afterClosed()
            //   .subscribe((result: boolean | undefined) => {
            //     if (result) {
            //       this.router.navigate(['/manage/users/add-bank-account']);
            //     }
            //   });
            this.v4AlertService.warningAlert({
                title: 'No Bank Account Found',
                content: e?.error.errorMsg,
                doneMsg: 'Add Bank Account',
                cancelMsg: 'Cancel',
                isCancel: true
              })
              .afterClosed()
              .subscribe((result: boolean | undefined) => {
                if (result) {
                  this.router.navigate(['/manage/users/add-bank-account']);
                }
              });
          }
          if (
            ![213, 190].includes(e?.error.errorCode) &&
            e.status !== 422 &&
            e?.error.permissionRequired !== 'check-create' &&
            e?.error.errorCode
          ) {
            // this.centerAlertOnCard(this.v4AlertService.warningAlert({
            //   content: e?.error.errorMsg
            // }));
            this.v4AlertService.warningAlert({
              content: e?.error.errorMsg
            });
          }
        }
      });
  }

  private getCheckPayload(): INewCheck {
    const formValue = this.mailingForm.value;
    return {
      bankAccount: formValue.bankAc?.id ? String(formValue.bankAc.id) : '',
      payee: formValue.payee?.id ? String(formValue.payee.id) : '',
      amount: formValue.amount ? String(formValue.amount) : '',
      checkIssueDate: formValue.issueDate ? String(formValue.issueDate) : '',
      scheduleDate: null,
      category: '',
      checkSerialNo: formValue.checkNumber ? Number(formValue.checkNumber) : 0,
      accountNo: '',
      invoiceNo: formValue.invoiceNumber ? String(formValue.invoiceNumber) : '',
      note: '',
      memo: formValue.memo ? String(formValue.memo) : '',
      no_amount: 0,
      no_sign: 0,
      no_payee: 0,
      no_date: 0,
      isVendorCreditApplied: 0,
      vendorCredit: 0,
      commentIds: [],
      attachmentIds: this.createdExistingAttachments.map((e) => e.id),
      attachRemittanceToCheck: '0',
      attachCategoryToCheck: '0',
      attachExpenseToCheck: '0',
      attachNetsuiteExpenseToCheck: '0',
      remittance_type: 0,
      freshbookCompanyId: '',
      attachFreshbooksExpenseToCheck: '',
      freshbookExpenseDetails: [],
      categoryDetails: [],
      expenseDetails: '',
      netsuiteExpenseDetails: '',
      realmId: '',
      locationId: '',
      mappingId: '',
      qbBankId: '',
      companyId: '',
      netsuiteBankId: '',
      bills: [],
      isMapping: 0,
      quickbook: 0,
      permission_action: 0,
      customElements: this.customElementGroup,
      isCloned: 0,
      remittance: [],
      warning: this.isSubmitWithAlreadyExistedcheckfields,
      checkNumberWarning: this.isSubmitWithAlreadyExistedcheckNo
    };
  }

  private storeFormData(): void {
    const parseJsonField = (value: any): any => {
      if (!value) return undefined;
      if (typeof value === 'object') return value;
      try { return JSON.parse(value); } catch { return undefined; }
    };

    const customShippingType = parseJsonField(this.mailingForm.controls.customShippingType.value);
    const shippingType = parseJsonField(this.mailingForm.controls.shippingType.value);
    const shippingAddressFrom = parseJsonField(this.mailingForm.controls.shippingAddressFrom.value);
    const shippingAddressTo = parseJsonField(this.mailingForm.controls.shippingAddressTo.value);

    const fd: IFormDataModel = {
      ...this.mailingForm.value as any,
      ...(customShippingType ? { customShippingType } : {}),
      ...(shippingType ? { shippingType } : {}),
      ...(shippingAddressFrom ? { shippingAddressFrom } : {}),
      ...(shippingAddressTo ? { shippingAddressTo } : {}),
      shippingAddressOption: this.shippingAddress()
    };
    this.formData.set(fd);
  }

  // ==================== STEP 3: LOAD DATA ====================

  private loadStep3Data(checkId: string): void {
    this.isLoading.set(true);
    this.checkService
      .getChequeDetails({ ids: [checkId], is_signature: 1 })
      .pipe(take(1))
      .subscribe({
        next: (res) => {
          this.checkDetailsResponse.set(res.data);
          const encId = res.data?.datas?.[0]?.enc_id as string;
          const bankAccountId = res.data?.datas?.[0]?.enc_bank_account_id as string;

          this.bankValidation(encId);
          this.getBankDetails(bankAccountId);

          if (this.formData()?.shippingAddressOption === 'to-payee-address') {
            this.payeeValidation(encId);
            this.getShippingType(res.data?.datas?.[0]?.payee_country as string);
          }

          if (res.data?.datas?.[0]?.is_exisiting_attach) {
            this.getAttachments(encId);
          } else {
            this.calculateShippingCost();
          }
        }
      });
  }

  private bankValidation(checkId: string): void {
    this.checkService
      .bankvalidation({ ids: [checkId] })
      .pipe(take(1))
      .subscribe({
        next: (res) => {
          if (!res) return;
          const { data } = res;
          const has731Error = [checkId].some(
            (el: string) => !data[el].success && data[el].error_code === 731
          );
          if (has731Error) {
            this.handleError731(res);
          }
          this.isInvalidBank.set(!data[checkId].success);
        }
      });
  }

  private handleError731(error: any): void {
    // this.centerAlertOnCard(this.v4AlertService.warningAlert({
    //     title: 'No Bank Account Found',
    //     content: error.error?.errorMsg || 'Bank account not found',
    //     doneMsg: 'Add Bank Account',
    //     cancelMsg: 'Cancel',
    //     isCancel: true
    //   }))
    //   .afterClosed()
    //   .subscribe((result: boolean | undefined) => {
    //     if (result) {
    //       this.router.navigate(['/manage/users/add-bank-account']);
    //     }
    //   });
    this.v4AlertService.warningAlert({
        title: 'No Bank Account Found',
        content: error.error?.errorMsg || 'Bank account not found',
        doneMsg: 'Add Bank Account',
        cancelMsg: 'Cancel',
        isCancel: true
      })
      .afterClosed()
      .subscribe((result: boolean | undefined) => {
        if (result) {
          this.router.navigate(['/manage/users/add-bank-account']);
        }
      });
  }

  payeeValidation(checkId: string, isUpdateShippingList: boolean = false): void {
    const invalidPayeeAddress =
      this.formData()?.payee?.country === null ||
      this.formData()?.payee?.zip === null ||
      this.formData()?.payee?.country === '';
    this.checkService
      .payeevalidation({ cheque_ids: [checkId], shipping_type: [1] })
      .pipe(take(1))
      .subscribe({
        next: (res) => {
          if (!res) return;
          const { data } = res;
          if (!data[checkId].success || invalidPayeeAddress) {
            this.shippingCalculation.set(undefined);
            this.isInvalidPayee.set(true);
            if (data[checkId].error_code === 1) {
              // this.centerAlertOnCard(this.v4AlertService.warningAlert({
              //   content: 'Fill the Payee street address instead of the PO box for FedEx mailing'
              // }));
              this.v4AlertService.warningAlert({
                content: 'Fill the Payee street address instead of the PO box for FedEx mailing'
              });
            }
            if (isUpdateShippingList) {
              this.selectedShippingType.setValue(null);
              this.sortedShippingList.set([]);
            }
          } else {
            this.isInvalidPayee.set(false);
            if (isUpdateShippingList) {
              this.getShippingType(this.formData()?.payee?.country as string);
            }
          }
        }
      });
  }

  private getShippingType(payeeCountry: string): void {
    const USA = ['united states', 'us', 'usa', 'united states of america'];
    const ca = ['canada', 'ca'];

    if (this.isInvalidPayee()) {
      this.sortedShippingList.set([]);
      return;
    }

    const country = payeeCountry?.toLowerCase();
    let selectCountry: string;
    if (USA.includes(country)) {
      selectCountry = 'United States';
    } else if (ca.includes(country)) {
      selectCountry = 'Canada';
    } else {
      selectCountry = payeeCountry;
    }

    if (selectCountry === 'Canada') {
      this.sortedShippingList.set(
        this.shippingTypeList().filter((type) => type.country === 'Canada')
      );
    } else if (selectCountry === 'United States') {
      this.sortedShippingList.set(
        this.shippingTypeList().filter(
          (type) => type.country !== 'Canada' && type.country !== 'International'
        )
      );
    } else {
      this.sortedShippingList.set(
        this.shippingTypeList().filter((type) => type.country === 'International')
      );
    }

    if (!this.formData()?.shippingType?.id) {
      this.formData.set({
        ...this.formData(),
        shippingType: this.sortedShippingList()[0]
      });
    }

    const matchedType = this.sortedShippingList().find(
      (type) => type.id === this.formData()?.shippingType?.id
    );
    this.selectedShippingType.setValue(matchedType ? JSON.stringify(matchedType) : null);
  }

  private getBankDetails(bankAccountId: string): void {
    this.checkService
      .getbank({ ids: [bankAccountId] })
      .pipe(take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res.success) {
          const updatedBankAc = { ...this.formData()?.bankAc, address: res?.data[0] };
          this.formData.set({ ...this.formData(), bankAc: updatedBankAc });
        }
      });
  }

  private getAttachments(checkId: string): void {
    this.checkService
      .getCheckAttachment(checkId)
      .pipe(take(1))
      .subscribe({
        next: (res) => {
          if (res.data) {
            this.attachments.set(res.data);
            this.calculateShippingCost();
          }
        }
      });
  }

  calculateShippingCost(): void {
    const checkId = this.checkDetailsResponse()?.datas?.[0]?.enc_id as string;
    if (!checkId) return;
    const attachmentsIds = this.attachments().map((attachment) => attachment.id);
    this.costCalculation = {
      mail_check_ids: [checkId],
      all_check_ids: [],
      Single_mail_options: this.formData()?.shippingType?.id ?? 1,
      sent_to_customer_address:
        this.formData()?.shippingAddressOption === 'to-custom-address' ? 1 : 0,
      shipping_rate_warning: 0,
      individual_envelope: 0,
      custom_address_shipping_type:
        this.formData()?.shippingAddressOption === 'to-custom-address'
          ? (this.formData()?.customShippingType?.id ?? 0)
          : 0,
      [checkId]: {
        mail_type: this.formData()?.shippingType?.id ?? 1,
        check_paper: 7,
        informed_payee_sms: 0,
        informed_payee_email: 0,
        payee_phone: this.formData()?.payee?.phone ?? '',
        payee_email: this.formData()?.payee?.email ?? '',
        file_hidden: attachmentsIds
      }
    };

    if (this.formData()?.shippingAddressOption === 'to-custom-address') {
      this.costCalculation.shipping_to = this.formData()?.shippingAddressTo?.dec_id ?? '';
      this.costCalculation.shipping_from = this.formData()?.shippingAddressFrom?.dec_id ?? '';
    }

    this.checkService
      .ShippingCostCalculationGroup(this.costCalculation)
      .pipe(
        finalize(() => this.isLoading.set(false)),
        take(1),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          if (!res) return;
          this.shippingCalculation.set(res.data);
          if (this.isInvalidPayee()) {
            this.shippingCalculation.set(undefined);
          }
        }
      });
  }

  // ==================== STEP 3: SEND MAIL ====================

  sendMail(): void {
    if (this.isInvalidBank()) {
      // this.centerAlertOnCard(this.v4AlertService.warningAlert({ content: 'Bank Address is invalid' }));
      this.v4AlertService.warningAlert({ content: 'Bank Address is invalid' });
      return;
    }
    if (this.isInvalidPayee()) {
      // this.centerAlertOnCard(this.v4AlertService.warningAlert({ content: 'Payee Address is invalid' }));
      this.v4AlertService.warningAlert({ content: 'Payee Address is invalid' });
      return;
    }
    if (
      this.selectedShippingType.value === null &&
      this.formData()?.shippingAddressOption === 'to-payee-address'
    ) {
      // this.centerAlertOnCard(this.v4AlertService.warningAlert({ content: 'Please select the shipping type' }));
      this.v4AlertService.warningAlert({ content: 'Please select the shipping type' });
      return;
    }

    this.isSendingMail.set(true);
    const currentDate = this.datePipe.transform(new Date(), 'yyyy-MM-dd');
    const payload = {
      schedule_date: currentDate,
      recurring_include_check: true,
      frequency: 1,
      start_date: currentDate,
      end_select: 1,
      count: 1,
      until: ''
    };

    const mailData = this.addBankAccountIdToMailData({ ...this.costCalculation, ...payload });

    this.checkService
      .sendmail(mailData, '')
      .pipe(
        finalize(() => this.isSendingMail.set(false)),
        take(1),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            // this.centerAlertOnCard(this.v4AlertService.successAlert({
            //   title: 'Success',
            //   content: 'Mail has been sent successfully'
            // }));
            this.v4AlertService.successAlert({
              title: 'Success',
              content: 'Mail has been sent successfully'
            });
            // this.draftService.clear();
            this.router.navigate(['/v4/manage/business-tools/mail-dashboard/single-mail-history']);
          }
        },
        error: (err) => {
          if (err.error.errorCode === 731) {
            this.handleError731(err);
          }
          if (err.error.errorCode === 'plaid_virtual_account') {
            // const notification = this.centerAlertOnCard(this.v4AlertService.infoAlert({
            //   content: err.error.errorMsg,
            //   doneMsg: 'Update',
            //   isCancel: true
            // }));
            const notification = this.v4AlertService.infoAlert({
              content: err.error.errorMsg,
              doneMsg: 'Update',
              isCancel: true
            });
            notification.afterClosed().subscribe((res) => {
              if (res) {
                const confirmationDialog = this.dialog.open(
                  VirtualAccountConfirmationModalComponent,
                  {
                    maxWidth: '1200px',
                    width: '100%',
                    disableClose: true,
                    data: err.error
                  }
                );
                confirmationDialog.afterClosed().subscribe((resp) => {
                  if (resp.success) {
                    this.sendMail();
                  }
                });
              }
            });
          }
          if (err.error.errorCode === 1) {
            this.sendMail();
          }
          if (err.error.errorCode === 516) {
            // const contactDialog = this.centerAlertOnCard(this.v4AlertService.infoAlert({
            //   content: 'Please contact our customer support to enable international mail.',
            //   isOk: true,
            //   isCancel: true,
            //   doneMsg: 'Contact Now',
            //   cancelMsg: 'Not Now'
            // }));
            const contactDialog = this.v4AlertService.infoAlert({
              content: 'Please contact our customer support to enable international mail.',
              isOk: true,
              isCancel: true,
              doneMsg: 'Contact Now',
              cancelMsg: 'Not Now'
            });
            contactDialog.afterClosed().subscribe((res) => {
              if (res) {
                this.dynamicWhiteLabelService.goToLiveChat();
              }
            });
          }
        }
      });
  }

  private addBankAccountIdToMailData(maildata: Record<string, any>): Record<string, any> {
    if (!this.isQbAutoSubAccountMapping()) return maildata;
    const mailCheckIds = maildata['mail_check_ids'] || [];
    mailCheckIds.forEach((cId: string) => {
      const checkData = maildata[cId];
      if (checkData && (!checkData.file_hidden || checkData.file_hidden.length === 0)) {
        const checkItem = this.checkDetailsResponse()?.datas?.[0];
        if (checkItem?.enc_bank_account_id) {
          checkData.bank_account_id = checkItem.enc_bank_account_id;
        }
      }
    });
    return maildata;
  }

  // ==================== STEP 3: EDIT ACTIONS ====================

  openEditPayeeAddress(isUpdate: boolean = false): void {
    if (!isUpdate && this.isEditPayeeLoading()) return;
    const payeeId = this.checkDetailsResponse()?.datas?.[0]?.enc_payee_id as string;
    const checkId = this.checkDetailsResponse()?.datas?.[0]?.enc_id as string;
    const checkNumber = this.checkDetailsResponse()?.datas?.[0]?.cheque_serial_number as string;
    if (!isUpdate) this.isEditPayeeLoading.set(true);
    this.payeeService
      .showPayee(payeeId)
      .pipe(take(1))
      .subscribe({
        next: (res) => {
          const payeeData = res.data;
          if (isUpdate) {
            this.updatePayeeData(payeeData);
            this.payeeValidation(checkId, true);
            return;
          }
          if (payeeData) {
            // const dialogRef = this.centerAlertOnCard(
            //   this.dialog.open(UpdatePayeeModalV4Component, {
            //     disableClose: true,
            //     maxWidth: '95%',
            //     width: '700px',
            //     panelClass: 'paddingless-modal-rounded',
            //     data: {
            //       checkNo: checkNumber,
            //       EditPayeeData: payeeData,
            //       id: payeeId,
            //       checkid: checkId
            //     }
            //   })
            // );
            const dialogRef = this.dialog.open(UpdatePayeeModalV4Component, {
              disableClose: true,
              maxWidth: '95%',
              width: '700px',
              panelClass: 'paddingless-modal-rounded',
              data: {
                checkNo: checkNumber,
                EditPayeeData: payeeData,
                id: payeeId,
                checkid: checkId
              }
            });
            dialogRef.afterClosed().subscribe((resp) => {
              if (resp) {
                this.openEditPayeeAddress(true);
              }
            });
          }
          this.isEditPayeeLoading.set(false);
        },
        error: () => {
          this.isEditPayeeLoading.set(false);
        }
      });
  }

  private updatePayeeData(payeeData: IViewPayee): void {
    this.formData.set({ ...this.formData(), payee: payeeData });
  }

  openEditBankAddress(): void {
    const bankAccountId = this.checkDetailsResponse()?.datas?.[0]?.enc_bank_account_id as string;
    const checkNumber = this.checkDetailsResponse()?.datas?.[0]?.cheque_serial_number as string;
    const checkId = this.checkDetailsResponse()?.datas?.[0]?.enc_id as string;
    const dialogRef = this.dialog.open(UpdateBankModalV4Component, {
      maxWidth: '95%',
      width: '480px',
      panelClass: 'paddingless-modal-rounded',
      data: {
        id: bankAccountId,
        checkNo: checkNumber
      }
    });
    dialogRef.afterClosed().subscribe((data) => {
      if (data) {
        this.bankValidation(checkId);
        this.getBankDetails(bankAccountId);
      }
    });
  }

  openAttachment(attachmentId: string): void {
    this.isAttachmentLoading.set({ ...this.isAttachmentLoading(), [attachmentId]: true });
    const checkId = this.checkDetailsResponse()?.datas?.[0]?.enc_id as string;
    this.checkService
      .openCheckAttachment(checkId, attachmentId)
      .pipe(
        finalize(() => {
          this.isAttachmentLoading.set({ ...this.isAttachmentLoading(), [attachmentId]: false });
        }),
        take(1),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          const urlLoaded = window.open(res.data);
          if (!urlLoaded || urlLoaded.closed || typeof urlLoaded.closed === 'undefined') {
            // this.centerAlertOnCard(this.v4AlertService.warningAlert({
            //   content:
            //     'A popup blocker may be preventing the application from opening the page. Try disabling it to open the window'
            // }));
            this.v4AlertService.warningAlert({
              content:
                'A popup blocker may be preventing the application from opening the page. Try disabling it to open the window'
            });
          }
        }
      });
  }

  // ==================== HELPERS ====================

  getPaymentAmount(): number {
    const fd = this.formData();
    const amount = fd?.amount ? Number(fd.amount) : 0;
    return Number.isNaN(amount) ? 0 : amount;
  }

  formatAccountNumber(full?: string): string {
    if (!full) return '';
    const visible = full.slice(-4);
    return `•••• ${visible}`;
  }

  private openPayeeWarning(msg: string): void {
    // const action = this.centerAlertOnCard(this.v4AlertService.warningAlert({
    //   content: msg,
    //   doneMsg: 'Update',
    //   isCancel: true,
    //   cancelMsg: 'Not Now'
    // }));
    const action = this.v4AlertService.warningAlert({
      content: msg,
      doneMsg: 'Update',
      isCancel: true,
      cancelMsg: 'Not Now'
    });
    action.afterClosed().subscribe((res) => {
      if (res) {
        this.payeeService.openPayeeEditModal.next(true);
      }
    });
  }

  navigateToHistory(): void {
    // this.draftService.save({
    //   formValue: this.mailingForm.value,
    //   currentStep: this.currentStep(),
    //   shippingAddress: this.shippingAddress(),
    //   attachments: this.createdExistingAttachments,
    //   attachmentCount: this.attachmentCount,
    //   isCustom: this.IsCustom,
    //   customElementGroup: this.customElementGroup,
    //   checkId: this.checkId()
    // });
    this.router.navigate(
      ['/v4/manage/business-tools/mail-dashboard/single-mail-history'],
      { queryParams: { from: 'single-mail' } }
    );
  }

  openAddMailAddressModal(type: 'mail-from' | 'mail-to'): void {
    const isFrom = type === 'mail-from';
    const control = isFrom
      ? this.mailingForm.controls.shippingAddressFrom
      : this.mailingForm.controls.shippingAddressTo;
    const rawValue = control.value as unknown;
    let parsed: { id?: string } | null = null;
    if (rawValue) {
      if (typeof rawValue === 'string') {
        try {
          parsed = JSON.parse(rawValue);
        } catch {
          const list = isFrom
            ? this.shippingAddressFromList()
            : this.shippingAddressToList();
          parsed = list.find((a) => a.name === rawValue) ?? null;
        }
      } else {
        parsed = rawValue as { id?: string };
      }
    }
    const id = parsed?.id || '';
    const isEdit = !!id;

    const dialogRef = this.dialog.open(AddMailAddressModalV4Component, {
      panelClass: 'paddingless-modal-rounded',
      maxWidth: '700px',
      width: '98%',
      autoFocus: false,
      disableClose: true,
      data: {
        dataKey: type,
        isForUpdate: isEdit,
        id
      }
    });

    dialogRef.afterClosed().subscribe((data) => {
      if (!data) return;
      if (data.type === 'delete') {
        control.setValue(null);
        isFrom ? this.loadShippingAddressFrom() : this.loadShippingAddressTo();
        return;
      }
      if (data.result) {
        // Modal returns the new/updated address id — reload the list and
        // auto-select that entry so the dropdown shows it as picked.
        const newId = data.id;
        if (isFrom) {
          this.loadShippingAddressFrom(newId);
        } else {
          this.loadShippingAddressTo(newId);
        }
      }
    });
  }
}

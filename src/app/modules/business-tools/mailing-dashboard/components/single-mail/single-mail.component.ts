import { faPaperclip } from '@fortawesome/pro-regular-svg-icons';
import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatTooltip } from '@angular/material/tooltip';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faCircleInfo,
  faCircleQuestion
} from '@fortawesome/pro-solid-svg-icons';
import { BankAcDropdownV3Component } from 'src/app/shared/components/v3/drop-downs/bank-ac-dropdown-v3/bank-ac-dropdown-v3.component';
import { PayeeDropdownV3Component } from 'src/app/shared/components/v3/drop-downs/payee-dropdown-v3/payee-dropdown-v3.component';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import {
  ICheckAttachmentData,
  ICheckShipingTypes,
  IMailBulkShippingAddress,
  INewCheck
} from 'src/app/modules/check/model/check';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { distinctUntilChanged, finalize, skip, Subject, take, takeUntil } from 'rxjs';
import { V35ControlMessageComponent } from 'src/app/shared/v3/control-message-v35/control-message-v35.component';
import { AmountInputComponent } from 'src/app/shared/components/amount-input/amount-input.component';
import { CommonInputFieldComponent } from 'src/app/shared/v3/common-input-field/common-input-field.component';
import { Router } from '@angular/router';
import { CheckDesignService } from 'src/app/shared/service/check-design/check-design.service';
import { BankService } from 'src/app/shared/service/bank/bank.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { CheckAddAttachmentCommonModalComponent } from 'src/app/modules/check/modal/check-activity-modals/check-add-attachment-common-modal/check-add-attachment-common-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { MatBadge } from '@angular/material/badge';
import { CheckFromAddressDropdownComponent } from 'src/app/shared/components/v3/drop-downs/check-from-address-dropdown/check-from-address-dropdown.component';
import { CheckToAddressDropdownwnComponent } from 'src/app/shared/components/v3/drop-downs/check-to-address-dropdownwn/check-to-address-dropdownwn.component';
import { IPayeeDropdown } from 'src/app/modules/payee/payee-v2/model/payee';
import { IBankDropdown } from 'src/app/models/bank';
import { V35CommonDropDownSelectorComponent } from 'src/app/shared/v3/v35-dropdown/v35-common-dropdown-selector.component';
import { CommonBackButtonV35Component } from 'src/app/shared/v3/buttons/common-back-button-v35/common-back-button-v35.component';
import { IGettingStartedAPI } from 'src/app/models/getting-started';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { DemoVideoComponent } from 'src/app/shared/components/demo-video/demo-video.component';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-single-mail',
  standalone: true,
  imports: [
    CommonModule,
    PayeeDropdownV3Component,
    BankAcDropdownV3Component,
    FaIconComponent,
    MatTooltip,
    CommonButtonV35Component,
    FormsModule,
    ReactiveFormsModule,
    V35ControlMessageComponent,
    AmountInputComponent,
    CommonInputFieldComponent,
    MatBadge,
    V35CommonDropDownSelectorComponent,
    CheckFromAddressDropdownComponent,
    CheckToAddressDropdownwnComponent,
    CommonBackButtonV35Component,
    DemoVideoComponent
  ],
  templateUrl: './single-mail.component.html',
  styleUrl: './single-mail.component.scss'
})
export class SingleMailComponent implements OnInit, OnDestroy {
  private checkService = inject(CheckService);
  private router = inject(Router);
  private checkDesignService = inject(CheckDesignService);
  private bankService = inject(BankService);
  private datePipe = inject(DatePipe);
  private alertService = inject(AlertService);
  private payeeService = inject(PayeeService);
  private dialog = inject(MatDialog);
  private localStorageService = inject(LocalStorageService);

  environment = environment;

  activeTab = signal<'single-mail' | 'payment-info'>('single-mail');
  shippingAddress = signal<string>('to-payee-address');

  destroy$ = new Subject<boolean>();
  dateToday = this.datePipe.transform(new Date(), 'yyyy-MM-dd');

  faCircleQuestion = faCircleQuestion;
  faPaperclip = faPaperclip;
  faCircleInfo = faCircleInfo;

  mailingForm = new FormGroup({
    bankAc: new FormControl<IBankDropdown | null>(null, [Validators.required]),
    payee: new FormControl<IPayeeDropdown | null>(null, [Validators.required]),
    shippingType: new FormControl(null, [Validators.required]),
    shippingAddressFrom: new FormControl<IMailBulkShippingAddress | null>(null),
    shippingAddressTo: new FormControl<IMailBulkShippingAddress | null>(null),
    customShippingType: new FormControl(null),
    amount: new FormControl(null),
    memo: new FormControl(null),
    invoiceNumber: new FormControl<string | null>(null),
    checkNumber: new FormControl<number | null>(null),
    issueDate: new FormControl(this.dateToday)
  });

  // ==================== GLOBAL VARIABLES ====================

  // UI State
  IsCustom = false;
  customFieldFlag = false;
  attachmentCount = 0;

  // Data Arrays
  shippingAddressFrom: IMailBulkShippingAddress[] = [];
  shippingAddressTo: IMailBulkShippingAddress[] = [];
  custom_elements: { id: number; custom_element: string }[] = [];
  customElementGroup: { [key: string]: string }[] = [];
  createdExistingAttachments: ICheckAttachmentData[] = [];

  // Form Controls
  selectedCustomShippingType = new FormControl<ICheckShipingTypes | null>(null);
  selectedShippingType = new FormControl<ICheckShipingTypes | null>(null);

  // Signals
  customShippingTypeList = signal<ICheckShipingTypes[]>([]);
  shippingTypeList = signal<ICheckShipingTypes[]>([]);
  shippingList = signal<ICheckShipingTypes[]>([]);
  selectedPayee = signal<IPayeeDropdown | undefined>(undefined);
  isShippingTypesLoading = signal(false);
  isCreateCheckLoading = signal(false);

  // Default Values
  usDefaultShippingType: number | undefined;
  caDefaultShippingType: number | undefined;
  isSubmitWithAlreadyExistedcheckNo: number;
  isSubmitWithAlreadyExistedcheckfields: number;

  // Radio button options for shipping address
  shippingAddressOptions = [
    {
      id: 'to-payee-address',
      label: 'Ship to Payee Address',
      checked: true,
      showTooltip: false
    },
    {
      id: 'to-custom-address',
      label: 'Ship to Custom Address',
      checked: false,
      showTooltip: true,
      tooltipText:
        'Send to separate addresses or mail multiple checks to one address in a single envelope.'
    }
  ];

  // ==================== END GLOBAL VARIABLES ====================

  ngOnInit() {
    this.changeBank();
    this.changePayee();
    this.loadShippingAddressFrom();
    this.loadShippingAddressTo();
    this.loadCustomElements();
    this.shippingType();
    this.changeMailTo();
    // Initialize shippingList with all shipping types
    this.shippingList.set([]);
  }

  changeMailTo() {
    this.mailingForm.controls.shippingAddressTo.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res?.id) {
          this.getToSingleId(res?.id);
        } else {
          this.selectedCustomShippingType.setValue(null);
        }
      });
  }

  getToSingleId(id: string) {
    this.checkService
      .getToSingleId(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res?.data?.country) {
          this.setCustomShippingType(res?.data?.country);
        }
      });
  }

  setCustomShippingType(country: string) {
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

  changeBank() {
    this.mailingForm.controls.bankAc.valueChanges
      .pipe(
        skip(1),
        distinctUntilChanged((prev, curr) => prev?.id === curr?.id),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        if (res?.id) {
          if(res?.isItZil){
            this.alertService.warningAlert({
              content: 'Cannot use Zil bank account for single mail. Please select a different bank account.'
            });
            this.mailingForm.controls.bankAc.setValue(null, { emitEvent: false });
            return;
          }
          this.loadCheckSerialNo(res?.id);
        }
      });
  }

  loadCheckSerialNo(bankId: string) {
    this.bankService
      .getCheckSerialNo(bankId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res.success === true) {
          const checkSerialNo = res.data[0];
          this.mailingForm.controls.checkNumber.setValue(
            checkSerialNo.serialNo
          );
        }
      });
  }

  changePayee() {
    this.mailingForm.controls.payee.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((payee) => {
        this.mailingForm.controls.shippingType.setValue(null);
        if (payee?.id) {
          if (this.selectedPayee()?.id === payee?.id) return;
          this.selectedPayee.set(payee);
          this.sortedoption(payee?.country);
        } else {
          this.clearPayee();
        }
      });
  }

  clearPayee() {
    this.selectedPayee.set(undefined);
    this.shippingList.set([]);
    this.customShippingTypeList.set([]);
    this.selectedCustomShippingType.setValue(null);
    this.selectedShippingType.setValue(null);
  }

  shippingType(): void {
    this.isShippingTypesLoading.set(true);
    this.checkService
      .getShippingType()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isShippingTypesLoading.set(false))
      )
      .subscribe((res) => {
        this.shippingTypeList.set(res.data);
        this.setDefaultShippingType(res.data);
      });
  }

  setDefaultShippingType(shippingType: ICheckShipingTypes[]) {
    const usTypes = shippingType.filter(
      (ele) => ele.country !== 'Canada' && ele.country !== 'International'
    );
    const defaultType = usTypes.find((ele) => ele.is_default_mailing_type);
    this.usDefaultShippingType = defaultType?.id || undefined;
    const caTypes = shippingType.filter((ele) => ele.country === 'Canada');
    const defaultCaType = caTypes.find((ele) => ele.is_default_mailing_type);
    this.caDefaultShippingType = defaultCaType?.id || 14;
  }

  sortedoption(value: string | undefined) {
    if (!value) {
      this.shippingList.set(
        this.shippingTypeList().filter(
          (address) => address.country === 'International'
        )
      );
      return;
    }
    const USA = [
      'united states',
      'us',
      'usa',
      'united states of america',
      'US'
    ];
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
        this.shippingTypeList().filter(
          (address) => address.country === 'Canada'
        )
      );
    } else if (selectCountry === 'United States') {
      this.shippingList.set(
        this.shippingTypeList().filter(
          (address) =>
            address.country !== 'Canada' && address.country !== 'International'
        )
      );
    } else {
      this.shippingList.set(
        this.shippingTypeList().filter(
          (address) => address.country === 'International'
        )
      );
    }
  }

  onShippingAddressChange(id: string) {
    this.shippingAddress.set(id);
    switch (id) {
      case 'to-custom-address':
        this.updateCustomAddressValidation(true);
        this.updatePayeeAddressValidation(false);
        break;
      default:
        this.updatePayeeAddressValidation(true);
        this.updateCustomAddressValidation(false);
        break;
    }
  }

  updateCustomAddressValidation(isRequired: boolean) {
    if (isRequired) {
      this.mailingForm.controls.shippingAddressTo.setValidators([
        Validators.required
      ]);
      this.mailingForm.controls.shippingAddressFrom.setValidators([
        Validators.required
      ]);
      this.mailingForm.controls.customShippingType.setValidators([
        Validators.required
      ]);
    } else {
      this.mailingForm.controls.shippingAddressTo.clearValidators();
      this.mailingForm.controls.shippingAddressFrom.clearValidators();
      this.mailingForm.controls.customShippingType.clearValidators();
    }
    this.mailingForm.controls.shippingAddressTo.updateValueAndValidity();
    this.mailingForm.controls.shippingAddressFrom.updateValueAndValidity();
    this.mailingForm.controls.customShippingType.updateValueAndValidity();
  }

  updatePayeeAddressValidation(isRequired: boolean) {
    if (isRequired) {
      this.mailingForm.controls.shippingType.setValidators([
        Validators.required
      ]);
    } else {
      this.mailingForm.controls.shippingType.clearValidators();
    }
    this.mailingForm.controls.shippingType.updateValueAndValidity();
  }

  loadShippingAddressFrom() {
    this.checkService
      .getAddressFrom()
      .pipe(take(1))
      .subscribe((res) => {
        this.shippingAddressFrom = res.data;
      });
  }

  loadShippingAddressTo() {
    this.checkService
      .getAddressTo()
      .pipe(take(1))
      .subscribe((res) => {
        this.shippingAddressTo = res.data;
      });
  }

  onNext(tab: 'single-mail' | 'payment-info') {
    switch (tab) {
      case 'single-mail':
        this.updatePaymentInfoValidation(false);
        this.mailingForm.markAllAsTouched();
        if (this.mailingForm.invalid) {
          return;
        }
        this.activeTab.set('payment-info');
        break;
      case 'payment-info':
        this.updatePaymentInfoValidation(true);
        this.submitForm();
        break;
      default:
        break;
    }
  }

  updatePaymentInfoValidation(isRequired: boolean) {
    if (isRequired) {
      this.mailingForm.controls.amount.setValidators([Validators.required]);
      this.mailingForm.controls.issueDate.setValidators([Validators.required]);
      this.mailingForm.controls.checkNumber.setValidators([
        Validators.required
      ]);
    } else {
      this.mailingForm.controls.amount.clearValidators();
      this.mailingForm.controls.issueDate.clearValidators();
      this.mailingForm.controls.checkNumber.clearValidators();
    }
    this.mailingForm.controls.amount.updateValueAndValidity();
    this.mailingForm.controls.issueDate.updateValueAndValidity();
    this.mailingForm.controls.checkNumber.updateValueAndValidity();
  }

  onBack(tab: 'single-mail' | 'payment-info') {
    switch (tab) {
      case 'single-mail':
        this.router.navigate(['manage/business-tools/mail-dashboard/index']);
        break;
      case 'payment-info':
        this.activeTab.set('single-mail');
        break;
      default:
        break;
    }
  }

  loadCustomElements() {
    this.checkDesignService
      .getCustomElements()
      .pipe(take(1))
      .subscribe((res) => {
        this.custom_elements = res.data.custom_elements;
        if (this.custom_elements.length !== 0) {
          this.customFieldFlag = true;
        }
        this.customElementGroup = this.custom_elements.map((item) => ({
          [item.custom_element]: ''
        }));
      });
  }

  toggleCustomFields(toggle: boolean) {
    this.IsCustom = toggle;
  }

  submitForm() {
    this.mailingForm.markAllAsTouched();
    if (this.mailingForm.invalid) {
      return;
    }
    this.saveCheck();
  }

  saveCheck() {
    const verificationDetails: IGettingStartedAPI =
    this.localStorageService.getItem('gettingStartedData');
  if (verificationDetails.verification === 0) {
    const alert = this.alertService.warningAlert({
      content: 'Please verify your email and phone number to proceed.',
      doneMsg: 'Verify Now',
      isCancel: true,
      cancelMsg: 'Cancel'
    });
    alert.afterClosed().subscribe((res) => {
      if(res) {
        this.router.navigate(['/manage/users/verify-email-phone'], {
          queryParams: {
            returnUrl: 'manage/business-tools/mail-dashboard/single-mail'
          }
        });
      }
    });
    return;
  }
    this.isCreateCheckLoading.set(true);
    const payload = this.getCheckPayload();
    this.checkService
      .createCheck(payload)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isCreateCheckLoading.set(false))
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.storeFormData();
            this.router.navigate([
              'manage/business-tools/mail-dashboard/single-mail/submit',
              res.data.id
            ]);
          }
        },
        error: (e) => {
          if (e?.error.errorCode === 190) {
            const warn = this.openConfirmAlert(
              'Do you want to proceed anyway?',
              e.error.errorMsg
            );
            warn.afterClosed().subscribe((r) => {
              if (r) {
                this.isSubmitWithAlreadyExistedcheckfields = 1;
                this.saveCheck();
              }
            });
          }
          if (e?.error.errorCode === 213) {
            const warn = this.openConfirmAlert(
              'Do you want to proceed anyway?',
              e.error.errorMsg
            );
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
          if (
            ![213, 190].includes(e?.error.errorCode) &&
            e.status !== 422 &&
            e?.error.permissionRequired !== 'check-create' &&
            e?.error.errorCode
          ) {
            this.alertService.warningAlert({
              content: e?.error.errorMsg
            });
          }

          if (e?.error.errorCode === 731) {
            this.alertService
              .warningAlert({
                title: 'No Bank Account Found',
                content: e?.error.errorMsg,
                doneMsg: 'Add Bank Account',
                cancelMsg: 'Cancel',
                isCancel: true
              })
              .afterClosed()
              .subscribe((result) => {
                if (result) {
                  this.router.navigate(['/manage/users/add-bank-account']);
                }
              });
          }
        }
      });
  }

  storeFormData() {
    let customShippingType;
    let shippingType;
    if (this.mailingForm.controls.customShippingType.value) {
      customShippingType = JSON.parse(
        this.mailingForm.controls.customShippingType.value
      );
    }
    if (this.mailingForm.controls.shippingType.value) {
      shippingType = JSON.parse(this.mailingForm.controls.shippingType.value);
    }
    const formData = {
      ...this.mailingForm.value,
      ...(customShippingType ? { customShippingType } : {}),
      ...(shippingType ? { shippingType } : {}),
      shippingAddressOption: this.shippingAddress()
    };
    sessionStorage.setItem('formData', JSON.stringify(formData));
  }

  openConfirmAlert(content: string, title?: string) {
    const data = {
      title: title || 'Confirm',
      content,
      doneMsg: 'OK',
      cancelMsg: 'Cancel'
    };
    return this.alertService.confirmAlert(data);
  }

  openPayeeWarning(msg: string): void {
    const action = this.alertService.warningAlert({
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

  getCheckPayload(): INewCheck {
    const formValue = this.mailingForm.value;
    const payload: INewCheck = {
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
      checkNumberWarning: this.isSubmitWithAlreadyExistedcheckNo,
    };
    return payload;
  }

  openAddAttachment() {
    const dialogRef = this.dialog.open(CheckAddAttachmentCommonModalComponent, {
      maxWidth: '600px',
      width: '93%',
      data: {
        billId: '',
        existingData: this.createdExistingAttachments
      }
    });

    dialogRef.afterClosed().subscribe((res) => {
      this.createdExistingAttachments = res.existingData;
      this.attachmentCount = res.existingData.length;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}

import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import {
  Observable,
  Subscription,
  debounceTime,
  finalize,
  firstValueFrom,
  of,
  forkJoin
} from 'rxjs';
import { Utils } from 'src/app/data/utils';
import { IBankDropdown } from 'src/app/models/bank';
import { IWalletData } from 'src/app/models/wallet';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { MatDialog } from '@angular/material/dialog';
import { DatePipe, NgClass } from '@angular/common';
import {
  IAttachmentItem,
  IDropdownMetaData,
  IV3DropDownOnReady
} from 'src/app/models/common';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { ICategoryDropdown } from 'src/app/modules/category/model/category';
import { IPayeeDropdown } from 'src/app/modules/payee/payee-v2/model/payee';
import { TPaymentSource } from 'src/app/modules/payments/model/payments';
import { MatTooltip } from '@angular/material/tooltip';
import { CheckAddAttachmentCommonModalComponent } from 'src/app/modules/check/modal/check-activity-modals/check-add-attachment-common-modal/check-add-attachment-common-modal.component';
import { CheckAddCommentModalComponent } from 'src/app/modules/check/modal/check-activity-modals/check-add-comment-modal/check-add-comment-modal.component';
import {
  faArrowRight,
  faBank,
  faCircleCheck,
  faCircleExclamation,
  faCircleInfo,
  faCircleQuestion,
  faClockRotateLeft,
  faCommentPlus,
  faEnvelope,
  faMinus,
  faPaperclip,
  faPlus,
  faTrash,
  faWallet
} from '@fortawesome/pro-solid-svg-icons';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { IComments } from 'src/app/data/data/cloud-quick-pay';
import { PaymentSourceDropdownV3Component } from 'src/app/shared/components/v3/drop-downs/payment-source-dropdown-v3/payment-source-dropdown-v3.component';
import { AmountInputComponent } from 'src/app/shared/components/amount-input/amount-input.component';
import { CategoryDropdownV3Component } from 'src/app/shared/components/v3/drop-downs/category-dropdown-v3/category-dropdown-v3.component';
import { PayeeDropdownV3Component } from 'src/app/shared/components/v3/drop-downs/payee-dropdown-v3/payee-dropdown-v3.component';
import { MatBadge } from '@angular/material/badge';
import { CommonInputFieldComponent } from 'src/app/shared/v3/common-input-field/common-input-field.component';
import { CheckFromAddressDropdownComponent } from 'src/app/shared/components/v3/drop-downs/check-from-address-dropdown/check-from-address-dropdown.component';
import { CheckToAddressDropdownwnComponent } from 'src/app/shared/components/v3/drop-downs/check-to-address-dropdownwn/check-to-address-dropdownwn.component';
import { V35CommonDropDownSelectorComponent } from 'src/app/shared/v3/v35-dropdown/v35-common-dropdown-selector.component';
import {
  ICheckShipingTypes,
  IMailBulkShippingAddress
} from 'src/app/modules/check/model/check';
import { CommonBackButtonV35Component } from 'src/app/shared/v3/buttons/common-back-button-v35/common-back-button-v35.component';
import { V35ControlMessageComponent } from 'src/app/shared/v3/control-message-v35/control-message-v35.component';
import { Router, RouterLink } from '@angular/router';
import { GroupPaymentsService } from 'src/app/modules/group-payments/services/group-payments.service';
import { IGroupPaymentsCreate } from 'src/app/modules/group-payments/models/group-payments.models';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { environment } from 'src/environments/environment';
import { DemoVideoComponent } from 'src/app/shared/components/demo-video/demo-video.component';

interface IBulkMailBaseFormModel {
  paymentSource: FormControl<IBankDropdown | IWalletData | null>;
  amount: FormControl<string | null>;
  date: FormControl<string | null>;
  category: FormControl<ICategoryDropdown | null>;
  memo: FormControl<string | null>;
  invoiceNumber: FormControl<string | null | undefined>;
}

interface IPaymentFormsArrayHelpers {
  index: number;
  paymentSourceTypeChanges$: Observable<TPaymentSource>;
  paymentSourceDropDown: IDropdownMetaData;
  payeeDropDown: IDropdownMetaData;
  categoryDropDown: IDropdownMetaData;
}

interface IPaymentFormValidityStatus {
  validPaymentFormCount: number;
  validityStatusArray: {
    [key: string]: string | undefined;
  }[];
}

interface IBulkMailFormModel extends IBulkMailBaseFormModel {
  payee: FormControl<IPayeeDropdown | null | undefined>;
  attachments: FormControl<IAttachmentItem[]>;
  comments: FormControl<IComments[]>;
}

@Component({
  selector: 'app-bulk-mail',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    PaymentSourceDropdownV3Component,
    AmountInputComponent,
    MatTooltip,
    CategoryDropdownV3Component,
    NgClass,
    PayeeDropdownV3Component,
    FaIconComponent,
    MatBadge,
    CommonInputFieldComponent,
    CheckFromAddressDropdownComponent,
    CheckToAddressDropdownwnComponent,
    V35CommonDropDownSelectorComponent,
    CommonBackButtonV35Component,
    V35ControlMessageComponent,
    CommonButtonV35Component,
    RouterLink,
    DemoVideoComponent
  ],
  templateUrl: './bulk-mail.component.html',
  styleUrl: './bulk-mail.component.scss'
})
export class BulkMailComponent implements OnInit, OnDestroy {
  private checkService = inject(CheckService);
  private alertService = inject(AlertService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private datePipe = inject(DatePipe);
  private groupPaymentsService = inject(GroupPaymentsService);

  utils = Utils;
  faCircleQuestion = faCircleQuestion;
  faPaperclip = faPaperclip;
  faCommentPlus = faCommentPlus;
  faCircleExclamation = faCircleExclamation;
  faCircleInfo = faCircleInfo;
  faPlus = faPlus;
  faMinus = faMinus;
  faCircleCheck = faCircleCheck;
  faTrash = faTrash;
  faArrowRight = faArrowRight;
  faEnvelope = faEnvelope;
  faClockRotateLeft = faClockRotateLeft;

  env = environment;

  basePaymentForm: FormGroup<IBulkMailBaseFormModel>;
  noOfPayments = new FormControl<number>(5);
  basePaymentSourceType$: Observable<TPaymentSource>;
  paymentFormsArrayHelpers: IPaymentFormsArrayHelpers[] = [];
  paymentsFormArray: FormArray<FormGroup<IBulkMailFormModel>>;
  subscriptions: Subscription[] = [];
  formValidationChangeSubscriptions: Subscription[] = [];
  amountChange$: Observable<string | null>;
  totalAmount: number;
  dateInfoText =
    'The check issue date, which is applicable solely for check payments.';

  // Attachment and comment management
  createdExistingAttachments: File[] = [];
  attachmentCount = 0;
  individualAttachments: File[][] = [];
  excludedCommonAttachments: { [rowIndex: number]: string[] } = {};

  createdExistingComments: string[] = [];
  commentsCount = 0;
  individualComments: string[][] = [];
  excludedCommonComments: { [rowIndex: number]: string[] } = {};
  isProcessPaymentsLoading = signal(false);
  isEnvelopeChecked = false;
  isShippingTypesLoading = signal(false);
  customShippingTypeList = signal<ICheckShipingTypes[]>([]);
  shippingTypeList = signal<ICheckShipingTypes[]>([]);

  paymentFormValidityStatus: IPaymentFormValidityStatus = {
    validPaymentFormCount: 0,
    validityStatusArray: []
  };

  sourceType = [
    {
      name: 'Bank Account',
      value: 'bankaccount',
      icon: faBank,
      isDisabled: false
    },
    { name: 'Wallet', value: 'wallet', icon: faWallet, isDisabled: true }
  ];

  hideDefaultSettings = signal(false);

  shippingForm = new FormGroup({
    groupName: new FormControl<string | null>(null, Validators.required),
    shippingAddressFrom: new FormControl<IMailBulkShippingAddress | null>(
      null,
      Validators.required
    ),
    shippingAddressTo: new FormControl<IMailBulkShippingAddress | null>(
      null,
      Validators.required
    ),
    shippingType: new FormControl<string | null>(null, Validators.required)
  });

  ngOnInit(): void {
    this.initBaseForm();
    this.initFormArray();
    this.setValidationStatusOnFormChanges();
    this.getShippingType();
    this.changeMailToAddress();
  }

  getShippingType(): void {
    this.isShippingTypesLoading.set(true);
    this.subscriptions.push(
      this.checkService
        .getShippingType()
        .pipe(finalize(() => this.isShippingTypesLoading.set(false)))
        .subscribe((res) => {
          this.shippingTypeList.set(res.data);
        })
    );
  }

  changeMailToAddress() {
    this.subscriptions.push(
      this.shippingForm.controls.shippingAddressTo.valueChanges.subscribe(
        (value) => {
          if (value?.id) {
            this.getToSingleId(value.id);
          }
        }
      )
    );
  }

  getToSingleId(id: string) {
    this.subscriptions.push(
      this.checkService.getToSingleId(id).subscribe((res) => {
        if (res?.data?.country) {
          this.setCustomShippingType(res?.data?.country);
        }
      })
    );
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

  selectedSource = signal<string>('bankaccount');
  selectSource(source: string, isDisabled: boolean) {
    if (isDisabled) {
      return;
    }
    this.selectedSource.set(source);
  }

  /**
   * Initializes the base payment form for check payments only.
   */
  initBaseForm() {
    this.basePaymentForm = new FormGroup<IBulkMailBaseFormModel>({
      paymentSource: new FormControl(),
      amount: new FormControl(''),
      date: new FormControl(),
      category: new FormControl(),
      memo: new FormControl('', Validators.maxLength(150)),
      invoiceNumber: new FormControl('')
    });

    // Set payment source type to bankaccount for checks
    this.basePaymentSourceType$ = of('bankaccount' as TPaymentSource);
  }

  /**
   * Initializes the form array for payments.
   */
  initFormArray() {
    this.paymentsFormArray = new FormArray(
      [] as FormGroup<IBulkMailFormModel>[]
    );
    for (let i = 0; i < 5; i += 1) {
      this.pushFormToPaymentsArray();
    }
  }

  setDropDownAPIAndBindId(
    dropdownMetaData: IDropdownMetaData,
    onReady: IV3DropDownOnReady
  ) {
    Object.assign(dropdownMetaData, { dropDownAPI: onReady });
    this.checkIdToBindDropDown(dropdownMetaData);
  }

  checkIdToBindDropDown(dropdownMetaData: IDropdownMetaData) {
    if (
      dropdownMetaData?.selectableId &&
      dropdownMetaData?.dropDownAPI?.setItemWithId
    ) {
      dropdownMetaData.dropDownAPI?.setItemWithId(
        dropdownMetaData.selectableId
      );
    }
  }

  /**
   * Adds a new payment form group to the paymentsFormArray.
   */
  pushFormToPaymentsArray() {
    const newFormGroup = this.createNewFormGroup();
    newFormGroup.patchValue(this.basePaymentForm.value);
    this.paymentsFormArray.push(newFormGroup);
    const helperIndex = this.afterFormPushToArray(newFormGroup);
    this.subscribeNewFormToBaseFormChanges(newFormGroup, helperIndex);
  }

  afterFormPushToArray(_group: FormGroup<IBulkMailFormModel>): number {
    const currentIndex = this.paymentFormsArrayHelpers.length;
    this.paymentFormsArrayHelpers.push({
      index: currentIndex,
      paymentSourceTypeChanges$: of('bankaccount' as TPaymentSource),
      paymentSourceDropDown: {},
      payeeDropDown: {},
      categoryDropDown: {}
    });

    // Initialize individual attachments array for this form
    this.individualAttachments.push([...this.createdExistingAttachments]);
    // Initialize excluded common attachments array for this form
    const newIndex = this.individualAttachments.length - 1;
    this.excludedCommonAttachments[newIndex] = [];

    // Initialize individual comments array for this form
    this.individualComments.push([...this.createdExistingComments]);
    // Initialize excluded common comments array for this form
    this.excludedCommonComments[newIndex] = [];

    return currentIndex;
  }

  /**
   * Subscribes a new form to base form changes so that when base form values change,
   * the new form gets updated accordingly.
   */
  subscribeNewFormToBaseFormChanges(
    newFormGroup: FormGroup<IBulkMailFormModel>,
    helperIndex: number
  ) {
    Object.keys(this.basePaymentForm.controls).forEach((baseFormControl) => {
      const subscription = this.basePaymentForm
        .get(baseFormControl)
        ?.valueChanges.subscribe((valueChange) => {
          newFormGroup.get(baseFormControl)?.setValue(valueChange);
          if (
            baseFormControl === 'category' &&
            this.paymentFormsArrayHelpers[helperIndex]?.categoryDropDown
          ) {
            this.paymentFormsArrayHelpers[
              helperIndex
            ].categoryDropDown.selectableId = (
              newFormGroup.get(baseFormControl)?.value as ICategoryDropdown
            )?.id;
            this.checkIdToBindDropDown(
              this.paymentFormsArrayHelpers[helperIndex].categoryDropDown
            );
          }
        });
      if (subscription) {
        this.subscriptions.push(subscription);
      }
    });
  }

  createNewFormGroup() {
    const form = new FormGroup<IBulkMailFormModel>({
      paymentSource: new FormControl(null, [Validators.required]),
      payee: new FormControl(null, [Validators.required]),
      amount: new FormControl('', [Validators.required, Validators.min(0.01)]),
      date: new FormControl(),
      category: new FormControl(null),
      memo: new FormControl('', Validators.maxLength(150)),
      invoiceNumber: new FormControl('', Validators.maxLength(30)),
      attachments: new FormControl<IAttachmentItem[]>([], {
        nonNullable: true
      }),
      comments: new FormControl<IComments[]>([], { nonNullable: true })
    });

    return form;
  }

  /**
   * Removes the last payment form group from the paymentsFormArray.
   */
  popFormFromPaymentsArray() {
    this.paymentsFormArray.controls.pop();
    this.paymentFormsArrayHelpers.pop();
    this.individualAttachments.pop();
    this.individualComments.pop();
    // Remove the excluded common attachments for the last form
    const lastIndex = this.individualAttachments.length;
    delete this.excludedCommonAttachments[lastIndex];
    delete this.excludedCommonComments[lastIndex];
  }

  /**
   * Increases or decreases the length of the paymentsFormArray based on the value of the noOfPayments control.
   */
  increaseOrDecreasePaymentsFormLength() {
    if (!this.noOfPayments.value || this.noOfPayments.value <= 0) {
      this.noOfPayments.setValue(1);
    } else if (this.noOfPayments.value > 25) {
      this.noOfPayments.setValue(25);
    }
    const difference =
      (this.noOfPayments.value ?? 1) - this.paymentsFormArray.length;
    if (difference > 0) {
      for (let i = 0; i < difference; i += 1) {
        this.pushFormToPaymentsArray();
      }
    } else if (difference < 0) {
      for (let i = difference; i < 0; i += 1) {
        this.popFormFromPaymentsArray();
      }
    }
    this.onPaymentsFormArrayLengthChanges();
  }

  /**
   * Adds a new payment form group to the paymentsFormArray and updates its values.
   */
  pushFormToPaymentsArrayAndUpdateValues() {
    this.noOfPayments.setValue(
      this.noOfPayments.value ? this.noOfPayments.value + 1 : 1
    );
    this.increaseOrDecreasePaymentsFormLength();
  }

  /**
   * Removes the last payment form group from the paymentsFormArray and updates the total number of payments.
   */
  popFormFromPaymentsArrayAndUpdateValues() {
    this.noOfPayments.setValue(
      this.noOfPayments.value ? this.noOfPayments.value - 1 : 1
    );
    this.increaseOrDecreasePaymentsFormLength();
  }

  /**
   * Removes a payment form group at the specified index and updates the form.
   */
  removeFormFromPaymentsArray(indx: number) {
    this.paymentsFormArray.removeAt(indx);
    this.paymentFormsArrayHelpers.splice(indx, 1);
    this.individualAttachments.splice(indx, 1);
    this.individualComments.splice(indx, 1);

    // Update index values for remaining helpers
    this.paymentFormsArrayHelpers.forEach((helper, index) => {
      Object.assign(helper, { index });
    });

    // Remove excluded common attachments for this index and shift remaining ones
    delete this.excludedCommonAttachments[indx];
    delete this.excludedCommonComments[indx];
    // Shift remaining excluded common attachments down by one index
    const newExcludedCommonAttachments: { [rowIndex: number]: string[] } = {};
    const newExcludedCommonComments: { [rowIndex: number]: string[] } = {};
    Object.keys(this.excludedCommonAttachments).forEach((key) => {
      const index = parseInt(key, 10);
      if (index > indx) {
        newExcludedCommonAttachments[index - 1] =
          this.excludedCommonAttachments[index];
      } else if (index < indx) {
        newExcludedCommonAttachments[index] =
          this.excludedCommonAttachments[index];
      }
    });
    Object.keys(this.excludedCommonComments).forEach((key) => {
      const index = parseInt(key, 10);
      if (index > indx) {
        newExcludedCommonComments[index - 1] =
          this.excludedCommonComments[index];
      } else if (index < indx) {
        newExcludedCommonComments[index] = this.excludedCommonComments[index];
      }
    });
    this.excludedCommonAttachments = newExcludedCommonAttachments;
    this.excludedCommonComments = newExcludedCommonComments;
    this.onPaymentsFormArrayLengthChanges();
  }

  /**
   * Updates the number of payments in the form array and subscribes to changes in the amount field for each payment form.
   */
  onPaymentsFormArrayLengthChanges() {
    this.noOfPayments.setValue(this.paymentsFormArray.length);
    this.subscribeAmountChange();
    this.changeFormValidationBasedOnPaymentCombination();
  }

  /**
   * Subscribes to changes in the values of the payments form array and triggers the calculation of the total payment amount.
   */
  subscribeAmountChange() {
    this.subscriptions.push(
      this.paymentsFormArray.valueChanges
        .pipe(debounceTime(500))
        .subscribe(() => this.calculateTotalAmount())
    );
  }

  /**
   * Calculates the total payment amount by summing up the valid payment amounts within the payments form array.
   */
  calculateTotalAmount() {
    let totalAmountTmp = 0;
    this.paymentsFormArray?.controls?.forEach((paymentFormGroup) => {
      if (paymentFormGroup.invalid) {
        return;
      }
      totalAmountTmp += this.utils.amountToNumber(
        paymentFormGroup.controls.amount.value
      );
    });
    this.totalAmount = totalAmountTmp;
  }

  /**
   * Dynamically changes the form validation rules for each payment form group based on the selected payment source type.
   */
  changeFormValidationBasedOnPaymentCombination() {
    this.formValidationChangeSubscriptions.forEach((res) => res?.unsubscribe());
    this.paymentsFormArray.controls.forEach((paymentFormGroup) => {
      this.formValidationChangeSubscriptions.push(
        paymentFormGroup.controls.paymentSource.valueChanges
          .pipe(debounceTime(50))
          .subscribe(() => {
            if (paymentFormGroup) {
              this.setValidatorsToFormGroupBasedOnPaymentCombo(
                paymentFormGroup
              );
            }
          })
      );
    });
  }

  /**
   * Sets validation rules to the given payment form group based on the selected payment source type.
   */
  setValidatorsToFormGroupBasedOnPaymentCombo(
    paymentFormGroup: FormGroup<IBulkMailFormModel>
  ) {
    // For check payments, we only need basic validations
    this.utils.setControlValidatorsToFormGroup(paymentFormGroup, {
      paymentSource: [Validators.required],
      payee: [Validators.required],
      amount: [Validators.required, Validators.min(0.01)],
      memo: [Validators.maxLength(150)],
      invoiceNumber: [Validators.maxLength(30)]
    });
  }

  /**
   * Sets the validation status for the payment forms when their values change.
   */
  setValidationStatusOnFormChanges() {
    this.subscriptions.push(
      this.paymentsFormArray.valueChanges
        .pipe(debounceTime(500))
        .subscribe(() => {
          this.paymentFormValidityStatus.validPaymentFormCount = 0;
          this.paymentFormValidityStatus.validityStatusArray = [];
          this.paymentsFormArray.controls.forEach(
            (paymentFormGroup, _index) => {
              if (paymentFormGroup.valid) {
                this.paymentFormValidityStatus.validPaymentFormCount += 1;
                this.paymentFormValidityStatus.validityStatusArray.push({});
              } else {
                const validityStatus: { [key: string]: string | undefined } =
                  {};
                Object.keys(paymentFormGroup.controls).forEach(
                  (controlName) => {
                    const formControlItem = paymentFormGroup.get(controlName);
                    if (formControlItem && formControlItem.invalid) {
                      validityStatus[controlName] =
                        this.getCorntrollError(formControlItem);
                    }
                  }
                );
                this.paymentFormValidityStatus.validityStatusArray.push(
                  validityStatus
                );
              }
            }
          );
        })
    );
  }

  /**
   * Gets the validation error message for a given AbstractControl.
   */
  getCorntrollError(control: AbstractControl) {
    const errors = control?.errors;
    if (!errors) {
      return undefined;
    }

    const errorKeys = Object.keys(errors);
    let errorMessage;
    errorKeys.forEach((propertyName) => {
      if (Object.prototype.hasOwnProperty.call(errors, propertyName)) {
        errorMessage = ValidationService.getValidationErrorMessage(
          propertyName,
          errors[propertyName],
          ''
        );
      }
    });

    return errorMessage;
  }

  /**
   * Retrieves an array of valid payment form groups from the payments form array.
   */
  getValidPaymentsFormArray(): FormGroup<IBulkMailFormModel>[] {
    return this.paymentsFormArray.controls.filter(
      (paymentFormGroup) => paymentFormGroup.valid
    );
  }

  /**
   * Gets the count of selected payments.
   */
  getSelectedPaymentsCount(): number {
    return this.getValidPaymentsFormArray().length;
  }

  /**
   * Gets the first validation error message for invalid payment rows.
   * Returns a message indicating which required field is missing and in which row.
   */
  getFirstValidationError(): string | null {
    for (
      let index = 0;
      index < this.paymentsFormArray.controls.length;
      index += 1
    ) {
      const formGroup = this.paymentsFormArray.controls[index];

      if (formGroup.controls.paymentSource.invalid) {
        return `Bank Account is required`;
      }
      if (formGroup.controls.payee.invalid) {
        return `Payee is required`;
      }
      if (formGroup.controls.amount.invalid) {
        return `Amount is required`;
      }
    }
    return null;
  }

  createSendingBodyForSaveGroup(
    validPaymentsFormArray: FormGroup<IBulkMailFormModel>[]
  ) {
    return {
      groupName: this.shippingForm.value.groupName ?? 'Group',
      payments: validPaymentsFormArray.map((paymentFormGroup) => {
        const paymentSourceId = (
          paymentFormGroup.value.paymentSource as IBankDropdown
        )?.id;
        const payeeId = paymentFormGroup.value.payee?.encryptedId;
        const amount = this.utils.amountToNumber(paymentFormGroup.value.amount);
        const memo = paymentFormGroup.value.memo ?? undefined;
        const categoryId = paymentFormGroup.value.category?.id;
        const checkIssueDate = paymentFormGroup.value.date
          ? this.datePipe.transform(paymentFormGroup.value.date, 'yyyy-MM-dd')
          : undefined;
        const invoiceNo = paymentFormGroup.value.invoiceNumber;
        return {
          amount,
          payeeId,
          sourceId: paymentSourceId,
          sourceType: 'bankaccount' as TPaymentSource,
          transferType: 'check',
          date: checkIssueDate,
          category: categoryId,
          invoiceNumber: invoiceNo,
          memo
        };
      })
    };
  }

  /**
   * Creates an array of data objects for multiple check payments based on valid payment form groups.
   */
  createSendingDataForMultipleChecksPayment(
    validPayments: FormGroup<IBulkMailFormModel>[]
  ): FormData {
    // Create a single FormData object containing all check data
    const formData = new FormData();

    validPayments.forEach((paymentFormGroup, index) => {
      const paymentSourceId = (
        paymentFormGroup.value.paymentSource as IBankDropdown
      )?.id;
      const payeeId = paymentFormGroup.value.payee?.encryptedId;
      const amount = this.utils.amountToNumber(paymentFormGroup.value.amount);
      const memo = paymentFormGroup.value.memo ?? undefined;
      const categoryId = paymentFormGroup.value.category?.id;
      const checkIssueDate = paymentFormGroup.value.date
        ? this.datePipe.transform(paymentFormGroup.value.date, 'yyyy-MM-dd')
        : undefined;
      const invoiceNo = paymentFormGroup.value.invoiceNumber;
      formData.append(`source`, 'bank_account');
      // Append each check's data with indexed keys
      if (paymentSourceId)
        formData.append(`cheques[${index}][source_id]`, paymentSourceId);
      if (payeeId) formData.append(`cheques[${index}][payee_id]`, payeeId);
      if (amount)
        formData.append(`cheques[${index}][amount]`, amount.toString());
      if (memo) formData.append(`cheques[${index}][memo]`, memo);
      if (categoryId)
        formData.append(`cheques[${index}][category_id]`, categoryId);
      if (checkIssueDate)
        formData.append(`cheques[${index}][check_issue_date]`, checkIssueDate);
      formData.append(`cheques[${index}][note]`, '');
      if (invoiceNo)
        formData.append(`cheques[${index}][invoice_no]`, invoiceNo);

      // Handle attachments
      const attachments = this.getCombinedAttachments(index);
      if (attachments && attachments.length > 0) {
        attachments.forEach((attachment: File, attachIndex: number) => {
          formData.append(
            `cheques[${index}][attachments][${attachIndex}]`,
            attachment
          );
        });
      }

      // Handle comments
      const comments = this.getCombinedComments(index);
      if (comments && comments.length > 0) {
        comments.forEach((comment: string, commentIndex: number) => {
          formData.append(
            `cheques[${index}][comments][${commentIndex}][comment]`,
            comment
          );
        });
      }
    });

    return formData;
  }

  /**
   * Processes payments by calling the checkService.postMultipleChecks API.
   */
  async processPayments() {
    this.shippingForm.markAllAsTouched();
    if (this.shippingForm.invalid) {
      return;
    }

    const validPaymentsFormArray = this.getValidPaymentsFormArray();

    if (!(validPaymentsFormArray?.length > 0)) {
      this.paymentsFormArray.controls.forEach((el) => {
        el.markAllAsTouched();
      });
      const errorMessage = this.getFirstValidationError();
      this.alertService.infoAlert({
        content: errorMessage || 'No valid payments found'
      });
      return;
    }

    const totalPayments = this.paymentsFormArray.controls.length;
    const validPaymentsCount = validPaymentsFormArray.length;

    // Show confirmation alert only if some payments are invalid
    if (validPaymentsCount < totalPayments) {
      const confirmAlert = this.alertService.confirmAlert({
        title: 'Confirm',
        content: `Number of valid payments: ${validPaymentsCount}. Click 'Ok' to continue.`,
        doneMsg: 'Ok',
        cancelMsg: 'Cancel'
      });

      confirmAlert.afterClosed().subscribe((result) => {
        if (result) {
          this.submitPayments(validPaymentsFormArray);
        }
      });
    } else {
      // All payments are valid, proceed directly
      this.submitPayments(validPaymentsFormArray);
    }
  }

  /**
   * Submits the valid payments to the API.
   */
  private async submitPayments(
    validPaymentsFormArray: FormGroup<IBulkMailFormModel>[]
  ) {
    const sendingDataChecks = this.createSendingDataForMultipleChecksPayment(
      validPaymentsFormArray
    );

    const savePaymentsData = this.createSendingBodyForSaveGroup(
      validPaymentsFormArray
    ) as IGroupPaymentsCreate;

    this.isProcessPaymentsLoading.set(true);

    try {
      // Call both APIs simultaneously using forkJoin
      const responses = await firstValueFrom(
        forkJoin({
          checks: this.checkService.groupMailCreate(sendingDataChecks),
          groupPayments:
            this.groupPaymentsService.createPaymentsGroup(savePaymentsData)
        })
      );

      if (responses.checks?.success) {
        this.isProcessPaymentsLoading.set(false);
        this.alertService.successAlert({
          content: 'Payments Processed Successfully'
        });
        // Reset form after successful processing
        this.setSessionStorageData(responses.checks?.checkIds || []);
        this.router.navigate([
          'manage/business-tools/mail-dashboard/bulk-mail/submit'
        ]);
        this.resetForm();
      } else {
        this.isProcessPaymentsLoading.set(false);
        this.alertService.failedAlert({
          content: 'Failed to process payments. Please try again.'
        });
      }
    } catch (error) {
      this.isProcessPaymentsLoading.set(false);
      this.alertService.failedAlert({
        content:
          'An error occurred while processing payments. Please try again.'
      });
    }
  }

  setSessionStorageData(checkIds: string[]) {
    sessionStorage.setItem(
      'bulkMailData',
      JSON.stringify({
        isEnvelopeChecked: this.isEnvelopeChecked,
        shippingForm: {
          ...this.shippingForm.value,
          shippingType: JSON.parse(
            this.shippingForm.controls.shippingType.value || '{}'
          )
        },
        checkIds
      })
    );
  }

  resetForm() {
    this.paymentsFormArray.controls.forEach((form, i) => {
      this.removeFormFromPaymentsArray(i);
    });
    this.initBaseForm();
    this.initFormArray();
  }

  // Attachment management methods
  openAddAttachment() {
    const dialogRef = this.dialog.open(CheckAddAttachmentCommonModalComponent, {
      maxWidth: '600px',
      width: '93%',
      data: {
        mode: 'group_payments',
        existingData: this.createdExistingAttachments
      }
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res && res.existingData) {
        // Update common attachments
        this.createdExistingAttachments = res.existingData;
        this.attachmentCount = res.existingData.length;
        this.paymentsFormArray.controls.forEach((control, index) => {
          // Merge new common attachments with existing individual attachments
          const existingIndividualAttachments =
            this.individualAttachments[index] || [];
          const newCommonAttachments = res.existingData || [];

          // Combine existing individual attachments with new common attachments
          // Remove duplicates by comparing file names and sizes
          const combinedAttachments = [...existingIndividualAttachments];

          newCommonAttachments.forEach((newAttachment: File) => {
            const isDuplicate = existingIndividualAttachments.some(
              (existingAttachment: File) =>
                existingAttachment.name === newAttachment.name &&
                existingAttachment.size === newAttachment.size
            );

            if (!isDuplicate) {
              combinedAttachments.push(newAttachment);
            }
          });

          this.individualAttachments[index] = combinedAttachments;
        });
      }
    });
  }

  openAddAttachmentForRow(rowIndex: number) {
    const dialogRef = this.dialog.open(CheckAddAttachmentCommonModalComponent, {
      maxWidth: '600px',
      width: '93%',
      data: {
        mode: 'group_payments',
        existingData: [...(this.individualAttachments[rowIndex] || [])]
      }
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res && res.existingData) {
        this.individualAttachments[rowIndex] = [...res.existingData];
      }
    });
  }

  getAttachmentCount(rowIndex: number): number {
    const individualCount = this.individualAttachments[rowIndex]?.length || 0;
    return individualCount;
  }

  getCombinedAttachments(rowIndex: number): File[] {
    return this.individualAttachments[rowIndex] || [];
  }

  getIndividualAttachmentCount(rowIndex: number): number {
    return this.individualAttachments[rowIndex]?.length || 0;
  }

  // Comment management methods
  openAddComment() {
    const dialogRef = this.dialog.open(CheckAddCommentModalComponent, {
      maxWidth: '800px',
      width: '93%',
      disableClose: true,
      data: {
        mode: 'group_payments',
        existingData: this.createdExistingComments
      }
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res.existingData?.length > 0) {
        this.createdExistingComments = res.existingData;
        this.commentsCount = res.existingData.length;
        this.paymentsFormArray.controls.forEach((control, index) => {
          this.individualComments[index] = res.existingData;
        });
      } else {
        this.createdExistingComments = [];
        this.commentsCount = 0;
        this.paymentsFormArray.controls.forEach((control, index) => {
          this.individualComments[index] = [];
        });
      }
    });
  }

  openAddCommentForRow(rowIndex: number) {
    const dialogRef = this.dialog.open(CheckAddCommentModalComponent, {
      maxWidth: '800px',
      width: '93%',
      disableClose: true,
      data: {
        mode: 'group_payments',
        existingData: [...(this.individualComments[rowIndex] || [])]
      }
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res && res.existingData) {
        this.individualComments[rowIndex] = [...res.existingData];
      }
    });
  }

  getCommentCount(rowIndex: number): number {
    return this.individualComments[rowIndex]?.length || 0;
  }

  getCombinedComments(rowIndex: number): string[] {
    return this.individualComments[rowIndex] || [];
  }

  getIndividualCommentCount(rowIndex: number): number {
    return this.individualComments[rowIndex]?.length || 0;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
    this.formValidationChangeSubscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}

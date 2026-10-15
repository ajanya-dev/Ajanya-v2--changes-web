import {
  Component,
  DestroyRef,
  HostListener,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, DatePipe } from '@angular/common';
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
  forkJoin,
  of,
  take
} from 'rxjs';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltip } from '@angular/material/tooltip';
import { MatBadge } from '@angular/material/badge';
import { LucideAngularModule } from 'lucide-angular';

import { Utils } from 'src/app/data/utils';
import { IBankDropdown } from 'src/app/models/bank';
import { IWalletData } from 'src/app/models/wallet';
import {
  IAttachmentItem,
  IDropdownMetaData,
  IV3DropDownOnReady
} from 'src/app/models/common';
import { IComments } from 'src/app/data/data/cloud-quick-pay';
import { ICategoryDropdown } from 'src/app/modules/category/model/category';
import { IPayeeDropdown } from 'src/app/modules/payee/payee-v2/model/payee';
import { TPaymentSource } from 'src/app/modules/payments/model/payments';
import {
  ICheckShipingTypes,
  IMailBulkShippingAddress
} from 'src/app/modules/check/model/check';
import { IGroupPaymentsCreate } from 'src/app/modules/group-payments/models/group-payments.models';

import { CheckService } from 'src/app/shared/service/check/check.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { GroupPaymentsService } from 'src/app/modules/group-payments/services/group-payments.service';

import { BankAcDropdownV4Component } from 'src/app/shared/components/v4/dropdowns/bank-ac-dropdown-v4/bank-ac-dropdown-v4.component';
import { PayeeDropdownV4Component } from 'src/app/shared/components/v4/dropdowns/payee-dropdown-v4/payee-dropdown-v4.component';
import { CategoryDropdownV4Component } from 'src/app/shared/V4/dropdown/category-dropdown-v4/category-dropdown-v4.component';
import { V4CommonDropDownSelectorComponent } from 'src/app/shared/V4/v4-dropdown/v4-common-dropdown-selector.component';
import { CommonAmountInputV4Component } from 'src/app/shared/V4/common-amount-input-v4/common-amount-input-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';
import { V4DatePickerComponent } from 'src/app/shared/V4/v4-date-picker/v4-date-picker.component';
import { V4CheckAddAttachmentCommonModalComponent } from 'src/app/modules/check/modal/check-activity-modals/v4-check-add-attachment-common-modal/v4-check-add-attachment-common-modal.component';
import { V4CheckAddCommentModalComponent } from 'src/app/modules/check/modal/check-activity-modals/v4-check-add-comment-modal/v4-check-add-comment-modal.component';
import { AddMailAddressModalV4Component } from 'src/app/modules/check/modal/mail-modals/add-mail-address-modal-v4/add-mail-address-modal-v4.component';

interface IMailAddressModalCloseData {
  type?: string;
  mode?: string;
  id?: string;
  result?: boolean;
  data?: {
    name?: string;
    country?: string;
  };
}

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
  selector: 'app-v4-bulk-mail',
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
    CategoryDropdownV4Component,
    V4CommonDropDownSelectorComponent,
    CommonAmountInputV4Component,
    CommonInputFieldV4Component,
    CommonButtonV4Component,
    V4ControlMessageComponent,
    V4DatePickerComponent
  ],
  templateUrl: './v4-bulk-mail.component.html',
  styleUrl: './v4-bulk-mail.component.scss'
})
export class V4BulkMailComponent implements OnInit, OnDestroy {
  private checkService = inject(CheckService);
  private v4AlertService = inject(V4AlertService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private datePipe = inject(DatePipe);
  private groupPaymentsService = inject(GroupPaymentsService);
  private destroyRef = inject(DestroyRef);

  utils = Utils;

  basePaymentForm: FormGroup<IBulkMailBaseFormModel>;
  noOfPayments = new FormControl<number>(5);
  basePaymentSourceType$: Observable<TPaymentSource> = of(
    'bankaccount' as TPaymentSource
  );
  paymentFormsArrayHelpers: IPaymentFormsArrayHelpers[] = [];
  paymentsFormArray: FormArray<FormGroup<IBulkMailFormModel>>;
  subscriptions: Subscription[] = [];
  formValidationChangeSubscriptions: Subscription[] = [];
  totalAmount = 0;

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
  isAddressesLoading = signal(false);
  customShippingTypeList = signal<ICheckShipingTypes[]>([]);
  shippingTypeList = signal<ICheckShipingTypes[]>([]);
  shippingAddressFromList = signal<IMailBulkShippingAddress[]>([]);
  shippingAddressToList = signal<IMailBulkShippingAddress[]>([]);

  paymentFormValidityStatus: IPaymentFormValidityStatus = {
    validPaymentFormCount: 0,
    validityStatusArray: []
  };

  hideDefaultSettings = signal(false);

  resizableColumns = signal<
    { key: string; name: string; width: number; minWidth: number; tooltip?: string }[]
  >([
    { key: 'bankAccount', name: 'Bank Account', width: 190, minWidth: 120 },
    { key: 'payee', name: 'Payee', width: 190, minWidth: 120 },
    { key: 'invoice', name: 'Invoice', width: 180, minWidth: 130 },
    { key: 'date', name: 'Date', width: 140, minWidth: 100 },
    { key: 'category', name: 'Category', width: 150, minWidth: 110 },
    { key: 'amount', name: 'Amount', width: 130, minWidth: 100 },
    { key: 'memo', name: 'Memo', width: 110, minWidth: 80 }
  ]);

  gridTemplateColumns = computed(() => {
    const cols = this.resizableColumns();
    const lastIndex = cols.length - 1;
    const colWidths = cols
      .map((c, i) =>
        i === lastIndex ? `minmax(${c.width}px, 1fr)` : `${c.width}px`
      )
      .join(' ');
    return `36px ${colWidths} 40px 40px`;
  });

  private resizeIndex = -1;
  private resizeStartX = 0;
  private resizeStartWidth = 0;

  shippingForm = new FormGroup({
    groupName: new FormControl<string | null>(null, [
      Validators.required,
      Validators.maxLength(75),
    ]),
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
    this.loadShippingAddressFrom();
    this.loadShippingAddressTo();
    this.changeMailToAddress();
    // window.addEventListener('scroll', this.closeOpenDropdownsOnScroll, true);
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

  loadShippingAddressFrom(): void {
    this.checkService
      .getAddressFrom()
      .pipe(take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.shippingAddressFromList.set(res.data);
      });
  }

  loadShippingAddressTo(): void {
    this.checkService
      .getAddressTo()
      .pipe(take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.shippingAddressToList.set(res.data);
      });
  }

  selectedFromAddress = (): IMailBulkShippingAddress | null =>
    this.parseAddressValue(
      this.shippingForm.controls.shippingAddressFrom.value,
      this.shippingAddressFromList()
    );

  selectedToAddress = (): IMailBulkShippingAddress | null =>
    this.parseAddressValue(
      this.shippingForm.controls.shippingAddressTo.value,
      this.shippingAddressToList()
    );

  private parseAddressValue(
    value: unknown,
    list: IMailBulkShippingAddress[]
  ): IMailBulkShippingAddress | null {
    if (!value) return null;
    if (typeof value === 'object') return value as IMailBulkShippingAddress;
    if (typeof value === 'string') {
      try {
        return JSON.parse(value) as IMailBulkShippingAddress;
      } catch {
        return list.find((a) => a.name === value) ?? null;
      }
    }
    return null;
  }

  onAddNewFromAddress(): void {
    this.shippingForm.controls.shippingAddressFrom.setValue(null);
    this.openMailAddressModal('mail-from', false);
  }

  onAddNewToAddress(): void {
    this.shippingForm.controls.shippingAddressTo.setValue(null);
    this.openMailAddressModal('mail-to', false);
  }

  onEditFromAddress(): void {
    const selected = this.selectedFromAddress();
    if (!selected?.id) return;
    this.openMailAddressModal('mail-from', true, String(selected.id));
  }

  onEditToAddress(): void {
    const selected = this.selectedToAddress();
    if (!selected?.id) return;
    this.openMailAddressModal('mail-to', true, String(selected.id));
  }

  private openMailAddressModal(
    dataKey: 'mail-from' | 'mail-to',
    isForUpdate: boolean,
    id: string = ''
  ): void {
    const dialogRef = this.dialog.open(AddMailAddressModalV4Component, {
      maxWidth: '700px',
      width: '98%',
      autoFocus: false,
      disableClose: true,
      panelClass: 'paddingless-modal-rounded',
      data: { dataKey, isForUpdate, id }
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result: IMailAddressModalCloseData | undefined) => {
        if (!result) return;
        this.handleMailAddressModalClose(dataKey, result);
      });
  }

  private handleMailAddressModalClose(
    dataKey: 'mail-from' | 'mail-to',
    data: IMailAddressModalCloseData
  ): void {
    if (data.type === 'delete') {
      this.handleMailAddressDelete(dataKey, data.id);
      return;
    }
    if (typeof data === 'object') {
      switch (data.mode) {
        case 'create':
          this.handleMailAddressCreate(dataKey, data);
          break;
        case 'update':
          this.handleMailAddressUpdate(dataKey, data);
          break;
        default:
          if (!data.mode && data.id) {
            this.handleMailAddressCreate(dataKey, data);
          }
          break;
      }
    }
  }

  private handleMailAddressCreate(
    dataKey: 'mail-from' | 'mail-to',
    data: IMailAddressModalCloseData
  ): void {
    const item: IMailBulkShippingAddress = {
      name: data.data?.name || '',
      id: (data.id || '') as unknown as IMailBulkShippingAddress['id'],
      country: data.data?.country || '',
      dec_id: 0
    } as IMailBulkShippingAddress;

    if (dataKey === 'mail-from') {
      this.shippingAddressFromList.update((list) => [...list, item]);
      this.shippingForm.controls.shippingAddressFrom.setValue(
        JSON.stringify(item) as unknown as IMailBulkShippingAddress
      );
    } else {
      this.shippingAddressToList.update((list) => [...list, item]);
      this.shippingForm.controls.shippingAddressTo.setValue(
        JSON.stringify(item) as unknown as IMailBulkShippingAddress
      );
    }
  }

  private handleMailAddressUpdate(
    dataKey: 'mail-from' | 'mail-to',
    data: IMailAddressModalCloseData
  ): void {
    if (!data.id || !data.data) return;
    const updateName = data.data.name || '';

    if (dataKey === 'mail-from') {
      this.shippingAddressFromList.update((list) =>
        list.map((addr) =>
          String(addr.id) === String(data.id)
            ? { ...addr, name: updateName }
            : addr
        )
      );
      const current = this.selectedFromAddress();
      if (current && String(current.id) === String(data.id)) {
        const updated = { ...current, name: updateName };
        this.shippingForm.controls.shippingAddressFrom.setValue(
          JSON.stringify(updated) as unknown as IMailBulkShippingAddress
        );
      }
    } else {
      this.shippingAddressToList.update((list) =>
        list.map((addr) =>
          String(addr.id) === String(data.id)
            ? { ...addr, name: updateName }
            : addr
        )
      );
      const current = this.selectedToAddress();
      if (current && String(current.id) === String(data.id)) {
        const updated = { ...current, name: updateName };
        this.shippingForm.controls.shippingAddressTo.setValue(
          JSON.stringify(updated) as unknown as IMailBulkShippingAddress
        );
      }
    }
  }

  private handleMailAddressDelete(
    dataKey: 'mail-from' | 'mail-to',
    deletedId: string | undefined
  ): void {
    if (dataKey === 'mail-from') {
      const current = this.selectedFromAddress();
      const idToRemove = deletedId ?? (current?.id ? String(current.id) : '');
      this.shippingAddressFromList.update((list) =>
        list.filter((addr) => String(addr.id) !== String(idToRemove))
      );
      if (current && String(current.id) === String(idToRemove)) {
        this.shippingForm.controls.shippingAddressFrom.setValue(null);
      }
    } else {
      const current = this.selectedToAddress();
      const idToRemove = deletedId ?? (current?.id ? String(current.id) : '');
      this.shippingAddressToList.update((list) =>
        list.filter((addr) => String(addr.id) !== String(idToRemove))
      );
      if (current && String(current.id) === String(idToRemove)) {
        this.shippingForm.controls.shippingAddressTo.setValue(null);
      }
    }
  }

  changeMailToAddress(): void {
    this.subscriptions.push(
      this.shippingForm.controls.shippingAddressTo.valueChanges.subscribe(
        (value) => {
          let parsed: IMailBulkShippingAddress | null = null;
          if (value) {
            if (typeof value === 'string') {
              try {
                parsed = JSON.parse(value);
              } catch {
                parsed =
                  this.shippingAddressToList().find((a) => a.name === value) ??
                  null;
              }
            } else {
              parsed = value as IMailBulkShippingAddress;
            }
          }
          if (parsed?.id) {
            this.getToSingleId(parsed.id.toString());
          }
        }
      )
    );
  }

  getToSingleId(id: string): void {
    this.subscriptions.push(
      this.checkService.getToSingleId(id).subscribe((res) => {
        if (res?.data?.country) {
          this.setCustomShippingType(res?.data?.country);
        }
      })
    );
  }

  setCustomShippingType(country: string): void {
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

  initBaseForm(): void {
    this.basePaymentForm = new FormGroup<IBulkMailBaseFormModel>({
      paymentSource: new FormControl(),
      amount: new FormControl(''),
      date: new FormControl(),
      category: new FormControl(),
      memo: new FormControl('', Validators.maxLength(150)),
      invoiceNumber: new FormControl('')
    });
  }

  initFormArray(): void {
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
  ): void {
    Object.assign(dropdownMetaData, { dropDownAPI: onReady });
    this.checkIdToBindDropDown(dropdownMetaData);
  }

  checkIdToBindDropDown(dropdownMetaData: IDropdownMetaData): void {
    if (
      dropdownMetaData?.selectableId &&
      dropdownMetaData?.dropDownAPI?.setItemWithId
    ) {
      dropdownMetaData.dropDownAPI?.setItemWithId(
        dropdownMetaData.selectableId
      );
    }
  }

  pushFormToPaymentsArray(): void {
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

    this.individualAttachments.push([...this.createdExistingAttachments]);
    const newIndex = this.individualAttachments.length - 1;
    this.excludedCommonAttachments[newIndex] = [];

    this.individualComments.push([...this.createdExistingComments]);
    this.excludedCommonComments[newIndex] = [];

    return currentIndex;
  }

  subscribeNewFormToBaseFormChanges(
    newFormGroup: FormGroup<IBulkMailFormModel>,
    helperIndex: number
  ): void {
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

  createNewFormGroup(): FormGroup<IBulkMailFormModel> {
    return new FormGroup<IBulkMailFormModel>({
      paymentSource: new FormControl(null, [Validators.required]),
      payee: new FormControl(null, [Validators.required]),
      amount: new FormControl('', [Validators.required, Validators.min(0.01)]),
      date: new FormControl(),
      category: new FormControl(null),
      memo: new FormControl('', Validators.maxLength(150)),
      invoiceNumber: new FormControl('', Validators.maxLength(30)),
      attachments: new FormControl<IAttachmentItem[]>([], { nonNullable: true }),
      comments: new FormControl<IComments[]>([], { nonNullable: true })
    });
  }

  popFormFromPaymentsArray(): void {
    this.paymentsFormArray.controls.pop();
    this.paymentFormsArrayHelpers.pop();
    this.individualAttachments.pop();
    this.individualComments.pop();
    const lastIndex = this.individualAttachments.length;
    delete this.excludedCommonAttachments[lastIndex];
    delete this.excludedCommonComments[lastIndex];
  }

  increaseOrDecreasePaymentsFormLength(): void {
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

  pushFormToPaymentsArrayAndUpdateValues(): void {
    this.noOfPayments.setValue(
      this.noOfPayments.value ? this.noOfPayments.value + 1 : 1
    );
    this.increaseOrDecreasePaymentsFormLength();
  }

  removeFormFromPaymentsArray(indx: number): void {
    this.paymentsFormArray.removeAt(indx);
    this.paymentFormsArrayHelpers.splice(indx, 1);
    this.individualAttachments.splice(indx, 1);
    this.individualComments.splice(indx, 1);

    this.paymentFormsArrayHelpers.forEach((helper, index) => {
      Object.assign(helper, { index });
    });

    delete this.excludedCommonAttachments[indx];
    delete this.excludedCommonComments[indx];
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

  onPaymentsFormArrayLengthChanges(): void {
    this.noOfPayments.setValue(this.paymentsFormArray.length);
    this.subscribeAmountChange();
    this.changeFormValidationBasedOnPaymentCombination();
  }

  subscribeAmountChange(): void {
    this.subscriptions.push(
      this.paymentsFormArray.valueChanges
        .pipe(debounceTime(500))
        .subscribe(() => this.calculateTotalAmount())
    );
  }

  calculateTotalAmount(): void {
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

  changeFormValidationBasedOnPaymentCombination(): void {
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

  setValidatorsToFormGroupBasedOnPaymentCombo(
    paymentFormGroup: FormGroup<IBulkMailFormModel>
  ): void {
    this.utils.setControlValidatorsToFormGroup(paymentFormGroup, {
      paymentSource: [Validators.required],
      payee: [Validators.required],
      amount: [Validators.required, Validators.min(0.01)],
      memo: [Validators.maxLength(150)],
      invoiceNumber: [Validators.maxLength(30)]
    });
  }

  setValidationStatusOnFormChanges(): void {
    this.subscriptions.push(
      this.paymentsFormArray.valueChanges
        .pipe(debounceTime(500))
        .subscribe(() => {
          this.paymentFormValidityStatus.validPaymentFormCount = 0;
          this.paymentFormValidityStatus.validityStatusArray = [];
          this.paymentsFormArray.controls.forEach((paymentFormGroup) => {
            if (paymentFormGroup.valid) {
              this.paymentFormValidityStatus.validPaymentFormCount += 1;
              this.paymentFormValidityStatus.validityStatusArray.push({});
            } else {
              const validityStatus: { [key: string]: string | undefined } = {};
              Object.keys(paymentFormGroup.controls).forEach((controlName) => {
                const formControlItem = paymentFormGroup.get(controlName);
                if (formControlItem && formControlItem.invalid) {
                  validityStatus[controlName] =
                    this.getCorntrollError(formControlItem);
                }
              });
              this.paymentFormValidityStatus.validityStatusArray.push(
                validityStatus
              );
            }
          });
        })
    );
  }

  getCorntrollError(control: AbstractControl): string | undefined {
    const errors = control?.errors;
    if (!errors) return undefined;
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

  getValidPaymentsFormArray(): FormGroup<IBulkMailFormModel>[] {
    return this.paymentsFormArray.controls.filter(
      (paymentFormGroup) => paymentFormGroup.valid
    );
  }

  getSelectedPaymentsCount(): number {
    return this.getValidPaymentsFormArray().length;
  }

  getFirstValidationError(): string | null {
    for (
      let index = 0;
      index < this.paymentsFormArray.controls.length;
      index += 1
    ) {
      const formGroup = this.paymentsFormArray.controls[index];
      if (formGroup.controls.paymentSource.invalid) return 'Bank Account is required';
      if (formGroup.controls.payee.invalid) return 'Payee is required';
      if (formGroup.controls.amount.invalid) return 'Amount is required';
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
        const amount = this.utils.amountToNumber(
          paymentFormGroup.value.amount
        );
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

  createSendingDataForMultipleChecksPayment(
    validPayments: FormGroup<IBulkMailFormModel>[]
  ): FormData {
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
      formData.append('source', 'bank_account');
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

      const attachments = this.getCombinedAttachments(index);
      if (attachments && attachments.length > 0) {
        attachments.forEach((attachment: File, attachIndex: number) => {
          formData.append(
            `cheques[${index}][attachments][${attachIndex}]`,
            attachment
          );
        });
      }

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

  async processPayments(): Promise<void> {
    this.shippingForm.markAllAsTouched();
    if (this.shippingForm.invalid) return;

    const validPaymentsFormArray = this.getValidPaymentsFormArray();

    if (!(validPaymentsFormArray?.length > 0)) {
      this.paymentsFormArray.controls.forEach((el) => el.markAllAsTouched());
      const errorMessage = this.getFirstValidationError();
      this.v4AlertService.infoAlert({
        content: errorMessage || 'No valid payments found'
      });
      return;
    }

    const totalPayments = this.paymentsFormArray.controls.length;
    const validPaymentsCount = validPaymentsFormArray.length;

    if (validPaymentsCount < totalPayments) {
      const confirmAlert = this.v4AlertService.confirmAlert({
        title: 'Confirm',
        content: `Number of valid payments: ${validPaymentsCount}. Click 'Ok' to continue.`,
        doneMsg: 'Ok',
        cancelMsg: 'Cancel'
      });

      confirmAlert.afterClosed().subscribe((result) => {
        if (result) this.submitPayments(validPaymentsFormArray);
      });
    } else {
      this.submitPayments(validPaymentsFormArray);
    }
  }

  private async submitPayments(
    validPaymentsFormArray: FormGroup<IBulkMailFormModel>[]
  ): Promise<void> {
    const sendingDataChecks = this.createSendingDataForMultipleChecksPayment(
      validPaymentsFormArray
    );
    const savePaymentsData = this.createSendingBodyForSaveGroup(
      validPaymentsFormArray
    ) as IGroupPaymentsCreate;

    this.isProcessPaymentsLoading.set(true);
    this.shippingForm.disable({ emitEvent: false });
    this.basePaymentForm.disable({ emitEvent: false });
    this.paymentsFormArray.disable({ emitEvent: false });

    try {
      const responses = await firstValueFrom(
        forkJoin({
          checks: this.checkService.groupMailCreate(sendingDataChecks),
          groupPayments:
            this.groupPaymentsService.createPaymentsGroup(savePaymentsData)
        })
      );

      if (responses.checks?.success) {
        this.isProcessPaymentsLoading.set(false);
        this.v4AlertService.successAlert({
          content: 'Payments Processed Successfully'
        });
        this.setSessionStorageData(responses.checks?.checkIds || []);
        this.router.navigate([
          '/v4/manage/business-tools/mail-dashboard/bulk-mail/submit'
        ]);
        this.resetForm();
      } else {
        this.isProcessPaymentsLoading.set(false);
        this.shippingForm.enable({ emitEvent: false });
        this.basePaymentForm.enable({ emitEvent: false });
        this.paymentsFormArray.enable({ emitEvent: false });
        this.v4AlertService.failedAlert({
          content: 'Failed to process payments. Please try again.'
        });
      }
    } catch (error) {
      this.isProcessPaymentsLoading.set(false);
      this.shippingForm.enable({ emitEvent: false });
      this.basePaymentForm.enable({ emitEvent: false });
      this.paymentsFormArray.enable({ emitEvent: false });
      this.v4AlertService.failedAlert({
        content:
          'An error occurred while processing payments. Please try again.'
      });
    }
  }

  setSessionStorageData(checkIds: string[]): void {
    const parseJsonField = (value: any): any => {
      if (!value) return value;
      if (typeof value === 'object') return value;
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    };

    const shippingFormValue = this.shippingForm.value;
    sessionStorage.setItem(
      'bulkMailData',
      JSON.stringify({
        isEnvelopeChecked: this.isEnvelopeChecked,
        shippingForm: {
          ...shippingFormValue,
          shippingAddressFrom: parseJsonField(
            shippingFormValue.shippingAddressFrom
          ),
          shippingAddressTo: parseJsonField(
            shippingFormValue.shippingAddressTo
          ),
          shippingType: JSON.parse(
            this.shippingForm.controls.shippingType.value || '{}'
          )
        },
        checkIds
      })
    );
  }

  resetForm(): void {
    this.paymentsFormArray.controls.forEach((_, i) => {
      this.removeFormFromPaymentsArray(i);
    });
    this.initBaseForm();
    this.initFormArray();
  }

  openAddAttachment(): void {
    const dialogRef = this.dialog.open(V4CheckAddAttachmentCommonModalComponent, {
      maxWidth: '600px',
      width: '93%',
      panelClass: 'paddingless-modal-rounded',
      data: {
        mode: 'group_payments',
        existingData: this.createdExistingAttachments
      }
    });
    dialogRef.afterClosed().subscribe((res) => {
      if (res && res.existingData) {
        this.createdExistingAttachments = res.existingData;
        this.attachmentCount = res.existingData.length;
        this.paymentsFormArray.controls.forEach((_, index) => {
          const existingIndividual = this.individualAttachments[index] || [];
          const newCommon = res.existingData || [];
          const combined = [...existingIndividual];
          newCommon.forEach((newAttachment: File) => {
            const dup = existingIndividual.some(
              (e: File) =>
                e.name === newAttachment.name && e.size === newAttachment.size
            );
            if (!dup) combined.push(newAttachment);
          });
          this.individualAttachments[index] = combined;
        });
      }
    });
  }

  openAddAttachmentForRow(rowIndex: number): void {
    const dialogRef = this.dialog.open(V4CheckAddAttachmentCommonModalComponent, {
      maxWidth: '600px',
      width: '93%',
      panelClass: 'paddingless-modal-rounded',
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
    return this.individualAttachments[rowIndex]?.length || 0;
  }

  getCombinedAttachments(rowIndex: number): File[] {
    return this.individualAttachments[rowIndex] || [];
  }

  getIndividualAttachmentCount(rowIndex: number): number {
    return this.individualAttachments[rowIndex]?.length || 0;
  }

  openAddComment(): void {
    const dialogRef = this.dialog.open(V4CheckAddCommentModalComponent, {
      maxWidth: '700px',
      width: '93%',
      panelClass: 'paddingless-modal-rounded',
      disableClose: true,
      data: {
        mode: 'group_payments',
        existingData: this.createdExistingComments
      }
    });
    dialogRef.afterClosed().subscribe((res) => {
      if (res?.existingData?.length > 0) {
        this.createdExistingComments = res.existingData;
        this.commentsCount = res.existingData.length;
        this.paymentsFormArray.controls.forEach((_, index) => {
          this.individualComments[index] = res.existingData;
        });
      } else {
        this.createdExistingComments = [];
        this.commentsCount = 0;
        this.paymentsFormArray.controls.forEach((_, index) => {
          this.individualComments[index] = [];
        });
      }
    });
  }

  openAddCommentForRow(rowIndex: number): void {
    const dialogRef = this.dialog.open(V4CheckAddCommentModalComponent, {
      maxWidth: '700px',
      width: '93%',
      panelClass: 'paddingless-modal-rounded',
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

  getCombinedComments(rowIndex: number): string[] {
    return this.individualComments[rowIndex] || [];
  }

  goBack(): void {
    this.router.navigate(['/v4/manage/business-tools/mail-dashboard/index']);
  }

  goToHistory(): void {
    this.router.navigate(
      ['/v4/manage/business-tools/mail-dashboard/group-mailing'],
      { queryParams: { from: 'bulk-mail' } }
    );
  }

  onResizeStart(event: MouseEvent, colIndex: number): void {
    event.preventDefault();
    this.resizeIndex = colIndex;
    this.resizeStartX = event.clientX;
    this.resizeStartWidth = this.resizableColumns()[colIndex].width;
  }

  @HostListener('document:mousemove', ['$event'])
  onResizeMove(event: MouseEvent): void {
    if (this.resizeIndex === -1) return;
    const delta = event.clientX - this.resizeStartX;
    const col = this.resizableColumns()[this.resizeIndex];
    const newWidth = Math.max(col.minWidth, this.resizeStartWidth + delta);
    this.resizableColumns.update((cols) =>
      cols.map((c, i) =>
        i === this.resizeIndex ? { ...c, width: newWidth } : c
      )
    );
  }

  @HostListener('document:mouseup')
  onResizeEnd(): void {
    if (this.resizeIndex === -1) return;
    this.resizeIndex = -1;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
    this.formValidationChangeSubscriptions.forEach((s) => s.unsubscribe());
  }

 
}

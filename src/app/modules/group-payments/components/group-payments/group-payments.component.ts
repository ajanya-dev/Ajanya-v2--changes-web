import { MatBadge } from '@angular/material/badge';
import {
  Component,
  Input,
  OnDestroy,
  OnInit,
  effect,
  inject,
  input,
  signal
} from '@angular/core';
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
  map,
  merge,
  of,
  take,
  tap
} from 'rxjs';
import { Utils } from 'src/app/data/utils';
import { IBankDropdown } from 'src/app/models/bank';
import { IWalletData } from 'src/app/models/wallet';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { MatDialog } from '@angular/material/dialog';
import { V3BulkPaymentService } from 'src/app/modules/v3-bulk-payment/services/v3-bulk-payment.service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  DatePipe,
  NgIf,
  NgFor,
  NgClass,
  AsyncPipe,
  CurrencyPipe
} from '@angular/common';
import { IAttachmentItem, IDropdownMetaData, IV3DropDownOnReady } from 'src/app/models/common';
import { IBillBulkPaymentData, IBillBulkPaymentDataGroup } from 'src/app/modules/bill/model/Bill';
import { V3PaymentsTableData } from 'src/app/modules/v3-payments-table/shared/components/v3-payments-table/v3-payments-table-data';
import { IApiRes, IApiResMesssage } from 'src/app/models/api';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { Store } from '@ngrx/store';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { ICategoryDropdown } from 'src/app/modules/category/model/category';
import { IPayeeDropdown } from 'src/app/modules/payee/payee-v2/model/payee';
import { IExistingCreditCards } from 'src/app/models/payment-switch-board';
import {
  IPayFromItem,
  IPayAsItem,
  TPaymentSource
} from 'src/app/modules/payments/model/payments';
import { AuthDataService } from 'src/app/shared/service/auth/auth-data.service';
import { IIpSecurity } from 'src/app/modules/auth/model/security';
import { PaymentTypeAccessService } from 'src/app/shared/service/common/shared/payment-type-access/payment-type-access.service';
import { MatTooltip } from '@angular/material/tooltip';
import { environment } from 'src/environments/environment';
import { CVSourceType } from 'src/app/modules/common-verification/model/common-verification';
import { PersonaHelperService } from 'src/app/shared/persona-v4/service/persona-helper.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { ImportFromExcelComponent } from 'src/app/shared/modal/import-from-excel/import-from-excel.component';
// import { IndustryTypesDropdownComponent } from 'src/app/shared/components/v3/drop-downs/industry-types-dropdown/industry-types-dropdown.component';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { CheckAddAttachmentCommonModalComponent } from 'src/app/modules/check/modal/check-activity-modals/check-add-attachment-common-modal/check-add-attachment-common-modal.component';
import { CheckAddCommentModalComponent } from 'src/app/modules/check/modal/check-activity-modals/check-add-comment-modal/check-add-comment-modal.component';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { faCircleExclamation, faCircleQuestion, faCircleXmark, faCommentPlus, faPaperclip } from '@fortawesome/pro-solid-svg-icons';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { IComments } from 'src/app/data/data/cloud-quick-pay';
import { groupPaymentsFeature } from '../../store/groupPayments.reducer';
import { groupPaymentsActions } from '../../store/groupPayments.actions';
import { GroupNameModalComponent } from '../../modals/group-name-modal/group-name-modal.component';
import {
  GroupPaymentExcelMappedData,
  IImportedPayeeBank,
  getImportedPayeeBankAccountId,
  IGroupPaymentsCreate,
  IGroupPaymentsDetails,
  IGroupPaymentsItem,
  IGroupPaymentsItemCheck,
  IMultiPaymentsSave
} from '../../models/group-payments.models';
import { GroupPaymentsService } from '../../services/group-payments.service';
import { PayeeDropdownV3Component } from '../../../../shared/components/v3/drop-downs/payee-dropdown-v3/payee-dropdown-v3.component';
import { OcwPreventMultiClickDirective } from '../../../../directive/ocw-prevent-multi-click.directive';
import { CategoryDropdownV3Component } from '../../../../shared/components/v3/drop-downs/category-dropdown-v3/category-dropdown-v3.component';
import { AmountInputComponent } from '../../../../shared/components/amount-input/amount-input.component';
import { PaymentSourceDropdownV3Component } from '../../../../shared/components/v3/drop-downs/payment-source-dropdown-v3/payment-source-dropdown-v3.component';
import { PaymentMethodDropdownComponent } from '../../../../shared/components/v3/drop-downs/payment-method-dropdown/payment-method-dropdown.component';
import { ControlMessageComponent } from '../../../../shared/components/control-message/control-message/control-message.component';
import { PaymentSourceTypeDropdownComponent } from '../../../../shared/components/v3/drop-downs/payment-source-type-dropdown/payment-source-type-dropdown.component';

interface IGroupPaymentsBaseFormModel {
  paymentSourceType: FormControl<IPayFromItem | null>;
  paymentSource: FormControl<
    IBankDropdown | IWalletData | IExistingCreditCards | null
  >;
  paymentMethod: FormControl<IPayAsItem | null | undefined>;
  amount: FormControl<string | null>;
  date: FormControl<string | null>;
  category: FormControl<ICategoryDropdown | null>;
  memo: FormControl<string | null>;
}

interface IPaymentFormsArrayHelpers {
  paymentSourceTypeChanges$: Observable<TPaymentSource>;
  paymentMethodChanges$: Observable<TPaymentSource>;
  paymentSourceTypeDropdown: IDropdownMetaData;
  paymentMethodDropdown: IDropdownMetaData;
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

interface IGroupPaymentsFormModel extends IGroupPaymentsBaseFormModel {
  payee: FormControl<IPayeeDropdown | null | undefined>;
  invoiceNumber: FormControl<string | null | undefined>;
  selected: FormControl<boolean>;
  attachments: FormControl<IAttachmentItem[]>;
  comments: FormControl<IComments[]>;
  billIds?: FormControl<string[] | null | undefined>;
  importedPayeeBank?: FormControl<IImportedPayeeBank | null>;
  // industryType: FormControl<string | number | null | undefined>;
}

/**
 * Wallet Check Email is offered on this page only, so it is added here instead
 * of in V3PaymentsTableData, which the shared dropdowns and the payments table
 * also read.
 */
const WALLET_CHECK_EMAIL_OPTION: IPayAsItem = {
  label: 'Check Email',
  id: 'checkEmail',
  fontawsomeIconClass: 'fa-solid fa-money-check-dollar'
};

function withWalletCheckEmail(payFromItems: IPayFromItem[]): IPayFromItem[] {
  return payFromItems.map((item) =>
    item.id === 'wallet'
      ? {
          ...item,
          payOptions: (item.payOptions ?? []).flatMap((option) =>
            option.id === 'checkPrint'
              ? [WALLET_CHECK_EMAIL_OPTION, option]
              : [option]
          )
        }
      : item
  );
}

@Component({
  selector: 'app-group-payments',
  templateUrl: './group-payments.component.html',
  styleUrls: ['./group-payments.component.scss'],
  standalone: true,
  imports: [
    NgIf,
    FormsModule,
    ReactiveFormsModule,
    PaymentSourceTypeDropdownComponent,
    ControlMessageComponent,
    PaymentMethodDropdownComponent,
    PaymentSourceDropdownV3Component,
    AmountInputComponent,
    MatTooltip,
    CategoryDropdownV3Component,
    OcwPreventMultiClickDirective,
    NgFor,
    NgClass,
    PayeeDropdownV3Component,
    AsyncPipe,
    CurrencyPipe,
    RouterLink,
    FaIconComponent,
    MatBadge
    // IndustryTypesDropdownComponent
  ]
})
export class GroupPaymentsComponent implements OnInit, OnDestroy {
  private groupPaymentsService = inject(GroupPaymentsService);
  private checkService = inject(CheckService);
  private alertService = inject(AlertService);
  private dialog = inject(MatDialog);
  private v3BulkPaymentService = inject(V3BulkPaymentService);
  private router = inject(Router);
  private datePipe = inject(DatePipe);
  private store = inject(Store);
  public paymentTypeAccessService = inject(PaymentTypeAccessService);
  private authDataService = inject(AuthDataService);
  private personaHelperService = inject(PersonaHelperService);
  private localStorageService = inject(LocalStorageService);
  private payeeService = inject(PayeeService);
  private paymentsService = inject(PaymentsService);
  private activatedRoute = inject(ActivatedRoute);

  isCardWireValidated = signal(false);

  payFrom = input<'wallet' | 'bank' | 'credit-card'>();
  billBulkData = input<IBillBulkPaymentData | null>();

  utils = Utils;
  faCircleQuestion = faCircleQuestion;

  purposeOfPaymentOptions = signal<string[]>([]);
  basePurposeOfPaymentControl = new FormControl<string | null>('');
  rowPurposeOfPaymentControls: FormControl<string | null>[] = [];
  faPaperclip = faPaperclip;
  faCommentPlus = faCommentPlus;
  faCircleExclamation = faCircleExclamation;
  faCircleXmark = faCircleXmark;

  @Input() groupId$ = new Observable<string>();
  basePaymentForm: FormGroup<IGroupPaymentsBaseFormModel>;
  noOfPayments = new FormControl<number>(5);
  basePaymentSourceType$: Observable<TPaymentSource>;
  paymentSourceTypes = withWalletCheckEmail(V3PaymentsTableData.getPayFromItems());
  basePaymentMethods$: Observable<IPayAsItem[] | undefined>;

  /**
   * Pay As options for a Pay From source. The shared Pay From dropdown emits
   * items from its own copy of V3PaymentsTableData, so the options are looked
   * up here instead of read off the emitted item, which would miss the Check
   * Email option this page adds. Returns a stable array reference.
   */
  payOptionsFor(source: IPayFromItem | null | undefined) {
    return this.paymentSourceTypes.find((item) => item.id === source?.id)
      ?.payOptions;
  }

  paymentFormsArrayHelpers: IPaymentFormsArrayHelpers[] = [];
  paymentsFormArray: FormArray<FormGroup<IGroupPaymentsFormModel>>;
  subscriptions: Subscription[] = [];
  formValidationChangeSubscriptions: Subscription[] = [];
  amountChange$: Observable<string | null>;
  totalAmount: number;
  paymentGroupId: string;
  isBanned = false;
  dateInfoText =
    'The check issue date, which is applicable solely for check payments.';
  
  // Track which forms have been manually interacted with to prevent auto-checking
  manuallyInteractedForms = new Set<number>();
  paymentType: string | null = null;
  createdExistingAttachments: File[] = [];
  attachmentCount = 0;
  individualAttachments: File[][] = [];
  // Track which common attachments are excluded per row
  excludedCommonAttachments: { [rowIndex: number]: string[] } = {};
  
  createdExistingComments: string[] = [];
  commentsCount = 0;
  individualComments: string[][] = [];
  // Track which common comments are excluded per row
  excludedCommonComments: { [rowIndex: number]: string[] } = {};

  /**
   * Clears the tracking of manually interacted forms.
   * This should be called when forms are reset or new forms are added.
   */
  clearManuallyInteractedForms() {
    this.manuallyInteractedForms.clear();
  }

  loadingIndicatorFlags: { [key: string]: boolean } = {
    isCreateOrUpdateGroupLoading: false,
    isSavePaymentsLoading: false,
    isProcessPaymentsLoading: false,
    isLoading: false
  };

  paymentFormValidityStatus: IPaymentFormValidityStatus = {
    validPaymentFormCount: 0,
    validityStatusArray: []
  };

  groupDetailsLoading$: Observable<boolean>;
  groupDetails: IGroupPaymentsDetails;

  effectRef = effect(() => {
    const data = this.billBulkData();
    if (!data?.paymentGroups?.length || !this.paymentsFormArray) return;

    // Set Pay As default to Check (Bank Account's payOptions[3])
    const checkOption = this.paymentSourceTypes[1]?.payOptions?.find(opt => opt.id === 'check');
    if (checkOption) {
      this.basePaymentForm?.controls.paymentMethod.setValue(checkOption);
    }

    this.prefillFromBillBulkData();
  });

  ngOnInit(): void {
    this.getQueryParams();
    this.initStoreSelectors();
    this.initBaseForm();
    this.initFormArray();
    this.getGroupIdIfExistAndInitForms();
    this.setValidationStatusOnFormChanges();
    this.paymentTypeAccessService.initialize({ pageId: 'payment_home_page' });
    this.getPurposeOfPayment();
  }

  getPurposeOfPayment() {
    this.paymentsService.getPurposeOfPayment((options) => {
      this.purposeOfPaymentOptions.set(options);
      this.syncRowPurposesFromMemo();
    });
  }

  /**
   * Seeds each row's purpose dropdown from the memo already on the row. Needed because
   * the dropdown is bound to rowPurposeOfPaymentControls, which lives outside the form
   * array, so any programmatic memo write would otherwise leave the card rows blank.
   */
  syncRowPurposesFromMemo(): void {
    this.paymentsFormArray?.controls.forEach((row, index) => {
      this.rowPurposeOfPaymentControls[index]?.setValue(
        this.paymentsService.matchPurposeFromMemo(row.controls.memo.value)
      );
    });
  }

  onBasePurposeChange(): void {
    const selected = this.basePurposeOfPaymentControl.value;
    if (selected && selected !== 'Other') {
      const sanitized = selected.replace(/[^a-zA-Z ]/g, '').replace(/\s+/g, ' ').trim();
      this.basePaymentForm.controls.memo.setValue(sanitized);
      this.rowPurposeOfPaymentControls.forEach(ctrl => ctrl.setValue(selected));
    } else {
      this.basePaymentForm.controls.memo.setValue('');
      if (selected === 'Other') {
        this.rowPurposeOfPaymentControls.forEach(ctrl => ctrl.setValue('Other'));
      }
    }
  }

  onRowPurposeChange(index: number): void {
    const selected = this.rowPurposeOfPaymentControls[index]?.value;
    if (selected && selected !== 'Other') {
      const sanitized = selected.replace(/[^a-zA-Z ]/g, '').replace(/\s+/g, ' ').trim();
      this.paymentsFormArray.controls[index]?.controls.memo.setValue(sanitized);
    } else {
      this.paymentsFormArray.controls[index]?.controls.memo.setValue('');
    }
  }

  allowAlphabetsAndSpaces(event: KeyboardEvent): boolean {
    const charCode = event.key;
    if (/^[a-zA-Z ]$/.test(charCode)) {
      return true;
    }
    event.preventDefault();
    return false;
  }

  clearBasePurpose(): void {
    this.basePurposeOfPaymentControl.setValue('');
    // Snapshot row purpose values BEFORE base-memo propagation wipes all row memos
    const rowPurposeSnapshot = this.rowPurposeOfPaymentControls.map(ctrl => ctrl.value);
    // Clearing base memo triggers initBaseForm subscription which propagates '' to all rows
    this.basePaymentForm.controls.memo.setValue('');
    // Now reconcile each row using the snapshot taken before propagation
    rowPurposeSnapshot.forEach((purposeValue, index) => {
      if (!purposeValue || purposeValue === 'Other') {
        // Row was in Other/empty state — reset its purpose control so the dropdown shows again
        this.rowPurposeOfPaymentControls[index]?.setValue('');
        this.paymentsFormArray.controls[index]?.controls.memo.setValue('');
      } else {
        // Row had a valid non-Other purpose — re-apply its memo since propagation wiped it
        const sanitized = purposeValue.replace(/[^a-zA-Z ]/g, '').replace(/\s+/g, ' ').trim();
        this.paymentsFormArray.controls[index]?.controls.memo.setValue(sanitized);
        this.rowPurposeOfPaymentControls[index]?.setValue(purposeValue);
      }
    });
  }

  clearRowPurpose(index: number): void {
    this.rowPurposeOfPaymentControls[index]?.setValue('');
    this.paymentsFormArray.controls[index]?.controls.memo.setValue('');
  }

   /**
  * Retrieves query parameters from the route.
  */
  getQueryParams() {
    this.subscriptions.push(
      this.activatedRoute.queryParams.subscribe((params) => {
        this.paymentType = params?.type || null;
      })
    );
   }

  /**
   * Initializes store selectors for the component.
   */
  initStoreSelectors() {
    this.groupDetailsLoading$ = this.store.select(
      groupPaymentsFeature.selectIsLoading
    );
  }

  /**
   * Gets the group ID if it exists and initializes the forms accordingly.
   */
  getGroupIdIfExistAndInitForms() {
    this.subscriptions.push(
      this.groupId$.subscribe((res) => {
        if (res) {
          this.paymentGroupId = res;
          this.store.dispatch(
            groupPaymentsActions.groupPaymentsInit({ id: this.paymentGroupId })
          );
          this.getPaymentGroupDetails();
        } else {
          this.store.dispatch(groupPaymentsActions.groupPaymentsInit({}));
        }
      })
    );
  }

  /**
   * Initializes the base payment form.
   */
  initBaseForm() {
    const paymentSourceType =
      (this.payFrom() === 'bank' || !!this.billBulkData())
        ? this.paymentSourceTypes[1]
        : this.paymentSourceTypes[0];

    this.basePaymentForm = new FormGroup<IGroupPaymentsBaseFormModel>({
      paymentSourceType: new FormControl(this.paymentType === 'check' ? this.paymentSourceTypes[1] : paymentSourceType),
      paymentSource: new FormControl(),
      paymentMethod: new FormControl(),
      amount: new FormControl(''),
      date: new FormControl(this.datePipe.transform(new Date(), 'yyyy-MM-dd')),
      category: new FormControl(),
      memo: new FormControl('', Validators.maxLength(150))
    });

    Object.keys(this.basePaymentForm.controls).forEach((baseFormControl) => {
      const subscription = this.basePaymentForm
        .get(baseFormControl)
        ?.valueChanges.subscribe((valueChange) => {
          this.paymentsFormArray?.controls?.forEach((paymentFormGroup) => {
            paymentFormGroup.get(baseFormControl)?.setValue(valueChange);
          });
        });
      if (subscription) {
        this.subscriptions.push(subscription);
      }
    });

    this.basePaymentSourceType$ = merge(
      of(
        this.basePaymentForm.controls.paymentSourceType.value
          ?.id as TPaymentSource
      ),
      this.basePaymentForm.controls.paymentSourceType.valueChanges.pipe(
        map((val) => val?.id as TPaymentSource)
      )
    );

    this.basePaymentMethods$ = merge(
      of(this.payOptionsFor(this.basePaymentForm.controls.paymentSourceType.value)),
      this.basePaymentForm.controls.paymentSourceType.valueChanges.pipe(
        map((ele) => this.payOptionsFor(ele))
      )
    ).pipe(
      map((ele) => {
        if(this.paymentType === 'check') {
          // Only return option 3 when payment type is check
          return ele ? [ele[3]] : ele;
        } 
          return ele;
        
      }),
      tap((ele) => {        
        this.basePaymentForm.controls.paymentMethod.setValue(ele?.[0]);
      })
    );
  }

  /**
   * Initializes the form array for payments.
   */
  initFormArray() {
    this.paymentsFormArray = new FormArray(
      [] as FormGroup<IGroupPaymentsFormModel>[]
    );
    for (let i = 0; i < 5; i += 1) {
      this.pushFormToPaymentsArray();
    }
    this.onPaymentsFormArrayLengthChanges();
  }

  /**
   * Pre-fills the payment form rows using paymentGroups from getBillBulkPaymentData API.
   * Called during ngOnInit when navigating from bill list with multiple payees.
   */
  prefillFromBillBulkData() {
    const data = this.billBulkData();
    if (!data?.paymentGroups?.length) return;

    const groups: IBillBulkPaymentDataGroup[] = data?.paymentGroups || [];

    // Ensure enough rows exist
    const rowsNeeded = groups.length - this.paymentsFormArray.length;
    for (let i = 0; i < rowsNeeded; i++) {
      this.pushFormToPaymentsArray();
    }

      groups.forEach((group, index) => {
        const helper = this.paymentFormsArrayHelpers[index];
        // if (helper) {
          helper.payeeDropDown.selectableId = group.payee.payeeId;
          this.checkIdToBindDropDown(helper.payeeDropDown);

          helper.paymentSourceDropDown.selectableId = group.bankAccount.bankAccountId;
          this.checkIdToBindDropDown(helper.paymentSourceDropDown);

          helper.categoryDropDown.selectableId = group.category_id;
          this.checkIdToBindDropDown(helper.categoryDropDown);
        // }

        this.paymentsFormArray?.controls[index]?.patchValue({
          amount: String(group.amountAfterCreditApplied),
          memo: group.memo ?? '',
          invoiceNumber: group.invoiceNumbers,
          billIds: group.billIds,
        });
      });

    this.syncRowPurposesFromMemo();
  }

  /**
   * Populates the form array of payment forms with values based on the provided array of payment items.
   * @param {IGroupPaymentsItem[]} groupPaymentsValues - An array of payment items to populate the form with.
   * This method adjusts the length of the form array if needed and sets values for each form control in the array
   * based on the payment items. It also updates dropdown selections and marks controls as touched.
   */
  setFormArrayValue(groupPaymentsValues: IGroupPaymentsItem[]) {
    if (!this.paymentsFormArray) {
      this.paymentsFormArray = new FormArray(
        [] as FormGroup<IGroupPaymentsFormModel>[]
      );
    }
    // Only clear manual interaction tracking when initially loading data, not when updating from store
    if (!this.paymentGroupId) {
      this.clearManuallyInteractedForms();
    }
    const formsArrayLengthDifference =
      groupPaymentsValues.length - this.paymentsFormArray.length;
    if (formsArrayLengthDifference > 0)
      for (let i = 0; i < formsArrayLengthDifference; i += 1) {
        this.pushFormToPaymentsArray();
      }
    this.paymentsFormArray.patchValue(
      groupPaymentsValues.map((res, indx) => {
        this.paymentsFormArray?.controls?.[indx].markAsTouched();
        if (this.paymentFormsArrayHelpers?.[indx] && !this.isCardWireValidated()) {
          this.paymentFormsArrayHelpers[
            indx
          ].paymentSourceTypeDropdown.selectableId = res.sourceType;
          this.checkIdToBindDropDown(
            this.paymentFormsArrayHelpers[indx].paymentSourceTypeDropdown
          );
          const isWalletCheck = res.sourceType === 'wallet' && res.transferType === 'check';
          const walletCheckPayAs = res.paymentMethod === 'check_email' ? 'checkEmail' : 'checkPrint';
          setTimeout(() => {
            this.paymentFormsArrayHelpers[
              indx
            ].paymentMethodDropdown.selectableId = isWalletCheck ? walletCheckPayAs : res.transferType;
            this.checkIdToBindDropDown(
              this.paymentFormsArrayHelpers[indx].paymentMethodDropdown
            );
            this.paymentFormsArrayHelpers[
              indx
            ].paymentSourceDropDown.selectableId = res.sourceId;
            this.checkIdToBindDropDown(
              this.paymentFormsArrayHelpers[indx].paymentSourceDropDown
            );
            this.paymentFormsArrayHelpers[indx].payeeDropDown.selectableId =
              res.payeeId;
            this.checkIdToBindDropDown(
              this.paymentFormsArrayHelpers[indx].payeeDropDown
            );
            this.paymentFormsArrayHelpers[indx].categoryDropDown.selectableId =
              res.category;
            this.checkIdToBindDropDown(
              this.paymentFormsArrayHelpers[indx].categoryDropDown
            );
          }, 200);
        }

        return {
          amount: String(this.utils.amountToNumber(res.amount)),
          date: this.datePipe.transform(res.date, 'yyyy-MM-dd'),
          memo: res.memo,
          invoiceNumber: res.invoiceNumber,
          selected: res.selected ?? false,
        };
      })
    );
    this.syncRowPurposesFromMemo();
    this.paymentsFormArray.markAsPristine();
    this.onPaymentsFormArrayLengthChanges();
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
   * This method creates a new FormGroup with payment form controls and pushes it into the paymentsFormArray.
   * It also copies values from the basePaymentForm into the new form group to maintain consistency.
   * Finally, it adds an observable to track changes in the paymentSourceType dropdown for this form group.
   */
  pushFormToPaymentsArray() {
    const newFormGroup = this.createNewFormGroup();
    newFormGroup.patchValue(this.basePaymentForm.value);
    this.paymentsFormArray.push(newFormGroup);
    this.afterFormPushToArray(newFormGroup);
  }

  afterFormPushToArray(group: FormGroup<IGroupPaymentsFormModel>) {
    this.paymentFormsArrayHelpers.push({
      paymentSourceTypeChanges$: merge(
        of(group.controls.paymentSourceType.value?.id as TPaymentSource),
        group.controls.paymentSourceType.valueChanges.pipe(
          map((val) => val?.id as TPaymentSource)
        )
      ),
      paymentMethodChanges$: merge(
        of(group.controls.paymentMethod.value?.id as TPaymentSource),
        group.controls.paymentMethod.valueChanges.pipe(
          map((val) => val?.id as TPaymentSource)
        )
      ),
      paymentSourceTypeDropdown: {},
      paymentMethodDropdown: {},
      paymentSourceDropDown: {},
      payeeDropDown: {},
      categoryDropDown: {}
    });
    
    // Seeded from the memo the row already carries (copied from the base form, or
    // patched in by an import) so a new row never shows a blank purpose dropdown
    // above a populated memo.
    this.rowPurposeOfPaymentControls.push(
      new FormControl<string | null>(
        this.paymentsService.matchPurposeFromMemo(group.controls.memo.value)
      )
    );

    // Initialize individual attachments array for this form
    // Copy common attachments to the new row
    this.individualAttachments.push([...this.createdExistingAttachments]);
    // Initialize excluded common attachments array for this form
    const newIndex = this.individualAttachments.length - 1;
    this.excludedCommonAttachments[newIndex] = [];
    
    // Initialize individual comments array for this form
    // Copy common comments to the new row
    this.individualComments.push([...this.createdExistingComments]);
    // Initialize excluded common comments array for this form
    this.excludedCommonComments[newIndex] = [];
  }

  createNewFormGroup() {
    const form = new FormGroup<IGroupPaymentsFormModel>({
      paymentSourceType: new FormControl(null, [Validators.required]),
      paymentSource: new FormControl(null, [Validators.required]),
      paymentMethod: new FormControl(null, [Validators.required]),
      payee: new FormControl(null, [Validators.required]),
      amount: new FormControl('', [Validators.required, Validators.min(0.01)]),
      date: new FormControl(this.datePipe.transform(new Date(), 'yyyy-MM-dd')),
      category: new FormControl(null),
      memo: new FormControl('', Validators.maxLength(150)),
      invoiceNumber: new FormControl('', Validators.maxLength(30)),
      selected: new FormControl<boolean>(false, { nonNullable: true }),
      attachments: new FormControl<IAttachmentItem[]>([], { nonNullable: true }),
      comments: new FormControl<IComments[]>([], { nonNullable: true }),
      billIds: new FormControl<string[] | null | undefined>(null),
      importedPayeeBank: new FormControl<IImportedPayeeBank | null>(null),
      // industryType: new FormControl(null, Validators.required)
    });

    const sub = form.controls.payee.valueChanges.subscribe((val) => {
      if (!val) {
        // this.setIndustryType(val, form);
      }
    });

    this.subscriptions.push(sub);

    return form;
  }

  setIndustryType(
    payee: IPayeeDropdown,
    _group: FormGroup<IGroupPaymentsFormModel>
  ) {
    this.payeeService
      .viewPayee(payee.id)
      .pipe(take(1))
      .subscribe((val) => {
        if (!val.success) {
          // group.controls.industryType.setValue(
          //   val.data.payee_information.merchant_category
          // );
        }
      });
  }

  // selectionChange(event: number, group: FormGroup<IGroupPaymentsFormModel>) {
  //   group.controls.industryType.setValue(event);
  // }

  /**
   * Removes the last payment form group from the paymentsFormArray.
   * This method is used to reduce the number of payment form groups by removing the last one.
   * It also removes the corresponding entry from the paymentFormsArrayHelpers.
   */
  popFormFromPaymentsArray() {
    this.paymentsFormArray.controls.pop();
    this.paymentFormsArrayHelpers.pop();
    this.rowPurposeOfPaymentControls.pop();
    this.individualAttachments.pop();
    this.individualComments.pop();
    // Remove the excluded common attachments for the last form
    const lastIndex = this.individualAttachments.length;
    delete this.excludedCommonAttachments[lastIndex];
    delete this.excludedCommonComments[lastIndex];
  }

  /**
   * Increases or decreases the length of the paymentsFormArray based on the value of the noOfPayments control.
   * Ensures that the number of payment form groups matches the specified number in noOfPayments.
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
   * Adds a new payment form group to the paymentsFormArray and updates its values
   * to match the values of the base payment form.
   */
  pushFormToPaymentsArrayAndUpdateValues() {
    this.noOfPayments.setValue(
      this.noOfPayments.value ? this.noOfPayments.value + 1 : 1
    );
    this.increaseOrDecreasePaymentsFormLength();
  }

  /**
   * Removes the last payment form group from the paymentsFormArray and updates
   * the total number of payments. Also, updates the form validation status
   * based on the current payment combination.
   */
  popFormFromPaymentsArrayAndUpdateValues() {
    this.noOfPayments.setValue(
      this.noOfPayments.value ? this.noOfPayments.value - 1 : 1
    );
    this.increaseOrDecreasePaymentsFormLength();
  }

  /**
   * Removes a payment form group at the specified index and updates the form.
   * @param indx The index of the payment form group to be removed.
   */
  removeFormFromPaymentsArray(indx: number) {
    this.paymentsFormArray.removeAt(indx);
    this.paymentFormsArrayHelpers.splice(indx, 1);
    this.rowPurposeOfPaymentControls.splice(indx, 1);
    this.individualAttachments.splice(indx, 1);
    this.individualComments.splice(indx, 1);
    
    // Remove excluded common attachments for this index and shift remaining ones
    delete this.excludedCommonAttachments[indx];
    delete this.excludedCommonComments[indx];
    // Shift remaining excluded common attachments down by one index
    const newExcludedCommonAttachments: { [rowIndex: number]: string[] } = {};
    const newExcludedCommonComments: { [rowIndex: number]: string[] } = {};
    Object.keys(this.excludedCommonAttachments).forEach(key => {
      const index = parseInt(key, 10);
      if (index > indx) {
        newExcludedCommonAttachments[index - 1] = this.excludedCommonAttachments[index];
      } else if (index < indx) {
        newExcludedCommonAttachments[index] = this.excludedCommonAttachments[index];
      }
    });
    Object.keys(this.excludedCommonComments).forEach(key => {
      const index = parseInt(key, 10);
      if (index > indx) {
        newExcludedCommonComments[index - 1] = this.excludedCommonComments[index];
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
   * It also triggers a validation check based on the payment combination.
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
   * Invalid payments are excluded from the calculation.
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
   * Dynamically changes the form validation rules for each payment form group based on the selected payment source type and method.
   * It adjusts validators for fields like payment source, memo, invoice number, and more.
   */
  changeFormValidationBasedOnPaymentCombination() {
    this.formValidationChangeSubscriptions.forEach((res) => res?.unsubscribe());
    this.paymentsFormArray.controls.forEach((paymentFormGroup) => {
      this.formValidationChangeSubscriptions.push(
        paymentFormGroup.controls.paymentSourceType.valueChanges
          .pipe(debounceTime(50))
          .subscribe(() => {
            if (paymentFormGroup) {
              this.setValidatorsToFormGroupBasedOnPaymentCombo(
                paymentFormGroup
              );
            }
          })
      );
      this.formValidationChangeSubscriptions.push(
        paymentFormGroup.controls.paymentMethod.valueChanges
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
   * Sets validation rules to the given payment form group based on the selected payment source type and method.
   * This function adjusts validators for fields like payment source, memo, invoice number, and more, depending on the payment combo.
   * @param paymentFormGroup - The form group representing a payment within the payments form array.
   */
  setValidatorsToFormGroupBasedOnPaymentCombo(
    paymentFormGroup: FormGroup<IGroupPaymentsFormModel>
  ) {
    switch (paymentFormGroup.value?.paymentSourceType?.id) {
      case 'wallet':
        this.utils.setControlValidatorsToFormGroup(paymentFormGroup, {
          paymentSource: [Validators.required],
          amount: [Validators.required, Validators.min(0.01)]
        });
        switch (paymentFormGroup.value?.paymentMethod?.id) {
          case 'ach':
            this.utils.setControlValidatorsToFormGroup(paymentFormGroup, {
              memo: [Validators.maxLength(150)],
              invoiceNumber: [Validators.maxLength(30)]
            });
            break;
          case 'wire':
            this.utils.setControlValidatorsToFormGroup(paymentFormGroup, {
              memo: [Validators.required, Validators.maxLength(150)],
              invoiceNumber: [Validators.maxLength(30)]
            });
            break;
          case 'virtualCard':
            this.utils.setControlValidatorsToFormGroup(paymentFormGroup, {
              memo: [Validators.required, Validators.maxLength(150)],
              invoiceNumber: [Validators.maxLength(30)]
            });
            break;
          case 'checkMail':
            this.utils.setControlValidatorsToFormGroup(paymentFormGroup, {
              memo: [Validators.required, Validators.maxLength(150)],
              invoiceNumber: [Validators.required, Validators.maxLength(30)]
            });
            break;
          default:
            break;
        }
        break;
      case 'card':
        this.utils.setControlValidatorsToFormGroup(paymentFormGroup, {
          paymentSource: [Validators.required],
          amount: [Validators.required, Validators.min(10.0)],
          memo: [Validators.required, Validators.maxLength(150)],
          invoiceNumber: [Validators.required, Validators.maxLength(30)]
        });
        break;
      case 'bankaccount':
        this.utils.setControlValidatorsToFormGroup(paymentFormGroup, {
          amount: [Validators.required, Validators.min(0.01)]
        });
        switch (paymentFormGroup.value?.paymentMethod?.id) {
          case 'ach':
            this.utils.setControlValidatorsToFormGroup(paymentFormGroup, {
              paymentSource: [
                Validators.required,
                ValidationService.bankAcACHValidator
              ],
              memo: [Validators.maxLength(150)],
              invoiceNumber: [Validators.maxLength(30)]
            });
            break;
          case 'wire':
            this.utils.setControlValidatorsToFormGroup(paymentFormGroup, {
              paymentSource: [
                Validators.required,
                ValidationService.bankAcACHValidator
              ],
              memo: [Validators.required, Validators.maxLength(150)],
              invoiceNumber: [Validators.maxLength(30)]
            });
            break;
          case 'virtualCard':
            this.utils.setControlValidatorsToFormGroup(paymentFormGroup, {
              paymentSource: [
                Validators.required,
                ValidationService.bankAcACHValidator
              ],
              memo: [Validators.required, Validators.maxLength(150)],
              invoiceNumber: [Validators.maxLength(30)]
            });
            break;
          case 'check':
            this.utils.setControlValidatorsToFormGroup(paymentFormGroup, {
              paymentSource: [Validators.required],
              memo: [Validators.maxLength(150)],
              invoiceNumber: [Validators.maxLength(30)]
            });
            break;
          default:
            break;
        }
        break;
      default:
        break;
    }
  }

  /**
   * Checks if any loading process is in progress.
   * @returns {boolean} True if any loading process is active, false otherwise.
   */
  isAnyProcessLoadings() {
    return Object.keys(this.loadingIndicatorFlags).some(
      (ele) => this.loadingIndicatorFlags?.[ele] === true
    );
  }

  /**
   * Sets the validation status for the payment forms when their values change.
   * This function tracks the number of valid payment forms and their validation status.
   */
  setValidationStatusOnFormChanges() {
    this.subscriptions.push(
      this.paymentsFormArray.valueChanges
        .pipe(debounceTime(500))
        .subscribe(() => {
          this.paymentFormValidityStatus.validPaymentFormCount = 0;
          this.paymentFormValidityStatus.validityStatusArray = [];
          this.paymentsFormArray.controls.forEach((paymentFormGroup, index) => {
            // Auto-check valid forms and uncheck invalid forms (only when editing existing group)
            // Skip auto-checking if user has manually interacted with this form
            if (this.paymentGroupId && !this.manuallyInteractedForms.has(index)) {
              paymentFormGroup.controls.selected.setValue(paymentFormGroup.valid);
            }
            
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

  /**
   * Gets the validation error message for a given AbstractControl.
   * @param control The AbstractControl to retrieve the error message for.
   * @returns The validation error message, or undefined if no error is present.
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
   * Retrieves the payment group details from the store and updates the form array accordingly.
   */
  getPaymentGroupDetails() {
    this.subscriptions.push(
      this.store
        .select(groupPaymentsFeature.selectGroupDetails)
        .pipe(debounceTime(100))
        .subscribe((res) => {
          if (res.groupData) {
            this.groupDetails = res.groupData;
              this.setFormArrayValue(res.groupData.resources);
          }
        })
    );
  }

  /**
   * Creates the request body for saving a payment group based on valid payment form data and an optional group name.
   * @param validPaymentsFormArray An array of valid payment form groups to include in the payment group.
   * @param groupName (Optional) The name of the payment group. If not provided, a default name is used.
   * @returns The request body for saving the payment group.
   */
  createSendingBodyForSaveGroup(
    validPaymentsFormArray: FormGroup<IGroupPaymentsFormModel>[],
    groupName?: string
  ) {
    return {
      groupName: groupName ?? 'Group',
      payments: validPaymentsFormArray.map((paymentFormGroup) => {
        const paymentSourceTypeId =
          paymentFormGroup.value.paymentSourceType?.id;
        const { paymentSource } = paymentFormGroup.value;
        let sourceId = '';

        if (paymentSourceTypeId === 'bankaccount') {
          sourceId = (paymentSource as IBankDropdown)?.id || '';
        } else if (paymentSourceTypeId === 'wallet') {
          sourceId = (paymentSource as IWalletData)?.id || '';
        } else if (paymentSourceTypeId === 'card') {
          sourceId = (paymentSource as IExistingCreditCards)?.cardId || '';
        }
        const isWalletCheckPrint = paymentSourceTypeId === 'wallet' && paymentFormGroup.value.paymentMethod?.id === 'checkPrint';
        const isWalletCheckEmail = paymentSourceTypeId === 'wallet' && paymentFormGroup.value.paymentMethod?.id === 'checkEmail';
        return {
          amount: this.utils.amountToNumber(paymentFormGroup.value.amount),
          payeeId: paymentFormGroup.value.payee?.encryptedId || ('' as string),
          sourceId,
          sourceType: paymentSourceTypeId as TPaymentSource,
          transferType: isWalletCheckPrint || isWalletCheckEmail ? 'check' :
            paymentFormGroup.value.paymentMethod?.id || ('' as string),
          ...(isWalletCheckPrint && { paymentMethod: 'check_print' }),
          ...(isWalletCheckEmail && { paymentMethod: 'check_email' }),
          date: paymentFormGroup.value.date
            ? (this.datePipe.transform(
                paymentFormGroup.value.date,
                'MM/dd/yyyy'
              ) as string)
            : undefined,
          category: paymentFormGroup.value.category?.id as string,
          // industryType: paymentFormGroup.value.industryType as string,
          invoiceNumber: paymentFormGroup.value.invoiceNumber || ('' as string),
          memo: paymentFormGroup.value.memo as string,
        };
      })
    };
  }

  /**
   * Retrieves an array of valid payment form groups from the payments form array.
   * @returns An array of valid payment form groups.
   */
  getValidPaymentsFormArray(isUpdate: boolean = false): FormGroup<IGroupPaymentsFormModel>[] {
    if(this.paymentGroupId && !isUpdate){
      return this.paymentsFormArray.controls.filter(
        (paymentFormGroup) => paymentFormGroup.valid && paymentFormGroup.controls.selected.value
      );
    }
    return this.paymentsFormArray.controls.filter(
      (paymentFormGroup) => paymentFormGroup.valid
    );
  }


  private getValidCardPaymentsFormArray(): FormGroup<IGroupPaymentsFormModel>[] {
    return this.paymentsFormArray.controls.filter(
      (paymentFormGroup) => paymentFormGroup.valid && paymentFormGroup.value.paymentSourceType?.sourceType === 'CARD'
    );
  }

  /**
   * Creates data for multiple payments based on valid payment form groups.
   * @param validPayments - An array of valid payment form groups.
   * @returns Data representing multiple payments.
   */
  private createSendingDataForMultiplePayments(
    validPayments: FormGroup<IGroupPaymentsFormModel>[]
  ): IMultiPaymentsSave {
    return {
      payments: validPayments
        .filter((el) => el.value.paymentMethod?.id !== 'check')
        .map((paymentFormGroup) => {
          const paymentSourceTypeId =
            paymentFormGroup.value.paymentSourceType?.id;
          const { paymentSource } = paymentFormGroup.value;

          let sourceId = '';
          if (paymentSourceTypeId === 'bankaccount') {
            sourceId = (paymentSource as IBankDropdown)?.id || '';
          } else if (paymentSourceTypeId === 'wallet') {
            sourceId = (paymentSource as IWalletData)?.id || '';
          } else if (paymentSourceTypeId === 'card') {
            sourceId = (paymentSource as IExistingCreditCards)?.cardId || '';
          }
          const isWalletCheckPrint = paymentSourceTypeId === 'wallet' && paymentFormGroup.value.paymentMethod?.id === 'checkPrint';
          const isWalletCheckEmail = paymentSourceTypeId === 'wallet' && paymentFormGroup.value.paymentMethod?.id === 'checkEmail';
          const payeeBankAccountId = getImportedPayeeBankAccountId(
            paymentFormGroup.value.importedPayeeBank,
            paymentFormGroup.value.payee?.id
          );
          return {
            amount: this.utils.amountToNumber(paymentFormGroup.value.amount),
            payeeId: paymentFormGroup.value.payee?.encryptedId || '', // Fallback to empty string
            sourceId,
            sourceType: paymentSourceTypeId as TPaymentSource,
            transferType: isWalletCheckPrint || isWalletCheckEmail ? 'check' : paymentFormGroup.value.paymentMethod?.id || '', // Fallback to empty string
            ...(isWalletCheckPrint && { paymentMethod: 'check_print' }),
            ...(isWalletCheckEmail && { paymentMethod: 'check_email' }),
            date: paymentFormGroup.value.date
              ? (this.datePipe.transform(
                  paymentFormGroup.value.date,
                  'MM/dd/yyyy'
                ) as string)
              : (undefined as undefined),
            category: paymentFormGroup.value.category?.id,
            // industryType: paymentFormGroup.value.industryType,
            memo: paymentFormGroup.value.memo || '',
            referenceNo: paymentFormGroup.value.invoiceNumber || '',
            ...(paymentFormGroup.value.billIds?.length ? { billIds: paymentFormGroup.value.billIds } : {}),
            ...(payeeBankAccountId && { payeeBankAccountId }),
          };
        })
    };
  }

  /**
   * Checks conditions and initiates the process of payments.
   */
  processPayments() {
    this.checkConditionsAndSavePayments(true);
  }

  /**
   * Redirects the user to the bulk payments page with the provided saved payment IDs and check IDs.
   * @param savedPaymentIds - An array of saved payment IDs.
   * @param savedCheckIds - An array of saved check IDs.
   */
  goToBulkPayments(savedPaymentIds: string[], savedCheckIds: string[]) {
    this.v3BulkPaymentService.initBulkPayment(savedPaymentIds, savedCheckIds);
    this.v3BulkPaymentService.checkOption = '';
    if(this.paymentType === 'check') {
      this.router.navigate(['/manage/bulk-payments'], {
        queryParams: {
          type: 'check'
        }
      });
    } else {
      const isWalletCheckMail = this.basePaymentForm.controls.paymentSourceType.value?.sourceType === 'WALLET' && this.basePaymentForm.controls.paymentMethod.value?.id === 'checkMail';
      this.router.navigate(['/manage/bulk-payments'], {
        state: { source: isWalletCheckMail ? 'wallet' : '' }
      });
    }
  }

  /**
   * Creates an array of data objects for multiple check payments based on valid payment form groups.
   * @param validPayments - An array of valid payment form groups.
   * @returns An array of objects representing check payments.
   */
  createSendingDataForMultipleChecksPayment(
    validPayments: FormGroup<IGroupPaymentsFormModel>[]
  ): FormData | IGroupPaymentsItemCheck[] {
    const checkPayments = validPayments.filter((el) => el.value.paymentMethod?.id === 'check');
    if (this.paymentType === 'check') {
      // Create a single FormData object containing all check data
      const formData = new FormData();
      
      checkPayments.forEach((paymentFormGroup, index) => {
        const paymentSourceId = (paymentFormGroup.value.paymentSource as IWalletData)?.id;
        const payeeId = paymentFormGroup.value.payee?.encryptedId;
        const amount = this.utils.amountToNumber(paymentFormGroup.value.amount);
        const memo = paymentFormGroup.value.memo ?? undefined;
        const categoryId = paymentFormGroup.value.category?.id;
        const checkIssueDate = paymentFormGroup.value.date
          ? this.datePipe.transform(paymentFormGroup.value.date, 'yyyy-MM-dd')
          : undefined;
        const invoiceNo = paymentFormGroup.value.invoiceNumber;
        const {billIds} = paymentFormGroup.value;
        
        // Append each check's data with indexed keys
        if (paymentSourceId) formData.append(`cheques[${index}][bank_account_id]`, paymentSourceId);
        if (payeeId) formData.append(`cheques[${index}][payee_id]`, payeeId);
        if (amount) formData.append(`cheques[${index}][amount]`, amount.toString());
        if (memo) formData.append(`cheques[${index}][memo]`, memo);
        if (categoryId) formData.append(`cheques[${index}][category_id]`, categoryId);
        if (checkIssueDate) formData.append(`cheques[${index}][check_issue_date]`, checkIssueDate);
        formData.append(`cheques[${index}][note]`, '');
        if (invoiceNo) formData.append(`cheques[${index}][invoice_no]`, invoiceNo);
        if (billIds) formData.append(`cheques[${index}][bill_ids]`, billIds.join(','));
        // Handle attachments
        const attachments = this.getCombinedAttachments(index);
        if (attachments && attachments.length > 0) {
          attachments.forEach((attachment: File, attachIndex: number) => {
            formData.append(`cheques[${index}][attachments][${attachIndex}]`, attachment);
          });
        }
        
        // Handle comments
        const comments = this.getCombinedComments(index);
        if (comments && comments.length > 0) {
          comments.forEach((comment: string, commentIndex: number) => {
            formData.append(`cheques[${index}][comments][${commentIndex}][comment]`, comment);
          });
        }
      });
      
      return formData;
    } 
      // Return array of payload objects for non-FormData requests
      return checkPayments.map((paymentFormGroup) => {
        const paymentSourceId = (paymentFormGroup.value.paymentSource as IWalletData)?.id;
        const payeeId = paymentFormGroup.value.payee?.encryptedId;
        const amount = this.utils.amountToNumber(paymentFormGroup.value.amount);
        const memo = paymentFormGroup.value.memo ?? undefined;
        const categoryId = paymentFormGroup.value.category?.id;
        const checkIssueDate = paymentFormGroup.value.date
          ? this.datePipe.transform(paymentFormGroup.value.date, 'yyyy-MM-dd')
          : undefined;
        const invoiceNo = paymentFormGroup.value.invoiceNumber;
        const {billIds} = paymentFormGroup.value;
        
        return {
          bank_account_id: paymentSourceId,
          payee_id: payeeId,
          amount,
          memo,
          category_id: categoryId,
          check_issue_date: checkIssueDate,
          note: '',
          invoice_no: invoiceNo,
          bill_ids: billIds
        };
      }) as IGroupPaymentsItemCheck[];
    
  }

  /**
   * Creates a new payments group based on valid payments and user input.
   * @returns {Promise<IApiResMesssage | boolean>} The response from the API or false if operation is unsuccessful.
   */
  async createGroup(): Promise<IApiRes<{ groupId: string }> | boolean> {
    if (this.isAnyProcessLoadings()) {
      return false;
    }
    const validPaymentsFormArray = this.getValidPaymentsFormArray();

    if (validPaymentsFormArray.length > 0) {
      const confirmResult = await firstValueFrom(
        this.alertService
          .confirmAlert({
            content: `Number of valid payments: ${validPaymentsFormArray.length}. Click 'Ok' to continue`
          })
          .afterClosed()
      );
      if (!confirmResult) {
        return false;
      }

      const groupNameModalResult = await firstValueFrom(
        this.dialog
          .open(GroupNameModalComponent, {
            width: '500px'
          })
          .afterClosed()
      );

      if (groupNameModalResult?.groupName) {
        const sendingData: IGroupPaymentsCreate =
          this.createSendingBodyForSaveGroup(
            validPaymentsFormArray,
            groupNameModalResult.groupName
          );
        this.groupDetails = {
          groupName: groupNameModalResult.groupName,
          resources: sendingData.payments ?? []
        };
        this.loadingIndicatorFlags.isCreateOrUpdateGroupLoading = true;
        const response = await firstValueFrom(
          this.groupPaymentsService.createPaymentsGroup(sendingData).pipe(
            finalize(() => {
              this.loadingIndicatorFlags.isCreateOrUpdateGroupLoading = false;
            })
          )
        );
        this.loadingIndicatorFlags.isCreateOrUpdateGroupLoading = false;
        if (response.success) {
          this.paymentGroupId = response.data?.groupId;
          this.alertService.successAlert({
            content: 'Payments Group Created Successfully'
          });
          return response;
        }
      }
    } else {
      this.alertService.infoAlert({ content: `No valid payments found` });
    }

    return false;
  }

  /**
   * Updates an existing payments group based on valid payments and the current group ID.
   *
   * @returns A promise that resolves to the API response or `false` if the operation is unsuccessful.
   */
  async updateGroup(): Promise<IApiResMesssage | boolean> {
    if (this.isAnyProcessLoadings()) {
      return false;
    }
    const validPaymentsFormArray = this.getValidPaymentsFormArray(true);
    if (validPaymentsFormArray.length > 0 && this.paymentGroupId) {
      const sendingData: IGroupPaymentsCreate =
        this.createSendingBodyForSaveGroup(
          validPaymentsFormArray,
          this.groupDetails.groupName
        );
      this.loadingIndicatorFlags.isCreateOrUpdateGroupLoading = true;
      const response = await firstValueFrom(
        this.groupPaymentsService
          .updatePaymentsGroup(sendingData, this.paymentGroupId)
          .pipe(
            finalize(() => {
              this.loadingIndicatorFlags.isCreateOrUpdateGroupLoading = false;
            })
          )
      );
      if (response?.success) {
        this.groupDetails = {
          groupName: this.groupDetails.groupName,
          resources: sendingData.payments ?? []
        };
        this.store.dispatch(
          groupPaymentsActions.groupPaymentsLoadSuccess({
            groupDetails: this.groupDetails
          })
        );
        this.alertService.successAlert({
          content: 'Payments Group Updated Successfully'
        });
      }
      return response;
    }
    this.alertService.infoAlert({ content: `No valid payments found` });
    return false;
  }

  /**
   * Checks conditions and saves or processes payments based on the user's input.
   *
   * @param continueToProcessPayments - A boolean indicating whether to proceed with payment processing after saving.
   */
  async checkConditionsAndSavePayments(continueToProcessPayments?: boolean) {    
    // if kyc is not done and card payment is selected then redirect to kyc
    if (
      this.getValidPaymentsFormArray().find(
        (el) => el.value.paymentSourceType?.sourceType === 'CARD'
      )
    ) {
      const kycStatus =
        this.localStorageService.getItem('gettingStartedData')?.kycStatus;

      if (kycStatus === null) {
        if (environment.isV4Persona) {
          this.personaHelperService
            .openModal('kyc', CVSourceType.credit_card, true)
            .subscribe();
        } else {
          this.router.navigateByUrl('/manage/users/verify-user-id?type=8');
        }
        return;
      }
    }

    if(this.getValidCardPaymentsFormArray().length > 0){
      this.loadingIndicatorFlags.isLoading = true;
      const payeeIds = this.getValidCardPaymentsFormArray().map((el) => el.value.payee?.id ?? '');
      const bannedCheck = await firstValueFrom(this.paymentsService.bannedPayeeCheckForGroup(payeeIds));
      if (bannedCheck?.success && bannedCheck.is_banned_visa_bpsp_ids.length > 0) {
        this.isBanned = true;
        this.showBannedMessage(bannedCheck.is_banned_visa_bpsp_ids);
        this.loadingIndicatorFlags.isLoading = false;
        return;
      }
      this.loadingIndicatorFlags.isLoading = false;
    }

    if (this.isAnyProcessLoadings()) {
      return;
    }
    const validPaymentsFormArray = this.getValidPaymentsFormArray();

    // Check if groupId exists and no rows are selected
    if (this.paymentGroupId) {
      if (!this.areSomePaymentsSelected() && !this.areAllPaymentsSelected()) {
        this.alertService.infoAlert({ content: `Please select at least one valid payment to proceed` });
        return;
      }
    }

    if (!(validPaymentsFormArray?.length > 0)) {
      this.paymentsFormArray.controls.forEach((el) => {
        el.markAsTouched();
      });
      this.alertService.infoAlert({ content: `No valid payments found` });
      return;
    }
    let paymentMethodsAreEnabled = true;

    validPaymentsFormArray.forEach((payment) => {
      if (
        !this.paymentTypeAccessService.onInputChanges(
          (payment.value.paymentSourceType ?? '') as string,
          {disableAlert: false},
          continueToProcessPayments ?? false
        )
      ) {
        paymentMethodsAreEnabled = false;
      }
    });
    if (!paymentMethodsAreEnabled) return;
    if (this.paymentGroupId) {
      /* Group exist */
      const sendingData: IGroupPaymentsCreate =
        this.createSendingBodyForSaveGroup(
          validPaymentsFormArray,
          this.groupDetails.groupName
        );
      if (
        this.utils.areObjectsEqual(
          sendingData.payments,
          this.groupDetails.resources
        ) === false
      ) {
        /* form changed */
        const isSaveGroup = await firstValueFrom(
          this.alertService
            .confirmAlert({
              content: `Would you like to save changes to the group before proceeding?`,
              cancelMsg: 'Continue Without Save',
              doneMsg: 'Save & Proceed',
              width: '450px'
            })
            .afterClosed()
        );
        if (isSaveGroup) {
          /* Save Group */
          this.loadingIndicatorFlags.isLoading = true;
          const updatePaymentsGroupRes = await firstValueFrom(
            this.groupPaymentsService
              .updatePaymentsGroup(sendingData, this.paymentGroupId)
              .pipe(
                finalize(() => {
                  this.loadingIndicatorFlags.isLoading = false;
                })
              )
          );
          if (!updatePaymentsGroupRes.success) {
            return;
          }
            // Update resources with current selection state from form controls
            const updatedResources = this.groupDetails.resources.map((resource, index) => {
              const formControl = this.paymentsFormArray.controls[index];
              return {
                ...resource,
                selected: formControl?.get('selected')?.value ?? false
              };
            });
            
            this.groupDetails = {
              groupName: this.groupDetails.groupName,
              resources: updatedResources
            };
            const isCardWirePaymentIncluded= this.groupDetails.resources.filter((el) => el.sourceType === 'card' || el.transferType === 'wire');
            if(isCardWirePaymentIncluded.length > 0){
              this.isCardWireValidated.set(true);
            }
          this.store.dispatch(
            groupPaymentsActions.groupPaymentsLoadSuccess({
              groupDetails: this.groupDetails
            })
          );
        }
      }
    }
    const totalAmount = this.getSelectedPaymentsTotalAmount() || this.totalAmount.toFixed(2);
    const isSavePayments = await firstValueFrom(
      this.alertService
        .confirmAlert({
          content: `Number of valid payments: ${
            validPaymentsFormArray.length
          }. Total Amount: $${totalAmount}  ${
            continueToProcessPayments
              ? 'These payments will be saved before processing.'
              : ''
          }`,
          doneMsg: `${
            continueToProcessPayments ? 'Process Payments' : 'Save Payments'
          }`
        })
        .afterClosed()
    );
    if (!isSavePayments) {
      return;
    }
    
    const sendingDataPayments: IMultiPaymentsSave =
    this.createSendingDataForMultiplePayments(validPaymentsFormArray);

    const sendingDataChecks = this.paymentType === 'check' 
      ? this.createSendingDataForMultipleChecksPayment(validPaymentsFormArray) // Returns FormData directly
      : { cheques: this.createSendingDataForMultipleChecksPayment(validPaymentsFormArray) }; // Returns wrapped array

    let saveGroupPaymentsRes: IApiRes<{ ids: string[] }> | undefined;

    let saveGroupCheckPaymentsRes:
      | (IApiResMesssage & { checkIds: string[] })
      | undefined;
    this.loadingIndicatorFlags.isSavePaymentsLoading =
      !continueToProcessPayments;
    this.loadingIndicatorFlags.isProcessPaymentsLoading =
      !!continueToProcessPayments;
    try {
      if (sendingDataPayments.payments?.length > 0) {
        saveGroupPaymentsRes = await firstValueFrom(
          this.groupPaymentsService.saveMultiplepayments(sendingDataPayments)
        );
      }
      if ((this.paymentType === 'check' && sendingDataChecks) || 
        (this.paymentType !== 'check' && (sendingDataChecks as { cheques: IGroupPaymentsItemCheck[] })?.cheques?.length > 0)) {
        saveGroupCheckPaymentsRes = await firstValueFrom(
        this.checkService.postMultipleChecks(sendingDataChecks, this.paymentType === 'check')
        );
      }
    } catch (err) {
      if (err && (err as { error: IIpSecurity })?.error?.errorCode === 631) {
        this.authDataService.verifyEmailAndMobile(
          (err as { error: IIpSecurity }).error.errorMsg
        );
      }
    }

    this.loadingIndicatorFlags.isSavePaymentsLoading = false;
    this.loadingIndicatorFlags.isProcessPaymentsLoading = false;
    if (
      !(saveGroupPaymentsRes?.success || saveGroupCheckPaymentsRes?.success)
    ) {
      return;
    }
    if (continueToProcessPayments) {
      this.goToBulkPayments(
        saveGroupPaymentsRes?.data?.ids ?? [],
        saveGroupCheckPaymentsRes?.checkIds ?? []
      );
    } else {
      this.alertService.successAlert({
        content: 'Payments Saved Successfully'
      });
      this.router.navigateByUrl('/manage/payments-table/index');
    }
  }

  importFromExcel() {
    const ref = this.dialog.open<
      ImportFromExcelComponent,
      unknown,
      false | { success: true; data: GroupPaymentExcelMappedData[] }
    >(ImportFromExcelComponent, {
      minWidth: '900px'
    });

    ref
      .afterClosed()
      .pipe(take(1))
      .subscribe((res) => {
        if (!res) return;

        this.paymentsFormArray.clear();
        this.paymentFormsArrayHelpers.length = 0;
        this.rowPurposeOfPaymentControls.length = 0;
        this.individualAttachments.length = 0;
        this.individualComments.length = 0;
        this.excludedCommonAttachments = {};
        this.excludedCommonComments = {};

        res.data.forEach((el, i) => {
          const group = this.createNewFormGroup();

          const paymentSourceType =
            this.paymentSourceTypes.find((type) => type.id === el.sourceType) ??
            this.paymentSourceTypes[0];

          const paymentMethod = paymentSourceType.payOptions?.find(
            (option) => option.id === el.transferType
          );

          group.patchValue({
            ...this.basePaymentForm.value,
            amount: el.amount,
            date: el.date,
            memo: el.memo,
            invoiceNumber: el.invoice_number,
            paymentSourceType,
            paymentMethod,
            importedPayeeBank: el.payeeBankAccountId
              ? { payeeId: el.payeeId, payeeBankAccountId: el.payeeBankAccountId }
              : null
          });
          this.paymentsFormArray.push(group);
          this.afterFormPushToArray(group);

          this.paymentFormsArrayHelpers[i].payeeDropDown.selectableId =
            el.payeeId;

          this.paymentFormsArrayHelpers[i].categoryDropDown.selectableId =
            el.category;
        });
        this.syncRowPurposesFromMemo();
        this.onPaymentsFormArrayLengthChanges();
      });
  }


  showBannedMessage(bannedPayeeIds: string[]) {
    this.isBanned = true;
    this.getValidCardPaymentsFormArray().forEach((el) => {
      if(bannedPayeeIds.includes(el.value.payee?.id ?? '')){
        el.controls.payee.reset();
      }
    });
    this.alertService.failedAlert({
      content: 'Unfortunately we cannot support payment to this beneficiary as it violates our terms of service'
    }).afterClosed().subscribe(() => {
      this.isBanned = false;
    });
  }

  /**
   * Toggles the selection of all payment rows.
   * @param checked - Whether to select or deselect all payments.
   */
  selectRowToggle(checked: boolean) {
    this.paymentsFormArray.controls.forEach((control, index) => {
      this.manuallyInteractedForms.add(index);
      if (this.paymentGroupId) {
        if (checked) {
          control.controls.selected.setValue(control.valid);
        } else {
          control.controls.selected.setValue(false);
        }
      } else {
        control.controls.selected.setValue(checked);
      }
    });
  }

  /**
   * Toggles the selection of a specific payment row.
   * @param index - The index of the payment row.
   * @param checked - Whether to select or deselect the payment.
   */
  toggleRowSelection(index: number, checked: boolean) {
    const formControl = this.paymentsFormArray.controls[index];
    this.manuallyInteractedForms.add(index);
    if (this.paymentGroupId) {
      if (checked && formControl.valid) {
        formControl.controls.selected.setValue(true);
      } else {
        formControl.controls.selected.setValue(false);
      }
    } else {
      formControl.controls.selected.setValue(checked);
    }
  }

  /**
   * Gets the count of selected payments.
   * @returns The number of selected payments.
   */
  getSelectedPaymentsCount(): number {
    return this.getValidPaymentsFormArray().length;
  }

  /**
   * Checks if all payments are selected.
   * @returns True if all payments are selected, false otherwise.
   */
  areAllPaymentsSelected(): boolean {
    return this.paymentsFormArray.controls.length > 0 && 
           this.paymentsFormArray.controls.every(control => control.controls.selected.value);
  }

  /**
   * Checks if some payments are selected.
   * @returns True if some but not all payments are selected, false otherwise.
   */
  areSomePaymentsSelected(): boolean {
    const selectedCount = this.getSelectedPaymentsCount();
    return selectedCount > 0 && selectedCount < this.paymentsFormArray.controls.length;
  }

  /**
   * Gets the total amount of selected payments.
   * @returns The total amount of selected payments.
   */
  getSelectedPaymentsTotalAmount(): number {
    return this.paymentsFormArray.controls
      .filter(control => control.controls.selected.value)
      .reduce((total, control) => {
        const amount = this.utils.amountToNumber(control.controls.amount.value);
        return total + (amount || 0);
      }, 0);
  }

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
          this.individualAttachments[index] = res.existingData;
        });
      }
    });
  }

  /**
   * Opens the attachment modal for a specific row
   * @param rowIndex The index of the row
   */
  openAddAttachmentForRow(rowIndex: number) {
    const dialogRef = this.dialog.open(CheckAddAttachmentCommonModalComponent, {
      maxWidth: '600px',
      width: '93%',
      data: {
        mode: 'group_payments',
        existingData: this.individualAttachments[rowIndex]
      }
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res && res.existingData) {
        this.individualAttachments[rowIndex] = res.existingData;
      }
    });
  }

  /**
   * Gets the attachment count for a specific row including common attachments (excluding row-specific exclusions)
   * @param rowIndex The index of the row
   * @returns The number of attachments for the row (individual + common - excluded)
   */
  getAttachmentCount(rowIndex: number): number {
    const individualCount = this.individualAttachments[rowIndex]?.length || 0;
    return individualCount ;
  }

  /**
   * Gets the combined attachments for a specific row (individual + common - excluded)
   * @param rowIndex The index of the row
   * @returns Combined array of individual and common attachments (excluding row-specific exclusions)
   */
  getCombinedAttachments(rowIndex: number): File[] {
    return this.individualAttachments[rowIndex] || [];
  }

  /**
   * Gets the individual attachment count for a specific row
   * @param rowIndex The index of the row
   * @returns The number of individual attachments for the row
   */
  getIndividualAttachmentCount(rowIndex: number): number {
    return this.individualAttachments[rowIndex]?.length || 0;
  }

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
      }else{
        this.createdExistingComments = [];
        this.commentsCount = 0;
        this.paymentsFormArray.controls.forEach((control, index) => {
          this.individualComments[index] = [];
        });
      }
    });
  }

  /**
   * Opens the comment modal for a specific row
   * @param rowIndex The index of the row
   */
  openAddCommentForRow(rowIndex: number) {
    // Combine individual and common comments for display (excluding row-specific exclusions)

    const dialogRef = this.dialog.open(CheckAddCommentModalComponent, {
      maxWidth: '800px',
      width: '93%',
      disableClose: true,
      data: {
        mode: 'group_payments',
        existingData: this.individualComments[rowIndex]
      }
    });

    dialogRef.afterClosed().subscribe((res) => {      
      if (res && res.existingData) {
        this.individualComments[rowIndex] = res.existingData;
      }
    });
  }

  /**
   * Gets the comment count for a specific row including common comments (excluding row-specific exclusions)
   * @param rowIndex The index of the row
   * @returns The number of comments for the row (individual + common - excluded)
   */
  getCommentCount(rowIndex: number): number {
    return this.individualComments[rowIndex]?.length || 0;
  }

  /**
   * Gets the combined comments for a specific row (individual + common - excluded)
   * @param rowIndex The index of the row
   * @returns Combined array of individual and common comments (excluding row-specific exclusions)
   */
  getCombinedComments(rowIndex: number): string[] {
    return this.individualComments[rowIndex] || [];
  }

  /**
   * Gets the individual comment count for a specific row
   * @param rowIndex The index of the row
   * @returns The number of individual comments for the row
   */
  getIndividualCommentCount(rowIndex: number): number {
    return this.individualComments[rowIndex]?.length || 0;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  } 
}

import {
  afterNextRender,
  Component,
  computed,
  effect,
  HostListener,
  Injector,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
  input,
  output,
  signal
} from '@angular/core';
import {
  ScrollingModule,
  CdkVirtualScrollViewport
} from '@angular/cdk/scrolling';
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
  catchError,
  combineLatest,
  debounceTime,
  defer,
  filter,
  finalize,
  firstValueFrom,
  map,
  merge,
  of,
  take,
  tap,
  timeout
} from 'rxjs';
import { Utils } from 'src/app/data/utils';
import { IBankDropdown } from 'src/app/models/bank';
import { IWalletData } from 'src/app/models/wallet';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { DatePipe, AsyncPipe, CurrencyPipe, NgClass } from '@angular/common';
import {
  IAttachmentItem,
  IDropdownMetaData,
  IV3DropDownOnReady
} from 'src/app/models/common';
import { IApiRes, IApiResMesssage } from 'src/app/models/api';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { Store } from '@ngrx/store';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { ICategoryDropdown } from 'src/app/modules/category/model/category';
import { V4DatePickerComponent } from 'src/app/shared/V4/v4-date-picker/v4-date-picker.component';
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
import { environment } from 'src/environments/environment';
import { CVSourceType } from 'src/app/modules/common-verification/model/common-verification';
import { PersonaHelperService } from 'src/app/shared/persona-v4/service/persona-helper.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { IComments } from 'src/app/data/data/cloud-quick-pay';
import { groupPaymentsFeature } from 'src/app/modules/group-payments/store/groupPayments.reducer';
import { groupPaymentsActions } from 'src/app/modules/group-payments/store/groupPayments.actions';
import { payeesActions } from 'src/app/modules/store/payees/payees.actions';
import {
  selectIsPayeesByIdLoading,
  selectPayees
} from 'src/app/modules/store/payees/payees.selectors';
import { CategoriesActions } from 'src/app/modules/store/categories/categories.actions';
import {
  selectCategories,
  selectIsCategoriesByIdLoading
} from 'src/app/modules/store/categories/categories.selectors';
import {
  GroupPaymentExcelMappedData,
  IImportedPayeeBank,
  getImportedPayeeBankAccountId,
  IGroupPaymentsCreate,
  IGroupPaymentsDetails,
  IGroupPaymentsItem,
  IGroupPaymentsItemCheck,
  IMultiPaymentsSave
} from 'src/app/modules/group-payments/models/group-payments.models';
import { GroupPaymentsService } from 'src/app/modules/group-payments/services/group-payments.service';
import {
  IBillBulkPaymentData,
  IBillBulkPaymentDataGroup
} from 'src/app/modules/bill/model/Bill';

// V4 shared components
import { PayeeDropdownV4Component } from 'src/app/shared/components/v4/dropdowns/payee-dropdown-v4/payee-dropdown-v4.component';
import { CategoryDropdownV4Component } from 'src/app/shared/V4/dropdown/category-dropdown-v4/category-dropdown-v4.component';
import { CommonAmountInputV4Component } from 'src/app/shared/V4/common-amount-input-v4/common-amount-input-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { LoadingOverlayV4Component } from 'src/app/shared/V4/loading-overlay-v4/loading-overlay-v4.component';

// Lucide icons
import {
  LucideAngularModule,
  ArrowLeft ,
  Plus,
  Trash2,
  Search,
  Send,
  Save,
  Calendar,
  CircleAlert,
  CircleCheck,
  ChevronDown,
  Wallet,
  Landmark,
  CreditCard,
  Zap,
  Clock,
  Mail,
  FileText,
  ClipboardCheck,
  Check,
  Info,
  SquarePen,
  GripVertical,
  X
} from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PaymentSourceDropdownV4Component } from 'src/app/shared/components/v4/dropdowns/payment-source-dropdown-v4/payment-source-dropdown-v4.component';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { NgSelectModule } from '@ng-select/ng-select';
import { V4CheckAddCommentModalComponent } from 'src/app/modules/check/modal/check-activity-modals/v4-check-add-comment-modal/v4-check-add-comment-modal.component';
import { V4CheckAddAttachmentCommonModalComponent } from 'src/app/modules/check/modal/check-activity-modals/v4-check-add-attachment-common-modal/v4-check-add-attachment-common-modal.component';
import { BusinessVerificationRequiredModalComponent } from 'src/app/shared/V4/business-verification-required-modal/business-verification-required-modal.component';
import { V4GroupNameModalComponent } from '../../modals/v4-group-name-modal/v4-group-name-modal.component';
import { V4BulkPaymentService } from '../../services/v4-bulk-payment.service';
import { V4PaymentsTableData } from 'src/app/modules/v3-payments-table/shared/components/v3-payments-table/v4-payments-table-data';
import {
  getDefaultPayAsOption,
  LET_VENDOR_DECIDE_ID,
  withLetVendorDecide
} from 'src/app/modules/payments/model/pay-as-options';

/**
 * Ceiling on the pre-import payee/category lookup. The overlay must never be able to
 * strand the page, so a slow or failed lookup falls through to per-dropdown resolution.
 */
const IMPORT_PREFETCH_TIMEOUT_MS = 10000;

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
  billIds: FormControl<string[] | null | undefined>;
  importedPayeeBank: FormControl<IImportedPayeeBank | null>;
}

@Component({
  selector: 'app-v4-group-payment',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    AsyncPipe,
    CurrencyPipe,
    LucideAngularModule,
    PayeeDropdownV4Component,
    CategoryDropdownV4Component,
    CommonAmountInputV4Component,
    CommonInputFieldV4Component,
    CommonButtonV4Component,
    PaymentSourceDropdownV4Component,
    MatTooltipModule,
    NgSelectModule,
    NgClass,
    V4DatePickerComponent,
    LoadingOverlayV4Component,
    ScrollingModule
  ],
  templateUrl: './v4-group-payment.component.html',
  styleUrl: './v4-group-payment.component.scss'
})
export class V4GroupPaymentComponent implements OnInit, OnDestroy {
  // Services
  private groupPaymentsService = inject(GroupPaymentsService);
  private checkService = inject(CheckService);
  private alertService = inject(V4AlertService);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private datePipe = inject(DatePipe);
  private store = inject(Store);
  public paymentTypeAccessService = inject(PaymentTypeAccessService);
  private authDataService = inject(AuthDataService);
  private personaHelperService = inject(PersonaHelperService);
  private localStorageService = inject(LocalStorageService);
  private paymentsService = inject(PaymentsService);
  private v4BulkPaymentService = inject(V4BulkPaymentService);
  private injector = inject(Injector);
  private zone = inject(NgZone);

  /** Covers the excel import from modal close until the populated table has painted. */
  isPreparingImport = signal(false);

  // Lucide Icons
  readonly arrowLeftIcon = ArrowLeft ;
  readonly CircleCheckIcon = Check;
  readonly PlusIcon = Plus;
  readonly Trash2Icon = Trash2;
  readonly SearchIcon = Search;
  readonly SendIcon = Send;
  readonly SaveIcon = Save;
  readonly CalendarIcon = Calendar;
  readonly CircleAlertIcon = CircleAlert;
  readonly ChevronDownIcon = ChevronDown;
  readonly WalletIcon = Wallet;
  readonly LandmarkIcon = Landmark;
  readonly CreditCardIcon = CreditCard;
  readonly ZapIcon = Zap;
  readonly ClockIcon = Clock;
  readonly MailIcon = Mail;
  readonly FileTextIcon = FileText;
  readonly ClipboardCheckIcon = ClipboardCheck;
  readonly CircleCheckValidIcon = CircleCheck;
  readonly InfoIcon = Info;
  readonly SquarePenIcon = SquarePen;
  readonly GripVerticalIcon = GripVertical;
  readonly XIcon = X;

  // Inputs / Outputs
  groupId = input<string>();
  importedExcelData = input<GroupPaymentExcelMappedData[]>();
  billBulkData = input<IBillBulkPaymentData | null>();
  changeInputMethod = output<void>();

  isCardWireValidated = signal(false);

  utils = Utils;

  // Forms
  basePaymentForm: FormGroup<IGroupPaymentsBaseFormModel>;
  paymentsFormArray: FormArray<FormGroup<IGroupPaymentsFormModel>>;
  rowsToAdd = new FormControl<number>(5);
  /** Product cap on total payment rows in one group-payment session. */
  readonly maxPaymentRows = 300;

  purposeOfPaymentOptions = signal<string[]>([]);
  basePurposeOfPaymentControl = new FormControl<string | null>(null);
  rowPurposeOfPaymentControls: FormControl<string | null>[] = [];

  // Data
  basePaymentSourceType$: Observable<TPaymentSource>;
  paymentSourceTypes = withLetVendorDecide(V4PaymentsTableData.getPayFromItems());
  basePaymentMethods$: Observable<IPayAsItem[] | undefined>;
  paymentFormsArrayHelpers: IPaymentFormsArrayHelpers[] = [];
  // Virtual-scroll viewport over the payment rows: only ~15 rows are painted at a
  // time, so 300 rows no longer instantiate ~1,500 dropdown components at once.
  @ViewChild(CdkVirtualScrollViewport) rowsViewport?: CdkVirtualScrollViewport;
  // *cdkVirtualFor is driven off this signal rather than paymentsFormArray.controls
  // directly: cdkVirtualFor does not reliably re-measure when the bound array is
  // mutated in place (push/removeAt), so it would keep showing only the original
  // rows. Refreshing this with a fresh array reference on every length change forces
  // the viewport to re-diff and recompute its scroll size. See syncPaymentRows().
  paymentRows = signal<FormGroup<IGroupPaymentsFormModel>[]>([]);
  subscriptions: Subscription[] = [];
  formValidationChangeSubscriptions: Subscription[] = [];
  private amountChangeSubscription?: Subscription;
  totalAmount: number = 0;
  paymentGroupId = signal<string>('');
  isBanned = false;
  autoApplyToNewRows = true;

  manuallyInteractedForms = new Set<number>();
  paymentType: string | null = null;
  createdExistingAttachments: File[] = [];
  attachmentCount = 0;
  individualAttachments: File[][] = [];
  excludedCommonAttachments: { [rowIndex: number]: string[] } = {};
  createdExistingComments: string[] = [];
  commentsCount = 0;
  individualComments: string[][] = [];
  excludedCommonComments: { [rowIndex: number]: string[] } = {};

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
  groupName = signal<string>('');

  // When bill data arrives (navigated from the Bill list with multiple payees),
  // default the batch to Bank Account + Check and prefill one row per payee.
  billBulkPrefillEffect = effect(() => {
    const data = this.billBulkData();
    if (!data?.paymentGroups?.length || !this.paymentsFormArray) return;

    // Pay From -> Bank Account, Pay As -> Check.
    const bankAccountType =
      this.paymentSourceTypes.find((type) => type.id === 'bankaccount') ?? null;
    const checkOption =
      bankAccountType?.payOptions?.find((opt) => opt.id === 'check') ?? null;
    if (bankAccountType) {
      this.basePaymentForm?.controls.paymentSourceType.setValue(bankAccountType);
    }
    if (checkOption) {
      this.basePaymentForm?.controls.paymentMethod.setValue(checkOption);
    }

    this.populateFromBillBulkData(data, bankAccountType, checkOption);
  });

  // Column resize
  resizableColumns = signal([
    { name: 'Pay To', width: 180, minWidth: 100 },
    { name: 'Amount', width: 150, minWidth: 120 },
    {
      name: 'Date',
      width: 140,
      minWidth: 90,
      tooltip:
        'The check issue date, which is applicable solely for check payments.'
    },
    { name: 'Pay From', width: 100, minWidth: 80 },
    {
      name: 'Source',
      width: 160,
      minWidth: 100,
      tooltip:
        "• Choose your saved credit card. \n• Select '+New' to add different card."
    },
    { name: 'Pay As', width: 130, minWidth: 80 },
    {
      name: 'Category',
      width: 140,
      minWidth: 100,
      tooltip:
        '• Organize payment for your records.\n• Helps with expense tracking/taxes.'
    },
    {
      name: 'Invoice #',
      width: 120,
      minWidth: 80,
      tooltip:
        "• Enter number from your bill/invoice. \n• Leave blank if you don't have one. \n• Helps track your payment later."
    },
    {
      name: 'Memo',
      width: 140,
      minWidth: 100,
      tooltip:
        "• Brief note about this payment.\n• Example: 'Office rent' or 'Supplies'."
    }
  ]);

  gridTemplateColumns = computed(() => {
    const cols = this.resizableColumns();
    const lastIndex = cols.length - 1;
    const colWidths = cols
      .map((c, i) =>
        i === lastIndex ? `minmax(${c.width}px, 1fr)` : `${c.width}px`
      )
      .join(' ');
    const checkboxCol = this.paymentGroupId() ? '40px ' : '';
    return `${checkboxCol}60px ${colWidths} 48px`;
  });

  private resizeIndex = -1;
  private resizeStartX = 0;
  private resizeStartWidth = 0;

  ngOnInit(): void {
    this.initStoreSelectors();
    this.initBaseForm();
    this.initFormArray();
    this.initGroupIdIfExists();
    this.startExcelImport();
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
        this.paymentsService.matchPurposeFromMemo(row.controls.memo.value) || null
      );
    });
  }

  onBasePurposeChange(): void {
    const selected = this.basePurposeOfPaymentControl.value;
    if (selected && selected !== 'Other') {
      const sanitized = selected.replace(/[^a-zA-Z ]/g, '').replace(/\s+/g, ' ').trim();
      this.basePaymentForm.controls.memo.setValue(sanitized);
      this.rowPurposeOfPaymentControls.forEach((ctrl) => ctrl.setValue(selected));
    } else {
      this.basePaymentForm.controls.memo.setValue('');
      if (selected === 'Other') {
        this.rowPurposeOfPaymentControls.forEach((ctrl) => ctrl.setValue('Other'));
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
    this.basePurposeOfPaymentControl.setValue(null);
    // Snapshot row purpose values BEFORE base-memo propagation wipes all row memos
    const rowPurposeSnapshot = this.rowPurposeOfPaymentControls.map((ctrl) => ctrl.value);
    // Clearing base memo triggers the initBaseForm subscription, which propagates '' to all rows
    this.basePaymentForm.controls.memo.setValue('');
    // Now reconcile each row using the snapshot taken before propagation
    rowPurposeSnapshot.forEach((purposeValue, index) => {
      if (!purposeValue || purposeValue === 'Other') {
        this.rowPurposeOfPaymentControls[index]?.setValue('');
        this.paymentsFormArray.controls[index]?.controls.memo.setValue('');
      } else {
        const sanitized = purposeValue.replace(/[^a-zA-Z ]/g, '').replace(/\s+/g, ' ').trim();
        this.paymentsFormArray.controls[index]?.controls.memo.setValue(sanitized);
        this.rowPurposeOfPaymentControls[index]?.setValue(purposeValue);
      }
    });
  }

  clearRowPurpose(index: number): void {
    this.rowPurposeOfPaymentControls[index]?.setValue(null);
    this.paymentsFormArray.controls[index]?.controls.memo.setValue('');
  }

  /**
   * Excel rows are built only once their payees and categories are in the store, so the
   * table paints already populated instead of filling in cell by cell over several
   * seconds. The overlay covers the whole wait.
   */
  private async startExcelImport(): Promise<void> {
    const excelData = this.importedExcelData();
    if (excelData?.length) {
      this.isPreparingImport.set(true);
      try {
        await this.prefetchImportReferences(
          excelData.slice(0, this.maxPaymentRows)
        );
        this.populateFromExcelData();
      } catch {
        this.alertService.failedAlert({
          content: 'Could not import the payments from your file.'
        });
      } finally {
        // Cleared only once the rows have actually painted. Clearing on the same tick
        // would swap the spinner for a frozen blank frame while Angular renders.
        // Angular 17 runs after-render hooks outside the zone and has no signal-driven
        // scheduler, so the write has to be zone-run or nothing repaints.
        afterNextRender(
          () => this.zone.run(() => this.isPreparingImport.set(false)),
          { injector: this.injector }
        );
      }
    }
  }

  /**
   * Pulls every payee and category the sheet references into the store in one request
   * each. Without it, each row's dropdown resolves its own id one at a time
   * (payee-dropdown-v4 `loadItemsById`), which is slow and racy past ~100 rows.
   *
   * Never rejects: a slow or failed lookup must not strand the overlay, so it resolves
   * on timeout and the affected rows fall back to per-dropdown resolution.
   */
  private async prefetchImportReferences(
    rows: GroupPaymentExcelMappedData[]
  ): Promise<void> {
    const payeeIds = [...new Set(rows.map((el) => el.payeeId).filter(Boolean))];
    const categoryIds = [
      ...new Set(rows.map((el) => el.category).filter(Boolean))
    ];
    if (!payeeIds.length && !categoryIds.length) return;

    if (payeeIds.length) {
      this.store.dispatch(payeesActions.loadPayeesByIds({ ids: payeeIds }));
    }
    if (categoryIds.length) {
      this.store.dispatch(
        CategoriesActions.loadCategoriesByIds({ ids: categoryIds })
      );
    }

    // Wait on the request-completion flags rather than on every id turning up in the
    // store: a deleted or inaccessible id never comes back, and waiting for it would
    // stall the overlay until the timeout on every import containing one bad row.
    // Both reducers set their flag synchronously on dispatch, so there is no race here.
    await firstValueFrom(
      combineLatest([
        this.store.select(selectIsPayeesByIdLoading),
        this.store.select(selectIsCategoriesByIdLoading)
      ]).pipe(
        filter(
          ([payeesLoading, categoriesLoading]) =>
            !payeesLoading && !categoriesLoading
        ),
        take(1),
        timeout(IMPORT_PREFETCH_TIMEOUT_MS),
        catchError(() => of(null))
      )
    );
  }

  initStoreSelectors() {
    this.groupDetailsLoading$ = this.store.select(
      groupPaymentsFeature.selectIsLoading
    );
  }

  initGroupIdIfExists() {
    const id = this.groupId();
    if (id) {
      this.paymentGroupId.set(id);
      this.store.dispatch(
        groupPaymentsActions.groupPaymentsInit({ id: this.paymentGroupId() })
      );
      this.getPaymentGroupDetails();
    } else {
      this.store.dispatch(groupPaymentsActions.groupPaymentsInit({}));
    }
  }

  populateFromExcelData() {
    const excelData = this.importedExcelData();
    if (!excelData?.length) return;

    // The header advertises a 300-row cap, so an oversized sheet is truncated
    // rather than quietly exceeding it. The data is clamped rather than just the
    // row-creation loop because the patchValue map below indexes `controls[indx]`
    // unguarded — iterating past the created rows would throw.
    const rows = excelData.slice(0, this.maxPaymentRows);
    if (excelData.length > this.maxPaymentRows) {
      this.alertService.infoAlert({
        content: `Your file has ${excelData.length} payments. Only the first ${this.maxPaymentRows} were imported.`
      });
    }

    // Disable base form auto-propagation while populating
    this.autoApplyToNewRows = false;
    if (!this.paymentsFormArray) {
      this.paymentsFormArray = new FormArray(
        [] as FormGroup<IGroupPaymentsFormModel>[]
      );
    }
    if (!this.paymentGroupId()) {
      this.clearManuallyInteractedForms();
    }
    const formsArrayLengthDifference =
      rows.length - this.paymentsFormArray.length;
    if (formsArrayLengthDifference > 0) {
      for (let i = 0; i < formsArrayLengthDifference; i += 1) {
        this.pushFormToPaymentsArray();
      }
    }
    // startExcelImport has already pulled these into the store, so the objects can be
    // patched straight into the controls and the dropdowns bind through their normal
    // ControlValueAccessor. Only ids the prefetch could not resolve still need the
    // dropdown's own lookup.
    const payeeById = new Map<string, IPayeeDropdown>();
    const categoryById = new Map<string, ICategoryDropdown>();
    this.store
      .select(selectPayees)
      .pipe(take(1))
      .subscribe((list) => list.forEach((el) => payeeById.set(el.id, el)));
    this.store
      .select(selectCategories)
      .pipe(take(1))
      .subscribe((list) => list.forEach((el) => categoryById.set(el.id, el)));

    this.paymentsFormArray.patchValue(
      rows.map((res, indx) => {
        this.paymentsFormArray?.controls?.[indx].markAsTouched();
        const paymentSourceType =
          this.paymentSourceTypes.find((type) => type.id === res.sourceType) ??
          this.paymentSourceTypes[0];
        const isWalletCheckPrint =
          res.sourceType === 'wallet' && res.transferType === 'check';
        const paymentMethodId = isWalletCheckPrint
          ? 'checkPrint'
          : res.transferType;
        const paymentMethod =
          paymentSourceType.payOptions?.find(
            (option) => option.id === paymentMethodId
          ) ?? getDefaultPayAsOption(paymentSourceType);

        const payee = res.payeeId ? payeeById.get(res.payeeId) : undefined;
        const category = res.category
          ? categoryById.get(res.category)
          : undefined;

        // Fallback for a deleted or inaccessible id. This path also carries the
        // "Please select a valid payee" and frozen-payee guards, so it must stay.
        const needsPayeeLookup = !!res.payeeId && !payee;
        const needsCategoryLookup = !!res.category && !category;
        if (
          (needsPayeeLookup || needsCategoryLookup) &&
          this.paymentFormsArrayHelpers?.[indx] &&
          !this.isCardWireValidated()
        ) {
          setTimeout(() => {
            const helper = this.paymentFormsArrayHelpers[indx];
            if (!helper) return;
            if (needsPayeeLookup) {
              helper.payeeDropDown.selectableId = res.payeeId;
              this.checkIdToBindDropDown(helper.payeeDropDown);
            }
            if (needsCategoryLookup) {
              helper.categoryDropDown.selectableId = res.category;
              this.checkIdToBindDropDown(helper.categoryDropDown);
            }
          }, 200);
        }

        return {
          paymentSourceType,
          paymentMethod,
          payee: payee ?? null,
          category: category ?? null,
          amount: String(this.utils.amountToNumber(res.amount)),
          date: this.datePipe.transform(res.date, 'yyyy-MM-dd'),
          memo: res.memo ?? '',
          invoiceNumber: res.invoice_number,
          importedPayeeBank: res.payeeBankAccountId
            ? { payeeId: res.payeeId, payeeBankAccountId: res.payeeBankAccountId }
            : null
        };
      })
    );
    this.syncRowPurposesFromMemo();
    this.paymentsFormArray.markAsPristine();
    this.onPaymentsFormArrayLengthChanges();
    this.autoApplyToNewRows = true;

    // Check wire enablement only if imported data contains wire rows
    const hasWireRows = rows.some(
      (el) => el.transferType === 'wire'
    );
    if (hasWireRows) {
      this.subscriptions.push(
        this.paymentTypeAccessService.disabledMethods$
          .pipe(
            filter((methods) => methods.length > 0),
            take(1)
          )
          .subscribe((disabledMethods) => {
            if (disabledMethods.includes('wire') || disabledMethods.includes('card-wire-transfer')) {
              this.isCardWireValidated.set(true);
              this.paymentsFormArray.controls.forEach((control, i) => {
                if (rows[i]?.transferType === 'wire') {
                  control.get('paymentMethod')?.reset();
                }
              });
              this.paymentTypeAccessService.openAlertMessage(
                'card-wire-transfer',
                true
              );
            }
          })
      );
    }
  }

  /**
   * Pre-fills the payment rows from the grouped bill data returned by
   * getBillBulkPaymentData. One row per payee group, with the payee, bank
   * account, category, amount, memo, invoice and bill ids bound. Mirrors the
   * v3 bill-list -> group-payment flow.
   */
  populateFromBillBulkData(
    data: IBillBulkPaymentData | null | undefined,
    bankAccountType: IPayFromItem | null,
    checkOption: IPayAsItem | null
  ): void {
    const allGroups: IBillBulkPaymentDataGroup[] = data?.paymentGroups || [];
    if (!allGroups.length) return;

    // Same 300-row cap as the excel import and the Add Rows button.
    const groups = allGroups.slice(0, this.maxPaymentRows);
    if (allGroups.length > this.maxPaymentRows) {
      this.alertService.infoAlert({
        content: `These bills produce ${allGroups.length} payments. Only the first ${this.maxPaymentRows} were loaded.`
      });
    }

    // Ensure there is one row per payee group.
    const rowsNeeded = groups.length - this.paymentsFormArray.length;
    for (let i = 0; i < rowsNeeded; i += 1) {
      this.pushFormToPaymentsArray();
    }

    groups.forEach((group, index) => {
      const formGroup = this.paymentsFormArray.controls[index];
      if (!formGroup) return;
      formGroup.markAsTouched();

      formGroup.patchValue({
        ...(bankAccountType ? { paymentSourceType: bankAccountType } : {}),
        ...(checkOption ? { paymentMethod: checkOption } : {}),
        amount: String(group.amountAfterCreditApplied),
        memo: group.memo ?? '',
        invoiceNumber: group.invoiceNumbers,
        billIds: group.billIds
      });

      const helper = this.paymentFormsArrayHelpers[index];
      if (!helper) return;
      // Dropdowns bind their selection asynchronously once their API is ready,
      // matching the excel-import prefill pattern.
      setTimeout(() => {
        helper.payeeDropDown.selectableId = group.payee.payeeId;
        this.checkIdToBindDropDown(helper.payeeDropDown);

        helper.paymentSourceDropDown.selectableId =
          group.bankAccount.bankAccountId;
        this.checkIdToBindDropDown(helper.paymentSourceDropDown);

        helper.categoryDropDown.selectableId = group.category_id;
        this.checkIdToBindDropDown(helper.categoryDropDown);
      }, 200);
    });

    this.syncRowPurposesFromMemo();
    this.onPaymentsFormArrayLengthChanges();
  }

  initBaseForm() {
    const paymentSourceType = this.paymentSourceTypes[0];
    const defaultPaymentMethod = getDefaultPayAsOption(paymentSourceType);

    this.basePaymentForm = new FormGroup<IGroupPaymentsBaseFormModel>({
      paymentSourceType: new FormControl(paymentSourceType),
      paymentSource: new FormControl(),
      paymentMethod: new FormControl(defaultPaymentMethod),
      amount: new FormControl(''),
      date: new FormControl(),
      category: new FormControl(),
      memo: new FormControl('', Validators.maxLength(150))
    });

    Object.keys(this.basePaymentForm.controls).forEach((baseFormControl) => {
      const subscription = this.basePaymentForm
        .get(baseFormControl)
        ?.valueChanges.subscribe((valueChange) => {
          if (!this.autoApplyToNewRows) return;
          this.paymentsFormArray?.controls?.forEach((paymentFormGroup) => {
            if (baseFormControl === 'paymentMethod') {
              paymentFormGroup
                .get('paymentMethod')
                ?.setValue(
                  this.getValidPaymentMethodForSource(
                    paymentFormGroup.get('paymentSourceType')?.value,
                    valueChange as IPayAsItem | null
                  )
                );
              return;
            }
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
      of(this.basePaymentForm.controls.paymentSourceType.value?.payOptions),
      this.basePaymentForm.controls.paymentSourceType.valueChanges.pipe(
        tap((source) => {
          this.basePaymentForm.controls.paymentMethod.setValue(
            getDefaultPayAsOption(source)
          );
        }),
        map((ele) => ele?.payOptions)
      )
    );
  }

  initFormArray() {
    this.paymentsFormArray = new FormArray(
      [] as FormGroup<IGroupPaymentsFormModel>[]
    );
    for (let i = 0; i < 5; i += 1) {
      this.pushFormToPaymentsArray();
    }
    this.onPaymentsFormArrayLengthChanges();
  }

  addMultipleRows(count: number) {
    if (!count || count <= 0) return;

    // There is no per-click cap — the 300-row session cap the header advertises is the
    // only limit. `remaining` keeps a click near the ceiling topping up to exactly 300
    // instead of overshooting, so the counter can never read "347/300".
    const remaining = this.maxPaymentRows - this.paymentsFormArray.length;
    if (remaining <= 0) {
      this.alertService.infoAlert({
        content: `You can add a maximum of ${this.maxPaymentRows} payments.`
      });
      return;
    }

    const rowsToAdd = Math.min(count, remaining);

    for (let i = 0; i < rowsToAdd; i += 1) {
      this.pushFormToPaymentsArray();
    }
    this.onPaymentsFormArrayLengthChanges();
  }

  /**
   * trackBy for *cdkVirtualFor — identity by FormGroup, matching the previous
   * `track formGroup`. Keeps a row's painted view (and any open dropdown / focus)
   * bound to the same control as rows recycle during scroll.
   */
  trackByFormGroup = (_: number, group: FormGroup<IGroupPaymentsFormModel>) =>
    group;

  /**
   * Scroll a specific 1-based row number into view. With virtualization the row may
   * not be painted yet; the viewport renders it on arrival and its controls rebind
   * from the FormArray, so the value is intact.
   */
  jumpToRow(rowNumber: number | string): void {
    const n = Number(rowNumber);
    if (!n || Number.isNaN(n)) return;
    const index = Math.max(0, Math.min(n - 1, this.paymentsFormArray.length - 1));
    this.rowsViewport?.scrollToIndex(index, 'smooth');
  }

  setFormArrayValue(groupPaymentsValues: IGroupPaymentsItem[]) {
    if (!this.paymentsFormArray) {
      this.paymentsFormArray = new FormArray(
        [] as FormGroup<IGroupPaymentsFormModel>[]
      );
    }
    if (!this.paymentGroupId()) {
      this.clearManuallyInteractedForms();
    }
    const formsArrayLengthDifference =
      groupPaymentsValues.length - this.paymentsFormArray.length;
    if (formsArrayLengthDifference > 0) {
      for (let i = 0; i < formsArrayLengthDifference; i += 1) {
        this.pushFormToPaymentsArray();
      }
    }
    this.paymentsFormArray.patchValue(
      groupPaymentsValues.map((res, indx) => {
        this.paymentsFormArray?.controls?.[indx].markAsTouched();
        const paymentSourceType =
          this.paymentSourceTypes.find((type) => type.id === res.sourceType) ??
          this.paymentSourceTypes[0];
        const isWalletCheck =
          res.sourceType === 'wallet' && res.transferType === 'check';
        const walletCheckPayAs =
          res.paymentMethod === 'check_email' ? 'checkEmail' : 'checkPrint';
        const paymentMethodId = isWalletCheck
          ? walletCheckPayAs
          : res.transferType;
        const paymentMethod =
          paymentSourceType.payOptions?.find(
            (option) => option.id === paymentMethodId
          ) ?? getDefaultPayAsOption(paymentSourceType);
        if (
          this.paymentFormsArrayHelpers?.[indx] &&
          !this.isCardWireValidated()
        ) {
          setTimeout(() => {
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
          paymentSourceType,
          paymentMethod,
          amount: String(this.utils.amountToNumber(res.amount)),
          date: this.datePipe.transform(res.date, 'yyyy-MM-dd'),
          memo: res.memo,
          invoiceNumber: res.invoiceNumber,
          selected: res.selected ?? false
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

  pushFormToPaymentsArray() {
    const newFormGroup = this.createNewFormGroup();
    if (this.autoApplyToNewRows) {
      newFormGroup.patchValue(this.basePaymentForm.value);
    }
    this.paymentsFormArray.push(newFormGroup);
    this.afterFormPushToArray(newFormGroup);
  }

  afterFormPushToArray(group: FormGroup<IGroupPaymentsFormModel>) {
    this.paymentFormsArrayHelpers.push({
      paymentSourceTypeChanges$: merge(
        defer(() =>
          of(group.controls.paymentSourceType.value?.id as TPaymentSource)
        ),
        group.controls.paymentSourceType.valueChanges.pipe(
          map((val) => val?.id as TPaymentSource)
        )
      ),
      paymentMethodChanges$: merge(
        defer(() =>
          of(group.controls.paymentMethod.value?.id as TPaymentSource)
        ),
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

    this.individualAttachments.push([...this.createdExistingAttachments]);
    const newIndex = this.individualAttachments.length - 1;
    this.excludedCommonAttachments[newIndex] = [];
    this.individualComments.push([...this.createdExistingComments]);
    this.excludedCommonComments[newIndex] = [];
    this.rowPurposeOfPaymentControls.push(
      new FormControl<string | null>(
        this.paymentsService.matchPurposeFromMemo(group.controls.memo.value) || null
      )
    );
  }

  createNewFormGroup() {
    const form = new FormGroup<IGroupPaymentsFormModel>({
      paymentSourceType: new FormControl(null, [Validators.required]),
      paymentSource: new FormControl(null, [Validators.required]),
      paymentMethod: new FormControl(null, [Validators.required]),
      payee: new FormControl(null, [Validators.required]),
      amount: new FormControl('', [Validators.required, Validators.min(0.01)]),
      date: new FormControl(),
      category: new FormControl(null),
      memo: new FormControl('', Validators.maxLength(150)),
      invoiceNumber: new FormControl('', Validators.maxLength(30)),
      selected: new FormControl<boolean>(false, { nonNullable: true }),
      attachments: new FormControl<IAttachmentItem[]>([], {
        nonNullable: true
      }),
      comments: new FormControl<IComments[]>([], { nonNullable: true }),
      billIds: new FormControl<string[] | null | undefined>(null),
      importedPayeeBank: new FormControl<IImportedPayeeBank | null>(null)
    });

    const sub = form.controls.payee.valueChanges.subscribe(() => {});
    this.subscriptions.push(sub);

    return form;
  }

  popFormFromPaymentsArray() {
    this.paymentsFormArray.controls.pop();
    this.paymentFormsArrayHelpers.pop();
    this.individualAttachments.pop();
    this.individualComments.pop();
    this.rowPurposeOfPaymentControls.pop();
    const lastIndex = this.individualAttachments.length;
    delete this.excludedCommonAttachments[lastIndex];
    delete this.excludedCommonComments[lastIndex];
    this.syncPaymentRows();
  }

  removeFormFromPaymentsArray(indx: number) {
    this.paymentsFormArray.removeAt(indx);
    this.paymentFormsArrayHelpers.splice(indx, 1);
    this.individualAttachments.splice(indx, 1);
    this.individualComments.splice(indx, 1);
    this.rowPurposeOfPaymentControls.splice(indx, 1);

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

  /**
   * Publish a fresh array reference of the current rows so *cdkVirtualFor re-measures
   * (it does not react to in-place push/removeAt on the FormArray's controls).
   */
  syncPaymentRows() {
    this.paymentRows.set(this.paymentsFormArray.controls.slice());
  }

  onPaymentsFormArrayLengthChanges() {
    this.syncPaymentRows();
    this.subscribeAmountChange();
    this.changeFormValidationBasedOnPaymentCombination();
  }

  subscribeAmountChange() {
    this.amountChangeSubscription?.unsubscribe();
    this.amountChangeSubscription = this.paymentsFormArray.valueChanges
      .pipe(debounceTime(500))
      .subscribe(() => this.calculateTotalAmount());
  }

  calculateTotalAmount() {
    let totalAmountTmp = 0;
    this.paymentsFormArray?.controls?.forEach((paymentFormGroup) => {
      if (paymentFormGroup.invalid) return;
      if (this.paymentGroupId() && !paymentFormGroup.controls.selected.value)
        return;
      totalAmountTmp += this.utils.amountToNumber(
        paymentFormGroup.controls.amount.value
      );
    });
    this.totalAmount = totalAmountTmp;
  }

  changeFormValidationBasedOnPaymentCombination() {
    this.formValidationChangeSubscriptions.forEach((res) => res?.unsubscribe());
    this.formValidationChangeSubscriptions.length = 0;
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

  /** Label shown under the blocking overlay loader. */
  actionOverlayMessage(): string {
    if (this.loadingIndicatorFlags['isCreateOrUpdateGroupLoading']) {
      return this.paymentGroupId() ? 'Updating group...' : 'Saving group...';
    }
    if (this.loadingIndicatorFlags['isProcessPaymentsLoading']) {
      return 'Preparing payments...';
    }
    return 'Saving payments...';
  }

  isAnyProcessLoadings() {
    return Object.keys(this.loadingIndicatorFlags).some(
      (ele) => this.loadingIndicatorFlags?.[ele] === true
    );
  }

  setValidationStatusOnFormChanges() {
    this.subscriptions.push(
      this.paymentsFormArray.valueChanges
        .pipe(debounceTime(500))
        .subscribe(() => this.updatePaymentFormValidityStatus())
    );
  }

  updatePaymentFormValidityStatus() {
    this.paymentFormValidityStatus.validPaymentFormCount = 0;
    this.paymentFormValidityStatus.validityStatusArray = [];
    this.paymentsFormArray.controls.forEach((paymentFormGroup, index) => {
      if (
        this.paymentGroupId() &&
        !this.manuallyInteractedForms.has(index)
      ) {
        paymentFormGroup.controls.selected.setValue(
          paymentFormGroup.valid
        );
      }

      if (paymentFormGroup.valid) {
        if (
          !this.paymentGroupId() ||
          paymentFormGroup.controls.selected.value
        ) {
          this.paymentFormValidityStatus.validPaymentFormCount += 1;
        }
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
  }

  getCorntrollError(control: AbstractControl) {
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

  getRowTooltip(index: number): string {
    const status = this.paymentFormValidityStatus.validityStatusArray[index];
    if (!status) return '';
    const fieldLabels: { [key: string]: string } = {
      payee: 'Pay To',
      amount: 'Amount',
      date: 'Date',
      paymentSourceType: 'Pay From',
      paymentSource: 'Account',
      paymentMethod: 'Pay As',
      category: 'Category',
      invoiceNumber: 'Invoice #',
      memo: 'Memo'
    };
    return Object.entries(status)
      .filter(([, msg]) => msg)
      .map(([field, msg]) => `${fieldLabels[field] || field}: ${msg}`)
      .join('\n');
  }

  getPaymentGroupDetails() {
    this.subscriptions.push(
      this.store
        .select(groupPaymentsFeature.selectGroupDetails)
        .pipe(debounceTime(100))
        .subscribe((res) => {
          if (res.groupData) {
            this.groupDetails = res.groupData;
            this.groupName.set(res.groupData.groupName);
            this.setFormArrayValue(res.groupData.resources);
          }
        })
    );
  }

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
        const isWalletCheckPrint =
          paymentSourceTypeId === 'wallet' &&
          paymentFormGroup.value.paymentMethod?.id === 'checkPrint';
        const isWalletCheckEmail =
          paymentSourceTypeId === 'wallet' &&
          paymentFormGroup.value.paymentMethod?.id === 'checkEmail';
        return {
          amount: this.utils.amountToNumber(paymentFormGroup.value.amount),
          payeeId: paymentFormGroup.value.payee?.encryptedId || ('' as string),
          sourceId,
          sourceType: paymentSourceTypeId as TPaymentSource,
          transferType:
            isWalletCheckPrint || isWalletCheckEmail
              ? 'check'
              : paymentFormGroup.value.paymentMethod?.id || ('' as string),
          ...(isWalletCheckPrint && { paymentMethod: 'check_print' }),
          ...(isWalletCheckEmail && { paymentMethod: 'check_email' }),
          date: paymentFormGroup.value.date
            ? (this.datePipe.transform(
                paymentFormGroup.value.date,
                'MM/dd/yyyy'
              ) as string)
            : undefined,
          category: paymentFormGroup.value.category?.id as string,
          invoiceNumber: paymentFormGroup.value.invoiceNumber || ('' as string),
          memo: paymentFormGroup.value.memo as string
        };
      })
    };
  }

  getValidPaymentsFormArray(
    isUpdate: boolean = false
  ): FormGroup<IGroupPaymentsFormModel>[] {
    if (this.paymentGroupId() && !isUpdate) {
      return this.paymentsFormArray.controls.filter(
        (paymentFormGroup) =>
          paymentFormGroup.valid && paymentFormGroup.controls.selected.value
      );
    }
    return this.paymentsFormArray.controls.filter(
      (paymentFormGroup) => paymentFormGroup.valid
    );
  }

  private getValidCardPaymentsFormArray(): FormGroup<IGroupPaymentsFormModel>[] {
    return this.paymentsFormArray.controls.filter(
      (paymentFormGroup) =>
        paymentFormGroup.valid &&
        paymentFormGroup.value.paymentSourceType?.sourceType === 'CARD'
    );
  }

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
          const isWalletCheckPrint =
            paymentSourceTypeId === 'wallet' &&
            paymentFormGroup.value.paymentMethod?.id === 'checkPrint';
          const isWalletCheckEmail =
            paymentSourceTypeId === 'wallet' &&
            paymentFormGroup.value.paymentMethod?.id === 'checkEmail';
          const payeeBankAccountId = getImportedPayeeBankAccountId(
            paymentFormGroup.value.importedPayeeBank,
            paymentFormGroup.value.payee?.id
          );
          return {
            amount: this.utils.amountToNumber(paymentFormGroup.value.amount),
            payeeId: paymentFormGroup.value.payee?.encryptedId || '',
            sourceId,
            sourceType: paymentSourceTypeId as TPaymentSource,
            transferType:
              isWalletCheckPrint || isWalletCheckEmail
                ? 'check'
                : paymentFormGroup.value.paymentMethod?.id || '',
            ...(isWalletCheckPrint && { paymentMethod: 'check_print' }),
            ...(isWalletCheckEmail && { paymentMethod: 'check_email' }),
            date: paymentFormGroup.value.date
              ? (this.datePipe.transform(
                  paymentFormGroup.value.date,
                  'MM/dd/yyyy'
                ) as string)
              : (undefined as undefined),
            category: paymentFormGroup.value.category?.id,
            memo: paymentFormGroup.value.memo || '',
            referenceNo: paymentFormGroup.value.invoiceNumber || '',
            ...(paymentFormGroup.value.billIds?.length
              ? { billIds: paymentFormGroup.value.billIds }
              : {}),
            ...(payeeBankAccountId && { payeeBankAccountId })
          };
        })
    };
  }

  createSendingDataForMultipleChecksPayment(
    validPayments: FormGroup<IGroupPaymentsFormModel>[]
  ): FormData | IGroupPaymentsItemCheck[] {
    const checkPayments = validPayments.filter(
      (el) => el.value.paymentMethod?.id === 'check'
    );

    if (this.paymentType === 'check') {
      const formData = new FormData();
      checkPayments.forEach((paymentFormGroup, index) => {
        const paymentSourceId = (
          paymentFormGroup.value.paymentSource as IWalletData
        )?.id;
        const payeeId = paymentFormGroup.value.payee?.encryptedId;
        const amount = this.utils.amountToNumber(paymentFormGroup.value.amount);
        const memo = paymentFormGroup.value.memo ?? undefined;
        const categoryId = paymentFormGroup.value.category?.id;
        const checkIssueDate = paymentFormGroup.value.date
          ? this.datePipe.transform(paymentFormGroup.value.date, 'yyyy-MM-dd')
          : undefined;
        const invoiceNo = paymentFormGroup.value.invoiceNumber;
        const { billIds } = paymentFormGroup.value;

        if (paymentSourceId)
          formData.append(
            `cheques[${index}][bank_account_id]`,
            paymentSourceId
          );
        if (payeeId) formData.append(`cheques[${index}][payee_id]`, payeeId);
        if (amount)
          formData.append(`cheques[${index}][amount]`, amount.toString());
        if (memo) formData.append(`cheques[${index}][memo]`, memo);
        if (categoryId)
          formData.append(`cheques[${index}][category_id]`, categoryId);
        if (checkIssueDate)
          formData.append(
            `cheques[${index}][check_issue_date]`,
            checkIssueDate
          );
        formData.append(`cheques[${index}][note]`, '');
        if (invoiceNo)
          formData.append(`cheques[${index}][invoice_no]`, invoiceNo);
        if (billIds?.length)
          formData.append(`cheques[${index}][bill_ids]`, billIds.join(','));

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
    return checkPayments.map((paymentFormGroup) => {
      const paymentSourceId = (
        paymentFormGroup.value.paymentSource as IWalletData
      )?.id;
      const payeeId = paymentFormGroup.value.payee?.encryptedId;
      const amount = this.utils.amountToNumber(paymentFormGroup.value.amount);
      const memo = paymentFormGroup.value.memo ?? undefined;
      const categoryId = paymentFormGroup.value.category?.id;
      const checkIssueDate = paymentFormGroup.value.date
        ? this.datePipe.transform(paymentFormGroup.value.date, 'yyyy-MM-dd')
        : undefined;
      const invoiceNo = paymentFormGroup.value.invoiceNumber;
      const { billIds } = paymentFormGroup.value;

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

  processPayments() {
    this.checkConditionsAndSavePayments(true);
  }

  async goToBulkPayments(savedPaymentIds: string[], savedCheckIds: string[]) {
    await this.v4BulkPaymentService.openBulkPaymentModals(
      savedPaymentIds,
      savedCheckIds,
      { paymentType: this.paymentType ?? undefined, skipBankPrefill: true }
    );
  }

  async createGroup(): Promise<IApiRes<{ groupId: string }> | boolean> {
    if (this.isAnyProcessLoadings()) return false;
    const validPaymentsFormArray = this.getValidPaymentsFormArray();

    if (validPaymentsFormArray.length > 0) {
      const confirmResult = await firstValueFrom(
        this.alertService
          .confirmAlert({
            content: `Number of valid payments: ${validPaymentsFormArray.length}. Click 'Ok' to continue`
          })
          .afterClosed()
      );
      if (!confirmResult) return false;

      const groupNameModalResult = await firstValueFrom(
        this.dialog
          .open(V4GroupNameModalComponent, {
            width: '500px',
            panelClass: 'paddingless-modal-rounded'
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
          this.paymentGroupId.set(response.data?.groupId ?? '');
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

  async updateGroup(): Promise<IApiResMesssage | boolean> {
    if (this.isAnyProcessLoadings()) return false;
    const validPaymentsFormArray = this.getValidPaymentsFormArray(true);
    if (validPaymentsFormArray.length > 0 && this.paymentGroupId()) {
      const sendingData: IGroupPaymentsCreate =
        this.createSendingBodyForSaveGroup(
          validPaymentsFormArray,
          this.groupDetails.groupName
        );
      this.loadingIndicatorFlags.isCreateOrUpdateGroupLoading = true;
      const response = await firstValueFrom(
        this.groupPaymentsService
          .updatePaymentsGroup(sendingData, this.paymentGroupId())
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

  async checkConditionsAndSavePayments(continueToProcessPayments?: boolean) {
    if (
      continueToProcessPayments &&
      this.v4BulkPaymentService.isBulkPaymentProcessing()
    ) {
      this.alertService.infoAlert({
        content:
          'A bulk payment is already processing. Please wait until it completes.'
      });
      return;
    }

    if (
      this.getValidPaymentsFormArray().find(
        (el) =>
          el.value.paymentSourceType?.sourceType === 'CARD' ||
          el.value.paymentSourceType?.sourceType === 'WALLET'
      )
    ) {
      const kycStatus =
        this.localStorageService.getItem('gettingStartedData')?.kycStatus;
      if (kycStatus === null) {
        if (environment.isV4Persona) {
          this.openVerificationRequiredModal();
        } else {
          this.router.navigateByUrl('/manage/users/verify-user-id?type=8');
        }
        return;
      }
    }

    if (this.getValidCardPaymentsFormArray().length > 0) {
      this.loadingIndicatorFlags.isLoading = true;
      this.loadingIndicatorFlags.isProcessPaymentsLoading =
        !!continueToProcessPayments;
      this.loadingIndicatorFlags.isSavePaymentsLoading =
        !continueToProcessPayments;
      const payeeIds = this.getValidCardPaymentsFormArray().map(
        (el) => el.value.payee?.id ?? ''
      );
      try {
        const bannedCheck = await firstValueFrom(
          this.paymentsService.bannedPayeeCheckForGroup(payeeIds)
        );
        if (
          bannedCheck?.success &&
          bannedCheck.is_banned_visa_bpsp_ids.length > 0
        ) {
          this.isBanned = true;
          this.showBannedMessage(bannedCheck.is_banned_visa_bpsp_ids);
          return;
        }
      } finally {
        this.loadingIndicatorFlags.isLoading = false;
        this.loadingIndicatorFlags.isProcessPaymentsLoading = false;
        this.loadingIndicatorFlags.isSavePaymentsLoading = false;
      }
    }

    if (this.isAnyProcessLoadings()) return;
    const validPaymentsFormArray = this.getValidPaymentsFormArray();

    if (this.paymentGroupId()) {
      if (!this.areSomePaymentsSelected() && !this.areAllPaymentsSelected()) {
        this.alertService.infoAlert({
          content: `Please select at least one valid payment to proceed`
        });
        return;
      }
    }

    if (!(validPaymentsFormArray?.length > 0)) {
      this.paymentsFormArray.controls.forEach((el) => el.markAsTouched());
      this.alertService.infoAlert({ content: `No valid payments found` });
      return;
    }

    if (
      continueToProcessPayments &&
      !this.hasSufficientWalletBalanceForLetVendorDecide(validPaymentsFormArray)
    ) {
      return;
    }

    let paymentMethodsAreEnabled = true;
    validPaymentsFormArray.forEach((payment) => {
      if (
        !this.paymentTypeAccessService.onInputChanges(
          (payment.value.paymentSourceType ?? '') as string,
          { disableAlert: false },
          continueToProcessPayments ?? false
        )
      ) {
        paymentMethodsAreEnabled = false;
      }
    });
    if (!paymentMethodsAreEnabled) return;

    if (this.paymentGroupId()) {
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
          this.loadingIndicatorFlags.isLoading = true;
          this.loadingIndicatorFlags.isProcessPaymentsLoading =
            !!continueToProcessPayments;
          this.loadingIndicatorFlags.isSavePaymentsLoading =
            !continueToProcessPayments;
          const updatePaymentsGroupRes = await firstValueFrom(
            this.groupPaymentsService
              .updatePaymentsGroup(sendingData, this.paymentGroupId())
              .pipe(
                finalize(() => {
                  this.loadingIndicatorFlags.isLoading = false;
                  this.loadingIndicatorFlags.isProcessPaymentsLoading = false;
                  this.loadingIndicatorFlags.isSavePaymentsLoading = false;
                })
              )
          );
          if (!updatePaymentsGroupRes.success) return;
          const updatedResources = (sendingData.payments ?? []).map(
            (payment, index) => ({
              ...payment,
              selected:
                validPaymentsFormArray[index]?.controls.selected.value ?? false
            })
          );
          this.groupDetails = {
            groupName: this.groupDetails.groupName,
            resources: updatedResources
          };
          const isCardWirePaymentIncluded = this.groupDetails.resources.filter(
            (el) => el.sourceType === 'card' || el.transferType === 'wire'
          );
          if (isCardWirePaymentIncluded.length > 0) {
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

    const totalAmount =
      this.getSelectedPaymentsTotalAmount() || this.totalAmount.toFixed(2);
    const isSavePayments = await firstValueFrom(
      this.alertService
        .confirmAlert({
          content: `Number of valid payments: ${validPaymentsFormArray.length}. Total Amount: $${totalAmount}  ${
            continueToProcessPayments
              ? 'These payments will be saved before processing.'
              : ''
          }`,
          doneMsg: `${continueToProcessPayments ? 'Process Payments' : 'Save Payments'}`
        })
        .afterClosed()
    );
    if (!isSavePayments) return;

    const sendingDataPayments: IMultiPaymentsSave =
      this.createSendingDataForMultiplePayments(validPaymentsFormArray);
    const sendingDataChecks =
      this.paymentType === 'check'
        ? this.createSendingDataForMultipleChecksPayment(validPaymentsFormArray)
        : {
            cheques: this.createSendingDataForMultipleChecksPayment(
              validPaymentsFormArray
            )
          };

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
      if (
        (this.paymentType === 'check' && sendingDataChecks) ||
        (this.paymentType !== 'check' &&
          (sendingDataChecks as { cheques: IGroupPaymentsItemCheck[] })?.cheques
            ?.length > 0)
      ) {
        saveGroupCheckPaymentsRes = await firstValueFrom(
          this.checkService.postMultipleChecks(
            sendingDataChecks,
            this.paymentType === 'check'
          )
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

    if (!(saveGroupPaymentsRes?.success || saveGroupCheckPaymentsRes?.success)) {
      this.loadingIndicatorFlags.isProcessPaymentsLoading = false;
      return;
    }

    if (continueToProcessPayments) {
      try {
        await this.goToBulkPayments(
          saveGroupPaymentsRes?.data?.ids ?? [],
          saveGroupCheckPaymentsRes?.checkIds ?? []
        );
      } finally {
        this.loadingIndicatorFlags.isProcessPaymentsLoading = false;
      }
    } else {
      this.loadingIndicatorFlags.isProcessPaymentsLoading = false;
      this.alertService.successAlert({
        content: 'Payments Saved Successfully'
      });
      this.router.navigateByUrl('/v4/manage/payments-out/detailed/all');
    }
  }

  showBannedMessage(bannedPayeeIds: string[]) {
    this.isBanned = true;
    this.getValidCardPaymentsFormArray().forEach((el) => {
      if (bannedPayeeIds.includes(el.value.payee?.id ?? '')) {
        el.controls.payee.reset();
      }
    });
    this.alertService
      .failedAlert({
        content:
          'Unfortunately we cannot support payment to this beneficiary as it violates our terms of service'
      })
      .afterClosed()
      .subscribe(() => {
        this.isBanned = false;
      });
  }

  selectRowToggle(checked: boolean) {
    this.paymentsFormArray.controls.forEach((control, index) => {
      this.manuallyInteractedForms.add(index);
      if (this.paymentGroupId()) {
        control.controls.selected.setValue(checked ? control.valid : false);
      } else {
        control.controls.selected.setValue(checked);
      }
    });
    this.calculateTotalAmount();
    this.updatePaymentFormValidityStatus();
  }

  toggleRowSelection(index: number, checked: boolean) {
    const formControl = this.paymentsFormArray.controls[index];
    this.manuallyInteractedForms.add(index);
    if (this.paymentGroupId()) {
      formControl.controls.selected.setValue(checked && formControl.valid);
    } else {
      formControl.controls.selected.setValue(checked);
    }
    this.calculateTotalAmount();
    this.updatePaymentFormValidityStatus();
  }

  getSelectedPaymentsCount(): number {
    return this.getValidPaymentsFormArray().length;
  }

  areAllPaymentsSelected(): boolean {
    return (
      this.paymentsFormArray.controls.length > 0 &&
      this.paymentsFormArray.controls.every(
        (control) => control.controls.selected.value
      )
    );
  }

  areSomePaymentsSelected(): boolean {
    const selectedCount = this.getSelectedPaymentsCount();
    return (
      selectedCount > 0 &&
      selectedCount < this.paymentsFormArray.controls.length
    );
  }

  getSelectedPaymentsTotalAmount(): number {
    return this.paymentsFormArray.controls
      .filter((control) => control.controls.selected.value)
      .reduce((total, control) => {
        const amount = this.utils.amountToNumber(control.controls.amount.value);
        return total + (amount || 0);
      }, 0);
  }

  clearManuallyInteractedForms() {
    this.manuallyInteractedForms.clear();
  }

  // ng-select handlers for Pay From (value is full object)
  onPayFromChange(selected: IPayFromItem | null, formGroup: FormGroup) {
    formGroup.get('paymentSourceType')?.setValue(selected);
    formGroup.get('paymentSource')?.reset();
    const defaultMethod = getDefaultPayAsOption(selected);
    if (defaultMethod) {
      formGroup.get('paymentMethod')?.setValue(defaultMethod);
    } else {
      formGroup.get('paymentMethod')?.reset();
    }
  }

  onBasePayFromChange(selected: IPayFromItem | null) {
    this.basePaymentForm.controls.paymentSourceType.setValue(selected);
    this.basePaymentForm.controls.paymentSource.reset();
    const defaultMethod = getDefaultPayAsOption(selected);
    if (defaultMethod) {
      this.basePaymentForm.controls.paymentMethod.setValue(defaultMethod);
    } else {
      this.basePaymentForm.controls.paymentMethod.reset();
    }
  }

  // ng-select handlers for Payment Method (value is full object)
  onPaymentMethodChange(selected: IPayAsItem | null, formGroup: FormGroup) {
    if (selected?.id === 'wire') {
      const sourceId = formGroup.get('paymentSourceType')?.value?.id;
      const checkType = sourceId === 'card' ? 'card-wire-transfer' : 'wire';
      if (!this.paymentTypeAccessService.onInputChanges(checkType, { disableAlert: false }, false, true)) {
        formGroup.get('paymentMethod')?.reset();
        return;
      }
    }
    formGroup.get('paymentMethod')?.setValue(selected);
  }

  onBasePaymentMethodChange(selected: IPayAsItem | null) {
    if (selected?.id === 'wire') {
      const sourceId = this.basePaymentForm.controls.paymentSourceType.value?.id;
      const checkType = sourceId === 'card' ? 'card-wire-transfer' : 'wire';
      if (!this.paymentTypeAccessService.onInputChanges(checkType, { disableAlert: false }, false, true)) {
        this.basePaymentForm.controls.paymentMethod.reset();
        return;
      }
    }
    this.basePaymentForm.controls.paymentMethod.setValue(selected);
  }

  // Category dropdown handler (not CVA)
  onCategoryChange(event: ICategoryDropdown, formGroup: FormGroup) {
    formGroup.get('category')?.setValue(event);
  }

  onBaseCategoryChange(event: ICategoryDropdown) {
    this.basePaymentForm.controls.category.setValue(event);
  }

  // Attachment/Comment methods
  openAddAttachment() {
    const dialogRef = this.dialog.open(
      V4CheckAddAttachmentCommonModalComponent,
      {
        maxWidth: '600px',
        width: '93%',
        data: {
          mode: 'group_payments',
          existingData: this.createdExistingAttachments
        }
      }
    );
    dialogRef.afterClosed().subscribe((res) => {
      if (res && res.existingData) {
        this.createdExistingAttachments = res.existingData;
        this.attachmentCount = res.existingData.length;
        this.paymentsFormArray.controls.forEach((_control, index) => {
          this.individualAttachments[index] = res.existingData;
        });
      }
    });
  }

  openAddAttachmentForRow(rowIndex: number) {
    const dialogRef = this.dialog.open(
      V4CheckAddAttachmentCommonModalComponent,
      {
        maxWidth: '600px',
        width: '93%',
        data: {
          mode: 'group_payments',
          existingData: this.individualAttachments[rowIndex]
        }
      }
    );
    dialogRef.afterClosed().subscribe((res) => {
      if (res && res.existingData) {
        this.individualAttachments[rowIndex] = res.existingData;
      }
    });
  }

  getAttachmentCount(rowIndex: number): number {
    return this.individualAttachments[rowIndex]?.length || 0;
  }

  getCombinedAttachments(rowIndex: number): File[] {
    return this.individualAttachments[rowIndex] || [];
  }

  openAddComment() {
    const dialogRef = this.dialog.open(V4CheckAddCommentModalComponent, {
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
        this.paymentsFormArray.controls.forEach((_control, index) => {
          this.individualComments[index] = res.existingData;
        });
      } else {
        this.createdExistingComments = [];
        this.commentsCount = 0;
        this.paymentsFormArray.controls.forEach((_control, index) => {
          this.individualComments[index] = [];
        });
      }
    });
  }

  openAddCommentForRow(rowIndex: number) {
    const dialogRef = this.dialog.open(V4CheckAddCommentModalComponent, {
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

  getCommentCount(rowIndex: number): number {
    return this.individualComments[rowIndex]?.length || 0;
  }

  getCombinedComments(rowIndex: number): string[] {
    return this.individualComments[rowIndex] || [];
  }

  getRowPaymentMethods(formGroup: FormGroup): IPayAsItem[] {
    return formGroup.get('paymentSourceType')?.value?.payOptions || [];
  }

  /**
   * Front-end guard for "Let vendor decide" wallet rows. Sums the amount of
   * every such row per wallet and compares it to that wallet's available
   * balance so an insufficient balance is caught on the Process button, before
   * the payments are saved. The API-side check stays in place as the backstop.
   */
  private hasSufficientWalletBalanceForLetVendorDecide(
    validPaymentsFormArray: FormGroup<IGroupPaymentsFormModel>[]
  ): boolean {
    const totalsByWallet = new Map<
      string,
      { wallet: IWalletData; total: number }
    >();

    validPaymentsFormArray.forEach((formGroup) => {
      const { paymentSourceType, paymentMethod, paymentSource, amount } =
        formGroup.value;
      if (
        paymentSourceType?.id !== 'wallet' ||
        paymentMethod?.id !== LET_VENDOR_DECIDE_ID ||
        !paymentSource
      ) {
        return;
      }
      const wallet = paymentSource as IWalletData;
      const key = wallet.uuId || wallet.id;
      const entry = totalsByWallet.get(key) ?? { wallet, total: 0 };
      entry.total += this.utils.amountToNumber(amount) || 0;
      totalsByWallet.set(key, entry);
    });

    for (const { wallet, total } of totalsByWallet.values()) {
      const available = this.utils.amountToNumber(wallet.availableBalance) || 0;
      if (total > available) {
        this.alertService.failedAlert({
          title: 'Failed',
          content: 'Insufficient balance on wallet'
        });
        return false;
      }
    }
    return true;
  }

  getValidPaymentMethodForSource(
    source: IPayFromItem | null | undefined,
    desiredMethod: IPayAsItem | null | undefined
  ): IPayAsItem | null {
    const options = source?.payOptions ?? [];
    if (!options.length) return null;
    return (
      options.find((opt) => opt.id === desiredMethod?.id) ??
      getDefaultPayAsOption(source)
    );
  }

  openVerificationRequiredModal() {
    this.dialog
      .open(BusinessVerificationRequiredModalComponent, {
        width: '400px',
        disableClose: true,
        panelClass: 'paddingless-modal-rounded',
        data: { noNavigation: true }
      })
      .afterClosed()
      .pipe(take(1))
      .subscribe((result) => {
        if (result) {
          this.personaHelperService
            .openModal('kyc', CVSourceType.credit_card, true)
            .subscribe();
        }
      });
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

  @HostListener('window:resize')
  onWindowResize(): void {
    this.closeAllDropdowns();
  }

  async editGroupName() {
    const groupNameModalResult = await firstValueFrom(
      this.dialog
        .open(V4GroupNameModalComponent, {
          width: '500px',
          panelClass: 'paddingless-modal-rounded',
          disableClose: true,
          data: {
            groupName: this.groupName()
          }
        })
        .afterClosed()
    );
    if (groupNameModalResult?.groupName && this.paymentGroupId()) {
      this.store.dispatch(
        groupPaymentsActions.groupPaymentsUpdateName({
          groupName: groupNameModalResult?.groupName
        })
      );
    }
  }

  isBankCheckPayment(formGroup: FormGroup<IGroupPaymentsFormModel>): boolean {
    return (
      formGroup.controls.paymentSourceType.value?.id === 'bankaccount' &&
      formGroup.controls.paymentMethod.value?.id === 'check'
    );
  }

  closeAllDropdowns(): void {
    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    this.formValidationChangeSubscriptions.forEach((sub) => sub?.unsubscribe());
    this.amountChangeSubscription?.unsubscribe();
  }
}

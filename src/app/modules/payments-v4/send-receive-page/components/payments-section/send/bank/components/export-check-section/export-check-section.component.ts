import {
  Component,
  DestroyRef,
  OnDestroy,
  QueryList,
  ViewChildren,
  computed,
  effect,
  inject,
  signal
} from '@angular/core';
import {
  FormArray,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Observable, Subscription, of } from 'rxjs';
import { NgSelectComponent, NgSelectModule } from '@ng-select/ng-select';
import { NgxMaskDirective } from 'ngx-mask';
import {
  ArrowLeftRight,
  CircleHelp,
  LucideAngularModule,
  Plus,
  PlusCircle,
  Trash2
} from 'lucide-angular';
import { MatTooltip } from '@angular/material/tooltip';

import { EllipsisActiveDirective } from 'src/app/directive/ellipsis-active.directive';

import { Utils } from 'src/app/data/utils';
import type { ICheckDetailsData } from 'src/app/modules/check/model/check';
import type {
  IClass,
  IConnectedCompanyList,
  ICustomer,
  IExpense,
  ILocation,
  IQboDetails
} from 'src/app/modules/integration/model/integration';
import type {
  INetSuiteClass,
  INetSuiteExportsData
} from 'src/app/modules/integration/netsuite/model/netsuite';
import type {
  ICheckPaymentsForm,
  IFreshBookExportsData,
  IPaymentConfig,
  IPaymentExportsOptions,
  IQBDExportsData,
  IQBDExportsFormBody,
  IQBOExportsData,
  IQBOExportsFormBody
} from 'src/app/modules/payments/model/payments';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import type { DoubleSideModalRef } from 'src/app/shared/modal/custom-double-side-modal/custom-double-side-modal-ref';
import { DOUBLE_SIDE_MODAL_REF } from 'src/app/shared/modal/custom-double-side-modal/custom-double-side-modal.tokens';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { NetsuiteIntegrationService } from 'src/app/shared/service/integration/netsuite.service';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { SpSelectDropdownComponent } from '../../../dropdowns/sp-select-dropdown/sp-select-dropdown.component';
import { SendStateService } from '../../../shared/services/send-state.service';
import { BankCheckService } from '../../services/bank-check.service';
import { BankPaymentService } from '../../services/bank-payment.service';
import { ExportCheckService } from '../../services/export-check.service';

interface INameIdModel {
  name: string;
  id: string;
}

interface IQBOExportsForm {
  qboCategory: FormControl<INameIdModel | null>;
  gboDescription: FormControl<string | undefined>;
  gboCustomer: FormControl<INameIdModel | null>;
  qboClass: FormControl<INameIdModel | null>;
  qboAmount: FormControl<string | undefined>;
}

interface IQBDExportsForm {
  expense: FormControl<INameIdModel | null>;
  description: FormControl<string | undefined>;
  customer: FormControl<INameIdModel | null>;
  class: FormControl<INameIdModel | null>;
  amount: FormControl<string | undefined>;
}

interface INetSuiteExportsForm {
  expense: FormControl<INameIdModel | null>;
  description: FormControl<string | undefined>;
  customer: FormControl<INameIdModel | null>;
  class: FormControl<INameIdModel | null>;
  location: FormControl<INameIdModel | null>;
  amount: FormControl<string | undefined>;
}

interface IFreshBooksExportsForm {
  fbCategory: FormControl<INameIdModel | null>;
  description: FormControl<string | undefined>;
  amount: FormControl<string | undefined>;
}

/**
 * The panel's old `@Input()`s. `syncPanelInputs` diffs them, so an input that did
 * not move is *absent* as in `SimpleChanges` — several branches turn on that.
 */
interface IPanelInputChanges {
  paymentFormValue?: {
    currentValue: ICheckPaymentsForm;
    previousValue?: ICheckPaymentsForm | null;
  };
  checkDetails?: { currentValue: ICheckDetailsData | undefined };
  paymentConfig?: { currentValue: IPaymentConfig };
  exportOptions?: { currentValue: IPaymentExportsOptions };
  hasQboExportData?: { currentValue: boolean };
}

/** The accounting platforms the panel offers, in their default tab order. */
const EXPORT_APPS = [
  { id: 'qbo', name: 'QB Online', connected: false },
  { id: 'qbd', name: 'QB Desktop', connected: false },
  { id: 'netsuite', name: 'NetSuite', connected: false },
  { id: 'freshbooks', name: 'FreshBooks', connected: false }
];

const WIYGUL_PLUGIN = 'enterprise-wiygul';

/** The API refuses a check whose exported line items do not total inside this range. */
const MAX_EXPORT_TOTAL = 100000000;

/**
 * Export Check — pushes this payment into QuickBooks, NetSuite or FreshBooks as an
 * expense. Renders only for a bank source with at least one platform connected.
 */
/** The four panels, by the id `activeTab` holds. */
type ExportTab = 'qbo' | 'qbd' | 'netsuite' | 'freshbooks';

/**
 * Where a refusal belongs. `amount` and `category` are columns of a line item;
 * the rest are the panel's own fields and carry no row.
 */
type ExportColumn = 'amount' | 'category' | 'bank' | 'company' | 'total';

interface IExportRefusal {
  tab: ExportTab;
  /** The line item, or null when the refusal is the panel's. */
  row: number | null;
  column: ExportColumn;
  message: string;
}

@Component({
  selector: 'app-export-check-section',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    NgSelectModule,
    NgxMaskDirective,
    LucideAngularModule,
    CommonButtonV4Component,
    SpSelectDropdownComponent,
    CommonInputFieldV4Component,
    MatTooltip,
    EllipsisActiveDirective
  ],
  templateUrl: './export-check-section.component.html',
  styleUrl: './export-check-section.component.scss'
})
export class ExportCheckSectionComponent implements OnDestroy {
  // ── Dependencies ──
  private readonly destroyRef = inject(DestroyRef);
  private readonly sendStateService = inject(SendStateService);
  private readonly exportCheckService = inject(ExportCheckService);
  private readonly bankCheckService = inject(BankCheckService);
  private readonly bankPaymentService = inject(BankPaymentService);

  private readonly checkService = inject(CheckService);
  private readonly netsuiteIntegrationService = inject(NetsuiteIntegrationService);
  private readonly dynamicWhiteLabelService = inject(DynamicWhiteLabelService);
  private readonly paymentsService = inject(PaymentsService);
  private readonly headerService = inject(HeaderService);
  private readonly integrationService = inject(IntegrationService);
  private readonly router = inject(Router);
  private readonly modalRef = inject<DoubleSideModalRef>(DOUBLE_SIDE_MODAL_REF, {
    optional: true
  });

  @ViewChildren(NgSelectComponent) private ngSelects: QueryList<NgSelectComponent>;

  // ── Signals ──

  /** The payment as the panel reads it — it prefills the first line from this. */
  readonly paymentFormValue = signal<ICheckPaymentsForm | null>(null);

  readonly disableExportCheck = signal(false);

  readonly netSuiteExpense = signal<INetSuiteClass[]>([]);

  // ── Computed ──

  /**
   * On EDIT, what the `initUpdate*` paths restore the exported line items from;
   * `paymentDetails` is `initUpdateNetSuite`'s fallback (quickbooks-export-check).
   */
  readonly paymentConfig = computed<IPaymentConfig>(() => ({
    mode: this.sendStateService.mode(),
    paymentDetails: this.sendStateService.editedPayment() ?? undefined
  }));

  /** ACH exports to NetSuite alone, and the panel hides its other tabs on it. */
  readonly isBankAch = computed(() => this.sendStateService.methodId() === 'ach');

  // ── Forms ──
  //
  // Typed by their row, so the template can bind each row's own group. They are
  // arrays, and were bound with the `formGroup` directive with rows addressed by
  // index name underneath — which resolves, but leaves the binding depending on
  // the index agreeing with the array, and it does not have to.

  qboExportsForm = new FormArray<FormGroup<IQBOExportsForm>>([
    new FormGroup<IQBOExportsForm>({
      qboAmount: new FormControl(),
      qboCategory: new FormControl(),
      qboClass: new FormControl(),
      gboCustomer: new FormControl(),
      gboDescription: new FormControl()
    })
  ]);

  qbdExportsForm = new FormArray<FormGroup<IQBDExportsForm>>([
    new FormGroup<IQBDExportsForm>({
      amount: new FormControl(),
      expense: new FormControl(),
      class: new FormControl(),
      customer: new FormControl(),
      description: new FormControl()
    })
  ]);

  netsuiteExportsForm = new FormArray<FormGroup<INetSuiteExportsForm>>([
    new FormGroup<INetSuiteExportsForm>({
      amount: new FormControl(),
      expense: new FormControl(),
      class: new FormControl(),
      customer: new FormControl(),
      location: new FormControl(),
      description: new FormControl()
    })
  ]);

  freshbooksExportsForm = new FormArray<FormGroup<IFreshBooksExportsForm>>([
    new FormGroup<IFreshBooksExportsForm>({
      amount: new FormControl(),
      fbCategory: new FormControl<INameIdModel | null>(null),
      description: new FormControl()
    })
  ]);

  // ── Template constants ──
  readonly ArrowLeftRightIcon = ArrowLeftRight;
  readonly PlusCircleIcon = PlusCircle;
  readonly PlusIcon = Plus;
  readonly InfoIcon = CircleHelp;
  readonly Trash2Icon = Trash2;
  readonly utils = Utils;

  // ── Panel state ──
  exportApps = [...EXPORT_APPS];
  activeTab: string;
  isEnableExport = false;
  isWiygulEnterPrise = false;

  // QuickBooks Online
  QBCompanyName: string;
  QBBankAccountName: string;
  QBCategoryItem: INameIdModel[] = [];
  QBClassItem: INameIdModel[] = [];
  QBCustomerItem: INameIdModel[] = [];
  realmId: number;
  qbBankId: string;
  types = ['category-items', 'customers', 'classes'];
  QBOTotal: number;
  categoryPage = 2;
  customerPage = 2;
  classPage = 2;
  qboInformation: IQboDetails;
  /**
   * Why the last export save was refused — and, as importantly, whose refusal
   * it is. One message for four platforms meant a FreshBooks complaint appeared
   * on the QuickBooks and NetSuite tabs too, and one message per row put it
   * under the row rather than under the field it is about.
   */
  readonly exportError = signal<IExportRefusal | null>(null);

  /** The message for one cell, or null when the refusal is not about it. */
  fieldError(tab: ExportTab, row: number, column: ExportColumn): string | null {
    const refusal = this.exportError();
    return refusal &&
      refusal.tab === tab &&
      refusal.row === row &&
      refusal.column === column
      ? refusal.message
      : null;
  }

  /**
   * A refusal that belongs to the panel rather than to a line item — the bank,
   * the company, the total — and only while its own tab is the one on screen.
   */
  panelMessage(): string | null {
    const refusal = this.exportError();
    return refusal && refusal.row === null && refusal.tab === this.activeTab
      ? refusal.message
      : null;
  }

  isQBOSaved: boolean;
  isLocation: boolean = false;
  qbLocations: ILocation[] = [];
  selectedLocationId: string | null;

  // QuickBooks Desktop
  QBDCompanyId: string;
  QBDCompanyName: string;
  QBDBankAccountName: string;
  QBDBankId: string;
  QBDExpenseItem: IExpense[];
  QBDCustomersItem: ICustomer[];
  QBDClassItem: IClass[];
  qbdCustomerPage: number;
  qbdExpensePage: number;
  qbdClassPage: number;
  QBDTotal: number;
  isQBDSaved: boolean;

  // NetSuite
  netSuiteBankName: string;
  netSuiteBankId: string;
  netSuiteLocationId: string;
  netSuiteClass: INetSuiteClass[];
  netSuitePayee: INetSuiteClass[];
  netSuiteLocations: INetSuiteClass[] = [];
  netSuiteTotal: number;
  isNetSuiteSaved: boolean;
  netSuiteClassPage = 2;
  netSuitePayeePage = 2;
  netSuiteExpensePage = 2;

  // FreshBooks
  FBCompanies: (IConnectedCompanyList & { companyLabel?: string })[] = [];
  FBCategoryItem: INameIdModel[] = [];
  FreshBooksCompanyName: string;
  FreshBooksCompanyId: string;
  FreshBooksTotal: number = 0;
  isFreshBooksSaved: boolean = false;

  subscriptions: Subscription[] = [];

  private readonly clickAction$ = toObservable(
    this.paymentsService.onClickSaveButton
  );

  private readonly autoSave$ = toObservable(
    this.paymentsService.autoSaveNetSuiteDetails
  );

  private readonly autoSaveFreshBooks$ = toObservable(
    this.paymentsService.autoSaveFreshBooksDetails
  );

  /** The panel's `ngOnInit` has run. It ran once, when the payment first landed. */
  private panelInitialised = false;

  /** `activeTab` is chosen once, off the first real answer. See `applyInputChanges`. */
  private hasSortedApps = false;

  private hasCheckedLocation = false;

  private bankAcId: string | undefined;

  /** The values `applyInputChanges` was last given, to diff the next round against. */
  private previousInputs: {
    paymentFormValue?: ICheckPaymentsForm | null;
    checkDetails?: ICheckDetailsData | undefined;
    paymentConfig?: IPaymentConfig;
    exportOptions?: IPaymentExportsOptions;
    hasQboExportData?: boolean;
  } = {};

  constructor() {
    // The submit reaches the panel through the service — see `saveLineItems`.
    this.exportCheckService.registerPanel(this);
    this.destroyRef.onDestroy(() => this.exportCheckService.clearPanel(this));

    effect(
      () => {
        if (this.isBankAch()) {
          this.exportApps = this.exportApps.filter((app) => app.id === 'netsuite');
          this.activeTab = 'netsuite';
        } else {
          this.exportApps = [...EXPORT_APPS];
        }
      },
      { allowSignalWrites: true }
    );

    // The panel prefills its first line item from the payment, so it has to see
    // the amount, the category and the account as the user changes them.
    effect(
      () => {
        this.sendStateService.payeeDetails();
        this.sendStateService.payeeCategory();
        this.paymentFormValue.set(this.buildFormValue());
      },
      { allowSignalWrites: true }
    );

    this.sendStateService.coreForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.paymentFormValue.set(this.buildFormValue()));

    // Both rails that can export keep their own details form, and the category
    // the panel prefills from lives on whichever one is active.
    this.bankCheckService.detailsForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.paymentFormValue.set(this.buildFormValue()));

    this.bankPaymentService.detailsForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.paymentFormValue.set(this.buildFormValue()));

    // Declared last so it runs after the payment is in place: it stands in for the
    // panel's `ngOnChanges` + `ngOnInit`, in the order Angular ran them.
    effect(() => this.syncPanelInputs(), { allowSignalWrites: true });
  }

  // -------------------------------------------------------------------------
  // Bindings the panel used to receive as inputs
  // -------------------------------------------------------------------------

  /**
   * Which platforms are connected. Read straight off the service the wrapper used
   * to bind from, so the panel code below is unchanged.
   */
  get exportOptions(): IPaymentExportsOptions {
    return this.exportCheckService.options();
  }

  /** The check record on EDIT — the wrapper's `[checkDetails]` binding. */
  private get checkDetails(): ICheckDetailsData {
    return this.bankCheckService.checkDetails() as ICheckDetailsData;
  }

  /** Whether QBO export data may still be attached — the wrapper's binding. */
  private get hasQboExportData(): boolean {
    return this.exportCheckService.hasQboExportData();
  }

  /**
   * Drive the panel off the signals the wrapper used to bind from. Nothing runs on
   * a null payment: the panel did not exist until one landed, and init fires once.
   */
  private syncPanelInputs(): void {
    const paymentFormValue = this.paymentFormValue();
    const checkDetails = this.bankCheckService.checkDetails();
    const paymentConfig = this.paymentConfig();
    const exportOptions = this.exportCheckService.options();
    const hasQboExportData = this.exportCheckService.hasQboExportData();

    if (!paymentFormValue) {
      return;
    }

    const previous = this.previousInputs;
    const changes: IPanelInputChanges = {};

    if (!Object.is(previous.paymentFormValue, paymentFormValue)) {
      changes.paymentFormValue = {
        currentValue: paymentFormValue,
        previousValue: previous.paymentFormValue
      };
    }
    if (!Object.is(previous.checkDetails, checkDetails)) {
      changes.checkDetails = { currentValue: checkDetails };
    }
    if (!Object.is(previous.paymentConfig, paymentConfig)) {
      changes.paymentConfig = { currentValue: paymentConfig };
    }
    if (!Object.is(previous.exportOptions, exportOptions)) {
      changes.exportOptions = { currentValue: exportOptions };
    }
    if (!Object.is(previous.hasQboExportData, hasQboExportData)) {
      changes.hasQboExportData = { currentValue: hasQboExportData };
    }

    this.previousInputs = {
      paymentFormValue,
      checkDetails,
      paymentConfig,
      exportOptions,
      hasQboExportData
    };

    // Angular reports every bound input on the first round, and calls
    // `ngOnChanges` before `ngOnInit` — both are preserved here.
    if (Object.keys(changes).length > 0) {
      this.applyInputChanges(changes);
    }

    if (!this.panelInitialised) {
      this.panelInitialised = true;
      this.initPanel();
    }
  }

  /** The panel's `ngOnInit`. */
  private initPanel(): void {
    this.initForm();
    this.sortApps();
    this.onSaveCheck();
    this.checkEnabledPlugins();
    this.checkAutoSave();
    this.checkAutoSaveFreshBooks();
    this.getFBCompanies();
    this.resetSavedStateOnEdit();
    document.addEventListener('scroll', this.closeDropdownsOnScroll, true);
  }

  /** The panel's `ngOnChanges`. */
  private applyInputChanges(changes: IPanelInputChanges): void {
    // Sort the tabs once the capability calls answer, and only once: re-sorting would
    // move `activeTab` off the app the user is filling in (quickbooks-export-check L337-339).
    if (
      changes?.exportOptions &&
      !this.hasSortedApps &&
      this.exportCheckService.hasAnyPlatform()
    ) {
      this.hasSortedApps = true;
      this.sortApps();
    }

    let bankAccountChanged = false;

    if (changes?.paymentFormValue?.currentValue?.bankAc?.id) {
      if (this.paymentFormValue()?.bankAc?.id !== this.bankAcId) {
        bankAccountChanged = true;
        this.bankAcId = changes?.paymentFormValue?.currentValue?.bankAc?.id;
        this.reset();
        if (this.exportOptions.isQBOPushBack && this.bankAcId) {
          this.getCompany(this.bankAcId);
        }
        if (this.exportOptions.isQBDPushBack && this.bankAcId) {
          this.getQBDCompany(this.bankAcId);
        }
        if (this.exportOptions.isNetsuitePushBack && this.bankAcId) {
          this.getNetSuiteBank(this.bankAcId);
        }
        if (this.exportOptions.isFreshBooksPushBack && this.bankAcId) {
          this.getFBCompanies();
        }
      }
    } else {
      this.isEnableExport = false;
      this.bankAcId = undefined;
      this.netsuiteExportsForm.reset();
    }

    const payment = changes?.paymentFormValue;

    if (
      payment?.currentValue?.amount &&
      (bankAccountChanged ||
        payment.currentValue.amount !== payment.previousValue?.amount)
    ) {
      this.autoUpdateQBAmount();
      this.autoUpdateQBDAmount();
      this.autoUpdateNetsuiteAmount();
      this.autoUpdateFreshBooksAmount();
    }

    if (
      payment?.currentValue?.category &&
      payment.currentValue.category.id !== payment.previousValue?.category?.id
    ) {
      if (this.activeTab === 'netsuite') {
        this.autoUpdateNetsuiteCategory();
      } else {
        this.autoUpdateQBCategory();
      }
    }

    // EDIT alone. A clone does not inherit the original's exported line items
    // (quickbooks-export-check L344, L354, L364, L376).
    const isEdit = this.paymentConfig().mode === 'EDIT';

    if (
      (changes?.checkDetails?.currentValue?.expenseDetails?.length ?? 0) > 0 &&
      isEdit &&
      this.exportOptions.isQBDPushBack &&
      this.hasQboExportData
    ) {
      this.isEnableExport = true;
      this.initUpdateQBD();
    }

    if (
      (changes?.checkDetails?.currentValue?.categoryDetails?.length ?? 0) > 0 &&
      isEdit &&
      this.exportOptions.isQBOPushBack &&
      this.hasQboExportData
    ) {
      this.isEnableExport = true;
      this.initUpdateQBO();
    }

    if (
      ((changes?.checkDetails?.currentValue?.netsuiteDetails?.length ?? 0) > 0 ||
        (changes?.paymentConfig?.currentValue?.paymentDetails?.netsuiteDetails
          ?.length ?? 0) > 0) &&
      isEdit &&
      this.exportOptions.isNetsuitePushBack
    ) {
      this.isEnableExport = true;
      this.onEnabledChange(true);
      this.initUpdateNetSuite();
      this.activeTab = 'netsuite';
    }

    if (
      (changes?.checkDetails?.currentValue?.freshbookExpenseDetails?.length ??
        0) > 0 &&
      isEdit &&
      this.exportOptions.isFreshBooksPushBack &&
      this.hasQboExportData
    ) {
      this.isEnableExport = true;
      this.initUpdateFreshBooks();
    }

    if (this.activeTab !== 'netsuite') {
      this.isLocationEnabled();
    }

    if (isEdit && this.hasQboExportData) {
      this.disableExportCheck.set(true);
    }
  }

  // -------------------------------------------------------------------------
  // Setup
  // -------------------------------------------------------------------------

  private initForm(): void {
    // A clone is a new payment: blank rows, no restored line items
    // (quickbooks-export-check L441-462 gates on `mode !== 'EDIT'` alone).
    const isEdit = this.paymentConfig().mode === 'EDIT';
    // Two rows in all cases: each FormArray already starts with one, so this
    // adds a single blank line beneath it.
    for (let i = 0; i < 1; i += 1) {
      if (this.checkDetails?.categoryDetails?.length === 0 || !isEdit) {
        this.addNewRowQBO();
      }
      if (this.checkDetails?.expenseDetails?.length === 0 || !isEdit) {
        this.addNewRowQBD();
      }
      if (this.checkDetails?.netsuiteDetails?.length === 0 || !isEdit) {
        this.addNewRowNetSuite();
      }
    }
  }

  private resetSavedStateOnEdit(): void {
    this.subscriptions.push(
      this.qboExportsForm.valueChanges.subscribe(() => {
        this.isQBOSaved = false;
        this.clearExportError();
        this.updateCategoryTotal();
        this.syncTotalToAmount('qbo', this.QBOTotal);
      }),
      this.qbdExportsForm.valueChanges.subscribe(() => {
        this.isQBDSaved = false;
        this.clearExportError();
        this.updateExpenseTotal();
        this.syncTotalToAmount('qbd', this.QBDTotal);
      }),
      this.netsuiteExportsForm.valueChanges.subscribe(() => {
        this.isNetSuiteSaved = false;
        this.clearExportError();
        this.updateNetSuiteExpenseTotal();
        this.syncTotalToAmount('netsuite', this.netSuiteTotal);
      }),
      this.freshbooksExportsForm.valueChanges.subscribe(() => {
        this.isFreshBooksSaved = false;
        this.clearExportError();
        this.updateFreshBooksTotal();
        this.syncTotalToAmount('freshbooks', this.FreshBooksTotal);
      })
    );
  }

  /**
   * The line amounts and the amount being sent are the same number, so typing in
   * a row moves the hero field the way the hero field already seeds row one.
   * Only the tab on screen may drive it, and only once the export is on.
   */
  private syncTotalToAmount(tab: string, total: number): void {
    if (!this.isEnableExport || this.activeTab !== tab) {
      return;
    }
    if (!Number.isFinite(total) || total <= 0) {
      return;
    }
    const { amount } = this.sendStateService.coreForm.controls;
    if (Number(amount.value) === total) {
      return;
    }
    amount.setValue(String(total));
  }

  private onSaveCheck(): void {
    this.subscriptions.push(
      this.clickAction$.subscribe((res) => {
        if (res) {
          this.QBOSaveClicked();
        }
      })
    );
  }

  private checkEnabledPlugins(): void {
    this.subscriptions.push(
      // eslint-disable-next-line no-underscore-dangle
      this.headerService._headerData.subscribe((res) => {
        if (res && res.enabledPlugins.includes(WIYGUL_PLUGIN)) {
          this.isWiygulEnterPrise = true;
        }
      })
    );
  }

  private checkAutoSave(): void {
    if (!this.isWiygulEnterPrise && !this.isBankAch()) {
      return;
    }
    this.subscriptions.push(
      this.autoSave$.subscribe((res) => {
        if (res) {
          this.updateNetSuiteExpenseTotal();
          this.saveNetSuite(true);
        }
      })
    );
  }

  private checkAutoSaveFreshBooks(): void {
    if (!this.isWiygulEnterPrise) {
      return;
    }
    this.subscriptions.push(
      this.autoSaveFreshBooks$.subscribe((res) => {
        if (res) {
          this.updateFreshBooksTotal();
          this.saveFreshBooks();
        }
      })
    );
  }

  sortApps(): void {
    this.exportApps = this.exportApps.map((app) => {
      const appCopy = { ...app };
      switch (appCopy.id) {
        case 'qbo':
          appCopy.connected = this.exportOptions.isQBOPushBack;
          break;
        case 'qbd':
          appCopy.connected = this.exportOptions.isQBDPushBack;
          break;
        case 'netsuite':
          appCopy.connected = this.exportOptions.isNetsuitePushBack;
          break;
        case 'freshbooks':
          appCopy.connected = this.exportOptions.isFreshBooksPushBack;
          break;
        default:
          break;
      }
      return appCopy;
    });

    this.exportApps.sort((a, b) => {
      if (a.connected && !b.connected) return -1;
      if (!a.connected && b.connected) return 1;
      return 0;
    });
    this.activeTab = this.exportApps[0].id;
  }

  // -------------------------------------------------------------------------
  // Restoring an edited payment's line items
  // -------------------------------------------------------------------------

  initUpdateQBO(): void {
    this.qboExportsForm.clear();
    this.checkDetails.categoryDetails.forEach((ele, i) => {
      this.addNewRowQBO();
      this.qboExportsForm.at(i).setValue({
        qboAmount: ele.amount ?? '',
        qboCategory: ele.categoryId
          ? { id: ele.categoryId, name: ele.categoryName }
          : null,
        qboClass: ele.classId ? { id: ele.classId, name: ele.className } : null,
        gboCustomer: ele.customerId
          ? { id: ele.customerId, name: ele.customerName }
          : null,
        gboDescription: ele.description ?? ''
      });
    });
  }

  initUpdateQBD(): void {
    this.qbdExportsForm.clear();
    this.checkDetails.expenseDetails.forEach((ele, i) => {
      this.addNewRowQBD();
      this.qbdExportsForm.at(i).setValue({
        amount: ele.amount ?? '',
        class: ele.classId ? { id: ele.classId, name: ele.className } : null,
        customer: ele.customerId
          ? { id: ele.customerId, name: ele.customerName }
          : null,
        description: ele.description ?? '',
        expense: ele.expenseId
          ? { id: ele.expenseId, name: ele.expenseName }
          : null
      });
    });
  }

  initUpdateNetSuite(): void {
    this.netsuiteExportsForm?.clear();
    const netsuiteDetails =
      this.checkDetails?.netsuiteDetails?.length > 0
        ? this.checkDetails?.netsuiteDetails
        : this.paymentConfig()?.paymentDetails?.netsuiteDetails || [];
    netsuiteDetails.forEach((ele, i) => {
      this.addNewRowNetSuite();
      this.netsuiteExportsForm?.at(i)?.setValue({
        amount: ele.amount ?? '',
        class: ele.classId ? { id: ele.classId, name: ele.className } : null,
        customer: ele.customerId
          ? { id: ele.customerId, name: ele.customerName }
          : null,
        location: ele.locationId
          ? { id: ele.locationId, name: ele.locationName }
          : null,
        description: ele.description ?? '',
        expense: ele.expenseId
          ? { id: ele.expenseId, name: ele.expenseName }
          : null
      });
    });
  }

  initUpdateFreshBooks(): void {
    this.freshbooksExportsForm.clear();
    if (this.checkDetails.freshbookExpenseDetails.length > 0) {
      const ele = this.checkDetails.freshbookExpenseDetails[0];
      const category = this.FBCategoryItem.find(
        (item) => item.id === ele.categoryId
      );
      this.freshbooksExportsForm.at(0).setValue({
        amount: ele.amount ?? '',
        fbCategory: ele.categoryId
          ? { id: ele.categoryId, name: category?.name ?? '' }
          : null,
        description: ele.description ?? ''
      });
      const company = this.checkDetails.freshbookCompany;
      if (company?.companyId) {
        this.FreshBooksCompanyId = company.companyId;
        this.FreshBooksCompanyName = this.freshBooksCompanyLabel(
          company.companyId
        );
      }
      this.isFreshBooksSaved = true;
    }
  }

  // -------------------------------------------------------------------------
  // Prefilling the first line from the payment
  // -------------------------------------------------------------------------

  /**
   * The first line follows the payment's amount until the user types one of
   * their own. Each of these asked the wrong line whether that had happened —
   * the *second* row's emptiness stood in for "untouched", so a first line that
   * had been filled in and a second line that had been skipped meant every
   * later change to the payment amount overwrote what the user had typed.
   * The line being prefilled is the one to ask.
   */
  autoUpdateQBAmount(): void {
    if (!this.qboExportsForm.controls[0]?.get('qboAmount')?.value) {
      this.qboExportsForm.controls[0]
        .get('qboAmount')
        ?.setValue(this.paymentFormValue()?.amount, { emitEvent: false });
    }
  }

  autoUpdateQBDAmount(): void {
    if (!this.qbdExportsForm.controls[0]?.get('amount')?.value) {
      this.qbdExportsForm.controls[0]
        .get('amount')
        ?.setValue(this.paymentFormValue()?.amount, { emitEvent: false });
    }
  }

  autoUpdateNetsuiteAmount(): void {
    if (!this.netsuiteExportsForm.controls[0]?.get('amount')?.value) {
      this.netsuiteExportsForm.controls[0]
        .get('amount')
        ?.setValue(this.paymentFormValue()?.amount, { emitEvent: false });
    }
    if (
      this.netsuiteExportsForm.controls[0]?.get('expense')?.value &&
      this.netsuiteExportsForm.controls[0].get('amount')?.value
    ) {
      this.isEnableExport = true;
      if (!this.isNetSuiteSaved) {
        this.onEnabledChange(true);
      }
    }
  }

  autoUpdateFreshBooksAmount(): void {
    if (this.freshbooksExportsForm.controls.length > 0) {
      const currentAmount =
        this.freshbooksExportsForm.controls[0].get('amount')?.value;
      if (!currentAmount || currentAmount === '') {
        this.freshbooksExportsForm.controls[0]
          .get('amount')
          ?.setValue(this.paymentFormValue()?.amount, { emitEvent: false });
        this.updateFreshBooksTotal();
      }
    }
  }

  autoUpdateQBCategory(): void {
    const category = this.paymentFormValue()?.category;
    if (!this.realmId || !category) {
      return;
    }
    this.subscriptions.push(
      this.checkService
        .getQbCategory(this.realmId.toString(), category.id)
        .subscribe((res) => {
          if (res.success && res.data) {
            const qbCategory = res.data;
            const existing = this.QBCategoryItem.find(
              (item) => item.id === qbCategory.id
            );
            if (!existing) {
              this.QBCategoryItem.push(qbCategory);
            }
            this.qboExportsForm.controls[0]
              .get('qboCategory')
              ?.patchValue(existing ?? qbCategory, { emitEvent: false });
          } else {
            this.qboExportsForm.controls[0]
              .get('qboCategory')
              ?.patchValue(null, { emitEvent: false });
          }
        })
    );
  }

  autoUpdateNetsuiteCategory(): void {
    const paymentCategory = this.paymentFormValue()?.category;
    if (
      this.checkDetails?.netsuiteDetails?.length > 1 ||
      !this.bankAcId ||
      !paymentCategory
    ) {
      return;
    }
    this.subscriptions.push(
      this.checkService
        .getNetsuiteExpense(paymentCategory.id as string)
        .subscribe((res) => {
          if (res.success && res.data) {
            const category = res.data;
            const categoryExists = this.netSuiteExpense().find(
              (existingCategory) => existingCategory?.id === category.id
            );
            if (!categoryExists) {
              this.netSuiteExpense.update((current) => [...current, category]);
              this.netsuiteExportsForm.controls[0]
                .get('expense')
                ?.patchValue(category, { emitEvent: false });
            } else {
              this.netsuiteExportsForm.controls[0]
                .get('expense')
                ?.patchValue(categoryExists, { emitEvent: false });
            }
            if (
              this.netsuiteExportsForm.controls[0]?.get('expense')?.value &&
              this.netsuiteExportsForm.controls[0].get('amount')?.value
            ) {
              this.isEnableExport = true;
              if (!this.isNetSuiteSaved) {
                this.onEnabledChange(true);
              }
            }
          }
        })
    );
  }

  // -------------------------------------------------------------------------
  // Rows
  // -------------------------------------------------------------------------

  addNewRowQBO(): void {
    this.qboExportsForm.push(
      new FormGroup<IQBOExportsForm>({
        qboAmount: new FormControl(),
        qboCategory: new FormControl(),
        qboClass: new FormControl(),
        gboCustomer: new FormControl(),
        gboDescription: new FormControl()
      })
    );
  }

  addNewRowQBD(): void {
    this.qbdExportsForm.push(
      new FormGroup<IQBDExportsForm>({
        amount: new FormControl(),
        expense: new FormControl(),
        class: new FormControl(),
        customer: new FormControl(),
        description: new FormControl()
      })
    );
  }

  addNewRowNetSuite(): void {
    this.netsuiteExportsForm.push(
      new FormGroup<INetSuiteExportsForm>({
        amount: new FormControl(),
        expense: new FormControl(),
        class: new FormControl(),
        customer: new FormControl(),
        location: new FormControl(),
        description: new FormControl()
      })
    );
  }

  removeSelectedRowQBO(i: number): void {
    if (this.qboExportsForm.controls.length > 1) {
      this.qboExportsForm.removeAt(i);
    } else {
      this.qboExportsForm.reset();
    }
  }

  removeSelectedRowQBD(i: number): void {
    if (this.qbdExportsForm.controls.length > 1) {
      this.qbdExportsForm.removeAt(i);
    } else {
      this.qbdExportsForm.reset();
    }
  }

  removeSelectedRowNetSuite(i: number): void {
    if (this.netsuiteExportsForm.controls.length > 1) {
      this.netsuiteExportsForm.removeAt(i);
      this.autoUpdateNetsuiteAmount();
    } else {
      this.netsuiteExportsForm.reset();
    }
  }

  // -------------------------------------------------------------------------
  // Totals
  // -------------------------------------------------------------------------

  updateCategoryTotal(): void {
    this.QBOTotal = 0;
    this.qboExportsForm.value.forEach((ele) => {
      this.QBOTotal += Number(ele.qboAmount);
    });
  }

  updateExpenseTotal(): void {
    this.QBDTotal = 0;
    this.qbdExportsForm.value.forEach((ele) => {
      this.QBDTotal += Number(ele.amount);
    });
  }

  updateNetSuiteExpenseTotal(): void {
    this.netSuiteTotal = 0;
    this.netsuiteExportsForm.value.forEach((ele) => {
      this.netSuiteTotal += Number(ele.amount);
    });
  }

  updateFreshBooksTotal(): void {
    this.FreshBooksTotal = 0;
    this.freshbooksExportsForm.value.forEach((ele) => {
      this.FreshBooksTotal += Number(ele.amount);
    });
  }

  // -------------------------------------------------------------------------
  // Event handlers
  // -------------------------------------------------------------------------

  toggleTab(val: string): void {
    this.activeTab = val;
  }

  enableExport(isEnabled: boolean): void {
    this.onEnabledChange(isEnabled);
  }

  toggleExport(): void {
    if ((this.isEnableExport && this.isWiygulEnterPrise) || this.disableExportCheck()) {
      return;
    }
    this.isEnableExport = !this.isEnableExport;
    this.enableExport(this.isEnableExport);
  }

  fmt(value: number | string | null | undefined): string {
    return `$${(Number(value) || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }

  validateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const { value } = input;
    if (value.startsWith('-00')) {
      input.value = value.slice(0, -1);
    }
  }

  openExportCheckEnableInfo(): void {
    this.dynamicWhiteLabelService.goToLiveChat();
  }

  navigateToIntegration(appId: string): void {
    this.modalRef?.close(undefined);
    this.router.navigate(['/v4/manage/thirdparty_app/index'], {
      state: { openAppId: appId }
    });
  }

  private closeDropdownsOnScroll = (event: Event): void => {
    const target = event.target as HTMLElement;
    if (target?.closest?.('.ng-dropdown-panel')) {
      return;
    }
    this.ngSelects?.forEach((select) => {
      if (select.isOpen) {
        select.close();
      }
    });
  };

  // -------------------------------------------------------------------------
  // API — QuickBooks Online
  // -------------------------------------------------------------------------

  getCompany(id: string): void {
    this.subscriptions.push(
      this.checkService.getCompanies(id).subscribe((res) => {
        // The bank field is read-only here — it follows the account the payment
        // is drawn on — so a new mapping is the answer to a refusal about it.
        this.clearExportError();
        this.realmId = res.data.realmId;
        this.qbBankId = res.data.qbBankId;
        this.QBCompanyName = res.data.companyName;
        this.QBBankAccountName = res.data.qbBankName;
        this.OnItemChangeQB(res.data.realmId);
        this.qboInformation = res.data;
        if (res.data.realmId) {
          this.getLocations(res.data.realmId);
        } else {
          this.qbLocations = [];
        }
        // Auto-enable when the bank has a QB mapping *and* this payment may still be
        // exported — one already pushed cannot go again (quickbooks-export-check L802-824).
        this.isEnableExport = !!(this.qbBankId && this.hasQboExportData);
        this.onEnabledChange(this.isEnableExport);
      })
    );
  }

  OnItemChangeQB(event: string): void {
    if (!event) {
      return;
    }
    this.types.forEach((el: string) => {
      this.subscriptions.push(
        this.checkService.GetCompanyDetails(el, event).subscribe((res) => {
          if (!res.success) {
            return;
          }
          if (el === 'category-items') {
            this.QBCategoryItem = res.data;
          } else if (el === 'customers') {
            this.QBCustomerItem = res.data;
          } else {
            this.QBClassItem = res.data;
            if (this.qboInformation?.classMappingId) {
              const defaultClass = this.QBClassItem.filter(
                (item) => item.id === this.qboInformation.classMappingId
              );
              if (defaultClass) {
                this.qboExportsForm.controls[0]
                  .get('qboClass')
                  ?.setValue(defaultClass[0], { emitEvent: false });
              }
            }
          }
        })
      );
    });
  }

  isLocationEnabled(): void {
    // `applyInputChanges` runs on every payee/bank/amount change; without this guard
    // each change fired a fresh `isPushBackEnable` request and leaked a subscription.
    if (this.hasCheckedLocation) {
      return;
    }
    this.hasCheckedLocation = true;
    this.subscriptions.push(
      this.checkService.isPushBackEnable().subscribe((res) => {
        if (res.data.isLocationEnabled) {
          this.isLocation = true;
        }
      })
    );
  }

  getLocations(id: string): void {
    this.subscriptions.push(
      this.checkService.getLocations(id).subscribe((res) => {
        if (res.success) {
          this.qbLocations = res.data as ILocation[];
          if (this.qboInformation?.locationMappingId) {
            this.selectedLocationId = this.qboInformation?.locationMappingId;
          } else {
            this.selectedLocationId = res.data[0]?.id;
          }
        }
      })
    );
  }

  onScrollCompanyDetails(type: string): void {
    let page = 0;
    const searchTerm = '';
    if (type === 'customers') {
      page = this.customerPage;
    } else if (type === 'category-items') {
      page = this.categoryPage;
    } else {
      page = this.classPage;
    }
    this.subscriptions.push(
      this.checkService
        .GetCompanyDetailsPagination(type, this.realmId, page, searchTerm)
        .subscribe((res) => {
          if (res.success) {
            res.data.forEach((element: INameIdModel) => {
              if (type === 'customers') {
                this.QBCustomerItem.push(element);
              } else if (type === 'category-items') {
                this.QBCategoryItem.push(element);
              } else {
                this.QBClassItem.push(element);
              }
            });
            if (type === 'customers') {
              this.customerPage += 1;
            } else if (type === 'category-items') {
              this.categoryPage += 1;
            } else {
              this.classPage += 1;
            }
          }
        })
    );
  }

  onSearchItemsCompanyDetails(searchValue: string, type: string): void {
    this.subscriptions.push(
      this.checkService
        .GetCompanyDetailsPagination(type, this.realmId, 0, searchValue)
        .subscribe((res) => {
          if (type === 'customers') {
            this.QBCustomerItem = res.data;
          } else if (type === 'category-items') {
            this.QBCategoryItem = res.data;
          } else {
            this.QBClassItem = res.data;
          }
        })
    );
  }

  /**
   * A refused export. The alert this replaces stated the reason but left the
   * user hunting for the field; the shake points at the row and the message
   * stays on the panel rather than in a dialog over it.
   */
  private refuse(message: string, field: string, column: ExportColumn): void {
    const row = /^exportRow-(\d+)$/.exec(field);
    this.exportError.set({
      tab: this.activeTab as ExportTab,
      row: row ? Number(row[1]) : null,
      column,
      message
    });
    this.sendStateService.requestFieldFocus(field);
  }

  /**
   * A refusal answers the state the fields were in when the save ran, so the
   * first edit after it is the answer to it — leaving it up says the field is
   * still wrong while the user is looking at the value that fixed it.
   */
  clearExportError(): void {
    this.exportError.set(null);
  }

  QBOSaveClicked(): void {
    this.exportError.set(null);
    this.paymentsService.onClickSaveButton.set(false);
    this.updateCategoryTotal();
    if (this.realmId && this.qbBankId === '') {
      this.refuse('The QuickBooks Bank field is required', 'exportBank', 'bank');
      return;
    }

    for (let i = 0; i <= this.qboExportsForm.value.length; i += 1) {
      if (
        this.qboExportsForm.value[i]?.qboCategory &&
        (this.qboExportsForm.value[i]?.qboAmount == null ||
          this.qboExportsForm.value[i]?.qboAmount === '')
      ) {
        this.refuse('The amount field is required', `exportRow-${i}`, 'amount');
        return;
      }
      if (
        this.qboExportsForm.value[i]?.qboCategory == null &&
        this.qboExportsForm.value[i]?.qboAmount
      ) {
        this.refuse('The category field is required', `exportRow-${i}`, 'category');
        return;
      }
    }
    if (this.QBOTotal > MAX_EXPORT_TOTAL || this.QBOTotal <= 0) {
      this.refuse(
        'The check amount must be between 0 and 100000000.',
        'exportTotal',
        'total'
      );
      return;
    }
    this.saveQBO();
  }

  saveQBO(): void {
    if (this.QBOTotal === 0 || !this.QBOTotal) {
      this.isQBOSaved = false;
      this.onQboSave(undefined);
      this.paymentsService.onSaveQboDetails.set(undefined);
      return;
    }

    const filteredFormValue: IQBOExportsFormBody[] = this.qboExportsForm.value
      .filter(
        (ele) =>
          ele.qboAmount &&
          ele.qboAmount !== '' &&
          ele.qboCategory?.id &&
          ele.qboCategory?.id !== ''
      )
      .map((ele) => ({
        categoryId: ele.qboCategory?.id,
        description: ele.gboDescription,
        customerId: ele.gboCustomer?.id ? ele.gboCustomer?.id : null,
        classId: ele.qboClass?.id ? ele.qboClass?.id : null,
        amount: ele.qboAmount
      }));

    const savedData = {
      realmId: String(this.realmId),
      qbBankId: this.qbBankId,
      formValue: filteredFormValue,
      QBOTotal: this.QBOTotal,
      locationId: this.selectedLocationId as string,
      hasQboExportData: this.hasQboExportData
    };
    this.onQboSave(savedData);
    this.isQBOSaved = true;
    this.paymentsService.onSaveQboDetails.set(savedData);
  }

  // -------------------------------------------------------------------------
  // API — QuickBooks Desktop
  // -------------------------------------------------------------------------

  getQBDCompany(bankId: string): void {
    this.subscriptions.push(
      this.checkService.getQBDCompanies(bankId).subscribe((res) => {
        this.clearExportError();
        this.QBDCompanyId = res.data.companyId;
        this.QBDBankId = res.data.qbBankId;
        this.QBDCompanyName = res.data.companyName;
        this.QBDBankAccountName = res.data.qbBankName;
        this.QBDExpenseItem = res.data.expenses;
        this.QBDCustomersItem = res.data.customers;
        this.QBDClassItem = res.data.classes;
      })
    );
  }

  onQBDScrollCompanyDetails(type: string): void {
    let page = 0;
    const searchTerm = '';
    const companyId = this.QBDCompanyId;
    if (type === 'customers') {
      page = this.qbdCustomerPage;
    } else if (type === 'expense-items') {
      page = this.qbdExpensePage;
    } else {
      page = this.qbdClassPage;
    }
    this.subscriptions.push(
      this.checkService
        .GetQBDCompanyDetailsPagination(type, companyId, page, searchTerm)
        .subscribe((res) => {
          if (res.success) {
            res.data.forEach((element) => {
              if (type === 'customers') {
                this.QBDCustomersItem.push(element);
              } else if (type === 'expense-items') {
                this.QBDExpenseItem.push(element);
              } else {
                this.QBDClassItem.push(element);
              }
            });
            if (type === 'customers') {
              this.qbdCustomerPage += 1;
            } else if (type === 'expense-items') {
              this.qbdExpensePage += 1;
            } else {
              this.qbdClassPage += 1;
            }
          }
        })
    );
  }

  onQBDSearchItemsCompanyDetails(event: string, type: string): void {
    const companyId = this.QBDCompanyId;
    this.subscriptions.push(
      this.checkService
        .GetQBDCompanyDetailsPagination(type, companyId, 0, event)
        .subscribe((res) => {
          if (type === 'customers') {
            this.QBDCustomersItem = res.data;
          } else if (type === 'expense-items') {
            this.QBDExpenseItem = res.data;
          } else {
            this.QBDClassItem = res.data;
          }
        })
    );
  }

  QBDSaveExpense(): void {
    this.exportError.set(null);
    this.updateExpenseTotal();
    if (this.QBDCompanyId && this.QBDBankId === '') {
      this.refuse('The QuickBooks Bank field is required', 'exportBank', 'bank');
      return;
    }

    for (let i = 0; i <= this.qbdExportsForm.value.length; i += 1) {
      if (
        this.qbdExportsForm.value[i]?.expense &&
        (this.qbdExportsForm.value[i]?.amount == null ||
          this.qbdExportsForm.value[i]?.amount === '')
      ) {
        this.refuse('The amount field is required', `exportRow-${i}`, 'amount');
        return;
      }
      if (
        this.qbdExportsForm.value[i]?.expense == null &&
        this.qbdExportsForm.value[i]?.amount
      ) {
        this.refuse('The Expense field is required', `exportRow-${i}`, 'category');
        return;
      }
    }
    if (this.QBDTotal > MAX_EXPORT_TOTAL) {
      this.refuse(
        'The check amount must be between 0 and 100000000.',
        'exportTotal',
        'total'
      );
      return;
    }
    this.saveQBD();
  }

  saveQBD(): void {
    if (this.QBDTotal === 0 || !this.QBDTotal) {
      this.isQBDSaved = false;
      this.onQbdSave(undefined);
      return;
    }

    const filteredFormValue: IQBDExportsFormBody[] = this.qbdExportsForm.value
      .filter(
        (ele) =>
          ele.amount && ele.amount !== '' && ele.expense?.id && ele.expense?.id !== ''
      )
      .map((ele) => ({
        expenseId: ele.expense?.id,
        description: ele.description,
        customerId: ele.customer?.id ? ele.customer?.id : '',
        classId: ele.class?.id ? ele.class?.id : '',
        amount: ele.amount
      }));

    this.onQbdSave({
      companyId: String(this.QBDCompanyId),
      qbdBankId: this.QBDBankId,
      formValue: filteredFormValue,
      QBDTotal: this.QBDTotal
    });
    this.isQBDSaved = true;
  }

  // -------------------------------------------------------------------------
  // API — NetSuite
  // -------------------------------------------------------------------------

  getNetSuiteBank(bankId: string): void {
    this.subscriptions.push(
      this.netsuiteIntegrationService.getNetSuiteBank(bankId).subscribe((res) => {
        if (res.success) {
          this.netSuiteBankName = res.data.netsuiteBankName;
          this.netSuiteBankId = res.data.netsuiteBankId;
          this.netSuiteLocationId = res.data.netsuiteLocationId;
          if (res.data.netsuiteBankId) {
            this.onNetSuiteDetails('expense-accounts', '');
            this.onNetSuiteDetails('classes', '');
            this.onNetSuiteDetails('payees', '');
            this.getNetSuiteLocations();
            // Ticks the checkbox only; v3 does not emit here — selecting a mapped
            // bank is not the user asking to export (quickbooks-export-check L1309-1328).
            this.isEnableExport = true;
          }
        }
      })
    );
  }

  getNetSuiteLocations(): void {
    this.subscriptions.push(
      this.netsuiteIntegrationService.getNetSuiteLocations().subscribe((res) => {
        if (res.success) {
          this.netSuiteLocations = res.data;
          if (this.netSuiteLocationId && this.netSuiteLocations.length > 0) {
            const matchedLocation = this.netSuiteLocations.find(
              (loc) => loc.id === this.netSuiteLocationId
            );
            if (matchedLocation) {
              this.netsuiteExportsForm.controls[0]
                .get('location')
                ?.setValue(matchedLocation, { emitEvent: false });
            }
          }
        }
      })
    );
  }

  onNetSuiteDetails(
    type: 'expense-accounts' | 'classes' | 'payees',
    searchTerm: string
  ): void {
    this.subscriptions.push(
      this.netsuiteIntegrationService
        .getNetSuiteExportDetails(type, searchTerm)
        .subscribe((res) => {
          if (res.success) {
            if (type === 'expense-accounts') {
              this.netSuiteExpense.set(res.data);
            } else if (type === 'payees') {
              this.netSuitePayee = res.data;
            } else {
              this.netSuiteClass = res.data;
            }
          }
        })
    );
  }

  onScrollNetSuiteDetails(
    type: 'expense-accounts' | 'classes' | 'payees'
  ): void {
    let page = 1;
    if (type === 'expense-accounts') {
      page = this.netSuiteExpensePage;
    } else if (type === 'classes') {
      page = this.netSuiteClassPage;
    } else {
      page = this.netSuitePayeePage;
    }

    this.subscriptions.push(
      this.netsuiteIntegrationService
        .getNetSuiteExportDetails(type, '', page)
        .subscribe((res) => {
          if (res.success) {
            res.data.forEach((element) => {
              if (type === 'expense-accounts') {
                const currentExpenses = this.netSuiteExpense();
                const newItems: INetSuiteClass[] = [];
                // eslint-disable-next-line @typescript-eslint/no-shadow
                res.data.forEach((element) => {
                  const isDuplicate = currentExpenses.some(
                    (existingElement) => existingElement.id === element.id
                  );
                  if (!isDuplicate) {
                    newItems.push(element);
                  }
                });
                if (newItems.length > 0) {
                  this.netSuiteExpense.update((current) => [
                    ...current,
                    ...newItems
                  ]);
                }
              } else if (type === 'payees') {
                this.netSuitePayee.push(element);
              } else {
                this.netSuiteClass.push(element);
              }
            });
            if (type === 'expense-accounts') {
              this.netSuiteExpensePage += 1;
            } else if (type === 'classes') {
              this.netSuiteClassPage += 1;
            } else {
              this.netSuitePayeePage += 1;
            }
          }
        })
    );
  }

  netSuiteSaveExpense(): void {
    this.exportError.set(null);
    this.updateNetSuiteExpenseTotal();
    if (this.netSuiteBankId && this.netSuiteBankId === '') {
      this.refuse('The NetSuite Bank field is required', 'exportBank', 'bank');
      return;
    }

    for (let i = 0; i <= this.netsuiteExportsForm.value.length; i += 1) {
      if (
        this.netsuiteExportsForm.value[i]?.expense &&
        (this.netsuiteExportsForm.value[i]?.amount == null ||
          this.netsuiteExportsForm.value[i]?.amount === '')
      ) {
        this.refuse('The amount field is required', `exportRow-${i}`, 'amount');
        return;
      }
      if (
        this.netsuiteExportsForm.value[i]?.expense == null &&
        this.netsuiteExportsForm.value[i]?.amount
      ) {
        this.refuse('The Expense field is required', `exportRow-${i}`, 'category');
        return;
      }
    }
    if (this.netSuiteTotal > MAX_EXPORT_TOTAL) {
      this.refuse(
        'The check amount must be between 0 and 100000000.',
        'exportTotal',
        'total'
      );
      return;
    }
    this.saveNetSuite();
  }

  saveNetSuite(isAutoSaveEnabled?: boolean): void {
    if (this.netSuiteTotal === 0 || !this.netSuiteTotal) {
      this.isNetSuiteSaved = false;
      this.onNetSuiteSave(undefined);
      this.paymentsService.onSaveNetSuiteDetails.set(undefined);
      return;
    }

    const filteredFormValue: IQBDExportsFormBody[] = this.netsuiteExportsForm.value
      .filter(
        (ele) =>
          ele.amount && ele.amount !== '' && ele.expense?.id && ele.expense?.id !== ''
      )
      .map((ele) => ({
        expenseId: ele.expense?.id,
        description: ele.description,
        customerId: ele.customer?.id ? ele.customer?.id : '',
        classId: ele.class?.id ? ele.class?.id : '',
        locationId: ele.location?.id ? ele.location?.id : '',
        amount: ele.amount
      }));

    const savedData = {
      netSuiteBankId: this.netSuiteBankId,
      formValue: filteredFormValue,
      netSuiteTotal: this.netSuiteTotal
    };

    this.onNetSuiteSave(savedData);
    this.onEnabledChange(false);
    if (isAutoSaveEnabled) {
      this.paymentsService.onSaveNetSuiteDetails.set(savedData);
    }
    this.isNetSuiteSaved = true;
  }

  // -------------------------------------------------------------------------
  // API — FreshBooks
  // -------------------------------------------------------------------------

  getFBCompanies(): void {
    this.subscriptions.push(
      this.integrationService.getDetails('freshbooks').subscribe((res) => {
        if (res.success) {
          this.FBCompanies = (
            res.data.companies as IConnectedCompanyList[]
          ).map((company) => ({
            ...company,
            // FreshBooks answers with an empty `companyName` for a company that
            // has not been named there, and the dropdown drew the row with
            // nothing in it — a blank line that could not be told apart from no
            // companies at all. The id is what it is known by; use it to say so.
            companyLabel: company.companyName?.trim() || company.companyId
          }));
        }
      })
    );
  }

  /** What the picker shows for a company, empty name or not. */
  freshBooksCompanyLabel(companyId: string | undefined): string {
    const company = this.FBCompanies.find((c) => c.companyId === companyId);
    return company?.companyName?.trim() || company?.companyId || '';
  }

  onFreshBooksCompanyChange(event: string): void {
    this.clearExportError();
    this.FreshBooksCompanyId = event;
    this.FreshBooksCompanyName = this.freshBooksCompanyLabel(event);
    this.subscriptions.push(
      this.integrationService.getCategoriesList(event).subscribe((res) => {
        if (res.success && res.data.length > 0) {
          this.FBCategoryItem = res.data.map((item: INameIdModel) => ({
            id: item.id,
            name: item.name
          }));
        }
      })
    );
  }

  freshBooksSaveExpense(): void {
    this.updateFreshBooksTotal();
    this.exportError.set(null);

    if (!this.FreshBooksCompanyId && !this.FreshBooksCompanyName) {
      this.refuse(
        'The FreshBooks Company field is required',
        'exportCompany',
        'company'
      );
      return;
    }

    for (let i = 0; i <= this.freshbooksExportsForm.value.length; i += 1) {
      if (
        this.freshbooksExportsForm.value[i]?.fbCategory &&
        (this.freshbooksExportsForm.value[i]?.amount == null ||
          this.freshbooksExportsForm.value[i]?.amount === '')
      ) {
        this.refuse('The amount field is required', `exportRow-${i}`, 'amount');
        return;
      }
      if (
        this.freshbooksExportsForm.value[i]?.fbCategory == null &&
        this.freshbooksExportsForm.value[i]?.amount
      ) {
        this.refuse('The category field is required', `exportRow-${i}`, 'category');
        return;
      }
    }
    if (this.FreshBooksTotal > MAX_EXPORT_TOTAL || this.FreshBooksTotal <= 0) {
      this.refuse(
        'The check amount must be between 0 and 100000000.',
        'exportTotal',
        'total'
      );
      return;
    }

    this.saveFreshBooks();
  }

  private saveFreshBooks(): void {
    if (this.FreshBooksTotal === 0 || !this.FreshBooksTotal) {
      this.isFreshBooksSaved = false;
      this.onFreshBooksSave(undefined);
      return;
    }

    const firstEntry = this.freshbooksExportsForm.value[0];
    if (!firstEntry?.fbCategory?.id || !firstEntry?.amount) {
      this.onFreshBooksSave(undefined);
      return;
    }

    const savedData = {
      companyId: this.FreshBooksCompanyId,
      categoryId: firstEntry.fbCategory.id,
      description: firstEntry.description || '',
      amount: firstEntry.amount,
      attachFreshbooksExpenseToCheck: '1'
    };
    this.onFreshBooksSave(savedData);
    this.paymentsService.onSaveFreshBooksDetails.set(savedData);
    this.isFreshBooksSaved = true;
  }

  // -------------------------------------------------------------------------
  // What the Send page asks of the panel
  // -------------------------------------------------------------------------

  /**
   * Serialise the line items as the Save Details button would: the payment body reads
   * what was *saved*, so a user who never pressed it would otherwise export nothing.
   */
  save(): Observable<boolean> {
    // No payment yet means the panel is not on screen (see the template's `@if`),
    // so there is nothing to export — which is not a refusal.
    if (!this.exportCheckService.enabled() || !this.paymentFormValue()) {
      return of(true);
    }

    // Fields are answered top to bottom, and this gate runs ahead of the source's
    // validate(), so a line item must not answer for an amount the user has not
    // entered. Refuse without an export message and send them to the field that
    // is actually missing. Refusing rather than standing aside matters: passing
    // here would let a payment through with the export never saved.
    if (this.sendStateService.coreForm.invalid) {
      this.exportError.set(null);
      this.sendStateService.coreForm.markAllAsTouched();
      this.sendStateService.requestFieldFocus(
        this.sendStateService.invalidKeys()
      );
      return of(false);
    }

    // The panel has no Save Details button any more, so the submit presses it
    // for the user - on the tab they are actually filling in.
    //
    // The refusal is the message the save raised, not an empty store slot. A
    // slot holds whatever the last successful save put there, so a save that
    // refuses leaves it full — and reading the slot let a payment through with
    // the reason it had just been refused for still on screen.
    const store = this.exportCheckService;

    switch (this.activeTab) {
      case 'qbo':
        this.QBOSaveClicked();
        return of(this.saved(!!store.qbo));
      case 'qbd':
        this.QBDSaveExpense();
        return of(this.saved(!!store.qbd));
      case 'netsuite':
        this.netSuiteSaveExpense();
        return of(this.saved(!!store.netsuite));
      case 'freshbooks':
        this.freshBooksSaveExpense();
        return of(this.saved(!!store.freshbooks));
      default:
        return of(true);
    }
  }

  /** A save passed when it raised nothing and left something behind. */
  private saved(wrote: boolean): boolean {
    return !this.exportError() && wrote;
  }

  // ── What the panel saved, per platform ──

  onQboSave(data: IQBOExportsData | undefined): void {
    this.exportCheckService.qbo = data;
    this.applyTotal(data?.QBOTotal);
  }

  onQbdSave(data: IQBDExportsData | undefined): void {
    this.exportCheckService.qbd = data;
    this.applyTotal(data?.QBDTotal);
  }

  onNetSuiteSave(data: INetSuiteExportsData | undefined): void {
    this.exportCheckService.netsuite = data;
    this.applyTotal(data?.netSuiteTotal);
  }

  onFreshBooksSave(data: IFreshBookExportsData | undefined): void {
    this.exportCheckService.freshbooks = data;
    this.applyTotal(data?.amount ? Number(data.amount) : undefined);
  }

  onEnabledChange(enabled: boolean): void {
    this.exportCheckService.enabled.set(enabled);
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private reset(): void {
    this.QBCategoryItem = [];
    this.QBClassItem = [];
    this.QBCustomerItem = [];
    this.qboExportsForm?.reset();
    this.isQBOSaved = false;

    this.QBDCompanyId = '';
    this.QBDCompanyName = '';
    this.QBDBankAccountName = '';
    this.QBDExpenseItem = [];
    this.QBDCustomersItem = [];
    this.QBDClassItem = [];
    this.isQBDSaved = false;

    this.FreshBooksCompanyId = '';
    this.FreshBooksCompanyName = '';
    this.FBCategoryItem = [];
    this.freshbooksExportsForm?.reset();
    this.isFreshBooksSaved = false;

    this.onQboSave(undefined);
    this.onQbdSave(undefined);
    this.onFreshBooksSave(undefined);
  }

  /**
   * The line items are not checked against the amount — they *are* the amount.
   * Whatever the user expensed is what the payment is worth.
   */
  private applyTotal(total: number | undefined): void {
    if (total) {
      this.sendStateService.coreForm.controls.amount.setValue(String(total));
    }
  }

  /**
   * The payment, in the shape the panel reads. An ACH keeps its memo, invoice and —
   * crucially — its category on `BankPaymentService.detailsForm`, not the check form.
   */
  private buildFormValue(): ICheckPaymentsForm {
    const core = this.sendStateService.coreForm.getRawValue();

    if (this.isBankAch()) {
      const a = this.bankPaymentService.detailsForm.getRawValue();

      return {
        amount: String(core.amount ?? '0'),
        payee: core.payee,
        bankAc: core.bankAc,
        memo: a.memo ?? '',
        issueDate: '',
        category: a.category,
        invoiceNumber: a.invoiceNumber ?? '',
        checkNumber: '',
        noAmount: false,
        noSign: false,
        noPayee: false,
        noDate: false
      } as ICheckPaymentsForm;
    }

    const d = this.bankCheckService.detailsForm.getRawValue();

    return {
      amount: String(core.amount ?? '0'),
      payee: core.payee,
      bankAc: core.bankAc,
      memo: d.memo ?? '',
      issueDate: d.issueDate ?? '',
      category: d.category,
      invoiceNumber: d.invoiceNumber ?? '',
      checkNumber: String(d.checkNumber ?? ''),
      noAmount: !!d.noAmount,
      noSign: !!d.noSign,
      noPayee: !!d.noPayee,
      noDate: !!d.noDate
    } as ICheckPaymentsForm;
  }

  // -------------------------------------------------------------------------
  // Cleanup
  // -------------------------------------------------------------------------

  ngOnDestroy(): void {
    document.removeEventListener('scroll', this.closeDropdownsOnScroll, true);
    this.subscriptions.forEach((el) => {
      el.unsubscribe();
    });
  }
}

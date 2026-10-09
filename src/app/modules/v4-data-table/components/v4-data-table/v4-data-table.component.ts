import { finalize, debounceTime, tap, first } from 'rxjs/operators';
import {
  EventEmitter,
  DestroyRef,
  OnDestroy,
  OnInit,
  Output,
  inject,
  Component,
  Input,
  input,
  computed,
  model,
  signal,
  OnChanges,
  SimpleChanges,
  ElementRef,
  AfterViewInit,
  HostBinding,
  NgZone,
  TemplateRef,
  ViewChild
} from '@angular/core';
import { OperatorFunction, Subject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ColDef,
  Column,
  ColumnResizedEvent,
  ColumnState,
  DomLayoutType,
  ExcelDataType,
  ExcelOOXMLDataType,
  GetContextMenuItemsParams,
  GridApi,
  GridReadyEvent,
  ICellRendererParams,
  IRowNode,
  IServerSideGetRowsParams,
  IsRowSelectable,
  MenuItemDef,
  PaginationChangedEvent,
  RowModelType,
  RowNode,
  RowSelectedEvent,
  GridOptions,
  RowClickedEvent,
  ModuleRegistry
} from '@ag-grid-community/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import {
  DataTableService,
  IDtSelectSingleIdSubject
} from 'src/app/shared/service/data-table/data-table.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { DataTableUtils } from 'src/app/modules/data-table/components/data-table-utils';
import { Utils } from 'src/app/data/utils';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import {
  CurrencyPipe,
  DatePipe,
  Location,
  NgClass,
  NgStyle,
  NgTemplateOutlet
} from '@angular/common';
import { IBankDropdown } from 'src/app/models/bank';
import { IWalletData } from 'src/app/models/wallet';
import { IExistingCreditCards } from 'src/app/models/payment-switch-board';
import { DataTableCacheService } from 'src/app/shared/service/indexedDb/data-table-cache.service';
import { PayeeDataV35Service } from 'src/app/modules/payee/payee-v3/v35-services/payee-data-v35.service';
import { BankDataV35Service } from 'src/app/modules/bank/bank-v3/v35-services/bank-data-v35.service';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { faCaretDown } from '@fortawesome/pro-solid-svg-icons';
import { RequestPaymentsService } from 'src/app/shared/service/RequestPayments/request-payments.service';
import { IReceivedTypes } from 'src/app/modules/receive-payments/model/ReceivePayment';
import { SelectedDateService } from 'src/app/shared/components/date-range/selected.service';
import { MatMenuTrigger, MatMenu } from '@angular/material/menu';
import { MatTooltip } from '@angular/material/tooltip';
import { LucideAngularModule } from 'lucide-angular';
import { AgGridAngular } from '@ag-grid-community/angular';
import { ServerSideRowModelModule } from '@ag-grid-enterprise/server-side-row-model';
import { CsvExportModule } from '@ag-grid-community/csv-export';
import { ExcelExportModule } from '@ag-grid-enterprise/excel-export';
import { MenuModule } from '@ag-grid-enterprise/menu';
import { ClipboardModule } from '@ag-grid-enterprise/clipboard';
import { HttpErrorResponse } from '@angular/common/http';
import { receivedCheckStatus } from 'src/app/modules/receive-payments/data/receive-payments-data';
import { PermissionDeniedV4Component } from 'src/app/shared/components/permission-denied-v4/permission-denied-v4.component';
import { DropDownBankCashComponent } from 'src/app/modules/Cash-Expense/components/drop-down-bank-cash/drop-down-bank-cash.component';
import { V4DateRangeSelectorComponent } from 'src/app/shared/V4/v4-date-range-selector/v4-date-range-selector.component';
import { WalletDropdownV4Component } from 'src/app/shared/components/v4/dropdowns/wallet-dropdown-v4/wallet-dropdown-v4.component';
import { DropDownCardComponent } from 'src/app/shared/components/drop-downs/drop-down-card/drop-down-card.component';
import { DropDownBankComponent } from 'src/app/shared/components/drop-downs/drop-down-bank/drop-down-bank.component';
import { DemoVideoComponent } from 'src/app/shared/components/demo-video/demo-video.component';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { ListViewToggleComponent } from 'src/app/shared/v3/common-components/list-view-toggle/list-view-toggle.component';
import { CommonBackButtonV35Component } from 'src/app/shared/v3/buttons/common-back-button-v35/common-back-button-v35.component';
import {
  V4SelectDropdownComponent,
  IV4SelectOption
} from 'src/app/shared/V4/v4-select-dropdown/v4-select-dropdown.component';
import {
  ICommonTransactionTableData,
  IDtFilteredCols
} from 'src/app/models/v3-common';
import {
  IDefaultPayload,
  ISelectBoxFilterValues,
  ICoulmnDefFieldsResponse,
  ICoulmnDefFields
} from 'src/app/models/v3-datatable';
import {
  IV3DtHeaderElements,
  IV3CommonButton,
  ICashExpenseExport
} from 'src/app/modules/v3-data-table/models/v3-data-table';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { V4PageHeaderComponent } from 'src/app/shared/V4/v4-page-header/v4-page-header.component';
import { IV4HeaderAction } from 'src/app/shared/V4/v4-page-header/v4-page-header.model';
import { V4TableSkeletonOverlay } from 'src/app/shared/V4/v4-table-skeleton-overlay/v4-table-skeleton-overlay';
import { ExportToEmailV4Component } from '../../modals/export-to-email-v4/export-to-email-v4.component';
import { V4FloatingActionBarComponent } from '../v4-floating-action-bar/v4-floating-action-bar.component';
import { inlineActionBarAnimation } from './v4-data-table.animations';
import {
  V4DataTableEmptyStateComponent,
  IV4DataTableEmptyState
} from '../v4-data-table-empty-state/v4-data-table-empty-state.component';

ModuleRegistry.registerModules([
  ServerSideRowModelModule,
  CsvExportModule,
  ExcelExportModule,
  MenuModule,
  ClipboardModule
]);

export interface IDtColumnFields {
  id: string;
  name: string;
  isDisabled: boolean;
  colDef: ICoulmnDefFields;
  isChecked: boolean;
}

export interface ISelectedSingleRow {
  id?: string;
  tableId?: number;
  data?: unknown;
}

export interface ColStateType extends ColumnState {
  name?: string;
  cellRenderer?: (event?: {
    data: unknown;
    value: string;
    getData: boolean;
  }) => void;
}

export class NoRowsCellRenderer {
  eGui = document.createElement('div');
  init() {
    this.eGui.innerHTML = `
      <div class="ag-custom-loading-cell" style="padding-left: 10px; line-height: 25px;">
        <span>No results found</span>
      </div>
    `;
  }

  getGui() {
    return this.eGui;
  }
}

export interface IFilterAndExportForm {
  bankAccountId: FormControl<string | null>;
  sourceType: FormControl<string | null>;
  fromDate: FormControl<string | null>;
  toDate: FormControl<string | null>;
  walletId: FormControl<string | null>;
  cardId: FormControl<string | null>;
  statusType: FormControl<string | null>;
  email: FormControl<string | null>;
}

@Component({
  selector: 'app-v4-data-table',
  templateUrl: './v4-data-table.component.html',
  styleUrls: ['./v4-data-table.component.scss'],
  standalone: true,
  animations: [inlineActionBarAnimation],
  imports: [
    NgClass,
    NgStyle,
    V4PageHeaderComponent,
    CommonBackButtonV35Component,
    ListViewToggleComponent,
    CommonButtonV4Component,
    MatMenuTrigger,
    MatMenu,
    DemoVideoComponent,
    MatTooltip,
    FormsModule,
    LucideAngularModule,
    NgTemplateOutlet,
    AgGridAngular,
    ReactiveFormsModule,
    DropDownBankComponent,
    DropDownCardComponent,
    WalletDropdownV4Component,
    V4DateRangeSelectorComponent,
    PermissionDeniedV4Component,
    DropDownBankCashComponent,
    V4FloatingActionBarComponent,
    V4SelectDropdownComponent,
    V4DataTableEmptyStateComponent,
    CurrencyPipe
  ]
})
export class V4DataTableComponent
  implements OnInit, OnChanges, OnDestroy, AfterViewInit
{
  /* Injectors */
  public v3DataTableService = inject(V3DataTableService);
  public router = inject(Router);
  private dialog = inject(MatDialog);
  private dataTableService = inject(DataTableService);
  private alertService = inject(V4AlertService);
  private datePipe = inject(DatePipe);
  private dataTableCacheService = inject(DataTableCacheService);
  private payeeService = inject(PayeeDataV35Service);
  private bankService = inject(BankDataV35Service);
  private checkService = inject(CheckService);
  private paymentsService = inject(PaymentsService);
  private requestPaymentsService = inject(RequestPaymentsService);
  private location = inject(Location);
  private selectedDateService = inject(SelectedDateService);
  private elementRef = inject(ElementRef);
  private ngZone = inject(NgZone);
  private destroyRef = inject(DestroyRef);

  /* Variables */
  isPaymentTableHavePermission = true;

  @Input() public columnDefs: ICoulmnDefFields[];
  @Input() public defaultColumnFields: IDtColumnFields[];
  @Input() public frameworkComponents = {};
  @Input() public isPaymentsFilterEnabled = false;
  @Input() public tableId: number;
  @Input() public domLayout: DomLayoutType;
  @Input() public rowHeight = 35;
  @Input() public isRowSelectable: IsRowSelectable;
  @Input() public paginationPageSize = 50;
  @Input() public rowSelection: 'single' | 'multiple' = 'multiple';
  @Input() public suppressRowClickSelection = true;
  @Input() public pinColumn: string | undefined;
  @Input() public compact = true;
  @Input() public freeColumnResize = true;
  @Input() public deselectedColumns: string[];
  @Input() public dynamicHeaderText = '';
  @Input() public dynamicHeaderButtonText = '';
  @Input() public dynamicHeaderButtonTooltip = '';
  @Input() public dynamicHeaderButtonRoute = '';
  @Input() public dynamicHeaderButtonColor: 'blue' | 'green' = 'green';
  @Input() public buttonForModal = false;
  @Input() public iconClass = '';
  @Input() fieldsShownByDefault: string[] = [];
  @Input() defaultVisibleColumns: string[] = [];
  @Input() public appendStaticColumnFields: object;
  @Input() public showActionButtonContainer: boolean = true;
  /** When false, hides the filter bar (refresh, page size, column filter, export) above the table. Used e.g. for sub-links to show only custom actions. */
  @Input() public showFilterBar: boolean = true;
  /** When true, renders the filter bar icons inline on the right side of the title row instead of a separate row. */
  @Input() public filterBarInline: boolean = false;
  /** When true, always shows filter buttons horizontally instead of collapsing into a "more" menu on smaller screens. */
  @Input() public forceHorizontalActions: boolean = false;
  @Input() public headerButtonType: 'panelButtons' | 'buttons' = 'buttons';
  @Input() public tableHeight: string;
  @Input() public virtualisedRows: boolean;
  @Input() public adjustHeightCondition: boolean = false;
  @Input() public totalCheckSum: number = 0;
  @Input() public isCheckTotalSumPluginEnabled: boolean = false;
  @Output() modalOpenClick = new EventEmitter();
  @Output() errorOutput = new EventEmitter<HttpErrorResponse>();
  @Output() gridReadyOutput = new EventEmitter<GridApi>();
  @Input() exportConfig: {
    heading?: string;
    name?: string;
    ignoreColumns?: string[];
  };

  @Input() paginationCurrentPageNumber = 1;
  @Input() extendPagination = false;

  @Input() responseMap?: OperatorFunction<
    ICoulmnDefFieldsResponse<unknown>,
    ICoulmnDefFieldsResponse<unknown>
  >;

  @Input() isPaymentTable = false;
  headerElements = input<IV3DtHeaderElements | undefined>(undefined);
  /** Optional line under the table title. Renders nothing when empty. */
  headerSubtitle = input('');
  /** Adapts the legacy headerElements API to the shared header's action model. */
  readonly headerActions = computed<IV4HeaderAction[]>(() =>
    (this.headerElements()?.topRightButtons ?? []).map((btn) => ({
      id: btn.id ?? '',
      text: btn.text ?? '',
      style: this.headerActionStyle(btn),
      lucideIcon: btn.lucideIcon,
      icon: btn.icon,
      isAddIcon: btn.isAddIcon,
      disabled: btn.disabled,
      loading: btn.loading,
      toolTip: btn.toolTip,
      menu: btn.menu?.map((item) => ({
        id: item.id,
        name: item.name,
        lucideIcon:
          item.lucideIcon ??
          (typeof item.icon === 'string' ? item.icon : undefined)
      }))
    }))
  );

  toolbarRightTemplate = input<TemplateRef<unknown> | undefined>(undefined);
  /** Left side of the toolbar row (e.g. a section title) when no selection/alert is showing. */
  toolbarLeftTemplate = input<TemplateRef<unknown> | undefined>(undefined);
  toolbarAlertTemplate = input<TemplateRef<unknown> | undefined>(undefined);
  HeaderButtonLoadingProp = input({ isLoading: false, btn_id: '' });
  selectedPanelButton = model<string | number | undefined>(undefined);
  backButtonEnabled = input(false);
  additionalPayload = input<Record<string, unknown> | undefined>(undefined);
  defaultDisabledColumn = input<string[] | undefined>(undefined);
  prevoiusUrl = input<string | undefined>(undefined);
  showFloatingActionBar = input(true);
  @Output() headerButtonEvent = new EventEmitter();
  @Output() cellRendererIdEvent = new EventEmitter();
  @Output() cellRendererViewEvent = new EventEmitter();
  @Output() cellRendererDangerEvent = new EventEmitter();
  @Output() rowSelected = new EventEmitter();
  @Output() viewActionButtonItemEvent = new EventEmitter<{
    selectedRowParams: ICellRendererParams;
    id: string;
  }>();

  filterAndExportLoadingInput = input(false);

  @Output() tableExportEvent = new EventEmitter<{
    items: string[];
    fromDate: string | Date;
    toDate: string | Date;
    type: 'csv' | 'pdf';
    received_type?: number;
    received_type_status?: number;
  }>();

  @Output() bankAccountsOrPayeeExportEvent = new EventEmitter<{
    all: boolean;
    fromDate: string | Date;
    toDate: string | Date;
    fileFormat: 'csv' | 'xlsx' | 'pdf';
  }>();

  @Output() checkDraftExportEvent = new EventEmitter<{
    items: string[];
    fromDate: string | Date;
    toDate: string | Date;
    type: 'csv' | 'pdf';
  }>();

  @Output() CloudExportEvent = new EventEmitter<{
    fromDate: string | Date;
    toDate: string | Date;
    fileFormat: 'csv' | 'xlsx' | 'pdf';
  }>();

  @Output() reportExportEvent = new EventEmitter<'csv' | 'xlsx' | 'pdf'>();

  @Output() cashExpenseExportEvent = new EventEmitter<ICashExpenseExport>();

  @Output() rowClicked = new EventEmitter();
  @Input() transactionType: string;
  @Input() deferInitialLoad = false;
  isFromPaymentsV3 = input(false);
  isInsideModal = input(false);

  /**
   * When true and the table has no rows after the first load, replaces the
   * grid + filter bar + pagination with the custom empty-state design.
   * The default "No results found" overlay is unaffected when this is false.
   */
  @Input() useCustomEmptyState = false;
  @Input() emptyStateConfig: IV4DataTableEmptyState | undefined;
  @Input() emptyStateKeepToolbar = false;
  /**
   * Identifies WHICH dataset the grid is showing — a wallet id, a bank account
   * id, a card id.
   *
   * The empty state is suppressed once any rows have been seen, so that a
   * filter matching nothing falls back to "No results found" instead of
   * claiming the account is empty. Grids that keep one instance and only swap
   * the filter model when the user picks a different account would otherwise
   * be stuck behind that latch forever: pick a funded wallet, then an empty
   * one, and the empty one shows the no-results row.
   *
   * Binding this tells the grid the two loads are different datasets, not two
   * filters over one, so the latch clears when the value changes. Leave it
   * unset — as every list page does — and behaviour is exactly as before.
   */
  @Input() emptyStateScopeKey?: string | number;
  @Output() emptyStateActionClick = new EventEmitter<void>();
  @Output() emptyStateLinkClick = new EventEmitter<string>();
  @Output() emptyStateVideoClick = new EventEmitter<void>();

  getAllColumns: Column[] = [];
  paginationDropdownStyle = {
    'background-color': 'var(--v4-tertiary-background-color)',
    height: '30px',
    'min-height': '30px',
    'font-size': '13px'
  };

  paginationSizeFilterOptions: IV4SelectOption[] = [
    { id: '5', name: '5', value: '5' },
    { id: '10', name: '10', value: '10' },
    { id: '20', name: '20', value: '20' },
    { id: '50', name: '50', value: '50' }
  ];

  paginationSizeSelection: string = '50';
  private isPaginationExtended = false;
  isFilterDown = false;
  faCaretDown = faCaretDown;
  postData: { [key: string]: string | IReceivedTypes | undefined };

  public defaultColDef: ColDef = {
    width: 100,
    sortable: true,
    resizable: true,
    filter: false,
    flex: 1,
    minWidth: 100,
    unSortIcon: true,
    icons: {
      sortAscending:
        '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></svg>',
      sortDescending:
        '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>',
      sortUnSort:
        '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21 16-4 4-4-4"/><path d="M17 20V4"/><path d="m3 8 4-4 4 4"/><path d="M7 4v16"/></svg>'
    }
  };

  selectBoxFilterChanges: ISelectBoxFilterValues | undefined;

  private gridApi: GridApi;

  paginationTotalRenderedPages: number;
  paginationTotalPageCount: number;
  paginationTotalRowCount = 10;
  suppressColumnVirtualisation = true;
  rowBufferSize = 10;
  readonly defaultVirtualisedHeight = 'calc(100vh - 300px)';
  private hasEverLoadedRows = false;
  /** Last `emptyStateScopeKey` seen, so a change can clear the latch above. */
  private lastEmptyStateScopeKey?: string | number;
  paginationFirstRowOnPageIndex: number;
  paginationLastRowOnPageIndex: number;
  specificPageInput: number | undefined;

  paginationBoxOneNumber = 1;
  paginationBoxTwoNumber: number | undefined = undefined;
  paginationBoxThreeNumber: number | undefined = undefined;
  paginationBoxFourNumber: number | undefined = undefined;

  isV4DataTableLoading = true;
  selectedRowsData: RowNode[] = [];
  selectedRowCount: number = 0;

  filteredColumnFields: IDtColumnFields[] = [];
  filteredColumnDefs: ICoulmnDefFields[] = [];
  columnSearch = '';
  private defaultCheckedColumnIds = new Set<string>();
  private defaultColumnOrder: string[] = [];
  private columnCheckedSnapshot: Map<string, boolean> | null = null;
  private columnChangesApplied = false;

  /** Natural (pre-flex) width of each unpinned column, keyed by col id. */
  private readonly baseColumnWidths = new Map<string, number>();

  private isFillingColumns = false;
  private readonly selectionColumnIds = ['id', 'boxId'];
  toolbarPinned = false;
  pinnedTop = 0;
  pinnedLeft = 0;
  pinnedWidth = 0;
  pinnedHeight = 0;
  private toolbarPinFrame: number | null = null;
  // Registered capture-phase on document, so it fires for every scroller on the
  // page - the grid body included. Coalesce to one layout read per frame,
  // otherwise each scroll event forces a synchronous reflow.
  private onDocumentScroll = () => {
    if (this.toolbarPinFrame !== null) return;
    this.toolbarPinFrame = requestAnimationFrame(() => {
      this.toolbarPinFrame = null;
      this.updateToolbarPin();
    });
  };

  scrollHintLeft = false;
  scrollHintRight = false;
  displayedColumnCount = 0;
  hasRightPinnedColumn = false;
  isFilterAndExportShown = false;
  filterAndExportForm: FormGroup<IFilterAndExportForm>;
  walletDropdownControl = new FormControl();
  filterAndExportLoading = false;

  gridOptions: GridOptions = {};

  onColumnMovedTimeout: ReturnType<typeof setTimeout>;
  colIndex: number[] = [];
  colName: string[] = [];
  tableMovePositionData: { order: { [index: string]: number } };
  columnMovedSubject = new Subject<void>();
  columnOrder: { [key: string]: number };
  columnVisibility: string[];
  rowModelType: RowModelType = 'serverSide';
  initialLoad = true;
  dataLoaded = false;
  exportedFile: Blob | null = null;

  achTransferStatus = [
    { id: 'all', status: 'All' },
    { id: '0', status: 'Pending' },
    { id: '1', status: 'Processing' },
    { id: '2', status: 'Completed' },
    { id: '3', status: 'Canceled' },
    { id: '4', status: 'Failed' },
    { id: '5', status: 'Returned' }
  ];

  tablesNames: { [tableId: number]: string } = {
    1: 'Check',
    2: 'Bill',
    3: 'Payment',
    4: 'Invoice',
    16: 'Check Draft',
    18: 'Deposit Slip',
    26: 'recurring check',
    29: 'Cash Expense',
    70: 'Shipping Label'
  };

  routingNumber: { [key: string]: string };
  receivePaymentsStatus = receivedCheckStatus;
  selectedStatus: number | { type: number; status: number } = 0;
  showPermssionDenied = signal(false);
  private resizeObserver: ResizeObserver | null = null;
  private gridSizeObserver: ResizeObserver | null = null;
  private footerScrollTrack: HTMLElement | null = null;
  private scrollHost: HTMLElement | null = null;
  private fitsHeightToViewport = false;
  private heightFitObserver: ResizeObserver | null = null;
  private heightFitFrame: number | null = null;
  private heightFitScroller: HTMLElement | null = null;
  private readonly minVirtualisedHeight = 320;
  private readonly viewportBottomGap = 24;
  private readonly maxReservedBelow = 200;

  @ViewChild('toolbarRow') toolbarRow: ElementRef<HTMLElement> | undefined;
  @ViewChild('toolbarSpacer') toolbarSpacer:
    | ElementRef<HTMLElement>
    | undefined;

  isRechargeCreditPage = this.router.url.includes(
    
    'v4/manage/refill-credit/show-refillform'
  
  );

  ngOnChanges(changes: SimpleChanges): void {
    // Some parents (e.g. payroll) resolve tableId after this component has
    // initialised, so the settings fetch in ngOnInit bailed out. Re-run it
    // once the id arrives so saved visibility/order are applied and Apply
    // has a baseline to work from.
    const tableIdChange = changes.tableId;
    if (
      tableIdChange &&
      !tableIdChange.firstChange &&
      this.tableId &&
      this.filteredColumnFields?.length
    ) {
      this.fetchFilterSettings();
    }
    // A new scope means a different dataset, not a different filter over the
    // same one — so "we have seen rows here" no longer holds.
    if (this.emptyStateScopeKey !== this.lastEmptyStateScopeKey) {
      this.lastEmptyStateScopeKey = this.emptyStateScopeKey;
      this.hasEverLoadedRows = false;
    }
    if (this.extendPagination && !this.isPaginationExtended) {
      this.isPaginationExtended = true;
      this.paginationSizeFilterOptions.push(
        { id: '100', name: '100', value: '100' },
        { id: '200', name: '200', value: '200' },
        { id: '500', name: '500', value: '500' }
      );
      this.paginationSizeSelection = '500';
      this.paginationPageSize = 500;
      this.v3DataTableService.defaultPayload.endRow = 500;
      this.dataTableService.paginationSizeController.next(500);
    }
  }

  ngOnInit(): void {
    this.resolveRowVirtualisation();
    if (this.freeColumnResize) {
      this.defaultColDef = { ...this.defaultColDef, flex: undefined };
    }
    this.dataTableService.paginationSizeController
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((val) => {
        this.paginationPageSize = val;
      });
    this.setGridOptions();
    this.initFilterAndExportForm();
    this.setInitialColumns();
    this.getTableDataOnPayloadUpdate();
    this.v3DataTableService.v3RowSelectionData$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((val) => {
        this.selectedRowsData = val;
        this.selectedRowCount = this.selectedRowsData.length;
        if (!this.showActionBar) this.unpinToolbar();
      });
    this.selectBoxFilterChanges =
      this.v3DataTableService.initialSelectBoxFilter;

    this.getColumnMoveEvent();

    if (this.tableId === 62 && this.isPaymentTable) {
      this.onEyeButtonClick();
    }

    this.dataTableService.selectedsingleId
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res: ISelectedSingleRow) => {
        if (res?.tableId === this.tableId || !res?.tableId) {
          const selectedSingleRow = res;
          this.cellRendererIdEvent.emit(selectedSingleRow);
        }
      });

    this.dataTableService.selectedViewSingleId$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        const response = res as IDtSelectSingleIdSubject;
        if (
          (response?.tableId && this.tableId === response.tableId) ||
          !response?.tableId
        ) {
          const selectedSingleViewRow = res;
          this.cellRendererViewEvent.emit(selectedSingleViewRow);
        }
      });

    this.dataTableService.selectedDangerSingleId$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        const response = res as IDtSelectSingleIdSubject;
        if (
          (response?.tableId && this.tableId === response.tableId) ||
          !response?.tableId
        ) {
          const selectedSingleViewRow = res;
          this.cellRendererDangerEvent.emit(selectedSingleViewRow);
        }
      });

    this.isPostDataChanges();
  }

  ngAfterViewInit(): void {
    this.setupHorizontalScrollbarSync();
    this.observeViewportHeightFit();
    this.ngZone.runOutsideAngular(() => {
      document.addEventListener('scroll', this.onDocumentScroll, true);
      window.addEventListener('resize', this.onDocumentScroll);
    });
  }

  private setupHorizontalScrollbarSync(): void {
    this.ngZone.runOutsideAngular(() => {
      setTimeout(() => {
        const gridContainer = this.elementRef.nativeElement.querySelector(
          '.v4-data-table-grid-container'
        );
        const horizontalScrollbar = this.elementRef.nativeElement.querySelector(
          '.ag-body-horizontal-scroll'
        );

        if (gridContainer && horizontalScrollbar) {
          this.syncHorizontalScrollbarWidth(gridContainer, horizontalScrollbar);

          this.resizeObserver = new ResizeObserver(() => {
            this.syncHorizontalScrollbarWidth(
              gridContainer,
              horizontalScrollbar
            );
          });

          this.resizeObserver.observe(gridContainer);
        }
      }, 100);
    });
  }

  private syncHorizontalScrollbarWidth(
    gridContainer: HTMLElement,
    scrollbar: HTMLElement
  ): void {
    const rect = gridContainer.getBoundingClientRect();
    const scrollbarStyle = scrollbar.style as CSSStyleDeclaration;
    scrollbarStyle.left = `${rect.left}px`;
    scrollbarStyle.width = `${rect.width}px`;
    scrollbarStyle.maxWidth = `${rect.width}px`;
  }

  /**
   * Row virtualisation is on unless the caller explicitly asked for
   * `autoHeight` (small embedded tables that grow with their content) or the
   * table sits in a modal without choosing a layout. An explicit
   * `virtualisedRows` always wins.
   */
  private resolveRowVirtualisation(): void {
    this.virtualisedRows ??= this.domLayout
      ? this.domLayout !== 'autoHeight'
      : !this.isInsideModal();
    if (!this.virtualisedRows) {
      this.domLayout ??= 'autoHeight';
      return;
    }
    this.domLayout = 'normal';
    if (!this.tableHeight) {
      this.fitsHeightToViewport = true;
      this.tableHeight = this.defaultVirtualisedHeight;
    }
  }

  /**
   * Without a caller-provided height, the grid fills the nearest fixed-height
   * scroll area around it (or the window) from wherever it starts, leaving
   * room for whatever sits below it so that area does not scroll alongside the
   * grid.
   */
  private observeViewportHeightFit(): void {
    if (!this.fitsHeightToViewport) return;
    this.ngZone.runOutsideAngular(() => {
      this.heightFitObserver = new ResizeObserver(this.scheduleHeightFit);
      this.heightFitObserver.observe(this.elementRef.nativeElement);
      window.addEventListener('resize', this.scheduleHeightFit);
    });
    this.scheduleHeightFit();
  }

  private scheduleHeightFit = (): void => {
    if (!this.fitsHeightToViewport || this.heightFitFrame !== null) return;
    this.ngZone.runOutsideAngular(() => {
      this.heightFitFrame = requestAnimationFrame(() => {
        this.heightFitFrame = null;
        this.fitHeightToViewport();
      });
    });
  };

  private fitHeightToViewport(): void {
    const host = this.elementRef.nativeElement as HTMLElement;
    const container = host.querySelector<HTMLElement>(
      '.v4-data-table-grid-container'
    );
    if (!container) return;
    const scroller = this.findFixedHeightScroller(container);
    this.watchScroller(scroller);
    const available = scroller
      ? this.availableHeightIn(scroller, container)
      : window.innerHeight -
        container.getBoundingClientRect().top -
        this.ancestorScroll(container) -
        this.viewportBottomGap;
    const height = Math.max(this.minVirtualisedHeight, Math.floor(available));
    if (Math.abs(height - parseFloat(this.tableHeight)) <= 1) return;
    this.ngZone.run(() => {
      this.tableHeight = `${height}px`;
    });
  }

  /**
   * Nearest ancestor whose height does not follow its content: a scroll area,
   * or a wrapper the page has already sized for the table (e.g.
   * `h-[calc(100vh-200px)]`), which the grid should fill rather than leave
   * empty space in. The grid is forced to two extreme heights within one
   * synchronous layout pass: only an ancestor whose height is identical at both
   * is fixed. Testing against the grid's current height instead makes the
   * verdict depend on the previous fit and the result flips on every call.
   * Elements reporting 0 (inline component hosts) are skipped.
   */
  private findFixedHeightScroller(container: HTMLElement): HTMLElement | null {
    const ancestors: HTMLElement[] = [];
    for (
      let el = container.parentElement;
      el && el !== document.body;
      el = el.parentElement
    ) {
      if (el.clientHeight > 0) ancestors.push(el);
    }
    if (!ancestors.length) return null;
    const containerStyle = container.style as CSSStyleDeclaration;
    const inlineHeight = containerStyle.height;
    const heightsWhenGrid = (height: string) => {
      containerStyle.height = height;
      return ancestors.map((el) => el.clientHeight);
    };
    const collapsed = heightsWhenGrid('0px');
    const expanded = heightsWhenGrid('100000px');
    containerStyle.height = inlineHeight;
    const fixed = ancestors.find((_, i) => collapsed[i] === expanded[i]);
    return fixed ?? null;
  }

  /** Re-fit when the scroll area or anything in it changes size. */
  private watchScroller(scroller: HTMLElement | null): void {
    if (!scroller || scroller === this.heightFitScroller) return;
    this.heightFitScroller = scroller;
    this.heightFitObserver?.observe(scroller);
    Array.from(scroller.children).forEach((child) =>
      this.heightFitObserver?.observe(child)
    );
  }

  /**
   * Visible height of `scroller` left below the grid's top, minus the content
   * under the grid. Large content below is real page content: the grid then
   * fills the view and the area scrolls to reach the rest.
   */
  private availableHeightIn(
    scroller: HTMLElement,
    container: HTMLElement
  ): number {
    const top =
      container.getBoundingClientRect().top -
      scroller.getBoundingClientRect().top -
      scroller.clientTop +
      this.ancestorScroll(container, scroller);
    const below = this.contentBelow(container, scroller);
    const reserved =
      below <= this.maxReservedBelow ? below : this.viewportBottomGap;
    return scroller.clientHeight - top - reserved;
  }

  /**
   * Space laid out under `element` inside `scroller`: at each level, the
   * distance to the lowest in-flow sibling below it (so margins and flex/grid
   * gaps count), plus the parent's bottom padding and border. Measured from
   * content rather than `scrollHeight`, which is clamped to the visible height
   * and would count empty space as content.
   */
  private contentBelow(element: HTMLElement, scroller: HTMLElement): number {
    let below = 0;
    let child = element;
    while (child !== scroller && child.parentElement) {
      const parent = child.parentElement;
      const childBottom = child.getBoundingClientRect().bottom;
      let lowest =
        childBottom + (parseFloat(getComputedStyle(child).marginBottom) || 0);
      let sibling = child.nextElementSibling as HTMLElement | null;
      for (; sibling; sibling = sibling.nextElementSibling as HTMLElement) {
        lowest = Math.max(lowest, this.bottomIfBelow(sibling, childBottom));
      }
      const parentStyle = getComputedStyle(parent);
      below +=
        lowest -
        childBottom +
        (parseFloat(parentStyle.paddingBottom) || 0) +
        (parseFloat(parentStyle.borderBottomWidth) || 0);
      child = parent;
    }
    return below;
  }

  /** Bottom edge (with margin) of `sibling` when it sits in flow under `bottom`. */
  private bottomIfBelow(sibling: HTMLElement, bottom: number): number {
    const style = getComputedStyle(sibling);
    const rect = sibling.getBoundingClientRect();
    const inFlow = style.position !== 'absolute' && style.position !== 'fixed';
    if (!inFlow || !rect.height || rect.top < bottom - 1) return bottom;
    return rect.bottom + (parseFloat(style.marginBottom) || 0);
  }

  /**
   * Total scroll offset between `element` and `until` (or the window), so the
   * fit ignores where the page is scrolled to.
   */
  private ancestorScroll(element: HTMLElement, until?: HTMLElement): number {
    let offset = until ? 0 : window.scrollY;
    for (let el = element.parentElement; el; el = el.parentElement) {
      offset += el.scrollTop;
      if (el === until) break;
    }
    return offset;
  }

  setGridOptions() {
    this.gridOptions = {
      components: {
        ...this.frameworkComponents,
        NoRowsCellRenderer,
        V4TableSkeletonOverlay
      },
      noRowsOverlayComponent: NoRowsCellRenderer,
      loadingOverlayComponent: V4TableSkeletonOverlay,
      suppressDragLeaveHidesColumns: true,
      headerHeight: 36,
      floatingFiltersHeight: 44,
      // The overlay paints shimmer rows over the body viewport; ag-grid keeps
      // owning the columns, so it only needs the row rhythm.
      loadingOverlayComponentParams: {
        rowHeight: this.rowHeight,
        // Capped at 20 — the overlay only needs to fill the viewport, and the
        // page size can be 500.
        rowCount: Math.min(this.paginationPageSize || 12, 20)
      },
      getContextMenuItems: (
        params: GetContextMenuItemsParams
      ): (string | MenuItemDef)[] => {
        const defaultContextMenu = params.defaultItems;
        const customContextMenu = defaultContextMenu?.filter(
          (item) => item.toLocaleLowerCase() === 'copy'
        );
        return customContextMenu ?? [];
      },
      suppressAnimationFrame: this.virtualisedRows
    } as GridOptions;
  }

  initFilterAndExportForm() {
    this.filterAndExportForm = new FormGroup<IFilterAndExportForm>({
      bankAccountId: new FormControl('all'),
      walletId: new FormControl('all'),
      cardId: new FormControl('all'),
      sourceType: new FormControl('all'),
      statusType: new FormControl('all'),
      fromDate: new FormControl(''),
      toDate: new FormControl(''),
      email: new FormControl('')
    });
    if (this.tableId === 20) {
      this.filterAndExportForm.controls.sourceType.setValue('WALLET');
    }
    this.walletDropdownControl.valueChanges.subscribe((value: IWalletData) => {
      this.walletDropDownChange(value);
    });
  }

  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api;
    if (params.api.getColumns()) {
      this.getAllColumns = params.api.getAllDisplayedColumns();
    }
    this.v3DataTableService.gridApi = params.api;
    const columnApi = params.api;

    this.gridApi.addEventListener('paginationChanged', () => {
      this.preSelectSelectedRows();
    });

    this.registerScrollHintListeners(params.api);
    this.registerViewportFillListeners(params.api);
    if (this.fitsHeightToViewport) {
      params.api.addEventListener('firstDataRendered', this.scheduleHeightFit);
    }

    this.gridReadyOutput.emit(params.api);

    if (this.pinColumn) {
      columnApi.applyColumnState({
        state: [
          { colId: 'id', pinned: 'left' },
          { colId: this.pinColumn, pinned: 'left' }
        ],
        defaultState: { pinned: undefined }
      });
    } else {
      columnApi.applyColumnState({
        state: [{ colId: 'id', pinned: 'left' }],
        defaultState: { pinned: undefined }
      });
    }
    this.gridApi?.setGridOption('columnDefs', this.filteredColumnDefs);
    // Defs were just swapped in, so the cached base widths came with them —
    // the reset pass is the only one that means anything here.
    this.applyLastColumnFill(true);
    if (!this.deferInitialLoad) {
      this.getTableData();
    }

    this.v3DataTableService.updateV3DataTable$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res) {
            this.selectBoxFilterChanges = res;
            this.updateDefaultPayload();
          }
        }
      });

    this.v3DataTableService.refreshV3DataTableSubject$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res) {
            this.getTableData();
          }
        }
      });

    this.v3DataTableService.updateV3DataTableByRemovingFilter$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.updateDefaultPayload(res);
        }
      });
  }

  onSortChange(event: { columnApi: { getColumnState: () => ColumnState[] } }) {
    const sortedColumn = event.columnApi
      .getColumnState()
      .find((col) => Boolean(col.sort));
    if (sortedColumn) {
      const sortModel = { colId: sortedColumn.colId, sort: sortedColumn.sort };
      this.v3DataTableService.defaultPayload.sortModel = [sortModel];
    } else {
      this.v3DataTableService.defaultPayload.sortModel = [];
    }
    this.v3DataTableService.refreshV3DataTable();
  }

  fetchFilterSettings() {
    if (!this.tableId) return;
    this.v3DataTableService
      .getTableColumnData(this.tableId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res: { data: IDtFilteredCols }) => {
        if (res) {
          this.columnOrder = res.data?.column_order;
          this.columnVisibility = res.data?.column_visibility;
          if (this.columnOrder) {
            this.changeColumnPosition(
              this.filteredColumnFields,
              this.columnOrder
            );
          }
          if (this.columnVisibility) {
            this.filteredColumnDefs = [];
            this.filteredColumnFields = this.filteredColumnFields.map(
              (columnField: IDtColumnFields) => {
                const data = columnField;
                if (
                  data.isDisabled ||
                  this.columnVisibility.includes(data.colDef?.field) ||
                  this.fieldsShownByDefault.includes(data.colDef?.field)
                ) {
                  this.filteredColumnDefs.push(data.colDef);
                  data.isChecked = true;
                } else {
                  data.isChecked = false;
                }
                return data;
              }
            );
          } else {
            this.resetColumnDefs();
          }
          if (this.columnVisibility || this.columnOrder) {
            this.gridApi?.setGridOption('columnDefs', this.filteredColumnDefs);
            // Re-apply pin after column defs rebuild
            this.gridApi?.applyColumnState({
              state: [{ colId: 'id', pinned: 'left' }]
            });
            this.applyLastColumnFill(true);
          }
          if (res.data === null) {
            const filterCols: string[] = [];
            this.filteredColumnFields.forEach((field) =>
              filterCols.push(field.colDef?.field)
            );
            this.postColumnVisibilitySetting(filterCols);
            this.columnOrderChangeUpdation();
          }
        }
      });
  }

  changeColumnPosition(
    unsortedColumnFields: IDtColumnFields[],
    order: { [key: string]: number }
  ) {
    const sortedColumnFields = unsortedColumnFields.sort(
      (curr, next) => order[curr.colDef.field] - order[next.colDef.field]
    );
    this.filteredColumnFields = sortedColumnFields;
    if (!this.columnVisibility) {
      // No saved visibility yet: rebuild in the new order, but keep whatever
      // the panel currently has checked — otherwise a Hide all / Apply done
      // before settings load would push every column back into the grid.
      this.filteredColumnDefs = this.filteredColumnFields
        .filter((columnField) => columnField.isChecked)
        .map((columnField) => columnField.colDef);
    }
  }

  refreshV3DataTable() {
    if (this.tableId === 62 && this.isPaymentTable) {
      this.v3DataTableService.isClickEyeButton = true;
    } else {
      this.v3DataTableService.isClickEyeButton = false;
    }
    this.v3DataTableService.refreshV3DataTable();
  }

  onPaginationChanged(paginationChangedResponse: PaginationChangedEvent) {
    this.v3DataTableService.CurrentPage = this.paginationCurrentPageNumber;
    this.paginationFirstRowOnPageIndex =
      paginationChangedResponse.api.getFirstDisplayedRowIndex() + 1;
    this.paginationTotalRenderedPages =
      paginationChangedResponse.api.paginationGetTotalPages();
    paginationChangedResponse.api.updateGridOptions({
      paginationPageSize: this.paginationPageSize as number
    });
    this.paginationTotalPageCount = Math.ceil(
      this.paginationTotalRowCount / this.paginationPageSize
    );

    const isLessThanFourPages = this.paginationTotalPageCount < 4;

    if (isLessThanFourPages) {
      this.paginationBoxOneNumber = 1;
      this.paginationBoxTwoNumber =
        this.paginationTotalPageCount >= 2 ? 2 : undefined;
      this.paginationBoxThreeNumber =
        this.paginationTotalPageCount >= 3 ? 3 : undefined;
      this.paginationBoxFourNumber = undefined;
      return;
    }

    const isLastPage =
      this.paginationCurrentPageNumber === this.paginationTotalPageCount;
    const isLastTwoPages =
      this.paginationCurrentPageNumber > this.paginationTotalPageCount - 2;
    const isThirdLastPage =
      this.paginationCurrentPageNumber === this.paginationTotalPageCount - 2;

    this.paginationBoxOneNumber = isLastTwoPages
      ? 1
      : this.paginationCurrentPageNumber;

    this.paginationBoxTwoNumber = (() => {
      if (isThirdLastPage) {
        return undefined;
      }
      if (isLastPage) {
        return undefined;
      }
      return this.paginationBoxOneNumber + 1;
    })();

    this.paginationBoxThreeNumber = this.paginationTotalPageCount - 1;
    this.paginationBoxFourNumber = this.paginationTotalPageCount;
  }

  onRowSelected(event: RowSelectedEvent) {
    this.rowSelected.emit(event);
    const { node } = event;
    if (node.isSelected()) {
      const includes = this.selectedRowsData.some((el) =>
        el.data?.uu_id
          ? el.data?.uu_id === node.data?.uu_id
          : el.data?.id === node.data?.id
      );
      if (!includes) {
        this.v3DataTableService.v3RowSelectionData = [
          ...this.selectedRowsData,
          node as RowNode
        ];
      }
    } else {
      this.selectedRowsData.splice(
        this.selectedRowsData.indexOf(node as RowNode),
        1
      );
      this.v3DataTableService.v3RowSelectionData = [...this.selectedRowsData];
    }
  }

  private applyVerificationRequiredFilter(
    payload: IDefaultPayload
  ): IDefaultPayload {
    const statusFilterValue = payload.filterModel?.status?.filter;
    if (statusFilterValue === '9' || statusFilterValue === 9) {
      const restFilters = { ...payload.filterModel };
      delete restFilters.status;
      return {
        ...payload,
        filterModel: restFilters,
        is_payee_bank_verification_held: 1
      };
    }
    return payload;
  }

  async getTableData(type?: 'update') {
    let payloadData: IDefaultPayload;
    if (this.v3DataTableService.defaultPayload?.startRow === 0) {
      this.paginationCurrentPageNumber = 1;
    }

    let requestPayload = {
      ...this.v3DataTableService.defaultPayload,
      ...this.postData,
      ...(this.additionalPayload() ?? {})
    };
    this.dataTableService.dataTablePayload = undefined;
    if (this.tableId === 72) {
      delete requestPayload.filterModel.txnType;
    }
    if (this.transactionType) {
      requestPayload.filterModel.txnType = {
        filterType: 'text',
        type: 'equals',
        filter: this.transactionType
      };
    }
    payloadData = requestPayload;
    if (this.v3DataTableService.rowData?.length) {
      this.v3DataTableService.rowData = [];
    }
    if (
      this.tableId === 62 &&
      this.isPaymentTable &&
      (this.paymentsService.isFromViewPage ||
        this.v3DataTableService.isClickEyeButton)
    ) {
      payloadData = {
        ...(this.v3DataTableService.dataTablePayload ?? {}),
        startRow: 0,
        endRow: this.paginationPageSize
      } as IDefaultPayload;
      if (this.v3DataTableService.dataTablePayload) {
        requestPayload = this.v3DataTableService
          .dataTablePayload as IDefaultPayload;
      }
    }
    if (this.tableId === 62 && this.isPaymentTable) {
      requestPayload = this.applyVerificationRequiredFilter(requestPayload);
    }
    this.v3DataTableService.isClickEyeButton = false;
    this.isV4DataTableLoading = true;
    this.paymentsService.isFromViewPage = false;
    const isCacheableView = this.isCacheableView(requestPayload);
    const cachedTableResponse = isCacheableView
      ? await this.dataTableCacheService.getCachedRowDataV3(
          this.tableId,
          requestPayload
        )
      : false;
    if (!requestPayload.endRow) {
      this.isV4DataTableLoading = false;
      return;
    }
    const pageWindow =
      Number(requestPayload.endRow) - Number(requestPayload.startRow ?? 0);
    const useCache = Boolean(
      cachedTableResponse?.response?.rowData?.length &&
        cachedTableResponse.response.queryGeneratedTime &&
        !this.v3DataTableService.hardRefresh()
    );
    let lastUpdatedAt;
    if (useCache) {
      lastUpdatedAt = cachedTableResponse.response.queryGeneratedTime;
      this.isV4DataTableLoading = false;
      this.appendTableRows(cachedTableResponse.response, true);
    } else {
      this.resetData();
      this.gridApi.showLoadingOverlay();
    }
    this.v3DataTableService
      .getTableListData<unknown>(this.tableId, {
        ...requestPayload,
        lastUpdatedAt
      })
      .pipe(
        this.responseMap ?? tap(() => {}),
        finalize(() => {
          if (type === 'update') {
            this.gridApi.paginationGoToPage(1);
            this.paginationCurrentPageNumber = 1;
          }
          this.isV4DataTableLoading = false;
          this.v3DataTableService.hardRefresh.set(false);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: async (res) => {
          if (
            !res.success &&
            res?.permissionType === 'page' &&
            res?.permissionRequired !==
              'international-payment-transactions-view' &&
            !this.isRechargeCreditPage
          ) {
            this.router.navigateByUrl('/v4/manage/permission-denied');
            return;
          }
          if (!res.success && res?.permissionType === 'action') {
            this.showPermssionDenied.set(true);
            return;
          }
          this.showPermssionDenied.set(false);
          this.v3DataTableService.dataTablePayload = payloadData;
          const response = { ...res };
          if (useCache) {
            const cachedResponse = { ...cachedTableResponse.response };
            if (response.rowCount < cachedResponse.rowCount) {
              await this.dataTableCacheService.deleteV3Data(this.tableId);
              this.getTableData(type);
              return;
            }
            const newRows = res.rowData.filter(
              (item) =>
                !cachedResponse.rowData.some((obj: { account_id: string }) =>
                  this.areIdsEqualInObj(item as Record<string, unknown>, obj)
                )
            );
            const updatedTableData = cachedResponse.rowData.map(
              (obj: { account_id: string }) =>
                res.rowData.find((item) =>
                  this.areIdsEqualInObj(item as Record<string, unknown>, obj)
                ) || obj
            );
            response.rowData = newRows
              .concat(updatedTableData)
              .slice(0, pageWindow);
          }
          if (isCacheableView) {
            await this.dataTableCacheService.addRowDataV3(
              this.tableId,
              requestPayload,
              response
            );
          }
          if (!(useCache && this.applyRowUpdatesInPlace(response))) {
            this.appendTableRows(response);
          }
          if (this.tableId === 62) {
            this.getCheckTrackingUrl(response);
          }
          if (this.tableId === 34 && this.initialLoad) {
            this.initialLoad = !res.rowCount;
          }
          this.dataLoaded = true;
          this.v3DataTableService.hasV3DataTableLoaded = true;
        },
        error: (err: HttpErrorResponse) => {
          this.errorOutput.emit(err);
        }
      });
  }

  /**
   * The cache holds one entry per table, so it is only consulted for the view
   * a table opens on: first page, no filters, no sort. Restricting it there
   * keeps the delta merge sound — rows cannot shift across a page boundary,
   * and new rows genuinely belong at the top.
   */
  isCacheableView(payload: IDefaultPayload): boolean {
    return (
      payload.startRow === 0 &&
      !Object.keys(payload.filterModel ?? {}).length &&
      !payload.sortModel?.length
    );
  }

  areIdsEqualInObj(
    obj1: Record<string, unknown>,
    obj2: Record<string, unknown>
  ): boolean {
    if (obj1.uu_id && obj2.uu_id === obj1.uu_id) {
      return true;
    }
    if (obj1.id && obj1.id === obj2.id) {
      return true;
    }
    if (
      obj1.zelle_reference_id &&
      obj1.zelle_reference_id === obj2.zelle_reference_id
    ) {
      return true;
    }
    return false;
  }

  /**
   * @description Maps a response's rows the same way `appendTableRows` does,
   * so an in-place update and a full reseed produce identical row objects.
   */
  private mapResponseRows(res: ICoulmnDefFieldsResponse<unknown>): unknown[] {
    if (!this.appendStaticColumnFields) {
      return res.rowData ?? [];
    }
    return (res.rowData ?? []).map((row) => ({
      ...(row as Record<string, unknown>),
      ...this.appendStaticColumnFields
    }));
  }

  /**
   * @description Pushes the authoritative rows into the row nodes the cached
   * paint already created. `setData` refreshes a row's cells without
   * destroying its DOM, so there is no visible rebuild.
   *
   * Only possible when the row count still matches — an added or removed row
   * changes the shape of the page and needs a real reseed.
   *
   * @returns true when the update was applied in place.
   */
  private applyRowUpdatesInPlace(
    res: ICoulmnDefFieldsResponse<unknown>
  ): boolean {
    const rows = this.mapResponseRows(res);
    const nodes: IRowNode[] = [];
    this.gridApi?.forEachNode((node) => nodes.push(node));
    if (!nodes.length || nodes.length !== rows.length) {
      return false;
    }
    nodes.forEach((node, index) => {
      if (!Utils.areObjectsEqual(node.data ?? {}, rows[index] ?? {})) {
        node.setData(rows[index]);
      }
    });
    this.v3DataTableService.rowData = rows;
    this.paginationTotalRowCount = res.rowCount;
    if (res.rowCount > 0) {
      this.hasEverLoadedRows = true;
    }
    this.v3DataTableService.emptyRowData.next(res.rowCount);
    this.getAttachmentCommentStatus(res.rowData);
    return true;
  }

  /**
   * @param fromCache Rows come from the IndexedDB cache while the live request
   * is still in flight, so lookups that hit the network are skipped — the
   * authoritative pass runs them moments later.
   */
  appendTableRows(res: ICoulmnDefFieldsResponse<unknown>, fromCache = false) {
    if (res.errorMsg === 'Not Authorized') {
      this.isPaymentTableHavePermission = false;
    }

    if (this.appendStaticColumnFields) {
      this.v3DataTableService.rowData = res.rowData?.map((row) => ({
        ...(row as Record<string, unknown>),
        ...this.appendStaticColumnFields
      }));
    } else {
      this.v3DataTableService.rowData = res.rowData;
    }
    if (!fromCache) {
      this.getAttachmentCommentStatus(res.rowData);
    }
    this.setServerSideData(res);
    this.paginationTotalRowCount = res.rowCount;
    if (res.rowCount > 0) {
      this.hasEverLoadedRows = true;
    } else if (!this.hasActiveFilters()) {
      // Zero rows with no filter in play means the dataset itself is empty
      // again (e.g. the last row was just deleted), not a filter matching
      // nothing — release the latch so the empty state can come back.
      this.hasEverLoadedRows = false;
    }
    this.v3DataTableService.emptyRowData.next(res.rowCount);
    if (res.success === false) {
      this.v3DataTableService.rowData = [];
    }
  }

  getAttachmentCommentStatus(res: unknown[]) {
    const rowData = [...res];
    const statusArray = this.dataTableService.getA$Cstatus(this.tableId)[0];
    if (statusArray) {
      const dataIds: string[] = [];
      rowData.forEach((element) => {
        dataIds.push(
          (element as Record<string, unknown>)[statusArray.field] as string
        );
      });
      const data = { ids: dataIds };
      this.dataTableService
        .getAddAttachmentAddComment(statusArray.dataTableName, data)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((response) => {
          if (response.success) {
            this.dataTableService.setAttachmentCommentStatus(response.data);
          }
        });
    }
  }

  setServerSideData(res: ICoulmnDefFieldsResponse<unknown>) {
    const datasource = {
      getRows: (params: IServerSideGetRowsParams) => {
        const response = { ...res };
        if (response.rowData?.length === 0) {
          params.api.showNoRowsOverlay();
        } else {
          params.api.hideOverlay();
        }
        if (response.rowData) {
          params.success({ rowData: response.rowData });
        } else {
          params.fail();
        }
      }
    };
    this.gridApi.setGridOption('serverSideDatasource', datasource);
  }

  resetData() {
    const datasource = {
      getRows: (params: IServerSideGetRowsParams) => {
        params.success({ rowData: [] });
      }
    };
    this.gridApi.setGridOption('serverSideDatasource', datasource);
  }

  getCheckTrackingUrl(res: ICoulmnDefFieldsResponse<unknown>) {
    const checkIds: string[] = [];
    (res.rowData as ICommonTransactionTableData[])?.forEach((row) => {
      if (row.cheque_status === 7) {
        checkIds.push(row?.transfer_id as string);
      }
    });
    if (checkIds?.length) {
      this.checkService.getTrackingUrl(checkIds);
    }
  }

  preSelectSelectedRows() {
    this.gridApi.forEachNode((rowFromAll) => {
      rowFromAll.setSelected(false);
      this.selectedRowsData.forEach((rowFromSelected) => {
        if (
          rowFromAll.data?.uu_id
            ? rowFromAll.data?.uu_id === rowFromSelected.data?.uu_id
            : rowFromAll.data?.id === rowFromSelected.data?.id
        ) {
          rowFromAll.setSelected(true);
        }
      });
    });
  }

  /* Pagination Functions */

  goToNextPage() {
    if (this.v3DataTableService.defaultPayload.endRow) {
      this.v3DataTableService.defaultPayload.endRow += this
        .paginationPageSize as number;
      this.v3DataTableService.defaultPayload.startRow =
        this.v3DataTableService.defaultPayload.endRow - this.paginationPageSize;
      this.v3DataTableService.refreshV3DataTable();
    }

    if (this.paginationCurrentPageNumber < this.paginationTotalPageCount) {
      this.paginationCurrentPageNumber += 1;
    }
    this.v3DataTableService.hasV3DataTableLoaded$
      .pipe(
        debounceTime(100),
        first((res) => !!res),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.gridApi.paginationGoToPage(this.paginationCurrentPageNumber);
      });
  }

  goToPreviousPage() {
    if (this.v3DataTableService.defaultPayload.endRow) {
      const pageSize = this.paginationPageSize as number;
      this.v3DataTableService.defaultPayload.endRow =
        this.v3DataTableService.defaultPayload.endRow >= 2 * pageSize
          ? this.v3DataTableService.defaultPayload.endRow - pageSize
          : pageSize;
      this.v3DataTableService.defaultPayload.startRow =
        this.v3DataTableService.defaultPayload.endRow - this.paginationPageSize;
      this.v3DataTableService.refreshV3DataTable();
    }

    if (this.paginationCurrentPageNumber > 1) {
      this.paginationCurrentPageNumber -= 1;
    }
    this.v3DataTableService.hasV3DataTableLoaded$
      .pipe(
        debounceTime(100),
        first((res) => !!res),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.gridApi.paginationGoToPage(this.paginationCurrentPageNumber);
      });
  }

  goToSpecificPage(page?: number) {
    let pageVariable = 1;

    if (page) {
      pageVariable = Math.abs(page);
    } else {
      if (!this.specificPageInput) return;
      pageVariable = Math.abs(this.specificPageInput);
    }

    if (!this.isV4DataTableLoading) {
      this.paginationPageSize = Number(this.paginationSizeSelection);

      this.paginationTotalPageCount = Math.ceil(
        this.paginationTotalRowCount / this.paginationPageSize
      );

      if (!this.paginationTotalRowCount) {
        this.v3DataTableService.defaultPayload.startRow = 0;
        this.v3DataTableService.defaultPayload.endRow = this.paginationPageSize;
        this.v3DataTableService.refreshV3DataTable();
      } else if (this.v3DataTableService.defaultPayload.endRow) {
        this.v3DataTableService.defaultPayload.endRow =
          pageVariable < this.paginationTotalPageCount
            ? pageVariable * this.paginationPageSize
            : this.paginationTotalRowCount;
        this.v3DataTableService.defaultPayload.startRow =
          pageVariable < this.paginationTotalPageCount
            ? this.v3DataTableService.defaultPayload.endRow -
              this.paginationPageSize
            : (pageVariable - 1) * this.paginationPageSize;
        this.v3DataTableService.refreshV3DataTable();
      }

      if (pageVariable > this.paginationTotalPageCount) {
        pageVariable = this.paginationTotalPageCount;
      }
      // Update the active page indicator immediately so the UI reflects the
      // page the user clicked, even if the data refresh subscription is
      // delayed or skipped.
      this.paginationCurrentPageNumber = pageVariable;
      this.v3DataTableService.hasV3DataTableLoaded$
        .pipe(
          debounceTime(100),
          first((res) => !!res),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe(() => {
          this.gridApi.paginationGoToPage(pageVariable);
          this.paginationCurrentPageNumber = pageVariable;
        });
    }
    if (this.specificPageInput !== undefined)
      this.specificPageInput = undefined;
  }

  validatePageInput(): void {
    if (this.specificPageInput === undefined || this.specificPageInput === null)
      return;
    // Remove negatives and decimals
    this.specificPageInput = Math.abs(Math.floor(this.specificPageInput));
    // Cap to max page
    if (this.specificPageInput > this.paginationTotalPageCount) {
      this.specificPageInput = this.paginationTotalPageCount;
    }
    // Clear if 0
    if (this.specificPageInput === 0) {
      this.specificPageInput = undefined;
    }
  }

  setInitialColumns(): void {
    if (!this.defaultColumnFields) this.createDefaultFieldsObject();
    if (this.deselectedColumns) {
      this.defaultColumnFields.forEach((columnField) => {
        if (
          !this.deselectedColumns.some(
            (columnName) => columnName === columnField.id
          )
        ) {
          const updatedcolumnField = columnField;
          updatedcolumnField.isChecked = false;
          this.filteredColumnFields.push(updatedcolumnField);
          this.filteredColumnDefs.push(columnField.colDef);
        } else {
          this.filteredColumnFields.push(columnField);
        }
      });
    } else if (this.defaultVisibleColumns.length > 0) {
      this.defaultColumnFields.forEach((columnField) => {
        const field = { ...columnField };
        if (this.defaultVisibleColumns.includes(field.colDef?.field)) {
          field.isChecked = true;
          this.filteredColumnDefs.push(field.colDef);
        } else {
          field.isChecked = false;
        }
        this.filteredColumnFields.push(field);
      });
    } else {
      this.defaultColumnFields.forEach((columnField) => {
        this.filteredColumnFields.push(columnField);
        this.filteredColumnDefs.push(columnField.colDef);
      });
    }
    this.lockedColumnsAlwaysVisible();
    this.captureDefaultCheckedColumns();
    this.fetchFilterSettings();
  }

  /**
   * A column marked `isDisabled` is one the picker will not let you uncheck —
   * it sits under "Always visible" in the Columns menu. `defaultVisibleColumns`
   * builds the checked set from a separate list, so a locked column can land
   * there unchecked and end up hidden with no way to bring it back. Force it
   * visible, so locked and visible mean the same thing.
   *
   * `deselectedColumns` grids are left alone: that path fills
   * `filteredColumnDefs` by its own inverted rule, and rebuilding it here would
   * change which columns those grids render.
   */
  private lockedColumnsAlwaysVisible(): void {
    if (this.deselectedColumns) return;
    let unlockedHidden = false;
    this.filteredColumnFields.forEach((item) => {
      const field = item;
      if (!field.isDisabled || field.isChecked) return;
      field.isChecked = true;
      unlockedHidden = true;
    });
    if (!unlockedHidden) return;
    this.filteredColumnDefs = this.filteredColumnFields
      .filter((field) => field.isChecked)
      .map((field) => field.colDef);
  }

  private registerScrollHintListeners(api: GridApi): void {
    const recompute = () => this.updateScrollHint();
    const refill = () => {
      this.applyLastColumnFill();
      recompute();
    };
    this.ngZone.runOutsideAngular(() => {
      ['gridSizeChanged', 'firstDataRendered'].forEach((eventName) =>
        api.addEventListener(eventName, refill)
      );
      [
        'bodyScroll',
        'columnResized',
        'columnVisible',
        'displayedColumnsChanged',
        'virtualColumnsChanged',
        'modelUpdated'
      ].forEach((eventName) => api.addEventListener(eventName, recompute));

      const container = this.elementRef.nativeElement.querySelector(
        '.v4-data-table-grid-container'
      ) as HTMLElement | null;
      if (container && !this.gridSizeObserver) {
        // gridSizeChanged does not fire for every container change (modal open,
        // sidebar collapse), so the observer refills the width as well.
        this.gridSizeObserver = new ResizeObserver(() => {
          refill();
          this.scheduleViewportFill();
        });
        this.gridSizeObserver.observe(container);
      }
    });
    this.updateScrollHint();
  }

  updateScrollHint(): void {
    const columns = this.gridApi?.getAllDisplayedColumns() ?? [];
    const columnCount = columns.filter(
      (column) => !this.selectionColumnIds.includes(column.getColId())
    ).length;
    const rightPinned = columns.some(
      (column) => column.getPinned() === 'right'
    );

    const viewport = this.elementRef.nativeElement.querySelector(
      '.ag-center-cols-viewport'
    ) as HTMLElement | null;

    this.syncFadeHeight();
    this.syncFooterScrollbar(viewport);

    let canScrollLeft = false;
    let canScrollRight = false;
    if (viewport) {
      const maxScroll = viewport.scrollWidth - viewport.clientWidth;
      canScrollLeft = viewport.scrollLeft > 1;
      canScrollRight = maxScroll > 1 && viewport.scrollLeft < maxScroll - 1;
    }

    if (
      canScrollLeft === this.scrollHintLeft &&
      canScrollRight === this.scrollHintRight &&
      columnCount === this.displayedColumnCount &&
      rightPinned === this.hasRightPinnedColumn
    ) {
      return;
    }

    this.ngZone.run(() => {
      this.scrollHintLeft = canScrollLeft;
      this.scrollHintRight = canScrollRight;
      this.displayedColumnCount = columnCount;
      this.hasRightPinnedColumn = rightPinned;
    });
  }

  /**
   * Keeps the bulk-action bar reachable on long tables. The row is pinned only while
   * rows are selected, and only once its natural position has scrolled above the
   * scroll container, so an unselected table is untouched.
   */
  private updateToolbarPin(): void {
    const row = this.toolbarRow?.nativeElement;
    if (!row || !this.showActionBar) {
      if (this.toolbarPinned) this.ngZone.run(() => this.unpinToolbar());
      return;
    }

    const anchor = this.toolbarPinned ? this.toolbarSpacer?.nativeElement : row;
    if (!anchor) return;

    const host = this.resolveScrollHost();
    const threshold = host ? host.getBoundingClientRect().top : 0;
    const anchorRect = anchor.getBoundingClientRect();
    const shouldPin = anchorRect.top < threshold;

    if (!shouldPin) {
      if (this.toolbarPinned) this.ngZone.run(() => this.unpinToolbar());
      return;
    }

    const left = Math.round(anchorRect.left);
    const width = Math.round(anchorRect.width);
    const top = Math.round(threshold);
    if (
      this.toolbarPinned &&
      this.pinnedTop === top &&
      this.pinnedLeft === left &&
      this.pinnedWidth === width
    ) {
      return;
    }

    this.ngZone.run(() => {
      this.pinnedHeight = this.toolbarPinned
        ? this.pinnedHeight
        : Math.round(row.getBoundingClientRect().height);
      this.pinnedTop = top;
      this.pinnedLeft = left;
      this.pinnedWidth = width;
      this.toolbarPinned = true;
    });
  }

  private unpinToolbar(): void {
    this.toolbarPinned = false;
    this.pinnedHeight = 0;
  }

  private resolveScrollHost(): HTMLElement | null {
    if (this.scrollHost?.isConnected) return this.scrollHost;
    let el = this.elementRef.nativeElement.parentElement as HTMLElement | null;
    while (el && el !== document.body) {
      const style = getComputedStyle(el);
      if (
        ['auto', 'scroll'].includes(style.overflowY) &&
        el.scrollHeight > el.clientHeight + 2
      ) {
        this.scrollHost = el;
        return el;
      }
      el = el.parentElement;
    }
    return null;
  }

  /**
   * The pagination footer lives inside the grid container, so a fade anchored to the
   * container would sit over the page controls. Bound it to the grid body instead,
   * stopping above the horizontal scrollbar and left of the vertical one, which it
   * would otherwise paint over.
   */
  private syncFadeHeight(): void {
    const container = this.elementRef.nativeElement.querySelector(
      '.v4-data-table-grid-container'
    ) as HTMLElement | null;
    const gridRoot = container?.querySelector(
      '.ag-root-wrapper'
    ) as HTMLElement | null;
    if (!container || !gridRoot) return;

    const horizontalScroll = container.querySelector(
      '.ag-body-horizontal-scroll'
    ) as HTMLElement | null;
    const height =
      gridRoot.offsetHeight - (horizontalScroll?.offsetHeight ?? 0);
    container.style.setProperty('--dt-fade-height', `${Math.max(0, height)}px`);

    const verticalScroll = container.querySelector(
      '.ag-body-vertical-scroll-viewport'
    ) as HTMLElement | null;
    const scrollbarWidth =
      verticalScroll &&
      verticalScroll.scrollHeight > verticalScroll.clientHeight
        ? verticalScroll.offsetWidth
        : 0;
    container.style.setProperty('--dt-fade-right', `${scrollbarWidth}px`);
  }

  /**
   * The footer scrollbar stands in for AG Grid's own, which is hidden inside V4 grids.
   * It is drawn rather than native because overlay scrollbars (Windows 11, macOS)
   * take no space and would leave the footer slot looking empty.
   */
  private syncFooterScrollbar(viewport: HTMLElement | null): void {
    const track = this.elementRef.nativeElement.querySelector(
      '.dt-footer-scroll'
    ) as HTMLElement | null;
    if (!track || !viewport) return;

    if (track !== this.footerScrollTrack) {
      this.footerScrollTrack?.removeEventListener(
        'pointerdown',
        this.onFooterScrollPointerDown
      );
      this.footerScrollTrack = track;
      this.ngZone.runOutsideAngular(() =>
        track.addEventListener('pointerdown', this.onFooterScrollPointerDown)
      );
    }

    const thumb = track.firstElementChild as HTMLElement | null;
    const maxScroll = viewport.scrollWidth - viewport.clientWidth;
    if (!thumb || !viewport.scrollWidth) return;

    const trackWidth = track.clientWidth;
    const thumbWidth = Math.max(
      24,
      (trackWidth * viewport.clientWidth) / viewport.scrollWidth
    );
    const progress = maxScroll > 0 ? viewport.scrollLeft / maxScroll : 0;
    thumb.style.width = `${thumbWidth}px`;
    thumb.style.transform = `translateX(${progress * (trackWidth - thumbWidth)}px)`;
  }

  private onFooterScrollPointerDown = (event: PointerEvent) => {
    const track = this.footerScrollTrack;
    const thumb = track?.firstElementChild as HTMLElement | null;
    const viewport = this.elementRef.nativeElement.querySelector(
      '.ag-center-cols-viewport'
    ) as HTMLElement | null;
    if (!track || !thumb || !viewport || event.button !== 0) return;
    event.preventDefault();

    const trackRect = track.getBoundingClientRect();
    const thumbRect = thumb.getBoundingClientRect();
    const travel = trackRect.width - thumbRect.width;
    const maxScroll = viewport.scrollWidth - viewport.clientWidth;
    if (travel <= 0 || maxScroll <= 0) return;

    const grabOffset =
      event.target === thumb
        ? event.clientX - thumbRect.left
        : thumbRect.width / 2;

    const scrollTo = (clientX: number) => {
      const position = Math.min(
        travel,
        Math.max(0, clientX - trackRect.left - grabOffset)
      );
      viewport.scrollLeft = (position / travel) * maxScroll;
    };

    const onMove = (moveEvent: PointerEvent) => scrollTo(moveEvent.clientX);
    const onUp = () => {
      track.classList.remove('is-dragging');
      track.removeEventListener('pointermove', onMove);
      track.removeEventListener('pointerup', onUp);
      track.removeEventListener('pointercancel', onUp);
    };

    track.setPointerCapture(event.pointerId);
    track.classList.add('is-dragging');
    track.addEventListener('pointermove', onMove);
    track.addEventListener('pointerup', onUp);
    track.addEventListener('pointercancel', onUp);
    scrollTo(event.clientX);
  };

  get showScrollHint(): boolean {
    return (
      !this.showActionBar &&
      !this.shouldShowInlineEmptyState &&
      this.displayedColumnCount > 0 &&
      (this.scrollHintLeft || this.scrollHintRight)
    );
  }

  private captureDefaultCheckedColumns(): void {
    this.defaultCheckedColumnIds = new Set(
      this.filteredColumnFields
        .filter((field) => field?.isChecked)
        .map((field) => field.id)
    );
    this.defaultColumnOrder = this.filteredColumnFields
      .map((field) => field?.colDef?.field)
      .filter(Boolean);
  }

  /**
   * `changeColumnPosition` reorders `filteredColumnFields` to the order saved on
   * the server, and Reset rebuilds the grid from that list — so without this,
   * Reset restores visibility but keeps the user's dragged order forever.
   * Payments only, by request; widen the guard if other grids want it too.
   */
  private restoreDefaultColumnOrder(): void {
    if (this.tableId !== 62 || !this.isPaymentTable) return;
    if (!this.defaultColumnOrder.length) return;
    const order: { [key: string]: number } = {};
    this.defaultColumnOrder.forEach((field, index) => {
      order[field] = index;
    });
    this.changeColumnPosition(this.filteredColumnFields, order);
  }

  updateColumnDefs() {
    this.columnChangesApplied = true;
    this.filteredColumnDefs = [];
    const filterCols: string[] = [];
    this.filteredColumnFields.forEach((item) => {
      const field = item;
      if (field.isDisabled) field.isChecked = true;
      if (field.isChecked) {
        this.filteredColumnDefs.push(field.colDef);
        filterCols.push(field.colDef.field);
      }
    });
    this.gridApi?.setGridOption('columnDefs', this.filteredColumnDefs);
    this.applyLastColumnFill(true);
    this.postColumnVisibilitySetting(filterCols);
    this.columnOrderChangeUpdation();
    if (this.gridApi?.getColumns()) {
      this.getAllColumns = this.gridApi.getAllDisplayedColumns();
    }
    this.updateScrollHint();
  }

  resetColumnDefs(isUserAction = false) {
    const hasConfiguredDefault = this.defaultCheckedColumnIds.size > 0;
    this.filteredColumnFields.forEach((item) => {
      const field = item;
      field.isChecked = hasConfiguredDefault
        ? this.defaultCheckedColumnIds.has(field.id)
        : true;
    });
    // Load-time callers only seed visibility; a saved order must survive them.
    if (isUserAction){
      this.restoreDefaultColumnOrder();
      this.alertService.successAlert({
        content: 'Columns reset to default.',
        close: true
      });
    } 
    this.updateColumnDefs();
  }

  get manageableColumnFields(): IDtColumnFields[] {
    return this.filteredColumnFields.filter(
      (field) => field && !this.selectionColumnIds.includes(field.id)
    );
  }

  private matchesColumnSearch(field: IDtColumnFields): boolean {
    const term = this.columnSearch.trim().toLowerCase();
    if (!term) return true;
    return (field.name ?? '').toLowerCase().includes(term);
  }

  get lockedColumnFields(): IDtColumnFields[] {
    return this.manageableColumnFields.filter(
      (field) => field.isDisabled && this.matchesColumnSearch(field)
    );
  }

  get visibleColumnFields(): IDtColumnFields[] {
    return this.manageableColumnFields.filter(
      (field) =>
        !field.isDisabled && field.isChecked && this.matchesColumnSearch(field)
    );
  }

  get hiddenColumnFields(): IDtColumnFields[] {
    return this.manageableColumnFields.filter(
      (field) =>
        !field.isDisabled && !field.isChecked && this.matchesColumnSearch(field)
    );
  }

  get shownColumnCount(): number {
    return this.manageableColumnFields.filter((field) => field.isChecked)
      .length;
  }

  get totalColumnCount(): number {
    return this.manageableColumnFields.length;
  }

  get hasColumnSearchResults(): boolean {
    return (
      this.lockedColumnFields.length > 0 ||
      this.visibleColumnFields.length > 0 ||
      this.hiddenColumnFields.length > 0
    );
  }

  showAllColumns() {
    this.filteredColumnFields.forEach((item) => {
      const field = item;
      if (!field.isDisabled) field.isChecked = true;
    });
  }

  hideAllColumns() {
    this.filteredColumnFields.forEach((item) => {
      const field = item;
      if (!field.isDisabled) field.isChecked = false;
    });
    // Keep at least one unpinned column so the grid never collapses to a set
    // of pinned, fixed-width columns with a blank band between them.
    const hasUnpinnedVisible = this.manageableColumnFields.some(
      (field) => field.isChecked && !field.colDef?.pinned
    );
    if (!hasUnpinnedVisible) {
      const firstManageable = this.manageableColumnFields.find(
        (field) => !field.isDisabled && !field.colDef?.pinned
      );
      if (firstManageable) firstManageable.isChecked = true;
    }
  }

  onColumnMenuOpened() {
    this.columnSearch = '';
    this.columnChangesApplied = false;
    this.columnCheckedSnapshot = new Map(
      this.filteredColumnFields.map((field) => [field.id, field.isChecked])
    );
  }

  onColumnMenuClosed() {
    if (!this.columnChangesApplied && this.columnCheckedSnapshot) {
      const snapshot = this.columnCheckedSnapshot;
      this.filteredColumnFields.forEach((item) => {
        const field = item;
        if (snapshot.has(field.id))
          field.isChecked = snapshot.get(field.id) as boolean;
      });
    }
    this.columnCheckedSnapshot = null;
    this.columnSearch = '';
  }

  headerButtonClick(data: string) {
    if (this.buttonForModal) {
      this.modalOpenClick.emit(data);
      return;
    }
    this.router.navigate([data]);
  }

  createDefaultFieldsObject() {
    if (!this.defaultColumnFields) this.defaultColumnFields = [];
    this.columnDefs.forEach((columnDef) => {
      const defaultDisabled = [
        'view',
        'amount',
        'view',
        'payee_name',
        'transaction_amount',
        'bank_account_account_name',
        'action',
        'boxId'
      ];
      if (this.defaultDisabledColumn()?.length) {
        defaultDisabled.push(...(this.defaultDisabledColumn() as string[]));
      }
      const isDisabled = defaultDisabled.includes(columnDef.field);
      if (this.tableId !== 22) {
        this.defaultColumnFields.push({
          id: columnDef.field,
          name:
            columnDef.field === 'id' || columnDef.field === 'boxId'
              ? 'Check Box'
              : (columnDef.headerName as string),
          isDisabled,
          colDef: columnDef,
          isChecked: true
        });
      } else {
        this.defaultColumnFields.push({
          id: columnDef.field,
          name: columnDef.headerName as string,
          isDisabled,
          colDef: columnDef,
          isChecked: true
        });
      }
    });
  }

  toggleColumnFields(fieldId: string) {
    this.filteredColumnFields = this.filteredColumnFields.map((item) => {
      const field = item;
      if (field.id === fieldId) field.isChecked = !field.isChecked;
      return field;
    });
  }

  postColumnVisibilitySetting(columns: string[]) {
    this.v3DataTableService
      .postcolumnVisible(this.tableId, { visibility: columns })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  preventEventPropagation(event: Event) {
    event.stopPropagation();
  }

  /**
   * True while any filter is part of the request payload. Grids that inject a
   * standing filter themselves (e.g. `txnType` on transaction tables) count as
   * filtered, so their latch keeps its current behaviour and only
   * `emptyStateScopeKey` releases it.
   */
  private hasActiveFilters(): boolean {
    const payload = this.v3DataTableService.defaultPayload;
    const filterModel = payload?.filterModel;
    if (filterModel && Object.keys(filterModel).length > 0) {
      return true;
    }

    const columnStatus = this.postData?.received_type;
    return (
      payload?.received_type !== undefined ||
      (columnStatus != null && String(columnStatus).trim() !== '')
    );
  }

  get shouldShowCustomEmptyState(): boolean {
    return (
      this.useCustomEmptyState &&
      !!this.emptyStateConfig &&
      this.dataLoaded &&
      !this.isV4DataTableLoading &&
      this.paginationTotalRowCount === 0 &&
      !this.hasEverLoadedRows
    );
  }

  /** Empty state replaces the toolbar, the grid and the pagination bar. */
  get shouldShowFullEmptyState(): boolean {
    return this.shouldShowCustomEmptyState && !this.emptyStateKeepToolbar;
  }

  /**
   * Empty state sits under a still-rendered toolbar, in the collapsed grid's
   * place. See `emptyStateKeepToolbar`.
   */
  get shouldShowInlineEmptyState(): boolean {
    return this.shouldShowCustomEmptyState && this.emptyStateKeepToolbar;
  }

  /**
   * True only while a `compact` empty state is on screen — i.e. an embedded
   * grid with no rows. It switches the host and container to a flex column so
   * the empty card fills the height the page gave the grid, lining its bottom
   * edge up with whatever sits beside it. Any other grid, and any grid with
   * rows, is untouched. The inline flavour keeps the grid in the layout, so
   * fill-height mode would fight it.
   */
  @HostBinding('class.v4-dt-fill-host')
  get isCompactEmptyStateVisible(): boolean {
    return this.shouldShowFullEmptyState && !!this.emptyStateConfig?.compact;
  }

  onEmptyStateAction(): void {
    this.emptyStateActionClick.emit();
  }

  /** Width a column would take from its defs alone, ignoring any flex. */
  private declaredColumnWidth(col: Column): number {
    const colDef = col.getColDef();
    const width = colDef.width ?? this.defaultColDef.width ?? 0;
    const minWidth = colDef.minWidth ?? this.defaultColDef.minWidth ?? 0;
    return Math.max(width, minWidth) || col.getActualWidth();
  }

  /**
   * Keeps dead space out of the grid body. Every unpinned column's natural
   * width is measured once (while it still has no flex) and cached, so hiding
   * columns — including hiding every hideable one and leaving only the locked
   * columns behind — shares the leftover viewport width across whatever is
   * still displayed, in proportion to those natural widths. Once the columns
   * outgrow the viewport again they go back to their natural widths and
   * scroll as before.
   *
   * @param resetBaseWidths drop the cached widths first — pass it whenever the
   * column defs themselves were replaced, since the widths came with them.
   */
  private applyLastColumnFill(resetBaseWidths = false): void {
    if (!this.freeColumnResize || !this.gridApi || this.isFillingColumns)
      return;

    this.isFillingColumns = true;
    try {
      if (resetBaseWidths) this.baseColumnWidths.clear();

      const cols = this.gridApi
        .getAllDisplayedColumns?.()
        ?.filter((c) => !c.getPinned());
      if (!cols?.length) return;

      const bases = cols.map((col) => {
        const colId = col.getColId();
        if (resetBaseWidths) {
          // A flexed column reports its stretched width, so the fresh defs are
          // the only trustworthy source right after they are swapped in.
          this.baseColumnWidths.set(colId, this.declaredColumnWidth(col));
        } else if (!col.getFlex()) {
          // Not stretched — this is the natural width, manual resizes included.
          this.baseColumnWidths.set(colId, col.getActualWidth());
        }
        return {
          colId,
          width: this.baseColumnWidths.get(colId) ?? col.getActualWidth()
        };
      });
      const naturalWidth = bases.reduce((sum, col) => sum + col.width, 0);
      const viewport = this.elementRef.nativeElement.querySelector(
        '.ag-center-cols-viewport'
      ) as HTMLElement | null;
      const availableWidth = viewport?.clientWidth ?? 0;

      this.gridApi.applyColumnState({
        state:
          availableWidth > naturalWidth + 1
            ? bases.map((col) => ({ colId: col.colId, flex: col.width }))
            : bases.map((col) => ({
                colId: col.colId,
                width: col.width,
                flex: null
              })),
        defaultState: { flex: null }
      });
    } finally {
      this.isFillingColumns = false;
    }
  }

  // Resizing, moving, hiding a column - or the grid container changing size -
  // can leave the centre columns narrower than the viewport, which shows up as a
  // blank strip between the last centre column and the right-pinned columns.
  // Whenever that happens the surplus is handed back to the columns that are
  // still able to grow, expressed as flex so AG Grid keeps the table full on
  // every later layout pass instead of us re-measuring it each time.
  private viewportFillFrame: number | null = null;
  private pendingFillExclusions = new Set<string>();
  private lastFillSignature = '';
  private static readonly FILL_TOLERANCE = 1;

  private registerViewportFillListeners(api: GridApi): void {
    const schedule = () => this.scheduleViewportFill();
    this.ngZone.runOutsideAngular(() => {
      api.addEventListener('columnResized', (event: ColumnResizedEvent) => {
        if (!event.finished) return;
        if (event.source === 'uiColumnResized') {
          const dragged = event.columns ?? (event.column ? [event.column] : []);
          dragged.forEach((column) =>
            this.pendingFillExclusions.add(column.getColId())
          );
        }
        schedule();
      });
      api.addEventListener('columnMoved', (event: { finished?: boolean }) => {
        if (event.finished !== false) schedule();
      });
      [
        'displayedColumnsChanged',
        'columnVisible',
        'gridSizeChanged',
        'firstDataRendered'
      ].forEach((eventName) => api.addEventListener(eventName, schedule));
    });
  }

  private scheduleViewportFill(): void {
    if (this.viewportFillFrame !== null) return;
    this.viewportFillFrame = requestAnimationFrame(() => {
      this.viewportFillFrame = null;
      this.fillViewportWidth();
    });
  }

  // Room a column has left before it hits its own maxWidth; uncapped columns can
  // swallow whatever is left over.
  private columnHeadroom(column: Column): number {
    const maxWidth = column.getMaxWidth();
    if (maxWidth == null) return Number.POSITIVE_INFINITY;
    return Math.max(0, maxWidth - column.getActualWidth());
  }

  private pickFillColumns(
    centerColumns: Column[],
    gap: number,
    excluded: Set<string>
  ): Column[] {
    const growable = centerColumns.filter(
      (column) => this.columnHeadroom(column) > 0
    );
    if (!growable.length) return [];

    // Fixed-width tables follow the "last column takes the surplus" contract,
    // so they are filled from the right; flex tables share it out.
    const ordered = this.freeColumnResize ? [...growable].reverse() : growable;
    const roomIn = (columns: Column[]) =>
      columns.reduce((room, column) => room + this.columnHeadroom(column), 0);

    // A column the user just dragged is left out, otherwise the fill would undo
    // the drag - unless the remaining columns cannot absorb the gap on their own.
    const untouched = ordered.filter(
      (column) => !excluded.has(column.getColId())
    );
    const pool =
      untouched.length && roomIn(untouched) >= gap ? untouched : ordered;

    if (!this.freeColumnResize) return pool;

    // Take columns from the right until they can hold the surplus between them.
    let room = 0;
    return pool.filter((column) => {
      if (room >= gap) return false;
      room += this.columnHeadroom(column);
      return true;
    });
  }

  private fillViewportWidth(): void {
    const api = this.gridApi;
    const excluded = this.pendingFillExclusions;
    this.pendingFillExclusions = new Set<string>();
    if (!api || api.isDestroyed()) return;

    const viewport = this.elementRef.nativeElement.querySelector(
      '.ag-center-cols-viewport'
    ) as HTMLElement | null;
    const available = viewport?.clientWidth ?? 0;
    if (!available) return;

    const centerColumns = api
      .getAllDisplayedColumns()
      .filter((column) => !column.getPinned());
    if (!centerColumns.length) return;

    const used = centerColumns.reduce(
      (width, column) => width + column.getActualWidth(),
      0
    );
    const gap = available - used;
    if (gap <= V4DataTableComponent.FILL_TOLERANCE) {
      this.lastFillSignature = '';
      return;
    }

    // Guard against re-running on a layout we have already tried to fill: the
    // state we apply fires the very events that scheduled this pass, and a gap
    // that cannot be closed (every column at its maxWidth) would loop forever.
    const signature = `${available}|${[...excluded].sort().join('&')}|${centerColumns
      .map(
        (column) =>
          `${column.getColId()}:${Math.round(column.getActualWidth())}`
      )
      .join(',')}`;
    if (signature === this.lastFillSignature) return;
    this.lastFillSignature = signature;

    const fillColumns = this.pickFillColumns(centerColumns, gap, excluded);
    if (!fillColumns.length) return;

    // Weights mirror the widths the columns already have, so the proportions on
    // screen are kept while AG Grid's own flex pass honours every min/maxWidth
    // and re-distributes whatever a capped column cannot take.
    const fillWidth =
      fillColumns.reduce(
        (width, column) => width + column.getActualWidth(),
        0
      ) || fillColumns.length;
    const state: ColumnState[] = fillColumns.map((column) => ({
      colId: column.getColId(),
      flex: Math.max(
        1,
        Math.round((column.getActualWidth() / fillWidth) * 1000)
      )
    }));
    api.applyColumnState({ state });
  }

  exportPdf(option: 'print' | 'download') {
    if (!this.v3DataTableService.rowData?.length) {
      this.alertService.warningAlert({
        content: 'No data available to export.'
      });
      return;
    }
    DataTableUtils.makeJspdf(
      option,
      this.getExportData(),
      this.exportConfig?.heading ?? '',
      this.exportConfig?.name ?? ''
    );
  }

  exportCsv() {
    if (!this.v3DataTableService.rowData?.length) {
      this.alertService.warningAlert({
        content: 'No data available to export.'
      });
      return;
    }
    const { header, rowsArr } = this.getExportData();
    const columnHeader: { data: { value: string } }[] = header.map((item) => ({
      data: { value: item ?? '' }
    }));
    const tableRows: { data: { value: string } }[][] = rowsArr.map((items) =>
      items.map((item) => ({ data: { value: item } }))
    );
    const requiredColumns = [''];
    this.gridApi.exportDataAsCsv({
      prependContent: [
        [
          {
            data: {
              value: 'Zil Money'
            }
          }
        ],
        [],
        columnHeader,
        ...tableRows,
        []
      ],
      columnKeys: requiredColumns
    });
  }

  exportExcel() {
    if (!this.v3DataTableService.rowData?.length) {
      this.alertService.warningAlert({
        content: 'No data available to export.'
      });
      return;
    }
    const { header, rowsArr } = this.getExportData();
    const columnHeader: {
      data: { value: string; type: ExcelDataType | ExcelOOXMLDataType };
    }[] = header.map((item) => ({
      data: { value: item ?? '', type: 'String' }
    }));
    const tableRows: {
      cells: {
        data: { value: string; type: ExcelDataType | ExcelOOXMLDataType };
      }[];
    }[] = rowsArr.map((items) => ({
      cells: items.map((item) => ({ data: { value: item, type: 'String' } }))
    }));
    const requiredColumns = [''];
    this.gridApi.exportDataAsExcel({
      prependContent: [
        {
          cells: [
            {
              data: {
                value: 'Zil Money',
                type: 'String'
              }
            }
          ]
        },
        { cells: [] },
        { cells: columnHeader },
        ...tableRows,
        { cells: [] }
      ],
      columnKeys: requiredColumns,
      columnWidth: 100
    });
  }

  sendEmail() {
    this.getExcelFile();
    const emailRef = this.dialog.open(ExportToEmailV4Component, {
      width: '480px',
      maxWidth: '95%',
      panelClass: 'paddingless-modal-rounded',
      disableClose: true
    });

    emailRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(
        (res: {
          send: boolean;
          emailId: string;
          subject: string;
          message: string;
        }) => {
          if (res?.send) {
            const excelFile = new File(
              [this.exportedFile as Blob],
              'exported_data.xlsx',
              {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
              }
            );
            const formData = new FormData();
            formData.append('emailTo', res.emailId);
            formData.append('emailSubject', res.subject);
            if (res.message) {
              formData.append('message', res.message);
            }
            formData.append('hiddenEmailContent', excelFile as Blob);
            this.dataTableService
              .sendEmail(formData)
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe((data) => {
                if (data?.success) {
                  this.alertService.successAlert({
                    content: 'Email has been sent.',
                    close: true
                  });
                }
              });
          }
        }
      );
  }

  getExcelFile() {
    const { header, rowsArr } = this.getExportData();
    const columnHeader: {
      data: { value: string; type: ExcelDataType | ExcelOOXMLDataType };
    }[] = header.map((item) => ({
      data: { value: item ?? '', type: 'String' }
    }));

    const tableRows: {
      cells: {
        data: { value: string; type: ExcelDataType | ExcelOOXMLDataType };
      }[];
    }[] = rowsArr.map((items) => ({
      cells: items.map((item) => ({ data: { value: item, type: 'String' } }))
    }));
    const requiredColumns = [''];

    const excelData: Blob = this.gridApi.getDataAsExcel({
      prependContent: [
        {
          cells: [
            {
              data: {
                value: 'Zil Money',
                type: 'String'
              }
            }
          ]
        },
        { cells: [] },
        { cells: columnHeader },
        ...tableRows,
        { cells: [] }
      ],
      columnKeys: requiredColumns,
      columnWidth: 100
    }) as Blob;

    this.exportedFile = excelData;
  }

  getExportData() {
    const paginationSize = this.gridApi?.paginationGetPageSize();
    const currentPage = this.gridApi.paginationGetCurrentPage();
    const startRowIndex = paginationSize * currentPage;
    const endRowIndex = startRowIndex + paginationSize;
    const ignoreColumns = [
      'id',
      'action',
      'view',
      'boxId',
      ...(this.exportConfig?.ignoreColumns ?? [])
    ];
    const rows: RowNode['data'] = [];
    this.gridApi.forEachNode((node: IRowNode) => {
      if (
        (node?.rowIndex || node?.rowIndex === 0) &&
        node?.rowIndex >= startRowIndex &&
        node?.rowIndex < endRowIndex
      ) {
        rows.push(node.data);
      }
    });
    const colNames: {
      [x: string]: {
        name: string;
        cellRenderer?: (event?: {
          data: unknown;
          value: string;
          getData: boolean;
        }) => void;
      };
    } = {};
    this.getAllColumns = this.gridApi.getAllDisplayedColumns();
    type ColDefWithExport = ColDef & {
      cellRendererForExport?: (event?: {
        data: unknown;
        value: string;
      }) => void;
    };
    type ExportCellRenderer = (event?: {
      data: unknown;
      value: string;
    }) => void;
    this.getAllColumns.forEach((col: Column) => {
      const colDef = col.getColDef() as ColDefWithExport;
      const obj: {
        name: string;
        cellRenderer?: ExportCellRenderer;
      } = { name: colDef.headerName ?? '' };
      if (
        colDef.cellRendererForExport &&
        typeof colDef.cellRendererForExport === 'function'
      ) {
        obj.cellRenderer = colDef.cellRendererForExport;
      } else if (
        colDef.valueGetter &&
        typeof colDef.valueGetter === 'function'
      ) {
        obj.cellRenderer = colDef.valueGetter as unknown as ExportCellRenderer;
      } else if (
        colDef.cellRenderer &&
        typeof colDef.cellRenderer === 'function'
      ) {
        obj.cellRenderer = colDef.cellRenderer as unknown as ExportCellRenderer;
      }
      const fieldKey =
        colDef.field != null ? String(colDef.field) : col.getColId();
      colNames[fieldKey] = obj;
    });
    const columnNames = Object.keys(colNames);
    const header: (string | undefined)[] = [];
    for (let i = 0; i < columnNames.length; i += 1) {
      if (!ignoreColumns.includes(columnNames[i])) {
        header.push(colNames[columnNames[i]].name);
      }
    }
    const rowsArr: string[][] = [];
    for (let r = 0; r < rows.length; r += 1) {
      const row1 = [];
      for (let i = 0; i < columnNames.length; i += 1) {
        if (
          colNames[columnNames[i]].cellRenderer &&
          !ignoreColumns.includes(columnNames[i])
        ) {
          const cellValue = colNames[columnNames[i]].cellRenderer?.({
            data: rows[r],
            value: rows[r][columnNames[i]],
            getData: true
          });

          const sanitizedValue =
            cellValue != null ? String(cellValue).replace(/<[^>]*>/g, '') : '';
          row1.push(sanitizedValue);
        } else if (!ignoreColumns.includes(columnNames[i])) {
          const value = rows[r][columnNames[i]];
          let sanitizedValue = '';
          if (value !== null) {
            sanitizedValue =
              typeof value === 'object' && 'name' in value
                ? value.name.replace(/<[^>]*>/g, '')
                : String(value).replace(/<[^>]*>/g, '');
          }
          row1.push(sanitizedValue);
        }
      }
      rowsArr.push(row1);
    }
    return { header, rowsArr };
  }

  bankAccountOrPayeeTableExport(type: 'csv' | 'xlsx' | 'pdf', all: boolean) {
    let fromDate: string | Date;
    let toDate: string | Date;
    if (all) {
      fromDate = new Date(2000, 1, 1);
      toDate = new Date();
    } else {
      fromDate =
        this.filterAndExportForm.value.fromDate || new Date(2000, 1, 1);
      toDate = this.filterAndExportForm.value.toDate || new Date();
    }
    this.bankAccountsOrPayeeExportEvent.emit({
      all,
      fromDate,
      toDate,
      fileFormat: type
    });
  }

  checkDraftTableExport(type: 'csv' | 'pdf', all?: boolean) {
    let fromDate: string | Date;
    let toDate: string | Date;
    if (all) {
      fromDate = this.convertDate(new Date(2000, 0, 1)) as string;
      toDate = this.convertDate(new Date()) as string;
    } else {
      fromDate = this.convertDate(
        this.filterAndExportForm.value.fromDate || new Date(2000, 1, 1),
        true
      ) as string;
      toDate = this.convertDate(
        this.filterAndExportForm.value.toDate || new Date(),
        true
      ) as string;
    }

    const currentColumns: string[] = [];
    this.gridApi.getColumnState().forEach((el) => {
      if (el.colId !== 'boxId' && el.colId !== 'action_field') {
        currentColumns.push(el.colId);
      }
    });

    const fields = currentColumns.map((item) => {
      const dotIndex = item.indexOf('.');
      return dotIndex !== -1 ? item.slice(dotIndex + 1) : item;
    });

    this.checkDraftExportEvent.emit({
      type,
      items: fields,
      fromDate,
      toDate
    });
  }

  filterAndExport(
    type: 'csv' | 'xlsx' | 'pdf',
    exportAll: boolean | undefined
  ) {
    if (this.tableId === 93 || this.tableId === 94) {
      this.reportExportEvent.emit(type);
      return;
    }
    if (this.tableId === 16) {
      this.checkDraftTableExport(type as 'csv' | 'pdf', exportAll ?? false);
      return;
    }
    if (this.tableId === 9) {
      this.bankAccountOrPayeeTableExport(
        type as 'csv' | 'pdf',
        exportAll ?? false
      );
      return;
    }
    if (this.tableId === 79) {
      this.bankAccountOrPayeeTableExport(type, exportAll ?? false);
      return;
    }
    if (this.tableId === 85) {
      this.cloudTableExport(type);
      return;
    }

    if ([2, 3, 4, 21].includes(this.tableId)) {
      this.filterAndExportAllData(type as 'csv' | 'pdf', exportAll ?? false);
      return;
    }

    if (this.tableId === 29 || this.tableId === 38) {
      const body = this.filterAndExportForm.value;
      const fromDate = this.convertDate(body.fromDate ?? '', true);
      const toDate = this.convertDate(body.toDate ?? '', true);
      this.cashExpenseExportEvent.emit({
        bankAccountId: body.bankAccountId ?? 'all',
        fromDate: fromDate ?? '01/01/1970',
        toDate: toDate ?? '',
        type: type === 'csv' ? 'csv' : 'xlsx'
      });
      return;
    }

    const paginationSize = this.gridApi.paginationGetPageSize();
    if (paginationSize) {
      if (this.tableId === 20) {
        this.exportFilteredWalletData();
        return;
      }

      if (this.tableId === 86 || this.tableId === 87) {
        this.exportAchTransferData();
        return;
      }

      const exportApi = (body: Record<string, string>) => {
        this.v3DataTableService
          .filterAndExport({ ...body, type })
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: (res) => {
              if (res.success) {
                if (res.data.url) {
                  window.location.href = res.data.url;
                } else {
                  this.filterAndExportForm.controls.email.setValue(null);
                  this.alertService.successAlert({
                    content:
                      res.data.message ||
                      'Exporting file Please check your email',
                    close: true,
                    timeout: 2000
                  });
                }
              }
            },
            error: (err) => {
              if (err.error.errorCode === 7) {
                this.alertService
                  .infoAlert({
                    content: err.error.errorMsg,
                    isInputRequired: true,
                    title: 'Export Limit Exceeded',
                    inputPlaceholder: 'Enter email address',
                    isOk: false,
                    isCancel: true
                  })
                  .afterClosed()
                  .pipe(takeUntilDestroyed(this.destroyRef))
                  .subscribe((res) => {
                    if (res && typeof res === 'object' && 'inputValue' in res) {
                      this.filterAndExportForm.controls.email.setValue(
                        res.inputValue
                      );
                      this.filterAndExport(type, exportAll);
                    }
                  });
              }
            }
          });
      };

      const body = this.filterAndExportForm.value;

      if (exportAll) {
        type KeyType = keyof IFilterAndExportForm;
        Object.keys(body).forEach((key) => {
          if (
            (key as KeyType) !== 'fromDate' &&
            (key as KeyType) !== 'toDate' &&
            (key as KeyType) !== 'email'
          ) {
            body[key as KeyType] = 'all';
          } else if ((key as KeyType) === 'fromDate') {
            body[key as KeyType] = '01/01/1970';
          } else if ((key as KeyType) === 'toDate') {
            body[key as KeyType] = '';
          }
        });
        exportApi(body as Record<string, string>);
        return;
      }

      if (body.sourceType === 'BANK') {
        body.cardId = 'all';
        body.walletId = 'all';
      }

      if (body.sourceType === 'CARD') {
        body.bankAccountId = 'all';
        body.walletId = 'all';
      }

      if (body.sourceType === 'WALLET') {
        body.bankAccountId = 'all';
        body.cardId = 'all';
      }

      if (body.sourceType === 'all') {
        body.walletId = 'all';
        body.bankAccountId = 'all';
        body.cardId = 'all';
      }

      body.fromDate = body.fromDate
        ? this.datePipe.transform(body.fromDate, 'shortDate')
        : body.fromDate;
      body.toDate = body.toDate
        ? this.datePipe.transform(body.toDate, 'shortDate')
        : body.toDate;

      exportApi(body as Record<string, string>);
    }
  }

  filterAndExportAllData(type: 'csv' | 'pdf', all?: boolean) {
    let fromDate: string | Date;
    let toDate: string | Date;
    if (all) {
      fromDate = this.convertDate(new Date(2000, 0, 1)) as string;
      toDate = this.convertDate(new Date()) as string;
    } else {
      fromDate = this.convertDate(
        this.filterAndExportForm.value.fromDate || new Date(2000, 1, 1),
        true
      ) as string;
      toDate = this.convertDate(
        this.filterAndExportForm.value.toDate || new Date(),
        true
      ) as string;
    }
    const currentColumns: string[] = [];
    let excludingFields: string[] = [];

    if (this.tableId === 3) {
      excludingFields = [
        'boxId',
        'action',
        'received_check_lists.is_editable',
        'uu_id'
      ];
    } else if (this.tableId === 4) {
      excludingFields = ['id', 'action'];
    } else if (this.tableId === 2) {
      excludingFields = ['id', 'id_1'];
    } else if (this.tableId === 21) {
      excludingFields = ['action'];
    }

    this.gridApi.getColumnState().forEach((el) => {
      if (!excludingFields.includes(el.colId)) {
        currentColumns.push(el.colId);
      }
    });
    let fields: string[] = [];
    if (this.tableId !== 21) {
      fields = currentColumns.map((item) => {
        const dotIndex = item.indexOf('.');
        return dotIndex !== -1 ? item.slice(dotIndex + 1) : item;
      });
    } else {
      fields = currentColumns.map((item) => {
        if (item === 'amount') {
          return 'credit';
        }
        if (item === 'financial_statements.amount') {
          return 'debit';
        }
        return item;
      });
    }

    if (this.tableId === 3) {
      fields.forEach((data, idx) => {
        if (this.tableId === 3 && data === 'bank_account_account_name') {
          fields[idx] = 'check_from_name';
        } else if (this.tableId === 3 && data === 'nick_name') {
          fields[idx] = 'print_by_name';
        }
      });
    }
    this.resetDateFilter();
    this.tableExportEvent.emit({
      type,
      items: fields,
      fromDate,
      toDate,
      received_type:
        typeof this.selectedStatus === 'number'
          ? this.selectedStatus
          : this.selectedStatus?.type,
      received_type_status:
        typeof this.selectedStatus === 'object'
          ? this.selectedStatus?.status
          : undefined
    });
  }

  resetDateFilter() {
    this.selectedDateService.setValue('All Time');
    this.filterAndExportForm.controls.fromDate.setValue(
      new Date(2000, 1, 1).toISOString()
    );
    this.filterAndExportForm.controls.toDate.setValue(new Date().toISOString());
  }

  cloudTableExport(type: 'csv' | 'xlsx' | 'pdf') {
    const fromDate =
      this.filterAndExportForm.value.fromDate || new Date(2000, 1, 1);
    const toDate = this.filterAndExportForm.value.toDate || new Date();
    this.CloudExportEvent.emit({
      fromDate,
      toDate,
      fileFormat: type
    });
  }

  exportFilteredWalletData() {
    const body = this.filterAndExportForm.value;
    const fromDate = this.convertDate(body.fromDate ?? '');
    const toDate = this.convertDate(body.toDate ?? '');
    const filterBody = {
      walletId: body.walletId ?? 'all',
      fromDate: fromDate ?? '01/01/1970',
      toDate: toDate ?? ''
    };
    this.filterAndExportLoading = true;
    this.dataTableService
      .filterAndExportWallet(filterBody)
      .pipe(
        finalize(() => {
          this.filterAndExportLoading = false;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res) {
          window.location.href = res.data;
          this.filterAndExportForm.controls.walletId.setValue('all');
          this.walletDropdownControl.setValue(null);
          this.filterAndExportForm.controls.fromDate.setValue('');
          this.filterAndExportForm.controls.toDate.setValue('');
          this.isFilterAndExportShown = false;
        }
      });
  }

  exportAchTransferData() {
    const body = this.filterAndExportForm.value;
    const fromDate = this.convertDate(body.fromDate ?? '');
    const toDate = this.convertDate(body.toDate ?? '');
    const filterBody = {
      status: body.statusType ?? 'all',
      fromDate: fromDate ?? '01/01/1970',
      toDate: toDate ?? ''
    };
    const apiEndPoint =
      this.tableId === 86
        ? 'ach-transfer-request'
        : 'manual-ach-transfer-request';
    this.filterAndExportLoading = true;
    this.dataTableService
      .filterAndExportAchTransfer(filterBody, apiEndPoint)
      .pipe(
        finalize(() => {
          this.filterAndExportLoading = false;
          this.isFilterAndExportShown = false;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res) {
          window.location.href = res.data;
          this.filterAndExportForm.controls.statusType.setValue('all');
        }
      });
  }

  convertDate(date: Date | number | string, shortDate?: boolean) {
    if (shortDate) {
      return this.datePipe.transform(date, 'shortDate');
    }
    return this.datePipe.transform(date, 'MM/dd/YYYY');
  }

  bankDropDownChange(event: IBankDropdown) {
    this.filterAndExportForm.controls.bankAccountId.setValue(
      event?.id ?? 'all'
    );
  }

  cardDropDownChange(event: IExistingCreditCards) {
    this.filterAndExportForm.controls.cardId.setValue(event?.cardId ?? 'all');
  }

  walletDropDownChange(event: IWalletData) {
    this.filterAndExportForm.controls.walletId.setValue(event?.id ?? 'all');
  }

  filterAndExportDateChange(event: { start: string; end: string }) {
    this.filterAndExportForm.controls.fromDate.setValue(event.start);
    this.filterAndExportForm.controls.toDate.setValue(event.end);
  }

  switchFilterAndExport(event: Event) {
    event.stopPropagation();
    this.isFilterAndExportShown = !this.isFilterAndExportShown;
  }

  updateDefaultPayload(removeFilter?: string[]) {
    if (this.tableId === 62 && this.isPaymentTable) {
      this.v3DataTableService.updatePayloadData(removeFilter);
    }
    if (this.selectBoxFilterChanges) {
      this.v3DataTableService.defaultPayload = {
        ...this.v3DataTableService.defaultPayload,
        startRow: 0,
        endRow: this.paginationPageSize
      };

      this.v3DataTableService.defaultPayload.filterModel = {
        ...this.v3DataTableService.defaultPayload.filterModel,
        ...this.selectBoxFilterChanges
      };
      this.selectBoxFilterChanges = undefined;
    }

    if (removeFilter) {
      for (let i = 0; i < removeFilter.length; i += 1) {
        delete this.v3DataTableService.defaultPayload.filterModel[
          removeFilter[i]
        ];
      }
    }
    this.v3DataTableService.defaultPayloadUpdated = true;
  }

  getTableDataOnPayloadUpdate() {
    this.v3DataTableService.defaultPayloadUpdated$
      .pipe(debounceTime(600), takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res === true) {
          this.getTableData('update');
        }
      });
  }

  getColumnMoveEvent() {
    this.columnMovedSubject
      .pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.applyLastColumnFill();
        this.columnOrderChangeUpdation();
      });
  }

  onColumnMoved() {
    this.columnMovedSubject.next();
  }

  columnOrderChangeUpdation() {
    const cols = this.gridApi?.getAllGridColumns();
    const colToNameFunc = (col: { getId: () => string }) => col.getId();
    const colToIndexFunc = (_col: unknown, index: number) => index;

    this.colName = cols?.map(colToNameFunc);
    this.colIndex = cols?.map(colToIndexFunc);

    const result: { [key: string]: number } = {};
    this.colName?.forEach((key: string, i: number) => {
      result[key] = this.colIndex[i];
    });
    this.tableMovePositionData = { order: result };

    this.dataTableService
      .postcolumnOrder(this.tableId, this.tableMovePositionData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
    this.changeColumnPosition(this.filteredColumnFields, result);
  }

  identity(item: number) {
    return item;
  }

  viewToggle(val: boolean) {
    if (
      this.dynamicHeaderText === 'Payees' ||
      this.dynamicHeaderText === 'Vendors'
    ) {
      this.payeeService.isGridViewSignal.set(val);
    } else {
      this.bankService.setGrid(val);
    }
  }

  onEyeButtonClick() {
    this.v3DataTableService.v3EyeButton$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res) {
          this.v3DataTableService.isClickEyeButton = true;
        } else {
          this.v3DataTableService.isClickEyeButton = false;
        }
      });
  }

  isPostDataChanges() {
    if (this.tableId === 42) {
      this.v3DataTableService.postData$
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((res) => {
          if (res) {
            this.postData = res;
            this.getTableData();
          }
        });
    }
    if (this.tableId === 33 || this.tableId === 92) {
      this.v3DataTableService.routingNumber
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((res) => {
          if (res) {
            this.routingNumber = res;
            this.postData = { ...this.routingNumber };
            this.getTableData();
          }
        });
    }
    this.requestPaymentsService
      .getReceivedTypes()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res && res !== null) {
          if (res?.status) {
            this.postData = {
              received_type: res.type,
              received_type_status: res.status
            };
            this.getTableData();
          } else {
            this.postData = { received_type: res as IReceivedTypes };
            this.getTableData();
          }
        } else {
          this.postData = {};
        }
      });
  }

  importFilteredPayeeData(fileType: string) {
    if (!this.v3DataTableService.rowData?.length) {
      this.alertService.warningAlert({
        content: 'No data available to export.'
      });
      return;
    }
    const currentColumns: string[] = [];
    this.gridApi.getColumnState().forEach((el) => {
      if (
        el.colId !== 'boxId' &&
        el.colId !== 'action' &&
        el.colId !== 'actions'
      ) {
        currentColumns.push(el.colId);
      }
    });
    this.filterAndExportLoading = true;
    const payload = {
      type: fileType,
      items: currentColumns
    };
    this.dataTableService
      .payeeFilterAndExportAll(payload)
      .pipe(
        finalize(() => {
          this.filterAndExportLoading = false;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          if (res.message) {
            this.alertService.successAlert({ content: res.message });
          } else if (res?.data?.url) {
            window.location.href = res.data.url;
          }
        }
      });
  }

  exportMenuClosed() {
    this.isFilterAndExportShown = false;
  }

  onPanelButtonClick(btnId: string | number) {
    this.onHeaderButtonClick(btnId);
    this.selectedPanelButton.set(btnId);
  }

  pendingBadgeDismissed = signal(false);

  get showPendingApprovalBadge(): boolean {
    const pending = this.headerElements()?.pendingItems;
    return !!pending && !!pending.pendingCount && !this.pendingBadgeDismissed();
  }

  /**
   * `itemName` is a plural noun ("Bills", "Checks"). The badge reads it mid-sentence,
   * so lower-case it and drop the plural for a count of one rather than invent a
   * second field on every caller.
   */
  get pendingApprovalLabel(): string {
    const pending = this.headerElements()?.pendingItems;
    const name = (pending?.itemName ?? 'items').toLowerCase();
    return pending?.pendingCount === 1 ? name.replace(/s$/, '') : name;
  }

  dismissPendingBadge(event: Event): void {
    event.stopPropagation();
    this.pendingBadgeDismissed.set(true);
  }

  /**
   * The bulk-selection bar has a single render site: the toolbar row. It keeps that row
   * visible even when the filter bar is suppressed, otherwise tables with
   * `showFilterBar = false` would lose the bar entirely.
   */
  get showActionBar(): boolean {
    return this.selectedRowCount > 0 && this.showFloatingActionBar();
  }

  /**
   * Destructive intent wins over everything else so a delete action never renders as a
   * neutral navy button. Legacy buttons express it either through the button type or
   * through a red background token, so both are checked.
   */
  private headerActionStyle(
    btn: IV3CommonButton
  ): NonNullable<IV4HeaderAction['style']> {
    const typeStyle =
      typeof btn.type === 'object' ? String(btn.type.style) : undefined;
    const background = btn.backGroundInput ?? '';
    if (typeStyle === 'destructive' || /error|danger|red/i.test(background)) {
      return 'danger';
    }
    return typeStyle === 'primary' ? 'primary' : 'navy';
  }

  onHeaderButtonClick(btnId: string | number) {
    const selectedRows = this.selectedRowsData.map((item) => item.data);
    this.headerButtonEvent.emit({
      id: btnId,
      selectedRows,
      tableId: this.tableId
    });
  }

  onRowClick(event: RowClickedEvent): void {
    this.rowClicked.emit(event);
  }

  onBackButtonClick() {
    if (this.prevoiusUrl()) {
      this.router.navigate([this.prevoiusUrl()]);
    } else {
      this.location.back();
    }
  }

  isShowFilterMenu(tableId: number) {
    const filterOptions = [
      2, 3, 4, 9, 16, 20, 21, 27, 29, 38, 79, 85, 86, 87, 96, 97
    ];
    return filterOptions.includes(tableId);
  }

  isShowFilterMenuOptions(tableId: number) {
    const filterOptions = [27, 20, 86, 16, 21, 85, 79, 2, 9, 3, 4, 29, 38, 87];
    return filterOptions.includes(tableId);
  }

  isHideSourceType(tableId: number) {
    const hideSourceType = [29, 38, 27, 20, 86, 16, 21, 85, 79, 2, 9, 3, 4, 87];
    return hideSourceType.includes(tableId);
  }

  clearSelection() {
    this.gridApi?.deselectAll();
    this.v3DataTableService.v3RowSelectionData = [];
  }

  ngOnDestroy() {
    this.heightFitObserver?.disconnect();
    this.heightFitObserver = null;
    window.removeEventListener('resize', this.scheduleHeightFit);
    if (this.heightFitFrame !== null) {
      cancelAnimationFrame(this.heightFitFrame);
      this.heightFitFrame = null;
    }

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    if (this.gridSizeObserver) {
      this.gridSizeObserver.disconnect();
      this.gridSizeObserver = null;
    }

    if (this.viewportFillFrame !== null) {
      cancelAnimationFrame(this.viewportFillFrame);
      this.viewportFillFrame = null;
    }

    if (this.toolbarPinFrame !== null) {
      cancelAnimationFrame(this.toolbarPinFrame);
      this.toolbarPinFrame = null;
    }

    document.removeEventListener('scroll', this.onDocumentScroll, true);
    window.removeEventListener('resize', this.onDocumentScroll);
    this.footerScrollTrack?.removeEventListener(
      'pointerdown',
      this.onFooterScrollPointerDown
    );
    this.footerScrollTrack = null;

    this.v3DataTableService.rowData = [];
    this.dataTableService.selectedCellValueSignal.set(undefined);
  }
}

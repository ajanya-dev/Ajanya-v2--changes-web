import {
  ICommonTransactionTableData,
  IDtFilteredCols
} from 'src/app/models/v3-common';
import { finalize, debounceTime, tap } from 'rxjs/operators';
import { Utils } from 'src/app/data/utils';
import {
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
  inject,
  Component,
  Input,
  input,
  model,
  signal,
  OnChanges,
  ElementRef,
  AfterViewInit,
  NgZone
} from '@angular/core';
import {
  ICoulmnDefFields,
  IDefaultPayload,
  ISelectBoxFilterValues
} from 'src/app/models/v3-datatable';
import { OperatorFunction, Subject, Subscription } from 'rxjs';
import {
  ColDef,
  Column,
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
  RowClickedEvent
} from '@ag-grid-community/core';
import {
  IDtColumnFields,
  ISelectedSingleRow
} from 'src/app/modules/data-table/model/datatable';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import {
  DataTableService,
  IDtSelectSingleIdSubject
} from 'src/app/shared/service/data-table/data-table.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { DataTableUtils } from 'src/app/modules/data-table/components/data-table-utils';
import { ExportToEmailComponent } from 'src/app/modules/data-table/modals/export-to-email/export-to-email.component';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import {
  DatePipe,
  Location,
  NgClass,
  NgFor,
  NgIf,
  NgStyle
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
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { MatTooltip } from '@angular/material/tooltip';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { AgGridAngular } from '@ag-grid-community/angular';
import { HttpErrorResponse } from '@angular/common/http';
import { receivedCheckStatus } from 'src/app/modules/receive-payments/data/receive-payments-data';
import { PermissionDeniedComponent } from 'src/app/shared/components/permission-denied/permission-denied.component';
import { DropDownBankCashComponent } from 'src/app/modules/Cash-Expense/components/drop-down-bank-cash/drop-down-bank-cash.component';
import { ICoulmnDefFieldsResponse } from '../../../../models/v3-datatable';
import { V3DataTableService } from '../../services/v3-data-table.service';
import { ICashExpenseExport, IV3DtHeaderElements } from '../../models/v3-data-table';
import { DateRangeComponent } from '../../../../shared/components/date-range/date-range.component';
import { DropDownWalletComponent } from '../../../../shared/components/drop-downs/drop-down-wallet/drop-down-wallet.component';
import { DropDownCardComponent } from '../../../../shared/components/drop-downs/drop-down-card/drop-down-card.component';
import { DropDownBankComponent } from '../../../../shared/components/drop-downs/drop-down-bank/drop-down-bank.component';
import { DemoVideoComponent } from '../../../../shared/components/demo-video/demo-video.component';
import { CommonButtonV35Component } from '../../../../shared/v3/buttons/common-button-v35/common-button-v35.component';
import { ListViewToggleComponent } from '../../../../shared/v3/common-components/list-view-toggle/list-view-toggle.component';
import { CommonBackButtonV35Component } from '../../../../shared/v3/buttons/common-back-button-v35/common-back-button-v35.component';

export interface ColStateType extends ColumnState {
  name?: string;
  cellRenderer?: (event?: {
    data: unknown;
    value: string;
    getData: boolean;
  }) => void;
}

export class CustomLoadingCellRenderer {
  eGui = document.createElement('div');
  init() {
    this.eGui.innerHTML = `
      <div class="ag-custom-loading-cell" style="padding-left: 10px; line-height: 25px;">
        <i class="fas fa-spinner fa-pulse"></i> <span>Loading..</span>
      </div>
    `;
  }

  getGui() {
    return this.eGui;
  }
}

export class NoRowsCellRenderer {
  eGui = document.createElement('div');
  init() {
    this.eGui.innerHTML = `
      <div class="ag-custom-loading-cell" style="padding-left: 10px; line-height: 25px;">
        <span>Sorry! No results found</span>
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
  selector: 'app-v3-data-table',
  templateUrl: './v3-data-table.component.html',
  styleUrls: ['./v3-data-table.component.scss'],
  standalone: true,
  imports: [
    NgClass,
    NgStyle,
    CommonBackButtonV35Component,
    ListViewToggleComponent,
    FaIconComponent,
    CommonButtonV35Component,
    MatMenuTrigger,
    MatMenu,
    MatMenuItem,
    DemoVideoComponent,
    MatTooltip,
    FormsModule,
    NgFor,
    MatProgressSpinner,
    NgIf,
    AgGridAngular,
    ReactiveFormsModule,
    DropDownBankComponent,
    DropDownCardComponent,
    DropDownWalletComponent,
    DateRangeComponent,
    PermissionDeniedComponent,
    DropDownBankCashComponent
  ]
})
export class V3DataTableComponent implements OnInit, OnChanges, OnDestroy, AfterViewInit {
  /* Injectors */
  public v3DataTableService = inject(V3DataTableService);
  public router = inject(Router);
  private dialog = inject(MatDialog);
  private dataTableService = inject(DataTableService);
  private alertService = inject(AlertService);
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

  /* Variables */
  isPaymentTableHavePermission = true;

  @Input() public columnDefs: ICoulmnDefFields[];
  @Input() public defaultColumnFields: IDtColumnFields[];
  /**
   * @description To select or deselect columns and also to control behavior of columns.
   * Make changes only if necessary. Try and use `this.filteredColumnFields` for mutating operations.
   */

  @Input() public frameworkComponents = {};
  @Input() public isPaymentsFilterEnabled = false;
  @Input() public tableId: number;
  @Input() public domLayout: DomLayoutType = 'autoHeight';
  @Input() public rowHeight = 35;
  @Input() public isRowSelectable: IsRowSelectable;
  @Input() public paginationPageSize = 50;
  @Input() public rowSelection: 'single' | 'multiple' = 'multiple';
  @Input() public pinColumn: string | undefined;
  @Input() public deselectedColumns: string[];
  @Input() public dynamicHeaderText = '';
  @Input() public dynamicHeaderButtonText = '';
  @Input() public dynamicHeaderButtonRoute = '';
  @Input() public dynamicHeaderButtonColor: 'blue' | 'green' = 'green';
  @Input() public buttonForModal = false;
  @Input() public iconClass = '';
  @Input() fieldsShownByDefault: string[] = [];
  @Input() public appendStaticColumnFields: object;
  @Input() public showActionButtonContainer: boolean = true;
  @Input() public tableHeight: string;
  @Input() public adjustHeightCondition: boolean = false;
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
  
  /**
   * @description Mapper function to map the response data to the row data 
   * if passed null then tap operator will not be used and the row data will be returned as is.
   */
  @Input() responseMap?: OperatorFunction<ICoulmnDefFieldsResponse<any>, ICoulmnDefFieldsResponse<any>>;

  @Input() isPaymentTable = false;
  headerElements = input<IV3DtHeaderElements | undefined>(undefined);
  HeaderButtonLoadingProp = input({ isLoading: false, btn_id: '' });
  selectedPanelButton = model<string | number | undefined>(undefined);
  backButtonEnabled = input(false);
  additionalPayload = input<Record<string, unknown> | undefined>(undefined);
  defaultDisabledColumn = input<string[] | undefined>(undefined);
  prevoiusUrl = input<string | undefined>(undefined);
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

  @Output() reportExportEvent = new EventEmitter<
    'csv' | 'xlsx' | 'pdf'
  >();

  @Output() cashExpenseExportEvent = new EventEmitter<ICashExpenseExport>();

  @Output() rowClicked = new EventEmitter();
  @Input() transactionType: string;
  isFromPaymentsV3 = input(false);

  getAllColumns: Column[] | any;
  paginationSizeFilterOptions = [5, 10, 20, 50];
  paginationSizeSelection = 50;
  isFilterDown = false;
  faCaretDown = faCaretDown;
  postData: { [key: string]: string | IReceivedTypes | undefined };

  public defaultColDef: ColDef = {
    // enableRowGroup: true,
    // enablePivot: true,
    // enableValue: true,  // enableRowGroup, enablePivot and enableValue are not being implemented currently. Requires additional ag grid modules to be installed to use. Can be removed if not being used in the future as well.
    width: 100,
    sortable: true,
    resizable: true,
    filter: false,
    flex: 1,
    minWidth: 100,
    unSortIcon: true, // Show icon when unsorted
    icons: {
      sortAscending: '<i class="fas fa-arrow-up"></i>',
      sortDescending: '<i class="fas fa-arrow-down"></i>',
      sortUnSort: '<i class="fa-light fa-arrow-up-arrow-down"></i>' // Always visible unsorted icon
    }
  };

  selectBoxFilterChanges: ISelectBoxFilterValues | undefined;
  subscriptions: Subscription[] = [];

  private gridApi: GridApi;

  // paginationCurrentPageNumber = 1;
  paginationTotalRenderedPages: number;
  paginationTotalPageCount: number;
  paginationTotalRowCount = 10;
  paginationFirstRowOnPageIndex: number;
  paginationLastRowOnPageIndex: number;
  specificPageInput: number | undefined;

  paginationBoxOneNumber = 1;
  paginationBoxTwoNumber: number | undefined = undefined;
  paginationBoxThreeNumber: number | undefined = undefined;
  paginationBoxFourNumber: number | undefined = undefined;

  isV3DataTableLoading = true;
  selectedRowsData: RowNode[] = [];
  selectedRowCount: number = 0;

  filteredColumnFields: IDtColumnFields[] = [];
  filteredColumnDefs: ICoulmnDefFields[] = [];
  isFilterAndExportShown = false;
  filterAndExportForm: FormGroup<IFilterAndExportForm>;
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

  // To identity the tables and show row selection count.
  tablesNames: { [tableId: number]: string } = {
    1: 'Check',
    2: 'Bill',
    3: 'Payment',
    4: 'Invoice',
    16: 'Check Draft',
    18: 'Deposit Slip',
    29: 'Cash Expense'
  };

  routingNumber: { [key: string]: string };
  receivePaymentsStatus = receivedCheckStatus;
  selectedStatus: number | { type: number; status: number } = 0;
  showPermssionDenied = signal(false);
  private resizeObserver: ResizeObserver | null = null;

  ngOnChanges(): void {
    if (this.extendPagination) {
      this.paginationSizeFilterOptions.push(100, 200, 500);
      this.paginationSizeSelection = 500;
      this.paginationPageSize = 500;
      this.v3DataTableService.defaultPayload.endRow = 500;
      this.dataTableService.paginationSizeController.next(500);
    }
  }

  ngOnInit(): void {
    this.subscriptions.push(
      this.dataTableService.paginationSizeController.subscribe((val) => {
        this.paginationPageSize = val;
      })
    );
    this.setGridOptions();
    this.initFilterAndExportForm();
    this.setInitialColumns();
    this.getTableDataOnPayloadUpdate();
    this.subscriptions.push(
      this.v3DataTableService.v3RowSelectionData$.subscribe((val) => {
        this.selectedRowsData = val;
        this.selectedRowCount = this.selectedRowsData.length;
      })
    );
    this.selectBoxFilterChanges =
      this.v3DataTableService.initialSelectBoxFilter;

    this.getColumnMoveEvent();

    if (this.tableId === 62 && this.isPaymentTable) {
      this.onEyeButtonClick();
    }
    // GET SELECTED ROWS  FROM ACTION COMP
    this.subscriptions.push(
      this.dataTableService.selectedsingleId.subscribe(
        (res: ISelectedSingleRow) => {
          if (res?.tableId === this.tableId || !res?.tableId) {
            const selectedSingleRow = res;
            this.cellRendererIdEvent.emit(selectedSingleRow);
          }
        }
      )
    );

    // GET SELECTED ROWS  FROM ACTION VIEW COMP
    this.subscriptions.push(
      this.dataTableService.selectedViewSingleId$.subscribe((res) => {
        const response = res as IDtSelectSingleIdSubject;
        if (
          (response?.tableId && this.tableId === response.tableId) ||
          !response?.tableId
        ) {
          const selectedSingleViewRow = res;
          this.cellRendererViewEvent.emit(selectedSingleViewRow);
        }
      })
    );

    this.subscriptions.push(
      this.dataTableService.selectedDangerSingleId$.subscribe((res) => {
        const response = res as IDtSelectSingleIdSubject;
        if (
          (response?.tableId && this.tableId === response.tableId) ||
          !response?.tableId
        ) {
          const selectedSingleViewRow = res;
          this.cellRendererDangerEvent.emit(selectedSingleViewRow);
        }
      })
    );

    this.isPostDataChanges();
  }

  ngAfterViewInit(): void {
    this.setupHorizontalScrollbarSync();
  }

  /**
   * @description Sets up a ResizeObserver to sync the horizontal scrollbar width
   * with the grid container width. This fixes the issue where the fixed-positioned
   * scrollbar doesn't scroll properly when the grid width is smaller than expected.
   */
  private setupHorizontalScrollbarSync(): void {
    this.ngZone.runOutsideAngular(() => {
      // Small delay to ensure AG Grid is fully rendered
      setTimeout(() => {
        const gridContainer = this.elementRef.nativeElement.querySelector('.v3-data-table-grid-container');
        const horizontalScrollbar = this.elementRef.nativeElement.querySelector('.ag-body-horizontal-scroll');

        if (gridContainer && horizontalScrollbar) {
          // Initial sync
          this.syncHorizontalScrollbarWidth(gridContainer, horizontalScrollbar);

          // Set up ResizeObserver to handle dynamic width changes
          this.resizeObserver = new ResizeObserver(() => {
            this.syncHorizontalScrollbarWidth(gridContainer, horizontalScrollbar);
          });

          this.resizeObserver.observe(gridContainer);
        }
      }, 100);
    });
  }

  /**
   * @description Syncs the horizontal scrollbar width and position with the grid container.
   * @param gridContainer - The grid container element
   * @param scrollbar - The horizontal scrollbar element
   */
  private syncHorizontalScrollbarWidth(gridContainer: HTMLElement, scrollbar: HTMLElement): void {
    const rect = gridContainer.getBoundingClientRect();
    const scrollbarStyle = scrollbar.style as CSSStyleDeclaration;
    scrollbarStyle.left = `${rect.left}px`;
    scrollbarStyle.width = `${rect.width}px`;
    scrollbarStyle.maxWidth = `${rect.width}px`;
  }

  /**
   * Initializing AGgrid.
   */
  setGridOptions() {
    this.gridOptions = {
      components: {
        ...this.frameworkComponents,
        NoRowsCellRenderer,
        CustomLoadingCellRenderer
      },
      noRowsOverlayComponent: NoRowsCellRenderer,
      loadingOverlayComponent: CustomLoadingCellRenderer,
      suppressDragLeaveHidesColumns: true,
      alwaysShowVerticalScroll: true,
      headerHeight: 35,
      floatingFiltersHeight: 30,
      loadingOverlayComponentParams: {
        isLoading: () => this.isV3DataTableLoading
      },
      getContextMenuItems: (
        params: GetContextMenuItemsParams
      ): (string | MenuItemDef)[] => {
        const defaultContextMenu = params.defaultItems;
        const customContextMenu = defaultContextMenu?.filter(
          (item) => item.toLocaleLowerCase() === 'copy'
        );
        return customContextMenu ?? [];
      }
    } as GridOptions;
  }

  /**
   * Initializing Filter and Export Form.
   */
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
  }

  /**
   * This function is automatically called by AG Grid when
   * the data is supplied from backend to the Grid.
   * @param params These are the params we are getting from AG
   * Grid.
   */
  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api;
    if (params.api.getColumns()) {
      this.getAllColumns = params.api.getAllDisplayedColumns();
    }
    this.v3DataTableService.gridApi = params.api;
    const columnApi = params.api;
    /**
     * When clicking select all only select the
     * rows in the current page.
     */
    this.gridApi.addEventListener('paginationChanged', () => {
      this.preSelectSelectedRows();
    });

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
      columnApi.applyColumnState({ defaultState: { pinned: undefined } });
    }
    this.gridApi?.setGridOption('columnDefs', this.filteredColumnDefs);
    this.getTableData();

    this.subscriptions.push(
      this.v3DataTableService.updateV3DataTable$.subscribe({
        next: (res) => {
          if (res) {
            this.selectBoxFilterChanges = res;
            this.updateDefaultPayload();
          }
        }
      })
    );

    this.subscriptions.push(
      this.v3DataTableService.refreshV3DataTableSubject$.subscribe({
        next: (res) => {
          if (res) {
            this.getTableData();
          }
        }
      })
    );

    this.subscriptions.push(
      this.v3DataTableService.updateV3DataTableByRemovingFilter$.subscribe({
        next: (res) => {
          this.updateDefaultPayload(res);
        }
      })
    );
  }

  /**
   * @description Get the sorted data's in alphabetical ascending and descending order based on the column
   */
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

  /**
   *@description Fetch the user's column filter for corresponding table id and setting the column filter
   */
  fetchFilterSettings() {
    if (!this.tableId) return;
    this.subscriptions.push(
      this.v3DataTableService
        .getTableColumnData(this.tableId)
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
              this.gridApi?.setGridOption(
                'columnDefs',
                this.filteredColumnDefs
              );
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
        })
    );
  }

  /**
   * @description Changes the position of columns in a DataTable by sorting the column fields based on the specified order.
   *
   * @param {IDtColumnFields} unsortedColumnFields - An array of column fields to be reordered.
   * @param {Object.<string, number>} order - An object that defines the sorting order for columns, where keys are column field names and values are sorting order indices.
   */
  changeColumnPosition(
    unsortedColumnFields: IDtColumnFields[],
    order: { [key: string]: number }
  ) {
    const sortedColumnFields = unsortedColumnFields.sort(
      (curr, next) => order[curr.colDef.field] - order[next.colDef.field]
    );
    this.filteredColumnFields = sortedColumnFields;
    if (!this.columnVisibility) {
      this.filteredColumnDefs = [];
      this.filteredColumnFields.forEach((columnField) => {
        this.filteredColumnDefs.push(columnField.colDef);
      });
    }
  }

  /**
   * We refresh the data table when any function like
   * pagination is triggered so that we can display the
   * updated data.
   */
  refreshV3DataTable() {
    if (this.tableId === 62 && this.isPaymentTable) {
      this.v3DataTableService.isClickEyeButton = true;
    } else {
      this.v3DataTableService.isClickEyeButton = false;
    }
    this.v3DataTableService.refreshV3DataTable();
  }

  /**
   * @description This function is automatically called by
   * AG Grid whenever we do any changes with pagination.
   * @param paginationChangedResponse Updates anytime a pagination action
   * is made.
   */
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

    const isLastPage =
      this.paginationCurrentPageNumber === this.paginationTotalPageCount;
    const isLastTwoPages =
      this.paginationCurrentPageNumber > this.paginationTotalPageCount - 2;
    const isThirdLastPage =
      this.paginationCurrentPageNumber === this.paginationTotalPageCount - 2;
    const isLessThanFourPages = this.paginationTotalPageCount < 4;

    this.paginationBoxOneNumber = (() => {
      if (isLastTwoPages && !isLessThanFourPages) {
        return 1;
      }
      return this.paginationCurrentPageNumber;
    })();

    this.paginationBoxTwoNumber = (() => {
      if (isThirdLastPage && !isLessThanFourPages) {
        return undefined;
      }
      if (isLastPage) {
        return undefined;
      }
      return this.paginationBoxOneNumber + 1;
    })();

    this.paginationBoxThreeNumber = (() => {
      if (isLessThanFourPages) {
        if (isLastTwoPages) {
          return undefined;
        }
        return this.paginationTotalPageCount;
      }
      return this.paginationTotalPageCount - 1;
    })();

    this.paginationBoxFourNumber = (() => {
      if (isLessThanFourPages) {
        return undefined;
      }
      return this.paginationTotalPageCount;
    })();
  }

  /**
   * @description Method to handle selection and deselection of rows in the table.
   * The 'isSelected' method of node, returns true if selection is made and false if deselected).
   * Function is called by AG Grid automatically
   * whenever we select a row.
   * @param event We get information about which
   * row is selected and the data that is contained
   * in the selected row.
   */
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

  /**
   * @description Translates the virtual "Verification Required" status filter
   * (value 9) into the top-level `is_payee_bank_verification_held` flag the
   * backend expects, removing the `status` entry so it is not sent as a real
   * status code. Returns a new payload without mutating the shared filterModel.
   */
  private applyVerificationRequiredFilter(
    payload: IDefaultPayload
  ): IDefaultPayload {
    const statusFilterValue = payload.filterModel?.['status']?.filter;
    if (statusFilterValue === '9' || statusFilterValue === 9) {
      const restFilters = { ...payload.filterModel };
      delete restFilters['status'];
      return {
        ...payload,
        filterModel: restFilters,
        is_payee_bank_verification_held: 1
      };
    }
    return payload;
  }

  /**
   * @description Method to get table data.
   * @param type - Optional - If updating the table by setting filter etc.
   */
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
    this.v3DataTableService.isClickEyeButton = false;
    this.isV3DataTableLoading = true;
    this.paymentsService.isFromViewPage = false;
    if (this.tableId === 62 && this.isPaymentTable) {
      requestPayload = this.applyVerificationRequiredFilter(requestPayload);
    }
    const isCacheableView = this.isCacheableView(requestPayload);
    const cachedTableResponse = isCacheableView
      ? await this.dataTableCacheService.getCachedRowDataV3(
          this.tableId,
          requestPayload
        )
      : false;
    if (!requestPayload.endRow) return;
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
      this.isV3DataTableLoading = false;
      this.appendTableRows(cachedTableResponse.response, true);
    } else {
      this.gridApi.showLoadingOverlay();
      this.resetData();
    }
    this.subscriptions.push(
      this.v3DataTableService
        .getTableListData<any>(this.tableId, {
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
            this.isV3DataTableLoading = false;
            this.v3DataTableService.hardRefresh.set(false);
          })
        )
        .subscribe({
          next: async (res) => {
            if (!res.success && res?.permissionType === 'page' && res?.permissionRequired !== 'international-payment-transactions-view') {
              this.router.navigateByUrl('/manage/permission-denied');
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
                    this.areIdsEqualInObj(item, obj)
                  )
              );
              const updatedTableData = cachedResponse.rowData.map(
                (obj: { account_id: string }) =>
                  res.rowData.find((item) =>
                    this.areIdsEqualInObj(item, obj)
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
        })
    );
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

  areIdsEqualInObj(obj1: any, obj2: any): boolean {
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
  private mapResponseRows(res: ICoulmnDefFieldsResponse<any>): any[] {
    if (!this.appendStaticColumnFields) {
      return res.rowData ?? [];
    }
    return (res.rowData ?? []).map((row: any) => ({
      ...row,
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
  private applyRowUpdatesInPlace(res: ICoulmnDefFieldsResponse<any>): boolean {
    const rows = this.mapResponseRows(res);
    const nodes: any[] = [];
    this.gridApi?.forEachNode((node: any) => nodes.push(node));
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
    this.v3DataTableService.emptyRowData.next(res.rowCount);
    this.getAttachmentCommentStatus(res.rowData);
    return true;
  }

  /**
   * @param fromCache Rows come from the IndexedDB cache while the live request
   * is still in flight, so lookups that hit the network are skipped — the
   * authoritative pass runs them moments later.
   */
  appendTableRows(res: ICoulmnDefFieldsResponse<any>, fromCache = false) {
    /**
     * @description - if permission is denied by the master user.
     */
    if (res.errorMsg === 'Not Authorized') {
      this.isPaymentTableHavePermission = false;
    }

    if (this.appendStaticColumnFields) {
      this.v3DataTableService.rowData = res.rowData?.map((row) => ({
        ...row,
        ...this.appendStaticColumnFields
      }));
      // this.gridApi.sizeColumnsToFit();
    } else {
      this.v3DataTableService.rowData = res.rowData;
    }
    // supply rows for requested block to grid
    if (!fromCache) {
      this.getAttachmentCommentStatus(res.rowData);
    }
    this.setServerSideData(res);
    this.paginationTotalRowCount = res.rowCount;
    this.v3DataTableService.emptyRowData.next(res.rowCount);
    if (res.success === false) {
      this.v3DataTableService.rowData = [];
    }
  }

  getAttachmentCommentStatus(res: any) {
    const rowData = [...res];
    const statusArray = this.dataTableService.getA$Cstatus(this.tableId)[0];
    if (statusArray) {
      const dataIds: string[] = [];
      rowData.forEach((element: { [index: string]: any }) => {
        dataIds.push(element[statusArray.field]);
      });
      const data = { ids: dataIds };
      this.subscriptions.push(
        this.dataTableService
          .getAddAttachmentAddComment(statusArray.dataTableName, data)
          .subscribe((response) => {
            if (response.success) {
              this.dataTableService.setAttachmentCommentStatus(response.data);
            }
          })
      );
    }
  }

  setServerSideData(res: ICoulmnDefFieldsResponse<any>) {
    this.gridApi.hideOverlay();
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

  /**
   * @description Reset data table when api call occur.
   */
  resetData() {
    const datasource = {
      getRows: (params: IServerSideGetRowsParams) => {
        params.success({ rowData: [] });
      }
    };
    this.gridApi.setGridOption('serverSideDatasource', datasource);
  }

  /**
   * @description Take the mailed Check ids and call tracking ulr Api.
   * @param res data table response.
   */
  getCheckTrackingUrl(
    res: ICoulmnDefFieldsResponse<ICommonTransactionTableData>
  ) {
    const checkIds: string[] = [];
    res.rowData.forEach((row) => {
      if (row.cheque_status === 7) {
        checkIds.push(row?.transfer_id as string);
      }
    });
    if (checkIds?.length) {
      this.checkService.getTrackingUrl(checkIds);
    }
  }

  /**
   * @description function for auto selecting slected rows when user going other pages of the grind and coming back. being called when pagination changes
   */
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

  /**
   * @description Goes to the next page and dynamically
   * updates the start row and end row based on
   * the page number that the user types.
   */
  goToNextPage() {
    if (this.v3DataTableService.defaultPayload.endRow) {
      this.v3DataTableService.defaultPayload.endRow += this
        .paginationPageSize as number;
      this.v3DataTableService.defaultPayload.startRow =
        this.v3DataTableService.defaultPayload.endRow - this.paginationPageSize;
      this.v3DataTableService.refreshV3DataTable();
    }

    const tableLoadingSubscription =
      this.v3DataTableService.hasV3DataTableLoaded$
        .pipe(debounceTime(100))
        .subscribe({
          next: (res) => {
            if (res) {
              if (
                this.paginationCurrentPageNumber < this.paginationTotalPageCount
              )
                this.paginationCurrentPageNumber += 1;
              this.gridApi.paginationGoToPage(this.paginationCurrentPageNumber);
              tableLoadingSubscription.unsubscribe();
            }
          }
        });
  }

  /**
   * @description This goes to the previous page.
   */
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

    const tableLoadingSubscription =
      this.v3DataTableService.hasV3DataTableLoaded$
        .pipe(debounceTime(100))
        .subscribe({
          next: (res) => {
            if (res) {
              if (this.paginationCurrentPageNumber >= 1) {
                this.paginationCurrentPageNumber -= 1;
              }
              this.gridApi.paginationGoToPage(this.paginationCurrentPageNumber);
              tableLoadingSubscription.unsubscribe();
            }
          }
        });
  }

  /**
   * @description Goes to a specific page
   * @param page The page number that is entered by the user
   */
  goToSpecificPage(page?: number) {
    let pageVariable = 1;

    if (page) {
      pageVariable = Math.abs(page);
    } else {
      if (!this.specificPageInput) return;
      pageVariable = Math.abs(this.specificPageInput);
    }

    if (!this.isV3DataTableLoading) {
      this.paginationPageSize = Number(this.paginationSizeSelection);

      this.paginationTotalPageCount = Math.ceil(
        this.paginationTotalRowCount / this.paginationPageSize
      );

      if (this.v3DataTableService.defaultPayload.endRow) {
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
      const tableLoadingSubscription =
        this.v3DataTableService.hasV3DataTableLoaded$
          .pipe(debounceTime(100))
          .subscribe({
            next: (res) => {
              if (res) {
                this.gridApi.paginationGoToPage(pageVariable);
                this.paginationCurrentPageNumber = pageVariable;
                tableLoadingSubscription.unsubscribe();
              }
            }
          });
    }
    if (this.specificPageInput !== undefined)
      this.specificPageInput = undefined;
  }

  /**
   * @description Sets columns in the initial page loading to display as required by the component rendering the data table. The input property 'deselectedColumns' gives the columns that are not needed in the current implementation of the table (Those columns will not be accessible from column filters menu as well) - useful when using same table component in different places. Using this, filter the defaultColumnFields array (which is either passed in as an input or created dynamically with 'createDefaultFieldsObject' method).
   * @summary Method to set the default columns to show in the table.
   */
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
    } else {
      this.defaultColumnFields.forEach((columnField) => {
        this.filteredColumnFields.push(columnField);
        this.filteredColumnDefs.push(columnField.colDef);
      });
    }
    this.fetchFilterSettings();
  }

  /**
   * @description To update the table columns based on filter selection.
   */
  updateColumnDefs() {
    this.filteredColumnDefs = [];
    const filterCols: string[] = [];
    this.filteredColumnFields.forEach((field) => {
      if (field.isChecked) {
        this.filteredColumnDefs.push(field.colDef);
        filterCols.push(field.colDef.field);
      }
    });
    this.gridApi?.setGridOption('columnDefs', this.filteredColumnDefs);
    this.postColumnVisibilitySetting(filterCols);
    this.columnOrderChangeUpdation();
    if (this.gridApi.getColumns()) {
      this.getAllColumns = this.gridApi.getAllDisplayedColumns();
    }
  }

  /**
   * @description To reset the column filter to the default view (based on initial settings).
   */
  resetColumnDefs() {
    this.filteredColumnDefs = [];
    this.filteredColumnFields = [];
    const filterCols: string[] = [];
    this.defaultColumnFields.forEach((columnField) =>
      this.filteredColumnFields.push(columnField)
    );
    this.filteredColumnFields = this.filteredColumnFields.map((item) => {
      const columnField = item;
      columnField.isChecked = true;
      this.filteredColumnDefs.push(columnField.colDef);
      filterCols.push(columnField.colDef.field);
      return columnField;
    });
    this.gridApi?.setGridOption('columnDefs', this.filteredColumnDefs);
    this.postColumnVisibilitySetting(filterCols);
    this.columnOrderChangeUpdation();
  }

  /**
   * @description Decides wheather the button wants to navigate url or emit data
   * @param data Url or modal
   * @returns
   */
  headerButtonClick(data: string) {
    if (this.buttonForModal) {
      this.modalOpenClick.emit(data);
      return;
    }
    this.router.navigate([data]);
  }

  /**
   * @description Method to create default defaultColumnFields array (with all fields enabled by default) if it is not given as an input.
   */
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

  /**
   * @description To set the checked state of column filters.
   * @param fieldId The id of the field being selected or deselected.
   */
  toggleColumnFields(fieldId: string) {
    this.filteredColumnFields = this.filteredColumnFields.map((item) => {
      const field = item;
      if (field.id === fieldId) field.isChecked = !field.isChecked;
      return field;
    });
  }

  /**
   * @description Method to post column visibility settings.
   * @param columns - Column names that should be visible.
   */
  postColumnVisibilitySetting(columns: string[]) {
    this.subscriptions.push(
      this.v3DataTableService
        .postcolumnVisible(this.tableId, { visibility: columns })
        .subscribe()
    );
  }

  /**
   * @description To prevent mat-menu from self-closing on checkbox selection
   */
  preventEventPropagation(event: Event) {
    event.stopPropagation();
  }

  /**
   * @description to export data-table data to pdf.
   */
  exportPdf(option: 'print' | 'download') {
    DataTableUtils.makeJspdf(
      option,
      this.getExportData(),
      this.exportConfig?.heading ?? '',
      this.exportConfig?.name ?? ''
    );
  }

  /**
   * @description to export data-table data to csv format.
   */
  exportCsv() {
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
              value: 'Online CheckWriter'
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

  /**
   * @description to export data-table data to excel.
   */
  exportExcel() {
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
                value: 'Online CheckWriter',
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

  /**
   * @description to send data-table data to email.
   */
  sendEmail() {
    this.getExcelFile();
    const emailRef = this.dialog.open(ExportToEmailComponent, {
      width: '400px',
      maxWidth: '95%'
    });

    emailRef
      .afterClosed()
      .subscribe(
        (res: {
          send: boolean;
          emailId: string;
          subject: string;
          message: string;
        }) => {
          if (res.send) {
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
            this.dataTableService.sendEmail(formData).subscribe((data) => {
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

    // Get the Excel data as a Blob
    const excelData: Blob = this.gridApi.getDataAsExcel({
      prependContent: [
        {
          cells: [
            {
              data: {
                value: 'Online CheckWriter',
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

  /**
   * @description to get data to be exported from data-table.
   */
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
    ]; // Ignore default action, view and id column
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
    this.getAllColumns?.forEach(
      (col: {
        userProvidedColDef: {
          headerName: string;
          valueGetter: (event?: { data: unknown; value: string }) => void;
          cellRenderer: (event?: { data: unknown; value: string }) => void;
          cellRendererForExport: (event?: {
            data: unknown;
            value: string;
          }) => void;
          field: string | number;
        };
      }) => {
        const obj: {
          name: string;
          cellRenderer?: (event?: { data: unknown; value: string }) => void;
        } = { name: col.userProvidedColDef.headerName };
        if (col?.userProvidedColDef?.cellRendererForExport) {
          obj.cellRenderer = col?.userProvidedColDef?.cellRendererForExport;
        } else if (col?.userProvidedColDef?.valueGetter) {
          obj.cellRenderer = col?.userProvidedColDef?.valueGetter;
        } else if (
          col?.userProvidedColDef?.cellRenderer &&
          typeof col?.userProvidedColDef?.cellRenderer === 'function'
        ) {
          obj.cellRenderer = col?.userProvidedColDef?.cellRenderer;
        }
        colNames[col.userProvidedColDef.field] = obj;
      }
    );
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

          // Remove HTML tags from cellValue , if value is null assigning empty string
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

  /**
   * method for exporting check draft table
   * @param type
   */
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

  /**
   * Filter and export function. calls api and getting the file.
   * @param type - File type to be created.
   * @param exportAll - should be true if we want to export all data.
   */
  filterAndExport(
    type: 'csv' | 'xlsx' | 'pdf',
    exportAll: boolean | undefined,
  ) {
    if(this.tableId === 93 || this.tableId === 94){
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

    if(this.tableId === 29 || this.tableId === 38){
      const body = this.filterAndExportForm.value;
      const fromDate = this.convertDate(body.fromDate ?? '',true);
      const toDate = this.convertDate(body.toDate ?? '',true);
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
        this.subscriptions.push(
          this.v3DataTableService
            .filterAndExport({ ...body, type })
            .subscribe({
              next: (res) => {
                if (res.success) {
                  if(res.data.url){   
                    window.location.href = res.data.url;
                  }else{
                   this.filterAndExportForm.controls.email.setValue(null);
                   this.alertService.successAlert({
                    content: res.data.message || 'Exporting file Please check your email',
                    close: true,
                    timeout: 2000,
                   });
                  }
                }
              },
              error: (err) => {
                if(err.error.errorCode ==7){
                  this.alertService.infoAlert({
                    content: err.error.errorMsg,
                    isInputRequired: true,
                    title: 'Export Limit Exceeded',
                    inputPlaceholder: 'Enter email address',
                    isOk: false,
                    isCancel: true
                  }).afterClosed().subscribe((res) => {
                    if(res && typeof res === 'object' && 'inputValue' in res){
                      this.filterAndExportForm.controls.email.setValue(res.inputValue);
                      this.filterAndExport(type,exportAll);
                    }
                  });
                }
              }
            })
        );
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

  /**
   * method for filtering table data
   */
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

    /** based on the table-id setting the excluding fields on filter */
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

    /** updates the ag-grid filter field name */
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

  /**
   * method for resetting date filter
   */
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
    this.subscriptions.push(
      this.dataTableService
        .filterAndExportWallet(filterBody)
        .pipe(
          finalize(() => {
            this.filterAndExportLoading = false;
          })
        )
        .subscribe((res) => {
          if (res) {
            window.location.href = res.data;
          }
        })
    );
  }

  /**
   * @description Filter and export ach transfer data.
   */
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
    this.subscriptions.push(
      this.dataTableService
        .filterAndExportAchTransfer(filterBody, apiEndPoint)
        .pipe(
          finalize(() => {
            this.filterAndExportLoading = false;
            this.isFilterAndExportShown = false;
          })
        )
        .subscribe((res) => {
          if (res) {
            window.location.href = res.data;
            this.filterAndExportForm.controls.statusType.setValue('all');
          }
        })
    );
  }

  convertDate(date: Date | number | string, shortDate?: boolean) {
    if (shortDate) {
      return this.datePipe.transform(date, 'shortDate');
    }
    return this.datePipe.transform(date, 'MM/dd/YYYY');
  }

  /**
   * To be called when there is a change in  Bank Dropdown
   * Inside export all Feature.
   * @param event - Data emitted from event
   */
  bankDropDownChange(event: IBankDropdown) {
    this.filterAndExportForm.controls.bankAccountId.setValue(
      event?.id ?? 'all'
    );
  }

  /**
   * To be called when there is a change in  Card Dropdown
   * Inside export all Feature.
   * @param event - Data emitted from event
   */
  cardDropDownChange(event: IExistingCreditCards) {
    this.filterAndExportForm.controls.cardId.setValue(event?.cardId ?? 'all');
  }

  /**
   * To be called when there is a change in  Wallet Dropdown
   * Inside export all Feature.
   * @param event - Data emitted from event
   */
  walletDropDownChange(event: IWalletData) {
    this.filterAndExportForm.controls.walletId.setValue(event?.id ?? 'all');
  }

  /**
   * To be called when there is a change in Date Range Component
   * Inside export all Feature.
   * @param event - Data emitted from event
   */
  filterAndExportDateChange(event: { start: string; end: string }) {
    this.filterAndExportForm.controls.fromDate.setValue(event.start);
    this.filterAndExportForm.controls.toDate.setValue(event.end);
  }

  /**
   * Changes the visibility of filter and export feature.
   * @param event - Data emitted from event
   */
  switchFilterAndExport(event: Event) {
    event.stopPropagation();
    this.isFilterAndExportShown = !this.isFilterAndExportShown;
  }

  /**
   * @description Method to update the default payload object.
   * `this.getTableDataOnPayloadUpdate()`method fetches the updated data upon data being set to subject.
   * @param removeFilter - filter to be removed.
   */
  updateDefaultPayload(removeFilter?: string[]) {
    if (this.tableId === 62 && this.isPaymentTable) {
      this.v3DataTableService.updatePayloadData(removeFilter);
    }
    if (this.selectBoxFilterChanges) {
      /**
       * @description If the user is adding multiple filters
       * we need to add them all together and store them in an
       * object.
       */
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

    /**
     * @description We are removing the filter from the payload if
     * the user removes the filter option by deleting the existing
     * entry from the payload.
     */
    if (removeFilter) {
      for (let i = 0; i < removeFilter.length; i += 1) {
        delete this.v3DataTableService.defaultPayload.filterModel[
          removeFilter[i]
        ];
      }
    }
    this.v3DataTableService.defaultPayloadUpdated = true;
  }

  /**
   * @description Method ot get table data on payload update.
   */
  getTableDataOnPayloadUpdate() {
    this.subscriptions.push(
      this.v3DataTableService.defaultPayloadUpdated$
        .pipe(debounceTime(600))
        .subscribe((res) => {
          if (res === true) {
            this.getTableData('update');
          }
        })
    );
  }

  /**
   * @description This function sets up an event listener for column move events. When a column move event occurs,
   * it triggers the `columnOrderChangeUpdation()` function after a debounce period of 300 milliseconds.
   * This helps prevent multiple API calls from being triggered in quick succession.
   */
  getColumnMoveEvent() {
    this.columnMovedSubject.pipe(debounceTime(300)).subscribe(() => {
      this.columnOrderChangeUpdation();
    });
  }

  /**
   * @description Handles column moving in a data table by scheduling an update to the column order.
   */
  onColumnMoved() {
    this.columnMovedSubject.next();
  }

  /**
   * @description Updates the column order and sends it to the server.
   */
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

    this.subscriptions.push(
      this.dataTableService
        .postcolumnOrder(this.tableId, this.tableMovePositionData)
        .subscribe()
    );
    this.changeColumnPosition(this.filteredColumnFields, result);
  }

  /**
   * @description TrackBy and ngFor together allow Angular to detect the specific node element that needs to change or be added instead of rebuilding the whole array
   * @param item - pageSize
   * @returns
   */
  identity(item: number) {
    return item;
  }

  /**
   * @description change the view into grid
   */
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

  /**
   * @description Handles the click event of the eye button in the DataTable component.
   * Used to to check eye button is clicked or not.
   */
  onEyeButtonClick() {
    this.subscriptions.push(
      this.v3DataTableService.v3EyeButton$.subscribe((res) => {
        if (res) {
          this.v3DataTableService.isClickEyeButton = true;
        } else {
          this.v3DataTableService.isClickEyeButton = false;
        }
      })
    );
  }

  /**
   * Method to get post data changes (payload changes)
   */
  isPostDataChanges() {
    if (this.tableId === 42) {
      this.subscriptions.push(
        this.v3DataTableService.postData$.subscribe((res) => {
          if (res) {
            this.postData = res;
            this.getTableData();
          }
        })
      );
    }
    if (this.tableId === 33 || this.tableId === 92) {
      this.subscriptions.push(
        this.v3DataTableService.routingNumber.subscribe((res) => {
          if (res) {
            this.routingNumber = res;
            this.postData = { ...this.routingNumber };
            this.getTableData();
          }
        })
      );
    }
    this.subscriptions.push(
      this.requestPaymentsService.getReceivedTypes().subscribe((res) => {
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
        }
      })
    );
  }

  /**
   * @description Export all payee data.
   * @param fileType Selected file type.
   */
  importFilteredPayeeData(fileType: string) {
    const currentColumns: string[] = [];
    this.gridApi.getColumnState().forEach((el) => {
      if (el.colId !== 'boxId' && el.colId !== 'action') {
        currentColumns.push(el.colId);
      }
    });
    this.filterAndExportLoading = true;
    const payload = {
      type: fileType,
      items: currentColumns
    };
    this.subscriptions.push(
      this.dataTableService
        .payeeFilterAndExportAll(payload)
        .pipe(
          finalize(() => {
            this.filterAndExportLoading = false;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            if (res.message) {
              this.alertService.successAlert({ content: res.message });
            } else {
              window.open(res?.data?.url);
            }
          }
        })
    );
  }

  exportMenuClosed() {
    this.isFilterAndExportShown = false;
  }

  /**
   * @description  Handles a click event on a panel button.
   * Emits an event with button ID, selected rows, and table ID.
   * @param {string | number} btnId - The ID of the clicked panel button.
   */
  onPanelButtonClick(btnId: string | number) {
    this.onHeaderButtonClick(btnId);
    this.selectedPanelButton.set(btnId);
  }

  // HEADER BUTTON
  /**
   * @description Handles a click event on a header button.
   * Emits an event with button ID and selected rows.
   * @param {string | number} btnId - The ID of the clicked header button.
   */
  onHeaderButtonClick(btnId: string | number) {
    const selectedRows = this.selectedRowsData.map((item) => item.data);
    this.headerButtonEvent.emit({
      id: btnId,
      selectedRows,
      tableId: this.tableId
    });
  }

  /**
   * @description Handles the event when a row is clicked.
   * Emits an event indicating that a row has been clicked.
   * @param {RowClickedEvent<any>} event - The event object containing information about the clicked row.
   */
  onRowClick(event: RowClickedEvent): void {
    this.rowClicked.emit(event);
  }

  /**
   * @description Handles the back button click event.\
   * If a router link is provided, navigates to the specified route.
   * Otherwise, navigates back to the previous location in the browser history.
   */
  onBackButtonClick() {
    if (this.prevoiusUrl()) {
      this.router.navigate([this.prevoiusUrl()]);
    } else {
      this.location.back();
    }
  }

  isShowFilterMenu(tableId: number) {
    const filterOptions = [2, 3, 4, 9, 16, 20, 21, 27, 29, 38, 79, 85, 86, 87, 96, 97];
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

  ngOnDestroy() {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });

    // Clean up ResizeObserver
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    this.v3DataTableService.rowData = [];
    this.dataTableService.selectedCellValueSignal.set(undefined);
  }
}

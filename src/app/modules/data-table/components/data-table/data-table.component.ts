import {
  EventEmitter,
  Component,
  Input,
  OnDestroy,
  OnInit,
  Output,
  inject
} from '@angular/core';
import { Subscription } from 'rxjs';
import {
  DataTableService,
  IDtSelectSingleIdSubject
} from 'src/app/shared/service/data-table/data-table.service';
import {
  ColDef,
  ColumnApi,
  GridOptions,
  GridApi,
  IServerSideGetRowsParams,
  IServerSideGetRowsRequest,
  Column,
  RowClickedEvent,
  ColumnResizedEvent,
  ColGroupDef,
  ExcelDataType,
  ExcelOOXMLDataType,
  IRowNode,
  GridReadyEvent,
  IServerSideDatasource,
  GetContextMenuItemsParams,
  MenuItemDef,
  FilterChangedEvent
} from '@ag-grid-community/core';
import {
  UntypedFormControl,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { CurrencyPipe, DatePipe, NgClass, NgStyle } from '@angular/common';
import { finalize } from 'rxjs/operators';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { DataTableCacheService } from 'src/app/shared/service/indexedDb/data-table-cache.service';
import { DateAdapter } from '@angular/material/core';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { Router } from '@angular/router';
import {
  IDataTableMain,
  IDtAttachComntArray,
  IDtColumnFields,
  IDtDateFilterItem,
  IDtHeaderElements,
  IDtResponse,
  IDtStatusArray,
  ISelectedSingleRow
} from 'src/app/modules/data-table/model/datatable';
import { IWalletData } from 'src/app/models/wallet';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { MatDialog } from '@angular/material/dialog';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { IBankDropdown } from 'src/app/models/bank';
import { ICategoryDropdown } from 'src/app/modules/category/model/category';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { IDefaultPayload, IRequestPayload } from 'src/app/models/v3-datatable';
import { MatTooltip } from '@angular/material/tooltip';
import { MatButton } from '@angular/material/button';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { AgGridAngular } from '@ag-grid-community/angular';
import { SelectedService } from '../dt-date-range/selected.service';
import { DataTableUtils } from '../data-table-utils';
import { ExportToEmailComponent } from '../../modals/export-to-email/export-to-email.component';
import { DtLoaderComponent } from '../dt-loader/dt-loader.component';
import { DropDownCategoryComponent } from '../../../../shared/components/drop-downs/drop-down-category/drop-down-category.component';
import { DateRangeComponent } from '../../../../shared/components/date-range/date-range.component';
import { DropDownWalletComponent } from '../../../../shared/components/drop-downs/drop-down-wallet/drop-down-wallet.component';
import { DropDownBankComponent } from '../../../../shared/components/drop-downs/drop-down-bank/drop-down-bank.component';

@Component({
  selector: 'app-data-table',
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.scss'],
  standalone: true,
  imports: [
    NgClass,
    NgStyle,
    MatTooltip,
    MatButton,
    MatMenuTrigger,
    MatMenu,
    MatMenuItem,
    FaIconComponent,
    FormsModule,
    DropDownBankComponent,
    DropDownWalletComponent,
    DateRangeComponent,
    ReactiveFormsModule,
    DropDownCategoryComponent,
    MatProgressSpinner,
    AgGridAngular,
    CurrencyPipe
  ]
})
export class DataTableComponent<D>
  implements OnInit, OnDestroy, IDataTableMain
{
  private dataTableService = inject(DataTableService);
  public dialog = inject(MatDialog);
  private selectedService = inject(SelectedService);
  private datePipe = inject(DatePipe);
  private alertService = inject(AlertService);
  private dtCacheService = inject(DataTableCacheService);
  private dateAdapter = inject(DateAdapter<D>);
  private checkService = inject(CheckService);
  private router = inject(Router);
  private headerService = inject(HeaderService);
  private localStorageService = inject(LocalStorageService);
  private v3DataTableService = inject(V3DataTableService);

  @Input() public tableId!: number;
  @Input() public frameworkComponents: unknown;
  @Input() public columnDefs!: (ColDef | ColGroupDef)[] | null;
  @Input() public columnFields!: IDtColumnFields[];
  @Input() public headerElements!: IDtHeaderElements;
  @Input() public selectedPanelButton: string | number;
  @Input() public HeaderButtonLoadingProp = {
    isLoading: false,
    btn_id: '',
    btn_name: String
  };
  @Input() postData: { [key: string]: string };
  @Input() exportConfig: {
    heading: string;
    name: string;
    ignoreColumns?: string[];
  };

  @Input() rowHeight = '37';
  @Input() public paginationPageSize = 50;
  @Input() transactionType: string;
  @Input() isFromV3Payments: boolean = false;
  @Input() fieldsShownByDefault: string[] = [];
  @Output() headerButtonEvent = new EventEmitter();
  @Output() cellRendererIdEvent = new EventEmitter<ISelectedSingleRow>();
  @Output() cellRendererViewEvent = new EventEmitter<ISelectedSingleRow>();
  @Output() cellRendererDangerEvent = new EventEmitter();
  @Output() rowClicked = new EventEmitter();
  // eslint-disable-next-line @angular-eslint/no-output-on-prefix
  @Output() onRowSelected = new EventEmitter();
  @Output() getStoreInfo = new EventEmitter();
  @Output() exportFilterEvent = new EventEmitter();
  @Input() totalCheckSum: number = 0;
  @Input() isCheckTotalSumPluginEnabled: boolean = false;
  @Input() selectedCheckSum: number = 0;

  private gridApi: GridApi;
  gridOption: GridOptions = {
    suppressCutToClipboard: true,
    getContextMenuItems: (
      params: GetContextMenuItemsParams
    ): (string | MenuItemDef)[] => {
      const defaultContextMenu = params.defaultItems;
      const customContextMenu = defaultContextMenu?.filter(
        (item) => item.toLocaleLowerCase() === 'copy'
      );
      return customContextMenu ?? [];
    }
  };

  private gridColumnApi: ColumnApi;

  public loadingCellRenderer: typeof DtLoaderComponent = DtLoaderComponent;
  public defaultColDef: ColDef = {
    flex: 1,
    floatingFilter: true,
    sortable: true,
    resizable: true,
    enableCellChangeFlash: true
  };

  subscriptions: Subscription[] = [];
  getAllColumns: Column[] | null;
  colIndex: number | number[] | string;
  colName: string[] = [];
  allColumnIds: number[] = [];
  currentColWidth: number[] = [];
  selectedRows: unknown;
  today: D | null;
  cacheBlockSize: number;
  tableInitialLoad = true;
  isPaginationChange = false;

  tableMovePositionData: { order: { [index: string]: number } };
  onColumnMovedTimeout: ReturnType<typeof setTimeout>;
  onColumnResizeTimeout: ReturnType<typeof setTimeout>;

  showNoResult = false;
  dataIds: string[] = [];
  statusArray: IDtStatusArray;
  isRefresh: boolean;
  refreshFromAction = false;
  refreshingBtn = false;
  disableRefreshingBtn = false;
  isbtnClick = false;
  selectedRange: string;
  requestPayLoadFilter: string;
  paginationSizeFilterOptions = [5, 10, 20, 50];
  selectedRowCount: number = 0;
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

  // PAGINATION
  initialCount = 1;
  totalCount!: number;
  colRange = 50;
  totalPage!: number;
  startPage!: number;
  endPage!: number;
  pageArr: (number | '...')[] = [];
  mode: 1 | 2 | 3 = 1;
  defval: number | string;
  exportedFile: Blob | null = null;

  /** Filter And Export */
  isShowAdvancedExport = false;
  isShowExport = true;
  filterAndExportBankAccount = new UntypedFormControl();
  filterAndExportWallet = new UntypedFormControl();
  filterAndExportCategory = new UntypedFormControl();
  ExportAllDataStatus = [
    { value: 'all', name: 'All Status' },
    { value: '2', name: 'Voided' },
    { value: '0', name: 'New' },
    { value: '1', name: 'Printed' },
    { value: '3', name: 'Archived' },
    { value: '4', name: 'Printing' },
    { value: '11', name: 'Mailed' },
    { value: '50', name: 'Schedule' },
    { value: '500', name: 'Emailed' },
    { value: '505', name: 'E-printed' },
    { value: '520', name: 'Requested' },
    { value: '400', name: 'DD' },
    { value: '410', name: 'DD-FUNDING' },
    { value: '412', name: 'DD-FAILED' },
    { value: '420', name: 'DDW' },
    { value: '304', name: 'DDC' },
    { value: '36', name: 'Approval Required' }
  ];

  filterAndExportDateStart: string;
  filterAndExportDateEnd: string;
  filterAndExportLoading = false;
  checkFilterStatus = new UntypedFormControl('');

  item: string[];
  arrayOf: string[];
  isLegalEnabled: boolean;
  columnOrder: { [key: string]: number };
  extendPagination = false;

  ngOnInit(): void {
    this.refreshFromAction = false;

    this.statusArray = this.dataTableService.getA$Cstatus(this.tableId)[0];
    this.checkFilterStatus.setValue('all');
    this.cacheBlockSize = 50;

    // GET SELECTED ROWS  FROM FLOTING COMP
    this.subscriptions.push(
      this.dataTableService.selectedRows.subscribe((res) => {
        if (res?.tableId === this.tableId || !res?.tableId) {
          this.selectedRows = res?.selectedRows || [];
        }
      })
    );

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

    // GET SELECTED ROWS  FROM DANGER COMP
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

    // for paginantion
    this.totoalPage();
    this.paginationArray();
    this.getRange();
    this.loadedHeaderDataAndProcess();
    this.deselectAll();

    if (this.tableId !== 62) {
      this.v3DataTableService.clearStoredData();
    }

    this.dataTableService.paginationChange$.subscribe((isPaginationExtended) => {
      if(isPaginationExtended && this.tableId === 1){
        this.extendPagination = true; 
      }
    });
  }

  /**
   * @description This function sets the refreshing button state to true and triggers a data refresh for the specified table.
   */
  refreshDataTable() {
    this.refreshingBtn = true;
    this.dataTableService.setRefreshStatus(true, this.tableId);
  }

  /**
   * @description  This function is called when a date range is selected.
   * It formats the start and end dates and updates the corresponding properties for filtering and exporting.
   * @param {Date} event.start - The start date of the selected range.
   * @param {Date} event.end - The end date of the selected range.
   */
  selectedCheckDateRange(event: { start: Date; end: Date }) {
    const startDateObj = new Date(event.start);
    const startDate = `${`0${startDateObj.getMonth() + 1}`.slice(
      -2
    )}/${`0${startDateObj.getDate()}`.slice(-2)}/${startDateObj.getFullYear()}`;
    this.filterAndExportDateStart = startDate;
    this.filterAndExportDateEnd =
      this.datePipe.transform(event.end, 'MM/dd/YYYY') || '';
  }

  /**
   * @description Called when the user changes the selected bank in the dropdown.
   * It sets the value of the `filterAndExportBankAccount` form control to the ID of the selected bank.
   * @param {IBankDropdown} event - The event object containing information about the selected bank.
   */
  bankDropDownChange(event: IBankDropdown): void {
    this.filterAndExportBankAccount.setValue(event?.id);
  }

  /**
   * @description Called when the user changes the selected wallet in the dropdown.
   * It sets the value of the `filterAndExportWallet` form control to the ID of the selected wallet.
   * @param {IWalletData} event - The event object containing information about the selected wallet.
   */
  walletDropDownChange(event: IWalletData): void {
    this.filterAndExportWallet.setValue(event?.id);
  }

  /**
   * @description Called when the user changes the selected category in the dropdown.
   * It sets the value of the `filterAndExportCategory` form control to the ID of the selected category.
   * @param {ICategoryDropdown} event - The event object containing information about the selected category.
   */
  catagoryDropDownChange(event: ICategoryDropdown): void {
    this.filterAndExportCategory.setValue(event?.id);
  }

  /**
   * @description Takes either a Date object or a numeric timestamp and returns a formatted date string in the "MM/dd/YYYY" format using the Angular date pipe.
   * @param {Date | number} date - The Date object or numeric timestamp to be formatted.
   * @returns {string} - The formatted date string in the "MM/dd/YYYY" format.
   */
  convertDate(date: Date | number) {
    return this.datePipe.transform(date, 'MM/dd/YYYY');
  }

  /**
   * @description  Imports and filters check data based on specified type.
   * @param {string} fileType - The type of data to be imported and filtered.
   */
  importFilteredCheckData(fileType: string) {
    const tableArray: string[] = [];
    const dateToday = this.convertDate(new Date()) || '';
    const lastTenYears =
      this.convertDate(new Date().setFullYear(new Date().getFullYear() - 10)) ||
      '';

    this.gridApi.getColumnState().forEach((el) => {
      switch (el.colId) {
        case 'cheques.cheque_status':
          tableArray.push('status');
          break;
        case 'cheque_amount':
          tableArray.push('amount');
          break;
        case 'payee_name':
          tableArray.push('payee');
          break;
        case 'bank_account_nick_name':
          tableArray.push('bank_nick_name');
          break;
        case 'bank_account_account_name':
          tableArray.push('bank');
          break;
        case 'cheque_serial_number':
          tableArray.push('cheque_no');
          break;
        case 'cheque_issue_date':
          tableArray.push('created_time');
          break;
        case 'cheque_created_by_name':
          tableArray.push('by');
          break;
        case 'cheque_memo':
          tableArray.push('memo');
          break;
        case 'catagory_name':
          tableArray.push('category');
          break;
        case 'cheque_account_number':
          tableArray.push('payee_ac_no');
          break;
        case 'cheque_invoice_number':
          tableArray.push('invoice_no');
          break;
        case 'cheques.created_at':
          tableArray.push('date');
          break;
        default:
          break;
      }
      this.item = tableArray;
    });

    const filterBody = {
      bankAccountId:
        this.filterAndExportBankAccount.value !== null
          ? this.filterAndExportBankAccount.value
          : 'all',
      fromDate:
        this.filterAndExportDateStart !== undefined
          ? this.filterAndExportDateStart
          : lastTenYears,
      toDate:
        this.filterAndExportDateEnd !== undefined
          ? this.filterAndExportDateEnd
          : dateToday,
      statusId: this.checkFilterStatus.value,
      categoryId:
        this.filterAndExportCategory.value !== null
          ? this.filterAndExportCategory.value
          : 'all',
      items: this.item,
      type: fileType
    };
    this.filterAndExportLoading = true;
    this.subscriptions.push(
      this.dataTableService
        .filterAndExportAll(filterBody)
        .pipe(
          finalize(() => {
            this.filterAndExportLoading = false;
          })
        )
        .subscribe((res) => {
          if (res) {
            const link = document.createElement('a');
            link.setAttribute('href', res.data.url);
            link.click();
            link.remove();
          }
        })
    );
  }

  /**
   * @description  Exports filtered wallet data based on specified date range and wallet ID.
   */
  exportFilteredWalletData() {
    const dateToday = this.convertDate(new Date()) || '';
    const lastTenYears =
      this.convertDate(new Date().setFullYear(new Date().getFullYear() - 10)) ||
      '';
    const filterBody = {
      walletId: this.filterAndExportWallet.value ?? 'all',
      fromDate:
        this.filterAndExportDateStart !== undefined
          ? this.filterAndExportDateStart
          : lastTenYears,
      toDate:
        this.filterAndExportDateEnd !== undefined
          ? this.filterAndExportDateEnd
          : dateToday
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
   * @description Imports and filters check data based on specified type and exports as PDF or prints.
   * @param {string} type - The type of export operation ('pdf' or 'print').
   */
  importFilteredCheckPdfData(type: string) {
    const tableArray: string[] = [];
    const dateToday = this.convertDate(new Date()) || '';
    const lastTenYears =
      this.convertDate(new Date().setFullYear(new Date().getFullYear() - 10)) ||
      '';

    this.gridApi.getColumnState().forEach((el) => {
      switch (el.colId) {
        case 'cheques.cheque_status':
          tableArray.push('status');
          break;
        case 'cheque_amount':
          tableArray.push('amount');
          break;
        case 'payee_name':
          tableArray.push('payee');
          break;
        case 'bank_account_nick_name':
          tableArray.push('bank_nick_name');
          break;
        case 'bank_account_account_name':
          tableArray.push('bank');
          break;
        case 'cheque_serial_number':
          tableArray.push('cheque_no');
          break;
        case 'cheque_issue_date':
          tableArray.push('created_time');
          break;
        case 'cheque_created_by_name':
          tableArray.push('by');
          break;
        case 'cheque_memo':
          tableArray.push('memo');
          break;
        case 'catagory_name':
          tableArray.push('category');
          break;
        case 'cheque_account_number':
          tableArray.push('payee_ac_no');
          break;
        case 'cheque_invoice_number':
          tableArray.push('invoice_no');
          break;
        case 'cheques.created_at':
          tableArray.push('date');
          break;
        default:
          break;
      }
      this.item = tableArray;
    });
    const method1 = 'pdf';
    const method2 = 'print';
    if (type === 'pdf') {
      const filterBody = {
        bankAccountId:
          this.filterAndExportBankAccount.value !== null
            ? this.filterAndExportBankAccount.value
            : 'all',
        fromDate:
          this.filterAndExportDateStart !== undefined
            ? this.filterAndExportDateStart
            : lastTenYears,
        toDate:
          this.filterAndExportDateEnd !== undefined
            ? this.filterAndExportDateEnd
            : dateToday,
        statusId: this.checkFilterStatus.value,
        categoryId:
          this.filterAndExportCategory.value !== null
            ? this.filterAndExportCategory.value
            : 'all',
        items: this.item,
        method: method1
      };

      this.filterAndExportLoading = true;
      this.subscriptions.push(
        this.dataTableService
          .filterAndExportPdf(filterBody)
          .pipe(
            finalize(() => {
              this.filterAndExportLoading = false;
            })
          )
          .subscribe((res) => {
            if (res.success) {
              if (res.message) {
                const data = {
                  title: 'Success!',
                  content: res.message,
                  close: false
                };
                this.alertService.successAlert(data);
              } else {
                window.open(res.url);
              }
            }
          })
      );
    } else if (type === 'print') {
      const filterBody = {
        bankAccountId:
          this.filterAndExportBankAccount.value !== null
            ? this.filterAndExportBankAccount.value
            : 'all',
        fromDate:
          this.filterAndExportDateStart !== undefined
            ? this.filterAndExportDateStart
            : lastTenYears,
        toDate:
          this.filterAndExportDateEnd !== undefined
            ? this.filterAndExportDateEnd
            : dateToday,
        statusId: this.checkFilterStatus.value,
        categoryId:
          this.filterAndExportCategory.value !== null
            ? this.filterAndExportCategory.value
            : 'all',
        items: this.item,
        method: method2
      };

      this.filterAndExportLoading = true;
      this.subscriptions.push(
        this.dataTableService
          .filterAndExportPdf(filterBody)
          .pipe(
            finalize(() => {
              this.filterAndExportLoading = false;
            })
          )
          .subscribe((res) => {
            if (res.success) {
              if (res.message) {
                const data = {
                  title: 'Success!',
                  content: res.message,
                  close: false
                };
                this.alertService.successAlert(data);
              } else {
                window.open(res.url);
              }
            }
          })
      );
    }
  }

  /** Payee Filter and Export Date Range */
  /**
   * @description Imports and filters payee data and initiates export.
   */
  importFilteredPayeeData() {
    const currentColumns: string[] = [];
    this.gridApi.getColumnState().forEach((el) => {
      if (el.colId !== 'boxId' && el.colId !== 'action') {
        currentColumns.push(el.colId);
      }
    });
    this.filterAndExportLoading = true;
    const payload = {
      type: '',
      items: currentColumns
    };
    this.filterAndExportLoading = true;
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
            const link = document.createElement('a');
            link.setAttribute('href', res.data.url);
            link.click();
            link.remove();
          }
        })
    );
  }

  // CHANGE FILTER AND EXPORT.
  /**
   * @description Toggles the visibility of the export options and advanced export settings.
   * @param {Event} event - The event object triggering the function call.
   */
  filterExportOne(event: Event) {
    event.stopPropagation();
    this.isShowExport = !this.isShowExport;
    this.isShowAdvancedExport = !this.isShowAdvancedExport;
  }

  /**
   * @description Toggles the visibility of the advanced export settings and basic export options.
   * @param {Event} event - The event object triggering the function call.
   */
  filterExportTwo(event: Event) {
    event.stopPropagation();
    this.isShowAdvancedExport = !this.isShowAdvancedExport;
    this.isShowExport = !this.isShowExport;
  }

  // ================> Export options
  /**
   * @description Retrieves data from the displayed table within specified pagination limits.
   * Transforms and prepares the data for export.
   * @returns {Object} An object containing the header and rows for export.
   */
  getTableData() {
    const paginationSize = this.gridApi.paginationGetPageSize();
    const currentPage = this.gridApi.paginationGetCurrentPage();
    const startRowIndex = paginationSize * currentPage;
    const endRowIndex = startRowIndex + paginationSize;
    const ignoreColumns = this.exportConfig?.ignoreColumns
      ? this.exportConfig?.ignoreColumns
      : ['id', 'action']; // Ignore default action and id column

    const rows: any[] = [];
    this.gridApi.forEachNode((node: IRowNode) => {
      if (
        (node?.rowIndex as number) >= startRowIndex &&
        (node?.rowIndex as number) < endRowIndex
      ) {
        rows.push(node.data);
      }
    });

    const colNames: any = {};
    this.getAllColumns?.forEach((col: any) => {
      const obj: any = { name: col.userProvidedColDef.headerName };

      if (col?.userProvidedColDef?.cellRendererForExport) {
        obj.cellRenderer = col?.userProvidedColDef?.cellRendererForExport;
      } else if (
        col?.userProvidedColDef?.cellRenderer &&
        typeof col?.userProvidedColDef?.cellRenderer === 'function'
      ) {
        obj.cellRenderer = col?.userProvidedColDef?.cellRenderer;
      }
      colNames[col.userProvidedColDef.field] = obj;
    });

    const colState: any[] = this.gridColumnApi
      .getColumnState()
      .map((col: any) => {
        col.name = colNames[col.colId]?.name;
        if (colNames[col.colId]?.cellRenderer) {
          col.cellRenderer = colNames[col.colId].cellRenderer;
        }
        return col;
      });

    const header: string[] = [];
    for (let i = 0; i < colState.length; i += 1) {
      if (!ignoreColumns.includes(colState[i].colId)) {
        header.push(colState[i].name);
      }
    }

    const rowsArr: any[] = [];
    for (let r = 0; r < rows.length; r += 1) {
      const row1 = [];
      for (let i = 0; i < colState.length; i += 1) {
        if (ignoreColumns.includes(colState[i].colId)) {
          continue;
        }
        if (colState[i]?.cellRenderer) {
          row1.push(
            colState[i].cellRenderer({
              data: rows[r],
              value: rows[r][colState[i].colId]
            })
          );
          continue;
        }
        row1.push(rows[r][colState[i].colId]);
      }
      rowsArr.push(row1);
    }

    return { header, rowsArr };
  }

  /**
   * @description Exports data as PDF for either printing or downloading.
   * @param {'print' | 'download'} option - The export option ('print' or 'download').
   */
  exportPdf(option: 'print' | 'download') {
    DataTableUtils.makeJspdf(
      option,
      this.getTableData(),
      this.exportConfig?.heading,
      this.exportConfig?.name
    );
  }

  /**
   * @description Exports data as a CSV file.
   */
  exportCsv() {
    const { header, rowsArr } = this.getTableData();
    const columnHeader: { data: { value: string } }[] = header.map((item) => ({
      data: { value: item }
    }));
    const tableRows: { data: { value: string } }[][] = rowsArr.map((items) =>
      items.map((item: string) => ({ data: { value: item } }))
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
   * @description Exports data as an Excel file.
   */
  exportExcel() {
    const { header, rowsArr } = this.getTableData();
    const columnHeader: {
      data: { value: string; type: ExcelDataType | ExcelOOXMLDataType };
    }[] = header.map((item) => ({ data: { value: item, type: 'String' } }));
    const tableRows: {
      cells: {
        data: { value: string; type: ExcelDataType | ExcelOOXMLDataType };
      }[];
    }[] = rowsArr.map((items) => ({
      cells: items.map((item: string) => ({
        data: { value: item, type: 'String' }
      }))
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

  /** getColumnsForExport(): string[] {
    let colIds: string[] |  undefined = this.getAllColumns?.map((row: any) => {
      return row.userProvidedColDef.field;
    });

    //remove id & action
    colIds = colIds?.slice(1, colIds.length - 1);
    return colIds!;
  }

   getExportParams(): { columnKeys: string[]; processCellCallback: (cell: any) => any; } {
    const params = {
      columnKeys: this.getColumnsForExport(),
      processCellCallback: (cell: any) => {
        let cellVal = cell.value;
        if (cell.column?.userProvidedColDef?.cellRendererForExport) {
          cellVal = cell.column.userProvidedColDef.cellRendererForExport({ data: cell.node.data, value: cell.value });
        }
        else if (cell.column?.userProvidedColDef?.cellRenderer &&
          typeof cell.column?.userProvidedColDef?.cellRenderer == 'function') {
          cellVal = cell.column.userProvidedColDef.cellRenderer({ data: cell.node.data, value: cell.value });
        }
        return cellVal;
      },
      // onlySelectedAllPages: true
    };
    return params;
  }
  */

  /**
   * @description Opens a dialog to send data as an email.
   * Retrieves the table data for email content.
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
            const excelFile = new File([this.exportedFile as Blob], 'exported_data.xlsx', {
              type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });   
            const formData = new FormData();
            formData.append('emailTo', res.emailId);
            formData.append('emailSubject', res.subject);
            if(res.message){
              formData.append('message', res.message);
            }
            formData.append('hiddenEmailContent', excelFile);
            this.subscriptions.push(
              this.dataTableService.sendEmail(formData).subscribe((data) => {
                if (data?.success) {
                  this.alertService.successAlert({
                    content: 'Email has been sent.',
                    close: true
                  });
                }
              })
            );
          }
        }
      );
  }

  getExcelFile() {    
    const { header, rowsArr } = this.getTableData();
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
      cells: items.map((item: any) => ({ data: { value: item, type: 'String' } }))
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
   * @description  Opens a dialog for sending filtered data as an email.
   * Retrieves the table data for email content and applies filters
   */
  importedFilteredSendEmail() {
    const tableArray: string[] = [];
    const dateToday = this.convertDate(new Date());
    const lastTenYears = this.convertDate(
      new Date().setFullYear(new Date().getFullYear() - 10)
    );

    const emailRef = this.dialog.open(ExportToEmailComponent, {
      width: '400px',
      maxWidth: '95%'
    });

    this.gridApi.getColumnState().forEach((el) => {
      switch (el.colId) {
        case 'cheques.cheque_status':
          tableArray.push('status');
          break;
        case 'cheque_amount':
          tableArray.push('amount');
          break;
        case 'payee_name':
          tableArray.push('payee');
          break;
        case 'bank_account_nick_name':
          tableArray.push('bank_nick_name');
          break;
        case 'bank_account_account_name':
          tableArray.push('bank');
          break;
        case 'cheque_serial_number':
          tableArray.push('cheque_no');
          break;
        case 'cheque_issue_date':
          tableArray.push('created_time');
          break;
        case 'cheque_created_by_name':
          tableArray.push('by');
          break;
        case 'cheque_memo':
          tableArray.push('memo');
          break;
        case 'catagory_name':
          tableArray.push('category');
          break;
        case 'cheque_account_number':
          tableArray.push('payee_ac_no');
          break;
        case 'cheque_invoice_number':
          tableArray.push('invoice_no');
          break;
        case 'cheques.created_at':
          tableArray.push('date');
          break;
        default:
          break;
      }
      this.item = tableArray;
    });

    emailRef
      .afterClosed()
      .subscribe(
        (res: { emailId: string; subject: string; message: string }) => {
          if (res) {
            const methods = 'email';

            const filterBody = {
              bankAccountId:
                this.filterAndExportBankAccount.value !== null
                  ? this.filterAndExportBankAccount.value
                  : 'all',
              fromDate:
                this.filterAndExportDateStart !== undefined
                  ? this.filterAndExportDateStart
                  : lastTenYears,
              toDate:
                this.filterAndExportDateEnd !== undefined
                  ? this.filterAndExportDateEnd
                  : dateToday,
              statusId: this.checkFilterStatus.value,
              categoryId:
                this.filterAndExportCategory.value !== null
                  ? this.filterAndExportCategory.value
                  : 'all',
              emailTo: res.emailId,
              emailSubject: res.subject,
              message: res.message,
              items: this.item,
              method: methods
            };

            this.filterAndExportLoading = true;
            this.subscriptions.push(
              this.dataTableService
                .sendFilteredMailForChecks(filterBody)
                .pipe(
                  finalize(() => {
                    this.filterAndExportLoading = false;
                  })
                )
                .subscribe((response) => {
                  if (response) {
                    this.alertService.successAlert({
                      content: 'Email has been sent.',
                      close: true
                    });
                  }
                })
            );
          }
        }
      );
  }

  // RESPONSIVE ALL AND ACTIONS BUTTON
  /**
   * @description Toggles the mobile view to display all items.
   */
  mobileAllToggle() {
    const allShowBtn = document.getElementById('allShow');
    allShowBtn?.classList.toggle('allshow');

    const actionBtn = document.getElementById('ocw-btns-action');
    actionBtn?.classList.remove('actionshow');

    const ocwOverlay: HTMLDivElement = document.querySelector(
      '.ocw-overlay-container'
    )!;
    ocwOverlay.style.display = 'block';
  }

  /**
   * @description Toggles the mobile view to display action items.
   */
  mobileActionToggle() {
    const actionBtn = document.getElementById('ocw-btns-action');
    actionBtn?.classList.toggle('actionshow');

    const allShowBtn = document.getElementById('allShow');
    allShowBtn?.classList.remove('allshow');

    const ocwOverlay: HTMLDivElement = document.querySelector(
      '.ocw-overlay-container'
    )!;
    ocwOverlay.style.display = 'block';
  }

  /**
   * @description Handles the click event on the ocw overlay container.
   */
  ocwOverlayContainerClick() {
    const ocwOverlay: HTMLDivElement = document.querySelector(
      '.ocw-overlay-container'
    )!;
    ocwOverlay.style.display = 'none';

    const actionBtn = document.getElementById('ocw-btns-action');
    actionBtn?.classList.remove('actionshow');

    const allShowBtn = document.getElementById('allShow');
    allShowBtn?.classList.remove('allshow');
  }
  // removeMainDropdown(event: any) {

  //   if (!this._notiDrop.nativeElement.contains(event.target)) {
  //     let allShowBtn = document.getElementById("allShow");
  //     allShowBtn?.classList.remove("allshow");

  //     let actionBtn = document.getElementById("ocw-btns-action");
  //     actionBtn?.classList.remove("actionshow");
  //   }

  // }

  // removeDropdown() {

  //   alert ("test")
  //     // let allShowBtn = document.getElementById("allShow");
  //     // allShowBtn?.classList.remove("allshow");

  //     // let actionBtn = document.getElementById("ocw-btns-action");
  //     // actionBtn?.classList.remove("actionshow");
  //     //     alert ("test")
  // }

  // HEADER PANEL BUTTON

  /**
   * @description  Handles a click event on a panel button.
   * Emits an event with button ID, selected rows, and table ID.
   * @param {string | number} btnId - The ID of the clicked panel button.
   */
  onPanelButtonClick(btnId: string | number) {
    this.headerButtonEvent.emit({
      id: btnId,
      selectedRows: this.selectedRows,
      tableId: this.tableId
    });
    this.selectedPanelButton = btnId;
  }

  // HEADER BUTTON
  /**
   * @description Handles a click event on a header button.
   * Emits an event with button ID and selected rows.
   * @param {string | number} btnId - The ID of the clicked header button.
   */
  onHeaderButtonClick(btnId: string | number) {
    this.headerButtonEvent.emit({ id: btnId, selectedRows: this.selectedRows });
    const actionBtn = document.getElementById('ocw-btns-action');
    actionBtn?.classList.toggle('actionshow');
  }

  /** COLUMN FILTER */
  /**
   * @description Handles the action of setting columns.
   */
  onSetColumn(): void {
    this.isbtnClick = true;
    const cols: IDtColumnFields['colDef'] = [];
    const colsField: string[] = [];

    this.columnFields.forEach((val: IDtColumnFields) => {
      if (val.isChecked) {
        cols.push(val.colDef);
        colsField.push(val.colDef?.field);
      }
    });
    this.postVisibleCols(colsField);
    this.gridApi?.setGridOption(
      'columnDefs',
      this.changeColumnPosition(cols, this.columnOrder)
    );
  }

  /**
   * @description Sends a list of visible columns to be stored on the server.
   * @param {string[]} cols - An array of column field names representing visible columns.
   */
  postVisibleCols(cols: string[]) {
    const visibility = {
      visibility: cols
    };
    this.subscriptions.push(
      this.dataTableService
        .postcolumnVisible(this.tableId, visibility)
        .subscribe(() => {})
    );
  }

  // column filter
  /**
   * @description Handles a change event for a specific column field.
   * @param {number} i - The index of the column field.
   */
  getChange(i: number) {
    this.columnFields[i].isChecked = !this.columnFields[i].isChecked;
  }

  menuClosed() {
    this.isShowExport = true;
    this.isShowAdvancedExport = false;
  }

  // storeToLocalStorage(arr: object[]) {
  //   localStorage.setItem('activeColumnList', JSON.stringify(arr));
  // }

  /**
   * @description Resets column settings to their default values.
   */
  onResetColumn() {
    const cols: IDtColumnFields['colDef'] = [];
    const colsField: string[] = [];
    this.columnFields.forEach((val) => {
      val.isChecked = true;
      cols.push(val.colDef);
      colsField.push(val.colDef?.field);
    });
    this.postVisibleCols(colsField);
    this.gridApi?.setGridOption('columnDefs', cols);
  }

  /**
   * @description  Changes the position of a column.
   * Moves the specified column to the specified index.
   */
  changePos(): void {
    this.gridColumnApi?.moveColumns(this.colName, this.colIndex as number); //Set Initial Column Position
  }

  /** PAGINATION SIZE CHANGE */
  /**
   * @description Handles the change event when the page size is modified.
   * @param {any} event - The event object containing the new page size value.
   */
  onPageSizeChanged(event: Event) {
    this.gridApi?.paginationSetPageSize(
      Number((event.target as HTMLInputElement).value)
    );
    // pagination
    this.colRange = Number((event.target as HTMLInputElement).value);
    this.paginationPageSize = Number((event.target as HTMLInputElement).value);
    if (this.totalCount / this.colRange - this.selectedValue <= 4) {
      this.selectedValue = this.totalCount / this.colRange - 4;
    }
    this.refreshFromAction = true;
    this.totoalPage();
    this.paginationArray();
    this.setStartEndRow();
    this.dataTableService.setSelectAllCheckboxValue(false);
    this.onPaginationPageSizeChange();
  }

  /**
   * @description Sets the start and end row indices for the current page in the grid.
   */
  setStartEndRow() {
    // if (this.gridApi?.destroyCalled) {
    //   return;
    // }
    const paginationSize = this.gridApi?.paginationGetPageSize();
    const currentPage = this.gridApi?.paginationGetCurrentPage();

    this.startPage = paginationSize * currentPage;
    this.endPage = this.startPage + paginationSize;
  }

  /**
   * @description  Handles the event when the pagination page size changes.
   */
  onPaginationPageSizeChange() {
    // Update cacheBlockSize when paginationPageSize changes
    this.cacheBlockSize = this.paginationPageSize;
  }

  /* SELECT ROWS  */
  /**
   * @description Handles the event when row selection changes.
   * Retrieves the selected rows from the grid.
   * @param {{ api: GridApi; columnApi: ColumnApi; type: string }} event - The event object containing grid and column information.
   */
  onRowSelectionChanged(event: {
    api: GridApi;
    columnApi: ColumnApi;
    type: string;
  }): void {
    const selectedRows = this.gridApi?.getSelectedRows();
    this.selectedRowCount = selectedRows?.length > 0 ? selectedRows?.length : 0;
    this.dataTableService.setDataFromFrameWorkComponent(
      selectedRows,
      this.tableId
    );
    this.onRowSelected.emit(event);

    this.subscriptions.push(
      this.dataTableService.headerButtonClassList$.subscribe((res) => {
        const action = res.action;
        res.ids.forEach((id: string) => {
          this.headerElements?.buttons?.forEach((val) => {
            if (id == val.id && action === 'add') {
              //Add Class List
              const element: NodeListOf<HTMLDivElement> =
                document.querySelectorAll('#' + val.id)!;
              element.forEach((element) => {
                element.classList.add(
                  ...(res.cssClass.length !== 0 ? res.cssClass : ['btn_blur'])
                );
              });
            } else if (id == val.id && action === 'remove') {
              // Remove Class List
              const element: NodeListOf<HTMLDivElement> =
                document.querySelectorAll('#' + val.id)!;
              element.forEach((element) => {
                element.classList.remove(
                  ...(res.cssClass.length !== 0 ? res.cssClass : ['btn_blur'])
                );
              });
            }
          });
        });
      })
    );
  }

  //GET THE RANGE OF DATAS
  /**
   * @description Retrieves the date range for the data table from a service.
   */
  getRange() {
    this.subscriptions.push(
      this.selectedService.getDataTableDateRange().subscribe((val) => {
        if (val) {
          setTimeout(() => {
            this.selectedRange = val;
          }, 0);
        }
      })
    );
  }

  //ON ROW CLICK
  /**
   * @description Handles the event when a row is clicked.
   * Emits an event indicating that a row has been clicked.
   * @param {RowClickedEvent<any>} event - The event object containing information about the clicked row.
   */
  onRowClick(event: RowClickedEvent<any>): void {
    this.rowClicked.emit(event);
  }

  /**
   * @description Handles the event when a column is resized.
   * @param {ColumnResizedEvent<any>} event - The event object containing information about the resized column.
   */
  onColumnResizedCall(event: ColumnResizedEvent<any>): void {
    if (event.finished) {
      this.getAllColumns?.forEach((column: any) => {
        this.currentColWidth.push(column.actualWidth);
        this.allColumnIds.push(column.colId);
      });

      const tableResizeDataData: any = {};
      this.allColumnIds.forEach(
        (key, i) => (tableResizeDataData[key] = this.currentColWidth[i])
      );

      const Sizes = {
        size: tableResizeDataData
      };

      let dataTableColumnSize: any = this.localStorageService.getItem(
        'dataTableColumnSize'
      );

      if (dataTableColumnSize) {
        dataTableColumnSize = JSON.parse(dataTableColumnSize);
      } else {
        dataTableColumnSize = {};
      }
      dataTableColumnSize[this.tableId] = Sizes;
      this.localStorageService.setItem(
        'dataTableColumnSize',
        dataTableColumnSize
      );
    }

    this.allColumnIds = [];
    this.currentColWidth = [];
  }

  onColumnResized() {
    // clearTimeout(this.onColumnResizeTimeout);
    // this.onColumnResizeTimeout = setTimeout(() => {
    //   this.onColumnResizedCall(event)
    // }, 1500);
  }

  /**
   * @description Handles the event when a column is moved.
   */
  onColumnMovedCall(): void {
    this.columnOrderChangeUpdation();
  }

  /**
   * @description Updates the column order and sends the updated order data to the server.
   */
  columnOrderChangeUpdation() {
    // if (this.gridApi?.destroyCalled) {
    //   return;
    // }
    const cols = this.gridApi?.getAllGridColumns();
    const colToNameFunc = (col: any) => col.getId();
    const colToIndexFunc = (_col: any, index: number) => index;

    this.colName = cols?.map(colToNameFunc);
    this.colIndex = cols?.map(colToIndexFunc);

    const result: { [key: string]: number } = {};
    this.colName?.forEach(
      (key: string, i: number) => (result[key] = (this.colIndex as number[])[i])
    ); // compain field and column position
    this.columnOrder = result;
    this.tableMovePositionData = { order: result };

    this.subscriptions.push(
      this.dataTableService
        .postcolumnOrder(this.tableId, this.tableMovePositionData)
        .subscribe(() => {
          //Sent current position to server
          // if (res.success == true)
        })
    );
  }

  /**
   * @description Handles the event when a column is moved with a timeout.
   */
  onColumnMoved() {
    clearTimeout(this.onColumnMovedTimeout);

    this.onColumnMovedTimeout = setTimeout(() => {
      this.onColumnMovedCall();
    }, 1000);
  }

  /** PAGINATION CONTROL */
  /**
   * @description Handles the event when the user navigates to the previous page.
   */
  onPrevious() {
    if (this.initialPage > 1) {
      this.initialPage--;
      this.gotoPage(this.initialPage, true);
      this.gridApi?.paginationGoToPreviousPage();
      this.setStartEndRow();
      this.onPaginationPageSizeChange();
    }

    // this.gridApi.paginationGoToNextPage();
  }

  /**
   * @description Handles the event when the user navigates to the next page.
   */
  onNext() {
    if (this.initialPage < this.totalPage) {
      this.initialPage++;
      this.gotoPage(this.initialPage, true);
      this.gridApi?.paginationGoToNextPage();
      this.setStartEndRow();
      this.onPaginationPageSizeChange();
    }
  }

  // ***************************************** ON GRID READY FUNCTION *****************************************
  /**
   * @description Handles the event when the grid is ready for interaction.
   * @param {GridReadyEvent} params - Contains grid-related information.
   */
  onGridReady(params: any): void {
    this.gridColumnApi = params.columnApi;
    this.getAllColumns = params.api.getColumns();
    this.gridApi = params.api;
    this.gridOption = {
      ...this.gridOption,
      ...params
    };

    (this.gridOption.getRowId = function (data: any) {
      return data.id;
    }),
      (this.dataTableService.gridOptionApi = this.gridApi);

    const allColumnIds: string[] = [];
    this.getAllColumns?.forEach((column: any) => {
      allColumnIds.push(column.colId);
    });

    //-----> set initial date filter --->
    this.initialDateFilter(params);

    const scrollRemove: HTMLDivElement = document.querySelector(
      '.ag-body.ag-layout-normal'
    )!;
    const setHeight: HTMLDivElement = document.querySelector(
      '.ag-body-viewport.ag-layout-normal'
    )!;
    const htmlElements = { scrollRemove, setHeight };

    const datasource: IServerSideDatasource = {
      getRows: (params: IServerSideGetRowsParams) => {
        this.dataTableService.setSelectAllCheckboxValue(false);

        this.disableRefreshingBtn = true;
        let cachedRowData: undefined | string = undefined;

        this.showNoResult = false;
        scrollRemove?.classList.add('scroll_remove');
        setHeight?.classList.add('set_height');

        // Load cached data if initial payload and not an action
        if (
          !this.refreshFromAction &&
          this.isInitialPayload(params.request) &&
          this.dtCacheService.firstLoadFromCache &&
          !this.refreshingBtn &&
          !this.dataTableService.isEyeButtonClicked
        ) {
          this.dtCacheService.getDataById(this.tableId).then((cacheData) => {
            if (cacheData?.length) {
              let response = cacheData[0]?.data;
              response = JSON.parse(response);

              cachedRowData = response.rowData;
              const cachedAttachCommentData = cacheData[0]?.attachCommentData
                ? JSON.parse(cacheData[0]?.attachCommentData)
                : null;

              return this.onGetTableListDataSuccess(
                params,
                requestPayload,
                response,
                htmlElements,
                cachedAttachCommentData
              );
            }
          });
        }

        // API call
        let requestPayload: any = { ...params.request, ...this.postData };
        if (this.transactionType) {
          requestPayload.filterModel.txnType = {
            filterType: 'text',
            type: 'equals',
            filter: this.transactionType
          };
        }
        this.requestPayLoadFilter = requestPayload.filterModel?.transferType
          ?.filter
          ? requestPayload.filterModel.transferType.filter
          : 'all';

        if (this.dataTableService.isEyeButtonClicked && this.tableId === 1) {
          requestPayload = this.dataTableService
            .dataTablePayload as IRequestPayload;
        }
        this.dataTableService.isEyeButtonClicked = false;
        if (
          (this.dataTableService.dataTablePayload as IDefaultPayload)?.payeeIds
            ?.length
        ) {
          requestPayload.payeeIds = (
            this.dataTableService.dataTablePayload as IDefaultPayload
          )?.payeeIds;
          (this.dataTableService.dataTablePayload as IDefaultPayload).payeeIds =
            [];
        }
        this.subscriptions.push(
          this.dataTableService
            .getTableListData(requestPayload, this.tableId)
            .subscribe((response) => {
              this.dataTableService.dataTablePayload =
                requestPayload as IDefaultPayload;

              // if permission denied
              if (!response.success && response.permissionType === 'page') {
                this.router.navigateByUrl('/manage/permission-denied');
                return;
              }

              // Don't reload if cached data is same as new row data
              if (
                JSON.stringify(cachedRowData) !==
                JSON.stringify(response.rowData)
              ) {
                this.onGetTableListDataSuccess(
                  params,
                  requestPayload,
                  response,
                  htmlElements
                );
                if (response.rowData?.length) {
                  this.cacheDtData(requestPayload, response);
                }
              } else {
                this.getTotalCount(response);
              }
            })
        );
      }
    };

    this.getTableColumnData(params, datasource);

    // setting the datasource, the grid will call getRows to pass the request

    this.subscriptions.push(
      this.dataTableService.getRefreshStatus().subscribe((val) => {
        if (
          val.status &&
          (val.tableId === this.tableId || val.tableId === undefined)
        ) {
          this.refreshServerSideStore();
        }
      })
    );
  }

  private getTableColumnData(
    params: GridReadyEvent,
    datasource: IServerSideDatasource
  ) {
    this.subscriptions.push(
      this.dataTableService
        .getTableColumnData(this.tableId)
        .subscribe((res) => {
          if (res) {
            const getOrder = res.data?.column_order;
            this.columnOrder = getOrder;
            const visibility = res.data?.column_visibility;
            let loadColDef: IDtColumnFields['colDef'] = this.columnDefs;
            if (!this.columnOrder) {
              this.columnOrderChangeUpdation();
            }
            if (visibility) {
              loadColDef = [];
              this.columnFields.forEach((data: IDtColumnFields) => {
                if (
                  visibility.includes(data.colDef?.field) ||
                  this.fieldsShownByDefault.includes(data.colDef?.field)
                ) {
                  loadColDef.push(data.colDef);
                } else {
                  data.isChecked = false;
                }
              });
            } else {
              loadColDef = [];
              this.columnFields.forEach((val: IDtColumnFields) => {
                if (val.isChecked) {
                  loadColDef.push(val.colDef);
                }
              });
            }
            if (getOrder) {
              loadColDef = this.changeColumnPosition(loadColDef, getOrder);
              this.colName = Object.keys(getOrder);
              this.colIndex = Object.values(getOrder);
              this.colIndex = this.colIndex.join();
            }
            if (visibility || getOrder) {
              this.gridApi?.setGridOption('columnDefs', loadColDef);
            }
            if (!res.data) {
              loadColDef = [];
              this.columnFields.forEach((val: IDtColumnFields) => {
                if (val.isChecked) {
                  loadColDef.push(val.colDef);
                }
              });
              this.gridApi?.setGridOption('columnDefs', loadColDef);
            }
          }
          params.api.setGridOption('serverSideDatasource', datasource);
        })
    );
  }

  /**
   * @description Changes the position of columns in a DataTable by sorting the column fields based on the specified order.
   *
   * @param {IDtColumnFields['colDef']} columnFields - An array of column fields to be reordered.
   * @param {Object.<string, number>} order - An object that defines the sorting order for columns, where keys are column field names and values are sorting order indices.
   * @returns An array of reordered columnDefs.
   */
  changeColumnPosition(
    columnFields: IDtColumnFields['colDef'],
    order: { [key: string]: number }
  ) {
    columnFields.sort(
      (a: { field: string | number }, b: { field: string | number }) =>
        order[a.field] - order[b.field]
    );
    return columnFields;
  }

  private refreshServerSideStore() {
    this.refreshFromAction = true;
    this.gridApi?.refreshServerSide({
      route: [],
      purge: true
    });
  }

  /**
   * @description Updates the total count of rows and recalculates pagination-related values.
   * @param {IDtResponse} response - The response containing row count information.
   */
  getTotalCount(response: IDtResponse) {
    this.totalCount = response.rowCount;
    this.totoalPage();
    this.paginationArray();
    this.setStartEndRow();
  }

  /**
   * @description Handles the success of fetching table list data and performs necessary operations.
   * @param {IServerSideGetRowsParams} params - The parameters for getting server-side rows.
   * @param {IServerSideGetRowsRequest} requestPayload - The request payload for server-side rows.
   * @param {IDtResponse} response - The response containing row data and related information.
   * @param {{ [key: string]: HTMLDivElement }} htmlElements - An object containing HTML elements for manipulation.
   * @param {IDtAttachComntArray[] | null} [attachCommentCache=null] - Cached attachment and comment data.
   */
  onGetTableListDataSuccess(
    params: IServerSideGetRowsParams,
    requestPayload: IServerSideGetRowsRequest,
    response: IDtResponse,
    htmlElements: { [key: string]: HTMLDivElement },
    attachCommentCache: IDtAttachComntArray[] | null = null
  ) {
    this.refreshFromAction = false; // reset
    this.dtCacheService.firstLoadFromCache = true; // reset

    this.setStoreInfo([
      { storeInfo: response.storeInfo },
      { filters: response?.input?.filterModel }
    ]); // for financial statement
    this.totalCount = response.rowCount;
    this.totoalPage();
    this.paginationArray();
    this.setStartEndRow();

    if (this.statusArray) {
      this.dataIds = [];
      response.rowData.forEach((element: { [index: string]: any }) => {
        this.dataIds.push(element[this.statusArray.field]);
      });

      this.getAddAttachmentAddComment(
        params,
        response,
        requestPayload,
        attachCommentCache
      );
    } else {
      this.onRenderRowData(params, response, htmlElements);
    }

    if (this.tableId === 1) {
      // Get check tracking url for CHECK LIST
      this.getCheckTrackingUrl(response.rowData);
    }
  }

  /**
   * @description Retrieves the tracking URLs for checks with a specific status.
   * @param {Object[]} rowData - An array of objects representing row data.
   */
  getCheckTrackingUrl(rowData: { [key: string]: unknown }[]) {
    const checkIds: string[] = [];
    rowData.forEach((row) => {
      if (row.cheque_status === 7) {
        checkIds.push(row.id as string);
      }
    });
    if (checkIds?.length) {
      this.checkService.getTrackingUrl(checkIds);
    }
  }

  /**
   * @description  Renders the row data in the grid after a successful server-side request.
   * @param {IServerSideGetRowsParams} params - The parameters of the server-side request.
   * @param {IDtResponse} response - The response containing the row data.
   * @param {{ [key: string]: HTMLDivElement }} htmlElements - An object containing HTML elements.
   */
  onRenderRowData(
    params: IServerSideGetRowsParams,
    response: IDtResponse,
    htmlElements: { [key: string]: HTMLDivElement }
  ) {
    this.showNoResult = !this.totalCount;
    if (this.tableId === 34 && this.tableInitialLoad) {
      this.tableInitialLoad = !this.totalCount;
    }

    params.success({
      rowData: response.rowData,
      rowCount: response.rowCount
    });

    // if (!this.gridApi?.destroyCalled) {
    //   this.gridApi.deselectAll();
    // }

    setTimeout(() => {
      htmlElements.scrollRemove?.classList.remove('scroll_remove');
      htmlElements.setHeight?.classList.remove('set_height');
    }, 100);

    if (this.refreshingBtn || this.disableRefreshingBtn) {
      setTimeout(() => {
        this.disableRefreshingBtn = false;
      }, 5000);
      this.refreshingBtn = false;
    }
  }

  /**
   * @description Prevents event propagation.
   * @param {Event} event - The event object.
   */
  prevent(event: any) {
    event.stopPropagation();
  }

  /**
   * @description Cache the DataTable data if it's the initial payload.
   * @param {IServerSideGetRowsRequest} payload - The request payload.
   * @param {IDtResponse} response - The response data.
   */
  cacheDtData(payload: IServerSideGetRowsRequest, response: IDtResponse) {
    // Cache only initial loaded data
    if (this.isInitialPayload(payload)) {
      const payloadStr = JSON.stringify(payload).toString();
      const data = JSON.stringify(response).toString();
      this.dtCacheService.addRowData(this.tableId, payloadStr, data);
    }
  }

  /**
   * @description Caches attachment and comment data for the specified table.
   * @param {IDtAttachComntArray[]} data - The attachment and comment data to be cached.
   */
  cacheAttachCommentData(data: IDtAttachComntArray[]) {
    this.dtCacheService.updateAttachmentComment(
      this.tableId,
      JSON.stringify(data)
    );
  }

  // Which request to cache
  /**
   * @description Checks if the payload represents an initial load with specific conditions.
   * @param {IServerSideGetRowsRequest} payload - The payload to be checked.
   * @returns {boolean} Returns true if the payload meets the initial load conditions, otherwise false.
   */
  isInitialPayload(payload: any): boolean {
    this.cacheBlockSize = this.paginationPageSize;
    const dateFilters: IDtDateFilterItem[] =
      this.dataTableService.getDateFieldId()!;
    const ids = dateFilters?.filter((e) => e.isPrimary).map((e) => e.id);
    const dateFiltersStr = ids?.length ? JSON.stringify(ids) : null;
    const filterModelStr = Object.keys(payload.filterModel)?.length
      ? JSON.stringify(Object.keys(payload.filterModel))
      : null;
    if (
      payload &&
      payload.startRow === 0 &&
      payload.endRow === this.cacheBlockSize &&
      !payload.sortModel?.length &&
      dateFiltersStr === filterModelStr
    ) {
      return true;
    }
    return false;
  }

  // GET ATTACMENT AND COMMENT STATUS
  /**
   * @description Handles adding attachments and comments to the rows in the table.
   * @param {IServerSideGetRowsParams} params - The parameters for getting rows.
   * @param {IDtResponse} response - The response containing row data.
   * @param {IServerSideGetRowsRequest} requestPayload - The request payload.
   */
  getAddAttachmentAddComment(
    params: IServerSideGetRowsParams,
    response: IDtResponse,
    requestPayload: IServerSideGetRowsRequest,
    attachCommentCache: IDtAttachComntArray[] | null = null
  ) {
    const scrollRemove: HTMLDivElement = document.querySelector(
      '.ag-body.ag-layout-normal'
    )!;
    const setHeight: HTMLDivElement = document.querySelector(
      '.ag-body-viewport.ag-layout-normal'
    )!;
    const htmlElements = { scrollRemove, setHeight };
    const data = { ids: this.dataIds };

    // If cached data available
    if (attachCommentCache) {
      this.dataTableService.setAttachmentCommentStatus(attachCommentCache);
      this.onRenderRowData(params, response, htmlElements);
    }
    this.getAttachmentCommentData(
      data,
      params,
      response,
      requestPayload,
      htmlElements,
      attachCommentCache
    );
  }

  /**
   * @description Retrieves attachment and comment data for the specified rows.
   * @param {Object} data - The object containing IDs of the rows to retrieve data for.
   * @param {string[]} data.ids - An array of IDs representing the rows.
   * @param {IServerSideGetRowsParams} params - The parameters for getting rows.
   * @param {IDtResponse} response - The response containing row data.
   * @param {IServerSideGetRowsRequest} requestPayload - The request payload.
   * @param {Object.<string, HTMLDivElement>} htmlElements - HTML elements for manipulation.
   * @param {IDtAttachComntArray[] | null} attachCommentCache - Cached attachment and comment data (optional).
   */
  getAttachmentCommentData(
    data: { ids: string[] },
    params: IServerSideGetRowsParams,
    response: IDtResponse,
    requestPayload: IServerSideGetRowsRequest,
    htmlElements: { [key: string]: HTMLDivElement },
    attachCommentCache: IDtAttachComntArray[] | null
  ) {
    this.subscriptions.push(
      this.dataTableService
        .getAddAttachmentAddComment(this.statusArray.dataTableName, data)
        .subscribe((res) => {
          if (res.success) {
            if (
              JSON.stringify(attachCommentCache) !== JSON.stringify(res.data)
            ) {
              this.dataTableService.setAttachmentCommentStatus(res.data);
              this.cacheAttachCommentData(res.data);
              this.onRenderRowData(params, response, htmlElements);
            }
          } else {
            this.getAddAttachmentAddComment(params, response, requestPayload);
          }
        })
    );
  }

  /**
   * @description Initializes the date filter for the grid using the specified date field.
   * @param {GridReadyEvent} params - The grid ready event containing column and grid APIs
   */
  initialDateFilter(params: GridReadyEvent) {
    let start: unknown;
    let end: unknown;
    let fieldId: string | undefined;

    const dateFeilds = this.dataTableService.getDateFieldId();

    if (dateFeilds) {
      for (const item of dateFeilds) {
        if (item?.isCustomDateFilter?.enabled && item?.isPrimary) {
          this.setInitialCustomDateFilter(item, params);
          break;
        } else if (item.isPrimary) {
          fieldId = item.id;
          break;
        }
      }
    }

    // Default date filter - 10 Years (all time)
    if (fieldId) {
      this.today = this.dateAdapter.getValidDateOrNull(new Date());
      const year = this.dateAdapter.getYear(this.today as D);
      start = this.dateAdapter.addCalendarYears(this.today as D, -10);
      end = this.dateAdapter.createDate(year + 10, 1, 1);

      params.api.setColumnFilterModel(fieldId, {
        dateFrom: this.datePipe.transform(start as Date, 'YYYY-MM-dd 00:00:00'),
        dateTo: this.datePipe.transform(end as Date, 'YYYY-MM-dd 00:00:00'),
        filterType: 'date',
        type: 'inRange'
      });
    }
  }

  // setting primary/initial date filter a custom date filter
  /**
   * @description Sets the initial custom date filter for the specified date field.
   * @param {IDtDateFilterItem} filterItem - The date filter item containing custom date filter properties.
   * @param {GridReadyEvent} gridParams - The grid ready event containing column and grid APIs.
   */
  setInitialCustomDateFilter(
    filterItem: IDtDateFilterItem,
    gridParams: GridReadyEvent
  ) {
    gridParams.api.setColumnFilterModel(filterItem.id, {
      dateFrom: this.datePipe.transform(
        filterItem.isCustomDateFilter?.prop.startDate,
        'YYYY-MM-dd 00:00:00'
      ),
      dateTo: this.datePipe.transform(
        filterItem.isCustomDateFilter?.prop.endDate,
        'YYYY-MM-dd 00:00:00'
      ),
      filterType: 'date',
      type: 'inRange'
    });
  }

  // pagination count set
  initialPage = 1;
  selectedValue!: number;
  pseudoI!: number;

  /**
   * @description Calculates the total number of pages based on the total count and selected range.
   */
  totoalPage() {
    if (this.isFloat(this.totalCount / this.colRange)) {
      this.totalPage = Math.trunc(this.totalCount / this.colRange) + 1;
    } else {
      this.totalPage = this.totalCount / this.colRange;
    }
    if (this.isFloat(this.selectedValue)) {
      this.selectedValue = Math.trunc(this.selectedValue) + 1;
    }
  }

  //  SWITCH pageArr ARRAY MODE
  /**
   * @description Generates an array of page numbers based on the pagination mode and total page count.
   */
  paginationArray() {
    switch (this.mode) {
      case 1:
        this.pageArr = [
          this.initialCount,
          this.initialCount + 1,
          this.initialCount + 2,
          this.initialCount + 3,
          this.initialCount + 4,
          '...',
          this.totalPage
        ];
        break;

      case 2:
        this.pageArr = [
          this.initialCount,
          '...',
          this.selectedValue - 1,
          this.selectedValue,
          this.selectedValue + 1,
          '...',
          this.totalPage
        ];
        break;

      case 3:
        this.pageArr = [
          this.initialCount,
          '...',
          this.totalPage - 4,
          this.totalPage - 3,
          this.totalPage - 2,
          this.totalPage - 1,
          this.totalPage
        ];
        break;

      default:
        break;
    }

    if (this.totalPage < 8) {
      this.pageArr = [];

      for (let i = 1; i <= this.totalPage; i += 1) {
        this.pageArr.push(i);
      }
    }
  }

  // SELECTED PAGE AND NAVIGATION FOR PAGE SELECTION
  /**
   * @description Navigates to the specified page and updates the pagination mode and array.
   * @param {number} item - The target page number.
   * @param {boolean} [navigation] - Indicates whether the navigation is triggered by user interaction.
   */
  gotoPage(item: number | '...', navigation?: boolean) {
    if (typeof item === 'number') {
      if (item > 0) {
        this.initialPage = item;
        if (item < this.initialCount + 4) {
          this.mode = 1;
          this.paginationArray();
        } else if (item > this.initialCount + 3 && item < this.totalPage - 3) {
          this.selectedValue = item;
          this.mode = 2;
          this.paginationArray();
          this.pseudoI = 4;
        } else {
          this.mode = 3;
          this.paginationArray();
          this.pseudoI = 7 - (this.totalPage - item);
        }
        if (!navigation) {
          this.gridApi?.paginationGoToPage(item - 1);
        }
      }
    }
    this.dataTableService.setSelectAllCheckboxValue(false);
    this.setStartEndRow();
    this.onPaginationPageSizeChange();
  }

  // CHECK THE TOTAL PAGE FLOAT OR NOT
  /**
   * @description Checks if a number is a floating-point number.
   * @param {number} n - The number to be checked.
   * @returns {boolean} Returns true if the number is a floating-point number, otherwise returns false.
   */
  isFloat(n: number) {
    return Number(n) === n && n % 1 !== 0;
  }

  /**
   * @description Validates and updates the 'defval' input field value for page navigation.
   * @param {number} value - The value entered in the input field.
   */
  gotoPageEnter(value: number) {
    if (value >= 1) {
      if (Number(this.defval) > this.totalPage) {
        this.defval = this.totalPage;
      }
    } else {
      this.defval = '';
    }
  }

  /**
   * @description Triggers the page navigation based on the value entered in the input field ('defval').
   */
  gotoPageEntered() {
    if (Number(this.defval) >= 1) {
      this.gotoPage(Number(this.defval));
    }
    this.defval = '';
  }

  /**
   * @description Emits the provided value as a `getStoreInfo` event.
   * @param { ({ storeInfo: unknown; filters?: undefined; } | { filters: unknown; storeInfo?: undefined; })[]} value - The value to be emitted.
   */
  setStoreInfo(
    value: (
      | { storeInfo: unknown; filters?: undefined }
      | { filters: unknown; storeInfo?: undefined }
    )[]
  ) {
    this.getStoreInfo.emit(value);
  }

  /**
   * @description Subscribes to the _headerData observable from the headerService to process loaded header data.
   */
  loadedHeaderDataAndProcess() {
    const headerSubscription = this.headerService._headerData.subscribe(
      (headerData) => {
        if (headerData) {
          if (headerData.personalInfo?.isLegalEnabled == '1') {
            this.isLegalEnabled = true;
          }
          setTimeout(() => {
            headerSubscription.unsubscribe();
          }, 1);
        }
      }
    );
  }

  /**
   * @description Subscribes to the dataTableService's deselectAll$ observable to deselect all rows in the grid when triggered.
   */
  deselectAll() {
    this.dataTableService.deselectAll$.subscribe((res) => {
      if (res) {
        this.gridApi?.deselectAll();
      }
    });
  }

  /**
   * @description TrackBy and ngFor together allow Angular to detect the specific node element that needs to change or be added instead of rebuilding the whole array
   * @param item - pageSize
   * @returns
   */
  identity(item: number) {
    return item;
  }

  ngOnDestroy(): void {
    this.gridApi?.destroy();
    this.dataTableService.setRefreshStatus(false);
    this.subscriptions.forEach((s) => s.unsubscribe());
    this.dataTableService.selectedCellValueSignal.set(undefined);
  }

  onFilterChanged(event: FilterChangedEvent): void {
    this.dataTableService.setMainFilter('filterChanged', 'agGridFilter');
  }
}

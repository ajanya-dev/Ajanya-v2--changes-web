import {
  Component,
  computed,
  DestroyRef,
  inject,
  Input,
  OnInit,
  output,
  signal
} from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { V3DataTableComponent } from 'src/app/modules/v3-data-table/components/v3-data-table/v3-data-table.component';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { V3DataTableSelectBoxComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-data-table-select-box/v3-data-table-select-box.component';
import { DtSearchBoxComponent } from 'src/app/modules/data-table/components/dt-search-box/dt-search-box.component';
import { DataRangeV35Component } from 'src/app/shared/components/date-range-v35/data-range-v35.component';
import { IV3DtHeaderElements } from 'src/app/modules/v3-data-table/models/v3-data-table';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { IQuickBookBody } from 'src/app/modules/check/model/check';
import { ThirdpartyImportMainModalComponent } from 'src/app/shared/modal/thirdparty-imports/thirdparty-import-main-modal/thirdparty-import-main-modal.component';
import { MatDialog } from '@angular/material/dialog';

export interface IQbTransactionsRowData {
  id: string;
  realm_id: string;
  company_name: string;
  item_id: number;
  type: string;
  doc_number: string;
  txn_date: string;
  memo: string;
  total_amt: string;
  payee_name: string;
  bank_name: string;
  account_ref: string;
  status: number;
  imported_at: string;
  created_at: string;
  updated_at: string;
}

/**
 * @description QuickBooks Online Transactions Table Component
 * Displays a list of QB transactions that can be imported
 */
@Component({
  selector: 'app-qb-transactions-table',
  templateUrl: './qb-transactions-table.component.html',
  styleUrls: ['./qb-transactions-table.component.scss'],
  standalone: true,
  imports: [CommonModule, V3DataTableComponent],
  providers: [CurrencyPipe]
})
export class QbTransactionsTableComponent implements OnInit {
  /* Injectors */
  private v3DataTableService = inject(V3DataTableService);
  private dataTableService = inject(DataTableService);
  private currencyPipe = inject(CurrencyPipe);
  private alertService = inject(AlertService);
  private sharedService = inject(SharedService);
  private destroyRef = inject(DestroyRef);
  private matDialog = inject(MatDialog);
  @Input() isFromPaymentsV3 = false;

  loading = signal(false);
  isDeleteLoading = signal(false);
  selectAllPayment = output<boolean>();

  /** DATA TABLE VARIABLES */
  tableId = DTTableId.qbOnlineTransactions;
  extendPagination = false;

  frameworkComponents = {
    selectBoxComponent: V3DataTableSelectBoxComponent,
    SearchBoxComponent: DtSearchBoxComponent,
    dateRangeV35Component: DataRangeV35Component
  };

  /** Checkbox column for row selection */
  colDefId = {
    maxWidth: 50,
    headerName: '',
    sortable: false,
    field: 'id',
    suppressFloatingFilterButton: true,
    suppressHeaderMenuButton: true,
    lockPosition: true,
    headerCheckboxSelection: true,
    checkboxSelection: true,
    showDisabledCheckboxes: true,
    cellRenderer: () => ''
  };

  public headerElements = computed<IV3DtHeaderElements>(() => ({
    panelButtons: [],

    buttons: [
      {
        text: 'Convert to Payments ',
        id: 'id_create_check',
        isAddIcon: true,
        icon: ['fas', 'plus'],
        backGroundInput: 'var(--common-green-color)',
        type: 'list',
        loading: this.loading(),
        disabled: this.loading()
      },
      {
        text: 'Clear',
        id: 'multipleDelete',
        isAddIcon: true,
        icon: ['fas', 'trash'],
        backGroundInput: 'var(--common-red-color)',
        type: 'list',
        loading: this.isDeleteLoading(),
        disabled: this.isDeleteLoading()
      },
      {
        text: 'Import',
        id: 'id_import',
        isAddIcon: true,
        icon: ['fas', 'arrow-down-to-line'],
        type: 'list'
      }
    ]
  }));

  floatingFilterComponent = {
    selectBox: [
      {
        id: 'status',
        values: [
          { value: '0', name: 'Pending' },
          { value: '1', name: 'Imported' },
          { value: '2', name: 'Skipped' }
        ]
      },
      {
        id: 'type',
        values: [
          { value: 'check', name: 'Check' },
          { value: 'billpayment', name: 'Bill Payment' },
          { value: 'expense', name: 'Expense' },
          { value: 'refundreceipt', name: 'Refund Receipt' }
        ]
      }
    ]
  };

  /** Table columns */
  colDefDocNumber = {
    headerName: 'Doc Number',
    field: 'doc_number',
    minWidth: 120,
    maxWidth: 150,
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center'
  };

  colDefPayeeName = {
    headerName: 'Payee Name',
    field: 'payee_name',
    minWidth: 180,
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center'
  };

  colDefAmount = {
    headerName: 'Amount',
    field: 'total_amt',
    minWidth: 100,
    maxWidth: 130,
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    floatingFilterComponent: 'SearchBoxComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex justify-end pr-3 text-end mt-0.5',
    cellRenderer: (params: { value: string | number }) =>
      this.currencyPipe.transform(params.value)
  };

  colDefTxnDate = {
    headerName: 'Transaction Date',
    field: 'txn_date',
    minWidth: 150,
    suppressFloatingFilterButton: true,
    filter: 'agDateColumnFilter',
    floatingFilterComponent: 'dateRangeV35Component',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center'
  };

  colDefType = {
    headerName: 'Type',
    field: 'type',
    minWidth: 120,
    maxWidth: 150,
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    floatingFilterComponent: 'selectBoxComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center capitalize'
  };

  colDefCompanyName = {
    headerName: 'Company',
    field: 'company_name',
    minWidth: 150,
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center'
  };

  colDefBankName = {
    headerName: 'Bank Account',
    field: 'bank_name',
    minWidth: 150,
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center'
  };

  colDefMemo = {
    headerName: 'Memo',
    field: 'memo',
    minWidth: 200,
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center'
  };

  colDefStatus = {
    headerName: 'Status',
    field: 'status',
    minWidth: 120,
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    floatingFilterComponent: 'selectBoxComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center',
    cellRendererParams: {
      isStatementDisable: true,
      isApplyTitleCase: true
    },
    cellRenderer: (params: { value: string | number }) => {
      const value = params.value as number;
      const statusMap: Record<number, string> = {
        0: 'Pending',
        1: 'Imported',
        2: 'Skipped'
      };
      let color: string;
      switch (value) {
        case 0:
          color = 'var(--common-yellow-color)';
          break;
        case 1:
          color = 'var(--common-green-color)';
          break;
        default:
          color = 'var(--main-text-color)';
          break;
      }
      return `<span title="${statusMap[value]}"
          style="color:${color};font-weight: 500;font-size:13px">
          ${statusMap[value]}
        </span>`;
    }
  };

  /**
   * Default column fields for column chooser support (required for v3 data table)
   */
  defaultColumnFields = [
    {
      id: 'id',
      name: '#',
      isDisabled: true,
      colDef: this.colDefId,
      isChecked: true
    },
    {
      id: 'doc_number',
      name: 'Doc Number',
      isDisabled: true,
      colDef: this.colDefDocNumber,
      isChecked: true
    },
    {
      id: 'company_name',
      name: 'Company',
      isDisabled: true,
      colDef: this.colDefCompanyName,
      isChecked: true
    },
    {
      id: 'payee_name',
      name: 'Payee Name',
      isDisabled: true,
      colDef: this.colDefPayeeName,
      isChecked: true
    },
    {
      id: 'bank_name',
      name: 'Bank Account',
      isDisabled: true,
      colDef: this.colDefBankName,
      isChecked: true
    },
    {
      id: 'total_amt',
      name: 'Amount',
      isDisabled: true,
      colDef: this.colDefAmount,
      isChecked: true
    },
    {
      id: 'type',
      name: 'Check Type',
      isDisabled: false,
      colDef: this.colDefType,
      isChecked: true
    },
    {
      id: 'txn_date',
      name: 'Transaction Date',
      isDisabled: false,
      colDef: this.colDefTxnDate,
      isChecked: true
    },
    {
      id: 'memo',
      name: 'Memo',
      isDisabled: false,
      colDef: this.colDefMemo,
      isChecked: true
    },
    {
      id: 'status',
      name: 'Status',
      isDisabled: false,
      colDef: this.colDefStatus,
      isChecked: true
    }
  ];

  /**
   * Fields to show by default in the data table
   */
  fieldsShownByDefault = [
    'doc_number',
    'payee_name',
    'total_amt',
    'txn_date',
    'type',
    'company_name',
    'bank_name',
    'status'
  ];

  /** Set column fields */
  columnDefs = [
    this.colDefId,
    this.colDefDocNumber,
    this.colDefCompanyName,
    this.colDefPayeeName,
    this.colDefBankName,
    this.colDefAmount,
    this.colDefTxnDate,
    this.colDefType,
    this.colDefMemo,
    this.colDefStatus
  ];

  ngOnInit(): void {
    this.dataTableService.setDataFromParent(
      undefined,
      this.floatingFilterComponent
    );
    this.checkForPaginationExtend();
    this.v3DataTableService.refreshV3DataTable();
  }

  /**
   * @description Enables the 100/200/500 page size options when the
   * `infinite-scroll` plugin is enabled for the user.
   */
  private checkForPaginationExtend(): void {
    this.dataTableService.paginationChange$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((isPaginationExtended) => {
        this.extendPagination = isPaginationExtended;
      });
  }

  headerButtonClick(event: {
    id: string;
    selectedRows: IQbTransactionsRowData[];
    tableId: string;
  }) {
    const { selectedRows } = event;
    if (event?.id === 'id_create_check') {
      this.onCreateCheck(selectedRows);
    } else if (event?.id === 'id_import') {
      this.openImport();
    } else if (event?.id === 'multipleDelete') {
      this.onClearTransactions(selectedRows);
    }
  }

  /**
   * @description Handles Create Check button click
   * Shows alert if no rows selected, otherwise confirms and imports
   */
  private onCreateCheck(selectedRows: IQbTransactionsRowData[]): void {
    if (!selectedRows?.length) {
      this.alertService.failedAlert({
        content: 'Please select at least one transaction'
      });
      return;
    }

    const importedRows = selectedRows.filter((row) => row.status === 1);
    const pendingRows = selectedRows.filter((row) => row.status !== 1);

    // All selected checks are already imported
    if (importedRows.length === selectedRows.length) {
      this.alertService.failedAlert({
        content: 'These checks have already been created.'
      });
      return;
    }

    // Some checks are imported and some are pending
    if (importedRows.length > 0 && pendingRows.length > 0) {
      const alert = this.alertService.confirmAlert({
        content:
          'Some of the checks have already been converted to payments. Do you want to convert the remaining checks?',
        doneMsg: 'Create Checks',
        cancelMsg: 'Cancel'
      });
      alert.afterClosed().subscribe((confirmed) => {
        if (confirmed) {
          this.deselectImportedRows();
          this.executeCreateCheck(pendingRows);
        }
      });
      return;
    }

    // All selected checks are pending
    this.confirmAndExecuteCreateCheck(pendingRows);
  }

  /**
   * @description Shows confirmation and executes create check
   */
  private confirmAndExecuteCreateCheck(rows: IQbTransactionsRowData[]): void {
    const alert = this.alertService.confirmAlert({
      content: `This will create checks for ${rows.length} selected transactions. Do you want to continue?`,
      doneMsg: 'Create Checks',
      cancelMsg: 'Cancel'
    });
    alert.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.executeCreateCheck(rows);
      }
    });
  }

  /**
   * @description Deselects imported rows from the grid
   */
  private deselectImportedRows(): void {
    this.v3DataTableService.gridApi?.forEachNode((node) => {
      if (node.data?.status === 1 && node.isSelected()) {
        node.setSelected(false);
      }
    });
  }

  /**
   * @description Handles Clear button click
   * Shows alert if no rows selected, otherwise confirms and deletes
   */
  private onClearTransactions(selectedRows: IQbTransactionsRowData[]): void {
    if (!selectedRows?.length) {
      this.alertService.failedAlert({
        content: 'Please select at least one transaction'
      });
      return;
    }
    const alert = this.alertService.confirmAlert({
      content:
        'Are you sure you want to remove these selected checks from the list?',
      doneMsg: 'OK',
      cancelMsg: 'Cancel'
    });
    alert.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.executeClearTransactions(selectedRows);
      }
    });
  }

  /**
   * @description Calls API to delete selected QB transactions
   */
  private executeClearTransactions(
    selectedData: IQbTransactionsRowData[]
  ): void {
    const ids = selectedData.map((item) => item.id);

    this.isDeleteLoading.set(true);
    this.sharedService
      .deleteQuickBookImportItems(ids)
      .pipe(
        finalize(() => this.isDeleteLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.v3DataTableService.refreshV3DataTable();
            this.v3DataTableService.v3RowSelectionData = [];
            this.v3DataTableService.gridApi?.deselectAll();
            this.alertService.successAlert({
              content: 'Transactions cleared successfully',
              close: true,
              timeout: 1500
            });
          }
        },
        error: (err) => {
          if (err.error?.permissionRequired) {
            this.alertService.warningAlert({
              content: "You don't have permission to do this action."
            });
          } else {
            this.alertService.failedAlert({
              content: err.error?.message || 'Failed to clear transactions'
            });
          }
        }
      });
  }

  /**
   * @description Builds payload and calls API to create checks from selected QB transactions
   */
  private executeCreateCheck(selectedData: IQbTransactionsRowData[]): void {
    const payload = this.buildPayload(selectedData);

    this.loading.set(true);
    this.sharedService
      .postImportFromQuickBookData(payload)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.v3DataTableService.refreshV3DataTable();
            this.v3DataTableService.v3RowSelectionData = [];
            this.v3DataTableService.gridApi?.deselectAll();
            this.alertService.successAlert({
              content: 'Checks created successfully',
              close: true,
              timeout: 1500
            });
            this.selectAllPayment.emit(true);
          }
        },
        error: (err) => {
          if (err.error?.permissionRequired) {
            this.alertService.warningAlert({
              content: "You don't have permission to do this action."
            });
          } else {
            this.alertService.failedAlert({
              content: err.error?.message || 'Failed to create checks'
            });
          }
        }
      });
  }

  /**
   * @description Builds the API payload from selected rows
   */
  private buildPayload(selectedData: IQbTransactionsRowData[]): IQuickBookBody {
    const checkIds: { [realmId: string]: string[] } = {};
    const billPaymentIds: { [realmId: string]: string[] } = {};
    const refundReceiptIds: { [realmId: string]: string[] } = {};
    const expenseIds: { [realmId: string]: string[] } = {};

    const realmIdsSet = new Set<string>();
    let hasChecks = false;
    let hasBillPayments = false;
    let hasRefundReceipts = false;
    let hasExpenses = false;

    selectedData.forEach((item) => {
      const realmId = item.realm_id;
      const itemId = item.item_id.toString();

      if (realmId) {
        realmIdsSet.add(realmId);
      }

      switch (item.type?.toLowerCase()) {
        case 'check':
          if (!checkIds[realmId]) checkIds[realmId] = [];
          checkIds[realmId].push(itemId);
          hasChecks = true;
          break;
        case 'billpayment':
          if (!billPaymentIds[realmId]) billPaymentIds[realmId] = [];
          billPaymentIds[realmId].push(itemId);
          hasBillPayments = true;
          break;
        case 'refundreceipt':
          if (!refundReceiptIds[realmId]) refundReceiptIds[realmId] = [];
          refundReceiptIds[realmId].push(itemId);
          hasRefundReceipts = true;
          break;
        case 'expense':
          if (!expenseIds[realmId]) expenseIds[realmId] = [];
          expenseIds[realmId].push(itemId);
          hasExpenses = true;
          break;
        default:
          // Default to check type
          if (!checkIds[realmId]) checkIds[realmId] = [];
          checkIds[realmId].push(itemId);
          hasChecks = true;
          break;
      }
    });

    const payload: IQuickBookBody = {
      realmIds: Array.from(realmIdsSet),
      importTime: new Date().toISOString(),
      importBill: hasBillPayments ? 1 : 0,
      importCheck: hasChecks ? 1 : 0,
      importRefundReceipt: hasRefundReceipts ? 1 : 0,
      importExpense: hasExpenses ? 1 : 0,
      markAsPrintLater: 0
    };

    if (hasChecks) payload.checkIds = checkIds;
    if (hasBillPayments) payload.billPaymentIds = billPaymentIds;
    if (hasRefundReceipts) payload.refundReceiptIds = refundReceiptIds;
    if (hasExpenses) payload.expenseIds = expenseIds;

    return payload;
  }

  openImport() {
    const dialogRef = this.matDialog.open(ThirdpartyImportMainModalComponent, {
      maxWidth: '700px',
      disableClose: true,
      width: '93%',
      data: {
        type: 'checks',
        isSelectQbo: true
      }
    });
    dialogRef.afterClosed().subscribe((res) => {
      if (res?.success === true) {
        this.v3DataTableService.v3RowSelectionData = [];
        this.v3DataTableService.gridApi?.deselectAll();
        this.v3DataTableService.refreshV3DataTable();
      }
    });
  }
}

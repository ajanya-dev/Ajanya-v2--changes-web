import {
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  OnInit,
  output,
  signal
} from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { V4DataTableComponent } from 'src/app/modules/v4-data-table/components/v4-data-table/v4-data-table.component';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { V4DropdownFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-dropdown-floating-filter/v4-dropdown-floating-filter.component';
import { V4TextFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-text-floating-filter/v4-text-floating-filter.component';
import { V4DateFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-date-floating-filter/v4-date-floating-filter.component';
import { ICellRendererParams } from '@ag-grid-community/core';
import { IV3DtHeaderElements } from 'src/app/modules/v3-data-table/models/v3-data-table';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { IQuickBookBody } from 'src/app/modules/check/model/check';
import { V4ThirdpartyImportMainModalComponent } from 'src/app/shared/modal/v4-thirdparty-imports/v4-thirdparty-import-main-modal/v4-thirdparty-import-main-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';

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

@Component({
  selector: 'app-v4-qb-transactions-list',
  templateUrl: './v4-qb-transactions-list.component.html',
  styleUrls: ['./v4-qb-transactions-list.component.scss'],
  standalone: true,
  imports: [CommonModule, V4DataTableComponent],
  providers: [CurrencyPipe]
})
export class V4QbTransactionsListComponent implements OnInit {
  private v3DataTableService = inject(V3DataTableService);
  private dataTableService = inject(DataTableService);
  private currencyPipe = inject(CurrencyPipe);
  private alertService = inject(V4AlertService);
  private sharedService = inject(SharedService);
  private destroyRef = inject(DestroyRef);
  private matDialog = inject(MatDialog);

  isFromPaymentsV3 = input(false);

  loading = signal(false);
  isDeleteLoading = signal(false);
  selectAllPayment = output<boolean>();

  tableId = DTTableId.qbOnlineTransactions;
  extendPagination = false;

  frameworkComponents = {
    selectBoxComponent: V4DropdownFloatingFilterComponent,
    SearchBoxComponent: V4TextFloatingFilterComponent,
    v4DateRangeComponent: V4DateFloatingFilterComponent
  };

  colDefId = {
    maxWidth: 50,
    headerName: '',
    sortable: false,
    field: 'id',
    suppressFloatingFilterButton: true,
    suppressHeaderMenuButton: true,
    lockPosition: true,
    pinned: 'left' as const,
    headerCheckboxSelection: true,
    checkboxSelection: true,
    showDisabledCheckboxes: true,
    cellClass: 'flex justify-center',
    headerClass: 'pl-3.5'
  };

  public headerElements = computed<IV3DtHeaderElements>(() => ({
    panelButtons: [],
    buttons: [
      {
        text: 'Convert to Payments',
        id: 'id_create_check',
        lucideIcon: 'plus',
        floatingBarVariant: 'filled-success',
        loading: this.loading(),
        disabled: this.loading(),
        toolTip: this.loading() ? '' : 'Convert selected transactions to payments'
      },
      {
        text: 'Clear',
        id: 'multipleDelete',
        lucideIcon: 'trash-2',
        floatingBarVariant: 'filled-danger',
        loading: this.isDeleteLoading(),
        disabled: this.isDeleteLoading(),
        toolTip: this.isDeleteLoading() ? '' : 'Remove selected transactions from the list'
      },
      {
        text: 'Import',
        id: 'id_import',
        lucideIcon: 'arrow-down-to-line',
        floatingBarVariant: 'filled-success',
        toolTip: 'Import transactions from QuickBooks Online'
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
    minWidth: 150,
    maxWidth: 200,
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    floatingFilterComponent: 'SearchBoxComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex justify-end pr-3 text-end',
    cellRenderer: (params: { value: string | number }) =>
      this.currencyPipe.transform(params.value)
  };

  colDefTxnDate = {
    headerName: 'Transaction Date',
    field: 'txn_date',
    minWidth: 150,
    suppressFloatingFilterButton: true,
    filter: 'agDateColumnFilter',
    floatingFilterComponent: 'v4DateRangeComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: (params: ICellRendererParams) => {
      const raw = (params?.data?.txn_date ?? '').toString();
      if (!raw) return '';
      const [date = '', time = ''] = raw.includes('T') ? raw.split('T') : raw.split(' ');
      return `<div style="display:flex;flex-direction:column;line-height:1.25">
        <span style="font-size:12px;color:var(--v4-main-text-color)">${date}</span>
        ${time ? `<span style="font-size:10px;color:var(--v4-secondary-text-color)">${time}</span>` : ''}
      </div>`;
    }
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
    cellClass: 'flex flex-col justify-center',
    cellRenderer: (params: { value: string }) => {
      const map: Record<string, string> = {
        check: 'Check',
        billpayment: 'Bill Payment',
        expense: 'Expense',
        refundreceipt: 'Refund Receipt'
      };
      return map[params.value?.toLowerCase()] ?? params.value ?? '';
    }
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
    width: 150,
    maxWidth: 300,
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    floatingFilterComponent: 'selectBoxComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    pinned: 'right' as const,
    lockPosition: 'right' as const,
    lockPinned: true,
    suppressMovable: true,
    cellClass: 'flex items-center',
    cellRenderer: (params: { value: number }) => {
      const map: Record<number, { label: string; bg: string; text: string }> = {
        0: { label: 'Pending',  bg: 'var(--v4-badge-warning-bg-color)',  text: 'var(--v4-badge-warning-text-color)' },
        1: { label: 'Imported', bg: 'var(--v4-badge-success-bg-color)',  text: 'var(--v4-badge-success-text-color)' },
        2: { label: 'Skipped',  bg: 'var(--v4-badge-neutral-bg-color)',  text: 'var(--v4-badge-neutral-text-color)' }
      };
      const s = map[params.value] ?? map[2];
      return `<span class="status-badge" style="background:${s.bg};color:${s.text}">${s.label}</span>`;
    }
  };

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
      this.defaultColumnFields,
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

  private onCreateCheck(selectedRows: IQbTransactionsRowData[]): void {
    if (!selectedRows?.length) {
      this.alertService.failedAlert({
        content: 'Please select at least one transaction'
      });
      return;
    }

    const importedRows = selectedRows.filter((row) => row.status === 1);
    const pendingRows = selectedRows.filter((row) => row.status !== 1);

    if (importedRows.length === selectedRows.length) {
      this.alertService.failedAlert({
        content: 'These checks have already been created.'
      });
      return;
    }

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

    this.confirmAndExecuteCreateCheck(pendingRows);
  }

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

  private deselectImportedRows(): void {
    this.v3DataTableService.gridApi?.forEachNode((node) => {
      if (node.data?.status === 1 && node.isSelected()) {
        node.setSelected(false);
      }
    });
  }

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
    const dialogRef = this.matDialog.open(
      V4ThirdpartyImportMainModalComponent,
      {
        maxWidth: '700px',
        disableClose: true,
        width: '93%',
        panelClass: 'paddingless-modal-rounded',
        data: {
          type: 'checks',
          isSelectQbo: true
        }
      }
    );
    dialogRef.afterClosed().subscribe((res) => {
      if (res?.success === true) {
        this.v3DataTableService.v3RowSelectionData = [];
        this.v3DataTableService.gridApi?.deselectAll();
        this.v3DataTableService.refreshV3DataTable();
      }
    });
  }
}

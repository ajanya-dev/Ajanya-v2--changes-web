import { CommonModule, CurrencyPipe, TitleCasePipe } from '@angular/common';
import { Component, DestroyRef, inject, OnDestroy, OnInit } from '@angular/core';
import { DtSearchBoxComponent } from 'src/app/modules/data-table/components/dt-search-box/dt-search-box.component';
import { DataTableModule } from 'src/app/modules/data-table/data-table.module';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { V3DataTableComponent } from 'src/app/modules/v3-data-table/components/v3-data-table/v3-data-table.component';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { V3DataTableModule } from 'src/app/modules/v3-data-table/v3-data-table.module';
import { DataRangeV35Component } from 'src/app/shared/components/date-range-v35/data-range-v35.component';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { V3DTCommonFilterComponent } from 'src/app/shared/v3/dt-cellrenderers/dt-common-filter';
import { DtMultiDropdownPayeeComponent } from 'src/app/shared/v3/dt-cellrenderers/dt-multi-dropdown-payee/dt-multi-dropdown-payee/dt-multi-dropdown-payee.component';
import { V3DataTableSelectBoxComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-data-table-select-box/v3-data-table-select-box.component';
import { V3StatusComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-status/v3-status.component';
import { V3UpdatedAtComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-updated-at/v3-updated-at.component';
import { V3ViewButtonComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-view-button/v3-view-button.component';
import { Router } from '@angular/router';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { WalletService } from 'src/app/shared/service/wallet/wallet.service';
import { ICellRendererParams } from '@ag-grid-community/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ICommonTransactionTableData } from 'src/app/models/v3-common';

@Component({
  selector: 'app-inter-transactions',
  standalone: true,
  imports: [V3DataTableComponent, CommonModule, V3DataTableModule, DataTableModule],
  templateUrl: './inter-transactions.component.html',
  styleUrl: './inter-transactions.component.scss'
})
export class InterTransactionsComponent implements OnInit, OnDestroy {
  /* Injectors */
  private dataTableService = inject(DataTableService);
  private v3DataTableService = inject(V3DataTableService);
  private currencyPipe = inject(CurrencyPipe);
  private router = inject(Router);
  private alertService = inject(AlertService);
  private titlePipe = new TitleCasePipe();
  private walletService = inject(WalletService);
  private destroyRef = inject(DestroyRef);

  /** DATA TABLE VARAIBLES */
  public tableId = DTTableId.internationalPaymentRecentTransaction;
  pinColumn = 'payee_name';
  reloadTable = false;
  typeOfWallet: { value: number; name: string }[] = [];

  frameworkComponents = {
    selectBoxComponent: V3DataTableSelectBoxComponent,
    SearchBoxComponent: DtSearchBoxComponent,
    dateRangeV35Component: DataRangeV35Component,
    v3PayeeListDropDownFilterComponent: DtMultiDropdownPayeeComponent,
    v3StatusComponent: V3StatusComponent,
    v3UpdatedAtComponent: V3UpdatedAtComponent,
    V3DTCommonFilterComponent,
    v3ViewButtonComponent: V3ViewButtonComponent
  };

  headerElements = {
    buttons: [
      {
        id: 'new-payment',
        text: 'New',
        type: 'list',
        width: '120px',
        backGroundInput: 'var(--common-green-color)',
        isAddIcon: true,
        icon: ['fas', 'plus'],
        toolTip: 'Create new payment'
      },
      {
        id: 'mark-as-settled',
        text: 'Mark as settled',
        type: 'list',
        width: '120px',
        backGroundInput: 'var(--common-blue-color)',
        isAddIcon: true,
        icon: ['fas', 'check'],
        toolTip: 'Confirm payee receipt of the payment'
      }
    ]
  };

  floatingFilterComponent = {
    selectBox: [
      {
        id: 'status', // Fixed to match the column field
        values: [
          { value: '1', name: 'Processing' },
          { value: '2', name: 'Paid' },
          { value: '4', name: 'Failed' }
        ]
      },
      {
        id: 'source_type', // Added for source filtering
        values: [
          { value: 'BANK', name: 'Bank' },
          { value: 'CARD', name: 'Card' },
          { value: 'WALLET', name: 'Wallet' }
        ]
      },
      {
        id: 'beneficiary_type', // Added for beneficiary type filtering
        values: [
          { value: 'business', name: 'Business' },
          { value: 'personal', name: 'Personal' }
        ]
      },
      {
        id: 'is_user_settled',
        values: [
          { value: '1', name: 'Settled' },
          { value: '0', name: 'Un Settled' }
        ]
      }
    ]
  };

  /** Table columns */
  colDefId = {
    maxWidth: 50,
    headerName: '',
    sortable: false,
    field: 'id',
    suppressFloatingFilterButton: true,
    suppressHeaderMenuButton: true,
    lockPosition: true,
    headerCheckboxSelection: true,
    checkboxSelection: (params: ICellRendererParams) => params.data.can_mark_as_settled,
    showDisabledCheckboxes: true,
    cellRenderer: () => ''
  };

  colDefRefId = {
    headerName: 'Ref ID',
    minWidth: 50,
    maxWidth: 100,
    field: 'source_id.id',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center pl-2.5',
    headerClass: 'pl-3',
    cellRenderer: (params: { data: { id: string } }) => params?.data?.id,
    valueGetter: (params: { data: { id: string } }) => params?.data?.id
  };

  colDefAmount = {
    headerName: 'Amount',
    field: 'amount',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    floatingFilterComponent: 'SearchBoxComponent',
    minWidth: 80,
    maxWidth: 100,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex justify-end pr-3 text-end mt-0.5',
    cellRenderer: (params: { value: string | number }) =>
      this.currencyPipe.transform(params.value)
  };

  colDefRecipientType = {
    headerName: 'Payee Type',
    field: 'beneficiary_type',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    floatingFilterComponent: 'selectBoxComponent',
    minWidth: 80,
    maxWidth: 100,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center',
    cellRenderer: (params: { value: string }) => this.titlePipe.transform(params.value)
  };

  colDefDescription = {
    headerName: 'Description',
    field: 'description',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    minWidth: window.innerWidth <= 1500 ? 100 : 180,
    maxWidth: 400,
    floatingFilterComponent: 'SearchBoxComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center'
  };

  colDef = {
    headerName: 'Status',
    minWidth: 115,
    field: 'status',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'v3StatusComponent',
    cellClass: 'flex flex-col justify-center',
    cellRendererParams: {
      isStatementDisable: true,
      isApplyTitleCase: true
    },
    /**
     *
     * @param params @param {Object} params - An object containing data with a status property.
     * @param {number} params.data.status - The status value to be evaluated.
     * @returns {string} The status label associated with the provided status value.
     *  Possible return values are: 'Pending', 'Processing', 'Success', or 'Failed'.
     */
    valueGetter: (params: { data: { status: number } }): string => {
      const value = params?.data?.status;
      let status = '';
      if (value === 0) {
        status = 'Pending';
      } else if (value === 1) {
        status = 'Processing';
      } else if (value === 2) {
        status = 'Success';
      } else if (value === 3) {
        status = 'Failed';
      }
      return status;
    }
  };

  colDefPayee = {
    headerName: 'Payee',
    minWidth: 175,
    field: 'payee_name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'v3PayeeListDropDownFilterComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center'
  };

  colDefSubjectType = {
    headerName: 'Type of Transfer',
    minWidth: 190,
    field: 'subject_type_short_name',
    suppressFloatingFilterButton: true,
    sortable: false,
    floatingFilterComponent: 'v3DtWalletTransactionsTypeComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center',
    cellRenderer: 'v3WalletTransactionTypeComponent'
  };

  ColDefPayee = {
    headerName: 'Payee',
    field: 'payee_name',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    floatingFilterComponent: 'v3PayeeListDropDownFilterComponent',
    minWidth: 175,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'V3DTCommonFilterComponent',
    cellClass: 'flex flex-col justify-center'
  };

  colDefPayeeEmail = {
    headerName: 'Payee Email',
    field: 'payee_email',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    floatingFilterComponent: 'SearchBoxComponent',
    minWidth: 150,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center'
  };

  colDefPayeePhone = {
    headerName: 'Payee Phone',
    field: 'payee_phone',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    floatingFilterComponent: 'SearchBoxComponent',
    minWidth: 120,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center'
  };

  colDefStatus = {
    headerName: 'Status',
    field: 'status',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    minWidth: 120,
    floatingFilterComponent: 'selectBoxComponent', // Ensure selectBoxComponent is used
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'v3StatusComponent',
    cellClass: 'flex flex-col justify-center',
    cellRendererParams: {
      isStatementDisable: true,
      isApplyTitleCase: true,
      tableType: 'international-payment-transactions',
      
    }
  };

  colDefSettled = {
    headerName: 'Settled',
    field: 'is_user_settled',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    minWidth: 120,
    floatingFilterComponent: 'selectBoxComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center',
    valueGetter: (params: { data: { is_user_settled?: number | string } }): string => {
      const settled = params?.data?.is_user_settled;
      if (settled === 1 || settled === '1') {
        return 'Settled';
      }
      if (settled === 0 || settled === '0') {
        return 'Un Settled';
      }
      return '';
    },
    cellRenderer: (params: { value: string }) => {
      if (params.value === 'Settled') {
        return `<span class="text-common-green-color">Settled</span>`;
      }
      if (params.value === 'Un Settled') {
        return `<span>Un Settled</span>`;
      }
      return params.value;
    }
  };

  colDefCreatedAt = {
    headerName: 'Created Date',
    field: 'zil_payments.created_at',
    suppressFloatingFilterButton: true,
    filter: 'agDateColumnFilter',
    minWidth: 100,
    floatingFilterComponent: 'dateRangeV35Component',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'v3UpdatedAtComponent',
    floatingFilterComponentParams: {
      tableName: 'international_transactions'
    },
    cellRendererForExport: (params: { data: { created_at: string } }) =>
      params.data.created_at
  };

  colDefUpdatedAt = {
    headerName: 'Updated Date',
    field: 'zil_payments.updated_at',
    suppressFloatingFilterButton: true,
    filter: 'agDateColumnFilter',
    minWidth: 100,
    floatingFilterComponent: 'dateRangeV35Component',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'v3UpdatedAtComponent',
    floatingFilterComponentParams: {
      tableName: 'international_transactions'
    },
    cellRendererForExport: (params: { data: { updated_at: string } }) =>
      params.data.updated_at
  };

  colDefTransferMode = {
    headerName: 'Type',
    field: 'transfer_type',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    minWidth: 140,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponent: 'selectBoxComponent',
    floatingFilterComponentParams: {
      table: 'international_transactions'
    },
    cellRenderer: 'V3DTCommonFilterComponent',
    cellClass: 'flex'
  };

  colDefSourceType = {
    headerName: 'Source Type',
    field: 'source_type',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    minWidth: 120,
    floatingFilterComponent: 'selectBoxComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: (params: { data: { source: { source: string } } }) =>
      params.data?.source?.source || '',
    valueGetter: (params: { data: { source: { source: string } } }) =>
      params.data?.source?.source || '',
    cellClass: 'flex flex-col justify-center'
  };

  colDefSourceName = {
    headerName: 'Source',
    field: 'source_name',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    minWidth: 120,
    floatingFilterComponent: 'SearchBoxComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'V3DTCommonFilterComponent',
    cellClass: 'flex flex-col justify-center'
  };

  colDefCreatedBy = {
    headerName: 'Created By',
    field: 'created_by.name',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    minWidth: 120,
    floatingFilterComponent: 'SearchBoxComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center',
    cellRenderer: (params: { data: { created_by: { name: string } } }) =>
      params.data?.created_by?.name || ''
  };

  colDefAction = {
    headerName: 'Action',
    field: 'action',
    suppressFloatingFilterButton: true,
    floatingFilter: true,
    sortable: false,
    suppressHeaderMenuButton: true,
    minWidth: 120,
    cellRenderer: 'v3ViewButtonComponent',
    cellRendererParams: {
      viewButtonType: 0,
      hideMenuOption: false,
      from: 'international-payment-transactions'
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
      id: 'payee_name',
      name: 'Payee',
      isDisabled: false,
      colDef: this.colDefPayee,
      isChecked: true
    },
    {
      id: 'beneficiary_type',
      name: 'Payee Type',
      isDisabled: false,
      colDef: this.colDefRecipientType,
      isChecked: true
    },
    {
      id: 'payee_email',
      name: 'Payee Email',
      isDisabled: false,
      colDef: this.colDefPayeeEmail,
      isChecked: true
    },
    {
      id: 'amount',
      name: 'Amount',
      isDisabled: false,
      colDef: this.colDefAmount,
      isChecked: true
    },
    {
      id: 'description',
      name: 'Description',
      isDisabled: false,
      colDef: this.colDefDescription,
      isChecked: true
    },
    {
      id: 'status',
      name: 'Status',
      isDisabled: false,
      colDef: this.colDefStatus,
      isChecked: true
    },
    {
      id: 'settled',
      name: 'Settled',
      isDisabled: false,
      colDef: this.colDefSettled,
      isChecked: true
    },
    {
      id: 'created_at',
      name: 'Created Date',
      isDisabled: false,
      colDef: this.colDefCreatedAt,
      isChecked: true
    },
    {
      id: 'updated_at',
      name: 'Updated Date',
      isDisabled: false,
      colDef: this.colDefUpdatedAt,
      isChecked: true
    },
    {
      id: 'transfer_mode',
      name: 'Type',
      isDisabled: false,
      colDef: this.colDefTransferMode,
      isChecked: true
    },
    {
      id: 'source_type',
      name: 'Source Type',
      isDisabled: false,
      colDef: this.colDefSourceType, // <-- Added for source type filtering
      isChecked: true
    },
    {
      id: 'source_name',
      name: 'Source',
      isDisabled: false,
      colDef: this.colDefSourceName,
      isChecked: true
    },
    {
      id: 'created_by',
      name: 'Created By',
      isDisabled: false,
      colDef: this.colDefCreatedBy,
      isChecked: true
    },
    {
      id: 'action',
      name: 'Action',
      isDisabled: false,
      colDef: this.colDefAction,
      isChecked: true
    }
  ];

  /**
   * Fields to show by default in the data table (for new users or reset)
   */
  fieldsShownByDefault = [
    'id',
    'reference_no',
    'amount',
    'description',
    'payee_name',
    'beneficiary_type',
    'payee_email',
    'status',
    'is_user_settled',
    'created_at',
    'updated_at',
    'transfer_mode',
    'source_name',
    'created_by',
    'action'
  ];

  ngOnInit(): void {
    this.initializeV3DataTable();
    this.refreshDataTable();
    this.dataTableService.setDataFromParent(
      undefined,
      this.floatingFilterComponent
    );
  }

  /**
   * @description Initializes the V3 data table with default payload values.
   */
  initializeV3DataTable() {
    const filterModels = {};
    this.v3DataTableService.defaultPayload = {
      startRow: 0,
      endRow: 50,
      rowGroupCols: [],
      valueCols: [],
      pivotCols: [],
      pivotMode: false,
      groupKeys: [],
      filterModel: filterModels,
      sortModel: []
    };
    this.v3DataTableService.refreshV3DataTable();
  }

  refreshDataTable(): void {
    this.initializeV3DataTable();
  }

  /** Set column feilds. */
  columnDefs = [
    this.colDefId,
    this.colDefPayee,
    this.colDefRecipientType,
    this.colDefPayeeEmail,
    this.colDefDescription,
    this.colDefAmount,
    this.colDefStatus,
    this.colDefSettled,
    this.colDefCreatedAt,
    this.colDefUpdatedAt,
    this.colDefTransferMode,
    this.colDefSourceType,
    this.colDefSourceName,
    this.colDefCreatedBy,
    this.colDefAction
  ];

  headerButtonClick(event: {id: string, selectedRows: ICommonTransactionTableData[], tableId: number}) {
    if(event.id === 'new-payment') {
      this.router.navigate(['/manage/international-payment/new'],
        {
          state: {
            tab: 'new-payment',
            from: 'recent-transactions'
          }
        }
      );
      return;
    }

    if (event.id === 'mark-as-settled') {
      this.onMarkAsSettled(event.selectedRows);
    }
  }

  onMarkAsSettled(selectedRows: ICommonTransactionTableData[]): void {
    if (!selectedRows?.length) {
      this.alertService.warningAlert({
        title: 'Error',
        content: 'Please select at least one transaction to proceed.',
        doneMsg: 'Ok'
      });
      return;
    }

    if (selectedRows.some((row) => !row.can_mark_as_settled)) {
      this.alertService.warningAlert({
        title: 'Error',
        content: 'The selected transactions can not be marked as settled.',
        doneMsg: 'Ok'
      });
      return;
    }

    const alert = this.alertService.confirmAlert({
      content: `Are you sure you want to mark ${
        selectedRows.length === 1 ? 'this' : 'these'
      } ${selectedRows.length === 1 ? 'transaction' : 'transactions'} as settled?`
    });

    const ids = selectedRows.map((row) => row?.transfer_id || '');

    alert.afterClosed()
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe((result) => {
      if (result) {
        this.markAsSettledAction(ids);
      }
    });
  }

  markAsSettledAction(ids: string[]): void {
    this.walletService.markAsSettled(ids)
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe((res) => {
      if (res?.success) {
        this.dataTableService.setRefreshStatus(true, this.tableId);
        this.v3DataTableService.refreshV3DataTable();
        this.alertService.successAlert({
          content: 'Marked as settled.'
        });
        
        this.v3DataTableService.v3RowSelectionData = [];
        this.v3DataTableService.gridApi?.deselectAll();
      }
    });
  }

  /**
   * @description Unsubscribes from all subscriptions to prevent memory leaks.
   */
  ngOnDestroy() {
    this.v3DataTableService.rowData = [];
  }
}

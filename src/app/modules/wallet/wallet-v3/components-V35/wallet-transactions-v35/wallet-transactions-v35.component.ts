import { CurrencyPipe, DecimalPipe, NgClass } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, input } from '@angular/core';
import { ICoulmnDefFields } from 'src/app/models/v3-datatable';
import { DtActionComponent } from 'src/app/modules/data-table/components/dt-action/dt-action.component';
import { DtSearchBoxCustomFilterComponent } from 'src/app/modules/data-table/components/dt-search-box-custom-filter/dt-search-box-custom-filter.component';
import { DtSearchBoxComponent } from 'src/app/modules/data-table/components/dt-search-box/dt-search-box.component';
import { DtSelectAllCheckBoxComponent } from 'src/app/modules/data-table/components/dt-select-all-check-box/dt-select-all-check-box.component';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { V3DataTableSelectBoxComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-data-table-select-box/v3-data-table-select-box.component';
import { V3ViewButtonComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-view-button/v3-view-button.component';
import { IWalletData } from 'src/app/models/wallet';
import { Observable, Subscription, of, switchMap, take } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';
import { WhiteLabelPipe } from 'src/app/pipes/white-label.pipe';
import { DataRangeV35Component } from 'src/app/shared/components/date-range-v35/data-range-v35.component';
import { V3UpdatedAtComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-updated-at/v3-updated-at.component';
import { V3StatusComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-status/v3-status.component';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { DtMultiDropdownPayeeComponent } from 'src/app/shared/v3/dt-cellrenderers/dt-multi-dropdown-payee/dt-multi-dropdown-payee/dt-multi-dropdown-payee.component';
import { V4PayeeMultiSelectFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-payee-multi-select-floating-filter/v4-payee-multi-select-floating-filter.component';
import { DtWalletTransactionsTypeComponent } from 'src/app/shared/v3/dt-cellrenderers/dt-wallat-transactions-type/dt-wallet-transactions-type.component';
import { V4WalletTransactionTypeFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-wallet-transaction-type-floating-filter/v4-wallet-transaction-type-floating-filter.component';
import { V3DTCommonFilterComponent } from 'src/app/shared/v3/dt-cellrenderers/dt-common-filter';
import { ICellRendererParams } from '@ag-grid-community/core';
import { V4DataTableComponent } from 'src/app/modules/v4-data-table/components/v4-data-table/v4-data-table.component';
import { V4ViewButtonComponent } from 'src/app/shared/v3/dt-cellrenderers/v4-view-button/v4-view-button.component';
import { V4DropdownFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-dropdown-floating-filter/v4-dropdown-floating-filter.component';
import { V4TextFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-text-floating-filter/v4-text-floating-filter.component';
import { V4DateFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-date-floating-filter/v4-date-floating-filter.component';
import { TransactionTypeComponent } from '../../../wallet-v2/components/dt-components/transaction-type';
import { WalletDataV35Service } from '../../services/wallet-data-v35.service';
import { V3DataTableComponent } from '../../../../v3-data-table/components/v3-data-table/v3-data-table.component';
import { V3WalletTransactionTypeComponent } from './wallet-subject-type';

const whiteLabelPipe = new WhiteLabelPipe();

@Component({
  selector: 'app-wallet-transactions-v35',
  templateUrl: './wallet-transactions-v35.component.html',
  styleUrls: ['./wallet-transactions-v35.component.scss'],
  providers: [V3DataTableService, CurrencyPipe],
  standalone: true,
  imports: [V3DataTableComponent, V4DataTableComponent, NgClass]
})
export class WalletTransactionsV35Component implements OnInit, OnDestroy {
  /* Injectors */
  private dataTableService = inject(DataTableService);
  private v3DataTableService = inject(V3DataTableService);
  private walletDataService = inject(WalletDataV35Service);
  private currencyPipe = inject(CurrencyPipe);

  /** Version context: 'v3' when used in v3 layout, 'v4' when used in v4 layout. */
  versionType = input<string>('v3');

  /** DATA TABLE VARAIBLES */
  public tableId = DTTableId.wallet;
  pinColumn = 'payee_name';
  reloadTable = false;
  typeOfWallet: { value: number; name: string }[] = [];

  get frameworkComponents() {
    return {
      headerCheckBoxComponent: DtSelectAllCheckBoxComponent,
      selectBoxComponent:
        this.versionType() === 'v3'
          ? V3DataTableSelectBoxComponent
          : V4DropdownFloatingFilterComponent,
      SearchBoxComponent:
        this.versionType() === 'v3'
          ? DtSearchBoxComponent
          : V4TextFloatingFilterComponent,
      dateRangeV35Component:
        this.versionType() === 'v3'
          ? DataRangeV35Component
          : V4DateFloatingFilterComponent,
      actionComponent: DtActionComponent,
      CustomFilterSearchBoxComponent: DtSearchBoxCustomFilterComponent,
      TransactionTypesComponent: TransactionTypeComponent,
      v3ViewButtonComponent:
        this.versionType() === 'v3'
          ? V3ViewButtonComponent
          : V4ViewButtonComponent,
      v3PayeeListDropDownFilterComponent:
        this.versionType() === 'v3'
          ? DtMultiDropdownPayeeComponent
          : V4PayeeMultiSelectFloatingFilterComponent,
      v3StatusComponent: V3StatusComponent,
      v3UpdatedAtComponent: V3UpdatedAtComponent,
      v3DtWalletTransactionsTypeComponent:
        this.versionType() === 'v3'
          ? DtWalletTransactionsTypeComponent
          : V4WalletTransactionTypeFloatingFilterComponent,
      v3WalletTransactionTypeComponent: V3WalletTransactionTypeComponent,
      V3DTCommonFilterComponent
    };
  }

  floatingFilterComponent = {
    selectBox: [
      {
        id: 'universal_wallet_record_transactions.status',
        values: [
          { value: '0', name: 'Pending' },
          { value: '1', name: 'Processing' },
          { value: '2', name: 'Success' },
          { value: '3', name: 'Failed' }
        ]
      },
      {
        id: 'subject_type',
        values: this.typeOfWallet
      }
    ],
    selectDate: [
      { id: 'cheque_issue_date', initialRange: 'All Time' },
      {
        id: 'universal_wallet_record_transactions.created_at',
        initialRange: 'All Time',
        isPrimary: true
      }
    ]
  };

  selectedWalletData?: IWalletData;
  selectedWalletData$: Observable<IWalletData | undefined> = toObservable(
    this.walletDataService.walletDataSignal
  );

  subscription: Subscription[] = [];

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
    this.subscription.push(
      this.selectedWalletData$
        .pipe(switchMap((data) => of(data).pipe(take(1))))
        .subscribe((res) => {
          if (res?.id === this.selectedWalletData?.id && !this.reloadTable)
            return;
          this.selectedWalletData = res;
          const filterModels = !res?.walletName
            ? {}
            : {
                wallet_id: {
                  filter: res?.id,
                  filterType: 'text',
                  type: 'equals'
                }
              };
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
          this.walletDataService.transactionUpdated$.next(false);
        })
    );
  }

  refreshDataTable(): void {
    this.subscription.push(
      this.walletDataService.transactionUpdated$.subscribe((updated) => {
        this.reloadTable = updated;
        if (updated) {
          this.initializeV3DataTable();
        }
      })
    );
  }

  /** Table columns */
  colDefRefId = {
    headerName: 'Ref ID',
    minWidth: 80,
    maxWidth: 120,
    field: 'universal_wallet_record_transactions.id',
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

  colDefDate = {
    headerName: 'Transaction Date',
    minWidth: 120,
    field: 'universal_wallet_record_transactions.created_at',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'dateRangeV35Component',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponentParams: {
      tableId: 20
    },
    cellRenderer: 'v3UpdatedAtComponent',
    cellRendererParams: {
      isV4: this.versionType
    },
    cellRendererForExport: (params: ICellRendererParams) =>
      // Only For when Export Table data
      params?.data?.created_at
  };

  colDefSettledDate = {
    headerName: 'Settled Date',
    minWidth: 90,
    field: 'available_balance_processed_at',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'dateRangeV35Component',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'V3DTCommonFilterComponent',
    cellRendererParams: {
      type: 'date'
    }
  };

  colDefWallet = {
    headerName: whiteLabelPipe.transform('Wallet', 'wallet'),
    minWidth: 100,
    field: 'wallet_name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center',
    cellRenderer: 'V3DTCommonFilterComponent'
  };

  colDefStatus = {
    headerName: 'Status',
    minWidth: 115,
    field: 'universal_wallet_record_transactions.status',
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
    headerName: 'Payee From/To',
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

  colDefDescription = {
    headerName: 'Description',
    minWidth: window.innerWidth <= 1500 ? 100 : 280,
    maxWidth: 400,
    field: 'description',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center'
  };

  colDefCheckNo = {
    headerName: 'Check No',
    minWidth: 80,
    field: 'check_no',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center pl-[20px]',
    cellRenderer: 'V3DTCommonFilterComponent'
  };

  colDefTransactionType = {
    headerName: 'Amount',
    minWidth: 90,
    maxWidth: 120,
    field: 'transaction_amount',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'TransactionTypesComponent',
    cellRendererParams: {
      isV4: this.versionType
    },
    cellClass: 'flex justify-end pr-3 text-end mt-0.5'
  };

  colDefInitialBalance = {
    headerName: 'Initial Balance',
    minWidth: 100,
    maxWidth: 120,
    field: 'initial_balance',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex justify-end pr-3 text-end mt-0.5',
    cellRenderer: (params: { value: number }) =>
      this.currencyPipe.transform(params.value)
  };

  colDefCurrentBalance = {
    headerName: 'Current Balance',
    minWidth: 100,
    maxWidth: 120,
    field: 'universal_wallet_record_transactions.current_balance',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex justify-end pr-3 text-end mt-0.5',
    cellRenderer: (params: { data: { current_balance: number } }) =>
      this.currencyPipe.transform(params?.data?.current_balance),
    valueGetter: (params: { data: { current_balance: number } }) =>
      new DecimalPipe('en-US').transform(params?.data?.current_balance, '1.2-2')
  };

  colDefViewButton: ICoulmnDefFields = {
    headerName: 'View',
    field: 'view',
    suppressFloatingFilterButton: true,
    minWidth: 100,
    sortable: false,
    cellRenderer: 'v3ViewButtonComponent',
    cellRendererParams: {
      viewButtonType: 1,

      tableId: 20,
      hideMenuOption: true
    },
    suppressHeaderMenuButton: true
  };

  /** Set column feilds. */
  columnDefs = [
    this.colDefRefId,
    this.colDefTransactionType,
    this.colDefDate,
    this.colDefWallet,
    this.colDefPayee,
    this.colDefSubjectType,
    this.colDefDescription,
    this.colDefCheckNo,
    this.colDefInitialBalance,
    this.colDefCurrentBalance,
    this.colDefSettledDate,
    this.colDefStatus,
    this.colDefViewButton
  ];

  /**
   * @description Unsubscribes from all subscriptions to prevent memory leaks.
   */
  ngOnDestroy() {
    this.v3DataTableService.rowData = [];
    this.subscription.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}

import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable, Subscription, of, switchMap, take } from 'rxjs';
import { ColDef, ICellRendererParams } from '@ag-grid-community/core';
import { ICoulmnDefFields } from 'src/app/models/v3-datatable';
import { IWalletData } from 'src/app/models/wallet';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { DtActionComponent } from 'src/app/modules/data-table/components/dt-action/dt-action.component';
import { DtSelectAllCheckBoxComponent } from 'src/app/modules/data-table/components/dt-select-all-check-box/dt-select-all-check-box.component';
import { V3DataTableModule } from 'src/app/modules/v3-data-table/v3-data-table.module';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { V4DataTableComponent } from 'src/app/modules/v4-data-table/components/v4-data-table/v4-data-table.component';
import { V4DateFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-date-floating-filter/v4-date-floating-filter.component';
import { V4DropdownFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-dropdown-floating-filter/v4-dropdown-floating-filter.component';
import { V4PayeeMultiSelectFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-payee-multi-select-floating-filter/v4-payee-multi-select-floating-filter.component';
import { V4TextFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-text-floating-filter/v4-text-floating-filter.component';
import { V4WalletTransactionTypeFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-wallet-transaction-type-floating-filter/v4-wallet-transaction-type-floating-filter.component';
import { V4DTCommonFilterComponent } from 'src/app/modules/payments-v4/payments-out/components/v4-payments-table/cell-renderers/v4-common-filter/v4-common-filter.component';
import { V4PayeeNameComponent } from 'src/app/modules/payments-v4/payments-out/components/v4-payments-table/cell-renderers/v4-payee-name/v4-payee-name.component';
import { V4UpdatedAtComponent } from 'src/app/modules/payments-v4/payments-out/components/v4-payments-table/cell-renderers/v4-updated-at/v4-updated-at.component';
import {
  TV4StatusMap,
  V4StatusComponent
} from 'src/app/shared/V4/v4-dt-cellrenders/v4-status/v4-status.component';
import { V4ViewButtonComponent } from 'src/app/shared/v3/dt-cellrenderers/v4-view-button/v4-view-button.component';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { WhiteLabelPipe } from 'src/app/pipes/white-label.pipe';
import { WalletDataV35Service } from '../../../wallet-v3/services/wallet-data-v35.service';
import { WalletV4EventsService } from '../../v4-services/wallet-v4-events.service';
import { V4WalletAmountComponent } from './cell-renderers/v4-wallet-amount/v4-wallet-amount.component';
import { V4WalletTransferTypeComponent } from './cell-renderers/v4-wallet-transfer-type/v4-wallet-transfer-type.component';

const whiteLabelPipe = new WhiteLabelPipe();

/** v2.1 badge palette — bg/text always come from a matching `--v4-badge-*` pair. */
const BADGE = {
  success: {
    bgColor: 'var(--v4-badge-success-bg-color)',
    textColor: 'var(--v4-badge-success-text-color)'
  },
  info: {
    bgColor: 'var(--v4-badge-info-bg-color)',
    textColor: 'var(--v4-badge-info-text-color)'
  },
  warning: {
    bgColor: 'var(--v4-badge-warning-bg-color)',
    textColor: 'var(--v4-badge-warning-text-color)'
  },
  error: {
    bgColor: 'var(--v4-badge-error-bg-color)',
    textColor: 'var(--v4-badge-error-text-color)'
  }
} as const;

/**
 * Status → badge palette for the wallet transactions grid.
 *
 * The API sends the four numeric states the column's `valueGetter` names below.
 * The shared renderer's built-in `PAYMENTS_STATUS_MAP` colours badge text with
 * `--v4-common-*`, which fails AA on the pale v2.1 fills, so this passes the
 * matching `--v4-badge-*` pairs through the supported `statusMap` override.
 */
const WALLET_TRANSACTION_STATUS_MAP: TV4StatusMap = {
  0: { status: 'Pending', ...BADGE.warning },
  1: { status: 'Processing', ...BADGE.info },
  2: { status: 'Success', ...BADGE.success },
  3: { status: 'Failed', ...BADGE.error }
};

/**
 * `ICoulmnDefFields` narrows `lockPosition` to boolean and knows nothing about
 * the table's `cellRendererForExport` hook. That model lives in v3 and is
 * frozen, so widen it locally rather than editing it.
 */
type IV4ColumnDef = Omit<ICoulmnDefFields, 'lockPosition'> & {
  lockPosition?: ColDef['lockPosition'];
  cellRendererForExport?: (params: ICellRendererParams) => unknown;
};

/**
 * Wallet transactions grid (v4).
 *
 * v4 owns its own column definitions rather than delegating to
 * `WalletTransactionsV35Component`: that component is shared with the frozen v3
 * layout, so every v4 styling decision made there would land on the v3 grid too.
 */
@Component({
  standalone: true,
  selector: 'app-wallet-transactions-v4',
  templateUrl: './wallet-transactions-v4.component.html',
  styleUrls: ['./wallet-transactions-v4.component.scss'],
  providers: [V3DataTableService, CurrencyPipe],
  imports: [V4DataTableComponent, V3DataTableModule]
})
export class WalletTransactionsV4Component implements OnInit, OnDestroy {
  private dataTableService = inject(DataTableService);
  private v3DataTableService = inject(V3DataTableService);
  private currencyPipe = inject(CurrencyPipe);
  walletDataService = inject(WalletDataV35Service);
  private walletV4Events = inject(WalletV4EventsService);

  public tableId = DTTableId.wallet;
  reloadTable = false;
  typeOfWallet: { value: number; name: string }[] = [];

  frameworkComponents = {
    headerCheckBoxComponent: DtSelectAllCheckBoxComponent,
    selectBoxComponent: V4DropdownFloatingFilterComponent,
    searchBoxComponent: V4TextFloatingFilterComponent,
    v4DateFloatingFilterComponent: V4DateFloatingFilterComponent,
    actionComponent: DtActionComponent,
    v4StatusComponent: V4StatusComponent,
    v4PayeeNameComponent: V4PayeeNameComponent,
    v4UpdatedAtComponent: V4UpdatedAtComponent,
    v4ViewButtonComponent: V4ViewButtonComponent,
    v4DTCommonFilterComponent: V4DTCommonFilterComponent,
    v4WalletAmountComponent: V4WalletAmountComponent,
    v4WalletTransferTypeComponent: V4WalletTransferTypeComponent,
    v4PayeeListDropDownFilterComponent:
      V4PayeeMultiSelectFloatingFilterComponent,
    v4WalletTransactionTypeFilterComponent:
      V4WalletTransactionTypeFloatingFilterComponent
  };

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
    this.initializeDataTable();
    this.refreshDataTable();
    this.dataTableService.setDataFromParent(
      undefined,
      this.floatingFilterComponent
    );
  }

  /**
   * @description Initializes the data table with default payload values.
   */
  initializeDataTable() {
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

  /**
   * Empty-state CTA — hands off to `WalletDetailsV4Component.sendPayments()`
   * via the shared events service, so the onboarding redirect, verification
   * gate and payment payload live in one place.
   */
  onEmptyStateSendMoney(): void {
    this.walletV4Events.sendMoneyRequested$.next();
  }

  refreshDataTable(): void {
    this.subscription.push(
      this.walletDataService.transactionUpdated$.subscribe((updated) => {
        this.reloadTable = updated;
        if (updated) {
          this.initializeDataTable();
        }
      })
    );
  }

  /**
   * The View column holds the icon cluster, so it is pinned left and sits
   * first — the right-edge rule below belongs to Status. The ⋮ menu is hidden
   * for wallet rows (`hideMenuOption`), leaving the eye on its own.
   */
  colDefViewButton: IV4ColumnDef = {
    headerName: 'View',
    field: 'view',
    sortable: false,
    minWidth: 60,
    width: 60,
    maxWidth: 60,
    suppressFloatingFilterButton: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'v4ViewButtonComponent',
    cellRendererParams: {
      viewButtonType: 1,
      tableId: DTTableId.wallet,
      hideMenuOption: true
    },
    pinned: 'left',
    lockPosition: true,
    lockPinned: true,
    suppressMovable: true
  };

  colDefRefId: IV4ColumnDef = {
    headerName: 'Ref ID',
    minWidth: 100,
    maxWidth: 130,
    field: 'universal_wallet_record_transactions.id',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'searchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex items-center',
    cellRenderer: 'v4DTCommonFilterComponent',
    valueGetter: (params: { data: { id: string } }) => params?.data?.id
  };

  colDefAmount: IV4ColumnDef = {
    headerName: 'Amount',
    minWidth: 150,
    maxWidth: 200,
    field: 'transaction_amount',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'searchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'v4WalletAmountComponent',
    cellClass: 'flex justify-end pr-3 text-end'
  };

  colDefDate: IV4ColumnDef = {
    // "Transaction Date" plus the sort indicator needs the full 150 — the old
    // 120 clipped its own header.
    headerName: 'Transaction Date',
    minWidth: 150,
    field: 'universal_wallet_record_transactions.created_at',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'v4DateFloatingFilterComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponentParams: {
      tableId: DTTableId.wallet
    },
    cellClass: 'flex items-center',
    cellRenderer: 'v4UpdatedAtComponent',
    cellRendererForExport: (params: ICellRendererParams) =>
      params?.data?.created_at
  };

  colDefWallet: IV4ColumnDef = {
    headerName: whiteLabelPipe.transform('Wallet', 'wallet'),
    minWidth: 130,
    field: 'wallet_name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'searchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex items-center',
    cellRenderer: 'v4DTCommonFilterComponent'
  };

  colDefPayee: IV4ColumnDef = {
    headerName: 'Payee From/To',
    minWidth: 175,
    field: 'payee_name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'v4PayeeListDropDownFilterComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex items-center',
    cellRenderer: 'v4PayeeNameComponent',
    cellRendererParams: {
      // Wallet rows put free text here (a wallet name, a memo) as often as a
      // real payee, so the renderer's filter icon — which publishes a payee id
      // — would be a dead click on most rows. Filtering stays on the column's
      // payee dropdown, which resolves ids properly.
      hideFilter: true
    }
  };

  colDefSubjectType: IV4ColumnDef = {
    headerName: 'Type of Transfer',
    minWidth: 150,
    maxWidth: 200,
    field: 'subject_type_short_name',
    suppressFloatingFilterButton: true,
    sortable: false,
    floatingFilterComponent: 'v4WalletTransactionTypeFilterComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex items-center',
    cellRenderer: 'v4WalletTransferTypeComponent'
  };

  colDefDescription: IV4ColumnDef = {
    headerName: 'Description',
    minWidth: 200,
    maxWidth: 400,
    field: 'description',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'searchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex items-center',
    cellRenderer: 'v4DTCommonFilterComponent'
  };

  colDefCheckNo: IV4ColumnDef = {
    headerName: 'Check No',
    minWidth: 110,
    maxWidth: 140,
    field: 'check_no',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'searchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex items-center',
    cellRenderer: 'v4DTCommonFilterComponent'
  };

  /**
   * `initial_balance` does not contain "amount", so the right-align + 500 weight
   * has to be opted into with `v4-amount-col` on both halves of the column.
   */
  colDefInitialBalance: IV4ColumnDef = {
    headerName: 'Initial Balance',
    // Wide enough for an 8-figure balance plus the hover filter icon (26px +
    // gap) — at 150 the icon squeezed the value and landed on top of it.
    minWidth: 180,
    maxWidth: 240,
    field: 'initial_balance',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'searchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'v4-amount-col flex justify-end pr-3 text-end',
    headerClass: 'v4-amount-col',
    cellRenderer: 'v4DTCommonFilterComponent',
    cellRendererParams: {
      isAmountField: true
    },
    // The renderer is a string now, so export needs its own currency formatter
    // — it used to piggyback on the old inline `cellRenderer` function.
    cellRendererForExport: (params: ICellRendererParams) =>
      this.currencyPipe.transform(params?.data?.initial_balance)
  };

  colDefCurrentBalance: IV4ColumnDef = {
    headerName: 'Current Balance',
    // Same width budget as Initial Balance — value + hover filter icon.
    minWidth: 180,
    maxWidth: 240,
    field: 'universal_wallet_record_transactions.current_balance',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'searchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'v4-amount-col flex justify-end pr-3 text-end',
    headerClass: 'v4-amount-col',
    cellRenderer: 'v4DTCommonFilterComponent',
    cellRendererParams: {
      isAmountField: true,
      filterField: 'current_balance'
    },
    // No `cellRendererForExport` — the valueGetter below is what export picks
    // up, same plain decimal the column exported before.
    valueGetter: (params: { data: { current_balance: number } }) =>
      new DecimalPipe('en-US').transform(params?.data?.current_balance, '1.2-2')
  };

  colDefSettledDate: IV4ColumnDef = {
    headerName: 'Settled Date',
    minWidth: 130,
    field: 'available_balance_processed_at',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'v4DateFloatingFilterComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex items-center',
    cellRenderer: 'v4DTCommonFilterComponent',
    cellRendererParams: {
      type: 'date'
    }
  };

  /**
   * Status anchors the right edge — this grid has no Actions column, so it is
   * the only candidate. Typed as `ColDef` because `ICoulmnDefFields` narrows
   * `lockPosition` to boolean and the v3 model is frozen.
   */
  colDefStatus: IV4ColumnDef = {
    headerName: 'Status',
    field: 'universal_wallet_record_transactions.status',
    minWidth: 120,
    width: 150,
    maxWidth: 300,
    resizable: true,
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'v4StatusComponent',
    cellClass: 'flex items-center',
    cellRendererParams: {
      // 'custom' keeps the badge inert: the renderer's default 'payments' mode
      // gives it a pointer cursor and a paid-statement click that wallet rows
      // have no uu_id for.
      statusMode: 'custom',
      isApplyTitleCase: true,
      statusMap: WALLET_TRANSACTION_STATUS_MAP
    },
    pinned: 'right',
    lockPosition: 'right',
    lockPinned: true,
    suppressMovable: true,
    /**
     * @param params @param {Object} params - An object containing data with a status property.
     * @param {number} params.data.status - The status value to be evaluated.
     * @returns {string} The status label associated with the provided status value.
     *  Possible return values are: 'Pending', 'Processing', 'Success', or 'Failed'.
     */
    valueGetter: (params: { data: { status: number } }): string =>
      WALLET_TRANSACTION_STATUS_MAP[params?.data?.status]?.status ?? ''
  };

  columnDefs = [
    this.colDefViewButton,
    this.colDefRefId,
    this.colDefAmount,
    this.colDefDate,
    this.colDefWallet,
    this.colDefPayee,
    this.colDefSubjectType,
    this.colDefDescription,
    this.colDefCheckNo,
    this.colDefInitialBalance,
    this.colDefCurrentBalance,
    this.colDefSettledDate,
    this.colDefStatus
  ] as ICoulmnDefFields[];

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

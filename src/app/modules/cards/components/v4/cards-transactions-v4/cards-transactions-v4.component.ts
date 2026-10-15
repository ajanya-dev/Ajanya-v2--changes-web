import { Component, OnDestroy, OnInit, computed, inject } from '@angular/core';
import {
  Subscription,
  debounceTime,
  distinctUntilChanged,
  filter,
  map
} from 'rxjs';
import { ColDef, ICellRendererParams } from '@ag-grid-community/core';
import {
  ICoulmnDefFields,
  IDefaultPayload,
  IFilterModel
} from 'src/app/models/v3-datatable';
import { ICommonTransactionTableData } from 'src/app/models/v3-common';
import { environment } from 'src/environments/environment';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { V4DetailPanelService } from 'src/app/shared/service/v4-detail-panel/v4-detail-panel.service';
import { CardsDataServiceService } from 'src/app/modules/cards/services/cards-data-service.service';
import { Utils } from 'src/app/data/utils';
import {
  DTTableId,
  TTableIdValues
} from 'src/app/modules/data-table/data/table-id';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { V4DataTableComponent } from 'src/app/modules/v4-data-table/components/v4-data-table/v4-data-table.component';
import { V4DropdownFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-dropdown-floating-filter/v4-dropdown-floating-filter.component';
import { V4TextFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-text-floating-filter/v4-text-floating-filter.component';
import { V4DateFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-date-floating-filter/v4-date-floating-filter.component';
import { V4PayeeMultiSelectFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-payee-multi-select-floating-filter/v4-payee-multi-select-floating-filter.component';
import { V4PayeeNameComponent } from 'src/app/modules/payments-v4/payments-out/components/v4-payments-table/cell-renderers/v4-payee-name/v4-payee-name.component';
import { V4UpdatedAtComponent } from 'src/app/modules/payments-v4/payments-out/components/v4-payments-table/cell-renderers/v4-updated-at/v4-updated-at.component';
import { V4DTCommonFilterComponent } from 'src/app/modules/payments-v4/payments-out/components/v4-payments-table/cell-renderers/v4-common-filter/v4-common-filter.component';
import {
  TV4StatusMap,
  V4StatusComponent
} from 'src/app/shared/V4/v4-dt-cellrenders/v4-status/v4-status.component';
import { V4ViewButtonComponent } from 'src/app/shared/v3/dt-cellrenderers/v4-view-button/v4-view-button.component';
// Read-only "Mode of Transfer" cell for the shared `ICommonTransactionTableData`
// row shape. It lives under bank because that grid migrated first; card
// transactions are the same rows from the same endpoint, so this is a reuse,
// not a bank-specific dependency.
import { V4BankTransferModeComponent } from 'src/app/modules/bank/bank-v4/v4-components/bank-transactions-v4/cell-renderers/v4-bank-transfer-mode/v4-bank-transfer-mode.component';

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
  },
  neutral: {
    bgColor: 'var(--v4-badge-neutral-bg-color)',
    textColor: 'var(--v4-badge-neutral-text-color)'
  }
} as const;

/**
 * Status → badge palette for the card transactions grid, covering the same
 * status set the v3 renderer handled (numeric codes for zil payments, string
 * codes for the payment-gateway states).
 *
 * The shared renderer's built-in `PAYMENTS_STATUS_MAP` still inks badge text
 * with `--v4-common-*`, which fails AA on the pale v2.1 fills, so the matching
 * `--v4-badge-*` pairs are passed through the supported `statusMap` override.
 * CANCELED is neutral rather than error — cancelling is not a failure.
 */
const CARD_TRANSACTION_STATUS_MAP: TV4StatusMap = {
  0: { status: 'Pending', ...BADGE.warning },
  pending: { status: 'Pending', ...BADGE.warning },
  PENDING: { status: 'Pending', ...BADGE.warning },
  APPROVAL_REQUIRED: { status: 'Approval required', ...BADGE.warning },
  1: { status: 'Processing', ...BADGE.info },
  PROCESSING: { status: 'Processing', ...BADGE.info },
  2: { status: 'Success', ...BADGE.success },
  COMPLETED: { status: 'Completed', ...BADGE.success },
  completed: { status: 'Completed', ...BADGE.success },
  APPROVED: { status: 'Approved', ...BADGE.success },
  settled: { status: 'Settled', ...BADGE.success },
  active: { status: 'Active', ...BADGE.success },
  3: { status: 'Failed', ...BADGE.error },
  FAILED: { status: 'Failed', ...BADGE.error },
  REJECTED: { status: 'Rejected', ...BADGE.error },
  RETURNED: { status: 'Returned', ...BADGE.error },
  declined: { status: 'Declined', ...BADGE.error },
  inactive: { status: 'Inactive', ...BADGE.error },
  CANCELED: { status: 'Canceled', ...BADGE.neutral }
};

/**
 * `ICoulmnDefFields` narrows `lockPosition` to `boolean`, so the `'right'` the
 * right-edge lock set needs will not type-check against it. That model is v3
 * and frozen, so widen it locally instead of touching it.
 * `cellRendererForExport` is a v4-data-table extension AG Grid's own `ColDef`
 * does not declare.
 */
type IV4ColumnDef = Omit<ICoulmnDefFields, 'lockPosition'> & {
  lockPosition?: ColDef['lockPosition'];
  cellRendererForExport?: (params: ICellRendererParams) => unknown;
};

/**
 * Card transactions grid (v4).
 *
 * v4 owns its own column definitions rather than delegating to
 * `V3CommonTransactionTableComponent`: that component still backs the frozen v3
 * bank-account and v3.5 credit-card grids off the same colDef objects, so every
 * v4 styling decision made there would land on those two as well.
 */
@Component({
  standalone: true,
  selector: 'app-cards-transactions-v4',
  templateUrl: './cards-transactions-v4.component.html',
  styleUrls: ['./cards-transactions-v4.component.scss'],
  providers: [V3DataTableService],
  imports: [V4DataTableComponent]
})
export class CardsTransactionsV4Component implements OnInit, OnDestroy {
  private dataTableService = inject(DataTableService);
  private v3DataTableService = inject(V3DataTableService);
  private cardsDataService = inject(CardsDataServiceService);
  private detailPanelService = inject(V4DetailPanelService);

  isThereCards = computed(
    () => this.cardsDataService.cardsData().cards.length > 0
  );

  /**
   * Which card the grid is showing. Bound to the table's `emptyStateScopeKey`
   * so switching cards re-arms the empty state instead of falling back to the
   * generic "No results found" row.
   */
  selectedCardId = computed(
    () => this.cardsDataService.cardsData().selectedCards.creditCard?.cardId
  );

  /**
   * Empty-state CTA — hands off to `CardsDetailsV4Component.sendMoney()` via the
   * shared cards service, so the verification gate and payment payload live in
   * one place.
   */
  onEmptyStateSendMoney(): void {
    this.cardsDataService.sendMoneyRequested$.next();
  }

  subscriptions: Subscription[] = [];
  filterModel: IFilterModel;

  tableId: TTableIdValues = DTTableId.myCardsTransactions;
  env = environment;

  frameworkComponents = {
    selectBoxComponent: V4DropdownFloatingFilterComponent,
    searchBoxComponent: V4TextFloatingFilterComponent,
    v4DateFloatingFilterComponent: V4DateFloatingFilterComponent,
    v4StatusComponent: V4StatusComponent,
    v4PayeeNameComponent: V4PayeeNameComponent,
    v4BankTransferModeComponent: V4BankTransferModeComponent,
    v4UpdatedAtComponent: V4UpdatedAtComponent,
    v4ViewButtonComponent: V4ViewButtonComponent,
    v4DTCommonFilterComponent: V4DTCommonFilterComponent,
    v4PayeeListDropDownFilterComponent: V4PayeeMultiSelectFloatingFilterComponent
  };

  floatingFilterConfigurations = {
    selectBox: [
      {
        id: 'status',
        values: [
          { value: '0', name: 'Pending' },
          { value: '1', name: 'Processing' },
          { value: '2', name: 'Completed' },
          { value: '3', name: 'Canceled' },
          { value: '4', name: 'Failed' }
        ]
      },
      {
        id: 'transfer_mode',
        values: [
          { value: '1', name: 'ACH' },
          { value: '2', name: 'Print' },
          { value: '3', name: 'Mail Check' },
          { value: '4', name: 'Email Check' },
          { value: '5', name: 'International Payment' },
          { value: '6', name: 'Wire' },
          { value: '7', name: 'Virtual Card' },
          { value: '8', name: 'Mail' },
          { value: '0', name: 'Check' }
        ]
      }
    ]
  };

  ngOnInit(): void {
    this.setData();
    this.listenForLastTransactionDate();
    this.dataTableService.setDataFromParent(
      undefined,
      this.floatingFilterConfigurations
    );
  }

  private listenForLastTransactionDate(): void {
    this.subscriptions.push(
      this.v3DataTableService.hasV3DataTableLoaded$.subscribe(() => {
        if (!this.isAllCardsView(this.v3DataTableService.dataTablePayload)) {
          return;
        }
        const firstRow = this.v3DataTableService.rowData?.[0] as
          | ICommonTransactionTableData
          | undefined;
        this.cardsDataService.lastTransactionDate.set(
          Utils.parseCstDateToIso(firstRow?.updated_at)
        );
        this.cardsDataService.lastTransactionFetched.set(true);
      })
    );
  }

  private isAllCardsView(payload?: IDefaultPayload): boolean {
    const filterModel = payload?.filterModel ?? {};
    return (
      !payload?.startRow &&
      !payload?.sortModel?.length &&
      !filterModel.source_id?.filter &&
      Object.keys(filterModel).every(
        (key) => key === 'source_type' || key === 'source_id'
      )
    );
  }

  /**
   * @description Sets the default payload the grid loads with — scoped to the
   * card currently selected in the list.
   */
  initializeV3DataTable(): void {
    this.v3DataTableService.defaultPayload = {
      startRow: 0,
      endRow: 50,
      rowGroupCols: [],
      valueCols: [],
      pivotCols: [],
      pivotMode: false,
      groupKeys: [],
      filterModel: this.filterModel,
      sortModel: []
    };
    this.v3DataTableService.refreshV3DataTable();
  }

  setData(): void {
    this.subscriptions.push(
      this.cardsDataService
        .getSelectedCard()
        .pipe(
          map((res) => res.creditCard),
          // Opening the page emits twice in one tick — the list loads, which
          // defaults the selection to the first card, then clears it back to
          // "All Cards". Only the settled value should reach the grid, or every
          // visit fires a throwaway request for the first card.
          debounceTime(0),
          // An undefined card means either "All Cards" or "the list has not
          // loaded yet"; only the first should reach the grid.
          filter((res) => !!res || this.isThereCards()),
          distinctUntilChanged((val1, val2) => val1?.cardId === val2?.cardId)
        )
        .subscribe((res) => {
          this.filterModel = {
            source_type: {
              filter: 'CARD',
              filterType: 'text',
              type: 'equals'
            },
            source_id: {
              filter: res?.cardId ?? '',
              filterType: 'text',
              type: 'equals'
            }
          };
          this.initializeV3DataTable();
        })
    );
  }

  /**
   * The View column holds the icon cluster (kebab + eye), so it is pinned left
   * and sits first — the right-edge rule belongs to Status, below.
   */
  colDefViewButton: IV4ColumnDef = {
    headerName: 'View',
    field: 'view',
    sortable: false,
    maxWidth: 100,
    suppressHeaderMenuButton: true,
    suppressMovable: true,
    cellRenderer: 'v4ViewButtonComponent',
    cellRendererParams: {
      viewButtonType: 2,
      onViewClick: (row: ICommonTransactionTableData) =>
        this.detailPanelService.open(row)
    },
    cellClass: 'pl-1',
    pinned: 'left',
    lockPosition: true,
    lockPinned: true
  };

  colDefPayee: IV4ColumnDef = {
    headerName: this.env.env_id === 'compass' ? 'Vendor' : 'Payee',
    field: 'payee_name',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    floatingFilterComponent: 'v4PayeeListDropDownFilterComponent',
    minWidth: 175,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'v4PayeeNameComponent',
    cellClass: 'flex items-center'
  };

  colDefSource: IV4ColumnDef = {
    headerName: 'Source',
    field: 'source_name',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    minWidth: 150,
    floatingFilterComponent: 'searchBoxComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex items-center',
    cellRenderer: 'v4DTCommonFilterComponent'
  };

  // The old `flex flex-col justify-center items-end` never right-aligned: the
  // theme's `.ag-cell.flex-col { align-items: flex-start }` outranks Tailwind's
  // `items-end`. The flex-row recipe below is what the theme is built for.
  colDefAmount: IV4ColumnDef = {
    headerName: 'Amount',
    field: 'amount',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    floatingFilterComponent: 'searchBoxComponent',
    minWidth: 150,
    maxWidth: 200,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex justify-end pr-3 text-end',
    cellRenderer: 'v4DTCommonFilterComponent',
    cellRendererParams: {
      isAmountField: true
    }
  };

  colDefTransferMode: IV4ColumnDef = {
    headerName: 'Mode of Transfer',
    field: 'transfer_mode',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    // "Mode of Transfer" is a long header — it needs room for the sort
    // indicator on top of the 8px cell padding or it clips itself.
    minWidth: 165,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponent: 'selectBoxComponent',
    cellRenderer: 'v4BankTransferModeComponent',
    cellClass: 'flex items-center',
    valueGetter: (params: { data: ICommonTransactionTableData }) =>
      params.data.transfer_type
  };

  colDefDescription: IV4ColumnDef = {
    headerName: 'Description',
    field: 'description',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    minWidth: window.innerWidth <= 1500 ? 100 : 280,
    maxWidth: 400,
    floatingFilterComponent: 'searchBoxComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex items-center',
    cellRenderer: 'v4DTCommonFilterComponent'
  };

  colDefCreatedTime: IV4ColumnDef = {
    headerName: 'Updated At',
    field: 'zil_payments.updated_at',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    minWidth: 130,
    floatingFilterComponent: 'v4DateFloatingFilterComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'v4UpdatedAtComponent',
    cellClass: 'flex items-center',
    cellRendererForExport: (params: ICellRendererParams) =>
      params?.data?.updated_at
  };

  colDefReferenceId: IV4ColumnDef = {
    headerName: 'Reference ID',
    field: 'reference_no',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    minWidth: 130,
    maxWidth: 150,
    floatingFilterComponent: 'searchBoxComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex items-center',
    cellRenderer: 'v4DTCommonFilterComponent'
  };

  /**
   * Status anchors the right edge — this grid has no Actions column, so it is
   * the only candidate.
   */
  colDefStatus: IV4ColumnDef = {
    headerName: 'Status',
    field: 'status',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    minWidth: 120,
    width: 150,
    maxWidth: 300,
    resizable: true,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponent: 'selectBoxComponent',
    cellRenderer: 'v4StatusComponent',
    cellClass: 'flex items-center',
    cellRendererParams: {
      statusMap: CARD_TRANSACTION_STATUS_MAP
    },
    pinned: 'right',
    lockPosition: 'right',
    lockPinned: true,
    suppressMovable: true
  };

  columnDefs = [
    this.colDefViewButton,
    this.colDefPayee,
    this.colDefSource,
    this.colDefAmount,
    this.colDefTransferMode,
    this.colDefDescription,
    this.colDefCreatedTime,
    this.colDefReferenceId,
    this.colDefStatus
  ] as ICoulmnDefFields[];

  ngOnDestroy(): void {
    this.v3DataTableService.rowData = [];
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }
}

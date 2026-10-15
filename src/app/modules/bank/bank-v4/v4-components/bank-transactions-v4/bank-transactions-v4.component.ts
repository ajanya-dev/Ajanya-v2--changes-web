import {
  Component,
  computed,
  EventEmitter,
  inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { BankDataService } from 'src/app/shared/service/bank-data/bank-data.service';
import { IBankDataRes } from 'src/app/modules/bank/bank-v3/model/bank-v35';
import { BankAccountRecordsV4Component } from '../bank-account-records-v4/bank-account-records-v4.component';
import { CommonTabV4Component } from 'src/app/shared/V4/common-tab-v4/common-tab-v4.component';
import { Subscription } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { ICoulmnDefFields, IFilterModel } from 'src/app/models/v3-datatable';
import { ICommonTransactionTableData } from 'src/app/models/v3-common';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { BankDataV35Service } from 'src/app/modules/bank/bank-v3/v35-services/bank-data-v35.service';
import {
  DTTableId,
  TTableIdValues
} from 'src/app/modules/data-table/data/table-id';
import { V4SelectAllCheckBoxComponent } from 'src/app/modules/v4-data-table/components/v4-select-all-check-box/v4-select-all-check-box.component';
import { V4DropdownFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-dropdown-floating-filter/v4-dropdown-floating-filter.component';
import { DtActionComponent } from 'src/app/modules/data-table/components/dt-action/dt-action.component';
import { V4TextFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-text-floating-filter/v4-text-floating-filter.component';
import { V4DateFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-date-floating-filter/v4-date-floating-filter.component';
import {
  TV4StatusMap,
  V4StatusComponent
} from 'src/app/shared/V4/v4-dt-cellrenders/v4-status/v4-status.component';
import { V4PayeeNameComponent } from 'src/app/modules/payments-v4/payments-out/components/v4-payments-table/cell-renderers/v4-payee-name/v4-payee-name.component';
import { V4UpdatedAtComponent } from 'src/app/modules/payments-v4/payments-out/components/v4-payments-table/cell-renderers/v4-updated-at/v4-updated-at.component';
import { V4DTCommonFilterComponent } from 'src/app/modules/payments-v4/payments-out/components/v4-payments-table/cell-renderers/v4-common-filter/v4-common-filter.component';
import { V4ViewButtonComponent } from 'src/app/shared/v3/dt-cellrenderers/v4-view-button/v4-view-button.component';
import { V4PayeeMultiSelectFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-payee-multi-select-floating-filter/v4-payee-multi-select-floating-filter.component';
import { V4DataTableComponent } from 'src/app/modules/v4-data-table/components/v4-data-table/v4-data-table.component';
import { V3DataTableModule } from 'src/app/modules/v3-data-table/v3-data-table.module';
import { ColDef, ICellRendererParams } from '@ag-grid-community/core';
import { Utils } from 'src/app/data/utils';
import { environment } from 'src/environments/environment';
import { V4DetailPanelService } from 'src/app/shared/service/v4-detail-panel/v4-detail-panel.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { BankDataV4Service } from '../../v4-services/bank-data-v4.service';
import { PaymentsV4Service } from 'src/app/modules/payments-v4/shared/services/payments-v4.service';
import { MatDialog } from '@angular/material/dialog';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { PlanDataAlertModalV4Component } from 'src/app/shared/modal/plan-data-alert-modal-v4/plan-data-alert-modal-v4.component';
import { V4BankTransferModeComponent } from './cell-renderers/v4-bank-transfer-mode/v4-bank-transfer-mode.component';

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
 * Status → badge palette for the bank-account transactions grid, covering the
 * same status set the v3 renderer handled.
 *
 * The shared renderer's built-in `PAYMENTS_STATUS_MAP` still colours badge text
 * with `--v4-common-*`, which fails AA on the pale v2.1 fills (#fa9c10 on
 * #fef9c2 is ~2:1). `cellRendererParams.statusMap` is the supported per-grid
 * override, so this passes the `--v4-badge-*` bg/text pairs instead. CANCELED is
 * neutral rather than error — cancelling is not a failure.
 */
const BANK_TRANSACTION_STATUS_MAP: TV4StatusMap = {
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
 * Thin wrapper that provides its OWN V3DataTableService instance so the
 * Plaid bank-account-records table doesn't share state with the Zil
 * Payments v4-data-table in the parent component (which would otherwise
 * trigger an extra API call when switching tabs). This mirrors the v3
 * architecture where each tab is wrapped in its own component that
 * provides V3DataTableService (e.g. V3CommonTransactionTableComponent).
 */
@Component({
  standalone: true,
  selector: 'app-bank-plaid-records-wrapper-v4',
  providers: [V3DataTableService],
  imports: [BankAccountRecordsV4Component],
  template: `
    <app-bank-account-records-v4
      [bankDataSubject]="bankDataSubject"
      [plaidId]="plaidId ?? ''"
      (errorOutput)="errorOutput.emit($event)"
    />
  `
})
export class BankPlaidRecordsWrapperV4Component {
  @Input() bankDataSubject?: IBankDataRes;
  @Input() plaidId?: string;
  @Output() errorOutput = new EventEmitter<HttpErrorResponse>();
}

@Component({
  standalone: true,
  selector: 'app-bank-transactions-v4',
  templateUrl: './bank-transactions-v4.component.html',
  styleUrls: ['./bank-transactions-v4.component.scss'],
  providers: [V3DataTableService],
  imports: [
    V4DataTableComponent,
    V3DataTableModule,
    CommonButtonV4Component,
    CommonTabV4Component,
    BankPlaidRecordsWrapperV4Component
  ]
})
export class BankTransactionsV4Component implements OnInit, OnDestroy {
  private dataTableService = inject(DataTableService);
  private v3DataTableService = inject(V3DataTableService);
  bankDataService = inject(BankDataV35Service);
  bankDataV4Service = inject(BankDataV4Service);
  private activatedRoute = inject(ActivatedRoute);
  private paymentsV4Service = inject(PaymentsV4Service);
  private bankRecordService = inject(BankDataService);
  private dialog = inject(MatDialog);
  private headerService = inject(HeaderService);

  /** v3 parity: two transaction tabs for plaid-verified bank accounts */
  transactionTabs = ['Zil Payments', 'Bank Account'] as const;
  selectedTransactionTab: (typeof this.transactionTabs)[number] = 'Zil Payments';

  @ViewChild(CommonTabV4Component)
  private transactionTabComp?: CommonTabV4Component;

  bankDataSubject?: IBankDataRes;
  bankDataFetched = false;
  bankDataError = false;

  /**
   * Mirrors v3 `canFetch` computed in bank-accounts-details-ocw-v35.
   * Tabs only show when the bank is plaid-verified (mark_as_verified === 1
   * AND has a plaid_account_id) OR is a connected/nature_type === 2 account.
   * The (nature_type === 2 && verified_by === 13) combo is excluded — same
   * exclusion as v3.
   */
  canShowTransactionTabs = computed<boolean>(() => {
    const selectedBank = this.bankDataService.selectedBankAccountSignal();
    if (!selectedBank) return false;
    if (
      selectedBank.bank_account_nature_type === 2 &&
      selectedBank.verified_by === 13
    ) {
      return false;
    }
    return Boolean(
      (selectedBank.mark_as_verified === 1 &&
        selectedBank.plaid_detail?.plaid_account_id) ||
        selectedBank.bank_account_nature_type === 2
    );
  });

  changeTransactionTab(tab: (typeof this.transactionTabs)[number]) {
    if (tab === 'Bank Account') {
      const selectedBank = this.bankDataService.selectedBankAccountSignal();
      if (!selectedBank) return;

      const fetchBalance = Boolean(
        selectedBank.mark_as_verified === 1 &&
          selectedBank.plaid_detail?.plaid_account_id
      );

      // eslint-disable-next-line no-underscore-dangle
      const headerData = this.headerService._headerData.value;

      if (fetchBalance && (headerData === false || !headerData.isSubscribed)) {
        this.dialog.open(PlanDataAlertModalV4Component, {
          width: '353px',
          autoFocus: false,
          panelClass: 'paddingless-modal-rounded',
          data: { target: 'plans' },
          disableClose: true
        });
        // revert the child tab's internal highlight so "Bank Account" does not
        // appear selected while the gate modal blocks the switch
        this.transactionTabComp?.activeTab.set('Zil Payments');
        return; // block tab switch — grid does not render
      }
    }

    this.selectedTransactionTab = tab;
  }

  /**
   * v3 parity: pre-fetch the bank-data index ONCE (in ngOnInit) so that
   * switching to the "Bank Account" tab does not trigger an API call.
   */
  private fetchBankDataIndex() {
    if (this.bankDataFetched) return;
    this.bankRecordService.getIndex(true).subscribe({
      next: (val) => {
        if (!val.success) return;
        this.bankDataSubject = val.data;
        this.bankDataFetched = true;
      },
      error: () => {
        this.bankDataError = true;
      }
    });
  }

  onBankAccountError(_err: HttpErrorResponse) {
    this.selectedTransactionTab = 'Zil Payments';
  }

  get fetchBankRecordsState() {
    return this.bankDataV4Service.getFetchBankRecordsState();
  }

  fetchBankRecords(): void {
    this.bankDataV4Service.fetchBankRecords();
  }

  /**
   * Empty-state CTA — hands off to `BankDetailsV4Component.goToPayments('pay')`
   * via the shared v4 bank service, so the payment payload built from the
   * selected account lives in one place.
   */
  onEmptyStateSendPayment(): void {
    this.bankDataV4Service.sendPaymentRequested$.next();
  }

  subscriptions: Subscription[] = [];
  filterModel: IFilterModel;
  selectedBankAccount$ = toObservable(
    this.bankDataService.selectedBankAccountSignal
  );

  tableId: TTableIdValues = DTTableId.bankAccountTransactions;
  env = environment;

  frameworkComponents = {
    headerCheckBoxComponent: V4SelectAllCheckBoxComponent,
    selectBoxComponent: V4DropdownFloatingFilterComponent,
    actionComponent: DtActionComponent,
    searchBoxComponent: V4TextFloatingFilterComponent,
    v4DateFloatingFilterComponent: V4DateFloatingFilterComponent,
    v4StatusComponent: V4StatusComponent,
    v4PayeeNameComponent: V4PayeeNameComponent,
    v4BankTransferModeComponent: V4BankTransferModeComponent,
    v4UpdatedAtComponent: V4UpdatedAtComponent,
    v4ViewButtonComponent: V4ViewButtonComponent,
    v4PayeeListDropDownFilterComponent:
      V4PayeeMultiSelectFloatingFilterComponent,
    v4DTCommonFilterComponent: V4DTCommonFilterComponent
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

  ngOnInit() {
    this.setData();
    this.listenForLastTransactionDate();
    this.dataTableService.setDataFromParent(
      undefined,
      this.floatingFilterConfigurations
    );
    this.fetchBankDataIndex();
    this.subscriptions.push(
      this.paymentsV4Service.paymentCompleted$.subscribe(() => {
        this.v3DataTableService.refreshV3DataTable();
      })
    );
  }

  private listenForLastTransactionDate(): void {
    this.subscriptions.push(
      this.v3DataTableService.hasV3DataTableLoaded$.subscribe(() => {
        // Only the untouched first page of the current account is the
        // "latest transaction"; a user filter/sort, or a late response from
        // the previously selected account, must not overwrite the card.
        if (!this.isDefaultTransactionsLoad()) return;
        const firstRow = this.v3DataTableService.rowData?.[0] as
          | ICommonTransactionTableData
          | undefined;
        this.bankDataV4Service.lastTransactionDate.set(
          Utils.parseCstDateToIso(firstRow?.updated_at)
        );
        this.bankDataV4Service.lastTransactionFetched.set(true);
      })
    );
  }

  /**
   * True when the load that just finished was the first page for the
   * currently selected account, with no user filter and no sort applied.
   */
  private isDefaultTransactionsLoad(): boolean {
    const payload = this.v3DataTableService.dataTablePayload;
    if (!payload) return true;
    const filters = (payload.filterModel ?? {}) as Record<
      string,
      { filter?: string }
    >;
    const currentSourceId = (
      this.filterModel as Record<string, { filter?: string }> | undefined
    )?.['source_id']?.filter;
    return (
      payload.startRow === 0 &&
      !payload.sortModel?.length &&
      Object.keys(filters).every((key) =>
        ['source_type', 'source_id'].includes(key)
      ) &&
      (filters['source_id']?.filter ?? '') === (currentSourceId ?? '')
    );
  }

  initializeV3DataTable() {
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

  setData() {
    this.subscriptions.push(
      this.selectedBankAccount$.subscribe((res) => {
        if (this.activatedRoute.snapshot.queryParams.id && !res) return;

        // v3 parity: reset to Zil Payments whenever the selected bank changes
        this.selectedTransactionTab = 'Zil Payments';

        // The card lives in a sibling component and reads this shared signal;
        // clear it so it shows its loading state instead of the previous
        // account's date until this account's first page arrives.
        this.bankDataV4Service.lastTransactionDate.set(undefined);
        this.bankDataV4Service.lastTransactionFetched.set(false);

        this.filterModel = {
          source_type: {
            filter: 'BANK',
            filterType: 'text',
            type: 'equals'
          },
          source_id: {
            filter: res?.encrypted_bankacc_id ?? '',
            filterType: 'text',
            type: 'equals'
          }
        };
        this.initializeV3DataTable();
      })
    );
  }

  ngOnDestroy() {
    this.v3DataTableService.rowData = [];
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  /* Column Definitions */

  private detailPanelService = inject(V4DetailPanelService);

  /**
   * The View column holds the icon cluster (kebab + eye), so it is pinned left
   * and sits first — the right-edge rule belongs to Status, below.
   */
  colDefViewButton: ICoulmnDefFields = {
    headerName: 'View',
    field: 'view',
    sortable: false,
    maxWidth: 100,
    cellRenderer: 'v4ViewButtonComponent',
    cellRendererParams: {
      viewButtonType: 2,
      onViewClick: (row: ICommonTransactionTableData) =>
        this.detailPanelService.open(row)
    },
    suppressHeaderMenuButton: true,
    suppressMovable: true,
    cellClass: 'pl-1',
    pinned: 'left',
    lockPosition: true,
    lockPinned: true
  };

  colDefPayee: ICoulmnDefFields = {
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

  colDefSource: ICoulmnDefFields = {
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

  colDefAmount: ICoulmnDefFields = {
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

  colDefTransferMode = {
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

  colDefDescription: ICoulmnDefFields = {
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

  colDefCreatedTime = {
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

  colDefReferenceId: ICoulmnDefFields = {
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
   * the only candidate. Typed as `ColDef` because `ICoulmnDefFields` narrows
   * `lockPosition` to boolean and the v3 model is frozen.
   */
  colDefStatus: ColDef = {
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
    pinned: 'right',
    lockPosition: 'right',
    lockPinned: true,
    suppressMovable: true,
    cellRendererParams: {
      statusMap: BANK_TRANSACTION_STATUS_MAP
    }
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
}

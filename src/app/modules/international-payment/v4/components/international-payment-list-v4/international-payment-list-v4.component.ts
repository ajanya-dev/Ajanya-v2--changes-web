import { CurrencyPipe, TitleCasePipe } from '@angular/common';
import {
  Component,
  computed,
  DestroyRef,
  inject,
  OnDestroy,
  OnInit,
  signal,
  TemplateRef,
  viewChild
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PaymentsV4Service } from 'src/app/modules/payments-v4/shared/services/payments-v4.service';
import {
  PaymentMethod,
  PaymentSource,
  SendPaymentMode
} from 'src/app/modules/payments-v4/send-payment/models/send-payment.enums';
import { PaymentTypeAccessService } from 'src/app/shared/service/common/shared/payment-type-access/payment-type-access.service';
import { ComponentType } from '@angular/cdk/portal';
import {
  ColDef,
  GridApi,
  IRowNode,
  ValueFormatterParams
} from '@ag-grid-community/core';
import { ICoulmnDefFields } from 'src/app/models/v3-datatable';
import { IDtFloatingFilterProp } from 'src/app/modules/data-table/model/datatable';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { IV3DtHeaderElements } from 'src/app/modules/v3-data-table/models/v3-data-table';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { V4DataTableComponent } from 'src/app/modules/v4-data-table/components/v4-data-table/v4-data-table.component';
import { IV4DataTableEmptyState } from 'src/app/modules/v4-data-table/components/v4-data-table-empty-state/v4-data-table-empty-state.component';
import { V4FloatingActionBarComponent } from 'src/app/modules/v4-data-table/components/v4-floating-action-bar/v4-floating-action-bar.component';
import { V4SelectAllCheckBoxComponent } from 'src/app/modules/v4-data-table/components/v4-select-all-check-box/v4-select-all-check-box.component';
import { V4TextFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-text-floating-filter/v4-text-floating-filter.component';
import { V4DateFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-date-floating-filter/v4-date-floating-filter.component';
import { V4DropdownFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-dropdown-floating-filter/v4-dropdown-floating-filter.component';
import { V4PayeeMultiSelectFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-payee-multi-select-floating-filter/v4-payee-multi-select-floating-filter.component';
import {
  PAYMENTS_STATUS_MAP,
  V4StatusComponent
} from 'src/app/shared/V4/v4-dt-cellrenders/v4-status/v4-status.component';
import { V4UpdatedAtComponent } from 'src/app/modules/payments-v4/payments-out/components/v4-payments-table/cell-renderers/v4-updated-at/v4-updated-at.component';
import { V4CreatedAtComponent } from 'src/app/modules/payments-v4/payments-out/components/v4-payments-table/cell-renderers/v4-created-at/v4-created-at.component';
import { V3DTCommonFilterComponent } from 'src/app/shared/v3/dt-cellrenderers/dt-common-filter';
import {
  DetailSidePanelComponent,
  IDetailPanelStatusBadge
} from 'src/app/shared/V4/detail-side-panel/detail-side-panel.component';
import { V4ViewButtonComponent } from 'src/app/shared/v3/dt-cellrenderers/v4-view-button/v4-view-button.component';
import { WalletService } from 'src/app/shared/service/wallet/wallet.service';
import { MatDialog } from '@angular/material/dialog';
import { V4SendPaymentProofModalComponent } from 'src/app/shared/modal/v4-send-payment-proof-modal/v4-send-payment-proof-modal.component';
import {
  InternationalPaymentDetailPanelV4Component,
  IPaymentActivityChange
} from '../international-payment-detail-panel-v4/international-payment-detail-panel-v4.component';

/**
 * `ICoulmnDefFields` narrows `lockPosition` and `checkboxSelection` to `boolean`,
 * so the `'right'` the right-edge lock set needs — and the per-row checkbox
 * callback the checkbox column already used — will not type-check against it.
 * That model is v3 and frozen, so widen it locally instead of touching it.
 * `cellRendererForExport` is a v4-data-table extension AG Grid's own `ColDef`
 * does not declare.
 */
type IV4ColumnDef = Omit<
  ICoulmnDefFields,
  'lockPosition' | 'checkboxSelection'
> & {
  lockPosition?: ColDef['lockPosition'];
  checkboxSelection?: ColDef['checkboxSelection'];
  cellRendererForExport?: (params: never) => string;
};

@Component({
  selector: 'app-international-payment-list-v4',
  standalone: true,
  imports: [
    V4DataTableComponent,
    V4FloatingActionBarComponent,
    DetailSidePanelComponent,
    InternationalPaymentDetailPanelV4Component
  ],
  templateUrl: './international-payment-list-v4.component.html'
})
export class InternationalPaymentListV4Component implements OnInit, OnDestroy {
  private dataTableService = inject(DataTableService);
  private v3DataTableService = inject(V3DataTableService);
  private alertService = inject(V4AlertService);
  private walletService = inject(WalletService);
  private destroyRef = inject(DestroyRef);
  private paymentsV4Service = inject(PaymentsV4Service);
  private paymentTypeAccessService = inject(PaymentTypeAccessService);
  private currencyPipe = inject(CurrencyPipe);
  private dialog = inject(MatDialog);
  private titlePipe = new TitleCasePipe();

  /** Empty state (design O17) — CTA repeats the page header's primary action. */
  readonly emptyStateConfig: IV4DataTableEmptyState = {
    icon: 'globe',
    title: 'No international payments yet',
    description:
      'Send your first payment abroad to start tracking transfers and settlements here',
    buttonText: 'New International Payment'
  };

  public tableId = DTTableId.internationalPaymentRecentTransaction;

  deselectedColumns: string[] = [];
  selectedRows: Record<string, unknown>[] = [];
  private gridApi: GridApi | null = null;

  markAsSettledLoading = signal(false);

  headerElements = computed<IV3DtHeaderElements>(() => ({
    buttons: [
      {
        text: 'Mark as Settled',
        id: 'id_mark_as_settled',
        lucideIcon: 'circle-check-big',
        floatingBarVariant: 'filled-success',
        loading: this.markAsSettledLoading()
      }
    ]
  }));

  // Side panel state
  isDetailPanelOpen = signal(false);
  isDetailPanelExpanded = signal(false);
  selectedPaymentData = signal<Record<string, unknown> | undefined>(undefined);
  selectedPaymentUuId = signal('');

  detailContent = viewChild<TemplateRef<unknown>>('detailContent');

  selectedPayeeName = computed(
    () => (this.selectedPaymentData()?.payee_name as string) ?? 'Payment'
  );

  selectedStatusBadge = computed<IDetailPanelStatusBadge | undefined>(() => {
    const status = this.selectedPaymentData()?.status as string | number;
    if (status === undefined || status === null || status === '') {
      return undefined;
    }
    const badge = PAYMENTS_STATUS_MAP[status];
    return {
      text: badge?.status ?? String(status),
      color: badge?.textColor ?? 'var(--v4-common-blue-color)',
      bgColor: badge?.bgColor ?? 'var(--v4-badge-info-bg-color)'
    };
  });

  frameworkComponents: Record<string, ComponentType<unknown>> = {
    headerCheckBoxComponent: V4SelectAllCheckBoxComponent,
    selectBoxComponent: V4DropdownFloatingFilterComponent,
    SearchBoxComponent: V4TextFloatingFilterComponent,
    dateRangeV35Component: V4DateFloatingFilterComponent,
    V3payeeListDropDownFilterComponent:
      V4PayeeMultiSelectFloatingFilterComponent,
    v3StatusComponent: V4StatusComponent,
    v4UpdatedAtComponent: V4UpdatedAtComponent,
    v4CreatedAtComponent: V4CreatedAtComponent,
    V3DTCommonFilterComponent,
    v3ViewButtonComponent: V4ViewButtonComponent
  };

  floatingFilterComponent: IDtFloatingFilterProp = {
    selectBox: [
      {
        id: 'status',
        values: [
          { value: '1', name: 'Processing' },
          { value: '2', name: 'Paid' },
          { value: '4', name: 'Failed' }
        ]
      },
      {
        id: 'source_type',
        values: [
          { value: 'BANK', name: 'Bank' },
          { value: 'CARD', name: 'Card' },
          { value: 'WALLET', name: 'Wallet' }
        ]
      },
      {
        id: 'beneficiary_type',
        values: [
          { value: 'business', name: 'Business' },
          { value: 'personal', name: 'Personal' }
        ]
      },
      {
        id: 'is_user_settled',
        values: [
          { value: '1', name: 'Settled' },
          { value: '0', name: 'Unsettled' }
        ]
      }
    ],
    selectDate: [
      {
        id: 'zil_payments.created_at',
        initialRange: 'All Time'
      },
      {
        id: 'zil_payments.updated_at',
        initialRange: 'All Time'
      }
    ]
  };

  // Fixed 50px — a bare maxWidth lets ag-grid flex the checkbox gutter as the
  // other columns resize.
  colDefId: IV4ColumnDef = {
    width: 50,
    minWidth: 50,
    maxWidth: 50,
    headerName: '',
    sortable: false,
    field: 'boxId',
    suppressFloatingFilterButton: true,
    suppressHeaderMenuButton: true,
    lockPosition: true,
    lockPinned: true,
    suppressMovable: true,
    headerCheckboxSelection: true,
    checkboxSelection: (params: { data: { can_mark_as_settled: number } }) =>
      params.data?.can_mark_as_settled === 1,
    showDisabledCheckboxes: true,
    pinned: 'left',
    // Same alignment pair as the payments-out checkbox column: rows center in
    // the 50px gutter and the header select-all lines up over them.
    cellClass: 'flex justify-center',
    headerClass: 'pl-3.5'
  };

  /**
   * The kebab + eye icon cluster. This is a View column, not an Actions column —
   * it pins left, second, right after the checkbox, and the right-edge rule that
   * governs Status does not apply to it.
   */
  colDefView: IV4ColumnDef = {
    headerName: 'View',
    field: 'action',
    minWidth: 80,
    maxWidth: 100,
    suppressFloatingFilterButton: true,
    floatingFilter: true,
    sortable: false,
    suppressHeaderMenuButton: true,
    pinned: 'left',
    lockPosition: true,
    lockPinned: true,
    suppressMovable: true,
    cellClass: 'pl-1',
    cellRenderer: 'v3ViewButtonComponent',
    cellRendererParams: {
      viewButtonType: 0,
      hideMenuOption: false,
      from: 'international-payment-transactions',
      onViewClick: (row: Record<string, unknown>) => this.openDetailPanel(row)
    }
  };

  colDefPayee: IV4ColumnDef = {
    headerName: 'Payee',
    minWidth: 175,
    field: 'payee_name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'V3payeeListDropDownFilterComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  // 'Payee Type' plus the sort indicator does not fit in 80.
  colDefRecipientType: IV4ColumnDef = {
    headerName: 'Payee Type',
    field: 'beneficiary_type',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    floatingFilterComponent: 'selectBoxComponent',
    minWidth: 115,
    maxWidth: 140,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    valueFormatter: (params: ValueFormatterParams) =>
      this.titlePipe.transform(params.value ?? '')
  };

  colDefPayeeEmail: IV4ColumnDef = {
    headerName: 'Payee Email',
    field: 'payee_email',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    floatingFilterComponent: 'SearchBoxComponent',
    minWidth: 170,
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  // col-id contains 'amount', so the theme supplies the right-align, the 12px
  // right pad and the 500 weight for both the cell and its header.
  colDefAmount: IV4ColumnDef = {
    headerName: 'Amount',
    field: 'amount',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    floatingFilterComponent: 'SearchBoxComponent',
    minWidth: 150,
    maxWidth: 200,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex justify-end pr-3 text-end',
    valueFormatter: (params: ValueFormatterParams) =>
      this.currencyPipe.transform(params.value) ?? ''
  };

  // A width read off window.innerWidth is fixed at construction and clipped the
  // 'Description' header on narrower screens — 150 fits the header everywhere.
  colDefDescription: IV4ColumnDef = {
    headerName: 'Description',
    field: 'description',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    minWidth: 150,
    maxWidth: 400,
    floatingFilterComponent: 'SearchBoxComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  // The grid has no Actions column, so Status anchors the right edge and carries
  // the full lock set.
  colDefStatus: IV4ColumnDef = {
    headerName: 'Status',
    field: 'status',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    minWidth: 120,
    width: 150,
    maxWidth: 300,
    resizable: true,
    floatingFilterComponent: 'selectBoxComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    pinned: 'right',
    lockPosition: 'right',
    lockPinned: true,
    suppressMovable: true,
    cellStyle: { display: 'flex', 'align-items': 'center' },
    cellRenderer: 'v3StatusComponent',
    cellRendererParams: {
      isStatementDisable: true,
      isApplyTitleCase: true,
      tableType: 'international-payment-transactions'
    }
  };

  colDefSettled: IV4ColumnDef = {
    headerName: 'Settled',
    field: 'is_user_settled',
    suppressFloatingFilterButton: true,
    suppressHeaderMenuButton: true,
    minWidth: 110,
    maxWidth: 130,
    filter: 'agTextColumnFilter',
    floatingFilterComponent: 'selectBoxComponent',
    floatingFilter: true,
    sortable: false,
    cellClass: 'flex items-center',
    // Chrome and colour both come from the theme's .status-badge modifiers, so
    // the chip matches every other v4 grid in both themes — no inline styling.
    cellRenderer: (params: { value: number }) => {
      const isSettled = params.value !== 0;
      const modifier = isSettled ? 'status-completed' : 'status-pending';
      const label = isSettled ? 'Settled' : 'Unsettled';
      return `<span class="status-badge ${modifier}">${label}</span>`;
    }
  };

  colDefCreatedAt: IV4ColumnDef = {
    headerName: 'Created Date',
    field: 'zil_payments.created_at',
    suppressFloatingFilterButton: true,
    filter: 'agDateColumnFilter',
    minWidth: 180,
    floatingFilterComponent: 'dateRangeV35Component',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'v4CreatedAtComponent',
    cellRendererParams: { inline: true },
    floatingFilterComponentParams: {
      tableName: 'international_transactions'
    },
    cellRendererForExport: (params: { data: { created_at: string } }) =>
      params.data.created_at
  };

  colDefUpdatedAt: IV4ColumnDef = {
    headerName: 'Updated Date',
    field: 'zil_payments.updated_at',
    suppressFloatingFilterButton: true,
    filter: 'agDateColumnFilter',
    minWidth: 180,
    floatingFilterComponent: 'dateRangeV35Component',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'v4UpdatedAtComponent',
    cellRendererParams: { inline: true },
    floatingFilterComponentParams: {
      tableName: 'international_transactions'
    },
    cellRendererForExport: (params: { data: { updated_at: string } }) =>
      params.data.updated_at
  };

  // 'INTERNATIONAL PAYMENT' shouted and clipped at 140; title-cased and given
  // room it reads as a value rather than a constant.
  colDefTransferMode: IV4ColumnDef = {
    headerName: 'Type',
    field: 'transfer_type',
    suppressFloatingFilterButton: true,
    filter: false,
    minWidth: 160,
    maxWidth: 220,
    floatingFilter: false,
    suppressHeaderMenuButton: true,
    cellRenderer: 'V3DTCommonFilterComponent',
    cellRendererParams: { isApplyTitleCase: true }
  };

  colDefSourceType: IV4ColumnDef = {
    headerName: 'Source Type',
    field: 'source_type',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    minWidth: 130,
    maxWidth: 170,
    floatingFilterComponent: 'selectBoxComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    valueGetter: (params: { data: { source: { source: string } } }) =>
      params.data?.source?.source || '',
    valueFormatter: (params: ValueFormatterParams) =>
      this.titlePipe.transform(params.value ?? '')
  };

  colDefSourceName: IV4ColumnDef = {
    headerName: 'Source',
    field: 'source_name',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    minWidth: 120,
    floatingFilterComponent: 'SearchBoxComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'V3DTCommonFilterComponent'
  };

  colDefCreatedBy: IV4ColumnDef = {
    headerName: 'Created By',
    field: 'created_by.name',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    minWidth: 120,
    maxWidth: 180,
    floatingFilterComponent: 'SearchBoxComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    valueGetter: (params: { data: { created_by: { name: string } } }) =>
      params.data?.created_by?.name || ''
  };

  columnDefs: IV4ColumnDef[] = [
    this.colDefId,
    this.colDefView,
    this.colDefPayee,
    this.colDefRecipientType,
    this.colDefPayeeEmail,
    this.colDefAmount,
    this.colDefDescription,
    this.colDefSettled,
    this.colDefTransferMode,
    this.colDefSourceType,
    this.colDefSourceName,
    this.colDefCreatedBy,
    this.colDefCreatedAt,
    this.colDefUpdatedAt,
    this.colDefStatus
  ];

  // Rendered order comes from this list, not from columnDefs — keep the two in
  // step: checkbox, View, data columns, Status on the right edge.
  columnFields = [
    {
      id: 'boxId',
      name: 'Check Box',
      isDisabled: true,
      colDef: this.colDefId,
      isChecked: true
    },
    {
      id: 'action',
      name: 'View',
      isDisabled: true,
      colDef: this.colDefView,
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
      isDisabled: true,
      colDef: this.colDefDescription,
      isChecked: true
    },
    {
      id: 'is_user_settled',
      name: 'Settled',
      isDisabled: false,
      colDef: this.colDefSettled,
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
      colDef: this.colDefSourceType,
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
      id: 'status',
      name: 'Status',
      isDisabled: false,
      colDef: this.colDefStatus,
      isChecked: true
    }
  ];

  // Matched against colDef.field, so 'reference_no' never resolved to a column.
  fieldsShownByDefault = [
    'boxId',
    'amount',
    'description',
    'payee_name',
    'beneficiary_type',
    'payee_email',
    'status',
    'created_at',
    'updated_at',
    'transfer_mode',
    'source_name',
    'created_by',
    'action'
  ];

  ngOnInit(): void {
    this.v3DataTableService.resetV3DataTablePayload();
    this.dataTableService.setDataFromParent(
      this.columnFields,
      this.floatingFilterComponent
    );
    this.v3DataTableService.refreshV3DataTable();
    this.getRowSelectionData();
  }

  private getRowSelectionData(): void {
    this.v3DataTableService.v3RowSelectionData$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((rows) => {
        this.selectedRows = rows.map((r) => r.data as Record<string, unknown>);
      });
  }

  headerButtonClick(event: { id: string | number }): void {
    if (event.id === 'id_mark_as_settled') {
      this.onMarkAsSettled(this.selectedRows);
    }
  }

  onGridReady(api: GridApi): void {
    this.gridApi = api;
  }

  /**
   * Empty-state CTA — same guarded send-modal call as the page header's
   * "New International Payment" button, including the plan/permission check
   * that blocks the method when it is not available to this account.
   */
  onEmptyStateNewPayment(): void {
    const disabled = this.paymentTypeAccessService.disabledMethods$.getValue();
    if (disabled.includes(PaymentMethod.InternationalPayment)) {
      this.paymentTypeAccessService.openAlertMessage(
        PaymentMethod.InternationalPayment,
        true
      );
      return;
    }
    this.paymentsV4Service.openSendModal({
      paymentSource: PaymentSource.Wallet,
      paymentMethod: PaymentMethod.InternationalPayment
    });
  }

  clearSelection(): void {
    this.gridApi?.deselectAll();
  }

  onMarkAsSettled(selectedRows: Record<string, unknown>[]): void {
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
    const count = selectedRows.length;
    const alert = this.alertService.confirmAlert({
      content: `Are you sure you want to mark ${count === 1 ? 'this' : 'these'} ${count === 1 ? 'transaction' : 'transactions'} as settled?`
    });
    const ids = selectedRows.map((row) => (row.transfer_id as string) || '');
    alert
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result) {
          this.markAsSettledAction(ids);
        }
      });
  }

  markAsSettledAction(ids: string[]): void {
    this.markAsSettledLoading.set(true);
    this.walletService
      .markAsSettled(ids)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.markAsSettledLoading.set(false);
          if (res?.success) {
            this.v3DataTableService.refreshV3DataTable();
            this.alertService.successAlert({ content: 'Marked as settled.' });
            this.gridApi?.deselectAll();
          }
        },
        error: () => this.markAsSettledLoading.set(false)
      });
  }

  openDetailPanel(row: Record<string, unknown>): void {
    this.selectedPaymentData.set(row);
    this.selectedPaymentUuId.set(
      (row.uu_id as string) || (row.id as string) || ''
    );
    this.isDetailPanelOpen.set(true);
  }

  onActionButtonClicked(key: string): void {
    if (key === 'clone') {
      const uuid = this.selectedPaymentUuId();
      if (uuid) {
        this.paymentsV4Service.openSendModal({
          mode: SendPaymentMode.Clone,
          paymentId: uuid
        });
      }
    }
    if (key === 'send-proof') {
      const row = this.selectedPaymentData();
      if (!row) return;
      this.dialog.open(V4SendPaymentProofModalComponent, {
        maxWidth: '500px',
        width: '93%',
        data: {
          checkStatus: undefined,
          uuId: row.uu_id,
          encryptedId: row.zilpayment_id,
          mode: 'pp',
          payee: { email: row.payee_email, phone: row.payee_phone },
          amount: row.amount
        },
        disableClose: true,
        panelClass: 'paddingless-modal-rounded'
      });
    }
  }

  onActivityChanged({ key, present }: IPaymentActivityChange): void {
    const zilId = this.selectedPaymentData()?.zilpayment_id;
    if (!zilId || !this.gridApi) return;
    const value = present ? 1 : 0;
    const nodes: IRowNode[] = [];
    this.gridApi.forEachNode((node) => {
      if (node.data?.zilpayment_id === zilId && node.data[key] !== value)
        nodes.push(node);
    });
    nodes.forEach((node) => node.setData({ ...node.data, [key]: value }));
  }

  ngOnDestroy(): void {
    this.v3DataTableService.rowData = [];
  }
}

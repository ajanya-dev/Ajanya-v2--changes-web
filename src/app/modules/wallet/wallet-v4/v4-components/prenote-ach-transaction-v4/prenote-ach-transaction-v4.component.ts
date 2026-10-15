import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ColDef } from '@ag-grid-community/core';
import { ICoulmnDefFields } from 'src/app/models/v3-datatable';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { V4DataTableComponent } from 'src/app/modules/v4-data-table/components/v4-data-table/v4-data-table.component';
import { V4TextFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-text-floating-filter/v4-text-floating-filter.component';
import { V4DateFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-date-floating-filter/v4-date-floating-filter.component';
import { V4DropdownFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-dropdown-floating-filter/v4-dropdown-floating-filter.component';
import { V4DTCommonFilterComponent } from 'src/app/modules/payments-v4/payments-out/components/v4-payments-table/cell-renderers/v4-common-filter/v4-common-filter.component';
import { V4CreatedAtComponent } from 'src/app/modules/payments-v4/payments-out/components/v4-payments-table/cell-renderers/v4-created-at/v4-created-at.component';
import {
  TV4StatusMap,
  V4StatusComponent
} from 'src/app/shared/V4/v4-dt-cellrenders/v4-status/v4-status.component';

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
 * Status → badge palette for the ACH prenote grid.
 *
 * The five numeric states match the Status column's dropdown options, so the
 * label a row publishes on a filter click resolves against them. The shared
 * renderer's built-in `PAYMENTS_STATUS_MAP` inks badge text with
 * `--v4-common-*`, which fails AA on the pale v2.1 fills, so the matching
 * `--v4-badge-*` pairs are passed through the supported `statusMap` override.
 */
const PRENOTE_STATUS_MAP: TV4StatusMap = {
  0: { status: 'Pending', ...BADGE.warning },
  1: { status: 'Processing', ...BADGE.info },
  2: { status: 'Completed', ...BADGE.success },
  4: { status: 'Failed', ...BADGE.error },
  5: { status: 'Returned', ...BADGE.error }
};

/** API account-type code → the label shown in the cell and in the Account Type dropdown. */
const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  personalChecking: 'Personal Checking',
  businessChecking: 'Business Checking',
  personalSavings: 'Personal Savings',
  businessSavings: 'Business Savings',
  CHECKING: 'Checking',
  BUSINESS: 'Business',
  SAVINGS: 'Savings'
};

/**
 * `ICoulmnDefFields` narrows `lockPosition` to `boolean`, so the `'right'` the
 * right-edge lock set needs will not type-check against it. That model is v3
 * and frozen, so widen it locally instead of touching it.
 */
type IV4ColumnDef = Omit<ICoulmnDefFields, 'lockPosition'> & {
  lockPosition?: ColDef['lockPosition'];
};

@Component({
  selector: 'app-prenote-ach-transaction-v4',
  standalone: true,
  imports: [V4DataTableComponent],
  templateUrl: './prenote-ach-transaction-v4.component.html',
  styleUrl: './prenote-ach-transaction-v4.component.scss'
})
export class PrenoteAchTransactionV4Component implements OnInit {
  private dataTableService = inject(DataTableService);
  private v3DataTableService = inject(V3DataTableService);
  private router = inject(Router);

  public tableId = DTTableId.prenoteAchTransaction;
  fieldsShownByDefault: string[] = [
    'status',
    'uu_id',
    'sender_name',
    'created_at'
  ];

  frameworkComponents = {
    selectBoxComponent: V4DropdownFloatingFilterComponent,
    searchBoxComponent: V4TextFloatingFilterComponent,
    v4DateFloatingFilterComponent: V4DateFloatingFilterComponent,
    v4DTCommonFilterComponent: V4DTCommonFilterComponent,
    v4CreatedAtComponent: V4CreatedAtComponent,
    v4StatusComponent: V4StatusComponent
  };

  floatingFilterComponent = {
    selectBox: [
      {
        id: 'status',
        values: [
          { value: '0', name: 'Pending' },
          { value: '1', name: 'Processing' },
          { value: '2', name: 'Completed' },
          { value: '4', name: 'Failed' },
          { value: '5', name: 'Returned' }
        ]
      },
      {
        id: 'sender_bank_account_type',
        values: Object.entries(ACCOUNT_TYPE_LABELS).map(([value, name]) => ({
          value,
          name
        }))
      }
    ]
  };

  /**
   * Empty-state CTA. Nothing is created from this page — a prenote is raised
   * automatically when a bank account is added to a wallet — so the CTA sends
   * the user to where that happens. The page opens in its own tab, so this
   * navigates rather than going back.
   */
  onEmptyStateGoToWallets(): void {
    this.router.navigateByUrl('/v4/manage/wallets');
  }

  ngOnInit(): void {
    this.dataTableService.setDataFromParent(
      undefined,
      this.floatingFilterComponent
    );
    this.v3DataTableService.resetV3DataTablePayload();
    this.v3DataTableService.refreshV3DataTable();
  }

  /** Table columns */

  colDefId: IV4ColumnDef = {
    headerName: 'ID',
    // A full 36-char UUID at 12px needs ~250px plus cell padding and the
    // hover filter icon — 120/200 always truncated it.
    minWidth: 290,
    maxWidth: 320,
    field: 'uu_id',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'searchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex items-center',
    cellRenderer: 'v4DTCommonFilterComponent'
  };

  /**
   * The API sends the display name as `accountName` while the column filters on
   * `sender_name`, so the renderer is pointed at the display field explicitly —
   * the filter it publishes still lands on this column's own floating filter,
   * which matches by header name.
   */
  colDefAccountName: IV4ColumnDef = {
    headerName: 'Account Name',
    minWidth: 160,
    field: 'sender_name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'searchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex items-center',
    cellRenderer: 'v4DTCommonFilterComponent',
    cellRendererParams: {
      filterField: 'accountName'
    },
    valueGetter: (params: { data: { accountName: string } }) =>
      params.data.accountName
  };

  /**
   * Masked down to the last four digits, so this cell gets no row-filter icon:
   * the value it would publish matches nothing on the server.
   */
  colDefAccountNumber: IV4ColumnDef = {
    headerName: 'Account Number',
    minWidth: 150,
    maxWidth: 200,
    field: 'sender_bank_account_number',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'searchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex items-center',
    valueGetter: (params: { data: { accountNumber: string } }) => {
      if (!params.data.accountNumber || params.data.accountNumber.length < 4) {
        return params.data.accountNumber;
      }
      const lastFour = params.data.accountNumber.slice(-4);
      const maskedPart = '*'.repeat(params.data.accountNumber.length - 4);
      return maskedPart + lastFour;
    }
  };

  /**
   * The cell shows the friendly label while the dropdown filters on the raw
   * code, so no row-filter icon here either — `v4DTCommonFilterComponent` reads
   * the raw field and would render `personalChecking`.
   */
  colDefAccountType: IV4ColumnDef = {
    headerName: 'Account Type',
    minWidth: 160,
    maxWidth: 220,
    field: 'sender_bank_account_type',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex items-center',
    valueGetter: (params: { data: { accountType: string } }) =>
      ACCOUNT_TYPE_LABELS[params.data.accountType] ?? params.data.accountType
  };

  colDefRoutingNumber: IV4ColumnDef = {
    headerName: 'Routing Number',
    minWidth: 150,
    maxWidth: 200,
    field: 'sender_bank_routing_number',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'searchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex items-center',
    cellRenderer: 'v4DTCommonFilterComponent',
    cellRendererParams: {
      filterField: 'routingNumber'
    },
    valueGetter: (params: { data: { routingNumber: string } }) =>
      params.data.routingNumber
  };

  // "ACH Return Reason Code" plus the sort indicator needs the full 200 — the
  // old 50 clipped its own header down to "ACH Ret…".
  colDefRejectionReason: IV4ColumnDef = {
    headerName: 'ACH Return Reason Code',
    minWidth: 200,
    field: 'ach_pull_return_reason_code',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'searchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex items-center',
    cellRenderer: 'v4DTCommonFilterComponent'
  };

  colDefDate: IV4ColumnDef = {
    headerName: 'Created Date',
    // Capped so the grid's leftover width flows to the text columns (Account
    // Name, Return Reason Code) instead of pooling as dead space before Status.
    minWidth: 175,
    maxWidth: 220,
    field: 'created_at',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'v4DateFloatingFilterComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponentParams: {
      tableId: DTTableId.prenoteAchTransaction
    },
    cellClass: 'flex items-center',
    cellRenderer: 'v4CreatedAtComponent',
    cellRendererParams: {
      inline: true
    }
  };

  /**
   * Status anchors the right edge — this grid has no Actions column, so it is
   * the only candidate.
   */
  colDefStatus: IV4ColumnDef = {
    headerName: 'Status',
    field: 'status',
    minWidth: 120,
    width: 150,
    maxWidth: 300,
    resizable: true,
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex items-center',
    cellRenderer: 'v4StatusComponent',
    cellRendererParams: {
      // 'custom' keeps the badge inert: the renderer's default 'payments' mode
      // gives it a pointer cursor and a paid-statement click that prenote rows
      // have no payment behind.
      statusMode: 'custom',
      isApplyTitleCase: true,
      statusMap: PRENOTE_STATUS_MAP
    },
    pinned: 'right',
    lockPosition: 'right',
    lockPinned: true,
    suppressMovable: true,
    valueGetter: (params: { data: { status: number } }): string =>
      PRENOTE_STATUS_MAP[params?.data?.status]?.status ?? ''
  };

  /** Set column fields. */
  columnDefs = [
    this.colDefId,
    this.colDefAccountName,
    this.colDefAccountNumber,
    this.colDefAccountType,
    this.colDefRoutingNumber,
    this.colDefRejectionReason,
    this.colDefDate,
    this.colDefStatus
  ] as ICoulmnDefFields[];
}

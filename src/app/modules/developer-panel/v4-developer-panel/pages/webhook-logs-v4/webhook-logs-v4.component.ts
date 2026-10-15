import { Component, inject, OnInit, signal } from '@angular/core';
import { Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import type {
  ColDef,
  ICellRendererParams,
  RowClickedEvent
} from '@ag-grid-community/core';
import { ICoulmnDefFields } from 'src/app/models/v3-datatable';
import { V4DataTableComponent } from 'src/app/modules/v4-data-table/components/v4-data-table/v4-data-table.component';
import { V4TextFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-text-floating-filter/v4-text-floating-filter.component';
import { V4DropdownFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-dropdown-floating-filter/v4-dropdown-floating-filter.component';
import { V4DateFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-date-floating-filter/v4-date-floating-filter.component';
import { V4PageHeaderComponent } from 'src/app/shared/V4/v4-page-header/v4-page-header.component';
import {
  V4StatusComponent,
  TV4StatusMap
} from 'src/app/shared/V4/v4-dt-cellrenders/v4-status/v4-status.component';
import {
  DataTableService,
  IDtSelectSingleIdSubject
} from 'src/app/shared/service/data-table/data-table.service';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { V4CreatedAtComponent } from 'src/app/modules/payments-v4/payments-out/components/v4-payments-table/cell-renderers/v4-created-at/v4-created-at.component';
import { WebhookLogViewButtonV4Component } from './webhook-log-view-button-v4/webhook-log-view-button-v4.component';
import { WebhookLogDrawerV4Component } from './webhook-log-drawer-v4/webhook-log-drawer-v4.component';

/**
 * v3's `ICoulmnDefFields` narrows `lockPosition` to boolean, so `'right'` will
 * not type-check against it. That model is frozen - widen locally instead.
 */
type IV4ColumnDef = Omit<ICoulmnDefFields, 'lockPosition'> & {
  lockPosition?: ColDef['lockPosition'];
};

@Component({
  selector: 'app-webhook-logs-v4',
  templateUrl: './webhook-logs-v4.component.html',
  styleUrls: ['./webhook-logs-v4.component.scss'],
  standalone: true,
  imports: [
    LucideAngularModule,
    FormsModule,
    V4DataTableComponent,
    V4PageHeaderComponent,
    WebhookLogDrawerV4Component
  ]
})
export class WebhookLogsV4Component implements OnInit {
  private location = inject(Location);
  private dataTableService = inject(DataTableService);
  private v3DataTableService = inject(V3DataTableService);

  readonly tableId = DTTableId.webhookLog;

  isPanelOpen = signal(false);
  selectedRow = signal<Record<string, unknown> | null>(null);
  selectedPayload = signal<unknown | null>(null);

  globalSearchValue: string | null = null;

  frameworkComponents = {
    SearchBoxComponent: V4TextFloatingFilterComponent,
    SelectBoxComponent: V4DropdownFloatingFilterComponent,
    selectDateComponent: V4DateFloatingFilterComponent,
    statusComponent: V4StatusComponent,
    v4CreatedAtComponent: V4CreatedAtComponent
  };

  /** Feeds the shared V4 status renderer instead of a hand-written span. */
  private readonly webhookStatusMap: TV4StatusMap = {
    pending: {
      status: 'Pending',
      bgColor: 'var(--v4-badge-warning-bg-color)',
      textColor: 'var(--v4-badge-warning-text-color)'
    },
    completed: {
      status: 'Completed',
      bgColor: 'var(--v4-badge-success-bg-color)',
      textColor: 'var(--v4-badge-success-text-color)'
    },
    failed: {
      status: 'Failed',
      bgColor: 'var(--v4-badge-error-bg-color)',
      textColor: 'var(--v4-badge-error-text-color)'
    }
  };

  floatingFilterComponent = {
    selectBox: [
      {
        id: 'status',
        values: [
          { value: 'pending', name: 'Pending' },
          { value: 'completed', name: 'Completed' },
          { value: 'failed', name: 'Failed' }
        ]
      }
    ]
  };

  // View pinned left (first - this grid has no checkbox column), Status pinned
  // right. The per-column pl-2.5 / pl-3 gutters are gone: they only existed to
  // fake a leading indent back when no column was pinned left.
  columnDefs: IV4ColumnDef[] = [
    {
      headerName: 'View',
      field: 'view',
      width: 50,
      minWidth: 50,
      maxWidth: 50,
      sortable: false,
      suppressFloatingFilterButton: true,
      suppressHeaderMenuButton: true,
      floatingFilter: false,
      cellClass: 'pl-1',
      pinned: 'left',
      lockPosition: true,
      lockPinned: true,
      suppressMovable: true,
      cellRenderer: WebhookLogViewButtonV4Component
    },
    {
      // A full UUID is 36 chars (~245px at 12px), so this needs real room.
      // Uncapped on purpose - it is one of the columns that absorbs slack.
      headerName: 'Event ID',
      field: 'uu_id',
      minWidth: 440,
      suppressFloatingFilterButton: true,
      floatingFilterComponent: 'SearchBoxComponent',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      suppressHeaderMenuButton: true
    },
    {
      headerName: 'Event Type',
      field: 'event_type',
      minWidth: 250,
      suppressFloatingFilterButton: true,
      floatingFilterComponent: 'SearchBoxComponent',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      suppressHeaderMenuButton: true,
      sortable: false
    },
    {
      headerName: 'Response Code',
      field: 'http_response_code',
      minWidth: 250,
      suppressFloatingFilterButton: true,
      floatingFilterComponent: 'SearchBoxComponent',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      suppressHeaderMenuButton: true,
      sortable: false,
      // Plain-string renderer, so it follows recurringStatusChip()'s shape:
      // the shared .status-badge class plus a --v4-badge-* pair.
      cellRenderer: (params: ICellRendererParams) => {
        const code = params.value;
        if (!code) return '';
        const num = Number(code);
        const ok = num >= 200 && num < 300;
        const bg = ok
          ? 'var(--v4-badge-success-bg-color)'
          : 'var(--v4-badge-error-bg-color)';
        const text = ok
          ? 'var(--v4-badge-success-text-color)'
          : 'var(--v4-badge-error-text-color)';
        return `<span class="status-badge" style="background-color:${bg};color:${text}">${code}</span>`;
      }
    },
    {
      // Last non-pinned column, so the grid's applyLastColumnFill() gives it
      // flex: 1 to close the gap before the right-pinned Status. Do NOT add a
      // maxWidth here - that caps the stretch and the empty band comes back.
      headerName: 'Created At',
      field: 'created_at',
      minWidth: 190,
      suppressFloatingFilterButton: true,
      filter: 'agDateColumnFilter',
      floatingFilterComponent: 'selectDateComponent',
      floatingFilter: true,
      suppressHeaderMenuButton: true,
      cellRenderer: 'v4CreatedAtComponent',
      cellRendererParams: {
        dateField: 'formated_created_at',
        splitOn: 'space'
      }
    },
    {
      // Status owns the right edge; there is no Actions column to compete.
      headerName: 'Status',
      field: 'status',
      minWidth: 120,
      width: 150,
      maxWidth: 300,
      resizable: true,
      pinned: 'right',
      lockPosition: 'right',
      lockPinned: true,
      suppressMovable: true,
      suppressFloatingFilterButton: true,
      floatingFilterComponent: 'SelectBoxComponent',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      suppressHeaderMenuButton: true,
      sortable: false,
      cellRenderer: 'statusComponent',
      cellRendererParams: {
        isClickable: true,
        statusMode: 'custom' as const,
        statusField: 'status',
        statusMap: this.webhookStatusMap,
        // No row-filter plumbing on this page, so don't offer the affordance.
        hideFilterButton: true
      }
    }
  ];

  /** The one place the widened alias meets the frozen v3 grid input. */
  readonly gridColumnDefs = this.columnDefs as unknown as ICoulmnDefFields[];

  readonly disabledColumns = ['view', 'uu_id', 'status'];

  ngOnInit(): void {
    this.v3DataTableService.resetV3DataTablePayload();
    this.dataTableService.setDataFromParent(
      undefined,
      this.floatingFilterComponent
    );
  }

  onViewLog(event: Partial<IDtSelectSingleIdSubject>): void {
    this.openDetailsForRow(event?.selectedRow);
  }

  onRowClicked(event: RowClickedEvent): void {
    this.openDetailsForRow(event.data as Record<string, unknown> | undefined);
  }

  private openDetailsForRow(
    row: Record<string, unknown> | null | undefined
  ): void {
    if (!row) return;

    let payload: unknown = row.data;
    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload);
      } catch {
        /* keep as-is */
      }
    }
    const parsed = payload as { event?: unknown } | null | undefined;
    const content = parsed?.event ?? payload ?? null;

    this.selectedRow.set(row);
    this.selectedPayload.set(content);
    this.isPanelOpen.set(true);
  }

  closePanel(): void {
    this.isPanelOpen.set(false);
    this.selectedRow.set(null);
    this.selectedPayload.set(null);
  }

  goBack(): void {
    this.location.back();
  }

  onGlobalSearch(event: KeyboardEvent): void {
    if (event.key !== 'Enter') return;

    if (!this.globalSearchValue) {
      this.v3DataTableService.updateV3DataTableByRemovingFilter = ['data'];
      return;
    }

    this.v3DataTableService.updateV3DataTable = {
      data: {
        filter: this.globalSearchValue,
        filterType: 'text',
        type: 'contains'
      }
    };
  }

  resetGlobalSearch(): void {
    this.globalSearchValue = null;
    this.v3DataTableService.updateV3DataTableByRemovingFilter = ['data'];
  }
}

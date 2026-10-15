import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { V4PageHeaderComponent } from 'src/app/shared/V4/v4-page-header/v4-page-header.component';
import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { ICellRendererParams } from '@ag-grid-community/core';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { V4DataTableComponent } from 'src/app/modules/v4-data-table/components/v4-data-table/v4-data-table.component';
import { V4SelectAllCheckBoxComponent } from 'src/app/modules/v4-data-table/components/v4-select-all-check-box/v4-select-all-check-box.component';
import { V4TextFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-text-floating-filter/v4-text-floating-filter.component';
import { V4DropdownFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-dropdown-floating-filter/v4-dropdown-floating-filter.component';
import { V4DateFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-date-floating-filter/v4-date-floating-filter.component';
import { V4DTCommonFilterComponent } from 'src/app/modules/payments-v4/payments-out/components/v4-payments-table/cell-renderers/v4-common-filter/v4-common-filter.component';
import { DtV4FileDownloadComponent } from 'src/app/modules/v4-positive-pay/components/dt-v4-positivepay-action/dt-v4-positivepay-action.component';

const STATUS_BADGE_MAP: Record<string, { bg: string; text: string; label: string }> = {
  Success:    { bg: 'var(--v4-badge-success-bg-color)',  text: 'var(--v4-badge-success-text-color)',  label: 'Success' },
  Failed:     { bg: 'var(--v4-badge-error-bg-color)',    text: 'var(--v4-badge-error-text-color)',    label: 'Failed' },
  processing: { bg: 'var(--v4-badge-warning-bg-color)',  text: 'var(--v4-badge-warning-text-color)',  label: 'Processing' }
};

@Component({
  selector: 'app-positive-pay-log-status',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="status-badge" [style.background]="badge.bg" [style.color]="badge.text">
      {{ badge.label }}
    </span>
  `
})
export class PositivePayLogStatusComponent implements ICellRendererAngularComp {
  badge = STATUS_BADGE_MAP['processing'];
  agInit(params: ICellRendererParams): void {
    this.badge = STATUS_BADGE_MAP[params.value] ?? STATUS_BADGE_MAP['processing'];
  }
  refresh(): boolean { return false; }
}

@Component({
  selector: 'app-v4-positive-pay-logs',
  templateUrl: './v4-positive-pay-logs.component.html',
  standalone: true,
  imports: [V4DataTableComponent, V4PageHeaderComponent]
})
export class V4PositivePayLogsComponent implements OnInit {
  private dataTableService = inject(DataTableService);
  private v3DataTableService = inject(V3DataTableService);
  private activatedRoute = inject(ActivatedRoute);

  public tableId = DTTableId.positivePayLogs;

  routingNumber: string | null;

  frameworkComponents = {
    headerCheckBoxComponent: V4SelectAllCheckBoxComponent,
    SearchBoxComponent: V4TextFloatingFilterComponent,
    DropdownComponent: V4DropdownFloatingFilterComponent,
    fileDownloadComponent: DtV4FileDownloadComponent,
    v4DateRangeComponent: V4DateFloatingFilterComponent,
    V4DTCommonFilterComponent,
    statusBadgeComponent: PositivePayLogStatusComponent
  };

  floatingFilterComponent = {
    selectBox: [
      {
        id: 'status',
        values: [
          { value: 'Success', name: 'Success' },
          { value: 'Failed', name: 'Failed' },
          { value: 'processing', name: 'Processing' }
        ]
      }
    ]
  };

  colDefDate = {
    headerName: 'Date',
    field: 'run_date',
    suppressFloatingFilterButton: true,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    lockPosition: true,
    resizable: true,
    sortable: false,
    minWidth: 150,
    flex: 1,
    floatingFilterComponent: 'v4DateRangeComponent',
    filter: 'agDateColumnFilter'
  };

  colDefBankName = {
    headerName: 'Bank Name',
    field: 'bank_name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    flex: 1,
    cellRenderer: 'V4DTCommonFilterComponent'
  };

  colDefRoutingNumber = {
    headerName: 'Bank Routing Number',
    field: 'routing_number',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    flex: 1,
    cellRenderer: 'V4DTCommonFilterComponent'
  };

  colDefFile = {
    headerName: 'File',
    field: 'download_link',
    suppressFloatingFilterButton: true,
    floatingFilter: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    suppressHeaderMenuButton: true,
    cellRenderer: 'fileDownloadComponent',
    sortable: false,
    flex: 1
  };

  colDefStatus = {
    headerName: 'Status',
    field: 'status',
    suppressFloatingFilterButton: true,
    minWidth: 120,
    width: 150,
    maxWidth: 300,
    floatingFilterComponent: 'DropdownComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    pinned: 'right' as const,
    lockPosition: 'right' as const,
    lockPinned: true,
    suppressMovable: true,
    cellRenderer: 'statusBadgeComponent'
  };

  columnDefs = [
    this.colDefDate,
    this.colDefBankName,
    this.colDefRoutingNumber,
    this.colDefFile,
    this.colDefStatus
  ];

  columnFields = [
    {
      id: 'run_date',
      name: 'Date',
      isDisabled: true,
      colDef: this.colDefDate,
      isChecked: true
    },
    {
      id: 'bank_name',
      name: 'Bank Name',
      isDisabled: true,
      colDef: this.colDefBankName,
      isChecked: true
    },
    {
      id: 'routing_number',
      name: 'Bank Routing Number',
      isDisabled: true,
      colDef: this.colDefRoutingNumber,
      isChecked: true
    },
    {
      id: 'download_link',
      name: 'File',
      isDisabled: true,
      colDef: this.colDefFile,
      isChecked: true
    },
    {
      id: 'status',
      name: 'Status',
      isDisabled: true,
      colDef: this.colDefStatus,
      isChecked: true
    }
  ];

  ngOnInit(): void {
    this.setRoutingNumber();
    this.dataTableService.setDataFromParent(
      this.columnFields,
      this.floatingFilterComponent
    );
    this.v3DataTableService.resetV3DataTablePayload();
    this.v3DataTableService.v3RowSelectionData = [];
    this.v3DataTableService.gridApi?.deselectAll();
  }

  setRoutingNumber(): void {
    this.routingNumber = this.activatedRoute.snapshot.paramMap.get('id');
    if (this.routingNumber !== null) {
      this.v3DataTableService.setRoutingNumber({
        routingNumber: this.routingNumber
      });
    }
  }
}

import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import {
  ColDef,
  ValueGetterParams,
  ICellRendererParams
} from '@ag-grid-community/core';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { V4DataTableComponent } from 'src/app/modules/v4-data-table/components/v4-data-table/v4-data-table.component';
import { V4TextFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-text-floating-filter/v4-text-floating-filter.component';
import { V4DropdownFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-dropdown-floating-filter/v4-dropdown-floating-filter.component';
import { V4DateFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-date-floating-filter/v4-date-floating-filter.component';
import { V4PageHeaderComponent } from 'src/app/shared/V4/v4-page-header/v4-page-header.component';
import { IV4HeaderAction } from 'src/app/shared/V4/v4-page-header/v4-page-header.model';
import { IMailBatchData } from '../../../models/group-mailing.model';
import { V4BatchStatusComponent } from './cell-renderers/v4-batch-status/v4-batch-status.component';
import { V4EditableBatchNameComponent } from './cell-renderers/v4-editable-batch-name/v4-editable-batch-name.component';
import { V4MultiCheckTableActionComponent } from './cell-renderers/v4-multi-check-table-action/v4-multi-check-table-action.component';
import { V4CreatedAtComponent } from 'src/app/modules/payments-v4/payments-out/components/v4-payments-table/cell-renderers/v4-created-at/v4-created-at.component';

@Component({
  selector: 'app-v4-multi-check-mail-table',
  templateUrl: './v4-multi-check-mail-table.component.html',
  styleUrls: ['./v4-multi-check-mail-table.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    V4DataTableComponent,
    V4PageHeaderComponent
  ]
})
export class V4MultiCheckMailTableComponent implements OnInit, OnDestroy {
  private v3DataTableService = inject(V3DataTableService);
  private dataTableService = inject(DataTableService);
  private router = inject(Router);

  tableId = DTTableId.mailingDashboardCheckBatches;
  deselectedColumns: string[] = [];

  batchStatusTypes = [
    { value: 3, name: 'New' },
    { value: 1, name: 'Processing' },
    { value: 2, name: 'Processed' }
  ];

  frameworkComponents = {
    SearchBoxComponent: V4TextFloatingFilterComponent,
    SelectBoxComponent: V4DropdownFloatingFilterComponent,
    v4DateRangeComponent: V4DateFloatingFilterComponent,
    v4CreatedAtComponent: V4CreatedAtComponent,
    actionComponent: V4MultiCheckTableActionComponent,
    EditableBatchNameCellRendererComponent: V4EditableBatchNameComponent,
    batchStatusComponent: V4BatchStatusComponent
  };

  configs = {
    selectBox: [
      {
        id: 'status',
        values: this.batchStatusTypes
      },
      {
        id: 'sent_to_customer_address',
        values: [
          { value: 1, name: 'Yes' },
          { value: 0, name: 'No' }
        ]
      }
    ],
    selectDate: [
      {
        id: 'created_at',
        initialRange: 'All Time'
      }
    ]
  };

  ngOnInit(): void {
    this.dataTableService.setDataFromParent(
      this.defaultColumnFields,
      this.configs,
      undefined
    );
    this.initializeV3DataTable();
  }

  private initializeV3DataTable(): void {
    this.v3DataTableService.defaultPayload = {
      startRow: 0,
      endRow: 50,
      rowGroupCols: [],
      valueCols: [],
      pivotCols: [],
      pivotMode: false,
      groupKeys: [],
      filterModel: {},
      sortModel: []
    };
    this.v3DataTableService.refreshV3DataTable();
  }

  // ==================== COLUMN DEFINITIONS ====================

  colDefBatchName: ColDef = {
    headerName: 'Batch Name',
    minWidth: 200,
    flex: 1,
    field: 'name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'EditableBatchNameCellRendererComponent',
    floatingFilterComponentParams: {
      tableName: 'multi_check_mail_table',
      tableId: this.tableId
    },
    valueGetter: (params: ValueGetterParams<IMailBatchData>) =>
      params.data?.name || ''
  };

  colDefTotalChecks: ColDef = {
    headerName: 'Total Checks',
    minWidth: 140,
    field: 'items_count',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agNumberColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    valueGetter: (params: ValueGetterParams<IMailBatchData>) =>
      params.data?.items_count?.toString() || '0'
  };

  colDefStatus: ColDef = {
    headerName: 'Status',
    minWidth: 120,
    width: 150,
    maxWidth: 300,
    field: 'status',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SelectBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    pinned: 'right' as const,
    lockPosition: 'right' as const,
    lockPinned: true,
    suppressMovable: true,
    floatingFilterComponentParams: {
      tableName: 'multi_check_mail_table',
      tableId: this.tableId
    },
    cellRenderer: 'batchStatusComponent'
  };

  colDefBundleCheck: ColDef = {
    headerName: 'Is Bundle Check',
    minWidth: 150,
    field: 'sent_to_customer_address',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SelectBoxComponent',
    filter: 'agSetColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponentParams: {
      tableName: 'multi_check_mail_table',
      tableId: this.tableId
    },
    cellRenderer: (params: ICellRendererParams<IMailBatchData>) =>
      params.data?.sent_to_customer_address === 1 ? 'Yes' : 'No'
  };

  colDefCreatedFor: ColDef = {
    headerName: 'Created For',
    minWidth: 160,
    field: 'created_for_name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    valueGetter: (params: ValueGetterParams<IMailBatchData>) =>
      params.data?.created_for_name || ''
  };

  colDefCreatedAt: ColDef = {
    headerName: 'Created At',
    minWidth: 180,
    field: 'created_at',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'v4DateRangeComponent',
    filter: 'agDateColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponentParams: {
      tableName: 'multi_check_mail_table',
      tableId: 112
    },
    cellRenderer: 'v4CreatedAtComponent'
  };

  colDefAction: ColDef = {
    headerName: 'Action',
    field: 'action',
    suppressFloatingFilterButton: true,
    minWidth: 60,
    maxWidth: 90,
    cellRenderer: 'actionComponent',
    sortable: false,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    pinned: 'left' as const,
    lockPosition: true
  };

  colDefBatchId: ColDef = {
    headerName: 'Batch ID',
    minWidth: 150,
    field: 'id',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    valueGetter: (params: ValueGetterParams<IMailBatchData>) =>
      params.data?.id || ''
  };

  defaultColumnFields = [
    {
      id: 'action',
      name: 'Action',
      isDisabled: false,
      colDef: this.colDefAction,
      isChecked: true
    },
    {
      id: 'batch_name',
      name: 'Batch Name',
      isDisabled: false,
      colDef: this.colDefBatchName,
      isChecked: true
    },
    {
      id: 'items_count',
      name: 'Total Checks',
      isDisabled: false,
      colDef: this.colDefTotalChecks,
      isChecked: true
    },
    {
      id: 'sent_to_customer_address',
      name: 'Is Bundle Check',
      isDisabled: false,
      colDef: this.colDefBundleCheck,
      isChecked: true
    },
    {
      id: 'created_for_name',
      name: 'Created For',
      isDisabled: false,
      colDef: this.colDefCreatedFor,
      isChecked: true
    },
    {
      id: 'created_at',
      name: 'Created At',
      isDisabled: false,
      colDef: this.colDefCreatedAt,
      isChecked: true
    },
    {
      id: 'id',
      name: 'Batch ID',
      isDisabled: false,
      colDef: this.colDefBatchId,
      isChecked: false
    },
    {
      id: 'status',
      name: 'Status',
      isDisabled: false,
      colDef: this.colDefStatus,
      isChecked: true
    }
  ];

  columnDefs = [
    this.colDefAction,
    this.colDefBatchName,
    this.colDefTotalChecks,
    this.colDefBundleCheck,
    this.colDefCreatedFor,
    this.colDefCreatedAt,
    this.colDefStatus
  ];

  // ==================== EVENT HANDLERS ====================

  headerActions: IV4HeaderAction[] = [{
    id: 'import_checks',
    text: 'Import Checks',
    lucideIcon: 'download'
  }];

  onHeaderAction(id: string | number): void {
    if (id === 'import_checks') this.navigateToImportChecks();
  }

  navigateToImportChecks(): void {
    this.router.navigate([
      '/v4/manage/business-tools/mail-dashboard/multi-check-mail1-step1'
    ]);
  }

  goBack(): void {
    this.router.navigate(['/v4/manage/business-tools/mail-dashboard/index']);
  }

  ngOnDestroy(): void {
    this.v3DataTableService.rowData = [];
  }
}

import { Component, OnDestroy, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import {
  ColDef,
  IRowNode,
  IsRowSelectable,
  ValueGetterParams,
  ICellRendererParams
} from '@ag-grid-community/core';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { V3DataTableSelectBoxComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-data-table-select-box/v3-data-table-select-box.component';
import { DtSearchBoxComponent } from 'src/app/modules/data-table/components/dt-search-box/dt-search-box.component';
import { V3DataTableComponent } from 'src/app/modules/v3-data-table/components/v3-data-table/v3-data-table.component';
import { V3DataTableModule } from 'src/app/modules/v3-data-table/v3-data-table.module';
import { DemoVideoComponent } from 'src/app/shared/components/demo-video/demo-video.component';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { DataRangeV35Component } from 'src/app/shared/components/date-range-v35/data-range-v35.component';
import { IV3DtHeaderElements } from 'src/app/modules/v3-data-table/models/v3-data-table';
import { faArrowDownToLine } from '@fortawesome/pro-solid-svg-icons';
import { MultiCheckTableActionComponent } from '../multi-check-mail-table-action/multi-check-table-action.component';
import { EditableBatchNameCellRendererComponent } from '../editable-batch-name-cell-renderer/editable-batch-name-cell-renderer.component';
import { IMailBatchData } from '../../models/group-mailing.model';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-multi-check-mail-table',
  templateUrl: './multi-check-mail-table.component.html',
  styleUrls: ['./multi-check-mail-table.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatTooltipModule,
    V3DataTableComponent,
    V3DataTableModule,
    DemoVideoComponent
  ],
  providers: []
})
export class MultiCheckMailTableComponent implements OnInit, OnDestroy {
  private v3DataTableService = inject(V3DataTableService);
  private dataTableService = inject(DataTableService);
  private router = inject(Router);

  tableId = DTTableId.mailingDashboardCheckBatches;
  deselectedColumns: string[] = [];
  loading = signal(false);
  selectedRows: IMailBatchData[] = [];

  env = environment;

  faArrowDownToLine = faArrowDownToLine;

  frameWorkComponents = {
    SearchBoxComponent: DtSearchBoxComponent,
    V3DataTableSelectBoxComponent,
    selectDateComponent: DataRangeV35Component,
    actionComponent: MultiCheckTableActionComponent,
    EditableBatchNameCellRendererComponent
  };

  isRowSelectable: IsRowSelectable = (_: IRowNode) => true;

  // Mail batch status types
  batchStatusTypes = [
    { value: 3, name: 'New' },
    { value: 1, name: 'Processing' },
    { value: 2, name: 'Processed' },
  ];

  configs = {
    selectBox: [
      {
        id: 'status',
        values: this.batchStatusTypes
      },
      {
        id:'sent_to_customer_address',
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

  public headerElements = computed<IV3DtHeaderElements>(() => ({
    buttons: [
      {
        text: 'Import Checks',
        id: 'import-checks',
        icon: this.faArrowDownToLine,
        type: { name: 'list', style: 'green' },
        backGroundInput: 'transparent',
        customClasses: 'font-semibold text-lg px-4 py-2',
        disableHoverEffect: false,
        isAddIcon: true
      }
    ]
  }));

  ngOnInit(): void {
    this.dataTableService.setDataFromParent(
      this.defaultColumnFields,
      this.configs,
      undefined
    );
    this.initializeV3DataTable();
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
      filterModel: {},
      sortModel: []
    };
    this.v3DataTableService.refreshV3DataTable();
  }

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

  colDefBatchName: ColDef = {
    headerName: 'Batch Name',
    minWidth: 200,
    field: 'name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'EditableBatchNameCellRendererComponent',
    floatingFilterComponentParams: { tableId: this.tableId },
    valueGetter: (params: ValueGetterParams<IMailBatchData>) =>
      params.data?.name || ''
  };

  colDefTotalChecks: ColDef = {
    headerName: 'Total Checks Count',
    minWidth: 160,
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
    field: 'status',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: V3DataTableSelectBoxComponent,
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponentParams: { tableName: 'multi_check_mail_table', tableId: 112 },
    cellRenderer: (params: ICellRendererParams<IMailBatchData>) => {
      if (this.loading()) {
        return `<div><span class="skelton">Loading...</span></div>`;
      }
      const status = this.batchStatusTypes.find(s => s.value === params.data?.status);
      return status ? status.name : 'Unknown';
    }
  };

  colDefBundleCheck: ColDef = {
    headerName: 'Is Bundle Check',
    minWidth: 150,
    field: 'sent_to_customer_address',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: V3DataTableSelectBoxComponent,
    filter: 'agSetColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: (params: ICellRendererParams<IMailBatchData>) => {
      if (this.loading()) {
        return `<div><span class="skelton">Loading...</span></div>`;
      }
      return params.data?.sent_to_customer_address === 1 ? 'Yes' : 'No';
    }
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
    floatingFilterComponent: 'selectDateComponent',
    filter: 'agDateColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponentParams: { tableName: 'multi_check_mail_table', tableId: 112 },
    valueGetter: (params: ValueGetterParams<IMailBatchData>) =>
      params.data?.created_at || ''
  };


  colDefAction: ColDef = {
    headerName: 'Action',
    field: 'action',
    suppressFloatingFilterButton: true,
    minWidth: 60,
    maxWidth: 120,
    cellRenderer: 'actionComponent',
    sortable: false,
    suppressHeaderMenuButton: true
  };

  defaultColumnFields = [
    {
      id: 'batch_name',
      name: 'Batch Name',
      isDisabled: false,
      colDef: this.colDefBatchName,
      isChecked: true
    },
    {
      id: 'items_count',
      name: 'Total Checks Count',
      isDisabled: false,
      colDef: this.colDefTotalChecks,
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
      id: 'action',
      name: 'Action',
      isDisabled: false,
      colDef: this.colDefAction,
      isChecked: true
    },
    {
      id: 'id',
      name: 'Batch ID',
      isDisabled: false,
      colDef: this.colDefBatchId,
      isChecked: false
    },
  ];

  columnDefs = [
    this.colDefBatchId,
    this.colDefTotalChecks,
    this.colDefStatus,
    this.colDefBundleCheck,
    this.colDefCreatedFor,
    this.colDefCreatedAt,
    this.colDefAction
  ];

  // Event Handlers
  headerButtonClick(event: { id: string }): void {
    switch (event.id) {
      case 'import-checks':
        this.navigateToImportChecks();
        break;
      default:
        break;
    }
  }

  navigateToImportChecks(): void {
    this.router.navigate(['manage/business-tools/mail-dashboard/multi-check-mail1-step1']);
  }

  ngOnDestroy(): void {
    this.v3DataTableService.rowData = [];
  }
}
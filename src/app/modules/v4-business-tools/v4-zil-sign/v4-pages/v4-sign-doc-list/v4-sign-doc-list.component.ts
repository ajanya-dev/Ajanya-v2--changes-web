import {
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { ColDef, ValueGetterParams } from '@ag-grid-community/core';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { V4DataTableComponent } from 'src/app/modules/v4-data-table/components/v4-data-table/v4-data-table.component';
import { V4TextFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-text-floating-filter/v4-text-floating-filter.component';
import { V4DropdownFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-dropdown-floating-filter/v4-dropdown-floating-filter.component';
import { V4DateFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-date-floating-filter/v4-date-floating-filter.component';
import { V4PageHeaderComponent } from 'src/app/shared/V4/v4-page-header/v4-page-header.component';
import { IV4HeaderAction } from 'src/app/shared/V4/v4-page-header/v4-page-header.model';
import { environment } from 'src/environments/environment';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { V4ZilSignStatusBadgeComponent } from '../../v4-components/v4-zil-sign-status-badge/v4-zil-sign-status-badge.component';
import { V4ZilSignActionComponent } from '../../v4-components/v4-zil-sign-action/v4-zil-sign-action.component';
import { V4SignDocDetailPanelComponent } from '../../v4-components/v4-sign-doc-detail-panel/v4-sign-doc-detail-panel.component';

interface IZilSignRow {
  uuid: string;
  name: string;
  created_at: string;
  status: string;
}

@Component({
  selector: 'app-v4-sign-doc-list',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    MatTooltipModule,
    V4DataTableComponent,
    V4PageHeaderComponent,
    V4SignDocDetailPanelComponent
  ],
  templateUrl: './v4-sign-doc-list.component.html',
  styleUrls: ['./v4-sign-doc-list.component.scss']
})
export class V4SignDocListComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private v3DataTableService = inject(V3DataTableService);
  private dataTableService = inject(DataTableService);
  private headerService = inject(HeaderService);

  tableId = DTTableId.zilSign;
  deselectedColumns: string[] = [];

  videoSlug = signal<string>(
    environment.env_id === 'zilMoney' ? 'zil_sign_zm' : 'zil_sign_ocw'
  );

  showTutorial = computed(() => !!this.videoSlug());

  readonly headerActions: IV4HeaderAction[] = [
    {
      id: 'request_signature',
      text: 'Request Signature',
      style: 'primary',
      isAddIcon: true,
      icon: ['fas', 'plus'],
      toolTip: 'Request Signature'
    }
  ];

  onHeaderAction(id: string | number): void {
    if (id === 'request_signature') this.goToRequestSignature();
  }

  frameworkComponents = {
    SearchBoxComponent: V4TextFloatingFilterComponent,
    SelectBoxComponent: V4DropdownFloatingFilterComponent,
    selectDateComponent: V4DateFloatingFilterComponent,
    statusBadgeComponent: V4ZilSignStatusBadgeComponent,
    actionComponent: V4ZilSignActionComponent
  };

  configs = {
    selectBox: [
      {
        id: 'status',
        values: [
          { value: 'pending', name: 'Pending' },
          { value: 'in_progress', name: 'In progress' },
          { value: 'signed', name: 'Signed' },
          { value: 'cancelled', name: 'Cancelled' }
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

  colDefName: ColDef = {
    headerName: 'Document Name',
    minWidth: 240,
    field: 'name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponentParams: {
      tableName: 'zil_sign_table',
      tableId: this.tableId
    },
    valueGetter: (params: ValueGetterParams<IZilSignRow>) =>
      params.data?.name || ''
  };

  // Same minWidth as Document Name and no maxWidth, so with freeColumnResize
  // disabled both carry defaultColDef's flex: 1 and split the available width
  // evenly. Adding a maxWidth here breaks that - the other column takes the
  // remainder and the two stop matching.
  colDefCreatedAt: ColDef = {
    headerName: 'Created At',
    minWidth: 240,
    field: 'created_at',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectDateComponent',
    filter: 'agDateColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponentParams: {
      tableName: 'zil_sign_table',
      tableId: this.tableId
    },
    valueGetter: (params: ValueGetterParams<IZilSignRow>) =>
      params.data?.created_at
        ? new Date(params.data.created_at).toLocaleDateString()
        : ''
  };

  // Status owns the right edge; the icon cluster is a View column, not an
  // Actions column, so it does not compete for that slot.
  colDefStatus: ColDef = {
    headerName: 'Status',
    minWidth: 120,
    width: 150,
    maxWidth: 300,
    resizable: true,
    pinned: 'right',
    lockPosition: 'right',
    lockPinned: true,
    suppressMovable: true,
    field: 'status',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SelectBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponentParams: {
      tableName: 'zil_sign_table',
      tableId: this.tableId
    },
    cellRenderer: 'statusBadgeComponent'
  };

  // Kebab + eye = a View column. Pinned left, first (no checkbox column),
  // and never subject to the right-edge rule.
  colDefView: ColDef = {
    headerName: 'View',
    field: 'action',
    suppressFloatingFilterButton: true,
    floatingFilter: false,
    width: 90,
    minWidth: 90,
    maxWidth: 90,
    cellRenderer: 'actionComponent',
    cellClass: 'pl-1',
    sortable: false,
    suppressHeaderMenuButton: true,
    pinned: 'left',
    lockPosition: true,
    lockPinned: true,
    suppressMovable: true
  };

  defaultColumnFields = [
    {
      id: 'action',
      name: 'View',
      isDisabled: true,
      colDef: this.colDefView,
      isChecked: true
    },
    {
      id: 'name',
      name: 'Document Name',
      isDisabled: true,
      colDef: this.colDefName,
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
      id: 'status',
      name: 'Status',
      isDisabled: false,
      colDef: this.colDefStatus,
      isChecked: true
    },
  ];

  columnDefs = [
    this.colDefView,
    this.colDefName,
    this.colDefCreatedAt,
    this.colDefStatus
  ];

  ngOnInit(): void {
    this.headerService.isSubHeaderVisible.next({
      hidden: true,
      animation: false
    });
    this.dataTableService.setDataFromParent(
      this.defaultColumnFields,
      this.configs,
      undefined
    );
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

  ngOnDestroy(): void {
    this.v3DataTableService.rowData = [];
  }

  goToRequestSignature(): void {
    this.router.navigate([
      '/v4/manage/v4-business-tools/zil-sign/request-sign'
    ]);
  }

  goBack(): void {
    this.router.navigate(['/v4/manage/v4-business-tools/more']);
  }
}

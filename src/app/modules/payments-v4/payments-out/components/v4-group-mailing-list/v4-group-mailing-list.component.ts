import { Component, Input, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IRowNode,
  IsRowSelectable,
  ValueGetterParams,
  ICellRendererParams
} from '@ag-grid-community/core';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { V4DataTableComponent } from 'src/app/modules/v4-data-table/components/v4-data-table/v4-data-table.component';
import { V4PageHeaderComponent } from 'src/app/shared/V4/v4-page-header/v4-page-header.component';
import { V4TextFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-text-floating-filter/v4-text-floating-filter.component';
import { V4DropdownFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-dropdown-floating-filter/v4-dropdown-floating-filter.component';
import { V4DateFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-date-floating-filter/v4-date-floating-filter.component';
import {
  IGroupMailingRecord,
  GroupMailingStatus,
  GroupMailingType
} from 'src/app/modules/business-tools/mailing-dashboard/models/group-mailing.model';
import { V4UpdatedAtComponent } from '../v4-payments-table/cell-renderers/v4-updated-at/v4-updated-at.component';
import { V4EditablePayeeNameCellRendererComponent } from './v4-editable-payee-name-cell-renderer.component';
import { V4GroupMailingTableActionComponent } from './v4-group-mailing-table-action.component';
import { V4GroupMailingPanelService } from './v4-group-mailing-panel.service';
import { V4GroupMailingDetailPanelComponent } from './v4-group-mailing-detail-panel.component';
import { V4GroupMailingStatusBadgeComponent } from './v4-group-mailing-status-badge.component';

@Component({
  selector: 'app-v4-group-mailing-list',
  templateUrl: './v4-group-mailing-list.component.html',
  styleUrls: ['./v4-group-mailing-list.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    V4DataTableComponent,
    V4GroupMailingDetailPanelComponent,
    V4PageHeaderComponent
  ]
})
export class V4GroupMailingListComponent implements OnInit, OnDestroy {
  private v3DataTableService = inject(V3DataTableService);
  private dataTableService = inject(DataTableService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private panelService = inject(V4GroupMailingPanelService);

  /**
   * Hosted inside another page (payments-out check tab) instead of being routed to
   * on its own. Drops the page chrome (back button + title) and the full-height shell
   * so the table sits in the host layout.
   */
  @Input() embedded = false;

  tableId = DTTableId.businessToolsGroupMailing;

  frameworkComponents = {
    searchBoxComponent: V4TextFloatingFilterComponent,
    selectBoxComponent: V4DropdownFloatingFilterComponent,
    selectDateComponent: V4DateFloatingFilterComponent,
    actionComponent: V4GroupMailingTableActionComponent,
    statusBadgeComponent: V4GroupMailingStatusBadgeComponent,
    v4UpdatedAtComponent: V4UpdatedAtComponent,
    V4EditablePayeeNameCellRendererComponent
  };

  isRowSelectable: IsRowSelectable = (_: IRowNode) => false;

  loading = false;

  shippingTypes = [
    { name: 'First Class 1.25', value: 1 },
    { name: 'First Class with Tracking 6.99', value: 3 },
    { name: 'Priority Mail USPS 11.99', value: 4 },
    { name: 'Express Mail USPS 34.99', value: 5 },
    { name: 'Overnight (FedEx/UPS) 24.99', value: 12 },
    { name: 'First Class Canada 3.99', value: 14 },
    { name: 'FedEx Overnight (Canada) 24.99', value: 16 },
    { name: 'First Class With Tracking (international) 4.99', value: 17 },
    { name: 'FedEx Overnight (International) 57.00', value: 18 }
  ];

  statusTypes = [
    { value: GroupMailingStatus.NEW, name: 'New' },
    { value: GroupMailingStatus.MAILED, name: 'Mailed' },
    { value: GroupMailingStatus.CANCELLED, name: 'Cancelled' },
    { value: GroupMailingStatus.PENDING, name: 'Pending' },
    { value: GroupMailingStatus.FAILED, name: 'Failed' }
  ];

  envelopeTypes = [
    { value: GroupMailingType.BULK, name: 'Bulk' },
    { value: GroupMailingType.INDIVIDUAL, name: 'Individual' }
  ];

  configs = {
    selectBox: [
      {
        id: 'check_mailing_groups.status',
        values: this.statusTypes
      },
      {
        id: 'check_mailing_groups.shipping_type',
        values: this.shippingTypes
      },
      {
        id: 'check_mailing_groups.is_individual_envelope',
        values: this.envelopeTypes
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

  colDefName = {
    headerName: 'ID',
    minWidth: 200,
    flex: 1.2,
    field: 'check_mailing_groups.name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'searchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'V4EditablePayeeNameCellRendererComponent',
    cellStyle: { padding: '0 12px' },
    valueGetter: (params: ValueGetterParams<IGroupMailingRecord>) =>
      params.data?.name || ''
  };

  colDefShippingType = {
    headerName: 'Shipping Type',
    minWidth: 200,
    maxWidth: 320,
    flex: 1,
    field: 'check_mailing_groups.shipping_type',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    tooltipField: 'shipment_name',
    valueGetter: (params: ValueGetterParams<IGroupMailingRecord>) =>
      this.shippingTypes.find((val) => val.value === params.data?.shipping_type)
        ?.name || params.data?.shipment_name
  };

  colDefCreatedDate = {
    headerName: 'Created Date',
    minWidth: 140,
    maxWidth: 165,
    field: 'check_mailing_groups.created_at',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectDateComponent',
    filter: 'agDateColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponentParams: {
      tableName: 'group_mailing_list',
      tableId: this.tableId
    },
    // Same stacked date-over-time cell the payments tables use.
    cellRenderer: 'v4UpdatedAtComponent',
    valueGetter: (params: ValueGetterParams<IGroupMailingRecord>) =>
      params.data?.created_at || ''
  };

  colDefSentBy = {
    headerName: 'Sent By',
    minWidth: 160,
    flex: 1,
    field: 'created_for_name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'searchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    tooltipField: 'created_for_name'
  };

  colDefCost = {
    headerName: 'Cost',
    minWidth: 110,
    maxWidth: 130,
    field: 'check_mailing_groups.total_cost',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'searchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'v4-amount-col',
    headerClass: 'v4-amount-col v4-header-medium',
    cellRenderer: (params: ICellRendererParams<IGroupMailingRecord>) =>
      params.data?.total_cost ? `$${params.data.total_cost}` : ''
  };

  colDefStatus = {
    headerName: 'Status',
    minWidth: 140,
    maxWidth: 165,
    pinned: 'right' as const,
    lockPosition: 'right',
    lockPinned: true,
    suppressMovable: true,
    field: 'check_mailing_groups.status',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'statusBadgeComponent',
    valueGetter: (params: ValueGetterParams<IGroupMailingRecord>) =>
      this.getStatusText(params.data?.status ?? -1)
  };

  colDefType = {
    headerName: 'Type',
    minWidth: 110,
    maxWidth: 135,
    field: 'check_mailing_groups.is_individual_envelope',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    sortable: true,
    resizable: true,
    hide: false,
    cellRenderer: (params: ICellRendererParams<IGroupMailingRecord>) => {
      if (this.loading) {
        return `<div><span class="skelton">Loading ...</span></div>`;
      }
      return params.data?.is_individual_envelope === GroupMailingType.INDIVIDUAL
        ? 'Individual'
        : 'Bulk';
    }
  };

  colDefAction = {
    headerName: 'Action',
    minWidth: 50,
    maxWidth: 100,
    field: 'action',
    pinned: 'left' as const,
    lockPosition: true,
    suppressMovable: true,
    resizable: false,
    suppressFloatingFilterButton: true,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'actionComponent',
    sortable: false
  };

  defaultColumnFields = [
    {
      id: 'action',
      name: 'Actions',
      isDisabled: true,
      colDef: this.colDefAction,
      isChecked: true
    },
    {
      id: 'name',
      name: 'ID',
      isDisabled: true,
      colDef: this.colDefName,
      isChecked: true
    },
    {
      id: 'shipping_type',
      name: 'Shipping Type',
      isDisabled: true,
      colDef: this.colDefShippingType,
      isChecked: true
    },
    {
      id: 'created_for_name',
      name: 'Sent By',
      isDisabled: false,
      colDef: this.colDefSentBy,
      isChecked: true
    },
    {
      id: 'total_cost',
      name: 'Cost',
      isDisabled: true,
      colDef: this.colDefCost,
      isChecked: true
    },
    {
      id: 'created_at',
      name: 'Created Date',
      isDisabled: true,
      colDef: this.colDefCreatedDate,
      isChecked: true
    },
    {
      id: 'is_individual_envelope',
      name: 'Type',
      isDisabled: false,
      colDef: this.colDefType,
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

  columnDefs = [
    this.colDefAction,
    this.colDefName,
    this.colDefShippingType,
    this.colDefSentBy,
    this.colDefCost,
    this.colDefCreatedDate,
    this.colDefType,
    this.colDefStatus
  ];

  goBack(): void {
    const from = this.route.snapshot.queryParamMap.get('from');
    if (from === 'bulk-mail') {
      this.router.navigate([
        '/v4/manage/business-tools/mail-dashboard/bulk-mail'
      ]);
      return;
    }
    if (from === 'mail-dashboard') {
      this.router.navigate(['/v4/manage/business-tools/mail-dashboard']);
      return;
    }
    this.router.navigate(['/v4/manage/payments-out/detailed/check']);
  }

  getStatusText(status: number): string {
    switch (status) {
      case GroupMailingStatus.NEW:
        return 'New';
      case GroupMailingStatus.MAILED:
        return 'Mailed';
      case GroupMailingStatus.CANCELLED:
        return 'Cancelled';
      case GroupMailingStatus.PENDING:
        return 'Pending';
      case GroupMailingStatus.FAILED:
        return 'Failed';
      case -1:
        return 'Not Available';
      default:
        return 'Unknown';
    }
  }

  ngOnDestroy(): void {
    this.v3DataTableService.rowData = [];
    // The panel state is app-scoped: leave it closed so it does not re-open by
    // itself the next time this list is shown.
    this.panelService.close();
  }
}

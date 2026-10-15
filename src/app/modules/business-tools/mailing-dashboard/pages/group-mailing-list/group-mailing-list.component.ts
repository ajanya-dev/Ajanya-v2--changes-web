import { Component, Input, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
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
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { DataRangeV35Component } from 'src/app/shared/components/date-range-v35/data-range-v35.component';
import { OcwBackButtonComponent } from 'src/app/shared/components/ocw-back-button/ocw-back-button.component';
import { GroupMailingTableActionComponent } from '../../components/group-mailing-table-action/group-mailing-table-action.component';
import { EditablePayeeNameCellRendererComponent } from '../../components/editable-payee-name-cell-renderer/editable-payee-name-cell-renderer.component';
import {
  IGroupMailingRecord,
  GroupMailingStatus,
  GroupMailingType
} from '../../models/group-mailing.model';

@Component({
  selector: 'app-group-mailing-list',
  templateUrl: './group-mailing-list.component.html',
  styleUrls: ['./group-mailing-list.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatTooltipModule,
    V3DataTableComponent,
    V3DataTableModule,
    OcwBackButtonComponent
  ],
  providers: []
})
export class GroupMailingListComponent implements OnInit, OnDestroy {
  private v3DataTableService = inject(V3DataTableService);
  private dataTableService = inject(DataTableService);

  /**
   * Hosted inside another page (the payments-out check list tab) instead of being
   * routed to on its own. Drops the page chrome (back button + title) and the
   * full-height shell so the table sits in the host layout.
   */
  @Input() embedded = false;

  tableId = DTTableId.businessToolsGroupMailing;
  tableTitle = 'Group Mailing';
  deselectedColumns: string[] = []; // Ensure no columns are deselected
  backUrl: string = history.state.backUrl || '/manage/business-tools/mail-dashboard/index';

  frameWorkComponents = {
    SearchBoxComponent: DtSearchBoxComponent,
    actionComponent: GroupMailingTableActionComponent,
    V3DataTableSelectBoxComponent,
    EditablePayeeNameCellRendererComponent,
    selectDateComponent: DataRangeV35Component
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
    { name: 'First Class WIth Tracking (international) 4.99', value: 17 },
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
    // Trigger data table refresh after setting the payload
    this.v3DataTableService.refreshV3DataTable();
  }

  colDefName = {
    headerName: 'ID',
    minWidth: 150,
    field: 'check_mailing_groups.name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'EditablePayeeNameCellRendererComponent',
    cellStyle: { padding: '0' },
    valueGetter: (params: ValueGetterParams<IGroupMailingRecord>) =>
      params.data?.name || ''
  };

  colDefShippingType = {
    headerName: 'Shipping Type',
    minWidth: 180,
    field: 'check_mailing_groups.shipping_type',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: V3DataTableSelectBoxComponent,
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    valueGetter: (params: ValueGetterParams<IGroupMailingRecord>) =>
      this.shippingTypes.find((val) => val.value === params.data?.shipping_type)
        ?.name || params.data?.shipment_name
  };

  colDefCreatedDate = {
    headerName: 'Created Date',
    minWidth: 120,
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
    valueGetter: (params: ValueGetterParams<IGroupMailingRecord>) =>
      params.data?.created_at || ''
  };

  colDefSentBy = {
    headerName: 'Sent By',
    minWidth: 120,
    field: 'created_for_name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefCost = {
    headerName: 'Cost',
    minWidth: 100,
    field: 'check_mailing_groups.total_cost',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: (params: ICellRendererParams<IGroupMailingRecord>) => params.data?.total_cost ? `$${params.data.total_cost}` : ''
  };

  colDefStatus: ColDef = {
    headerName: 'Status',
    minWidth: 120,
    field: 'check_mailing_groups.status',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: V3DataTableSelectBoxComponent,
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    valueGetter: (params: ValueGetterParams<IGroupMailingRecord>) =>
      this.getStatusText(params.data?.status ?? -1)
  };

  colDefType: ColDef = {
    headerName: 'Type',
    minWidth: 100,
    field: 'check_mailing_groups.is_individual_envelope',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: V3DataTableSelectBoxComponent,
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    sortable: true,
    resizable: true,
    hide: false,
    cellRenderer: (params: ICellRendererParams<IGroupMailingRecord>) => {
      if (this.loading) {
        return `<div> <span class="skelton">Loading ...</span> </div>`;
      }
      return params.data?.is_individual_envelope === GroupMailingType.INDIVIDUAL
        ? 'Individual'
        : 'Bulk';
    }
  };

  colDefAction: ColDef = {
    headerName: 'Action',
    maxWidth: 100,
    field: 'action',
    suppressFloatingFilterButton: true,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'actionComponent',
    sortable: false
  };

  defaultColumnFields = [
    {
      id: 'name',
      name: 'ID',
      isDisabled: true,
      colDef: this.colDefName,
      isChecked: true
    },
    {
      id: 'status',
      name: 'Status',
      isDisabled: true,
      colDef: this.colDefStatus,
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
      id: 'action',
      name: 'Actions',
      isDisabled: true,
      colDef: this.colDefAction,
      isChecked: true
    }
  ];

  columnDefs = [
    this.colDefName,
    this.colDefStatus,
    this.colDefShippingType,
    this.colDefSentBy,
    this.colDefCost,
    this.colDefCreatedDate,
    this.colDefType,
    this.colDefAction
  ];


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
  }
}

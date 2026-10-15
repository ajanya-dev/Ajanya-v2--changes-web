import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ICoulmnDefFields } from 'src/app/models/v3-datatable';
import { DtSearchBoxComponent } from 'src/app/modules/data-table/components/dt-search-box/dt-search-box.component';
import { V3DataTableModule } from 'src/app/modules/v3-data-table/v3-data-table.module';
import { DataRangeV35Component } from 'src/app/shared/components/date-range-v35/data-range-v35.component';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { V3DataTableSelectBoxComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-data-table-select-box/v3-data-table-select-box.component';
import { V3StatusComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-status/v3-status.component';
import { V3ViewButtonComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-view-button/v3-view-button.component';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { DataTableModule } from 'src/app/modules/data-table/data-table.module';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';

@Component({
  selector: 'app-manual-ach-request-data-table',
  standalone: true,
  imports: [CommonModule, V3DataTableModule, DataTableModule],
  templateUrl: './manual-ach-request-data-table.component.html',
  styleUrl: './manual-ach-request-data-table.component.scss'
})
export class ManualAchRequestDataTableComponent implements OnInit {
  private dataTableService = inject(DataTableService);
  private v3DataTableService = inject(V3DataTableService);

  public tableId = DTTableId.manualAchTransferRequest;

  frameworkComponents = {
    selectBoxComponent: V3DataTableSelectBoxComponent,
    SearchBoxComponent: DtSearchBoxComponent,
    dateRangeV35Component: DataRangeV35Component,
    v3ViewButtonComponent: V3ViewButtonComponent,
    v3StatusComponent: V3StatusComponent
  };

  floatingFilterComponent = {
    selectBox: [
      {
        id: 'banking_ach_transfer_requests.status',
        values: [
          { value: '0', name: 'Pending' },
          { value: '1', name: 'Processing' },
          { value: '2', name: 'Completed' },
          { value: '3', name: 'Canceled' },
          { value: '4', name: 'Failed' },
          { value: '5', name: 'Returned' }
        ]
      }
    ]
  };

  ngOnInit(): void {
    this.dataTableService.setDataFromParent(
      undefined,
      this.floatingFilterComponent
    );
    this.v3DataTableService.resetV3DataTablePayload();
    this.v3DataTableService.refreshV3DataTable();
  }

  /** Table columns */
  colDefRefId = {
    headerName: 'ID',
    minWidth: 50,
    maxWidth: 80,
    field: 'banking_ach_transfer_requests.id',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center pl-2.5',
    headerClass: 'pl-3',
    cellRenderer: (params: { data: { id: string } }) => params.data.id
  };

  colDefReqId = {
    headerName: 'Req ID',
    minWidth: 280,
    maxWidth: 300,
    field: 'banking_ach_transfer_requests.uu_id',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center pl-2.5',
    headerClass: 'pl-3',
    cellRenderer: (params: { data: { uu_id: string } }) => params.data.uu_id
  };

  colDefAmount = {
    headerName: 'Amount',
    minWidth: 90,
    maxWidth: 120,
    field: 'banking_ach_transfer_requests.amount',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center items-end pr-3',
    cellRenderer: (params: { data: { amount: string } }) => `$${params.data.amount}`
  };

  colDefDate = {
    headerName: 'Date',
    minWidth: 90,
    field: 'banking_ach_transfer_requests.created_at',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'dateRangeV35Component',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,

    cellRenderer: (params: { data: { created_at: string } }) =>
      params.data.created_at
  };

  colDefReasonCode = {
    headerName: 'Return Code',

    minWidth: 100,
    field: 'banking_ach_transfer_requests.ach_pull_return_reason_code',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center',
    cellRenderer: (params: { data: { ach_pull_return_reason_code: string } }) =>
      params.data.ach_pull_return_reason_code
  };

  colDefReasonDesc = {
    headerName: 'Return Description',
    minWidth: window.innerWidth <= 1500 ? 100 : 200,
    maxWidth: 300,
    field: 'banking_ach_transfer_requests.ach_pull_return_reason_description',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center pl-[20px]',
    cellRenderer: (params: {
      data: { ach_pull_return_reason_description: string };
    }) => params.data.ach_pull_return_reason_description
  };

  colDefDescription = {
    headerName: 'Description',
    minWidth: window.innerWidth <= 1500 ? 100 : 200,
    maxWidth: 300,
    field: 'banking_ach_transfer_requests.description',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center',
    cellRenderer: (params: { data: { description: string } }) =>
      params.data.description
  };

  colDefCustomer = {
    headerName: 'Custom ID',
    minWidth: 200,
    maxWidth: 220,
    field: 'banking_ach_transfer_requests.customer_reference_number',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center',
    cellRenderer: (params: { data: { customer_reference_number: string } }) =>
      params.data.customer_reference_number
  };

  colDefWalletTxn = {
    headerName: 'Wallet Txn Ref',
    minWidth: 150,
    maxWidth: 220,
    field: 'uwrt_id',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center'
  };

  colDefStatus = {
    headerName: 'Status',
    minWidth: 100,
    field: 'banking_ach_transfer_requests.status',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'v3StatusComponent',
    cellClass: 'flex flex-col justify-center',
    cellRendererParams: {
      isStatementDisable: true
    }
  };

  colDefViewButton: ICoulmnDefFields = {
    headerName: 'View',
    field: 'view',
    suppressFloatingFilterButton: true,
    minWidth: 50,
    sortable: false,
    cellRenderer: 'v3ViewButtonComponent',
    cellRendererParams: {
      viewButtonType: 1,

      tableId: 87,
      hideMenuOption: true,
      disableToolTip: true
    },
    suppressHeaderMenuButton: true
  };

  /** Set column feilds. */
  columnDefs = [
    this.colDefRefId,
    this.colDefReqId,
    this.colDefAmount,
    this.colDefDescription,
    this.colDefDate,
    this.colDefReasonCode,
    this.colDefReasonDesc,
    this.colDefCustomer,
    this.colDefWalletTxn,
    this.colDefStatus,
    this.colDefViewButton
  ];
}

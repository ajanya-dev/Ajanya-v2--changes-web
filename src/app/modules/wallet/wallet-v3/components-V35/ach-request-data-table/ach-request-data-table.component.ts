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
  selector: 'app-ach-request-data-table',
  standalone: true,
  imports: [CommonModule, V3DataTableModule, DataTableModule],
  templateUrl: './ach-request-data-table.component.html',
  styleUrl: './ach-request-data-table.component.scss'
})
export class AchRequestDataTableComponent implements OnInit {
  private dataTableService = inject(DataTableService);
  private v3DataTableService = inject(V3DataTableService);

  public tableId = DTTableId.bankingAchTransferRequest;

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
        id: 'status',
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
  }

  /** Table columns */
  colDefRefId = {
    headerName: 'ID',
    minWidth: 20,
    maxWidth: 80,
    field: 'id',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center pl-2.5',
    headerClass: 'pl-3'
  };

  colDefReqId = {
    headerName: 'Req ID',
    minWidth: 280,
    maxWidth: 300,
    field: 'uu_id',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center pl-2.5',
    headerClass: 'pl-3'
  };

  colDefAmount = {
    headerName: 'Amount',
    minWidth: 80,
    maxWidth: 100,
    field: 'amount',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center pl-2.5'
  };

  colDefDate = {
    headerName: 'Date',
    minWidth: 90,
    field: 'created_at',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'dateRangeV35Component',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
  };

  colDefReasonCode = {
    headerName: 'Return Code',
    minWidth: 100,
    field: 'ach_pull_return_reason_code',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center'
  };

  colDefReasonDesc = {
    headerName: 'Return Description',
    minWidth: 300,
    field: 'ach_pull_return_reason_description',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center pl-[20px]'
  };

  colDefDescription = {
    headerName: 'Description',
    minWidth: window.innerWidth <= 1500 ? 100 : 280,
    maxWidth: 300,
    field: 'description',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center'
  };

  colDefCustomer = {
    headerName: 'Custom ID',
    minWidth: 200,
    maxWidth: 220,
    field: 'customer_reference_number',
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
    field: 'status',
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

      tableId: 86,
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
    this.colDefStatus,
    this.colDefViewButton
  ];
}

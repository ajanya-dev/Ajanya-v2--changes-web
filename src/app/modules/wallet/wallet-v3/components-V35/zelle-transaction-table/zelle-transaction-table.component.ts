import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
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
  selector: 'app-zelle-transaction-table',
  standalone: true,
  imports: [CommonModule, V3DataTableModule, DataTableModule],
  templateUrl: './zelle-transaction-table.component.html',
  styleUrl: './zelle-transaction-table.component.scss'
})
export class ZelleTransactionTableComponent implements OnInit {
  private dataTableService = inject(DataTableService);
  private v3DataTableService = inject(V3DataTableService);

  public tableId = DTTableId.zelleTransaction;
  fieldsShownByDefault: string[] = ['status','amount'];
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
    this.v3DataTableService.refreshV3DataTable();
  }

  /** Table columns */
  colDefId = {
    headerName: 'ID',
    minWidth: 50,
    field: 'uu_id',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center pl-2.5',
    headerClass: 'pl-3',
  };

  colDefRefId = {
    headerName: 'Zelle Ref ID',
    minWidth: 50,
    field: 'zelle_sender_reference_id',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center pl-2.5',
    headerClass: 'pl-3',
  };

  colDefSenderName = {
    headerName: 'Sender Name',
    minWidth: 50,
    field: 'sender_name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center pl-2.5',
    headerClass: 'pl-3',
  };

  colDefAmount = {
    headerName: 'Amount',
    minWidth: 90,
    maxWidth: 120,
    field: 'amount',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center items-end pr-3',
    cellRenderer: (params: { data: { amount: string } }) =>
      `$${params.data.amount}`
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

    cellRenderer: (params: { data: { created_at: string } }) =>
      params.data.created_at
  };

  colDefEmail = {
    headerName: 'Email',
    minWidth: 100,
    field: 'zelle_email',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center',
  };

  colDefDescription = {
    headerName: 'Reason ',
    minWidth: window.innerWidth <= 1500 ? 100 : 200,
    maxWidth: 300,
    field: 'description',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center',
    cellRenderer: (params: { data: { description: string } }) =>
      params.data.description
  };

  colDefStatus = {
    headerName: 'Status',
    minWidth: 50,
    maxWidth:100,
    field: 'status',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center',
    cellRenderer: 'v3StatusComponent',
    cellRendererParams: {
      isStatementDisable: true,
      hideFilterButton:true
    }
  };

  /** Set column feilds. */
  columnDefs = [
    this.colDefId,
    this.colDefRefId,
    this.colDefSenderName,
    this.colDefAmount,
    this.colDefDescription,
    this.colDefDate,
    this.colDefEmail,
    this.colDefStatus
  ];
}

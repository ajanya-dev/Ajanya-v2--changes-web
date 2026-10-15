import { Component, OnInit, inject } from '@angular/core';
import { DtSearchBoxComponent } from 'src/app/modules/data-table/components/dt-search-box/dt-search-box.component';
import { DataRangeV35Component } from 'src/app/shared/components/date-range-v35/data-range-v35.component';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { V3DataTableSelectBoxComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-data-table-select-box/v3-data-table-select-box.component';
import { V3StatusComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-status/v3-status.component';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { V3DataTableComponent } from 'src/app/modules/v3-data-table/components/v3-data-table/v3-data-table.component';
import { CommonBackButtonV35Component } from 'src/app/shared/v3/buttons/common-back-button-v35/common-back-button-v35.component';

@Component({
  selector: 'app-prenote-ach-transaction',
  standalone: true,
  imports: [V3DataTableComponent, CommonBackButtonV35Component],
  templateUrl: './prenote-ach-transaction.component.html',
  styleUrl: './prenote-ach-transaction.component.scss'
})
export class PrenoteAchTransactionComponent implements OnInit {
  private dataTableService = inject(DataTableService);
  private v3DataTableService = inject(V3DataTableService);

  public tableId = DTTableId.prenoteAchTransaction;
  fieldsShownByDefault: string[] = ['status', 'uu_id', 'created_at'];
  frameworkComponents = {
    selectBoxComponent: V3DataTableSelectBoxComponent,
    SearchBoxComponent: DtSearchBoxComponent,
    dateRangeV35Component: DataRangeV35Component,
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
          { value: '4', name: 'Failed' },
          { value: '5', name: 'Returned' }
        ]
      },
      {
        id: 'sender_bank_account_type',
        values: [
          { value: 'personalChecking', name: 'Personal Checking' },
          { value: 'businessChecking', name: 'Business Checking' },
          { value: 'personalSavings', name: 'Personal Savings' },
          { value: 'businessSavings', name: 'Business Savings' },
          { value: 'CHECKING', name: 'Checking' },
          { value: 'BUSINESS', name: 'Business' },
          { value: 'SAVINGS', name: 'Savings' }
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
    headerClass: 'pl-3'
  };

  colDefAccountName = {
    headerName: 'Account Name',
    minWidth: 50,
    field: 'sender_name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center pl-2.5',
    headerClass: 'pl-3',
    valueGetter: (params: { data: { accountName: string } }) =>
      params.data.accountName
  };

  colDefAccountNumber = {
    headerName: 'Account Number',
    minWidth: 50,
    field: 'sender_bank_account_number',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center pl-2.5',
    headerClass: 'pl-3',
    valueGetter: (params: { data: { accountNumber: string } }) => {
      if (!params.data.accountNumber || params.data.accountNumber.length < 4) {
        return params.data.accountNumber;
      }
      const lastFour = params.data.accountNumber.slice(-4);
      const maskedPart = '*'.repeat(params.data.accountNumber.length - 4);
      return maskedPart + lastFour;
    }
  };

  colDefAccountType = {
    headerName: 'Account Type',
    minWidth: 50,
    field: 'sender_bank_account_type',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center pl-2.5',
    headerClass: 'pl-3',
    valueGetter: (params: { data: { accountType: string } }) => {
      if (params.data.accountType === 'personalChecking') {
        return 'Personal Checking';
      }
      if (params.data.accountType === 'businessChecking') {
        return 'Business Checking';
      }
      if (params.data.accountType === 'personalSavings') {
        return 'Personal Savings';
      }
      if (params.data.accountType === 'businessSavings') {
        return 'Business Savings';
      }
      if (params.data.accountType === 'CHECKING') {
        return 'Checking';
      }
      if (params.data.accountType === 'BUSINESS') {
        return 'Business';
      }
      if (params.data.accountType === 'SAVINGS') {
        return 'Savings';
      }
      return params.data.accountType;
    }
  };

  colDefRoutingNumber = {
    headerName: 'Routing Number',
    minWidth: 50,
    field: 'sender_bank_routing_number',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center pl-2.5',
    headerClass: 'pl-3',
    valueGetter: (params: { data: { routingNumber: string } }) =>
      params.data.routingNumber
  };

  colDefRejectionReason = {
    headerName: 'ACH Return Reason Code',
    minWidth: 50,
    field: 'ach_pull_return_reason_code',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center pl-2.5',
    headerClass: 'pl-3',
    valueGetter: (params: { data: { ach_pull_return_reason_code: string } }) =>
      params.data.ach_pull_return_reason_code
  };

  colDefDate = {
    headerName: 'Created Date',
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

  colDefStatus = {
    headerName: 'Status',
    minWidth: 50,
    maxWidth: 100,
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
      hideFilterButton: true
    }
  };

  /** Set column feilds. */
  columnDefs = [
    this.colDefId,
    this.colDefAccountName,
    this.colDefAccountNumber,
    this.colDefAccountType,
    this.colDefRoutingNumber,
    this.colDefRejectionReason,
    this.colDefDate,
    this.colDefStatus
  ];
}

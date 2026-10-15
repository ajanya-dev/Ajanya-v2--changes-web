import { Component, OnInit, inject } from '@angular/core';
import { ColDef, ColGroupDef } from '@ag-grid-community/core';
import { TitleCasePipe, formatNumber } from '@angular/common';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { DataRangeV35Component } from 'src/app/shared/components/date-range-v35/data-range-v35.component';
import { IDtColumnFields } from 'src/app/modules/data-table/model/datatable';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { V3DataTableSelectBoxComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-data-table-select-box/v3-data-table-select-box.component';
import { DtActionComponent } from '../../../data-table/components/dt-action/dt-action.component';
import { DtSearchBoxComponent } from '../../../data-table/components/dt-search-box/dt-search-box.component';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { V3DataTableComponent } from '../../../v3-data-table/components/v3-data-table/v3-data-table.component';

interface IRowData {
  id: number;
  created_at: string;
  issue_date: string;
  reference_no?: string;
  expense_type: number;
  bank_account_account_name: string;
  bank_account_nick_name: string;
  balance: string;
  amount: string;
  cheque_serial_number?: string;
  operation_id: string;
  operation: number;
  payee_id: number;
  memo?: string;
  payee_nick_name?: string;
  payee_name?: string;
  name: string;
  nick_name: string;
  clients: string;
  action: string;
}

@Component({
  selector: 'app-central-report-list',
  templateUrl: './central-report-list.component.html',
  styleUrls: ['./central-report-list.component.scss'],
  standalone: true,
  imports: [V3DataTableComponent]
})
export class CentralReportListComponent implements OnInit {
  private dataTableService = inject(DataTableService);
  private titlecase = inject(TitleCasePipe);
  private v3DataTableService = inject(V3DataTableService);

  // DATA TABLE VARAIBLES
  public columnDefs: (ColDef | ColGroupDef)[];
  public columnFields: IDtColumnFields[];
  public tableId = DTTableId.centralReport; // Data Table Id

  actionComponentProp = {
    actionButton: false,
    eyeButton: true
  };

  FloatingFilterComponent = {
    selectBox: [
      {
        id: 'operation',
        values: [
          { value: 1, name: 'Check' },
          { value: 2, name: 'Deposit slip' },
          { value: 3, name: 'Cash Expense' }
        ]
      }
    ],
    selectDate: [
      { id: 'issue_date', initialRange: 'All Time', isPrimary: true },
      { id: 'centralaccountings.created_at', initialRange: 'Last 3 Months' }
    ]
  };

  public frameworkComponents = {
    selectBoxComponent: V3DataTableSelectBoxComponent,
    selectDateComponent: DataRangeV35Component,
    actionComponent: DtActionComponent,
    SearchBoxComponent: DtSearchBoxComponent
  };

  ngOnInit(): void {
    // SET COLUMN FEILDS
    this.columnDefs = [
      this.colDefDummy, // added to avoid problem while downloading data from data table using export
      this.colDefDate,
      this.colDefBankAcc,
      this.colDefPayee,
      this.colDefAmount,
      this.colDefBalance,
      this.colDefType,
      this.colDefBy,
      this.colDefMemo,
      this.colDefReferenceNo,
      this.colDefCreatedTime,
      this.colDefDetails
    ];

    // PASS  FIELD DATA
    this.columnFields = [
      {
        id: 'id_dummy',
        name: 'None',
        isDisabled: true,
        colDef: this.colDefDummy,
        isChecked: true
      },
      {
        id: 'id_date',
        name: 'Date',
        isDisabled: false,
        colDef: this.colDefDate,
        isChecked: true
      },
      {
        id: 'id_bankAcc',
        name: 'Bank A/C',
        isDisabled: false,
        colDef: this.colDefBankAcc,
        isChecked: true
      },

      {
        id: 'id_payee',
        name: 'Payee',
        isDisabled: false,
        colDef: this.colDefPayee,
        isChecked: true
      },
      {
        id: 'id_amount',
        name: 'Amount',
        isDisabled: false,
        colDef: this.colDefAmount,
        isChecked: true
      },
      {
        id: 'id_balance',
        name: 'Balance',
        isDisabled: false,
        colDef: this.colDefBalance,
        isChecked: true
      },
      {
        id: 'id_type',
        name: 'Type',
        isDisabled: false,
        colDef: this.colDefType,
        isChecked: true
      },
      {
        id: 'id_by',
        name: 'By',
        isDisabled: false,
        colDef: this.colDefBy,
        isChecked: true
      },
      {
        id: 'id_memo',
        name: 'Memo',
        isDisabled: false,
        colDef: this.colDefMemo,
        isChecked: true
      },
      {
        id: 'id_referenceNo',
        name: 'Reference No',
        isDisabled: false,
        colDef: this.colDefReferenceNo,
        isChecked: true
      },
      {
        id: 'id_createdTime',
        name: 'Created Time',
        isDisabled: false,
        colDef: this.colDefCreatedTime,
        isChecked: true
      },
      {
        id: 'id_details',
        name: 'Details',
        isDisabled: true,
        colDef: this.colDefDetails,
        isChecked: true
      }
    ];

    this.dataTableService.setDataFromParent(
      this.columnFields,
      this.FloatingFilterComponent,
      undefined,
      this.actionComponentProp
    );
    this.dataTableService.postcolumnVisible(this.tableId, { visibility: true });
    this.v3DataTableService.resetV3DataTablePayload();
    this.v3DataTableService.refreshV3DataTable();
  }

  /**
   * @description Opens a new browser window based on the type of operation selected in the provided event's selected row.
   * @param {IRowData} event.selectedRow - The selected row data object.
   */
  cellRendererActionView(event: { selectedRow: IRowData }) {
    const selectedItem = event?.selectedRow;
    if (selectedItem != null) {
      if (selectedItem.operation === 1) {
        // check
        window.open(
          `/manage/cheque/view/${selectedItem.operation_id}`,
          '__blank'
        );
      } else if (selectedItem.operation === 2) {
        // deposit slip
        window.open(
          `/manage/depositslips/view/${selectedItem.operation_id}`,
          '__blank'
        );
      } else {
        // cash expense
        window.open(
          `/manage/cashexp/view/${selectedItem.operation_id}`,
          '__blank'
        );
      }
    }
  }

  colDefDummy = {
    headerName: 'None',
    field: 'cheque_serial_number',
    suppressFloatingFilterButton: true,
    cellStyle: () => ({ display: 'none' }),
    floatingFilter: false,
    suppressHeaderMenuButton: true,
    minWidth: 1,
    maxWidth: 1
  };

  colDefDate = {
    headerName: 'Date',
    field: 'issue_date',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectDateComponent',
    filter: 'agDateColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 120,
    enableSorting: true,
    sort: 'desc'
  };

  colDefBankAcc = {
    headerName: 'Bank A/C',
    field: 'bank_account_nick_name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 100,
    cellRenderer: (params: {
      data: {
        bank_account_nick_name: string | null;
        bank_account_account_name: string;
      };
    }) => {
      if (
        params.data.bank_account_nick_name === null ||
        params.data.bank_account_nick_name === ''
      ) {
        return this.titlecase.transform(params.data.bank_account_account_name);
      }
      return this.titlecase.transform(params.data.bank_account_nick_name);
    }
  };

  colDefPayee = {
    headerName: 'Payee',
    field: 'payee_name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 100,
    cellRenderer: (params: {
      data: { operation: number; payee_name: string };
    }) => {
      if (params.data.operation === 2) {
        return 'Deposit';
      }
      return params.data.payee_name;
    },
    cellStyle: (params: { data: { operation: string } }) => {
      if (params.data.operation === '2')
        return { color: 'var(--common-green-color)' };
      return null;
    }
  };

  colDefAmount = {
    headerName: 'Amount',
    field: 'amount',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    maxWidth: 120,
    cellStyle: (params: { data: { operation: number } }) => {
      if (params.data.operation === 1) {
        return { color: 'var(--common-red-color)' };
      }
      if (params.data.operation === 2)
        return { color: 'var(--common-green-color)' };
      if (params.data.operation === 3)
        return { color: 'var(--common-blue-color)' };

      return null;
    },
    cellClass: 'ag-right-aligned-cell pr-3',
    cellRenderer: (params: { value: number }) =>
      formatNumber(params.value, 'en-US', '1.2-2')
  };

  colDefBalance = {
    headerName: 'Balance',
    field: 'centralaccountings.balance',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    maxWidth: 150,
    cellClass: 'ag-right-aligned-cell pr-3',
    cellRenderer: (params: { data: { balance: number } }) =>
      formatNumber(params.data.balance, 'en-US', '1.2-2')
  };

  colDefType = {
    headerName: 'Type',
    field: 'operation',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectBoxComponent',
    floatingFilter: true,
    filter: 'agNumberColumnFilter',

    minWidth: 100,
    cellRenderer: (params: { value: number }) => {
      if (params.value === 1) {
        return 'Check';
      }
      if (params.value === 2) {
        return 'Deposit Slip';
      }
      return 'Cash';
    },
    cellStyle: (params: { value: number }) => {
      if (params.value === 1) {
        return { color: 'var(--common-red-color)' };
      }
      if (params.value === 2) return { color: 'var(--common-green-color)' };
      if (params.value === 3) return { color: 'var(--common-blue-color)' };

      return null;
    }
  };

  colDefBy = {
    headerName: 'By',
    field: 'name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 50
  };

  colDefMemo = {
    headerName: 'Memo',
    field: 'memo',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 120
  };

  colDefReferenceNo = {
    headerName: 'Reference No',
    field: 'reference_no',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 130,
    cellRenderer: (params: {
      data: {
        reference_no: string | number | null;
        cheque_serial_number: string;
        operation: number;
      };
    }) => {
      let refno: string;
      if (
        params.data.reference_no !== null &&
        params.data.reference_no !== 0 &&
        params.data.reference_no !== ''
      ) {
        refno = String(params.data.reference_no);
      } else {
        refno = params.data.cheque_serial_number;
      }
      if (refno === null) {
        if (params.data.operation === 2) {
          // deposit slip
          if (params.data.reference_no === 0) {
            return `Deposit Slip Ref No:${params.data.reference_no}`;
          }
        }
        return '';
      }
      if (params.data.operation === 1) {
        // check
        return `Check No:${refno}`;
      }
      if (params.data.operation === 2) {
        // deposit slip
        return `Deposit Slip Ref No:${refno}`;
      }
      // cash expense
      return `Cash Expense Serial No:${refno}`;
    }
  };

  colDefCreatedTime = {
    headerName: 'Created Time',
    field: 'centralaccountings.created_at',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectDateComponent',
    filter: 'agDateColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 180,
    cellRenderer: (params: { data: { created_at: string } }) => {
      const [date, time] = params.data.created_at.toString().split('_');
      return `${date} (${time})`;
    }
  };

  colDefDetails = {
    headerName: 'Details',
    field: 'action',
    suppressFloatingFilterButton: true,
    maxWidth: 50,
    cellRenderer: 'actionComponent',
    cellStyle: () => ({ color: 'green' }),
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 50,
    sortable: false
  };
}

import { ColDef, ICellRendererParams } from '@ag-grid-community/core';
import {
  IDtHeaderElements,
  IDtFloatingFilterProp
} from 'src/app/modules/data-table/model/datatable';

export class PayrollTransactionsAdpData {
  headerElements: IDtHeaderElements = {
    panelButtons: [],
    buttons: [],
    videoButton: []
  };

  transactionStatuses: { [key: string]: string } = {
    0: 'Pending',
    1: 'Processing',
    2: 'Completed',
    11: 'Failed'
  };

  colDefDate = {
    headerName: 'Date',
    field: 'pay_date',
    suppressFloatingFilterButton: true,
    minWidth: 120,
    maxWidth: 200,
    filter: 'agDateColumnFilter',
    floatingFilterComponent: 'selectDateComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
  };

  colDefCompanyName = {
    headerName: 'Company Name',
    sortable: false, // sorting disabled
    field: 'adp_company.subscriber_organization_name',
    suppressFloatingFilterButton: true,
    minWidth: 180,
    filter: 'agTextColumnFilter',
    floatingFilterComponent: 'SearchBoxComponent',
    floatingFilter: true,
  };

  colDefPayrollRunNumber = {
    headerName: 'Payroll Number',
    field: 'payroll_run_number',
    suppressFloatingFilterButton: true,
    minWidth: 180,
    maxWidth: 300,
    filter: 'agTextColumnFilter',
    floatingFilterComponent: 'SearchBoxComponent',
    floatingFilter: true,
  };

  colDefCard = {
    headerName: 'Card',
    sortable: false, // sorting disabled
    minWidth: 100,
    field: 'payment_card.card_nick_name',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    floatingFilterComponent: 'SearchBoxComponent',
    floatingFilter: true,
  };

  colDefBank = {
    headerName: 'Bank',
    sortable: false, // sorting disabled
    minWidth: 100,
    field: 'bank_account.bank_account_nick_name',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    floatingFilterComponent: 'SearchBoxComponent',
    floatingFilter: true,
  };

  colDefStatus = {
    headerName: 'Status',
    minWidth: 120,
    field: 'status',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    floatingFilterComponent: 'selectBoxComponent',
    floatingFilter: true,
    cellRenderer: (params: ICellRendererParams): string =>
      `<div class="status-cell"><span class="status-chip ${this.transactionStatuses[
        params?.data?.status?.toString()
      ]?.toLowerCase()}">${
        params.data.status
          ? this.transactionStatuses[params.data.status.toString()]
          : ''
      }</span></div>`
  };

  colDefPayrollAmount = {
    headerName: 'Payroll Amount',
    minWidth: 130,
    field: 'total_payroll_amount',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    floatingFilterComponent: 'SearchBoxComponent',
    floatingFilter: true,
  };

  colDefProcessedAmount = {
    headerName: 'Processed Amount',
    minWidth: 150,
    field: 'processed_amount',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    floatingFilterComponent: 'SearchBoxComponent',
    floatingFilter: true,
  };

  colDefAction: ColDef = {
    minWidth: 70,
    headerName: 'Action',
    field: 'action',
    suppressFloatingFilterButton: true,
    sortable: false,
    cellRenderer: 'actionComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    lockPosition: 'right'
  };

  public getColDef(): ColDef[] {
    return [
      this.colDefCompanyName,
      this.colDefPayrollRunNumber,
      this.colDefDate,
      this.colDefPayrollAmount,
      this.colDefProcessedAmount,
      this.colDefCard,
      this.colDefBank,
      this.colDefStatus,
      this.colDefAction
    ];
  }

  public getColumnFields() {
    return [
      {
        id: 'adp_company.subscriber_organization_name',
        name: 'Company Name',
        isDisabled: false,
        colDef: this.colDefCompanyName,
        isChecked: true
      },
      {
        id: 'payroll_run_number',
        name: 'PayRoll Number',
        isDisabled: false,
        colDef: this.colDefPayrollRunNumber,
        isChecked: true
      },
      {
        id: 'pay_date',
        name: 'Date',
        isDisabled: false,
        colDef: this.colDefDate,
        isChecked: true
      },
      {
        id: 'total_payroll_amount',
        name: 'Payroll Amount',
        isDisabled: false,
        colDef: this.colDefPayrollAmount,
        isChecked: true
      },
      {
        id: 'processed_amount',
        name: 'Processed Amount',
        isDisabled: false,
        colDef: this.colDefProcessedAmount,
        isChecked: true
      },
      {
        id: 'payment_card.card_nick_name',
        name: 'Card',
        isDisabled: false,
        colDef: this.colDefCard,
        isChecked: true
      },
      {
        id: 'bank_account.bank_account_nick_name',
        name: 'Payee Bank',
        isDisabled: false,
        colDef: this.colDefBank,
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
        id: 'id_action',
        name: 'Action',
        isDisabled: true,
        colDef: this.colDefAction,
        isChecked: true
      }
    ];
  }

  floatingFilterCompProp(): IDtFloatingFilterProp {
    return {
      selectBox: [
        {
          id: 'status',
          values: [
            { value: '0', name: 'Pending' },
            { value: '1', name: 'Processing' },
            { value: '2', name: 'Completed' },
            { value: '11', name: 'Failed' }
          ]
        }
      ],
      selectDate: [{ id: 'payroll_processed_date', initialRange: 'All Time' }]
    };
  }
}

import { CurrencyPipe } from '@angular/common';
import { ICellRendererParams } from '@ag-grid-community/core';
import { ICoulmnDefFields } from 'src/app/models/v3-datatable';
import { environment } from 'src/environments/environment';
import { ICheckStatus } from '../../model/check';

export class CustomCheckReportData {
  private currencyPipe: CurrencyPipe;

  constructor(currencyPipe: CurrencyPipe) {
    this.currencyPipe = currencyPipe;
  }

  cellRendererCheckStatus: Record<string, ICheckStatus> = {};

  colDefStatus = {
    headerName: 'Status',
    minWidth: 100,
    field: 'cheques.cheque_status',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'addAttachmentComment',
    cellRendererForExport: (params: ICellRendererParams) => {
      const value = params?.data?.cheque_status;
      return this.cellRendererCheckStatus[value]?.statusShortDescription;
    }
  };

  colDefAmount = {
    maxWidth: 120,
    headerName: 'Amount',
    tooltipField: 'Amount',
    field: 'cheque_amount',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: '',
    cellRenderer: (params: { value: string | number }) =>
      this.currencyPipe.transform(params.value)
  };

  colDefPayee = {
    minWidth: 120,
    headerName: environment.env_id === 'compass' ? 'Vendor' : 'Payee',
    field: 'payee_name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'payeeListComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefBank = {
    minWidth: 120,
    headerName: 'Bank',
    field: 'bank_account_nick_name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'bankAccountComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: (params: ICellRendererParams) => {
      if (!params.value) {
        return `<span type="text" >${
          params?.data?.bank_account_account_name
            ? params.data.bank_account_account_name
            : ''
        }</span>`;
      } 
        return `<span type="text" title="${
          params?.data?.bank_account_account_name
        }">${params?.value ? params.value : ''}</span>`;
      
    },
    cellRendererForExport: (params: ICellRendererParams) => {
      if (params.value === null || params.value === undefined)
        return params?.data?.bank_account_account_name;
      return params?.value;
    }
  };

  colDefCheckNo = {
    minWidth: 100,
    headerName: 'Check No',
    field: 'cheque_serial_number',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: (params: ICellRendererParams) => {
      if (params?.data?.verified === 1) {
        return `<span type="text" style="color: var(--brand-color-lite); font-weight: 700 "  title="Verified using bank data" >${params?.value}</span>`;
      } 
        return params?.value;
      
    },
    cellRendererForExport: (params: ICellRendererParams) => params?.value
  };

  colDefDate = {
    minWidth: 95,
    headerName: 'Date',
    field: 'cheque_issue_date',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectDateComponent',
    filter: 'agDateColumnFilter',
    floatingFilter: true,
    floatingFilterComponentParams: { tableId: 66 },
    suppressHeaderMenuButton: true
  };

  colDefBy = {
    minWidth: 100,
    headerName: 'By',
    field: 'cheque_created_by_name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: (params: ICellRendererParams) => params?.data?.cheque_created_by_user_name
  };

  colDefMemo = {
    minWidth: 100,
    headerName: 'Memo',
    field: 'cheque_memo',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefCategory = {
    minWidth: 100,
    headerName: 'Category',
    field: 'catagory_name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefPayeeAcNo = {
    minWidth: 100,
    headerName:
      environment.env_id === 'compass' ? 'Vendor A/c No' : 'Payee A/c No',
    field: 'cheque_account_number',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefInvoiceNo = {
    minWidth: 90,
    headerName: 'Invoice No',
    field: 'cheque_invoice_number',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefCreatedAt = {
    minWidth: 100,
    headerName: 'Created Time',
    field: 'cheques.created_at',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectDateComponent',
    filter: 'agDateColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: (params: ICellRendererParams) => {
      const [date = '', time = ''] = (
        params?.data?.created_at?.toString() ?? ''
      ).split('_');
      return `${date} (${time})`;
    }
  };

  colDefUpdatedAt: ICoulmnDefFields = {
    minWidth: 100,
    headerName: 'Updated Time',
    field: 'cheques.updated_at',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectDateComponent',
    filter: 'agDateColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: (params: ICellRendererParams) => {
      const [date = '', time = ''] = (
        params?.data?.updated_at?.toString() ?? ''
      ).split('_');
      return `${date} (${time})`;
    }
  };

  public getColDef(): ICoulmnDefFields[] {
    return [
      this.colDefCheckNo,
      this.colDefStatus,
      this.colDefAmount,
      this.colDefPayee,
      this.colDefBank,
      this.colDefDate,
      this.colDefBy,
      this.colDefMemo,
      this.colDefCategory,
      this.colDefPayeeAcNo,
      this.colDefInvoiceNo,
      this.colDefUpdatedAt,
      this.colDefCreatedAt
    ];
  }

  public getColumnFields() {
    return [
      {
        id: 'id_checkNo',
        name: 'Check No',
        isDisabled: false,
        colDef: this.colDefCheckNo,
        isChecked: true
      },
      {
        id: 'id_status',
        name: 'Status',
        isDisabled: false,
        colDef: this.colDefStatus,
        isChecked: true
      },
      {
        id: 'id_amount',
        name: 'Amount',
        isDisabled: true,
        colDef: this.colDefAmount,
        isChecked: true
      },
      {
        id: 'id_payee',
        name: 'Payee',
        isDisabled: true,
        colDef: this.colDefPayee,
        isChecked: true
      },
      {
        id: 'id_bank',
        name: 'Bank',
        isDisabled: false,
        colDef: this.colDefBank,
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
        id: 'id_category',
        name: 'Category',
        isDisabled: false,
        colDef: this.colDefCategory,
        isChecked: true
      },
      {
        id: 'id_payeeAcNo',
        name: 'Payee AC NO',
        isDisabled: false,
        colDef: this.colDefPayeeAcNo,
        isChecked: true
      },
      {
        id: 'id_invoiceNo',
        name: 'Invoice No',
        isDisabled: false,
        colDef: this.colDefInvoiceNo,
        isChecked: true
      },
      {
        id: 'id_updated_at',
        name: 'Updated At',
        isDisabled: false,
        colDef: this.colDefUpdatedAt,
        isChecked: true
      },
      {
        id: 'id_createdAt',
        name: 'Created At',
        isDisabled: false,
        colDef: this.colDefCreatedAt,
        isChecked: true
      }
    ];
  }
}

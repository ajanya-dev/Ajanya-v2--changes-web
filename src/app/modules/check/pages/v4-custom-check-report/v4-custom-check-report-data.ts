import { CurrencyPipe } from '@angular/common';
import { ICellRendererParams } from '@ag-grid-community/core';
import { ICoulmnDefFields } from 'src/app/models/v3-datatable';
import { environment } from 'src/environments/environment';
import { ICheckStatus } from 'src/app/modules/check/model/check';

export class V4CustomCheckReportData {
  private currencyPipe: CurrencyPipe;

  constructor(currencyPipe: CurrencyPipe) {
    this.currencyPipe = currencyPipe;
  }

  cellRendererCheckStatus: Record<string, ICheckStatus> = {};

  colDefId = {
    maxWidth: 50,
    headerName: '',
    sortable: false,
    field: 'id',
    suppressFloatingFilterButton: true,
    suppressHeaderMenuButton: true,
    lockPosition: true,
    headerCheckboxSelection: true,
    checkboxSelection: true,
    showDisabledCheckboxes: true,
    headerClass: 'pl-3.5',
    cellClass: 'flex justify-center',
    pinned: 'left' as const
  };

  colDefAction = {
    minWidth: 80,
    maxWidth: 120,
    headerName: 'Action',
    field: 'action',
    pinned: 'left' as const,
    suppressFloatingFilterButton: true,
    suppressHeaderMenuButton: true,
    sortable: false,
    floatingFilter: true,
    cellRenderer: 'v4CheckReportActionComponent'
  };

  colDefStatus = {
    headerName: 'Status',
    minWidth: 120,
    width: 150,
    maxWidth: 300,
    field: 'cheques.cheque_status',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    pinned: 'right' as const,
    lockPosition: 'right' as const,
    lockPinned: true,
    suppressMovable: true,
    cellRenderer: 'v4CheckStatusComponent',
    cellRendererParams: () => ({
      checkStatusMap: this.cellRendererCheckStatus,
      showFilter: true
    })
  };

  colDefAmount = {
    minWidth: 150,
    headerName: 'Amount',
    field: 'cheque_amount',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex justify-end pr-3 text-end',
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
        return `<span>${params?.data?.bank_account_account_name ?? ''}</span>`;
      }
      return `<span title="${params?.data?.bank_account_account_name ?? ''}">${params.value}</span>`;
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
        return `<span title="Verified using bank data">${params?.value ?? ''} ✓</span>`;
      }
      return `<span>${params?.value ?? ''}</span>`;
    }
  };

  colDefDate = {
    minWidth: 130,
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
    cellRenderer: (params: ICellRendererParams) =>
      `<span>${params?.data?.cheque_created_by_user_name ?? ''}</span>`
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
    minWidth: 140,
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
    minWidth: 120,
    headerName: 'Invoice No',
    field: 'cheque_invoice_number',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefCreatedAt = {
    minWidth: 130,
    headerName: 'Created Time',
    field: 'cheques.created_at',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectDateComponent',
    filter: 'agDateColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'v4CreatedAtComponent'
  };

  colDefUpdatedAt = {
    minWidth: 130,
    headerName: 'Updated Time',
    field: 'cheques.updated_at',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectDateComponent',
    filter: 'agDateColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'v4UpdatedAtComponent'
  };

  public getColDef(): ICoulmnDefFields[] {
    return [
      this.colDefId,
      this.colDefAction,
      this.colDefCheckNo,
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
      this.colDefCreatedAt,
      this.colDefStatus
    ] as ICoulmnDefFields[];
  }

  public getColumnFields() {
    return [
      {
        id: 'id',
        name: '#',
        isDisabled: true,
        colDef: this.colDefId,
        isChecked: true
      },
      {
        id: 'id_action',
        name: 'Action',
        isDisabled: true,
        colDef: this.colDefAction,
        isChecked: true
      },
      {
        id: 'id_checkNo',
        name: 'Check No',
        isDisabled: false,
        colDef: this.colDefCheckNo,
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
      },
      {
        id: 'id_status',
        name: 'Status',
        isDisabled: false,
        colDef: this.colDefStatus,
        isChecked: true
      }
    ];
  }
}

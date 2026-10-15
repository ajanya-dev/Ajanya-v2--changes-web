import { DecimalPipe } from '@angular/common';
import {
  ColDef,
  ColGroupDef,
  ICellRendererParams
} from '@ag-grid-community/core';
import { ICoulmnDefFields } from 'src/app/models/v3-datatable';

export class CustomJobsReportData {
  constructor(private decimal: DecimalPipe) {}
  cellRendererCheckStatus: any[] = [];
  public columnDefs!: (ColDef | ColGroupDef)[] | null;

  colDefFileName = {
    headerName: 'File Name',
    minWidth: 100,
    field: 'filename',
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter'
  };

  colDefAmount = {
    minWidth: 90,
    headerName: 'Total Amount',
    field: 'total_amount',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'ag-right-aligned-cell',
    cellRenderer: (params: any) => {
      return this.decimal.transform(params.value, '1.2-2');
    }
  };

  colDefCheckCount = {
    minWidth: 90,
    headerName: 'Check Count',
    field: 'records_count',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
  };

  colDefCreatedAt = {
    minWidth: 100,
    headerName: 'Created Time',
    field: 'young_william_text_files.created_at',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectDateComponent',
    filter: 'agDateColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: (params: ICellRendererParams) => {
      const [date, time] = params?.data?.created_at?.toString().split('_');
      return `${date} (${time})`;
    }
  };

  colDefUploadedBy: ICoulmnDefFields = {
    minWidth: 100,
    headerName: 'Uploaded By',
    field: 'name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
  };

  colDefAction = {
    maxWidth: 100,
    minWidth: 100,
    headerName: 'Action',
    field: 'action',
    suppressFloatingFilterButton: true,
    sortable: false,
    cellRenderer: 'actionComponent',
    floatingFilter: false,
    suppressHeaderMenuButton: true,
  };

  public getColDef() {
    return [
      this.colDefFileName,
      this.colDefCheckCount,
      this.colDefAmount,
      this.colDefUploadedBy,
      this.colDefCreatedAt,
      this.colDefAction
    ];
  }

  public getColumnFields() {
    return [
      {
        id: 'filename',
        name: 'Flie Name',
        isDisabled: false,
        colDef: this.colDefFileName,
        isChecked: true
      },
      {
        id: 'total_amount',
        name: 'CheckCount',
        isDisabled: true,
        colDef: this.colDefAmount,
        isChecked: true
      },
      {
        id: 'records_count',
        name: 'Payee',
        isDisabled: true,
        colDef: this.colDefCheckCount,
        isChecked: true
      },
      {
        id: 'name',
        name: 'Uploaded by',
        isDisabled: false,
        colDef: this.colDefUploadedBy,
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
        id: 'id_Action',
        name: 'Action',
        isDisabled: false,
        colDef: this.colDefAction,
        isChecked: true
      }
    ];
  }
}

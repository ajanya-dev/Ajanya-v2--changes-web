import { ICellRendererParams } from '@ag-grid-community/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogClose } from '@angular/material/dialog';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faXmark } from '@fortawesome/pro-solid-svg-icons';
import { IPaymentLinksCustomTableRes } from 'src/app/modules/data-table/components/data-table/data-table.model';
import { DtSearchBoxComponent } from 'src/app/modules/data-table/components/dt-search-box/dt-search-box.component';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { V3DataTableComponent } from 'src/app/modules/v3-data-table/components/v3-data-table/v3-data-table.component';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { V3DataTableModule } from 'src/app/modules/v3-data-table/v3-data-table.module';
import { DataRangeV35Component } from 'src/app/shared/components/date-range-v35/data-range-v35.component';

@Component({
  selector: 'app-payment-links-custom-links-payments',
  standalone: true,
  imports: [
    V3DataTableComponent,
    V3DataTableModule,
    FaIconComponent,
    MatDialogClose
  ],
  templateUrl: './payment-links-custom-links-payments.component.html',
  styleUrl: './payment-links-custom-links-payments.component.scss'
})
export class PaymentLinksCustomLinksPaymentsComponent implements OnInit {
  private v3DataTableService = inject(V3DataTableService);
  private datePipe = inject(DatePipe);
  private currencyPipe = inject(CurrencyPipe);

  dialogData = inject<{
    row: IPaymentLinksCustomTableRes;
  }>(MAT_DIALOG_DATA);

  faXmark = faXmark;

  ngOnInit(): void {
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
  }

  frameworkComponents = {
    selectDateComponent: DataRangeV35Component,
    searchBoxComponent: DtSearchBoxComponent
  };

  tableId = DTTableId.paymentLinksCustomPayments;

  colDefSenderMail = {
    minWidth: 140,
    headerName: 'Sender Email',
    field: 'sender_email',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'searchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefAmount = {
    minWidth: 140,
    headerName: 'Amount',
    field: 'amount',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'searchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: (param: ICellRendererParams) => {
      return `
        <div class="flex justify-end pr-4">${this.currencyPipe.transform(param.value)}</div>
      `;
    }
  };

  colDefCreatedAt = {
    minWidth: 140,
    headerName: 'Created AT',
    field: 'created_at',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectDateComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: (param: ICellRendererParams) => {
      return this.datePipe.transform(param.value, 'MM-dd-yyyy');
    }
  };

  colDefPaymentDate = {
    minWidth: 140,
    headerName: 'Payment Date',
    field: 'payment_date',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectDateComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: (param: ICellRendererParams) => {
      return this.datePipe.transform(param.value, 'MM-dd-yyyy');
    }
  };

  colDefMemo = {
    minWidth: 140,
    headerName: 'Memo',
    field: 'memo',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'searchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  columnDefs = [
    this.colDefSenderMail,
    this.colDefAmount,
    this.colDefCreatedAt,
    this.colDefPaymentDate,
    this.colDefMemo
  ];

  columnFields = [
    {
      id: 'sender_email',
      name: 'Sender Email',
      isDisabled: false,
      colDef: this.colDefSenderMail,
      isChecked: true
    },
    {
      id: 'amount',
      name: 'Amount',
      isDisabled: false,
      colDef: this.colDefAmount,
      isChecked: true
    },
    {
      id: 'created_at',
      name: 'Created At',
      isDisabled: false,
      colDef: this.colDefCreatedAt,
      isChecked: true
    },
    {
      id: 'payment_date',
      name: 'Payment Date',
      isDisabled: false,
      colDef: this.colDefPaymentDate,
      isChecked: true
    },
    {
      id: 'memo',
      name: 'Memo',
      isDisabled: false,
      colDef: this.colDefMemo,
      isChecked: true
    }
  ];
}

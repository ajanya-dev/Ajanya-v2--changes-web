import { ICellRendererParams } from '@ag-grid-community/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogClose } from '@angular/material/dialog';
import { LucideAngularModule } from 'lucide-angular';
import { IPaymentLinksCustomTableRes } from 'src/app/modules/data-table/components/data-table/data-table.model';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { V4DateFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-date-floating-filter/v4-date-floating-filter.component';
import { V4TextFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-text-floating-filter/v4-text-floating-filter.component';
import { V3DataTableComponent } from 'src/app/modules/v3-data-table/components/v3-data-table/v3-data-table.component';
import { V3DataTableModule } from 'src/app/modules/v3-data-table/v3-data-table.module';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';

@Component({
  selector: 'app-payments-modal',
  standalone: true,
  imports: [
    V3DataTableComponent,
    V3DataTableModule,
    LucideAngularModule,
    MatDialogClose
  ],
  templateUrl: './payments-modal.component.html',
  providers: [CurrencyPipe, DatePipe]
})
export class PaymentsModalComponent implements OnInit {
  private v3DataTableService = inject(V3DataTableService);
  private datePipe = inject(DatePipe);
  private currencyPipe = inject(CurrencyPipe);

  dialogData = inject<{
    row: IPaymentLinksCustomTableRes;
  }>(MAT_DIALOG_DATA);

  tableId = DTTableId.paymentLinksCustomPayments;

  frameworkComponents = {
    selectDateComponent: V4DateFloatingFilterComponent,
    searchBoxComponent: V4TextFloatingFilterComponent
  };

  ngOnInit(): void {
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
      return `<div class="flex justify-end pr-4">${this.currencyPipe.transform(param.value)}</div>`;
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

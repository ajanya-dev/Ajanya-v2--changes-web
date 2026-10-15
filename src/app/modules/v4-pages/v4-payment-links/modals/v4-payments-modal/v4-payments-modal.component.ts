import { ICellRendererParams } from '@ag-grid-community/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogClose } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LucideAngularModule } from 'lucide-angular';
import { IPaymentLinksCustomTableRes } from 'src/app/modules/data-table/components/data-table/data-table.model';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { V4DataTableComponent } from 'src/app/modules/v4-data-table/components/v4-data-table/v4-data-table.component';
import { V4TextFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-text-floating-filter/v4-text-floating-filter.component';
import { V4DateFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-date-floating-filter/v4-date-floating-filter.component';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { PaymentSettingsTextCellComponent } from '../../components/v4-e-payment-settings/payment-settings-text-cell.component';

@Component({
  selector: 'app-v4-payments-modal',
  standalone: true,
  imports: [
    V4DataTableComponent,
    LucideAngularModule,
    MatDialogClose,
    MatTooltipModule
  ],
  templateUrl: './v4-payments-modal.component.html',
  providers: [CurrencyPipe, DatePipe]
})
export class V4PaymentsModalComponent implements OnInit {
  private v3DataTableService = inject(V3DataTableService);
  private datePipe = inject(DatePipe);
  private currencyPipe = inject(CurrencyPipe);

  private formatAmount = (value: unknown): string => {
    if (value === null || value === undefined || value === '') return '';
    const numeric =
      typeof value === 'number' ? value : Number(String(value).trim());
    if (!Number.isFinite(numeric)) return String(value);
    return (
      this.currencyPipe.transform(numeric, 'USD', 'symbol', '1.2-2', 'en-US') ??
      ''
    );
  };

  dialogData = inject<{
    row: IPaymentLinksCustomTableRes;
  }>(MAT_DIALOG_DATA);

  tableId = DTTableId.paymentLinksCustomPayments;

  frameworkComponents = {
    selectDateComponent: V4DateFloatingFilterComponent,
    searchBoxComponent: V4TextFloatingFilterComponent,
    textCellComponent: PaymentSettingsTextCellComponent
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
    minWidth: 200,
    flex: 1.2,
    headerName: 'Sender Email',
    field: 'sender_email',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'searchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'textCellComponent'
  };

  colDefAmount = {
    minWidth: 150,
    headerName: 'Amount',
    field: 'amount',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'searchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex justify-end pr-3 text-end v4-amount-col',
    headerClass: 'v4-amount-col',
    cellRenderer: (param: ICellRendererParams) => this.formatAmount(param.value)
  };

  colDefCreatedAt = {
    minWidth: 150,
    headerName: 'Created At',
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
    minWidth: 150,
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
    minWidth: 160,
    flex: 1,
    headerName: 'Memo',
    field: 'memo',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'searchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'textCellComponent'
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

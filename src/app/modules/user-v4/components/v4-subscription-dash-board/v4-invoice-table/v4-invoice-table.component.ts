import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { CellClickedEvent, ICellRendererParams } from '@ag-grid-community/core';
import { CurrencyPipe } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import {
  IInvoiceRowData,
  ILatestInvoice
} from 'src/app/modules/subscription/model/subscription';
import { V4SubscriptionRenewModalComponent } from 'src/app/modules/user-v4/modals/v4-subscription-renew-modal/v4-subscription-renew-modal.component';
import {
  DTTableId,
  TTableIdValues
} from 'src/app/modules/data-table/data/table-id';
import { ICoulmnDefFields } from 'src/app/models/v3-datatable';
import { V4DataTableComponent } from 'src/app/modules/v4-data-table/components/v4-data-table/v4-data-table.component';
import { V4TextFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-text-floating-filter/v4-text-floating-filter.component';
import { V4DateFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-date-floating-filter/v4-date-floating-filter.component';
import {
  invoiceStatusCellRenderer,
  isPayNowClick
} from './v4-invoice-status-cell-renderer/v4-invoice-status-cell-renderer.component';

@Component({
  selector: 'app-v4-invoice-table',
  templateUrl: './v4-invoice-table.component.html',
  styleUrls: ['./v4-invoice-table.component.scss'],
  standalone: true,
  imports: [V4DataTableComponent],
  providers: [CurrencyPipe]
})
export class V4InvoiceTableComponent implements OnDestroy, OnInit {
  private dataTableService = inject(DataTableService);
  private v3DataTableService = inject(V3DataTableService);
  private dialog = inject(MatDialog);
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

  tableId: TTableIdValues = DTTableId.subscriptionInvoice;

  subscriptions: Subscription[] = [];

  invoiceNum: ICoulmnDefFields = {
    headerName: 'Invoice Number',
    field: 'inv_no',
    suppressFloatingFilterButton: true,
    minWidth: 140,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  issuedOn: ICoulmnDefFields = {
    headerName: 'Issued On',
    field: 'inv_date',
    suppressFloatingFilterButton: true,
    minWidth: 140,
    suppressHeaderMenuButton: true,
    floatingFilterComponent: 'selectDateComponent',
    filter: 'agDateColumnFilter',
    floatingFilter: true
  };

  dueOn: ICoulmnDefFields = {
    headerName: 'Due On',
    field: 'inv_due_date',
    suppressFloatingFilterButton: true,
    minWidth: 130,
    maxWidth: 200,
    suppressHeaderMenuButton: true,
    floatingFilterComponent: 'selectDateComponent',
    filter: 'agDateColumnFilter',
    floatingFilter: true
  };

  amount: ICoulmnDefFields = {
    headerName: 'Amount',
    field: 'inv_total',
    suppressFloatingFilterButton: true,
    minWidth: 150,
    maxWidth: 260,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'v4-amount-col flex justify-end pr-3 text-end',
    headerClass: 'v4-amount-col',
    cellRenderer: (params: ICellRendererParams) =>
      this.formatAmount(params.value)
  };

  status = {
    headerName: 'Status',
    minWidth: 150,
    width: 175,
    maxWidth: 300,
    field: 'status',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    pinned: 'right' as const,
    lockPosition: 'right',
    lockPinned: true,
    suppressMovable: true,
    cellClass: 'flex items-center',
    cellRenderer: invoiceStatusCellRenderer,
    onCellClicked: (event: CellClickedEvent) => {
      if (isPayNowClick(event)) {
        this.openRenewalModal(event.data);
      }
    }
  };

  frameworkComponents = {
    SearchBoxComponent: V4TextFloatingFilterComponent,
    selectDateComponent: V4DateFloatingFilterComponent
  };

  columnDefs = [
    this.invoiceNum,
    this.issuedOn,
    this.dueOn,
    this.amount,
    this.status
  ];

  columnFields = [
    {
      id: 'inv_no',
      name: 'Invoice Num',
      isDisabled: true,
      colDef: this.invoiceNum,
      isChecked: true
    },
    {
      id: 'inv_date',
      name: 'Issued On',
      isDisabled: false,
      colDef: this.issuedOn,
      isChecked: true
    },
    {
      id: 'inv_due_date',
      name: 'Due On',
      isDisabled: false,
      colDef: this.dueOn,
      isChecked: true
    },
    {
      id: 'inv_total',
      name: 'Amount',
      isDisabled: false,
      colDef: this.amount,
      isChecked: true
    },
    {
      id: 'status',
      name: 'Status',
      isDisabled: false,
      colDef: this.status,
      isChecked: true
    }
  ];

  ngOnInit(): void {
    this.dataTableService.setDataFromParent(this.columnFields);
    this.v3DataTableService.resetV3DataTablePayload();
    this.v3DataTableService.refreshV3DataTable();
    this.v3DataTableService.v3RowSelectionData = [];
    this.v3DataTableService.gridApi?.deselectAll();
  }

  openRenewalModal(rowData: IInvoiceRowData): void {
    const invoiceData: ILatestInvoice = {
      id: rowData.id,
      invoice_id: rowData.id,
      invoice_number: rowData.inv_no,
      amount: rowData.inv_total,
      due_date: rowData.inv_due_date,
      status: rowData.status,
      mode: 'sync'
    };
    this.dialog.open(V4SubscriptionRenewModalComponent, {
      width: '500px',
      maxWidth: '93%',
      disableClose: true,
      panelClass: 'paddingless-modal-rounded',
      data: invoiceData
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}

import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ICellRendererParams } from '@ag-grid-community/core';
import { Subscription } from 'rxjs';
import { DtSearchBoxComponent } from 'src/app/modules/data-table/components/dt-search-box/dt-search-box.component';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { DataRangeV35Component } from 'src/app/shared/components/date-range-v35/data-range-v35.component';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import {
  DTTableId,
  TTableIdValues
} from 'src/app/modules/data-table/data/table-id';
import { V3DataTableComponent } from '../../../v3-data-table/components/v3-data-table/v3-data-table.component';
import { MatDialog } from '@angular/material/dialog';
import { IInvoiceRowData, ILatestInvoice } from '../../model/subscription';
import { SubscriptionRenewModalComponent } from '../../modals/subscription-renew-modal/subscription-renew-modal.component';
import { InvoiceStatusCellRendererComponent } from './invoice-status-cell-renderer/invoice-status-cell-renderer.component';

@Component({
  selector: 'app-invoice-table-subscription',
  templateUrl: './invoice-table-subscription.component.html',
  styleUrls: ['./invoice-table-subscription.component.scss'],
  standalone: true,
  imports: [V3DataTableComponent]
})
export class InvoiceTableSubscriptionComponent implements OnDestroy, OnInit {
  private dataTableService = inject(DataTableService);
  private v3DataTableService = inject(V3DataTableService);
  private dialog = inject(MatDialog);

  // DATA TABLE VARAIBLES
  public tableId: TTableIdValues = DTTableId.subscriptionInvoice; // Data Table Id

  subscriptions: Subscription[] = [];

  /**
   * @description Represents the 'Invoice Num' column definition.
   */
  invoiceNum = {
    headerName: 'Invoice Num',
    field: 'inv_no',
    suppressFloatingFilterButton: true,
    minWidth: 140,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  /**
   * @description Represents the 'Issued On' column definition.
   */
  issuedOn = {
    headerName: 'Issued On',
    field: 'inv_date',
    suppressFloatingFilterButton: true,
    minWidth: 140,
    suppressHeaderMenuButton: true,
    floatingFilterComponent: 'selectDateComponent',
    filter: 'agDateColumnFilter',
    floatingFilter: true
  };

  /**
   * @description Represents the 'Due On' column definition.
   */
  dueOn = {
    headerName: 'Due On',
    field: 'inv_due_date',
    suppressFloatingFilterButton: true,
    minWidth: 100,
    maxWidth: 260,
    suppressHeaderMenuButton: true,
    floatingFilterComponent: 'selectDateComponent',
    filter: 'agDateColumnFilter',
    floatingFilter: true
  };

  /**
   * @description Represents the 'Amount' column definition.
   */
  amount = {
    headerName: 'Amount',
    field: 'inv_total',
    suppressFloatingFilterButton: true,
    minWidth: 100,
    maxWidth: 260,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'ag-right-aligned-cell pr-3'
  };

  /**
   * @description Represents the 'Status' column definition.
   */
  status = {
    headerName: 'Status',
    minWidth: 100,
    maxWidth: 150,
    field: 'status',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: InvoiceStatusCellRendererComponent,
    cellRendererParams: {
      onPayNow: (rowData: IInvoiceRowData) => this.openRenewalModal(rowData)
    },
    cellRendererForExport: (params: ICellRendererParams) => params?.value
  };

  /**
   * @description Initializes framework components used in the data table.
   */
  frameworkComponents = {
    selectDateComponent: DataRangeV35Component,
    SearchBoxComponent: DtSearchBoxComponent,
    selectBoxComponent: undefined
  };

  /**
   * @description Defines an array of column definitions for the data table.
   */
  columnDefs = [
    this.invoiceNum,
    this.issuedOn,
    this.dueOn,
    this.amount,
    this.status
  ];

  /**
   * @description Defines an array of column field configurations for the data table.
   */
  columnFields = [
    {
      id: 'inv_no',
      name: 'Invioce num',
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

  ngOnInit() {
    /**
     * @description Passes column field data to the DataTableService for use in the data table.
     *
     * @param this.columnFields - An array of column field data to be passed to the DataTableService.
     */
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
    this.dialog.open(SubscriptionRenewModalComponent, {
      width: '500px',
      maxWidth: '93%',
      disableClose: true,
      data: invoiceData
    });
  }

  /**
   * Angular lifecycle hook that is called when the component is destroyed.
   * Unsubscribes from active subscriptions.
   * @returns {void}
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}

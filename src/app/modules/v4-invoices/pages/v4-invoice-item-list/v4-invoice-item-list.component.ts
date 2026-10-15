import { CurrencyPipe } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { V4AddInvoiceItemComponent } from 'src/app/modules/v4-invoices/modals/v4-add-invoice-item/v4-add-invoice-item.component';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { InvoiceService } from 'src/app/shared/service/invoice/invoice.service';
import { IEditInvoice } from 'src/app/modules/invoices/model/invoice';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { V4DataTableComponent } from 'src/app/modules/v4-data-table/components/v4-data-table/v4-data-table.component';
import { V4TextFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-text-floating-filter/v4-text-floating-filter.component';
import { V4PageHeaderComponent } from 'src/app/shared/V4/v4-page-header/v4-page-header.component';
import { IV4HeaderAction } from 'src/app/shared/V4/v4-page-header/v4-page-header.model';
import { V4InvoiceItemActionComponent } from './cell-renderers/v4-invoice-item-action/v4-invoice-item-action.component';
import { V4InvoiceItemTextComponent } from './cell-renderers/v4-invoice-item-text/v4-invoice-item-text.component';

@Component({
  selector: 'app-v4-invoice-item-list',
  templateUrl: './v4-invoice-item-list.component.html',
  styleUrls: ['./v4-invoice-item-list.component.scss'],
  standalone: true,
  imports: [V4DataTableComponent, V4PageHeaderComponent],
  providers: [CurrencyPipe]
})
export class V4InvoiceItemListComponent implements OnInit {
  public tableId = DTTableId.invoiceItemList;

  public dialog = inject(MatDialog);
  readonly alertService = inject(V4AlertService);
  private dataTableService = inject(DataTableService);
  private router = inject(Router);
  private invoiceItem = inject(InvoiceService);
  private v3DataTableService = inject(V3DataTableService);
  private destroyRef = inject(DestroyRef);
  private currencyPipe = inject(CurrencyPipe);

  readonly headerActions: IV4HeaderAction[] = [
    {
      id: 'new',
      text: 'New Invoice Item',
      style: 'primary',
      lucideIcon: 'plus',
      toolTip: 'Create A New Invoice Item'
    }
  ];

  private formatAmount(value: unknown): string {
    if (value === null || value === undefined || value === '') return '';
    const numeric = Number(value);
    if (Number.isNaN(numeric)) return String(value);
    return (
      this.currencyPipe.transform(numeric, 'USD', 'symbol', '1.2-2', 'en-US') ??
      ''
    );
  }

  onHeaderAction(id: string | number): void {
    if (id === 'new') this.openInvoiceItem();
  }

  public frameworkComponents = {
    v4InvoiceItemActionComponent: V4InvoiceItemActionComponent,
    v4InvoiceItemTextComponent: V4InvoiceItemTextComponent,
    SearchBoxComponent: V4TextFloatingFilterComponent
  };


  colDefAction = {
    headerName: 'Action',
    sortable: false,
    field: 'action',
    suppressFloatingFilterButton: true,
    minWidth: 100,
    maxWidth: 120,
    pinned: 'left' as const,
    lockPosition: true,
    lockPinned: true,
    suppressMovable: true,
    cellClass: 'pl-1',
    cellRenderer: 'v4InvoiceItemActionComponent',
    cellRendererParams: () => ({
      onActionClick: (row: IEditInvoice, label: string) =>
        this.handleItemAction(row, label)
    }),
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefItemName = {
    headerName: 'Item Name',
    field: 'item_name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 160,
    flex: 1,
    cellRenderer: 'v4InvoiceItemTextComponent'
  };

  colDefItemPrice = {
    headerName: 'Item Price',
    field: 'unit_price',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 150,
    maxWidth: 200,
    cellClass: 'flex justify-end pr-3 text-end v4-amount-col',
    headerClass: 'v4-amount-col',
    cellRenderer: 'v4InvoiceItemTextComponent',
    cellRendererParams: { alignEnd: true },
    valueFormatter: (params: { value: unknown }) =>
      this.formatAmount(params.value)
  };

  colDefStock = {
    headerName: 'Instock Qty',
    field: 'stock',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 140,
    cellRenderer: 'v4InvoiceItemTextComponent'
  };

  colDefNote = {
    headerName: 'Note',
    field: 'private_note',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 150,
    flex: 1,
    cellRenderer: 'v4InvoiceItemTextComponent'
  };

  colDefDescription = {
    headerName: 'Description',
    field: 'note',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 170,
    flex: 1.2,
    cellRenderer: 'v4InvoiceItemTextComponent'
  };

  columnDefs = [
    this.colDefAction,
    this.colDefItemName,
    this.colDefItemPrice,
    this.colDefStock,
    this.colDefNote,
    this.colDefDescription
  ];

  columnFields = [
    {
      id: 'id_action',
      name: 'Action',
      colDef: this.colDefAction,
      isChecked: true,
      isDisabled: true
    },
    {
      id: 'id_item_name',
      name: 'Item Name',
      colDef: this.colDefItemName,
      isChecked: true,
      isDisabled: true
    },
    {
      id: 'id_item_price',
      name: 'Item Price',
      colDef: this.colDefItemPrice,
      isChecked: true,
      isDisabled: false
    },
    {
      id: 'id_stock',
      name: 'Instock Qty',
      colDef: this.colDefStock,
      isChecked: true,
      isDisabled: false
    },
    {
      id: 'id_note',
      name: 'Note',
      colDef: this.colDefNote,
      isChecked: true,
      isDisabled: false
    },
    {
      id: 'id_description',
      name: 'Description',
      colDef: this.colDefDescription,
      isChecked: true,
      isDisabled: false
    }
  ];

  ngOnInit(): void {
    this.v3DataTableService.resetV3DataTablePayload();
    this.dataTableService.setDataFromParent(this.columnFields);
    this.refreshDataTable();
  }

  refreshDataTable(): void {
    this.v3DataTableService.refreshV3DataTable();
    this.v3DataTableService.v3RowSelectionData = [];
    this.v3DataTableService.gridApi?.deselectAll();
  }

  handleItemAction(row: IEditInvoice, label: string): void {
    switch (label) {
      case 'Edit':
        this.onEditRow(row);
        break;
      case 'Delete':
        this.onDeleteRow(row);
        break;
      default:
        break;
    }
  }

  cellRendererActionClick(event: { id: string; selectedRow: IEditInvoice }) {
    const selectedItem = event.selectedRow;
    switch (event.id) {
      case 'id_EditRow':
        this.onEditRow(selectedItem);
        break;
      case 'id_DeleteRow':
        this.onDeleteRow(selectedItem);
        break;
      default:
        break;
    }
  }

  navigateBack(): void {
    this.router.navigate(['/v4/manage/invoice']);
  }

  openInvoiceItem() {
    this.dialog.open(V4AddInvoiceItemComponent, {
      maxWidth: '480px',
      width: '95%',
      panelClass: 'paddingless-modal-rounded',
      disableClose: true
    });
  }

  onEditRow(selectedRow: IEditInvoice) {
    this.dialog
      .open(V4AddInvoiceItemComponent, {
        maxWidth: '480px',
        width: '95%',
        panelClass: 'paddingless-modal-rounded',
        disableClose: true,
        data: selectedRow
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.refreshDataTable();
        }
      });
  }

  onDeleteRow(selectedRow: IEditInvoice) {
    const confirm = this.alertService.confirmAlert({
      content: 'Are you sure you want to delete?'
    });

    confirm
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result) {
          this.invoiceItem
            .deleteinvoiceitem(selectedRow.action)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((res) => {
              if (res.success) {
                this.alertService.successAlert({
                  title: 'Success',
                  content: 'Invoice item deleted',
                  timeout: 2000,
                  close: true
                });
                this.refreshDataTable();
              }
            });
        }
      });
  }
}

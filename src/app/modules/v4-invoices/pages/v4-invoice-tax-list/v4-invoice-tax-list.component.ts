import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import {
  ColDef,
  ColGroupDef,
  ValueFormatterParams
} from '@ag-grid-community/core';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { InvoiceService } from 'src/app/shared/service/invoice/invoice.service';
import { IApiResMesssage } from 'src/app/models/api';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { V4AddInvoiceTaxComponent } from 'src/app/modules/v4-invoices/modals/v4-add-invoice-tax/v4-add-invoice-tax.component';
import { ICellselectedRow } from 'src/app/modules/invoices/model/invoice';
import { V4DataTableComponent } from 'src/app/modules/v4-data-table/components/v4-data-table/v4-data-table.component';
import { V4TextFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-text-floating-filter/v4-text-floating-filter.component';
import { V4PageHeaderComponent } from 'src/app/shared/V4/v4-page-header/v4-page-header.component';
import { IV4HeaderAction } from 'src/app/shared/V4/v4-page-header/v4-page-header.model';
import { V4InvoiceTaxActionComponent } from './cell-renderers/v4-invoice-tax-action/v4-invoice-tax-action.component';
import { V4InvoiceTaxTextComponent } from './cell-renderers/v4-invoice-tax-text/v4-invoice-tax-text.component';

@Component({
  selector: 'app-v4-invoice-tax-list',
  templateUrl: './v4-invoice-tax-list.component.html',
  styleUrls: ['./v4-invoice-tax-list.component.scss'],
  standalone: true,
  imports: [V4DataTableComponent, V4PageHeaderComponent]
})
export class V4InvoiceTaxListComponent implements OnInit {
  public tableId = DTTableId.invoiceTaxList;

  private v3DataTableService = inject(V3DataTableService);
  public dialog = inject(MatDialog);
  readonly alertService = inject(V4AlertService);
  private dataTableService = inject(DataTableService);
  private router = inject(Router);
  private invoiceTax = inject(InvoiceService);
  private destroyRef = inject(DestroyRef);

  readonly headerActions: IV4HeaderAction[] = [
    {
      id: 'new',
      text: 'New Invoice Tax',
      style: 'primary',
      lucideIcon: 'plus',
      toolTip: 'Create A New Invoice Tax'
    }
  ];

  onHeaderAction(id: string | number): void {
    if (id === 'new') this.openInvoiceTax();
  }

  public frameworkComponents = {
    v4InvoiceTaxActionComponent: V4InvoiceTaxActionComponent,
    v4InvoiceTaxTextComponent: V4InvoiceTaxTextComponent,
    SearchBoxComponent: V4TextFloatingFilterComponent
  };


  colDefAction = {
    headerName: 'Action',
    field: 'id',
    colId: 'action',
    suppressFloatingFilterButton: true,
    minWidth: 100,
    maxWidth: 120,
    sortable: false,
    pinned: 'left' as const,
    lockPosition: true,
    lockPinned: true,
    suppressMovable: true,
    cellClass: 'pl-1',
    cellRenderer: 'v4InvoiceTaxActionComponent',
    cellRendererParams: () => ({
      onActionClick: (row: ICellselectedRow, label: string) =>
        this.handleTaxAction(row, label)
    }),
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefTaxName = {
    headerName: 'Tax Name',
    field: 'tax_name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 160,
    flex: 1,
    cellRenderer: 'v4InvoiceTaxTextComponent'
  };

  colDefTaxPercentage = {
    headerName: 'Tax in Percentage',
    field: 'tax_percentage',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 190,
    cellClass: 'flex justify-end pr-3 text-end v4-amount-col',
    headerClass: 'v4-amount-col',
    cellRenderer: 'v4InvoiceTaxTextComponent',
    cellRendererParams: { alignEnd: true },
    valueFormatter: (params: ValueFormatterParams) =>
      params.value != null ? `${params.value}%` : ''
  };

  colDefNote = {
    headerName: 'Note',
    field: 'note',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 150,
    flex: 1.2,
    cellRenderer: 'v4InvoiceTaxTextComponent'
  };

  columnDefs: (ColDef | ColGroupDef)[] = [
    this.colDefAction,
    this.colDefTaxName,
    this.colDefTaxPercentage,
    this.colDefNote
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
      id: 'id_tax_name',
      name: 'Tax Name',
      colDef: this.colDefTaxName,
      isChecked: true,
      isDisabled: true
    },
    {
      id: 'id_tax_percentage',
      name: 'Tax in Percentage',
      colDef: this.colDefTaxPercentage,
      isChecked: true,
      isDisabled: false
    },
    {
      id: 'id_note',
      name: 'Note',
      colDef: this.colDefNote,
      isChecked: true,
      isDisabled: false
    }
  ];

  ngOnInit(): void {
    this.v3DataTableService.resetV3DataTablePayload();
    this.dataTableService.setDataFromParent(this.columnFields);
  }

  handleTaxAction(row: ICellselectedRow, label: string): void {
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

  cellRendererActionClick(event: {
    id: string;
    selectedRow: ICellselectedRow;
  }) {
    const selectedItem = event.selectedRow;
    switch (event.id) {
      case 'editRow':
        this.onEditRow(selectedItem);
        break;
      case 'deleteRow':
        this.onDeleteRow(selectedItem);
        break;
      default:
        break;
    }
  }

  navigateBack(): void {
    this.router.navigate(['/v4/manage/invoice']);
  }

  openInvoiceTax() {
    this.dialog.open(V4AddInvoiceTaxComponent, {
      maxWidth: '480px',
      width: '95%',
      panelClass: 'paddingless-modal-rounded'
    });
  }

  onEditRow(selectedItem: ICellselectedRow) {
    this.dialog.open(V4AddInvoiceTaxComponent, {
      maxWidth: '480px',
      width: '95%',
      panelClass: 'paddingless-modal-rounded',
      data: selectedItem
    });
  }

  onDeleteRow(selectedItem: ICellselectedRow) {
    const confirm = this.alertService.confirmAlert({
      content: 'Are you sure you want to delete?'
    });

    confirm
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result) {
          this.invoiceTax
            .deleteTax(selectedItem.id)
            .pipe(
              catchError((error) => {
                this.alertService.warningAlert({
                  title: 'Warning',
                  content: error.error?.errorMsg
                });
                return of(false);
              }),
              takeUntilDestroyed(this.destroyRef)
            )
            .subscribe((res) => {
              if ((res as IApiResMesssage).success === true) {
                this.v3DataTableService.refreshV3DataTable();
                this.alertService.successAlert({
                  title: 'Success',
                  content: 'Tax deleted',
                  timeout: 2000,
                  close: true
                });
              }
            });
        }
      });
  }
}

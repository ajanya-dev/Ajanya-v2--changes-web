import { Component, OnDestroy, OnInit, computed, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import {
  IDtActionCompProp,
  IDtFloatingFilterProp
} from 'src/app/modules/data-table/model/datatable';
import { AddInvoiceItemComponent } from 'src/app/shared/modal/invoice-modal/add-invoice-item/add-invoice-item.component';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { InvoiceService } from 'src/app/shared/service/invoice/invoice.service';
import { IEditInvoice } from 'src/app/modules/invoices/model/invoice';
import { DtActionComponent } from '../../../data-table/components/dt-action/dt-action.component';
import { DtSearchBoxComponent } from '../../../data-table/components/dt-search-box/dt-search-box.component';
import { ComponentType } from '@angular/cdk/portal';
import { IV3DtHeaderElements } from 'src/app/modules/v3-data-table/models/v3-data-table';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { V3DataTableComponent } from '../../../v3-data-table/components/v3-data-table/v3-data-table.component';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';

@Component({
  selector: 'app-invoice-item-list',
  templateUrl: './invoice-item-list.component.html',
  styleUrls: ['./invoice-item-list.component.scss'],
  standalone: true,
  imports: [V3DataTableComponent]
})
export class InvoiceItemListComponent implements OnDestroy, OnInit {
  public tableId = DTTableId.invoiceItemList; // Data Table Id

  FloatingFilterComponent: IDtFloatingFilterProp;
  cellRendererId: string;
  subscriptions: Subscription[] = [];
  err_msg: string;

  public dialog = inject(MatDialog);
  public alertService = inject(AlertService);
  private dataTableService = inject(DataTableService);
  private router = inject(Router);
  private invoiceItem = inject(InvoiceService);
  private v3DataTableService = inject(V3DataTableService);

  deselectedColumns: string[] = this.defaultDeselectedColumns();

  defaultDeselectedColumns() {
    if (window.innerWidth < 768) {
      return [
        'view',
        'status',
        'source_name',
        'source.source',
        'updated_at',
        'reference_no',
        'created_by',
        'description'
      ];
    }
    if (window.innerWidth < 1100) {
      return ['source_name', 'source.source', 'created_by', 'description'];
    }
    return [];
  }

  public headerElements = computed<IV3DtHeaderElements>(() => ({
    buttons: [
      {
        text: 'New',
        id: 'id_new',
        isAddIcon: true,
        icon: ['fas', 'plus'],
        backGroundInput: 'var(--common-green-color)',
        type: 'list',
        toolTip: 'Create new deposite slip'
      }
    ],
    topRightButtons: [
      {
        text: 'Invoice',
        id: 'invoice',
        isAddIcon: true,
        icon: ['fas', 'list-alt'],
        type: { name: 'list', style: 'green' },
        backGroundInput: 'transparent',
        customClasses: 'font-extralight p-0',
        disableHoverEffect: false
      }
    ]
  }));

  frameworkComponents: Record<string, ComponentType<unknown>> = {
    actionComponent: DtActionComponent,
    SearchBoxComponent: DtSearchBoxComponent
  };

  cellRenderer: { action: { name: string; id: string; icon: string }[] } = {
    action: [
      {
        name: 'Edit',
        id: 'id_EditRow',
        icon: 'fa fa-edit'
      },
      {
        name: 'Delete',
        id: 'id_DeleteRow',
        icon: 'fa fa-trash'
      }
    ]
  };

  /**
   * Data Table Column Fields
   */
  colDefId = {
    maxWidth: 50,
    headerName: '',
    sortable: false,
    field: 'id',
    suppressFloatingFilterButton: true,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    lockPosition: true,
    headerCheckboxSelection: true,
    checkboxSelection: true,
    showDisabledCheckboxes: true,
    cellRenderer: () => '',
    headerClass: 'pl-3.5',
    cellClass: 'flex justify-center',
    pinned: 'left'
  };

  colDefDate = {
    headerName: 'Item Name',
    field: 'item_name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent', // SearchBoxComponent
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 100,
  };

  colDefFrom = {
    headerName: 'Instock Qty',
    field: 'stock',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent', // SearchBoxComponent
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 100,
  };

  colDefCreditNo = {
    headerName: 'Item Price',
    field: 'unit_price',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent', // SearchBoxComponent
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 100,
  };

  colDefpayeeName = {
    headerName: 'Note',
    field: 'private_note',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent', // SearchBoxComponent
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 100,
  };

  colDefAmount = {
    headerName: 'Description',
    field: 'note',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent', // SearchBoxComponent
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 100,
  };
  colDefAction = {
    headerName: 'Action',
    sortable: false,
    field: 'action',
    suppressFloatingFilterButton: true,
    maxWidth: 120,
    minWidth: 100,
    cellRenderer: 'actionComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
  };

  columnDefs = [
    this.colDefId,
    this.colDefDate,
    this.colDefCreditNo,
    this.colDefFrom,
    this.colDefpayeeName,
    this.colDefAmount,
    this.colDefAction
  ];

  /**
   * Pass field data
   */
  columnFields = [
    {
      id: 'id',
      name: '#',
      colDef: this.colDefId,
      isChecked: true,
      isDisabled: true
    },
    {
      id: 'id_date',
      name: 'Item Name',
      colDef: this.colDefDate,
      isChecked: true,
      isDisabled: true
    },
    {
      id: 'id_invoice_no',
      name: 'Item Price',
      colDef: this.colDefCreditNo,
      isChecked: true
    },
    {
      id: 'id_from',
      name: 'Instock Qty',
      colDef: this.colDefFrom,
      isChecked: true
    },
    {
      id: 'id_payeeName',
      name: 'Note',
      colDef: this.colDefpayeeName,
      isChecked: true
    },
    {
      id: 'id_amount',
      name: 'Description',
      colDef: this.colDefAmount,
      isChecked: true
    },
    {
      id: 'id_action',
      name: 'Action',
      colDef: this.colDefAction,
      isChecked: true,
      isDisabled: true
    }
  ];

  actionComponentProp: IDtActionCompProp = {
    actionButton: true,
    eyeButton: false
  };

  ngOnInit(): void {
    this.v3DataTableService.resetV3DataTablePayload();
    // PASS DATAS TO DATA TABLE SERVICE
    this.dataTableService.setDataFromParent(
      this.columnFields,
      this.FloatingFilterComponent,
      this.cellRenderer,
      this.actionComponentProp
    );

    this.refreshDataTable();
  }

  refreshDataTable(): void {
    this.v3DataTableService.refreshV3DataTable();
    this.v3DataTableService.v3RowSelectionData = [];
    this.v3DataTableService.gridApi?.deselectAll();
  }

  /**
   * Find which cell action button is clicked (Eye button or Action button)
   */
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

  /**
   * Find which header button is clicked
   */
  headerButtonClick(event: { id: string; selectedRows: IEditInvoice[] }) {
    /**  {
       selectedRow: ==> selected row id
        id:          ==> selected button id
    } */

    switch (event.id) {
      case 'id_new':
        this.openinvoiceitem();
        break;
      case 'invoice':
        this.openinvoice();
        break;
      default:
        break;
    }
  }

  /**
   * Find which action button is clicked
   */
  openinvoiceitem() {
    this.dialog.open(AddInvoiceItemComponent, {
      maxWidth: '310px',
      width: '53%'
    });
  }

  openinvoice() {
    this.router.navigate(['/manage/invoice']);
  }

  /**
   * Delete
   */
  onDeleteRow(selectedRow: IEditInvoice) {
    const data = {
      content: 'Are you sure you want to delete?'
    };

    const confirm = this.alertService.confirmAlert(data);

    confirm.afterClosed().subscribe((result) => {
      if (result) {
        this.subscriptions.push(
          this.invoiceItem
            .deleteinvoiceitem(selectedRow.action)
            .subscribe((res) => {
              const successData = {
                title: 'Success',
                content: 'Invoice item deleted',
                timeout: 2000,
                close: true
              };

              if (res.success) {
                this.dataTableService.setRefreshStatus(true);
                this.alertService.successAlert(successData);
                this.refreshDataTable();
              }
            })
        );
      }
    });
  }

  /**
   * Edit
   */
  onEditRow(selectedRow: IEditInvoice) {
    this.dialog.open(AddInvoiceItemComponent, {
      maxWidth: '310px',
      width: '57%',
      data: selectedRow
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}

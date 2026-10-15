import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ColDef, ColGroupDef } from '@ag-grid-community/core';
import { of, Subscription } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { InvoiceService } from 'src/app/shared/service/invoice/invoice.service';
import { DataRangeV35Component } from 'src/app/shared/components/date-range-v35/data-range-v35.component';
import { IApiResMesssage } from 'src/app/models/api';
import { IV3DtHeaderElements } from 'src/app/modules/v3-data-table/models/v3-data-table';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { DtActionComponent } from '../../../data-table/components/dt-action/dt-action.component';
import { DtSearchBoxComponent } from '../../../data-table/components/dt-search-box/dt-search-box.component';
import { AddInvoiceTaxComponent } from '../../modals/add-invoice-tax/add-invoice-tax.component';
import {
  ICelRendererActionEvent,
  ICellselectedRow,
  IFloatingFilterComponent,
  IInvoiceColumnFields,
  IInvoiceTaxlistHeaderButtonEvent,
  IactionComponentProp,
  IcellRendererInvoice
} from '../../model/invoice';
import { V3DataTableComponent } from '../../../v3-data-table/components/v3-data-table/v3-data-table.component';

/**
 * Data table column fields
 */
const colDefId = {
  headerName: '',
  field: 'id',
    suppressFloatingFilterButton: true,
  maxWidth: 50,
  checkboxSelection: true,
  floatingFilterComponent: 'headerCheckBoxComponent',
  filter: 'agTextColumnFilter',
  sortable: false,
  floatingFilter: true,
  suppressHeaderMenuButton: true,
  lockPosition: true,
  resizable: false,
  headerClass: 'pl-[8px]',
  headerCheckboxSelection: true,
  showDisabledCheckboxes: true,
  pinned: 'left' as const,
  cellClass: 'flex flex-col justify-center pl-[6px]',
  cellRenderer: () => ''
};

const colDefDate = {
  headerName: 'Tax Name',
  field: 'tax_name',
    suppressFloatingFilterButton: true,
  floatingFilterComponent: 'SearchBoxComponent', // SearchBoxComponent
  filter: 'agTextColumnFilter',
  floatingFilter: true,
  suppressHeaderMenuButton: true,
};

const colDefpayeeName = {
  headerName: 'Tax in Percentage',
  field: 'tax_percentage',
    suppressFloatingFilterButton: true,
  floatingFilterComponent: 'SearchBoxComponent', // SearchBoxComponent
  filter: 'agTextColumnFilter',
  floatingFilter: true,
  suppressHeaderMenuButton: true,
};

const colDefAmount = {
  headerName: 'Note',
  field: 'note',
    suppressFloatingFilterButton: true,
  floatingFilterComponent: 'SearchBoxComponent', // SearchBoxComponent
  filter: 'agTextColumnFilter',
  floatingFilter: true,
  suppressHeaderMenuButton: true,
};

const colDefAction = {
  headerName: 'Action',
  field: 'id',
    suppressFloatingFilterButton: true,
  maxWidth: 120,
  sortable: false,
  cellRenderer: 'actionComponent',
  floatingFilter: true,
  suppressHeaderMenuButton: true,
};

@Component({
  selector: 'app-invoice-tax-list',
  templateUrl: './invoice-tax-list.component.html',
  styleUrls: ['./invoice-tax-list.component.scss'],
  standalone: true,
  imports: [V3DataTableComponent]
})
export class InvoiceTaxListComponent implements OnInit, OnDestroy {
  // EXTERNAL CHILD COMPONENTS
  public frameworkComponents = {
    actionComponent: DtActionComponent,
    SearchBoxComponent: DtSearchBoxComponent,
    selectDateComponent: DataRangeV35Component
  };

  public tableId = DTTableId.invoiceTaxList; // Data Table Id
  FloatingFilterComponent: IFloatingFilterComponent;
  cellRendererId: string;
  subscriptions: Subscription[] = [];
  err_msg: string;

  private v3DataTableService = inject(V3DataTableService);
  public dialog = inject(MatDialog);
  public alertService = inject(AlertService);
  private dataTableService = inject(DataTableService);
  private router = inject(Router);
  private invoiceTax = inject(InvoiceService);

  /** ************************HEADER ELEMENTS PROPERTIES ******************************* */

  headerElements: IV3DtHeaderElements = {
    buttons: [
      {
        text: ' New',
        id: 'id_new',
        icon: ['fas', 'plus'],
        type: 'list',
        backGroundInput: 'var(--common-green-color)',
        isAddIcon: true
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
  };

  /**
   * Cel renderer component
   */
  cellRenderer: IcellRendererInvoice = {
    action: [
      {
        name: 'Edit',
        id: 'editRow',
        icon: 'fa fa-edit'
      },
      {
        name: 'Delete',
        id: 'deleteRow',
        icon: 'fa fa-trash'
      }
    ]
  };

  /**
   * Set column fields
   */
  columnDefs: (ColDef | ColGroupDef)[] = [
    colDefId,
    colDefDate,
    colDefpayeeName,
    colDefAmount,
    colDefAction
  ];

  /**
   * Pass field data
   */
  columnFields: IInvoiceColumnFields[] = [
    {
      id: 'id',
      name: '#',
      colDef: colDefId,
      isChecked: true,
      isDisabled: true
    },
    {
      id: 'id_date',
      name: 'Tax Name',
      colDef: colDefDate,
      isChecked: true,
      isDisabled: false
    },
    {
      id: 'id_payeeName',
      name: 'Tax in Percentage',
      colDef: colDefpayeeName,
      isChecked: true,
      isDisabled: false
    },
    {
      id: 'id_amount',
      name: 'Note',
      colDef: colDefAmount,
      isChecked: true,
      isDisabled: false
    },
    {
      id: 'id_action',
      name: 'Action',
      colDef: colDefAction,
      isChecked: true,
      isDisabled: true
    }
  ];

  /**
   * Action component properties
   */
  actionComponentProp: IactionComponentProp = {
    actionButton: true,
    eyeButton: false
  };

  ngOnInit(): void {
    /**
     * Pass data to data table service
     */
    this.dataTableService.setDataFromParent(
      this.columnFields,
      this.FloatingFilterComponent,
      this.cellRenderer,
      this.actionComponentProp
    );
  }

  /**
   * @description Find which cell Action button is clicked (Eye button or Action button)
   * @param event -Param for the Method
   */
  cellRendererActionClick(event: ICelRendererActionEvent) {
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

  /**
   * @description Find which header button is clicked
   * @param event -Param for the method
   */
  headerButtonClick(event: IInvoiceTaxlistHeaderButtonEvent) {
    /**  {
     selectedRow: ==> selected row id
      id:          ==> selected button id
  } */

    switch (event.id) {
      case 'id_new':
        this.openinvoicetax();
        break;
      case 'invoice':
        this.openinvoice();
        break;
      default:
        break;
    }
  }

  /**
   * Opens invoice tax component
   */
  openinvoicetax() {
    this.dialog.open(AddInvoiceTaxComponent, {
      maxWidth: '310px',
      width: '53%'
    });
  }

  /**
   * Navigation to invoice page
   */
  openinvoice() {
    this.router.navigate(['/manage/invoice']);
  }

  /**
   * @description Handles row edit
   * @param selectedItem -Param for the method
   */
  onEditRow(selectedItem: ICellselectedRow) {
    this.dialog.open(AddInvoiceTaxComponent, {
      maxWidth: '310px',
      width: '57%',
      data: selectedItem
    });
  }

  /**
   * Delete tax
   */
  onDeleteRow(selectedItem: ICellselectedRow) {
    const alertData = {
      content: 'Are you sure you want to delete?'
    };

    const confirm = this.alertService.confirmAlert(alertData);

    confirm.afterClosed().subscribe((result) => {
      if (result) {
        this.subscriptions.push(
          this.invoiceTax
            .deleteTax(selectedItem.id)
            .pipe(
              catchError((error) => {
                this.err_msg = error.error.errorMsg;
                return of(false);
              })
            )
            .subscribe((res) => {
              const data = {
                title: 'Success',
                content: 'Tax deleted ',
                timeout: 2000,
                close: true
              };

              const Wdata = {
                title: 'Warning',
                content: this.err_msg,
                doneMsg: 'OK',
                cancelMsg: 'cancel'
              };

              if (res === false) {
                this.alertService.warningAlert(Wdata);
              }

              if ((res as IApiResMesssage).success === true) {
                this.v3DataTableService.refreshV3DataTable();
                this.alertService.successAlert(data);
              }
            })
        );
      }
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}

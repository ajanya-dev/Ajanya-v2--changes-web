import { Component, OnInit, computed, inject, signal } from '@angular/core';
import {
  IDtColumnFields,
  IDtFloatingFilterProp
} from 'src/app/modules/data-table/model/datatable';
import { DtActionComponent } from 'src/app/modules/data-table/components/dt-action/dt-action.component';
import { DtSearchBoxComponent } from 'src/app/modules/data-table/components/dt-search-box/dt-search-box.component';
import { DtSelectAllCheckBoxComponent } from 'src/app/modules/data-table/components/dt-select-all-check-box/dt-select-all-check-box.component';
import { Router } from '@angular/router';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { ShippingLabelService } from 'src/app/shared/service/shipping-label/shipping-label.service';
import { Subscription } from 'rxjs';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { MatDialog } from '@angular/material/dialog';
import { DataRangeV35Component } from 'src/app/shared/components/date-range-v35/data-range-v35.component';
import { IV3DtHeaderElements } from 'src/app/modules/v3-data-table/models/v3-data-table';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { V3DataTableSelectBoxComponent } from '../../../../../shared/v3/dt-cellrenderers/v3-data-table-select-box/v3-data-table-select-box.component';
import { IRowData } from '../../model/shipping-label';
import { ViewShippingLabelComponent } from '../../modals/view-shipping-label/view-shipping-label.component';
import { V3DataTableComponent } from '../../../../v3-data-table/components/v3-data-table/v3-data-table.component';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';

@Component({
  selector: 'app-shipping-label-list',
  templateUrl: './shipping-label-list.component.html',
  styleUrls: ['./shipping-label-list.component.scss'],
  standalone: true,
  imports: [V3DataTableComponent]
})
export class ShippingLabelListComponent implements OnInit {
  private dataTableService = inject(DataTableService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private shippingLabelService = inject(ShippingLabelService);
  private alertService = inject(AlertService);
  private v3DataTableService = inject(V3DataTableService);

  public tableId = DTTableId.shippingLabel; // Data Table Id
  subscriptions: Subscription[] = [];
  isPrintLoading = signal<boolean>(false);

  ngOnInit(): void {
    this.dataTableService.setDataFromParent(
      this.columnFields,
      this.FloatingFilterComponent,
      this.cellRenderer,
      this.actionComponentProp
    );
    this.v3DataTableService.resetV3DataTablePayload();
    this.v3DataTableService.refreshV3DataTable();
    this.v3DataTableService.v3RowSelectionData = [];
    this.v3DataTableService.gridApi?.deselectAll();
  }

  frameworkComponents = {
    headerCheckBoxComponent: DtSelectAllCheckBoxComponent,
    selectBoxComponent: V3DataTableSelectBoxComponent,
    selectDateComponent: DataRangeV35Component,
    actionComponent: DtActionComponent,
    SearchBoxComponent: DtSearchBoxComponent
  };

  actionComponentProp = {
    actionButton: true,
    eyeButton: true
  };

  colDefId = {
    maxWidth: 50,
    minWidth: 20,
    headerName: '',
    sortable: false,
    field: 'id',
    suppressFloatingFilterButton: true,
    suppressHeaderMenuButton: true,
    lockPosition: true,
    headerCheckboxSelection: true,
    checkboxSelection: true,
    showDisabledCheckboxes: true,
    headerClass: 'pl-3.5',
    cellClass: 'flex justify-center',
    pinned: 'left',
    cellRenderer: () => ''
  };

  colDefPayee = {
    minWidth: 80,
    headerName: 'Payee Name',
    field: 'name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
  };

  colDefDate = {
    minWidth: 180,
    maxWidth: 180,
    headerName: 'Date',
    field: 'shipping_payment_details.created_at',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectDateComponent',
    filter: 'agDateColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: (params: { data: { created_at: string } }) =>
      params.data.created_at
  };

  colDefPayeeAddr = {
    minWidth: 120,
    headerName: 'Payee Address',
    field: 'address1',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
  };

  colTrackingNo = {
    minWidth: 80,
    headerName: 'Tracking Number',
    field: 'tracking_number',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    floatingFilterComponent: 'SearchBoxComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
  };

  colDefShippType = {
    minWidth: 130,
    headerName: 'Shipping Type(Usps/Fedex)',
    field: 'shipping_type',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
  };

  colDefComment = {
    minWidth: 80,
    headerName: 'Comment',
    field: 'comment',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
  };

  colDefAction = {
    minWidth: 80,
    headerName: 'Action',
    field: 'action',
    suppressFloatingFilterButton: true,
    maxWidth: 150,
    sortable: false,
    cellRenderer: 'actionComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
  };

  public headerElements = computed<IV3DtHeaderElements>(() => ({
    buttons: [
      {
        text: 'New',
        id: 'id_btnNew',
        icon: ['fas', 'plus'],
        backGroundInput: 'var(--common-green-color)',
        type: 'list',
        isAddIcon: true,
        toolTip: 'New Shipping Label'
      },
      {
        text: 'Quick Label',
        id: 'id_quicklabel',
        icon: ['fas', 'tags'],
        type: 'list',
        isAddIcon: true,
        toolTip: 'Quick Label'
      },
      {
        text: 'Print',
        id: 'id_printlabel',
        icon: ['fas', 'print'],
        type: 'list',
        isAddIcon: true,
        toolTip: 'Print Label',
        loading: this.isPrintLoading()
      },
      {
        id: 'id_btndelete',
        roundIcon: ['fas', 'trash'],
        customClasses: 'bg-common-secondary-red-color text-common-red-color',
        toolTip: 'Delete your label'
      }
    ]
  }));

  columnDefs = [
    this.colDefId,
    this.colDefPayee,
    this.colDefDate,
    this.colDefPayeeAddr,
    this.colTrackingNo,
    this.colDefShippType,
    this.colDefComment,
    this.colDefAction
  ];

  FloatingFilterComponent: IDtFloatingFilterProp = {
    selectBox: [
      {
        id: 'shipping_type',

        values: [
          { value: 'USPS', name: 'USPS' },
          { value: 'Fedex', name: 'Fedex' }
        ]
      }
    ],
    selectDate: [
      {
        id: 'shipping_payment_details.created_at',
        initialRange: 'All Time',
        isPrimary: true
      }
    ]
  };

  columnFields: IDtColumnFields[] = [
    {
      id: 'id',
      name: '#',
      isDisabled: true,
      colDef: this.colDefId,
      isChecked: true
    },
    {
      id: 'id_payee',
      name: 'Payee Name',
      isDisabled: true,
      colDef: this.colDefPayee,
      isChecked: true
    },
    {
      id: 'id_date',
      name: 'Date',
      isDisabled: false,
      colDef: this.colDefDate,
      isChecked: true
    },
    {
      id: 'id_address',
      name: 'Payee Address',
      isDisabled: false,
      colDef: this.colDefPayeeAddr,
      isChecked: true
    },
    {
      id: 'id_trackNo',
      name: 'Tracking Number',
      isDisabled: false,
      colDef: this.colTrackingNo,
      isChecked: true
    },

    {
      id: 'id_type',
      name: 'Shipping Type',
      isDisabled: false,
      colDef: this.colDefShippType,
      isChecked: true
    },
    {
      id: 'id_comment',
      name: 'Comment',
      isDisabled: false,
      colDef: this.colDefComment,
      isChecked: true
    },
    {
      id: 'id_action',
      name: 'Action',
      isDisabled: false,
      colDef: this.colDefAction,
      isChecked: true
    }
  ];

  cellRenderer = {
    action: [
      {
        name: 'Print',
        id: 'RId_print',
        icon: 'fa fa-print'
      },
      {
        name: 'Delete',
        id: 'RId_delete',
        icon: 'fa fa-trash'
      }
    ]
  };

  /**
   * @description Header button click.
   */
  headerButtonClick(event: { selectedRows: IRowData[]; id: string }) {
    const selectedItems = event.selectedRows;
    const ids: string[] = [];
    selectedItems.forEach((val) => {
      ids.push(val.action);
    });

    switch (event.id) {
      case 'id_btnNew':
        this.createShippingLabel();
        break;

      case 'id_quicklabel':
        this.openQuickLabel();
        break;

      case 'id_printlabel':
        if (!selectedItems.length) {
          this.alertService.warningAlert({
            title: 'Error',
            content: 'Please select shipping labels to print.'
          });
        } else {
          this.printShippingLabel(ids);
        }
        break;

      case 'id_btndelete':
        if (!selectedItems.length) {
          this.alertService.warningAlert({
            title: 'Error',
            content: 'Please select shipping labels to delete.'
          });
        } else {
          this.deleteShippingLabel(ids);
        }
        break;
      default:
        break;
    }
  }

  /**
   * @description Action button click.
   */
  cellRendererActionClick(event: { selectedRow: IRowData; id: string }) {
    const row = event.selectedRow;
    switch (event.id) {
      case 'RId_print':
        this.printShippingLabel([row.action]);
        break;
      case 'RId_delete':
        this.singleDeletelabel(row.action);
        break;
      default:
        break;
    }
  }

  cellRendererActionView(event: { selectedRow: IRowData; id: string }) {
    const selectedItem = event.selectedRow;
    if (event.selectedRow?.action) {
      this.openView(selectedItem.action);
    }
  }

  /**
   * @description Print single page.
   */
  onSinglePrint(id: string) {
    this.subscriptions.push(
      this.shippingLabelService.printLabel(id, null).subscribe((res) => {
        if (res.success) {
          window.open(res?.data?.url);
          this.v3DataTableService.gridApi?.deselectAll();
        }
      })
    );
  }

  /**
   * @description Delete single page.
   */
  singleDeletelabel(id: string) {
    const dRef = this.alertService.confirmAlert({
      content: 'Are you sure you want to delete this?'
    });

    dRef.afterClosed().subscribe((res) => {
      if (res) {
        this.subscriptions.push(
          this.shippingLabelService.deleteLabel(id).subscribe((data) => {
            if (data?.success) {
              const successContent = 'Shipping Label Deleted.';
              this.openSuccessAlert(successContent);
              this.dataTableService.setRefreshStatus(true);
              this.v3DataTableService.refreshV3DataTable();
            }
          })
        );
      }
    });
  }

  /**
   * @description Open quick page.
   */
  openQuickLabel() {
    this.router.navigateByUrl(
      '/manage/business-tools/shipping-label/quick-label'
    );
  }

  /**
   * @description open Create shipping page.
   */
  createShippingLabel() {
    this.router.navigateByUrl('/manage/business-tools/shipping-label/create');
  }

  /**
   * @description Print multiple page.
   */
  printShippingLabel(ids: string[]) {
    this.isPrintLoading.set(true);
    this.subscriptions.push(
      this.shippingLabelService
        .printMultiShippingLabel(ids)
        .subscribe((res) => {
          if (res.success) {
            this.isPrintLoading.set(false);
            this.v3DataTableService.gridApi?.deselectAll();
            window.open(res?.data?.url);
          }
        })
    );
  }

  /**
   * @description Delete multiple shipping label confirmation.
   */
  deleteShippingLabel(ids: string[]) {
    const alert = this.alertService.confirmAlert({
      content: 'Are you sure you want to delete this?'
    });

    this.subscriptions.push(
      alert.afterClosed().subscribe((res) => {
        if (res) {
          this.deleteMultiShippingLabel(ids);
        }
      })
    );
  }

  /**
   * @description Delete multiple shipping label.
   */
  deleteMultiShippingLabel(itemIds: string[]) {
    this.subscriptions.push(
      this.shippingLabelService
        .deleteMutltiShippingLabel(itemIds)
        .subscribe((res) => {
          if (res.success) {
            this.dataTableService.setRefreshStatus(true);
            const successContent = 'Shipping Labels Deleted.';
            this.openSuccessAlert(successContent);
            this.v3DataTableService.refreshV3DataTable();
            this.v3DataTableService.gridApi?.deselectAll();
          }
        })
    );
  }

  /**
   * @description Open view page.
   */
  openView(selectedItem: string) {
    const dRef = this.dialog.open(ViewShippingLabelComponent, {
      maxWidth: '800px',
      width: '93%',
      disableClose: true,
      data: { shippLabelId: selectedItem }
    });

    dRef.afterClosed().subscribe((res) => {
      if (res?.success) {
        this.dataTableService.setRefreshStatus(true);
      }
    });
  }

  /**
   * @description Success alert.
   */
  openSuccessAlert(content: string): void {
    const data = {
      title: 'Success!',
      content,
      close: true
    };
    this.alertService.successAlert(data);
  }
}

import {
  ColGroupDef,
  ColDef,
  ICellRendererParams
} from '@ag-grid-community/core';
import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { DataRangeV35Component } from 'src/app/shared/components/date-range-v35/data-range-v35.component';
import {
  IDtActionCompProp,
  IDtCellrendererBtn,
  IDtColumnFields,
  IDtFloatingFilterProp
} from 'src/app/modules/data-table/model/datatable';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { V3DataTableSelectBoxComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-data-table-select-box/v3-data-table-select-box.component';
import { DtActionComponent } from '../../../data-table/components/dt-action/dt-action.component';
import { DtSearchBoxComponent } from '../../../data-table/components/dt-search-box/dt-search-box.component';
import { NgClass } from '@angular/common';
import { V3DataTableComponent } from '../../../v3-data-table/components/v3-data-table/v3-data-table.component';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';

/**
 * Component for rendering the order status in the table.
 */
@Component({
  selector: 'app-shop-order-status-cell',
  template: `
    <div class="flex items-center gap-1">
      <span
        [ngClass]="{
          'text-common-green-color': value === 1,
          'text-common-red-color': value === 2
        }"
      >
        {{ status }}
      </span>
      @if (publicUrl) {
        <span
          role="presentation"
          class="text-common-blue-color text-xs cursor-pointer"
          (click)="navigate(publicUrl)"
        >
          (Check Status)
        </span>
      }
      @if (labelUrl) {
        <span
          role="presentation"
          class="text-common-blue-color text-xs cursor-pointer"
          (click)="navigate(labelUrl)"
        >
          (Label)
        </span>
      }
    </div>
  `,
  standalone: true,
  imports: [NgClass]
})
export class ShopStatusCellRendererComponent
  implements ICellRendererAngularComp
{
  status: string;
  value: number;

  labelUrl: string;
  publicUrl: string;

  orderStatus = {
    0: 'Pending',
    1: 'Shipped',
    2: 'Rejected',
    3: 'Completed'
  };

  refresh(): boolean {
    return true;
  }

  /**
   * Initializes the cell renderer with the provided parameters.
   *
   * @param params - The cell renderer parameters.
   */
  agInit(params: ICellRendererParams): void {
    this.labelUrl = params.data?.postage_label_url;
    this.publicUrl = params.data?.tracker_public_url;

    this.value = params.value;
    if (Object.prototype.hasOwnProperty.call(this.orderStatus, params.value)) {
      this.status = this.orderStatus[params.value as keyof object];
    }
  }

  /**
   * Navigates to a given URL in a new browser window.
   *
   * @param url - The URL to navigate to.
   */
  navigate(url: string) {
    window.open(url);
  }
}

@Component({
  selector: 'app-shop-order-id-cell',
  template: `
    <span
      role="presentation"
      class="cursor-pointer text-common-blue-color"
      (click)="goToOrderDetails()"
      >{{ orderId }}</span
    >
  `
})
export class ShopOrderIdCellRendererComponent
  implements ICellRendererAngularComp
{
  private router = inject(Router);

  orderId: string;

  refresh(): boolean {
    return true;
  }

  agInit(params: ICellRendererParams): void {
    this.orderId = params.value;
  }

  goToOrderDetails() {
    this.router.navigate([`/manage/shop/order_details/${this.orderId}`]);
  }
}

@Component({
  selector: 'app-shop-order-history',
  templateUrl: './shop-order-history.component.html',
  styleUrls: ['./shop-order-history.component.scss'],
  standalone: true,
  imports: [V3DataTableComponent]
})
export class ShopOrderHistoryComponent implements OnInit {
  private dataTableService = inject(DataTableService);
  private v3DataTableService = inject(V3DataTableService);

  public columnDefs: (ColDef | ColGroupDef)[];
  public columnFields: IDtColumnFields[];
  public frameworkComponents = {
    selectBoxComponent: V3DataTableSelectBoxComponent,
    selectDateComponent: DataRangeV35Component,
    SearchBoxComponent: DtSearchBoxComponent,
    actionComponent: DtActionComponent,
    orderIdCellRenderer: ShopOrderIdCellRendererComponent,
    shopStatusCellRenderer: ShopStatusCellRendererComponent
  };

  FloatingFilterComponent: IDtFloatingFilterProp = {
    selectBox: [
      {
        id: 'status',
        values: [
          { value: '0', name: 'Pending' },
          { value: '1', name: 'Shipped' },
          { value: '2', name: 'Rejected' },
          { value: '3', name: 'Completed' }
        ]
      }
    ],

    selectDate: [
      { id: 'created_at', initialRange: 'All Time', isPrimary: true }
    ]
  };

  actionComponentProp: IDtActionCompProp = {
    actionButton: false,
    eyeButton: true
  };

  cellRenderer: IDtCellrendererBtn;
  HeaderButtonLoadingProp = { isLoading: false, btn_id: '', btn_name: '' };
  public tableId = DTTableId.shoppingCartOrderHistory; // Data Table Id
  disabledColumns = ['id', 'status'];

  ngOnInit(): void {
    this.columnDefs = [
      this.colDefOrderId,
      this.colDefCreatedTime,
      this.colDefTotalCost,
      this.colDefStatus
    ];

    this.columnFields = [
      {
        id: 'status',
        name: 'Status',
        isDisabled: true,
        colDef: this.colDefStatus,
        isChecked: true
      },
      {
        id: 'order_id',
        name: 'Order Id ',
        isDisabled: true,
        colDef: this.colDefOrderId,
        isChecked: true
      },
      {
        id: 'created_time',
        name: 'Created Time ',
        isDisabled: false,
        colDef: this.colDefCreatedTime,
        isChecked: true
      },
      {
        id: 'total_cost',
        name: 'Total Cost',
        isDisabled: false,
        colDef: this.colDefTotalCost,
        isChecked: true
      }
    ];

    this.dataTableService.setDataFromParent(
      this.columnFields,
      this.FloatingFilterComponent,
      this.cellRenderer,
      this.actionComponentProp
    );
    this.v3DataTableService.resetV3DataTablePayload();
    this.v3DataTableService.refreshV3DataTable();
  }

  colDefOrderId = {
    headerName: 'Order Id',
    field: 'id',
    suppressFloatingFilterButton: true,
    minWidth: 50,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,

    cellRenderer: 'orderIdCellRenderer'
  };

  colDefCreatedTime = {
    headerName: 'Created Time',
    field: 'created_at',
    suppressFloatingFilterButton: true,
    minWidth: 120,
    floatingFilterComponent: 'selectDateComponent',
    filter: 'agDateColumnFilter',
    floatingFilter: true,
    floatingFilterComponentParams: { v2Table: true },
    suppressHeaderMenuButton: true,
  };

  colDefTotalCost = {
    headerName: 'Total Price',
    field: 'total_cost',
    suppressFloatingFilterButton: true,
    minWidth: 50,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center'
  };

  colDefStatus = {
    headerName: 'Status',
    field: 'status',
    suppressFloatingFilterButton: true,
    minWidth: 50,
    floatingFilterComponent: 'selectBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'shopStatusCellRenderer'
  };
}

import { Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { ColDef } from '@ag-grid-community/core';

import { V4DataTableComponent } from 'src/app/modules/v4-data-table/components/v4-data-table/v4-data-table.component';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { IDtColumnFields } from 'src/app/modules/data-table/model/datatable';
import { V4DtActionComponent } from 'src/app/modules/v4-data-table/components/v4-dt-action/v4-dt-action.component';
import { V4TextFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-text-floating-filter/v4-text-floating-filter.component';
import { V4DropdownFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-dropdown-floating-filter/v4-dropdown-floating-filter.component';
import {
  CommonTabV4Component,
  ITabItem
} from 'src/app/shared/V4/common-tab-v4/common-tab-v4.component';
import {
  V4StatusComponent,
  TV4StatusMap
} from 'src/app/shared/V4/v4-dt-cellrenders/v4-status/v4-status.component';
import { EpaymentsRecurringV4Component } from '../epayments-recurring/epayments-recurring-v4.component';

@Component({
  selector: 'app-epayments-v4',
  standalone: true,
  imports: [
    V4DataTableComponent,
    CommonTabV4Component,
    EpaymentsRecurringV4Component
  ],
  providers: [V3DataTableService, DatePipe, CurrencyPipe],
  templateUrl: './epayments-v4.component.html',
  styleUrls: ['./epayments-v4.component.scss']
})
export class EpaymentsV4Component implements OnInit {
  private dataTableService = inject(DataTableService);
  private v3DataTableService = inject(V3DataTableService);
  private currencyPipe = inject(CurrencyPipe);
  private router = inject(Router);

  tableId = DTTableId.epayments;

  onEmptyStateAction(): void {
    this.router.navigate(['/v4/manage/payments/receive']);
  }

  readonly epaymentTabs: ITabItem[] = [
    { label: 'All', value: 'all' },
    { label: 'Recurring', value: 'recurring' }
  ];

  activeSubTab = signal('all');

  FloatingFilterComponent = {
    selectBox: [
      {
        id: 'credential_type',
        values: [
          { value: 'live', name: 'live' },
          { value: 'sandbox', name: 'sandbox' }
        ]
      }
    ]
  };

  // ── Column Definitions (declared first so columnDefs/columnFields can reference them) ──

  colDefId: ColDef = {
    headerName: '#',
    field: 'id',
    sortable: false,
    suppressFloatingFilterButton: true,
    minWidth: 60,
    maxWidth: 60,
    pinned: 'left',
    filter: false,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    lockPosition: true,
    resizable: false,
    headerClass: 'fixed-size-header'
  };

  colDefPaymentMethod: ColDef = {
    headerName: 'Payment Method',
    field: 'payment_method_types',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 170,
    maxWidth: 200
  };

  colDefAmount: ColDef = {
    headerName: 'Amount',
    field: 'amount',
    minWidth: 120,
    maxWidth: 150,
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex justify-end pr-3 text-end mt-0.5',
    cellRenderer: (params: { value: string | number }) =>
      this.currencyPipe.transform(params.value)
  };

  epaymentsStatusMap: TV4StatusMap = {
    succeeded: {
      status: 'Succeeded',
      bgColor: 'var(--v4-badge-success-bg-color)',
      textColor: 'var(--v4-common-green-color)'
    },
    SUCCEEDED: {
      status: 'Succeeded',
      bgColor: 'var(--v4-badge-success-bg-color)',
      textColor: 'var(--v4-common-green-color)'
    },
    pending: {
      status: 'Pending',
      bgColor: 'var(--v4-badge-warning-bg-color)',
      textColor: 'var(--v4-common-yellow-color)'
    },
    PENDING: {
      status: 'Pending',
      bgColor: 'var(--v4-badge-warning-bg-color)',
      textColor: 'var(--v4-common-yellow-color)'
    },
    failed: {
      status: 'Failed',
      bgColor: 'var(--v4-badge-error-bg-color)',
      textColor: 'var(--v4-common-red-color)'
    },
    FAILED: {
      status: 'Failed',
      bgColor: 'var(--v4-badge-error-bg-color)',
      textColor: 'var(--v4-common-red-color)'
    },
    canceled: {
      status: 'Canceled',
      bgColor: 'var(--v4-badge-error-bg-color)',
      textColor: 'var(--v4-common-red-color)'
    },
    CANCELED: {
      status: 'Canceled',
      bgColor: 'var(--v4-badge-error-bg-color)',
      textColor: 'var(--v4-common-red-color)'
    },
    processing: {
      status: 'Processing',
      bgColor: 'var(--v4-badge-info-bg-color)',
      textColor: 'var(--v4-common-blue-color)'
    },
    PROCESSING: {
      status: 'Processing',
      bgColor: 'var(--v4-badge-info-bg-color)',
      textColor: 'var(--v4-common-blue-color)'
    },
    completed: {
      status: 'Completed',
      bgColor: 'var(--v4-badge-success-bg-color)',
      textColor: 'var(--v4-common-green-color)'
    },
    COMPLETED: {
      status: 'Completed',
      bgColor: 'var(--v4-badge-success-bg-color)',
      textColor: 'var(--v4-common-green-color)'
    }
  };

  colDefPaymentStatus: ColDef = {
    headerName: 'Payment Status',
    field: 'payment_status',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 150,
    maxWidth: 175,
    pinned: 'right',
    lockPosition: 'right',
    lockPinned: true,
    suppressMovable: true,
    cellClass: 'flex items-center',
    cellRenderer: V4StatusComponent,
    cellRendererParams: {
      statusMode: 'custom',
      statusField: 'payment_status',
      statusMap: this.epaymentsStatusMap,
      hideFilterButton: true
    }
  };

  colDefRefId: ColDef = {
    headerName: 'Ref Id',
    field: 'reference_id',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agNumberColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 200,
    flex: 1.2,
    tooltipField: 'reference_id'
  };

  colDefCustomerName: ColDef = {
    headerName: 'Customer Name',
    field: 'customer_name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agNumberColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 170,
    flex: 1,
    tooltipField: 'customer_name'
  };

  colDefEmail: ColDef = {
    headerName: 'Email',
    field: 'customer_email',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 200,
    flex: 1.2,
    tooltipField: 'customer_email'
  };

  colDefPaymentType: ColDef = {
    headerName: 'Payment Type',
    field: 'credential_type',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 150,
    maxWidth: 180
  };

  // ── Table config (declared after colDefs so references are valid) ──────────

  frameworkComponents = {
    selectBoxComponent: V4DropdownFloatingFilterComponent,
    actionComponent: V4DtActionComponent,
    SearchBoxComponent: V4TextFloatingFilterComponent
  };

  columnDefs: ColDef[] = [
    this.colDefId,
    this.colDefPaymentMethod,
    this.colDefAmount,
    this.colDefRefId,
    this.colDefCustomerName,
    this.colDefEmail,
    this.colDefPaymentType,
    this.colDefPaymentStatus
  ];

  columnFields: IDtColumnFields[] = [
    {
      id: 'id',
      name: '#',
      isDisabled: true,
      colDef: this.colDefId,
      isChecked: true
    },
    {
      id: 'id_Paymentmethod',
      name: 'Payment method',
      isDisabled: false,
      colDef: this.colDefPaymentMethod,
      isChecked: true
    },
    {
      id: 'id_amount',
      name: 'Amount',
      isDisabled: false,
      colDef: this.colDefAmount,
      isChecked: true
    },
    {
      id: 'id_refId',
      name: 'Ref Id',
      isDisabled: false,
      colDef: this.colDefRefId,
      isChecked: true
    },
    {
      id: 'id_CustomerName',
      name: 'Customer Name',
      isDisabled: false,
      colDef: this.colDefCustomerName,
      isChecked: true
    },
    {
      id: 'id_email',
      name: 'Email',
      isDisabled: false,
      colDef: this.colDefEmail,
      isChecked: true
    },
    {
      id: 'id_paymentType',
      name: 'Payment Type',
      isDisabled: false,
      colDef: this.colDefPaymentType,
      isChecked: true
    },
    {
      id: 'id_PaymentStatus',
      name: 'Payment Status',
      isDisabled: true,
      colDef: this.colDefPaymentStatus,
      isChecked: true
    }
  ];

  ngOnInit(): void {
    this.applyTableConfig();
  }

  onSubTabChange(value: string): void {
    this.activeSubTab.set(value);
    // DataTableService is a root singleton and the Recurring sub-tab overwrites
    // its column config, so re-apply ours whenever we come back to this table.
    if (value === 'all') {
      this.applyTableConfig();
    }
  }

  private applyTableConfig(): void {
    this.dataTableService.setDataFromParent(
      this.columnFields,
      this.FloatingFilterComponent
    );
    this.v3DataTableService.resetV3DataTablePayload();
    this.v3DataTableService.refreshV3DataTable();
  }
}

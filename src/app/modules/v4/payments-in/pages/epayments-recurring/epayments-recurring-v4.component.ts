import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ColDef, ICellRendererParams } from '@ag-grid-community/core';

import { V4DataTableComponent } from 'src/app/modules/v4-data-table/components/v4-data-table/v4-data-table.component';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { RequestPaymentsService } from 'src/app/shared/service/RequestPayments/request-payments.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import {
  IDtActionCompProp,
  IDtCellrendererBtn,
  IDtColumnFields,
  IDtFloatingFilterProp
} from 'src/app/modules/data-table/model/datatable';
import { V4DtActionComponent } from 'src/app/modules/v4-data-table/components/v4-dt-action/v4-dt-action.component';
import { V4TextFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-text-floating-filter/v4-text-floating-filter.component';
import { V4DateFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-date-floating-filter/v4-date-floating-filter.component';
import {
  V4StatusComponent,
  TV4StatusMap
} from 'src/app/shared/V4/v4-dt-cellrenders/v4-status/v4-status.component';

@Component({
  selector: 'app-epayments-recurring-v4',
  standalone: true,
  imports: [V4DataTableComponent],
  providers: [V3DataTableService, CurrencyPipe],
  template: `
    <app-v4-data-table
      [columnDefs]="columnDefs"
      [tableId]="tableId"
      [frameworkComponents]="frameworkComponents"
      [defaultColumnFields]="columnFields"
      [backButtonEnabled]="false"
      (cellRendererIdEvent)="actionClick($event)"
      (emptyStateActionClick)="onEmptyStateAction()"
      [useCustomEmptyState]="true"
      [emptyStateConfig]="{
        icon: 'repeat',
        title: 'No recurring ePayments yet',
        description: 'Payments you receive from customers will appear here.',
        buttonText: 'Request Payment',
      }"
    />
  `
})
export class EpaymentsRecurringV4Component implements OnInit {
  private dataTableService = inject(DataTableService);
  private v3DataTableService = inject(V3DataTableService);
  private requestPaymentsService = inject(RequestPaymentsService);
  private alertService = inject(V4AlertService);
  private currencyPipe = inject(CurrencyPipe);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);

  tableId = DTTableId.receivedPaymentRecurring;

  onEmptyStateAction(): void {
    this.router.navigate(['/v4/manage/payments/receive']);
  }

  statusMap: TV4StatusMap = {
    active: {
      status: 'Active',
      bgColor: 'var(--v4-badge-success-bg-color)',
      textColor: 'var(--v4-common-green-color)'
    },
    canceled: {
      status: 'Canceled',
      bgColor: 'var(--v4-badge-error-bg-color)',
      textColor: 'var(--v4-common-red-color)'
    },
    completed: {
      status: 'Completed',
      bgColor: 'var(--v4-badge-success-bg-color)',
      textColor: 'var(--v4-common-green-color)'
    },
    not_started: {
      status: 'Not Started',
      bgColor: 'var(--v4-badge-warning-bg-color)',
      textColor: 'var(--v4-common-yellow-color)'
    }
  };

  // Column definitions

  colDefId: ColDef = {
    headerName: '#',
    field: 'id',
    sortable: false,
    suppressFloatingFilterButton: true,
    maxWidth: 70,
    filter: false,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    headerClass: 'fixed-size-header',
    lockPosition: true,
    suppressMovable: true,
    resizable: false,
    pinned: 'left' as const,
  };

  colDefAmount: ColDef = {
    headerName: 'Amount',
    field: 'received_payments.amount',
    minWidth: 130,
    maxWidth: 150,
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex justify-end pr-3 text-end mt-0.5',
    cellRenderer: (params: ICellRendererParams) =>
      this.currencyPipe.transform(params.data?.amount, 'USD', 'symbol', '1.2-2')
  };

  colDefStartDate: ColDef = {
    headerName: 'Start Date',
    field: 'start_date',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectDateComponent',
    filter: 'agDateColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 130,
  };

  colDefEndDate: ColDef = {
    headerName: 'End Date',
    field: 'end_date',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectDateComponent',
    filter: 'agDateColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 130,
  };

  colDefFrequency: ColDef = {
    headerName: 'Frequency',
    field: 'frequency',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 130,
  };

  colDefTotal: ColDef = {
    headerName: 'Total',
    field: 'no_of_times',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 130,
    cellRenderer: (params: ICellRendererParams) => {
      if (params.data?.is_it_unlimited === 1) {
        return '<span style="color:var(--v4-common-green-color)">Unlimited</span>';
      }
      return params.value;
    }
  };

  colDefCompleted: ColDef = {
    headerName: 'Completed',
    field: 'completed',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 130,
  };

  colDefRemaining: ColDef = {
    headerName: 'Remaining',
    field: 'remaining',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 130,
  };

  colDefCreatedTime: ColDef = {
    headerName: 'Created Time',
    field: 'received_payment_subscription_details.created_at',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectDateComponent',
    filter: 'agDateColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 130,
    cellRenderer: (data: { data: { formated_date: string } }) =>
      data.data?.formated_date
  };

  colDefReferenceId: ColDef = {
    headerName: 'Reference Id',
    field: 'reference_id',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 130,
  };

  colDefStatus: ColDef = {
    headerName: 'Status',
    field: 'status',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 130,
    pinned: 'right',
    lockPosition: 'right',
    lockPinned: true,
    suppressMovable: true,
    cellRenderer: V4StatusComponent,
    cellRendererParams: {
      statusMode: 'custom',
      statusField: 'status',
      statusMap: this.statusMap,
      hideFilterButton: true
    }
  };

  colDefAction: ColDef = {
    headerName: 'Action',
    field: 'action',
    suppressFloatingFilterButton: true,
    maxWidth: 120,
    cellRenderer: 'actionComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    sortable: false,
    pinned: 'left' as const,
    lockPosition: true,
    suppressMovable: true,
  };

  // Table config

  frameworkComponents = {
    selectDateComponent: V4DateFloatingFilterComponent,
    actionComponent: V4DtActionComponent,
    SearchBoxComponent: V4TextFloatingFilterComponent
  };

  columnDefs: ColDef[] = [
    this.colDefId,
    this.colDefAmount,
    this.colDefStartDate,
    this.colDefEndDate,
    this.colDefFrequency,
    this.colDefTotal,
    this.colDefCompleted,
    this.colDefRemaining,
    this.colDefCreatedTime,
    this.colDefReferenceId,
    this.colDefStatus,
    this.colDefAction
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
      id: 'id_Amount',
      name: 'Amount',
      isDisabled: false,
      colDef: this.colDefAmount,
      isChecked: true
    },
    {
      id: 'id_startDate',
      name: 'Start Date',
      isDisabled: false,
      colDef: this.colDefStartDate,
      isChecked: true
    },
    {
      id: 'id_EndDate',
      name: 'End Date',
      isDisabled: false,
      colDef: this.colDefEndDate,
      isChecked: true
    },
    {
      id: 'id_Frequency',
      name: 'Frequency',
      isDisabled: false,
      colDef: this.colDefFrequency,
      isChecked: true
    },
    {
      id: 'id_Total',
      name: 'Total',
      isDisabled: false,
      colDef: this.colDefTotal,
      isChecked: true
    },
    {
      id: 'id_Completed',
      name: 'Completed',
      isDisabled: false,
      colDef: this.colDefCompleted,
      isChecked: true
    },
    {
      id: 'id_Remaining',
      name: 'Remaining',
      isDisabled: false,
      colDef: this.colDefRemaining,
      isChecked: true
    },
    {
      id: 'id_CreatedTime',
      name: 'Created Time',
      isDisabled: true,
      colDef: this.colDefCreatedTime,
      isChecked: true
    },
    {
      id: 'id_ReferenceId',
      name: 'Reference Id',
      isDisabled: false,
      colDef: this.colDefReferenceId,
      isChecked: true
    },
    {
      id: 'id_Status',
      name: 'Status',
      isDisabled: true,
      colDef: this.colDefStatus,
      isChecked: true
    },
    {
      id: 'id_Action',
      name: 'Action',
      isDisabled: false,
      colDef: this.colDefAction,
      isChecked: true
    }
  ];

  FloatingFilterComponent: IDtFloatingFilterProp = {
    selectDate: [
      { id: 'start_date', initialRange: 'All Time' },
      { id: 'end_date', initialRange: 'All Time' },
      { id: 'created_at', initialRange: 'All Time', isPrimary: true }
    ]
  };

  cellRenderer: IDtCellrendererBtn = {
    action: [
      {
        name: 'Cancel',
        id: 'RId_cancel_S',
        icon: 'history'
      }
    ]
  };

  ngOnInit(): void {
    const actionComponentProp: IDtActionCompProp = {
      actionButton: true,
      eyeButton: false
    };
    this.dataTableService.setDataFromParent(
      this.columnFields,
      this.FloatingFilterComponent,
      this.cellRenderer,
      actionComponentProp
    );
    this.v3DataTableService.resetV3DataTablePayload();
    this.v3DataTableService.refreshV3DataTable();
  }

  actionClick(env: {
    id: string;
    selectedRow: { status: string; uu_id: string };
  }): void {
    if (!env?.selectedRow) return;

    if (env.selectedRow.status === 'canceled') {
      this.dataTableService.setActionButtonDisable(true, ['RId_cancel_S']);
    } else {
      this.dataTableService.setActionButtonDisable(true, ['']);
    }

    if (env.id === 'RId_cancel_S') {
      const response = this.alertService.confirmAlert({
        title: 'Confirm',
        content: 'Are you sure you want to cancel this subscription?',
        doneMsg: 'Yes',
        cancelMsg: 'No'
      });
      response.afterClosed().subscribe((res) => {
        if (res) {
          if (env.selectedRow.status !== 'canceled') {
            this.cancelSubscription(env.selectedRow.uu_id);
          } else {
            this.alertService.warningAlert({
              content:
                'You cannot cancel a subscription schedule that is currently in the `canceled` status. It must be in `not_started, active` status to be canceled.'
            });
          }
        }
      });
    }
  }

  private cancelSubscription(id: string): void {
    this.requestPaymentsService
      .cancelSubscription(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res.success) {
          this.alertService.successAlert({
            content: 'Subscription canceled successfully.',
            close: true,
            timeout: 1500
          });
          this.v3DataTableService.refreshV3DataTable();
        }
      });
  }
}

import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import {
  ColDef,
  ColGroupDef,
  ICellRendererParams
} from '@ag-grid-community/core';
import { Subscription } from 'rxjs';
import { RequestPaymentsService } from 'src/app/shared/service/RequestPayments/request-payments.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { DataRangeV35Component } from 'src/app/shared/components/date-range-v35/data-range-v35.component';
import {
  IDataTable,
  IDtColumnFields,
  IDtHeaderElements,
  IDtCellrendererBtn,
  IDtFloatingFilterProp
} from 'src/app/modules/data-table/model/datatable';
import { DecimalPipe } from '@angular/common';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { DtSelectAllCheckBoxComponent } from '../../../data-table/components/dt-select-all-check-box/dt-select-all-check-box.component';
import { DtActionComponent } from '../../../data-table/components/dt-action/dt-action.component';
import { DtSearchBoxComponent } from '../../../data-table/components/dt-search-box/dt-search-box.component';
import { V3DataTableComponent } from '../../../v3-data-table/components/v3-data-table/v3-data-table.component';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';

const colDefId = {
  headerName: '#',
  field: 'id',
  suppressFloatingFilterButton: true,
  // minWidth: 20,
  maxWidth: 70,
  floatingFilter: true,
  suppressHeaderMenuButton: true,
  lockPosition: true,
  resizable: false,
  headerClass: 'fixed-size-header',
  sortable: false
};

const colDefStartDate = {
  headerName: 'Start Date',
  field: 'start_date',
  suppressFloatingFilterButton: true,
  floatingFilterComponent: 'selectDateComponent', // SearchBoxComponent
  filter: 'agDateColumnFilter',
  floatingFilter: true,
  suppressHeaderMenuButton: true
};

const colDefEndDate = {
  headerName: 'End Date',
  field: 'end_date',
  suppressFloatingFilterButton: true,
  floatingFilterComponent: 'selectDateComponent', // SearchBoxComponent
  filter: 'agDateColumnFilter',
  floatingFilter: true,
  suppressHeaderMenuButton: true
};

const colDefFrequency = {
  headerName: 'Frequency',
  field: 'frequency',
  suppressFloatingFilterButton: true,
  floatingFilterComponent: 'SearchBoxComponent', // SearchBoxComponent
  filter: 'agTextColumnFilter',
  floatingFilter: true,
  suppressHeaderMenuButton: true
};

const colDefTotal = {
  headerName: 'Total',
  field: 'no_of_times',
  suppressFloatingFilterButton: true,
  floatingFilterComponent: 'SearchBoxComponent', // SearchBoxComponent
  filter: 'agTextColumnFilter',
  floatingFilter: true,
  suppressHeaderMenuButton: true,
  cellRenderer: (params: ICellRendererParams) => {
    if (params.data.is_it_unlimited === 1) {
      return '<span style="color:#3a7d34">Unlimited</span>';
    }
    return params.value;
  }
};

const colDefCompleted = {
  headerName: 'Completed',
  field: 'completed',
  suppressFloatingFilterButton: true,
  floatingFilterComponent: 'SearchBoxComponent',
  filter: 'agTextColumnFilter',
  floatingFilter: true,
  suppressHeaderMenuButton: true,
  filterParams: { newRowsAction: 'keep' }
};

const colDefRemaining = {
  headerName: 'Remaining',
  field: 'remaining',
  suppressFloatingFilterButton: true,
  floatingFilterComponent: 'SearchBoxComponent', // SearchBoxComponent
  filter: 'agTextColumnFilter',
  floatingFilter: true,
  suppressHeaderMenuButton: true
};

const colDefCreatedTime = {
  headerName: 'Created Time',
  field: 'received_payment_subscription_details.created_at',
  suppressFloatingFilterButton: true,
  floatingFilterComponent: 'selectDateComponent',
  filter: 'agDateColumnFilter',
  floatingFilter: true,
  suppressHeaderMenuButton: true,
  cellRenderer: (data: {data:{formated_date: string}}) => data.data.formated_date
};

const colDefReferenceId = {
  headerName: 'Reference Id',
  field: 'reference_id',
  suppressFloatingFilterButton: true,
  floatingFilterComponent: 'SearchBoxComponent', // SearchBoxComponent
  filter: 'agTextColumnFilter',
  floatingFilter: true,
  suppressHeaderMenuButton: true
};

const colDefStatus = {
  headerName: 'Status',
  field: 'status',
  suppressFloatingFilterButton: true,
  floatingFilterComponent: 'SearchBoxComponent', // SearchBoxComponent
  filter: 'agTextColumnFilter',
  floatingFilter: true,
  suppressHeaderMenuButton: true
};

const colDefAction = {
  headerName: 'Action',
  field: 'action',
  suppressFloatingFilterButton: true,
  maxWidth: 120,
  cellRenderer: 'actionComponent',
  floatingFilter: true,
  suppressHeaderMenuButton: true,
  sortable: false
};

/**
 * @description A component for displaying a table of recurring payments using ag-Grid.
 */
@Component({
  selector: 'app-recurring-payments',
  templateUrl: './recurring-payments.component.html',
  styleUrls: ['./recurring-payments.component.scss'],
  standalone: true,
  imports: [V3DataTableComponent]
})
export class RecurringPaymentsComponent
  implements OnInit, OnDestroy, IDataTable
{
  // DATA TABLE VARAIBLES
  public columnDefs: (ColDef | ColGroupDef)[] | null;
  public columnFields: IDtColumnFields[] | undefined = [];
  public headerElements: IDtHeaderElements;
  public frameworkComponents: { [p: string]: { new (): any } } | any;
  subscriptions: Subscription[] = [];
  public tableId = DTTableId.receivedPaymentRecurring; // Data Table Id
  cellRenderer: IDtCellrendererBtn | undefined;
  FloatingFilterComponent: IDtFloatingFilterProp | undefined;
  actionComponentProp: any;
  receivePaymentsStatus: any[];
  dateRangeField: string;

  public dialog = inject(MatDialog);
  private dataTableService = inject(DataTableService);
  private requestPaymentsService = inject(RequestPaymentsService);
  private alertService = inject(AlertService);
  private decimal = inject(DecimalPipe);
  private v3DataTableService = inject(V3DataTableService);

  ngOnInit() {
    // EXTERNAL CHILD COMPONENTS
    this.frameworkComponents = {
      headerCheckBoxComponent: DtSelectAllCheckBoxComponent,
      selectDateComponent: DataRangeV35Component,
      actionComponent: DtActionComponent,
      SearchBoxComponent: DtSearchBoxComponent
    };

    // SET COLUMN FEILDS
    this.columnDefs = [
      colDefId,
      this.colDefAmount,
      colDefStartDate,
      colDefEndDate,
      colDefFrequency,
      colDefTotal,
      colDefCompleted,
      colDefRemaining,
      colDefCreatedTime,
      colDefReferenceId,
      colDefStatus,
      colDefAction
    ];

    // FILTER CUSTOM COMPONENTS
    this.FloatingFilterComponent = {
      selectDate: [
        { id: 'start_date', initialRange: 'All Time' },
        { id: 'end_date', initialRange: 'All Time' },
        { id: 'created_at', initialRange: 'All Time', isPrimary: true }
      ]
    };

    this.cellRenderer = {
      action: [
        {
          name: 'Cancel',
          id: 'RId_cancel_S',
          icon: 'fa fa-history'
        }
      ]
    };

    const actionComponentProp = {
      actionButton: true,
      eyeButton: false
    };

    // PASS  FIELD DATA
    this.columnFields = [
      {
        id: 'id',
        name: '#',
        isDisabled: true,
        colDef: colDefId,
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
        colDef: colDefStartDate,
        isChecked: true
      },
      {
        id: 'id_EndDate',
        name: 'End Date',
        isDisabled: false,
        colDef: colDefEndDate,
        isChecked: true
      },
      {
        id: 'id_Frequency',
        name: 'Frequency',
        isDisabled: false,
        colDef: colDefFrequency,
        isChecked: true
      },
      {
        id: 'id_Total',
        name: 'Total',
        isDisabled: false,
        colDef: colDefTotal,
        isChecked: true
      },
      {
        id: 'id_Completed',
        name: 'Completed',
        isDisabled: false,
        colDef: colDefCompleted,
        isChecked: true
      },

      {
        id: 'id_Remaining',
        name: 'Remaining',
        isDisabled: false,
        colDef: colDefRemaining,
        isChecked: true
      },

      {
        id: 'id_paymentType',
        name: 'Created Time',
        isDisabled: true,
        colDef: colDefCreatedTime,
        isChecked: true
      },

      {
        id: 'id_ReferenceId',
        name: 'Reference Id',
        isDisabled: false,
        colDef: colDefReferenceId,
        isChecked: true
      },

      {
        id: 'id_Status',
        name: 'Status',
        isDisabled: false,
        colDef: colDefStatus,
        isChecked: true
      },

      {
        id: 'id_Action',
        name: 'Action',
        isDisabled: false,
        colDef: colDefAction,
        isChecked: true
      }
    ];

    // PASS DATAS TO DATA TABLE SERVICE
    this.dataTableService.setDataFromParent(
      this.columnFields,
      this.FloatingFilterComponent,
      this.cellRenderer,
      actionComponentProp
    );
    this.v3DataTableService.resetV3DataTablePayload();
    this.v3DataTableService.refreshV3DataTable();
  }

  /**
   * @description Handle the click event on an action button in the recurring payments table.
   * @param env The event object containing information about the clicked action button and the selected row.
   */
  actionClick(env: any) {
    if (!env) {
      return;
    }

    if (env.selectedRow?.status === 'canceled') {
      this.dataTableService.setActionButtonDisable(true, ['RId_cancel_S']);
    } else if (!env.selectedRow) {
      return;
    } else {
      this.dataTableService.setActionButtonDisable(true, ['']);
    }

    if (env.id === 'RId_cancel_S') {
      const data = {
        title: 'Confirm',
        content: 'Are you sure you want to cancel this subscription?',
        doneMsg: 'Yes',
        CancelMsg: 'No'
      };
      const response = this.alertService.confirmAlert(data);
      response.afterClosed().subscribe((res) => {
        if (res) {
          if (env.selectedRow.status !== 'canceled') {
            this.cancelSubscription(env.selectedRow.uu_id);
          } else {
            this.warningAlert();
          }
        }
      });
    }
  }

  warningAlert() {
    const data = {
      title: 'Error',
      content:
        'You cannot cancel a subscription schedule that is currently in the `canceled` status. It must be in `not_started, active` status to be canceled.',
      doneMsg: 'OK',
      isCancel: false
    };
    this.alertService.warningAlert(data);
  }

  cancelSubscription(id: string) {
    this.subscriptions.push(
      this.requestPaymentsService.cancelSubscription(id).subscribe((res) => {
        if (res.success) {
          this.dataTableService.setRefreshStatus(true);
        }
      })
    );
  }

  colDefAmount = {
    headerName: 'Amount',
    minWidth: 90,
    maxWidth: 130,
    field: 'received_payments.amount',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent', // SearchBoxComponent
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'ag-right-aligned-cell pr-3',
    cellRenderer: (params: ICellRendererParams) =>
      this.decimal.transform(params.data.amount, '1.2-2')
  };

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => sub.unsubscribe());
  }
}

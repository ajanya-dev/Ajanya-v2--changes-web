import { ICellRendererParams, RowSelectedEvent } from '@ag-grid-community/core';
import { NgClass } from '@angular/common';
import { Component, EventEmitter, inject, input, OnInit, Output, signal } from '@angular/core';
import { Router } from '@angular/router';
import { finalize, Subscription } from 'rxjs';
import { IAchRecurringTableRow } from 'src/app/models/check-recurring';
import { ICoulmnDefFields } from 'src/app/models/v3-datatable';
import { CheckAddAttachmentCommentComponent } from 'src/app/modules/check/pages/check-list/addAttachmentComment';
import { DtActionComponent } from 'src/app/modules/data-table/components/dt-action/dt-action.component';
import { DtSearchBoxComponent } from 'src/app/modules/data-table/components/dt-search-box/dt-search-box.component';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { IDtActionCompProp, IDtColumnFields } from 'src/app/modules/data-table/model/datatable';
import { V3DataTableComponent } from 'src/app/modules/v3-data-table/components/v3-data-table/v3-data-table.component';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { DataRangeV35Component } from 'src/app/shared/components/date-range-v35/data-range-v35.component';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { CheckListRecurringService } from 'src/app/shared/service/check-list-recurring/check-list-recurring.service';
import { DataTableService, IDtSelectSingleIdSubject } from 'src/app/shared/service/data-table/data-table.service';
import { V3DataTableSelectBoxComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-data-table-select-box/v3-data-table-select-box.component';

@Component({
  standalone: true,
  selector: 'app-request-ach-payments',
  templateUrl: './request-ach-payments.component.html',
  styleUrls: ['./request-ach-payments.component.scss'],
  imports: [V3DataTableComponent, NgClass]
})
export class RequestAchPaymentsComponent implements OnInit {
  private dataTableService = inject(DataTableService);
  private router = inject(Router);
  private checkListRecurringService = inject(CheckListRecurringService);
  private alertService = inject(AlertService);
  private v3DataTableService = inject(V3DataTableService);

  @Output() tableChange = new EventEmitter();
  isFromPaymentsV3 = input(false);
  tableId = DTTableId.requestRecurringPayment;

  table: number;
  columnDefs: ICoulmnDefFields[] = [];
  columnFields: IDtColumnFields[] = [];
  actionComponentProp: IDtActionCompProp;
  ach_type = 2;
  subscriptions: Subscription[] = [];
  selectedRow: IAchRecurringTableRow[];
  HeaderButtonLoadingProp = { isLoading: false, btn_id: '', btn_name: '' };
  selectedPanelButton = signal('request_payments');

  public frameworkComponents = {
    selectBoxComponent: V3DataTableSelectBoxComponent,
    selectDateComponent: DataRangeV35Component,
    actionComponent: DtActionComponent,
    searchBoxComponent: DtSearchBoxComponent,
    addAttachmentComment: CheckAddAttachmentCommentComponent
  };


  FloatingFilterComponent = {
    selectBox: [
      {
        id: 'status',
        values: [
          { value: '1', name: 'Requested' },
          { value: '2', name: 'Started' },
          { value: '3', name: 'Completed' },
        ]
      },
      {
        id: 'frequency',
        values: [
          { value: '1', name: 'Weekly' },
          { value: '2', name: 'Bi-Weekly' },
          { value: '3', name: 'Monthly' },
          { value: '4', name: 'Daily' }
        ]
      }
    ],
    selectDate: [
      { id: 'start_date', initialRange: 'All Time', isPrimary: true },
      { id: 'end_date', initialRange: 'All Time' }
    ]
  };


  ngOnInit(): void {
    this.columnDefs = [
      this.colDefId,
      this.colDefFromTo,
      this.colDefBankAccount,
      this.colDefAmount,
      this.colDefPhoneNumber,
      this.colDefFrequency,
      this.colDefInvoice,
      this.colDefMemoLeft,
      this.colDefStart,
      this.colDefStatus,
    ];

    this.columnFields = [
      {
        id: 'id',
        name: '#',
        isDisabled: true,
        colDef: this.colDefId,
        isChecked: true
      },
      {
        id: 'from_to',
        name: 'FromTo',
        isDisabled: false,
        colDef: this.colDefFromTo,
        isChecked: true
      },
      {
        id: 'amount',
        name: 'Amount',
        isDisabled: false,
        colDef: this.colDefAmount,
        isChecked: true
      },
      {
        id: 'frequency',
        name: 'Frequency',
        isDisabled: false,
        colDef: this.colDefFrequency,
        isChecked: true
      },
      {
        id: 'invoice_no',
        name: 'Invoice Number',
        isDisabled: false,
        colDef: this.colDefInvoice,
        isChecked: true
      },
      {
        id: 'phone_no',
        name: 'Phone Number',
        isDisabled: false,
        colDef: this.colDefPhoneNumber,
        isChecked: true
      },
      {
        id: 'bank_account',
        name: 'Bank Account',
        isDisabled: false,
        colDef: this.colDefBankAccount,
        isChecked: true
      },
      {
        id: 'start',
        name: 'Start',
        isDisabled: false,
        colDef: this.colDefStart,
        isChecked: true
      },
      {
        id: 'status',
        name: 'Status',
        isDisabled: false,
        colDef: this.colDefStatus,
        isChecked: true
      },
    ];

    this.actionComponentProp = {
      actionButton: true,
      eyeButton: true
    };

    this.dataTableService.setDataFromParent(
      this.columnFields,
      this.FloatingFilterComponent,
      undefined,
      this.actionComponentProp
    );
    this.v3DataTableService.resetV3DataTablePayload();
    this.v3DataTableService.refreshV3DataTable();
  }

   /**
   * @description Handles the ACH recurring action.
   */
   achRecuring() {
    this.tableChange.emit(2);
  }

  /**
   * @description Handles button click events in the header.
   * @param event - The event object containing the button ID.
   */
  headerButtonClick(event: { id: string }) {
    const selectedItems: string[] = [];
    this.selectedRow?.forEach((row) => {
      selectedItems.push(row.id);
    });

    switch (event.id) {
      case 'ach_recurring':
        this.achRecuring();
        break;
      case 'recurring_list':
        this.onRecurringListClick();
        break;
      default:
        break;
    }
  }

  /**
   * @description Handles the selection of a row in the data table.
   * @param event - The event object containing selected rows.
   */
  onRowSelected(event: RowSelectedEvent) {
    const gridApi = event?.api;
    this.selectedRow = gridApi.getSelectedRows();
  }

  /**
   * @description Handles the click event for the 'Recurring List' button.
   */
  onRecurringListClick() {
    this.table = 1;
    this.tableChange.emit(1);
  }

  /**
   * @description Changes the status of multiple recurring transactions in bulk.
   * @param selectedItems - Array of selected item IDs.
   * @param status - The new status to set.
   * @param [id] - The ID of the button triggering the action.
   */
  changeStatusAsBulk(selectedItems: string[], status: string, id?: string) {
    this.HeaderButtonLoadingProp.isLoading = true;
    this.HeaderButtonLoadingProp.btn_id = id || '';
    this.HeaderButtonLoadingProp.btn_name = 'Loading...';

    this.subscriptions.push(
      this.checkListRecurringService
        .changeBulkRecurringStatus(selectedItems, status)
        .pipe(
          finalize(() => {
            this.HeaderButtonLoadingProp.isLoading = false;
            this.HeaderButtonLoadingProp.btn_id = '';
          })
        )
        .subscribe((response) => {
          if (response.success) {
            this.v3DataTableService.refreshV3DataTable();
            this.v3DataTableService.v3RowSelectionData = [];
            this.v3DataTableService.gridApi?.deselectAll();
            const data = {
              title: ' ',
              content: `${response.data}`
            };
            this.alertService.successAlert(data);
          }
        })
    );
  }

  /**
   * @description Changes the status of a single recurring transaction.
   * @param id - The ID of the recurring transaction.
   * @param status - The new status to set.
   */
  changeStatus(id: string, status: string) {
    this.subscriptions.push(
      this.checkListRecurringService
        .changeAchRecurringStatus(id, status)
        .subscribe((response) => {
          const data = {
            title: 'Success',
            // eslint-disable-next-line no-nested-ternary
            content: `${
              response.data === 'Pause Successfully'
                ? 'Recurring Paused'
                : // eslint-disable-next-line no-nested-ternary
                  response.data === 'Restart Successfully'
                  ? 'Recurring Restarted'
                  : response.data === 'Cancel Successfully'
                    ? 'Recurring Canceled'
                    : response.data
            }`
          };
          if (response.success) {
            this.v3DataTableService.refreshV3DataTable();
            this.v3DataTableService.v3RowSelectionData = [];
            this.v3DataTableService.gridApi?.deselectAll();
            this.alertService.successAlert(data);
          }
        })
    );
  }

  /**
   * @description Navigates to the details view of a selected row.
   * @param event - The event object containing details.
   */
  cellRendererActionView(event: IDtSelectSingleIdSubject) {
    if (event.selectedRow?.id) {
      this.router.navigate(['manage/checkmailing/recurring/show'], {
        queryParams: { id: event.selectedRow.id }
      });
    }
  }


  colDefId = {
    maxWidth: 50,
    headerName: '',
    sortable: false,
    field: 'boxId',
    suppressFloatingFilterButton: true,
    suppressHeaderMenuButton: true,
    lockPosition: true,
    headerCheckboxSelection: true,
    checkboxSelection: true,
    showDisabledCheckboxes: true,
    cellRenderer: () => ''
  };

  colDefStart = {
    minWidth: 100,
    headerName: 'Start Date',
    field: 'start_date',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectDateComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    floatingFilterComponentParams: { v2Table: true },
    suppressHeaderMenuButton: true
  };

  colDefFromTo = {
    minWidth: 100,
    headerName: 'Payee/Recipient',
    field: 'email',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'searchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    sortable: false
  };

  colDefStatus = {
    headerName: 'Status',
    field: 'status',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: (params: ICellRendererParams) => {
      if (params.value === 3) {
        return 'Completed';
      }
      if (params.value === 2) {
        return 'Started';
      }
      if (params.value === 1) {
        return 'Requested';
      }
      return '';
    }
  };

  colDefAmount = {
    width: 100,
    headerName: 'Amount',
    field: 'requested_payments.amount',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'searchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: (params: ICellRendererParams) => {
      return params.data?.amount;
    }
  };

  colDefFrequency = {
    minWidth: 100,
    headerName: 'Frequency',
    field: 'frequency',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
  };

  colDefInvoice = {
    minWidth: 120,
    headerName: 'Invoice Number',
    field: 'invoice_no',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'searchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
  };

  colDefPhoneNumber = {
    minWidth: 120,
    headerName: 'Phone Number',
    field: 'mobile_no',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'searchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefMemoLeft = {
    minWidth: 100,
    headerName: 'Memo',
    field: 'memo',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'searchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefBankAccount = {
    minWidth: 100,
    headerName: 'Bank Account',
    field: 'bank_account_account_name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'searchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };


  ngOnDestroy(): void {
    this.subscriptions.forEach((el) => el.unsubscribe());
  }
}

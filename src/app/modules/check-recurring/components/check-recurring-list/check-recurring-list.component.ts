import {
  Component,
  Output,
  EventEmitter,
  OnDestroy,
  signal,
  computed,
  inject,
  OnInit,
  input,
  Input
} from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import {
  IDtActionCompProp,
  IDtColumnFields,
  IDtFloatingFilterProp
} from 'src/app/modules/data-table/model/datatable';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { CheckListRecurringService } from 'src/app/shared/service/check-list-recurring/check-list-recurring.service';
import {
  DataTableService,
  IDtSelectSingleIdSubject
} from 'src/app/shared/service/data-table/data-table.service';
import { ICoulmnDefFields } from 'src/app/models/v3-datatable';
import { ICheckRecurringTableRow } from 'src/app/models/check-recurring';
import { ICellRendererParams, RowSelectedEvent } from '@ag-grid-community/core';
import { DataRangeV35Component } from 'src/app/shared/components/date-range-v35/data-range-v35.component';
import { IV3DtHeaderElements } from 'src/app/modules/v3-data-table/models/v3-data-table';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { V3DataTableSelectBoxComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-data-table-select-box/v3-data-table-select-box.component';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { NgClass } from '@angular/common';
import { DtSearchBoxComponent } from '../../../data-table/components/dt-search-box/dt-search-box.component';
import { DtActionComponent } from '../../../data-table/components/dt-action/dt-action.component';
import { CheckAddAttachmentCommentComponent } from '../../../check/pages/check-list/addAttachmentComment';
import { V3DataTableComponent } from '../../../v3-data-table/components/v3-data-table/v3-data-table.component';

/**
 * @description Represents the CheckRecurringListComponent class that implements the IDataTable interface and OnDestroy interface.
 * (Table Component)
 */
@Component({
  selector: 'app-check-recurring-list',
  templateUrl: './check-recurring-list.component.html',
  styleUrls: ['./check-recurring-list.component.scss'],
  standalone: true,
  imports: [V3DataTableComponent,NgClass]
})
export class CheckRecurringListComponent implements OnInit, OnDestroy {
  private dataTableService = inject(DataTableService);
  private checkListRecurringService = inject(CheckListRecurringService);
  private alertService = inject(AlertService);
  private router = inject(Router);
  private v3DataTableService = inject(V3DataTableService);

  @Output() tableChange = new EventEmitter();
  @Input() tableType: number = 1;

  isFromPaymentsV3 = input(false);

  tableId: number = DTTableId.checkRecurring;
  columnDefs: ICoulmnDefFields[] = [];
  columnFields: IDtColumnFields[] = [];
  actionComponentProp: IDtActionCompProp;
  subscriptions: Subscription[] = [];
  selectedRow: ICheckRecurringTableRow[];
  ids: string[] = [];
  HeaderButtonLoadingProp = { isLoading: false, btn_id: '', btn_name: '' };
  selectedPanelButton = signal('recurring_list');
  pauseDisabled = signal(false);
  resumeDisabled = signal(false);
  cancelDisabled = signal(false);

  cellRenderer = {
    action: [
      {
        name: 'Pause',
        id: 'pause',
        icon: 'fa fa-pause'
      },
      {
        name: 'Resume',
        id: 'resume',
        icon: 'fa fa-play'
      },
      {
        name: 'Cancel',
        id: 'cancel',
        icon: 'fa fa-close'
      }
    ]
  };

  FloatingFilterComponent: IDtFloatingFilterProp = {
    selectBox: [
      {
        id: 'status',
        values: [
          { value: '1', name: 'Active' },
          { value: '2', name: 'Completed' },
          { value: '3', name: 'Paused' },
          { value: '4', name: 'Canceled' }
        ]
      },
      {
        id: 'rrule_interval',
        values: [
          { value: '1', name: 'Weekly' },
          { value: '2', name: 'Bi-Weekly' },
          { value: '3', name: 'Monthly' },
          { value: '4', name: 'Quarterly' },
          { value: '5', name: 'Yearly' }
        ]
      }
    ],
    selectDate: [
      { id: 'start_date', initialRange: 'All Time', isPrimary: true },
      { id: 'end_date', initialRange: 'All Time' }
    ]
  };

  public frameworkComponents = {
    selectBoxComponent: V3DataTableSelectBoxComponent,
    selectDateComponent: DataRangeV35Component,
    actionComponent: DtActionComponent,
    SearchBoxComponent: DtSearchBoxComponent,
    addAttachmentComment: CheckAddAttachmentCommentComponent
  };

  public headerElements = computed<IV3DtHeaderElements>(() => ({
    panelButtons: [
      {
        name: 'Mailed Checks',
        id: 'recurring_list'
      },
      {
        name: 'Emailed Checks',
        id: 'email_recurring'
      },
      {
        name: 'ACH',
        id: 'ach_recurring'
      },
      {
        name: 'Gift Card',
        id: 'gift_card'
      }
    ],
    buttons: [
      {
        text: 'Pause',
        id: 'id_pause',
        isAddIcon: true,
        icon: ['fas', 'pause'],
        type: 'list',
        toolTip: 'Pause recurring',
        disabled: this.pauseDisabled()
      },
      {
        text: 'Resume',
        id: 'id_resume',
        isAddIcon: true,
        icon: ['fas', 'play'],
        backGroundInput: 'var(--common-green-color)',
        type: 'list',
        toolTip: 'Resume recurring',
        disabled: this.resumeDisabled()
      },
      {
        text: 'Stop',
        id: 'id_cancel',
        isAddIcon: true,
        icon: ['fas', 'close'],
        backGroundInput: 'var(--common-red-color)',
        type: 'list',
        toolTip: 'Stop',
        disabled: this.cancelDisabled()
      }
    ]
  }));

  ngOnInit(): void {
    this.columnDefs = [
      this.colDefId,
      this.colDefStart,
      this.colDefEnd,
      this.colDefAmount,
      this.colDefTotal,
      this.colDefStatus,
      this.colDefPaid,
      this.colDefFrequency,
      this.colDefCreatedAt,
      this.colDefPayeeName,
      this.colDefBankAccountName,
      this.colDefAction
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
        id: 'amount',
        name: 'Amount',
        isDisabled: false,
        colDef: this.colDefAmount,
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
        id: 'end',
        name: 'End',
        isDisabled: false,
        colDef: this.colDefEnd,
        isChecked: true
      },
      {
        id: 'total',
        name: 'Total',
        isDisabled: false,
        colDef: this.colDefTotal,
        isChecked: true
      },
      {
        id: 'status',
        name: 'Status',
        isDisabled: false,
        colDef: this.colDefStatus,
        isChecked: true
      },
      {
        id: 'paid',
        name: 'Paid',
        isDisabled: false,
        colDef: this.colDefPaid,
        isChecked: true
      },
      {
        id: 'paid',
        name: 'Frequency',
        isDisabled: false,
        colDef: this.colDefFrequency,
        isChecked: true
      },
      {
        id: 'created_at',
        name: 'Created At',
        isDisabled: false,
        colDef: this.colDefCreatedAt,
        isChecked: true
      },
      {
        id: 'payee_name',
        name: 'Payee Name',
        isDisabled: false,
        colDef: this.colDefPayeeName,
        isChecked: true
      },
      {
        id: 'bank_name',
        name: 'Bank Account Name',
        isDisabled: false,
        colDef: this.colDefBankAccountName,
        isChecked: true
      },
      {
        id: 'action',
        name: 'Action',
        isDisabled: false,
        colDef: this.colDefAction,
        isChecked: true
      }
    ];

    this.actionComponentProp = {
      actionButton: true,
      eyeButton: true
    };

    this.dataTableService.setDataFromParent(
      this.columnFields,
      this.FloatingFilterComponent,
      this.cellRenderer,
      this.actionComponentProp
    );
    this.v3DataTableService.resetV3DataTablePayload();
    this.v3DataTableService.refreshV3DataTable();
  }

  /**
   * @description Changes the status of selected items (recurring checks).
   * @param selectedItems An array of IDs of selected recurring checks.
   * @param status The new status to set for the selected items.
   * @param successMsg Success message to show after change status.
   */
  changeStatus(selectedItems: string[], status: string, successMsg: string) {
    this.subscriptions.push(
      this.checkListRecurringService
        .changeRecurringStatus(selectedItems, status)
        .subscribe((response) => {
          if (response.success) {
            this.v3DataTableService.refreshV3DataTable();
            this.v3DataTableService.v3RowSelectionData = [];
            this.v3DataTableService.gridApi?.deselectAll();
            this.alertService.successAlert({ content: successMsg });
          }
        })
    );
  }

  // HEADER BUTTONS ACTION

  /**
   * @description Pauses the selected recurring items.
   * @param selectedItems - Array of selected item IDs.
   */
  pauseRecuring(selectedItems: string[]) {
    if (selectedItems.length > 0) {
      const data = {
        content: 'Are you sure you want to pause this recurring check?'
      };
      const isConfirm = this.alertService.confirmAlert(data);
      isConfirm.afterClosed().subscribe((response) => {
        if (response) {
          this.changeStatus(selectedItems, '3', 'Pause Successfully');
        }
      });
    } else {
      const data = {
        content: 'Please select at least one item'
      };
      this.alertService.warningAlert(data);
    }
  }

  /**
   * @description Resumes the selected recurring items.
   * @param selectedItems - Array of selected item IDs.
   */
  resumeRecuring(selectedItems: string[]) {
    if (selectedItems.length > 0) {
      const data = {
        content: 'Are you sure you want to resume this recurring check?'
      };

      const isConfirm = this.alertService.confirmAlert(data);
      isConfirm.afterClosed().subscribe((response) => {
        if (response) {
          this.changeStatus(selectedItems, '5', 'Restart Successfully');
        }
      });
    } else {
      const data = {
        content: 'Please select at least one item'
      };
      this.alertService.warningAlert(data);
    }
  }

  /**
   * @description Cancels the selected recurring items.
   * @param selectedItems - Array of selected item IDs.
   */
  cancelRecuring(selectedItems: string[]) {
    if (selectedItems.length > 0) {
      const data = {
        content: 'Are you sure you want to cancel this recurring check?'
      };
      const isConfirm = this.alertService.confirmAlert(data);

      isConfirm.afterClosed().subscribe((response) => {
        if (response) {
          this.changeStatus(selectedItems, '4', 'Cancel Successfully');
        }
      });
    } else {
      const data = {
        content: 'Please select at least one item'
      };
      this.alertService.warningAlert(data);
    }
  }

  /**
   * @description Handles the ACH recurring action.
   */
  achRecuring() {
    this.tableChange.emit(2);
  }

  /**
   * @description Handles the Email recurring action.
   */
  emailRecuring() {
    this.tableChange.emit(3);
  }

  /**
   * @description Handles the click event for header buttons.
   * @param event - Event object containing the button ID.
   */
  headerButtonClick(event: { id: string }) {
    const selectedItems: string[] = [];
    this.selectedRow?.forEach((row) => {
      selectedItems.push(row.action);
    });

    switch (event.id) {
      case 'ach_recurring':
        this.achRecuring();
        break;
      case 'email_recurring':
        this.emailRecuring();
        break;
      case 'gift_card':
        this.tableChange.emit(4);
        break;
      case 'id_pause':
        this.pauseRecuring(selectedItems);
        break;
      case 'id_resume':
        this.resumeRecuring(selectedItems);
        break;
      case 'id_cancel':
        this.cancelRecuring(selectedItems);
        break;
      default:
        break;
    }
  }

  /**
   * @description Navigates to the view page for the selected action.
   * @param event - Event object containing the selected row's action.
   */
  cellRendererActionView(event: IDtSelectSingleIdSubject) {
    if (event.selectedRow?.action) {
      this.router.navigate(['manage/checkmailing/recurring/view'], {
        queryParams: { id: event.selectedRow.action }
      });
    }
  }

  /**
   * @description Handles the selection of a row in the table.
   * @param event - Event object containing selected row data.
   */
  onRowSelected(event: RowSelectedEvent<ICheckRecurringTableRow>) {
    const gridApi = event?.api; // all the data table params function get here
    this.selectedRow = gridApi.getSelectedRows();
    this.headerButtonDisable(this.selectedRow);
  }

  /**
   * @description Disables specific action buttons based on the item's status.
   * @param item - Item object containing status information.
   */
  ActionButtonDisable(item: { status: number }) {
    if (item?.status === 2) {
      this.dataTableService.setActionButtonDisable(true, [
        'pause',
        'resume',
        'cancel'
      ]);
    }
    if (item?.status === 3) {
      this.dataTableService.setActionButtonDisable(true, ['pause', '', '']);
    }
    if (item?.status === 4) {
      this.dataTableService.setActionButtonDisable(true, [
        'pause',
        'resume',
        'cancel'
      ]);
    }
    if (item?.status === 1) {
      this.dataTableService.setActionButtonDisable(true, ['', 'resume', '']);
    }
  }

  /**
   * @description Handles the click event for action buttons in cell renderer.
   * @param event - Event object containing the selected row's action and ID.
   */
  cellRendererActionClick(event: IDtSelectSingleIdSubject) {
    const selectedItems = [];
    selectedItems.push(event?.selectedRow?.action as string);
    this.ActionButtonDisable(event?.selectedRow as { status: number });

    switch (event.id) {
      case 'pause':
        this.pauseRecuring(selectedItems);
        break;
      case 'resume':
        this.resumeRecuring(selectedItems);
        break;
      case 'cancel':
        this.cancelRecuring(selectedItems);
        break;
      default:
        break;
    }
  }

  /**
   * @description Disable header buttons based on selected row status.
   * @param {ICheckRecurringTableRow[]}selectedRow - Selected row data.
   */
  headerButtonDisable(selectedRow: ICheckRecurringTableRow[]) {
    let status: number[] = [];
    if (selectedRow?.length > 0) {
      selectedRow.forEach((item) => {
        status.push(item.status);
        if (status.includes(2) || status.includes(4) || status.includes(1)) {
          this.resumeDisabled.set(true);
        } else {
          this.resumeDisabled.set(false);
        }
        if (status.includes(2) || status.includes(4) || status.includes(3)) {
          this.pauseDisabled.set(true);
        } else {
          this.pauseDisabled.set(false);
        }
        if (status.includes(2) || status.includes(4)) {
          this.cancelDisabled.set(true);
        } else {
          this.cancelDisabled.set(false);
        }
      });
    } else {
      status = [];
      this.resumeDisabled.set(false);
      this.pauseDisabled.set(false);
      this.cancelDisabled.set(false);
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
    minWidth: 120,
    headerName: 'Start Date',
    field: 'start_date',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectDateComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
  };

  colDefEnd = {
    minWidth: 120,
    headerName: 'End Date',
    field: 'end_date',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectDateComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
  };

  colDefTotal = {
    minWidth: 100,
    headerName: 'Total',
    field: 'total',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: (params: {
      data: { is_it_unlimited: number; total: number };
    }) => {
      if (params.data.is_it_unlimited === 1) {
        return 'Until Cancel';
      }
      return params.data.total;
    }
  };

  colDefAmount = {
    minWidth: 100,
    headerName: 'Amount',
    field: 'cheque_amount',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
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
      if (params.value === 1) {
        return 'Active';
      }
      if (params.value === 4) {
        return 'Canceled';
      }
      if (params.value === 3) {
        return 'Paused';
      }
      if (params.value === 2) {
        return 'Completed';
      }

      return 'Unknown';
    }
  };

  colDefPaid = {
    minWidth: 100,
    headerName: 'Paid',
    field: 'completed',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
  };

  colDefFrequency = {
    minWidth: 100,
    headerName: 'Frequency',
    field: 'rrule_interval',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: (param: ICellRendererParams) => {
      if (param.value === 1 && param.data.rrule_freq === 'WEEKLY') {
        return 'Weekly';
      }
      if (param.value === 2 && param.data.rrule_freq === 'WEEKLY') {
        return 'Bi-Weekly';
      }
      if (param.value === 1 && param.data.rrule_freq === 'MONTHLY') {
        return 'Monthly';
      }
      if (param.value === 3 && param.data.rrule_freq === 'MONTHLY') {
        return 'Quarterly';
      }
      if (param.value === 1 && param.data.rrule_freq === 'YEARLY') {
        return 'Yearly';
      }
      return '';
    }
  };

  colDefCreatedAt = {
    minWidth: 100,
    headerName: 'Created On',
    field: 'created_at',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
  };

  colDefPayeeName = {
    minWidth: 100,
    headerName: 'Payee Name',
    field: 'payee_name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
  };

  colDefBankAccountName = {
    minWidth: 100,
    headerName: 'Name on Account',
    field: 'bank_account_account_name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
  };

  colDefAction = {
    minWidth: 50,
    headerName: 'Action',
    field: 'action',
    suppressFloatingFilterButton: true,
    sortable: false,
    cellRenderer: 'actionComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
  };

  ngOnDestroy(): void {
    this.subscriptions.forEach((el) => el.unsubscribe());
  }
}

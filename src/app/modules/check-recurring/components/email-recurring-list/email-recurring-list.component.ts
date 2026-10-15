import {
  Component,
  Output,
  EventEmitter,
  signal,
  computed,
  inject,
  input,
  OnInit,
  OnDestroy
} from '@angular/core';
import { Router } from '@angular/router';
import { finalize, Subscription } from 'rxjs';
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
 * @description Email recurring list component that extends CheckRecurringListComponent
 * with tableType set to 3 for email recurring functionality.
 */
@Component({
  selector: 'app-email-recurring-list',
  templateUrl: './email-recurring-list.component.html',
  styleUrls: ['./email-recurring-list.component.scss'],
  standalone: true,
  imports: [V3DataTableComponent, NgClass]
})
export class EmailRecurringListComponent implements OnInit, OnDestroy {
  private dataTableService = inject(DataTableService);
  private checkListRecurringService = inject(CheckListRecurringService);
  private alertService = inject(AlertService);
  private router = inject(Router);
  private v3DataTableService = inject(V3DataTableService);

  @Output() tableChange = new EventEmitter();

  isFromPaymentsV3 = input(false);

  tableId: number = DTTableId.emailRecurring;
  columnDefs: ICoulmnDefFields[] = [];
  columnFields: IDtColumnFields[] = [];
  actionComponentProp: IDtActionCompProp;
  subscriptions: Subscription[] = [];
  selectedRow: ICheckRecurringTableRow[];
  ids: string[] = [];
  HeaderButtonLoadingProp = { isLoading: false, btn_id: '', btn_name: '' };
  selectedPanelButton = signal('email_recurring');
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
        name: 'Stop',
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
          { value: '4', name: 'Daily' },
          { value: '5', name: 'Bi-Monthly' },
          { value: '6', name: 'Quarterly' },
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
          this.changeStatus(selectedItems[0], '3');
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
          this.changeStatus(selectedItems[0], '5');
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
          this.changeStatus(selectedItems[0], '4');
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
   * @description Handles the check recurring action.
   */
  recurringList() {
    this.tableChange.emit(1);
  }

  /**
   * @description Navigates to the view page for the selected action.
   * @param event - Event object containing the selected row's action.
   */
  cellRendererActionView(event: IDtSelectSingleIdSubject) {
    if (event.selectedRow?.action) {
      this.router.navigate(['manage/checkmailing/recurring/show'], {
        queryParams: { id: event.selectedRow.action, type: 3 }
      });
    }
  }

  /**
   * @description Handles button click events in the header.
   * @param event - The event object containing the button ID.
   */
  headerButtonClick(event: { id: string }) {
    const selectedItems: string[] = [];
    this.selectedRow?.forEach((row) => {
      selectedItems.push(row.action);
    });

    switch (event.id) {
      case 'recurring_list':
        this.recurringList();
        break;
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
        this.onAchRecurringPause(true, '', selectedItems, event.id);
        break;
      case 'id_resume':
        this.onAchRecurringResume(true, '', selectedItems, event.id);
        break;
      case 'id_cancel':
        this.onAchRecurringCancel(true, '', selectedItems, event.id);
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
    this.headerButtonDisable(this.selectedRow);
    
    if (this.selectedRow && this.selectedRow.length > 0) {
      this.selectedRow.forEach(row => {
        this.ActionButtonDisable(row);
      });
    }
  }

  /**
   * @description Disables action buttons based on the item's status.
   * @param item - The item with a status property.
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
   * @description Handles the 'Pause' action for a single recurring transaction.
   * @param isBulk - Indicates if the action is for multiple items.
   * @param id - The ID of the recurring transaction.
   * @param selectedItems - Array of selected item IDs.
   * @param eventID - The ID of the triggering event.
   */
  onAchRecurringPause(
    isBulk: boolean,
    id: string,
    selectedItems: string[],
    eventID?: string
  ) {
    if (isBulk) {
      if (selectedItems.length > 0) {
        const data = {
          title: 'Confirm',
          content: 'Are you sure you want to pause this recurring check?',
          doneMsg: 'Yes',
          cancelMsg: 'No'
        };
        const isConfirm = this.alertService.confirmAlert(data);
        isConfirm.afterClosed().subscribe((response) => {
          if (response) {
            this.changeStatusAsBulk(selectedItems, '3', eventID);
          }
        });
      } else {
        this.alertService.warningAlert({
          title: 'Error',
          content: 'Please select at least one item'
        });
      }
    } else {
      const data = {
        title: 'Confirm',
        content: 'Are you sure you want to pause this recurring check?',
        doneMsg: 'Yes',
        cancelMsg: 'No'
      };
      const isConfirm = this.alertService.confirmAlert(data);
      isConfirm.afterClosed().subscribe((response) => {
        if (response) {
          this.changeStatus(id, '3');
        }
      });
    }
  }

  /**
   * @description Handles the 'Resume' action for a single recurring transaction.
   * @param isBulk - Indicates if the action is for multiple items.
   * @param id - The ID of the recurring transaction.
   * @param selectedItems - Array of selected item IDs.
   * @param eventID - The ID of the triggering event.
   */
  onAchRecurringResume(
    isBulk: boolean,
    id: string,
    selectedItems: string[],
    eventID?: string
  ) {
    if (isBulk) {
      if (selectedItems.length > 0) {
        const data = {
          title: 'Confirm',
          content: 'Are you sure you want to resume this recurring check?',
          doneMsg: 'Yes',
          cancelMsg: 'No'
        };
        const isConfirm = this.alertService.confirmAlert(data);
        isConfirm.afterClosed().subscribe((response) => {
          if (response) {
            this.changeStatusAsBulk(selectedItems, '5', eventID);
          }
        });
      } else {
        this.alertService.warningAlert({
          title: 'Oops',
          content: 'Please select at least one item'
        });
      }
    } else {
      const data = {
        title: 'Confirm',
        content: 'Are you sure you want to resume this recurring check?',
        doneMsg: 'Yes',
        cancelMsg: 'No'
      };
      const isConfirm = this.alertService.confirmAlert(data);
      isConfirm.afterClosed().subscribe((response) => {
        if (response) {
          this.changeStatus(id, '5');
        }
      });
    }
  }

  /**
   * @description Handles the 'Cancel' action for a single recurring transaction.
   * @param isBulk - Indicates if the action is for multiple items.
   * @param id - The ID of the recurring transaction.
   * @param selectedItems - Array of selected item IDs.
   * @param eventID - The ID of the triggering event.
   */
  onAchRecurringCancel(
    isBulk: boolean,
    id: string,
    selectedItems: string[],
    eventID?: string
  ) {
    if (isBulk) {
      if (selectedItems.length > 0) {
        const data = {
          title: 'Confirm',
          content: 'Are you sure you want to cancel this recurring check?',
          doneMsg: 'Yes',
          cancelMsg: 'No'
        };
        const isConfirm = this.alertService.confirmAlert(data);
        isConfirm.afterClosed().subscribe((response) => {
          if (response) {
            this.changeStatusAsBulk(selectedItems, '4', eventID);
          }
        });
      } else {
        this.alertService.warningAlert({
          title: 'Oops',
          content: 'Please select at least one item '
        });
      }
    } else {
      const data = {
        title: 'Confirm',
        content: 'Are you sure you want to cancel this recurring check?',
        doneMsg: 'Yes',
        cancelMsg: 'No'
      };
      const isConfirm = this.alertService.confirmAlert(data);
      isConfirm.afterClosed().subscribe((response) => {
        if (response) {
          this.changeStatus(id, '4');
        }
      });
    }
  }

  /**
   * @description Handles the click event of action buttons in the cell renderer.
   * @param event - The event object containing details.
   */
  cellRendererActionClick(event: IDtSelectSingleIdSubject) {
    const selectedItem = event.selectedRow as { status: number; action: string };
    this.ActionButtonDisable(selectedItem);
    switch (event.id) {
      case 'pause':
        this.onAchRecurringPause(false, selectedItem.action, []);
        break;
      case 'resume':
        this.onAchRecurringResume(false, selectedItem.action, []);
        break;
      case 'cancel':
        this.onAchRecurringCancel(false, selectedItem.action, []);
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
    suppressHeaderMenuButton: true
  };

  colDefEnd = {
    minWidth: 120,
    headerName: 'End Date',
    field: 'end_date',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectDateComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
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
    field: 'amount',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
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

      return '';
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
    suppressHeaderMenuButton: true
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
      if (param.value === 2 && param.data.rrule_freq === 'BIWEEKLY') {
        return 'Bi-Weekly';
      }
      if (param.value === 1 && param.data.rrule_freq === 'MONTHLY') {
        return 'Monthly';
      }
      if (param.value === 1 && param.data.rrule_freq === 'DAILY') {
        return 'Daily';
      }
      if (param.value === 3 && param.data.rrule_freq === 'QUARTERLY') {
        return 'Quarterly';
      }
      if (param.value === 2 && param.data.rrule_freq === 'BIMONTHLY') {
        return 'Bi-Monthly';
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
    suppressHeaderMenuButton: true
  };

  colDefPayeeName = {
    minWidth: 100,
    headerName: 'Payee Name',
    field: 'payee_name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefBankAccountName = {
    minWidth: 100,
    headerName: 'Name on Account',
    field: 'bank_account_account_name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefAction = {
    minWidth: 50,
    headerName: 'Action',
    field: 'action',
    suppressFloatingFilterButton: true,
    sortable: false,
    cellRenderer: 'actionComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  ngOnDestroy(): void {
    this.subscriptions.forEach((el) => el.unsubscribe());
  }
}

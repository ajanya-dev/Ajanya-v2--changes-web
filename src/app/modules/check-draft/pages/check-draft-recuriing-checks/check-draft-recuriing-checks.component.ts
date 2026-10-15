import { CurrencyPipe, DatePipe } from '@angular/common';
import {
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';
import { Router } from '@angular/router';
import { ICellRendererParams, RowSelectedEvent } from '@ag-grid-community/core';
import { Subscription, finalize } from 'rxjs';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { CheckDraftService } from 'src/app/shared/service/check-draft/check-draft.service';
import {
  DataTableService,
  IDtSelectSingleIdSubject
} from 'src/app/shared/service/data-table/data-table.service';
import { DataRangeV35Component } from 'src/app/shared/components/date-range-v35/data-range-v35.component';
import { V3DataTableSelectBoxComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-data-table-select-box/v3-data-table-select-box.component';
import { V3PayeeNameComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-payee-name/v3-payee-name.component';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { IV3DtHeaderElements } from 'src/app/modules/v3-data-table/models/v3-data-table';
import { DtActionComponent } from '../../../data-table/components/dt-action/dt-action.component';
import { DtSearchBoxComponent } from '../../../data-table/components/dt-search-box/dt-search-box.component';
import { DtSelectAllCheckBoxComponent } from '../../../data-table/components/dt-select-all-check-box/dt-select-all-check-box.component';
import { ICheckDraftTableRow } from '../../model/Checkdraft';
import { V3DataTableComponent } from '../../../v3-data-table/components/v3-data-table/v3-data-table.component';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';

export interface ICheckRecurring {
  data: ICheckRecurringData;
}
export interface ICheckRecurringData {
  status: number | string;
}

/**
 * @description Represents the component for managing recurring checks in a data table.
 * @implements OnDestroy
 */
@Component({
  selector: 'app-check-draft-recuriing-checks',
  templateUrl: './check-draft-recuriing-checks.component.html',
  styleUrls: ['./check-draft-recuriing-checks.component.scss'],
  standalone: true,
  imports: [V3DataTableComponent,CurrencyPipe]
})
export class CheckDraftRecuriingChecksComponent implements OnDestroy, OnInit {
  private dataTableService = inject(DataTableService);
  private v3DataTableService = inject(V3DataTableService);
  private router = inject(Router);
  private datePipe = inject(DatePipe);
  private alertService = inject(AlertService);
  private checkDraftService = inject(CheckDraftService);
  private currencyPipe = inject(CurrencyPipe);

  subscriptions: Subscription[] = [];
  public tableId = DTTableId.checkDraftRecurring;
  selectedRow: ICheckDraftTableRow[];
  actionName: string;
  exportConfig: { heading: string; ignoreColumns?: string[] } = {
    heading: '',
    ignoreColumns: ['action_field', 'id', 'boxId']
  };

  pauseLoading = signal(false);
  cancelLoading = signal(false);
  resumeLoading = signal(false);
  disablePauseButton = signal(false);
  disableResumeButton = signal(false);
  disableCancelButton = signal(false);

  // HEADER ELEMENTS PROPERTIES
  public headerElements = computed<IV3DtHeaderElements>(() => ({
    buttons: [
      {
        text: 'Pause',
        id: 'id_pause',
        isAddIcon: true,
        icon: ['fas', 'pause'],
        type: 'list',
        toolTip: 'Pause recurring',
        loading: this.pauseLoading(),
        disabled: this.disablePauseButton()
      },
      {
        text: 'Resume',
        id: 'id_resume',
        isAddIcon: true,
        icon: ['fas', 'play'],
        backGroundInput: 'var(--common-green-color)',
        type: 'list',
        toolTip: 'Resume recurring',
        loading: this.resumeLoading(),
        disabled: this.disableResumeButton()
      },
      {
        text: 'Cancel',
        id: 'id_cancel',
        isAddIcon: true,
        icon: ['fas', 'close'],
        backGroundInput: 'var(--common-red-color)',
        type: 'list',
        toolTip: 'Cancel',
        loading: this.cancelLoading(),
        disabled: this.disableCancelButton()
      }
    ]
  }));

  frameworkComponents = {
    headerCheckBoxComponent: DtSelectAllCheckBoxComponent,
    selectBoxComponent: V3DataTableSelectBoxComponent,
    selectDateComponent: DataRangeV35Component,
    actionComponent: DtActionComponent,
    searchBoxComponent: DtSearchBoxComponent,
    v3PayeeNameComponent: V3PayeeNameComponent
  };

  fieldsShownByDefault: string[] = [
    'payees.payee_name',
    'id',
    'check_draft_recurring_checks.amount',
    'action_field'
  ];

  colDefId = {
    headerName: '#',
    field: 'boxId',
    suppressFloatingFilterButton: true,
    maxWidth: 50,
    checkboxSelection: true,
    floatingFilterComponent: 'headerCheckBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    lockPosition: true,
    resizable: false,
    sortable: false,
    cellClass: 'flex justify-center'
  };

  colDefPayeeName = {
    headerName: 'Payee Name',
    field: 'payee_name',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    floatingFilterComponent: 'searchBoxComponent',
    minWidth: 120,
    floatingFilter: true,
    suppressHeaderMenuButton: true,

    cellRenderer: 'v3PayeeNameComponent'
  };

  colDefAmount = {
    headerName: 'Amount',
    field: 'check_draft_recurring_checks.amount',
    suppressFloatingFilterButton: true,
    maxWidth: 260,
    suppressHeaderMenuButton: true,
    floatingFilterComponent: 'searchBoxComponent',
    filter: 'agNumberColumnFilter',
    floatingFilter: true,
    cellClass: 'ag-right-aligned-cell pr-3',
    cellRenderer: (params: ICellRendererParams) =>
      this.currencyPipe.transform(params.data.amount)
  };

  colDefCreatedAt = {
    headerName: 'Created at',
    field: 'check_draft_recurring_checks.created_at',
    suppressFloatingFilterButton: true,
    maxWidth: 260,
    suppressHeaderMenuButton: true,
    floatingFilterComponent: 'selectDateComponent',
    floatingFilter: true,
    filter: 'agDateColumnFilter',

    cellRenderer: (params: ICellRendererParams) =>
      this.datePipe.transform(params.data.created_at, 'MM-dd-yyyy')
  };

  colDefStart = {
    headerName: 'Start',
    field: 'start_date',
    suppressFloatingFilterButton: true,
    maxWidth: 260,
    suppressHeaderMenuButton: true,
    floatingFilterComponent: 'selectDateComponent',
    floatingFilter: true,
    filter: 'agDateColumnFilter'
  };

  colDefEndDate = {
    headerName: 'End',
    field: 'end_date',
    suppressFloatingFilterButton: true,
    maxWidth: 260,
    suppressHeaderMenuButton: true,
    floatingFilterComponent: 'selectDateComponent',
    floatingFilter: true,
    filter: 'agDateColumnFilter'
  };

  colDefTotal = {
    headerName: 'Total',
    field: 'total',
    suppressFloatingFilterButton: true,
    maxWidth: 260,
    suppressHeaderMenuButton: true,
    floatingFilterComponent: 'searchBoxComponent',
    floatingFilter: true,
    filter: 'agNumberColumnFilter'
  };

  colDefPaid = {
    headerName: 'Paid',
    field: 'completed',
    suppressFloatingFilterButton: true,
    maxWidth: 260,
    suppressHeaderMenuButton: true,
    floatingFilterComponent: 'searchBoxComponent',
    floatingFilter: true,
    filter: 'agNumberColumnFilter'
  };

  colDefFrequency = {
    headerName: 'Frequency',
    field: 'check_draft_recurring_meta_datas.rrule_freq',
    suppressFloatingFilterButton: true,
    maxWidth: 260,
    suppressHeaderMenuButton: true,
    floatingFilterComponent: 'selectBoxComponent',
    floatingFilter: true,
    filter: 'agTextColumnFilter',

    cellRenderer: (params: ICellRendererParams) => {
      if (
        params.data.rrule_freq === 'WEEKLY' &&
        params.data.rrule_interval === 2
      ) {
        return 'Bi-Weekly';
      }
      if (
        params.data.rrule_freq === 'MONTHLY' &&
        params.data.rrule_interval === 3
      ) {
        return 'QUATERLY';
      }

      return params.data.rrule_freq;
    }
  };

  colDefStatus = {
    headerName: 'Status',
    field: 'check_draft_recurring_meta_datas.status',
    suppressFloatingFilterButton: true,
    maxWidth: 260,
    suppressHeaderMenuButton: true,
    floatingFilterComponent: 'selectBoxComponent',
    floatingFilter: true,
    filter: 'agNumberColumnFilter',

    cellStyle: (params: ICheckRecurring) => {
      if (params.data.status === 1 || params.data.status === '1') {
        return { color: 'var(--ocw-btn-light-blue)' };
      }
      if (params.data.status === 2) {
        return { color: 'var(--text_success)' };
      }
      if (params.data.status === 3) {
        return { color: 'var(--ocw-btn-warning)' };
      }
      if (params.data.status === 4) {
        return { color: 'var(--text_danger)' };
      }
      if (params.data.status === 6) {
        return { color: 'var(--text_danger)' };
      }

      return { color: 'black' };
    },

    cellRenderer: (params: ICheckRecurring) => {
      let status = '';
      if (params.data.status === 1 || params.data.status === '1') {
        status = 'Started';
      } else if (params.data.status === 2) {
        status = 'Completed';
      } else if (params.data.status === 3) {
        status = 'Paused';
      } else if (params.data.status === 4) {
        status = 'Canceled';
      } else if (params.data.status === 6) {
        status = 'Rejected';
      }
      return status;
    }
  };

  actionField = {
    headerName: 'Action',
    field: 'action_field',
    suppressFloatingFilterButton: true,
    maxWidth: 120,
    sortable: false,
    cellRenderer: 'actionComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  // CELL RENDERER COMPONENT
  cellRenderer = {
    action: [
      {
        name: 'Pause',
        id: 'Rid_pause',
        icon: 'fa fa-pause'
      },
      {
        name: 'Resume',
        id: 'Rid_restart',
        icon: 'fa fa-play'
      },
      {
        name: 'Cancel',
        id: 'Rid_cancel',
        icon: 'fa fa-close'
      }
    ]
  };

  // SET COLUMN FEILDS
  columnDefs = [
    this.colDefId,
    this.colDefPayeeName,
    this.colDefAmount,
    this.colDefCreatedAt,
    this.colDefStart,
    this.colDefEndDate,
    this.colDefTotal,
    this.colDefPaid,
    this.colDefFrequency,
    this.colDefStatus,
    this.actionField
  ];

  // PASS  FIELD DATA
  columnFields = [
    {
      id: 'id',
      name: '#',
      isDisabled: true,
      colDef: this.colDefId,
      isChecked: true
    },
    {
      id: 'id_payeeName',
      name: 'Payee Name',
      isDisabled: true,
      colDef: this.colDefPayeeName,
      isChecked: true
    },
    {
      id: 'id_amount',
      name: 'Amount',
      isDisabled: true,
      colDef: this.colDefAmount,
      isChecked: true
    },
    {
      id: 'id_created_at',
      name: 'Created at',
      isDisabled: false,
      colDef: this.colDefCreatedAt,
      isChecked: true
    },
    {
      id: 'id_start',
      name: 'Start',
      isDisabled: false,
      colDef: this.colDefStart,
      isChecked: true
    },
    {
      id: 'id_end',
      name: 'End',
      isDisabled: false,
      colDef: this.colDefEndDate,
      isChecked: true
    },
    {
      id: 'id_total',
      name: 'Total',
      isDisabled: false,
      colDef: this.colDefTotal,
      isChecked: true
    },
    {
      id: 'id_paid',
      name: 'Paid',
      isDisabled: false,
      colDef: this.colDefPaid,
      isChecked: true
    },
    {
      id: 'id_frequency',
      name: 'Frequency',
      isDisabled: false,
      colDef: this.colDefFrequency,
      isChecked: true
    },
    {
      id: 'id_status',
      name: 'Status',
      isDisabled: true,
      colDef: this.colDefStatus,
      isChecked: true
    },
    {
      id: 'id_action',
      name: 'Action',
      isDisabled: true,
      colDef: this.actionField,
      isChecked: true
    }
  ];

  // FILTER CUSTOM COMPONENTS
  FloatingFilterComponent = {
    selectBox: [
      {
        id: 'check_draft_recurring_meta_datas.status',
        values: [
          { value: '1', name: 'Started' },
          { value: '2', name: 'Completed' },
          { value: '3', name: 'Paused' },
          { value: '4', name: 'Canceled' },
          { value: '6', name: 'Rejected' }
        ]
      },
      {
        id: 'check_draft_recurring_meta_datas.rrule_freq',
        values: [
          { value: 'WEEKLY', name: 'Weekly' },
          { value: 'BIWEEKLY', name: 'Bi-Weekly' },
          { value: 'MONTHLY', name: 'Monthly' },
          { value: 'QUARTERLY', name: 'Quarterly' },
          { value: 'YEARLY', name: 'Yearly' }
        ]
      }
    ],
    selectDate: [
      {
        id: 'check_draft_recurring_checks.created_at',
        initialRange: 'Last 3 Months',
        isPrimary: true
      },
      { id: 'start_date', initialRange: 'All Time' },
      { id: 'end_date', initialRange: 'All Time' }
    ]
  };

  // ACTION COMPONENT PROPERTIES
  actionComponentProp = {
    actionButton: true,
    eyeButton: true
  };

  ngOnInit() {
    // PASS DATAS TO DATA TABLE SERVICE
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

  /**
   * @description Gets the action component event from the table for the specified selection.
   * @param event - The selection event.
   */
  getActionComp(event: IDtSelectSingleIdSubject | '') {
    if (
      event &&
      Object.keys(event).length === 0 &&
      event.constructor === Object
    )
      return;
    let viewIds: string[] = [];
    if (event && event.selectedRow) {
      switch (event.selectedRow.status) {
        case 1:
          viewIds = ['', 'Rid_restart', ''];
          break;

        case 2:
          viewIds = ['Rid_pause', 'Rid_restart', 'Rid_cancel'];
          break;

        case 3:
          viewIds = ['Rid_pause', '', ''];
          break;

        case 4:
          viewIds = ['Rid_pause', 'Rid_restart', 'Rid_cancel'];
          break;

        case 6:
          viewIds = ['Rid_pause', 'Rid_restart', 'Rid_cancel'];
          break;

        default:
          break;
      }
    }

    this.disabledActions(viewIds);
    if (event && event.id) {
      const id = [event.selectedRow?.id];
      switch (event.id) {
        case 'Rid_pause': {
          const resp1 = this.confirmAction('pause');
          resp1.afterClosed().subscribe((res) => {
            if (res) {
              this.AllActions('s', id, 3);
            }
          });
          break;
        }
        case 'Rid_restart': {
          const resp2 = this.confirmAction('restart');
          resp2.afterClosed().subscribe((res) => {
            if (res) {
              this.AllActions('s', id, 5);
            }
          });
          break;
        }
        case 'Rid_cancel': {
          const resp = this.confirmAction('cancel');
          resp.afterClosed().subscribe((res) => {
            if (res) {
              this.AllActions('s', id, 4);
            }
          });
          break;
        }
        default: {
          break;
        }
      }
    }
  }

  /**
   * @description Disables specified action components.
   * @param ids - An array of action component IDs to disable.
   */
  disabledActions(ids: string[]) {
    this.dataTableService.setActionButtonDisable(true, ids);
  }

  /**
   * @description Handles header button navigation.
   * @param event - The event containing button details.
   */
  headerButtonNavigation(event: Record<string, unknown>) {
    switch (event.id) {
      case 'id_pause':
        this.doAction('p');
        break;

      case 'id_resume':
        this.doAction('r');
        break;

      case 'id_cancel':
        this.doAction('c');
        break;

      default:
        break;
    }
  }

  /**
   * @description Initiates the specified bulk action after confirming with the user.
   * @param type - The type of action to perform.
   */
  doAction(type: string) {
    const msgWaring = {
      title: 'Error',
      content: 'Please select at least one item.',
      doneMsg: 'OK'
    };
    if (this.selectedRow.length === 0) {
      this.alertService.warningAlert(msgWaring);
    } else {
      this.doProcess(type);
    }
  }

  /**
   * @description Initiates the specified bulk action process after confirming with the user.
   * @param type - The type of action to perform.
   */
  doProcess(type: string) {
    let actionType: 's' | 'b';
    if (this.selectedRow.length === 1) {
      actionType = 's';
    } else {
      actionType = 'b';
    }

    switch (type) {
      case 'p':
        this.checkValidProcess(actionType, 'pause', 3);
        break;

      case 'r':
        this.checkValidProcess(actionType, 'resume', 5);

        break;

      case 'c':
        this.checkValidProcess(actionType, 'cancel', 4);

        break;

      default:
        break;
    }
  }

  /**
   * @description Handles the selection of a row in the data table.
   * @param event - The event containing the selected row data.
   */
  onRowSelected(event: RowSelectedEvent) {
    const gridApi = event.api; // all the data table params function get here
    this.selectedRow = gridApi.getSelectedRows();
    this.disablePauseButton.set(false);
    this.disableResumeButton.set(false);
    this.disableCancelButton.set(false);
    this.selectedRow.forEach((element) => {
      if (![1].includes(element.status)) {
        this.disablePauseButton.set(true);
      }
      if (![3].includes(element.status)) {
        this.disableResumeButton.set(true);
      }
      if (![1, 3].includes(element.status)) {
        this.disableCancelButton.set(true);
      }
    });
  }

  /**
   * @description Validates and initiates the specified bulk action process.
   * @param status - The valid statuses for the action.
   * @param actionType - The type of action (single or bulk).
   * @param caption - The action caption (pause, resume, cancel, etc.).
   * @param newStatus - The new status to set after the action.
   */
  checkValidProcess(actionType: 's' | 'b', caption: string, newStatus: number) {
    const Ids: string[] = [];
    this.selectedRow.forEach((element) => {
      Ids.push(element.id);
    });
    const response = this.confirmAction(caption);
    response.afterClosed().subscribe((res) => {
      if (res) {
        this.AllActions(actionType, Ids, newStatus);
      }
    });
  }

  /**
   * @description Shows a confirmation dialog for the specified action.
   * @param msg - The action message (pause, resume, cancel, etc.).
   */
  confirmAction(msg: string) {
    let content;
    if (msg === 'pause') {
      content = 'Are you sure you want to pause the recurring check draft?';
    } else if (msg === 'restart' || msg === 'resume') {
      content = 'Are you sure you want to resume the recurring check draft?';
    } else if (msg === 'cancel') {
      content = 'Are you sure you want to cancel the recurring check draft?';
    }
    const msgs = {
      title: 'Alert!',
      content,
      doneMsg: 'Yes',
      cancelMsg: 'No!'
    };
    return this.alertService.confirmAlert(msgs);
  }

  /**
   * @description Displays a success alert and triggers a data table refresh.
   */
  successAlert() {
    const msg = {
      title: 'Success',
      content: '',
      close: true
    };
    this.dataTableService.setRefreshStatus(true);
    this.alertService.successAlert(msg);
  }

  /**
   * @description Initiates the specified action for all selected rows.
   * @param actionType - The type of action (single or bulk).
   * @param Ids - An array of IDs for the selected rows.
   * @param type - The new status to set after the action.
   */
  AllActions(actionType: 's' | 'b', Ids: unknown[], type: number) {
    if (actionType === 's') {
      this.singleProcess(Ids[0] as string, type);
    } else {
      const data = {
        ids: Ids as string[],
        status: type
      };
      this.bulkProcess(data);
    }
  }

  /**
   * @description Initiates a single check draft action.
   * @param id - The ID of the check draft.
   * @param type - The new status to set after the action.
   */
  singleProcess(id: string, type: number) {
    const data = {
      status: type
    };
    if (data.status === 3) {
      this.pauseLoading.set(true);
    } else if (data.status === 4) {
      this.cancelLoading.set(true);
    } else if (data.status === 5) {
      this.resumeLoading.set(true);
    }
    this.subscriptions.push(
      this.checkDraftService
        .singleRecurring(id, data)
        .pipe(
          finalize(() => {
            this.pauseLoading.set(false);
            this.cancelLoading.set(false);
            this.resumeLoading.set(false);
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.v3DataTableService.refreshV3DataTable();
            this.v3DataTableService.v3RowSelectionData = [];
            this.v3DataTableService.gridApi?.deselectAll();
            this.successAlert();
          }
        })
    );
  }

  /**
   * @description Initiates a bulk check draft action.
   * @param data - The data containing IDs and the new status.
   */
  bulkProcess(data: { ids: string[]; status: number }) {
    if (data.status === 3) {
      this.pauseLoading.set(true);
    } else if (data.status === 4) {
      this.cancelLoading.set(true);
    } else if (data.status === 5) {
      this.resumeLoading.set(true);
    }
    this.subscriptions.push(
      this.checkDraftService
        .bulkRecurring(data)
        .pipe(
          finalize(() => {
            this.pauseLoading.set(false);
            this.cancelLoading.set(false);
            this.resumeLoading.set(false);
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.v3DataTableService.refreshV3DataTable();
            this.v3DataTableService.v3RowSelectionData = [];
            this.v3DataTableService.gridApi?.deselectAll();
            this.successAlert();
          }
        })
    );
  }

  /**
   * @description Displays a warning alert when recurring check drafts are not found.
   */
  waringAlert() {
    const data = {
      title: 'Oops',
      content: 'Recurring check draft not Found.',
      doneMsg: 'OK',
      isCancel: false
    };
    this.alertService.warningAlert(data);
  }

  /**
   * @description Navigates to the view page for a selected recurring check.
   * @param selectedItem - The selected row data.
   */
  getViewAction(selectedItem: IDtSelectSingleIdSubject) {
    if (selectedItem.selectedRow) {
      this.router.navigate(
        [
          `/manage/checkdraft/recurringView/${selectedItem.selectedRow.check_id}`
        ],
        { queryParams: { recurring: 1 } }
      );
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}

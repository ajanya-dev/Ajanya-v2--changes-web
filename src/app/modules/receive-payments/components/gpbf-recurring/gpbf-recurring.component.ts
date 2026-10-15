import { CurrencyPipe } from '@angular/common';
import {
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { ColDef, ICellRendererParams } from '@ag-grid-community/core';
import { Subject, map, takeUntil } from 'rxjs';
import { Router } from '@angular/router';
import { GetPaidByFormService } from 'src/app/shared/service/getPaidByForm/get-paid-by-form.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { DtSelectAllCheckBoxComponent } from 'src/app/modules/data-table/components/dt-select-all-check-box/dt-select-all-check-box.component';
import { DtActionComponent } from 'src/app/modules/data-table/components/dt-action/dt-action.component';
import { DtSearchBoxComponent } from 'src/app/modules/data-table/components/dt-search-box/dt-search-box.component';
import { RequestPaymentsService } from 'src/app/shared/service/RequestPayments/request-payments.service';
import {
  IDtActionCompProp,
  IDtCellrendererBtn,
  IDtColumnFields,
  IDtFloatingFilterProp,
  ISelectedSingleRow
} from 'src/app/modules/data-table/model/datatable';
import { DataRangeV35Component } from 'src/app/shared/components/date-range-v35/data-range-v35.component';
import { IGatPaidCheckRecurring } from 'src/app/models/check-recurring';
import { faPause, faPlay, faRemove } from '@fortawesome/pro-solid-svg-icons';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { V3DataTableSelectBoxComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-data-table-select-box/v3-data-table-select-box.component';
import { RecurringService } from '../../services/recurring.service';
import { GpbrSelectBoxComponent } from '../gpbr-select-box/gpbr-select-box.component';
import { V3DataTableComponent } from '../../../v3-data-table/components/v3-data-table/v3-data-table.component';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';

/**
 * @description This component is used to handle a aggrid table
 */
@Component({
  selector: 'app-gpbf-recurring',
  templateUrl: './gpbf-recurring.component.html',
  styleUrls: ['./gpbf-recurring.component.scss'],
  standalone: true,
  imports: [V3DataTableComponent]
})
export class GpbfRecurringComponent implements OnInit, OnDestroy {
  public dialog = inject(MatDialog);
  private dataTableService = inject(DataTableService);
  private recurringService = inject(RecurringService);
  private getPaidByFormService = inject(GetPaidByFormService);
  private alertService = inject(AlertService);
  private requestpayment = inject(RequestPaymentsService);
  private router = inject(Router);
  private currencyPipe = inject(CurrencyPipe);
  private v3DataTableService = inject(V3DataTableService);

  public tableId = DTTableId.getPaidFormRecurring; // Data Table Id
  actionComponentProp: IDtActionCompProp;
  dateRangeField: string;
  postData = { frequency: '' };
  selectedRow: IGatPaidCheckRecurring[] = [];
  exportConfig: { heading: string; ignoreColumns?: string[] } = {
    heading: 'Get Paid By Form Recurring',
    ignoreColumns: ['id', 'action']
  };

  destroy$ = new Subject<boolean>();
  fieldsShownByDefault: string[] = [
    'action',
    'cheque_amount',
    'payee_name',
    'boxId'
  ];

  pauseDisabled = signal(false);
  resumeDisabled = signal(false);
  cancelDisabled = signal(false);

  public headerElements = computed(() => ({
    buttons: [
      {
        text: 'Pause',
        id: 'id_pause_gpbf',
        isAddIcon: true,
        icon: faPause,
        backGroundInput: 'var(--common-blue-color)',
        type: 'list',
        disabled: this.pauseDisabled()
      },
      {
        text: 'Resume',
        id: 'id_restart_gpbf',
        isAddIcon: true,
        icon: faPlay,
        backGroundInput: 'var(--common-green-color)',
        type: 'list',
        disabled: this.resumeDisabled()
      },
      {
        text: 'Cancel',
        id: 'id_cancel_gpbf',
        isAddIcon: true,
        icon: faRemove,
        backGroundInput: 'var(--common-red-color)',
        type: 'list',
        disabled: this.cancelDisabled()
      }
    ]
  }));

  public frameworkComponents = {
    headerCheckBoxComponent: DtSelectAllCheckBoxComponent,
    selectBoxComponent: V3DataTableSelectBoxComponent,
    selectDateComponent: DataRangeV35Component,
    actionComponent: DtActionComponent,
    SearchBoxComponent: DtSearchBoxComponent,
    selectFrequency: GpbrSelectBoxComponent
  };

  cellRenderer: IDtCellrendererBtn = {
    action: [
      {
        name: 'Pause',
        id: 'Rid_pauseg',
        icon: 'fa fa-pause'
      },
      {
        name: 'Resume',
        id: 'Rid_restartg',
        icon: 'fa fa-play'
      },
      {
        name: 'Cancel',
        id: 'Rid_cancelg',
        icon: 'fa fa-remove'
      }
    ]
  };

  FloatingFilterComponent: IDtFloatingFilterProp = {
    selectBox: [
      {
        id: 'get_paid_by_form_recurring_meta_datas.status',
        values: [
          { value: 1, name: 'Started' },
          { value: 2, name: 'Completed' },
          { value: 3, name: 'Paused' },
          { value: 4, name: 'Canceled' },
          { value: 5, name: 'Starting Soon ' }
        ]
      }
    ],
    selectDate: [
      { id: 'start_date', initialRange: 'All Time', isPrimary: true },
      { id: 'end_date', initialRange: 'All Time' }
    ]
  };

  ngOnInit(): void {
    this.dataTableService.setDataFromParent(
      undefined,
      this.FloatingFilterComponent,
      this.cellRenderer,
      {
        actionButton: true,
        eyeButton: true
      }
    );

    this.requestpayment.$frequency
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res || res === '') {
          this.postData.frequency = res;
          this.v3DataTableService.refreshV3DataTable();
        }
      });

    this.v3DataTableService.resetV3DataTablePayload();
    this.v3DataTableService.refreshV3DataTable();
    this.getSelectedRows();
  }

  getSelectedRows() {
    this.v3DataTableService.v3RowSelectionData$
      .pipe(
        map((val) => val.map((el) => el.data)),
        takeUntil(this.destroy$)
      )
      .subscribe((val) => {
        this.selectedRow = val;
        if (val && val.length) {
          this.resumeDisabled.set(false);
          this.pauseDisabled.set(false);
          this.cancelDisabled.set(false);

          let hasStarted = false;
          let hasPaused = false;
          let hasCancelled = false;
          let hasCompleted = false;

          for (let i = 0; i < val.length; i += 1) {
            const el = val[i];
            if (el.status === 1) {
              hasStarted = true;
            }
            if (el.status === 2) {
              hasCompleted = true;
            }
            if (el.status === 3) {
              hasPaused = true;
            }
            if (el.status === 4) {
              hasCancelled = true;
            }
          }

          if (hasStarted) {
            this.resumeDisabled.set(true);
          }

          if (hasCancelled || hasCompleted) {
            this.resumeDisabled.set(true);
            this.pauseDisabled.set(true);
            this.cancelDisabled.set(true);
          }

          if (hasPaused) {
            this.pauseDisabled.set(true);
          }
        } else {
          this.resumeDisabled.set(false);
          this.pauseDisabled.set(false);
          this.cancelDisabled.set(false);
        }
      });
  }

  /**
   * @description Handles the action component for recurring ACH payment.
   * @param env The environment object containing the selected row information
   */
  getActionComp(env: ISelectedSingleRow) {
    if (env.selectedRow) {
      let viewIds: string[] = [];
      switch (env.selectedRow.status) {
        case 1:
          viewIds = ['', 'Rid_restartg', ''];
          break;

        case 2:
          viewIds = ['Rid_pauseg', 'Rid_restartg', 'Rid_cancelg'];
          break;

        case 3:
          viewIds = ['Rid_pauseg', '', ''];
          break;

        case 4:
          viewIds = ['Rid_pauseg', 'Rid_restartg', 'Rid_cancelg'];
          break;

        case 5:
          viewIds = ['', 'Rid_restartg', ''];
          break;

        default:
          break;
      }

      this.disabledActions(viewIds);

      switch (env.id) {
        case 'Rid_pauseg': {
          const data = {
            status: 3
          };
          this.sinlgeRowActions(env.selectedRow.encrypted_id, data, 'pause');
          break;
        }

        case 'Rid_restartg': {
          const data1 = {
            status: 5
          };
          this.sinlgeRowActions(env.selectedRow.encrypted_id, data1, 'resume');
          break;
        }

        case 'Rid_cancelg': {
          const data2 = {
            status: 4
          };
          this.sinlgeRowActions(env.selectedRow.encrypted_id, data2, 'cancel');
          break;
        }

        default:
          break;
      }
    }
  }

  /**
   * @description Handles the action for a single row in the recurring ACH payments.
   * @param id - The ID of the selected row
   * @param data - The data object containing the status of the action
   * @param msg - The message indicating the action to be performed
   */
  sinlgeRowActions(id: string, data: { status: number }, msg: string) {
    const response = this.confirmAction(msg);
    response
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res) {
          if (msg === 'pause') {
            this.singlePause(id, data);
          } else if (msg === 'resume') {
            this.singleRestart(id, data);
          } else {
            this.singleCancel(id, data);
          }
        }
      });
  }

  disabledActions(ids: string[]) {
    this.dataTableService.setActionButtonDisable(true, ids);
  }

  /**
   * @description Handles the navigation and action triggered by the header buttons in the reccuring ACH payment component
   * @param env - The environment object containing the button information
   */
  headerButtonNavigation(env: { id: string }) {
    switch (env.id) {
      case 'id_gpbf':
        this.recurringService.setToggle(1);
        break;

      case 'id_ach_R':
        this.recurringService.setToggle(2);
        break;

      case 'id_pause_gpbf':
        this.doAction('p', 'pause');
        break;

      case 'id_restart_gpbf':
        this.doAction('r', 'resume');
        break;

      case 'id_cancel_gpbf':
        this.doAction('c', 'cancel');
        break;

      default:
        break;
    }
  }

  /**
   *
   * @description Performs an action on the selected items in the recurring ACH payment component
   * @param type -The type of action to be perfored (p-pause,r-resume,c-cancel)
   * @param msg -The message associated with the action
   */
  doAction(type: string, msg: string) {
    const msgWaring = {
      title: 'Error',
      content: 'Please select at least one item.',
      doneMsg: 'OK'
    };
    if (this.selectedRow.length === 0) {
      this.alertService.warningAlert(msgWaring);
      return;
    }
    this.doProcess(type, msg);
  }

  /**
   *
   * @description Performs a process based on the selected items in the recurring ACH payments component.
   * @param type -The type of action to be perfored (p-pause,r-resume,c-cancel)
   * @param msg -The message associated with the action
   */
  doProcess(type: string, msg: string) {
    let actionType: string;
    let Status: number[] = [];
    let Ids: string[] = [];

    if (this.selectedRow.length === 1) {
      actionType = 's';
    } else {
      actionType = 'b';
    }

    switch (type) {
      case 'p': {
        Status = [1];
        Ids = this.checkValidProcess(Status, 'pause');

        if (Ids.length === 0) {
          return;
        }
        const response = this.confirmAction(msg);
        response
          .afterClosed()
          .pipe(takeUntil(this.destroy$))
          .subscribe((res) => {
            if (res) {
              this.PauseActions(actionType, Ids);
            }
          });
        break;
      }

      case 'r': {
        Status = [3];
        Ids = this.checkValidProcess(Status, 'resume');

        if (Ids.length === 0) {
          return;
        }
        const response = this.confirmAction(msg);
        response
          .afterClosed()
          .pipe(takeUntil(this.destroy$))
          .subscribe((res) => {
            if (res) {
              this.RestartActions(actionType, Ids);
            }
          });
        break;
      }

      case 'c': {
        Status = [1, 3];
        Ids = this.checkValidProcess(Status, 'cancel');

        if (Ids.length === 0) {
          return;
        }
        const response = this.confirmAction(msg);
        response
          .afterClosed()
          .pipe(takeUntil(this.destroy$))
          .subscribe((res) => {
            if (res) {
              this.CancelActions(actionType, Ids);
            }
          });
        break;
      }

      default:
        break;
    }
  }

  /**
   * @description Checks the validity of selected items for a specific process in tlhe recurring ACH payments component
   * @param status - The valid status values for the process
   * @param type - The type of process being performed
   * @readonly  - An array of valid Ids for the process
   */
  checkValidProcess(status: number[], type: string) {
    let misMatch = false;
    const Ids: string[] = [];

    const failed = {
      title: 'Error',
      content: `Cannot ${type} this payment`,
      doneMsg: 'OK'
    };

    this.selectedRow.forEach((element) => {
      Ids.push(element.encrypted_id);
      if (!status.includes(element.status)) {
        misMatch = true;
      }
    });

    if (misMatch) {
      this.alertService.failedAlert(failed);
      return [];
    }
    return Ids;
  }

  /**
   * @description Used to confirm actions.
   * @param msg message type.
   */
  confirmAction(msg: string) {
    const msgs = {
      title: 'Alert!',
      content: `Are you sure you want to ${msg}?`
    };
    return this.alertService.confirmAlert(msgs);
  }

  /**
   * @description Show success alert.
   * @param alertContent Alert content.
   */
  successAlert(alertContent: string) {
    const msg = {
      title: 'Success',
      content: alertContent,
      close: true
    };
    this.alertService.successAlert(msg);
    this.v3DataTableService.gridApi.deselectAll();
    this.v3DataTableService.refreshV3DataTable();
  }

  /**
   * @description Used to pause recurring.
   * @param actionType action type.
   * @param Ids Selected row ids.
   */
  PauseActions(actionType: string, Ids: string[]) {
    if (actionType === 's') {
      const data = {
        status: 3
      };
      this.singlePause(this.selectedRow[0].encrypted_id, data);
    } else {
      const data = {
        ids: Ids,
        status: 3
      };
      this.bulkPause(data);
    }
  }

  /**
   * @description Restart recurring.
   * @param actionType action type.
   * @param Ids Selected row ids.
   */
  RestartActions(actionType: string, Ids: string[]) {
    if (actionType === 's') {
      const data = {
        status: 5
      };
      this.singleRestart(this.selectedRow[0].encrypted_id, data);
    } else {
      const data = {
        ids: Ids,
        status: 5
      };
      this.bulkRestart(data);
    }
  }

  /**
   * @description Cancel recurring.
   * @param actionType action type.
   * @param Ids Selected row ids.
   */
  CancelActions(actionType: string, Ids: string[]) {
    if (actionType === 's') {
      const data = {
        status: 4
      };
      this.singleCancel(this.selectedRow[0].encrypted_id, data);
    } else {
      const data = {
        ids: Ids,
        status: 4
      };
      this.bulkCancel(data);
    }
  }

  /**
   * @description Navigate to view page.
   */
  getViewAction(env: ISelectedSingleRow) {
    if (env.selectedRow?.encrypted_id) {
      this.router.navigate(
        ['manage/receivedchecks/recurring/request_index_view'],
        { queryParams: { recurring: 1, id: env.selectedRow?.check_id } }
      );
    }
  }

  /**
   * @description Pauses recurring.
   * @param id Selected row id.
   * @param data status number.
   */
  singlePause(id: string, data: { status: number }) {
    this.getPaidByFormService
      .singlePause(id, data)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res.success) {
          this.successAlert('Paused');
        }
      });
  }

  /**
   * @description Pause multiple recurring.
   */
  bulkPause(data: { ids: string[]; status: number }) {
    this.getPaidByFormService
      .bulkPause(data)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res.success) {
          this.successAlert('Paused');
        }
      });
  }

  /**
   * @description Restart the recurring.
   */
  singleRestart(id: string, data: { status: number }) {
    this.getPaidByFormService
      .singleRestart(id, data)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res.success) {
          this.successAlert('Restarted');
        }
      });
  }

  /**
   * @description Restart the multiple items recurring.
   * @param data
   */
  bulkRestart(data: { ids: string[]; status: number }) {
    this.getPaidByFormService
      .bulkRestart(data)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res.success) {
          this.successAlert('Restarted');
        }
      });
  }

  /**
   * @description Cancel single recurring.
   */
  singleCancel(id: string, data: { status: number }) {
    this.getPaidByFormService
      .singleCancel(id, data)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res.success) {
          this.successAlert('Canceled');
        }
      });
  }

  /**
   * @description Cancel the multiple recurring.
   */
  bulkCancel(data: { ids: string[]; status: number }) {
    this.getPaidByFormService
      .bulkCancel(data)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res.success) {
          this.successAlert('Canceled');
        }
      });
  }

  colDefId: ColDef = {
    headerName: '',
    field: 'boxId',
    suppressFloatingFilterButton: true,
    maxWidth: 50,
    checkboxSelection: true,
    headerCheckboxSelection: true,
    floatingFilter: false,
    sortable: false,
    suppressHeaderMenuButton: true,
    lockPosition: true,
    resizable: false,
    headerClass: 'fixed-size-header',
    pinned: 'left'
  };

  colDefFrom = {
    headerName: 'From',
    field: 'payee_name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefFrequency = {
    headerName: 'Frequency',
    field: 'rrule_freq',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectFrequency',
    filter: 'agNumberColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer:(params:ICellRendererParams) => {
      if(params?.data?.rrule_interval === 1 && params?.data?.rrule_freq === 'WEEKLY'){
        return 'WEEKLY';
      }
      if(params?.data?.rrule_interval === 2 && params?.data?.rrule_freq === 'WEEKLY'){
        return 'BI-WEEKLY';
      }
      if(params?.data?.rrule_interval === 3 && params?.data?.rrule_freq === 'MONTHLY'){
        return 'MONTHLY';
      }
      return params?.data?.rrule_freq;
    }
  };

  colDefOfPay = {
    headerName: '# of Pay',
    field: 'total',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: (params: {
      data: { is_it_unlimited: number };
      value: unknown;
    }) => {
      if (params.data.is_it_unlimited === 1) {
        return `<span style='color:#4e9e47'>Unlimited</span>`;
      }
      return params.value;
    },
    cellRendererForExport: (params: {
      data: { is_it_unlimited: number };
      value: string;
    }): string => {
      if (params.data.is_it_unlimited === 1) {
        return `Unlimited`;
      }
      return params.value;
    }
  };

  colDefOfPaid = {
    headerName: '# of Paid',
    field: 'completed',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefOfLeft = {
    headerName: '# of Left',
    field: 'get_paid_by_form_checks.total',
    suppressFloatingFilterButton: true,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    sortable:false,
    cellRenderer: (params: {
      data: { is_it_unlimited: number; total: number; completed: number };
    }) => {
      if (params.data.is_it_unlimited === 1) {
        return `<span style='color:#4e9e47'>Unlimited</span>`;
      }
      return params.data.total - params.data.completed;
    },
    cellRendererForExport: (params: {
      data: { is_it_unlimited: number; total: number; completed: number };
    }): string => {
      if (params.data.is_it_unlimited === 1) {
        return `Unlimited`;
      }
      return (params.data.total - params.data.completed)?.toString();
    }
  };

  colDefMemoOrFor = {
    headerName: 'Memo/for',
    field: 'memo',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefStart = {
    headerName: 'Start',
    field: 'start_date',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectDateComponent',
    filter: 'agDateColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    filterParams: { newRowsAction: 'keep' }
  };

  colDefEnd = {
    headerName: 'End',
    field: 'end_date',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectDateComponent',
    filter: 'agDateColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    filterParams: { newRowsAction: 'keep' },
    cellRenderer: (params: {
      data: { is_it_unlimited: number };
      value: unknown;
    }) => {
      if (params.data.is_it_unlimited === 1) {
        return `<b><span style='color:#efc200' title="this recurring is unlimited">Until Cancel</span></b>`;
      }
      return params.value;
    },
    cellRendererForExport: (params: {
      data: { is_it_unlimited: number };
      value: string;
    }): string => {
      if (params.data.is_it_unlimited === 1) {
        return `Until Cancel`;
      }
      return params.value;
    }
  };

  colDefStatus: ColDef = {
    headerName: 'Status',
    field: 'get_paid_by_form_recurring_meta_datas.status',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectBoxComponent',
    filter: 'agNumberColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellStyle: (params) => {
      let color = '';
      if (params.data.status === 1) {
        color = '#4e9e57';
      } else if (params.data.status === 2) {
        color = '#4e9e47';
      } else if (params.data.status === 3) {
        color = '#efc200';
      } else if (params.data.status === 4) {
        color = '#f10000';
      } else if (params.data.status === 5) {
        color = '#4e9e47';
      }

      return { color };
    },
    cellRenderer: (params: { data: { status: number } }) => {
      let status = '';

      if (params.data.status === 1) {
        status = 'Started';
      } else if (params.data.status === 2) {
        status = 'Completed';
      } else if (params.data.status === 3) {
        status = 'Paused';
      } else if (params.data.status === 4) {
        status = 'Cancelled';
      } else if (params.data.status === 5) {
        status = 'Starting Soon';
      }
      return status;
    }
  };

  colDefAction = {
    headerName: 'Action',
    field: 'action',
    suppressFloatingFilterButton: true,
    maxWidth: 120,
    cellRenderer: 'actionComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    sortable: false
  };

  colDefAmount = {
    headerName: 'Amount',
    minWidth: 100,
    maxWidth: 150,
    field: 'cheque_amount',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'ag-right-aligned-cell pr-3',
    cellRenderer: (params: { value: string | number }) =>
      this.currencyPipe.transform(params.value)
  };

  columnDefs: ColDef[] = [
    this.colDefId,
    this.colDefFrom,
    this.colDefAmount,
    this.colDefFrequency,
    this.colDefOfPay,
    this.colDefOfPaid,
    this.colDefOfLeft,
    this.colDefMemoOrFor,
    this.colDefStart,
    this.colDefEnd,
    this.colDefStatus,
    this.colDefAction
  ];

  columnFields: IDtColumnFields[] = [
    {
      id: 'boxId',
      name: '#',
      isDisabled: true,
      colDef: this.colDefId,
      isChecked: true
    },
    {
      id: 'id_from',
      name: 'From',
      isDisabled: true,
      colDef: this.colDefFrom,
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
      id: 'id_frequency',
      name: 'Frequency',
      isDisabled: false,
      colDef: this.colDefFrequency,
      isChecked: true
    },
    {
      id: 'id_of_pay',
      name: '# of Pay',
      isDisabled: false,
      colDef: this.colDefOfPay,
      isChecked: true
    },
    {
      id: 'id_of_paid',
      name: '# of Paid',
      colDef: this.colDefOfPaid,
      isChecked: true
    },
    {
      id: 'id_of_left',
      name: '# of Left',
      isDisabled: false,
      colDef: this.colDefOfLeft,
      isChecked: true
    },
    {
      id: 'id_memo',
      name: 'Memo/for',
      isDisabled: false,
      colDef: this.colDefMemoOrFor,
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
      colDef: this.colDefEnd,
      isChecked: true
    },
    {
      id: 'id_status',
      name: 'Status',
      isDisabled: false,
      colDef: this.colDefStatus,
      isChecked: true
    },
    {
      id: 'id_action',
      name: 'Action',
      isDisabled: true,
      colDef: this.colDefAction,
      isChecked: true
    }
  ];

  ngOnDestroy(): void {
    this.destroy$.next(true);
  }
}

import { CurrencyPipe } from '@angular/common';
import {
  Component,
  OnDestroy,
  OnInit,
  Signal,
  computed,
  inject,
  signal
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { ColDef, ICellRendererParams } from '@ag-grid-community/core';
import { takeUntil, map, Subject } from 'rxjs';
import { Router } from '@angular/router';
import { GetPaidByFormService } from 'src/app/shared/service/getPaidByForm/get-paid-by-form.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { DtSelectAllCheckBoxComponent } from 'src/app/modules/data-table/components/dt-select-all-check-box/dt-select-all-check-box.component';
import { DtActionComponent } from 'src/app/modules/data-table/components/dt-action/dt-action.component';
import { DtSearchBoxComponent } from 'src/app/modules/data-table/components/dt-search-box/dt-search-box.component';
import {
  IDtActionCompProp,
  IDtCellrendererBtn,
  IDtColumnFields,
  IDtFloatingFilterProp,
  ISelectedSingleRow
} from 'src/app/modules/data-table/model/datatable';
import { DataRangeV35Component } from 'src/app/shared/components/date-range-v35/data-range-v35.component';
import { IAchRecurringTableRow } from 'src/app/models/check-recurring';
import { IV3DtHeaderElements } from 'src/app/modules/v3-data-table/models/v3-data-table';
import { faPause, faPlay, faRemove } from '@fortawesome/pro-solid-svg-icons';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { V3DataTableSelectBoxComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-data-table-select-box/v3-data-table-select-box.component';
import { RecurringService } from '../../services/recurring.service';
import { V3DataTableComponent } from '../../../v3-data-table/components/v3-data-table/v3-data-table.component';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';

/**
 * @description Component for displaying a table of recurring ach payment details using agGrid
 */
@Component({
  selector: 'app-ach-recurring',
  templateUrl: './ach-recurring.component.html',
  styleUrls: ['./ach-recurring.component.scss'],
  standalone: true,
  imports: [V3DataTableComponent],
  providers: [CurrencyPipe]
})
export class AchRecurringComponent implements OnInit, OnDestroy {
  public dialog = inject(MatDialog);
  private dataTableService = inject(DataTableService);
  private v3DataTableService = inject(V3DataTableService);
  private recurringService = inject(RecurringService);
  private router = inject(Router);
  private getPaidByFormService = inject(GetPaidByFormService);
  private alertService = inject(AlertService);
  private currencyPipe = inject(CurrencyPipe);

  public tableId = DTTableId.achRecurring; // Data Table Id
  actionComponentProp: IDtActionCompProp;
  dateRangeField: string;
  selectedRow: IAchRecurringTableRow[];
  addRequest = { ach_type: 1 };
  exportConfig: { heading: string; ignoreColumns?: string[] } = {
    heading: 'ACH Recurring',
    ignoreColumns: ['uu_id', 'action']
  };

  destroy$ = new Subject<boolean>();
  fieldsShownByDefault: string[] = [
    'from',
    'recurring_base_data.amount',
    'boxId'
  ];

  pauseDisabled = signal(false);
  resumeDisabled = signal(false);
  cancelDisabled = signal(false);

  public frameworkComponents = {
    headerCheckBoxComponent: DtSelectAllCheckBoxComponent,
    selectBoxComponent: V3DataTableSelectBoxComponent,
    selectDateComponent: DataRangeV35Component,
    actionComponent: DtActionComponent,
    SearchBoxComponent: DtSearchBoxComponent
  };

  cellRenderer: IDtCellrendererBtn = {
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
        icon: 'fa fa-remove'
      }
    ]
  };

  FloatingFilterComponent: IDtFloatingFilterProp = {
    selectBox: [
      {
        id: 'status',
        values: [
          { value: 1, name: 'Started' },
          { value: 2, name: 'Completed' },
          { value: 3, name: 'Paused' },
          { value: 4, name: 'Canceled' }
        ]
      }
    ],
    selectDate: [
      { id: 'start_date', initialRange: 'All Time', isPrimary: true },
      { id: 'end_date', initialRange: 'All Time' }
    ]
  };

  public headerElements: Signal<IV3DtHeaderElements> = computed(() => ({
    buttons: [
      {
        text: 'Pause',
        id: 'id_pause_ach',
        isAddIcon: true,
        icon: faPause,
        backGroundInput: 'var(--common-blue-color)',
        type: 'list',
        disabled: this.pauseDisabled()
      },
      {
        text: 'Resume',
        id: 'id_restart_ach',
        isAddIcon: true,
        icon: faPlay,
        backGroundInput: 'var(--common-green-color)',
        type: 'list',
        disabled: this.resumeDisabled()
      },
      {
        text: 'Cancel',
        id: 'id_cancel_ach',
        isAddIcon: true,
        icon: faRemove,
        backGroundInput: 'var(--common-red-color)',
        type: 'list',
        disabled: this.cancelDisabled()
      }
    ]
  }));

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

  getViewAction(env: ISelectedSingleRow) {
    if (env.selectedRow) {
      this.router.navigate(['manage/receivedchecks/recurring/show'], {
        queryParams: { id: env.selectedRow?.id }
      });
    }
  }

  /**
   * @description Get the action component based on the environment.
   * @param env -The environment object containing selectedRow information
   */
  getActionComp(env: ISelectedSingleRow) {
    if (env.selectedRow) {
      let viewIds: string[] = [];
      const id = [env.selectedRow?.id];
      switch (env.selectedRow.status) {
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

        default:
          break;
      }

      this.disabledActions(viewIds);

      switch (env.id) {
        case 'Rid_pause':
          this.singleRowProcess('s', id, 3, 'Paused', 'pause');
          break;

        case 'Rid_restart':
          this.singleRowProcess('s', id, 5, 'Restarted', 'resume');
          break;

        case 'Rid_cancel':
          this.singleRowProcess('s', id, 4, 'Canceled', 'cancel');
          break;

        default:
          break;
      }
    }
  }

  singleRowProcess(
    mode: string,
    id: string[],
    type: number,
    caption: string,
    msg: string
  ) {
    const response = this.confirmAction(msg);
    response
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res) {
          this.AllActions(mode, id, type, caption);
        }
      });
  }

  disabledActions(ids: string[]) {
    this.dataTableService.setActionButtonDisable(true, ids);
  }

  headerButtonNavigation(env: { id: string }) {
    switch (env.id) {
      case 'id_gpbf':
        this.recurringService.setToggle(1);
        break;

      case 'id_ach_R':
        this.recurringService.setToggle(2);
        break;

      case 'id_pause_ach':
        this.doAction('p', 'pause');
        break;

      case 'id_restart_ach':
        this.doAction('r', 'resume');
        break;

      case 'id_cancel_ach':
        this.doAction('c', 'cancel');
        break;

      default:
        break;
    }
  }

  doAction(type: string, msg: string) {
    const msgWaring = {
      title: 'Error',
      content: 'Please select at least one item.',
      doneMsg: 'OK'
    };
    if (this.selectedRow.length === 0) {
      this.alertService.warningAlert(msgWaring);
    } else {
      this.doProcess(type, msg);
    }
  }

  /**
   *@description Perform a process based on the given type and message
   @param type - The type of process to perform (p-pause,r-resume,c-cancel)
   @param msg -The message to display in the confirmation dialog
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
              this.AllActions(actionType, Ids, 3, 'Recurring Paused');
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
              this.AllActions(actionType, Ids, 5, 'Recurring Restarted');
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
              this.AllActions(actionType, Ids, 4, 'Recurring Canceled');
            }
          });
        break;
      }

      default:
        break;
    }
  }

  /**
   * @description Check for valid process based on the given status and message
   * @param status - An array of status values to check against
   * @param msg - The message to display in case of mismatched status
   * @returns - An array of IDs for valid process
   */
  checkValidProcess(status: number[], msg: string) {
    let misMatch = false;
    const Ids: string[] = [];

    const failed = {
      title: 'Error',
      content: `Cannot ${msg} this payment`,
      doneMsg: 'OK'
    };

    this.selectedRow.forEach((element: { id: string; status: number }) => {
      Ids.push(element.id);
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

  confirmAction(msg: string) {
    const msgs = {
      title: 'Alert!',
      content: `Are you sure you want to ${msg}?`
    };
    return this.alertService.confirmAlert(msgs);
  }

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
   *
   * @description Perform actions based on the action type, IDs,process type,and name
   * @param actionType -The action type (s-single row,b-bulk rows)
   * @param Ids -The array of IDs for the processes
   * @param type -The process type
   * @param name -The name of the process
   */
  AllActions(actionType: string, Ids: string[], type: number, name: string) {
    if (actionType === 's') {
      this.singleProcess(Ids[0], type, name);
    } else {
      const data = {
        ids: Ids,
        status: type
      };
      this.bulkProcess(data, name);
    }
  }

  /**
   * @description Perform a single process for a specific ID and process type
   * @param id - The ID of the process
   * @param type -The proess type
   * @param name -The name of the process
   */
  singleProcess(id: string, type: number, name: string) {
    this.getPaidByFormService
      .recurringChangeSatatus(id, type)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res.success) {
          this.successAlert(name);
        }
      });
  }

  /**
   *
   * @description Perform a bulk process for multiple IDs and a process type
   */
  bulkProcess(data: { ids: string[]; status: number }, name: string) {
    this.getPaidByFormService
      .recurringChangeSatatusBulk(data)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res.success) {
          this.successAlert(name);
        }
      });
  }

  waringAlert() {
    const data = {
      title: 'Oops',
      content: 'Recurring Payments not Found.',
      doneMsg: 'Ok',
      isCancel: false
    };
    this.alertService.warningAlert(data);
  }

  colDefAmount: ColDef = {
    headerName: 'Amount',
    minWidth: 100,
    maxWidth: 150,
    field: 'recurring_base_data.amount',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'ag-right-aligned-cell pr-3',
    cellRenderer: (params: ICellRendererParams) =>
      this.currencyPipe.transform(params.data?.recurring_base_data?.amount)
  };

  colDefId = {
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
    pinned: 'left' as const
  };

  colDefFrom = {
    headerName: 'From',
    field: 'from',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    sortable: false,
    cellRenderer: (params: { data: { from: string } }) => params.data.from
  };

  colDefFrequency = {
    headerName: 'Frequency',
    field: 'rrule_freq',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefOfPay = {
    headerName: '# of Pay',
    field: 'total',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
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
    field: 'remaining',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefMemoOrFor = {
    headerName: 'Memo/for',
    field: 'recurring_base_data.memo',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRendererForExport: (params: ICellRendererParams) => 
      // Only For when Export Table data
       params?.data?.recurring_base_data?.memo
    ,
  };

  colDefStart = {
    headerName: 'Start Date',
    field: 'start_date',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectDateComponent',
    filter: 'agDateColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    filterParams: { newRowsAction: 'keep' },
    cellRenderer: (params: { data: { start_date: string } }) =>
      params.data.start_date
  };

  colDefEnd = {
    headerName: 'End Date',
    field: 'end_date',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectDateComponent',
    filter: 'agDateColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    filterParams: { newRowsAction: 'keep' }
  };

  colDefStatus = {
    headerName: 'Status',
    field: 'status',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectBoxComponent',
    filter: 'agNumberColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: (params: { value: string | number }) => {
      let status = '';

      if (params.value === 1 || params.value === '1') {
        status = "<span style='color:#4e9e47'>Started</span>";
      } else if (params.value === 2) {
        status =
          "<span style='color:#4e9e47'><strong>Completed</strong></span>";
      } else if (params.value === 3) {
        status = "<span style='color:#efc200'>paused</span>";
      } else if (params.value === 4) {
        status = "<span style='color:#f10000' >canceled</span>";
      }
      return status;
    },
    cellRendererForExport: (params: { value: string | number }): string => {
      let status = '';
      if (params.value === 1 || params.value === '1') {
        status = 'Started';
      } else if (params.value === 2) {
        status = 'Completed';
      } else if (params.value === 3) {
        status = 'Paused';
      } else if (params.value === 4) {
        status = 'Canceled';
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

  colDefType = {
    headerName: 'Type',
    field: 'is_it_is_send_or_received',
    suppressFloatingFilterButton: true,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    sortable: false,
    cellRenderer: (params: { value: number }) => {
      if (params.value === 1) {
        return `<span >Received</span>`;
      }
      if (params.value === 2) {
        return `<span>Send</span>`;
      }

      return params.value;
    },
    cellRendererForExport: (params: { value: string | number }): string => {
      if (params.value === 1) {
        return `Received`;
      }
      if (params.value === 2) {
        return `Send`;
      }
      return params.value as string;
    }
  };

  colDefRecurringType = {
    headerName: 'Recurring Type',
    field: 'recurrable_type',
    suppressFloatingFilterButton: true,
    floatingFilter: true,
    suppressHeaderMenuButton: true
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
    this.colDefAction,
    this.colDefType,
    this.colDefRecurringType
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
      name: 'From/To',
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
      isDisabled: false,
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
      name: 'Start Date',
      isDisabled: false,
      colDef: this.colDefStart,
      isChecked: true
    },
    {
      id: 'id_end',
      name: 'End Date',
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
    },
    {
      id: 'id_type',
      name: 'Type',
      isDisabled: false,
      colDef: this.colDefType,
      isChecked: true
    },
    {
      id: 'id_recurring_type',
      name: 'Recurring Type',
      isDisabled: false,
      colDef: this.colDefRecurringType,
      isChecked: true
    }
  ];

  ngOnDestroy(): void {
    this.destroy$.next(true);
  }
}

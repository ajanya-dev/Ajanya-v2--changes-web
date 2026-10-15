import { CurrencyPipe, TitleCasePipe } from '@angular/common';
import {
  Component,
  OnDestroy,
  OnInit,
  Signal,
  ViewChild,
  computed,
  inject,
  signal
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { ColDef, ICellRendererParams } from '@ag-grid-community/core';
import { takeUntil, map, Subject } from 'rxjs';
import { GetPaidByFormService } from 'src/app/shared/service/getPaidByForm/get-paid-by-form.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { V4DtActionComponent } from 'src/app/modules/v4-data-table/components/v4-dt-action/v4-dt-action.component';
import {
  IDtActionCompProp,
  IDtCellrendererBtn,
  IDtColumnFields,
  IDtFloatingFilterProp,
  ISelectedSingleRow
} from 'src/app/modules/data-table/model/datatable';
import { IAchRecurringTableRow } from 'src/app/models/check-recurring';
import { IV3DtHeaderElements } from 'src/app/modules/v3-data-table/models/v3-data-table';
import { faPause, faPlay, faRemove } from '@fortawesome/pro-solid-svg-icons';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import {
  V4StatusComponent,
  TV4StatusMap
} from 'src/app/shared/V4/v4-dt-cellrenders/v4-status/v4-status.component';
import { RecurringService } from '../../../../receive-payments/services/recurring.service';
import { V4DataTableComponent } from '../../../../v4-data-table/components/v4-data-table/v4-data-table.component';
import { V4TextFloatingFilterComponent } from '../../../../v4-data-table/components/floating-filters/v4-text-floating-filter/v4-text-floating-filter.component';
import { V4DropdownFloatingFilterComponent } from '../../../../v4-data-table/components/floating-filters/v4-dropdown-floating-filter/v4-dropdown-floating-filter.component';
import { V4DateFloatingFilterComponent } from '../../../../v4-data-table/components/floating-filters/v4-date-floating-filter/v4-date-floating-filter.component';
import { AchRecurringDetailPanelV4Component } from '../ach-recurring-detail-panel-v4/ach-recurring-detail-panel-v4.component';

/**
 * @description Component for displaying a table of recurring ach payment details using agGrid
 */
@Component({
  selector: 'app-ach-recurring-v4',
  templateUrl: './ach-recurring-v4.component.html',
  styleUrls: ['./ach-recurring-v4.component.scss'],
  standalone: true,
  imports: [V4DataTableComponent, AchRecurringDetailPanelV4Component],
  providers: [CurrencyPipe,TitleCasePipe]
})
export class AchRecurringV4Component implements OnInit, OnDestroy {
  public dialog = inject(MatDialog);
  private dataTableService = inject(DataTableService);
  private v3DataTableService = inject(V3DataTableService);
  private recurringService = inject(RecurringService);
  private getPaidByFormService = inject(GetPaidByFormService);
  private alertService = inject(V4AlertService);
  private currencyPipe = inject(CurrencyPipe);
  private titleCasePipe = inject(TitleCasePipe);
  private router = inject(Router);

  @ViewChild(AchRecurringDetailPanelV4Component)
  detailPanel: AchRecurringDetailPanelV4Component;

  // Side panel state
  isPanelOpen = signal(false);
  panelSelectedRow = signal<IAchRecurringTableRow | null>(null);

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
    'action',
    'from',
    'recurring_base_data.amount',
    'boxId'
  ];

  pauseDisabled = signal(false);
  resumeDisabled = signal(false);
  cancelDisabled = signal(false);

  public frameworkComponents = {
    selectBoxComponent: V4DropdownFloatingFilterComponent,
    selectDateComponent: V4DateFloatingFilterComponent,
    actionComponent: V4DtActionComponent,
    SearchBoxComponent: V4TextFloatingFilterComponent,
    attachmentComments: V4StatusComponent
  };

  cellRenderer: IDtCellrendererBtn = {
    action: [
      {
        name: 'Pause',
        id: 'Rid_pause',
        icon: 'pause',
        color: 'var(--v4-common-yellow-color)'
      },
      {
        name: 'Resume',
        id: 'Rid_restart',
        icon: 'play',
        color: 'var(--v4-common-green-color)'
      },
      {
        name: 'Cancel',
        id: 'Rid_cancel',
        icon: 'x',
        color: 'var(--v4-common-red-color)'
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
        disabled: this.pauseDisabled(),
        floatingBarVariant: 'outline-primary' as const,
        lucideIcon: 'pause'
      },
      {
        text: 'Resume',
        id: 'id_restart_ach',
        isAddIcon: true,
        icon: faPlay,
        backGroundInput: 'var(--common-green-color)',
        type: 'list',
        disabled: this.resumeDisabled(),
        floatingBarVariant: 'outline-success' as const,
        lucideIcon: 'play'
      },
      {
        text: 'Cancel',
        id: 'id_cancel_ach',
        isAddIcon: true,
        icon: faRemove,
        backGroundInput: 'var(--common-red-color)',
        type: 'list',
        disabled: this.cancelDisabled(),
        floatingBarVariant: 'outline-danger' as const,
        lucideIcon: 'x'
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
      this.panelSelectedRow.set(env.selectedRow as IAchRecurringTableRow);
      this.isPanelOpen.set(true);
    }
  }

  closePanelAndReset(): void {
    this.isPanelOpen.set(false);
    this.panelSelectedRow.set(null);
  }

  onPanelAction(key: string): void {
    const row = this.panelSelectedRow();
    if (!row) return;
    const id = [row.id];
    switch (key) {
      case 'pause':
        this.singleRowProcess('s', id, 3, 'Paused', 'pause');
        break;
      case 'resume':
        this.singleRowProcess('s', id, 5, 'Restarted', 'resume');
        break;
      case 'cancel':
        this.singleRowProcess('s', id, 4, 'Canceled', 'cancel');
        break;
      default:
        break;
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
          this.closePanelAndReset();
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
    this.closePanelAndReset();
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
    minWidth: 120,
    maxWidth: 150,
    field: 'recurring_base_data.amount',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
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
    minWidth: 170,
    flex: 1.4,
    tooltipField: 'from',
    cellRenderer: (params: { data: { from: string } }) => params.data.from
  };
  
  colDefFrequency = {
    headerName: 'Frequency',
    field: 'rrule_freq',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 140,
    maxWidth: 165,
    cellRenderer: (params: { data: { rrule_freq: string } }) => this.titleCasePipe.transform(params?.data?.rrule_freq)
  };

  colDefOfPay = {
    headerName: '# of Pay',
    field: 'total',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 110,
    maxWidth: 135
  };

  colDefOfPaid = {
    headerName: '# of Paid',
    field: 'completed',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 110,
    maxWidth: 135,
    cellRenderer: (params: ICellRendererParams) => {
      const val = params.value ?? '—';
      return `<span>${val}</span>`;
    }
  };

  colDefOfLeft = {
    headerName: '# of Left',
    field: 'remaining',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 110,
    maxWidth: 135,
    cellRenderer: (params: ICellRendererParams) => {
      const val = params.value ?? '—';
      return `<span>${val}</span>`;
    }
  };

  colDefMemoOrFor = {
    headerName: 'Memo/for',
    field: 'recurring_base_data.memo',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 180,
    maxWidth: 400,
    flex: 1,
    tooltipField: 'recurring_base_data.memo',
    cellRendererForExport: (params: ICellRendererParams) =>
      // Only For when Export Table data
      params?.data?.recurring_base_data?.memo
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
    minWidth: 130,
    maxWidth: 155,
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
    filterParams: { newRowsAction: 'keep' },
    minWidth: 130,
    maxWidth: 155
  };

  colDefStatus = {
    headerName: 'Status',
    field: 'status',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectBoxComponent',
    filter: 'agNumberColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 140,
    maxWidth: 165,
    pinned: 'right' as const,
    lockPosition: true,
    lockPinned: true,
    suppressMovable: true,
    cellClass: 'flex items-center',
    cellRenderer: 'attachmentComments',
    cellRendererParams: {
      statusMode: 'custom' as const,
      statusField: 'status',
      statusMap: {
        1: {
          status: 'Started',
          bgColor: 'var(--v4-badge-success-bg-color)',
          textColor: 'var(--v4-common-green-color)'
        },
        2: {
          status: 'Completed',
          bgColor: 'var(--v4-badge-success-bg-color)',
          textColor: 'var(--v4-common-green-color)'
        },
        3: {
          status: 'Paused',
          bgColor: 'var(--v4-badge-warning-bg-color)',
          textColor: 'var(--v4-common-yellow-color)'
        },
        4: {
          status: 'Canceled',
          bgColor: 'var(--v4-badge-error-bg-color)',
          textColor: 'var(--v4-common-red-color)'
        }
      } satisfies TV4StatusMap,
      hideFilterButton: true,
      isStatementDisable: true
    },
    valueGetter: (params: { data: { status: number } }) => {
      const statusLabels: Record<number, string> = {
        1: 'Started',
        2: 'Completed',
        3: 'Paused',
        4: 'Canceled'
      };
      return statusLabels[params?.data?.status] ?? '';
    }
  };

  colDefAction = {
    headerName: 'Action',
    field: 'action',
    suppressFloatingFilterButton: true,
    minWidth: 100,
    maxWidth: 110,
    pinned: 'left' as const,
    lockPosition: true,
    suppressMovable: true,
    cellRenderer: 'actionComponent',
    cellRendererParams: { tableVersion: 'v4' },
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
    minWidth: 110,
    maxWidth: 130,
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
    suppressHeaderMenuButton: true,
    minWidth: 160,
    maxWidth: 200
  };

  columnDefs: ColDef[] = [
    this.colDefId,
    this.colDefAction,
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
      id: 'id_action',
      name: 'Action',
      isDisabled: true,
      colDef: this.colDefAction,
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
      isDisabled: true,
      colDef: this.colDefStatus,
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

  onEmptyStateAction(): void {
    this.router.navigate(['/v4/manage/payments/receive']);
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
  }
}

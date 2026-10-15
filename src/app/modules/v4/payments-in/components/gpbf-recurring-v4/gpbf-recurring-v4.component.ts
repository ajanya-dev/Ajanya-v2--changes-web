import { CurrencyPipe, TitleCasePipe } from '@angular/common';
import {
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  inject,
  signal
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { ColDef, ICellRendererParams } from '@ag-grid-community/core';
import { Subject, map, takeUntil } from 'rxjs';
import { GetPaidByFormService } from 'src/app/shared/service/getPaidByForm/get-paid-by-form.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { V4DtActionComponent } from 'src/app/modules/v4-data-table/components/v4-dt-action/v4-dt-action.component';
import { RequestPaymentsService } from 'src/app/shared/service/RequestPayments/request-payments.service';
import {
  IDtActionCompProp,
  IDtCellrendererBtn,
  IDtColumnFields,
  IDtFloatingFilterProp,
  ISelectedSingleRow
} from 'src/app/modules/data-table/model/datatable';
import { IGatPaidCheckRecurring } from 'src/app/models/check-recurring';
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
import { GpbfRecurringDetailPanelV4Component } from '../gpbf-recurring-detail-panel-v4/gpbf-recurring-detail-panel-v4.component';

/**
 * @description This component is used to handle a aggrid table
 */
@Component({
  selector: 'app-gpbf-recurring-v4',
  templateUrl: './gpbf-recurring-v4.component.html',
  styleUrls: ['./gpbf-recurring-v4.component.scss'],
  standalone: true,
  imports: [V4DataTableComponent, GpbfRecurringDetailPanelV4Component],
  providers:[TitleCasePipe]
})
export class GpbfRecurringV4Component implements OnInit, OnDestroy {
  public dialog = inject(MatDialog);
  private dataTableService = inject(DataTableService);
  private recurringService = inject(RecurringService);
  private getPaidByFormService = inject(GetPaidByFormService);
  private alertService = inject(V4AlertService);
  private requestpayment = inject(RequestPaymentsService);
  private currencyPipe = inject(CurrencyPipe);
  private v3DataTableService = inject(V3DataTableService);
  private titleCasePipe = inject(TitleCasePipe);
  private router = inject(Router);

  @ViewChild(GpbfRecurringDetailPanelV4Component)
  detailPanel: GpbfRecurringDetailPanelV4Component;

  // Side panel state
  isPanelOpen = signal(false);
  panelSelectedRow = signal<IGatPaidCheckRecurring | null>(null);

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
        disabled: this.pauseDisabled(),
        floatingBarVariant: 'outline-primary' as const,
        lucideIcon: 'pause'
      },
      {
        text: 'Resume',
        id: 'id_restart_gpbf',
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
        id: 'id_cancel_gpbf',
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

  public frameworkComponents = {
    selectBoxComponent: V4DropdownFloatingFilterComponent,
    selectDateComponent: V4DateFloatingFilterComponent,
    actionComponent: V4DtActionComponent,
    SearchBoxComponent: V4TextFloatingFilterComponent,
    selectFrequency: V4DropdownFloatingFilterComponent,
    attachmentComments: V4StatusComponent
  };

  cellRenderer: IDtCellrendererBtn = {
    action: [
      {
        name: 'Pause',
        id: 'Rid_pauseg',
        icon: 'pause',
        color: 'var(--v4-common-yellow-color)'
      },
      {
        name: 'Resume',
        id: 'Rid_restartg',
        icon: 'play',
        color: 'var(--v4-common-green-color)'
      },
      {
        name: 'Cancel',
        id: 'Rid_cancelg',
        icon: 'x',
        color: 'var(--v4-common-red-color)'
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
      },
      {
        id: 'rrule_freq',
        values: [
          { value: 1, name: 'Weekly' },
          { value: 2, name: 'Bi-Weekly' },
          { value: 3, name: 'Monthly' },
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
          this.closePanelAndReset();
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
    this.closePanelAndReset();
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
   * @description Opens the detail side panel for the selected row.
   */
  getViewAction(env: ISelectedSingleRow) {
    if (env.selectedRow) {
      this.panelSelectedRow.set(env.selectedRow as IGatPaidCheckRecurring);
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
    switch (key) {
      case 'pause':
        this.sinlgeRowActions(row.encrypted_id, { status: 3 }, 'pause');
        break;
      case 'resume':
        this.sinlgeRowActions(row.encrypted_id, { status: 5 }, 'resume');
        break;
      case 'cancel':
        this.sinlgeRowActions(row.encrypted_id, { status: 4 }, 'cancel');
        break;
      default:
        break;
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
    suppressHeaderMenuButton: true,
    minWidth: 160,
    flex: 1.4
  };

  colDefFrequency = {
    headerName: 'Frequency',
    field: 'rrule_freq',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectFrequency',
    floatingFilterComponentParams: {
      tableName: 'getPaidFormRecurring'
    },
    filter: 'agNumberColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 140,
    maxWidth: 165,
    cellRenderer: (params: ICellRendererParams) => {
      if (
        params?.data?.rrule_interval === 1 &&
        params?.data?.rrule_freq === 'WEEKLY'
      ) {
        return 'Weekly';
      }
      if (
        params?.data?.rrule_interval === 2 &&
        params?.data?.rrule_freq === 'WEEKLY'
      ) {
        return 'Bi-Weekly';
      }
      if (
        params?.data?.rrule_interval === 3 &&
        params?.data?.rrule_freq === 'MONTHLY'
      ) {
        return 'Monthly';
      }
      return this.titleCasePipe.transform(params?.data?.rrule_freq);
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
    minWidth: 110,
    maxWidth: 135,
    cellRenderer: (params: {
      data: { is_it_unlimited: number };
      value: unknown;
    }) => {
      if (params.data.is_it_unlimited === 1) {
        return `<span style="color:var(--v4-badge-success-text-color);font-weight:400">Unlimited</span>`;
      }
      return `<span>${params.value ?? '—'}</span>`;
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
    suppressHeaderMenuButton: true,
    minWidth: 110,
    maxWidth: 135,
    cellRenderer: (params: {
      data: { is_it_unlimited: number };
      value: unknown;
    }) => {
      const val = params.value ?? '—';
      return `<span style="font-weight:400">${val}</span>`;
    }
  };

  colDefOfLeft = {
    headerName: '# of Left',
    field: 'get_paid_by_form_checks.total',
    suppressFloatingFilterButton: true,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    sortable: false,
    minWidth: 110,
    maxWidth: 135,
    cellRenderer: (params: {
      data: { is_it_unlimited: number; total: number; completed: number };
    }) => {
      if (params.data.is_it_unlimited === 1) {
        return `<span style="color:var(--v4-badge-success-text-color);font-weight:400">Unlimited</span>`;
      }
      const val = params.data.total - params.data.completed;
      return `<span>${val}</span>`;
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
    suppressHeaderMenuButton: true,
    minWidth: 180,
    maxWidth: 400,
    flex: 1,
    tooltipField: 'memo'
  };

  colDefStart = {
    headerName: 'Start',
    field: 'start_date',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectDateComponent',
    filter: 'agDateColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    filterParams: { newRowsAction: 'keep' },
    minWidth: 120,
    maxWidth: 145
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
    minWidth: 130,
    maxWidth: 155,
    cellRenderer: (params: {
      data: { is_it_unlimited: number };
      value: unknown;
    }) => {
      if (params.data.is_it_unlimited === 1) {
        return `<span style="color:var(--v4-common-yellow-color);font-weight:400" title="this recurring is unlimited">Until Cancel</span>`;
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

  colDefStatus = {
    headerName: 'Status',
    field: 'get_paid_by_form_recurring_meta_datas.status',
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
        5: {
          status: 'Starting Soon',
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
          status: 'Cancelled',
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
        4: 'Cancelled',
        5: 'Starting Soon'
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

  colDefAmount = {
    headerName: 'Amount',
    minWidth: 120,
    maxWidth: 150,
    field: 'cheque_amount',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: (params: { value: string | number }) =>
      this.currencyPipe.transform(params.value)
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
    this.colDefStatus
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
      isDisabled: true,
      colDef: this.colDefStatus,
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

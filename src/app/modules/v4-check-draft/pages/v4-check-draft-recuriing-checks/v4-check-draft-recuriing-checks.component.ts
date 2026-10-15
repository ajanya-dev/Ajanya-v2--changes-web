import {
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';
import { ICellRendererParams, RowSelectedEvent } from '@ag-grid-community/core';
import { Subscription, finalize } from 'rxjs';
import { ComponentType } from '@angular/cdk/portal';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CheckDraftService } from 'src/app/shared/service/check-draft/check-draft.service';
import {
  DataTableService,
  IDtSelectSingleIdSubject
} from 'src/app/shared/service/data-table/data-table.service';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { IV3DtHeaderElements } from 'src/app/modules/v3-data-table/models/v3-data-table';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import {
  IDtActionCompProp,
  IDtFloatingFilterProp
} from 'src/app/modules/data-table/model/datatable';
import { ICoulmnDefFields } from 'src/app/models/v3-datatable';
import { V4TextFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-text-floating-filter/v4-text-floating-filter.component';
import { V4DropdownFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-dropdown-floating-filter/v4-dropdown-floating-filter.component';
import { V4DateFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-date-floating-filter/v4-date-floating-filter.component';
import {
  V4StatusComponent,
  TV4StatusMap
} from 'src/app/shared/V4/v4-dt-cellrenders/v4-status/v4-status.component';
import { V4SelectAllCheckBoxComponent } from 'src/app/modules/v4-data-table/components/v4-select-all-check-box/v4-select-all-check-box.component';
import { V4DtActionComponent } from 'src/app/modules/v4-data-table/components/v4-dt-action/v4-dt-action.component';
import { V4PayeeNameComponent } from 'src/app/modules/payments-v4/payments-out/components/v4-payments-table/cell-renderers/v4-payee-name/v4-payee-name.component';
import { V4CreatedAtComponent } from 'src/app/modules/payments-v4/payments-out/components/v4-payments-table/cell-renderers/v4-created-at/v4-created-at.component';
import { ICheckDraftTableRow } from '../../model/v4-Checkdraft';
import { V4DataTableComponent } from '../../../v4-data-table/components/v4-data-table/v4-data-table.component';
import { V4CheckDraftRecurringDetailPanelComponent } from '../../components/v4-check-draft-recurring-detail-panel/v4-check-draft-recurring-detail-panel.component';

export interface ICheckRecurring {
  data: ICheckRecurringData;
}
export interface ICheckRecurringData {
  status: number | string;
}

@Component({
  selector: 'app-v4-check-draft-recuriing-checks',
  templateUrl: './v4-check-draft-recuriing-checks.component.html',
  styleUrls: ['./v4-check-draft-recuriing-checks.component.scss'],
  standalone: true,
  imports: [V4DataTableComponent, V4CheckDraftRecurringDetailPanelComponent]
})
export class V4CheckDraftRecuriingChecksComponent implements OnDestroy, OnInit {
  private dataTableService = inject(DataTableService);
  private v3DataTableService = inject(V3DataTableService);
  private alertService = inject(V4AlertService);
  private checkDraftService = inject(CheckDraftService);

  subscriptions: Subscription[] = [];
  public tableId = DTTableId.checkDraftRecurring;
  selectedRow: ICheckDraftTableRow[];
  actionName: string;
  exportConfig: { heading: string; ignoreColumns?: string[] } = {
    heading: '',
    ignoreColumns: ['action_field', 'id', 'boxId']
  };

  // Use service signals so the header buttons share the same state
  pauseLoading = this.checkDraftService.recurringPauseLoading;
  cancelLoading = this.checkDraftService.recurringCancelLoading;
  resumeLoading = this.checkDraftService.recurringResumeLoading;
  disablePauseButton = this.checkDraftService.recurringPauseDisabled;
  disableResumeButton = this.checkDraftService.recurringResumeDisabled;
  disableCancelButton = this.checkDraftService.recurringCancelDisabled;

  // Side panel state
  isPanelOpen = signal(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  panelSelectedRow = signal<any>(null);

  // HEADER ELEMENTS PROPERTIES
  public headerElements = computed<IV3DtHeaderElements>(() => ({
    buttons: [
      {
        text: 'Pause',
        id: 'id_pause',
        lucideIcon: 'pause',
        isAddIcon: true,
        icon: ['fas', 'pause'],
        type: 'list',
        toolTip: 'Pause recurring',
        loading: this.pauseLoading(),
        disabled: this.disablePauseButton(),
        floatingBarVariant: 'filled-primary'
      },
      {
        text: 'Resume',
        id: 'id_resume',
        lucideIcon: 'play',
        isAddIcon: true,
        icon: ['fas', 'play'],
        type: 'list',
        toolTip: 'Resume recurring',
        loading: this.resumeLoading(),
        disabled: this.disableResumeButton(),
        floatingBarVariant: 'filled-success'
      },
      {
        text: 'Cancel',
        id: 'id_cancel',
        lucideIcon: 'circle-x',
        isAddIcon: true,
        icon: ['fas', 'close'],
        type: 'list',
        toolTip: 'Cancel',
        loading: this.cancelLoading(),
        disabled: this.disableCancelButton(),
        floatingBarVariant: 'outline-danger'
      }
    ]
  }));

  frameworkComponents: Record<string, ComponentType<unknown>> = {
    headerCheckBoxComponent: V4SelectAllCheckBoxComponent,
    selectBoxComponent: V4DropdownFloatingFilterComponent,
    v4DateRangeComponent: V4DateFloatingFilterComponent,
    v4CreatedAtComponent: V4CreatedAtComponent,
    actionComponent: V4DtActionComponent,
    searchBoxComponent: V4TextFloatingFilterComponent,
    v4PayeeNameComponent: V4PayeeNameComponent,
    attachmentComments: V4StatusComponent
  };

  fieldsShownByDefault: string[] = [
    'payees.payee_name',
    'id',
    'check_draft_recurring_checks.amount',
    'action_field'
  ];

  // Column Definitions
  colDefId: ICoulmnDefFields = {
    maxWidth: 50,
    minWidth: 50,
    headerName: '',
    sortable: false,
    field: 'boxId',
    suppressFloatingFilterButton: true,
    suppressHeaderMenuButton: true,
    floatingFilter: false,
    lockPosition: true,
    headerCheckboxSelection: true,
    checkboxSelection: true,
    showDisabledCheckboxes: true,
    headerClass: 'pl-3.5',
    cellClass: 'flex justify-center',
    pinned: 'left'
  };

  colDefPayeeName = {
    headerName: 'Payer Name',
    field: 'payee_name',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    floatingFilterComponent: 'searchBoxComponent',
    minWidth: 160,
    flex: 1,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'v4PayeeNameComponent'
  };

  colDefAmount = {
    headerName: 'Amount',
    field: 'check_draft_recurring_checks.amount',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    floatingFilterComponent: 'searchBoxComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 150,
    maxWidth: 200,
    cellClass: 'flex justify-end pr-3 text-end',
    valueGetter: (params: ICellRendererParams) => params.data?.amount,
    valueFormatter: (params: ICellRendererParams) =>
      params.value != null ? '$' + Number(params.value).toFixed(2) : ''
  };

  colDefCreatedAt = {
    headerName: 'Created At',
    field: 'check_draft_recurring_checks.created_at',
    suppressFloatingFilterButton: true,
    filter: 'agDateColumnFilter',
    minWidth: 150,
    floatingFilterComponent: 'v4DateRangeComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'v4CreatedAtComponent',
    cellRendererForExport: (params: ICellRendererParams) =>
      params?.data?.created_at
  };

  colDefStart = {
    headerName: 'Start',
    field: 'start_date',
    suppressFloatingFilterButton: true,
    filter: 'agDateColumnFilter',
    minWidth: 150,
    maxWidth: 155,
    floatingFilterComponent: 'v4DateRangeComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefEndDate = {
    headerName: 'End',
    field: 'end_date',
    suppressFloatingFilterButton: true,
    filter: 'agDateColumnFilter',
    minWidth: 150,
    maxWidth: 155,
    floatingFilterComponent: 'v4DateRangeComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefTotal = {
    headerName: 'Total',
    field: 'total',
    suppressFloatingFilterButton: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponent: 'searchBoxComponent',
    floatingFilter: true,
    filter: 'agNumberColumnFilter',
    minWidth: 110,
    maxWidth: 135,
    cellClass: 'flex items-center'
  };

  colDefPaid = {
    headerName: 'Paid',
    field: 'completed',
    suppressFloatingFilterButton: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponent: 'searchBoxComponent',
    floatingFilter: true,
    filter: 'agNumberColumnFilter',
    minWidth: 110,
    maxWidth: 135,
    cellClass: 'flex items-center'
  };

  colDefFrequency = {
    headerName: 'Frequency',
    field: 'check_draft_recurring_meta_datas.rrule_freq',
    suppressFloatingFilterButton: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponent: 'selectBoxComponent',
    floatingFilter: true,
    filter: 'agTextColumnFilter',
    minWidth: 130,
    maxWidth: 155,
    cellClass: 'flex items-center',
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
    minWidth: 120,
    width: 150,
    maxWidth: 300,
    pinned: 'right' as const,
    lockPosition: 'right' as const,
    lockPinned: true,
    suppressMovable: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponent: 'selectBoxComponent',
    floatingFilter: true,
    filter: 'agNumberColumnFilter',
    cellClass: 'flex items-center',
    cellRenderer: 'attachmentComments',
    cellRendererParams: {
      statusMode: 'custom' as const,
      statusField: 'status',
      statusMap: {
        1: {
          status: 'Started',
          bgColor: 'var(--v4-badge-info-bg-color)',
          textColor: 'var(--v4-badge-info-text-color)'
        },
        2: {
          status: 'Completed',
          bgColor: 'var(--v4-badge-success-bg-color)',
          textColor: 'var(--v4-badge-success-text-color)'
        },
        3: {
          status: 'Paused',
          bgColor: 'var(--v4-badge-warning-bg-color)',
          textColor: 'var(--v4-badge-warning-text-color)'
        },
        4: {
          status: 'Canceled',
          bgColor: 'var(--v4-badge-neutral-bg-color)',
          textColor: 'var(--v4-badge-neutral-text-color)'
        },
        6: {
          status: 'Rejected',
          bgColor: 'var(--v4-badge-error-bg-color)',
          textColor: 'var(--v4-badge-error-text-color)'
        }
      } satisfies TV4StatusMap,
      hideFilterButton: true,
      isStatementDisable: true
    },
    valueGetter: (params: ICellRendererParams<{ status: number }>) => {
      const status = Number(params?.data?.status);
      const labels: Record<number, string> = {
        1: 'Started',
        2: 'Completed',
        3: 'Paused',
        4: 'Canceled',
        6: 'Rejected'
      };
      return labels[status] ?? '';
    }
  };

  actionField = {
    headerName: 'Action',
    field: 'action_field',
    suppressFloatingFilterButton: true,
    minWidth: 60,
    maxWidth: 80,
    sortable: false,
    pinned: 'left' as const,
    cellRenderer: 'actionComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  // CELL RENDERER COMPONENT
  cellRenderer: { action: { name: string; id: string; icon: string; color?: string }[] } = {
    action: [
      {
        name: 'Pause',
        id: 'Rid_pause',
        icon: 'pause'
      },
      {
        name: 'Resume',
        id: 'Rid_restart',
        icon: 'play'
      },
      {
        name: 'Cancel',
        id: 'Rid_cancel',
        icon: 'x',
        color: 'var(--v4-common-red-color)'
      }
    ]
  };

  // SET COLUMN FIELDS
  columnDefs = [
    this.colDefId,
    this.actionField,
    this.colDefPayeeName,
    this.colDefAmount,
    this.colDefCreatedAt,
    this.colDefStart,
    this.colDefEndDate,
    this.colDefTotal,
    this.colDefPaid,
    this.colDefFrequency,
    this.colDefStatus
  ];

  // PASS FIELD DATA
  defaultColumnFields = [
    {
      id: 'id',
      name: '#',
      isDisabled: true,
      colDef: this.colDefId,
      isChecked: true
    },
    {
      id: 'id_action',
      name: 'Action',
      isDisabled: true,
      colDef: this.actionField,
      isChecked: true
    },
    {
      id: 'id_payeeName',
      name: 'Payer Name',
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
      name: 'Created At',
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
    }
  ];

  // FILTER CUSTOM COMPONENTS
  FloatingFilterComponent: IDtFloatingFilterProp = {
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
  actionComponentProp: IDtActionCompProp = {
    actionButton: true,
    eyeButton: true
  };

  ngOnInit() {
    this.dataTableService.setDataFromParent(
      this.defaultColumnFields,
      this.FloatingFilterComponent,
      this.cellRenderer,
      this.actionComponentProp
    );
    this.v3DataTableService.resetV3DataTablePayload();
    this.v3DataTableService.refreshV3DataTable();
    this.v3DataTableService.v3RowSelectionData = [];
    this.v3DataTableService.gridApi?.deselectAll();

    // Listen for header button clicks (Pause/Resume/Cancel)
    this.subscriptions.push(
      this.checkDraftService.triggerRecurringAction$.subscribe((action) => {
        switch (action) {
          case 'pause':
            this.doAction('p');
            break;
          case 'resume':
            this.doAction('r');
            break;
          case 'cancel':
            this.doAction('c');
            break;
          default:
            break;
        }
      })
    );
  }

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

  disabledActions(ids: string[]) {
    this.dataTableService.setActionButtonDisable(true, ids);
  }

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

  onRowSelected(event: RowSelectedEvent) {
    const gridApi = event.api;
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

  successAlert() {
    const msg = {
      title: 'Success',
      content: '',
      close: true
    };
    this.dataTableService.setRefreshStatus(true);
    this.alertService.successAlert(msg);
  }

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

  getViewAction(selectedItem: IDtSelectSingleIdSubject) {
    if (selectedItem.selectedRow) {
      this.panelSelectedRow.set(selectedItem.selectedRow);
      this.isPanelOpen.set(true);
    }
  }

  goBackToCheckDrafts(): void {
    this.checkDraftService.showRecurringList.set(false);
  }

  closePanelAndReset(): void {
    this.isPanelOpen.set(false);
  }

  onPanelAction(key: string): void {
    const row = this.panelSelectedRow();
    if (!row) return;
    const id = [row.id];
    switch (key) {
      case 'pause': {
        const resp = this.confirmAction('pause');
        resp.afterClosed().subscribe((res) => {
          if (res) {
            this.AllActions('s', id, 3);
            this.closePanelAndReset();
          }
        });
        break;
      }
      case 'resume': {
        const resp = this.confirmAction('restart');
        resp.afterClosed().subscribe((res) => {
          if (res) {
            this.AllActions('s', id, 5);
            this.closePanelAndReset();
          }
        });
        break;
      }
      case 'cancel': {
        const resp = this.confirmAction('cancel');
        resp.afterClosed().subscribe((res) => {
          if (res) {
            this.AllActions('s', id, 4);
            this.closePanelAndReset();
          }
        });
        break;
      }
      default:
        break;
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}

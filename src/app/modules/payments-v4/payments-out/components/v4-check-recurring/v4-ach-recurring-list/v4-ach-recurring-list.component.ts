import {
  Component,
  OnDestroy,
  signal,
  inject,
  computed,
  OnInit,
  input
} from '@angular/core';
import { NgClass } from '@angular/common';

import { ICellRendererParams, RowSelectedEvent } from '@ag-grid-community/core';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import {
  IDtActionCompProp,
  IDtColumnFields
} from 'src/app/modules/data-table/model/datatable';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CheckListRecurringService } from 'src/app/shared/service/check-list-recurring/check-list-recurring.service';
import {
  DataTableService,
  IDtSelectSingleIdSubject
} from 'src/app/shared/service/data-table/data-table.service';
import { V4DropdownFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-dropdown-floating-filter/v4-dropdown-floating-filter.component';
import { V4DateFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-date-floating-filter/v4-date-floating-filter.component';
import { V4TextFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-text-floating-filter/v4-text-floating-filter.component';
import { IAchRecurringTableRow } from 'src/app/models/check-recurring';
import { ICoulmnDefFields } from 'src/app/models/v3-datatable';
import { IV3DtHeaderElements } from 'src/app/modules/v3-data-table/models/v3-data-table';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { Router } from '@angular/router';
import { V4RecurringStatusBadgeComponent } from '../v4-recurring-status-badge.component';
import { V4DtActionComponent } from 'src/app/modules/v4-data-table/components/v4-dt-action/v4-dt-action.component';
import { CheckAddAttachmentCommentComponent } from '../../../../../check/pages/check-list/addAttachmentComment';
import { V4DataTableComponent } from '../../../../../v4-data-table/components/v4-data-table/v4-data-table.component';
import { RecurringViewDetailPanelV4Component } from '../recurring-view-detail-panel-v4/recurring-view-detail-panel-v4.component';

/**
 * @description Represents the component responsible for displaying and managing
 * the list of recurring ACH transactions.
 */
@Component({
  selector: 'app-v4-ach-recurring-list',
  templateUrl: './v4-ach-recurring-list.component.html',
  styleUrls: ['./v4-ach-recurring-list.component.scss'],
  standalone: true,
  imports: [V4DataTableComponent, NgClass, RecurringViewDetailPanelV4Component]
})
export class V4AchRecurringListComponent implements OnInit, OnDestroy {
  private dataTableService = inject(DataTableService);
  private checkListRecurringService = inject(CheckListRecurringService);
  private alertService = inject(V4AlertService);
  private v3DataTableService = inject(V3DataTableService);
  private router = inject(Router);

  isFromPaymentsV3 = input(false);
  deepLinkRowId = input('');

  isDetailPanelOpen = signal(false);
  selectedRowId = signal('');
  isDeepLinkOpen = signal(false);

  tableId = DTTableId.achRecurring;

  columnDefs: ICoulmnDefFields[] = [];
  columnFields: IDtColumnFields[] = [];
  actionComponentProp: IDtActionCompProp;
  ach_type = 2;
  subscriptions: Subscription[] = [];
  selectedRow: IAchRecurringTableRow[];
  HeaderButtonLoadingProp = { isLoading: false, btn_id: '', btn_name: '' };
  pauseDisabled = signal(false);
  resumeDisabled = signal(false);
  cancelDisabled = signal(false);

  public frameworkComponents = {
    selectBoxComponent: V4DropdownFloatingFilterComponent,
    selectDateComponent: V4DateFloatingFilterComponent,
    actionComponent: V4DtActionComponent,
    searchBoxComponent: V4TextFloatingFilterComponent,
    addAttachmentComment: CheckAddAttachmentCommentComponent,
    recurringStatusBadgeComponent: V4RecurringStatusBadgeComponent
  };

  cellRenderer = {
    action: [
      {
        name: 'Pause',
        id: 'pause',
        icon: 'pause'
      },
      {
        name: 'Resume',
        id: 'resume',
        icon: 'play'
      },
      {
        name: 'Cancel',
        id: 'cancel',
        icon: 'x'
      }
    ]
  };

  FloatingFilterComponent = {
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
          { value: '6', name: 'Quarterly' }
        ]
      }
    ],
    selectDate: [
      { id: 'start_date', initialRange: 'All Time', isPrimary: true },
      { id: 'end_date', initialRange: 'All Time' }
    ]
  };

  public headerElements = computed<IV3DtHeaderElements>(() => ({
    buttons: [
      {
        text: 'Pause',
        id: 'id_pause',
        barGroup: 1,
        isAddIcon: true,
        icon: ['fas', 'pause'],
        lucideIcon: 'pause',
        floatingBarVariant: 'outline-default',
        type: 'list',
        toolTip: 'Pause recurring',
        disabled: this.pauseDisabled()
      },
      {
        text: 'Resume',
        id: 'id_resume',
        barGroup: 1,
        isAddIcon: true,
        icon: ['fas', 'play'],
        lucideIcon: 'play',
        floatingBarVariant: 'success-soft',
        backGroundInput: 'var(--common-green-color)',
        type: 'list',
        toolTip: 'Resume recurring',
        disabled: this.resumeDisabled()
      },
      {
        text: 'Stop',
        id: 'id_cancel',
        barGroup: 2,
        isAddIcon: true,
        icon: ['fas', 'close'],
        lucideIcon: 'x',
        floatingBarVariant: 'danger-soft',
        backGroundInput: 'var(--common-red-color)',
        type: 'list',
        toolTip: 'Stop',
        disabled: this.cancelDisabled()
      }
    ]
  }));

  ngOnInit(): void {
    if (this.deepLinkRowId()) {
      this.selectedRowId.set(this.deepLinkRowId());
      this.isDetailPanelOpen.set(true);
      this.isDeepLinkOpen.set(true);
    }
    this.columnDefs = [
      this.colDefId,
      this.colDefAction,
      this.colDefFromTo,
      this.colDefAmount,
      this.colDefFrequency,
      this.colDefOfPay,
      this.colDefOfPaid,
      this.colDefOfLeft,
      this.colDefMemoLeft,
      this.colDefStart,
      this.colDefEnd,
      this.colDefType,
      this.colDefRecurringType,
      this.colDefStatus
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
        id: 'action',
        name: 'Action',
        isDisabled: true,
        colDef: this.colDefAction,
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
        id: 'of_pay',
        name: 'Of Pay',
        isDisabled: false,
        colDef: this.colDefOfPay,
        isChecked: true
      },
      {
        id: 'of_paid',
        name: 'Of Paid',
        isDisabled: false,
        colDef: this.colDefOfPaid,
        isChecked: true
      },
      {
        id: 'of_left',
        name: 'Of Left',
        isDisabled: false,
        colDef: this.colDefOfLeft,
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
        isDisabled: true,
        colDef: this.colDefEnd,
        isChecked: true
      },
      {
        id: 'recurring_type',
        name: 'Recurring Type',
        isDisabled: false,
        colDef: this.colDefRecurringType,
        isChecked: true
      },
      {
        id: 'status',
        name: 'Status',
        isDisabled: false,
        colDef: this.colDefStatus,
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
   * @description Handles button click events in the header.
   * @param event - The event object containing the button ID.
   */
  headerButtonClick(event: { id: string }) {
    const selectedItems: string[] = [];
    this.selectedRow?.forEach((row) => {
      selectedItems.push(row.id);
    });

    switch (event.id) {
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
      this.dataTableService.setActionButtonDisable(true, ['', '', '']);
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
          const statusMap: Record<string, string> = {
            'Pause Successfully': 'Recurring Paused',
            'Restart Successfully': 'Recurring Restarted',
            'Cancel Successfully': 'Recurring Canceled'
          };
          const data = {
            title: 'Success',
            content: statusMap[response.data] ?? response.data
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
    const selectedItem = event.selectedRow as { status: number; id: string };
    this.ActionButtonDisable(selectedItem);
    switch (event.id) {
      case 'pause':
        this.onAchRecurringPause(false, selectedItem.id, []);
        break;
      case 'resume':
        this.onAchRecurringResume(false, selectedItem.id, []);
        break;
      case 'cancel':
        this.onAchRecurringCancel(false, selectedItem.id, []);
        break;
      default:
        break;
    }
  }

  /**
   * @description Navigates to the details view of a selected row.
   * @param event - The event object containing details.
   */
  cellRendererActionView(event: IDtSelectSingleIdSubject) {
    if (event.selectedRow?.id) {
      this.selectedRowId.set(event.selectedRow.id as string);
      this.isDetailPanelOpen.set(true);
      this.isDeepLinkOpen.set(false);
    }
  }

  /**
   * @description Disable header buttons based on selected row status.
   * @param {IAchRecurringTableRow[]}selectedRow - Selected row data.
   */
  headerButtonDisable(selectedRow: IAchRecurringTableRow[]) {
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

  onEmptyStateAction(): void {
    this.router.navigate(['/v4/manage/payments/pay']);
  }

  colDefId = {
    minWidth: 50,
    maxWidth: 50,
    headerName: '',
    sortable: false,
    field: 'boxId',
    suppressFloatingFilterButton: true,
    suppressHeaderMenuButton: true,
    lockPosition: true,
    suppressMovable: true,
    resizable: false,
    pinned: 'left' as const,
    headerCheckboxSelection: true,
    checkboxSelection: true,
    showDisabledCheckboxes: true,
    cellRenderer: () => ''
  };

  colDefStart = {
    minWidth: 130,
    maxWidth: 155,
    headerName: 'Start Date',
    field: 'start_date',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectDateComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    floatingFilterComponentParams: { v2Table: true },
    suppressHeaderMenuButton: true
  };

  colDefEnd = {
    minWidth: 130,
    maxWidth: 155,
    headerName: 'End Date',
    field: 'end_date',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectDateComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefFromTo = {
    minWidth: 180,
    flex: 1.4,
    headerName: 'Payee/Recipient',
    field: 'from',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'searchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    sortable: false,
    tooltipField: 'from',
    cellStyle: { 'font-weight': '500' }
  };

  colDefStatus = {
    headerName: 'Status',
    field: 'status',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 140,
    maxWidth: 165,
    pinned: 'right' as const,
    lockPosition: 'right' as const,
    lockPinned: true,
    suppressMovable: true,
    cellRenderer: 'recurringStatusBadgeComponent',
    valueGetter: (params: ICellRendererParams) => {
      let name = '';
      if (params.data.status === 4) {
        name = 'Canceled';
      } else if (params.data.status === 3) {
        name = 'Paused';
      } else if (params.data.status === 2) {
        name = 'Completed';
      } else if (params.data.status === 1) {
        name = 'Active';
      }
      return name;
    }
  };

  colDefAmount = {
    minWidth: 120,
    maxWidth: 150,
    headerName: 'Amount',
    field: 'recurring_base_data.amount',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'searchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'ag-right-aligned-cell pr-3'
  };

  colDefFrequency = {
    minWidth: 130,
    maxWidth: 155,
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

  colDefOfPay = {
    minWidth: 150,
    maxWidth: 175,
    headerName: 'Payments Made',
    field: 'total',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'searchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: (params: ICellRendererParams) => {
      if (params.data.is_it_unlimited === 1) {
        return 'Unlimited';
      }
      return params.data.total;
    }
  };

  colDefOfPaid = {
    minWidth: 120,
    maxWidth: 145,
    headerName: 'Total Paid',
    field: 'completed',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'searchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefOfLeft = {
    minWidth: 180,
    maxWidth: 205,
    headerName: 'Remaining Payments',
    field: 'remaining',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'searchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefMemoLeft = {
    minWidth: 160,
    maxWidth: 400,
    flex: 1,
    headerName: 'Memo',
    field: 'recurring_base_data.memo',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'searchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    tooltipField: 'recurring_base_data.memo'
  };

  colDefType = {
    minWidth: 110,
    maxWidth: 135,
    headerName: 'Type',
    field: 'type',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'searchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefRecurringType = {
    minWidth: 160,
    maxWidth: 190,
    headerName: 'Recurring Type',
    field: 'recurrable_type',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'searchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefAction = {
    minWidth: 100,
    maxWidth: 110,
    headerName: 'Action',
    field: 'action',
    pinned: 'left' as const,
    lockPosition: true,
    suppressMovable: true,
    resizable: false,
    suppressFloatingFilterButton: true,
    sortable: false,
    cellRenderer: 'actionComponent',
    cellRendererParams: { showActionTooltip: true },
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  ngOnDestroy(): void {
    this.subscriptions.forEach((el) => el.unsubscribe());
  }
}

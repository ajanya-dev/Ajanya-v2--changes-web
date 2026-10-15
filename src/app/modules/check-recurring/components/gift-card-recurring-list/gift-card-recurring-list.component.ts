import {
  Component,
  EventEmitter,
  OnDestroy,
  Output,
  signal,
  inject,
  computed,
  OnInit,
  input
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
import { IGiftCardRecurringTableRow } from 'src/app/models/check-recurring';
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
 * @description Represents the component responsible for displaying and managing
 * the list of recurring gift card / employee card recharge transactions.
 */
@Component({
  selector: 'app-gift-card-recurring-list',
  templateUrl: './gift-card-recurring-list.component.html',
  styleUrls: ['./gift-card-recurring-list.component.scss'],
  standalone: true,
  imports: [V3DataTableComponent, NgClass]
})
export class GiftCardRecurringListComponent implements OnInit, OnDestroy {
  private dataTableService = inject(DataTableService);
  private checkListRecurringService = inject(CheckListRecurringService);
  private alertService = inject(AlertService);
  private router = inject(Router);
  private v3DataTableService = inject(V3DataTableService);

  @Output() tableChange = new EventEmitter();

  isFromPaymentsV3 = input(false);

  tableId: number = DTTableId.giftCardRecurring;
  columnDefs: ICoulmnDefFields[] = [];
  columnFields: IDtColumnFields[] = [];
  actionComponentProp: IDtActionCompProp;
  subscriptions: Subscription[] = [];
  selectedRow: IGiftCardRecurringTableRow[];
  HeaderButtonLoadingProp = { isLoading: false, btn_id: '', btn_name: '' };
  selectedPanelButton = signal('gift_card');
  pauseDisabled = signal(false);
  resumeDisabled = signal(false);
  cancelDisabled = signal(false);

  cellRenderer = {
    action: [
      { name: 'Pause', id: 'pause', icon: 'fa fa-pause' },
      { name: 'Resume', id: 'resume', icon: 'fa fa-play' },
      { name: 'Cancel', id: 'cancel', icon: 'fa fa-close' }
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
          { value: '6', name: 'Quarterly' }
        ]
      },
      {
        id: 'card_type',
        values: [
          { value: 'Gift Card', name: 'Gift Card' },
          { value: 'Employee Card', name: 'Employee Card' }
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
      { name: 'Mailed Checks', id: 'recurring_list' },
      { name: 'Emailed Checks', id: 'email_recurring' },
      { name: 'ACH', id: 'ach_recurring' },
      { name: 'Gift Card', id: 'gift_card' }
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
      this.colDefNameOnCard,
      this.colDefCardType,
      this.colDefAmount,
      this.colDefFrequency,
      this.colDefScheduled,
      this.colDefRecharged,
      this.colDefRemaining,
      this.colDefStart,
      this.colDefEnd,
      this.colDefStatus,
      this.colDefAction
    ];

    this.columnFields = [
      { id: 'id', name: '#', isDisabled: true, colDef: this.colDefId, isChecked: true },
      { id: 'name_on_card', name: 'Name on Card', isDisabled: false, colDef: this.colDefNameOnCard, isChecked: true },
      { id: 'card_type', name: 'Card Type', isDisabled: false, colDef: this.colDefCardType, isChecked: true },
      { id: 'amount', name: 'Amount', isDisabled: false, colDef: this.colDefAmount, isChecked: true },
      { id: 'frequency', name: 'Frequency', isDisabled: false, colDef: this.colDefFrequency, isChecked: true },
      { id: 'total', name: 'Scheduled', isDisabled: false, colDef: this.colDefScheduled, isChecked: true },
      { id: 'completed', name: 'Recharged', isDisabled: false, colDef: this.colDefRecharged, isChecked: true },
      { id: 'remaining', name: 'Remaining', isDisabled: false, colDef: this.colDefRemaining, isChecked: true },
      { id: 'start', name: 'Start Date', isDisabled: false, colDef: this.colDefStart, isChecked: true },
      { id: 'end', name: 'End Date', isDisabled: false, colDef: this.colDefEnd, isChecked: true },
      { id: 'status', name: 'Status', isDisabled: false, colDef: this.colDefStatus, isChecked: true },
      { id: 'action', name: 'Action', isDisabled: false, colDef: this.colDefAction, isChecked: true }
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
      selectedItems.push(row.action);
    });

    switch (event.id) {
      case 'recurring_list':
        this.tableChange.emit(1);
        break;
      case 'email_recurring':
        this.tableChange.emit(3);
        break;
      case 'ach_recurring':
        this.tableChange.emit(2);
        break;
      case 'id_pause':
        this.onGiftCardRecurringPause(true, '', selectedItems, event.id);
        break;
      case 'id_resume':
        this.onGiftCardRecurringResume(true, '', selectedItems, event.id);
        break;
      case 'id_cancel':
        this.onGiftCardRecurringCancel(true, '', selectedItems, event.id);
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
      this.dataTableService.setActionButtonDisable(true, ['pause', 'resume', 'cancel']);
    }
    if (item?.status === 3) {
      this.dataTableService.setActionButtonDisable(true, ['pause', '', '']);
    }
    if (item?.status === 4) {
      this.dataTableService.setActionButtonDisable(true, ['pause', 'resume', 'cancel']);
    }
    if (item?.status === 1) {
      this.dataTableService.setActionButtonDisable(true, ['', 'resume', '']);
    }
  }

  /**
   * @description Changes the status of a single gift card recurring transaction.
   * @param id - The encrypted ID of the recurring transaction (from the action field).
   * @param status - The new status code to set.
   */
  changeStatus(id: string, status: string) {
    this.subscriptions.push(
      this.checkListRecurringService
        .changeGiftCardRecurringStatus(id, status)
        .subscribe((response) => {
          // eslint-disable-next-line no-nested-ternary
          const content = response.data === 'Pause Successfully'
            ? 'Recurring Paused'
            // eslint-disable-next-line no-nested-ternary
            : response.data === 'Restart Successfully'
            ? 'Recurring Restarted'
            : response.data === 'Cancel Successfully'
            ? 'Recurring Cancelled'
            : response.data;
          if (response.success) {
            this.v3DataTableService.refreshV3DataTable();
            this.v3DataTableService.v3RowSelectionData = [];
            this.v3DataTableService.gridApi?.deselectAll();
            this.alertService.successAlert({ title: 'Success', content });
          }
        })
    );
  }

  /**
   * @description Changes the status of multiple gift card recurring transactions.
   * Calls the single-item endpoint for each selected item since no bulk endpoint exists.
   * @param selectedItems - Array of encrypted IDs from the action field.
   * @param status - The new status code to set.
   * @param [id] - The ID of the header button triggering the action.
   */
  changeStatusAsBulk(selectedItems: string[], status: string, id?: string) {
    if (!selectedItems.length) return;

    this.HeaderButtonLoadingProp.isLoading = true;
    this.HeaderButtonLoadingProp.btn_id = id || '';
    this.HeaderButtonLoadingProp.btn_name = 'Loading...';

    let processedCount = 0;
    const total = selectedItems.length;

    selectedItems.forEach((itemId) => {
      this.subscriptions.push(
        this.checkListRecurringService
          .changeGiftCardRecurringStatus(itemId, status)
          .subscribe({
            next: (response) => {
              processedCount++;
              if (processedCount === total) {
                this.HeaderButtonLoadingProp.isLoading = false;
                this.HeaderButtonLoadingProp.btn_id = '';
                this.v3DataTableService.refreshV3DataTable();
                this.v3DataTableService.v3RowSelectionData = [];
                this.v3DataTableService.gridApi?.deselectAll();
                if (response.success) {
                  this.alertService.successAlert({ title: ' ', content: `${response.data}` });
                }
              }
            },
            error: () => {
              processedCount++;
              if (processedCount === total) {
                this.HeaderButtonLoadingProp.isLoading = false;
                this.HeaderButtonLoadingProp.btn_id = '';
              }
            }
          })
      );
    });
  }

  /**
   * @description Handles the Pause action for gift card recurring transactions.
   * @param isBulk - True when triggered from header buttons (may have multiple selected items).
   * @param id - The encrypted ID for single-item row action.
   * @param selectedItems - Array of encrypted IDs for bulk header button actions.
   * @param eventID - The ID of the triggering button element.
   */
  onGiftCardRecurringPause(
    isBulk: boolean,
    id: string,
    selectedItems: string[],
    eventID?: string
  ) {
    const confirmData = {
      title: 'Confirm',
      content: 'Are you sure you want to pause this recurring?',
      doneMsg: 'Yes',
      cancelMsg: 'No'
    };

    if (isBulk) {
      if (selectedItems.length > 0) {
        const isConfirm = this.alertService.confirmAlert(confirmData);
        isConfirm.afterClosed().subscribe((response) => {
          if (response) {
            this.changeStatusAsBulk(selectedItems, '3', eventID);
          }
        });
      } else {
        this.alertService.warningAlert({ title: 'Error', content: 'Please select at least one item' });
      }
    } else {
      const isConfirm = this.alertService.confirmAlert(confirmData);
      isConfirm.afterClosed().subscribe((response) => {
        if (response) {
          this.changeStatus(id, '3');
        }
      });
    }
  }

  /**
   * @description Handles the Resume action for gift card recurring transactions.
   * @param isBulk - True when triggered from header buttons (may have multiple selected items).
   * @param id - The encrypted ID for single-item row action.
   * @param selectedItems - Array of encrypted IDs for bulk header button actions.
   * @param eventID - The ID of the triggering button element.
   */
  onGiftCardRecurringResume(
    isBulk: boolean,
    id: string,
    selectedItems: string[],
    eventID?: string
  ) {
    const confirmData = {
      title: 'Confirm',
      content: 'Are you sure you want to resume this recurring?',
      doneMsg: 'Yes',
      cancelMsg: 'No'
    };

    if (isBulk) {
      if (selectedItems.length > 0) {
        const isConfirm = this.alertService.confirmAlert(confirmData);
        isConfirm.afterClosed().subscribe((response) => {
          if (response) {
            this.changeStatusAsBulk(selectedItems, '5', eventID);
          }
        });
      } else {
        this.alertService.warningAlert({ title: 'Oops', content: 'Please select at least one item' });
      }
    } else {
      const isConfirm = this.alertService.confirmAlert(confirmData);
      isConfirm.afterClosed().subscribe((response) => {
        if (response) {
          this.changeStatus(id, '5');
        }
      });
    }
  }

  /**
   * @description Handles the Cancel action for gift card recurring transactions.
   * @param isBulk - True when triggered from header buttons (may have multiple selected items).
   * @param id - The encrypted ID for single-item row action.
   * @param selectedItems - Array of encrypted IDs for bulk header button actions.
   * @param eventID - The ID of the triggering button element.
   */
  onGiftCardRecurringCancel(
    isBulk: boolean,
    id: string,
    selectedItems: string[],
    eventID?: string
  ) {
    const confirmData = {
      title: 'Confirm',
      content: 'Are you sure you want to cancel this recurring?',
      doneMsg: 'Yes',
      cancelMsg: 'No'
    };

    if (isBulk) {
      if (selectedItems.length > 0) {
        const isConfirm = this.alertService.confirmAlert(confirmData);
        isConfirm.afterClosed().subscribe((response) => {
          if (response) {
            this.changeStatusAsBulk(selectedItems, '4', eventID);
          }
        });
      } else {
        this.alertService.warningAlert({ title: 'Oops', content: 'Please select at least one item' });
      }
    } else {
      const isConfirm = this.alertService.confirmAlert(confirmData);
      isConfirm.afterClosed().subscribe((response) => {
        if (response) {
          this.changeStatus(id, '4');
        }
      });
    }
  }

  /**
   * @description Handles the click event of inline action buttons in the cell renderer.
   * @param event - The event object containing details.
   */
  cellRendererActionClick(event: IDtSelectSingleIdSubject) {
    const selectedItem = event.selectedRow as { status: number; action: string };
    this.ActionButtonDisable(selectedItem);
    switch (event.id) {
      case 'pause':
        this.onGiftCardRecurringPause(false, selectedItem.action, []);
        break;
      case 'resume':
        this.onGiftCardRecurringResume(false, selectedItem.action, []);
        break;
      case 'cancel':
        this.onGiftCardRecurringCancel(false, selectedItem.action, []);
        break;
      default:
        break;
    }
  }

  /**
   * @description Navigates to the gift card recurring detail view for the selected row.
   * @param event - The event object containing selected row data.
   */
  cellRendererActionView(event: IDtSelectSingleIdSubject) {
    if (event.selectedRow?.action) {
      this.router.navigate(['manage/checkmailing/recurring/show'], {
        queryParams: { id: event.selectedRow.action, type: 4 }
      });
    }
  }

  /**
   * @description Disables header action buttons based on the selected rows' statuses.
   * @param selectedRow - Array of selected row data.
   */
  headerButtonDisable(selectedRow: IGiftCardRecurringTableRow[]) {
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

  colDefNameOnCard = {
    minWidth: 130,
    headerName: 'Name on Card',
    field: 'name_on_card',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefCardType = {
    minWidth: 130,
    headerName: 'Card Type',
    field: 'card_type',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
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

  colDefFrequency = {
    minWidth: 110,
    headerName: 'Frequency',
    field: 'rrule_interval',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: (param: ICellRendererParams) => {
      switch (param.data?.rrule_freq) {
        case 'DAILY': return 'Daily';
        case 'WEEKLY': return 'Weekly';
        case 'BIWEEKLY': return 'Bi-Weekly';
        case 'MONTHLY': return 'Monthly';
        case 'BIMONTHLY': return 'Bi-Monthly';
        case 'QUARTERLY': return 'Quarterly';
        default: return '';
      }
    }
  };

  colDefScheduled = {
    minWidth: 120,
    headerName: 'Scheduled',
    field: 'total',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: (params: ICellRendererParams) => {
      if (params.data?.is_it_unlimited === 1) return 'Unlimited';
      return params.data?.total;
    }
  };

  colDefRecharged = {
    minWidth: 120,
    headerName: 'Recharged',
    field: 'completed',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefRemaining = {
    minWidth: 120,
    headerName: 'Remaining',
    field: 'remaining',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: (params: ICellRendererParams) => {
      if (params.data?.is_it_unlimited === 1) return 'Unlimited';
      return params.data?.remaining;
    }
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
    suppressHeaderMenuButton: true,
    cellRenderer: (params: ICellRendererParams) => {
      if (!params.data?.end_date) return 'Until Cancel';
      return params.data.end_date;
    }
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
      switch (params.value) {
        case 1: return 'Active';
        case 2: return 'Completed';
        case 3: return 'Paused';
        case 4: return 'Canceled';
        default: return '';
      }
    }
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

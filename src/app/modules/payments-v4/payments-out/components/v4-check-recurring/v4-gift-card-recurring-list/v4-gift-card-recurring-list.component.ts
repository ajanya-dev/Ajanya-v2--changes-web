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
import { IGiftCardRecurringTableRow } from 'src/app/models/check-recurring';
import { ICoulmnDefFields } from 'src/app/models/v3-datatable';
import { IV3DtHeaderElements } from 'src/app/modules/v3-data-table/models/v3-data-table';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { V4DtActionComponent } from 'src/app/modules/v4-data-table/components/v4-dt-action/v4-dt-action.component';
import { V4RecurringStatusBadgeComponent } from '../v4-recurring-status-badge.component';
import { CheckAddAttachmentCommentComponent } from '../../../../../check/pages/check-list/addAttachmentComment';
import { V4DataTableComponent } from '../../../../../v4-data-table/components/v4-data-table/v4-data-table.component';
import { GiftCardRecurringDetailPanelV4Component } from '../gift-card-recurring-detail-panel-v4/gift-card-recurring-detail-panel-v4.component';
import { Router } from '@angular/router';

/**
 * @description Represents the component responsible for displaying and managing
 * the list of recurring gift card / employee card recharge transactions in V4.
 */
@Component({
  selector: 'app-v4-gift-card-recurring-list',
  templateUrl: './v4-gift-card-recurring-list.component.html',
  styleUrls: ['./v4-gift-card-recurring-list.component.scss'],
  standalone: true,
  imports: [
    V4DataTableComponent,
    NgClass,
    GiftCardRecurringDetailPanelV4Component
  ]
})
export class V4GiftCardRecurringListComponent implements OnInit, OnDestroy {
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

  tableId = DTTableId.giftCardRecurring;

  columnDefs: ICoulmnDefFields[] = [];
  columnFields: IDtColumnFields[] = [];
  actionComponentProp: IDtActionCompProp;
  subscriptions: Subscription[] = [];
  selectedRow: IGiftCardRecurringTableRow[];
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
        icon: 'pause',
        color: 'var(--v4-common-yellow-color)'
      },
      {
        name: 'Resume',
        id: 'resume',
        icon: 'play',
        color: 'var(--v4-common-green-color)'
      },
      {
        name: 'Cancel',
        id: 'cancel',
        icon: 'x',
        color: 'var(--v4-common-red-color)'
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
          { value: '4', name: 'Cancelled' }
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

  public headerElements = computed<IV3DtHeaderElements>(() => ({
    buttons: [
      {
        text: 'Pause',
        id: 'id_pause',
        barGroup: 1,
        isAddIcon: true,
        icon: ['fas', 'pause'],
        lucideIcon: 'pause',
        floatingBarVariant: 'outline-warning' as const,
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
        floatingBarVariant: 'outline-success' as const,
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
        floatingBarVariant: 'outline-danger' as const,
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
      this.colDefNameOnCard,
      this.colDefCardType,
      this.colDefAmount,
      this.colDefFrequency,
      this.colDefScheduled,
      this.colDefRecharged,
      this.colDefRemaining,
      this.colDefStart,
      this.colDefEnd,
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
        id: 'name_on_card',
        name: 'Name on Card',
        isDisabled: false,
        colDef: this.colDefNameOnCard,
        isChecked: true
      },
      {
        id: 'card_type',
        name: 'Card Type',
        isDisabled: false,
        colDef: this.colDefCardType,
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
        id: 'total',
        name: 'Scheduled',
        isDisabled: false,
        colDef: this.colDefScheduled,
        isChecked: true
      },
      {
        id: 'completed',
        name: 'Recharged',
        isDisabled: false,
        colDef: this.colDefRecharged,
        isChecked: true
      },
      {
        id: 'remaining',
        name: 'Remaining',
        isDisabled: false,
        colDef: this.colDefRemaining,
        isChecked: true
      },
      {
        id: 'start',
        name: 'Start Date',
        isDisabled: false,
        colDef: this.colDefStart,
        isChecked: true
      },
      {
        id: 'end',
        name: 'End Date',
        isDisabled: false,
        colDef: this.colDefEnd,
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
   * @description Handles bulk action toolbar button clicks.
   * @param event - Object containing the button id.
   */
  headerButtonClick(event: { id: string }) {
    const selectedItems: string[] = [];
    this.selectedRow?.forEach((row) => {
      selectedItems.push(row.action);
    });

    switch (event.id) {
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
   * @description Updates the selected row list and disabled states when grid selection changes.
   */
  onRowSelected(event: RowSelectedEvent) {
    const gridApi = event?.api;
    this.selectedRow = gridApi.getSelectedRows();
    this.headerButtonDisable(this.selectedRow);
  }

  /**
   * @description Disables per-row action menu entries based on the row's current status.
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
   * @description Changes the status of a single gift card recurring transaction.
   */
  changeStatus(id: string, status: string) {
    this.subscriptions.push(
      this.checkListRecurringService
        .changeGiftCardRecurringStatus(id, status)
        .subscribe((response) => {
          const statusMap: Record<string, string> = {
            'Pause Successfully': 'Recurring Paused',
            'Restart Successfully': 'Recurring Restarted',
            'Cancel Successfully': 'Recurring Cancelled'
          };
          const content = statusMap[response.data] ?? response.data;
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
   * @description Bulk status change. No bulk endpoint exists for gift card recurring,
   * so fire the single-item endpoint per selected row and surface one summary alert.
   */
  changeStatusAsBulk(selectedItems: string[], status: string, id?: string) {
    if (!selectedItems.length) return;

    this.HeaderButtonLoadingProp.isLoading = true;
    this.HeaderButtonLoadingProp.btn_id = id || '';
    this.HeaderButtonLoadingProp.btn_name = 'Loading...';

    let processedCount = 0;
    let lastSuccessMessage = '';
    const total = selectedItems.length;

    selectedItems.forEach((itemId) => {
      this.subscriptions.push(
        this.checkListRecurringService
          .changeGiftCardRecurringStatus(itemId, status)
          .subscribe({
            next: (response) => {
              processedCount += 1;
              if (response?.success) {
                lastSuccessMessage = response.data;
              }
              if (processedCount === total) {
                this.HeaderButtonLoadingProp.isLoading = false;
                this.HeaderButtonLoadingProp.btn_id = '';
                this.v3DataTableService.refreshV3DataTable();
                this.v3DataTableService.v3RowSelectionData = [];
                this.v3DataTableService.gridApi?.deselectAll();
                if (lastSuccessMessage) {
                  this.alertService.successAlert({
                    title: ' ',
                    content: `${lastSuccessMessage}`
                  });
                }
              }
            },
            error: () => {
              processedCount += 1;
              if (processedCount === total) {
                this.HeaderButtonLoadingProp.isLoading = false;
                this.HeaderButtonLoadingProp.btn_id = '';
              }
            }
          })
      );
    });
  }

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
        this.alertService
          .confirmAlert(confirmData)
          .afterClosed()
          .subscribe((response) => {
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
      this.alertService
        .confirmAlert(confirmData)
        .afterClosed()
        .subscribe((response) => {
          if (response) {
            this.changeStatus(id, '3');
          }
        });
    }
  }

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
        this.alertService
          .confirmAlert(confirmData)
          .afterClosed()
          .subscribe((response) => {
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
      this.alertService
        .confirmAlert(confirmData)
        .afterClosed()
        .subscribe((response) => {
          if (response) {
            this.changeStatus(id, '5');
          }
        });
    }
  }

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
        this.alertService
          .confirmAlert(confirmData)
          .afterClosed()
          .subscribe((response) => {
            if (response) {
              this.changeStatusAsBulk(selectedItems, '4', eventID);
            }
          });
      } else {
        this.alertService.warningAlert({
          title: 'Oops',
          content: 'Please select at least one item'
        });
      }
    } else {
      this.alertService
        .confirmAlert(confirmData)
        .afterClosed()
        .subscribe((response) => {
          if (response) {
            this.changeStatus(id, '4');
          }
        });
    }
  }

  cellRendererActionClick(event: IDtSelectSingleIdSubject) {
    const selectedItem = event.selectedRow as {
      status: number;
      action: string;
    };
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
   * @description Opens the gift card recurring detail sidepanel for the selected row.
   * Gift card row IDs live in the `action` field, not `id`.
   */
  cellRendererActionView(event: IDtSelectSingleIdSubject) {
    const action = (event.selectedRow as { action?: string })?.action;
    if (action) {
      this.selectedRowId.set(action);
      this.isDetailPanelOpen.set(true);
      this.isDeepLinkOpen.set(false);
    }
  }

  /**
   * @description Disables the bulk action toolbar buttons based on the selected rows' statuses.
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

  colDefNameOnCard = {
    minWidth: 170,
    flex: 1.2,
    headerName: 'Name on Card',
    field: 'name_on_card',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'searchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    tooltipField: 'name_on_card'
  };

  colDefCardType = {
    minWidth: 140,
    maxWidth: 170,
    headerName: 'Card Type',
    field: 'card_type',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefAmount = {
    minWidth: 120,
    maxWidth: 150,
    headerName: 'Amount',
    field: 'amount',
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
      switch (param.data?.rrule_freq) {
        case 'DAILY':
          return 'Daily';
        case 'WEEKLY':
          return 'Weekly';
        case 'BIWEEKLY':
          return 'Bi-Weekly';
        case 'MONTHLY':
          return 'Monthly';
        case 'BIMONTHLY':
          return 'Bi-Monthly';
        case 'QUARTERLY':
          return 'Quarterly';
        default:
          return '';
      }
    }
  };

  colDefScheduled = {
    minWidth: 125,
    maxWidth: 150,
    headerName: 'Scheduled',
    field: 'total',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'searchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: (params: ICellRendererParams) => {
      if (params.data?.is_it_unlimited === 1) return 'Unlimited';
      return params.data?.total;
    }
  };

  colDefRecharged = {
    minWidth: 125,
    maxWidth: 150,
    headerName: 'Recharged',
    field: 'completed',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'searchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefRemaining = {
    minWidth: 125,
    maxWidth: 150,
    headerName: 'Remaining',
    field: 'remaining',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'searchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: (params: ICellRendererParams) => {
      if (params.data?.is_it_unlimited === 1) return 'Unlimited';
      return params.data?.remaining;
    }
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
    minWidth: 140,
    maxWidth: 165,
    pinned: 'right' as const,
    lockPosition: 'right' as const,
    lockPinned: true,
    suppressMovable: true,
    cellRenderer: 'recurringStatusBadgeComponent',
    valueGetter: (params: ICellRendererParams) => {
      let name = '';
      switch (params.data?.status) {
        case 1:
          name = 'Active';
          break;
        case 2:
          name = 'Completed';
          break;
        case 3:
          name = 'Paused';
          break;
        case 4:
          name = 'Cancelled';
          break;
        default:
          return '';
      }
      return name;
    }
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

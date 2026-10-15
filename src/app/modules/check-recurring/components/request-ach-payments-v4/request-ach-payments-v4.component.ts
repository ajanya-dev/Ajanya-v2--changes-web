import { ICellRendererParams, RowSelectedEvent } from '@ag-grid-community/core';
import { CurrencyPipe, NgClass } from '@angular/common';
import {
  Component,
  inject,
  input,
  OnInit,
  output,
  signal,
  OnDestroy
} from '@angular/core';
import { Router } from '@angular/router';
import { finalize, Subscription } from 'rxjs';
import { IAchRecurringTableRow } from 'src/app/models/check-recurring';
import { ICoulmnDefFields } from 'src/app/models/v3-datatable';
import { CheckAddAttachmentCommentComponent } from 'src/app/modules/check/pages/check-list/addAttachmentComment';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import {
  IDtActionCompProp,
  IDtColumnFields
} from 'src/app/modules/data-table/model/datatable';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CheckListRecurringService } from 'src/app/shared/service/check-list-recurring/check-list-recurring.service';
import {
  DataTableService,
  IDtSelectSingleIdSubject
} from 'src/app/shared/service/data-table/data-table.service';
import { V4DataTableComponent } from 'src/app/modules/v4-data-table/components/v4-data-table/v4-data-table.component';
import { V4DtActionComponent } from 'src/app/modules/v4-data-table/components/v4-dt-action/v4-dt-action.component';
import { V4TextFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-text-floating-filter/v4-text-floating-filter.component';
import { V4DropdownFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-dropdown-floating-filter/v4-dropdown-floating-filter.component';
import { V4DateFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-date-floating-filter/v4-date-floating-filter.component';
import {
  V4StatusComponent,
  TV4StatusMap
} from 'src/app/shared/V4/v4-dt-cellrenders/v4-status/v4-status.component';
import { RequestAchDetailPanelV4Component } from '../request-ach-detail-panel-v4/request-ach-detail-panel-v4.component';

@Component({
  standalone: true,
  selector: 'app-request-ach-payments-v4',
  templateUrl: './request-ach-payments-v4.component.html',
  styleUrls: ['./request-ach-payments-v4.component.scss'],
  imports: [V4DataTableComponent, NgClass, RequestAchDetailPanelV4Component],
  providers: [CurrencyPipe]
})
export class RequestAchPaymentsV4Component implements OnInit, OnDestroy {
  private dataTableService = inject(DataTableService);
  private checkListRecurringService = inject(CheckListRecurringService);
  private alertService = inject(V4AlertService);
  private v3DataTableService = inject(V3DataTableService);
  private currencyPipe = inject(CurrencyPipe);
  private router = inject(Router);

  tableChange = output<number>();
  isFromPaymentsV3 = input(false);
  tableId = DTTableId.requestRecurringPayment;

  table: number;
  columnDefs: ICoulmnDefFields[] = [];
  columnFields: IDtColumnFields[] = [];
  actionComponentProp: IDtActionCompProp;
  ach_type = 2;
  subscriptions: Subscription[] = [];
  selectedRow: IAchRecurringTableRow[];
  HeaderButtonLoadingProp = { isLoading: false, btn_id: '', btn_name: '' };
  selectedPanelButton = signal('request_payments');

  // Side panel state
  isPanelOpen = signal(false);
  panelSelectedRow = signal<IAchRecurringTableRow | null>(null);

  public frameworkComponents = {
    selectBoxComponent: V4DropdownFloatingFilterComponent,
    selectDateComponent: V4DateFloatingFilterComponent,
    actionComponent: V4DtActionComponent,
    searchBoxComponent: V4TextFloatingFilterComponent,
    addAttachmentComment: CheckAddAttachmentCommentComponent,
    attachmentComments: V4StatusComponent
  };

  FloatingFilterComponent = {
    selectBox: [
      {
        id: 'status',
        values: [
          { value: '1', name: 'Requested' },
          { value: '2', name: 'Started' },
          { value: '3', name: 'Completed' }
        ]
      },
      {
        id: 'frequency',
        values: [
          { value: '1', name: 'Weekly' },
          { value: '2', name: 'Bi-Weekly' },
          { value: '3', name: 'Monthly' },
          { value: '4', name: 'Daily' }
        ]
      }
    ],
    selectDate: [
      { id: 'start_date', initialRange: 'All Time', isPrimary: true },
      { id: 'end_date', initialRange: 'All Time' }
    ]
  };

  ngOnInit(): void {
    this.columnDefs = [
      this.colDefId,
      this.colDefFromTo,
      this.colDefBankAccount,
      this.colDefAmount,
      this.colDefPhoneNumber,
      this.colDefFrequency,
      this.colDefInvoice,
      this.colDefMemoLeft,
      this.colDefStart,
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
        id: 'invoice_no',
        name: 'Invoice Number',
        isDisabled: false,
        colDef: this.colDefInvoice,
        isChecked: true
      },
      {
        id: 'phone_no',
        name: 'Phone Number',
        isDisabled: false,
        colDef: this.colDefPhoneNumber,
        isChecked: true
      },
      {
        id: 'bank_account',
        name: 'Bank Account',
        isDisabled: false,
        colDef: this.colDefBankAccount,
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
        id: 'status',
        name: 'Status',
        isDisabled: true,
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
      undefined,
      this.actionComponentProp
    );
    this.v3DataTableService.resetV3DataTablePayload();
    this.v3DataTableService.refreshV3DataTable();
  }

  /**
   * @description Handles the ACH recurring action.
   */
  achRecuring() {
    this.tableChange.emit(2);
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
      case 'ach_recurring':
        this.achRecuring();
        break;
      case 'recurring_list':
        this.onRecurringListClick();
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
  }

  /**
   * @description Empty-state CTA: opens the receive-payment flow so the user can
   * set up their first recurring ACH request.
   */
  onEmptyStateAction(): void {
    this.router.navigate(['/v4/manage/payments/receive']);
  }

  /**
   * @description Handles the click event for the 'Recurring List' button.
   */
  onRecurringListClick() {
    this.table = 1;
    this.tableChange.emit(1);
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
          let content = response.data;
          if (response.data === 'Pause Successfully') {
            content = 'Recurring Paused';
          } else if (response.data === 'Restart Successfully') {
            content = 'Recurring Restarted';
          } else if (response.data === 'Cancel Successfully') {
            content = 'Recurring Canceled';
          }
          const data = { title: 'Success', content };
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
   * @description Navigates to the details view of a selected row.
   * @param event - The event object containing details.
   */
  cellRendererActionView(event: IDtSelectSingleIdSubject) {
    if (event.selectedRow?.id) {
      this.panelSelectedRow.set(
        event.selectedRow as unknown as IAchRecurringTableRow
      );
      this.isPanelOpen.set(true);
    }
  }

  closePanelAndReset(): void {
    this.isPanelOpen.set(false);
  }

  onPanelAction(key: string): void {
    const row = this.panelSelectedRow();
    if (!row) return;
    switch (key) {
      case 'pause':
        this.changeStatus(row.id, 'pause');
        break;
      case 'resume':
        this.changeStatus(row.id, 'restart');
        break;
      case 'cancel':
        this.changeStatus(row.id, 'cancel');
        break;
      default:
        break;
    }
    this.closePanelAndReset();
  }

  colDefId = {
    maxWidth: 50,
    headerName: '',
    sortable: false,
    field: 'boxId',
    suppressFloatingFilterButton: true,
    suppressHeaderMenuButton: true,
    lockPosition: true,
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

  colDefFromTo = {
    minWidth: 190,
    flex: 1.4,
    headerName: 'Payee/Recipient',
    field: 'email',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'searchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    sortable: false,
    tooltipField: 'email'
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
          status: 'Requested',
          bgColor: 'var(--v4-badge-warning-bg-color)',
          textColor: 'var(--v4-common-yellow-color)'
        },
        2: {
          status: 'Started',
          bgColor: 'var(--v4-badge-success-bg-color)',
          textColor: 'var(--v4-common-green-color)'
        },
        3: {
          status: 'Completed',
          bgColor: 'var(--v4-badge-info-bg-color)',
          textColor: 'var(--v4-common-blue-color)'
        }
      } satisfies TV4StatusMap,
      hideFilterButton: true,
      isStatementDisable: true
    },
    valueGetter: (params: { data: { status: number } }) => {
      const map: Record<number, string> = {
        1: 'Requested',
        2: 'Started',
        3: 'Completed'
      };
      return map[params?.data?.status] ?? '';
    }
  };

  colDefAmount = {
    minWidth: 120,
    maxWidth: 145,
    headerName: 'Amount',
    field: 'requested_payments.amount',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'searchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: (params: ICellRendererParams) =>
      this.currencyPipe.transform(params.data?.amount)
  };

  colDefFrequency = {
    minWidth: 130,
    maxWidth: 155,
    headerName: 'Frequency',
    field: 'frequency',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefInvoice = {
    minWidth: 160,
    maxWidth: 190,
    headerName: 'Invoice Number',
    field: 'invoice_no',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'searchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefPhoneNumber = {
    minWidth: 160,
    maxWidth: 185,
    headerName: 'Phone Number',
    field: 'mobile_no',
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
    field: 'memo',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'searchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    tooltipField: 'memo'
  };

  colDefBankAccount = {
    minWidth: 160,
    maxWidth: 210,
    headerName: 'Bank Account',
    field: 'bank_account_account_name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'searchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  ngOnDestroy(): void {
    this.subscriptions.forEach((el) => el.unsubscribe());
  }
}

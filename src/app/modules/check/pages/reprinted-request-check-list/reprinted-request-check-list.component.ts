/* eslint-disable import/order */
import {
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';
import { finalize, take } from 'rxjs/operators';
import {
  IDtActionCompProp,
  IDtFloatingFilterProp
} from 'src/app/modules/data-table/model/datatable';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { DataRangeV35Component } from 'src/app/shared/components/date-range-v35/data-range-v35.component';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { ComponentType } from '@angular/cdk/portal';
import { IV3DtHeaderElements } from 'src/app/modules/v3-data-table/models/v3-data-table';
import { ICoulmnDefFields, ISelectBoxFilterArray, ISelectBoxFilterValues } from 'src/app/models/v3-datatable';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { V3DataTableSelectBoxComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-data-table-select-box/v3-data-table-select-box.component';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { DtSearchBoxComponent } from '../../../data-table/components/dt-search-box/dt-search-box.component';
import { V3DataTableComponent } from '../../../v3-data-table/components/v3-data-table/v3-data-table.component';
import { V3DTCommonFilterComponent } from 'src/app/shared/v3/dt-cellrenderers/dt-common-filter';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ICellRendererParams, RowNode } from '@ag-grid-community/core';
import { V35PaymentTableActionComponent } from 'src/app/shared/v3/dt-cellrenderers/v35/v35-payment-table-action/v35-payment-table-action.component';
import { ICheckStatus } from '../../model/check';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { CheckService } from 'src/app/shared/service/check/check.service';

interface IRowData {
  id: string;
  cheque_id: string;
  cheque_serial_number: string;
  company_id_encrypted: string;
  company_name: string;
  requested_by: string;
  requested_date: string;
  requested_date_formatted: string;
  cheque_status: number;
  payee_name: string;
  cheque_amount: string;
  cheque_issue_date: string;
}

@Component({
  selector: 'app-reprinted-request-check-list',
  standalone: true,
  imports: [V3DataTableComponent],
  templateUrl: './reprinted-request-check-list.component.html',
  styleUrl: './reprinted-request-check-list.component.scss'
})
export class ReprintedRequestCheckListComponent implements OnInit {
  private dataTableService = inject(DataTableService);
  private v3DataTableService = inject(V3DataTableService);
  private alertService = inject(AlertService);
  private paymentsService = inject(PaymentsService);
  private destroyRef = inject(DestroyRef);
  private localStorageService = inject(LocalStorageService);
  private checkService = inject(CheckService);

  public tableId = DTTableId.reprintRequestCheckList;
  approveLoading = signal(false);
  rejectLoading = signal(false);
  cellRendererCheckStatus?: Record<string, ICheckStatus>;
  selectedRowData: RowNode<IRowData>[] = [];

  fieldsShownByDefault: string[] = [
    'id',
    'cheque_serial_number',
    'payee_name',
    'cheque_amount',
    'action_field'
  ];

  deselectedColumns: string[] = this.defaultDeselectedColumns();
  selectedPanelButton = signal('id_all');

  defaultDeselectedColumns() {
    if (window.innerWidth < 768) {
      return ['requested_by', 'company_name'];
    }
    return [];
  }

  exportConfig: { heading: string; ignoreColumns?: string[] } = {
    heading: '',
    ignoreColumns: ['boxId', 'action_field']
  };

  // HEADER ELEMENTS
  public headerElements = computed<IV3DtHeaderElements>(() => {
    const isActionTab = this.selectedPanelButton() === 'id_approved' || this.selectedPanelButton() === 'id_rejected';
    return {
      panelButtons: [
        {
          name: 'All',
          id: 'id_all'
        },
        {
          name: 'Requested',
          id: 'id_requested'
        },
        {
          name: 'Approved',
          id: 'id_approved'
        },
        {
          name: 'Rejected',
          id: 'id_rejected'
        }
      ],
      buttons: isActionTab ? [] : [
        {
          text: 'Approve',
          id: 'approve',
          isAddIcon: true,
          icon: ['fas', 'check'],
          backGroundInput: 'var(--common-green-color)',
          type: 'list',
          toolTip: 'Approve selected reprint requests',
          loading: this.approveLoading()
        },
        {
          text: 'Reject',
          id: 'reject',
          isAddIcon: true,
          icon: ['fas', 'times'],
          backGroundInput: 'var(--common-red-color)',
          type: 'list',
          toolTip: 'Reject selected reprint requests',
          loading: this.rejectLoading()
        }
      ]
    };
  });

  // FILTER CUSTOM COMPONENTS
  FloatingFilterComponent: IDtFloatingFilterProp = {
    selectBox: [
      {
        id: 'cheque_status',
        values: [
          { value: 622, name: 'Reprint Requested' },
          { value: 623, name: 'Reprint Approved' },
          { value: 624, name: 'Reprint Rejected' }
        ]
      },
    ],
    selectDate: [
      {
        id: 'requested_date',
        initialRange: 'All Time',
        isPrimary: true
      }
    ]
  };

  // ACTION COMPONENT PROPERTIES
  actionComponentProp: IDtActionCompProp = {
    actionButton: true,
    eyeButton: false
  };

  // CELL RENDERER COMPONENT
  cellRenderer: { action: { name: string; id: string; icon: string }[] } = {
    action: [
      {
        name: 'Audit Trail',
        id: 'audit-trail',
        icon: 'fa fa-history'
      }
    ]
  };

  frameworkComponents: Record<string, ComponentType<unknown>> = {
    selectBoxComponent: V3DataTableSelectBoxComponent,
    dateRangeV35Component: DataRangeV35Component,
    searchBoxComponent: DtSearchBoxComponent,
    V3DTCommonFilterComponent,
    v3PaymentTableActionComponent: V35PaymentTableActionComponent
  };

  // Column Definitions
  colDefId: ICoulmnDefFields = {
    maxWidth: 50,
    minWidth: 20,
    headerName: '',
    sortable: false,
    field: 'boxId',
    suppressFloatingFilterButton: true,
    suppressHeaderMenuButton: true,
    lockPosition: true,
    headerCheckboxSelection: true,
    checkboxSelection: true,
    showDisabledCheckboxes: true,
    headerClass: 'pl-3.5',
    cellClass: 'flex justify-center',
    pinned: 'left',
  };

  colDefCompanyName = {
    headerName: 'Facility',
    field: 'company_name',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    minWidth: 140,
    floatingFilterComponent: 'searchBoxComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'V3DTCommonFilterComponent',
    cellClass: 'flex flex-col justify-center'
  };

  colDefCheckNumber = {
    headerName: 'Check #',
    field: 'cheque_serial_number',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    minWidth: 80,
    maxWidth: 120,
    floatingFilterComponent: 'searchBoxComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'V3DTCommonFilterComponent',
    cellClass: 'flex flex-col justify-center'
  };

  colDefPayeeName = {
    headerName: 'Payee Name',
    field: 'payee_name',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    minWidth: 160,
    floatingFilterComponent: 'searchBoxComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'V3DTCommonFilterComponent',
    cellClass: 'flex flex-col justify-center'
  };

  colDefAmount = {
    headerName: 'Amount',
    field: 'cheque_amount',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    floatingFilterComponent: 'searchBoxComponent',
    maxWidth: 120,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex justify-end pr-3 text-end mt-0.5',
    cellRenderer: 'V3DTCommonFilterComponent',
    cellRendererParams: {
      isAmountField: true
    }
  };

  colDefRequestedBy = {
    headerName: 'Requested By',
    field: 'requested_by',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    minWidth: 120,
    floatingFilterComponent: 'searchBoxComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'V3DTCommonFilterComponent',
    cellClass: 'flex flex-col justify-center'
  };

  colDefRequestedDate = {
    headerName: 'Requested Date',
    field: 'requested_date_formatted',
    suppressFloatingFilterButton: true,
    filter: 'agDateColumnFilter',
    minWidth: 100,
    floatingFilterComponent: 'dateRangeV35Component',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'V3DTCommonFilterComponent'
  };

  colDefActionBy = {
    headerName: 'Action By',
    field: 'action_by_name',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    minWidth: 120,
    floatingFilterComponent: 'searchBoxComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'V3DTCommonFilterComponent',
    cellClass: 'flex flex-col justify-center'
  };

  colDefActionDate = {
    headerName: 'Action Date',
    field: 'action_at_formatted',
    suppressFloatingFilterButton: true,
    filter: 'agDateColumnFilter',
    minWidth: 100,
    floatingFilterComponent: 'dateRangeV35Component',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'V3DTCommonFilterComponent'
  };

  colDefIssueDate = {
    headerName: 'Issue Date',
    field: 'cheque_issue_date',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    minWidth: 100,
    maxWidth: 140,
    floatingFilterComponent: 'dateRangeV35Component',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'V3DTCommonFilterComponent',
    cellClass: 'flex flex-col justify-center'
  };

  colDefChequeStatus = {
    headerName: 'Status',
    field: 'cheque_status',
    suppressFloatingFilterButton: true,
    filter: 'agNumberColumnFilter',
    minWidth: 100,
    floatingFilterComponent: 'selectBoxComponent',
    floatingFilter: true,
    cellRenderer: 'v3PaymentTableActionComponent',
    cellRendererParams: (
      params: ICellRendererParams<{ cheque_status: number }>
    ) => {
      const status = params.data?.cheque_status;
      let checkStatus;
      let checkColor;
      if (status || status === 0) {
        checkStatus =
          this.cellRendererCheckStatus?.[status]?.statusShortDescription;
        checkColor = this.cellRendererCheckStatus?.[status]?.color;
      }
      if (checkStatus === 'New') {
        checkStatus = 'Pending';
      }
      return {
        tableType: 'payments-table',
        checkStatus: { value: checkStatus, color: checkColor }
      };
    }
  };


  columnDefs = computed(() => {
    const tab = this.selectedPanelButton();
    const showActionColumns = tab === 'id_approved' || tab === 'id_rejected';
    const actionByLabel = tab === 'id_rejected' ? 'Rejected By' : 'Approved By';
    const actionDateLabel = tab === 'id_rejected' ? 'Rejected At' : 'Approved At';
    const base = [
      this.colDefId,
      this.colDefCompanyName,
      this.colDefCheckNumber,
      this.colDefPayeeName,
      this.colDefAmount,
      this.colDefRequestedBy,
      this.colDefRequestedDate,
      ...(showActionColumns ? [
        { ...this.colDefActionBy, headerName: actionByLabel },
        { ...this.colDefActionDate, headerName: actionDateLabel }
      ] : []),
      this.colDefIssueDate,
      tab === 'id_all'
        ? { ...this.colDefChequeStatus }
        : { ...this.colDefChequeStatus, floatingFilterComponent: undefined, floatingFilter: false }
    ];
    return base;
  });

  defaultColumnFields = computed(() => {
    const tab = this.selectedPanelButton();
    const showActionColumns = tab === 'id_approved' || tab === 'id_rejected';
    const actionByLabel = tab === 'id_rejected' ? 'Rejected By' : 'Approved By';
    const actionDateLabel = tab === 'id_rejected' ? 'Rejected At' : 'Approved At';
    const base = [
      {
        id: 'id',
        name: '#',
        isDisabled: true,
        colDef: this.colDefId,
        isChecked: true
      },
      {
        id: 'id_company_name',
        name: 'Company',
        isDisabled: false,
        colDef: this.colDefCompanyName,
        isChecked: true
      },
      {
        id: 'id_check_number',
        name: 'Check #',
        isDisabled: false,
        colDef: this.colDefCheckNumber,
        isChecked: true
      },
      {
        id: 'id_payee_name',
        name: 'Payee Name',
        isDisabled: true,
        colDef: this.colDefPayeeName,
        isChecked: true
      },
      {
        id: 'id_amount',
        name: 'Amount',
        isDisabled: false,
        colDef: this.colDefAmount,
        isChecked: true
      },
      {
        id: 'id_requested_by',
        name: 'Requested By',
        isDisabled: false,
        colDef: this.colDefRequestedBy,
        isChecked: true
      },
      {
        id: 'id_requested_date',
        name: 'Requested Date',
        isDisabled: false,
        colDef: this.colDefRequestedDate,
        isChecked: true
      },
      ...(showActionColumns ? [
        {
          id: 'id_action_by',
          name: actionByLabel,
          isDisabled: false,
          colDef: { ...this.colDefActionBy, headerName: actionByLabel },
          isChecked: true
        },
        {
          id: 'id_action_date',
          name: actionDateLabel,
          isDisabled: false,
          colDef: { ...this.colDefActionDate, headerName: actionDateLabel },
          isChecked: true
        }
      ] : []),
      {
        id: 'id_issue_date',
        name: 'Issue Date',
        isDisabled: false,
        colDef: this.colDefIssueDate,
        isChecked: true
      },
      {
        id: 'id_cheque_status',
        name: 'Status',
        isDisabled: false,
        colDef: tab === 'id_all'
          ? { ...this.colDefChequeStatus }
          : { ...this.colDefChequeStatus, floatingFilterComponent: undefined, floatingFilter: false },
        isChecked: true
      }
    ];
    return base;
  });

  ngOnInit(): void {
    this.getCheckDescription();
    this.getRowSelectionData();
    this.dataTableService.setDataFromParent(
      this.defaultColumnFields(),
      this.FloatingFilterComponent,
      this.cellRenderer,
      this.actionComponentProp
    );
    this.v3DataTableService.resetV3DataTablePayload();
    this.v3DataTableService.refreshV3DataTable();
    this.v3DataTableService.v3RowSelectionData = [];
    this.v3DataTableService.gridApi?.deselectAll();
  }

  getRowSelectionData() {
    this.v3DataTableService.v3RowSelectionData$
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe({
      next: (res) => {
        this.selectedRowData = res;
      }
    });
  }

  headerButtonClick(event: { id: string }) {
    switch (event.id) {
      case 'id_all':
        this.selectedPanelButton.set('id_all');
        this.v3DataTableService.updateV3DataTable = this.setFilterPayload('');
        break;
      case 'id_requested':
        this.selectedPanelButton.set('id_requested');
        this.v3DataTableService.updateV3DataTable = this.setFilterPayload('622');
        break;
      case 'id_approved':
        this.selectedPanelButton.set('id_approved');
        this.v3DataTableService.updateV3DataTable = this.setFilterPayload('623');
        break;
      case 'id_rejected':
        this.selectedPanelButton.set('id_rejected');
        this.v3DataTableService.updateV3DataTable = this.setFilterPayload('624');
        break;
      case 'approve':
        this.approveBulk(this.selectedRowData);
        break;
      case 'reject':
        this.rejectBulk(this.selectedRowData);
        break;
      default:
        break;
    }
  }

  getCheckDescription(): void {
    const checkStatus = this.localStorageService.getItem('check_status');
    if (checkStatus) {
      this.cellRendererCheckStatus = checkStatus;
      return;
    }
    this.checkService.getCheckStatus()
    .pipe(take(1))
    .subscribe((res) => {
      if (res?.success) {
        this.localStorageService.setItem('check_status', res.data);
        this.cellRendererCheckStatus = res.data;
      }
    });
  }

  setFilterPayload(filterValue: string) {
    const selectBoxFilterValues: ISelectBoxFilterValues | undefined = {
      filter: filterValue,
      filterType: 'text',
      type: 'equals'
    };
    const filterName = 'cheque_status';
    const filterPayloadForGrid: ISelectBoxFilterArray = {
      [filterName]: {
        ...selectBoxFilterValues
      }
    };
    return filterPayloadForGrid;
  }

  approveBulk(rows:  RowNode<IRowData>[]) {
  if (!rows?.length) {
    this.alertService.infoAlert({
      content: 'Please select at least one check.',
      isCancel: false
    });
    return;
  }
  const selectedRows = rows.map((row) => row.data) as IRowData[];
    const checkIds = selectedRows.map((row: IRowData) => row.cheque_id);

    const dialogRef = this.alertService.confirmAlert({
      content: `Are you sure you want to approve reprint for ${rows.length} check(s)?`,
      doneMsg: 'Approve',
      cancelMsg: 'Cancel',
      icon: 'confirm'
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;

      this.approveLoading.set(true);
      this.paymentsService
        .reprintApprove(checkIds)
        .pipe(
          finalize(() => this.approveLoading.set(false)),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe({
          next: (res) => {
            if (res?.data?.success) {
              this.alertService.successAlert({
                content: res.data.message || 'Reprint approved successfully.',
                close: true,
                timeout: 2000
              });
              this.v3DataTableService.refreshV3DataTable();
              this.v3DataTableService.gridApi?.deselectAll();
            }
          }
        });
    });
  }

  rejectBulk(rows:  RowNode<IRowData>[]) {
    if (!rows?.length) {
      this.alertService.infoAlert({
        content: 'Please select at least one check.',
        isCancel: false
      });
      return;
    }
    const selectedRows = rows.map((row) => row.data) as IRowData[];
    const checkIds = selectedRows.map((row: IRowData) => row.cheque_id);

    const dialogRef = this.alertService.infoAlert({
      content: `Are you sure you want to reject reprint for ${rows.length} check(s)?`,
      doneMsg: 'Reject',
      cancelMsg: 'Cancel'
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) return;

      this.rejectLoading.set(true);
      this.paymentsService
        .reprintReject(checkIds)
        .pipe(
          finalize(() => this.rejectLoading.set(false)),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe({
          next: (res) => {
            if (res?.data?.success) {
              this.alertService.successAlert({
                content: res.data.message || 'Reprint rejected successfully.',
                close: true,
                timeout: 2000
              });
              this.v3DataTableService.refreshV3DataTable();
              this.v3DataTableService.gridApi?.deselectAll();
            }
          }
        });
    });
  }
}

import { Component, DestroyRef, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import {
  ColDef,
  ValueGetterParams,
  ICellRendererParams
} from '@ag-grid-community/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { V4DataTableComponent } from 'src/app/modules/v4-data-table/components/v4-data-table/v4-data-table.component';
import { V4TextFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-text-floating-filter/v4-text-floating-filter.component';
import { V4DropdownFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-dropdown-floating-filter/v4-dropdown-floating-filter.component';
import { V4DateFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-date-floating-filter/v4-date-floating-filter.component';
import { V4CheckDetailsActionComponent } from './cell-renderers/v4-check-details-action/v4-check-details-action.component';
import { V4CreatedAtComponent } from 'src/app/modules/payments-v4/payments-out/components/v4-payments-table/cell-renderers/v4-created-at/v4-created-at.component';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { V4PageHeaderComponent } from 'src/app/shared/V4/v4-page-header/v4-page-header.component';
import { BulkMailStatus, ICheckDetailData, IGroupMailingLogsActivity } from '../../../models/group-mailing.model';
import { GroupMailingService } from '../../../services/group-mailing.service';
import { V4SingleMailDetailPanelComponent } from '../v4-single-mail-history/v4-single-mail-detail-panel/v4-single-mail-detail-panel.component';
import { DetailSidePanelComponent } from 'src/app/shared/V4/detail-side-panel/detail-side-panel.component';
import { ISelectedSingleRow } from 'src/app/modules/data-table/model/datatable';

@Component({
  selector: 'app-v4-multi-check-mail-table-details',
  templateUrl: './v4-multi-check-mail-table-details.component.html',
  styleUrls: ['./v4-multi-check-mail-table-details.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    V4DataTableComponent,
    CommonButtonV4Component,
    V4PageHeaderComponent,
    V4SingleMailDetailPanelComponent,
    DetailSidePanelComponent,
    DatePipe
  ]
})
export class V4MultiCheckMailTableDetailsComponent implements OnInit, OnDestroy {
  private v3DataTableService = inject(V3DataTableService);
  private dataTableService = inject(DataTableService);
  private groupMailingService = inject(GroupMailingService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  batchId: string | null = null;
  tableId = DTTableId.mailingDashboardCheckBatchItems;
  deselectedColumns: string[] = [];

  // Side panel state
  isPanelOpen = signal(false);
  selectedCheckId = signal('');
  selectedRow = signal<Record<string, unknown> | null>(null);

  // Logs panel state
  showLogsPanel = signal(false);
  logsLoading = signal(false);
  activityLogs = signal<IGroupMailingLogsActivity[]>([]);

  checkStatusTypes = [
    { value: BulkMailStatus.NEW, name: 'New' },
    { value: BulkMailStatus.PRINTED, name: 'Printed' },
    { value: BulkMailStatus.VOID, name: 'Void' },
    { value: BulkMailStatus.ARCHIVED, name: 'Archived' },
    { value: BulkMailStatus.PRINTING, name: 'Printing' },
    { value: BulkMailStatus.MAILED, name: 'Mailed' },
    { value: BulkMailStatus.REFUNDED, name: 'Refunded' },
    { value: BulkMailStatus.SCHEDULE, name: 'Schedule' },
    { value: BulkMailStatus.MAILED_AND_VOIDED, name: 'Mailed & Voided' },
    { value: BulkMailStatus.EMAILED, name: 'Emailed' },
    { value: BulkMailStatus.E_PRINTED, name: 'E-Printed' },
    { value: BulkMailStatus.REQUESTED, name: 'Requested' },
    { value: BulkMailStatus.DD, name: 'DD' },
    { value: BulkMailStatus.DD_FUNDING, name: 'DD-Funding' },
    { value: BulkMailStatus.DD_FAILED, name: 'DD-Failed' },
    { value: BulkMailStatus.DDW, name: 'DDW' },
    { value: BulkMailStatus.DD_DEPOSITING, name: 'DD-Depositing' },
    { value: BulkMailStatus.DD_DEPOSITING_FAILED, name: 'DD-Deposit-F' },
    { value: BulkMailStatus.DDC, name: 'DDC' },
    { value: BulkMailStatus.POSTED, name: 'Posted' },
    { value: BulkMailStatus.UN_POSTED, name: 'Un-Posted' },
    { value: BulkMailStatus.APPROVAL_REQUIRED, name: 'Approval-Required' },
    { value: BulkMailStatus.UNMAPPED_CHECKS, name: 'Unmapped-Checks' },
    { value: BulkMailStatus.EXPORTED, name: 'Exported' },
    { value: BulkMailStatus.NOT_EXPORTED, name: 'Not Exported' },
    { value: BulkMailStatus.BLANK, name: 'Blank' },
    { value: BulkMailStatus.IMPORTED, name: 'Imported' },
    { value: BulkMailStatus.EMAIL_RECURRING, name: 'Email Recurring' },
    { value: BulkMailStatus.EMAIL_SCHEDULED, name: 'Email Scheduled' },
    { value: BulkMailStatus.CHECK_CLEARED, name: 'Check Cleared' },
    { value: BulkMailStatus.DD_SCHEDULED, name: 'DD/Scheduled' }
  ];

  frameworkComponents = {
    SearchBoxComponent: V4TextFloatingFilterComponent,
    SelectBoxComponent: V4DropdownFloatingFilterComponent,
    v4DateRangeComponent: V4DateFloatingFilterComponent,
    v4CreatedAtComponent: V4CreatedAtComponent,
    actionComponent: V4CheckDetailsActionComponent
  };

  configs = {
    selectBox: [
      {
        id: 'cheque_status',
        values: this.checkStatusTypes
      }
    ],
    selectDate: [
      {
        id: 'cheque_issue_date',
        initialRange: 'All Time'
      },
      {
        id: 'created_at',
        initialRange: 'All Time'
      }
    ]
  };

  ngOnInit(): void {
    this.route.params
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        this.batchId = params['batchId'];
      });

    this.dataTableService.setDataFromParent(
      this.defaultColumnFields,
      this.configs,
      undefined
    );
    this.initializeV3DataTable();
  }

  private initializeV3DataTable(): void {
    this.v3DataTableService.defaultPayload = {
      startRow: 0,
      endRow: 50,
      rowGroupCols: [],
      valueCols: [],
      pivotCols: [],
      pivotMode: false,
      groupKeys: [],
      filterModel: {},
      sortModel: [],
      batchId: this.batchId || undefined
    };
    this.v3DataTableService.refreshV3DataTable();
  }

  // ==================== COLUMN DEFINITIONS ====================

  colDefStatus: ColDef = {
    headerName: 'Import Status',
    minWidth: 120,
    width: 150,
    maxWidth: 300,
    field: 'cheque_status',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SelectBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    pinned: 'right' as const,
    lockPosition: 'right' as const,
    lockPinned: true,
    suppressMovable: true,
    cellRenderer: (params: ICellRendererParams<ICheckDetailData>) => {
      const label = this.getStatusText(params.data?.cheque_status ?? 0);
      const colorMap: Record<string, { bg: string; text: string }> = {
        New:      { bg: 'var(--v4-badge-accent-bg-color)',  text: 'var(--v4-badge-accent-text-color)' },
        Printing: { bg: 'var(--v4-badge-info-bg-color)',    text: 'var(--v4-badge-info-text-color)' },
        Printed:  { bg: 'var(--v4-badge-success-bg-color)', text: 'var(--v4-badge-success-text-color)' },
        Mailed:   { bg: 'var(--v4-badge-success-bg-color)', text: 'var(--v4-badge-success-text-color)' },
        Void:     { bg: 'var(--v4-badge-error-bg-color)',   text: 'var(--v4-badge-error-text-color)' },
        Archived: { bg: 'var(--v4-badge-neutral-bg-color)', text: 'var(--v4-badge-neutral-text-color)' }
      };
      const c = colorMap[label] ?? { bg: 'var(--v4-badge-neutral-bg-color)', text: 'var(--v4-badge-neutral-text-color)' };
      return `<span class="status-badge" style="background:${c.bg};color:${c.text}">${label}</span>`;
    }
  };

  colDefAmount: ColDef = {
    headerName: 'Amount',
    minWidth: 150,
    maxWidth: 200,
    field: 'cheque_amount',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agNumberColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex justify-end pr-3 text-end',
    cellRenderer: (params: ICellRendererParams<ICheckDetailData>) =>
      params.data?.cheque_amount ? `$${params.data.cheque_amount}` : ''
  };

  colDefPayeeName: ColDef = {
    headerName: 'Payee',
    minWidth: 150,
    field: 'payee_name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponentParams: { tableId: 113 },
    valueGetter: (params: ValueGetterParams<ICheckDetailData>) =>
      params.data?.payee_name || ''
  };

  colDefCheckNumber: ColDef = {
    headerName: 'Check Number',
    minWidth: 140,
    field: 'cheque_serial_number',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    valueGetter: (params: ValueGetterParams<ICheckDetailData>) =>
      params.data?.cheque_serial_number || ''
  };

  colDefIssueDate: ColDef = {
    headerName: 'Issue Date',
    minWidth: 130,
    field: 'cheque_issue_date',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'v4DateRangeComponent',
    filter: 'agDateColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'v4CreatedAtComponent'
  };

  colDefCreatedAt: ColDef = {
    headerName: 'Created At',
    minWidth: 180,
    field: 'created_at',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'v4DateRangeComponent',
    filter: 'agDateColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponentParams: {
      tableName: 'multi_check_mail_table_details',
      tableId: 113
    },
    cellRenderer: 'v4CreatedAtComponent'
  };

  colDefInvoiceNumber: ColDef = {
    headerName: 'Invoice Number',
    minWidth: 150,
    field: 'cheque_invoice_number',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    valueGetter: (params: ValueGetterParams<ICheckDetailData>) =>
      params.data?.cheque_invoice_number || ''
  };

  colDefCategory: ColDef = {
    headerName: 'Category',
    minWidth: 150,
    field: 'catagory_name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    valueGetter: (params: ValueGetterParams<ICheckDetailData>) =>
      params.data?.catagory_name || 'N/A'
  };

  colDefLog: ColDef = {
    headerName: 'Log',
    minWidth: 150,
    field: 'error_log',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    valueGetter: (params: ValueGetterParams<ICheckDetailData>) =>
      params.data?.error_log || ''
  };

  colDefAction: ColDef = {
    headerName: 'Action',
    field: 'action',
    suppressFloatingFilterButton: true,
    minWidth: 60,
    maxWidth: 90,
    cellRenderer: 'actionComponent',
    cellRendererParams: () => ({
      batchId: this.batchId,
      refreshSubject: this.v3DataTableService.refreshV3DataTableSubject$
    }),
    sortable: false,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    pinned: 'left' as const,
    lockPosition: true
  };

  defaultColumnFields = [
    { id: 'action', name: 'Action', isDisabled: false, colDef: this.colDefAction, isChecked: true },
    { id: 'cheque_amount', name: 'Amount', isDisabled: false, colDef: this.colDefAmount, isChecked: true },
    { id: 'payee_name', name: 'Payee', isDisabled: false, colDef: this.colDefPayeeName, isChecked: true },
    { id: 'cheque_serial_number', name: 'Check Number', isDisabled: false, colDef: this.colDefCheckNumber, isChecked: true },
    { id: 'cheque_issue_date', name: 'Issue Date', isDisabled: false, colDef: this.colDefIssueDate, isChecked: true },
    { id: 'created_at', name: 'Created At', isDisabled: false, colDef: this.colDefCreatedAt, isChecked: true },
    { id: 'cheque_invoice_number', name: 'Invoice Number', isDisabled: false, colDef: this.colDefInvoiceNumber, isChecked: true },
    { id: 'catagory_name', name: 'Category', isDisabled: false, colDef: this.colDefCategory, isChecked: true },
    { id: 'error_log', name: 'Log', isDisabled: false, colDef: this.colDefLog, isChecked: true },
    { id: 'cheque_status', name: 'Status', isDisabled: false, colDef: this.colDefStatus, isChecked: true }
  ];

  columnDefs = [
    this.colDefAction, this.colDefAmount, this.colDefPayeeName,
    this.colDefCheckNumber, this.colDefIssueDate, this.colDefCreatedAt,
    this.colDefInvoiceNumber, this.colDefCategory, this.colDefLog, this.colDefStatus
  ];

  // ==================== STATUS TEXT ====================

  getStatusText(status: number): string {
    switch (String(status)) {
      case BulkMailStatus.NEW: return 'New';
      case BulkMailStatus.PRINTED: return 'Printed';
      case BulkMailStatus.VOID: return 'Void';
      case BulkMailStatus.ARCHIVED: return 'Archived';
      case BulkMailStatus.PRINTING: return 'Printing';
      case BulkMailStatus.MAILED: return 'Mailed';
      case BulkMailStatus.REFUNDED: return 'Refunded';
      case BulkMailStatus.SCHEDULE: return 'Schedule';
      case BulkMailStatus.MAILED_AND_VOIDED: return 'Mailed & Voided';
      case BulkMailStatus.EMAILED: return 'Emailed';
      case BulkMailStatus.E_PRINTED: return 'E-Printed';
      case BulkMailStatus.REQUESTED: return 'Requested';
      case BulkMailStatus.DD: return 'DD';
      case BulkMailStatus.DD_FUNDING: return 'DD-Funding';
      case BulkMailStatus.DD_FAILED: return 'DD-Failed';
      case BulkMailStatus.DDW: return 'DDW';
      case BulkMailStatus.DD_DEPOSITING: return 'DD-Depositing';
      case BulkMailStatus.DD_DEPOSITING_FAILED: return 'DD-Deposit-F';
      case BulkMailStatus.DDC: return 'DDC';
      case BulkMailStatus.POSTED: return 'Posted';
      case BulkMailStatus.UN_POSTED: return 'Un-Posted';
      case BulkMailStatus.APPROVAL_REQUIRED: return 'Approval-Required';
      case BulkMailStatus.UNMAPPED_CHECKS: return 'Unmapped-Checks';
      case BulkMailStatus.EXPORTED: return 'Exported';
      case BulkMailStatus.NOT_EXPORTED: return 'Not Exported';
      case BulkMailStatus.BLANK: return 'Blank';
      case BulkMailStatus.IMPORTED: return 'Imported';
      case BulkMailStatus.EMAIL_RECURRING: return 'Email Recurring';
      case BulkMailStatus.EMAIL_SCHEDULED: return 'Email Scheduled';
      case BulkMailStatus.CHECK_CLEARED: return 'Check Cleared';
      case BulkMailStatus.DD_SCHEDULED: return 'DD/Scheduled';
      default: return 'Unknown';
    }
  }

  // ==================== EVENT HANDLERS ====================

  onCellActionView(event: ISelectedSingleRow): void {
    const selectedItem = event.selectedRow;
    const checkId = selectedItem?.id || selectedItem?.action;
    if (checkId) {
      this.selectedCheckId.set(String(checkId));
      this.selectedRow.set(selectedItem);
      this.isPanelOpen.set(true);
    }
  }

  onPanelClosed(): void {
    this.isPanelOpen.set(false);
  }

  viewLog(): void {
    if (!this.batchId) return;
    this.showLogsPanel.set(true);
    this.logsLoading.set(true);
    this.groupMailingService
      .getBatchLogs(this.batchId)
      .pipe(
        finalize(() => this.logsLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res?.success) {
          this.activityLogs.set(res.data?.activities || []);
        }
      });
  }

  closeLogsPanel(): void {
    this.showLogsPanel.set(false);
  }

  goBack(): void {
    this.router.navigate([
      '/v4/manage/business-tools/mail-dashboard/multi-check-mail-table'
    ]);
  }

  ngOnDestroy(): void {
    this.v3DataTableService.rowData = [];
  }
}

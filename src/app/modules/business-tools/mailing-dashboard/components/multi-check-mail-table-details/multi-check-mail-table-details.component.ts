import { Component, OnDestroy, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import {
  ColDef,
  IRowNode,
  IsRowSelectable,
  ValueGetterParams,
  ICellRendererParams
} from '@ag-grid-community/core';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { V3DataTableSelectBoxComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-data-table-select-box/v3-data-table-select-box.component';
import { DtSearchBoxComponent } from 'src/app/modules/data-table/components/dt-search-box/dt-search-box.component';
import { V3DataTableComponent } from 'src/app/modules/v3-data-table/components/v3-data-table/v3-data-table.component';
import { V3DataTableModule } from 'src/app/modules/v3-data-table/v3-data-table.module';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { DataRangeV35Component } from 'src/app/shared/components/date-range-v35/data-range-v35.component';
import { IV3DtHeaderElements } from 'src/app/modules/v3-data-table/models/v3-data-table';
import { Subject, takeUntil } from 'rxjs';
import { faFileAlt } from '@fortawesome/pro-regular-svg-icons';
import { MatDialog } from '@angular/material/dialog';
import { BulkMailStatus, ICheckDetailData } from '../../models/group-mailing.model';
import { CheckDetailsActionComponent } from '../check-details-action/check-details-action.component';
import { MailingDashboardLogModalComponent } from '../../modal/mailing-dashboard-log-modal/mailing-dashboard-log-modal.component';


@Component({
  selector: 'app-multi-check-mail-table-details',
  templateUrl: './multi-check-mail-table-details.component.html',
  styleUrls: ['./multi-check-mail-table-details.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    V3DataTableComponent,
    V3DataTableModule
  ],
  providers: []
})
export class MultiCheckMailTableDetailsComponent implements OnInit, OnDestroy {
  private v3DataTableService = inject(V3DataTableService);
  private dataTableService = inject(DataTableService);
  private route = inject(ActivatedRoute);
  private dialog = inject(MatDialog);
  private destroy$ = new Subject<void>();

  batchId: string | null = null;
  tableData = signal<ICheckDetailData[]>([]);
  loading = signal(false);
  faFileAlt = faFileAlt;
  
  tableId = DTTableId.mailingDashboardCheckBatchItems;
  deselectedColumns: string[] = [];

  frameWorkComponents = {
    SearchBoxComponent: DtSearchBoxComponent,
    V3DataTableSelectBoxComponent,
    selectDateComponent: DataRangeV35Component,
    actionComponent: CheckDetailsActionComponent
  };

  isRowSelectable: IsRowSelectable = (_: IRowNode) => false;

  // Shipping types for mailing
  shippingTypes = [
    { name: 'USPS First Class Mail', value: 'USPS_FIRST_CLASS_MAIL' },
    { name: 'USPS Priority Mail', value: 'USPS_PRIORITY_MAIL' },
    { name: 'FedEx Overnight', value: 'FEDEX_OVERNIGHT' },
    { name: 'UPS Ground', value: 'UPS_GROUND' }
  ];

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
    { value: BulkMailStatus.APPROVAL_REQUIRED, name: 'Approval-required' },
    { value: BulkMailStatus.UNMAPPED_CHECKS, name: 'Unmapped-checks' },
    { value: BulkMailStatus.EXPORTED, name: 'Exported' },
    { value: BulkMailStatus.NOT_EXPORTED, name: 'Not Exported' },
    { value: BulkMailStatus.BLANK, name: 'Blank' },
    { value: BulkMailStatus.IMPORTED, name: 'Imported' },
    { value: BulkMailStatus.EMAIL_RECURRING, name: 'Email Recurring' },
    { value: BulkMailStatus.EMAIL_SCHEDULED, name: 'Email Scheduled' },
    { value: BulkMailStatus.CHECK_CLEARED, name: 'Check Cleared' },
    { value: BulkMailStatus.DD_SCHEDULED, name: 'DD/Scheduled' }
  ];

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

  public headerElements = computed<IV3DtHeaderElements>(() => ({
    buttons: [
      {
        text: 'Logs',
        id: 'id_log',
        icon: ['fas', 'file-alt'],
        backGroundInput: 'var(--common-green-color)',
        type: 'list',
        isAddIcon: true,
        toolTip: 'Logs'
      },
    ]
  }));

  ngOnInit(): void {
    // Get batch ID from route params
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.batchId = params.batchId;
    });
    this.dataTableService.setDataFromParent(
      this.defaultColumnFields,
      this.configs,
      undefined
    );
    this.initializeV3DataTable();
  }

  initializeV3DataTable() {
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

  // Column Definitions
  colDefStatus: ColDef = {
    headerName: 'Import Status',
    minWidth: 120,
    field: 'cheque_status',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: V3DataTableSelectBoxComponent,
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    valueGetter: (params: ValueGetterParams<ICheckDetailData>) => 
      this.getStatusText(params.data?.cheque_status || 0)
  };

  colDefAmount: ColDef = {
    headerName: 'Amount',
    minWidth: 120,
    field: 'cheque_amount',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agNumberColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: (params: ICellRendererParams<ICheckDetailData>) => {
      if (!params.data) return '';
      return params.data?.cheque_amount ? `$${params.data.cheque_amount}` : '';
    }
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
    floatingFilterComponent: 'selectDateComponent',
    filter: 'agDateColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    valueGetter: (params: ValueGetterParams<ICheckDetailData>) =>
      params.data?.cheque_issue_date || ''
  };

  colDefCreatedAt: ColDef = {
    headerName: 'Created At',
    minWidth: 180,
    field: 'created_at',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectDateComponent',
    filter: 'agDateColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponentParams: { tableName: 'multi_check_mail_table_details', tableId: 113 },
    valueGetter: (params: ValueGetterParams<ICheckDetailData>) =>
      params.data?.created_at || ''
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
    headerName: 'Actions',
    field: 'action',
    suppressFloatingFilterButton: true,
    minWidth: 100,
    maxWidth: 150,
    cellRenderer: 'actionComponent',
    cellRendererParams: () => ({
      batchId: this.batchId,
      refreshSubject: this.v3DataTableService.refreshV3DataTableSubject$
    }),
    sortable: false,
    suppressHeaderMenuButton: true
  };

  defaultColumnFields = [
    {
      id: 'cheque_status',
      name: 'Status',
      isDisabled: false,
      colDef: this.colDefStatus,
      isChecked: true
    },
    {
      id: 'cheque_amount',
      name: 'Amount',
      isDisabled: false,
      colDef: this.colDefAmount,
      isChecked: true
    },
    {
      id: 'payee_name',
      name: 'Payee',
      isDisabled: false,
      colDef: this.colDefPayeeName,
      isChecked: true
    },
    {
      id: 'cheque_serial_number',
      name: 'Check Number',
      isDisabled: false,
      colDef: this.colDefCheckNumber,
      isChecked: true
    },
    {
      id: 'cheque_issue_date',
      name: 'Issue Date',
      isDisabled: false,
      colDef: this.colDefIssueDate,
      isChecked: true
    },
    {
      id: 'created_at',
      name: 'Created At',
      isDisabled: false,
      colDef: this.colDefCreatedAt,
      isChecked: true
    },
    {
      id: 'cheque_invoice_number',
      name: 'Invoice Number',
      isDisabled: false,
      colDef: this.colDefInvoiceNumber,
      isChecked: true
    },
    {
      id: 'catagory_name',
      name: 'Category',
      isDisabled: false,
      colDef: this.colDefCategory,
      isChecked: true
    },
    {
      id: 'error_log',
      name: 'Log',
      isDisabled: false,
      colDef: this.colDefLog,
      isChecked: true
    },
    {
      id: 'action',
      name: 'Actions',
      isDisabled: false,
      colDef: this.colDefAction,
      isChecked: true
    }
  ];

  columnDefs = [
    this.colDefStatus,
    this.colDefAmount,
    this.colDefPayeeName,
    this.colDefCheckNumber,
    this.colDefIssueDate,
    this.colDefCreatedAt,
    this.colDefInvoiceNumber,
    this.colDefCategory,
    this.colDefLog,
    this.colDefAction
  ];

  getStatusText(status: number): string {
    switch (String(status)) {
      case BulkMailStatus.NEW:
        return 'New';
      case BulkMailStatus.PRINTED:
        return 'Printed';
      case BulkMailStatus.VOID:
        return 'Void';
      case BulkMailStatus.ARCHIVED:
        return 'Archived';
      case BulkMailStatus.PRINTING:
        return 'Printing';
      case BulkMailStatus.MAILED:
        return 'Mailed';
      case BulkMailStatus.REFUNDED:
        return 'Refunded';
      case BulkMailStatus.SCHEDULE:
        return 'Schedule';
      case BulkMailStatus.MAILED_AND_VOIDED:
        return 'Mailed & Voided';
      case BulkMailStatus.EMAILED:
        return 'Emailed';
      case BulkMailStatus.E_PRINTED:
        return 'E-Printed';
      case BulkMailStatus.REQUESTED:
        return 'Requested';
      case BulkMailStatus.DD:
        return 'DD';
      case BulkMailStatus.DD_FUNDING:
        return 'DD-Funding';
      case BulkMailStatus.DD_FAILED:
        return 'DD-Failed';
      case BulkMailStatus.DDW:
        return 'DDW';
      case BulkMailStatus.DD_DEPOSITING:
        return 'DD-Depositing';
      case BulkMailStatus.DD_DEPOSITING_FAILED:
        return 'DD-Deposit-F';
      case BulkMailStatus.DDC:
        return 'DDC';
      case BulkMailStatus.POSTED:
        return 'Posted';
      case BulkMailStatus.UN_POSTED:
        return 'Un-Posted';
      case BulkMailStatus.APPROVAL_REQUIRED:
        return 'Approval-required';
      case BulkMailStatus.UNMAPPED_CHECKS:
        return 'Unmapped-checks';
      case BulkMailStatus.EXPORTED:
        return 'Exported';
      case BulkMailStatus.NOT_EXPORTED:
        return 'Not Exported';
      case BulkMailStatus.BLANK:
        return 'Blank';
      case BulkMailStatus.IMPORTED:
        return 'Imported';
      case BulkMailStatus.EMAIL_RECURRING:
        return 'Email Recurring';
      case BulkMailStatus.EMAIL_SCHEDULED:
        return 'Email Scheduled';
      case BulkMailStatus.CHECK_CLEARED:
        return 'Check Cleared';
      case BulkMailStatus.DD_SCHEDULED:
        return 'DD/Scheduled';
      default:
        return 'Unknown';
    }
  }

  headerButtonClick(event: { id: string }): void {
    switch (event.id) {
      case 'id_log':
        this.viewLog();
        break;
      default:
        break;
    }
  }


  viewLog(): void {
    if (!this.batchId) {
      return;
    }

    this.dialog.open(MailingDashboardLogModalComponent, {
      maxWidth: '900px',
      width: '93%',
      disableClose: true,
      data: {
        batchId: this.batchId,
        batchName: `Batch ${this.batchId}`
      }
    });
  }

  ngOnDestroy(): void {
    this.v3DataTableService.rowData = [];
    this.destroy$.next();
    this.destroy$.complete();
  }
}
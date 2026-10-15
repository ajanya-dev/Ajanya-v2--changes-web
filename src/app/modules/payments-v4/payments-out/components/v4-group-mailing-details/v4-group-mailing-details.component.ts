import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import {
  ColDef,
  IRowNode,
  IsRowSelectable,
  ValueGetterParams
} from '@ag-grid-community/core';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { finalize } from 'rxjs/operators';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltip } from '@angular/material/tooltip';
import { V4DataTableComponent } from 'src/app/modules/v4-data-table/components/v4-data-table/v4-data-table.component';
import { V4PageHeaderComponent } from 'src/app/shared/V4/v4-page-header/v4-page-header.component';
import { V4TextFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-text-floating-filter/v4-text-floating-filter.component';
import { V4DropdownFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-dropdown-floating-filter/v4-dropdown-floating-filter.component';
import { V4DateFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-date-floating-filter/v4-date-floating-filter.component';
import { Utils } from 'src/app/data/utils';
import {
  IGroupMailingDetailData,
  IGroupMailingActivityLog,
  IGroupMailingAttachment,
  IGroupMailingRawDetails,
  GroupMailingDetailsStatus
} from 'src/app/modules/business-tools/mailing-dashboard/models/group-mailing.model';
import { GroupMailingService } from 'src/app/modules/business-tools/mailing-dashboard/services/group-mailing.service';
import { V4GroupMailingItemStatusBadgeComponent } from 'src/app/modules/payments-v4/payments-out/components/v4-group-mailing-list/v4-group-mailing-item-status-badge.component';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';

@Component({
  selector: 'app-v4-group-mailing-details',
  templateUrl: './v4-group-mailing-details.component.html',
  styleUrls: ['./v4-group-mailing-details.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    V4DataTableComponent,
    LucideAngularModule,
    V4PageHeaderComponent,
    MatTooltip
  ]
})
export class V4GroupMailingDetailsComponent implements OnInit, OnDestroy {
  private v3DataTableService = inject(V3DataTableService);
  private dataTableService = inject(DataTableService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private groupMailingService = inject(GroupMailingService);
  private checkService = inject(CheckService);
  private alertService = inject(V4AlertService);
  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);
  private subscriptions: Subscription[] = [];
  public staticWhiteLabelConditions = StaticWhiteLabelConditions;

  tableId = DTTableId.businessToolsGroupMailingDetails;
  groupMailingId = '';
  groupMailingData: IGroupMailingDetailData | null = null;
  loading = false;
  deselectedColumns: string[] = [];

  activityLogs: IGroupMailingActivityLog[] = [];
  loadingActivityLogs = false;

  uniqueAttachments: IGroupMailingAttachment[] = [];
  loadingAttachments = false;

  frameworkComponents = {
    searchBoxComponent: V4TextFloatingFilterComponent,
    selectBoxComponent: V4DropdownFloatingFilterComponent,
    selectDateComponent: V4DateFloatingFilterComponent,
    itemStatusBadgeComponent: V4GroupMailingItemStatusBadgeComponent
  };

  isRowSelectable: IsRowSelectable = (_: IRowNode) => false;

  statusTypes = [
    { value: GroupMailingDetailsStatus.NEW, name: 'New' },
    { value: GroupMailingDetailsStatus.PRINTED, name: 'Printed' },
    { value: GroupMailingDetailsStatus.VOID, name: 'Void' },
    { value: GroupMailingDetailsStatus.ARCHIVED, name: 'Archived' },
    { value: GroupMailingDetailsStatus.PRINTING, name: 'Printing' },
    { value: GroupMailingDetailsStatus.MAILED, name: 'Mailed' },
    { value: GroupMailingDetailsStatus.SCHEDULE, name: 'Schedule' },
    { value: GroupMailingDetailsStatus.EMAILED, name: 'E-Printed' },
    { value: GroupMailingDetailsStatus.REQUESTED, name: 'Requested' },
    { value: GroupMailingDetailsStatus.DD, name: 'DD' },
    { value: GroupMailingDetailsStatus.DD_FUNDING, name: 'DD-Funding' },
    { value: GroupMailingDetailsStatus.DD_FAILED, name: 'DD-Failed' },
    { value: GroupMailingDetailsStatus.DDW, name: 'DDW' },
    { value: GroupMailingDetailsStatus.DD_DEPOSITING, name: 'DD-Depositing' },
    {
      value: GroupMailingDetailsStatus.DD_DEPOSIT_FAILED,
      name: 'DD-Deposit-F'
    },
    { value: GroupMailingDetailsStatus.DDC, name: 'DDC' },
    { value: GroupMailingDetailsStatus.POSTED, name: 'Posted' },
    { value: GroupMailingDetailsStatus.UN_POSTED, name: 'Un-Posted' },
    {
      value: GroupMailingDetailsStatus.APPROVAL_REQUIRED,
      name: 'Approval-Required'
    },
    {
      value: GroupMailingDetailsStatus.UNMAPPED_CHECKS,
      name: 'Unmapped-Checks'
    },
    { value: GroupMailingDetailsStatus.EXPORTED, name: 'Exported' },
    { value: GroupMailingDetailsStatus.NOT_EXPORTED, name: 'Not Exported' },
    { value: GroupMailingDetailsStatus.BLANK, name: 'Blank' }
  ];

  configs = {
    selectBox: [
      {
        id: 'cheque_status',
        values: this.statusTypes
      }
    ],
    selectDate: [
      {
        id: 'cheques.created_at',
        initialRange: 'All Time'
      }
    ]
  };

  constructor() {
    this.groupMailingId = this.route.snapshot.paramMap.get('id') || '';
  }

  ngOnInit(): void {
    this.v3DataTableService.rowData = [];
    this.v3DataTableService.resetV3DataTablePayload();
    this.loadGroupMailingData();
    this.loadActivityLogs();
    this.dataTableService.setDataFromParent(
      this.defaultColumnFields,
      this.configs,
      undefined
    );
    this.initializeV3DataTable();

    this.subscriptions.push(
      this.v3DataTableService.hasV3DataTableLoaded$.subscribe((loaded) => {
        if (loaded && this.v3DataTableService.rowData) {
          this.extractAttachmentsFromRowData();
        }
      })
    );
  }

  loadGroupMailingData(): void {
    if (this.groupMailingId) {
      this.loading = true;
      this.subscriptions.push(
        this.groupMailingService
          .getGroupMailingDetails(this.groupMailingId)
          .subscribe({
            next: (response) => {
              if (response.success && response.data) {
                this.groupMailingData = response.data;
              } else {
                this.groupMailingData = {
                  group_id: this.groupMailingId,
                  count_group_items: 0,
                  count_attachment: 0,
                  sender_info: { sender: 'Unknown', receiver: 'Unknown' },
                  shipment_name: 'Unknown',
                  tracking_link: '',
                  is_individual_envelope: 0
                };
              }
              this.loading = false;
            },
            error: () => {
              this.loading = false;
              this.groupMailingData = {
                group_id: this.groupMailingId,
                count_group_items: 0,
                count_attachment: 0,
                sender_info: {
                  sender: 'Error loading data',
                  receiver: 'Error loading data'
                },
                shipment_name: 'Error loading data',
                tracking_link: '',
                is_individual_envelope: 0
              };
            }
          })
      );
    }
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
      sortModel: []
    };
  }

  colDefSerialNumber: ColDef = {
    headerName: 'Serial Number',
    minWidth: 140,
    width: 145,
    maxWidth: 170,
    flex: 0,
    field: 'cheque_serial_number',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'searchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefPayeeName: ColDef = {
    headerName: 'Payee',
    minWidth: 140,
    flex: 2,
    field: 'payee_name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'searchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefBankAccountName: ColDef = {
    headerName: 'AC Name',
    minWidth: 140,
    flex: 2,
    field: 'bank_account_account_name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'searchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefStatus: ColDef = {
    headerName: 'Status',
    minWidth: 150,
    width: 160,
    maxWidth: 160,
    flex: 0,
    pinned: 'right',
    lockPinned: true,
    lockPosition: 'right',
    suppressMovable: true,
    field: 'cheque_status',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'itemStatusBadgeComponent',
    // Keeps the exported / sorted value readable text rather than the raw code;
    // the badge renderer reads the raw status off the row itself.
    valueGetter: (params: ValueGetterParams<{ cheque_status?: number }>) =>
      this.getStatusText(params.data?.cheque_status || 'Unknown')
  };

  colDefAmount: ColDef = {
    headerName: 'Amount',
    minWidth: 125,
    width: 130,
    maxWidth: 160,
    flex: 0,
    field: 'cheque_amount',
    cellClass: 'flex justify-end pr-3 text-end',
    headerClass: 'v4-amount-col',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'searchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    valueGetter: (params: ValueGetterParams<{ cheque_amount?: string }>) =>
      params.data?.cheque_amount ? `$${params.data.cheque_amount}` : ''
  };

  colDefMemo: ColDef = {
    headerName: 'Memo',
    minWidth: 130,
    flex: 2,
    field: 'cheque_memo',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'searchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefCreatedDate: ColDef = {
    headerName: 'Date',
    minWidth: 145,
    width: 150,
    maxWidth: 180,
    flex: 0,
    field: 'cheques.created_at',
    cellClass: 'flex flex-col justify-center',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectDateComponent',
    filter: 'agDateColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponentParams: {
      tableName: 'group_mailing_details',
      tableId: this.tableId
    },
    cellRenderer: (params: { data: { created_at?: string } }) => {
      const createdAt = params.data?.created_at;
      if (!createdAt) return '';
      const date = Utils.splitDate(createdAt) ?? '';
      const time = Utils.splitTime(createdAt) ?? '';
      // Font size / weight / family come from the shared `.ag-cell` rule.
      return `<span style="display:flex;flex-direction:column;gap:2px;line-height:14px;">
        <span>${date}</span>
        <span style="color:var(--v4-secondary-text-color);">${time}</span>
      </span>`;
    }
  };

  defaultColumnFields = [
    {
      id: 'cheque_serial_number',
      name: 'Serial',
      isDisabled: true,
      colDef: this.colDefSerialNumber,
      isChecked: true
    },
    {
      id: 'payee_name',
      name: 'Payee To',
      isDisabled: true,
      colDef: this.colDefPayeeName,
      isChecked: true
    },
    {
      id: 'bank_account_account_name',
      name: 'AC Name',
      isDisabled: false,
      colDef: this.colDefBankAccountName,
      isChecked: true
    },
    {
      id: 'cheque_amount',
      name: 'Amount',
      isDisabled: true,
      colDef: this.colDefAmount,
      isChecked: true
    },
    {
      id: 'cheque_memo',
      name: 'Memo',
      isDisabled: false,
      colDef: this.colDefMemo,
      isChecked: true
    },
    {
      id: 'created_at',
      name: 'Date',
      isDisabled: true,
      colDef: this.colDefCreatedDate,
      isChecked: true
    },
    {
      id: 'cheque_status',
      name: 'Status',
      isDisabled: true,
      colDef: this.colDefStatus,
      isChecked: true
    }
  ];

  columnDefs: ColDef[] = [
    this.colDefSerialNumber,
    this.colDefPayeeName,
    this.colDefBankAccountName,
    this.colDefAmount,
    this.colDefMemo,
    this.colDefCreatedDate,
    this.colDefStatus
  ];

  goBack(): void {
    this.router.navigate([
      '/v4/manage/business-tools/mail-dashboard/group-mailing'
    ]);
  }

  goToLiveChat(): void {
    this.dynamicWhiteLabelService.goToLiveChat();
  }

  getStatusText(status: number | string): string {
    switch (String(status)) {
      case GroupMailingDetailsStatus.NEW:
        return 'New';
      case GroupMailingDetailsStatus.PRINTED:
        return 'Printed';
      case GroupMailingDetailsStatus.VOID:
        return 'Void';
      case GroupMailingDetailsStatus.ARCHIVED:
        return 'Archived';
      case GroupMailingDetailsStatus.PRINTING:
        return 'Printing';
      case GroupMailingDetailsStatus.MAILED:
        return 'Mailed';
      case GroupMailingDetailsStatus.SCHEDULE:
        return 'Schedule';
      case GroupMailingDetailsStatus.EMAILED:
        return 'E-Printed';
      case GroupMailingDetailsStatus.REQUESTED:
        return 'Requested';
      case GroupMailingDetailsStatus.DD:
        return 'DD';
      case GroupMailingDetailsStatus.DD_FUNDING:
        return 'DD-Funding';
      case GroupMailingDetailsStatus.DD_FAILED:
        return 'DD-Failed';
      case GroupMailingDetailsStatus.DDW:
        return 'DDW';
      case GroupMailingDetailsStatus.DD_DEPOSITING:
        return 'DD-Depositing';
      case GroupMailingDetailsStatus.DD_DEPOSIT_FAILED:
        return 'DD-Deposit-F';
      case GroupMailingDetailsStatus.DDC:
        return 'DDC';
      case GroupMailingDetailsStatus.POSTED:
        return 'Posted';
      case GroupMailingDetailsStatus.UN_POSTED:
        return 'Un-Posted';
      case GroupMailingDetailsStatus.APPROVAL_REQUIRED:
        return 'Approval-Required';
      case GroupMailingDetailsStatus.UNMAPPED_CHECKS:
        return 'Unmapped-Checks';
      case GroupMailingDetailsStatus.EXPORTED:
        return 'Exported';
      case GroupMailingDetailsStatus.NOT_EXPORTED:
        return 'Not Exported';
      case GroupMailingDetailsStatus.BLANK:
        return 'Blank';
      case '11':
        return 'Mailed';
      default:
        return 'Unknown';
    }
  }

  getAdditionalPayload() {
    return {
      group_id: this.groupMailingId
    };
  }

  loadActivityLogs(): void {
    if (this.groupMailingId) {
      this.loadingActivityLogs = true;
      this.subscriptions.push(
        this.groupMailingService.getActivityLog(this.groupMailingId).subscribe({
          next: (response) => {
            if (response.success && response.data) {
              this.activityLogs = response.data;
            } else {
              this.activityLogs = [];
            }
            this.loadingActivityLogs = false;
          },
          error: () => {
            this.loadingActivityLogs = false;
            this.activityLogs = [];
          }
        })
      );
    }
  }

  formatAddress(address: string | undefined): string {
    if (!address) return 'N/A';
    if (address.includes('<br>')) return address;
    const cleanedAddress = address.replace(/\s+/g, ' ').trim();
    if (!cleanedAddress.includes('\n') && !cleanedAddress.includes(',')) {
      return cleanedAddress;
    }
    const parts = cleanedAddress
      .split(/[,\n]/)
      .map((part) => part.trim())
      .filter((part) => part.length > 0);
    return parts.join('<br>');
  }

  extractAttachmentsFromResponse(rowData: IGroupMailingRawDetails[]): void {
    this.loadingAttachments = true;
    if (rowData && rowData.length > 0) {
      const allAttachments: IGroupMailingAttachment[] = [];
      rowData.forEach((row) => {
        if (
          row.attachments &&
          Array.isArray(row.attachments) &&
          row.attachments.length > 0
        ) {
          allAttachments.push(...row.attachments);
        }
      });
      this.uniqueAttachments = allAttachments.filter(
        (attachment, index, self) =>
          index === self.findIndex((a) => a.id === attachment.id)
      );
    } else {
      this.uniqueAttachments = [];
    }
    this.loadingAttachments = false;
  }

  extractAttachmentsFromRowData(): void {
    if (
      this.v3DataTableService.rowData &&
      this.v3DataTableService.rowData.length > 0
    ) {
      this.extractAttachmentsFromResponse(
        this.v3DataTableService.rowData as IGroupMailingRawDetails[]
      );
    }
  }

  viewAttachment(attachment: IGroupMailingAttachment): void {
    this.loadingAttachments = true;
    this.subscriptions.push(
      this.checkService
        .viewAttachmentDocument(attachment.id)
        .pipe(
          finalize(() => {
            this.loadingAttachments = false;
          })
        )
        .subscribe({
          next: (response) => {
            if (response.success && response.data && response.data.URL) {
              window.open(response.data.URL, '_blank');
            } else {
              this.alertService.failedAlert({
                title: 'Could not get attachment',
                content: 'Please try again later'
              });
            }
          },
          error: () => {
            this.alertService.failedAlert({
              title: 'Could not get attachment',
              content: 'Please try again later'
            });
          }
        })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    this.v3DataTableService.rowData = [];
  }
}

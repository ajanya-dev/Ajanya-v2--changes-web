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
import { V3DataTableSelectBoxComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-data-table-select-box/v3-data-table-select-box.component';
import { DtSearchBoxComponent } from 'src/app/modules/data-table/components/dt-search-box/dt-search-box.component';
import { V3DataTableComponent } from 'src/app/modules/v3-data-table/components/v3-data-table/v3-data-table.component';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { V3DataTableModule } from 'src/app/modules/v3-data-table/v3-data-table.module';
import {
  FontAwesomeModule,
  FaIconComponent
} from '@fortawesome/angular-fontawesome';
import {
  faMessage,
  faEnvelope,
  faHeadset,
  faExternalLink,
  faExclamationTriangle,
  faHistory,
  faPaperclip
} from '@fortawesome/pro-solid-svg-icons';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { finalize } from 'rxjs/operators';
import { DataRangeV35Component } from 'src/app/shared/components/date-range-v35/data-range-v35.component';
import { OcwBackButtonComponent } from 'src/app/shared/components/ocw-back-button/ocw-back-button.component';
import {
  IGroupMailingDetailData,
  IGroupMailingActivityLog,
  IGroupMailingAttachment,
  IGroupMailingRawDetails,
  GroupMailingDetailsStatus
} from '../../models/group-mailing.model';
import { GroupMailingService } from '../../services/group-mailing.service';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';

@Component({
  selector: 'app-group-mailing-details',
  templateUrl: './group-mailing-details.component.html',
  styleUrls: ['./group-mailing-details.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    V3DataTableComponent,
    V3DataTableModule,
    FaIconComponent,
    FontAwesomeModule,
    OcwBackButtonComponent
  ],
  providers: []
})
export class GroupMailingDetailsComponent implements OnInit, OnDestroy {
  private v3DataTableService = inject(V3DataTableService);
  private dataTableService = inject(DataTableService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private groupMailingService = inject(GroupMailingService);
  private checkService = inject(CheckService);
  private alertService = inject(AlertService);
  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);
  // Add subscriptions array for proper cleanup
  private subscriptions: Subscription[] = [];
  public staticWhiteLabelConditions = StaticWhiteLabelConditions;

  tableId = DTTableId.businessToolsGroupMailingDetails;
  groupMailingId: string = '';
  groupMailingData: IGroupMailingDetailData | null = null;
  loading: boolean = false;
  deselectedColumns: string[] = [];
  groupMailingName: string = '';
  // Activity Log
  activityLogs: IGroupMailingActivityLog[] = [];
  loadingActivityLogs: boolean = false;

  // Attachments from AG Grid data
  attachmentsFromRows: IGroupMailingAttachment[] = [];
  uniqueAttachments: IGroupMailingAttachment[] = [];
  loadingAttachments: boolean = false;

  // Font Awesome Icons
  faMessage = faMessage;
  faEnvelope = faEnvelope;
  faHeadSet = faHeadset;
  faExternalLink = faExternalLink;
  faExclamationTriangle = faExclamationTriangle;
  faHistory = faHistory;
  faPaperclip = faPaperclip;

  frameWorkComponents = {
    SearchBoxComponent: DtSearchBoxComponent,
    V3DataTableSelectBoxComponent,
    selectDateComponent: DataRangeV35Component
  };

  // Disable row selection completely
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
      name: 'Approval-required'
    },
    {
      value: GroupMailingDetailsStatus.UNMAPPED_CHECKS,
      name: 'Unmapped-checks'
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
    // Get ID from route params
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
                // Set fallback data
                this.groupMailingData = {
                  group_id: this.groupMailingId,
                  count_group_items: 0,
                  count_attachment: 0,
                  sender_info: {
                    sender: 'Unknown',
                    receiver: 'Unknown'
                  },
                  shipment_name: 'Unknown',
                  tracking_link: '',
                  is_individual_envelope: 0
                };
              }
              this.loading = false;
            },
            error: () => {
              this.loading = false;
              // Set fallback data on error
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
    // Clear any existing data first

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

  colDefSerialNumber = {
    headerName: 'Serial Number',
    minWidth: 120,
    field: 'cheque_serial_number',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefPayeeName = {
    headerName: 'Payee',
    minWidth: 150,
    field: 'payee_name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefBankAccountName = {
    headerName: 'AC Name',
    minWidth: 150,
    field: 'bank_account_account_name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefStatus: ColDef = {
    headerName: 'Status',
    minWidth: 120,
    field: 'cheque_status',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: V3DataTableSelectBoxComponent,
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    valueGetter: (params: ValueGetterParams<{ cheque_status?: number }>) =>
      this.getStatusText(params.data?.cheque_status || 'Unknown')
  };

  colDefAmount = {
    headerName: 'Amount',
    minWidth: 100,
    field: 'cheque_amount',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    valueGetter: (params: ValueGetterParams<{ cheque_amount?: string }>) =>
      params.data?.cheque_amount ? `$${params.data.cheque_amount}` : ''
  };

  colDefMemo = {
    headerName: 'Memo',
    minWidth: 120,
    field: 'cheque_memo',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefCreatedDate = {
    headerName: 'Date',
    minWidth: 120,
    field: 'cheques.created_at',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectDateComponent',
    filter: 'agDateColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponentParams: {
      tableName: 'group_mailing_details',
      tableId: this.tableId
    },
    valueGetter: (params: ValueGetterParams<{ created_at?: string }>) =>
      params.data?.created_at || ''
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
      id: 'cheque_status',
      name: 'Status',
      isDisabled: true,
      colDef: this.colDefStatus,
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
    }
  ];

  columnDefs = [
    this.colDefSerialNumber,
    this.colDefPayeeName,
    this.colDefBankAccountName,
    this.colDefStatus,
    this.colDefAmount,
    this.colDefMemo,
    this.colDefCreatedDate
  ];

  /** Where the list was opened from; the group mailing table is also embedded in the check list. */
  backUrl: string =
    history.state.backUrl || '/manage/business-tools/mail-dashboard/group-mailing';

  goBack(): void {
    this.router.navigate([this.backUrl]);
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
        return 'Approval-required';
      case GroupMailingDetailsStatus.UNMAPPED_CHECKS:
        return 'Unmapped-checks';
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
    if (!address) {
      return 'N/A';
    }

    // If the address already contains <br> tags, return it as is
    if (address.includes('<br>')) {
      return address;
    }

    // If the address contains line breaks or multiple spaces, format it
    // Replace multiple spaces with single spaces and trim
    const cleanedAddress = address.replace(/\s+/g, ' ').trim();

    // If the address is just a single line, return it as is
    if (!cleanedAddress.includes('\n') && !cleanedAddress.includes(',')) {
      return cleanedAddress;
    }

    // Split by commas or line breaks and join with <br> tags
    const parts = cleanedAddress
      .split(/[,\n]/)
      .map((part) => part.trim())
      .filter((part) => part.length > 0);
    return parts.join('<br>');
  }

  /**
   * Extract unique attachments from API response data
   */
  extractAttachmentsFromResponse(rowData: IGroupMailingRawDetails[]): void {
    this.loadingAttachments = true;

    if (rowData && rowData.length > 0) {
      const allAttachments: IGroupMailingAttachment[] = [];

      // Collect all attachments from all rows
      rowData.forEach((row) => {
        if (
          row.attachments &&
          Array.isArray(row.attachments) &&
          row.attachments.length > 0
        ) {
          allAttachments.push(...row.attachments);
        }
      });

      // Remove duplicates based on attachment ID
      this.uniqueAttachments = allAttachments.filter(
        (attachment, index, self) =>
          index === self.findIndex((a) => a.id === attachment.id)
      );
    } else {
      this.uniqueAttachments = [];
    }

    this.loadingAttachments = false;
  }

  /**
   * Extract unique attachments from AG Grid row data
   * Fallback method if needed
   */
  extractAttachmentsFromRowData(): void {
    // This can be called as a fallback or from grid events
    if (
      this.v3DataTableService.rowData &&
      this.v3DataTableService.rowData.length > 0
    ) {
      this.extractAttachmentsFromResponse(
        this.v3DataTableService.rowData as IGroupMailingRawDetails[]
      );
    }
  }

  /**
   * View attachment file
   * Uses the check service viewAttachmentDocument method with the new API endpoint
   */
  viewAttachment(attachment: IGroupMailingAttachment): void {
    // Show loading state
    this.loadingAttachments = true;

    // Use the new check service method for viewing attachment documents
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
              // Open the URL returned by the API
              window.open(response.data.URL, '_blank');
            } else {
              // Show error alert if needed
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
    // Clean up all subscriptions
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    this.v3DataTableService.rowData = [];
  }
}

import { CommonFilterIconComponent } from 'src/app/shared/components/common-filter-icon/common-row-filter.component';
import { Subscription } from 'rxjs';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  Signal,
  computed,
  inject,
  signal
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  ICommentsAndAttachmentsCount,
  ICommonTransactionTableData
} from 'src/app/models/v3-common';
import { ICellRendererParams } from '@ag-grid-community/core';
import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { V3PaymentsTableService } from 'src/app/modules/v3-payments-table/shared/components/v3-payments-table/v3-payments-table.service';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { IAttachmentItem } from 'src/app/models/common';
import { ICheckAttachmentData } from 'src/app/modules/check/model/check';
import { IComments } from 'src/app/data/data/cloud-quick-pay';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { IDtAttachComntArray } from 'src/app/modules/data-table/model/datatable';
import { V4CheckAddCommentModalComponent } from 'src/app/modules/check/modal/check-activity-modals/v4-check-add-comment-modal/v4-check-add-comment-modal.component';
import { V4CheckAddAttachmentCommonModalComponent } from 'src/app/modules/check/modal/check-activity-modals/v4-check-add-attachment-common-modal/v4-check-add-attachment-common-modal.component';
import { V4AddCommentCommonModalComponent } from 'src/app/shared/modal/v4-add-comment-common-modal/v4-add-comment-common-modal.component';
import { AddAttachmentModalV4Component } from 'src/app/shared/modal/attachment-modal/add-attachment-modal-v4/add-attachment-modal-v4.component';
import { PaidStatementModalComponent } from '../../../v3/paid-statement-modal/paid-statement-modal.component';
import { V3DataTableService } from '../../../../modules/v3-data-table/services/v3-data-table.service';

export interface IV4StatusBadge {
  status: string;
  title?: string;
  bgColor: string;
  textColor: string;
}

export type TV4StatusMap = Record<string | number, IV4StatusBadge>;

export type TV4StatusMode = 'payments' | 'check-draft' | 'custom';

interface ICellRendererParamsExtended extends ICellRendererParams {
  tableType?: string;
  tableId?: number;
  isStatementDisable?: boolean;
  checkStatus?: { value: string; color: string };
  isApplyTitleCase?: string;
  hideFilterButton?: boolean;
  statusMode?: TV4StatusMode;
  isClickable?: boolean;
  statusField?: string;
  statusMap?: TV4StatusMap;
  attachmentType?: string;
  attachmentIdField?: string;
  getCommentsAndAttachmentsCount?: () => ICommentsAndAttachmentsCount[];
  onStatusIconClick?: (
    accountId: string,
    type: 'attachment' | 'comment'
  ) => void;
}

/** Default status map for payment transactions */
export const PAYMENTS_STATUS_MAP: TV4StatusMap = {
  0: {
    status: 'Pending',
    bgColor: 'var(--v4-badge-warning-bg-color)',
    textColor: 'var(--v4-common-yellow-color)'
  },
  pending: {
    status: 'Pending',
    bgColor: 'var(--v4-badge-warning-bg-color)',
    textColor: 'var(--v4-common-yellow-color)'
  },
  PENDING: {
    status: 'Pending',
    bgColor: 'var(--v4-badge-warning-bg-color)',
    textColor: 'var(--v4-common-yellow-color)'
  },
  APPROVAL_REQUIRED: {
    status: 'Approval required',
    bgColor: 'var(--v4-badge-warning-bg-color)',
    textColor: 'var(--v4-common-yellow-color)'
  },
  1: {
    status: 'Processing',
    bgColor: 'var(--v4-badge-info-bg-color)',
    textColor: 'var(--v4-common-blue-color)'
  },
  PROCESSING: {
    status: 'Processing',
    bgColor: 'var(--v4-badge-info-bg-color)',
    textColor: 'var(--v4-common-blue-color)'
  },
  2: {
    status: 'Success',
    bgColor: 'var(--v4-badge-success-bg-color)',
    textColor: 'var(--v4-common-green-color)'
  },
  settled: {
    status: 'Settled',
    bgColor: 'var(--v4-badge-success-bg-color)',
    textColor: 'var(--v4-common-green-color)'
  },
  active: {
    status: 'Active',
    bgColor: 'var(--v4-badge-success-bg-color)',
    textColor: 'var(--v4-common-green-color)'
  },
  COMPLETED: {
    status: 'Completed',
    bgColor: 'var(--v4-badge-success-bg-color)',
    textColor: 'var(--v4-common-green-color)'
  },
  completed: {
    status: 'Completed',
    bgColor: 'var(--v4-badge-success-bg-color)',
    textColor: 'var(--v4-common-green-color)'
  },
  Paid: {
    status: 'Paid',
    bgColor: 'var(--v4-badge-success-bg-color)',
    textColor: 'var(--v4-common-green-color)'
  },
  APPROVED: {
    status: 'Approved',
    bgColor: 'var(--v4-badge-success-bg-color)',
    textColor: 'var(--v4-common-green-color)'
  },
  3: {
    status: 'Failed',
    bgColor: 'var(--v4-badge-error-bg-color)',
    textColor: 'var(--v4-common-red-color)'
  },
  inactive: {
    status: 'Inactive',
    bgColor: 'var(--v4-badge-error-bg-color)',
    textColor: 'var(--v4-common-red-color)'
  },
  REJECTED: {
    status: 'Rejected',
    bgColor: 'var(--v4-badge-error-bg-color)',
    textColor: 'var(--v4-common-red-color)'
  },
  CANCELED: {
    status: 'Canceled',
    bgColor: 'var(--v4-badge-error-bg-color)',
    textColor: 'var(--v4-common-red-color)'
  },
  FAILED: {
    status: 'Failed',
    bgColor: 'var(--v4-badge-error-bg-color)',
    textColor: 'var(--v4-common-red-color)'
  },
  RETURNED: {
    status: 'Returned',
    bgColor: 'var(--v4-badge-error-bg-color)',
    textColor: 'var(--v4-common-red-color)'
  },
  declined: {
    status: 'Declined',
    bgColor: 'var(--v4-badge-error-bg-color)',
    textColor: 'var(--v4-common-red-color)'
  }
};

/** Default status map for check drafts */
const CHECK_DRAFT_STATUS_MAP: TV4StatusMap = {
  0: {
    status: 'New',
    bgColor: 'var(--v4-badge-accent-bg-color)',
    textColor: 'var(--v4-common-violet-color)'
  },
  1: {
    status: 'Printed',
    bgColor: 'var(--v4-badge-success-bg-color)',
    textColor: 'var(--v4-common-green-color)'
  },
  5: {
    status: 'PA',
    title: 'Pending Email Authorization',
    bgColor: 'var(--v4-badge-warning-bg-color)',
    textColor: 'var(--v4-common-yellow-color)'
  },
  6: {
    status: 'AV',
    title: 'Authorization Formed was viewed',
    bgColor: 'var(--v4-badge-info-bg-color)',
    textColor: 'var(--v4-common-blue-color)'
  },
  7: {
    status: 'Approved',
    title: 'Authorization Completed',
    bgColor: 'var(--v4-badge-success-bg-color)',
    textColor: 'var(--v4-common-green-color)'
  },
  8: {
    status: 'Rejected',
    title: 'Authorization Rejected',
    bgColor: 'var(--v4-badge-error-bg-color)',
    textColor: 'var(--v4-common-red-color)'
  },
  10: {
    status: 'DD Initiated',
    title: 'Direct Deposit Initiated',
    bgColor: 'var(--v4-badge-info-bg-color)',
    textColor: 'var(--v4-common-blue-color)'
  },
  11: {
    status: 'DD Completed',
    title: 'Direct Deposit Completed',
    bgColor: 'var(--v4-badge-success-bg-color)',
    textColor: 'var(--v4-common-green-color)'
  },
  12: {
    status: 'DD Rejected',
    title:
      'Direct Deposit Failed. Click eye button to see details. You may print and deposit.',
    bgColor: 'var(--v4-badge-error-bg-color)',
    textColor: 'var(--v4-common-red-color)'
  },
  13: {
    status: 'DD Returned',
    title: 'Direct Deposit Returned',
    bgColor: 'var(--v4-badge-error-bg-color)',
    textColor: 'var(--v4-common-red-color)'
  },
  15: {
    status: 'VOIDED',
    title: 'Voided when Payee bank account deleted',
    bgColor: 'var(--v4-badge-error-bg-color)',
    textColor: 'var(--v4-common-red-color)'
  },
  20: {
    status: 'Permission Needed',
    title: 'Recurred checkDraft permission needed',
    bgColor: 'var(--v4-badge-error-bg-color)',
    textColor: 'var(--v4-common-red-color)'
  }
};

@Component({
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    MatTooltipModule,
    CommonFilterIconComponent
  ],
  providers: [TitleCasePipe],
  selector: 'app-v4-status',
  templateUrl: './v4-status.component.html',
  styleUrls: ['./v4-status.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class V4StatusComponent
  implements ICellRendererAngularComp, OnInit, OnDestroy
{
  private dialog = inject(MatDialog);
  private titleCasePipe = inject(TitleCasePipe);
  private v3DataTableService = inject(V3DataTableService);
  private v3PaymentsTableService = inject(V3PaymentsTableService);
  private changeDetectorRef = inject(ChangeDetectorRef);
  private dataTableService = inject(DataTableService);

  commonTransactionTableRowData: ICommonTransactionTableData;
  areAttachmentsPresent = false;
  areCommentsPresent = false;
  subscriptions: Subscription[] = [];
  agGridCellRendererParams: ICellRendererParamsExtended;
  commentsAndAttachmentsCount: ICommentsAndAttachmentsCount[];
  existingDocumentsData: {
    attachments?: IAttachmentItem[] | ICheckAttachmentData[];
    comments?: IComments[];
  } = {};

  statusBadge: IV4StatusBadge = { status: '', bgColor: '', textColor: '' };
  isStatementDisable = false;
  hideFilterButton = false;
  showFilterIcon = false;
  statusMode: TV4StatusMode = 'payments';
  isClickable = false;

  /* Check-draft specific */
  attachCommentList = signal<IDtAttachComntArray[] | undefined>(undefined);
  statusIcon: Signal<IDtAttachComntArray | undefined> = signal(undefined);

  ngOnInit(): void {
    if (this.statusMode === 'check-draft') {
      this.getAttachmentStatus();
    }
  }

  refresh(): boolean {
    return false;
  }

  agInit(agGridCellRendererParams: ICellRendererParamsExtended) {
    this.agGridCellRendererParams = agGridCellRendererParams;
    this.statusMode = agGridCellRendererParams.statusMode ?? 'payments';
    this.isClickable = !!agGridCellRendererParams.isClickable;

    if (agGridCellRendererParams.data) {
      this.commonTransactionTableRowData = agGridCellRendererParams.data;
      const statusField = agGridCellRendererParams.statusField ?? 'status';
      const statusValue = agGridCellRendererParams.data[statusField];
      this.statusBadge = this.getStatusBadge(statusValue);

      if (this.statusMode === 'check-draft') {
        this.initCheckDraft(agGridCellRendererParams);
      } else {
        this.initPayments(agGridCellRendererParams);
      }
    }

    this.isStatementDisable =
      agGridCellRendererParams?.isStatementDisable as boolean;
    this.hideFilterButton =
      agGridCellRendererParams?.hideFilterButton as boolean;
  }

  private getStatusMap(): TV4StatusMap {
    if (this.agGridCellRendererParams?.statusMap) {
      return this.agGridCellRendererParams.statusMap;
    }
    return this.statusMode === 'check-draft'
      ? CHECK_DRAFT_STATUS_MAP
      : PAYMENTS_STATUS_MAP;
  }

  getStatusBadge(statusValue: string | number): IV4StatusBadge {
    const statusMap = this.getStatusMap();
    return (
      statusMap[statusValue] ?? {
        status: String(statusValue ?? ''),
        bgColor: 'var(--v4-badge-info-bg-color)',
        textColor: 'var(--v4-common-blue-color)'
      }
    );
  }

  /* ==================== Check Draft Mode ==================== */

  private initCheckDraft(params: ICellRendererParamsExtended) {
    this.getAttachmentStatus();
    this.statusIcon = computed(() => {
      const list = this.attachCommentList();
      const idField = params.attachmentIdField ?? 'action';
      return list?.filter((res) => res.id === params.data[idField])[0];
    });

    if (
      params.data?.received_type === 10 ||
      params.data?.received_type === 11 ||
      params.data?.received_type === 12
    ) {
      this.dataTableService.setDataFromParent(undefined, undefined, undefined, {
        actionButton: false,
        eyeButton: false
      });
    } else {
      this.dataTableService.setDataFromParent(undefined, undefined, undefined, {
        actionButton: true,
        eyeButton: true
      });
    }
  }

  getAttachmentStatus() {
    this.subscriptions.push(
      this.dataTableService.getAttachmentCommentStatus().subscribe((res) => {
        this.attachCommentList.set(res);
      })
    );
  }

  addAttachmentCheckDraft() {
    const idField = this.agGridCellRendererParams.attachmentIdField ?? 'action';
    const type =
      this.agGridCellRendererParams.attachmentType ?? 'cheque-drafts';
    const dialogRef = this.dialog.open(AddAttachmentModalV4Component, {
      maxWidth: '700px',
      width: '100%',
      panelClass: 'paddingless-modal-rounded',
      data: {
        id: this.agGridCellRendererParams.data[idField],
        type
      }
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res.refresh) {
        this.dataTableService.setRefreshStatus(true);
      }
    });
  }

  addCommentCheckDraft() {
    const idField = this.agGridCellRendererParams.attachmentIdField ?? 'action';
    const type =
      this.agGridCellRendererParams.attachmentType ?? 'cheque-drafts';
    const dialogRef = this.dialog.open(V4AddCommentCommonModalComponent, {
      maxWidth: '700px',
      width: '100%',
      panelClass: 'paddingless-modal-rounded',
      data: {
        id: this.agGridCellRendererParams.data[idField],
        type,
        enableDelete: true
      }
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res.refresh) {
        this.dataTableService.setRefreshStatus(true);
      }
    });
  }

  /* ==================== Payments Mode ==================== */

  private initPayments(params: ICellRendererParamsExtended) {
    if (params.tableType === 'payments-table') {
      this.getCheckCommentsAndAttachments(
        params.data.transfer_id,
        params.data.zilpayment_id
      );
      this.listenForGetCountCompletion();
    }

    if (params.tableType === 'international-payment-transactions') {
      this.areAttachmentsPresent = params.data.attachment === 1;
      this.areCommentsPresent = params.data.comment === 1;
    }

    if (params?.tableId === 27 || params?.tableId === 28) {
      this.getCommentsAndAttachmentsCount(params.tableId as number);
      this.listenForCommentsAndAttachmentsLoad();
    }
  }

  private getPaymentMode(): string | undefined {
    if (this.agGridCellRendererParams?.tableType === 'international-payment-transactions') {
      return 'international_payments';
    }
    return this.commonTransactionTableRowData?.transfer_type_code === 'check' ? undefined : 'zil_payments';
  }

  listenForGetCountCompletion() {
    this.subscriptions.push(
      this.v3PaymentsTableService.updateOnGetCountAPICompletion$.subscribe({
        next: (isCompleted) => {
          if (isCompleted) {
            this.getCheckCommentsAndAttachments(
              this.commonTransactionTableRowData.transfer_id,
              this.commonTransactionTableRowData.zilpayment_id
            );
          }
        }
      })
    );
  }

  getCheckCommentsAndAttachments(checkId: string, zilPayId = '') {
    this.v3PaymentsTableService.attachmentsAndCommentsList?.forEach((item) => {
      if (checkId === item.id || zilPayId === item.id) {
        this.areAttachmentsPresent = item.attachment === 1;
        this.areCommentsPresent = item.comment === 1;
      }
    });
    this.changeDetectorRef.markForCheck();
  }

  openAttachmentModal() {
    const isCloud = this.onCloudCommentOrAttachment('attachment');
    if (isCloud) return;
    const isCheck =
      this.commonTransactionTableRowData.transfer_type_code === 'check';
    const dialogRef = this.dialog.open(
      V4CheckAddAttachmentCommonModalComponent,
      {
        maxWidth: '700px',
        width: '93%',
        disableClose: true,
        panelClass: 'paddingless-modal-rounded',
        data: {
          id: isCheck
            ? this.commonTransactionTableRowData.transfer_id
            : this.commonTransactionTableRowData.zilpayment_id,
          mode: this.getPaymentMode(),
          existingData: this.existingDocumentsData.attachments
        }
      }
    );

    dialogRef.afterClosed().subscribe((res) => {
      if (res.isRefresh) {
        this.v3DataTableService.refreshV3DataTable();
      }
      this.areAttachmentsPresent = (res.existingData?.length ?? 0) > 0;
      this.existingDocumentsData.attachments = res.existingData;
    });
  }

  openCommentModal() {
    const isCloud = this.onCloudCommentOrAttachment('comment');
    if (isCloud) return;
    const isCheck =
      this.commonTransactionTableRowData.transfer_type_code === 'check';
    const dialogRef = this.dialog.open(V4CheckAddCommentModalComponent, {
      maxWidth: '700px',
      width: '93%',
      panelClass: 'paddingless-modal-rounded',
      disableClose: true,
      data: {
        id: isCheck
          ? this.commonTransactionTableRowData.transfer_id
          : this.commonTransactionTableRowData.zilpayment_id,
        type: isCheck ? 'checks' : 'zil-payments',
        mode: this.getPaymentMode(),
        existingData: this.existingDocumentsData.comments,
        enableDelete: true
      }
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res.isRefresh) {
        this.v3DataTableService.refreshV3DataTable();
      }
      this.areCommentsPresent = (res.existingData?.length ?? 0) > 0;
      this.existingDocumentsData.comments = res.existingData;
    });
  }

  openStatement() {
    if (this.isStatementDisable) return;
    const uuid = this.commonTransactionTableRowData?.uu_id;
    this.dialog.open(PaidStatementModalComponent, {
      maxWidth: '900px',
      width: '93%',
      data: { uuid }
    });
  }

  onCloudCommentOrAttachment(type: 'attachment' | 'comment') {
    if (this.agGridCellRendererParams.tableId === 27) {
      this.agGridCellRendererParams.onStatusIconClick?.(
        this.agGridCellRendererParams.data?.id,
        type
      );
      return true;
    }
    if (this.agGridCellRendererParams.tableId === 28) {
      this.agGridCellRendererParams.onStatusIconClick?.(
        this.agGridCellRendererParams.data?.action,
        type
      );
      return true;
    }
    return false;
  }

  listenForCommentsAndAttachmentsLoad() {
    this.subscriptions.push(
      this.v3DataTableService.commentsAndAttachmentsLoaded$.subscribe({
        next: () => {
          this.getCommentsAndAttachmentsCount(
            this.agGridCellRendererParams.tableId as number
          );
        }
      })
    );
  }

  getCommentsAndAttachmentsCount(tableId: number) {
    this.commentsAndAttachmentsCount =
      this.agGridCellRendererParams.getCommentsAndAttachmentsCount?.() ?? [];
    let rowItemId = '';
    if (tableId === 28) {
      rowItemId = this.agGridCellRendererParams.data.action;
    } else if (tableId === 27) {
      rowItemId = this.agGridCellRendererParams.data.id;
    } else {
      return;
    }
    this.commentsAndAttachmentsCount.forEach((item) => {
      if (rowItemId === item.id) {
        this.areAttachmentsPresent = item.attachment === 1;
        this.areCommentsPresent = item.comment === 1;
      }
    });
    this.changeDetectorRef.markForCheck();
  }

  onFilterClicked(): void {
    const cellValue = {
      filter: this.agGridCellRendererParams?.isApplyTitleCase
        ? this.titleCasePipe.transform(this.statusBadge.status ?? '')
        : this.statusBadge.status.toUpperCase(),
      field: this.agGridCellRendererParams.colDef?.headerName as string,
      payee: undefined
    };
    this.dataTableService.selectedCellValueSignal.set(cellValue);
    if (this.statusMode === 'check-draft') {
      this.v3DataTableService.gridApi?.deselectAll();
    }
  }

  showFilterIconForRow(show?: boolean) {
    if (this.hideFilterButton) return;
    this.showFilterIcon = !!show;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}

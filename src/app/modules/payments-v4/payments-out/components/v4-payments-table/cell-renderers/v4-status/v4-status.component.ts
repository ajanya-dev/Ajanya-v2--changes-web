import { CommonFilterIconComponent } from 'src/app/shared/components/common-filter-icon/common-row-filter.component';
import { Subscription } from 'rxjs';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  Signal,
  signal
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  ICommentsAndAttachmentsCount,
  ICommonTransactionTableData
} from 'src/app/models/v3-common';
import { ICellRendererParams } from '@ag-grid-community/core';
import { V3PaymentsTableService } from 'src/app/modules/v3-payments-table/shared/components/v3-payments-table/v3-payments-table.service';
import { V4CheckAddAttachmentCommonModalComponent } from 'src/app/modules/check/modal/check-activity-modals/v4-check-add-attachment-common-modal/v4-check-add-attachment-common-modal.component';
import { V4CheckAddCommentModalComponent } from 'src/app/modules/check/modal/check-activity-modals/v4-check-add-comment-modal/v4-check-add-comment-modal.component';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { IAttachmentItem } from 'src/app/models/common';
import { ICheckAttachmentData } from 'src/app/modules/check/model/check';
import { IComments } from 'src/app/data/data/cloud-quick-pay';
import { MatTooltipModule } from '@angular/material/tooltip';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { PaidStatementModalV4Component } from 'src/app/shared/v3/paid-statement-modal/v4/paid-statement-modal-v4.component';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { LucideAngularModule } from 'lucide-angular';
import { V4PayeeBankVerificationDetailsModalComponent } from 'src/app/shared/modal/v4-payee-bank-verification-details-modal/v4-payee-bank-verification-details-modal.component';
import { IPayeeBankVerificationModalData } from 'src/app/models/payee-bank-verification';
import { Utils } from 'src/app/data/utils';

interface ICellRendererParamsExtended extends ICellRendererParams {
  tableType?: string;
  tableId?: number;
  isStatementDisable?: boolean;
  checkStatus?: { value: string; color: string };
  isApplyTitleCase?: string;
  hideFilterButton?: boolean;
  isApprovalPolicyEnabledUser?: Signal<boolean>;
  getCommentsAndAttachmentsCount?: () => ICommentsAndAttachmentsCount[];
  onStatusIconClick?: (
    accountId: string,
    type: 'attachment' | 'comment'
  ) => void;
  onPayButtonClick?: (rowData: ICommonTransactionTableData) => void;
}

interface IStatusProps {
  status: string;
  badgeBg: string;
  badgeTextColor: string;
}

/** V2.1 badge palette (same tokens the Type column uses). */
const BADGE = {
  success: {
    badgeBg: 'var(--v4-badge-success-bg-color)',
    badgeTextColor: 'var(--v4-badge-success-text-color)'
  },
  warning: {
    badgeBg: 'var(--v4-badge-warning-bg-color)',
    badgeTextColor: 'var(--v4-badge-warning-text-color)'
  },
  info: {
    badgeBg: 'var(--v4-badge-info-bg-color)',
    badgeTextColor: 'var(--v4-badge-info-text-color)'
  },
  error: {
    badgeBg: 'var(--v4-badge-error-bg-color)',
    badgeTextColor: 'var(--v4-badge-error-text-color)'
  },
  neutral: {
    badgeBg: 'var(--v4-badge-neutral-bg-color)',
    badgeTextColor: 'var(--v4-badge-neutral-text-color)'
  }
} as const;

const DEFAULT_STATUS_PROPS: IStatusProps = { status: '', ...BADGE.info };

@Component({
  standalone: true,
  imports: [
    CommonModule,
    MatTooltipModule,
    CommonFilterIconComponent,
    LucideAngularModule
  ],
  providers: [TitleCasePipe],
  selector: 'app-v4-status',
  templateUrl: './v4-status.component.html',
  styleUrls: ['./v4-status.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class V4StatusComponent implements OnDestroy {
  private dialog = inject(MatDialog);
  private titleCasePipe = inject(TitleCasePipe);
  private v3DataTableService = inject(V3DataTableService);
  private v3PaymentsTableService = inject(V3PaymentsTableService);
  private changeDetectorRef = inject(ChangeDetectorRef);
  private dataTableService = inject(DataTableService);

  commonTransactionTableRowData: ICommonTransactionTableData;
  dynamicFontColor = '';
  areAttachmentsPresent = false;
  areCommentsPresent = false;
  subscriptions: Subscription[] = [];
  isPaymentTypeCheck = false;
  agGridCellRendererParams: ICellRendererParamsExtended;
  commentsAndAttachmentsCount: ICommentsAndAttachmentsCount[];
  existingDocumentsData: {
    attachments?: IAttachmentItem[] | ICheckAttachmentData[];
    comments?: IComments[];
  } = {};

  statusProps: IStatusProps = { ...DEFAULT_STATUS_PROPS };
  isPending = false;
  hasPayButtonCallback = false;
  isStatementDisable = false;
  hideFilterButton = false;
  isPayeeBankVerificationPending = false;
  isApprovalPolicyEnabledUser: Signal<boolean> = signal(false);

  agInit(agGridCellRendererParams: ICellRendererParamsExtended) {
    if (agGridCellRendererParams.data) {
      this.setPropsDynamically(agGridCellRendererParams.data.status);
      if (!agGridCellRendererParams.data.status) {
        this.isPending = true;
      }
      this.agGridCellRendererParams = agGridCellRendererParams;
      this.hasPayButtonCallback =
        typeof agGridCellRendererParams.onPayButtonClick === 'function';
      this.commonTransactionTableRowData = agGridCellRendererParams.data;
      this.isApprovalPolicyEnabledUser =
      agGridCellRendererParams.isApprovalPolicyEnabledUser ?? signal(false);
      const rowData = agGridCellRendererParams.data;
      const checkStatusValue = agGridCellRendererParams.checkStatus?.value;

      if (
        rowData.is_voided_scheduled_check === true &&
        rowData.cheque_status === 2
      ) {
        this.statusProps.status = 'Mail Scheduled-Void';
        this.isPending = false;
      } else if (rowData.cheque_status === 807) {
        this.statusProps.status = 'Mailed & Voided';
        this.isPending = false;
      } else if (this.isClearedStatus) {
        this.statusProps = {
          status: 'Cleared',
          badgeBg: 'var(--v4-insight-card-background-green)',
          badgeTextColor: 'var(--v4-insight-card-label-text-green)'
        };
        this.isPending = false;
      } else if (rowData.transfer_type_code === 'check' && checkStatusValue) {
        this.statusProps.status = checkStatusValue;
        if (checkStatusValue !== 'Pending') {
          this.isPending = false;
        }
      }

      if (agGridCellRendererParams.tableType === 'payments-table') {
        this.getCheckCommentsAndAttachments(
          agGridCellRendererParams.data.transfer_id,
          agGridCellRendererParams.data.zilpayment_id
        );
        this.listenForGetCountCompletion();
      }

      this.isPayeeBankVerificationPending =
        !!agGridCellRendererParams.data?.is_payee_bank_verification_held;
    }

    this.isStatementDisable =
      agGridCellRendererParams?.isStatementDisable as boolean;
    this.hideFilterButton =
      agGridCellRendererParams?.hideFilterButton as boolean;
    if (
      agGridCellRendererParams?.tableId === 27 ||
      agGridCellRendererParams?.tableId === 28
    ) {
      this.getCommentsAndAttachmentsCount(
        agGridCellRendererParams.tableId as number
      );
      this.listenForCommentsAndAttachmentsLoad();
    }
  }

  setPropsDynamically(
    statusValue:
      | 0
      | 1
      | 2
      | 3
      | 'settled'
      | 'active'
      | 'inactive'
      | 'pending'
      | 'PENDING'
      | 'PROCESSING'
      | 'COMPLETED'
      | 'APPROVAL_REQUIRED'
      | 'REJECTED'
      | 'CANCELED'
      | 'FAILED'
      | 'APPROVED'
      | 'RETURNED'
      | 'completed'
      | 'declined'
      | 'Paid'
  ): void {
    switch (statusValue) {
      case 0:
      case 'pending':
      case 'PENDING':
        this.statusProps = { status: 'Pending', ...BADGE.warning };
        this.isPending = true;
        break;
      case 1:
      case 'PROCESSING':
        this.statusProps = { status: 'Processing', ...BADGE.info };
        break;
      case 2:
        this.statusProps = { status: 'Success', ...BADGE.success };
        break;
      case 3:
      case 'FAILED':
        this.statusProps = { status: 'Failed', ...BADGE.error };
        break;
      case 'settled':
        this.statusProps = { status: 'Settled', ...BADGE.success };
        break;
      case 'active':
        this.statusProps = { status: 'Active', ...BADGE.success };
        break;
      case 'inactive':
        this.statusProps = { status: 'Inactive', ...BADGE.error };
        break;
      case 'COMPLETED':
      case 'completed':
        this.statusProps = { status: 'Completed', ...BADGE.success };
        break;
      case 'Paid':
        this.statusProps = { status: 'Paid', ...BADGE.success };
        break;
      case 'APPROVAL_REQUIRED':
        this.statusProps = { status: 'Approval required', ...BADGE.warning };
        break;
      case 'REJECTED':
        this.statusProps = { status: 'Rejected', ...BADGE.error };
        break;
      case 'CANCELED':
        this.statusProps = { status: 'Canceled', ...BADGE.error };
        break;
      case 'RETURNED':
        this.statusProps = { status: 'Returned', ...BADGE.error };
        break;
      case 'APPROVED':
        this.statusProps = { status: 'Approved', ...BADGE.success };
        break;
      case 'declined':
        this.statusProps = { status: 'Declined', ...BADGE.error };
        break;
      default: {
        this.statusProps = {
          ...DEFAULT_STATUS_PROPS,
          status: statusValue
            ? this.titleCasePipe.transform(
                String(statusValue).replace(/_/g, ' ')
              )
            : ''
        };
      }
    }
  }

  /**
   * One instance of this renderer exists per row, and both listeners below sit
   * on long-lived service subjects — without this they pile up on every table
   * refresh and every emission then runs the handlers of dead rows too.
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    this.subscriptions = [];
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
        if (item.attachment === 1) {
          this.areAttachmentsPresent = true;
        } else {
          this.areAttachmentsPresent = false;
        }
        if (item.comment === 1) {
          this.areCommentsPresent = true;
        } else {
          this.areCommentsPresent = false;
        }
      }
    });
    this.changeDetectorRef.markForCheck();
  }

  undersquareToWhitespace(value?: string) {
    return value ? value.replace(/_/, ' ') : undefined;
  }

  openAttachmentModal() {
    const isCloud = this.onCloudCommentOrAttachment('attachment');
    if (isCloud) return;
    const dialogRef = this.dialog.open(
      V4CheckAddAttachmentCommonModalComponent,
      {
        maxWidth: '700px',
        width: '93%',
        panelClass: 'paddingless-modal-rounded',
        disableClose: true,
        data: {
          id:
            this.commonTransactionTableRowData.transfer_type_code === 'check'
              ? this.commonTransactionTableRowData.transfer_id
              : this.commonTransactionTableRowData.zilpayment_id,
          mode:
            this.commonTransactionTableRowData.transfer_type_code === 'check'
              ? undefined
              : 'zil_payments',
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
    const dialogRef = this.dialog.open(V4CheckAddCommentModalComponent, {
      maxWidth: '700px',
      width: '93%',
      panelClass: 'paddingless-modal-rounded',
      disableClose: true,
      data: {
        id:
          this.commonTransactionTableRowData.transfer_type_code === 'check'
            ? this.commonTransactionTableRowData.transfer_id
            : this.commonTransactionTableRowData.zilpayment_id,
        mode:
          this.commonTransactionTableRowData.transfer_type_code === 'check'
            ? undefined
            : 'zil_payments',
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
    this.dialog.open(PaidStatementModalV4Component, {
      maxWidth: '900px',
      width: '93%',
      panelClass: 'paddingless-modal-rounded',
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
        if (item.attachment === 1) {
          this.areAttachmentsPresent = true;
        } else {
          this.areAttachmentsPresent = false;
        }
        if (item.comment === 1) {
          this.areCommentsPresent = true;
        } else {
          this.areCommentsPresent = false;
        }
      }
    });
    this.changeDetectorRef.markForCheck();
  }

  onFilterClicked(): void {
    const cellValue = {
      filter: this.agGridCellRendererParams?.isApplyTitleCase
        ? this.titleCasePipe.transform(this.statusProps.status ?? '')
        : this.statusProps.status.toUpperCase(),
      field: this.agGridCellRendererParams.colDef?.headerName as string,
      payee: undefined
    };
    this.dataTableService.selectedCellValueSignal.set(cellValue);
  }

  onPay() {
    this.agGridCellRendererParams.onPayButtonClick?.(
      this.commonTransactionTableRowData
    );
  }

  /**
   * @description Opens the payee bank verification details modal, passing the
   * payment context and the receiver bank account details from the grid row.
   */
  openPayeeBankVerificationDetailsModal() {
    const row = this.commonTransactionTableRowData;
    this.dialog.open(V4PayeeBankVerificationDetailsModalComponent, {
      panelClass: 'paddingless-modal-rounded',
      width: '480px',
      maxWidth: '95vw',
      data: {
        uuId: row.uu_id,
        paymentDetails: {
          payeeName: row.payee_name,
          amount: row.amount,
          source: row.source_name || row.source?.name,
          transferMode: row.transfer_mode,
          status: row.status,
          createdAt: Utils.splitDate(row.created_at) ?? '',
          receiverAccountNumber: row.transfer?.receiver_account_number,
          isResendButtonEnabled: row.is_micro_deposit_initiated
        }
      } as IPayeeBankVerificationModalData
    });
  }

  get showApprovedAsPay(): boolean {
    return (
      this.isApprovalPolicyEnabledUser() &&
      this.statusProps.status?.toLowerCase() === 'approved'
    );
  }

  /**
   * @description Whether the payment is approved and can be actioned from the
   * grid, i.e. it is funded from a wallet or the user has the approval policy
   * enabled. These show a Pay/Process button with an approved-indicator icon
   * instead of the plain "Approved" badge.
   */
  get isApprovedStatus(): boolean {
    return (
      this.statusProps.status?.toLowerCase() === 'approved' &&
      (this.commonTransactionTableRowData?.source?.source?.toLowerCase() ===
        'wallet' ||
        this.isApprovalPolicyEnabledUser())
    );
  }

  /**
   * @description A mailed check that has been cashed/cleared. Identified by the
   * combination of transfer mode, payment status and check status code 6 — the
   * API's short description for code 6 is not specific enough on its own.
   */
  get isClearedStatus(): boolean {
    const row = this.commonTransactionTableRowData;
    return (
      row?.transfer_mode === 'MAIL' &&
      (row?.status === 'COMPLETED' || row?.status === 'MAILED') &&
      row?.transfer?.status === 6
    );
  }
}

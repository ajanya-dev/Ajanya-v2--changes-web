import {
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  output,
  signal
} from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { catchError, filter, finalize, forkJoin, of, switchMap } from 'rxjs';
import { LucideAngularModule, MapPin, User } from 'lucide-angular';
import { MatDialog } from '@angular/material/dialog';

import { ICommonTransactionTableData } from 'src/app/models/v3-common';
import { IApiRes } from 'src/app/models/api';
import { IGetAttachment, IGetComment, IGetRemitance } from 'src/app/models/common';
import { IRemittanceDetails } from 'src/app/models/bank';
import { IPaymentDetails, IPodDetails } from 'src/app/modules/payments/model/payments';
import {
  ICheckDetailsData,
  ICheckPayee,
  ICheckPayeeSummary,
  IOtherDetails
} from 'src/app/modules/check/model/check';

import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';

import {
  DetailSidePanelComponent,
  IDetailPanelStatusBadge
} from 'src/app/shared/V4/detail-side-panel/detail-side-panel.component';
import { CheckPreviewV4Component } from 'src/app/shared/V4/for-side-drawer/check-preview-v4/check-preview-v4.component';
import {
  AuditLogListV4Component,
  type IAuditLogEntry
} from 'src/app/shared/V4/for-side-drawer/audit-log-list-v4/audit-log-list-v4.component';
import {
  CommentsActivityListV4Component,
  ICommentActivityEntry
} from 'src/app/shared/V4/for-side-drawer/comments-activity-list-v4/comments-activity-list-v4.component';
import {
  AttachmentsActivityListV4Component,
  type IAttachmentActivityEntry
} from 'src/app/shared/V4/for-side-drawer/attachments-activity-list-v4/attachments-activity-list-v4.component';
import {
  PodActivityListV4Component,
  type IPodActivityEntry
} from 'src/app/shared/V4/for-side-drawer/pod-activity-list-v4/pod-activity-list-v4.component';
import {
  RemittanceActivityListV4Component,
  type IRemittanceActivityEntry
} from 'src/app/shared/V4/for-side-drawer/remittance-activity-list-v4/remittance-activity-list-v4.component';
import { SignedReceiptActivityListV4Component } from 'src/app/shared/V4/for-side-drawer/signed-receipt-activity-list-v4/signed-receipt-activity-list-v4.component';
import {
  ITransactionListEntry,
  TransactionsListV4Component
} from 'src/app/shared/V4/for-side-drawer/transactions-list-v4/transactions-list-v4.component';
import { V4CheckAddCommentModalComponent } from 'src/app/modules/check/modal/check-activity-modals/v4-check-add-comment-modal/v4-check-add-comment-modal.component';
import { V4AddAttachmentModalComponent } from 'src/app/shared/modal/v4-add-attachment-modal/v4-add-attachment-modal.component';
import { V4GetSignedReceiptModalComponent } from 'src/app/shared/modal/v4-get-signed-receipt/v4-get-signed-receipt-modal.component';

export type ActionGridSection =
  | 'audit'
  | 'comments'
  | 'attachments'
  | 'remittance'
  | 'signed-receipt'
  | 'pod'
  | 'check-image';

@Component({
  selector: 'app-bank-transaction-detail-panel-v4',
  standalone: true,
  imports: [
    NgClass,
    DatePipe,
    LucideAngularModule,
    DetailSidePanelComponent,
    CheckPreviewV4Component,
    AuditLogListV4Component,
    CommentsActivityListV4Component,
    AttachmentsActivityListV4Component,
    PodActivityListV4Component,
    RemittanceActivityListV4Component,
    SignedReceiptActivityListV4Component,
    TransactionsListV4Component
  ],
  templateUrl: './bank-transaction-detail-panel-v4.component.html',
  styleUrls: ['./bank-transaction-detail-panel-v4.component.scss']
})
export class BankTransactionDetailPanelV4Component {
  row = input<ICommonTransactionTableData | null>(null);
  isOpen = input(false);

  closed = output<void>();

  private paymentsService = inject(PaymentsService);
  private checkService = inject(CheckService);
  private sharedService = inject(SharedService);
  private dialog = inject(MatDialog);
  private alertService = inject(V4AlertService);
  private destroyRef = inject(DestroyRef);

  readonly UserIcon = User;
  readonly MapPinIcon = MapPin;

  paymentDetails = signal<IPaymentDetails | null>(null);
  checkDetails = signal<ICheckDetailsData | null>(null);
  isLoading = signal(false);
  openActionSection = signal<ActionGridSection | null>(null);
  comments = signal<IGetComment[] | null>(null);
  attachments = signal<IGetAttachment[] | null>(null);
  deletingAttachmentId = signal<string | null>(null);
  podAttachments = signal<IPodDetails[] | null>(null);
  activityLogs = signal<unknown[] | null>(null);
  remittanceData = signal<IGetRemitance | null>(null);
  payeeSummary = signal<ICheckPayee | null>(null);

  readonly skeletonTransactionRows: string[][] = [
    ['w-16 h-3 flex-1', 'w-24 h-3 flex-[2]', 'w-14 h-3 flex-1', 'w-12 h-3 flex-1', 'w-14 h-3 flex-1'],
    ...Array(3).fill([
      'w-20 h-3 flex-1', 'w-32 h-3 flex-[2]', 'w-16 h-3 flex-1', 'w-14 h-5 flex-1', 'w-16 h-3 flex-1'
    ])
  ];

  panelTitle = computed(() => {
    const amt = this.row()?.amount;
    return amt ? `$${parseFloat(amt).toFixed(2)}` : '';
  });

  panelSubtitle = computed(() => {
    const name = this.row()?.payee_name;
    return name ? `to ${name}` : '';
  });

  panelStatusBadge = computed<IDetailPanelStatusBadge | undefined>(() => {
    const r = this.row();
    if (!r?.status) return undefined;
    const colorMap: Record<string, string> = {
      PENDING: 'var(--v4-badge-warning-text-color)',
      PROCESSING: 'var(--v4-primary-brand-color)',
      COMPLETED: 'var(--v4-common-green-color)',
      CANCELED: 'var(--v4-tertiary-text-color)',
      FAILED: 'var(--v4-common-red-color)'
    };
    return {
      text: r.status,
      color: colorMap[r.status] ?? 'var(--v4-tertiary-text-color)'
    };
  });

  isCheckPayment = computed(() => {
    const code = this.row()?.transfer_type_code;
    const type = this.row()?.transfer_type;
    return (
      code === '0' ||
      code === 'CHECK' ||
      type === 'Check' ||
      (typeof type === 'string' && type.toLowerCase() === 'check')
    );
  });

  private isCheckTypeRow(r: ICommonTransactionTableData): boolean {
    const code = r?.transfer_type_code;
    const type = r?.transfer_type;
    return (
      code === '0' ||
      code === 'CHECK' ||
      type === 'Check' ||
      (typeof type === 'string' && type.toLowerCase() === 'check')
    );
  }

  /** Encrypted payment id for zil-payments APIs (comments, pod, remittance). Uses zilpayment_id only – uu_id is NOT a valid zil-payment identifier. */
  private paymentIdForApi(row: ICommonTransactionTableData | null | undefined): string {
    if (!row) return '';
    return row.zilpayment_id ?? '';
  }

  /** Returns the correct API type and id for attachment operations based on the transaction type (matching v3 logic). */
  private attachmentConfig(row: ICommonTransactionTableData | null | undefined): { type: string; id: string; formFieldName: string } {
    if (!row) return { type: 'zil-payments', id: '', formFieldName: 'image' };
    if (this.isCheckTypeRow(row)) {
      const checkId = row.checkId ?? (row as { transfer?: { id?: string } }).transfer?.id ?? row.transfer_id ?? '';
      return { type: 'checks', id: checkId, formFieldName: 'attachment' };
    }
    return { type: 'zil-payments', id: row.zilpayment_id ?? '', formFieldName: 'image' };
  }

  checkTemplateJson = computed(() => this.checkDetails()?.template ?? null);

  checkStatusForPreview = computed(() => this.checkDetails()?.status ?? this.row()?.cheque_status ?? null);

  payeeAddress = computed(() => {
    const d = this.paymentDetails();
    if (!d?.payee) return '—';
    const p = d.payee as unknown as Record<string, unknown>;
    const parts = [
      p?.['addressLine1'] ?? p?.['payeeAddressLine1'],
      p?.['city'] ?? p?.['payeeCity'],
      p?.['state'] ?? p?.['payeeState'],
      p?.['zip'] ?? p?.['payeeZip']
    ].filter(Boolean);
    return parts.length ? parts.join(', ') : '—';
  });

  /** Maps check activities API response to IAuditLogEntry for audit-log-list-v4. */
  activityLogsForList = computed<IAuditLogEntry[]>(() => {
    const raw = this.activityLogs();
    if (!raw || !Array.isArray(raw) || raw.length === 0) return [];
    return raw.map((value: unknown) => {
      const item = value as Record<string, unknown>;
      return {
        userFormatedActivityDate:
          (item['userFormatedActivityDate'] as string) ??
          (item['user_formated_activity_date'] as string) ??
          (item['date'] as string) ??
          '',
        status:
          (item['status'] as string) ?? (item['status_text'] as string) ?? '',
        userName:
          (item['userName'] as string) ??
          (item['user_name'] as string) ??
          (item['activityBy'] as string) ??
          (item['activity_by'] as string) ??
          '',
        ipAddress:
          (item['ipAddress'] as string) ?? (item['ip_address'] as string) ?? '',
        note: (item['note'] as string) ?? (item['notes'] as string) ?? ''
      };
    });
  });

  commentsForList = computed<ICommentActivityEntry[]>(() => {
    const list = this.comments();
    if (!list?.length) return [];
    return list.map((item) => ({
      date: item.formated_date,
      status: item.status?.status_text ?? 'Comment Added',
      initiatedBy: item.user_name,
      device: 'N/A',
      note: item.comments
    }));
  });

  attachmentsForList = computed<IAttachmentActivityEntry[]>(() => {
    const list = this.attachments();
    if (!list?.length) return [];
    return list.map((item: IGetAttachment & { public_url?: string }) => ({
      date: item.formated_date,
      status: item.all_attachment_status?.status_text ?? item.status ?? 'Uploaded',
      initiatedBy: item.user_name,
      device: '—',
      note: item.file_name ?? item.fileName ?? '',
      publicUrl: item.public_url,
      encryptedId: item.encrypted_id
    }));
  });

  podForList = computed<IPodActivityEntry[]>(() => {
    const list = this.podAttachments();
    if (!list?.length) return [];
    return list.map((item: IPodDetails) => {
      const ext = item as unknown as Record<string, unknown>;
      return {
        date:
          item.formated_date ??
          (ext['formatted_date'] as string) ??
          (ext['created_at'] as string) ??
          '',
        user:
          item.user_name ??
          (ext['userName'] as string) ??
          '',
        file:
          item.file_name ??
          item.file_path ??
          (ext['file_name'] as string) ??
          (ext['file_path'] as string) ??
          '',
        publicUrl:
          item.public_url ?? (ext['public_url'] as string) ?? undefined
      };
    });
  });

  remittanceForList = computed<IRemittanceActivityEntry[]>(() => {
    const data = this.remittanceData();
    if (!data?.items_by_array?.length) return [];
    return data.items_by_array.map((item: IRemittanceDetails) => {
      const ext = item as unknown as Record<string, unknown>;
      return {
        invoiceNumber:
          item.invoiceNumber ?? (ext['invoice_number'] as string) ?? undefined,
        itemName: item.itemName ?? (ext['item_name'] as string) ?? undefined,
        itemDescription:
          item.itemDescription ?? (ext['item_description'] as string) ?? undefined,
        itemQuantity:
          item.itemQuantity ?? (ext['item_quantity'] as string) ?? undefined,
        itemUnitCost:
          item.itemUnitCost ?? (ext['item_unit_cost'] as string) ?? undefined,
        netAmount:
          item.netAmount ?? (ext['net_amount'] as string | number) ?? undefined,
        invoiceDate:
          item.invoiceDate ?? (ext['invoice_date'] as string) ?? undefined
      };
    });
  });

  remittanceTotal = computed(() => {
    const data = this.remittanceData();
    return data?.total ? `$${data.total}` : null;
  });

  transactionsForList = computed<ITransactionListEntry[]>(() => {
    const summary = this.payeeSummary();
    if (!summary?.data?.length) return [];
    return summary.data.slice(0, 10).map((t: ICheckPayeeSummary) => ({
      date: t.date,
      description: t.memo ?? '',
      amount: t.amount ? `$${t.amount}` : '$0.00',
      status: String(t.status ?? ''),
      method: t.account ?? ''
    }));
  });

  totalForList = computed(() => {
    const summary = this.payeeSummary();
    const other = summary?.other as IOtherDetails | undefined;
    if (other?.total_paid) return `$${other.total_paid}`;
    return '$0.00';
  });

  payerStats = computed(() => {
    const summary = this.payeeSummary();
    const other = summary?.other as IOtherDetails | undefined;
    return {
      thisMonth: parseFloat(other?.total_paid_in_month ?? '0') || 0,
      thisYear: parseFloat(other?.total_paid_in_year ?? '0') || 0,
      allTime: parseFloat(other?.total_paid ?? '0') || 0
    };
  });

  signatureUrl = computed(() => {
    const d = this.paymentDetails() as (IPaymentDetails & { signature_url?: string }) | null;
    return d?.signatureUrl ?? d?.signature_url ?? null;
  });

  constructor() {
    const loadTrigger = computed(() => ({
      row: this.row(),
      open: this.isOpen()
    }));

    toObservable(loadTrigger)
      .pipe(
        takeUntilDestroyed(),
        filter(({ row, open }) => !!row && open),
        switchMap(({ row }) => {
          this.resetState();
          this.isLoading.set(true);

          const r = row!;
          const uuId = r.uu_id;
          const paymentEncryptedId = this.paymentIdForApi(r);
          const payeeId = r.payee_id;
          const effectiveCheckId =
            r.checkId ??
            (r as { transfer?: { id?: string } }).transfer?.id ??
            r.transfer_id;

          const fallback = <T>() => of({ success: false, data: null } as IApiRes<T>);

          const paymentDetails$ = this.paymentsService
            .getPaymentDetails(uuId)
            .pipe(catchError(() => fallback<IPaymentDetails>()));

          const checkDetails$ =
            effectiveCheckId && this.isCheckTypeRow(r)
              ? this.checkService
                  .getChecksById(String(effectiveCheckId))
                  .pipe(catchError(() => fallback<ICheckDetailsData>()))
              : of(null);

          const activityLogs$ = effectiveCheckId
            ? this.checkService
                .getActivityLog(String(effectiveCheckId))
                .pipe(catchError(() => of({ success: false, data: [] })))
            : of({ success: false, data: [] });

          const comments$ = paymentEncryptedId
            ? this.sharedService
                .getZilPaymentsComments(paymentEncryptedId)
                .pipe(catchError(() => fallback<IGetComment[]>()))
            : of({ success: false, data: [] } as IApiRes<IGetComment[]>);

          const attConfig = this.attachmentConfig(r);
          const attachments$ = attConfig.id
            ? this.sharedService
                .getAttachment(attConfig.type, attConfig.id)
                .pipe(catchError(() => fallback<IGetAttachment[]>()))
            : of({ success: false, data: [] } as IApiRes<IGetAttachment[]>);

          const pod$ = paymentEncryptedId
            ? this.paymentsService
                .getPodFile('zil-payments', paymentEncryptedId)
                .pipe(catchError(() => fallback<IPodDetails[]>()))
            : of({ success: false, data: [] } as IApiRes<IPodDetails[]>);

          const remittance$ = paymentEncryptedId
            ? this.sharedService
                .getZilPaymentsRemitance(paymentEncryptedId)
                .pipe(catchError(() => fallback<IGetRemitance>()))
            : of({ success: false, data: null } as unknown as IApiRes<IGetRemitance>);

          const payeeSummary$ = payeeId
            ? this.checkService
                .getPayeeSummary(payeeId)
                .pipe(catchError(() => of(null as ICheckPayee | null)))
            : of(null as ICheckPayee | null);

          return forkJoin({
            paymentDetails: paymentDetails$,
            checkDetails: checkDetails$,
            activityLogs: activityLogs$,
            comments: comments$,
            attachments: attachments$,
            pod: pod$,
            remittance: remittance$,
            payeeSummary: payeeSummary$
          }).pipe(finalize(() => this.isLoading.set(false)));
        })
      )
      .subscribe({
        next: (res) => {
          this.paymentDetails.set(res.paymentDetails?.data ?? null);
          this.checkDetails.set(res.checkDetails?.data ?? null);
          this.activityLogs.set((res.activityLogs as { data?: unknown[] })?.data ?? null);
          this.comments.set((res.comments?.data as IGetComment[]) ?? null);
          this.attachments.set(res.attachments?.data ?? null);
          this.podAttachments.set(res.pod?.data ?? null);
          this.remittanceData.set(res.remittance?.data ?? null);
          this.payeeSummary.set(res.payeeSummary);
        },
        error: () => {
          this.isLoading.set(false);
        }
      });
  }

  private resetState(): void {
    this.openActionSection.set(null);
    this.paymentDetails.set(null);
    this.checkDetails.set(null);
    this.comments.set(null);
    this.attachments.set(null);
    this.podAttachments.set(null);
    this.activityLogs.set(null);
    this.remittanceData.set(null);
    this.payeeSummary.set(null);
  }

  selectSection(section: ActionGridSection): void {
    this.openActionSection.update((current) =>
      current === section ? null : section
    );
  }

  toggleAuditLogs(): void { this.selectSection('audit'); }
  toggleComments(): void { this.selectSection('comments'); }
  toggleAttachments(): void { this.selectSection('attachments'); }
  toggleRemittance(): void { this.selectSection('remittance'); }
  toggleSignedReceipt(): void { this.selectSection('signed-receipt'); }
  togglePod(): void { this.selectSection('pod'); }
  toggleCheckImage(): void { this.selectSection('check-image'); }

  closeSection(): void { this.openActionSection.set(null); }

  openAddCommentModal(): void {
    const ref = this.dialog.open(V4CheckAddCommentModalComponent, {
      width: '750px',
      maxHeight: '90vh',
      panelClass: 'paddingless-modal-rounded',
      data: {
        id: this.paymentIdForApi(this.row()),
        type: 'zil-payments',
        enableDelete: true
      }
    });
    ref.afterClosed().subscribe(() => {
      this.refetchComments();
    });
  }

  openAddAttachmentModal(): void {
    const config = this.attachmentConfig(this.row());
    if (!config.id) return;
    const ref = this.dialog.open(V4AddAttachmentModalComponent, {
      width: '750px',
      panelClass: 'paddingless-modal-rounded',
      data: { id: config.id, type: config.type, formFieldName: config.formFieldName }
    });
    ref.afterClosed().subscribe(() => {
      this.refetchAttachments();
    });
  }

  onOpenAttachment(entry: IAttachmentActivityEntry): void {
    if (!entry?.encryptedId) return;
    const config = this.attachmentConfig(this.row());
    if (!config.id) return;
    this.sharedService
      .openAttachment(config.type, config.id, entry.encryptedId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res?.success && res?.data) {
            const urlLoaded = window.open(res.data as string);
            if (
              !urlLoaded ||
              urlLoaded.closed ||
              typeof urlLoaded.closed === 'undefined'
            ) {
              this.alertService.failedAlert({
                content:
                  'A popup blocker may be preventing the application from opening the page. Try disabling it to open the window.',
                close: true,
                timeout: 3000
              });
            }
          }
        },
        error: () => {
          this.alertService.failedAlert({
            content: 'Failed to open attachment. Please try again.'
          });
        }
      });
  }

  onDeleteAttachment(entry: IAttachmentActivityEntry): void {
    if (!entry?.encryptedId) return;

    const confirmRef = this.alertService.confirmAlert({
      content: 'Are you sure you want to delete this attachment?',
      doneMsg: 'Yes, Delete it!',
      cancelMsg: 'No, Cancel!'
    });

    confirmRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (!confirmed) return;

        const config = this.attachmentConfig(this.row());
        this.deletingAttachmentId.set(entry.encryptedId ?? null);
        this.sharedService
          .deleteAttachment(config.type, config.id, entry.encryptedId)
          .pipe(
            finalize(() => this.deletingAttachmentId.set(null)),
            takeUntilDestroyed(this.destroyRef)
          )
          .subscribe({
            next: (res) => {
              if (res?.success) this.refetchAttachments();
            },
            error: () => {
              this.alertService.failedAlert({
                content: 'Failed to delete attachment. Please try again.'
              });
            }
          });
      });
  }

  openSignedReceiptModal(): void {
    const r = this.row();
    const d = this.paymentDetails();
    if (!r) return;

    this.dialog.open(V4GetSignedReceiptModalComponent, {
      width: '900px',
      maxHeight: '93%',
      panelClass: 'paddingless-modal-rounded',
      data: {
        transactionId: r.uu_id,
        zilId: r.checkId ?? r.transfer_id,
        payee: {
          email: (d?.payee as unknown as Record<string, unknown>)?.['payeeEmail'] ?? '',
          phone: ''
        },
        previewData: {
          senderName: d?.transfer?.bankAccount?.bankAccountName ?? '',
          payeeName: r.payee_name ?? '',
          amount: r.amount ?? '0',
          address: this.payeeAddress(),
          type: r.transfer_type_code === '0' ? 'CHECK' : r.transfer_type ?? '',
          paymentDate: r.created_at ?? ''
        },
        canSubmitSignedReceiptRequest: r.status === 'COMPLETED'
      }
    });
  }

  private refetchComments(): void {
    const paymentId = this.paymentIdForApi(this.row());
    if (!paymentId) return;
    this.sharedService
      .getZilPaymentsComments(paymentId)
      .subscribe((res) => {
        if (res?.success && res?.data) {
          this.comments.set((res.data as IGetComment[]) ?? null);
        }
      });
  }

  private refetchAttachments(): void {
    const config = this.attachmentConfig(this.row());
    if (!config.id) return;
    this.sharedService
      .getAttachment(config.type, config.id)
      .subscribe((res) => {
        if (res?.success && res?.data) {
          this.attachments.set(res.data ?? null);
        }
      });
  }
}

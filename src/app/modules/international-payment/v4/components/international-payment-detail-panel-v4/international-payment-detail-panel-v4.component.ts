import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  output,
  signal
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { CurrencyPipe, NgClass, NgTemplateOutlet } from '@angular/common';
import {
  Observable,
  Subject,
  catchError,
  filter,
  finalize,
  forkJoin,
  of,
  switchMap,
  takeUntil,
  tap
} from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { LucideAngularModule } from 'lucide-angular';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { PsbService } from 'src/app/shared/service/psb/psb.service';
import { WalletService } from 'src/app/shared/service/wallet/wallet.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import {
  IPaymentDetails,
  IPaymentsProofPayload
} from 'src/app/modules/payments/model/payments';
import { IPaidStatement } from 'src/app/models/payment-switch-board';
import { IApiRes } from 'src/app/models/api';
import { PdSkeletonComponent } from 'src/app/shared/V4/pd-skeleton/pd-skeleton.component';
import {
  PoCommentsListComponent,
  ICommentEntry
} from 'src/app/modules/payments-v4/payments-out/components/common/comments-list/comments-list.component';
import {
  PoAttachmentsListComponent,
  IAttachmentEntry
} from 'src/app/modules/payments-v4/payments-out/components/common/attachments-list/attachments-list.component';
import { PoSignedReceiptListComponent } from 'src/app/modules/payments-v4/payments-out/components/common/signed-receipt-list/signed-receipt-list.component';
import {
  PoPodListComponent,
  IPodEntry
} from 'src/app/modules/payments-v4/payments-out/components/common/pod-list/pod-list.component';
import { V4GetSignedReceiptModalComponent } from 'src/app/shared/modal/v4-get-signed-receipt/v4-get-signed-receipt-modal.component';
import { V4SendReceiptModalComponent } from 'src/app/shared/modal/v4-send-receipt-modal/v4-send-receipt-modal.component';

const RESOURCE = 'zil-payments';

type ActionSection = 'comments' | 'attachments' | 'signed-receipt' | 'pod';
type BeneficiaryTab = 'details' | 'bank';

export interface IPaymentActivityChange {
  key: 'comment' | 'attachment';
  present: boolean;
}

interface IRow {
  label: string;
  value: string;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  0: { label: 'Pending', color: 'var(--v4-common-yellow-color)' },
  1: { label: 'Processing', color: 'var(--v4-common-blue-color)' },
  2: { label: 'Paid', color: 'var(--v4-badge-success-text-color)' },
  3: { label: 'Failed', color: 'var(--v4-badge-error-text-color)' },
  pending: { label: 'Pending', color: 'var(--v4-common-yellow-color)' },
  processing: { label: 'Processing', color: 'var(--v4-common-blue-color)' },
  completed: { label: 'Paid', color: 'var(--v4-badge-success-text-color)' },
  paid: { label: 'Paid', color: 'var(--v4-badge-success-text-color)' },
  success: { label: 'Success', color: 'var(--v4-badge-success-text-color)' },
  failed: { label: 'Failed', color: 'var(--v4-badge-error-text-color)' },
  canceled: { label: 'Canceled', color: 'var(--v4-badge-error-text-color)' },
  rejected: { label: 'Rejected', color: 'var(--v4-badge-error-text-color)' },
  approved: { label: 'Approved', color: 'var(--v4-badge-success-text-color)' },
  returned: { label: 'Returned', color: 'var(--v4-badge-error-text-color)' },
  settled: { label: 'Settled', color: 'var(--v4-badge-success-text-color)' },
  payment_settled: {
    label: 'Payment settled',
    color: 'var(--v4-badge-success-text-color)'
  }
};

const str = (v: unknown): string => (v == null ? '' : String(v).trim());

const joinParts = (...parts: unknown[]): string =>
  parts.map(str).filter(Boolean).join(', ');

@Component({
  selector: 'app-international-payment-detail-panel-v4',
  standalone: true,
  imports: [
    NgClass,
    NgTemplateOutlet,
    CurrencyPipe,
    LucideAngularModule,
    PdSkeletonComponent,
    PoCommentsListComponent,
    PoAttachmentsListComponent,
    PoSignedReceiptListComponent,
    PoPodListComponent
  ],
  templateUrl: './international-payment-detail-panel-v4.component.html',
  styleUrls: ['./international-payment-detail-panel-v4.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InternationalPaymentDetailPanelV4Component {
  private paymentsService = inject(PaymentsService);
  private psbService = inject(PsbService);
  private walletService = inject(WalletService);
  private alertService = inject(V4AlertService);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);

  paymentUuId = input<string>('');
  /** Mirrors the host shell's ⤢ state. */
  expanded = input(false);
  activityChanged = output<IPaymentActivityChange>();

  loading = signal(true);
  paymentData = signal<IPaymentDetails | null>(null);
  statements = signal<IPaidStatement[]>([]);
  beneficiaryTab = signal<BeneficiaryTab>('details');
  openActionSection = signal<ActionSection | null>(null);
  comments = signal<ICommentEntry[] | null>(null);
  attachments = signal<IAttachmentEntry[] | null>(null);
  podList = signal<IPodEntry[] | null>(null);
  deletingAttachmentId = signal<string | null>(null);
  commentPosting = signal(false);
  commentError = signal<string | null>(null);
  attachmentUploading = signal(false);
  attachmentError = signal<string | null>(null);
  collapsedCards = signal<Record<string, boolean>>({});

  private loadedSections = new Set<string>();
  private loadingSections = signal<string[]>([]);
  private panelReset$ = new Subject<void>();

  readonly tiles: { key: ActionSection; icon: string; label: string }[] = [
    { key: 'comments', icon: 'message-square', label: 'Comments' },
    { key: 'attachments', icon: 'paperclip', label: 'Attachments' },
    { key: 'signed-receipt', icon: 'receipt', label: 'Signed Receipt' },
    { key: 'pod', icon: 'truck', label: 'Proof of Delivery' }
  ];

  private zilId = computed(() => this.paymentData()?.zilpaymentId ?? '');

  private transfer = computed(
    () => (this.paymentData()?.transfer ?? {}) as Record<string, unknown>
  );

  private payeeInfo = computed(
    () => (this.transfer().payee_info ?? {}) as Record<string, unknown>
  );

  private bankInfo = computed(
    () => (this.transfer().payee_bank_info ?? {}) as Record<string, unknown>
  );

  status = computed(() => {
    const raw = this.paymentData()?.status;
    const key = str(raw).toLowerCase();
    return (
      STATUS_MAP[key] ??
      STATUS_MAP[str(raw)] ?? {
        label: str(raw),
        color: 'var(--v4-badge-warning-text-color)'
      }
    );
  });

  sendingCurrency = computed(
    () => str(this.transfer().sending_currency_code) || 'USD'
  );

  receivingCurrency = computed(
    () => str(this.transfer().receiving_currency_code) || 'USD'
  );

  receivingAmount = computed(
    () => this.transfer().receiving_amount as string | number | undefined
  );

  extraRows = computed<IRow[]>(() => {
    const d = this.paymentData();
    const t = this.transfer();
    const source = (d?.source ?? {}) as Record<string, unknown>;
    return [
      { label: 'Source of Cash', value: str(t.source_of_cash_name) },
      { label: 'Purpose', value: str(t.purpose_name) },
      {
        label: 'Source',
        value: str(source.nick_name) || str(source.name)
      },
      {
        label: 'Category',
        value: str(
          (d?.category as { categoryName?: string } | undefined)?.categoryName
        )
      }
    ].filter((r) => r.value);
  });

  beneficiaryRows = computed<IRow[]>(() => {
    const info = this.payeeInfo();
    const payee = this.paymentData()?.payee;
    const address = joinParts(
      payee?.addressLine1 || info.address_line_1,
      payee?.addressLine2 || info.address_line_2,
      payee?.city || info.city,
      [str(payee?.state || info.state), str(payee?.zip || info.zip)]
        .filter(Boolean)
        .join(' '),
      payee?.country || info.country
    );
    return [
      { label: 'Name', value: str(info.payee_name) },
      { label: 'Email', value: str(info.payee_email) },
      { label: 'Phone No', value: str(info.payee_phone) },
      { label: 'Address', value: address }
    ].filter((r) => r.value);
  });

  bankRows = computed<IRow[]>(() => {
    const b = this.bankInfo();
    const address = joinParts(
      b.beneficiary_bank_address_line_1,
      b.beneficiary_bank_address_line_2,
      b.beneficiary_bank_city,
      [str(b.beneficiary_bank_state), str(b.beneficiary_bank_zip)]
        .filter(Boolean)
        .join(' '),
      b.beneficiary_bank_country
    );
    return [
      { label: 'Bank Name', value: str(b.bank_name) },
      { label: 'Account Number', value: str(b.account_number) },
      { label: 'SWIFT / BIC', value: str(b.swift_or_bic) },
      { label: 'IFSC', value: str(b.ifsc) },
      { label: 'Branch Code', value: str(b.branch_code) },
      { label: 'Relationship', value: str(b.relationship) },
      { label: 'Bank Address', value: address }
    ].filter((r) => r.value);
  });

  hasBeneficiary = computed(
    () => this.beneficiaryRows().length > 0 || this.bankRows().length > 0
  );

  visibleBeneficiaryRows = computed(() =>
    this.beneficiaryTab() === 'bank' ? this.bankRows() : this.beneficiaryRows()
  );

  constructor() {
    toObservable(this.paymentUuId)
      .pipe(
        takeUntilDestroyed(),
        filter((id) => !!id),
        switchMap((id) => {
          this.resetForNewRecord();
          const fallback = <T>() =>
            of({ success: false, data: null } as unknown as IApiRes<T>);
          return forkJoin({
            details: this.paymentsService
              .getPaymentDetails(id)
              .pipe(catchError(() => fallback<IPaymentDetails>())),
            statements: this.psbService
              .getPaidStatements(id)
              .pipe(catchError(() => fallback<IPaidStatement[]>()))
          }).pipe(finalize(() => this.loading.set(false)));
        })
      )
      .subscribe(({ details, statements }) => {
        this.paymentData.set(details?.success ? details.data : null);
        this.statements.set(
          statements?.success && Array.isArray(statements.data)
            ? statements.data
            : []
        );
        this.openActionSection.set('comments');
        this.loadSection('comments');
      });
  }

  private resetForNewRecord(): void {
    this.panelReset$.next();
    this.loadedSections.clear();
    this.loadingSections.set([]);
    this.collapsedCards.set({});
    this.beneficiaryTab.set('details');
    this.openActionSection.set(null);
    this.paymentData.set(null);
    this.statements.set([]);
    this.comments.set(null);
    this.attachments.set(null);
    this.podList.set(null);
    this.commentError.set(null);
    this.attachmentError.set(null);
    this.deletingAttachmentId.set(null);
    this.loading.set(true);
  }

  isCardCollapsed(key: string): boolean {
    return !!this.collapsedCards()[key];
  }

  toggleCard(key: string): void {
    this.collapsedCards.update((s) => ({ ...s, [key]: !s[key] }));
  }

  statusColor(status: unknown): string {
    const key = str(status)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_');
    return STATUS_MAP[key]?.color ?? 'var(--v4-badge-warning-text-color)';
  }

  isSectionLoading(key: string): boolean {
    return this.loadingSections().includes(key);
  }

  private loadSection(key: ActionSection): void {
    if (this.loadedSections.has(key)) return;
    const request$ = this.sectionRequest(key);
    if (!request$) return;
    this.loadedSections.add(key);
    this.loadingSections.update((keys) => [...keys, key]);
    request$
      .pipe(
        catchError(() => of(null)),
        finalize(() =>
          this.loadingSections.update((keys) => keys.filter((k) => k !== key))
        ),
        takeUntil(this.panelReset$),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  private sectionRequest(key: ActionSection): Observable<unknown> | null {
    if (!this.zilId()) return null;
    switch (key) {
      case 'comments':
        return this.comments$();
      case 'attachments':
        return this.attachments$();
      case 'pod':
        return this.paymentsService
          .getPodFile(RESOURCE, this.zilId())
          .pipe(
            tap((res) =>
              this.podList.set(
                res?.success ? ((res.data ?? []) as unknown as IPodEntry[]) : []
              )
            )
          );
      default:
        return null;
    }
  }

  private comments$(): Observable<unknown> {
    return this.walletService
      .getCommentsInternationalPayment(this.zilId())
      .pipe(
        tap((res) => {
          const list = res?.success
            ? ((res.data ?? []) as unknown as ICommentEntry[])
            : [];
          this.comments.set(list);
          this.activityChanged.emit({ key: 'comment', present: !!list.length });
        })
      );
  }

  private attachments$(): Observable<unknown> {
    return this.walletService
      .getAttachmentsInternationalPayment(this.zilId())
      .pipe(
        tap((res) => {
          const list = res?.success
            ? ((res.data ?? []) as unknown as IAttachmentEntry[])
            : [];
          this.attachments.set(list);
          this.activityChanged.emit({
            key: 'attachment',
            present: !!list.length
          });
        })
      );
  }

  selectSection(section: ActionSection): void {
    this.commentError.set(null);
    this.attachmentError.set(null);
    this.openActionSection.update((cur) => (cur === section ? null : section));
    if (this.openActionSection() === section) this.loadSection(section);
  }

  closeSection(): void {
    this.openActionSection.set(null);
  }

  onSubmitComment(text: string): void {
    const comment = text?.trim();
    if (!comment) return;
    if (!this.zilId()) return;
    this.commentError.set(null);
    this.commentPosting.set(true);
    this.walletService
      .addCommentInternationalPayment(this.zilId(), { comment })
      .pipe(
        finalize(() => this.commentPosting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) =>
          res?.success
            ? this.comments$()
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe()
            : this.commentError.set('Couldn’t post — please try again.'),
        error: () => this.commentError.set('Couldn’t post — please try again.')
      });
  }

  onDeleteComment(commentId: string): void {
    if (!this.zilId() || !commentId) return;
    this.alertService
      .confirmAlert({
        title: 'Confirm',
        content: 'Are you sure you want to delete this comment?',
        doneMsg: 'Yes, Delete it!',
        cancelMsg: 'No, Cancel!'
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.walletService
          .deleteCommentInternationalPayment(this.zilId(), commentId)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe((res) => {
            if (!res?.success) return;
            this.alertService.successAlert({
              content: 'Comment deleted successfully.',
              close: true,
              timeout: 1500
            });
            this.comments.update(
              (c) =>
                c?.filter(
                  (item) => (item.encrypted_id ?? String(item.id)) !== commentId
                ) ?? c
            );
            this.activityChanged.emit({
              key: 'comment',
              present: !!this.comments()?.length
            });
          });
      });
  }

  onAttachmentSelected(file: File): void {
    if (!file || !this.zilId()) return;
    this.attachmentError.set(null);
    this.attachmentUploading.set(true);
    this.walletService
      .addAttachmentInternationalPayment(this.zilId(), { image: file })
      .pipe(
        finalize(() => this.attachmentUploading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          if (!res?.success) {
            this.attachmentError.set('Couldn’t upload — please try again.');
            return;
          }
          this.alertService.successAlert({
            content: 'Attachment added.',
            close: true,
            timeout: 1500
          });
          this.attachments$()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe();
        },
        error: () =>
          this.attachmentError.set('Couldn’t upload — please try again.')
      });
  }

  onDeleteAttachment(entry: IAttachmentEntry): void {
    const encryptedId = entry?.encrypted_id;
    if (!encryptedId || !this.zilId()) return;
    this.alertService
      .confirmAlert({
        content: 'Are you sure you want to delete this attachment?',
        doneMsg: 'Yes, Delete it!',
        cancelMsg: 'No, Cancel!'
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.deletingAttachmentId.set(encryptedId);
        this.walletService
          .deleteAttachmentInternationalPayment(this.zilId(), encryptedId)
          .pipe(
            finalize(() => this.deletingAttachmentId.set(null)),
            takeUntilDestroyed(this.destroyRef)
          )
          .subscribe((res) => {
            if (res?.success)
              this.attachments$()
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe();
          });
      });
  }

  signedReceiptOpening = signal(false);

  viewSignedReceipt(): void {
    const uuid = this.paymentUuId();
    if (!uuid || this.signedReceiptOpening()) return;

    const payload: IPaymentsProofPayload = {
      type: ['download'],
      is_signature_request: false
    };
    this.signedReceiptOpening.set(true);
    this.paymentsService
      .sendPaymentReceipt(uuid, payload)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.signedReceiptOpening.set(false))
      )
      .subscribe((res) => {
        if (res?.data) {
          window.open(res.data, '_blank');
        }
      });
  }

  handleSignedReceipt(): void {
    const d = this.paymentData();
    const zilId = this.zilId();
    if (!d || !zilId) return;

    if (!d.signatureUrl) {
      this.dialog
        .open(V4GetSignedReceiptModalComponent, {
          maxWidth: '550px',
          width: '93%',
          disableClose: true,
          panelClass: 'paddingless-modal-rounded',
          data: {
            transactionId: zilId,
            zilId,
            payee: { email: d.payee?.email, phone: d.payee?.phone },
            canSubmitSignedReceiptRequest: false,
            previewData: {
              senderName:
                (d.source as Record<string, unknown>)?.walletName ?? '',
              payeeName: d.payee_name ?? d.payee?.name ?? '',
              amount: d.amount ?? '',
              address: d.payee?.addressLine1 ?? '',
              reference: d.referenceNo ?? '',
              type: 'INTERNATIONAL PAYMENT'
            }
          }
        })
        .afterClosed()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((res) => {
          if (res?.success)
            this.paymentData.update((prev) =>
              prev ? { ...prev, payment_receipt_id: '10' } : prev
            );
        });
    } else {
      this.dialog.open(V4SendReceiptModalComponent, {
        maxWidth: '550px',
        width: '93%',
        disableClose: true,
        panelClass: 'paddingless-modal-rounded',
        data: {
          uuid: zilId,
          payeeEmail: d.payee?.email,
          payeePhone: d.payee?.phone
        }
      });
    }
  }
}

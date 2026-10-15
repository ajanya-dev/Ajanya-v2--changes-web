import {
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  output,
  signal
} from '@angular/core';
import { CurrencyPipe, NgClass, NgTemplateOutlet } from '@angular/common';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import {
  catchError,
  EMPTY,
  finalize,
  Observable,
  of,
  Subject,
  switchMap,
  takeUntil,
  tap
} from 'rxjs';
import { LucideAngularModule, Mail, MapPin, Phone, UserRound } from 'lucide-angular';
import {
  DetailSidePanelComponent,
  IDetailPanelActionButton,
  IDetailPanelStatusBadge
} from 'src/app/shared/V4/detail-side-panel/detail-side-panel.component';
import {
  IAuditTrailList,
  IAttachmentsList,
  ICommentList,
  IInvoiceData,
  IInvoicePayments,
  IInvoiceRowData,
  IOpenAttachmentsRes,
  Last10Invoice
} from 'src/app/modules/invoices/model/invoice';
import { InvoiceService } from 'src/app/shared/service/invoice/invoice.service';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { PdSkeletonComponent } from 'src/app/shared/V4/pd-skeleton/pd-skeleton.component';
import { PdEmptyStateComponent } from 'src/app/shared/V4/pd-empty-state/pd-empty-state.component';
import { PdDateTimeComponent } from 'src/app/shared/V4/pd-date-time/pd-date-time.component';
import {
  IActivityEntry,
  PoAuditLogListComponent
} from 'src/app/modules/payments-v4/payments-out/components/common/audit-log-list/audit-log-list.component';
import {
  ICommentEntry,
  PoCommentsListComponent
} from 'src/app/modules/payments-v4/payments-out/components/common/comments-list/comments-list.component';
import {
  IAttachmentEntry,
  PoAttachmentsListComponent
} from 'src/app/modules/payments-v4/payments-out/components/common/attachments-list/attachments-list.component';
import { getMailTrackUrl } from 'src/app/shared/utils/v4-external.util';

/** Kept for backward compatibility — host list and cell renderers still import this type. */
export type InvoiceDetailTab =
  | 'summary'
  | 'payment-summary'
  | 'audit-trail'
  | 'attachments'
  | 'comments';

export type InvoiceActionSection =
  | 'payment-summary'
  | 'audit'
  | 'attachments'
  | 'comments';

@Component({
  selector: 'app-v4-invoice-detail-panel',
  templateUrl: './v4-invoice-detail-panel.component.html',
  styleUrls: ['./v4-invoice-detail-panel.component.scss'],
  standalone: true,
  imports: [
    DetailSidePanelComponent,
    CurrencyPipe,
    NgClass,
    NgTemplateOutlet,
    LucideAngularModule,
    PdSkeletonComponent,
    PdEmptyStateComponent,
    PdDateTimeComponent,
    PoAuditLogListComponent,
    PoCommentsListComponent,
    PoAttachmentsListComponent
  ]
})
export class V4InvoiceDetailPanelComponent {
  readonly getMailTrackUrl = getMailTrackUrl;
  readonly userRound = UserRound;
  readonly MailIcon = Mail;
  readonly PhoneIcon = Phone;
  readonly MapPinIcon = MapPin;

  // ── Inputs / Outputs ──────────────────────────────────────────────────────
  row = input<IInvoiceRowData | null>(null);
  isOpen = input(false);
  /** Kept for backward compat — maps to the initial open section in the action grid. */
  initialTab = input<InvoiceDetailTab>('summary');
  backdropZIndex = input(200);

  closed = output<void>();
  actionButtonClicked = output<string>();

  // ── State ─────────────────────────────────────────────────────────────────
  isPanelExpanded = signal(false);
  collapsedCards = signal<Record<string, boolean>>({});
  openActionSection = signal<InvoiceActionSection | null>(null);

  details = signal<IInvoiceData | null>(null);
  isLoading = signal(false);

  /** null = not yet loaded (skeleton); [] = loaded and empty. */
  auditLogs = signal<IAuditTrailList[] | null>(null);
  attachments = signal<IAttachmentsList[] | null>(null);
  comments = signal<ICommentList[] | null>(null);

  private loadedSections = new Set<InvoiceActionSection>();
  private loadingSections = signal<InvoiceActionSection[]>([]);
  private panelReset$ = new Subject<void>();

  commentPosting = signal(false);
  commentError = signal<string | null>(null);
  attachmentUploading = signal(false);
  attachmentError = signal<string | null>(null);
  deletingAttachmentId = signal<string | null>(null);

  // ── Services ──────────────────────────────────────────────────────────────
  private invoiceService = inject(InvoiceService);
  private sharedService = inject(SharedService);
  private alertService = inject(V4AlertService);
  private destroyRef = inject(DestroyRef);

  private readonly currencyPipe = new CurrencyPipe('en-US');

  // ── Header computed ───────────────────────────────────────────────────────
  panelTitle = computed(() => {
    const total = this.row()?.grand_total;
    return total ? (this.currencyPipe.transform(parseFloat(total)) ?? '') : '';
  });

  panelTitleSuffix = computed(() => {
    const name = this.row()?.payee_name;
    return name ? `to ${name}` : '';
  });

  panelFromName = computed(
    () => this.row()?.bank_account_nick_name || this.row()?.bank_account_account_name || ''
  );

  panelDateLine = computed(() => {
    const r = this.row();
    if (!r) return '';
    const parts: string[] = [];
    if (r.invoice_date) parts.push(r.invoice_date);
    const dueDate = this.details()?.dueDate;
    if (dueDate) parts.push(`Due ${dueDate}`);
    return parts.join(' · ');
  });

  // ── Shared component adapters ─────────────────────────────────────────────
  auditLogsForList = computed<IActivityEntry[] | null>(() => {
    const list = this.auditLogs();
    if (list == null) return null;
    return list.map((item) => ({
      formattedCreatedAt: item.formattedCreatedAt,
      status: item.status,
      userName: item.userName,
      ipAddress: item.ipAddress,
      note: item.note
    }));
  });

  attachmentsForList = computed<IAttachmentEntry[] | null>(() => {
    const list = this.attachments();
    if (list == null) return null;
    return list.map((item) => ({
      file_name: item.file_name,
      user_name: item.user_name,
      formated_date: item.formated_date,
      encrypted_id: item.encrypted_id,
      all_attachment_status: item.status
    }));
  });

  commentsForList = computed<ICommentEntry[] | null>(() => {
    const list = this.comments();
    if (list == null) return null;
    return list.map((item) => ({
      id: item.id,
      encrypted_id: item.encrypted_id,
      formated_date: item.formated_date,
      comments: item.comments,
      user_name: item.user_name,
      status: item.status
    }));
  });

  // ── Convenience getters ───────────────────────────────────────────────────
  get paymentSummary(): IInvoicePayments[] {
    return this.details()?.statements?.invoicePayments ?? [];
  }

  get last10Invoices(): Last10Invoice[] {
    return this.details()?.statements?.last10Invoice ?? [];
  }

  readonly isMailed = computed(() => this.row()?.is_mailed === 1);
  readonly mailTrack = computed(() => this.invoiceService.mailTrackSignal());
  readonly mailTrackLoading = computed(
    () => this.invoiceService.mailTrackLoadingSignal()
  );

  clientInitials = computed(() => {
    const name = (this.details()?.payee?.payeeName ?? '').trim();
    if (!name) return '?';
    return (
      name
        .split(/\s+/)
        .map((w) => w[0] ?? '')
        .slice(0, 2)
        .join('')
        .toUpperCase() || '?'
    );
  });

  /** City/state/zip, comma-joined — built here rather than inline in the template. */
  clientAddressLine = computed(() => {
    const p = this.details()?.payee;
    if (!p) return '';
    return [p.payeeCity, p.payeeState, p.payeeZip].filter(Boolean).join(', ');
  });

  /** Street + city/state/zip, comma-joined into a single line for the Client information card. */
  clientFullAddressLine = computed(() => {
    const p = this.details()?.payee;
    if (!p) return '';
    return [p.payeeAddress1, p.payeeAddress2?.trim(), this.clientAddressLine()]
      .filter(Boolean)
      .join(', ');
  });

  /** City/state/country/zip for the Mail details payee address. */
  mailAddressLine = computed(() => {
    const p = this.details()?.payee;
    if (!p) return '';
    return [p.payeeCity, p.payeeState, p.payeeCountry, p.payeeZip]
      .filter(Boolean)
      .join(', ');
  });

  // ── Action buttons ────────────────────────────────────────────────────────
  readonly actionButtons = computed<IDetailPanelActionButton[]>(() => {
    const row = this.row();
    const status = row?.status;
    const isMailed = row?.is_mailed ?? 0;
    const isEmailed = row?.is_emailed ?? 0;
    const paid = row?.paid ?? 0;
    const isApprovedXero =
      (row as IInvoiceRowData & { isApprovedXero?: number })?.isApprovedXero ??
      1;
    const isVoided = status === 3;
    const importStatuses = [7, 10, 11, 12, 13, 14];

    const hide = new Set<string>();

    if (status === 3) {
      hide.add('Void');
      hide.add('Edit');
    } else if (status === 2) {
      hide.add('Void');
      hide.add('Edit');
    } else if (status === 11 && isApprovedXero === 0) {
      hide.add('Void');
      hide.add('Edit');
      hide.add('Clone Invoice');
    } else if (
      ((importStatuses.slice(0, 3).includes(status ?? -1) || paid > 0) &&
        isMailed === 0) ||
      status === 14
    ) {
      hide.add('Void');
      hide.add('Edit');
      hide.add('Clone Invoice');
    } else if (status === 13 && isMailed === 0) {
      hide.add('Edit');
      hide.add('Clone Invoice');
    } else if (status === 12 && isMailed === 0) {
      hide.add('Void');
      hide.add('Edit');
      hide.add('Clone Invoice');
    } else if (importStatuses.includes(status ?? -1) && isMailed === 1) {
      hide.add('Void');
      hide.add('Edit');
    } else if (status === 1 && isMailed === 1) {
      hide.add('Void');
      hide.add('Edit');
    } else if (status === 1 && isEmailed === 1) {
      hide.add('Void');
      hide.add('Edit');
    }

    if ((status === 1 && paid > 0) || importStatuses.includes(status ?? -1)) {
      hide.delete('Clone Invoice');
    }

    const voidKey = isVoided ? 'Unvoid' : 'Void';
    const showEdit  = !hide.has('Edit');
    const showVoid  = !hide.has(voidKey);
    const showClone = !hide.has('Clone Invoice');
    const showMarkPaid =
      status === 1 && !(paid > 0) && isMailed !== 1 && isEmailed !== 1;

    const printButton: IDetailPanelActionButton = {
      label: 'Print',
      variant: 'outline',
      key: 'Print',
      lucideIcon: 'printer'
    };
    const moreButton = (
      menu: NonNullable<IDetailPanelActionButton['menu']>
    ): IDetailPanelActionButton => ({
      label: '',
      variant: 'outline',
      key: '__more',
      menu,
      menuHeading: 'ACTIONS'
    });

    if (isVoided) {
      const overflowMenu = [
        showEdit ? { label: 'Edit', key: 'Edit', lucideIcon: 'square-pen' } : null,
        showClone
          ? { label: 'Clone', key: 'Clone Invoice', lucideIcon: 'copy' }
          : null,
        { label: 'Delete', key: 'Delete', lucideIcon: 'trash-2', danger: true }
      ].filter(Boolean) as NonNullable<IDetailPanelActionButton['menu']>;

      const all: IDetailPanelActionButton[] = [
        {
          label: 'Unvoid',
          variant: 'danger',
          key: voidKey,
          lucideIcon: 'undo-2',
          disabled: !showVoid
        },
        printButton,
        moreButton(overflowMenu)
      ];
      return all;
    }

    const overflowMenu = [
      showEdit  ? { label: 'Edit',   key: 'Edit',   lucideIcon: 'square-pen' } : null,
      showMarkPaid
        ? {
            label: 'Mark Paid / Partially',
            key: 'Mark Paid / Partially',
            lucideIcon: 'circle-dollar-sign'
          }
        : null,
      showVoid  ? { label: voidKey,  key: voidKey,  lucideIcon: 'ban',    danger: true } : null,
      { label: 'Delete', key: 'Delete', lucideIcon: 'trash-2', danger: true }
    ].filter(Boolean) as NonNullable<IDetailPanelActionButton['menu']>;

    const all: IDetailPanelActionButton[] = [
      {
        label: 'Clone',
        variant: 'outline',
        key: 'Clone Invoice',
        lucideIcon: 'copy',
        disabled: !showClone
      },
      printButton,
      moreButton(overflowMenu)
    ];

    return all;
  });

  readonly statusBadge = computed<IDetailPanelStatusBadge | undefined>(() => {
    const r = this.row();
    if (!r) return undefined;
    const { status, paid, balance, is_emailed: isEmailed, is_mailed: isMailed } = r;
    if (status === 2)
      return { text: 'Paid', color: 'var(--v4-badge-success-text-color)', bgColor: 'var(--v4-badge-success-bg-color)' };
    if (status === 3)
      return { text: 'Voided', color: 'var(--v4-badge-error-text-color)', bgColor: 'var(--v4-badge-error-bg-color)' };
    if (status === 6)
      return { text: 'Rejected', color: 'var(--v4-badge-error-text-color)', bgColor: 'var(--v4-badge-error-bg-color)' };
    if (status === 1 && paid > 0)
      return { text: 'Partially paid', color: 'var(--v4-badge-warning-text-color)', bgColor: 'var(--v4-badge-warning-bg-color)' };
    if (status === 1 && isEmailed === 1)
      return { text: 'Emailed', color: 'var(--v4-badge-sky-text-color)', bgColor: 'var(--v4-badge-sky-bg-color)' };
    if (status === 1 && isMailed === 1)
      return { text: 'Mailed', color: 'var(--v4-badge-sky-text-color)', bgColor: 'var(--v4-badge-sky-bg-color)' };
    if (status === 1 && Number(balance) > 0)
      return { text: 'New', color: 'var(--v4-badge-info-text-color)', bgColor: 'var(--v4-badge-info-bg-color)' };
    if (status === 1)
      return { text: 'Pay', color: 'var(--v4-badge-success-text-color)', bgColor: 'var(--v4-badge-success-bg-color)' };
    return undefined;
  });

  // ── Constructor ───────────────────────────────────────────────────────────
  constructor() {
    const loadTrigger = computed(() => ({
      action: this.row()?.action ?? null,
      open: this.isOpen()
    }));
    toObservable(loadTrigger)
      .pipe(
        takeUntilDestroyed(),
        switchMap(({ action, open }) => {
          if (!action || !open) {
            this.details.set(null);
            return EMPTY;
          }
          if (this.row()?.is_mailed === 1) {
            this.invoiceService.invoiceMailTrack(action, 'view');
          }
          this.resetForNewRecord();
          return this.invoiceService.invoiceView(action).pipe(
            catchError(() => of(null as { data: IInvoiceData | null } | null)),
            finalize(() => this.isLoading.set(false))
          );
        })
      )
      .subscribe({
        next: (res) => {
          if (res) this.details.set(res.data);
        }
      });
  }

  // ── Card collapse ─────────────────────────────────────────────────────────
  isCardCollapsed(key: string): boolean {
    return !!this.collapsedCards()[key];
  }

  toggleCard(key: string): void {
    this.collapsedCards.update((s) => ({ ...s, [key]: !s[key] }));
  }

  // ── Section management ────────────────────────────────────────────────────
  selectSection(section: InvoiceActionSection): void {
    this.commentError.set(null);
    this.attachmentError.set(null);
    this.openActionSection.update((current) =>
      current === section ? null : section
    );
    if (this.openActionSection() === section) {
      this.loadSection(section);
      setTimeout(() => {
        document.querySelector('.o4-actions-card')
          ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 0);
    }
  }

  closeSection(): void {
    this.openActionSection.set(null);
  }

  isSectionLoading(key: InvoiceActionSection): boolean {
    return this.loadingSections().includes(key);
  }

  private resetForNewRecord(): void {
    this.panelReset$.next();
    this.loadedSections.clear();
    this.loadingSections.set([]);
    this.collapsedCards.set({});
    this.openActionSection.set('payment-summary');
    this.details.set(null);
    this.auditLogs.set(null);
    this.attachments.set(null);
    this.comments.set(null);
    this.commentError.set(null);
    this.attachmentError.set(null);
    this.deletingAttachmentId.set(null);
    this.isLoading.set(true);
  }

  private loadSection(key: InvoiceActionSection): void {
    if (this.loadedSections.has(key)) return;
    const id = this.row()?.action;
    if (!id) return;
    const request$ = this.sectionRequest(key, id);
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

  private sectionRequest(
    key: InvoiceActionSection,
    id: string
  ): Observable<unknown> | null {
    switch (key) {
      case 'audit':
        return this.invoiceService
          .auditTrailInvoice(id)
          .pipe(tap((res) => this.auditLogs.set(res.data ?? [])));
      case 'attachments':
        return this.invoiceService
          .getAttachments(id)
          .pipe(tap((res) => this.attachments.set(res.data ?? [])));
      case 'comments':
        return this.invoiceService
          .getComments(id)
          .pipe(tap((res) => this.comments.set(res.data ?? [])));
      case 'payment-summary':
        return null; // data comes from details()
      default:
        return null;
    }
  }

  // ── Panel close ───────────────────────────────────────────────────────────
  onClosed(): void {
    this.panelReset$.next();
    this.loadedSections.clear();
    this.loadingSections.set([]);
    this.collapsedCards.set({});
    this.openActionSection.set(null);
    this.details.set(null);
    this.auditLogs.set(null);
    this.attachments.set(null);
    this.comments.set(null);
    this.closed.emit();
  }

  onActionClicked(key: string): void {
    if (['Edit', 'Clone Invoice', 'Delete', 'Void', 'Unvoid'].includes(key)) {
      this.onClosed();
    }
    this.actionButtonClicked.emit(key);
  }

  // ── Comments ──────────────────────────────────────────────────────────────
  onSubmitComment(text: string): void {
    const comment = text?.trim();
    const id = this.row()?.action;
    if (!comment || !id) return;
    this.commentError.set(null);
    this.commentPosting.set(true);
    this.sharedService
      .addComment('invoices', id, { comment })
      .pipe(
        finalize(() => this.commentPosting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          if (res?.success) {
            this.loadedSections.delete('comments');
            this.loadSection('comments');
          } else {
            this.commentError.set("Couldn't post — please try again.");
          }
        },
        error: () => this.commentError.set("Couldn't post — please try again.")
      });
  }

  onDeleteComment(commentId: string): void {
    const id = this.row()?.action;
    if (!id || !commentId) return;

    const confirmRef = this.alertService.confirmAlert({
      title: 'Confirm',
      content: 'Are you sure you want to delete this comment?',
      doneMsg: 'Yes, Delete it!',
      cancelMsg: 'No, Cancel!'
    });

    confirmRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.sharedService
          .deleteComment('invoices', id, commentId)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe((res) => {
            if (res.success) {
              this.alertService.successAlert({
                content: 'Comment deleted successfully.',
                close: true,
                timeout: 1500
              });
              const current = this.comments();
              if (current) {
                this.comments.set(
                  current.filter(
                    (item) =>
                      (item.encrypted_id ?? String(item.id)) !== commentId
                  )
                );
              }
            }
          });
      });
  }

  // ── Attachments ───────────────────────────────────────────────────────────
  onAttachmentSelected(file: File): void {
    const id = this.row()?.action;
    if (!file || !id) return;
    if ((this.attachments() ?? []).length >= 5) {
      this.alertService.warningAlert({ content: 'Maximum limit is 5' });
      return;
    }
    const formData = new FormData();
    formData.append('image', file);
    this.attachmentError.set(null);
    this.attachmentUploading.set(true);
    this.sharedService
      .addAttachment('invoices', id, formData)
      .pipe(
        finalize(() => this.attachmentUploading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          if (res?.success) {
            this.alertService.successAlert({
              content: 'Attachment uploaded successfully',
              close: true,
              timeout: 2500
            });
            this.loadedSections.delete('attachments');
            this.loadSection('attachments');
          } else {
            this.attachmentError.set("Couldn't upload — please try again.");
          }
        },
        error: () =>
          this.attachmentError.set("Couldn't upload — please try again.")
      });
  }

  onOpenAttachment(entry: IAttachmentEntry): void {
    const attachmentId = entry?.encrypted_id;
    const id = this.row()?.action;
    if (!attachmentId || !id) return;
    this.invoiceService
      .openAttachment(id, attachmentId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res: IOpenAttachmentsRes) => window.open(res.data, '_blank'));
  }

  onDeleteAttachment(entry: IAttachmentEntry): void {
    const attachmentId = entry?.encrypted_id;
    const id = this.row()?.action;
    if (!attachmentId || !id) return;
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
        this.deletingAttachmentId.set(attachmentId);
        this.sharedService
          .deleteAttachment('invoices', id, attachmentId)
          .pipe(
            finalize(() => this.deletingAttachmentId.set(null)),
            takeUntilDestroyed(this.destroyRef)
          )
          .subscribe((res) => {
            if (res?.success) {
              this.attachments.update(
                (list) =>
                  list?.filter((a) => a.encrypted_id !== attachmentId) ?? null
              );
            }
          });
      });
  }
}

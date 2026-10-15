import {
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  output,
  signal
} from '@angular/core';
import {
  CurrencyPipe,
  NgClass,
  NgTemplateOutlet,
  TitleCasePipe
} from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
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
import { LucideAngularModule } from 'lucide-angular';
import { PaymentsV4Service } from 'src/app/modules/payments-v4/shared/services/payments-v4.service';
import { SendPaymentMode } from 'src/app/modules/payments-v4/send-payment/models/send-payment.enums';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import {
  DetailSidePanelComponent,
  IDetailPanelActionButton,
  IDetailPanelStatusBadge
} from 'src/app/shared/V4/detail-side-panel/detail-side-panel.component';
import { BillService } from 'src/app/shared/service/Bill/bill.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import {
  IViewBill,
  IItemsViewBill
} from 'src/app/modules/invoices/model/invoice';
import { IHeaderData } from 'src/app/layout/model/header';
import { IApiRes } from 'src/app/models/api';
import { PdSkeletonComponent } from 'src/app/shared/V4/pd-skeleton/pd-skeleton.component';
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
import { V4AddBillComponent } from '../../modals/v4-add-bill/v4-add-bill.component';
import { IBillComment } from '../../../model/Bill';

const RESOURCE = 'bills';

type ActionSection = 'audit' | 'comments' | 'attachments';

interface IBillAuditLog {
  activityBy: string;
  status: string;
  note: string;
  ipAddress: string;
  createdAt: string;
  formatedDate: string;
}

type BadgeTone = 'info' | 'success' | 'warning' | 'error' | 'accent';

const badge = (tone: BadgeTone, text: string): IDetailPanelStatusBadge => ({
  text,
  color: `var(--v4-badge-${tone}-text-color)`,
  bgColor: `var(--v4-badge-${tone}-bg-color)`
});

const initialsOf = (name: string): string =>
  (name || '?')
    .trim()
    .split(/\s+/)
    .map((w) => w[0] ?? '')
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';

@Component({
  selector: 'app-v4-bills-details-panel',
  templateUrl: './v4-bills-details-panel.component.html',
  styleUrls: ['./v4-bills-details-panel.component.scss'],
  standalone: true,
  imports: [
    DetailSidePanelComponent,
    LucideAngularModule,
    NgClass,
    NgTemplateOutlet,
    CurrencyPipe,
    PdSkeletonComponent,
    PoAuditLogListComponent,
    PoCommentsListComponent,
    PoAttachmentsListComponent
  ]
})
export class V4BillsDetailsPanelComponent {
  private billService = inject(BillService);
  private alertService = inject(V4AlertService);
  private headerService = inject(HeaderService);
  private dialog = inject(MatDialog);
  private paymentsV4Service = inject(PaymentsV4Service);
  private sharedService = inject(SharedService);
  private destroyRef = inject(DestroyRef);

  billId = input.required<string>();
  isOpen = input(false);
  backdropZIndex = input(200);
  closed = output<void>();
  billUpdated = output<void>();

  billData = signal<IViewBill | null>(null);
  isLoading = signal(true);
  isLoggedAsUser = signal(false);
  isPanelExpanded = signal(false);
  openActionSection = signal<ActionSection | null>(null);
  actionLoading = signal<string | null>(null);

  auditLogs = signal<IBillAuditLog[] | null>(null);
  comments = signal<IBillComment[] | null>(null);
  attachments = signal<IAttachmentEntry[] | null>(null);
  commentPosting = signal(false);
  commentError = signal<string | null>(null);
  attachmentUploading = signal(false);
  attachmentError = signal<string | null>(null);
  deletingAttachmentId = signal<string | null>(null);

  collapsedCards = signal<Record<string, boolean>>({});

  private reloadTick = signal(0);
  private loadedBillId = '';
  private loadedSections = new Set<string>();
  private loadingSections = signal<string[]>([]);
  private panelReset$ = new Subject<void>();

  isCardCollapsed(key: string): boolean {
    return !!this.collapsedCards()[key];
  }

  toggleCard(key: string): void {
    this.collapsedCards.update((s) => ({ ...s, [key]: !s[key] }));
  }

  private status = computed(() => String(this.billData()?.status ?? ''));
  voided = computed(() => this.status() === '3');

  panelTitle = computed(() => {
    const amount = this.billData()?.amount;
    return amount
      ? `$${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : '';
  });

  panelStatusBadge = computed<IDetailPanelStatusBadge | undefined>(() => {
    const data = this.billData();
    if (!data?.status) return undefined;
    switch (this.status()) {
      case '3':
        return badge('error', 'Voided');
      case '2':
        return badge('success', 'Paid');
      case '4':
        return badge('info', 'Received');
      case '6':
        return badge('error', 'Rejected');
      case '7':
        return badge('accent', 'Imported');
      case '13':
        return badge('warning', 'Pending');
      case '1':
      case '5':
      case '14':
      case '15':
      case '16': {
        const due = data.dueDate ? new Date(data.dueDate) : null;
        return due && due < new Date()
          ? {
              text: 'Overdue',
              color: 'var(--v4-common-red-color)',
              bgColor: 'var(--v4-badge-error-bg-color)'
            }
          : badge('info', 'Due');
      }
      default:
        return undefined;
    }
  });

  payStatus = computed(() => {
    if (this.voided()) return badge('error', 'Voided');
    if (this.status() === '2') return badge('success', 'Paid');
    return badge('warning', 'To Pay');
  });

  panelActionButtons = computed<IDetailPanelActionButton[]>(() => {
    const data = this.billData();
    if (!data) return [];
    const status = this.status();
    const isUser = this.isLoggedAsUser();
    const allowed = isUser
      ? ['1', '5', '7', '14', '16']
      : ['1', '3', '5', '7', '13', '14', '15', '16'];
    const canAct = allowed.includes(status) && !this.voided();
    const canPrint = !(isUser && !['1', '5', '7', '14'].includes(status));
    const canMarkPaid =
      canAct && !(status === '7' && data.isApprovedXero === 0);

    type MenuItem = NonNullable<IDetailPanelActionButton['menu']>[number];
    const print: MenuItem = {
      label: 'Print',
      key: 'print',
      lucideIcon: 'printer'
    };
    const del: MenuItem = {
      label: 'Delete',
      key: 'delete',
      lucideIcon: 'trash-2',
      danger: true
    };

    const buttons: IDetailPanelActionButton[] = [];
    const menu: MenuItem[] = [];
    if (canAct) {
      buttons.push({
        label: 'Pay',
        variant: 'primary',
        key: 'pay',
        lucideIcon: 'credit-card'
      });
      if (canPrint) menu.push(print);
      menu.push(
        { label: 'Edit', key: 'edit', lucideIcon: 'pencil' },
        { label: 'Void', key: 'void', lucideIcon: 'ban' },
        del
      );
      if (canMarkPaid)
        menu.push({
          label: 'Mark As Paid',
          key: 'mark-paid',
          lucideIcon: 'circle-check'
        });
    } else if (this.voided()) {
      buttons.push({
        label: 'Unvoid',
        variant: 'outline',
        key: 'unvoid',
        lucideIcon: 'undo-2'
      });
      if (canPrint) menu.push(print);
      menu.push(del);
    } else {
      if (canPrint)
        buttons.push({
          label: 'Print',
          variant: 'outline',
          key: 'print',
          lucideIcon: 'printer'
        });
      menu.push(del);
    }
    buttons.push({
      label: '',
      variant: 'outline',
      key: 'more',
      tooltip: 'More actions',
      menu,
      menuHeading: 'Actions'
    });

    const loadingKey = this.actionLoading();
    return buttons.map((b) => ({
      ...b,
      loading:
        !!loadingKey &&
        (b.key === loadingKey || !!b.menu?.some((m) => m.key === loadingKey))
    }));
  });

  private addAttachmentDisabled = computed(() =>
    ['2', '3'].includes(this.status())
  );

  vendor = computed(() => {
    const data = this.billData();
    const p = data?.payee;
    const name = (p?.payeeName ?? '').trim();
    const street = [p?.payeeAddressLine1, p?.payeeAddressLine2]
      .map((part) => (part ?? '').trim())
      .filter(Boolean)
      .join(', ');
    const locality = [
      (p?.payeeCity ?? '').trim(),
      [p?.payeeState, p?.payeeZip]
        .map((part) => (part ?? '').trim())
        .filter(Boolean)
        .join(' ')
    ]
      .filter(Boolean)
      .join(', ');
    const billTo = (data?.bankAccount?.bankAccountName ?? '').trim();
    return {
      name,
      address: [street, locality].filter(Boolean).join(' · '),
      initials: initialsOf(name),
      billTo,
      billToInitials: initialsOf(billTo)
    };
  });

  lineItems = computed<IItemsViewBill[]>(() => {
    const items = this.billData()?.items;
    return !items || typeof items === 'string' ? [] : items;
  });

  summaryRows = computed(() => {
    const bill = this.billData();
    if (!bill) return [];
    const rows: { label: string; value: number | string | undefined }[] = [];
    if (bill.discountAmount)
      rows.push({ label: 'Total Discount', value: bill.discountAmount });
    if (bill.adjustment)
      rows.push({
        label: bill.adjustmentText || 'Adjustment',
        value: bill.adjustment
      });
    if (bill.TotalTax) rows.push({ label: 'Tax Total', value: bill.TotalTax });
    if (bill.paidFromThirdParty) {
      const app = bill.thirdPartyAppName
        ? new TitleCasePipe().transform(bill.thirdPartyAppName)
        : '';
      rows.push({
        label: `Paid From ${app}`.trim(),
        value: bill.paidFromThirdParty
      });
    }
    if (bill.creditApplied)
      rows.push({ label: 'Credit Applied', value: bill.creditApplied });
    if (bill.amountCredited)
      rows.push({
        label: 'Credit Applied From Xero',
        value: bill.amountCredited
      });
    if (bill.paidAmount)
      rows.push({
        label: `Paid Amount${bill.paidAmountText ? ` From ${bill.paidAmountText}` : ''}`,
        value: bill.paidAmount
      });
    if (bill.paidOrAllocated)
      rows.push({ label: 'Paid Or Allocated', value: bill.paidOrAllocated });
    return rows;
  });

  auditLogsForList = computed<IActivityEntry[] | null>(() => {
    const list = this.auditLogs();
    if (list == null) return null;
    return list.map((log) => ({
      formattedCreatedAt: log.formatedDate?.replace('- ', ' '),
      status: log.status,
      userName: log.activityBy,
      ipAddress: log.ipAddress,
      note: log.note
    }));
  });

  commentsForList = computed<ICommentEntry[] | null>(() => {
    const list = this.comments();
    if (list == null) return null;
    return list.map((c) => ({
      id: c.id,
      encrypted_id: c.encrypted_id,
      formated_date: c.formated_date || c.created_at,
      comments: c.comments,
      user_name: c.user_name || c.user
    }));
  });

  constructor() {
    // eslint-disable-next-line no-underscore-dangle
    this.headerService._headerData
      .pipe(takeUntilDestroyed())
      .subscribe((res) =>
        this.isLoggedAsUser.set(
          !!(res as unknown as IHeaderData)?.isLoggedInAsClient
        )
      );

    const trigger = computed(() => ({
      id: this.billId(),
      tick: this.reloadTick()
    }));
    toObservable(trigger)
      .pipe(
        takeUntilDestroyed(),
        filter(({ id }) => !!id),
        switchMap(({ id }) => {
          this.resetForNewRecord(id !== this.loadedBillId);
          this.loadedBillId = id;
          const fallback = <T>() =>
            of({ success: false, data: null } as unknown as IApiRes<T>);
          return forkJoin({
            bill: this.billService
              .viewBill(id)
              .pipe(catchError(() => fallback<IViewBill>())),
            audit: (
              this.billService.auditTrial(id) as Observable<
                IApiRes<IBillAuditLog[]>
              >
            ).pipe(catchError(() => fallback<IBillAuditLog[]>()))
          }).pipe(finalize(() => this.isLoading.set(false)));
        })
      )
      .subscribe(({ bill, audit }) => {
        this.billData.set(bill?.success ? bill.data : null);
        this.auditLogs.set(audit?.success ? (audit.data ?? []) : []);
        if (!this.openActionSection()) this.openActionSection.set('audit');
      });
  }

  private resetForNewRecord(newRecord: boolean): void {
    this.panelReset$.next();
    this.loadedSections.clear();
    this.loadingSections.set([]);
    this.auditLogs.set(null);
    this.comments.set(null);
    this.attachments.set(null);
    this.commentError.set(null);
    this.attachmentError.set(null);
    this.deletingAttachmentId.set(null);
    if (newRecord) {
      this.actionLoading.set(null);
      this.billData.set(null);
      this.collapsedCards.set({});
      this.openActionSection.set(null);
      this.isLoading.set(true);
    } else {
      const open = this.openActionSection();
      if (open) this.loadSection(open);
    }
  }

  private reload(): void {
    this.reloadTick.update((t) => t + 1);
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
    switch (key) {
      case 'comments':
        return this.comments$();
      case 'attachments':
        return this.attachments$();
      default:
        return null;
    }
  }

  private comments$(): Observable<unknown> {
    return this.billService
      .getComments(this.billId())
      .pipe(
        tap((res) => this.comments.set(res?.success ? (res.data ?? []) : []))
      );
  }

  private attachments$(): Observable<unknown> {
    return this.sharedService
      .getAttachment(RESOURCE, this.billId())
      .pipe(
        tap((res) =>
          this.attachments.set(
            res?.success
              ? ((res.data ?? []) as unknown as IAttachmentEntry[])
              : []
          )
        )
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

  onActionButtonClicked(key: string): void {
    switch (key) {
      case 'void':
        this.voidBill();
        break;
      case 'unvoid':
        this.unvoidBill();
        break;
      case 'pay':
        this.onPay();
        break;
      case 'edit':
        this.onEdit();
        break;
      case 'delete':
        this.onDelete();
        break;
      case 'print':
        this.onPrint();
        break;
      case 'mark-paid':
        this.markAsPaid();
        break;
      default:
        break;
    }
  }

  onPay(): void {
    const data = this.billData();
    if (data?.status === '16' && data.zil_payment_uu_id) {
      this.paymentsV4Service.openSendModal({
        mode: SendPaymentMode.Edit,
        paymentId: data.zil_payment_uu_id
      });
    } else {
      this.paymentsV4Service.openSendModal({ billIds: [this.billId()] });
    }
  }

  private confirm(content: string, onConfirm: () => void): void {
    this.alertService
      .confirmAlert({ content })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((ok) => {
        if (ok) onConfirm();
      });
  }

  private runAction(
    key: string,
    request$: Observable<{ success: boolean } | null>,
    message: string,
    after: () => void
  ): void {
    this.actionLoading.set(key);
    request$
      .pipe(
        finalize(() => this.actionLoading.set(null)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (!res?.success) return;
        this.alertService.successAlert({
          title: 'Success',
          content: message,
          close: true
        });
        this.billUpdated.emit();
        after();
      });
  }

  voidBill(): void {
    this.confirm('Are you sure you want to void this bill?', () =>
      this.runAction(
        'void',
        this.billService.voidBill(this.billId()),
        'Bill voided.',
        () => this.reload()
      )
    );
  }

  unvoidBill(): void {
    this.confirm('Are you sure you want to unvoid this bill?', () =>
      this.runAction(
        'unvoid',
        this.billService.UnvoidBill([this.billId()]),
        'Bill unvoided.',
        () => this.reload()
      )
    );
  }

  onDelete(): void {
    this.confirm('Are you sure you want to delete this bill permanently?', () =>
      this.runAction(
        'delete',
        this.billService.deleteBills(this.billId()),
        'Bill deleted.',
        () => this.closed.emit()
      )
    );
  }

  markAsPaid(): void {
    this.confirm('Are you sure you want to mark this bill as Paid?', () =>
      this.runAction(
        'mark-paid',
        this.billService.markAsPaid(this.billId()),
        'Marked as paid',
        () => this.reload()
      )
    );
  }

  onEdit(): void {
    this.dialog
      .open(V4AddBillComponent, {
        ...V4AddBillComponent.dialogConfig,
        data: { billId: this.billId(), mode: 'edit' }
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (!result?.success) return;
        this.alertService.successAlert({
          content: 'Bill successfully modified',
          close: true,
          timeout: 2000
        });
        this.reload();
        this.billUpdated.emit();
      });
  }

  onPrint(): void {
    this.actionLoading.set('print');
    this.billService
      .printBill(this.billId())
      .pipe(
        finalize(() => this.actionLoading.set(null)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((data) => {
        if (!data?.success) return;
        const iframe = document.createElement('iframe');
        iframe.srcdoc = data.data.printData;
        iframe.style.visibility = 'hidden';
        document.body.appendChild(iframe);
      });
  }

  onSubmitComment(text: string): void {
    const comment = text?.trim();
    if (!comment) return;
    if (this.voided()) {
      this.commentError.set('Comments can’t be added to a voided bill.');
      return;
    }
    this.commentError.set(null);
    this.commentPosting.set(true);
    this.sharedService
      .addComment(RESOURCE, this.billId(), { comment })
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
    if (!commentId) return;
    this.alertService
      .confirmAlert({
        content: 'Are you sure you want to delete this comment?',
        doneMsg: 'Yes, Delete it!',
        cancelMsg: 'No, Cancel!'
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((ok) => {
        if (!ok) return;
        this.sharedService
          .deleteComment(RESOURCE, 0, commentId)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe((res) => {
            if (res?.success)
              this.comments.update(
                (list) =>
                  list?.filter(
                    (c) => (c.encrypted_id ?? String(c.id)) !== commentId
                  ) ?? null
              );
          });
      });
  }

  onAttachmentSelected(file: File): void {
    if (!file) return;
    if (this.addAttachmentDisabled()) {
      this.attachmentError.set(
        'Attachments can’t be added to a paid or voided bill.'
      );
      return;
    }
    const formData = new FormData();
    formData.append('image', file);
    this.attachmentError.set(null);
    this.attachmentUploading.set(true);
    this.sharedService
      .addAttachment(RESOURCE, this.billId(), formData)
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
    const attachmentId = entry?.encrypted_id;
    if (!attachmentId) return;
    this.alertService
      .confirmAlert({
        content: 'Are you sure you want to delete this attachment?',
        doneMsg: 'Yes, Delete it!',
        cancelMsg: 'No, Cancel!'
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((ok) => {
        if (!ok) return;
        this.deletingAttachmentId.set(attachmentId);
        this.billService
          .deleteAttachment(this.billId(), attachmentId)
          .pipe(
            finalize(() => this.deletingAttachmentId.set(null)),
            takeUntilDestroyed(this.destroyRef)
          )
          .subscribe((res) => {
            if (res?.success)
              this.attachments.update(
                (list) =>
                  list?.filter((a) => a.encrypted_id !== attachmentId) ?? null
              );
          });
      });
  }
}

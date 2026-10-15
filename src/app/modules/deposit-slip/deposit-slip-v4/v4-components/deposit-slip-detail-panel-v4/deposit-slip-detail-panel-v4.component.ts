import {
  ChangeDetectionStrategy,
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
  forkJoin,
  Observable,
  of,
  Subject,
  switchMap,
  takeUntil,
  tap
} from 'rxjs';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import {
  DetailSidePanelComponent,
  IDetailPanelActionButton,
  IDetailPanelStatusBadge
} from 'src/app/shared/V4/detail-side-panel/detail-side-panel.component';
import {
  ICashRow,
  ICheckRow,
  IDepositSlip,
  IDepositSlipLastTransaction,
  IDepositSlipRowData,
  IViewCheckdraftItems,
  IViewReceivedPayments
} from 'src/app/modules/deposit-slip/model/depositslips';
import { DepositSlipsService } from 'src/app/shared/service/deposit-slips/deposit-slips.service';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { DepositSlipActionsService } from '../../services/deposit-slip-actions.service';
import { CheckDraftService } from 'src/app/shared/service/check-draft/check-draft.service';
import { RequestPaymentsService } from 'src/app/shared/service/RequestPayments/request-payments.service';
import { PdSkeletonComponent } from 'src/app/shared/V4/pd-skeleton/pd-skeleton.component';
import {
  ICommentEntry,
  PoCommentsListComponent
} from 'src/app/modules/payments-v4/payments-out/components/common/comments-list/comments-list.component';
import {
  IAttachmentEntry,
  PoAttachmentsListComponent
} from 'src/app/modules/payments-v4/payments-out/components/common/attachments-list/attachments-list.component';
import {
  IActivityEntry,
  PoAuditLogListComponent
} from 'src/app/modules/payments-v4/payments-out/components/common/audit-log-list/audit-log-list.component';
import { IReceiveCheckActivityLog } from 'src/app/modules/receive-payments/model/ReceivePayment';

type DepositSlipActionSection = 'activity' | 'last-deposits' | 'comments' | 'attachments';

interface ICheckDetailsResponse {
  checkDraftItems: IViewCheckdraftItems[] | null;
  ReceivedPayments: IViewReceivedPayments[] | null;
}

@Component({
  selector: 'app-deposit-slip-detail-panel-v4',
  standalone: true,
  imports: [
    DetailSidePanelComponent,
    CurrencyPipe,
    NgClass,
    NgTemplateOutlet,
    LucideAngularModule,
    PdSkeletonComponent,
    PoCommentsListComponent,
    PoAttachmentsListComponent,
    PoAuditLogListComponent
  ],
  templateUrl: './deposit-slip-detail-panel-v4.component.html',
  styleUrls: ['./deposit-slip-detail-panel-v4.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DepositSlipDetailPanelV4Component {
  // ── Services ──────────────────────────────────────────────────────────────
  private depositService            = inject(DepositSlipsService);
  private sharedService             = inject(SharedService);
  private alertService              = inject(V4AlertService);
  private depositSlipActionsService = inject(DepositSlipActionsService);
  private checkDraftService         = inject(CheckDraftService);
  private requestPaymentService     = inject(RequestPaymentsService);
  private router                    = inject(Router);
  private destroyRef                = inject(DestroyRef);

  // ── Inputs / Outputs ──────────────────────────────────────────────────────
  row            = input<IDepositSlipRowData | null>(null);
  isOpen         = input(false);
  backdropZIndex = input(200);

  closed              = output<void>();
  actionButtonClicked = output<string>();

  // ── Panel state ───────────────────────────────────────────────────────────
  isPanelExpanded   = signal(false);
  collapsedCards    = signal<Record<string, boolean>>({});
  openActionSection = signal<DepositSlipActionSection | null>('activity');

  details          = signal<IDepositSlip | null>(null);
  isLoading        = signal(false);

  checkDraftItems  = signal<IViewCheckdraftItems[] | null>(null);
  receivedPayments = signal<IViewReceivedPayments[] | null>(null);

  auditLogs    = signal<IActivityEntry[] | null>(null);
  lastDeposits = signal<IDepositSlipLastTransaction[] | null>(null);
  attachments  = signal<{ [key: string]: string }[] | null>(null);
  comments     = signal<Record<string, unknown>[] | null>(null);

  commentPosting       = signal(false);
  commentError         = signal<string | null>(null);
  attachmentUploading  = signal(false);
  attachmentError      = signal<string | null>(null);
  deletingAttachmentId = signal<string | null>(null);

  showPaymentPrintBtn    = signal(true);
  isPaymentPrinted       = signal(false);
  isPaymentPrintDisabled = signal(true);
  isCheckDraftPrinting   = signal(false);

  openBreakdownIndex = signal<number | null>(null);

  private loadedSections  = new Set<DepositSlipActionSection>();
  private loadingSections = signal<DepositSlipActionSection[]>([]);
  private panelReset$     = new Subject<void>();

  // ── Static tile list ──────────────────────────────────────────────────────
  readonly actionTiles: { key: DepositSlipActionSection; label: string; icon: string }[] = [
    { key: 'activity',      label: 'Activity Log',  icon: 'activity'       },
    { key: 'last-deposits', label: 'Last Deposits', icon: 'clock'          },
    { key: 'comments',      label: 'Comments',      icon: 'message-square' },
    { key: 'attachments',   label: 'Attachments',   icon: 'paperclip'      }
  ];

  // ── Header computed ───────────────────────────────────────────────────────
  panelTitle = computed(() => 'Deposit Slip Details');

  panelSubtitle = computed(() => {
    const r = this.row();
    if (!r?.ref_id) return '';
    return `Ref ID: ${r.ref_id}`;
  });

  statusBadge = computed<IDetailPanelStatusBadge | undefined>(() => {
    switch (this.row()?.status) {
      case 1:  return { text: 'Verified',     color: 'var(--v4-badge-success-text-color)', bgColor: 'var(--v4-badge-success-bg-color)' };
      case 2:  return { text: 'Voided',       color: 'var(--v4-badge-error-text-color)',   bgColor: 'var(--v4-badge-error-bg-color)'   };
      default: return { text: 'Not Verified', color: 'var(--v4-badge-warning-text-color)', bgColor: 'var(--v4-badge-warning-bg-color)' };
    }
  });

  actionButtons = computed<IDetailPanelActionButton[]>(() => {
    const s          = this.row()?.status;
    const isVerified = s === 1;
    const isVoided   = s === 2;

    const cloneBtn  = { label: 'Clone', variant: 'outline' as const, key: 'Clone', lucideIcon: 'copy' };
    const printBtn  = { label: 'Print', variant: 'outline' as const, key: 'Print', lucideIcon: 'printer' };
    const deleteItem = { label: 'Delete', key: 'Delete', lucideIcon: 'trash-2', danger: true };
    const moreBtn = (
      menu: NonNullable<IDetailPanelActionButton['menu']>
    ): IDetailPanelActionButton => ({
      label: '', variant: 'outline', key: '__more', menu, menuHeading: 'ACTIONS'
    });

    if (isVoided) {
      return [cloneBtn, moreBtn([deleteItem])];
    }

    if (isVerified) {
      return [cloneBtn, printBtn, moreBtn([deleteItem])];
    }

    return [
      { label: 'Verify', variant: 'primary', key: 'Verify', lucideIcon: 'circle-check' },
      { label: 'Edit',   variant: 'outline', key: 'Edit',   lucideIcon: 'square-pen' },
      moreBtn([
        cloneBtn,
        printBtn,
        { label: 'Void', key: 'Void', lucideIcon: 'ban', danger: true },
        deleteItem
      ])
    ];
  });

  // ── Computed helpers ──────────────────────────────────────────────────────
  bankAddressLine = computed(() => {
    const b = this.details()?.bankAccount;
    if (!b) return '';
    return [b.bankAccountCity, b.bankAccountState, b.bankAccountZip].filter(Boolean).join(', ');
  });

  grandTotal = computed(() => {
    const d = this.details();
    if (!d) return 0;
    return [...(d.cash ?? []), ...(d.check ?? [])].reduce((s, r) => s + Number(r.amount), 0);
  });

  totalItems = computed(() =>
    (this.details()?.cash?.length ?? 0) + (this.details()?.check?.length ?? 0)
  );

  checkRows = computed(() => {
    const d = this.details();
    if (!d?.check) return [];
    return (d.check as unknown as ICheckRow[]).map(row => ({
      ...row,
      displayType: this.getCheckTypeLabel(row.checkType),
      displayFrom: row.checkFrom?.name ?? (d as IDepositSlip & { payeeName?: string }).payeeName ?? ''
    }));
  });

  cashRows = computed(() => {
    const d = this.details();
    if (!d?.cash) return [];
    return d.cash.map((row: ICashRow) => ({
      ...row,
      displayType: this.getCashTypeLabel(row.checkType),
      displayFrom: (d as IDepositSlip & { payeeName?: string }).payeeName ?? ''
    }));
  });

  enableBreakdown = computed(() => {
    const d = this.details();
    return (d?.cash?.length ?? 0) > 0 && (d?.cash?.[0]?.denominations?.length ?? 0) > 0;
  });

  attachmentsForList = computed<IAttachmentEntry[] | null>(() => {
    const list = this.attachments();
    if (list == null) return null;
    return list.map(item => ({
      file_name:             item['file_name'] ?? '',
      user_name:             item['user_name'] ?? '',
      formated_date:         item['formated_date'] ?? '',
      encrypted_id:          item['encrypted_id'] ?? '',
      all_attachment_status: item['status'] as unknown as { status_text: string } | undefined
    }));
  });

  commentsForList = computed<ICommentEntry[] | null>(() => {
    const list = this.comments();
    if (list == null) return null;
    return list.map(item => ({
      id:            item['id'] as string | number | undefined,
      encrypted_id:  item['encrypted_id'] as string | undefined,
      formated_date: item['formated_date'] as string | undefined,
      comments:      item['comments'] as string | undefined,
      user_name:     item['user_name'] as string | undefined,
      status:        item['status'] as ICommentEntry['status']
    }));
  });

  // ── Constructor ───────────────────────────────────────────────────────────
  constructor() {
    const loadTrigger = computed(() => ({
      action: this.row()?.action ?? null,
      open:   this.isOpen()
    }));
    toObservable(loadTrigger)
      .pipe(
        takeUntilDestroyed(),
        switchMap(({ action, open }) => {
          if (!action || !open) {
            this.details.set(null);
            return EMPTY;
          }
          this.resetForNewRecord();
          return forkJoin({
            detail:       this.depositService.getEditBody(action).pipe(catchError(() => of(null))),
            checkDetails: this.depositService.getCheckDetails(action).pipe(catchError(() => of(null)))
          }).pipe(finalize(() => this.isLoading.set(false)));
        })
      )
      .subscribe(({ detail, checkDetails }) => {
        if (detail?.success) this.details.set(detail.data);
        if (checkDetails?.success) {
          const cd = checkDetails.data as ICheckDetailsResponse;
          this.checkDraftItems.set(cd?.checkDraftItems?.length ? cd.checkDraftItems : null);
          this.receivedPayments.set(cd?.ReceivedPayments?.length  ? cd.ReceivedPayments  : null);
          if (this.receivedPayments()) this.setPaymentsPrintBtn();
        }
        this.loadSection('activity');
      });
  }

  // ── Card collapse ─────────────────────────────────────────────────────────
  isCardCollapsed(key: string): boolean {
    return !!this.collapsedCards()[key];
  }

  toggleCard(key: string): void {
    this.collapsedCards.update(s => ({ ...s, [key]: !s[key] }));
  }

  // ── Section management ────────────────────────────────────────────────────
  selectSection(section: DepositSlipActionSection): void {
    this.commentError.set(null);
    this.attachmentError.set(null);
    this.openActionSection.update(current => current === section ? null : section);
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

  isSectionLoading(key: DepositSlipActionSection): boolean {
    return this.loadingSections().includes(key);
  }

  // ── Data loading ──────────────────────────────────────────────────────────
  loadSection(key: DepositSlipActionSection): void {
    if (this.loadedSections.has(key)) return;
    const request$ = this.sectionRequest(key);
    if (!request$) return;

    this.loadedSections.add(key);
    this.loadingSections.update(keys => [...keys, key]);
    request$
      .pipe(
        catchError(() => of(null)),
        finalize(() => this.loadingSections.update(keys => keys.filter(k => k !== key))),
        takeUntil(this.panelReset$),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  private sectionRequest(key: DepositSlipActionSection): Observable<unknown> | null {
    const id = this.row()?.action;
    if (!id) return null;
    switch (key) {
      case 'activity':
        return this.depositService.getDepositSlipActivites(id).pipe(
          tap(res => this.auditLogs.set(res?.success ? (res.data as IActivityEntry[]) : []))
        );
      case 'last-deposits':
        return this.depositService.depositSlipLastTransaction(id).pipe(
          tap(res => this.lastDeposits.set(res?.success ? res.data : []))
        );
      case 'attachments':
        return this.depositService.getDepositSlipAttachments(id).pipe(
          tap(res => this.attachments.set(res?.success ? (res.data as { [key: string]: string }[]) : []))
        );
      case 'comments':
        return this.sharedService.getAllComments('deposit-slips', id).pipe(
          tap(res => this.comments.set(res?.success ? (res.data as unknown as Record<string, unknown>[]) : []))
        );
      default:
        return null;
    }
  }

  private resetForNewRecord(): void {
    this.panelReset$.next();
    this.loadedSections.clear();
    this.loadingSections.set([]);
    this.collapsedCards.set({});
    this.openActionSection.set('activity');
    this.details.set(null);
    this.checkDraftItems.set(null);
    this.receivedPayments.set(null);
    this.auditLogs.set(null);
    this.lastDeposits.set(null);
    this.attachments.set(null);
    this.comments.set(null);
    this.commentError.set(null);
    this.attachmentError.set(null);
    this.deletingAttachmentId.set(null);
    this.openBreakdownIndex.set(null);
    this.showPaymentPrintBtn.set(true);
    this.isPaymentPrintDisabled.set(true);
    this.isLoading.set(true);
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
    this.lastDeposits.set(null);
    this.attachments.set(null);
    this.comments.set(null);
    this.closed.emit();
  }

  // ── Action handler ────────────────────────────────────────────────────────
  onActionClicked(key: string): void {
    const id = this.row()?.action;
    if (!id) return;
    switch (key) {
      case 'Clone':
        this.router.navigate([`/v4/manage/depositslips/clone/${id}`]);
        this.onClosed();
        break;
      case 'Edit':
        this.router.navigate([`/v4/manage/depositslips/edit/${id}`]);
        this.onClosed();
        break;
      case 'Print':
        this.depositSlipActionsService.print([id], {
          onSuccess: () => this.actionButtonClicked.emit('Print')
        });
        break;
      case 'Verify':
        this.depositSlipActionsService.verify(id, {
          onSuccess: () => {
            this.actionButtonClicked.emit('Verify');
            this.onClosed();
          }
        });
        break;
      case 'Void':
        this.depositSlipActionsService.void([id], {
          onSuccess: () => {
            this.actionButtonClicked.emit('Void');
            this.onClosed();
          }
        });
        break;
      case 'Delete':
        this.onClosed();
        this.actionButtonClicked.emit('Delete');
        break;
    }
  }

  // ── Activity log device editing ────────────────────────────────────────────
  onActivityDeviceUpdated(): void {
    this.loadedSections.delete('activity');
    this.loadSection('activity');
  }

  // ── Comments ──────────────────────────────────────────────────────────────
  onSubmitComment(text: string): void {
    const comment = text?.trim();
    const id      = this.row()?.action;
    if (!comment || !id) return;
    this.commentError.set(null);
    this.commentPosting.set(true);
    this.sharedService
      .addComment('deposit-slips', id, { comment })
      .pipe(
        finalize(() => this.commentPosting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: res => {
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

  onDeleteComment(encryptedId: string): void {
    const id = this.row()?.action;
    if (!id || !encryptedId) return;
    this.alertService
      .confirmAlert({ content: 'Delete this comment?', doneMsg: 'Yes, delete', cancelMsg: 'Cancel' })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(confirmed => {
        if (!confirmed) return;
        this.depositService
          .deleteDepositSlipComment(id, encryptedId)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(res => {
            if (res?.success) {
              this.loadedSections.delete('comments');
              this.loadSection('comments');
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
      .addAttachment('deposit-slips', id, formData)
      .pipe(
        finalize(() => this.attachmentUploading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: res => {
          if (res?.success) {
            this.alertService.successAlert({ content: 'Attachment uploaded successfully', close: true, timeout: 2500 });
            this.loadedSections.delete('attachments');
            this.loadSection('attachments');
          } else {
            this.attachmentError.set("Couldn't upload — please try again.");
          }
        },
        error: () => this.attachmentError.set("Couldn't upload — please try again.")
      });
  }

  onOpenAttachment(entry: IAttachmentEntry): void {
    const attachmentId = entry?.encrypted_id;
    const id           = this.row()?.action;
    if (!attachmentId || !id) return;
    this.depositService
      .openDepositSlipAttachment(id, attachmentId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(res => {
        if (res?.success) window.open(res.data, '_blank');
      });
  }

  onDeleteAttachment(entry: IAttachmentEntry): void {
    const attachmentId = entry?.encrypted_id;
    const id           = this.row()?.action;
    if (!attachmentId || !id) return;
    this.alertService
      .confirmAlert({ content: 'Are you sure you want to delete this attachment?', doneMsg: 'Yes, Delete it!', cancelMsg: 'No, Cancel!' })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(confirmed => {
        if (!confirmed) return;
        this.deletingAttachmentId.set(attachmentId);
        this.depositService
          .deleteDepositSlipAttachment(id, attachmentId)
          .pipe(
            finalize(() => this.deletingAttachmentId.set(null)),
            takeUntilDestroyed(this.destroyRef)
          )
          .subscribe(res => {
            if (res?.success) {
              this.attachments.update(list => list?.filter(a => a['encrypted_id'] !== attachmentId) ?? null);
            }
          });
      });
  }

  // ── Check Draft print ─────────────────────────────────────────────────────
  printCheckDraft(): void {
    const items = this.checkDraftItems();
    if (!items?.length) return;
    this.isCheckDraftPrinting.set(true);
    const ids  = items.map(item => item.id);
    const data = { ids, check_design_templete: '1' };
    this.checkDraftService
      .CheckDraftMultiPrint(data)
      .pipe(
        finalize(() => this.isCheckDraftPrinting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(res => {
        if (res.success) window.open(res.data.url);
      });
  }

  // ── Received Payment print ────────────────────────────────────────────────
  printReceivedPayments(): void {
    const payments = this.receivedPayments();
    if (!payments?.length) return;
    const uuids = payments.map(p => p.uuid);
    this.isPaymentPrinted.set(true);
    this.isPaymentPrintDisabled.set(true);
    this.requestPaymentService
      .printSelected({ uuids })
      .pipe(
        finalize(() => {
          this.isPaymentPrinted.set(false);
          this.isPaymentPrintDisabled.set(false);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(res => {
        if (res.success) {
          window.open(res.data);
          this.alertService
            .confirmAlert({ title: 'Did you print it correctly?', doneMsg: 'Yes', cancelMsg: 'No' })
            .afterClosed()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(confirmed => {
              if (confirmed) this.markAsPrintBulk(uuids);
            });
        }
      });
  }

  clickToNav(id: string): void {
    window.open(`/manage/checkdraft/view/${id}`, '_blank');
  }

  clickToNavPayment(uuid: string): void {
    const urlTree = this.router.createUrlTree(['/v4/manage/payments-in/detailed'], {
      queryParams: { openUuid: uuid }
    });
    window.open(urlTree.toString(), '_blank');
  }

  // ── Denomination breakdown ─────────────────────────────────────────────────
  toggleBreakdown(index: number): void {
    this.openBreakdownIndex.set(this.openBreakdownIndex() === index ? null : index);
  }

  getTotalDenomination(denominations: { value: number; count: number }[]): number {
    if (!denominations?.length) return 0;
    return denominations.reduce((sum, d) => sum + d.value * d.count, 0);
  }

  // ── Private helpers ───────────────────────────────────────────────────────
  private setPaymentsPrintBtn(): void {
    const payments = this.receivedPayments();
    if (!payments?.length) return;
    this.showPaymentPrintBtn.set(true);
    this.isPaymentPrintDisabled.set(true);
    payments.forEach(element => {
      this.requestPaymentService
        .recieveCheckActiveLog(element.uuid)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(res => {
          if (res?.success) {
            res.data.forEach((e: IReceiveCheckActivityLog) => {
              if (e.status === 'printed') this.showPaymentPrintBtn.set(false);
            });
          }
          this.isPaymentPrintDisabled.set(false);
        });
    });
  }

  private markAsPrintBulk(uuids: string[]): void {
    this.requestPaymentService
      .markAsPrintBulkRequest({ uuids })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(res => {
        if (res.success) this.setPaymentsPrintBtn();
      });
  }

  private getCheckTypeLabel(type: string): string {
    switch (type) {
      case 'chk':      return 'Business Check';
      case 'p-chk':    return 'Personal Check';
      case 'mo':       return 'Money Order';
      case 'cash chk': return 'Cashier Check';
      default:         return type;
    }
  }

  private getCashTypeLabel(type: string): string {
    switch (type) {
      case 'coin': return 'Coin';
      case 'cash': return 'Cash';
      default:     return type;
    }
  }
}

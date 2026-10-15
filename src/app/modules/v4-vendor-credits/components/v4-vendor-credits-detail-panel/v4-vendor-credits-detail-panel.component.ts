import {
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  output,
  signal
} from '@angular/core';
import { NgClass, NgTemplateOutlet } from '@angular/common';
import { HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import {
  catchError,
  filter,
  finalize,
  forkJoin,
  Observable,
  of,
  Subject,
  switchMap,
  takeUntil,
  tap
} from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';

import {
  DetailSidePanelComponent,
  IDetailPanelActionButton,
  IDetailPanelStatusBadge
} from 'src/app/shared/V4/detail-side-panel/detail-side-panel.component';
import { PdSkeletonComponent } from 'src/app/shared/V4/pd-skeleton/pd-skeleton.component';
import {
  IActivityEntry,
  PoAuditLogListComponent
} from 'src/app/modules/payments-v4/payments-out/components/common/audit-log-list/audit-log-list.component';
import { PoCommentsListComponent } from 'src/app/modules/payments-v4/payments-out/components/common/comments-list/comments-list.component';
import {
  IAttachmentEntry,
  PoAttachmentsListComponent
} from 'src/app/modules/payments-v4/payments-out/components/common/attachments-list/attachments-list.component';
import { VendorService } from 'src/app/shared/service/vendor/vendor.service';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import {
  IVendorViewData,
  IVendorPayment
} from 'src/app/modules/vendor-credit/model/vendor';
import { IPayeeViewInfo } from 'src/app/modules/payee/payee-v2/model/payee';
import { IGetComment } from 'src/app/models/common';
import { IApiRes } from 'src/app/models/api';
import { V4BillsDetailsPanelComponent } from 'src/app/modules/bill/v4-bills/components/v4-bills-details-panel/v4-bills-details-panel.component';
import { V4NewVendorCreditModalComponent } from '../../modals/v4-new-vendor-credit-modal/v4-new-vendor-credit-modal.component';
import { V4VendorCreditsStateService } from '../../v4-vendor-credits-state.service';

const RESOURCE = 'vendor-credits';

type ActionSection = 'audit' | 'comments' | 'attachments';

interface IAuditLogRaw {
  formattedCreatedAt?: string;
  formated_date?: string;
  status?: string;
  userName?: string;
  user_name?: string;
  ipAddress?: string;
  ip_address?: string;
  note?: string;
}

type BadgeTone = 'info' | 'success' | 'warning' | 'error' | 'accent';

const badge = (tone: BadgeTone, text: string): IDetailPanelStatusBadge => ({
  text,
  color: `var(--v4-badge-${tone}-text-color)`,
  bgColor: `var(--v4-badge-${tone}-bg-color)`
});

const STATUS_BADGES: Record<number, IDetailPanelStatusBadge> = {
  1: badge('info', 'New'),
  2: badge('success', 'Completed'),
  3: badge('error', 'Void'),
  4: badge('warning', 'Partially Paid'),
  5: badge('accent', 'Reconciled')
};

const str = (v: unknown): string => (v == null ? '' : String(v).trim());

const money = (v: unknown): string =>
  `$${parseFloat(String(v || 0)).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;

@Component({
  selector: 'app-v4-vendor-credits-detail-panel',
  standalone: true,
  imports: [
    NgClass,
    NgTemplateOutlet,
    LucideAngularModule,
    DetailSidePanelComponent,
    PdSkeletonComponent,
    PoAuditLogListComponent,
    PoCommentsListComponent,
    PoAttachmentsListComponent,
    V4BillsDetailsPanelComponent
  ],
  templateUrl: './v4-vendor-credits-detail-panel.component.html',
  styleUrls: ['./v4-vendor-credits-detail-panel.component.scss']
})
export class V4VendorCreditsDetailPanelComponent {
  creditId = input.required<string>();
  isOpen = input(false);

  closed = output<void>();
  creditUpdated = output<void>();

  private vendorService = inject(VendorService);
  private payeeService = inject(PayeeService);
  private sharedService = inject(SharedService);
  private dialog = inject(MatDialog);
  private alertService = inject(V4AlertService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  stateService = inject(V4VendorCreditsStateService);

  viewData = signal<IVendorViewData | null>(null);
  isLoading = signal(true);
  isPanelExpanded = signal(false);
  openActionSection = signal<ActionSection | null>(null);
  actionLoading = signal<string | null>(null);
  auditLogs = signal<IAuditLogRaw[] | null>(null);
  comments = signal<IGetComment[] | null>(null);
  attachments = signal<IAttachmentEntry[] | null>(null);
  payeeInfo = signal<IPayeeViewInfo | null>(null);
  payeeId = signal<string | null>(null);
  payeeLoading = signal(false);
  commentPosting = signal(false);
  commentError = signal<string | null>(null);
  attachmentUploading = signal(false);
  attachmentError = signal<string | null>(null);
  deletingAttachmentId = signal<string | null>(null);
  collapsedCards = signal<Record<string, boolean>>({});

  selectedBillId = signal('');
  isBillPanelOpen = signal(false);

  private loadedSections = new Set<string>();
  private loadingSections = signal<string[]>([]);
  private panelReset$ = new Subject<void>();

  readonly tiles: { key: ActionSection; icon: string; label: string }[] = [
    { key: 'audit', icon: 'activity', label: 'Audit logs' },
    { key: 'comments', icon: 'message-square', label: 'Comments' },
    { key: 'attachments', icon: 'paperclip', label: 'Attachments' }
  ];

  private status = computed(() => this.stateService.selectedCreditStatus());

  panelTitle = computed(() => {
    const total = this.viewData()?.total;
    return total != null && total !== '' ? money(total) : '';
  });

  panelSubtitle = computed(() => {
    const d = this.viewData();
    if (!d) return '';
    return [d.creditNumber, d.payeeName].filter(Boolean).join(' · ');
  });

  panelStatusBadge = computed<IDetailPanelStatusBadge | undefined>(() => {
    const s = this.status();
    return s ? STATUS_BADGES[s] : undefined;
  });

  panelActionButtons = computed<IDetailPanelActionButton[]>(() => {
    if (!this.viewData()) return [];
    const s = this.status();
    type MenuItem = NonNullable<IDetailPanelActionButton['menu']>[number];
    const buttons: IDetailPanelActionButton[] = [];
    const menu: MenuItem[] = [];
    if (s === 1) {
      buttons.push({
        label: 'Edit',
        variant: 'outline',
        key: 'edit',
        lucideIcon: 'pencil'
      });
      menu.push({ label: 'Void', key: 'void', lucideIcon: 'ban' });
    }
    if (s === 3) {
      buttons.push({
        label: 'Unvoid',
        variant: 'outline',
        key: 'unvoid',
        lucideIcon: 'undo-2'
      });
    }
    if (s === 1 || s === 3 || s === 5) {
      menu.push({
        label: 'Delete',
        key: 'delete',
        lucideIcon: 'trash-2',
        danger: true
      });
    }
    if (menu.length) {
      buttons.push({
        label: '',
        variant: 'outline',
        key: 'more',
        tooltip: 'More actions',
        menu,
        menuHeading: 'Actions'
      });
    }
    const busy = this.actionLoading();
    return buttons.map((b) => {
      const owns = b.key === busy || !!b.menu?.some((m) => m.key === busy);
      return { ...b, loading: !!busy && owns, disabled: !!busy && !owns };
    });
  });

  creditRows = computed(() => {
    const d = this.viewData();
    if (!d) return [];
    return [
      { label: 'Credit number', value: str(d.creditNumber) },
      { label: 'Credit date', value: str(d.creditDate) },
      { label: 'Credit amount', value: money(d.total) },
      {
        label: 'Applied amount',
        value: money(
          parseFloat(String(d.total || 0)) - parseFloat(String(d.balance || 0))
        )
      },
      { label: 'Available balance', value: money(d.balance), balance: true },
      { label: 'Credit for', value: d.is_bill ? 'Bill' : 'Payee' },
      ...(d.is_bill && d.billInvNo
        ? [{ label: 'Bill invoice number', value: d.billInvNo }]
        : []),
      { label: 'Memo', value: str(d.memo) },
      { label: 'Created date', value: str(d.creditDate) }
    ];
  });

  vendorDisplay = computed(() => {
    const info = this.payeeInfo();
    const d = this.viewData();
    const name = str(info?.payee_name) || str(d?.payeeName);
    const email = str(info?.payee_email);
    const phone = str(info?.payee_phone);
    const address = [
      info?.payee_address_line_1,
      info?.payee_address_line_2,
      info?.payee_city,
      [str(info?.payee_state), str(info?.payee_zip)].filter(Boolean).join(' ')
    ]
      .map(str)
      .filter(Boolean)
      .join(', ');
    const account = str(info?.account_number);
    return {
      rows: [
        { label: 'Vendor name', value: name },
        { label: 'Email', value: email },
        { label: 'Phone', value: phone },
        { label: 'Address', value: address },
        { label: 'Account number', value: account }
      ],
      id: this.payeeId()
    };
  });

  payments = computed<IVendorPayment[]>(() => this.viewData()?.payments ?? []);

  auditLogsForList = computed<IActivityEntry[] | null>(() => {
    const list = this.auditLogs();
    if (list == null) return null;
    return list.map((item) => ({
      formattedCreatedAt: item.formattedCreatedAt ?? item.formated_date ?? '',
      status: item.status ?? '',
      userName: item.userName ?? item.user_name ?? '',
      ipAddress: item.ipAddress ?? item.ip_address ?? '',
      note: item.note ?? ''
    }));
  });

  constructor() {
    toObservable(this.creditId)
      .pipe(
        takeUntilDestroyed(),
        filter((id) => !!id),
        switchMap((id) => {
          this.resetForNewRecord();
          const fallback = <T>() => of({ success: false, data: null as T });
          return forkJoin({
            view: this.vendorService
              .getVendorView(id)
              .pipe(catchError(() => fallback<IVendorViewData>())),
            activities: this.vendorService
              .getActivities(id)
              .pipe(catchError(() => fallback<IAuditLogRaw[]>()))
          }).pipe(finalize(() => this.isLoading.set(false)));
        })
      )
      .subscribe(({ view, activities }) => {
        if (view?.success && view.data) {
          const data = view.data as IVendorViewData;
          this.viewData.set(data);
          this.fetchPayeeDetails(data);
        }
        this.auditLogs.set(
          activities?.success
            ? ((activities.data as IAuditLogRaw[] | null) ?? [])
            : []
        );
        this.openActionSection.set('audit');
      });
  }

  private resetForNewRecord(): void {
    this.panelReset$.next();
    this.loadedSections.clear();
    this.loadingSections.set([]);
    this.collapsedCards.set({});
    this.openActionSection.set(null);
    this.viewData.set(null);
    this.auditLogs.set(null);
    this.comments.set(null);
    this.attachments.set(null);
    this.payeeInfo.set(null);
    this.payeeId.set(null);
    this.payeeLoading.set(false);
    this.commentError.set(null);
    this.attachmentError.set(null);
    this.deletingAttachmentId.set(null);
    this.selectedBillId.set('');
    this.isBillPanelOpen.set(false);
    this.actionLoading.set(null);
    this.isLoading.set(true);
  }

  isCardCollapsed(key: string): boolean {
    return !!this.collapsedCards()[key];
  }

  toggleCard(key: string): void {
    this.collapsedCards.update((s) => ({ ...s, [key]: !s[key] }));
  }

  private fetchPayeeDetails(viewData: IVendorViewData): void {
    const payeeId = viewData.payeeEncryptedId ?? viewData.payee_encrypted_id;
    this.payeeLoading.set(true);
    if (payeeId) {
      this.loadPayeeInfo(payeeId);
      return;
    }
    const creditId = this.creditId();
    if (!creditId) {
      this.payeeLoading.set(false);
      return;
    }
    const headers = new HttpHeaders().set('disablePermission', 'true');
    this.vendorService
      .getVendor(creditId, headers)
      .pipe(
        catchError(() => of(null)),
        takeUntil(this.panelReset$),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        const data = Array.isArray(res?.data) ? res.data[0] : res?.data;
        const pid = data?.payee?.payeeId;
        if (pid) this.loadPayeeInfo(pid);
        else this.payeeLoading.set(false);
      });
  }

  private loadPayeeInfo(payeeId: string): void {
    this.payeeId.set(payeeId);
    this.payeeService
      .viewPayee(payeeId)
      .pipe(
        catchError(() => of(null)),
        takeUntil(this.panelReset$),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res?.success && res.data?.payee_information)
          this.payeeInfo.set(res.data.payee_information);
        this.payeeLoading.set(false);
      });
  }

  onOpenPayee(): void {
    const id = this.payeeId();
    if (!id) return;
    const url = this.router.createUrlTree(['/v4/manage/payee', id]);
    window.open(url.toString(), '_blank');
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
    return (
      this.vendorService.getComments(this.creditId()) as Observable<
        IApiRes<IGetComment[]>
      >
    ).pipe(
      tap((res: IApiRes<IGetComment[]>) =>
        this.comments.set(res?.success ? (res.data ?? []) : [])
      )
    );
  }

  private attachments$(): Observable<unknown> {
    return (
      this.vendorService.getAttachments(this.creditId()) as Observable<
        IApiRes<IAttachmentEntry[]>
      >
    ).pipe(
      tap((res: IApiRes<IAttachmentEntry[]>) =>
        this.attachments.set(res?.success ? (res.data ?? []) : [])
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
    const id = this.creditId();
    if (!id) return;
    switch (key) {
      case 'edit':
        this.onEdit(id);
        break;
      case 'void':
        this.confirmAndRun(
          'void',
          'Are you sure you want to void this credit?',
          'Yes',
          'No, cancel!',
          this.vendorService.markAsVoid(id),
          'Voided'
        );
        break;
      case 'unvoid':
        this.confirmAndRun(
          'unvoid',
          'Are you sure you want to unvoid this credit?',
          'Yes',
          'No, cancel!',
          this.vendorService.unVoid(id),
          'Unvoided'
        );
        break;
      case 'delete':
        this.confirmAndRun(
          'delete',
          'Are you sure you want to delete this credit?',
          'Yes, Delete it!',
          'No, Cancel!',
          this.vendorService.deleteVendorCredit([id]),
          'Deleted'
        );
        break;
      default:
        break;
    }
  }

  private onEdit(id: string): void {
    this.closed.emit();
    this.dialog
      .open(V4NewVendorCreditModalComponent, {
        maxWidth: '700px',
        width: '93%',
        autoFocus: false,
        disableClose: true,
        data: { vendorId: id, mode: 'edit' },
        panelClass: 'paddingless-modal-rounded'
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result?.success) {
          this.stateService.refreshList();
          this.creditUpdated.emit();
        }
      });
  }

  private confirmAndRun(
    key: string,
    content: string,
    doneMsg: string,
    cancelMsg: string,
    request$: Observable<{ success: boolean } | null>,
    successMsg: string
  ): void {
    this.alertService
      .confirmAlert({ content, doneMsg, cancelMsg })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.actionLoading.set(key);
        request$
          .pipe(
            finalize(() => this.actionLoading.set(null)),
            takeUntilDestroyed(this.destroyRef)
          )
          .subscribe((data) => {
            if (!data?.success) return;
            this.alertService.successAlert({
              title: 'Success',
              content: successMsg,
              close: true,
              timeout: 2000
            });
            this.closed.emit();
            this.stateService.refreshList();
            this.creditUpdated.emit();
          });
      });
  }

  onPaymentReferenceClick(payment: IVendorPayment): void {
    if (payment.referenceType === 1 && payment.paymentReference) {
      this.selectedBillId.set(payment.paymentReference);
      this.isBillPanelOpen.set(true);
    }
  }

  onSubmitComment(text: string): void {
    const comment = text?.trim();
    const id = this.creditId();
    if (!comment) return;
    if (!id) return;
    this.commentError.set(null);
    this.commentPosting.set(true);
    this.sharedService
      .addComment(RESOURCE, id, { comment })
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
    const id = this.creditId();
    if (!id || !commentId) return;
    this.alertService
      .confirmAlert({
        content: 'Are you sure you want to delete this comment?',
        doneMsg: 'Yes, Delete it!',
        cancelMsg: 'No, Cancel!'
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.sharedService
          .deleteComment(RESOURCE, id, commentId)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe((res) => {
            if (res?.success)
              this.comments.update(
                (list) =>
                  list?.filter((c) => c.encrypted_id !== commentId) ?? null
              );
          });
      });
  }

  onAttachmentSelected(file: File): void {
    const id = this.creditId();
    if (!file || !id) return;
    const formData = new FormData();
    formData.append('image', file);
    this.attachmentError.set(null);
    this.attachmentUploading.set(true);
    this.sharedService
      .addAttachment(RESOURCE, id, formData)
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
            content: 'Attachment added successfully',
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

  onOpenAttachment(entry: IAttachmentEntry): void {
    const id = this.creditId();
    const attachmentId = entry?.encrypted_id;
    if (!id || !attachmentId) return;
    this.sharedService
      .openAttachment(RESOURCE, id, attachmentId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res?.success && res.data) window.open(res.data, '_blank');
      });
  }

  onDeleteAttachment(entry: IAttachmentEntry): void {
    const id = this.creditId();
    const attachmentId = entry?.encrypted_id;
    if (!id || !attachmentId) return;
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
          .deleteAttachment(RESOURCE, id, attachmentId)
          .pipe(
            finalize(() => this.deletingAttachmentId.set(null)),
            takeUntilDestroyed(this.destroyRef)
          )
          .subscribe((res) => {
            if (res?.success) {
              this.alertService.successAlert({
                content: 'Attachment deleted successfully',
                close: true,
                timeout: 1500
              });
              this.attachments$()
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe();
            } else {
              this.alertService.failedAlert({
                content: 'Failed to delete attachment'
              });
            }
          });
      });
  }
}

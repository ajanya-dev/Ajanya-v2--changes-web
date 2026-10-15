import {
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  output,
  signal
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { catchError, filter, forkJoin, of, switchMap, finalize } from 'rxjs';
import { CurrencyPipe, DatePipe, NgClass } from '@angular/common';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';

import { MatDialog } from '@angular/material/dialog';

import { CheckService } from 'src/app/shared/service/check/check.service';
import { getMailTrackUrl } from 'src/app/shared/utils/v4-external.util';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { VendorService } from 'src/app/shared/service/vendor/vendor.service';
import { PsbService } from 'src/app/shared/service/psb/psb.service';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { PaymentsV4Service } from 'src/app/modules/payments-v4/shared/services/payments-v4.service';
import { SendPaymentMode } from 'src/app/modules/payments-v4/send-payment/models/send-payment.enums';
import { PoAuditLogListComponent, IActivityEntry } from 'src/app/modules/payments-v4/payments-out/components/common/audit-log-list/audit-log-list.component';
import { PoSignedReceiptListComponent } from 'src/app/modules/payments-v4/payments-out/components/common/signed-receipt-list/signed-receipt-list.component';
import { PoCommentsListComponent, ICommentEntry } from 'src/app/modules/payments-v4/payments-out/components/common/comments-list/comments-list.component';
import { PoAttachmentsListComponent, IAttachmentEntry } from 'src/app/modules/payments-v4/payments-out/components/common/attachments-list/attachments-list.component';
import { DeviceModalV4Component } from 'src/app/modules/deposit-slip/deposit-slip-v4/v4-modals/device-modal-v4/device-modal-v4.component';
import {
  ICheckDetailsData,
  ICheckMailTrackDetails,
  ICheckPayeeSummary,
  ICheckStatus,
  IOtherDetails
} from 'src/app/modules/check/model/check';
import { IPodDetails } from 'src/app/modules/payments/model/payments';
import { IPaidStatement } from 'src/app/models/payment-switch-board';
import {
  DetailSidePanelComponent,
  IDetailPanelActionButton,
  IDetailPanelStatusBadge
} from 'src/app/shared/V4/detail-side-panel/detail-side-panel.component';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CheckPreviewV4Component } from 'src/app/shared/V4/for-side-drawer/check-preview-v4/check-preview-v4.component';
import type { IPodActivityEntry } from 'src/app/shared/V4/for-side-drawer/pod-activity-list-v4/pod-activity-list-v4.component';
import {
  TransactionsListV4Component,
  ITransactionListEntry
} from 'src/app/shared/V4/for-side-drawer/transactions-list-v4/transactions-list-v4.component';
import { V4GetSignedReceiptModalComponent } from 'src/app/shared/modal/v4-get-signed-receipt/v4-get-signed-receipt-modal.component';
import { V4SendReceiptModalComponent } from 'src/app/shared/modal/v4-send-receipt-modal/v4-send-receipt-modal.component';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { IHeaderData } from 'src/app/layout/model/header';
import { PdSkeletonComponent } from 'src/app/shared/V4/pd-skeleton/pd-skeleton.component';
import { environment } from 'src/environments/environment';
import type { IReceiveCheckDetails } from 'src/app/modules/receive-payments/model/ReceivePayment';

export type SingleMailDetailSection =
  | 'activity'
  | 'attachments'
  | 'mailed-attachments'
  | 'comments'
  | 'remittance'
  | 'pod'
  | 'signed-receipt'
  | 'last-transactions';

@Component({
  standalone: true,
  selector: 'app-v4-single-mail-detail-panel',
  imports: [
    LucideAngularModule,
    MatTooltipModule,
    DetailSidePanelComponent,
    CommonButtonV4Component,
    CheckPreviewV4Component,
    PoAuditLogListComponent,
    PoSignedReceiptListComponent,
    PoCommentsListComponent,
    PoAttachmentsListComponent,
    TransactionsListV4Component,
    PdSkeletonComponent,
    DatePipe,
    CurrencyPipe,
    NgClass
  ],
  templateUrl: './v4-single-mail-detail-panel.component.html',
  styleUrls: ['./v4-single-mail-detail-panel.component.scss']
})
export class V4SingleMailDetailPanelComponent {
  checkId = input.required<string>();
  row = input<Record<string, unknown> | null>(null);
  isOpen = input(false);
  actionButtons = input<IDetailPanelActionButton[]>([]);

  closed = output<void>();
  actionButtonClicked = output<string>();

  private checkService = inject(CheckService);
  private sharedService = inject(SharedService);
  private localStorageService = inject(LocalStorageService);
  private alertService = inject(V4AlertService);
  private vendorService = inject(VendorService);
  private psbService = inject(PsbService);
  private paymentsService = inject(PaymentsService);
  private paymentsV4Service = inject(PaymentsV4Service);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private datePipe = inject(DatePipe);
  private headerService = inject(HeaderService);

  isPanelExpanded = signal(false);
  collapsedCards = signal<Record<string, boolean>>({});

  readonly actionTiles = [
    { key: 'activity',       label: 'Activity Log',       icon: 'activity'       },
    { key: 'comments',       label: 'Comments',            icon: 'message-square' },
    { key: 'attachments',    label: 'Attachments',         icon: 'paperclip'      },
    { key: 'remittance',     label: 'Remittance',          icon: 'receipt'        },
    { key: 'pod',            label: 'Proof of Delivery',   icon: 'truck'          },
    { key: 'signed-receipt', label: 'Signed Receipt',      icon: 'file-check'     },
  ];

  toggleCard(key: string): void {
    this.collapsedCards.update(s => ({ ...s, [key]: !s[key] }));
  }

  isCardCollapsed(key: string): boolean {
    return !!this.collapsedCards()[key];
  }

  // State
  isClientUser = signal(false);
  checkData = signal<ICheckDetailsData | null>(null);
  trackingData = signal<ICheckMailTrackDetails | null>(null);
  activityLogs = signal<IActivityEntry[]>([]);
  attachmentsList = signal<IAttachmentEntry[]>([]);
  commentsList = signal<ICommentEntry[]>([]);
  isLoading = signal(false);
  isVoiding = signal(false);
  isDeleting = signal(false);
  openActionSection = signal<SingleMailDetailSection | null>('activity');
  isAddingComment = signal(false);
  deletingAttachmentId = signal<string | null>(null);

  // Payee Summary / Vendor Credit / Statement
  payeeSummary = signal<IOtherDetails | null>(null);
  lastTransactions = signal<ICheckPayeeSummary[] | null>(null);
  vendorCreditData = signal<{ amount: string; vendor_credit_no?: string }[] | null>(null);
  vendorCreditTotal = signal<string>('$0.00');
  statements = signal<IPaidStatement[] | null>(null);
  activeTab = signal<'summary' | 'vendor-credit' | 'statement'>('summary');

  // Proof of Delivery + Signed Receipt
  podAttachments = signal<IPodDetails[] | null>(null);
  signatureUrl = signal<string | null>(null);

  checkStatusMap: Record<string, ICheckStatus> = {};

  // Computed properties
  groupMailingDetails = computed(() => this.checkData()?.check_mailing_group ?? null);
  remittanceData = computed(() => this.checkData()?.remittance ?? []);
  remittanceType = computed(() => this.checkData()?.remittance_type ?? 0);
  remittanceTotalAmount = computed(() => this.checkData()?.remittanceTotalAmount ?? 0);
  previewFileUrl = computed(() => this.checkData()?.preview_file ?? null);

  /** Maps API POD data to the pod-list-v4 component shape. */
  podForList = computed<IPodActivityEntry[]>(() => {
    const list = this.podAttachments();
    if (!list?.length) return [];
    return list.map((item) => ({
      date: item.formated_date,
      user: item.user_name,
      file: item.file_name ?? item.file_path ?? '',
      publicUrl: item.public_url,
      encryptedId: item.encrypted_id
    }));
  });

  /** Maps last transactions to the transactions-list-v4 component shape. */
  transactionsForList = computed<ITransactionListEntry[]>(() => {
    const list = this.lastTransactions();
    if (!list?.length) return [];
    return list.map((t) => ({
      date: t.date ?? '',
      description: t.memo ?? '-',
      amount: t.amount ? `$${t.amount}` : '$0.00',
      status: this.checkStatusMap[t.status]?.statusShortDescription ?? String(t.status ?? ''),
      method: t.account ?? 'Check'
    }));
  });

  transactionsTotal = computed(() => {
    const list = this.lastTransactions();
    if (!list?.length) return '$0.00';
    const total = list.reduce((sum, t) => {
      const n = parseFloat(t.amount ?? '0');
      return sum + (Number.isNaN(n) ? 0 : n);
    }, 0);
    return `$${total.toFixed(2)}`;
  });

  /**
   * Truncates a filename to 25 characters, appending "..." when longer.
   * Hover tooltip shows the full name.
   */
  truncateFileName(name: string | null | undefined): string {
    const value = name ?? '';
    return value.length > 30 ? `${value.slice(0, 30)}...` : value;
  }

  // Mirrors v3 CheckActivityLogComponent.formatDate. The activities
  // endpoint returns `date` pre-formatted as "DD Mon YYYY - HH:MM am/pm";
  // we re-shape it to "MM-DD-YYYY HH:MM AM/PM" via string splitting.
  // Backend follow-up: standardise on an ISO `created_at` so DatePipe
  // can own the formatting and this helper can be retired.
  formatActivityDate(item: IActivityEntry): string {
    const raw = item.date;
    if (!raw) return '';
    const [datePart, timePart] = raw.split(' - ');
    if (!datePart || !timePart) return raw;
    const [day, month, year] = datePart.split(' ');
    const months: Record<string, string> = {
      Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
      Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12'
    };
    const monthNum = months[month];
    if (!monthNum) return raw;
    return `${monthNum}-${day.padStart(2, '0')}-${year} ${timePart.toUpperCase()}`;
  }

  /** Whether the Last 10 Transactions tab should show (matches V3 isCheckShowData). */
  showLastTransactions = computed(() => !!this.lastTransactions()?.length);

  // Check preview
  checkDataForPreview = computed<IReceiveCheckDetails | null>(() => {
    const d = this.checkData();
    if (!d) return null;
    return {
      uuid: d.uuid,
      chequeSerialNumber: d.serialNumber,
      chequeIssueDate: d.date,
      chequeStatus: d.status,
      chequeAmount: d.amount,
      chequeMemo: d.memo ?? '',
      chequeNote: '',
      chequeInvoiceNumber: d.invoiceNumber ?? '',
      chequeAccountNumber: d.accountNumber ?? '',
      address: [d.payeeAddress1, d.payeeCity, d.payeeState, d.payeeZip]
        .filter(Boolean)
        .join(', '),
      payeeName: d.payee?.payeeName ?? d.payeeCompanyName ?? '',
      payeeCompanyName: d.payeeCompanyName ?? '',
      payeeAddressLine1: d.payeeAddress1 ?? '',
      payeeAddressLine2: d.payeeAddress2 ?? '',
      payeeCity: d.payeeCity ?? '',
      payeeState: d.payeeState ?? '',
      payeeZip: d.payeeZip ?? '',
      bankName: d.bankName ?? '',
      chequeId: d.id,
      status: d.status,
      receivedType: 0,
      amounyInWords: d.amountInWord ?? '',
      metaData: [],
      customField1: '',
      customField2: '',
      customField3: '',
      referenceId: d.id,
      recurringMetaData: null as unknown as IReceiveCheckDetails['recurringMetaData'],
      account_details: {
        bankAccountAccountName: d.bankAccount?.bankAccountName ?? '',
        bankAccountAccountNumber: d.accountNumber ?? '',
        bankAccountAddressLine1: '',
        bankAccountAddressLine2: '',
        bankAccountAddress: '',
        bankAccountCity: '',
        bankAccountState: '',
        bankAccountZip: '',
        bankAccountRoutingNumber: ''
      }
    } as IReceiveCheckDetails;
  });

  // Panel header config
  panelTitle = computed(() => {
    const check = this.checkData();
    const row = this.row();
    const amt = check?.amount ?? row?.['cheque_amount'];
    return amt ? `$${parseFloat(String(amt)).toFixed(2)}` : '';
  });

  panelTitleSuffix = computed(() => {
    const name = this.panelPayeeName();
    return name ? `to ${name}` : '';
  });

  panelSubtitle = computed(() => {
    const check = this.checkData();
    const row = this.row();
    const createdAt = row?.created_at as string | undefined;
    const parts = [
      'CHECK',
      check?.memo || check?.serialNumber || '',
      createdAt ? this.formatDateTime(createdAt) : ''
    ].filter(Boolean);
    return parts.join(' • ');
  });

  private panelPayeeName = computed(() => {
    const check = this.checkData();
    const row = this.row();
    const payeeName = check?.payee?.payeeName ?? row?.['payee_name'];
    return payeeName ? String(payeeName) : '';
  });

  /** Action buttons shown in the side-panel header. Clone + Pay as primary buttons; Edit/Void/Delete in ⋮ overflow. */
  panelActionButtons = computed<IDetailPanelActionButton[]>(() => {
    const cd = this.checkData();
    // Match v3 check-view: client users cannot take any action on a check.
    if (!cd || this.isClientUser()) return [];

    const actionList = this.checkStatusMap[cd.status];

    // Edit — mirrors v3 `enableEdit` gating.
    const enableEdit =
      actionList?.isItEditAble === 1 || actionList?.statusValue === 50;

    // Pay — only when editable + valid bank account.
    const payAble =
      enableEdit &&
      cd.status !== 35 &&
      cd.status !== 50 &&
      cd.bankAccount?.bankAccountName != null &&
      cd.bankAccount?.bankAccountNickName != null;

    // Build ⋮ overflow menu items: Edit, Void, Delete.
    const menuItems: NonNullable<IDetailPanelActionButton['menu']> = [];
    if (enableEdit) {
      menuItems.push({ label: 'Edit', key: 'edit', lucideIcon: 'pencil' });
    }
    if (actionList?.isItVoidAble === 1) {
      menuItems.push({ label: 'Void', key: 'void', lucideIcon: 'ban' });
    }
    if (actionList?.isItDeleteAble === 1) {
      menuItems.push({ label: 'Delete', key: 'delete', lucideIcon: 'trash-2', danger: true });
    }

    const buttons: IDetailPanelActionButton[] = [
      { label: 'Clone', variant: 'outline', key: 'clone', lucideIcon: 'copy' }
    ];

    if (payAble) {
      buttons.push({ label: 'Pay', variant: 'outline', key: 'pay', lucideIcon: 'dollar-sign' });
    }

    if (menuItems.length > 0) {
      buttons.push({
        label: '',
        variant: 'outline',
        key: 'more',
        menu: menuItems,
        menuHeading: 'ACTIONS'
      });
    }

    return buttons;
  });

  panelStatusBadge = computed<IDetailPanelStatusBadge | undefined>(() => {
    const check = this.checkData();
    const row = this.row();
    const status = check?.status ?? row?.['cheque_status'];
    if (status == null) return undefined;
    const statusNum = Number(status);
    const statusInfo = this.checkStatusMap[statusNum];
    if (!statusInfo) return undefined;
    const palette = this.getStatusPalette(statusInfo.statusShortDescription);
    return {
      text: statusInfo.statusShortDescription,
      color: palette.color,
      bgColor: palette.bgColor
    };
  });

  constructor() {
    this.loadCheckStatusMap();
    this.watchClientUserState();

    const loadTrigger = computed(() => this.checkId());
    toObservable(loadTrigger)
      .pipe(
        takeUntilDestroyed(),
        filter((id) => !!id),
        switchMap((id) => {
          // Reset all state
          this.checkData.set(null);
          this.trackingData.set(null);
          this.activityLogs.set([]);
          this.attachmentsList.set([]);
          this.commentsList.set([]);
          this.payeeSummary.set(null);
          this.lastTransactions.set(null);
          this.vendorCreditData.set(null);
          this.vendorCreditTotal.set('$0.00');
          this.statements.set(null);
          this.podAttachments.set(null);
          this.signatureUrl.set(null);
          this.activeTab.set('summary');
          this.openActionSection.set('activity');
          this.isLoading.set(true);

          const fallback = () => of({ success: false, data: null });

          // Phase 1: Fetch primary data
          return forkJoin({
            details: this.checkService
              .getChecksById(id)
              .pipe(catchError(() => fallback())),
            tracking: this.checkService
              .getCheckTracking(id)
              .pipe(catchError(() => fallback())),
            activity: this.checkService
              .getCheckActivity(id)
              .pipe(catchError(() => fallback())),
            attachments: this.checkService
              .getCheckAttachment(id)
              .pipe(catchError(() => fallback())),
            comments: this.sharedService
              .getAllComments('checks', id)
              .pipe(catchError(() => fallback()))
          }).pipe(
            // Phase 2: Fetch dependent data using IDs from Phase 1
            switchMap((firstRes: any) => {
              // Set Phase 1 data immediately
              if (firstRes.details?.success) {
                this.checkData.set(firstRes.details.data);
                this.signatureUrl.set(firstRes.details.data?.signatureUrl ?? null);
              }
              if (firstRes.tracking?.success) {
                this.trackingData.set(firstRes.tracking.data);
              }
              if (firstRes.activity?.success) {
                this.activityLogs.set(firstRes.activity.data ?? []);
              }
              if (firstRes.attachments?.success) {
                this.attachmentsList.set(firstRes.attachments.data ?? []);
              }
              if (firstRes.comments?.success) {
                this.commentsList.set(firstRes.comments.data ?? []);
              }

              const payeeId = firstRes.details?.data?.payee?.payeeId;
              const uuid = firstRes.details?.data?.uuid;
              const zilPaymentStatus =
                firstRes.details?.data?.zilPaymentStatus;
              // Match v3: only fetch statements for checks that have actually
              // been paid through the zil-payments pipeline. The backend
              // otherwise hands back a synthetic "PENDING / created" row for
              // unpaid checks because it uses the check's own uuid as the
              // payment id. v3 sidesteps this by only calling the endpoint
              // when a real payment uuid is on the query-string.
              const hasRealPayment =
                !!uuid &&
                (zilPaymentStatus === 'COMPLETED' ||
                  zilPaymentStatus === 'PROCESSING');

              return forkJoin({
                payeeSummary: payeeId
                  ? this.checkService
                      .getPayeeSummary(payeeId)
                      .pipe(catchError(() => of(null)))
                  : of(null),
                vendorCredit: this.vendorService
                  .getVendorCreditApplied({
                    referenceId: id,
                    referenceType: 2
                  })
                  .pipe(catchError(() => of(null))),
                statements: hasRealPayment
                  ? this.psbService
                      .getPaidStatements(uuid)
                      .pipe(catchError(() => of({ success: false, data: null })))
                  : of({ success: false, data: null }),
                pod: uuid
                  ? this.paymentsService
                      .getPodFile('zil-payments', uuid)
                      .pipe(catchError(() => of({ success: false, data: null })))
                  : of({ success: false, data: null })
              });
            }),
            finalize(() => this.isLoading.set(false))
          );
        })
      )
      .subscribe({
        next: (res: any) => {
          if (!res) return;

          // Payee summary
          if (res.payeeSummary) {
            this.payeeSummary.set(res.payeeSummary.other ?? null);
            this.lastTransactions.set(res.payeeSummary.data ?? null);
          }

          // Proof of Delivery
          if (res.pod?.success && res.pod?.data) {
            this.podAttachments.set(res.pod.data as IPodDetails[]);
          }

          // Vendor credit
          if (res.vendorCredit?.data) {
            const items = res.vendorCredit.data as {
              amount: string;
              vendor_credit_no?: string;
            }[];
            this.vendorCreditData.set(items);
            let total = 0;
            items.forEach((e) => {
              const m = String(e.amount ?? '').match(/[\d.]+/);
              if (m) total += parseFloat(m[0]);
            });
            this.vendorCreditTotal.set(`$${total.toFixed(2)}`);
          }

          // Statements
          if (res.statements?.success) {
            this.statements.set(res.statements.data ?? null);
          }
        }
      });
  }

  private loadCheckStatusMap(): void {
    if (this.localStorageService.getItem('check_status')) {
      this.checkStatusMap = this.localStorageService.getItem('check_status');
      return;
    }
    this.checkService
      .getCheckStatus()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res?.success) {
          this.checkStatusMap = res.data;
          this.localStorageService.setItem('check_status', res.data);
        }
      });
  }

  /**
   * Match v3 check-view: when the environment is `csnhc` and the logged-in
   * user is a client, no action buttons (Clone/Edit/Pay/Void/Delete) should
   * render. Mirrors check-view.component.ts:179-191.
   */
  private watchClientUserState(): void {
    if (environment.env_id !== 'csnhc') return;
    // eslint-disable-next-line no-underscore-dangle
    this.headerService._headerData
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        const headerData = res as unknown as IHeaderData;
        if (headerData?.isLoggedInAsClient) {
          this.isClientUser.set(true);
        }
      });
  }

  formatDate(dateStr: string | undefined | null): string {
    if (!dateStr) return '\u2014';
    return this.datePipe.transform(dateStr, 'MM/dd/yyyy') ?? dateStr;
  }

  formatPayeeCityLine(): string {
    const d = this.checkData();
    if (!d) return '';
    const city = (d.payeeCity ?? '').trim();
    const stateZip = [d.payeeState, d.payeeZip]
      .map((p) => (p ?? '').toString().trim())
      .filter(Boolean)
      .join(' ');
    const country = (d.payeeCountry ?? '').trim();
    return [city, stateZip, country].filter(Boolean).join(', ');
  }

  formatDateTime(dateStr: string | undefined | null): string {
    if (!dateStr) return '\u2014';
    // The API returns dates like "04/15/2026_05:30 am" — replace underscore with space
    const normalized = String(dateStr).replace(/_/g, ' ');
    try {
      return this.datePipe.transform(normalized, 'MM/dd/yyyy hh:mm a') ?? normalized;
    } catch {
      return normalized;
    }
  }

  readonly tabs = [
    { key: 'summary'       as const, label: 'Summary'       },
    { key: 'vendor-credit' as const, label: 'Vendor credit' },
    { key: 'statement'     as const, label: 'Statement'     },
  ];

  setTab(tab: 'summary' | 'vendor-credit' | 'statement'): void {
    this.activeTab.set(tab);
  }

  payeeDisplay = computed(() => {
    const d = this.checkData();
    if (!d) return null;
    const name = d.payee?.payeeName ?? d.payeeCompanyName ?? '';
    const email = d.payeeEmail ?? '';
    const phone = d.payeePhone ?? '';
    const city = (d.payeeCity ?? '').trim();
    const stateZip = [d.payeeState, d.payeeZip].map(p => (p ?? '').toString().trim()).filter(Boolean).join(' ');
    const address = [d.payeeAddress1, d.payeeAddress2, [city, stateZip, (d.payeeCountry ?? '').trim()].filter(Boolean).join(', ')].filter(Boolean).join(', ');
    const initials = (name || '?').trim().split(/\s+/).map(w => w[0] ?? '').slice(0, 2).join('').toUpperCase() || '?';
    return { name, email, phone, address, initials, id: d.payee?.payeeId ?? null };
  });

  statusTimeline = computed(() => this.statements() ?? []);

  timelineColor(status: string | undefined): string {
    const s = (status ?? '').toLowerCase();
    if (['completed', 'success', 'cashed', 'approved'].some(k => s.includes(k))) return 'var(--v4-common-green-color)';
    if (['failed', 'void', 'cancelled', 'rejected', 'returned'].some(k => s.includes(k))) return 'var(--v4-common-red-color)';
    if (['pending', 'processing', 'new'].some(k => s.includes(k))) return 'var(--v4-common-yellow-color)';
    return 'var(--v4-common-blue-color)';
  }

  onOpenPayee(): void {
    const id = this.payeeDisplay()?.id;
    if (!id) return;
    const url = this.router.createUrlTree(['/v4/manage/payee', id]);
    window.open(url.toString(), '_blank');
  }

  toggleSection(section: string): void {
    this.openActionSection.update((current) =>
      current === section ? null : (section as SingleMailDetailSection)
    );
  }

  addComment(text: string): void {
    const comment = text.trim();
    if (!comment) return;
    this.isAddingComment.set(true);
    this.checkService
      .addCommentCheck(this.checkId(), { comment })
      .pipe(finalize(() => this.isAddingComment.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (res: any) => {
        if (res.success) { this.refetchComments(); this.refetchActivity(); }
      }});
  }

  onDeleteComment(encryptedId: string): void {
    if (!encryptedId) return;
    this.alertService
      .confirmAlert({ content: 'Delete this comment?', doneMsg: 'Yes, delete', cancelMsg: 'Cancel' })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.sharedService
          .deleteComment('checks', this.checkId(), encryptedId)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe((res: any) => {
            if (res?.success) { this.refetchComments(); this.refetchActivity(); }
          });
      });
  }

  onAttachmentFileSelected(file: File): void {
    this.checkService
      .addCheckAttachment(this.checkId(), file)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (res: any) => {
        if (res?.success) { this.refetchAttachments(); this.refetchActivity(); }
      }});
  }

  onOpenAttachmentEntry(entry: IAttachmentEntry): void {
    const id = entry.id ?? entry.encrypted_id;
    if (!id) return;
    this.viewAttachment(id as string | number);
  }

  onDeleteAttachmentEntry(entry: IAttachmentEntry): void {
    const id = entry.id ?? entry.encrypted_id;
    if (!id) return;
    this.alertService
      .confirmAlert({ content: 'This attachment will be deleted permanently.', cancelMsg: 'No, Cancel!', doneMsg: 'Yes, Delete it!' })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.deletingAttachmentId.set(String(id));
        this.checkService
          .deleteCheckAttachment(this.checkId(), String(id))
          .pipe(finalize(() => this.deletingAttachmentId.set(null)), takeUntilDestroyed(this.destroyRef))
          .subscribe((res: any) => {
            if (res?.success) { this.refetchAttachments(); this.refetchActivity(); }
          });
      });
  }

  private refetchCheckData(): void {
    const id = this.checkId();
    if (!id) return;
    this.checkService
      .getChecksById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res: any) => {
        if (res?.success && res?.data) {
          this.checkData.set(res.data);
        }
      });
  }

  refetchAttachments(): void {
    this.checkService
      .getCheckAttachment(this.checkId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res: any) => {
        if (res?.success) {
          this.attachmentsList.set(res.data ?? []);
        }
      });
  }

  viewAttachment(attachmentId: string | number): void {
    if (!attachmentId) return;
    this.checkService
      .openCheckAttachment(this.checkId(), String(attachmentId))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res.success && res.data) {
          window.open(res.data, '_blank');
        }
      });
  }

  openTrackingUrl(): void {
    const trackingCode = this.trackingData()?.trackingCode;
    if (trackingCode) {
      window.open(getMailTrackUrl(trackingCode), '_blank');
    }
  }

  downloadPreviewFile(): void {
    const url = this.previewFileUrl();
    if (url) {
      window.open(url, '_blank');
    }
  }

  navigateToGroupMailing(groupId: string): void {
    this.router.navigate([
      '/v4/manage/business-tools/mail-dashboard/group-mailing/details',
      groupId
    ]);
  }

  downloadPod(encryptedId: string): void {
    const uuid = this.checkData()?.uuid;
    if (!uuid || !encryptedId) return;
    this.paymentsService
      .downloadPodFile('zil-payments', uuid, encryptedId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res?.success && res?.data) {
          window.open(res.data, '_blank');
        }
      });
  }

  openSignatureUrl(): void {
    const url = this.signatureUrl();
    if (url) window.open(url, '_blank');
  }

  handleSignedReceipt(): void {
    const cd = this.checkData();
    if (!cd) return;

    if (!this.signatureUrl()) {
      const statusDesc = this.checkStatusMap[cd.status]?.statusShortDescription;
      const canSubmit = !(
        (statusDesc !== 'Mailed' && cd.zilPaymentStatus !== 'COMPLETED') ||
        cd.podStatus === 1
      );

      this.dialog
        .open(V4GetSignedReceiptModalComponent, {
          maxWidth: '550px',
          width: '93%',
          disableClose: true,
          panelClass: 'paddingless-modal-rounded',
          data: {
            transactionId: cd.uuid,
            zilId: cd.uuid,
            payee: { email: cd.payeeEmail, phone: cd.payeePhone },
            canSubmitSignedReceiptRequest: canSubmit,
            previewData: {
              senderName: cd.bankAccount?.bankAccountName ?? '',
              payeeName: cd.payee?.payeeName ?? '',
              amount: cd.amount ?? '',
              address: cd.payeeAddress1 ?? '',
              reference: cd.invoiceNumber,
              type: 'CHECK',
              paymentDate: cd.date ?? ''
            }
          }
        })
        .afterClosed()
        .subscribe((res) => {
          if (res?.success) {
            this.checkData.set({
              ...cd,
              payment_receipts_id: '10'
            } as ICheckDetailsData);
          }
        });
    } else {
      this.dialog.open(V4SendReceiptModalComponent, {
        panelClass: 'paddingless-modal-rounded',
        maxWidth: '500px',
        width: '93%',
        disableClose: true,
        data: {
          transactionId: cd.uuid,
          payee: { email: cd.payeeEmail, phone: cd.payeePhone }
        }
      });
    }
  }

  onPanelActionClick(key: string): void {
    const cd = this.checkData();
    if (!cd) return;

    switch (key) {
      case 'clone':
        this.closed.emit();
        this.paymentsV4Service.openSendModal({
          mode: SendPaymentMode.Clone,
          paymentId: cd.uuid
        });
        break;
      case 'edit':
      case 'pay':
        this.closed.emit();
        this.paymentsV4Service.openSendModal({
          mode: SendPaymentMode.Edit,
          paymentId: cd.uuid
        });
        break;
      case 'void':
        this.alertService
          .confirmAlert({
            content: 'Are you sure you want to void this check?',
            cancelMsg: 'No, Cancel!',
            doneMsg: 'Yes, Void it!'
          })
          .afterClosed()
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe((confirmed) => {
            if (!confirmed) return;
            this.isVoiding.set(true);
            this.checkService
              .voidCheck(this.checkId())
              .pipe(
                finalize(() => this.isVoiding.set(false)),
                takeUntilDestroyed(this.destroyRef)
              )
              .subscribe({
                next: (res: any) => {
                  if (res?.success) {
                    this.alertService.successAlert({
                      title: 'Success!',
                      content: 'Check voided.',
                      close: true
                    });
                    // Refresh so the panel's action buttons re-evaluate
                    // against the new status (matches v3's `disableActions(2)`).
                    this.refetchCheckData();
                    this.closed.emit();
                  }
                }
              });
          });
        break;
      case 'delete':
        // Matches v3 `onDeleteCheck`.
        this.alertService
          .confirmAlert({
            content: 'Are you sure you want to delete this check?',
            cancelMsg: 'No, Cancel!',
            doneMsg: 'Yes, Delete it!'
          })
          .afterClosed()
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe((confirmed) => {
            if (!confirmed) return;
            this.isDeleting.set(true);
            this.checkService
              .deleteCheck(this.checkId())
              .pipe(
                finalize(() => this.isDeleting.set(false)),
                takeUntilDestroyed(this.destroyRef)
              )
              .subscribe({
                next: (res: any) => {
                  if (res?.success) {
                    this.alertService.successAlert({
                      title: 'Success!',
                      content: 'Check deleted.',
                      close: true
                    });
                    this.refetchCheckData();
                    this.closed.emit();
                  }
                }
              });
          });
        break;
    }

    this.actionButtonClicked.emit(key);
  }

  editDeviceName(deviceAddress: string | undefined | null): void {
    if (!deviceAddress) return;
    this.dialog
      .open(DeviceModalV4Component, {
        maxWidth: '510px',
        width: '93%',
        disableClose: true,
        panelClass: 'paddingless-modal-rounded',
        data: { deviceAddress }
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res?.success) {
          this.refetchActivity();
        }
      });
  }

  refetchActivity(): void {
    this.checkService
      .getCheckActivity(this.checkId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res: any) => {
        if (res?.success) {
          this.activityLogs.set(res.data ?? []);
        }
      });
  }

  private refetchComments(): void {
    this.sharedService
      .getAllComments('checks', this.checkId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res: any) => {
        if (res?.success) {
          this.commentsList.set(res.data ?? []);
        }
      });
  }

  private getStatusPalette(statusName: string): { color: string; bgColor: string } {
    const s = statusName.toLowerCase();
    if (['completed', 'success', 'active', 'approved', 'cashed', 'deposited'].some(k => s.includes(k)))
      return {
        color: 'var(--v4-common-green-color)',
        bgColor: 'var(--v4-badge-success-bg-color)'
      };
    if (['void', 'failed', 'rejected', 'canceled', 'cancelled', 'returned', 'declined', 'stopped'].some(k => s.includes(k)))
      return {
        color: 'var(--v4-common-red-color)',
        bgColor: 'var(--v4-badge-error-bg-color)'
      };
    if (['pending', 'approval', 'scheduled', 'hold'].some(k => s.includes(k)))
      return {
        color: 'var(--v4-common-yellow-color)',
        bgColor: 'var(--v4-badge-warning-bg-color)'
      };
    if (['saved', 'new', 'draft'].some(k => s.includes(k)))
      return {
        color: 'var(--v4-common-violet-color)',
        bgColor: 'var(--v4-badge-accent-bg-color)'
      };
    return {
      color: 'var(--v4-common-blue-color)',
      bgColor: 'var(--v4-badge-info-bg-color)'
    };
  }
}

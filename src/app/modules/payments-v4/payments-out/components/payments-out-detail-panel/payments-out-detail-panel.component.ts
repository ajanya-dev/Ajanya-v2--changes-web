import {
  IPdMetaPart,
  pdMetaLine,
  PdMetaLinesComponent
} from 'src/app/shared/V4/pd-meta-lines/pd-meta-lines.component';
import { PdSkeletonComponent } from 'src/app/shared/V4/pd-skeleton/pd-skeleton.component';
import {
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  output,
  signal
} from '@angular/core';
import {
  CurrencyPipe,
  DatePipe,
  formatDate,
  NgClass,
  NgTemplateOutlet
} from '@angular/common';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
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
  take,
  takeUntil,
  tap
} from 'rxjs';
import { MatDialogRef, MatDialog } from '@angular/material/dialog';
import { PusherService } from 'src/app/core/services/pusher.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { QrCodeScannerModalV4Component } from 'src/app/modules/payments/shared/components/modals/qr-code-scanner-modal/v4/qr-code-scanner-modal-v4.component';

import {
  DetailSidePanelComponent,
  IDetailPanelActionButton,
  IDetailPanelStatusBadge
} from 'src/app/shared/V4/detail-side-panel/detail-side-panel.component';
import { CheckPreviewV4Component } from 'src/app/shared/V4/for-side-drawer/check-preview-v4/check-preview-v4.component';
import {
  ITransactionListEntry,
  TransactionsListV4Component
} from 'src/app/shared/V4/for-side-drawer/transactions-list-v4/transactions-list-v4.component';

import { ICommonTransactionTableData } from 'src/app/models/v3-common';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';

import { CheckService } from 'src/app/shared/service/check/check.service';
import { VendorService } from 'src/app/shared/service/vendor/vendor.service';
import { PsbService } from 'src/app/shared/service/psb/psb.service';
import { getMailTrackUrl } from 'src/app/shared/utils/v4-external.util';

import { IApiRes } from 'src/app/models/api';
import { IGetRemitance } from 'src/app/models/common';
import {
  IPaymentDetails,
  IPaymentsProofPayload,
  IPodDetails
} from 'src/app/modules/payments/model/payments';
import {
  ICheckDetailsData,
  ICheckPayeeSummary,
  ICheckStatus,
  ICheckMailTrackDetails,
  IOtherDetails
} from 'src/app/modules/check/model/check';
import { IReceiveCheckDetails } from 'src/app/modules/receive-payments/model/ReceivePayment';
import { IPaidStatement } from 'src/app/models/payment-switch-board';
import {
  getPaymentStatusBadge,
  getCheckStatusBadgeFromApi
} from 'src/app/modules/v4-pages/v4-dashboard/utils/transaction-status.utils';

import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { PaymentsV4Service } from 'src/app/modules/payments-v4/shared/services/payments-v4.service';
import { V4DetailPanelService } from 'src/app/shared/service/v4-detail-panel/v4-detail-panel.service';
import { SendPaymentMode } from 'src/app/modules/payments-v4/send-payment/models/send-payment.enums';
import {
  V4SendPaymentProofModalComponent,
  shareSectionTooltip,
  type ShareSectionType
} from 'src/app/shared/modal/v4-send-payment-proof-modal/v4-send-payment-proof-modal.component';
import { V4GetSignedReceiptModalComponent } from 'src/app/shared/modal/v4-get-signed-receipt/v4-get-signed-receipt-modal.component';
import { V4SendReceiptModalComponent } from 'src/app/shared/modal/v4-send-receipt-modal/v4-send-receipt-modal.component';
import { V4MailTrackingModalComponent } from 'src/app/modules/check/components/v4-mail-tracking-modal/v4-mail-tracking-modal.component';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { V4PayeeBankVerificationDetailsModalComponent } from 'src/app/shared/modal/v4-payee-bank-verification-details-modal/v4-payee-bank-verification-details-modal.component';
import { IPayeeBankVerificationModalData } from 'src/app/models/payee-bank-verification';
import { Utils } from 'src/app/data/utils';
import { faTriangleExclamation } from '@fortawesome/pro-solid-svg-icons';
import {
  PoAuditLogListComponent,
  type IActivityEntry
} from '../common/audit-log-list/audit-log-list.component';
import {
  PoCommentsListComponent,
  type ICommentEntry
} from '../common/comments-list/comments-list.component';
import {
  PoAttachmentsListComponent,
  type IAttachmentEntry
} from '../common/attachments-list/attachments-list.component';
import {
  PoPodListComponent,
  type IPodEntry
} from '../common/pod-list/pod-list.component';
import { PoRemittanceListComponent } from '../common/remittance-list/remittance-list.component';
import { PoSignedReceiptListComponent } from '../common/signed-receipt-list/signed-receipt-list.component';
import { PoMailDetailsListComponent } from '../common/mail-details-list/mail-details-list.component';
import { PoMailedAttachmentsListComponent } from '../common/mailed-attachments-list/mailed-attachments-list.component';
import { MatTooltip } from '@angular/material/tooltip';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';

/** Mirrors the `lg` breakpoint the check preview hides itself at. */
const SMALL_SCREEN_QUERY = '(max-width: 1023.98px)';

export type PanelTab = 'summary' | 'vendor-credit';
export type ActionGridSection =
  | 'audit'
  | 'comments'
  | 'attachments'
  | 'remittance'
  | 'pod'
  | 'signed-receipt'
  | 'cleared-check';

/**
 * Header action row order. Pay leads when it is present, then Clone, then
 * Payment proof; anything not listed (e.g. the bank-verification warning)
 * follows them, and the ⋮ overflow is always last.
 */
const ACTION_BUTTON_ORDER = ['pay', 'clone', 'payment-proof'];

type MenuItem = NonNullable<IDetailPanelActionButton['menu']>[number];

/** The view-panel ⋮ button: grouped "Actions" menu, same as the other view panels. */
const moreButton = (menu: MenuItem[]): IDetailPanelActionButton => ({
  label: '',
  variant: 'outline',
  key: 'more',
  tooltip: 'More actions',
  menu,
  menuHeading: 'Actions'
});

/** Rails that carry no proof of delivery, so the POD action stays hidden. */
const POD_UNSUPPORTED_MODES = ['RTP', 'RIPPLE INTERNATIONAL PAYMENT'];

/**
 * @description Tooltip text for each action-grid card label.
 */
const CARD_TOOLTIPS: Record<string, string> = {
  'Audit Logs': 'See every action taken on this {{itemType}} at a glance.',
  Comments: 'Quick notes added to this {{itemType}}.',
  Attachments: 'All documents attached to this {{itemType}}, in one place.',
  Remittance: 'Payment details shared with the payee, at a glance.',
  'Signed Receipt': "The recipient's signed proof of payment, ready anytime."
};

@Component({
  selector: 'app-payments-out-detail-panel',
  standalone: true,
  imports: [
    PdMetaLinesComponent,
    PdSkeletonComponent,
    NgClass,
    NgTemplateOutlet,
    DatePipe,
    CurrencyPipe,
    LucideAngularModule,
    DetailSidePanelComponent,
    PoAuditLogListComponent,
    PoCommentsListComponent,
    PoAttachmentsListComponent,
    PoPodListComponent,
    PoRemittanceListComponent,
    PoSignedReceiptListComponent,
    PoMailDetailsListComponent,
    PoMailedAttachmentsListComponent,
    CheckPreviewV4Component,
    TransactionsListV4Component,
    CommonButtonV4Component,
    MatTooltip
  ],
  templateUrl: './payments-out-detail-panel.component.html',
  styleUrls: ['./payments-out-detail-panel.component.scss']
})
export class PaymentsOutDetailPanelComponent {
  // ── Inputs / Outputs ──────────────────────────────────────────────────────
  uuid = input.required<string>();
  row = input<ICommonTransactionTableData | null>(null);
  isOpen = input(false);
  backdropZIndex = input(200);

  closed = output<void>();

  // ── Services ──────────────────────────────────────────────────────────────
  private paymentsService = inject(PaymentsService);
  private sharedService = inject(SharedService);
  private checkService = inject(CheckService);
  private vendorService = inject(VendorService);
  private psbService = inject(PsbService);
  private dialog = inject(MatDialog);
  private alertService = inject(V4AlertService);
  private destroyRef = inject(DestroyRef);
  private localStorageService = inject(LocalStorageService);
  private paymentsV4Service = inject(PaymentsV4Service);
  private router = inject(Router);
  private detailPanelService = inject(V4DetailPanelService);
  private pusherService = inject(PusherService);
  private headerService = inject(HeaderService);
  private v3DataTableService = inject(V3DataTableService);

  // ── Shared state ──────────────────────────────────────────────────────────
  details = signal<IPaymentDetails | null>(null);
  isLoading = signal(false);
  activeTab = signal<PanelTab>('summary');
  openActionSection = signal<ActionGridSection | null>(null);
  /** Section/tab keys already fetched for the current uuid (reset on open). */
  private loadedSections = new Set<string>();
  /** Section/tab keys with a request in flight — drives the inline skeleton. */
  private loadingSections = signal<string[]>([]);
  /**
   * Cancels in-flight section requests when the panel switches to another uuid —
   * they no longer sit inside the uuid switchMap, so without this a slow request
   * from the previous payment could land in the newly opened one.
   */
  private panelReset$ = new Subject<void>();
  comments = signal<ICommentEntry[] | null>(null);
  commentPosting = signal(false);
  commentError = signal<string | null>(null);
  attachments = signal<IAttachmentEntry[] | null>(null);
  attachmentUploading = signal(false);
  attachmentError = signal<string | null>(null);
  attachmentPhoneError = signal<string | null>(null);
  // Attach-from-mobile (check-only): SMS link + QR, refreshed live via Pusher.
  attachmentPhoneSending = signal(false);
  attachmentPhoneSent = signal(false);
  attachmentQrLoading = signal(false);
  private qrDialogRef?: MatDialogRef<QrCodeScannerModalV4Component>;
  private readonly attachmentAcceptCheck =
    '.pdf,.txt,.docx,.doc,.csv,.xls,.xlsx,rtf';

  private readonly attachmentAcceptNonCheck =
    '.pdf,.txt,.docx,.doc,.xls,rtf,.xlxs,.csv,.jped,.png';

  attachmentAccept = computed(() =>
    this.isCheckPayment()
      ? this.attachmentAcceptCheck
      : this.attachmentAcceptNonCheck
  );

  deletingAttachmentId = signal<string | null>(null);
  podAttachments = signal<IPodDetails[] | null>(null);
  auditLogs = signal<IActivityEntry[] | null>(null);
  remittance = signal<IGetRemitance | null>(null);
  mailTrackDetails = signal<ICheckMailTrackDetails | null>(null);
  /** O4: mirrors the shared panel's expanded (wide, two-column) state. */
  isPanelExpanded = signal(false);

  // ── Share a section (audit log / comments / attachments / remittance) ─────
  /** Action-grid key → the `share_type` the send-audit-log endpoint expects. */
  private readonly SHARE_TYPES: Record<string, ShareSectionType> = {
    audit: 'audit_log',
    comments: 'comments',
    attachments: 'attachments',
    remittance: 'remittance',
    pod: 'proof_of_delivery'
  };

  /**
   * Dot background for a status-timeline stage. Same mapping as
   * `panelStatusBadge`, so a stage and the header badge never disagree.
   */
  timelineStatusBg(status: string | undefined): string {
    return getPaymentStatusBadge(status ?? '').textColor;
  }

  /** Compact payee display for the O3/O4 "Payee details" section. */
  payeeDisplay = computed(() => {
    const d = this.details();
    const cd = this.checkData();
    const name =
      d?.payee?.name ??
      cd?.payee?.payeeName ??
      this.row()?.payee_name ??
      d?.payee_name ??
      '';
    const email = d?.payee?.email ?? cd?.payeeEmail ?? '';
    const phone = d?.payee?.phone ?? cd?.payeePhone ?? '';
    const id =
      cd?.payee?.payeeId ?? (d?.payee as { id?: string | number })?.id ?? null;
    const address = [
      d?.payee?.addressLine1 ?? cd?.payeeAddress1,
      d?.payee?.addressLine2 ?? cd?.payeeAddress2,
      d?.payee?.city ?? cd?.payeeCity,
      d?.payee?.state ?? cd?.payeeState,
      d?.payee?.zip ?? cd?.payeeZip,
      d?.payee?.country ?? cd?.payeeCountry
    ]
      .map((part) => (part == null ? '' : String(part).trim()))
      .filter(Boolean)
      .join(', ');
    const initials =
      (name || '?')
        .trim()
        .split(/\s+/)
        .map((w) => w[0] ?? '')
        .slice(0, 2)
        .join('')
        .toUpperCase() || '?';
    return { name, email, phone, address, id, initials };
  });

  onOpenPayee(): void {
    const { id } = this.payeeDisplay();
    if (id) {
      const url = this.router.createUrlTree(['/v4/manage/payee', id]);
      window.open(url.toString(), '_blank');
    }
  }

  /** O3: per-card collapse state — the ⌃ chevron on each card header toggles it. */
  collapsedCards = signal<Record<string, boolean>>({});

  isCardCollapsed(key: string): boolean {
    return !!this.collapsedCards()[key];
  }

  toggleCard(key: string): void {
    this.collapsedCards.update((s) => ({ ...s, [key]: !s[key] }));
  }

  // ── CHECK-only state ──────────────────────────────────────────────────────
  private readonly ACH_STATUSES = [
    301, 302, 303, 304, 305, 306, 311, 312, 313, 400, 410, 411, 412, 420, 430,
    431, 432, 433, 440, 441
  ];

  private readonly MAIL_SECTION_STATUSES = [50, 4, 5, 6, 7, 2, 807];

  checkStatusMap = signal<Record<string, ICheckStatus> | null>(null);

  checkData = signal<ICheckDetailsData | null>(null);

  payeeSummary = signal<IOtherDetails | null>(null);
  lastTransactions = signal<ICheckPayeeSummary[] | null>(null);
  vendorCreditData = signal<
    { amount: string; vendor_credit_no?: string }[] | null
  >(null);

  vendorCreditTotal = signal<string>('$0.00');
  statements = signal<IPaidStatement[] | null>(null);

  /** Timeline shows the latest 2 status changes until expanded (or panel expanded). */
  timelineShowAll = signal(false);
  visibleStatements = computed<IPaidStatement[]>(() => {
    const list = this.statements() ?? [];
    return this.timelineShowAll() || this.isPanelExpanded()
      ? list
      : list.slice(0, 2);
  });

  hasStatementChanges = computed(() =>
    (this.statements() ?? []).some((s) => s.changes != null && s.changes !== '')
  );

  // ── Panel header ──────────────────────────────────────────────────────────
  panelTitle = computed(() => {
    const amt = this.row()?.amount;
    return amt ? `$${parseFloat(amt).toFixed(2)}` : '';
  });

  /** Inline gray text after the amount: "to John Myres" (design O3 header). */
  panelTitleSuffix = computed(() => {
    const name = this.row()?.payee_name;
    return name ? `to ${name}` : '';
  });

  /** Meta under the title: two lines collapsed, one line expanded (panelMeta template). */
  panelMetaLines = computed<IPdMetaPart[][]>(() => {
    const row = this.row();
    if (!row) return [];
    const source =
      row.source_name ??
      (this.details()?.source as { name?: string } | undefined)?.name;
    const created = this.createdDateText();
    return [
      pdMetaLine([
        { label: 'Method:', value: row.transfer_type },
        { label: 'Ref:', value: row.reference_no }
      ]),
      pdMetaLine([
        { label: 'Source:', value: source },
        { label: 'Created:', value: created !== '—' ? created : undefined }
      ])
    ].filter((l) => l.length);
  });

  createdDateText = computed(() =>
    this.formatPanelDate(this.details()?.createdAt)
  );

  updatedDateText = computed(() =>
    this.formatPanelDate(this.details()?.updatedAt)
  );

  private formatPanelDate(value?: string): string {
    if (!value) return '—';
    const parsed = new Date(value.replace('_', 'T'));
    return Number.isNaN(parsed.getTime())
      ? value.replace('_', ' ')
      : formatDate(parsed, 'MM/dd/yyyy hh:mm a', 'en-US');
  }

  panelStatusBadge = computed<IDetailPanelStatusBadge | undefined>(() => {
    const row = this.row();
    const checkMap = this.checkStatusMap();
    // Rows opened from the check list carry only the numeric `cheque_status`
    // (no status text), so the map is the only source of a label there.
    const checkStatusCode = row?.cheque_status ?? this.checkData()?.status;
    const badge =
      checkMap &&
      checkStatusCode != null &&
      checkMap[checkStatusCode] &&
      row?.status !== 'CANCELED'
        ? getCheckStatusBadgeFromApi(
            checkMap,
            checkStatusCode,
            row?.status ?? ''
          )
        : row?.status
          ? getPaymentStatusBadge(row.status)
          : undefined;
    if (!badge) return undefined;
    // The list shows the map's own short description ("New"); the badge helper
    // remaps New/Pay to "Pending", so prefer the raw label to match the table.
    const checkLabel =
      checkStatusCode != null
        ? checkMap?.[checkStatusCode]?.statusShortDescription
        : undefined;
    const text = row?.status ?? checkLabel ?? badge.label;
    const shown = text === badge.label ? badge : getPaymentStatusBadge(text);
    return { text, color: shown.textColor, bgColor: shown.bg };
  });

  isCheckPayment = computed(
    () =>
      this.row()?.transfer_type === 'CHECK' &&
      this.row()?.source?.source?.toUpperCase() !== 'WALLET'
  );

  /**
   * The check preview is hidden below `lg` — at half a grid column the 675px
   * cheque scales to ~0.5 and its text is illegible (check-preview-v4.scss).
   * Kept as a signal, not just CSS, so `tabCardSpansRow` stops counting a tile
   * that isn't there; otherwise the tab card lands beside a blank slot.
   */
  private isSmallScreen = signal(window.matchMedia(SMALL_SCREEN_QUERY).matches);

  isCheckPreviewVisible = computed(
    () => !this.isSmallScreen() && this.checkData()?.status != null
  );

  /** Maps ICheckDetailsData → IReceiveCheckDetails for CheckPreviewV4Component. */
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
      recurringMetaData:
        null as unknown as IReceiveCheckDetails['recurringMetaData'],
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

  clearedCheckDetails = computed(() => {
    const transfer = this.details()?.transfer;
    return {
      previewFile: transfer?.check_mail_record?.preview_file ?? null,
      clearingFile:
        transfer?.check_mail_record?.clearing_file ??
        transfer?.walletCheck?.clearing_file ??
        null
    };
  });

  /** Maps last transactions to shared TransactionsListV4Component shape. */
  transactionsForList = computed<ITransactionListEntry[]>(() => {
    const list = this.lastTransactions();
    if (!list?.length) return [];
    return list.map((t) => ({
      date: t.date ?? '',
      description: t.memo ?? '-',
      amount: t.amount ? `$${t.amount}` : '$0.00',
      status: String(t.status ?? ''),
      method: t.account ?? 'Check'
    }));
  });

  totalForList = computed(() => {
    const list = this.lastTransactions();
    if (!list?.length) return '$0.00';
    const total = list.reduce((sum, t) => {
      const n = parseFloat(t.amount ?? '0');
      return sum + (Number.isNaN(n) ? 0 : n);
    }, 0);
    return `$${total.toFixed(2)}`;
  });

  /** Maps API POD data to the pod-list component shape. */
  podForList = computed<IPodEntry[]>(() => {
    const list = this.podAttachments();
    if (!list?.length) return [];
    return list.map((item) => ({
      date: item.formated_date,
      user: item.user_name,
      file: item.file_name ?? item.file_path ?? '',
      note: item.description ?? '',
      publicUrl: item.public_url
    }));
  });

  /**
   * Whether the panel offers "Send or Request Proof of Delivery". A proof is
   * requestable once: the server refuses a second request, so the action goes
   * away as soon as one has been asked for (`pod_status`) or a proof has been
   * recorded (the attachment list). On top of that, the same conditions the
   * table's action menu disables the item by (`v4-view-button`) — the payment
   * has gone through, and the rail supports a delivery proof at all.
   */
  canSendPod = computed<boolean>(() => {
    if (this.detailPanelService.hidePaymentProof()) return false;

    const row = this.row();
    if (!row) return false;
    if (POD_UNSUPPORTED_MODES.includes(row.transfer_mode)) return false;

    const podStatus =
      (row as { pod_status?: number }).pod_status ??
      this.checkData()?.podStatus;
    if (podStatus !== 0) return false;

    // Already delivered against, even if `pod_status` has not caught up.
    if (this.podAttachments()?.length) return false;

    return (
      row.status === 'COMPLETED' ||
      (row.status === 'PROCESSING' &&
        (row.transfer_type_code === 'ach' || row.transfer_type_code === 'wire'))
    );
  });

  /** Formatted shipping method for display. */
  shippingMethod = computed(() => {
    const method = this.details()?.metadata?.shippingType;
    if (!method) return '';
    return method
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  });

  /**
   * Expanded (⤢) grid only: the tab card is ordered last among the half-width
   * tiles, so an even number of tiles before it leaves it alone in a half-row
   * with a vacant slot beside it. Span the whole row in that case. Counts the
   * CHECK layout's tiles in render order — keep this in step with their @ifs.
   */
  tabCardSpansRow = computed(() => {
    const payee = this.payeeDisplay();
    const tiles =
      1 + // Payment details — always rendered
      (this.visibleStatements().length ? 1 : 0) + // Statement timeline
      (payee.name || payee.email || payee.phone || payee.address ? 1 : 0) +
      (this.isCheckPreviewVisible() ? 1 : 0) + // Check preview
      (this.checkData()?.preview_file ? 1 : 0) + // Check mail preview
      (this.isMailSectionVisible() ? 2 : 0); // Mail details + Mailed attachments
    return tiles % 2 === 0;
  });

  /** Whether the Payee card renders (mirrors #payeeDetailsTmpl's guard). */
  private hasPayeeCard = computed(() => {
    const p = this.payeeDisplay();
    return !!(p.name || p.email || p.phone || p.address);
  });

  /** Whether the Shipping details card renders (mirrors its `@if`). */
  hasShippingCard = computed(
    () =>
      !!(
        this.shippingMethod() ||
        this.details()?.transfer?.shipping?.carrier_tracking_number
      )
  );

  isInternationalPayment = computed(
    () => this.row()?.transfer_type === 'INTERNATIONAL PAYMENT'
  );

  /**
   * Expanded (⤢) grid, NON-check layout: the half-width tiles run
   * Payment details → timeline → payee → shipping → bank, then the full-width
   * actions card. An odd number of them strands the last tile in a half-row,
   * leaving the blank slot beside it — so that last tile spans instead. An odd
   * count always puts the last tile at an even index, so promoting it can never
   * push an earlier tile onto a fresh row. Keep in step with their @ifs.
   */
  private spanningTile = computed<string | null>(() => {
    if (this.isCheckPayment()) return null;
    const tiles = ['payment']; // Payment details — always rendered
    if (this.visibleStatements().length) tiles.push('timeline');
    if (this.hasPayeeCard()) tiles.push('payee');
    if (this.hasShippingCard()) tiles.push('shipping');
    if (this.isInternationalPayment()) tiles.push('bank');
    return tiles.length % 2 === 1 ? tiles[tiles.length - 1] : null;
  });

  tileSpansRow(tile: string): boolean {
    return this.spanningTile() === tile;
  }

  /** Whether mail sections should be visible (matches check-view isCheckShow logic). */
  isMailSectionVisible = computed(() => {
    const status = this.checkData()?.status;
    return status != null && this.MAIL_SECTION_STATUSES.includes(status);
  });

  /** Payee address for mail details (when no custom addresses). */
  payeeAddressForMail = computed(() => {
    const cd = this.checkData();
    if (!cd) return null;
    return {
      name: cd.payee?.payeeName,
      companyName: cd.payeeCompanyName,
      address1: cd.payeeAddress1,
      address2: cd.payeeAddress2,
      city: cd.payeeCity,
      state: cd.payeeState,
      zip: cd.payeeZip,
      country: cd.payeeCountry
    };
  });

  panelActionButtons = computed<IDetailPanelActionButton[]>(() => {
    const base = this.baseActionButtons();
    if (this.detailPanelService.hideActionButtons()) return base;

    const warning: IDetailPanelActionButton = {
      label: 'Payee Bank Account Not Verified',
      icon: faTriangleExclamation,
      variant: 'warning',
      key: 'bank-verification',
      tooltip: 'Payee Bank Verification Pending'
    };
    const isHeld = this.details()?.is_payee_bank_verification_held;
    const status = this.row()?.status;
    const row =
      isHeld && status !== 'COMPLETED' ? [...base, warning] : [...base];

    // sort() is stable, so unlisted buttons keep the order they were built in.
    const rank = (b: IDetailPanelActionButton): number => {
      if (b.key === 'more') return 99;
      const i = ACTION_BUTTON_ORDER.indexOf(b.key);
      return i === -1 ? 50 : i;
    };
    return row.sort((a, b) => rank(a) - rank(b));
  });

  private baseActionButtons = computed<IDetailPanelActionButton[]>(() => {
    if (this.detailPanelService.hideActionButtons()) return [];
    const row = this.row();
    if (!row) return [];
    const hidePaymentProof = this.detailPanelService.hidePaymentProof();

    if (this.isCheckPayment()) {
      const cd = this.checkData();
      const statusMap = this.checkStatusMap();
      if (!cd || !statusMap) return [];

      const actionList = statusMap[cd.status];
      const buttons: IDetailPanelActionButton[] = [];

      // Primary CTA: Payment Proof (navy) when completed/processing/ACH.
      const stmts = this.statements();
      const isCompletePayment = stmts?.some(
        (s) => s.status === 'COMPLETED' || s.status === 'PROCESSING'
      );
      const isAch = this.ACH_STATUSES.includes(cd.status);
      if (!hidePaymentProof && (isCompletePayment || isAch)) {
        buttons.push({
          label: 'Payment proof',
          variant: 'outline',
          key: 'payment-proof'
        });
      }

      // Clone (outline)
      buttons.push({
        label: 'Clone',
        variant: 'outline',
        key: 'clone',
        lucideIcon: 'copy'
      });

      // ⋮ overflow: Edit / Void / Delete (status-gated) — design O3 header.
      const menu: MenuItem[] = [];
      if (actionList?.isItEditAble === 1 || actionList?.statusValue === 50) {
        menu.push({ label: 'Edit', key: 'edit', lucideIcon: 'pencil' });
      }
      if (actionList?.isItVoidAble === 1) {
        menu.push({ label: 'Void', key: 'void', lucideIcon: 'ban' });
      }
      if (actionList?.isItDeleteAble === 1) {
        menu.push({
          label: 'Delete',
          key: 'delete',
          lucideIcon: 'trash-2',
          danger: true
        });
      }
      if (menu.length) {
        buttons.push(moreButton(menu));
      }

      return buttons;
    }

    const { transfer_type: type, status, transfer_type_code: code } = row;
    if (type === 'RTP' || type === 'INTERNATIONAL PAYMENT') return [];

    const buttons: IDetailPanelActionButton[] = [];

    // Primary CTA: Payment Proof (completed/processing) or Pay (pending) — navy.
    if (
      status === 'COMPLETED' ||
      (status === 'PROCESSING' && (code === 'ach' || code === 'wire'))
    ) {
      buttons.push({
        label: 'Payment proof',
        variant: 'outline',
        key: 'payment-proof'
      });
    } else if (status === 'PENDING') {
      buttons.push({ label: 'Pay', variant: 'primary', key: 'pay' });
    }

    // Clone (outline)
    buttons.push({
      label: 'Clone',
      variant: 'outline',
      key: 'clone',
      lucideIcon: 'copy'
    });

    // ⋮ overflow: Edit (pending) — design O3 header.
    const menu: MenuItem[] = [];
    if (status === 'PENDING') {
      menu.push({ label: 'Edit', key: 'edit', lucideIcon: 'pencil' });
    }
    if (menu.length) {
      buttons.push(moreButton(menu));
    }

    return buttons;
  });

  // ── Constructor ───────────────────────────────────────────────────────────
  constructor() {
    const smallScreen = window.matchMedia(SMALL_SCREEN_QUERY);
    const onSmallScreenChange = (e: MediaQueryListEvent): void =>
      this.isSmallScreen.set(e.matches);
    smallScreen.addEventListener('change', onSmallScreenChange);
    this.destroyRef.onDestroy(() =>
      smallScreen.removeEventListener('change', onSmallScreenChange)
    );

    toObservable(this.uuid)
      .pipe(
        takeUntilDestroyed(),
        filter((u) => !!u),
        switchMap((uuid) => {
          // Reset all state
          this.activeTab.set('summary');
          this.panelReset$.next();
          this.loadedSections.clear();
          this.loadingSections.set([]);
          // Auto-select the leading tile so the section is populated on open (its
          // inline panel fills the right column and shows a loading state until
          // data lands).
          const firstSection = this.firstSection();
          this.openActionSection.set(firstSection);
          this.details.set(null);
          this.comments.set(null);
          this.attachments.set(null);
          this.podAttachments.set(null);
          this.auditLogs.set(null);
          this.remittance.set(null);
          this.mailTrackDetails.set(null);
          this.checkData.set(null);
          this.payeeSummary.set(null);
          this.lastTransactions.set(null);
          this.vendorCreditData.set(null);
          this.vendorCreditTotal.set('$0.00');
          this.statements.set(null);
          this.isLoading.set(true);
          // Only the auto-opened section loads now; the rest wait for their click.
          // Non-CHECK comments need details.zilpaymentId, which lands later — that
          // branch re-kicks this call once it has it.
          this.loadSection(firstSection);

          const fallback = <T>() =>
            of({ success: false, data: null } as unknown as IApiRes<T>);

          const row = this.row();
          const isCheck = row?.transfer_type === 'CHECK';

          if (isCheck && row?.transfer_id) {
            // ── CHECK flow ────────────────────────────────────────────────
            const cached = this.localStorageService.getItem('check_status');
            if (cached) {
              this.checkStatusMap.set(cached);
            } else {
              this.checkService
                .getCheckStatus()
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe((res) => {
                  if (res?.success && res.data) {
                    this.localStorageService.setItem('check_status', res.data);
                    this.checkStatusMap.set(res.data);
                  }
                });
            }

            return forkJoin({
              checkDetails: this.checkService
                .getChecksById(row.transfer_id)
                .pipe(catchError(() => fallback<ICheckDetailsData>())),
              paymentDetails: this.paymentsService
                .getPaymentDetails(uuid)
                .pipe(catchError(() => fallback<IPaymentDetails>())),
              statements: this.psbService
                .getPaidStatements(uuid)
                .pipe(catchError(() => fallback<IPaidStatement[]>()))
            }).pipe(
              switchMap((firstRes) => {
                this.details.set(firstRes.paymentDetails.data);
                this.statements.set(firstRes.statements.data ?? null);

                const checkDetails = firstRes.checkDetails.data;
                this.checkData.set(checkDetails);

                const payeeId = checkDetails?.payee?.payeeId;
                const transferId = row.transfer_id;
                const needsStatementsFallback =
                  !firstRes.statements.data?.length &&
                  !!checkDetails?.uuid &&
                  checkDetails.uuid !== uuid;

                // Comments / attachments / POD / audit / vendor-credit are NOT
                // fetched here — each loads when its section or tab is opened
                // (see loadSection). Only always-visible data stays eager.
                return forkJoin({
                  payeeSummary: payeeId
                    ? this.checkService
                        .getPayeeSummary(payeeId)
                        .pipe(catchError(() => of(null)))
                    : of(null),
                  mailTracking:
                    checkDetails?.status != null &&
                    this.MAIL_SECTION_STATUSES.includes(checkDetails.status)
                      ? this.checkService
                          .getCheckTracking(transferId)
                          .pipe(
                            catchError(() => fallback<ICheckMailTrackDetails>())
                          )
                      : fallback<ICheckMailTrackDetails>(),
                  statementsFallback: needsStatementsFallback
                    ? this.psbService
                        .getPaidStatements(checkDetails.uuid)
                        .pipe(catchError(() => fallback<IPaidStatement[]>()))
                    : of(null)
                });
              }),
              finalize(() => this.isLoading.set(false))
            );
          }

          // ── Non-CHECK flow ─────────────────────────────────────────────
          return forkJoin({
            paymentDetails: this.paymentsService
              .getPaymentDetails(uuid)
              .pipe(catchError(() => fallback<IPaymentDetails>())),
            statements: this.psbService
              .getPaidStatements(uuid)
              .pipe(catchError(() => fallback<IPaidStatement[]>()))
          }).pipe(
            switchMap((firstRes) => {
              this.details.set(firstRes.paymentDetails.data);
              this.statements.set(firstRes.statements.data ?? null);
              // zilpaymentId exists only now, so the auto-opened section — which
              // short-circuited to a no-op during reset — can finally load.
              if (this.openActionSection() === 'comments') {
                this.loadSection('comments');
              }
              // Everything else on this layout (comments, attachments, POD,
              // remittance) is behind an action-grid click — see loadSection.
              // getPayeeSummary is dropped: the Summary / Vendor-credit tabs and
              // the transactions list only exist in the CHECK layout.
              return of(null);
            }),
            finalize(() => this.isLoading.set(false))
          );
        })
      )
      .subscribe({
        next: (res) => {
          if (!res) return;

          // Payee summary (CHECK only)
          if (res.payeeSummary) {
            this.payeeSummary.set(res.payeeSummary.other ?? null);
            this.lastTransactions.set(res.payeeSummary.data ?? null);
          }

          if ('mailTracking' in res) {
            const mailRes = res.mailTracking as IApiRes<unknown> | undefined;
            if (mailRes?.success && mailRes?.data) {
              this.mailTrackDetails.set(mailRes.data as ICheckMailTrackDetails);
            }
          }
          if ('statementsFallback' in res) {
            const stmtRes = res.statementsFallback as
              | IApiRes<IPaidStatement[]>
              | null
              | undefined;
            if (stmtRes?.success && stmtRes?.data?.length) {
              this.statements.set(stmtRes.data);
            }
          }
        }
      });
  }

  // ── Tab navigation ────────────────────────────────────────────────────────
  setTab(tab: PanelTab): void {
    this.activeTab.set(tab);
    this.loadSection(tab);
  }

  // ── Lazy section/tab loading ──────────────────────────────────────────────
  /** True while the given section/tab's request is in flight (shows a skeleton). */
  isSectionLoading(key: string): boolean {
    return this.loadingSections().includes(key);
  }

  /**
   * Fetch a section/tab's data the first time it is opened rather than on panel
   * open. Only one section and one tab are ever visible, so loading them all up
   * front cost 5+ requests the user never looked at. Cached per uuid via
   * loadedSections, so re-opening a section does not refetch.
   */
  private loadSection(key: ActionGridSection | PanelTab): void {
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

  /** The request backing one section/tab, or null when it needs no API. */
  private sectionRequest(
    key: ActionGridSection | PanelTab
  ): Observable<unknown> | null {
    switch (key) {
      case 'audit': {
        // Non-CHECK payments have no activity endpoint — the list stays empty.
        const transferId = this.row()?.transfer_id;
        if (!this.isCheckPayment() || !transferId) return null;
        return this.checkService.getCheckActivity(transferId).pipe(
          tap((res: IApiRes<unknown>) => {
            if (res?.success && res?.data) {
              this.auditLogs.set(res.data as IActivityEntry[]);
            }
          })
        );
      }

      case 'comments':
        return this.comments$();

      case 'attachments':
        return this.attachments$();

      case 'pod': {
        const zilId = this.details()?.zilpaymentId ?? this.checkData()?.uuid;
        if (!zilId) return null;
        return this.paymentsService.getPodFile('zil-payments', zilId).pipe(
          tap((res) => {
            if (res?.success && res?.data) {
              this.podAttachments.set(res.data as IPodDetails[]);
            }
          })
        );
      }

      case 'remittance': {
        // CHECK remittance already rides along in checkData() — no request.
        const zilId = this.details()?.zilpaymentId;
        if (this.isCheckPayment() || !zilId) return null;
        return this.sharedService.getZilPaymentsRemitance(zilId).pipe(
          tap((res) => {
            if (res?.success && res?.data) {
              this.remittance.set(res.data as IGetRemitance);
            }
          })
        );
      }

      case 'vendor-credit': {
        const transferId = this.row()?.transfer_id;
        if (!this.isCheckPayment() || !transferId) return null;
        return this.vendorService
          .getVendorCreditApplied({
            referenceId: transferId,
            referenceType: 2
          })
          .pipe(
            tap((res: { data?: unknown }) => this.setVendorCredit(res?.data))
          );
      }

      default:
        return null;
    }
  }

  private setVendorCredit(data: unknown): void {
    const items = (data ?? []) as {
      amount: string;
      vendor_credit_no?: string;
    }[];
    if (!items.length) return;
    this.vendorCreditData.set(items);
    let total = 0;
    items.forEach((e) => {
      const m = String(e.amount ?? '').match(/[\d.]+/);
      if (m) total += parseFloat(m[0]);
    });
    this.vendorCreditTotal.set('$' + total.toFixed(2));
  }

  // ── Action grid ───────────────────────────────────────────────────────────
  /**
   * The tile each grid leads with, auto-opened on load. The check grid starts
   * with Audit Logs; the non-check grid has no audit tile, so it starts with
   * Comments. Must follow isCheckPayment(), the same switch the template uses.
   */
  private firstSection(): ActionGridSection {
    return this.isCheckPayment() ? 'audit' : 'comments';
  }

  selectSection(section: ActionGridSection): void {
    // Clear any inline validation when switching sections.
    this.commentError.set(null);
    this.attachmentError.set(null);
    this.attachmentPhoneError.set(null);
    this.openActionSection.update((current) =>
      current === section ? null : section
    );
    // Fetch on open only — closing a section must not re-trigger it.
    if (this.openActionSection() === section) this.loadSection(section);
  }

  /**
   * @description Returns the tooltip text for a given action-grid card label.
   */
  getCardTooltip(label: string): string {
    const template = CARD_TOOLTIPS[label] ?? '';
    return template.replace(
      '{{itemType}}',
      this.isCheckPayment() ? 'check' : 'payment'
    );
  }

  /** The zil payment id every share request is posted against. */
  private shareId(): string | undefined {
    return this.details()?.id;
  }

  /** Share-button tooltip, naming the section it sends. */
  shareTooltip(section: string): string {
    return shareSectionTooltip(this.SHARE_TYPES[section]);
  }

  /** Share is offered only for a section that actually holds data to send. */
  canShare(section: string): boolean {
    if (!this.shareId()) return false;
    switch (section) {
      case 'audit':
        return !!this.auditLogs()?.length;
      case 'comments':
        return !!this.comments()?.length;
      case 'attachments':
        return !!this.attachments()?.length;
      case 'remittance':
        return this.isCheckPayment()
          ? !!this.checkData()?.remittance?.length
          : !!this.remittance()?.items_by_array?.length;
      case 'pod':
        return !!this.podAttachments()?.length;
      default:
        return false;
    }
  }

  openShareModal(section: string): void {
    const zilId = this.shareId();
    if (!zilId) return;
    const payee = this.payeeDisplay();

    this.dialog.open(V4SendPaymentProofModalComponent, {
      maxWidth: '500px',
      width: '93%',
      panelClass: 'paddingless-modal-rounded',
      disableClose: true,
      data: {
        uuId: zilId,
        mode: 'share',
        shareType: this.SHARE_TYPES[section],
        recipientName: payee.name,
        payee: { email: payee.email, phone: payee.phone },
        amount: this.details()?.amount ?? this.row()?.amount ?? ''
      }
    });
  }

  toggleAuditLogs(): void {
    this.selectSection('audit');
  }

  closeAuditLogs(): void {
    this.openActionSection.set(null);
  }

  reloadAuditLogs(): void {
    const transferId = this.row()?.transfer_id;
    if (!transferId) return;
    this.checkService
      .getCheckActivity(transferId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res: IApiRes<unknown>) => {
        if (res?.success && res?.data) {
          this.auditLogs.set(res.data as IActivityEntry[]);
        }
      });
  }

  toggleComments(): void {
    this.selectSection('comments');
  }

  closeComments(): void {
    this.openActionSection.set(null);
  }

  openAttachments(): void {
    this.selectSection('attachments');
  }

  closeAttachments(): void {
    this.openActionSection.set(null);
  }

  toggleRemittance(): void {
    this.selectSection('remittance');
  }

  closeRemittance(): void {
    this.openActionSection.set(null);
  }

  openPod(): void {
    this.selectSection('pod');
  }

  closePod(): void {
    this.openActionSection.set(null);
  }

  openSendPod(): void {
    const uuid = this.uuid();
    if (!uuid) return;

    const row = this.row() as
      | (ICommonTransactionTableData & {
          payee_email?: string;
          payee_phone?: string;
        })
      | null;
    const cd = this.checkData();

    this.dialog.open(V4SendPaymentProofModalComponent, {
      maxWidth: '500px',
      width: '93%',
      panelClass: 'paddingless-modal-rounded',
      disableClose: true,
      data: {
        checkStatus: undefined,
        uuId: uuid,
        encryptedId: row?.zilpayment_id,
        mode: 'pod',
        isMailProof: false,
        payee: {
          email: row?.payee_email ?? cd?.payeeEmail ?? '',
          phone: row?.payee_phone ?? cd?.payeePhone ?? ''
        },
        amount: row?.amount ?? cd?.amount ?? ''
      }
    })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.refetchPod());
  }

  /**
   * Re-read the proof list after the modal closes. The dialog resolves without
   * a result whether the user sent a request or backed out, so this refetches
   * either way rather than guessing which happened.
   */
  private refetchPod(): void {
    this.loadedSections.delete('pod');
    this.loadSection('pod');
  }

  openSignedReceipt(): void {
    this.selectSection('signed-receipt');
  }

  closeSignedReceipt(): void {
    this.openActionSection.set(null);
  }

  signedReceiptOpening = signal(false);

  viewSignedReceipt(): void {
    const uuid = this.uuid();
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

  toggleClearedCheck(): void {
    this.selectSection('cleared-check');
  }

  onTrackClicked(): void {
    const details = this.mailTrackDetails();
    if (!details) return;
    const transferId = this.row()?.transfer_id;

    if (
      details.trackingData?.data?.details &&
      details.trackingData.data.details.length > 0
    ) {
      const updatedTrackDetails = JSON.parse(JSON.stringify(details));
      if (updatedTrackDetails.trackingData?.data?.details) {
        updatedTrackDetails.trackingData.data.details =
          updatedTrackDetails.trackingData.data.details.reverse();
      }
      this.dialog.open(V4MailTrackingModalComponent, {
        disableClose: true,
        maxWidth: '1010px',
        width: '99%',
        maxHeight: '83%',
        autoFocus: false,
        panelClass: 'paddingless-modal-rounded',
        data: {
          trackDate: updatedTrackDetails,
          id: transferId,
          mode: 'check'
        }
      });
    } else if (details.trackingCode) {
      window.open(getMailTrackUrl(details.trackingCode), '_blank');
    }
  }

  onViewMailedAttachment(attachmentId: string): void {
    this.checkService
      .viewAttachmentDocument(attachmentId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res?.success && res?.data?.URL) {
          window.open(res.data.URL, '_blank');
        }
      });
  }

  onGroupMailingClicked(groupId: string): void {
    const url = this.router.createUrlTree([
      '/v4/manage/business-tools/mail-dashboard/group-mailing/details',
      groupId
    ]);
    window.open(url.toString(), '_blank');
  }

  downloadFile(url: string): void {
    window.open(url);
  }

  handleSignedReceipt(): void {
    const uuid = this.uuid();
    if (!uuid) return;

    if (this.isCheckPayment()) {
      const cd = this.checkData();
      if (!cd) return;

      if (!cd.signatureUrl) {
        const statusMap = this.checkStatusMap();
        const statusDesc = statusMap?.[cd.status]?.statusShortDescription;
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
                type: 'CHECK'
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
        this.openSendReceiptModal(cd.uuid, cd.payeeEmail, cd.payeePhone);
      }
    } else {
      const d = this.details();
      if (!d) return;

      if (!d.signatureUrl) {
        const row = this.row();
        const isRtp =
          row?.transfer_type === 'RTP' ||
          row?.transfer_type === 'INTERNATIONAL PAYMENT';
        const isPaymentCompleted =
          row?.status === 'COMPLETED' ||
          (row?.status === 'PROCESSING' &&
            (row?.transfer_type_code === 'ach' ||
              row?.transfer_type_code === 'wire'));
        const canSubmit = isPaymentCompleted && !isRtp;

        this.dialog
          .open(V4GetSignedReceiptModalComponent, {
            maxWidth: '550px',
            width: '93%',
            disableClose: true,
            panelClass: 'paddingless-modal-rounded',
            data: {
              transactionId: uuid,
              zilId: d.zilpaymentId ?? uuid,
              payee: { email: d.payee?.email, phone: d.payee?.phone },
              canSubmitSignedReceiptRequest: canSubmit,
              previewData: {
                senderName:
                  (d.source as { bankAccountName?: string })?.bankAccountName ??
                  '',
                payeeName: d.payee_name ?? d.payee?.name ?? '',
                amount: d.amount ?? '',
                address: d.payee?.addressLine1 ?? '',
                reference: d.referenceNo ?? '',
                type: d.transferType ?? 'PAYMENT'
              }
            }
          })
          .afterClosed()
          .subscribe((res) => {
            if (res?.success) {
              this.details.set({
                ...d,
                payment_receipt_id: '10'
              } as IPaymentDetails);
            }
          });
      } else {
        this.openSendReceiptModal(uuid, d.payee?.email, d.payee?.phone);
      }
    }
  }

  private openSendReceiptModal(
    transactionId: string,
    email?: string,
    phone?: string
  ): void {
    this.dialog.open(V4SendReceiptModalComponent, {
      maxWidth: '500px',
      width: '93%',
      disableClose: true,
      panelClass: 'paddingless-modal-rounded',
      data: { transactionId, payee: { email, phone } }
    });
  }

  // ── Inline actions ────────────────────────────────────────────────────────
  /** Post a comment inline (no modal). Called from the Comments composer. */
  onSubmitComment(text: string): void {
    const resource = this.getResourceInfo();
    const comment = text?.trim();
    if (!resource || !comment) return;

    this.commentError.set(null);
    this.commentPosting.set(true);
    this.sharedService
      .addComment(resource.type, resource.id, { comment })
      .pipe(
        finalize(() => this.commentPosting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          if (res?.success) {
            this.refetchComments();
          } else {
            this.commentError.set('Couldn’t post — please try again.');
          }
        },
        error: () => this.commentError.set('Couldn’t post — please try again.')
      });
  }

  onDeleteComment(commentId: string): void {
    const resource = this.getResourceInfo();
    if (!resource || !commentId) return;

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
          .deleteComment(resource.type, resource.id, commentId)
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

  /** Upload a picked file inline (no modal). Called from the Attachments picker. */
  onAttachmentSelected(file: File): void {
    const resource = this.getResourceInfo();
    if (!resource || !file) return;

    // Format / size / count are validated by the picker (po-attachments-list).
    this.attachmentError.set(null);

    // Check uploads use the `attachment` field (checkService); zil-payments use `image`.
    const upload$ = this.isCheckPayment()
      ? this.checkService.addCheckAttachment(resource.id, file)
      : this.sharedService.addNonCheckAttachment(file, resource.id);

    this.attachmentUploading.set(true);
    upload$
      .pipe(
        finalize(() => this.attachmentUploading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res: { success?: boolean }) => {
          if (res?.success) {
            this.refetchAttachments();
            this.alertService.successAlert({
              content: 'Attachment added.',
              close: true,
              timeout: 1500
            });
          } else {
            this.attachmentError.set('Couldn’t upload — please try again.');
          }
        },
        error: () =>
          this.attachmentError.set('Couldn’t upload — please try again.')
      });
  }

  /** Send an SMS link so the payee/user can upload a file from their phone (check-only). */
  onSendAttachmentPhoneLink(phone: string): void {
    if (!this.isCheckPayment() || !phone) return;
    this.attachmentPhoneError.set(null);
    // Inline validation: 10-digit US phone (strip formatting).
    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 10) {
      this.attachmentPhoneError.set('Enter a valid 10-digit phone number.');
      return;
    }
    const checkId = this.row()?.transfer_id ?? 0;
    this.attachmentPhoneSending.set(true);
    this.checkService
      .checksUploadFromPhoneLink(checkId, {
        documentType: 'checks',
        requestType: 'sms',
        phone: Number(phone)
      })
      .pipe(
        finalize(() => this.attachmentPhoneSending.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          if (res?.success) {
            this.attachmentPhoneSent.set(true);
            this.headerService.setHeaderValueChanged(true);
            this.subscribeAttachmentPusher(String(res.data?.data?.id ?? ''));
            setTimeout(() => this.attachmentPhoneSent.set(false), 3500);
          } else {
            this.attachmentPhoneError.set(
              'Couldn’t send the link — try again.'
            );
          }
        },
        error: () =>
          this.attachmentPhoneError.set('Couldn’t send the link — try again.')
      });
  }

  /** Show a QR code the user can scan to upload from a phone (check-only). */
  onOpenAttachmentQr(): void {
    if (!this.isCheckPayment() || this.attachmentQrLoading()) return;
    const checkId = this.row()?.transfer_id ?? 0;
    this.attachmentQrLoading.set(true);
    this.checkService
      .checksUploadFromPhoneLink(checkId, {
        documentType: 'checks',
        requestType: 'qr'
      })
      .pipe(
        finalize(() => this.attachmentQrLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res?.success) {
          this.qrDialogRef = this.dialog.open(QrCodeScannerModalV4Component, {
            width: '380px',
            panelClass: 'paddingless-modal-rounded',
            data: { link: res.data?.data?.link as string }
          });
          this.subscribeAttachmentPusher(String(res.data?.data?.id ?? ''));
        }
      });
  }

  /** Refresh the attachment list when the phone upload lands (Pusher). */
  private subscribeAttachmentPusher(typeId: string): void {
    if (!typeId) return;
    this.pusherService
      .getEvent(
        `check-attachment-${typeId}`,
        `check-attachment-event-${typeId}`
      )
      .pipe(take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.refetchAttachments();
        this.qrDialogRef?.close();
      });
  }

  onDeleteAttachment(entry: IAttachmentEntry): void {
    const encryptedId = entry?.encrypted_id;
    if (!encryptedId) return;

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
        const resource = this.getResourceInfo();
        if (!resource) return;

        this.deletingAttachmentId.set(encryptedId);
        this.sharedService
          .deleteAttachment(resource.type, resource.id, encryptedId)
          .pipe(
            finalize(() => this.deletingAttachmentId.set(null)),
            takeUntilDestroyed(this.destroyRef)
          )
          .subscribe({
            next: (res) => {
              if (res?.success) this.refetchAttachments();
            }
          });
      });
  }

  private getResourceInfo(): { type: string; id: string } | null {
    if (this.isCheckPayment()) {
      const id = this.row()?.transfer_id;
      return id ? { type: 'checks', id } : null;
    }
    const id = this.details()?.zilpaymentId;
    return id ? { type: 'zil-payments', id } : null;
  }

  /**
   * Attachments request — one builder shared by the lazy first load and by every
   * refetch (upload / delete / phone upload). `/{type}/{id}/attachments` serves
   * both CHECK ('checks') and non-CHECK ('zil-payments') via getResourceInfo().
   */
  private attachments$(): Observable<unknown> | null {
    const resource = this.getResourceInfo();
    if (!resource) return null;

    return this.sharedService.getAttachment(resource.type, resource.id).pipe(
      tap((res) => {
        if (res?.success && res?.data) {
          this.attachments.set(
            (res.data as unknown as IAttachmentEntry[]) ?? null
          );
        }
      })
    );
  }

  /** Comments request — same builder for the lazy first load and post-comment refresh. */
  private comments$(): Observable<unknown> | null {
    const resource = this.getResourceInfo();
    if (!resource) return null;

    return this.sharedService.getAllComments(resource.type, resource.id).pipe(
      tap((res) => {
        if (res?.success && res?.data) {
          this.comments.set((res.data as ICommentEntry[]) ?? null);
        }
      })
    );
  }

  private refetchAttachments(): void {
    this.attachments$()?.pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  private refetchComments(): void {
    this.comments$()?.pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  // ── Header action buttons ───────────────────────────────────────────────
  onActionButtonClicked(key: string): void {
    const uuid = this.uuid();
    if (!uuid) return;

    if (key === 'bank-verification') {
      this.openPayeeBankVerificationDetailsModal();
      return;
    }

    if (this.isCheckPayment()) {
      this.handleCheckAction(key, uuid);
      return;
    }

    switch (key) {
      case 'pay':
      case 'edit':
        this.closed.emit();
        this.paymentsV4Service.openSendModal({
          mode: SendPaymentMode.Edit,
          paymentId: uuid
        });
        break;
      case 'clone':
        this.closed.emit();
        this.paymentsV4Service.openSendModal({
          mode: SendPaymentMode.Clone,
          paymentId: uuid
        });
        break;
      case 'payment-proof':
        this.dialog.open(V4SendPaymentProofModalComponent, {
          maxWidth: '500px',
          width: '93%',
          panelClass: 'paddingless-modal-rounded',
          data: {
            checkStatus: undefined,
            uuId: uuid,
            mode: 'pp',
            isMailProof: false
          },
          disableClose: true
        });
        break;
      default:
        break;
    }
  }

  private openPayeeBankVerificationDetailsModal(): void {
    const d = this.details();
    const row = this.row();
    this.dialog.open(V4PayeeBankVerificationDetailsModalComponent, {
      panelClass: 'paddingless-modal-rounded',
      width: '480px',
      maxWidth: '95vw',
      data: {
        uuId: this.uuid(),
        paymentDetails: {
          payeeName: d?.payee?.name || d?.payee_name || row?.payee_name,
          amount: d?.amount ?? row?.amount,
          source: row?.source_name || row?.source?.name,
          transferMode: d?.transferType ?? row?.transfer_mode,
          status: row?.status ?? d?.status,
          createdAt:
            Utils.splitDate(d?.createdAt ?? row?.created_at ?? '') ?? '',
          receiverAccountNumber:
            d?.transfer?.receiver_account_number ??
            row?.transfer?.receiver_account_number,
          isResendButtonEnabled:
            d?.is_micro_deposit_initiated ?? row?.is_micro_deposit_initiated
        }
      } as IPayeeBankVerificationModalData
    });
  }

  private handleCheckAction(key: string, uuid: string): void {
    const cd = this.checkData();
    const transferId = this.row()?.transfer_id;

    switch (key) {
      case 'edit':
        this.closed.emit();
        this.paymentsV4Service.openSendModal({
          mode: SendPaymentMode.Edit,
          paymentId: cd?.uuid ?? uuid
        });
        break;
      case 'clone':
        this.closed.emit();
        this.paymentsV4Service.openSendModal({
          mode: SendPaymentMode.Clone,
          paymentId: cd?.uuid ?? uuid
        });
        break;
      case 'void':
        if (!transferId) return;
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
            this.closed.emit();
            this.checkService
              .voidCheck(transferId)
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe({
                next: (res) => {
                  if (res?.success) {
                    this.v3DataTableService.refreshV3DataTable();
                    this.alertService.successAlert({
                      title: 'Success!',
                      content: 'Check voided.',
                      close: true
                    });
                  }
                }
              });
          });
        break;
      // Same as Void.
      case 'delete':
        if (!transferId) return;
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
            this.closed.emit();
            this.checkService
              .deleteCheck(transferId)
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe({
                next: (res) => {
                  if (res?.success) {
                    this.v3DataTableService.refreshV3DataTable();
                    this.alertService.successAlert({
                      title: 'Success!',
                      content: 'Check deleted.',
                      close: true
                    });
                  }
                }
              });
          });
        break;
      case 'payment-proof': {
        const isMailedCheck = cd ? [7, 8].includes(cd.status) : false;
        const mailedStatus = { value: 'Mailed', color: '#14AE5B' };
        this.dialog.open(V4SendPaymentProofModalComponent, {
          maxWidth: '500px',
          width: '93%',
          panelClass: 'paddingless-modal-rounded',
          data: {
            checkStatus: isMailedCheck ? mailedStatus : undefined,
            uuId: uuid,
            mode: 'pp',
            isMailProof: isMailedCheck
          },
          disableClose: true
        });
        break;
      }
      default:
        break;
    }
  }
}

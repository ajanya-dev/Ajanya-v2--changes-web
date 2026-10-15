import {
  Component,
  DestroyRef,
  OnInit,
  computed,
  effect,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltip } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { startWith } from 'rxjs/operators';
// eslint-disable-next-line import/no-extraneous-dependencies
import {
  LucideAngularModule,
  CircleCheck,
  CircleCheckBig,
  ChevronDown,
  ChevronUp,
  Landmark,
  Pencil,
  Globe,
  TriangleAlert,
  Info,
  CircleAlert,
  ArrowRight,
  Clock,
  CircleHelp,
  Sparkles
} from 'lucide-angular';

import {
  AddPayeeInternationalBankV4Component,
  AddPayeeInternationalBankDialogData
} from 'src/app/modules/payee/payee-v4/v4-components/add-payee-international-bank-v4/add-payee-international-bank-v4.component';
import { PaymentQrCodePanelComponent } from 'src/app/modules/payments-v4/receive-payment/components/payment-qr-code-panel/payment-qr-code-panel.component';
import { BlankCheckModalV4Component } from 'src/app/modules/payments-v4/send-payment/components/modals/blank-check-modal-v4/blank-check-modal-v4.component';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import { BankModalService } from 'src/app/shared/bank-modal/service/bank-modal.service';
import { BankAccountsService } from 'src/app/shared/service/bankAccounts/bank-accounts.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { ThemeService } from 'src/app/shared/service/theme/theme.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';

import { MaskAccountPipe } from 'src/app/pipes/mask-account.pipe';
import { WhiteLabelPipe } from 'src/app/pipes/white-label.pipe';
import { SendReceivePageService } from '../../services/send-receive-page.service';
import { CHECK_DELIVERY_OPTIONS } from '../payments-section/send/shared/models/check-delivery';
import { ReceiveStateService } from '../payments-section/receive/shared/receive-state.service';
import { BankCheckService } from '../payments-section/send/bank/services/bank-check.service';
import { CheckMailService } from '../payments-section/send/shared/services/check-mail.service';
import { PaymentFeeService } from '../payments-section/send/shared/services/payment-fee.service';
import { SendSourceRegistryService } from '../payments-section/send/shared/services/send-source-registry.service';
import { SendStateService } from '../payments-section/send/shared/services/send-state.service';
import { WalletPaymentService } from '../payments-section/send/wallet/services/wallet-payment.service';

/** The methods that pay into the payee's bank account — the only ones that show it. */
const BANK_PAID_METHODS = ['ach', 'same-ach', 'wire'];

/** The one method that pays a payee's international bank account. */
const INTERNATIONAL_METHOD = 'international-payment';

/** India uses IFSC, not a bank identifier type/code. */
const IFSC_COUNTRY = 'IN';

/** What the routing-number lookup answers when it cannot resolve the number. */
const UNRESOLVED_BANK_NAME = 'Bank Name';

/** The check-writing shortcuts offered beside a bank check. */
const OTHER_PAYMENT_OPTIONS = [
  { key: 'blank-check', label: 'Blank Check', full: false },
  { key: 'multiple-check', label: 'Multiple Check', full: false },
  { key: 'group-check', label: 'Group Check', full: false },
  { key: 'import-check', label: 'Import Check', full: false },
  { key: 'deposit-slip', label: 'Deposit Slip', full: true }
] as const;

/**
 * Where each shortcut goes. navigateByUrl, not navigate([...]), so the query string
 * is parsed — the bulk-payment deep links carry ?tab=…&method=… params. Blank Check
 * and Import Check have no route: they open modals.
 */
const OTHER_PAYMENT_ROUTES: Record<string, string> = {
  'multiple-check': '/v4/manage/bulk-payments/index?tab=create&method=manual-entry',
  'group-check': '/v4/manage/bulk-payments/index?tab=my-groups',
  'deposit-slip': '/v4/manage/depositslips/index'
};

/** What each "process without" toggle leaves off the printed check. */
const PROCESS_WITHOUT = [
  { key: 'noAmount', label: 'Amount' },
  { key: 'noPayee', label: 'Payee' },
  { key: 'noSign', label: 'Signature' },
  { key: 'noDate', label: 'Date' }
] as const;

interface IPromoCallout {
  title: string;
  sub: string;
}

const TRY_VIRTUAL_CARD_PROMO: IPromoCallout = {
  title: 'Try Virtual Card',
  sub: 'Pay instantly — the payee gets funds right away, no bank details shared.'
};

const VIRTUAL_CARD_PROMO: IPromoCallout = {
  title: 'Instant & private',
  sub: 'The payee is paid right away — and you never share your bank account.'
};

const SAME_DAY_PROMO: IPromoCallout = {
  title: 'Try Same-Day ACH from Wallet',
  sub: 'Wallet funds are already settled — pay out same-day.'
};

const WALLET_PROMO: IPromoCallout = {
  title: 'Settled funds, faster payouts',
  sub: 'Your Wallet balance is ready to send — no waiting for a bank transfer to clear.'
};

const INTL_CURRENCY_SYMBOLS: Record<string, string> = {
  INR: '₹',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CNY: '¥',
  KRW: '₩',
  THB: '฿',
  PHP: '₱',
  BRL: 'R$',
  MXN: '$',
  CAD: 'C$',
  AUD: 'A$',
  SGD: 'S$',
  HKD: 'HK$',
  NZD: 'NZ$',
  CHF: 'CHF',
  SEK: 'kr',
  NOK: 'kr',
  DKK: 'kr',
  PLN: 'zł',
  CZK: 'Kč',
  HUF: 'Ft',
  ZAR: 'R',
  TRY: '₺',
  AED: 'AED',
  SAR: 'SAR'
};

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  CHECKING: 'Checking',
  SAVINGS: 'Savings',
  BUSINESS: 'Business',
  personalChecking: 'Personal Checking',
  businessChecking: 'Business Checking',
  personalSavings: 'Personal Savings',
  businessSavings: 'Business Savings'
};

/**
 * The right summary rail. Reads the same SendStateService and PaymentFeeService
 * instances as the form — both are provided by SendReceivePageComponent.
 */
@Component({
  selector: 'app-payment-details-section',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    MatTooltip,
    PaymentQrCodePanelComponent,
    CommonButtonV4Component,
    MaskAccountPipe,
    WhiteLabelPipe
  ],
  templateUrl: './payment-details-section.component.html',
  styleUrls: ['./payment-details-section.component.scss']
})
export class PaymentDetailsSectionComponent implements OnInit {
  // -------------------------------------------------------------------------
  // Dependency injection
  // -------------------------------------------------------------------------

  private readonly destroyRef = inject(DestroyRef);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly bankAccountsService = inject(BankAccountsService);
  private readonly bankModalService = inject(BankModalService);
  private readonly payeeService = inject(PayeeService);
  private readonly themeService = inject(ThemeService);
  private readonly headerService = inject(HeaderService);
  private readonly dynamicWhiteLabelService = inject(DynamicWhiteLabelService);

  private readonly sendReceivePageService = inject(SendReceivePageService);
  private readonly sendStateService = inject(SendStateService);
  private readonly receiveStateService = inject(ReceiveStateService);
  private readonly paymentFeeService = inject(PaymentFeeService);
  private readonly checkMailService = inject(CheckMailService);
  private readonly walletPaymentService = inject(WalletPaymentService);
  private readonly bankCheckService = inject(BankCheckService);
  readonly sourceRegistry = inject(SendSourceRegistryService);

  // -------------------------------------------------------------------------
  // Signals
  // -------------------------------------------------------------------------

  /** Pay or Receive — read from the page service, not passed in. */
  readonly mode = this.sendReceivePageService.pageMode;

  readonly qrBankName = this.receiveStateService.bankName;
  readonly qrCodeDataUrl = this.receiveStateService.qrCodeDataUrl;
  readonly qrPaymentLink = this.receiveStateService.paymentLink;
  readonly qrPaymentId = this.receiveStateService.paymentId;

  /** The breakdown collapses; the Funds Ready header stays. */
  readonly feeOpen = signal(true);

  /** The payee card collapses; its header stays. */
  readonly payeeOpen = signal(false);

  /** The bank card collapses; its header stays. */
  readonly bankOpen = signal(false);

  /** The international bank card collapses; its header stays. */
  readonly internationalBankOpen = signal(false);

  readonly bankInstitutionName = signal('');
  readonly reduceMyFeeLoading = signal(false);
  readonly isDarkMode = signal(false);
  readonly isSubscribed = signal(false);

  // -------------------------------------------------------------------------
  // Computed signals — fees
  // -------------------------------------------------------------------------

  readonly fee = computed(() => this.paymentFeeService.state().feeDetails);
  readonly feeVisible = computed(() => this.paymentFeeService.state().isShow);
  readonly feeLoading = computed(() => this.paymentFeeService.state().isLoading);

  /**
   * A figure is on screen but a fresh quote is in flight. The rows shimmer
   * rather than stand there showing a price that is being recalculated.
   */
  readonly feeQuoting = computed(() => this.paymentFeeService.state().isQuoting);
  readonly feeError = computed(() => this.paymentFeeService.state().isError);

  /** A mailed check has no fee to quote until a carrier is chosen. */
  readonly feePending = computed(() => this.paymentFeeService.state().isPending);

  /**
   * Why the fee is not on screen yet, in the words that fit the delivery. A
   * mailed check is waiting on a carrier; a deposit has no quote at all until
   * the cheque exists, so "shipping type" would be nonsense there.
   */
  readonly feePendingLabel = computed(() =>
    this.sendStateService.checkDelivery() === 'ach'
      ? 'Confirmed when sent'
      : 'Depending on shipping type'
  );

  /** The amount, which is known even while the fee is not. */
  readonly feeAmount = computed(() => this.paymentFeeService.state().amount);

  /**
   * The amount the summary shows. Read off the core form, not the fee quote, so
   * the row renders $0.00 before anything is typed instead of disappearing.
   */
  readonly summaryAmount = computed<number>(() => {
    this.coreValues();
    return Number(this.sendStateService.coreForm.controls.amount.value) || 0;
  });

  readonly mailingFeePending = computed(
    () => this.paymentFeeService.state().isMailingFeePending
  );

  readonly attachmentFeeLoading = computed(() =>
    this.paymentFeeService.attachmentFeeLoading()
  );

  /**
   * The card endpoint is the only one that splits its fee: `additionalFee` is the
   * carrier's part. The others leave it empty, which reads as `0` here.
   */
  private readonly mailingFee = computed(
    () => Number(this.fee()?.additionalFee) || 0
  );

  /**
   * `serviceFee` already contains `additionalFee`, so once the mailing fee has a row
   * of its own this line must drop it, or the carrier is charged twice.
   */
  readonly processingFee = computed(() => {
    const f = this.fee();
    if (!f) {
      return 0;
    }
    return this.mailingFee()
      ? Number(f.serviceFeeWithoutAdditionalFee)
      : Number(f.serviceFee);
  });

  readonly feeLabel = computed(() =>
    this.sendStateService.sourceId() === 'card'
      ? 'Pass-through processing fee'
      : 'Service fee'
  );

  private readonly isCardSource = computed(
    () => this.sendStateService.sourceId() === 'card'
  );

  private readonly isVirtualCard = computed(
    () => this.sendStateService.methodId() === 'virtual-card'
  );

  /** International is priced into its exchange rate, so it quotes no service fee. */
  readonly isInternational = computed(
    () => this.sendStateService.methodId() === INTERNATIONAL_METHOD
  );

  /**
   * A mailed bank check is priced by the API's own quote — carrier, paper, payee
   * SMS and attachment pages, each on its own line. It replaces the service-fee row.
   */
  readonly mailQuote = computed(() => this.paymentFeeService.state().mailQuote);

  /**
   * Postage and the paper it is printed on, as one line. The quote itemises
   * them, but the cheque cannot be posted without being printed — they are not
   * two choices, and two rows invited the arithmetic rather than answering it.
   */
  readonly mailingLineTotal = computed(() => {
    const quote = this.mailQuote();
    if (!quote) {
      return 0;
    }
    return (Number(quote.shipping) || 0) + (Number(quote.paper) || 0);
  });

  /**
   * Postage is only postage when something is posted. All three of a bank
   * cheque's deliveries publish through the same quote, so the line was calling
   * every one of them a mailing fee; only the mailed one is. The other two are
   * the service fee under its ordinary name.
   */
  readonly deliveryFeeLabel = computed(() =>
    this.sendStateService.methodId() === 'check_mail'
      ? 'Mailing fee'
      : this.feeLabel()
  );

  /**
   * The rails that print no fee line: international is priced into its exchange rate,
   * and a bank check's fee is only settled when the delivery is chosen.
   */
  readonly showsFeeRow = computed(
    () => !this.isInternational() && !this.mailQuote()
  );

  /** A bank check quotes a fee only for print; the rest wait on the delivery modal. */
  readonly feeVariesByDelivery = computed(
    () =>
      this.sourceRegistry.isBankCheck() &&
      this.sendStateService.methodId() !== 'check_print'
  );

  /** The card rail bills its own ACH/processing fee alongside the pass-through one. */
  private readonly cardAchFee = computed(() => this.fee()?.cardAchFee ?? null);

  private readonly cardAchFeeAmount = computed(
    () => Number(this.cardAchFee()?.fee) || 0
  );

  readonly showsSameDayRow = computed(
    () => !!this.cardAchFee() || !!this.fee()?.sameDayFee
  );

  /**
   * The endpoint titles this charge itself, and on a card ACH or a wire that
   * title is the only thing that names it correctly. On a mailed cheque it is
   * postage whatever the endpoint calls it — a wallet's came back titled as a
   * service fee, which put the mailing charge on screen under the wrong name.
   */
  readonly sameDayRowLabel = computed(() =>
    this.sendStateService.methodId() === 'check_mail'
      ? 'Mailing fee'
      : 'ACH fee'
  );

  /** A card is charged its `cardAchFee`; every other rail its `sameDayFee`. */
  readonly sameDayRowAmount = computed(() =>
    this.isCardSource()
      ? this.cardAchFeeAmount()
      : (this.fee()?.sameDayFee?.fee ?? 0)
  );

  /** The plan reduces the card delivery fee to $1, so it is only offered where one is charged. */
  readonly showsFeeUpsell = computed(
    () =>
      this.feeVisible() &&
      !this.isSubscribed() &&
      !!this.cardAchFee() &&
      this.isCardSource() &&
      !this.feeLoading()
  );

  /**
   * The account has never mailed a cheque, so this one is free. Offered beside
   * the fee upsell rather than inside the mailing block: it is about the
   * account, not this cheque, and the mailing block is already the busiest part
   * of the form. Only where it can be earned — a mailed bank cheque — and not
   * to an account that is already paying for a plan.
   */
  readonly showsFirstMailFree = computed(
    () =>
      this.sourceRegistry.isBankCheck() &&
      this.sendStateService.methodId() === 'check_mail' &&
      this.checkMailService.firstMailFree() &&
      !this.isSubscribed()
  );

  /** A virtual card has no delivery to discount, so it gets the pitch without the figures. */
  readonly showsUpsellComparison = computed(
    () => !this.isVirtualCard() && this.showsSameDayRow()
  );

  // -------------------------------------------------------------------------
  // Computed signals — payee
  // -------------------------------------------------------------------------

  /**
   * Every Other Payment Option writes a *check*, so the panel is only offered on the one
   * combination that writes one: a bank account paid out as a check.
   */
  /**
   * The check-writing shortcuts belong to any check flow, not just a bank one —
   * the reference gates them on activeDetailsGroup === 'check'. Process Without
   * stays bank-only below, which is a separate gate in the reference too.
   */
  readonly showsOtherOptions = computed(() => {
    const state = this.sendStateService;
    if (state.isCheckFlow()) {
      return true;
    }
    return (
      state.sourceId() === 'bankaccount' && !state.payAsId() && !state.methodId()
    );
  });

  readonly otherPaymentOptions = OTHER_PAYMENT_OPTIONS;

  readonly processWithout = PROCESS_WITHOUT;

  /** The same form the check details section binds; there is only one instance. */
  readonly checkDetailsForm = this.bankCheckService.detailsForm;

  private readonly hidesProcessWithout =
    this.dynamicWhiteLabelService.dynamicWhiteLabelFlagChecker(
      'isCSNHCRequirement'
    );

  /**
   * Bank check only — these flags change what prints on the check. It rode on
   * showsOtherOptions while that was bank-gated; now that the shortcuts show for
   * every check flow, this needs its own gate, as the reference has.
   */
  readonly showsProcessWithout = computed(
    () =>
      this.sendStateService.sourceId() === 'bankaccount' &&
      this.sendStateService.isCheckFlow() &&
      !this.hidesProcessWithout
  );

  readonly payeeInfo = computed(
    () => this.sendStateService.payeeDetails()?.payee_information ?? null
  );

  /**
   * The payee is in flight: `loadPayee` sets the id and clears the details before
   * fetching, so this is true only while that request is outstanding.
   */
  readonly payeeLoading = computed(
    () =>
      !!this.sendStateService.payeeId() &&
      !this.sendStateService.payeeDetails() &&
      this.sendStateService.payeeFetching()
  );

  /**
   * The payee's banks arrive with the payee details, so a bank-paid method shows a
   * loading bank card exactly while the payee is still loading.
   */
  readonly bankLoading = computed(
    () =>
      BANK_PAID_METHODS.includes(this.sendStateService.methodId() ?? '') &&
      this.payeeLoading()
  );

  /** The avatar letter — the payee's first initial. */
  readonly payeeInitial = computed(
    () => this.payeeInfo()?.payee_name?.trim().charAt(0).toUpperCase() ?? ''
  );

  readonly qrPayeeName = computed(() => this.payeeInfo()?.payee_name ?? '');

  readonly qrAmount = computed(() => {
    const enterAmount = this.sendStateService.coreForm.controls.amount.value;
    const numeric = Number(String(enterAmount ?? '').replace(/[$,]/g, '')) || 0;
    return numeric > 0 ? numeric : null;
  });

  readonly payeeAddressLines = computed(() => {
    const p = this.payeeInfo();
    if (!p) {
      return [];
    }
    const cityStateZip = [p.payee_city, p.payee_state, p.payee_zip]
      .filter(Boolean)
      .join(', ');
    return [
      p.payee_address_line_1,
      p.payee_address_line_2,
      cityStateZip,
      p.payee_country
    ].filter(Boolean);
  });

  /** A queued check cannot have its payee changed under it. */
  readonly payeeEditDisabled = computed(() =>
    this.bankCheckService.isScheduled()
  );

  // -------------------------------------------------------------------------
  // Computed signals — the Payment details summary
  // -------------------------------------------------------------------------

  private readonly coreValues = toSignal(
    this.sendStateService.coreForm.valueChanges.pipe(
      startWith(this.sendStateService.coreForm.getRawValue())
    ),
    { initialValue: null }
  );

  readonly sourceAccountName = computed<string>(() => {
    this.coreValues();
    const controls = this.sendStateService.coreForm.controls;

    if (this.sendStateService.sourceId() === 'wallet') {
      const wallet = controls.wallet.value;
      return wallet
        ? wallet.walletName || wallet.displayName || wallet.bankAccountName || 'Wallet'
        : '';
    }

    if (this.sendStateService.sourceId() === 'card') {
      const card = controls.card.value;
      if (!card) {
        return '';
      }
      return (
        card.nickName ||
        (card.last4 ? `Card •••• ${card.last4}` : card.cardMasked || 'Card')
      );
    }

    const bank = controls.bankAc.value;
    return bank ? bank.nickName || bank.bankName || bank.name || 'Bank account' : '';
  });

  private readonly methodOption = computed(() =>
    this.sendStateService
      .payAsItems()
      .find((m) => m.id === this.sendStateService.payAsId())
  );

  private readonly deliveryOption = computed(() => {
    const delivery = this.sendStateService.checkDelivery();
    return delivery
      ? (CHECK_DELIVERY_OPTIONS.find((o) => o.id === delivery) ?? null)
      : null;
  });

  readonly isCheckFlow = computed(() => this.sendStateService.isCheckSelected());

  readonly summaryMethodLabel = computed<string>(() => {
    const method = this.methodOption()?.name ?? '';
    const delivery = this.deliveryOption()?.name;
    return delivery ? `${method} · ${delivery}` : method;
  });

  readonly summaryTiming = computed<string>(
    () => this.deliveryOption()?.timing ?? this.methodOption()?.processingTime ?? ''
  );

  readonly summaryEmail = computed<string>(() => {
    const recordEmail = this.payeeInfo()?.payee_email ?? '';
    if (this.sendStateService.methodId() !== 'check_email') {
      return recordEmail;
    }
    return this.sendStateService.deliveryEmail().trim() || recordEmail;
  });

  readonly summaryDestination = computed<string>(() => {
    const payee = this.payeeInfo();
    const methodId = this.sendStateService.methodId();
    if (!payee || !methodId) {
      return '';
    }

    if (methodId === 'check_mail') {
      const line = this.payeeAddressLine();
      return line ? `Mail to ${line}` : 'Mail to payee address';
    }

    if (methodId === 'check_email' || methodId === 'virtual-card') {
      const email = this.summaryEmail();
      return email ? `Email ${email}` : 'Email payee';
    }

    if (methodId === 'check_print') {
      return 'Print yourself';
    }

    if (
      BANK_PAID_METHODS.includes(methodId) ||
      methodId === INTERNATIONAL_METHOD
    ) {
      return `To ${payee.payee_name || 'payee'}'s bank account`;
    }

    return '';
  });

  readonly payeeAddressLine = computed<string>(() =>
    this.payeeAddressLines().join(', ')
  );

  /**
   * There is a payment to summarise only once all three of its ends are chosen:
   * who is being paid, the account it leaves from, and how it travels. Short of
   * that the card stood there half-filled with dashes.
   *
   * A cheque written without a payee keeps the card: the tick that cleared the
   * payee is itself a decision, made in this panel.
   */
  readonly summaryVisible = computed(
    () =>
      (!!this.sendStateService.payeeId() ||
        !!this.bankCheckService.blankedPayee()) &&
      !!this.sourceAccountName() &&
      !!this.sendStateService.payAsId()
  );

  /** The carrier's share of the quote — `processingFee` drops it once this shows. */
  readonly mailingFeeAmount = computed(() => this.mailingFee());

  /**
   * Only when nothing else is already showing that charge. `additionalFee` and
   * `cardAchFee` are the same carrier money on a mailed card cheque — the
   * endpoint reports it twice, once anonymously and once with a title of its own
   * — and a row each reads as being billed twice. The titled one wins; this is
   * the fallback for a quote that carries the figure but not the name.
   */
  readonly showsMailingFeeRow = computed(
    () => this.mailingFeeAmount() > 0 && !this.showsSameDayRow()
  );

  readonly intlQuote = computed(() =>
    this.isInternational() ? this.walletPaymentService.quote() : null
  );

  readonly intlQuoteLoading = computed(
    () => this.isInternational() && this.walletPaymentService.quoteLoading()
  );

  readonly promoCallout = computed<IPromoCallout | null>(() => {
    const source = this.sendStateService.sourceId();
    const methodId = this.sendStateService.methodId();

    if (methodId === 'virtual-card') {
      return VIRTUAL_CARD_PROMO;
    }
    if (methodId === INTERNATIONAL_METHOD) {
      return null;
    }
    if (source === 'wallet') {
      return WALLET_PROMO;
    }
    if (source === 'bankaccount') {
      if (methodId === 'ach' || methodId === 'same-ach') {
        return SAME_DAY_PROMO;
      }
      if (methodId === 'wire') {
        return null;
      }
      if (this.isCheckFlow() || methodId === 'let-payee-choose') {
        return TRY_VIRTUAL_CARD_PROMO;
      }
    }
    return null;
  });

  intlCurrencySymbol(code: string): string {
    return INTL_CURRENCY_SYMBOLS[code] || `${code} `;
  }

  // -------------------------------------------------------------------------
  // Computed signals — payee bank
  // -------------------------------------------------------------------------

  /**
   * Only the rails that pay a bank account directly. `ach` also covers the Direct
   * Deposit check tile, which resolves to the same method id.
   */
  readonly payeeBank = computed(() =>
    BANK_PAID_METHODS.includes(this.sendStateService.methodId() ?? '')
      ? this.sendStateService.selectedPayeeBank()
      : null
  );

  readonly accountType = computed(() => {
    const type = this.payeeBank()?.account_type ?? '';
    return ACCOUNT_TYPE_LABELS[type] ?? type;
  });

  /** `bank_name` on the payee bank is the account holder, not the institution. */
  readonly accountHolderName = computed(() => this.payeeBank()?.bank_name ?? '');

  readonly beneficiaryBank = computed(() =>
    this.sendStateService.methodId() === 'wire'
      ? (this.payeeBank()?.beneficiaryBankDetails ?? null)
      : null
  );

  // -------------------------------------------------------------------------
  // Computed signals — payee international bank, a separate entity from the above
  // -------------------------------------------------------------------------

  readonly internationalBank = computed(() =>
    this.sendStateService.methodId() === INTERNATIONAL_METHOD
      ? this.walletPaymentService.selectedInternationalBank()
      : null
  );

  /**
   * The recipient-bank list is loading and none is selected yet. `loadBanks` clears
   * the selection and raises the flag, so this is true only during that fetch; the
   * method guard keeps a stale flag from showing a skeleton under another rail.
   */
  readonly internationalBankLoading = computed(
    () =>
      this.sendStateService.methodId() === INTERNATIONAL_METHOD &&
      this.walletPaymentService.internationalBankLoading() &&
      !this.walletPaymentService.selectedInternationalBank()
  );

  /** A bank names its country through its beneficiary bank details. */
  private readonly interBankCountryCode = computed(
    () => this.internationalBank()?.beneficiaryBankDetails?.country ?? ''
  );

  readonly isIndiaInterBank = computed(
    () => this.interBankCountryCode() === IFSC_COUNTRY
  );

  /** IBAN countries show an IBAN instead of an account number and identifier. */
  readonly isIbanInterBank = computed(() => {
    const code = this.interBankCountryCode();
    return (
      !!code && this.walletPaymentService.internationalIbanCountries().has(code)
    );
  });

  readonly interBeneficiaryBank = computed(
    () => this.internationalBank()?.beneficiaryBankDetails ?? null
  );

  // -------------------------------------------------------------------------
  // Public properties
  // -------------------------------------------------------------------------

  readonly CircleCheckIcon = CircleCheck;
  readonly CircleCheckBigIcon = CircleCheckBig;
  readonly ChevronDownIcon = ChevronDown;
  readonly ChevronUpIcon = ChevronUp;
  readonly LandmarkIcon = Landmark;
  readonly PencilIcon = Pencil;
  readonly GlobeIcon = Globe;
  readonly TriangleAlertIcon = TriangleAlert;
  readonly NoticeIcon = Info;
  readonly CircleAlertIcon = CircleAlert;
  readonly ArrowRightIcon = ArrowRight;
  readonly ClockIcon = Clock;
  readonly InfoIcon = CircleHelp;
  readonly SparklesIcon = Sparkles;

  // -------------------------------------------------------------------------
  // Private properties
  // -------------------------------------------------------------------------

  private lastRoutingLookup = '';

  // -------------------------------------------------------------------------
  // Constructor
  // -------------------------------------------------------------------------

  constructor() {
    effect(
      () => {
        const bank = this.payeeBank();
        const routing = String(bank?.routing_number ?? '');
        if (!routing || routing === this.lastRoutingLookup) {
          return;
        }
        this.lastRoutingLookup = routing;
        this.bankInstitutionName.set('');
        this.resolveBankName(routing);
      },
      { allowSignalWrites: true }
    );
  }

  // -------------------------------------------------------------------------
  // Lifecycle hooks
  // -------------------------------------------------------------------------

  ngOnInit(): void {
    this.isDarkMode.set(this.themeService.getInitialColourTheme());
    this.themeService
      .getThemeSwitch()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((dark) => {
        this.isDarkMode.set(dark);
      });
    this.checkSubscriptionStatus();
  }

  // -------------------------------------------------------------------------
  // Event handlers
  // -------------------------------------------------------------------------

  onOtherPaymentOption(key: string): void {
    if (key === 'blank-check') {
      this.dialog.open(BlankCheckModalV4Component, {
        maxWidth: '450px',
        width: '93%',
        autoFocus: false,
        disableClose: true,
        panelClass: 'paddingless-modal-rounded',
        data: { hideDemoVideo: true }
      });
      return;
    }

    if (key === 'import-check') {
      this.openImportCheck();
      return;
    }

    const path = OTHER_PAYMENT_ROUTES[key];
    if (path) {
      this.router.navigateByUrl(path);
    }
  }

  /**
   * Opens the Excel/CSV check import wizard. The component is lazy-loaded via a
   * dynamic `import()` so it (and its step 2/3 children) stays out of the eager
   * send-receive page chunk that also renders these shortcuts.
   */
  private async openImportCheck(): Promise<void> {
    const { V4ExcelImportComponent } = await import(
      'src/app/shared/modal/v4-thirdparty-imports/v4-excel-import/v4-excel-import/v4-excel-import.component'
    );

    this.dialog.open(V4ExcelImportComponent, {
      maxWidth: '500px',
      width: '93%',
      disableClose: true,
      panelClass: 'paddingless-modal-rounded',
      data: { type: 'checks' }
    });
  }

  toggleFee(): void {
    this.feeOpen.update((open) => !open);
  }

  togglePayee(): void {
    this.payeeOpen.update((open) => !open);
  }

  toggleBank(): void {
    this.bankOpen.update((open) => !open);
  }

  toggleInternationalBank(): void {
    this.internationalBankOpen.update((open) => !open);
  }

  goToSubscription(): void {
    this.reduceMyFeeLoading.set(true);
    this.router.navigate(['v4', 'manage', 'subscription', 'plan'], {
      state: { returnUrl: this.router.url },
      queryParams: { type: 'cc' }
    });
  }

  /**
   * SendComponent hosts the edit modal and reselects the payee on save; the reset to
   * false keeps this BehaviorSubject from reopening it for the next subscriber.
   */
  editPayee(): void {
    if (this.payeeEditDisabled()) {
      return;
    }
    this.payeeService.openPayeeEditModal.next(true);
    this.payeeService.openPayeeEditModal.next(false);
  }

  readonly missingPayeeFields = this.sendStateService.missingPayeeFields;

  /**
   * Opens the payee editor on the field the payment is missing: the address and
   * the company each have their own page, every other gap — the email among
   * them — is the payee form itself.
   *
   * Sent down the same channel as `editPayee`, so SendComponent opens it and
   * reselects the saved payee. Opening the dialog here instead refreshed the
   * payee details but not the payee list the dropdown renders, so an email
   * added from this nudge never appeared under the payee's name.
   */
  openPayeeMissing(modalType: string): void {
    if (!this.sendStateService.payeeId()) {
      return;
    }
    this.payeeService.openPayeeEditModal.next(
      modalType === 'addAddress' ||
        modalType === 'addCompany' ||
        modalType === 'payeeEmail'
        ? { page: modalType }
        : true
    );
    this.payeeService.openPayeeEditModal.next(false);
  }

  editPayeeBank(): void {
    const payeeId = this.sendStateService.payeeId();
    const bank = this.payeeBank();
    if (!payeeId || !bank || this.bankModalService.isBankPermissionChecking()) {
      return;
    }

    const bankId = String(bank.encrypted_id ?? bank.id ?? '');

    this.bankModalService
      .openAddBankNormalModalV4({
        payeeId,
        payeeName: this.payeeInfo()?.payee_name,
        from: this.sendStateService.methodId() ?? undefined,
        ...(bankId && { edit: true, bankId })
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((modal) => {
        modal?.afterClosed().subscribe((result) => {
          if (!result?.success) {
            return;
          }
          // The reload picks the payee's default bank unless told which one to keep;
          // banks-only so the payee card keeps its data and shows no skeleton.
          this.sendStateService.preferredBankId.set(bankId);
          this.sendStateService.reloadPayeeBanks(payeeId);
          this.sendStateService.payeeBankReloadTrigger.update((n) => n + 1);
        });
      });
  }

  editInternationalBank(): void {
    const payeeId = this.sendStateService.payeeId();
    const bank = this.internationalBank();
    if (!payeeId || !bank) {
      return;
    }

    const bankId = String(bank.encrypted_id ?? '');
    if (!bankId) {
      return;
    }

    const details = this.walletPaymentService.detailsForm.controls;
    const dialogData: AddPayeeInternationalBankDialogData = {
      payeeId,
      edit: true,
      bankId,
      accordionMode: true,
      payeePhone: details.payeePhone.value || '',
      // The payment already committed to a recipient type; lock the modal to it.
      paymentRecipientType:
        details.recipientType.value === 'personal' ? 'personal' : 'business'
    };

    this.dialog
      .open(AddPayeeInternationalBankV4Component, {
        autoFocus: false,
        disableClose: true,
        maxWidth: '95%',
        width: '600px',
        panelClass: 'paddingless-modal-rounded',
        data: dialogData
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (!result?.success) {
          return;
        }
        // Keep the edited bank selected, then reload the dropdown off the same id.
        this.walletPaymentService.preferredInternationalBankId.set(
          bank.encrypted_id
        );
        this.walletPaymentService.internationalBankReloadTrigger.update(
          (n) => n + 1
        );
      });
  }

  // -------------------------------------------------------------------------
  // API methods
  // -------------------------------------------------------------------------

  private checkSubscriptionStatus(): void {
    // eslint-disable-next-line no-underscore-dangle
    this.headerService._headerData
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((headerData) => {
        if (typeof headerData === 'boolean') {
          return;
        }
        this.isSubscribed.set(headerData.isSubscribed === 1);
      });
  }

  private resolveBankName(routing: string): void {
    this.bankAccountsService
      .getroutingNumber(routing)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          const name = res?.data?.name;
          this.bankInstitutionName.set(
            name && name !== UNRESOLVED_BANK_NAME
              ? name
              : (this.payeeBank()?.beneficiaryBankDetails
                  ?.bankingInstituteName ?? '')
          );
        }
      });
  }
}

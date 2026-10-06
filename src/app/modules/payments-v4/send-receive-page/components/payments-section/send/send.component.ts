import {
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
  untracked,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  OnInit,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltip } from '@angular/material/tooltip';
import { Store } from '@ngrx/store';
import { merge } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, take } from 'rxjs/operators';
// eslint-disable-next-line import/no-extraneous-dependencies
import {
  Building2,
  ChevronDown,
  CircleCheck,
  DollarSign,
  FileText,
  History,
  Info,
  LucideAngularModule,
  Mail,
  MessageSquare,
  Paperclip,
  Pencil,
  Printer,
  ReceiptText,
  Send,
  TriangleAlert
} from 'lucide-angular';

import type { IV3DropDownOnReady } from 'src/app/models/common';
import type { IWalletData } from 'src/app/models/wallet';
import type { IDynamicWhiteLabelFlags } from 'src/app/modules/dynamic-white-label/model/dynamic-white-label.model';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import type { IPayeeDropdown } from 'src/app/modules/payee/payee-v2/model/payee';
import { PayeeDataV35Service } from 'src/app/modules/payee/payee-v3/v35-services/payee-data-v35.service';
import { TransactionHistoryModalV4Component } from 'src/app/modules/payments-v4/shared/modals/transaction-history-modal-v4/transaction-history-modal-v4.component';
import { payeesActions } from 'src/app/modules/store/payees/payees.actions';
import { WhiteLabelPipe } from 'src/app/pipes/white-label.pipe';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { PayeeModalService } from 'src/app/shared/service/payee-modal/payee-modal.service';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { CommonAmountInputV4Component } from 'src/app/shared/V4/common-amount-input-v4/common-amount-input-v4.component';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';
import { IPayFromSource } from 'src/app/shared/components/v4/dropdowns/pay-from-dropdown-v4/pay-from-dropdown-v4.component';
import { IPaymentMethodOption } from 'src/app/shared/components/v4/dropdowns/payment-method-dropdown-v4/payment-method-dropdown-v4.component';
import { IHeaderData } from 'src/app/layout/model/header';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { RecurringRedirectService } from 'src/app/shared/service/recurring-redirect/recurring-redirect.service';
import { PaymentSecuredBadgeComponent } from '../shared/payment-secured-badge/payment-secured-badge.component';
import {
  CheckDeliveryComponent,
  type IDeliveryTile
} from './check-delivery/check-delivery.component';
import { SpFocusAnchorDirective } from './field-focus/sp-focus-anchor.directive';
import { SpShakeOnDirective } from './field-focus/sp-shake-on.directive';
import { FieldFocusRegistry } from './field-focus/field-focus.registry';
import { focusField, shakeElement } from './field-focus/shake';
import { SpPayeeDropdownComponent } from './dropdowns/sp-payee-dropdown/sp-payee-dropdown.component';
import { SpCardsDropdownComponent } from './dropdowns/sp-cards-dropdown/sp-cards-dropdown.component';
import { SpBankAcDropdownComponent } from './dropdowns/sp-bank-ac-dropdown/sp-bank-ac-dropdown.component';
import { SpWalletDropdownComponent } from './dropdowns/sp-wallet-dropdown/sp-wallet-dropdown.component';

import { SpPaymentMethodDropdownComponent } from './dropdowns/sp-payment-method-dropdown/sp-payment-method-dropdown.component';
import { SpPayFromDropdownComponent } from './dropdowns/sp-pay-from-dropdown/sp-pay-from-dropdown.component';
import { SendReceivePageService } from '../../../services/send-receive-page.service';
import { BankCheckComponent } from './bank/components/bank-check/bank-check.component';
import { BankPaymentComponent } from './bank/components/bank-payment/bank-payment.component';
import { ExportCheckSectionComponent } from './bank/components/export-check-section/export-check-section.component';
import { BankCheckService } from './bank/services/bank-check.service';
import { ExportCheckService } from './bank/services/export-check.service';
import { CardPaymentComponent } from './card/components/card-payment/card-payment.component';
import { CardPaymentService } from './card/services/card-payment.service';
import { AccountVerificationService } from './shared/services/account-verification.service';
import {
  CHECK_DELIVERY_OPTIONS,
  CheckDeliveryId,
  ICheckDeliveryOption
} from './shared/models/check-delivery';
import { DefaultPaymentQuickSetService } from './shared/services/default-payment-quick-set.service';
import { PaymentActivityService } from './shared/services/payment-activity.service';
import { CheckMailService } from './shared/services/check-mail.service';
import { PaymentConfirmService } from './shared/services/payment-confirm.service';
import { PaymentFeeService } from './shared/services/payment-fee.service';
import { SendHydrationService } from './shared/services/send-hydration.service';
import { SendSourceRegistryService } from './shared/services/send-source-registry.service';
import { WalletPaymentService } from './wallet/services/wallet-payment.service';
import { ISendSourceService } from './shared/models/send-source.model';
import { SendStateService } from './shared/services/send-state.service';
import { SharedDetailsSyncService } from './shared/services/shared-details-sync.service';
import { InternationalPaymentComponent } from './wallet/components/international-payment/international-payment.component';
import { InternationalAdditionalDetailsComponent } from './wallet/components/international-payment/international-additional-details.component';
import { InternationalPaymentUiService } from './wallet/services/international-payment-ui.service';
import { WalletPaymentComponent } from './wallet/components/wallet-payment/wallet-payment.component';

const BLANK_AMOUNT_BLOCKED_DELIVERIES: Partial<
  Record<CheckDeliveryId, string>
> = {
  mail: 'Blank check cannot be mailed',
  email: 'Blank check cannot be emailed',
  ach: 'Blank check cannot be sent by direct deposit'
};

const MIN_INTERNATIONAL_WALLET_BALANCE = 10;

/** The payee modal's own section names. */
type PayeeEditPage =
  | 'addBankDetails'
  | 'addAddress'
  | 'addInternationalBankDetails'
  | 'addCompany'
  | 'payeeEmail';

/**
 * Which page of the payee modal answers each gap. Anything unlisted opens the
 * form as it is — the modal scrolls to the page it is given and marks it, so a
 * gap with no page here lands the user mid-form with nothing pointed at.
 */
const PAYEE_EDIT_PAGES: Record<string, PayeeEditPage | undefined> = {
  addAddress: 'addAddress',
  addCompany: 'addCompany',
  payeeEmail: 'payeeEmail'
};
const INSTANT_PAYMENT_METHODS = ['rtp', 'virtual-card', 'international-payment'];
const PAYEE_BANK_METHODS = ['ach', 'same-ach', 'wire'];
const AMOUNT_DEBOUNCE_MS = 1500;

const ACCOUNT_KEYS = new Set(['bankAc', 'card', 'wallet']);

/** payeeEmail no longer has a field of its own: it is seeded from the payee and
 *  surfaced as the missing-details warning, so a block on it points there. */
const PAYEE_KEYS = new Set(['payeeEmail']);

/**
 * Check controls the master owns. They are bound through component inputs, not
 * `formControlName`, and their fields moved out of the rails, so a blocked
 * submit had nothing to scroll to and failed silently. Point each at the anchor
 * that actually renders it.
 */
const CHECK_KEY_ANCHORS = new Map<string, string>([
  ['shippingType', 'bankMailShip'],
  ['customShippingFrom', 'checkMailing'],
  ['customShippingTo', 'checkMailing'],
  ['isCustomAddress', 'checkMailing']
]);

/**
 * Check fields with no field on the page: they are only ever edited in the
 * check-details modal. Shaking the mailing block for them says nothing, since
 * the message belongs to a control the user cannot see.
 */
const CHECK_MODAL_KEYS = new Set(['checkNumber', 'issueDate']);

@Component({
  selector: 'app-send',
  standalone: true,
  imports: [
    CommonModule,
    CheckDeliveryComponent,
    SpFocusAnchorDirective,
    SpShakeOnDirective,
    ReactiveFormsModule,
    LucideAngularModule,
    FaIconComponent,
    MatTooltip,
    WhiteLabelPipe,
    CommonAmountInputV4Component,
    PaymentSecuredBadgeComponent,
    CommonButtonV4Component,
    V4ControlMessageComponent,
    SpPayeeDropdownComponent,
    SpCardsDropdownComponent,
    SpBankAcDropdownComponent,
    SpWalletDropdownComponent,
    SpPayFromDropdownComponent,
    SpPaymentMethodDropdownComponent,
    WalletPaymentComponent,
    InternationalPaymentComponent,
    InternationalAdditionalDetailsComponent,
    CardPaymentComponent,
    BankPaymentComponent,
    BankCheckComponent,
    ExportCheckSectionComponent
  ],
  providers: [InternationalPaymentUiService],
  templateUrl: './send.component.html',
  styleUrls: ['./send.component.scss']
})
export class SendComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly fieldFocus = inject(FieldFocusRegistry);
  private readonly hostEl = inject(ElementRef<HTMLElement>);
  private readonly injector = inject(Injector);
  private readonly dialog = inject(MatDialog);
  private readonly store = inject(Store);
  readonly paymentsService = inject(PaymentsService);
  private readonly payeeService = inject(PayeeService);
  private readonly payeeModalService = inject(PayeeModalService);
  private readonly v4AlertService = inject(V4AlertService);
  private readonly dynamicWhiteLabelService = inject(DynamicWhiteLabelService);
  private readonly cardPaymentService = inject(CardPaymentService);
  private readonly bankCheckService = inject(BankCheckService);
  private readonly walletPaymentService = inject(WalletPaymentService);
  private readonly intlUiService = inject(InternationalPaymentUiService);
  private readonly sendHydrationService = inject(SendHydrationService);
  private readonly accountVerificationService = inject(AccountVerificationService);
  private readonly paymentFeeService = inject(PaymentFeeService);
  private readonly paymentActivityService = inject(PaymentActivityService);
  private readonly checkMailService = inject(CheckMailService);
  private readonly sendSourceRegistryService = inject(SendSourceRegistryService);
  private readonly recurringRedirect = inject(RecurringRedirectService);
  private readonly exportCheckService = inject(ExportCheckService);
  private readonly headerService = inject(HeaderService);

  readonly payeeDataService = inject(PayeeDataV35Service);
  readonly sendReceivePageService = inject(SendReceivePageService);
  readonly sendStateService = inject(SendStateService);
  readonly paymentConfirmService = inject(PaymentConfirmService);
  readonly defaultPaymentQuickSetService = inject(DefaultPaymentQuickSetService);

  @ViewChild('payeeDropdown')
  payeeDropdownV4Component: SpPayeeDropdownComponent;

  /** Only rendered on the bank rail — the same dropdown owns the add-bank modal. */
  @ViewChild(SpBankAcDropdownComponent)
  bankAcDropdown?: SpBankAcDropdownComponent;

  readonly detailsOpen = signal(false);
  private readonly changingDelivery = signal(false);
  private readonly dialogOpen = signal(false);
  private readonly activeAction = signal<'save' | 'confirm' | null>(null);

  /** Until the server fills the form (EDIT / CLONE / default payment) the page waits. */
  readonly loading = this.sendHydrationService.loading;
  /** The active rail's own details form — memo lives there, so its validators do too. */
  readonly activeDetailsForm = computed(
    () => this.sendSourceRegistryService.active().detailsForm
  );

  readonly memoConfig = computed(
    () =>
      this.sendSourceRegistryService.active().memoConfig?.() ?? {
        visible: false,
        maxLength: 100,
        required: false
      }
  );

  /**
   * Read from the control, never duplicated. Each rail sets its own memo
   * validators imperatively, so any second copy of the rule drifts — that is how
   * let-payee-choose came to show a required marker on an optional field.
   */
  memoRequired(): boolean {
    return (
      this.activeDetailsForm().controls.memo?.hasValidator(
        Validators.required
      ) ?? false
    );
  }

  memoLength(): number {
    const value = this.activeDetailsForm().controls.memo?.value;
    return typeof value === 'string' ? value.length : 0;
  }

  readonly missingPayeeFields = this.sendStateService.missingPayeeFields;

  /**
   * What the prompt under the payee dropdown offers: everything the payment is
   * missing. A mailed check also has its own mailing-address affordance further
   * down, and the address was once hidden here on that account — but the fee
   * panel goes on listing it, so the page contradicted itself about whether the
   * payment was ready.
   */
  readonly visibleMissingPayeeFields = this.missingPayeeFields;

  /** Joined so spShakeOn sees a changed value; a bare array never compares equal. */
  readonly missingPayeeKey = computed(() =>
    this.visibleMissingPayeeFields()
      .map((f) => f.key)
      .join(',')
  );

  /** Opens the payee editor on the field that is missing, then re-reads the payee. */
  /**
   * Why the payee is blocking, when it is not simply missing something.
   * `missingPayeeFields` only knows about empty values, so a payee whose email
   * is present but malformed — or is the sender's own — was refused with a
   * shake and no words. This reads the control the rails actually validate.
   */
  readonly payeeDataError = computed<string | null>(() => {
    if (this.missingPayeeFields().length) {
      return null;
    }
    const control = this.activeDetailsForm().get('payeeEmail');
    if (!control || control.valid || !control.value) {
      return null;
    }
    if (control.hasError('sameEmailAddress')) {
      return "This payee's email is your own — use a different address";
    }
    return "This payee's email address is not valid";
  });

  /**
   * An address or company gap is its own page in the editor; every other gap —
   * the email among them — is the payee form itself.
   *
   * Routed through the same opener the Edit-payee button uses, so the result
   * lands in `reselectEditedPayee`. Opening the dialog here directly patched
   * only the form control, and left the payee list the dropdown renders holding
   * the row as it was — a payee whose email had just been added still showed up
   * in the list with no email under its name.
   */
  openPayeeFieldEditor(modalType = 'payeeEmail'): void {
    const payee = this.coreForm.controls.payee.value;
    if (!payee?.id) {
      return;
    }
    this.openPayeeEditModal(payee.id, PAYEE_EDIT_PAGES[modalType]);
  }

  readonly deliveryError = this.sendStateService.deliveryError;
  readonly noPayeeBlocked = this.sendStateService.noPayeeBlocked;
  readonly billLocked = this.sendHydrationService.billLocked;
  readonly gatewayType = this.cardPaymentService.gatewayType;
  readonly attachmentCount = this.paymentActivityService.attachmentCount;

  /**
   * What the Attachment badge counts. On a mailed check the envelope decides:
   * one that is not enclosed goes nowhere, so counting it here contradicted the
   * `n/n` on the Attach-to-envelope control in the same form. Every other rail
   * sends whatever is on the payment, so there the two are the same number.
   */
  readonly visibleAttachmentCount = computed(() =>
    this.sendStateService.methodId() === 'check_mail'
      ? this.checkMailService.envelopeAttachmentIds().length
      : this.attachmentCount()
  );

  readonly commentCount = this.paymentActivityService.commentCount;
  readonly hasRemittance = this.paymentActivityService.hasRemittance;
  readonly remittanceCount = this.paymentActivityService.remittanceCount;
  readonly isBankCheck = this.sendSourceRegistryService.isBankCheck;

  readonly defaultPayFromId = computed(
    () => this.sendHydrationService.defaultPayment()?.payFrom?.id ?? null
  );

  readonly defaultPayAsId = computed(
    () => this.sendHydrationService.defaultPayment()?.payAs?.id ?? null
  );

  readonly defaultBankAccountId = computed(() => {
    const d = this.sendHydrationService.defaultPayment();
    if (d?.payFrom?.id !== 'bankaccount') {
      return null;
    }
    return (d?.paymentAc as { id?: string | number })?.id ?? null;
  });

  readonly defaultCardId = computed(() => {
    const d = this.sendHydrationService.defaultPayment();
    if (d?.payFrom?.id !== 'card') {
      return null;
    }
    return (d?.paymentAc as { cardId?: string })?.cardId ?? null;
  });

  readonly defaultWalletId = computed(() => {
    const d = this.sendHydrationService.defaultPayment();
    if (d?.payFrom?.id !== 'wallet') {
      return null;
    }
    return (d?.paymentAc as { id?: string })?.id ?? null;
  });

  private readonly actionLoading = computed(
    () => this.paymentConfirmService.processing() && !this.dialogOpen()
  );

  readonly saveLoading = computed(
    () => this.actionLoading() && this.activeAction() === 'save'
  );

  readonly confirmLoading = computed(
    () => this.actionLoading() && this.activeAction() === 'confirm'
  );

  /**
   * The payee is being re-read after an edit. Neither button can answer for the
   * seconds that takes — the record they would be judged against is the one
   * being replaced — so both wait rather than refusing over details the user has
   * just corrected.
   */
  readonly payeeRefreshing = this.sendStateService.payeeRefreshing;

  readonly isBank = computed(
    () => this.sendStateService.sourceId() === 'bankaccount'
  );

  readonly isCard = computed(() => this.sendStateService.sourceId() === 'card');

  readonly isVirtualCard = computed(
    () => this.sendStateService.methodId() === 'virtual-card'
  );

  readonly isInternational = computed(
    () => this.sendStateService.methodId() === 'international-payment'
  );

  /**
   * International refuses a submit once the transaction limit is hit, and the
   * reference disables Confirm outright rather than letting the click fail.
   * The gate is the limit card the international component registers.
   */
  readonly isLimitLocked = computed(
    () =>
      this.isInternational() &&
      (this.walletPaymentService.limitGate()?.isLockedForSubmit() ?? false)
  );

  readonly isInternationalPrefilling = computed(
    () =>
      this.isInternational() &&
      this.intlUiService.isPrefilling()
  );

  readonly isCheckScheduled = computed(
    () => this.isBankCheck() && this.bankCheckService.isScheduled()
  );

  readonly blanksAmount = computed(
    () => this.isBankCheck() && this.bankCheckService.blankedAmount()
  );

  readonly blanksPayee = computed(
    () => this.isBankCheck() && this.bankCheckService.blankedPayee()
  );

  readonly hidesRemittance = computed(
    () => this.isBankCheck() && this.flag('isCSNHCRequirement')
  );

  readonly remittanceComingSoon = computed(
    () => this.sendStateService.methodId() === 'let-payee-choose'
  );

  readonly checkDeliveryOptions = computed<IDeliveryTile[]>(() => {
    const isCsnhc = this.flag('isCSNHCRequirement');
    const hidesPrint = this.flag('hidePaymentTableFilter');
    const blanked = this.blanksAmount();

    return CHECK_DELIVERY_OPTIONS.filter((option) => {
      switch (option.id) {
        case 'mail':
        case 'email':
          return !isCsnhc;
        case 'ach':
          return (
            !isCsnhc &&
            this.sendStateService.sourceId() !== 'wallet' &&
            !this.sendStateService.hidesDirectDeposit()
          );
        case 'printCheck':
          return !hidesPrint || this.flag('isCompassRequirement') || isCsnhc;
        case 'printWhiteCheck':
          return !hidesPrint;
        default:
          return true;
      }
    }).map((option) => {
      const reason = blanked
        ? BLANK_AMOUNT_BLOCKED_DELIVERIES[option.id]
        : undefined;

      return { ...option, disabled: !!reason, disabledReason: reason ?? '' };
    });
  });

  readonly selectedDeliveryOption = computed(
    () =>
      this.checkDeliveryOptions().find(
        (option) => option.id === this.sendStateService.checkDelivery()
      ) ?? null
  );

  readonly showDeliveryPicker = computed(
    () => this.changingDelivery() || !this.selectedDeliveryOption()
  );

  readonly saveLabel = computed(() =>
    this.sendStateService.mode() === 'EDIT' ? 'Update Payment' : 'Save Payment'
  );

  /**
   * Use charging for the confirmed payment processing state, while confirmLoading should remain for pre-confirmation checks and authorization steps.
   */
  readonly confirmLabel = computed(() => {
    if (!this.isCard()) {
      return 'Confirm Payment Details';
    }
    return this.confirmLoading() && this.paymentConfirmService.charging()
      ? 'Processing'
      : 'Continue to Authorization';
  });

  minAmountMessage(): string {
    const min = this.coreForm.controls.amount.hasError('min')
      ? this.coreForm.controls.amount.getError('min')?.min
      : undefined;

    return `Please enter at least $${Number(min ?? 0.01).toFixed(2)}`;
  }

  private readonly isInstantPayment = computed(() =>
    INSTANT_PAYMENT_METHODS.includes(this.sendStateService.methodId() ?? '')
  );

  readonly hidesSave = computed(
    () =>
      this.isInstantPayment() ||
      this.sendStateService.methodId() === 'let-payee-choose' ||
      this.isApprovedPaymentReadOnly()
  );

  readonly showsDetailTools = computed(() => {
    if (this.isBankCheck()) {
      return true;
    }
    return (
      !this.isInstantPayment() &&
      this.sendStateService.methodId() !== 'check_email'
    );
  });

  readonly showsExportCheck = computed(() => {
    if (!this.isBank() || !this.exportCheckService.hasAnyPlatform()) {
      return false;
    }
    if (this.isBankCheck()) {
      return true;
    }
    return (
      this.sendStateService.methodId() === 'ach' &&
      this.exportCheckService.hasNetsuite()
    );
  });

  /**
   * Locks the core section (amount, source, account, payee, method) and feeds the
   * bank rail's input. Both flags live on SendStateService so the wallet rail's
   * service can read them too.
   *
   * A wallet payment ignores the approval policy: in v35 the whole wallet form —
   * amount, source and payee included — is bound to the policy-independent
   * `isApprovedPaymentSkipUpdate`. V4 moved those controls up into this parent,
   * so the wallet case has to opt out of the policy check here to match. Bank and
   * card stay policy-gated, exactly as v35 leaves them.
   */
  isApprovedPaymentReadOnly = computed(() =>
    this.sendStateService.sourceId() === 'wallet'
      ? this.sendStateService.isApprovedSkipUpdate()
      : this.sendStateService.isApprovedReadOnly()
  );

  readonly coreForm = this.sendStateService.coreForm;

  readonly ChevronDownIcon = ChevronDown;
  readonly HistoryIcon = History;
  readonly PaperclipIcon = Paperclip;
  readonly PencilIcon = Pencil;
  readonly MessageSquareIcon = MessageSquare;
  readonly ReceiptTextIcon = ReceiptText;
  readonly CircleCheckIcon = CircleCheck;
  readonly DollarSignIcon = DollarSign;
  readonly InfoIcon = Info;
  readonly TriangleAlertIcon = TriangleAlert;

  private readonly deliveryIcons: Record<ICheckDeliveryOption['icon'], object> =
    {
      mail: Mail,
      send: Send,
      printer: Printer,
      'file-text': FileText,
      building: Building2
    };

  /** The source fallback has run; a later selection is the user's, not ours. */
  private sourceDefaulted = false;

  constructor() {
    inject(SharedDetailsSyncService);

    this.loadExportOptionsForBank();
    this.defaultSourceWhenMissing();
    this.watchInternationalMethod();
    this.watchPayeeDisable();
    this.watchUnavailableDelivery();
    this.destroyRef.onDestroy(() => this.paymentsService.hasAmount.set(false));
  }

  private watchFocusRequests(): void {
    effect(
      () => {
        const request = this.sendStateService.focusRequest();
        if (!request) {
          return;
        }
        afterNextRender(() => this.revealField(request.key), {
          injector: this.injector
        });
      },
      { injector: this.injector }
    );
  }

  private revealField(key: string): void {
    // Open the check on the field that refused. The submit has already marked
    // the whole details form touched, so the modal renders the inline message
    // against the control the moment it appears.
    if (CHECK_MODAL_KEYS.has(key) && this.isBankCheck()) {
      this.bankCheckService.checkModalRequest.update((n) => n + 1);
      return;
    }

    const anchor = ACCOUNT_KEYS.has(key)
      ? 'account'
      : PAYEE_KEYS.has(key)
        ? 'payee'
        : (CHECK_KEY_ANCHORS.get(key) ?? key);
    const host = this.hostEl.nativeElement as HTMLElement;
    const el =
      this.fieldFocus.resolve(anchor) ??
      host.querySelector<HTMLElement>(`[data-field="${anchor}"]`) ??
      host.querySelector<HTMLElement>(`[formcontrolname="${key}"]`);
    if (!el) {
      // Nothing renders this control. Falling back on the payee row is wrong,
      // but silence is worse: the user gets no signal at all that the submit
      // was refused. Shake the details panel so the block is at least located.
      const panel = host.querySelector<HTMLElement>('[data-field="checkMailing"]')
        ?? host.querySelector<HTMLElement>('[data-field="payee"]');
      if (panel) {
        focusField(panel);
        shakeElement(panel);
      }
      return;
    }
    focusField(el);
    // The anchor is the field's own group — its label, control and message —
    // so shaking it points at what is wrong. Only the amount's anchor is a
    // whole section, and that is the one field where a row-sized shake reads
    // as nothing, because the field is already the largest thing on screen.
    shakeElement(el);
  }

  ngOnInit(): void {
    this.recurringRedirect.reset();
    this.watchFocusRequests();
    this.sendHydrationService.hydrate(
      this.sendReceivePageService.routeConfig()
    );
    this.accountVerificationService.start();
    this.getHeaderData();
    this.clearPermissionNotice();
    this.watchPayee();
    this.watchAmount();
    this.watchCard();
    this.watchSourceAccount();
    this.watchWalletBalance();
    this.watchPaymentFinished();
    this.watchDialogState();
    this.hostPayeeEditModal();
  }

  private loadExportOptionsForBank(): void {
    effect(() => {
      if (this.isBank()) {
        this.exportCheckService.loadOptions();
      }
    });
  }

  private defaultSourceWhenMissing(): void {
    effect(
      () => {
        if (
          this.sourceDefaulted ||
          this.loading() ||
          this.sendStateService.sourceId()
        ) {
          return;
        }
        if (this.sendStateService.mode() !== 'CREATE') {
          return;
        }

        // The source only. Which rail the money takes is the user's answer to
        // give, and a saved default payment is the one thing allowed to answer
        // it for them — it runs before this and leaves `sourceId` set, so this
        // never fires over the top of it.
        this.sourceDefaulted = true;
        untracked(() => this.sendStateService.selectSourceById('bankaccount'));
      },
      { allowSignalWrites: true }
    );
  }

  private watchInternationalMethod(): void {
    effect(
      () => {
        const intl = this.isInternational();
        untracked(() =>
          this.evaluateWalletBalance(this.coreForm.controls.wallet.value, intl)
        );
      },
      { allowSignalWrites: true }
    );
  }

  private watchPayeeDisable(): void {
    effect(
      () => {
        if (this.blanksPayee()) {
          untracked(() => {
            this.payeeDropdownV4Component.clearSelection();
          });
        }
      },
      { allowSignalWrites: true }
    );
  }

  private watchUnavailableDelivery(): void {
    effect(
      () => {
        const options = this.checkDeliveryOptions();
        const current = this.sendStateService.checkDelivery();
        const blocked =
          !!current &&
          !options.some((option) => option.id === current && !option.disabled);
        if (!blocked) {
          return;
        }

        untracked(() => {
          this.sendStateService.clearCheckDelivery();
          this.changingDelivery.set(false);
          this.paymentFeeService.recompute();
          this.resolvePayeeBankVerification();
        });
      },
      { allowSignalWrites: true }
    );
  }

  onSourceChange(source: IPayFromSource | null | undefined): void {
    this.sendReceivePageService
      .evaluateSource(source)
      .pipe(take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe((decision) => {
        if (decision.action === 'reset') {
          this.restoreSource();
          return;
        }
        if (decision.action === 'moveToBank') {
          this.selectSourceById('bankaccount');
          return;
        }
        this.applySource(source);
      });
  }

  /** The page service holds every rule; this only carries out the answer. */
  onMethodChange(method: IPaymentMethodOption | null | undefined): void {
    this.sendReceivePageService
      .evaluateMethod(this.sendStateService.sourceId(), method)
      .pipe(take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe((decision) => {
        if (decision.action === 'reset') {
          this.restoreMethod();
          return;
        }
        if (decision.action === 'moveToWallet') {
          this.moveToWallet(decision.methodId);
          return;
        }
        this.applyMethod(method);
      });
  }

  /**
   * The tile is styled shut rather than natively `disabled` — a disabled button
   * swallows the hover its tooltip needs — so the guard has to live here.
   */
  onCheckDeliveryChange(option: IDeliveryTile): void {
    if (option.disabled) {
      return;
    }

    this.sendStateService.selectCheckDelivery(option.id);
    this.sendStateService.deliveryError.set(false);
    this.changingDelivery.set(false);
    this.paymentFeeService.recompute();
    this.resolvePayeeBankVerification();
  }

  /** UI only: re-open the delivery grid over the current selection. */
  changeDelivery(): void {
    this.changingDelivery.set(true);
  }

  /** A mailed check is priced per carrier, so the fee follows the choice. */
  onShippingTypeChange(): void {
    this.paymentFeeService.recompute();
  }

  deliveryIcon(option: ICheckDeliveryOption): object {
    return this.deliveryIcons[option.icon];
  }

  /** `?payee_id` — the dropdown hands over its id-resolver once its list is in. */
  onPayeeReady(event: IV3DropDownOnReady): void {
    const id = this.sendStateService.preferredPayeeId();
    if (id && event.setItemWithId) {
      event.setItemWithId(id);
    }
  }

  onBankDropdownReady(event: IV3DropDownOnReady): void {
    const selectedBank = this.coreForm.controls.bankAc.value;
    if (event?.setItemWithId && selectedBank && selectedBank?.id) {
      event.setItemWithId(selectedBank?.id);
    }
  }

  /**
   * The delivery block has no bank picker of its own, so its "add your first
   * bank account" chip delegates here: the dropdown opens the modal, files the
   * new account into the store and selects it, all without leaving the payment.
   */
  openAddBankAccount(): void {
    this.bankAcDropdown?.addNewBankAccount();
  }

  onCardDropdownReady(event: IV3DropDownOnReady): void {
    const selectedCard = this.coreForm.controls.card.value;
    if (event?.setItemWithId && selectedCard && selectedCard?.cardId) {
      event.setItemWithId(selectedCard?.cardId);
    }
  }

  autoPopulateWallet(event: IV3DropDownOnReady): void {
    const selectedWallet = this.coreForm.controls.wallet.value;
    if (event?.setItemWithId && selectedWallet && selectedWallet?.cardId) {
      event.setItemWithId(selectedWallet?.cardId);
    }
  }

  toggleDetails(): void {
    this.detailsOpen.update((open) => !open);
  }

  /** What this payee has been paid before. */
  openPayeeSummary(): void {
    this.dialog.open(TransactionHistoryModalV4Component, {
      maxWidth: '1200px',
      width: '93%',
      maxHeight: '860px',
      disableClose: true,
      panelClass: 'paddingless-modal-rounded'
    });
  }

  openAttachments(): void {
    this.paymentActivityService.openAttachments();
  }

  openComments(): void {
    this.paymentActivityService.openComments();
  }

  openRemittance(): void {
    if (this.remittanceComingSoon()) {
      return;
    }
    this.paymentActivityService.openRemittance();
  }

  onSave(): void {
    this.activeAction.set('save');
    this.submit((source) => source.save());
  }

  onConfirm(): void {
    this.activeAction.set('confirm');
    this.submit((source) => source.confirm());
  }

  private watchDialogState(): void {
    this.dialog.afterOpened
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.dialogOpen.set(true));

    this.dialog.afterAllClosed
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.dialogOpen.set(false));
  }

  /** A refusal raised on another page must not greet the user on this one. */
  private clearPermissionNotice(): void {
    this.paymentsService.isPermissionDenied.next({
      noPermission: false,
      payMethode: ''
    });
  }

  private watchPayee(): void {
    this.coreForm.controls.payee.valueChanges
      .pipe(distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((payee) => {
        if (payee && payee.name === 'Payee Name') {
          return;
        }
        if (payee?.id) {
          this.sendStateService.loadPayee(payee.id);
        } else {
          this.sendStateService.clearPayee();
        }
      });
  }

  /**
   * `hasAmount` is not a request, so it is set with no debounce. The fee and the two
   * card calls are: `decide-gateway` re-filters the card list, so firing between
   * keystrokes would snatch a card away mid-amount.
   */
  private watchAmount(): void {
    this.coreForm.controls.amount.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((amount) =>
        this.paymentsService.hasAmount.set(Boolean(amount))
      );

    this.coreForm.controls.amount.valueChanges
      .pipe(
        debounceTime(AMOUNT_DEBOUNCE_MS),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.paymentFeeService.recompute();
        this.cardPaymentService.runAmountChecks();
      });
  }

  private watchCard(): void {
    this.coreForm.controls.card.valueChanges
      .pipe(distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((card) => {
        this.resolvePayeeBankVerification();

        if (card) {
          this.cardPaymentService.checkTransLimit(
            Number(this.coreForm.controls.amount.value)
          );
        }
      });
  }

  private watchSourceAccount(): void {
    merge(
      this.coreForm.controls.bankAc.valueChanges,
      this.coreForm.controls.wallet.valueChanges
    )
      .pipe(
        distinctUntilChanged(
          (a, b) =>
            (a as { id?: string } | null)?.id ===
            (b as { id?: string } | null)?.id
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.resolvePayeeBankVerification();
        this.sendHydrationService.checkBillBankMapped();
      });
  }

  private watchWalletBalance(): void {
    this.coreForm.controls.wallet.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((wallet) => this.evaluateWalletBalance(wallet));
  }

  private watchPaymentFinished(): void {
    this.sendStateService.paymentId.set(undefined);
    this.paymentConfirmService.successClosed
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result === 'new' || result === 'done') {
          this.startNewPayment();
        }
      });

    this.paymentConfirmService.resetRequested
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.startNewPayment());
  }

  private hostPayeeEditModal(): void {
    this.payeeService.openPayeeEditModal
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((request) => {
        if (!request) {
          return;
        }
        const page = typeof request === 'object' ? request.page : undefined;
        const { payee } = this.coreForm.getRawValue();
        if (payee?.id) {
          this.openPayeeEditModal(payee.id, page);
        }
      });
  }

  // ---------------------------------------------------------------------------
  // Private helpers — source / method
  // ---------------------------------------------------------------------------

  private applySource(source: IPayFromSource | null | undefined): void {
    // A refusal names the source it came from, so moving to another one must clear it.
    this.clearPermissionNotice();

    this.sendStateService.selectSource(source);
    this.paymentFeeService.recompute();
    this.resolvePayeeBankVerification();
    this.cardPaymentService.runAmountChecks();
   this.coreForm.controls.bankAc.setValue(null, { emitEvent: false });
   this.coreForm.controls.wallet.setValue(null, { emitEvent: false });
   this.coreForm.controls.card.setValue(null, { emitEvent: false });
  }

  private selectSourceById(sourceId: string): void {
    const source = this.sendReceivePageService
      .sources()
      .find((s) => s.id === sourceId);
    this.applySource(source);
  }

  /** Put the dropdown back on what is actually selected. */
  private restoreSource(): void {
    this.coreForm.controls.payFrom.setValue(
      this.sendReceivePageService
        .sources()
        .find((s) => s.id === this.sendStateService.sourceId()) ?? null,
      { emitEvent: false }
    );
  }

  private applyMethod(method: IPaymentMethodOption | null | undefined): void {
    this.sendStateService.selectMethod(method);
    this.sendStateService.deliveryError.set(false);
    this.paymentFeeService.recompute();
    // Whether a payee bank is even reached is the method's answer to give.
    this.resolvePayeeBankVerification();
  }

  /** The user accepted the offer, so the payment moves to the Wallet, keeping the method. */
  private moveToWallet(methodId: string): void {
    this.sendStateService.selectSourceById('wallet', methodId);
    this.paymentFeeService.recompute();
    this.resolvePayeeBankVerification();
  }

  private restoreMethod(): void {
    const current = this.sendStateService
      .payAsItems()
      .find((m) => m.id === this.sendStateService.payAsId());

    this.coreForm.controls.payAs.setValue(current ?? null, {
      emitEvent: false
    });
  }

  private resolvePayeeBankVerification(): void {
    const source = this.sendStateService.sourceId();
    const landsInPayeeBank = PAYEE_BANK_METHODS.includes(
      this.sendStateService.methodId() ?? ''
    );

    if (landsInPayeeBank && source === 'card') {
      this.paymentsService.resolveCardPayeeBankVerificationRequired();
      return;
    }

    this.paymentsService.resolvePayeeBankVerificationRequired(
      landsInPayeeBank ? this.payorBankAccountId(source) : null
    );
  }

  private payorBankAccountId(source: string | null): string | null {
    if (source === 'bankaccount') {
      const bank = this.coreForm.controls.bankAc.value;
      const isAchVerified = !!(
        bank?.isItZil || bank?.achApplicationStatus === 1
      );
      return isAchVerified ? (bank?.id ?? null) : null;
    }
    if (source === 'wallet') {
      return this.coreForm.controls.wallet.value?.bankAccount_id ?? null;
    }
    return null;
  }

  private evaluateWalletBalance(
    wallet: IWalletData | null,
    isInternational = this.isInternational()
  ): void {
    // The $10 floor is International's own rule; the inline message below is
    // every wallet payment's.
    if (isInternational && wallet && this.isBelowInternationalMinBalance(wallet)) {
      this.v4AlertService.failedAlert({
        title: 'Error',
        content: `Selected wallet has insufficient balance. A minimum balance of $${MIN_INTERNATIONAL_WALLET_BALANCE}.00 is required.`
      });
      this.coreForm.controls.wallet.reset(null, { emitEvent: false });
    }
  }

  /** True when the wallet's available balance is under the international minimum. */
  private isBelowInternationalMinBalance(wallet: IWalletData): boolean {
    const walletBalance = wallet.availableBalance ?? wallet.currentBalance;
    const balance = Number(String(walletBalance ?? '').replace(/[$,]/g, '')) || 0;
    return (
      !Number.isNaN(balance) && balance < MIN_INTERNATIONAL_WALLET_BALANCE
    );
  }

  private submit(run: (source: ISendSourceService) => void): void {
    if (!this.guardSource()) {
      return;
    }
    this.revealDetailErrors();

    const source = this.sendSourceRegistryService.active();
    const gate = source.onBeforeSubmit?.();

    if (!gate) {
      run(source);
      return;
    }

    gate
      .pipe(take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe((ready) => {
        if (ready) {
          run(source);
        }
      });
  }

  /**
   * The details form's messages render inside a panel the user may have collapsed, so
   * open it when a submit is blocked by them.
   */
  private revealDetailErrors(): void {
    if (this.sendSourceRegistryService.active().detailsForm.invalid) {
      this.detailsOpen.set(true);
    }
  }

  private guardSource(): boolean {
    if (this.sendSourceRegistryService.isSupportedSource()) {
      return true;
    }
    this.v4AlertService.failedAlert({
      content: 'This payment source is not available yet.'
    });
    return false;
  }

  private startNewPayment(): void {
    const core = this.coreForm.controls;

    this.paymentFeeService.reset();
    this.sendStateService.clearPayee();
    this.sendStateService.clearNotify();
    this.sendStateService.deliveryError.set(false);
    this.sendHydrationService.billLocked.set(false);

    // A payment that was being edited or cloned is now sent; the next one is new.
    this.sendStateService.mode.set('CREATE');
    this.sendStateService.editedPayment.set(null);

    core.amount.reset('');
    core.payee.reset(null);
    core.wallet.reset(null);
    core.bankAc.reset(null);
    core.card.reset(null);
    this.payeeDropdownV4Component.clearSelection();
    this.sendStateService.selectMethod(core.payAs.value);
    this.sendSourceRegistryService.active().resetDetails();
    this.paymentActivityService.clear();
  }

  private openPayeeEditModal(payeeId: string, page?: PayeeEditPage): void {
    this.payeeModalService
      .openEditPayee(
        payeeId,
        undefined,
        {
          edit: true,
          id: payeeId,
          page
        },
        true
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((ref) => {
        ref?.afterClosed().subscribe((result) => {
          if (!result) {
            return;
          }
          if ('name' in result) {
            this.reselectEditedPayee(result);
            return;
          }
          // Saved from one of the single-section pages, whose result names only
          // what that page collected. Nothing to patch, but the record has
          // changed and the chips read it.
          this.refreshEditedPayee();
        });
      });
  }

  /**
   * The edit modal already persisted, so patch the loaded payee in place — the card
   * reflects the edit immediately with no refetch and no skeleton. Only a bank-details
   * edit needs a banks-only reload; the core patch covers name/address/company edits.
   */
  private reselectEditedPayee(result: IPayeeDropdown): void {
    this.sendStateService.applyEditedPayee(result);

    const current = this.coreForm.getRawValue().payee;
    this.coreForm.controls.payee.setValue(
      { ...current, ...result } as IPayeeDropdown,
      { emitEvent: false }
    );
    this.store.dispatch(
      payeesActions.addUpdatedPayeeIntoPayees({
        payee: this.coreForm.getRawValue().payee as IPayeeDropdown
      })
    );
    this.payeeService.setPayeeEditedData(
      this.coreForm.getRawValue().payee as IPayeeDropdown
    );
    this.refreshEditedPayee();
  }

  /**
   * Re-read the payee the form is on, and tell the bank dropdown to reload with
   * it. The modal's result carries only what its own page collected, and the
   * dropdown keeps a bank list of its own — so without this the record, the
   * chips and the two bank lists could each be answering from a different
   * fetch, which is how a bank added in the payee modal stayed off the dropdown
   * while the payment counted it as chosen.
   */
  private refreshEditedPayee(): void {
    const payeeId = this.sendStateService.payeeId();
    if (!payeeId) {
      return;
    }
    this.sendStateService.loadPayee(payeeId);
    this.sendStateService.payeeBankReloadTrigger.update((n) => n + 1);
  }

  private flag(name: keyof IDynamicWhiteLabelFlags): boolean {
    return this.dynamicWhiteLabelService.dynamicWhiteLabelFlagChecker(name);
  }

  getHeaderData(){
    // eslint-disable-next-line no-underscore-dangle
    this.headerService._headerData
    .pipe(filter((data): data is IHeaderData => data !== false),takeUntilDestroyed(this.destroyRef))
    .subscribe({
      next: (headerData: IHeaderData) => {
        this.sendStateService.isApprovalPolicyEnabled.set(
          headerData.managedPartner?.approvalPolicy === 1
        );
        this.sendStateService.hidesDirectDeposit.set(
          headerData.isRegisteredAfterV2Launch === 1
        );
      }
    });
  }
}

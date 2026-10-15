import {
  computed,
  effect,
  inject,
  output,
  signal,
  untracked,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  HostListener,
  Injector
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, type FormControl } from '@angular/forms';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { finalize, startWith, switchMap } from 'rxjs';
import { HttpHeaders } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltip } from '@angular/material/tooltip';
import {
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  FileText,
  History,
  Info,
  LucideAngularModule,
  Mail,
  MapPin,
  Paperclip,
  Pencil,
  Plus,
  Printer,
  Send,
  Settings,
  TriangleAlert
} from 'lucide-angular';

import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import type { IDynamicWhiteLabelFlags } from 'src/app/modules/dynamic-white-label/model/dynamic-white-label.model';
import type {
  ICheckShipingTypes,
  IMailBulkShippingAddress,
  IMailSingleShippingAddress
} from 'src/app/modules/check/model/check';
import { AddMailAddressModalV4Component } from 'src/app/modules/check/modal/mail-modals/add-mail-address-modal-v4/add-mail-address-modal-v4.component';
import { CheckMailSettingsModalV4Component } from 'src/app/modules/check/modal/check-mail-settings-modal-v4/check-mail-settings-modal-v4.component';
import { LastTransactionModalV4Component } from 'src/app/modules/check/modal/mail-modals/last-transaction-modal-v4/last-transaction-modal-v4.component';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import {
  CHECK_DELIVERY_OPTIONS,
  type CheckDeliveryId,
  type ICheckDeliveryOption
} from '../shared/models/check-delivery';
import { SendStateService } from '../shared/services/send-state.service';
import { SendSourceRegistryService } from '../shared/services/send-source-registry.service';
import { PaymentActivityService } from '../shared/services/payment-activity.service';
import { PaymentFeeService } from '../shared/services/payment-fee.service';
import { CheckDirectDepositService } from '../shared/services/check-direct-deposit.service';
import { CheckEmailService } from '../shared/services/check-email.service';
import {
  CheckMailService,
  type IMailAddress
} from '../shared/services/check-mail.service';
import { UpdateBankModalV4Component } from 'src/app/modules/check/modal/mail-modals/update-bank-modal-v4/update-bank-modal-v4.component';
import { AddPayeeModalV4Component } from 'src/app/modules/payee/payee-v4/modals/add-payee-modal-v4/add-payee-modal-v4.component';
import { BankCheckService } from '../bank/services/bank-check.service';
import { CheckDetailsModalComponent } from './check-details-modal/check-details-modal.component';
import {
  toShippingOptions,
  type IShippingOption
} from '../shared/models/shipping-options';
import {
  SpMailDropdownComponent,
  type SpMailDropdownOption
} from './dropdowns/sp-mail-dropdown/sp-mail-dropdown.component';

export type IDeliveryTile = ICheckDeliveryOption & {
  disabled: boolean;
  disabledReason: string;
};

const BLANK_AMOUNT_BLOCKED: Partial<Record<CheckDeliveryId, string>> = {
  mail: 'Blank check cannot be mailed',
  email: 'Blank check cannot be emailed',
  ach: 'Blank check cannot be sent by direct deposit'
};

const FIRST_CLASS_CODES = [
  'USPS_FIRST_CLASS_MAIL',
  'USPS_FIRST_CLASS_WITH_TRACKING'
];

/** Row ids for the two non-saved mailing-address options. Saved addresses carry
 *  their own API id, so neither can collide. */
const MAIL_FROM_DEFAULT_ID = 'default';
const MAIL_TO_PAYEE_ID = 'payee';

const US_NAMES = ['united states', 'us', 'usa', 'united states of america'];
const CANADA_NAMES = ['canada', 'ca'];

/**
 * The carrier list names its destinations `United States`, `Canada` and
 * `International`; an address can spell the same country half a dozen ways.
 * Mirrors `sortedoption` in the legacy mail modal.
 */
function shippingCountry(value: string | undefined): string {
  const country = (value ?? '').trim().toLowerCase();
  if (!country || US_NAMES.includes(country)) {
    return 'United States';
  }
  if (CANADA_NAMES.includes(country)) {
    return 'Canada';
  }
  return 'International';
}

@Component({
  selector: 'app-check-delivery',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LucideAngularModule,
    MatTooltip,
    SpMailDropdownComponent
  ],
  templateUrl: './check-delivery.component.html',
  styleUrl: './check-delivery.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CheckDeliveryComponent {
  constructor() {
    this.dropFilteredCarrier();
    this.watchSaveToPayeeDefault();
    effect(() => {
      if (this.isMailDelivery()) {
        untracked(() => this.loadMailData());
      } else if (this.isPrintDelivery()) {
        untracked(() => this.loadPrintData());
      } else if (this.isEmailDelivery()) {
        untracked(() => this.email.activate());
      }
    });

    effect(() => {
      const visible = this.visibleBankMailShippingTypes();
      const selected = this.selectedShipId();
      // An empty list is "not loaded yet", not "this carrier is gone". Judging a
      // restored carrier against it cleared the one a reopened cheque was saved
      // with, before the carriers it had to be matched against had arrived.
      if (!visible.length) {
        return;
      }
      if (selected != null && !visible.some((type) => type.id === selected)) {
        untracked(() => this.selectedShipId.set(null));
        return;
      }
      // The account's default carrier, as the gear sets it and the mailing modal
      // applies it: it fills an unmade choice, and never overrides a made one.
      if (selected == null) {
        const preferred = visible.find((type) => type.is_default_mailing_type);
        if (preferred) {
          untracked(() => this.selectedShipId.set(preferred.id));
        }
      }
    }, { allowSignalWrites: true });

    effect(() => {
      const visible = this.cardVisibleShippingTypes();
      const code = this.shippingCode();
      if (code && !visible.some((type) => type.carrier_code === code)) {
        untracked(() => this.selectCardShipValue(visible[0]?.carrier_code ?? null));
      }
    }, { allowSignalWrites: true });

    // Also on the delivery: an edit restores the tile after the attachments have
    // already loaded, and until it does nothing has told the fee which of them
    // ride in the envelope.
    effect(() => {
      this.mailAttachItems();
      this.isMailDelivery();
      untracked(() => this.syncMailAttachments());
    }, { allowSignalWrites: true });

    this.watchCustomAddressPair();
    this.watchSavedAddressDecIds();

    this.sendStateService.coreForm.controls.bankAc.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.bankFromAddress.set(null);
        if (this.isMailDelivery()) {
          this.loadBankFromAddress();
        }
      });

    // A reopened cheque hands over its two custom addresses as ids; only this
    // block can turn one back into an address, so it does that and clears them.
    //
    // The cheque stores the plain id and the editors open by the encrypted one,
    // so each is matched back through the book — which has to have arrived
    // first, hence the wait on the lists rather than a read of them.
    effect(
      () => {
        const saved = this.mail.savedMailing();
        const fromRows = this.shippingAddressFrom();
        const toRows = this.shippingAddressTo();
        if (!saved) {
          return;
        }
        const wantsFrom = !!saved.shipping_from;
        const wantsTo = !!saved.shipping_to;
        if ((wantsFrom && !fromRows.length) || (wantsTo && !toRows.length)) {
          return;
        }

        untracked(() => {
          this.mail.savedMailing.set(null);
          if (wantsFrom) {
            this.selectSavedFrom(this.encryptedIdOf(fromRows, saved.shipping_from));
          }
          if (wantsTo) {
            this.selectSavedTo(this.encryptedIdOf(toRows, saved.shipping_to));
          }
        });
      },
      { allowSignalWrites: true }
    );

    // The bank-check rail asks for this when a write comes back on a check
    // number that is already taken and the user declines to reuse it.
    effect(() => {
      const request = this.bankCheckService.checkModalRequest();
      if (request) {
        untracked(() => this.openCheckModal());
      }
    }, { allowSignalWrites: true });
  }

  private readonly whiteLabel = inject(DynamicWhiteLabelService);
  private readonly shared = inject(SharedService);
  private readonly checkService = inject(CheckService);
  private readonly headerService = inject(HeaderService);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly bankCheckService = inject(BankCheckService);
  private readonly paymentActivityService = inject(PaymentActivityService);
  private readonly fees = inject(PaymentFeeService);
  /** Owns everything a mailed check needs; this component is only its face. */
  readonly mail = inject(CheckMailService);
  /** The same, for an emailed one. */
  readonly email = inject(CheckEmailService);
  /** ...and for one deposited straight into the payee's account. */
  readonly deposit = inject(CheckDirectDepositService);
  readonly sendStateService = inject(SendStateService);
  private readonly registry = inject(SendSourceRegistryService);

  readonly deliverySelected = output<IDeliveryTile>();
  readonly checkModalRequested = output<void>();
  /** The page owns the bank dropdown; it opens the add-bank modal on our behalf. */
  readonly addBankRequested = output<void>();

  readonly CheckIcon = Check;
  readonly InfoIcon = Info;
  readonly PlusIcon = Plus;
  readonly PaperclipIcon = Paperclip;
  readonly FileTextIcon = FileText;
  readonly ChevronDownIcon = ChevronDown;
  readonly ChevronRightIcon = ChevronRight;
  readonly TriangleAlertIcon = TriangleAlert;
  readonly PencilIcon = Pencil;
  readonly SettingsIcon = Settings;
  readonly HistoryIcon = History;
  readonly MapPinIcon = MapPin;

  /**
   * Offered only when an address is actually in question — the mailing modal
   * shows it on `enable_all_payee_edit`, its own "these need looking at". A
   * standing link to a postal lookup is noise on a cheque that is fine.
   */
  readonly showsVerifyAddress = computed(
    () =>
      this.isMailDelivery() &&
      (!!this.bankBlocker() ||
        !!this.returnAddressBlocker() ||
        !!this.destinationBlocker() ||
        this.missingDestination())
  );

  /**
   * Address lookup for wherever the cheque is going. USPS cannot check a
   * Canadian address and Canada Post cannot check an American one, so the link
   * follows the destination rather than always offering the American one.
   */
  readonly verifyAddress = computed(() => {
    const country = shippingCountry(this.mail.destination()?.country);
    return country === 'Canada'
      ? {
          url: 'https://www.canadapost-postescanada.ca/info/mc/personal/postalcode/fpc.jsf',
          label: 'Check this address against the Canada Post lookup'
        }
      : {
          url: 'https://tools.usps.com/zip-code-lookup.htm?byaddress',
          label: 'Check this address against the USPS lookup'
        };
  });

  private readonly icons: Record<ICheckDeliveryOption['icon'], object> = {
    mail: Mail,
    send: Send,
    printer: Printer,
    'file-text': FileText,
    building: Building2
  };

  private readonly changingDelivery = signal(false);

  private readonly source = computed(() => this.sendStateService.sourceId());

  readonly isBankSource = computed(() => this.source() === 'bankaccount');
  readonly isWalletSource = computed(() => this.source() === 'wallet');
  readonly isCardSource = computed(() => this.source() === 'card');

  /** Bank and wallet choose a delivery from tiles; a card picks Check Mail outright. */
  readonly showsTiles = computed(
    () => this.isBankSource() || this.isWalletSource()
  );

  readonly isCheckMail = computed(
    () => this.sendStateService.methodId() === 'check_mail'
  );

  readonly isCheckPrint = computed(() =>
    ['check_print'].includes(this.sendStateService.methodId() ?? '')
  );

  /** Bank + Mail, wallet + Check Mail and card + Check Mail all render the block. */
  readonly isMailDelivery = computed(
    () =>
      (this.isBankSource() && this.sendStateService.checkDelivery() === 'mail') ||
      ((this.isWalletSource() || this.isCardSource()) && this.isCheckMail())
  );

  /**
   * A printed check still names its sender, so wallet and card get the address
   * block with the destination fixed to the payee — `check_print` sends only
   * `customShippingFrom`, never a `customShippingTo`.
   *
   * Bank print is excluded: that rail offers no custom from or to at all, so
   * the block would be three read-only rows explaining nothing.
   */
  readonly isPrintDelivery = computed(
    () => (this.isWalletSource() || this.isCardSource()) && this.isCheckPrint()
  );

  /** The address block serves both; only mail adds a carrier. */
  readonly showsAddressBlock = computed(
    () => this.isMailDelivery() || this.isPrintDelivery()
  );

  /**
   * An e-checked bank check. Wallet and card have no email tile, so this is the
   * one combination that renders the recipient row.
   */
  readonly isEmailDelivery = computed(
    () =>
      this.isBankSource() && this.sendStateService.checkDelivery() === 'email'
  );

  /**
   * What is in the box: what was typed, or the payee's own address until
   * something is. `null` means untouched, so the payee's address can still
   * arrive and fill it — clearing it after that is a real choice, and one the
   * modal has always allowed.
   */
  readonly emailInput = computed(
    () => this.email.address() ?? this.email.payeeEmail()
  );

  /** The address on the payee's record, which is where it goes by default. */
  readonly payeeEmail = this.email.payeeEmail;

  readonly emailCustom = this.email.customAddress;
  readonly emailResolving = this.email.resolvingPayeeEmail;

  readonly emailError = this.email.validationError;

  /** The user has been in the box, so a malformed address is theirs to see. */
  readonly emailTyped = signal(false);

  readonly emailFormatError = this.email.addressFormatError;

  /** Emailing is free; the payee text and the attachments are not. */
  readonly emailCost = computed(() => this.email.cost().total);

  onEmailAddressInput(value: string): void {
    this.emailTyped.set(true);
    this.email.address.set(value);
  }

  onEmailCustomToggle(checked: boolean): void {
    this.emailTyped.set(false);
    this.saveEmailTouched.set(false);
    this.email.setCustomAddress(checked);
  }

  private readonly saveEmailTouched = signal(false);

  readonly showSaveToPayee = computed(() => {
    if (
      this.email.restoringAddress() ||
      !this.sendStateService.payeeDetails()
    ) {
      return false;
    }
    const typed = (this.email.address() ?? '').trim();
    return (
      !!typed &&
      typed.toLowerCase() !== this.payeeEmail().trim().toLowerCase()
    );
  });

  readonly saveToPayee = this.sendStateService.notifySaveEmail;

  onSaveToPayeeToggle(checked: boolean): void {
    this.saveEmailTouched.set(true);
    this.sendStateService.notifySaveEmail.set(checked);
  }

  /**
   * Gated on the email tile: the same signal carries the notify modal's answer
   * for a mailed cheque, which this must not clear.
   */
  private watchSaveToPayeeDefault(): void {
    effect(
      () => {
        if (!this.isEmailDelivery()) {
          return;
        }
        const showing = this.showSaveToPayee();
        if (!showing) {
          untracked(() => {
            this.saveEmailTouched.set(false);
            this.sendStateService.notifySaveEmail.set(false);
          });
          return;
        }
        if (this.saveEmailTouched()) {
          return;
        }
        const hasRecordEmail = !!this.payeeEmail().trim();
        const isRestoredCustom = this.emailCustom();
        untracked(() =>
          this.sendStateService.notifySaveEmail.set(
            !hasRecordEmail && !isRestoredCustom
          )
        );
      },
      { allowSignalWrites: true }
    );
  }

  // ── Direct deposit ──
  //
  // The delivery block carries the wallet-bypass choice alone. Which of the
  // payee's accounts receives it is an Additional Details field, alongside the
  // other rails' payee-bank pickers.

  readonly walletBypassing = this.deposit.walletBypassing;

  toggleWalletBypassing(): void {
    this.deposit.walletBypassing.update((on) => !on);
  }

  readonly isDirectDepositDelivery = computed(
    () => this.isBankSource() && this.sendStateService.checkDelivery() === 'ach'
  );

  private readonly selectedBankAc = toSignal(
    this.sendStateService.coreForm.controls.bankAc.valueChanges.pipe(
      startWith(this.sendStateService.coreForm.controls.bankAc.value)
    ),
    { initialValue: this.sendStateService.coreForm.controls.bankAc.value }
  );

  /**
   * The core form as a signal. A `computed` that reads the form directly hears
   * nothing when it changes — the form is not reactive — so anything judging the
   * account or the payee has to be told the form moved.
   */
  private readonly coreValue = toSignal(
    this.sendStateService.coreForm.valueChanges.pipe(
      startWith(this.sendStateService.coreForm.getRawValue())
    ),
    { initialValue: this.sendStateService.coreForm.getRawValue() }
  );

  /**
   * Card has no preview; bank and wallet have parity on it.
   *
   * A bank check is the one combination that sits on `check` with no delivery
   * yet, and its number and issue date belong to the check itself, not to how it
   * goes out — the working flow shows them from the moment Check is chosen. They
   * are also the only place a duplicate check number can be corrected, so hiding
   * them behind a delivery left error 213 with nothing to act on.
   *
   * The serial is drawn from the paying account, so before one is picked there is
   * no number to name and the bar stays off rather than showing an empty one.
   */
  /**
   * `POST /checks/preview` is keyed by the paying account and the payee, and
   * `buildCheckPreviewPayload` returns nothing without them — so the modal would
   * open on a cheque it could not draw. A cheque written deliberately without a
   * payee says so in `process_without`, which the endpoint does accept.
   */
  readonly checkPreviewReady = computed(() => {
    // Both forms are read below and neither is reactive on its own.
    this.coreValue();
    this.activeDetailsValue();
    this.sendStateService.payeeId();

    if (!this.sendStateService.checkPreviewSource()?.sourceId) {
      return false;
    }
    const noPayee =
      !!this.registry.active().detailsForm.controls['noPayee']?.value;
    return noPayee || !!this.sendStateService.coreForm.controls.payee.value?.id;
  });

  /** Why it cannot be opened yet, named so the user knows what to go and pick. */
  readonly checkPreviewBlockedReason = computed(() => {
    if (this.checkPreviewReady()) {
      return '';
    }
    return this.sendStateService.checkPreviewSource()?.sourceId
      ? 'Select a payee to preview the check'
      : 'Select the account paying to preview the check';
  });

  readonly showsCheckPreview = computed(
    () =>
      // Bank and wallet name their delivery with a tile; a card picks Check
      // Mail or Check Print outright and has no tile to read.
      (((this.isBankSource() || this.isWalletSource()) &&
        !!this.sendStateService.checkDelivery()) ||
        (this.isCardSource() && (this.isCheckMail() || this.isCheckPrint()))) ||
      (this.isBankCheck() && !!this.selectedBankAc())
  );

  readonly isBankCheck = this.registry.isBankCheck;
  readonly deliveryError = this.sendStateService.deliveryError;
  readonly noPayeeBlocked = this.sendStateService.noPayeeBlocked;

  readonly isApprovedPaymentReadOnly = computed(() =>
    this.sendStateService.sourceId() === 'wallet'
      ? this.sendStateService.isApprovedSkipUpdate()
      : this.sendStateService.isApprovedReadOnly()
  );

  readonly blanksAmount = computed(
    () => this.isBankCheck() && this.bankCheckService.blankedAmount()
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
      const reason = blanked ? BLANK_AMOUNT_BLOCKED[option.id] : undefined;
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

  // ── Addresses ──

  readonly shippingAddressFrom = signal<IMailBulkShippingAddress[]>([]);
  readonly shippingAddressTo = signal<IMailBulkShippingAddress[]>([]);

  // The selection itself lives on CheckMailService — it is what the payload, the
  // quote and the validation all read, and a second copy here would drift.
  readonly customFromAddress = this.mail.fromAddress;
  readonly customToAddress = this.mail.toAddress;
  readonly selectedFromSavedId = this.mail.savedFromId;
  readonly selectedToSavedId = this.mail.savedToId;
  readonly useCustomFrom = computed(() => !!this.mail.fromAddress());

  private readonly bankFromAddress = signal<Record<string, string> | null>(null);

  /** Card "Mail from" = company default return address (first saved from-address,
   *  or one flagged default). Company-level, NOT bank-account-tied. */
  readonly cardMailFrom = computed<IMailBulkShippingAddress | null>(() => {
    const list = this.shippingAddressFrom();
    if (!list.length) {
      return null;
    }
    const def = list.find((a) => {
      const r = a as unknown as Record<string, unknown>;
      return r['is_default'] === 1 || r['is_default'] === true || r['isDefault'] === true;
    });
    return def ?? list[0];
  });

  cardMailFromLine(): string {
    return this.addrSub(this.cardMailFrom());
  }

  /**
   * The sender a cheque prints when the user has not typed one: the address of
   * whatever it is drawn on. A wallet carries its own on the list that named it;
   * a bank account's is fetched. Neither is the first row of the custom-address
   * book, which is what this used to show a wallet — an address with nothing to
   * do with the payment.
   */
  mailFromDefaultName(): string {
    const core = this.sendStateService.coreForm.controls;
    if (this.isWalletSource()) {
      const wallet = core.wallet.value;
      return (
        wallet?.address?.name ||
        wallet?.bankAccountName ||
        wallet?.walletName ||
        'Return address'
      );
    }
    return (
      this.bankFromAddress()?.bank_account_account_name ||
      core.bankAc.value?.nickName ||
      'Account address'
    );
  }

  mailFromDefaultLine(): string {
    return this.isWalletSource()
      ? this.addrLine(this.mail.walletAddress())
      : this.bankFromLine();
  }

  mailFromDefaultBadge(): string {
    return this.isWalletSource() ? 'Return address' : 'Account address';
  }

  private addrLine(a: IMailAddress | null): string {
    if (!a) {
      return '';
    }
    return [
      a.address_line_1,
      a.address_line_2,
      a.city,
      [a.state, a.zip].filter(Boolean).join(' ')
    ]
      .filter(Boolean)
      .join(', ');
  }

  bankFromLine(): string {
    const a = this.bankFromAddress();
    if (!a) {
      return '';
    }
    return [
      a['bank_account_address_line_1'],
      a['bank_account_address_line_2'],
      a['bank_account_city'],
      [a['bank_account_state'], a['bank_account_zip']].filter(Boolean).join(' ')
    ]
      .filter(Boolean)
      .join(', ');
  }

  customToLine(): string {
    const a = this.customToAddress();
    if (!a) {
      return '';
    }
    return [a['address_line_1'], a['city'], a['state'], a['zip']]
      .filter(Boolean)
      .join(', ');
  }

  customFromLine(): string {
    const a = this.customFromAddress();
    if (!a) {
      return '';
    }
    return [a['address_line_1'], a['city'], a['state'], a['zip']]
      .filter(Boolean)
      .join(', ');
  }

  addrSub(a: IMailBulkShippingAddress | null): string {
    if (!a) {
      return '';
    }
    const r = a as unknown as Record<string, string | undefined>;
    const line1 = r['address_line_1'] || r['addressLine1'] || r['address1'] || r['address'];
    const line2 = r['address_line_2'] || r['addressLine2'] || r['address2'];
    const city = r['city'];
    const stateZip = [r['state'], r['zip'] || r['zipcode']].filter(Boolean).join(' ');
    const parts = [line1, line2, city, stateZip].filter(Boolean);
    return parts.length ? parts.join(', ') : a.countryName || a.country || '';
  }

  /** Empty until a payee is chosen — the bar reads blank rather than "Payee". */
  /**
   * The payee's own name, not the nickname. A nickname is what the sender files
   * them under; the cheque is going to whoever the name says, and the mailing
   * rows are about where it lands rather than how it is filed.
   */
  readonly payeeName = computed(() => {
    const info = this.sendStateService.payeeDetails()?.payee_information;
    return info?.payee_name || info?.payee_nick_name || '';
  });

  readonly payeeAddressLine = computed(() => {
    const info = this.sendStateService.payeeDetails()?.payee_information;
    if (!info) {
      return '';
    }
    return [
      info.payee_address_line_1,
      info.payee_city,
      info.payee_state,
      info.payee_zip
    ]
      .map((part) => (part ?? '').trim())
      .filter(Boolean)
      .join(', ');
  });

  /** Popover rows for "Mail from": the account/return address, then the saved
   *  custom addresses. `MAIL_FROM_DEFAULT_ID` marks the first. */
  readonly mailFromOptions = computed<SpMailDropdownOption[]>(() => [
    {
      id: MAIL_FROM_DEFAULT_ID,
      title: this.mailFromDefaultName(),
      subtitle: this.mailFromDefaultLine(),
      badge: this.mailFromDefaultBadge(),
      badgeOk: true
    },
    ...this.shippingAddressFrom().map((a) => ({
      id: a.id,
      title: a.name,
      subtitle: this.addrSub(a),
      badge: 'Custom address',
      badgeOk: false
    }))
  ]);

  /** Popover rows for "Mail to": the payee, then the saved custom addresses. */
  readonly mailToOptions = computed<SpMailDropdownOption[]>(() => [
    {
      id: MAIL_TO_PAYEE_ID,
      title: 'Payee',
      subtitle: this.payeeAddressLine(),
      badge: 'Payee',
      badgeOk: true
    },
    ...this.shippingAddressTo().map((a) => ({
      id: a.id,
      title: a.name,
      subtitle: this.addrSub(a),
      badge: 'Custom address',
      badgeOk: false
    }))
  ]);

  onMailFromSelect(id: string): void {
    if (id === MAIL_FROM_DEFAULT_ID) {
      this.selectBankMailFrom();
      return;
    }
    this.selectSavedFrom(id);
  }

  onMailToSelect(id: string): void {
    if (id === MAIL_TO_PAYEE_ID) {
      this.selectPayeeMailTo();
      return;
    }
    this.selectSavedTo(id);
  }

  /** Whether the cheque is addressed somewhere other than the payee. The
   *  wallet's `isCustomAddress` control is not this: it is raised by either end,
   *  so reading it here turned the destination custom on a custom return
   *  address alone. */
  isCustomTo(): boolean {
    return !!this.customToAddress();
  }

  private customAddressControl(): FormControl<boolean | null> | undefined {
    return this.registry.active().detailsForm.controls['isCustomAddress'] as
      | FormControl<boolean | null>
      | undefined;
  }

  private customShippingFromControl(): FormControl<string | null> | undefined {
    return this.registry.active().detailsForm.controls['customShippingFrom'] as
      | FormControl<string | null>
      | undefined;
  }

  private customShippingToControl(): FormControl<string | null> | undefined {
    return this.registry.active().detailsForm.controls['customShippingTo'] as
      | FormControl<string | null>
      | undefined;
  }

  /**
   * A mailed cheque names both of its ends by address-book id or neither: the
   * contract has no "and use the payee's own address" option. So the moment the
   * user moves either end off its default the whole mailing becomes custom, and
   * whichever end they left alone has to be materialised into a book row too.
   *
   * CheckMailService does that materialising, and the bank rail reads its ids
   * straight off it. A wallet cheque carries them on its own form instead, so
   * they are mirrored here — where every other write to those two controls
   * already happens. Without it, choosing a custom "Mail to" left "Mail from"
   * empty and required, and the form refused to submit asking for the address
   * the user could see was already chosen.
   */
  private watchCustomAddressPair(): void {
    effect(
      () => {
        if (!this.isMailDelivery()) {
          return;
        }
        const custom = this.mail.isCustomMailing();
        const { from, to } = this.mail.customAddressIds();

        untracked(() => {
          this.setCustomAddressFlag(custom);
          this.customShippingFromControl()?.setValue(custom ? from || null : null);
          this.customShippingToControl()?.setValue(custom ? to || null : null);
        });
      },
      { allowSignalWrites: true }
    );
  }

  /**
   * The carrier refused an address the page wrote to the book on the user's
   * behalf — the business's own, copied there so the custom contract could name
   * it by id. They never chose it and cannot edit it where it lives, so being
   * told it is wrong and left there reads as the page refusing a default it
   * will not let them touch. The chip sits under the end that was refused and
   * opens the editor on exactly what was rejected, to correct and save.
   */
  private readonly addressRejected = this.sendStateService.addressDeliveryError;

  readonly rejectedFrom = computed(() => {
    const failure = this.addressRejected();
    return failure?.book === 'from' ? failure : null;
  });

  readonly rejectedTo = computed(() => {
    const failure = this.addressRejected();
    return failure?.book === 'to' ? failure : null;
  });

  /** Correct the refused address, in the editor, on the values it refused. */
  fixRejectedAddress(): void {
    const failure = this.addressRejected();
    if (!failure) {
      return;
    }
    const prefill = failure.address as Partial<IMailSingleShippingAddress>;
    if (failure.book === 'to') {
      this.openCustomMailTo(false, prefill);
    } else {
      this.openCustomMailFrom(false, prefill);
    }
  }

  /**
   * The three the mailing modal carries in its header and its footer, kept as
   * icons so the block does not grow a toolbar. All three are about the mailing
   * rather than this payment, which is why none of them is a field.
   */

  /**
   * What this payee was paid last, so a repeat is recognisable before sending.
   * Addressed by payee: the endpoint reads `{id}` as a cheque's unless told
   * otherwise, and on this screen the cheque does not exist until the user
   * commits.
   */
  openLastTransactions(): void {
    const payeeId = this.sendStateService.payeeId();
    if (!payeeId) {
      return;
    }
    this.dialog.open(LastTransactionModalV4Component, {
      maxWidth: '1010px',
      width: '90%',
      panelClass: 'paddingless-modal-rounded',
      data: { id: payeeId, isPayee: true }
    });
  }

  /** The default carrier, set once and applied to every mailing after it. */
  openMailSettings(): void {
    this.dialog
      .open(CheckMailSettingsModalV4Component, {
        panelClass: 'paddingless-modal-rounded',
        maxWidth: '675px',
        width: '98%',
        autoFocus: false,
        disableClose: true
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((saved) => {
        if (!saved) {
          return;
        }
        this.selectedShipId.set(null);
        this.mail.reloadCarriers();
      });
  }

  /**
   * A book row is named twice — encrypted, which is what this block picks,
   * matches and opens rows by, and plain, which is what `sent-mail` names them
   * by. The list holds both, so choosing a row is enough to know the other one.
   *
   * Watched rather than set at each of the eight places a row gets chosen: the
   * list refreshes after the address editor saves, so a row created there is
   * only knowable once it comes back.
   */
  private watchSavedAddressDecIds(): void {
    effect(
      () => {
        const from = this.decIdOf(
          this.shippingAddressFrom(),
          this.selectedFromSavedId()
        );
        const to = this.decIdOf(
          this.shippingAddressTo(),
          this.selectedToSavedId()
        );
        untracked(() => {
          this.mail.savedFromDecId.set(from);
          this.mail.savedToDecId.set(to);
        });
      },
      { allowSignalWrites: true }
    );
  }

  private decIdOf(
    rows: readonly IMailBulkShippingAddress[],
    id: string | null
  ): number | null {
    if (!id) {
      return null;
    }
    const row = rows.find((candidate) => String(candidate.id) === String(id));
    return row?.dec_id ?? null;
  }

  /** The other way round, for a cheque that stored the plain one. */
  private encryptedIdOf(
    rows: readonly IMailBulkShippingAddress[],
    decId: string | number | undefined
  ): string {
    const wanted = String(decId ?? '');
    const row = rows.find((candidate) => String(candidate.dec_id) === wanted);
    return row ? String(row.id) : wanted;
  }

  private setCustomAddressFlag(value: boolean): void {
    this.customAddressControl()?.setValue(value);
  }

  // ── Addresses ──
  //
  // Choosing a custom address re-fetches the book and, for a bank check, the
  // account's own address. Both rows say so rather than sitting on a stale one.

  readonly addressFromLoading = signal(false);
  readonly addressToLoading = signal(false);
  readonly bankAddressLoading = signal(false);

  /**
   * Choosing one end makes the mailing custom, and a custom mailing names both
   * ends by an address-book row — so the end left on its default is written to
   * the book right then, in the background. That is a request, and the row it
   * happens to says so rather than sitting there looking settled while the
   * price and the send both wait on it.
   */
  readonly mailFromLoading = computed(
    () =>
      this.addressFromLoading() ||
      this.bankAddressLoading() ||
      (this.mail.resolvingAddressIds() && !this.useCustomFrom())
  );

  /**
   * The Mail-to row renders the payee's own address whenever a custom one is not
   * chosen, so a payee still being fetched leaves it showing the address the
   * payee had before the edit. `addressToLoading` only covers the custom address
   * book, which says nothing about that.
   */
  readonly mailToLoading = computed(
    () =>
      this.addressToLoading() ||
      this.sendStateService.payeeFetching() ||
      (this.mail.resolvingAddressIds() && !this.isCustomTo())
  );

  // ── Carriers ──

  readonly shippingTypes = signal<IShippingOption[]>([]);
  readonly shippingLoading = signal(false);

  /**
   * False until the carrier request has settled, either way. `shippingLoading`
   * alone only covers the moments a request is actually in flight, so a list
   * that arrives before first paint — or one already fetched earlier in the
   * session — left the bar reading "Select carrier" with no skeleton at all.
   */
  readonly shippingSettled = signal(false);

  /** True when the carrier request settled without giving us a list. */
  readonly shippingUnavailable = signal(false);
  readonly bankMailShippingTypes = this.mail.carriers;
  readonly bankMailShipLoading = this.mail.carriersLoading;
  readonly selectedShipId = this.mail.shippingTypeId;
  readonly firstCheckMailFree = this.mail.firstMailFree;

  /** The live price for the mailed check — quoted, or estimated until it answers. */
  readonly quoteCost = computed(() => this.mail.publishedCost()?.total ?? null);
  readonly quoting = this.mail.quoting;

  /**
   * The chosen carrier will not take the shipment without a recipient phone.
   * Unlike the other mailing errors this shows the moment the carrier is picked
   * rather than waiting for a submit: it is a fact about that carrier, and the
   * dropdown offered it as selectable and priced.
   */
  readonly fedexNeedsPhone = computed(
    () =>
      this.isBankSource() && this.isMailDelivery() && this.mail.fedexNeedsPhone()
  );

  /** No carrier is offered — or priced — until the check has somewhere to go. */
  readonly mailAddressReady = this.mail.destinationValid;
  readonly mailAddressError = this.mail.destinationError;

  // ── Server-side address validation ──
  //
  // `POST /payments/validate` answers on a partial payload, so these fill in as
  // soon as a bank account or a payee is picked — the successor to the legacy
  // modal's validate/bank + validate/check chips.

  readonly bankBlocker = this.mail.bankBlocker;
  readonly destinationBlocker = this.mail.destinationBlocker;
  readonly returnAddressBlocker = this.mail.returnAddressBlocker;
  readonly noBankAccount = this.mail.noBankAccount;

  /**
   * A destination IS chosen and it is not usable. Distinct from "nothing chosen
   * yet", which is an empty field rather than a problem to fix.
   */
  readonly missingDestination = computed(
    () => !!this.mail.destination() && !!this.mailAddressError()
  );

  /** Nothing picked at all — the fresh-form state, no chip. */
  readonly noDestination = computed(() => !this.mail.destination());

  /**
   * The bank account's own address is empty. Only asserted once the account's
   * details are actually in, so a pending fetch never reads as a fault.
   */
  readonly missingBankAddress = computed(
    () =>
      this.isBankSource() &&
      !this.useCustomFrom() &&
      !!this.bankFromAddress() &&
      !this.bankFromLine()
  );

  /**
   * Every reason the check has nowhere to go, in the order the user should fix
   * them. Drives both the carrier bar's blocked state and its tooltip.
   */
  readonly deliveryBlockedReason = computed<string>(() => {
    if (!this.isMailDelivery() || !this.isBankSource()) {
      return '';
    }
    if (this.noBankAccount()) {
      return 'Add a bank account before choosing a delivery method.';
    }
    if (this.bankBlocker() || this.missingBankAddress()) {
      return (
        this.bankBlocker()?.data?.message ||
        'The bank account has no address to print as the sender. Update it to choose a delivery method.'
      );
    }
    if (this.returnAddressBlocker()) {
      return (
        this.returnAddressBlocker()?.data?.message ||
        'Fix the return address to choose a delivery method.'
      );
    }
    if (this.destinationBlocker()) {
      return (
        this.destinationBlocker()?.data?.message ||
        'Fix the mailing address to choose a delivery method.'
      );
    }
    if (this.noDestination()) {
      return 'Select a payee or a custom mailing address first.';
    }
    if (this.missingDestination()) {
      return `${this.mailAddressError()}. Fix it to choose a delivery method.`;
    }
    return '';
  });

  readonly deliveryBlocked = computed(() => !!this.deliveryBlockedReason());

  /**
   * The account has no bank account at all. Handing this to the page's bank
   * dropdown opens the same add-bank modal and leaves the new account selected,
   * instead of dropping a half-filled payment to visit the bank list.
   */
  addBankAccount(): void {
    this.addBankRequested.emit();
  }

  /**
   * "Invalid From Address" — the bank account's own address. The blocker names
   * the record, so the editor opens on the right one even when it is not the
   * account currently selected.
   */
  fixBankAddress(): void {
    const id =
      this.bankBlocker()?.data?.entity_id ??
      this.sendStateService.coreForm.controls.bankAc.value?.id;
    if (!id) {
      return;
    }

    this.dialog
      .open(UpdateBankModalV4Component, {
        maxWidth: '95%',
        width: '480px',
        panelClass: 'paddingless-modal-rounded',
        data: { id, checkNo: String(this.checkNumber() ?? '') }
      })
      .afterClosed()
      .subscribe((updated) => {
        if (updated) {
          this.bankFromAddress.set(null);
          this.loadBankFromAddress();
          this.mail.revalidate();
        }
      });
  }

  /**
   * "Invalid To Address". A payee blocker opens the payee record; a typed
   * address has no record to open, so its own editor is reopened instead.
   */
  fixDestinationAddress(): void {
    if (this.isCustomTo()) {
      this.openCustomMailTo(true);
      return;
    }

    const payeeId =
      this.destinationBlocker()?.data?.entity_id ??
      this.sendStateService.payeeId();
    if (!payeeId) {
      return;
    }

    this.dialog
      .open(AddPayeeModalV4Component, {
        maxWidth: '700px',
        width: '95%',
        maxHeight: '90vh',
        disableClose: true,
        autoFocus: false,
        panelClass: 'paddingless-modal-rounded',
        data: { edit: true, id: payeeId, page: 'addAddress' }
      })
      .afterClosed()
      .subscribe(() => {
        // Re-reading the payee re-runs the country filter and the validation:
        // a new country can make the chosen carrier invalid.
        this.sendStateService.loadPayee(payeeId);
        this.mail.revalidate();
      });
  }

  /**
   * FedEx will not ship without a phone for the recipient, and only the payee
   * record can carry one — `custom_address` has no phone field. So the prompt
   * opens the payee, the same offer the missing-details nudge makes under the
   * payee dropdown, rather than naming a fix the user has to go and find.
   */
  fixPayeePhone(): void {
    const payeeId = this.sendStateService.payeeId();
    if (!payeeId) {
      return;
    }

    this.dialog
      .open(AddPayeeModalV4Component, {
        maxWidth: '700px',
        width: '95%',
        maxHeight: '90vh',
        disableClose: true,
        autoFocus: false,
        panelClass: 'paddingless-modal-rounded',
        data: { edit: true, id: payeeId, page: 'payeePhone' }
      })
      .afterClosed()
      .subscribe(() => {
        this.sendStateService.loadPayee(payeeId);
        this.mail.revalidate();
      });
  }

  private readonly shippingCode = signal<string | null>(null);

  /** The carrier control belongs to whichever rail is active. Bank has none — its
   *  carrier is an id, not a `carrier_code`. */
  readonly shippingControl = computed(
    () =>
      this.registry.active().detailsForm.controls['shippingType'] as
        | FormControl<string | null>
        | undefined
  );

  /** Card/wallet carrier list. A custom address drops the untracked USPS options. */
  /**
   * A custom mailing address cannot go First Class, so those carriers drop out.
   * Reads the control rather than only the local flag — the address can become
   * custom without passing through setCustomAddressFlag.
   */
  readonly cardVisibleShippingTypes = computed(() => {
    const all = this.shippingTypes();
    return this.usesCustomAddress()
      ? all.filter((type) => !FIRST_CLASS_CODES.includes(type.carrier_code))
      : all;
  });

  /**
   * Read off the mailing itself rather than a second copy kept here: the local
   * flag survived a change of Pay from, so a card mailing opened custom on the
   * addresses a bank one had been given. The control is still consulted — a
   * reopened wallet cheque carries the answer on its form before its addresses
   * are restored.
   */
  private readonly usesCustomAddress = computed(
    () => this.mail.isCustomMailing() || !!this.customAddressControl()?.value
  );

  /**
   * Clears a carrier that the custom-address filter has just removed. Without
   * this the bar keeps showing a First Class option that is no longer offered and
   * submits it.
   */
  private dropFilteredCarrier(): void {
    effect(
      () => {
        const visible = this.cardVisibleShippingTypes();
        const control = this.shippingControl();
        untracked(() => {
          const current = control?.value;
          if (!current || !visible.length) {
            return;
          }
          if (!visible.some((type) => type.carrier_code === current)) {
            control?.setValue(visible[0]?.carrier_code ?? null);
          }
        });
      },
      { allowSignalWrites: true }
    );
  }

  readonly cardSelectedShip = computed(
    () =>
      this.cardVisibleShippingTypes().find(
        (type) => type.carrier_code === this.shippingCode()
      ) ?? null
  );

  readonly cardCheapestCode = computed<string | null>(() => {
    const list = this.cardVisibleShippingTypes();
    if (!list.length) {
      return null;
    }
    return list.reduce(
      (min, type) => (parseFloat(type.cost) < parseFloat(min.cost) ? type : min),
      list[0]
    ).carrier_code;
  });

  /**
   * The carriers that can actually reach this check's destination — the custom
   * mail-to when there is one, otherwise the selected payee's address. With
   * neither, there is nowhere to send it yet and nothing to offer.
   *
   * Legacy rule on top: a CUSTOM mail-from OR mail-to restricts delivery to
   * tracked services only. By destination country: US → Priority(4)/Express(5)/
   * Overnight(12); Canada → FedEx Overnight(16); International → (17/18).
   */
  readonly visibleBankMailShippingTypes = computed(() => {
    const all = this.bankMailShippingTypes();
    const destination = this.mail.destination();
    if (!destination) {
      return [];
    }

    const country = shippingCountry(destination.country);

    if (this.useCustomFrom() || !!this.customToAddress()) {
      const allowed =
        country === 'Canada' ? [16] : country === 'United States' ? [4, 5, 12] : [17, 18];
      return all.filter((type) => allowed.includes(type.id));
    }

    if (country === 'Canada') {
      return all.filter((type) => type.country === 'Canada');
    }
    if (country === 'United States') {
      return all.filter(
        (type) => type.country !== 'Canada' && type.country !== 'International'
      );
    }
    return all.filter((type) => type.country === 'International');
  });

  readonly selectedBankMailShip = computed(
    () =>
      this.visibleBankMailShippingTypes().find(
        (type) => type.id === this.selectedShipId()
      ) ?? null
  );

  readonly cheapestShipId = computed<number | null>(() => {
    const list = this.visibleBankMailShippingTypes();
    if (!list.length) {
      return null;
    }
    return list.reduce(
      (min, type) => (Number(type.amount) < Number(min.amount) ? type : min),
      list[0]
    ).id;
  });

  carrierLogo(t: ICheckShipingTypes | null): string {
    return t?.carrier_id === 2 ? 'assets/images/fedex.svg' : 'assets/images/usps.svg';
  }

  readonly bankCarrierOptions = computed<SpMailDropdownOption[]>(() =>
    this.visibleBankMailShippingTypes().map((t) => ({
      id: String(t.id),
      title: t.name,
      logoUrl: this.carrierLogo(t),
      tag: t.id === this.cheapestShipId() ? 'Cheapest' : '',
      cost: +t.amount
    }))
  );

  readonly bankSelectedCarrierId = computed<string | null>(() => {
    const id = this.selectedShipId();
    return id === null ? null : String(id);
  });

  onBankCarrierSelect(id: string): void {
    this.selectShipId(Number(id));
  }

  readonly cardCarrierOptions = computed<SpMailDropdownOption[]>(() =>
    this.cardVisibleShippingTypes().map((t) => ({
      id: t.carrier_code,
      title: t.name,
      logoUrl: t.logoUrl,
      tag: t.carrier_code === this.cardCheapestCode() ? 'Cheapest' : '',
      cost: +t.cost
    }))
  );

  selectShipId(id: number): void {
    this.selectedShipId.set(id);
    this.openPop.set(null);
  }

  selectCardShip(code: string): void {
    this.selectCardShipValue(code);
    this.openPop.set(null);
  }

  private selectCardShipValue(code: string | null): void {
    this.shippingControl()?.setValue(code);
    this.shippingCode.set(code);
  }

  // ── Popovers ──

  readonly openPop = signal<'from' | 'to' | 'method' | 'send' | null>(null);

  togglePop(which: 'from' | 'to' | 'method' | 'send' | null): void {
    this.openPop.set(this.openPop() === which ? null : which);
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    if (this.openPop() !== null) {
      this.openPop.set(null);
    }
  }

  /** "Payee address" option → clear the custom address, mail to payee. */
  selectPayeeMailTo(): void {
    this.customToAddress.set(null);
    this.customShippingToControl()?.setValue(null);
    this.selectedToSavedId.set(null);
    this.clearCustomFlagIfNeitherEnd();
    this.togglePop(null);
  }

  /** Default "from" option (bank account address / wallet return address) →
   *  clear the custom from-address. */
  selectBankMailFrom(): void {
    this.customFromAddress.set(null);
    this.selectedFromSavedId.set(null);
    this.customShippingFromControl()?.setValue(null);
    this.clearCustomFlagIfNeitherEnd();
    this.togglePop(null);
  }

  /** The flag stands for the mailing, not for one end of it: it comes down only
   *  once both ends are back to their defaults. */
  private clearCustomFlagIfNeitherEnd(): void {
    if (!this.customFromAddress() && !this.customToAddress()) {
      this.setCustomAddressFlag(false);
    }
  }

  selectSavedFrom(id: string): void {
    this.togglePop(null);
    this.checkService
      .getFromSingleId(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (!res?.data) {
          return;
        }
        this.customFromAddress.set(this.toCustomAddr(res.data));
        this.selectedFromSavedId.set(id);
        if (this.isWalletSource()) {
          this.customShippingFromControl()?.setValue(id);
          this.setCustomAddressFlag(true);
        }
      });
  }

  selectSavedTo(id: string): void {
    this.togglePop(null);
    this.checkService
      .getToSingleId(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (!res?.data) {
          return;
        }
        this.customToAddress.set(this.toCustomAddr(res.data));
        this.selectedToSavedId.set(id);
        if (this.isWalletSource()) {
          this.customShippingToControl()?.setValue(id);
        }
        this.setCustomAddressFlag(true);
      });
  }

  openCustomMailFrom(
    isEdit = false,
    prefill?: Partial<IMailSingleShippingAddress>
  ): void {
    this.dialog
      .open(AddMailAddressModalV4Component, {
        maxWidth: '700px',
        width: '98%',
        autoFocus: false,
        disableClose: true,
        panelClass: 'paddingless-modal-rounded',
        data: {
          dataKey: 'mail-from',
          isForUpdate: isEdit,
          id: isEdit ? (this.selectedFromSavedId() ?? '') : '',
          isWalletCheckCustomAddress: true,
          prefill
        }
      })
      .afterClosed()
      .subscribe((closeResult) => {
        if (!closeResult) {
          return;
        }
        if (closeResult.type === 'delete') {
          this.customFromAddress.set(null);
          this.selectedFromSavedId.set(null);
          this.customShippingFromControl()?.setValue(null);
          this.clearCustomFlagIfNeitherEnd();
          this.loadAddressFrom();
          return;
        }
        if (closeResult.data) {
          this.sendStateService.addressDeliveryError.set(null);
          this.customFromAddress.set(this.toCustomAddr(closeResult.data));
          this.selectedFromSavedId.set(closeResult.id ?? null);
          if (this.isWalletSource()) {
            this.customShippingFromControl()?.setValue(closeResult.id ?? null);
            this.setCustomAddressFlag(true);
          }
          this.loadAddressFrom();
        }
      });
  }

  openCustomMailTo(
    isEdit = false,
    prefill?: Partial<IMailSingleShippingAddress>
  ): void {
    this.dialog
      .open(AddMailAddressModalV4Component, {
        maxWidth: '700px',
        width: '98%',
        autoFocus: false,
        disableClose: true,
        panelClass: 'paddingless-modal-rounded',
        data: {
          dataKey: 'mail-to',
          isForUpdate: isEdit,
          id: isEdit ? (this.selectedToSavedId() ?? '') : '',
          isWalletCheckCustomAddress: true,
          prefill
        }
      })
      .afterClosed()
      .subscribe((closeResult) => {
        if (!closeResult) {
          return;
        }
        if (closeResult.type === 'delete') {
          this.customToAddress.set(null);
          this.selectedToSavedId.set(null);
          this.customShippingToControl()?.setValue(null);
          this.clearCustomFlagIfNeitherEnd();
          this.loadAddressTo();
          return;
        }
        if (closeResult.data) {
          this.sendStateService.addressDeliveryError.set(null);
          this.customToAddress.set(this.toCustomAddr(closeResult.data));
          this.selectedToSavedId.set(closeResult.id ?? null);
          if (this.isWalletSource()) {
            this.customShippingToControl()?.setValue(closeResult.id ?? null);
          }
          this.setCustomAddressFlag(true);
          this.loadAddressTo();
        }
      });
  }

  private toCustomAddr(
    a: IMailSingleShippingAddress | Record<string, string>
  ): IMailAddress {
    const r = a as unknown as Record<string, string | undefined>;
    return {
      name: r['name'] ?? '',
      company_name: r['company_name'] ?? '',
      address_line_1: r['address_line_1'] ?? '',
      address_line_2: r['address_line_2'] ?? '',
      city: r['city'] ?? '',
      state: r['state'] ?? '',
      zip: r['zip'] ?? '',
      country: r['country'] || 'US',
      email: r['email'] ?? '',
      phone: r['phone'] ?? ''
    };
  }

  // ── Attach to envelope ──

  readonly showMailAttachPanel = signal(false);

  /** Which of the payment's attachments ship inside the mail envelope. */
  private readonly deliveryAttachmentIds = this.mail.envelopeAttachmentIds;
  private readonly autoProcessedAttachIds = new Set<string>();

  get mailAutoAttachOn(): boolean {
    return this.mailAttachDefaultOn();
  }

  /**
   * The payment's files, named. The ids on the active source say which are on
   * the payment; the activity service is what knows what each one is called.
   */
  readonly mailAttachItems = computed(() => {
    const named = new Map(
      this.paymentActivityService.attachmentItems().map((a) => [a.id, a])
    );
    const ids = this.registry.active().attachmentIds ?? [];
    return ids.map((id) => {
      const key = String(id);
      return (
        named.get(key) ?? {
          id: key,
          name: 'Attachment',
          pageCount: undefined as number | undefined
        }
      );
    });
  });

  readonly mailedAttachCount = computed(() => {
    const ids = new Set(this.deliveryAttachmentIds());
    return this.mailAttachItems().filter((a) => ids.has(a.id)).length;
  });

  isAttachmentMailed(id: string): boolean {
    return this.deliveryAttachmentIds().includes(id);
  }

  toggleMailAttachment(id: string): void {
    const next = new Set(this.deliveryAttachmentIds());
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    this.setEnvelopeAttachments([...next]);
  }

  /**
   * What rides in the envelope is what the API is asked to enclose, and what it
   * bills for — `extras.attachments` drives `cost.attachments`. Unchecking one
   * used to change neither, so the row moved and nothing else did.
   */
  private setEnvelopeAttachments(ids: string[]): void {
    this.deliveryAttachmentIds.set(ids);
    this.registry.active().envelopeAttachmentIds = ids;
    if (this.isMailDelivery()) {
      this.fees.setAttachmentIds(ids);
    }
  }

  toggleMailAttachPanel(): void {
    this.showMailAttachPanel.update((open) => !open);
  }

  addMailAttachment(): void {
    this.paymentActivityService.openAttachments();
  }

  private mailAttachDefaultOn(): boolean {
    const settings = (
      this.headerService._headerData.getValue() as {
        personalInfo?: { AttachmentSettings?: { check_mail?: number } };
      } | null
    )?.personalInfo?.AttachmentSettings;
    return settings?.check_mail === 1;
  }

  private syncMailAttachments(): void {
    const items = this.mailAttachItems();
    const present = new Set(items.map((a) => a.id));
    const delivery = new Set(this.deliveryAttachmentIds());

    for (const id of [...delivery]) {
      if (!present.has(id)) {
        delivery.delete(id);
      }
    }
    const on = this.mailAttachDefaultOn();
    for (const a of items) {
      if (!this.autoProcessedAttachIds.has(a.id)) {
        this.autoProcessedAttachIds.add(a.id);
        if (on) {
          delivery.add(a.id);
        }
      }
    }
    for (const id of [...this.autoProcessedAttachIds]) {
      if (!present.has(id)) {
        this.autoProcessedAttachIds.delete(id);
      }
    }

    this.setEnvelopeAttachments([...delivery]);
  }

  // ── Inline errors ──

  /** The submit paths mark the whole details form touched when they reject it. */
  submitAttempted(): boolean {
    return (
      this.sendStateService.deliveryError() ||
      this.registry.active().detailsForm.touched
    );
  }

  bankInlineErrors(): Record<string, string> {
    const out: Record<string, string> = {};

    if (this.isCardSource()) {
      if (this.isCheckMail() && !this.shippingControl()?.value) {
        out['bankMailShip'] = 'Please select a shipping type';
      }
      return out;
    }


    if (!this.sendStateService.checkDelivery()) {
      out['delivery'] = 'Please select a delivery option';
    }

    // A custom address makes the From required on every check, and the To as
    // well when it is being mailed.
    //
    // Both live on the WALLET details form. A bank check has neither control,
    // and `undefined?.value` is falsy — so this used to report both addresses
    // missing on every bank check that had ever opened the custom-address
    // dialog, with no way to clear them: the controls it asks about do not
    // exist on that form. A control that is not there cannot be empty.
    //
    // Only print asks for one. A mailed cheque materialises whichever end the
    // user left on its default, so an empty control there means the resolve has
    // not come back yet — not that the user skipped it — and saying "please
    // select a from address" under the address they can see is chosen is how
    // this read before.
    const from = this.customShippingFromControl();
    if (this.usesCustomAddress() && this.isPrintDelivery() && from && !from.value) {
      out['customShippingFrom'] = 'Please select a from address';
    }

    if (this.isWalletSource()) {
      if (this.isCheckMail() && !this.shippingControl()?.value) {
        out['bankMailShip'] = this.shippingUnavailable()
          ? 'No delivery methods are available right now — please try again'
          : 'Please select a delivery method';
      }
      return out;
    }

    // The address comes first: with no valid destination there is no delivery
    // method on screen to ask for, so asking for one reads as nonsense.
    if (
      this.isBankSource() &&
      this.isMailDelivery() &&
      this.mailAddressReady() &&
      this.selectedShipId() == null
    ) {
      out['bankMailShip'] = 'Please select a delivery method';
    }

    // What the API refused about the carrier the user did pick.
    const carrier = this.mail.carrierError();
    if (carrier) {
      out['bankMailShip'] = carrier;
    }
    return out;
  }

  // ── Check preview bar ──

  /**
   * A form control is not a signal, so a computed reading one is evaluated once
   * and then cached for good. The bar got away with it while it only appeared
   * after a delivery was picked — by then the serial number had arrived, so the
   * single evaluation happened to be right. Rendering it from the moment Check
   * is chosen made that first read land on an empty control instead.
   *
   * `active` changes with the source, so the subscription follows it.
   */
  private readonly activeDetailsValue = toSignal(
    toObservable(this.registry.active).pipe(
      switchMap((source) =>
        source.detailsForm.valueChanges.pipe(
          startWith(source.detailsForm.getRawValue())
        )
      )
    ),
    { initialValue: null }
  );

  readonly checkNumber = computed(() => {
    this.activeDetailsValue();
    // The serial number is set with `emitEvent: false`, so it never reaches
    // `valueChanges` — the rail says when it lands.
    this.bankCheckService.detailsWritten();
    return this.registry.active().detailsForm.controls['checkNumber']?.value ?? '';
  });

  readonly issueDate = computed(() => {
    this.activeDetailsValue();
    this.bankCheckService.detailsWritten();
    return this.registry.active().detailsForm.controls['issueDate']?.value ?? '';
  });

  /** Opened here rather than emitted upward — nothing bound the output, so the
   *  bar did nothing at all. */
  openCheckModal(): void {
    this.dialog.open(CheckDetailsModalComponent, {
      maxWidth: '760px',
      width: '96%',
      autoFocus: false,
      panelClass: 'paddingless-modal-rounded',
      injector: this.injector,
      disableClose:true,
      data: {
        form: this.registry.active().detailsForm,
        payeeName: this.payeeName() || 'Payee',
        amount: this.sendStateService.coreForm.controls.amount.value ?? '',
      }
    });
  }

  deliveryIcon(option: ICheckDeliveryOption): object {
    return this.icons[option.icon];
  }

  onCheckDeliveryChange(option: IDeliveryTile): void {
    if (option.disabled) {
      return;
    }
    this.changingDelivery.set(false);
    this.deliverySelected.emit(option);
  }

  changeDelivery(): void {
    this.changingDelivery.set(true);
  }

  // ── Loaders ──

  private loadPrintData(): void {
    if (!this.shippingAddressFrom().length) {
      this.loadAddressFrom();
    }
    this.loadBankFromAddress();
  }

  private loadMailData(): void {
    if (!this.shippingTypes().length) {
      this.loadShippingTypes();
    }
    if (!this.shippingAddressFrom().length) {
      this.loadAddressFrom();
    }
    if (!this.shippingAddressTo().length) {
      this.loadAddressTo();
    }
    if (this.isBankSource()) {
      this.mail.loadCarriers();
    }
    this.loadBankFromAddress();
  }

  private loadShippingTypes(): void {
    this.shippingLoading.set(true);
    this.shared
      .getWalletShippingTypes()
      .pipe(
        finalize(() => {
          this.shippingLoading.set(false);
          this.shippingSettled.set(true);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          const options = toShippingOptions(res?.data ?? []);
          this.shippingTypes.set(options);
          this.shippingUnavailable.set(!options.length);
          this.shippingCode.set(this.shippingControl()?.value ?? null);
        },
        // Swallowing this left the bar reading "Select carrier" over an empty
        // list, with no way to tell a failed call from a genuine empty one.
        error: () => this.shippingUnavailable.set(true)
      });
  }

  private loadAddressFrom(): void {
    const headerOption = new HttpHeaders().set('disablePermission', 'true');
    this.addressFromLoading.set(true);
    this.checkService
      .getAddressFrom(headerOption)
      .pipe(
        finalize(() => this.addressFromLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => this.shippingAddressFrom.set(res?.data ?? []),
        error: () => undefined
      });
  }

  private loadAddressTo(): void {
    if(this.mail.isWalletPrint()) {
      return;
    }
    const headerOption = new HttpHeaders().set('disablePermission', 'true');
    this.addressToLoading.set(true);
    this.checkService
      .getAddressTo(headerOption)
      .pipe(
        finalize(() => this.addressToLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => this.shippingAddressTo.set(res?.data ?? []),
        error: () => undefined
      });
  }

  private loadBankFromAddress(): void {
    if (!this.isBankSource()) {
      return;
    }
    const id = this.sendStateService.coreForm.controls.bankAc.value?.id;
    if (!id) {
      return;
    }
    this.bankAddressLoading.set(true);
    this.checkService
      .getbank({ ids: [id] })
      .pipe(
        finalize(() => this.bankAddressLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => this.bankFromAddress.set(res?.data?.[0] ?? null),
        error: () => undefined
      });
  }

  private flag(name: keyof IDynamicWhiteLabelFlags): boolean {
    return this.whiteLabel.dynamicWhiteLabelFlagChecker(name);
  }
}

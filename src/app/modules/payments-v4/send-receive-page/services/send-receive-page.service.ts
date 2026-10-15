import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, map, of } from 'rxjs';

import { environment } from 'src/environments/environment';
import { Utils } from 'src/app/data/utils';
import type { LocalStorageKeys } from 'src/app/models/local-storage';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CompanyManagementService } from 'src/app/shared/service/company/company-management.service';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import {
  IPayFromSource,
  PAY_FROM_SOURCES
} from 'src/app/shared/components/v4/dropdowns/pay-from-dropdown-v4/pay-from-dropdown-v4.component';
import { IPaymentMethodOption } from 'src/app/shared/components/v4/dropdowns/payment-method-dropdown-v4/payment-method-dropdown-v4.component';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Which half of the page the route asked for. */
export type PaymentMode = 'pay' | 'receive';

/** CREATE / EDIT / CLONE — what the `:mode` route param resolves to. */
export type SendMode = 'CREATE' | 'EDIT' | 'CLONE';

/** Everything the route said about this payment. */
export interface ISendPageConfig {
  mode: SendMode;
  id?: string;
  sourceId?: string;
  methodId?: string;
  /** `?billId` — the bill(s) this payment settles. */
  billIds?: string[];
  /** `?payee_id` — preselect this payee. */
  payeeId?: string;
  /** `?checkStatus` — 50 means the check is already queued. */
  checkStatus?: number;
}

/** What the user's choice resolved to once every rule has had its say. */
export type MethodDecision =
  | { action: 'allow' }
  /** Put the dropdown back where it was; the user was told why. */
  | { action: 'reset' }
  /** The user accepted the offer to make this payment from the Wallet instead. */
  | { action: 'moveToWallet'; methodId: string };

export type SourceDecision =
  | { action: 'allow' }
  | { action: 'reset' }
  /** Card is switched off account-wide; the user drops back to Bank. */
  | { action: 'moveToBank' };

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** API flag -> the source/method id it switches off. */
const ENABLE_PAYMENT_METHODS: Record<string, string> = {
  isCloudBankEnabled: 'cloud',
  internationalWireEnabled: 'international',
  debitPullEnabled: 'debit_pull',
  debitPushEnabled: 'debit_card',
  checkDepositEnabled: 'check_deposit',
  isVirtualCardSendEnabled: 'virtual-card',
  isCheckMailSendEnabled: 'check_mail',
  isPaymentWireTransferEnabled: 'wire',
  isCardRailPaymentWireTransferEnabled: 'card-wire-transfer',
  isPaymentRtpTransferEnabled: 'rtp',
  isInternationalPaymentEnabled: 'international-payment',
  isWalletWirePaymentEnabled: 'wallet-wire'
};

/** The source/method combinations that are refused, offering the Wallet instead. */
const WALLET_ONLY_METHODS: Record<string, string[]> = {
  bankaccount: ['same-ach', 'international-payment', 'wire'],
  card: ['international-payment', 'same-ach'],
  cloud: [
    'virtual-card',
    'rtp',
    'same-ach',
    'international-payment',
    'check_mail',
    'check_print'
  ]
};

/** RTP is offered from the Wallet alone. */
const RTP_BLOCKED_SOURCES = ['card', 'bankaccount', 'cloud'];

/** The methods a white label sells, per environment. */
const CSNHC_METHODS = ['check'];
const COMPASS_METHODS = ['check', 'ach', 'wire', 'virtual-card'];

/** Method ids whose disabled-message wording differs from the id itself. */
const DISABLED_MESSAGE_LABELS: Record<string, string> = {
  rtp: 'RTP',
  'international-payment': 'International Payment',
  'card-wire-transfer': 'Wire',
  'wallet-wire': 'Wire'
};

/**
 * The one page-scoped service: what the route asked for, and which source/method this
 * account may use.
 */
@Injectable()
export class SendReceivePageService {
  // ---------------------------------------------------------------------------
  // Dependency injection
  // ---------------------------------------------------------------------------

  private readonly paymentsService = inject(PaymentsService);
  private readonly companyManagementService = inject(CompanyManagementService);
  private readonly localStorageService = inject(LocalStorageService);
  private readonly dynamicWhiteLabelService = inject(DynamicWhiteLabelService);
  private readonly v4AlertService = inject(V4AlertService);
  private readonly destroyRef = inject(DestroyRef);

  // ---------------------------------------------------------------------------
  // Signals
  // ---------------------------------------------------------------------------

  /** Pay or Receive. Written once from `route.data`, never from a URL string match. */
  readonly pageMode = signal<PaymentMode>('pay');

  /** What the route said. Written once by SendReceivePageComponent. */
  readonly routeConfig = signal<ISendPageConfig>({ mode: 'CREATE' });

  readonly loading = signal(false);

  /**
   * The maintenance message the header supplies, written here by
   * AccountVerificationService so the card rules can read it in one place.
   */
  readonly cardMaintenanceMessage = signal('');

  /** The source/method ids this account may not use, as the API named them. */
  private readonly disabledIds = signal<string[]>([]);

  /**
   * The same list, whole. The Default Payment modal is the one caller: it greys out the
   * sources and methods this account cannot pick.
   */
  readonly disabledMethods = this.disabledIds.asReadonly();

  /**
   * Compass sells a bank-account-only product, and CSNHC a check-only one.
   */
  readonly sources = computed<IPayFromSource[]>(() => {
    if (environment.env_id === 'csnhc') {
      return this.whiteLabelSources(CSNHC_METHODS);
    }
    if (environment.env_id === 'compass') {
      return this.whiteLabelSources(COMPASS_METHODS);
    }
    return PAY_FROM_SOURCES;
  });

  // ---------------------------------------------------------------------------
  // Route / page context
  // ---------------------------------------------------------------------------

  setPageMode(mode: PaymentMode): void {
    this.pageMode.set(mode);
  }

  setRouteConfig(config: ISendPageConfig): void {
    this.routeConfig.set(config);
  }

  // ---------------------------------------------------------------------------
  // Availability
  // ---------------------------------------------------------------------------

  /** Re-runs on every company switch — a different company has different methods. */
  load(): void {
    this.fetchAvailablePayments();

    this.companyManagementService.getCompanyChange$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((changed) => {
        if (changed) {
          this.fetchAvailablePayments();
        }
      });
  }

  /** `check_mail` is explicitly exempt — it is listed but never blocked on. */
  isDisabled(id: string | undefined | null): boolean {
    if (!id) {
      return false;
    }
    return this.disabledIds().includes(id) && id !== 'check_mail';
  }

  /**
   * Why a method cannot simply be picked, in the user's words — or nothing at
   * all when it can. A tooltip here is an explanation, never a description: a
   * method that works needs no note, and one that does not owes the user a
   * reason before they click it.
   */
  methodTooltip(sourceId: string | null, method: IPaymentMethodOption): string {
    if (!sourceId) {
      return '';
    }
    if (
      this.isWalletOnlyMethod(sourceId, method.id) ||
      this.isVirtualCardOffWallet(sourceId, method.id)
    ) {
      return 'Available from Wallet — selecting this switches your funding source to Wallet.';
    }
    if (this.isRtpOffWallet(sourceId, method.id)) {
      return 'Real-time payments are coming soon.';
    }
    if (method.locked) {
      return method.id === 'wire'
        ? 'Wire isn’t enabled for your account yet — contact support to request access.'
        : 'This payment method isn’t available for this source.';
    }
    return '';
  }

  /**
   * Only the catalog's own static `locked` greys a method. A method the API disabled
   * stays selectable and shows the "contact support" alert on selection (evaluateMethod).
   */
  isMethodLocked(
    _sourceId: string | null,
    method: IPaymentMethodOption
  ): boolean {
    return !!method.locked;
  }

  /** Card payments can be switched off account-wide for maintenance. */
  isCardUnderMaintenance(sourceId: string | undefined): boolean {
    return (
      sourceId === 'card' &&
      this.localStorageService.getItem('isCreditCardPaymentEnabled') === 0
    );
  }

  // ---------------------------------------------------------------------------
  // Pay-from source
  // ---------------------------------------------------------------------------

  /** The maintenance window first, then the API's answer. */
  evaluateSource(
    source: IPayFromSource | null | undefined
  ): Observable<SourceDecision> {
    if (!source) {
      return of({ action: 'allow' } as SourceDecision);
    }

    if (this.isCardUnderMaintenance(source.id)) {
      return this.notifyCardMaintenance();
    }

    if (this.isDisabled(source.id)) {
      return this.notifyDisabled(source.id);
    }

    return of({ action: 'allow' } as SourceDecision);
  }

  // ---------------------------------------------------------------------------
  // Payment method
  // ---------------------------------------------------------------------------

  /** Each rule that refuses either resets the dropdown or offers the Wallet. */
  evaluateMethod(
    sourceId: string | null,
    method: IPaymentMethodOption | null | undefined
  ): Observable<MethodDecision> {
    if (!method || !sourceId) {
      return of({ action: 'allow' } as MethodDecision);
    }

    if (this.isVirtualCardOffWallet(sourceId, method.id)) {
      return this.offerWallet(method.id, method.name);
    }

    if (this.isRtpOffWallet(sourceId, method.id)) {
      return this.offerWalletForRtp();
    }

    if (this.isDisabled(this.flagFor(sourceId, method.id))) {
      return this.notifyDisabled(this.flagFor(sourceId, method.id)).pipe(
        map(() => ({ action: 'reset' }) as MethodDecision)
      );
    }

    if (this.isInternationalPaymentOff(method.id)) {
      return this.notifyInternationalPaymentOff();
    }

    if (this.isWalletOnlyMethod(sourceId, method.id)) {
      return this.offerWallet(method.id, method.name);
    }

    return of({ action: 'allow' } as MethodDecision);
  }

  // ---------------------------------------------------------------------------
  // API methods
  // ---------------------------------------------------------------------------

  /** A flag that comes back `0` disables the id it maps to. */
  private fetchAvailablePayments(): void {
    this.loading.set(true);

    this.paymentsService
      .getDisablePayments()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.loading.set(false);
          if (!res?.data) {
            return;
          }
          this.disabledIds.set(this.toDisabledIds(res.data));
        },
        error: () => this.loading.set(false)
      });
  }

  // ---------------------------------------------------------------------------
  // Alerts
  // ---------------------------------------------------------------------------

  /** "Contact Now" opens live chat; either way the selection is put back. */
  private notifyDisabled(id: string): Observable<SourceDecision> {
    return this.alertAndResetOnClose(this.disabledMessage(id));
  }

  private notifyCardMaintenance(): Observable<SourceDecision> {
    return this.v4AlertService
      .infoAlert({
        content: this.cardMaintenanceMessage(),
        isOk: true,
        doneMsg: 'Ok'
      })
      .afterClosed()
      .pipe(map(() => ({ action: 'moveToBank' }) as SourceDecision));
  }

  private notifyInternationalPaymentOff(): Observable<MethodDecision> {
    return this.alertAndResetOnClose(
      'International Payment transfer is not enabled for this account. Please contact the support team to enable it.'
    ).pipe(map((decision) => decision as MethodDecision));
  }

  private offerWallet(
    methodId: string,
    label: string
  ): Observable<MethodDecision> {
    return this.offerWalletWith(
      `${label} payments are now allowed only from the wallet. Would you like to proceed with the payment using your wallet?`,
      methodId
    );
  }

  /** RTP has its own wording. */
  private offerWalletForRtp(): Observable<MethodDecision> {
    return this.offerWalletWith(
      '<span style="font-weight: 600;">Real Time Instant payments</span> are now allowed only from the <span style="font-weight: 600;">Wallet</span>. Would you like to proceed with the payment using your <span style="font-weight: 600;">Wallet</span>?',
      'rtp'
    );
  }

  private offerWalletWith(
    content: string,
    methodId: string
  ): Observable<MethodDecision> {
    return this.v4AlertService
      .infoAlert({
        content,
        isOk: true,
        isCancel: true,
        doneMsg: 'Proceed',
        cancelMsg: 'Cancel'
      })
      .afterClosed()
      .pipe(
        map((proceed) =>
          proceed
            ? ({ action: 'moveToWallet', methodId } as MethodDecision)
            : ({ action: 'reset' } as MethodDecision)
        )
      );
  }

  /** The "not enabled — contact support" alert; the selection is always put back. */
  private alertAndResetOnClose(content: string): Observable<SourceDecision> {
    return this.v4AlertService
      .infoAlert({
        content,
        isOk: true,
        isCancel: true,
        doneMsg: 'Contact Now',
        cancelMsg: 'Not Now'
      })
      .afterClosed()
      .pipe(
        map((contact) => {
          if (contact) {
            this.dynamicWhiteLabelService.goToLiveChat();
          }
          return { action: 'reset' } as SourceDecision;
        })
      );
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private toDisabledIds(data: object): string[] {
    return Object.entries(data)
      .filter(([flag, value]) => value === 0 && !!ENABLE_PAYMENT_METHODS[flag])
      .map(([flag]) => ENABLE_PAYMENT_METHODS[flag]);
  }

  /** Wire is not one flag but three — the card rail and the wallet each have their own. */
  private wireFlagFor(sourceId: string | null): string {
    if (sourceId === 'card') {
      return 'card-wire-transfer';
    }
    if (sourceId === 'wallet') {
      return 'wallet-wire';
    }
    return 'wire';
  }

  /** The API flag a source+method pair is actually gated on. */
  private flagFor(sourceId: string | null, methodId: string): string {
    return methodId === 'wire' ? this.wireFlagFor(sourceId) : methodId;
  }

  private disabledMessage(id: string): string {
    const transferType = DISABLED_MESSAGE_LABELS[id];
    return `${transferType ?? Utils.capitalize(id)} transfer is not enabled for this account. Please contact the support team to enable it.`;
  }

  private isVirtualCardOffWallet(sourceId: string, methodId: string): boolean {
    return methodId === 'virtual-card' && sourceId !== 'wallet';
  }

  private isRtpOffWallet(sourceId: string, methodId: string): boolean {
    return methodId === 'rtp' && RTP_BLOCKED_SOURCES.includes(sourceId);
  }

  private isWalletOnlyMethod(sourceId: string, methodId: string): boolean {
    return (WALLET_ONLY_METHODS[sourceId] ?? []).includes(methodId);
  }

  /** Gated by two localStorage flags, quite apart from the API list. */
  private isInternationalPaymentOff(methodId: string): boolean {
    if (methodId !== 'international-payment') {
      return false;
    }
    return (
      !this.isBusinessInternationalOn() && !this.isPersonalInternationalOn()
    );
  }

  private isBusinessInternationalOn(): boolean {
    return this.isFlagOn('rippleBusinessInternationalPaymentEnabled');
  }

  private isPersonalInternationalOn(): boolean {
    return this.isFlagOn('ripplePersonalInternationalPaymentEnabled');
  }

  /** localStorage answers with either the number or the string. */
  private isFlagOn(key: LocalStorageKeys): boolean {
    const flag = this.localStorageService.getItem(key);
    return flag === 1 || flag === '1';
  }

  /** Bank account only, and only the methods the white label sells. */
  private whiteLabelSources(methodIds: string[]): IPayFromSource[] {
    return PAY_FROM_SOURCES.filter((source) => source.id === 'bankaccount').map(
      (source) => ({
        ...source,
        payOptions: (source.payOptions ?? []).filter((option) =>
          methodIds.includes(option.id)
        )
      })
    );
  }
}

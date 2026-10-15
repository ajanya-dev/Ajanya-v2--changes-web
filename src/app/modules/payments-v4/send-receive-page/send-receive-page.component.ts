import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { combineLatest } from 'rxjs';
// eslint-disable-next-line import/no-extraneous-dependencies
import { LucideAngularModule, ChevronLeft, Layers, Settings } from 'lucide-angular';

import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import type { IDefaultPayment } from 'src/app/modules/payments/model/payments';

import { MatTooltip } from '@angular/material/tooltip';
import { DefaultPaymentV4Component } from '../send-payment/modals/default-payment-v4/default-payment-v4.component';
import { SendPaymentErrorHandlerService } from '../send-payment/services/send-payment-error-handler.service';
import { PaymentDetailsSectionComponent } from './components/payment-details-section/payment-details-section.component';
import { PaymentsSectionComponent } from './components/payments-section/payments-section.component';
import { ReceiveStateService } from './components/payments-section/receive/shared/receive-state.service';
import { BankCheckService } from './components/payments-section/send/bank/services/bank-check.service';
import { BankPaymentService } from './components/payments-section/send/bank/services/bank-payment.service';
import { ExportCheckService } from './components/payments-section/send/bank/services/export-check.service';
import { CardPaymentService } from './components/payments-section/send/card/services/card-payment.service';
import { AccountVerificationService } from './components/payments-section/send/shared/services/account-verification.service';
import { CheckDirectDepositService } from './components/payments-section/send/shared/services/check-direct-deposit.service';
import { CheckEmailService } from './components/payments-section/send/shared/services/check-email.service';
import { CheckMailService } from './components/payments-section/send/shared/services/check-mail.service';
import { DefaultPaymentQuickSetService } from './components/payments-section/send/shared/services/default-payment-quick-set.service';
import { PaymentActivityService } from './components/payments-section/send/shared/services/payment-activity.service';
import { PaymentConfirmService } from './components/payments-section/send/shared/services/payment-confirm.service';
import { PaymentFeeService } from './components/payments-section/send/shared/services/payment-fee.service';
import { SendHydrationService } from './components/payments-section/send/shared/services/send-hydration.service';
import { SendSourceRegistryService } from './components/payments-section/send/shared/services/send-source-registry.service';
import { SendStateService } from './components/payments-section/send/shared/services/send-state.service';
import { SharedDetailsSyncService } from './components/payments-section/send/shared/services/shared-details-sync.service';
import { WalletPaymentService } from './components/payments-section/send/wallet/services/wallet-payment.service';
import {
  PaymentMode,
  SendMode,
  SendReceivePageService
} from './services/send-receive-page.service';

/**
 * `:type2` -> the pay-from id it names. The URL says `bank`, the catalog calls the
 * source `bankaccount`; an unknown word names no source, and the default payment loads.
 */
const SOURCE_ALIASES: Record<string, string> = {
  bank: 'bankaccount',
  bankaccount: 'bankaccount',
  wallet: 'wallet',
  card: 'card',
  cloud: 'cloud'
};

/** `:mode` arrives as `edit` / `clone`; anything else is a new payment. */
function normalizeMode(raw: string | undefined): SendMode {
  const mode = raw?.toUpperCase();
  return mode === 'EDIT' || mode === 'CLONE' ? mode : 'CREATE';
}

function normalizeSourceId(raw: string | null): string | undefined {
  return raw ? SOURCE_ALIASES[raw.toLowerCase()] : undefined;
}

/** `?billId=` is one id, or several comma-separated. */
function parseBillIds(raw: unknown): string[] | undefined {
  if (typeof raw !== 'string' || !raw) {
    return undefined;
  }
  const ids = raw.split(',').filter(Boolean);
  return ids.length ? ids : undefined;
}

/**
 * Owns the route: it is the only component on this page that reads it, and it
 * publishes what it read into SendReceivePageService for everything below.
 */
@Component({
  selector: 'app-send-receive-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    LucideAngularModule,
    MatTooltipModule,
    PaymentsSectionComponent,
    PaymentDetailsSectionComponent,
    MatTooltip
  ],
  // Provided here, not on SendComponent: the form column and the details rail are
  // siblings and must share one instance of each.
  providers: [
    SendReceivePageService,
    SendStateService,
    SendSourceRegistryService,
    PaymentFeeService,
    CheckMailService,
    CheckEmailService,
    CheckDirectDepositService,
    PaymentConfirmService,
    PaymentActivityService,
    AccountVerificationService,
    SendHydrationService,
    WalletPaymentService,
    CardPaymentService,
    BankPaymentService,
    BankCheckService,
    ExportCheckService,
    SharedDetailsSyncService,
    SendPaymentErrorHandlerService,
    ReceiveStateService,
    DefaultPaymentQuickSetService
  ],
  templateUrl: './send-receive-page.component.html',
  styleUrls: ['./send-receive-page.component.scss']
})
export class SendReceivePageComponent implements OnInit {
  // ---------------------------------------------------------------------------
  // Dependency injection
  // ---------------------------------------------------------------------------

  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialog = inject(MatDialog);
  private readonly location = inject(Location);
  private readonly appSettingsService = inject(AppSettingsService);
  private readonly sendReceivePageService = inject(SendReceivePageService);
  private readonly sendHydrationService = inject(SendHydrationService);
  private readonly sendStateService = inject(SendStateService);
  private readonly paymentConfirmService = inject(PaymentConfirmService);

  // ---------------------------------------------------------------------------
  // Public properties
  // ---------------------------------------------------------------------------

  readonly ChevronLeftIcon = ChevronLeft;
  readonly LayersIcon = Layers;
  readonly SettingIcon = Settings;

  readonly mode = this.sendReceivePageService.pageMode;

  // ---------------------------------------------------------------------------
  // Lifecycle hooks
  // ---------------------------------------------------------------------------

  ngOnInit(): void {
    this.sendReceivePageService.load();
    this.watchRoute();
  }

  // ---------------------------------------------------------------------------
  // Event handlers
  // ---------------------------------------------------------------------------

  goBack(): void {
    this.location.back();
  }

  openDefaultPaymentModal(): void {
    this.dialog
      .open(DefaultPaymentV4Component, {
        panelClass: 'paddingless-modal-rounded',
        width: 'fit-content',
        data: {
          defaultPayments: this.sendHydrationService.defaultPayment(),
          disableMethods: this.sendReceivePageService.disabledMethods()
        }
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result: { defaultPayment?: IDefaultPayment } | undefined) => {
        if (!result?.defaultPayment) {
          return;
        }

        if (this.sendStateService.mode() === 'CREATE') {
          this.paymentConfirmService.resetRequested.next();
        }
        this.sendHydrationService.reloadDefaultPayment();
      });
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Subscribed, not snapshotted: `/send` and `/receive` are the same component, so
   * navigating in place reuses it and a snapshot never re-derives.
   */
  private watchRoute(): void {
    combineLatest([
      this.activatedRoute.paramMap,
      this.activatedRoute.queryParamMap,
      this.activatedRoute.data
    ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([params, queryParams, data]) => {
        this.applyPageMode(data.mode as PaymentMode, data.title as string);
        this.publishRouteConfig(params, queryParams);
      });
  }

  /** Which half of the page is on screen is `route.data`'s answer, not the URL's. */
  private applyPageMode(mode: PaymentMode, title: string): void {
    this.sendReceivePageService.setPageMode(mode ?? 'pay');
    this.appSettingsService.setPageTitle(title ?? 'Send Payment');
  }

  private publishRouteConfig(
    params: { get(name: string): string | null },
    queryParams: { get(name: string): string | null }
  ): void {
    this.sendReceivePageService.setRouteConfig({
      mode: normalizeMode(params.get('mode') ?? undefined),
      id: params.get('id') ?? undefined,
      sourceId: normalizeSourceId(params.get('type2')),
      methodId: params.get('type3') ?? undefined,
      billIds: parseBillIds(queryParams.get('billId')),
      payeeId: queryParams.get('payee_id') ?? undefined,
      checkStatus: Number(queryParams.get('checkStatus')) || undefined
    });
  }
}

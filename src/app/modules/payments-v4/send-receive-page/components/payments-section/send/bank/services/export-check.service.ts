import { Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, firstValueFrom, of } from 'rxjs';

import type {
  IFreshBookExportsData,
  IPaymentExportsOptions,
  IQBDExportsData,
  IQBOExportsData,
  IUpdatePaymentBody
} from 'src/app/modules/payments/model/payments';
import type { INetSuiteExportsData } from 'src/app/modules/integration/netsuite/model/netsuite';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';

/** The enterprise plugin that makes an export category compulsory. */
const WIYGUL_PLUGIN = 'enterprise-wiygul';

/** Nothing is connected until the four capability calls say otherwise. */
const NO_PLATFORMS: IPaymentExportsOptions = {
  isQBOPushBack: false,
  isQBDPushBack: false,
  isNetsuitePushBack: false,
  isFreshBooksPushBack: false
};

/** The panel that owns the export line items, while it is on screen. */
interface IExportPanel {
  save(): Observable<boolean>;
}

/**
 * Accounting platforms a payment can export to — four independently settled calls.
 * Payloads live here: a check sends all four, ACH only NetSuite's (bank-ac-check
 * L2210-2283, bank-ac-ach-v3 L1137-1142).
 */
@Injectable()
export class ExportCheckService {
  // ── Dependencies ──
  private readonly checkService = inject(CheckService);
  private readonly integrationService = inject(IntegrationService);
  private readonly headerService = inject(HeaderService);

  // ── Signals ──

  /** Which platforms this account has connected. */
  readonly options = signal<IPaymentExportsOptions>(NO_PLATFORMS);

  /** The "Export Check" checkbox. Off means none of this reaches the payload. */
  readonly enabled = signal(false);

  /** Wiygul makes a category compulsory whenever NetSuite export is on. */
  readonly isWiygulEnterprise = signal(false);

  /**
   * Whether QBO export data may still be attached. True for a new payment; on an
   * edit it comes off the record — one already exported cannot be exported again.
   */
  readonly hasQboExportData = signal(true);

  // ── Computed ──

  /** No connected platform, nothing to offer — the whole section stays hidden. */
  readonly hasAnyPlatform = computed(() => {
    const o = this.options();
    return (
      o.isQBOPushBack ||
      o.isQBDPushBack ||
      o.isNetsuitePushBack ||
      // v3 left FreshBooks out of this test, so an account with only FreshBooks
      // connected never saw the section at all (payments-main-v35 L1002-1009).
      o.isFreshBooksPushBack
    );
  });

  /** Bank ACH exports to NetSuite alone; a check exports to any of the four. */
  readonly hasNetsuite = computed(() => this.options().isNetsuitePushBack);

  // ── What the export panel has saved, per platform ──
  qbo: IQBOExportsData | undefined;
  qbd: IQBDExportsData | undefined;
  netsuite: INetSuiteExportsData | undefined;
  freshbooks: IFreshBookExportsData | undefined;

  /**
   * The export panel, while it is on screen. The body reads what the panel *saved*,
   * so submit must make it save first — component and service meet here.
   */
  private panel: IExportPanel | null = null;

  /** Asked once per page. Only a bank source can export, so only it asks. */
  private asked = false;

  constructor() {
    // eslint-disable-next-line no-underscore-dangle
    this.headerService._headerData
      .pipe(takeUntilDestroyed())
      .subscribe((data) =>
        this.isWiygulEnterprise.set(
          !!data && !!data.enabledPlugins?.includes(WIYGUL_PLUGIN)
        )
      );
  }

  // -------------------------------------------------------------------------
  // The panel
  // -------------------------------------------------------------------------

  registerPanel(panel: IExportPanel): void {
    this.panel = panel;
  }

  clearPanel(panel: IExportPanel): void {
    if (this.panel === panel) {
      this.panel = null;
    }
  }

  /**
   * Serialise the panel's line items. False means the panel refused (it has already
   * said why) and the payment stops; no panel means nothing to export, not a refusal.
   */
  saveLineItems(): Observable<boolean> {
    return this.panel ? this.panel.save() : of(true);
  }

  // -------------------------------------------------------------------------
  // Capabilities
  // -------------------------------------------------------------------------

  async loadOptions(): Promise<void> {
    if (this.asked) {
      return;
    }
    this.asked = true;

    const [qbo, qbd, netsuite, freshbooks] = await Promise.allSettled([
      firstValueFrom(this.checkService.isPushBackEnable()),
      firstValueFrom(this.checkService.isQBDPushBackEnable()),
      firstValueFrom(this.checkService.isNetSuitePushBackEnable()),
      firstValueFrom(this.integrationService.getDetails('freshbooks'))
    ]);

    const next: IPaymentExportsOptions = { ...NO_PLATFORMS };

    if (qbo.status === 'fulfilled') {
      const d = qbo.value?.data;
      next.isQBOPushBack = !!(d?.isPushBackEnabled && d?.isQucikBookConnected);
      next.isQBOPushBackPermitted = d?.isPushBackEnabledInSua === 1;
    }
    if (qbd.status === 'fulfilled') {
      const d = qbd.value?.data;
      next.isQBDPushBack = !!(
        d?.isPushBackEnabled && d?.isQucikBookDesktopConnected
      );
      next.isQBDPushBackPermitted = d?.isPushBackEnabledInSua === 1;
    }
    if (netsuite.status === 'fulfilled') {
      const d = netsuite.value?.data;
      next.isNetsuitePushBack = !!(d?.isPushBackEnabled && d?.isNetsuiteConnected);
      next.isNetSuitePushBackPermitted = !!d?.isPushBackEnabledInSua;
    }
    if (freshbooks.status === 'fulfilled') {
      const d = freshbooks.value?.data as
        | {
            connected?: number;
            module?: { freshbooksExport?: number; freshbooksPushBackEnable?: number };
          }
        | undefined;
      next.isFreshBooksPushBack = !!(
        d?.module?.freshbooksExport === 1 &&
        d?.connected === 1 &&
        d?.module?.freshbooksPushBackEnable === 1
      );
      next.isFreshBooksPushBackPermitted = d?.module?.freshbooksPushBackEnable === 0;
    }

    this.options.set(next);
  }

  // -------------------------------------------------------------------------
  // Guards
  // -------------------------------------------------------------------------

  /**
   * The alert to raise when export is on but the platform will not take a check
   * without a category. Null means nothing is in the way (bank-ac-check L1182-1189).
   */
  blockingIssue(categoryId: string | undefined): string | null {
    const { isNetsuitePushBack } = this.options();

    if (this.isWiygulEnterprise() && isNetsuitePushBack && !categoryId) {
      return 'Category field is required';
    }

    return null;
  }

  // -------------------------------------------------------------------------
  // Payloads
  // -------------------------------------------------------------------------

  /**
   * The NetSuite keys a zil-payment carries. Bank ACH is the only non-check rail
   * that exports at all, and NetSuite is the only platform it exports to.
   */
  netsuitePaymentKeys(): Pick<
    IUpdatePaymentBody,
    'attachNetsuiteExpenseToCheck' | 'netsuiteExpenseDetails' | 'netsuiteBankId'
  > {
    // Gated on presence of saved data, never on `enabled()`: a successful save emits
    // `isEnableExportOption.emit(false)`, which would strip it (bank-ac-ach-v3 L1137-1142).
    const data = this.netsuite;

    return {
      attachNetsuiteExpenseToCheck: data ? '1' : '0',
      netsuiteExpenseDetails: data ? data.formValue : '',
      netsuiteBankId: data?.netSuiteBankId ?? ''
    };
  }

  /**
   * Every export key a check body carries. The odd key names and empty-value shapes
   * are the API's, not ours (bank-ac-check L1091-1130).
   */
  checkKeys(): Record<string, unknown> {
    // Presence of saved data, not the checkbox — see `netsuitePaymentKeys`.
    const { qbo, qbd, netsuite, freshbooks } = this;

    return {
      attachCategoryToCheck: qbo ? '1' : '0',
      attachExpenseToCheck: qbd ? '1' : '0',
      attachNetsuiteExpenseToCheck: netsuite ? '1' : '0',
      categoryDetails: qbo ? qbo.formValue : [],
      expenseDetails: qbd ? qbd.formValue : '',
      netsuiteExpenseDetails: netsuite ? netsuite.formValue : '',
      realmId: qbo ? qbo.realmId : '',
      locationId: qbo ? qbo.locationId : '',
      mappingId: qbo ? qbo.qbBankId : '',
      qbBankId: qbd?.qbdBankId ?? '',
      companyId: qbd?.companyId ?? '',
      netsuiteBankId: netsuite?.netSuiteBankId ?? '',
      freshbookCompanyId: freshbooks?.companyId ?? '',
      attachFreshbooksExpenseToCheck:
        freshbooks?.attachFreshbooksExpenseToCheck ?? '',
      freshbookExpenseDetails: [
        {
          categoryId: freshbooks?.categoryId ?? '',
          description: freshbooks?.description ?? '',
          amount: freshbooks?.amount ?? ''
        }
      ],
      isMapping: 0,
      quickbook: 0
    };
  }

  reset(): void {
    this.qbo = undefined;
    this.qbd = undefined;
    this.netsuite = undefined;
    this.freshbooks = undefined;
    this.enabled.set(false);
  }
}

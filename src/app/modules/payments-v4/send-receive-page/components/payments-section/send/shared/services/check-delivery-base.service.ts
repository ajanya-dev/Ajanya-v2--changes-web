import { DestroyRef, inject } from '@angular/core';
import { HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import type { IShippingCostCalculation } from 'src/app/modules/check/model/check';
import { BillService } from 'src/app/shared/service/Bill/bill.service';
import { CheckService } from 'src/app/shared/service/check/check.service';

import { SendSourceRegistryService } from './send-source-registry.service';
import { SendStateService } from './send-state.service';

/** One mailing address, in the shape the consolidated endpoints want it. */
export interface IMailAddress {
  name?: string;
  company_name?: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  zip: string;
  country?: string;
  email?: string;
  phone?: string;
}

/** Which stored record an address blocker is about. A typed address has none. */
export type BlockerEntity =
  | 'payee'
  | 'bank_account'
  | 'custom_address'
  | 'custom_from_address';

export interface ICheckBlocker {
  code: string;
  resolvable: boolean;
  /** `error` blocks submission, `warning` renders inline. Validate only. */
  severity?: 'error' | 'warning';
  /** Dot-path into the envelope, e.g. `payment.serial_no`. Null = page-level. */
  field?: string | null;
  data?: {
    message?: string;
    /** The legacy numeric code, when there was one. */
    error_code?: number;
    serial_nos?: string[];
    /** Address blockers name the record at fault, so we can open it. */
    entity?: BlockerEntity;
    entity_id?: string;
    fields?: string[];
    /** `cost_requote` names the acknowledgement key and both figures. */
    acknowledgement?: string;
    new_total?: number;
    previous_total?: number;
    /** `insufficient_balance` says how short the account is. */
    balance?: number;
    required?: number;
    shortfall?: number;
    /**
     * `bank_account_unverified` names the accounts at fault, so micro-deposit
     * verification opens in place instead of routing to the accounts page.
     */
    bank_account_ids?: string[];
  };
}

/** `POST /payments/validate` — partial payload, always 200, writes nothing. */
export interface ICheckValidation {
  success: boolean;
  data?: { valid?: boolean; blockers?: ICheckBlocker[] };
}

/** Every delivery endpoint prices the same four lines. */
export interface ICheckCost {
  shipping: number;
  paper: number;
  sms: number;
  attachments: number;
  /**
   * Direct deposit only, and its own line since 2026-08-27: this is an ACH
   * transaction fee, not postage. Label it per method — never as `paper`.
   */
  ach?: number;
  total: number;
}

export interface ICheckDeliveryResponse {
  success: boolean;
  blockers?: ICheckBlocker[];
  /**
   * Present on every failure — rev 3 keeps the originating legacy code so the v4
   * interceptor does not swallow the response. `0` when there was no legacy one.
   */
  errorCode?: number | string;
  errorMsg?: string;
  data?: {
    check_id?: string;
    serial_no?: string;
    status?: string;
    cost?: ICheckCost;
  };
}

/** What `preview-shipping-cost` calls each delivery when asked to price one. */
export const QUOTE_TYPE = { mail: 1, email: 2, deposit: 3 } as const;

/**
 * `preview-shipping-cost` -> the panel's lines.
 *
 * It names the two it can — the attachment pages and the check paper — and
 * leaves the rest inside `total`. `group_shipping_fee` looks like the delivery's
 * own share and is not: it carries a figure only for a custom-address mailing
 * and reads `0.00` otherwise, where the whole cost sits in `total` instead. So
 * the delivery's share is the remainder, which keeps the lines adding up to
 * what is charged rather than leaving a silent difference.
 */
export function toDeliveryCost(
  data: IShippingCostCalculation | undefined | null
): ICheckCost | null {
  if (!data) {
    return null;
  }
  const total = Number(data.total) || 0;
  const attachments = Number(data.attachment_fee) || 0;
  const paper = Number(data.page_cost) || 0;

  return {
    shipping: Math.max(total - attachments - paper, 0),
    paper,
    // The quote is asked with the text switched on or off, so its total already
    // accounts for it — a line of our own here would count it twice.
    sms: 0,
    attachments,
    total
  };
}

/**
 * What every consolidated delivery endpoint shares: the `payment` block, the
 * schedule, the headers and the idempotency key. Only the delivery block and
 * what it validates differ, so those are left to the subclass.
 */
export abstract class CheckDeliveryBaseService {
  protected readonly checks = inject(CheckService);
  protected readonly state = inject(SendStateService);
  protected readonly registry = inject(SendSourceRegistryService);
  protected readonly bills = inject(BillService);
  protected readonly destroyRef = inject(DestroyRef);

  /**
   * One key per payment, kept across every retry so an acknowledge-and-resend is
   * not mistaken for a double-submit. A new payment mints a new one.
   */
  private idempotencyKey = CheckDeliveryBaseService.newKey();

  protected resetIdempotencyKey(): void {
    this.idempotencyKey = CheckDeliveryBaseService.newKey();
  }

  /**
   * What this delivery costs, from the one endpoint that prices all three. An
   * emailed cheque and a direct deposit used to have no way to ask — the calls
   * that knew were keyed by a cheque that does not exist yet — so one guessed
   * and the other said nothing.
   */
  protected quoteDelivery(
    type: number,
    smsOn: boolean
  ): Observable<ICheckCost | null> {
    const amount = Number(this.state.coreForm.controls.amount.value) || 0;
    if (amount <= 0) {
      return of(null);
    }

    return this.checks
      .previewShippingCost({
        type,
        amount,
        sms_checkbox: smsOn ? 1 : 0
      })
      .pipe(
        catchError(() => of(null)),
        map((res) => toDeliveryCost(res?.data))
      );
  }

  // ── Headers ──

  /**
   * The blockers are ours to render, so the generic 422 alert stays out of it.
   * The interceptor's *global* codes (202 recharge, 217 subscription, …) are
   * still handled — on a send that prompt is exactly right.
   */
  protected quietHeaders(): HttpHeaders {
    return new HttpHeaders().set('isDisable422', 'true');
  }

  /**
   * A quote alone also suppresses the interceptor's GLOBAL codes. A blocked
   * quote carries `errorCode: 202`, which opens the Recharge modal — and unlike
   * the generic warning that path has no de-duplication, so a short balance
   * would stack one modal per re-price while the user is only choosing a
   * carrier. That prompt belongs on Send, where this header is not set.
   *
   * Validate does not need it: it answers `200` by contract.
   */
  protected quoteHeaders(): HttpHeaders {
    return this.quietHeaders().set('isDisableGlobal422', 'true');
  }

  protected sendHeaders(): HttpHeaders {
    return this.quietHeaders().set('Idempotency-Key', this.idempotencyKey);
  }

  // ── Payload ──

  protected paymentBlock(): Record<string, unknown> {
    const core = this.state.coreForm.getRawValue();
    const d = this.details();
    const source = this.registry.active();
    const isCloned = this.state.mode() === 'CLONE';

    const processWithout = (
      [
        ['noAmount', 'amount'],
        ['noPayee', 'payee'],
        ['noSign', 'signature'],
        ['noDate', 'date']
      ] as const
    )
      .filter(([control]) => !!d[control])
      .map(([, value]) => value);

    const category = d.category as { id?: string } | null;

    return {
      bank_account_id: core.bankAc?.id ?? '',
      payee_id: core.payee?.id ?? '',
      amount: Number(core.amount) || 0,
      ...(d.checkNumber ? { serial_no: Number(d.checkNumber) } : {}),
      ...(d.issueDate ? { issue_date: d.issueDate } : {}),
      extras: {
        memo: d.memo ?? '',
        // Never printed — a separate field from `memo`, which is.
        note: '',
        invoice_no: d.invoiceNumber ?? '',
        account_no: d.payeeIdNumber ?? '',
        ...(category?.id ? { category_id: category.id } : {}),
        custom_fields: this.customFields(),
        attachments: this.attachmentIds(),
        // These four have to travel with the create call: the endpoint is atomic,
        // so there is no intermediate check id to attach them to afterwards.
        bills: this.bills.billId() ?? [],
        comment_ids: source.commentIds ?? [],
        // "Insert to Check" is the user's choice, not the mere presence of rows.
        ...(source.insertFromRemittance && source.remittanceItems?.length
          ? {
              remittance: source.remittanceItems,
              remittance_type: source.remittanceType
            }
          : {}),
        // A clone reuses the source check's number by definition, so this waives
        // the duplicate-number prompt outright — matching v3's `warning: 1`.
        is_cloned: isCloned,
        process_without: processWithout
      }
    };
  }

  /** The payment's attachments, as the rest of the app bills them. */
  protected abstract attachmentIds(): string[];

  /** `when` and its date, read off whichever schedule the details form holds. */
  protected scheduling(): Record<string, unknown> {
    const d = this.details();

    if (d.needRecurring) {
      return {
        when: 'recurring',
        recurring: {
          frequency: Number(d.recurringFrequency) || 3,
          ...(d.recurringStartDate ? { start_date: d.recurringStartDate } : {}),
          // The modal offers two endings: '1' a set number of payments, '3' until
          // the user cancels. `never` is accepted on mail and email since 2026-08-26.
          end:
            d.recurringEndSelect === '1' && d.recurringCount
              ? { type: 'count', count: Number(d.recurringCount) }
              : { type: 'never' }
        }
      };
    }
    if (d.scheduleDate) {
      return { when: 'schedule', schedule_date: d.scheduleDate };
    }
    return { when: 'now' };
  }

  protected details(): Record<string, unknown> {
    return this.registry.active().detailsForm.getRawValue() as Record<
      string,
      unknown
    >;
  }

  /** The bank check's own check-design fields. No other rail defines any. */
  private customFields(): { [key: string]: string }[] {
    const source = this.registry.active() as unknown as {
      customElements?: { [key: string]: string }[];
    };
    return (source.customElements ?? []).filter((field) =>
      Object.values(field).some((value) => !!value)
    );
  }

  private static newKey(): string {
    return typeof crypto?.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}

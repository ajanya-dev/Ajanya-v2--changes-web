import type { IPaymentMethodSummary } from 'src/app/modules/payments/model/payments';

/**
 * The pay-as dropdown offers one `check` option; these tiles decide the method the
 * payment actually submits as.
 */
export type CheckDeliveryId =
  | 'mail'
  | 'email'
  | 'printCheck'
  | 'printWhiteCheck'
  | 'ach';

export interface ICheckDeliveryOption {
  id: CheckDeliveryId;
  name: string;
  /** the delivery-time line under the name */
  timing: string;
  /** lucide icon key — maps into CHECK_DELIVERY_ICONS */
  icon: 'mail' | 'send' | 'printer' | 'file-text' | 'building';
}

export const CHECK_DELIVERY_OPTIONS: ICheckDeliveryOption[] = [
  {
    id: 'mail',
    name: 'Mail',
    timing: 'Depending on shipping type',
    icon: 'mail'
  },
  { id: 'email', name: 'Email', timing: 'Instant', icon: 'send' },
  {
    id: 'printCheck',
    name: 'Print check paper',
    timing: 'Instant',
    icon: 'printer'
  },
  {
    id: 'printWhiteCheck',
    name: 'Print white paper',
    timing: 'Instant',
    icon: 'file-text'
  },
  // Writes the same check record as the other tiles, then deposits it.
  {
    id: 'ach',
    name: 'Direct deposit',
    timing: '4-6 business days',
    icon: 'building'
  }
];

/** The method a delivery choice submits as. Both print papers are `check_print`. */
export function deliveryToMethodId(delivery: CheckDeliveryId): string {
  switch (delivery) {
    case 'mail':
      return 'check_mail';
    case 'email':
      return 'check_email';
    case 'ach':
      return 'ach';
    default:
      return 'check_print';
  }
}

/**
 * Names a cheque reopened on the deposit tile. Bare `ach` cannot: it is also the
 * standalone ACH rail's own pay-as id, and that match wins first — reopening a
 * deposited cheque on the ACH rail, which loses the cheque. This resolves to the
 * tile, which then sets the real `ach` method id.
 */
export const CHECK_ACH_METHOD_ID = 'check_ach';

/**
 * Names a cheque reopened on the white-paper tile. `check_print` is what both
 * print tiles submit as, so on its own it can only reopen on check paper.
 */
export const CHECK_WHITE_PRINT_METHOD_ID = 'check_print_white';

/** `printMultiCheck.paperType` for plain white paper; every other code is check stock. */
export const WHITE_PAPER_TYPE = 6;

/**
 * The method id a check reopens on, from how `GET /zil-payments/{uuid}` says it
 * went out: `paymentMethod.method` names the delivery, and for a print
 * `paymentMethod.type` is the paper. Null when the payment does not say.
 */
export function paymentMethodToMethodId(
  summary: IPaymentMethodSummary | null | undefined
): string | null {
  const method = (summary?.method ?? '').toLowerCase().replace(/[^a-z]/g, '');
  if (!method) {
    return null;
  }
  if (method.includes('print')) {
    return Number(summary?.type) === WHITE_PAPER_TYPE
      ? CHECK_WHITE_PRINT_METHOD_ID
      : 'check_print';
  }
  if (method.includes('email') || method.includes('echeck')) {
    return 'check_email';
  }
  if (method.includes('mail')) {
    return 'check_mail';
  }
  if (method.includes('ach') || method.includes('deposit')) {
    return CHECK_ACH_METHOD_ID;
  }
  return null;
}

/**
 * The reverse, for EDIT / CLONE: `check_print` does not say which paper, so it resolves to
 * check paper.
 */
export function methodIdToDelivery(methodId: string): CheckDeliveryId | null {
  switch (methodId) {
    case 'check_mail':
      return 'mail';
    case 'check_email':
      return 'email';
    case 'check_print':
      return 'printCheck';
    case CHECK_WHITE_PRINT_METHOD_ID:
      return 'printWhiteCheck';
    case CHECK_ACH_METHOD_ID:
      return 'ach';
    default:
      return null;
  }
}

/**
 * An address the carrier will not deliver to. Raised by the mailing endpoints
 * rather than by `validate/mailing`, because deliverability is only settled
 * once the carrier is asked. It names no end — the reasons are all the caller
 * gets, packed into one string with `||` between them.
 */
export const ADDRESS_DELIVERY_CODE = 'ADDRESS_DELIVERY_ERROR';

/**
 * A mailing address the carrier refused, and the body that was refused. The
 * address book issues the ids a custom mailing is named by, so an end the user
 * left on its default is written to the book for them — quietly, since they did
 * not ask for an address book entry, they asked to post a cheque. When that
 * write is the thing that fails, the row does not exist to be opened: the only
 * copy of what was rejected is what was sent.
 */
export interface IAddressDeliveryFailure {
  reason: string;
  book: 'to' | 'from';
  /** As `add-mail-address` takes it, which is also how the editor reads it. */
  address: Record<string, unknown>;
}

/** The reasons a mailing was refused as undeliverable, or '' for any other failure. */
export function addressDeliveryReason(err: unknown): string {
  const body = (
    err as { error?: { errorCode?: number | string; errorMsg?: string } }
  )?.error;

  if (String(body?.errorCode ?? '') !== ADDRESS_DELIVERY_CODE) {
    return '';
  }

  return (
    (body?.errorMsg ?? '')
      .split('||')
      .map((reason) => reason.trim())
      .filter(Boolean)
      .join(' · ') || 'Mail is not deliverable to the selected address.'
  );
}

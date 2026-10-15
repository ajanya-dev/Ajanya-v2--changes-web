import { IZilPyamentLists } from 'src/app/modules/v3-bulk-payment/model/v3-bulk-payment';

/**
 * @description Checks whether a get-list row is a wallet check sent by email. The API may
 * report the delivery as a plain string, a `{ method }` summary, under `metadata`,
 * or only through echeck details on the transfer.
 * @param payment - Zil payment data.
 * @returns True when the payment is a wallet check email.
 */
export function isWalletCheckEmail(payment: IZilPyamentLists): boolean {
  if (payment?.transferType !== 'CHECK' || payment?.sourceType !== 'WALLET') {
    return false;
  }
  const reported = payment?.paymentMethod;
  const candidates = [
    typeof reported === 'string' ? reported : reported?.method,
    payment?.metadata?.paymentMethod
  ];
  const hasEmailMethod = candidates.some((value) => {
    const method = (value ?? '').toLowerCase().replace(/[^a-z]/g, '');
    return method.includes('email') || method.includes('echeck');
  });
  const transfer = payment?.transfer as { echeck_details?: unknown } | undefined;
  return hasEmailMethod || !!transfer?.echeck_details;
}

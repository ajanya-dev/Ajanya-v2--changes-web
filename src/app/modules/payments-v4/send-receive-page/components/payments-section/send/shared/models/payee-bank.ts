import type {
  IPayeeBankDetails,
  IPayeeViewBank
} from 'src/app/modules/payee/payee-v2/model/payee';
import type { SendStateService } from '../services/send-state.service';

/**
 * The payee-bank list, as the bank, card and wallet detail forms all drive it.
 * The list emits camelCase `IPayeeBankDetails`; these flows speak `IPayeeViewBank`.
 */

/** `getPayeeBankData`'s bank -> the `getPayeeDetails` bank this flow speaks. */
export function toViewBank(bank: IPayeeBankDetails): IPayeeViewBank {
  return {
    id: bank.id,
    encrypted_id: bank.id,
    // Carried, not substituted: `id` stays the one every rail already sends,
    // and only the direct-deposit send reads this one.
    decrypted_id: bank.decryptedId,
    bank_name: bank.bankName,
    routing_number: String(bank.routingNumber ?? ''),
    account_number: String(bank.accountNumber ?? ''),
    account_type: bank.accountType,
    is_default_for_direct_deposit: bank.defaultDDAccount,
    verified: bank.verified
  };
}

/**
 * Prefer the matching `getPayeeDetails` bank: it is the only one carrying
 * `is_allow_wire`, which the wire guard reads. `toViewBank` is the fallback.
 */
export function selectPayeeBank(
  state: SendStateService,
  bank: IPayeeBankDetails | null
): void {
  if (!bank) {
    state.selectedPayeeBank.set(null);
    return;
  }

  const known = state
    .payeeBanks()
    .find((b) => String(b.encrypted_id ?? b.id) === String(bank.id));

  // The list's plain id rides along whichever record wins — `getPayeeDetails`
  // does not carry one, and the direct-deposit send is the only reader.
  state.selectedPayeeBank.set(
    known
      ? { ...known, decrypted_id: bank.decryptedId ?? known.decrypted_id }
      : toViewBank(bank)
  );
}

/**
 * Trust the bank list's on-demand wire check over `getPayeeDetails`' snapshot,
 * which predates any wire details just added through the list.
 */
export function setWireAllowed(state: SendStateService, allowed: boolean): void {
  const current = state.selectedPayeeBank();
  if (!current) {
    return;
  }

  const flag = allowed ? 1 : 0;
  if (current.is_allow_wire === flag) {
    return;
  }

  state.selectedPayeeBank.set({ ...current, is_allow_wire: flag });
}

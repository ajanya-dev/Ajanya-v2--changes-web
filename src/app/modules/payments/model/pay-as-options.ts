import { IPayAsItem, IPayFromItem } from 'src/app/modules/payments/model/payments';

export const LET_VENDOR_DECIDE_ID = 'letVendorDecide';

/** Pay From sources that support "Let vendor decide". */
export const LET_VENDOR_DECIDE_SOURCES: ReadonlyArray<string> = ['wallet'];

/**
 * "Let vendor decide" leaves the rail unselected so the payee picks how they
 * want to receive the money. The label is intentionally sentence case and must
 * be rendered verbatim.
 */
export const LET_VENDOR_DECIDE_OPTION: IPayAsItem = {
  label: 'Let vendor decide',
  id: LET_VENDOR_DECIDE_ID,
  fontawsomeIconClass: 'fa-solid fa-user-tie'
};

export function isLetVendorDecideSource(
  source: IPayFromItem | null | undefined
): boolean {
  return !!source && LET_VENDOR_DECIDE_SOURCES.includes(source.id);
}

/**
 * Prepends "Let vendor decide" to the Pay As list of every Pay From source
 * that supports it (currently Wallet only). Other sources are left untouched.
 * Use {@link getDefaultPayAsOption} to resolve the auto-selected default.
 */
export function withLetVendorDecide(
  payFromItems: IPayFromItem[]
): IPayFromItem[] {
  return payFromItems.map((item) =>
    isLetVendorDecideSource(item)
      ? {
          ...item,
          payOptions: [
            { ...LET_VENDOR_DECIDE_OPTION },
            ...(item.payOptions ?? []).filter(
              (opt) => opt.id !== LET_VENDOR_DECIDE_ID
            )
          ]
        }
      : item
  );
}

/**
 * The option that should be auto-selected for a Pay From source. Sources that
 * support "Let vendor decide" (currently Wallet) default to it so the payee
 * picks the rail; every other source defaults to its first regular rail.
 */
export function getDefaultPayAsOption(
  source: IPayFromItem | null | undefined
): IPayAsItem | null {
  const options = source?.payOptions ?? [];
  if (isLetVendorDecideSource(source)) {
    return (
      options.find((opt) => opt.id === LET_VENDOR_DECIDE_ID) ??
      options[0] ??
      null
    );
  }
  return (
    options.find((opt) => opt.id !== LET_VENDOR_DECIDE_ID) ?? options[0] ?? null
  );
}

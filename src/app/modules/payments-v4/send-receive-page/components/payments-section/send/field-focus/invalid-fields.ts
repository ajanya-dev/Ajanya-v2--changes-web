import { AbstractControl, FormGroup } from '@angular/forms';

/**
 * Every invalid control across the core form and the active rail's details
 * form. Core keys come back in the order given (how the user reads the page);
 * details keys follow in their form order. The page then picks the one that is
 * highest on screen, so the first thing shaken is the first thing the user sees.
 */
export function invalidControlKeys(
  core: Record<string, AbstractControl | undefined>,
  coreOrder: readonly string[],
  details?: FormGroup | null
): string[] {
  const coreKeys = coreOrder.filter((key) => core[key]?.invalid);
  const detailKeys = details
    ? Object.entries(details.controls)
        .filter(([, control]) => control?.invalid)
        .map(([key]) => key)
    : [];
  return [...coreKeys, ...detailKeys];
}

/**
 * Of several resolved fields, the one that comes first in the document, so a
 * blocked submit lands on the top-most problem rather than the first-declared
 * control. Ties (two keys on one element) keep the earlier entry.
 */
export function firstInDocumentOrder<T extends { el: HTMLElement }>(
  items: readonly T[]
): T | undefined {
  return items.reduce<T | undefined>((best, item) => {
    if (!best) {
      return item;
    }
    const position = best.el.compareDocumentPosition(item.el);
    // eslint-disable-next-line no-bitwise
    return position & Node.DOCUMENT_POSITION_PRECEDING ? item : best;
  }, undefined);
}

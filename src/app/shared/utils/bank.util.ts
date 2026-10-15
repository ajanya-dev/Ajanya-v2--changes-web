/**
 * Resolves the `transitNumber` sent to the API when saving a bank account.
 *
 * - Non-Canadian accounts send nothing; their identifier travels in `bankRoutingNumber`.
 * - Canadian accounts showing the split fields send the joined `NNNNN-NNN` composite.
 * - Legacy Canadian accounts (no split fields) send the composite already held in the
 *   routing number control.
 *
 * @param params - The country/field state and the relevant raw form values.
 * @returns The transit number for the payload.
 */
export function resolveTransitNumber(params: {
  isCanadianBank: boolean;
  hasSplitFields: boolean;
  routingNumber: string;
  transitNumber: string;
  financialInstituteNumber: string;
}): string {
  const {
    isCanadianBank,
    hasSplitFields,
    routingNumber,
    transitNumber,
    financialInstituteNumber
  } = params;

  if (!isCanadianBank) {
    return '';
  }

  if (!hasSplitFields) {
    return routingNumber;
  }

  return `${transitNumber}-${financialInstituteNumber}`;
}

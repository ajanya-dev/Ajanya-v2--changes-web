import type { IShippingTypes } from 'src/app/modules/business-tools/plexe/model/plexe';

const FEDEX_LOGO_URL = '/assets/images/fedex.svg';
const USPS_LOGO_URL = '/assets/images/usps-logo.png';

/** A shipping type enriched for the dropdown's display fields. */
export type IShippingOption = IShippingTypes & {
  costDisplay: string;
  logoUrl: string;
};

/** Enrich the carriers with the cost and logo the dropdown renders. */
export function toShippingOptions(types: IShippingTypes[]): IShippingOption[] {
  return types.map((type) => {
    const cost = parseFloat(type.cost).toFixed(2);

    return {
      ...type,
      cost,
      costDisplay: `$${cost}`,
      logoUrl: type.carrier === 'FEDEX' ? FEDEX_LOGO_URL : USPS_LOGO_URL
    };
  });
}

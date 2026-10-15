export interface IGoogleAddress {
  address?: string;
  city: string;
  state: string;
  zip: string;
  country: string;

  /** @description
   * The input element the selection came from. The service emits every
   * `place_changed` on a single shared subject, so a view holding more than one
   * autocomplete receives its sibling's selections too. Compare this against the
   * own input element to ignore the ones that belong to another field.
   */
  sourceElement?: HTMLInputElement;
}

/** Provides parameters to pass to the googleAutocomplete function */
export interface IGoogleAddressParams {
  /**@description
   * The parameter we use to pass the template variable to the function.
   *
   *
   * Example:
   * ```
   * <input #searchElement (focus)="loadGoogleAddress(searchElement)">
   * ```
   *
   * Here searchElement is the template variable
   *
   * @param addressElement - This is a template variable of the type HTMLInputElement
   *
   */
  addressElement: HTMLInputElement;

  /**@description
   * These are the countries that are filtered through Google Autocomplete so that results come from only the countries that we specify.
   *
   *
   * Example:
   * ```
   * this._googleAddressService.googleAutocomplete({ addressElement: address, allowedCountries: ["us", "ca"] });
   * ```
   *
   * ["us", "ca"] is the allowedCountries parameter in this case
   *
   * @param allowedCountries
   *
   */
  allowedCountries?: string | string[];

  /**@description
   * If displayShortName is true then it means we are using a select box for displaying countries we have to pass the short name to the select field to bind correctly.
   *
   *
   * Example:
   * ```
   * this._googleAddressService.googleAutocomplete({ addressElement: address, allowedCountries: this.countries, displayShortName: true, addressInstance: addressInstance });
   * ```
   *
   *
   * @param displayShortName
   *
   */
  displayShortName?: boolean;

  /**@description
   * This is the number we pass in the function argument to show that we are using multiple google autocomplete fields in the same component
   *
   *
   * Example:
   * ```
   * <input #searchElement (focus)="loadGoogleAddress(searchElement, 2)">
   * ```
   *
   *
   * @param addressInstance
   *
   */
  addressInstance?: number;

  /** @description
   * Minimum width (in pixels) to force on the Google Places suggestions dropdown (`.pac-container`).
   *
   * Use this when the address input is rendered in a narrow container (e.g. a table cell)
   * and the default dropdown width — which Google sizes to match the input — would truncate
   * the suggestion text. When omitted, Google's default sizing is preserved.
   *
   * Example:
   * ```
   * this._googleAddressService.googleAutocomplete({
   *   addressElement: address,
   *   allowedCountries: ['us', 'ca'],
   *   addressInstance: i,
   *   dropdownMinWidth: 400
   * });
   * ```
   *
   * @param dropdownMinWidth
   */
  dropdownMinWidth?: number;
}

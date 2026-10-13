import { IconProp } from '@fortawesome/fontawesome-svg-core';

/**
 * Configuration options for the V4CommonDropDownSelector component.
 *
 * @interface Iv4ngSelectConfig
 */
export interface Iv4ngSelectConfig {
  /**
   * The placeholder text for the select input.
   *
   * @type {string}
   * @memberof Iv4ngSelectConfig
   */
  placeholder?: string;

  /**
   * The field used for displaying the main text in the dropdown options.
   *
   * @type {string}
   * @memberof Iv4ngSelectConfig
   */
  displayField?: string;

  /**
   * The field used for displaying a subtext in the dropdown options.
   *
   * @type {string}
   * @memberof Iv4ngSelectConfig
   */
  displaySubField?: string;

  /**
   * Where to render the subtext relative to the main text in each option row.
   * - `'right'` (default): right-aligned on the same line as the main text.
   * - `'below'`: stacked beneath the main text in a muted style.
   *
   * @type {'right' | 'below'}
   * @memberof Iv4ngSelectConfig
   */
  subTextPosition?: 'right' | 'below';

  /**
   * The field used for specifying the field name which contains icons in the `listData` for the dropdown options. This field can contain either:
   * - A 2-letter string representing an icon (e.g., 'EA' for "Eliot Anderson").
   * - HTML code designed using Tailwind CSS classes to display a custom icon.
   * - fontawesome icon names as type 'IconProp'.
   *   @example
   * ```html
   *    <!-- as HTML -->
   *   <span class="rounded-full bg-tertiary-background-color w-8 h-8 flex justify-center items-center text-common-yellow-color">=
   *      <img src="/image.svg" ></img>
   *   </span>
   * ```
   *
   *   @example
   *   ```js
   *    ['fas','credit-card'] //as array of value to set font-awesome
   *    ```
   *
   *   @example
   *   ```text
   *    value as text can be : "EA" for Eliot Anderson
   *    ```
   *
   * @type {string}
   * @memberof Iv4ngSelectConfig
   */
  iconField?: string;

  /**
   * The field used for the icon color value in each row.
   *
   * @type {string}
   * @memberof Iv4ngSelectConfig
   */
  iconColorField?: {
    /**
     *    @description Icon background color css variable name (without double hyphen (--) at starting ).
     *    @memberof Iv4ngSelectConfig
     */
    background?: string;
    /**
     *    @description Icon text/fa-icon color css variable name (without double hyphen (--) at starting ).
     *    @memberof Iv4ngSelectConfig
     */
    text?: string;
  };

  /**
   * The field used for the output value when an option is selected.
   *
   * @type {string}
   * @memberof Iv4ngSelectConfig
   */
  outputField?: string;

  /**
   * Determines whether the "Add New" option is enabled. When enabled, a button will be displayed, and when clicked, it will trigger the "addnew" event.
   *
   * @type {boolean}
   * @memberof Iv4ngSelectConfig
   */
  enableAddNew?: boolean;

  /**
   * Custom label for the "Add New" button.
   *
   * @type {string}
   * @memberof Iv4ngSelectConfig
   */
  addNewLabel?: string;
  addNewSubLabel?: string;

  /**
   * Common configuration options for Iv4ngSelect that apply to all rows by default.
   * These options will not be overridden for specific rows config.
   * @type {boolean}
   * @memberof Iv4ngSelectConfig
   */
  commons?: {
    /**
     *  The icon data, which can be one of the following:
     * - A 2-letter string representing an icon (e.g., 'EA' for "Eliot Anderson").
     * - HTML code designed using Tailwind CSS classes to display a custom icon.
     * - fontawesome icon names as type 'IconProp'.
     *   @example
     * ```html
     *    <!-- as HTML -->
     *   <span class="rounded-full bg-tertiary-background-color w-8 h-8 flex justify-center items-center text-common-yellow-color">=
     *      <img src="/image.svg" ></img>
     *   </span>
     * ```
     *
     *   @example
     *   ```js
     *    ['fas','credit-card'] //as array of value to set font-awesome
     *    ```
     *
     *   @example
     *   ```text
     *    value as text can be : "EA" for Eliot Anderson
     *    ```
     */
    iconData?: string | IconProp;

    /**
     *    @description Icon color options.
     *    @memberof Iv4ngSelectConfig
     */
    iconColor?: {
      /**
       *    @description Icon background color css variable name (without double hyphen (--) at starting ).
       *    @memberof Iv4ngSelectConfig
       */
      background?: V4Colors;
      /**
       *    @description Icon text/fa-icon color css variable name (without double hyphen (--) at starting ).
       *    @memberof Iv4ngSelectConfig
       */
      text?: V4Colors;
    };
  };

  /**
   *    @description Custom styles to replace the default style of the input.
   *    @memberof Iv4ngSelectConfig
   */
  style?: {
    /**
     *    @description height tier of the control (CSS class height-<size>).
     *    Global v4 tiers (_overrides-v4.scss): 0 = 44px (default), 1 = 40px, 2 = 44px.
     *    The legacy mixin tiers (drop-down-v4.scss) still define 1 = 32px, 2 = 38px,
     *    3 = 48px, 4 = 54px; prefer 0 or 1 in v4 screens.
     */
    size?: 0 | 1 | 2 | 3 | 4;

    /**
     *  @description Enabling this option by setting its value to 'true' will add an icon to the left side of the input along with a label.
     *  @type {boolean}
     */
    enableLabelIcon?: boolean;

    /**
     *  @description If you enable label icons above, you should provide this labelIconData.
     *  * @example
     * ```js
     * // Example usage of labelIconData:
     * const labelIconData = {
     *   icon_fa: ['fas', 'wallet'],
     *   color: 'common-green-color',
     * };
     *   ```
     */
    labelIconData?: {
      /**
       * @description - An array/IconProp of font-awesome icon names. For example, ['fas', 'wallet'].
       */
      icon_fa: IconProp;
      /**
       * @description - The color for the icon. Use a CSS variable name to define the color, e.g., 'common-green-color'.
       */
      color: string;
    };
  };

  /**
   * Configuration for custom label template display.
   * When provided, enables custom ng-label-tmp template for selected value display.
   *
   * @type {object}
   * @memberof Iv4ngSelectConfig
   */
  customLabelTemplate?: {
    /**
     * Enable custom label template functionality
     * @type {boolean}
     */
    enabled: boolean;

    /**
     * Primary field for label display (required)
     * @type {string}
     */
    primaryField: string;

    /**
     * Secondary field for label display (optional)
     * @type {string}
     */
    secondaryField?: string;

    /**
     * Separator between primary and secondary fields
     * @type {string}
     * @default ' '
     */
    separator?: string;

    /**
     * Apply styling to secondary field text
     * @type {string}
     * @default 'text-secondary-text-color'
     */
    secondaryFieldClass?: string;
  };

  /**
   * The field in `listData` that holds the hover text for a row.
   * When set, the resolved value is rendered as a native `title` tooltip on the
   * whole option row. Rows whose field is empty get no `title` attribute at all,
   * so this is fully opt-in and does not affect existing consumers.
   *
   * Useful for explaining why a row is `disabled`.
   *
   * @type {string}
   * @memberof Iv4ngSelectConfig
   */
  tooltipField?: string;

  extraStyles?: string;

  /**
   * When `true`, strips leading indentation whitespace (incl. non-breaking spaces)
   * from the SELECTED label only. Use with tree-indented option lists so the open
   * list keeps its indent while the selected input shows the clean name.
   *
   * @type {boolean}
   * @default false
   * @memberof Iv4ngSelectConfig
   */
  trimSelectedIndent?: boolean;
}

/**
 * A type representing either a object with string keys or a string value. this type can be assigned to [at]input value from parent component.
 *
 * @type {TListData}
 */

// reason-for-any: Using any as it cannot assign "unknown" and to the variable typed 'TListData' can assign any type of object or any string.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TListData = { [key: string]: any } | string;

/**
 * Represents an item in the structured list data for use in ng-select.
 * This interface is intended for use within the V4CommonDropDownSelectorComponent.
 *
 * @interface
 */
export interface ListDataItemStructured {
  /**
   * The value associated with the item, to be passed to a form control when selected by the user.
   *
   * @type {string}
   * @memberof ListDataItem
   */
  value: string;

  /**
   * Information about the item's icon.
   *
   * @memberof ListDataItem
   */
  icon: {
    /**
     * Determines whether to show or hide the icon.
     *
     * @type {boolean}
     * @memberof ListDataItem.icon
     */
    show: boolean;

    /**
     * The content of the icon (HTML/text/fa-icon).
     *
     * @type {string | Object}
     * @memberof ListDataItem.icon
     */
    data: string | IconProp;

    /**
     * The background color from OCW v4 color css variable.
     *
     * @type {V4Colors}
     * @memberof ListDataItem.icon
     */
    bgOCWv4Clr: V4Colors;

    /**
     * The text color from OCW v4 color css variable.
     *
     * @type {V4Colors}
     * @memberof ListDataItem.icon
     */
    textOCWv4Clr: V4Colors;

    /**
     * The type of icon that to show in dropdown list .
     *
     * @type {string}
     * @memberof ListDataItem.icon
     */
    type: 'html' | 'text' | 'fa-icon' | 'img-url';
  };

  /**
   * The main text to display for the item.
   *
   * @type {string}
   * @memberof ListDataItem
   */
  mainText: string;

  /**
   * Whether this option is disabled in the dropdown.
   *
   * @type {boolean}
   * @memberof ListDataItem
   */
  disabled?: boolean;

  /**
   * Hover text for the option row, resolved from `config.tooltipField`.
   * Empty when the consumer did not configure a tooltip.
   *
   * @type {string}
   * @memberof ListDataItem
   */
  tooltip?: string;

  /**
   * Additional subtext information.
   *
   * @memberof ListDataItem
   */
  subText: {
    /**
     * Determines whether to show or hide the subtext.
     *
     * @type {boolean}
     * @memberof ListDataItem.subText
     */
    show: boolean;

    /**
     * The content of the subtext.
     *
     * @type {string}
     * @memberof ListDataItem.subText
     */
    data: string;
  };
}

export type V4Colors =
  | 'main-background-color'
  | 'secondary-background-color'
  | 'tertiary-background-color'
  | 'input-border-color'
  | 'main-text-color'
  | 'secondary-text-color'
  | 'common-blue-color'
  | 'common-green-color'
  | 'common-violet-color'
  | 'common-yellow-color'
  | 'common-red-color'
  | 'common-secondary-blue-color'
  | 'common-secondary-green-color'
  | 'common-secondary-violet-color'
  | 'common-secondary-yellow-color'
  | 'common-secondary-red-color'
  | 'common-dark-blue-color'
  | 'common-sidebar-color';

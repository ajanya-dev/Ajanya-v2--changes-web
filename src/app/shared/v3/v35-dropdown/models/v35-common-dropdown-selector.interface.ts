import { IconProp } from '@fortawesome/fontawesome-svg-core';

/**
 * Configuration options for the V35CommonDropDownSelector component.
 *
 * @interface Iv35ngSelectConfig
 */
export interface Iv35ngSelectConfig {
  /**
   * The placeholder text for the select input.
   *
   * @type {string}
   * @memberof Iv35ngSelectConfig
   */
  placeholder?: string;

  /**
   * The field used for displaying the main text in the dropdown options.
   *
   * @type {string}
   * @memberof Iv35ngSelectConfig
   */
  displayField?: string;

  /**
   * The field used for displaying a subtext in the dropdown options.
   *
   * @type {string}
   * @memberof Iv35ngSelectConfig
   */
  displaySubField?: string;

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
   * @memberof Iv35ngSelectConfig
   */
  iconField?: string;

  /**
   * The field used for the icon color value in each row.
   *
   * @type {string}
   * @memberof Iv35ngSelectConfig
   */
  iconColorField?: {
    /**
     *    @description Icon background color css variable name (without double hyphen (--) at starting ).
     *    @memberof Iv35ngSelectConfig
     */
    background?: string;
    /**
     *    @description Icon text/fa-icon color css variable name (without double hyphen (--) at starting ).
     *    @memberof Iv35ngSelectConfig
     */
    text?: string;
  };

  /**
   * The field used for the output value when an option is selected.
   *
   * @type {string}
   * @memberof Iv35ngSelectConfig
   */
  outputField?: string;

  /**
   * Determines whether the "Add New" option is enabled. When enabled, a button will be displayed, and when clicked, it will trigger the "addnew" event.
   *
   * @type {boolean}
   * @memberof Iv35ngSelectConfig
   */
  enableAddNew?: boolean;

  /**
   * Common configuration options for Iv35ngSelect that apply to all rows by default.
   * These options will not be overridden for specific rows config.
   * @type {boolean}
   * @memberof Iv35ngSelectConfig
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
     *    @memberof Iv35ngSelectConfig
     */
    iconColor?: {
      /**
       *    @description Icon background color css variable name (without double hyphen (--) at starting ).
       *    @memberof Iv35ngSelectConfig
       */
      background?: V35Colors;
      /**
       *    @description Icon text/fa-icon color css variable name (without double hyphen (--) at starting ).
       *    @memberof Iv35ngSelectConfig
       */
      text?: V35Colors;
    };
  };

  /**
   *    @description Custom styles to replace the default style of the input.
   *    @memberof Iv35ngSelectConfig
   */
  style?: {
    /**
     *    @description size level of the input,
     *    - 1 - 28px
     *    - 2 - 36px - default
     *    - 3 - 48px
     *    - 4 - 58px
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
   * @memberof Iv35ngSelectConfig
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
  
  extraStyles?:string;

  /**
   * Controls how the search filters dropdown options.
   * - 'includes' (default): item matches if its label contains the typed term anywhere.
   * - 'startsWith': item matches only if its label begins with the typed term.
   *
   * @type {'includes' | 'startsWith'}
   * @memberof Iv35ngSelectConfig
   */
  searchMode?: 'includes' | 'startsWith';
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
 * This interface is intended for use within the V35CommonDropDownSelectorComponent.
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
     * The background color from OCW v35 color css variable.
     *
     * @type {V35Colors}
     * @memberof ListDataItem.icon
     */
    bgOCWv35Clr: V35Colors;

    /**
     * The text color from OCW v35 color css variable.
     *
     * @type {V35Colors}
     * @memberof ListDataItem.icon
     */
    textOCWv35Clr: V35Colors;

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

export type V35Colors =
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

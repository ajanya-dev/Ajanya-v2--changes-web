import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  forwardRef,
  OnChanges,
  input
} from '@angular/core';
import {
  NgModel,
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  FormsModule
} from '@angular/forms';
import { NgSelectComponent, NgSelectModule } from '@ng-select/ng-select';
import { CommonModule } from '@angular/common';
import {
  Iv35ngSelectConfig,
  ListDataItemStructured,
  TListData
} from './models/v35-common-dropdown-selector.interface';
import { V35ControlMessageComponent } from '../control-message-v35/control-message-v35.component';
import { Utils } from 'src/app/data/utils';

/**
 * Represents a custom Angular component for a versatile dropdown select input.
 *
 * @usageNotes
 * This component integrates with Angular forms and the [at]ng-select/ng-select library to provide a flexible dropdown select input.
 * Additionally it supports custom icon fields and emits events for value changes and "Add New" button clicks and more.
 *
 * @example
 * ```
 * <app-v35-common-dropdown
 *   [config]="selectConfig"
 *   [listData]="dataList"
 *   (buttonClick)="handleAddNew($event)"
 *   [(ngModel)]="selectedValue"
 *   [disabled]="isDisabled">
 * </app-v35-common-dropdown>
 * ```
 *
 * @example
 *
 * ```
 * <app-v35-common-dropdown [config]="{placeholder:'Select', displayField:'item', enableAddNew:true, displaySubField:'subs', iconField:'ico'}" [listData]="[{item:'one',subs:'sub text', ico:'hR'},{item:'Two',subs:'sub text', ico:'AD'},{item:'three',subs:'sub text', ico:iconHTML}]" [(ngModel)]="valueAccessor" (buttonClick)="dummyClick()"></app-v35-common-dropdown>
 *  <app-v35-common-dropdown [config]="{placeholder:'Select',  enableAddNew:true,}" [listData]="['value-one','value-two','value-three']" [(ngModel)]="valueAccessor" (buttonClick)="dummyClick()"></app-v35-common-dropdown>
 * <app-v35-common-dropdown [config]="{placeholder:'Select', displayField:'item', displaySubField:'subs', iconColorField: {background:'colorClasses.bg', text:'colorClasses.text'}, iconField:'ico', outputField:'.', style:{size:2, enableLabelIcon:true, labelIconData:{icon_fa:['fas','wallet'], color:'common-green-color'}}, commons:{iconColor:{background:'common-secondary-green-color', text:'common-green-color'}, iconData:['fas','wallet']}}" [listData]="[{item:'one',subs:'sub text', ico:'hR'},{item:'Two',subs:'sub text', ico:'AD'},{item:'three',subs:'sub text', ico:['fas','filter-list']},{item:'three',subs:'sub text'}]" ></app-v35-common-dropdown>
 * ```
 *
 * @param {Iv35ngSelectConfig} config - Configuration options for the component.
 * @param {Array<TListData>} listData - The data to populate the dropdown options.
 * @event {EventEmitter<boolean>} - Event emitter for the "Add New" button click.
 */

@Component({
  selector: 'app-v35-common-dropdown',
  templateUrl: './v35-common-dropdown-selector.component.html',
  styleUrls: ['./v35-common-dropdown-selector.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => V35CommonDropDownSelectorComponent),
      multi: true
    }
  ],
  standalone: true,
  imports: [
    CommonModule,
    NgSelectModule,
    FontAwesomeModule,
    FormsModule,
    V35ControlMessageComponent
  ]
})
export class V35CommonDropDownSelectorComponent
  implements ControlValueAccessor, OnChanges
{


  /**
   * Access to the ng-select component.
   *
   * @type {NgSelectComponent}
   * @memberof V35CommonDropDownSelectorComponent
   */
  @ViewChild(NgSelectComponent) ngSelectComponent: NgSelectComponent;

  /**
   * Access to the selectController NgModel.
   *
   * @type {NgModel}
   * @memberof V35CommonDropDownSelectorComponent
   */
  @ViewChild('selectController', { static: true })
  selectControllerNgModel!: NgModel;

  /**
   * Configuration options for the component.
   *
   * @type {Iv35ngSelectConfig}
   * @memberof V35CommonDropDownSelectorComponent
   */
  @Input() config: Iv35ngSelectConfig = {};

  /**
   * is option required to select?.
   *
   * @type {boolean}
   * @memberof V35CommonDropDownSelectorComponent
   */
  @Input() isRequired: boolean = false;

  /**
   * The data to populate the dropdown options.
   *
   * @type {Array<TListData>}
   * @memberof V35CommonDropDownSelectorComponent
   */
  @Input({ required: true }) listData: Array<TListData>;

  /**
   * You can set the loading state from the outside (e.g. async items loading)
   *
   * @type {Array<TListData>}
   * @memberof V35CommonDropDownSelectorComponent
   */
  @Input() loading: boolean = false;

  /**
   * Whether the selected value is clearable or not.
   *
   * @type {boolean}
   * @memberof V35CommonDropDownSelectorComponent
   */
  @Input() clearable = true;

  @Input() appendTo = 'ng-select';

  @Input() notFoundText = 'No items found';

  dropdownPosition = input<string>('auto');
  /**
   * Event emitter for the "Add New" button click.
   *
   * @type {EventEmitter<boolean>}
   * @memberof V35CommonDropDownSelectorComponent
   */
  @Output() buttonClick: EventEmitter<boolean> = new EventEmitter<boolean>();

  /**
   * Fired when scrolled to the end of items. Can be used for loading more items in chunks.
   *
   * @type {EventEmitter<boolean>}
   * @memberof V35CommonDropDownSelectorComponent
   */
  @Output() scrollToEnd: EventEmitter<boolean> = new EventEmitter<boolean>();

  @Output() searchEvent: EventEmitter<string> = new EventEmitter<string>();

  /**
   * Fired on select close.
   *
   * @type {EventEmitter<string>}
   * @memberof V35CommonDropDownSelectorComponent
   */
  @Output() selectClose: EventEmitter<string> = new EventEmitter<string>();

  /**
   * The selected value.
   *
   * @type {string}
   * @memberof V35CommonDropDownSelectorComponent
   */
  private value: string | undefined = undefined;

  /**
   * Whether the component is disabled.
   *
   * @type {boolean}
   * @memberof V35CommonDropDownSelectorComponent
   */
  isDisabled = input<boolean>(false);

  /**
   * Updated and structured list of data to use in select input.
   *
   * @type {ListDataItemStructured[]}
   * @memberof V35CommonDropDownSelectorComponent
   */
  updatedListData: ListDataItemStructured[] = [];

  /**
   * Emits the `value` when a selection is made or opens the "Add New" dialog if 'add-new' is selected.
   *
   * @param {string} value - The selection value in the ng-select.
   * @memberof V35CommonDropDownSelectorComponent
   */
  set dropDownValue(value: string) {
    if (value === 'add-new') {
      this.buttonClick.next(true);
      this.clearSelection();
    } else if (value !== undefined && this.value !== value) {
      this.value = value;
      this.inputOnChange(value);
      this.inputOnTouch();
    }
  }

  /**
   * @description Retrieves the current selected value.
   *
   * @type {string}
   * @memberof V35CommonDropDownSelectorComponent
   */
  get dropDownValue(): string | undefined {
    return this.value;
  }

  ngOnChanges(): void {
    this.structureListData();
  }

  /**
   * @description Tracks items in the listData array for efficient rendering.
   *
   * @param {number} index - The index of item.
   * @param {TListData} item - The item to track.
   * @returns {string} - The tracked item.
   */
  itemTrackBy(index: number, item: TListData): string {
    let idToTrack = '';
    if (typeof item === 'string') {
      idToTrack = item;
    } else if (this.config.displayField) {
      idToTrack =
        (this.getDataFromField(this.config.displayField, item) as
          | string
          | null) ?? '';
    }
    return idToTrack.replaceAll(/ /g, '');
  }

  /**
   * Structure the list data for use in ng-select and set to the updatedListData variable.
   *
   * @description This function transforms the input list data into a structured format that can be used in ng-select.
   *
   */
  structureListData() {
    if (this.listData) {
      try {
        this.updatedListData = this.listData.map(
          (item: TListData): ListDataItemStructured => {
            const displayFieldValue = this.config.displayField
              ? this.getDataFromField(this.config.displayField, item) ??
                '-No Data-'
              : this.JSONStringify(item);
            const outputFieldValue = this.config.outputField
              ? this.getDataFromField(this.config.outputField, item) ??
                displayFieldValue
              : this.JSONStringify(item);
              let displaySubFieldValue =
              this.config.displaySubField &&
              (this.getDataFromField(
                this.config.displaySubField ?? '',
                item
              ) as string | null);
            
            // Check if displaySubField is account_number and mask it
            if (this.config.displaySubField === 'account_number' && displaySubFieldValue) {
              displaySubFieldValue = Utils.getMaskedAcNo(String(displaySubFieldValue));
            }

            let iconFieldValue =
              (this.config.iconField &&
                this.getDataFromField(this.config.iconField ?? '', item, {
                  disableStringify: true
                })) ??
              this.config.commons?.iconData ??
              '';
            if (iconFieldValue === displayFieldValue) {
              iconFieldValue = this.config.commons?.iconData ?? '';
            }

            let iconBgColorFieldValue =
              (this.config.iconColorField?.background &&
                this.getDataFromField(
                  this.config.iconColorField?.background ?? '',
                  item
                )) ??
              this.config.commons?.iconColor?.background ??
              '';
            if (iconBgColorFieldValue === displayFieldValue) {
              iconBgColorFieldValue =
                this.config.commons?.iconColor?.background ?? '';
            }

            let iconTextColorFieldValue =
              (this.config.iconColorField?.text &&
                this.getDataFromField(
                  this.config.iconColorField?.text ?? '',
                  item
                )) ??
              this.config.commons?.iconColor?.text ??
              '';
            if (iconTextColorFieldValue === displayFieldValue) {
              iconTextColorFieldValue =
                this.config.commons?.iconColor?.text ?? '';
            }

            let iconType =
              (iconFieldValue as string)?.length === 2 ? 'text' : 'html';
            iconType = Array.isArray(iconFieldValue) ? 'fa-icon' : iconType;
            if (typeof iconFieldValue == 'string') {
              iconType = this.isUrlValid(iconFieldValue) ? 'img-url' : iconType;
            }
            return {
              value: outputFieldValue ?? '-No Data-',
              icon: {
                show: !!(
                  iconFieldValue && iconFieldValue !== displayFieldValue
                ),
                data: iconFieldValue,
                bgOCWv35Clr: iconBgColorFieldValue ?? this.randomClr(), // v35 css variable for bg color,
                textOCWv35Clr:
                  iconTextColorFieldValue ?? 'common-secondary-yellow-color', // v35 css variable for text color,
                type: iconType // html, text (2-length), fa-icon
              },
              mainText: displayFieldValue ?? '-No Data-',
              subText: {
                show: !!(
                  displaySubFieldValue &&
                  displaySubFieldValue !== displayFieldValue
                ),
                data: displaySubFieldValue ?? ''
              }
            } as ListDataItemStructured;
          }
        ) as ListDataItemStructured[];
      } catch (error) {
        this.updatedListData = [];
      }
    }
  }

  // ControlValueAccessor methods...

  /**
   * @description Writes a new value to the component/drop-down.
   *
   * @param {string} value - The new value to set.
   * @memberof V35CommonDropDownSelectorComponent
   */
  writeValue(value: string) {
    if (value === '') {
      return;
    }
    this.value = value;
  }

  /**
   * @description Registers a callback function to be called when the value changes.
   *
   * @param {Function} fn - The callback function to register.
   */
  registerOnChange(fn: (value: string) => void) {
    this.inputOnChange = fn;
  }

  /**
   * @description Registers a callback function to be called when the component is touched.
   *
   * @param {Function} fn - The callback function to register.
   */
  registerOnTouched(fn: () => void) {
    this.inputOnTouch = fn;
  }

  // Registerable variables as Function...

  /**
   * @description Placeholder function for the inputOnChange callback.
   *
   */
  inputOnChange: (value: string) => void = () => {};

  /**
   * @description Placeholder function for the inputOnTouch callback.
   *
   */
  inputOnTouch: () => void = () => {};

  /**
   * @description
   * - Handles the onBlur event of the ng-select component.
   * - Invokes the inputOnTouch function.
   *
   */
  onNgSelectBlur() {
    this.inputOnTouch();
  }

  /**
   * @description
   * Generates and returns a random CSS color class from a predefined list.
   *
   * @returns {string} - A random CSS color class.
   * @memberof V35CommonDropDownSelectorComponent
   */
  randomClr(): string {
    const colors = [
      'common-blue-color',
      'common-green-color',
      'common-violet-color',
      'common-yellow-color',
      'common-red-color'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  /**
   * Retrieves data from a field within the listData based on the fieldName.
   *
   * @param {string} fieldName - The field name to retrieve data from.
   * @param {TListData} _listData - The list data object.
   * @returns {(string | null)} - The retrieved data or null if not found.
   */
  getDataFromField(
    fieldName: string,
    _listData: TListData,
    _config: { disableStringify?: boolean } = { disableStringify: false }
  ): string | null | TListData {
    if (typeof _listData === 'string') return _listData as string;
    try {
      if (_listData[fieldName.split('.')[0]] && fieldName) {
        let data: TListData = JSON.parse(JSON.stringify(_listData));
        fieldName.split('.').forEach((key: string) => {
          if (typeof data !== 'string') {
            data = data[key];
          }
        });
        const stringified = _config?.disableStringify
          ? (data as TListData)
          : (this.JSONStringify(data) as string | null);
        return typeof data === 'string' ? (data as string) : stringified;
      }
    } catch (error) {
      return null;
    }
    return null;
  }

  /**
   * Converts an object or value to a JSON string.
   *
   * @param {TListData} value - The value or object to convert.
   * @returns {string} - The JSON string.
   */
  JSONStringify(value: TListData): string {
    if (typeof value === 'string') {
      return value;
    }
    return JSON.stringify(value);
  }

  /**
   * Parses a JSON string into an object or returns the original value if it's not a string.
   *
   * @param {string} value - The JSON string to parse.
   * @returns {(TListData | string)} - The parsed object or the original value.
   */
  JSONParse(value: string): TListData | string {
    if (typeof value === 'string') {
      return JSON.parse(value);
    }
    return value;
  }

  /**
   * Checks if a given string is a valid URL.
   *
   * @param {string} url - The string to be checked as a URL.
   * @returns {boolean} - True if the string is a valid URL, false otherwise.
   */
  isUrlValid(url: string): boolean {
    const urlPattern = /^https?:\/\/\S+/i; // Matches HTTP/HTTPS URLs
    const filePattern = /^(\/|[A-Za-z]:\\|\\\\)/; // Matches local file paths
    return urlPattern.test(url) || filePattern.test(url);
  }

  /**
   * Fired when scrolled to the end of items. Can be used for loading more items in chunks.
   */

  onScrollToEnd() {
    this.scrollToEnd.emit(true);
  }

  search(event: KeyboardEvent | FocusEvent) {
    const searchTerm = (event?.target as HTMLInputElement).value;
    this.searchEvent.emit(searchTerm);
  }

  /**
   * Custom search predicate for ng-select. Honors `config.searchMode`.
   * Default behavior (or `'includes'`) keeps ng-select's built-in substring match.
   * `'startsWith'` only keeps options whose label begins with the typed term.
   */
  searchFn = (term: string, value: unknown): boolean => {
    const needle = (term ?? '').trim().toLowerCase();
    if (!needle) return true;
    const valueStr = (value ?? '').toString().toLowerCase();
    const matchedItem = this.updatedListData.find(
      (entry) => (entry.value ?? '').toString().toLowerCase() === valueStr
    );
    const label = (matchedItem?.mainText ?? '').toString().trim().toLowerCase();
    if (this.config.searchMode === 'startsWith') {
      return label.startsWith(needle) || valueStr.startsWith(needle);
    }
    return label.includes(needle) || valueStr.includes(needle);
  };

  /**
   * Fired on select close
   */

  onClose() {
    this.selectClose.emit(this.value);
  }

  /**
   * Clears the selection in the ng-select component.
   *
   * @memberof V35CommonDropDownSelectorComponent
   */
  clearSelection() {
    this.ngSelectComponent.handleClearClick();
  }

  /**
   * Generates custom label text for selected value when custom template is enabled
   * 
   * @param {string} selectedValue - The selected value (ID)
   * @returns {string} - The formatted label text
   * @memberof V35CommonDropDownSelectorComponent
   */
  getCustomLabelText(selectedValue: string): string {
    if (!this.config.customLabelTemplate?.enabled || !selectedValue) {
      return '';
    }

    const config = this.config.customLabelTemplate;
    
    // Find the original data item that matches the selected value
    const originalItem = this.listData.find(dataItem => {
      const outputValue = this.config.outputField 
        ? this.getDataFromField(this.config.outputField, dataItem) 
        : this.JSONStringify(dataItem);
      return outputValue === selectedValue;
    });

    if (!originalItem) {
      return selectedValue;
    }

    // Get primary field value
    const primaryValue = this.getDataFromField(config.primaryField, originalItem) as string || '';
    
    // Get secondary field value if specified
    let formattedText = primaryValue;
    
    if (config.secondaryField) {
      const secondaryValue = this.getDataFromField(config.secondaryField, originalItem) as string;
      if (secondaryValue) {
        const separator = config.separator || ' ';
        formattedText = `${primaryValue}${separator}${secondaryValue}%`;
      }
    }

    return formattedText;
  }
}

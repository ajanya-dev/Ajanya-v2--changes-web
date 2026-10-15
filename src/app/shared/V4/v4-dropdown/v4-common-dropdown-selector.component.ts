import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  Component,
  ViewChild,
  ViewEncapsulation,
  forwardRef,
  input,
  output,
  effect,
  inject,
  ElementRef,
  NgZone,
  AfterViewInit,
  OnDestroy
} from '@angular/core';
import {
  NgModel,
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  FormsModule
} from '@angular/forms';
import { NgSelectComponent, NgSelectModule } from '@ng-select/ng-select';
import { CommonModule } from '@angular/common';
import { Utils } from 'src/app/data/utils';
// eslint-disable-next-line import/no-extraneous-dependencies
import { LucideAngularModule, Plus } from 'lucide-angular';
import { MatTooltip } from '@angular/material/tooltip';
import {
  Iv4ngSelectConfig,
  ListDataItemStructured,
  TListData
} from './models/v4-common-dropdown-selector.interface';
import { V4ControlMessageComponent } from '../control-message-v4/control-message-v4.component';

/**
 * Represents a custom Angular component for a versatile dropdown select input.
 *
 * @usageNotes
 * This component integrates with Angular forms and the [at]ng-select/ng-select library to provide a flexible dropdown select input.
 * Additionally it supports custom icon fields and emits events for value changes and "Add New" button clicks and more.
 *
 * @example
 * ```
 * <app-v4-common-dropdown
 *   [config]="selectConfig"
 *   [listData]="dataList"
 *   (buttonClick)="handleAddNew($event)"
 *   [(ngModel)]="selectedValue"
 *   [disabled]="isDisabled">
 * </app-v4-common-dropdown>
 * ```
 *
 * @example
 *
 * ```
 * <app-v4-common-dropdown [config]="{placeholder:'Select', displayField:'item', enableAddNew:true, displaySubField:'subs', iconField:'ico'}" [listData]="[{item:'one',subs:'sub text', ico:'hR'},{item:'Two',subs:'sub text', ico:'AD'},{item:'three',subs:'sub text', ico:iconHTML}]" [(ngModel)]="valueAccessor" (buttonClick)="dummyClick()"></app-v4-common-dropdown>
 *  <app-v4-common-dropdown [config]="{placeholder:'Select',  enableAddNew:true,}" [listData]="['value-one','value-two','value-three']" [(ngModel)]="valueAccessor" (buttonClick)="dummyClick()"></app-v4-common-dropdown>
 * <app-v4-common-dropdown [config]="{placeholder:'Select', displayField:'item', displaySubField:'subs', iconColorField: {background:'colorClasses.bg', text:'colorClasses.text'}, iconField:'ico', outputField:'.', style:{size:2, enableLabelIcon:true, labelIconData:{icon_fa:['fas','wallet'], color:'common-green-color'}}, commons:{iconColor:{background:'common-secondary-green-color', text:'common-green-color'}, iconData:['fas','wallet']}}" [listData]="[{item:'one',subs:'sub text', ico:'hR'},{item:'Two',subs:'sub text', ico:'AD'},{item:'three',subs:'sub text', ico:['fas','filter-list']},{item:'three',subs:'sub text'}]" ></app-v4-common-dropdown>
 * ```
 *
 * @param {Iv4ngSelectConfig} config - Configuration options for the component.
 * @param {Array<TListData>} listData - The data to populate the dropdown options.
 * @event {EventEmitter<boolean>} - Event emitter for the "Add New" button click.
 */

@Component({
  selector: 'app-v4-common-dropdown',
  templateUrl: './v4-common-dropdown-selector.component.html',
  styleUrls: ['./v4-common-dropdown-selector.component.scss'],
  encapsulation: ViewEncapsulation.None,
  host: { '[class.v4-dd--compact]': "variant() === 'compact'" },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => V4CommonDropDownSelectorComponent),
      multi: true
    }
  ],
  standalone: true,
  imports: [
    CommonModule,
    NgSelectModule,
    FontAwesomeModule,
    FormsModule,
    V4ControlMessageComponent,
    LucideAngularModule,
    MatTooltip
  ]
})
export class V4CommonDropDownSelectorComponent
  implements ControlValueAccessor, AfterViewInit, OnDestroy
{
  // Lucide icons
  readonly PlusIcon = Plus;

  private elementRef = inject(ElementRef);
  private ngZone = inject(NgZone);
  private scrollCleanup: (() => void) | null = null;


  /**
   * Access to the ng-select component.
   *
   * @type {NgSelectComponent}
   * @memberof V4CommonDropDownSelectorComponent
   */
  @ViewChild(NgSelectComponent) ngSelectComponent: NgSelectComponent;

  /**
   * Access to the selectController NgModel.
   *
   * @type {NgModel}
   * @memberof V4CommonDropDownSelectorComponent
   */
  @ViewChild('selectController', { static: true })
  selectControllerNgModel!: NgModel;

  /** Configuration options for the component. */
  config = input<Iv4ngSelectConfig>({});

  /** Is option required to select? */
  isRequired = input(false);

  /** The data to populate the dropdown options. */
  listData = input.required<Array<TListData>>();

  /** You can set the loading state from the outside (e.g. async items loading) */
  loading = input(false);

  /** Whether the selected value is clearable or not. */
  clearable = input(true);

  appendTo = input('ng-select');
  isInvalid = input(false);

  dropdownPosition = input<string>('auto');

  /** Whether the dropdown search is enabled. */
  searchable = input(true);

  /**
   * Enables native-`<select>`-style letter-key jump: typing a character moves the
   * highlight to the first matching option. Only applies when `searchable` is
   * false, since a searchable dropdown already filters as you type.
   *
   * Opt-in (off by default) so existing consumers are unaffected. See
   * onTypeAheadKeydown().
   */
  typeAhead = input(false);

  /** Optional override to bypass ng-select's client-side filtering (e.g. when search is server-side). */
  searchFn = input<((term: string, item: unknown) => boolean) | null>(null);

  /** Whether the component is disabled. */
  isDisabled = input<boolean>(false);

  /** Allow user to create custom tags (free-text entries). */
  addTag = input<boolean | ((term: string) => any)>(false);

  /** Reduces placeholder and option font size to 12px. */
  smallFont = input(false);

  /** 'compact' is the pay-compact field metric. This component renders with
   *  ViewEncapsulation.None, so its stylesheet is global; the compact rules are scoped
   *  by the v4-dd--compact host class rather than leaking to every dropdown. */
  variant = input<'default' | 'compact'>('default');

  /** Text shown next to the typed term when addTag is enabled. */
  addTagText = input<string>('Add item');

  isPermissionDenied = input<boolean>(false);

  notFoundText = input<string>('No items found');

  /** Event emitter for the "Add New" button click. */
  buttonClick = output<boolean>();

  /** Fired when scrolled to the end of items. */
  scrollToEnd = output<boolean>();

  searchEvent = output<string>();

  /** Fired on select close. */
  selectClose = output<string>();

  /** Fired when ng-select's built-in clear (x) icon is clicked. */
  clearEvent = output<void>();

  /**
   * The selected value.
   *
   * @type {string}
   * @memberof V4CommonDropDownSelectorComponent
   */
  private value: string | undefined = undefined;

  /**
   * Updated and structured list of data to use in select input.
   *
   * @type {ListDataItemStructured[]}
   * @memberof V4CommonDropDownSelectorComponent
   */
  updatedListData: ListDataItemStructured[] = [];

  /** Accumulated characters for letter-key jump. See onTypeAheadKeydown(). */
  private typeAheadBuffer = '';
  private typeAheadTimer: ReturnType<typeof setTimeout> | null = null;
  private static readonly TYPE_AHEAD_BUFFER_MS = 600;
  private readonly typeAheadKeydownListener = (event: KeyboardEvent) =>
    this.onTypeAheadKeydown(event);

  constructor() {
    effect(() => {
      this.structureListData();
    });
  }

  ngAfterViewInit() {
    // Registered imperatively and outside Angular rather than as a template
    // binding: this component has ~169 instances app-wide and type-ahead is
    // opt-in, so onTypeAheadKeydown returns immediately for nearly all of them.
    // A template (keydown) binding would schedule change detection on every
    // keystroke for every instance. Registration stays unconditional so a
    // consumer can bind [typeAhead] to a dynamic expression. Keydown bubbles
    // from ng-select's inner input up to this host.
    this.ngZone.runOutsideAngular(() => {
      (this.elementRef.nativeElement as HTMLElement).addEventListener(
        'keydown',
        this.typeAheadKeydownListener
      );
    });
  }

  /**
   * Emits the `value` when a selection is made or opens the "Add New" dialog if 'add-new' is selected.
   *
   * @param {string} value - The selection value in the ng-select.
   * @memberof V4CommonDropDownSelectorComponent
   */
  set dropDownValue(value: string | { value?: string; label?: string; name?: string }) {
    // Handle tagged items — ng-select passes the whole tag object when addTag is used
    if (value !== null && value !== undefined && typeof value === 'object') {
      const termValue = value.value ?? value.label ?? value.name;
      if (termValue !== undefined && this.value !== termValue) {
        this.value = termValue;
        this.inputOnChange(termValue);
        this.inputOnTouch();
      }
      return;
    }
    if (value === 'add-new') {
      this.buttonClick.emit(true);
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
   * @memberof V4CommonDropDownSelectorComponent
   */
  get dropDownValue(): string | undefined {
    return this.value;
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
    } else if (this.config().displayField) {
      const { displayField } = this.config();
      idToTrack = displayField
        ? ((this.getDataFromField(displayField, item) as string | null) ?? '')
        : '';
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
    const listData = this.listData();
    const config = this.config();
    if (listData) {
      try {
        this.updatedListData = listData.map(
          (item: TListData): ListDataItemStructured => {
            const displayFieldValue = config.displayField
              ? (this.getDataFromField(config.displayField, item) ??
                '-No Data-')
              : this.JSONStringify(item);
            const outputFieldValue = config.outputField
              ? (this.getDataFromField(config.outputField, item) ??
                displayFieldValue)
              : this.JSONStringify(item);
            let displaySubFieldValue =
              config.displaySubField &&
              (this.getDataFromField(config.displaySubField ?? '', item) as
                | string
                | null);

            // Check if displaySubField is account_number and mask it
            if (
              config.displaySubField === 'account_number' &&
              displaySubFieldValue
            ) {
              displaySubFieldValue = Utils.getMaskedAcNo(
                String(displaySubFieldValue)
              );
            }

            let iconFieldValue =
              (config.iconField &&
                this.getDataFromField(config.iconField ?? '', item, {
                  disableStringify: true
                })) ??
              config.commons?.iconData ??
              '';
            if (iconFieldValue === displayFieldValue) {
              iconFieldValue = config.commons?.iconData ?? '';
            }

            let iconBgColorFieldValue =
              (config.iconColorField?.background &&
                this.getDataFromField(
                  config.iconColorField?.background ?? '',
                  item
                )) ??
              config.commons?.iconColor?.background ??
              '';
            if (iconBgColorFieldValue === displayFieldValue) {
              iconBgColorFieldValue =
                config.commons?.iconColor?.background ?? '';
            }

            let iconTextColorFieldValue =
              (config.iconColorField?.text &&
                this.getDataFromField(
                  config.iconColorField?.text ?? '',
                  item
                )) ??
              config.commons?.iconColor?.text ??
              '';
            if (iconTextColorFieldValue === displayFieldValue) {
              iconTextColorFieldValue = config.commons?.iconColor?.text ?? '';
            }

            let iconType =
              (iconFieldValue as string)?.length === 2 ? 'text' : 'html';
            iconType = Array.isArray(iconFieldValue) ? 'fa-icon' : iconType;
            if (typeof iconFieldValue === 'string') {
              iconType = this.isUrlValid(iconFieldValue) ? 'img-url' : iconType;
            }
            return {
              value: outputFieldValue ?? '-No Data-',
              icon: {
                show: !!(
                  iconFieldValue && iconFieldValue !== displayFieldValue
                ),
                data: iconFieldValue,
                bgOCWv4Clr: iconBgColorFieldValue ?? this.randomClr(), // v4 css variable for bg color,
                textOCWv4Clr: iconTextColorFieldValue ?? 'warning-foreground', // v4 css variable for text color,
                type: iconType // html, text (2-length), fa-icon
              },
              mainText: displayFieldValue ?? '-No Data-',
              disabled:
                typeof item !== 'string' && 'disabled' in item
                  ? !!item['disabled']
                  : false,
              tooltip: config.tooltipField
                ? ((this.getDataFromField(config.tooltipField, item) as
                    | string
                    | null) ?? '')
                : '',
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
   * @memberof V4CommonDropDownSelectorComponent
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
   * @memberof V4CommonDropDownSelectorComponent
   */
  randomClr(): string {
    const colors = ['primary', 'success', 'violet', 'warning', 'destructive'];
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
      if (fieldName && _listData[fieldName.split('.')[0]] != null) {
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
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
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
   * Letter-key jump for non-searchable dropdowns: typing a character moves the
   * highlight to the first option whose label starts with the typed characters,
   * the way a native <select> behaves. Opt-in via the `typeAhead` input.
   *
   * ng-select ships this (`_handleKeyPresses`) but it is inoperable here. For
   * projected `<ng-option>` elements ng-select derives the option label from
   * `nativeElement.innerHTML`, so every label is markup beginning with
   * `<div class="v4-option-row...`. Its `ItemsList.findByLabel()` prefix-matches
   * against that string and therefore never matches a letter. Its built-in jump
   * is left in place because it is a guaranteed no-op; this matches against
   * `updatedListData[].mainText`, the clean label text this component builds.
   *
   * Only printable, non-space characters are handled. Space is left to ng-select,
   * which binds it to open/select, so a multi-word label is reached by repeating
   * its first letter to cycle rather than by typing the space.
   */
  onTypeAheadKeydown(event: KeyboardEvent) {
    if (!this.typeAhead() || this.searchable()) {
      return;
    }

    const ngSelect = this.ngSelectComponent;
    if (
      !ngSelect?.isOpen ||
      event.key.length !== 1 ||
      event.key === ' ' ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey
    ) {
      return;
    }

    const key = event.key.toLowerCase();
    const cycling =
      this.typeAheadBuffer.length > 0 &&
      this.typeAheadBuffer.split('').every((buffered) => buffered === key);

    this.typeAheadBuffer += key;
    this.startTypeAheadTimer();

    const term = cycling ? key : this.typeAheadBuffer;
    const options = this.updatedListData;
    // For projected <ng-option>, NgOption.value is the raw bound value itself.
    const markedValue = ngSelect.itemsList.markedItem?.value;
    const from = cycling
      ? options.findIndex((option) => option.value === markedValue) + 1
      : 0;

    for (let step = 0; step < options.length; step += 1) {
      const option = options[(from + step) % options.length];
      if (
        !option.disabled &&
        (option.mainText ?? '').trim().toLowerCase().startsWith(term)
      ) {
        const item = ngSelect.itemsList.findItem(option.value);
        if (item) {
          // Re-enter Angular only when the highlight actually moves, so an
          // unmatched keystroke costs no change detection.
          this.ngZone.run(() => {
            ngSelect.itemsList.markItem(item);
            ngSelect.dropdownPanel?.scrollTo(item);
            // ng-select is OnPush and this listener belongs to the wrapper, so
            // it would not otherwise be re-checked.
            ngSelect.detectChanges();
          });
        }
        return;
      }
    }
  }

  private startTypeAheadTimer() {
    if (this.typeAheadTimer) {
      clearTimeout(this.typeAheadTimer);
    }
    this.typeAheadTimer = setTimeout(() => {
      this.typeAheadBuffer = '';
      this.typeAheadTimer = null;
    }, V4CommonDropDownSelectorComponent.TYPE_AHEAD_BUFFER_MS);
  }

  private resetTypeAhead() {
    if (this.typeAheadTimer) {
      clearTimeout(this.typeAheadTimer);
      this.typeAheadTimer = null;
    }
    this.typeAheadBuffer = '';
  }

  /**
   * Fired on select close
   */

  onOpen() {
    if (this.appendTo() === 'body') {
      this.addAncestorScrollListener();
    }
  }

  onClose() {
    this.removeAncestorScrollListener();
    // Reset before emitting so a throwing consumer handler cannot leave a stale
    // buffer behind; each open starts a fresh type-ahead search.
    this.resetTypeAhead();
    this.selectClose.emit(this.value ?? '');
  }

  onClear(): void {
    this.clearEvent.emit();
  }

  private addAncestorScrollListener() {
    this.removeAncestorScrollListener();
    const scrollableParent = this.findScrollableAncestor();
    if (!scrollableParent) return;

    this.ngZone.runOutsideAngular(() => {
      const handler = () => {
        this.ngZone.run(() => {
          this.ngSelectComponent?.close();
        });
      };
      scrollableParent.addEventListener('scroll', handler, { passive: true });
      this.scrollCleanup = () => scrollableParent.removeEventListener('scroll', handler);
    });
  }

  private removeAncestorScrollListener() {
    if (this.scrollCleanup) {
      this.scrollCleanup();
      this.scrollCleanup = null;
    }
  }

  private findScrollableAncestor(): HTMLElement | null {
    let parent: HTMLElement | null = this.elementRef.nativeElement.parentElement;
    while (parent) {
      const style = window.getComputedStyle(parent);
      const overflowY = style.overflowY;
      if (
        (overflowY === 'auto' || overflowY === 'scroll') &&
        parent.scrollHeight > parent.clientHeight
      ) {
        return parent;
      }
      parent = parent.parentElement;
    }
    return null;
  }

  /**
   * Handles the "Add New" button click from the header template.
   */
  close(): void {
    this.ngSelectComponent?.close();
  }

  onAddNewClick() {
    this.ngSelectComponent.close();
    this.buttonClick.emit(true);
    this.clearSelection();
  }

  /**
   * Clears the selection in the ng-select component.
   *
   * @memberof V4CommonDropDownSelectorComponent
   */
  clearSelection() {
    this.ngSelectComponent.handleClearClick();
  }

  /**
   * Finds the matching structured item for the selected value to display icon in label.
   */
  getSelectedStructuredItem(selectedValue: string): ListDataItemStructured | undefined {
    return this.updatedListData.find((item) => item.value === selectedValue);
  }

  /**
   * Returns a human-readable label for the selected value.
   * Falls back to parsing stringified-JSON values so consumers that store the
   * full object as the form value never end up showing raw JSON in the field.
   */
  getSelectedDisplayLabel(item: unknown): string {
    const structured = typeof item === 'string' ? this.getSelectedStructuredItem(item) : undefined;
    // Opt-in: strip leading indentation (\s also matches the U+00A0 used for tree
    // indentation) so tree-indented option labels render clean in the selected input
    // while the open list keeps its indent. No-op for consumers that don't set the flag.
    if (structured?.mainText) {
      return this.config().trimSelectedIndent
        ? structured.mainText.replace(/^\s+/, '')
        : structured.mainText;
    }
    if (item && typeof item === 'object') {
      const obj = item as { value?: string; label?: string; name?: string };
      return obj.value ?? obj.label ?? obj.name ?? '';
    }
    if (typeof item === 'string' && (item.startsWith('{') || item.startsWith('['))) {
      try {
        const parsed = JSON.parse(item);
        const field = this.config().displayField;
        if (field) {
          const fromField = this.getDataFromField(field, parsed);
          if (typeof fromField === 'string' && fromField) return fromField;
        }
        if (parsed && typeof parsed === 'object') {
          return parsed.name ?? parsed.label ?? parsed.value ?? '';
        }
      } catch {
        // fall through
      }
    }
    return typeof item === 'string' ? item : '';
  }

  /**
   * Generates custom label text for selected value when custom template is enabled
   *
   * @param {string} selectedValue - The selected value (ID)
   * @returns {string} - The formatted label text
   * @memberof V4CommonDropDownSelectorComponent
   */
  getCustomLabelText(selectedValue: string): string {
    const componentConfig = this.config();
    if (!componentConfig.customLabelTemplate?.enabled || !selectedValue) {
      return '';
    }

    const config = componentConfig.customLabelTemplate;

    // Find the original data item that matches the selected value
    const originalItem = this.listData().find((dataItem) => {
      const outputValue = componentConfig.outputField
        ? this.getDataFromField(componentConfig.outputField, dataItem)
        : this.JSONStringify(dataItem);
      return outputValue === selectedValue;
    });

    if (!originalItem) {
      return selectedValue;
    }

    // Get primary field value
    const primaryValue =
      (this.getDataFromField(config.primaryField, originalItem) as string) ||
      '';

    // Get secondary field value if specified
    let formattedText = primaryValue;

    if (config.secondaryField) {
      const secondaryValue = this.getDataFromField(
        config.secondaryField,
        originalItem
      ) as string;
      if (secondaryValue) {
        const separator = config.separator || ' ';
        formattedText = `${primaryValue}${separator}${secondaryValue}%`;
      }
    }

    return formattedText;
  }

  ngOnDestroy() {
    this.ngSelectComponent?.close();
    this.removeAncestorScrollListener();
    (this.elementRef.nativeElement as HTMLElement).removeEventListener(
      'keydown',
      this.typeAheadKeydownListener
    );
    this.resetTypeAhead();
  }
}

import { CommonModule } from '@angular/common';
import { MatTooltip } from '@angular/material/tooltip';
import {
  Component,
  ElementRef,
  ViewChild,
  forwardRef,
  inject,
  input,
  output,
  model,
  effect
} from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  FormControl,
  FormsModule,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule
} from '@angular/forms';
import { NgxMaskDirective, NgxMaskPipe, provideNgxMask } from 'ngx-mask';
import { MatDialog } from '@angular/material/dialog';
import { Utils } from 'src/app/data/utils';
import { Info, LucideAngularModule } from 'lucide-angular';
import { V4ControlMessageComponent } from '../control-message-v4/control-message-v4.component';
import { CalculatorComponent } from '../../components/calculator/calculator.component';

/**
 * CommonInputFieldComponent - A reusable input field with built-in validation messages,
 * masking, numeric restrictions, and an optional calculator dialog.
 * Implements ControlValueAccessor for seamless reactive form integration.
 *
 * @example
 * <!-- Basic text input with reactive form control -->
 * <app-common-input-v4
 *   [placeholder]="'Full Name'"
 *   [control]="form.controls.fullName"
 *   formControlName="fullName"
 * />
 *
 * @example
 * <!-- Optional (non-required) text input -->
 * <app-common-input-v4
 *   [placeholder]="'Nickname'"
 *   [isFieldRequired]="false"
 *   [control]="form.controls.nickname"
 *   formControlName="nickname"
 * />
 *
 * @example
 * <!-- Email input -->
 * <app-common-input-v4
 *   [placeholder]="'Email Address'"
 *   [type]="'email'"
 *   [control]="form.controls.email"
 *   formControlName="email"
 * />
 *
 * @example
 * <!-- Numeric-only input (whole numbers) -->
 * <app-common-input-v4
 *   [placeholder]="'Quantity'"
 *   [isNumberOnly]="true"
 *   [numberType]="'numeric'"
 *   [maxLength]="5"
 *   [control]="form.controls.quantity"
 *   formControlName="quantity"
 * />
 *
 * @example
 * <!-- Decimal input with calculator -->
 * <app-common-input-v4
 *   [placeholder]="'Amount'"
 *   [isNumberOnly]="true"
 *   [numberType]="'decimal'"
 *   [isCalculator]="true"
 *   [control]="form.controls.amount"
 *   formControlName="amount"
 * />
 *
 * @example
 * <!-- Masked phone number input -->
 * <app-common-input-v4
 *   [placeholder]="'Phone Number'"
 *   [customMask]="'(000) 000-0000'"
 *   [control]="form.controls.phone"
 *   formControlName="phone"
 * />
 *
 * @example
 * <!-- Currency input with separator mask -->
 * <app-common-input-v4
 *   [placeholder]="'Price'"
 *   [customMask]="'separator.2'"
 *   [control]="form.controls.price"
 *   formControlName="price"
 * />
 *
 * @example
 * <!-- Date input with min/max constraints -->
 * <app-common-input-v4
 *   [placeholder]="'Start Date'"
 *   [type]="'date'"
 *   [minDate]="'2024-01-01'"
 *   [maxDate]="'2026-12-31'"
 *   [control]="form.controls.startDate"
 *   formControlName="startDate"
 * />
 *
 * @example
 * <!-- Read-only input -->
 * <app-common-input-v4
 *   [placeholder]="'Account ID'"
 *   [readOnly]="true"
 *   [control]="form.controls.accountId"
 *   formControlName="accountId"
 * />
 *
 * @example
 * <!-- Disabled input -->
 * <app-common-input-v4
 *   [placeholder]="'Locked Field'"
 *   [disabled]="true"
 *   [control]="form.controls.lockedField"
 *   formControlName="lockedField"
 * />
 *
 * @example
 * <!-- Input with info tooltip icon -->
 * <app-common-input-v4
 *   [placeholder]="'Routing Number'"
 *   [showInfoIcon]="true"
 *   [tooltip]="'Your bank routing number (9 digits)'"
 *   [control]="form.controls.routingNumber"
 *   formControlName="routingNumber"
 * />
 *
 * @example
 * <!-- Input that prevents specific characters -->
 * <app-common-input-v4
 *   [placeholder]="'Username'"
 *   [isNeedPreventKey]="true"
 *   [preventCharacters]="['@', '#', '$']"
 *   [control]="form.controls.username"
 *   formControlName="username"
 * />
 *
 * @example
 * <!-- Input allowing hyphens in numeric mode -->
 * <app-common-input-v4
 *   [placeholder]="'Check Number'"
 *   [isNumberOnly]="true"
 *   [isAllowHyphen]="true"
 *   [control]="form.controls.checkNumber"
 *   formControlName="checkNumber"
 * />
 *
 * @example
 * <!-- Input with custom height and focus/blur event handling -->
 * <app-common-input-v4
 *   [placeholder]="'Search'"
 *   [isFieldRequired]="false"
 *   [fieldHeight]="'44px'"
 *   (inputEvent)="onSearchInput($event)"
 *   (inputFocusEvent)="onSearchFocus($event)"
 *   (inputFocusOutEvent)="onSearchBlur($event)"
 *   [control]="form.controls.search"
 *   formControlName="search"
 * />
 */
@Component({
  selector: 'app-common-input-v4',
  templateUrl: './common-input-field.component-v4.html',
  styleUrls: ['./common-input-field.component-v4.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    V4ControlMessageComponent,
    ReactiveFormsModule,
    LucideAngularModule,
    NgxMaskDirective,
    NgxMaskPipe,
    MatTooltip
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CommonInputFieldV4Component),
      multi: true
    },
    provideNgxMask()
  ]
})
export class CommonInputFieldV4Component implements ControlValueAccessor {
  private dialog = inject(MatDialog);
  @ViewChild('commonInput') private commonInputRef?: ElementRef<HTMLInputElement>;

  focus(): void {
    this.commonInputRef?.nativeElement.focus();
  }

  isFieldRequired = input(true);
  /** Label text displayed above the input */
  fieldLabel = input('');
  placeholder = input.required<string>();
  type = input('text');
  control = input<AbstractControl>();
  inputId = input<string>();
  /** Hide and show the calculator option from input filed based on the `isCalculator` value. */
  isCalculator = input(false);
  /** Specifies whether the input field allows only numeric values or both numeric and decimal values. */
  isNumberOnly = input(false);
  /** Defines the type of numeric input allowed: 'numeric' for whole numbers only, 'decimal' for decimal numbers. */
  numberType = input<'numeric' | 'decimal'>('numeric');
  /** The maximum allowed length of the input value. */
  maxLength = input<number>();
  /** The minimum required length of the entered input value. */
  minLength = input<number>();
  /** A custom mask applied to the input value. */
  customMask = input('');
  /** Determines whether the input field is in read-only mode. */
  readOnly = input(false);
  /** Specifies if keypress events should be prevented for certain characters. */
  isNeedPreventKey = input(false);
  /** An array of characters to be prevented from being entered into the input. */
  preventCharacters = input<string[]>([]);
  /** Allows the hyphen character to be entered in the input field if set to true. */
  isAllowHyphen = input(false);
  isApprovedReadOnly = input(false);
  maxDate = input<string>();

  minDate = input<string>();

  autocomplete = input('');

  disabled = model(false);

  showInfoIcon = input(false);
  /**
   * Put the info icon beside the label instead of inside the field. A label is
   * where an explanation of the field belongs; inside the box it sits on the
   * text the user is typing and reserves room the value then has to work around.
   * Opt-in: every existing caller keeps the icon where it is.
   */
  infoInLabel = input(false);
  tooltip = input('');
  fieldHeight = input<'44px' | '34px' | '32px'>('44px');

  /** 'compact' is the pay-compact field metric: 1.5px border, 10px radius, 13px text,
   *  no shadow and no focus ring. 'default' reproduces the historical class list exactly,
   *  so the ~666 existing call sites are unaffected. */
  variant = input<'default' | 'compact' | 'table'>('default');
  patterns = input<{ [key: string]: { pattern: RegExp; symbol: string } }>();
  /** Passes hiddenInput to ngx-mask directive to mask the displayed value */
  hiddenInput = input(false);
  /** Prevents copy and cut events on the input field for sensitive data */
  preventCopy = input(false);
  /** Prevents paste events on the input field (e.g., confirm account number fields) */
  preventPaste = input(false);
  /** Label for validation error messages (e.g., "Invoice Number is required"). */
  errorLabel = input('');
  /** Custom per-error-key messages forwarded to app-control-message-v4 (e.g. { pattern: '...' }). */
  customMessages = input<{ [key: string]: string }>({});
  /** Tailwind margin-top class for the validation message below the input. */
  errorMarginTop = input('mt-1');
  /** Specifies whether the input field is a search input. */
  isSearchInput = input(false);
  /** Forces a red invalid border (mirrors v4-common-dropdown's isInvalid). */
  isInvalid = input(false);

  /** Emits the HTMLInputElement object associated with the input event. */
  inputEvent = output<HTMLInputElement>();
  /** Emits the HTMLInputElement object associated with the focus event. */
  inputFocusEvent = output<HTMLInputElement>();
  /** Emits the HTMLInputElement object associated with the focus event. */
  inputFocusOutEvent = output<HTMLInputElement>();
  /** Emits the search input event. */
  clearSearchInputEvent = output();

  utils = Utils;
  inputValue = new FormControl('');
  readonly InfoIcon = Info;

  constructor() {
    effect(() => {
      if (this.disabled()) {
        this.inputValue.disable();
      } else {
        this.inputValue.enable();
      }
    });
  }

  onTouched: (event?: Event | undefined) => void;
  writeValue(value: string): void {
    this.inputValue.setValue(value);
  }

  registerOnChange(fn: () => void): void {
    this.inputValue.valueChanges.subscribe(fn);
  }

  registerOnTouched(fn: (event?: Event) => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  /**
   * @description Handles the focus event of an input element.
   * @param {HTMLInputElement} commonInput - The HTML input element that triggered the focus event.
   */
  onFocus(commonInput: HTMLInputElement) {
    this.inputFocusEvent.emit(commonInput);
  }

  /**
   * @description Handles the focus out event of an input element.
   * @param {HTMLInputElement} commonInput - The HTML input element that triggered the focus event.
   */
  onFocusOut(commonInput: HTMLInputElement) {
    this.inputFocusOutEvent.emit(commonInput);
  }

  /**
   * @description Handles the input event of an input element.
   * @param {HTMLInputElement} commonInput - The HTML input element that triggered the input event.
   */
  onInput(commonInput: HTMLInputElement) {
    this.inputEvent.emit(commonInput);
  }

  /**
   * @description Opens a dialog containing a calculator component.
   * When the dialog is closed, if a calculated value is provided,
   * it updates the inputValue FormControl with the calculated value.
   */
  openCalculator(): void {
    const dialogRef = this.dialog.open(CalculatorComponent, {
      maxWidth: '286px',
      width: '95%',
      data: { addAmountButton: true }
    });
    dialogRef.afterClosed().subscribe((calculatedValue) => {
      if (calculatedValue) {
        this.inputValue.setValue(calculatedValue);
      }
    });
  }

  onClearSearch(event: Event): void {
    event.stopPropagation();
    this.inputValue.setValue('');
    this.clearSearchInputEvent.emit();
  }

  preventCharacter(event: KeyboardEvent) {
    if (
      this.isNeedPreventKey() &&
      this.preventCharacters().includes(event.key)
    ) {
      event.preventDefault();
    }
  }

  /**
   * @description Calculates the input width based on placeholder length
   * @returns Width in pixels as a string
   */
  getInputWidth(): string {
    // Base padding: px-4 (16px left + 16px right = 32px)
    // Additional padding for icons: 42px if calculator, 40px if info icon
    let baseWidth = 32; // px-4 padding
    if (this.isCalculator()) {
      baseWidth += 42; // calculator button width
    }
    if (this.showInfoIcon() && !this.infoInLabel()) {
      baseWidth += 40; // info icon space
    }

    // Estimate character width based on font size
    // text-base (16px) ≈ 9-10px per character, text-sm (14px) ≈ 8px per character
    // Using average of 8.5px per character for responsive sizing
    const charWidth = 8.5;
    const placeholderWidth = this.placeholder().length * charWidth;

    // Add space for required asterisk if present
    const asteriskWidth = this.isFieldRequired() ? 10 : 0;

    // Minimum width to ensure readability and usability
    const minWidth = 180;

    // Calculate total width: placeholder width + padding + asterisk + extra space for comfort
    const calculatedWidth = Math.max(
      minWidth,
      placeholderWidth + baseWidth + asteriskWidth + 24
    );

    return `${calculatedWidth}px`;
  }
}

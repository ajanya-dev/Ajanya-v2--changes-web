import { CommonModule } from '@angular/common';
import { MatTooltip } from '@angular/material/tooltip';
import { faCircleQuestion } from '@fortawesome/pro-solid-svg-icons';
import {
  Component,
  EventEmitter,
  Input,
  Output,
  forwardRef,
  inject,
  input
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
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatDialog } from '@angular/material/dialog';
import { Utils } from 'src/app/data/utils';
import { V35ControlMessageComponent } from '../control-message-v35/control-message-v35.component';
import { CalculatorComponent } from '../../components/calculator/calculator.component';

@Component({
  selector: 'app-common-input-field',
  templateUrl: './common-input-field.component.html',
  styleUrls: ['./common-input-field.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    V35ControlMessageComponent,
    ReactiveFormsModule,
    FontAwesomeModule,
    NgxMaskDirective,
    NgxMaskPipe,
    MatTooltip
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CommonInputFieldComponent),
      multi: true
    },
    provideNgxMask()
  ]
})
export class CommonInputFieldComponent implements ControlValueAccessor {
  private dialog = inject(MatDialog);
  @Input() isFieldRequired = true;
  @Input({ required: true }) placeholder = 'Sample Placeholder';
  @Input() type = 'text';
  @Input() control: AbstractControl;
  @Input() inputId: string | undefined;
  /** Hide and show the calculator option from input filed based on the `isCalculator` value. */
  @Input() isCalculator = false;
  /** Specifies whether the input field allows only numeric values or both numeric and decimal values. */
  @Input() isNumberOnly = false;
  /** Defines the type of numeric input allowed: 'numeric' for whole numbers only, 'decimal' for decimal numbers. */
  @Input() numberType: 'numeric' | 'decimal' = 'numeric';
  /** The maximum allowed length of the input value. */
  @Input() maxLength: number | undefined;
  /** The minimum required length of the entered input value. */
  @Input() minLength: number | undefined;
  /** A custom mask applied to the input value. */
  @Input() customMask = '';
  /** Determines whether the input field is in read-only mode. */
  @Input() readOnly = false;
  /** Specifies if keypress events should be prevented for certain characters. */
  @Input() isNeedPreventKey = false;
  /** An array of characters to be prevented from being entered into the input. */
  @Input() preventCharacters: string[] = [];
  /** Allows the hyphen character to be entered in the input field if set to true. */
  @Input() isAllowHyphen = false;

  @Input() maxDate: string | undefined;

  @Input() minDate: string | undefined;

  autocomplete = input('');


  private _disabled = false;
  
  @Input() 
  get disabled(): boolean {
    return this._disabled;
  }
  
  set disabled(value: boolean) {
    this._disabled = value;
    if (value) {
      this.inputValue.disable();
    } else {
      this.inputValue.enable();
    }
  }

  showInfoIcon = input(false);
  tooltip = input('');
  fieldHeight = input('38px');

  /** Emits the HTMLInputElement object associated with the input event. */
  @Output() inputEvent = new EventEmitter<HTMLInputElement>();
  /** Emits the HTMLInputElement object associated with the focus event. */
  @Output() inputFocusEvent = new EventEmitter<HTMLInputElement>();
  /** Emits the HTMLInputElement object associated with the focus event. */
  @Output() inputFocusOutEvent = new EventEmitter<HTMLInputElement>();

  utils = Utils;
  inputValue = new FormControl('');
  faInfo = faCircleQuestion;

  onTouched: (event?: Event | undefined) => void;

  writeValue(input: string): void {
    this.inputValue.setValue(input);
  }

  registerOnChange(fn: () => void): void {
    this.inputValue.valueChanges.subscribe(fn);
  }

  registerOnTouched(fn: (event?: Event) => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
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

  preventCharacter(event: KeyboardEvent) {
    if (this.isNeedPreventKey && this.preventCharacters.includes(event.key)) {
      event.preventDefault();
    }
  }
}

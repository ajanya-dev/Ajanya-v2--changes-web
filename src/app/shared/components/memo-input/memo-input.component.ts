import { CommonModule } from '@angular/common';
import { Component, Input, forwardRef } from '@angular/core';
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR
} from '@angular/forms';

/**
 * @description Component for memo input.
 */
@Component({
  standalone: true,
  imports: [FormsModule, CommonModule],
  selector: 'app-memo-input',
  templateUrl: './memo-input.component.html',
  styleUrls: ['./memo-input.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MemoInputComponent),
      multi: true
    }
  ]
})
export class MemoInputComponent implements ControlValueAccessor {
  @Input() colspan1 = 5;
  @Input() placeholder = 'Memo';
  @Input() maxlength = '50';

  memoValue: string;
  onChange: (value: string) => void;
  onTouched: () => void;
  isDisabled: boolean;

  writeValue(value: string): void {
    this.memoValue = value;
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }

  /**
   * @description Sets value to `this.memoValue`.
   * @param value - memo
   */
  updateValue(value: string): void {
    this.memoValue = value;
    this.onChange(value);
    this.onTouched();
  }
}

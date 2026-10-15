import {
  Component,
  ChangeDetectionStrategy,
  forwardRef,
  input,
  model
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-common-toggle-v4',
  standalone: true,
  template: `
    <button
      type="button"
      role="switch"
      [attr.aria-checked]="checked()"
      [attr.aria-label]="ariaLabel()"
      [disabled]="disabled()"
      class="v4-toggle"
      [class.v4-toggle--checked]="checked()"
      [class.v4-toggle--disabled]="disabled()"
      (click)="toggle()"
    >
      <span class="v4-toggle__thumb"></span>
    </button>
  `,
  styles: [
    `
      .v4-toggle {
        position: relative;
        display: inline-flex;
        align-items: center;
        width: 40px;
        height: 22px;
        border-radius: 9999px;
        border: none;
        cursor: pointer;
        padding: 2px;
        background-color: var(--v4-border-color);
        transition:
          background-color 0.2s ease,
          box-shadow 0.2s ease;
        flex-shrink: 0;
      }

      .v4-toggle:focus-visible {
        outline: 2px solid var(--v4-primary-brand-bold-color);
        outline-offset: 2px;
      }

      .v4-toggle--checked {
        background-color: var(--v4-primary-brand-color);
      }

      .v4-toggle--disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .v4-toggle__thumb {
        display: block;
        width: 18px;
        height: 18px;
        border-radius: 9999px;
        background-color: #ffffff;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
        transition: transform 0.2s ease;
      }

      .v4-toggle--checked .v4-toggle__thumb {
        transform: translateX(18px);
      }
    `
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CommonToggleV4Component),
      multi: true
    }
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CommonToggleV4Component implements ControlValueAccessor {
  checked = model(false);
  disabled = input(false);
  ariaLabel = input('');

  private onChange: (value: boolean) => void = () => {};
  private onTouched: () => void = () => {};

  toggle(): void {
    if (this.disabled()) return;
    const newValue = !this.checked();
    this.checked.set(newValue);
    this.onChange(newValue);
    this.onTouched();
  }

  writeValue(value: boolean): void {
    this.checked.set(!!value);
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
}

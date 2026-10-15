import { Component, forwardRef, input, model, output } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LucideAngularModule } from 'lucide-angular';

export interface IV4RadioOption {
  id: string | number;
  name: string;
  disabled?: boolean;
  tooltip?: string;
}

@Component({
  selector: 'app-v4-radio-group',
  standalone: true,
  imports: [MatTooltipModule, LucideAngularModule],
  template: `
    <div
      class="font-peridot"
      [class]="columns() ? '' : (layout() === 'vertical' ? 'flex flex-col gap-3' : 'flex flex-wrap gap-4')"
      [style.display]="columns() ? 'grid' : ''"
      [style.grid-template-columns]="columns() ? 'repeat(' + columns() + ', 1fr)' : ''"
      [style.gap]="columns() ? '0.75rem 1rem' : ''"
      role="radiogroup"
      [attr.aria-label]="ariaLabel()"
    >
      @for (option of options(); track option.id) {
        <div class="flex items-center gap-1.5">
          <button
            type="button"
            class="group flex items-center gap-2 cursor-pointer"
            [class.opacity-40]="option.disabled"
            [class.cursor-not-allowed]="option.disabled"
            [disabled]="option.disabled"
            (click)="selectOption(option)"
          >
            <!-- Radio circle -->
            <div
              class="w-[18px] h-[18px] rounded-full border-2 relative shrink-0 transition-all duration-200"
              [class]="
                value() === option.id
                  ? 'border-v4-primary-brand-bold-color'
                  : 'border-v4-subtle-text-color group-hover:border-v4-secondary-text-color'
              "
            >
              @if (value() === option.id) {
                <div
                  class="absolute w-[9px] h-[9px] rounded-full bg-v4-primary-brand-bold-color top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                ></div>
              }
            </div>

            <!-- Label -->
            <span
              class="text-sm font-peridot transition-colors"
              [class]="
                value() === option.id
                  ? 'text-v4-main-text-color font-medium'
                  : 'text-v4-secondary-text-color group-hover:text-v4-main-text-color'
              "
            >
              {{ option.name }}
            </span>
          </button>
          @if (option.tooltip) {
            <span
              class="flex items-center justify-center text-v4-subtle-text-color cursor-pointer leading-none relative mt-[2px]"
              [matTooltip]="option.tooltip"
            >
              <lucide-angular name="circle-help" [size]="14" class="block" />
            </span>
          }
        </div>
      }
    </div>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => V4RadioGroupComponent),
      multi: true
    }
  ]
})
export class V4RadioGroupComponent implements ControlValueAccessor {
  options = input<IV4RadioOption[]>([]);
  layout = input<'horizontal' | 'vertical'>('horizontal');
  columns = input<number | undefined>(undefined);
  ariaLabel = input('');
  selectionChange = output<string | number>();

  value = model<string | number>('');
  private onChange: (value: string | number) => void = () => {};
  private onTouched: () => void = () => {};

  selectOption(option: IV4RadioOption): void {
    if (option.disabled) return;
    this.value.set(option.id);
    this.onChange(option.id);
    this.onTouched();
    this.selectionChange.emit(option.id);
  }

  writeValue(value: string | number): void {
    this.value.set(value);
  }

  registerOnChange(fn: (value: string | number) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
}

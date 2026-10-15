import {
  Component,
  HostBinding,
  Input,
  Output,
  EventEmitter,
  signal,
  computed,
  forwardRef,
  ElementRef,
  ViewChild
} from '@angular/core';
import { NgClass, NgStyle } from '@angular/common';
import { ConnectedPosition, OverlayModule } from '@angular/cdk/overlay';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';

export interface IV4SelectOption {
  id: string;
  name: string;
  value: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-v4-select-dropdown',
  standalone: true,
  imports: [NgClass, NgStyle, OverlayModule, LucideAngularModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => V4SelectDropdownComponent),
      multi: true
    }
  ],
  templateUrl: './v4-select-dropdown.component.html'
})
export class V4SelectDropdownComponent implements ControlValueAccessor {
  @HostBinding('class') get hostClass() {
    return this.autoWidth ? 'inline-block' : 'block';
  }

  private _items = signal<IV4SelectOption[]>([]);
  @Input() set items(value: IV4SelectOption[]) {
    this._items.set(value || []);
  }
  get items(): IV4SelectOption[] {
    return this._items();
  }
  @Input() placeholder = 'Select...';
  @Input() emptyMessage = 'No items found';
  @Input() loading = false;
  @Input() compact = true;
  @Input() autoWidth = false;
  /** When true, shows a clear (X) icon to reset the selection once a value is picked. */
  @Input() clearable = false;
  @Input() extraStyle: Record<string, string> = {};
  @Input() panelClass = '';
  @Input() set selectedValue(value: string) {
    this._selectedValue.set(value != null ? String(value) : '');
  }
  /**
   * Greys the control out and blocks opening it. Use when the dropdown is driven by
   * `[selectedValue]` rather than a form control, where `setDisabledState` never fires.
   */
  @Input() set disabled(value: boolean) {
    this.isDisabled = value;
  }

  @Output() selectionChange = new EventEmitter<string>();

  isOpen = false;
  _selectedValue = signal<string>('');
  isDisabled = false;
  overlayWidth = 0;

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  overlayPositions: ConnectedPosition[] = [
    { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 4 },
    { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -4 }
  ];

  displayText = computed(() => {
    const selected = this._items().find(item => item.value === this._selectedValue());
    return selected ? selected.name : '';
  });

  @ViewChild('triggerEl', { static: true }) triggerEl: ElementRef;
 
  toggleDropdown(): void {
    if (!this.isDisabled) {
      if (!this.isOpen) {
        this.overlayWidth = this.triggerEl?.nativeElement?.offsetWidth || 0;
      }
      this.isOpen = !this.isOpen;
    }
  }

  closeDropdown(): void {
    this.isOpen = false;
    this.onTouched();
  }

  clearSelection(event: Event): void {
    event.stopPropagation();
    if (this.isDisabled) {
      return;
    }
    this._selectedValue.set('');
    this.onChange('');
    this.selectionChange.emit('');
  }

  selectItem(option: IV4SelectOption): void {
    if (option.disabled) {
      return;
    }
    this._selectedValue.set(option.value);
    this.onChange(option.value);
    this.selectionChange.emit(option.value);
    this.isOpen = false;
  }

  // ControlValueAccessor
  writeValue(value: string): void {
    this._selectedValue.set(value || '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }
}

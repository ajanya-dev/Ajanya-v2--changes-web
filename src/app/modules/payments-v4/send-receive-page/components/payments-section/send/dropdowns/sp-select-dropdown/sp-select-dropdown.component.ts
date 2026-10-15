import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  forwardRef,
  inject,
  input,
  output,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LucideAngularModule, Landmark, List, Plus } from 'lucide-angular';

import { EllipsisActiveDirective } from 'src/app/directive/ellipsis-active.directive';
import { SpDropdownShellComponent } from '../dropdown-shell/sp-dropdown-shell.component';

/** A row as its consumer already holds it: a plain string, or an object. */
export type SpSelectItem = string | object;

/** Which glyph the trigger and the rows wear. */
export type SpSelectIcon = 'list' | 'bank';

/**
 * The generic single-select for this page's simple, client-side lists — purpose
 * of payment, source of cash, an international bank account. It keeps the value
 * contract of `app-v4-common-dropdown` (`displayField` / `outputField`, plain
 * strings when neither is given) and renders through `sp-dropdown-shell`, so a
 * list no longer has to fall back to the old dropdown to be bound.
 */
@Component({
  selector: 'app-sp-select-dropdown',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    MatTooltipModule,
    EllipsisActiveDirective,
    SpDropdownShellComponent
  ],
  templateUrl: './sp-select-dropdown.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SpSelectDropdownComponent),
      multi: true
    }
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpSelectDropdownComponent implements ControlValueAccessor {
  private readonly cdr = inject(ChangeDetectorRef);

  readonly label = input('');
  readonly tooltip = input('');
  readonly required = input(false);
  readonly disabled = input(false);
  /** Tooltip on the bar while disabled, saying what it is waiting for. */
  readonly disabledHint = input('');
  readonly placeholder = input('Select…');
  readonly searchable = input(true);
  readonly searchPlaceholder = input('Search…');
  readonly emptyText = input('No options found');
  readonly items = input<readonly SpSelectItem[]>([]);
  readonly loading = input(false);
  readonly dropUp = input(false);
  readonly icon = input<SpSelectIcon>('list');

  /**
   * The badge on the bar and on each option row. It reads as a category marker,
   * which is what an account or an address list wants — but on a plain list of
   * words, where every row and the selection carry the same one, it is noise.
   */
  readonly showIcon = input(true);

  /** Which key holds the row's text. Empty means the item is the text. */
  readonly displayField = input('');
  /** Which key is written into the bound control. Empty means the item itself. */
  readonly outputField = input('');
  /** Optional second line under the row's text. */
  readonly subtitleField = input('');

  readonly enableAddNew = input(false);
  readonly addNewLabel = input('Add New');
  readonly addNewHint = input('');

  readonly addNew = output<void>();

  readonly ListIcon = List;
  readonly BankIcon = Landmark;
  readonly PlusIcon = Plus;

  readonly open = signal(false);
  readonly term = signal('');
  readonly value = signal<string | null>(null);

  readonly skeletonRows = [1, 2, 3];

  readonly filteredItems = computed(() => {
    const term = this.term().trim().toLowerCase();
    const list = this.items();
    if (!term) {
      return list;
    }
    return list.filter(
      (item) =>
        this.titleOf(item).toLowerCase().includes(term) ||
        this.subtitleOf(item).toLowerCase().includes(term)
    );
  });

  readonly selectedItem = computed<SpSelectItem | null>(() => {
    const value = this.value();
    if (value == null || value === '') {
      return null;
    }
    return this.items().find((item) => this.valueOf(item) === value) ?? null;
  });

  private onChange: (value: string | null) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  titleOf(item: SpSelectItem): string {
    if (typeof item === 'string') {
      return item;
    }
    const field = this.displayField();
    return String((field ? this.fieldOf(item, field) : '') ?? '');
  }

  subtitleOf(item: SpSelectItem): string {
    const field = this.subtitleField();
    if (!field || typeof item === 'string') {
      return '';
    }
    return String(this.fieldOf(item, field) ?? '');
  }

  valueOf(item: SpSelectItem): string {
    if (typeof item === 'string') {
      return item;
    }
    const field = this.outputField();
    return String((field ? this.fieldOf(item, field) : '') ?? '');
  }

  private fieldOf(item: object, field: string): unknown {
    return (item as Record<string, unknown>)[field];
  }

  isSelected(item: SpSelectItem): boolean {
    return this.valueOf(item) === this.value();
  }

  trackItem = (_: number, item: SpSelectItem): string => this.valueOf(item);

  onSelect(item: SpSelectItem): void {
    const next = this.valueOf(item);
    this.value.set(next);
    this.onChange(next);
    this.onTouched();
    this.open.set(false);
    this.term.set('');
    this.cdr.markForCheck();
  }

  clearSelection(): void {
    this.value.set(null);
    this.onChange(null);
    this.onTouched();
    this.term.set('');
    this.cdr.markForCheck();
  }

  onAddNew(): void {
    this.open.set(false);
    this.addNew.emit();
  }

  writeValue(value: string | null): void {
    this.value.set(value ?? null);
    this.cdr.markForCheck();
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
}

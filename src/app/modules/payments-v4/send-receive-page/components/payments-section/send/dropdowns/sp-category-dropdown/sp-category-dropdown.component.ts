import {
  ChangeDetectionStrategy,
  Component,
  effect,
  forwardRef,
  input,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { LucideAngularModule, Layers, Plus, X } from 'lucide-angular';

import type { ICategoryDropdown } from 'src/app/modules/category/model/category';
import { CategoryDropdownV4Component } from 'src/app/shared/V4/dropdown/category-dropdown-v4/category-dropdown-v4.component';
import { ScrollToEndDirective } from 'src/app/directive/scroll-to-end.directive';
import { SpDropdownShellComponent } from '../dropdown-shell/sp-dropdown-shell.component';

@Component({
  selector: 'app-sp-category-dropdown',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    ScrollToEndDirective,
    SpDropdownShellComponent
  ],
  templateUrl: './sp-category-dropdown.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SpCategoryDropdownComponent),
      multi: true
    }
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpCategoryDropdownComponent extends CategoryDropdownV4Component {
  override readonly LayersIcon = Layers;
  override readonly PlusIcon = Plus;
  readonly XIcon = X;

  readonly label = input('Category');
  readonly tooltip = input(
    `Tag this payment so it's easy to find and report on later.`
  );

  readonly dropUp = input(false);
  readonly placeholderText = input('Select or search a category');

  readonly open = signal(false);
  readonly term = signal('');

  private wasOpen = false;
  private onChangeFn: (
    value?: ICategoryDropdown | null | undefined
  ) => void = () => {};

  constructor() {
    super();

    effect(
      () => {
        const isOpen = this.open();
        if (isOpen === this.wasOpen) {
          return;
        }
        this.wasOpen = isOpen;
        if (!isOpen) {
          this.term.set('');
          this.onDropdownClose();
        }
      },
      { allowSignalWrites: true }
    );
  }

  override registerOnChange(
    fn: (value?: ICategoryDropdown | null | undefined) => void
  ): void {
    this.onChangeFn = fn;
    super.registerOnChange(fn);
  }

  override getChange(event: ICategoryDropdown | string): void {
    if (event === 'add-new') {
      this.open.set(false);
      this.clearSelection();
      this.addCategoryModal();
      return;
    }
    super.getChange(event);
  }

  override onOpen(): void {
    this.open.set(true);
  }

  onSelect(category: ICategoryDropdown): void {
    this.selectedItem = category;
    this.open.set(false);
    this.getChange(category);
  }

  clearSelection(event?: Event): void {
    event?.stopPropagation();
    this.selectedItem = null;
    this.onChangeFn(null);
    this.onTouched();
    this.term.set('');
    this.clear();
  }

  onAddNew(): void {
    this.getChange('add-new');
  }

  onSearchInput(value: string): void {
    this.term.set(value);
    this.search({
      type: 'keyup',
      target: { value }
    } as unknown as KeyboardEvent);
  }
}

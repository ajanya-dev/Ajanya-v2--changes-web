import {
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { LucideAngularModule, FileCheck, Lock, Star } from 'lucide-angular';
import { MatTooltip } from '@angular/material/tooltip';

import {
  PaymentMethodDropdownV4Component,
  type IPaymentMethodOption
} from 'src/app/shared/components/v4/dropdowns/payment-method-dropdown-v4/payment-method-dropdown-v4.component';
import { SpDropdownShellComponent } from '../dropdown-shell/sp-dropdown-shell.component';

@Component({
  selector: 'app-sp-payment-method-dropdown',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    MatTooltip,
    SpDropdownShellComponent
  ],
  templateUrl: './sp-payment-method-dropdown.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SpPaymentMethodDropdownComponent),
      multi: true
    }
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpPaymentMethodDropdownComponent extends PaymentMethodDropdownV4Component {
  readonly LockIcon = Lock;
  readonly FileCheckIcon = FileCheck;
  override readonly StarIcon = Star;

  readonly open = signal(false);
  readonly searchTerm = signal('');

  private readonly selected = signal<IPaymentMethodOption | null | undefined>(
    null
  );


  readonly trigger = computed(() => this.selected() ?? null);

  readonly optionsView = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const list = term
      ? this.options().filter((m) => m.name?.toLowerCase().includes(term))
      : this.options();
    const sel = this.selected();
    const def = this.defaultItemId();
    return list.map((m) => ({
      item: m,
      isSelected: sel?.id === m.id,
      isLocked: !!m.locked,
      isDefault: def === m.id,
      tooltip: m.toolTip ?? ''
    }));
  });

  onSearchInput(term: string): void {
    this.searchTerm.set(term);
  }

  override writeValue(value: IPaymentMethodOption | null | undefined): void {
    super.writeValue(value);
    this.selected.set(this.selectedMethod.value);
  }

  clearSelection(): void {
    this.selectedMethod.setValue(null, { emitEvent: false });
    this.selected.set(null);
    this.searchTerm.set('');
    this.getChange(null);
  }

  onSelect(item: IPaymentMethodOption): void {
    if (item.locked) {
      return;
    }
    this.open.set(false);
    this.selectedMethod.setValue(item, { emitEvent: false });
    this.selected.set(item);
    this.getChange(item);
  }
}

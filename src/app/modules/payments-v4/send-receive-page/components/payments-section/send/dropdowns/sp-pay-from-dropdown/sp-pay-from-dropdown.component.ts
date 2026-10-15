import {
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { LucideAngularModule, Lock, Wallet } from 'lucide-angular';
import { MatTooltip } from '@angular/material/tooltip';

import {
  PayFromDropdownV4Component,
  type IPayFromSource
} from 'src/app/shared/components/v4/dropdowns/pay-from-dropdown-v4/pay-from-dropdown-v4.component';
import { SpDropdownShellComponent } from '../dropdown-shell/sp-dropdown-shell.component';

/** The reference lists sources in this order, not the shared const's. */
const SOURCE_ORDER = ['wallet', 'card', 'bankaccount', 'cloud'];

const SOURCE_SUBTITLES: Record<string, string> = {
  bankaccount: 'Pay from a linked bank account',
  card: 'Pay with a linked credit card',
  wallet: 'Pay from your Zil wallet balance',
  cloud: 'Pay from a connected cloud bank'
};

@Component({
  selector: 'app-sp-pay-from-dropdown',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    MatTooltip,
    SpDropdownShellComponent
  ],
  templateUrl: './sp-pay-from-dropdown.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SpPayFromDropdownComponent),
      multi: true
    }
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpPayFromDropdownComponent extends PayFromDropdownV4Component {
  readonly LockIcon = Lock;
  readonly WalletIcon = Wallet;

  readonly open = signal(false);

  /** The FormControl is not reactive for computed(); mirror it into a signal. */
  private readonly selected = signal<IPayFromSource | null | undefined>(null);


  readonly trigger = computed(() => this.selected() ?? null);

  readonly optionsView = computed(() => {
    const sel = this.selected();
    const def = this.defaultItemId();
    const ordered = [...this.sources()].sort(
      (a, b) => SOURCE_ORDER.indexOf(a.id) - SOURCE_ORDER.indexOf(b.id)
    );
    return ordered.map((s) => ({
      item: s,
      subtitle: SOURCE_SUBTITLES[s.id] ?? '',
      isSelected: sel?.id === s.id,
      isDefault: def === s.id
    }));
  });

  override writeValue(value: IPayFromSource | null | undefined): void {
    super.writeValue(value);
    this.selected.set(this.selectedSource.value);
  }

  clearSelection(): void {
    this.selectedSource.setValue(null, { emitEvent: false });
    this.selected.set(null);
    this.getChange(null);
  }

  onSelect(item: IPayFromSource): void {
    if (item.soon) {
      return;
    }
    this.open.set(false);
    this.selectedSource.setValue(item, { emitEvent: false });
    this.selected.set(item);
    this.getChange(item);
  }
}

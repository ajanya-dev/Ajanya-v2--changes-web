import {
  Component,
  effect,
  forwardRef,
  signal,
  type OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatTooltip } from '@angular/material/tooltip';
import { LucideAngularModule, Star, Wallet } from 'lucide-angular';

import type { IWalletData } from 'src/app/models/wallet';
import { WalletsActions } from 'src/app/modules/store/wallets/wallets.actions';
import { WalletDropdownV4Component } from 'src/app/shared/components/v4/dropdowns/wallet-dropdown-v4/wallet-dropdown-v4.component';
import { ScrollToEndDirective } from 'src/app/directive/scroll-to-end.directive';
import { SpDropdownShellComponent } from '../dropdown-shell/sp-dropdown-shell.component';

@Component({
  selector: 'app-sp-wallet-dropdown',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    MatTooltip,
    ScrollToEndDirective,
    SpDropdownShellComponent
  ],
  templateUrl: './sp-wallet-dropdown.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SpWalletDropdownComponent),
      multi: true
    }
  ]
})
export class SpWalletDropdownComponent
  extends WalletDropdownV4Component
  implements OnInit
{
  override readonly WalletIcon = Wallet;
  override readonly StarIcon = Star;

  readonly open = signal(false);
  readonly term = signal('');
  readonly selected = signal<IWalletData | null | undefined>(null);

  private wasOpen = false;

  constructor() {
    super();

    this.selectedWallet.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((value) => this.selected.set(value ?? null));

    effect(
      () => {
        const isOpen = this.open();
        if (isOpen === this.wasOpen) {
          return;
        }
        this.wasOpen = isOpen;
        this.isDropdownOpen = isOpen;
        if (!isOpen) {
          this.term.set('');
        }
        this.dropdownOpenChange.emit(isOpen);
      },
      { allowSignalWrites: true }
    );
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.store.dispatch(
      WalletsActions.loadWallets({
        searchTerm: '',
        context: this.getPermissionContext(),
        isReload: true,
        disablePermission: true
      })
    );
  }

  clearSelection(): void {
    this.selectedWallet.setValue(undefined);
    this.clear();
  }

  close(): void {
    this.open.set(false);
  }

  onSelectWallet(wallet: IWalletData): void {
    this.open.set(false);
    this.selectedWallet.setValue(wallet);
  }

  onSearchInput(value: string): void {
    this.term.set(value);
    this.search({
      type: 'keyup',
      target: { value }
    } as unknown as KeyboardEvent);
  }

  onStarClick(event: Event, wallet: IWalletData): void {
    event.stopPropagation();
    // Favouriting is not a selection: the reference leaves the list open so a
    // second star can be set without reopening it.
    this.starClick.emit(wallet);
  }

  getWalletDisplayName(wallet: IWalletData): string {
    return wallet.walletName ?? wallet.bankAccountNickName ?? '';
  }

  getWalletBalance(wallet: IWalletData): string {
    const balance = wallet.availableBalance ?? wallet.currentBalance ?? '0.00';
    return `$${Number(balance).toFixed(2)}`;
  }

  getMaskedAccount(wallet: IWalletData): string {
    const num = wallet.bankAccountNumber;
    return num ? `•••• ${num.slice(-4)}` : '';
  }
}

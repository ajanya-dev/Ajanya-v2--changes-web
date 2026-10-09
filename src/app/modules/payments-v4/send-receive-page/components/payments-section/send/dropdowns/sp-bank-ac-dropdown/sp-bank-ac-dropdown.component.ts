import {
  ChangeDetectionStrategy,
  Component,
  effect,
  forwardRef,
  inject,
  input,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatTooltip } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import {
  LucideAngularModule,
  BadgeCheck,
  ChevronRight,
  Landmark,
  Plus,
  Star
} from 'lucide-angular';

import type { IBankDropdown } from 'src/app/models/bank';
import { BankAcDropdownV4Component } from 'src/app/shared/components/v4/dropdowns/bank-ac-dropdown-v4/bank-ac-dropdown-v4.component';
import { ScrollToEndDirective } from 'src/app/directive/scroll-to-end.directive';
import { SpDropdownShellComponent } from '../dropdown-shell/sp-dropdown-shell.component';
import { BankVerificationModalV4Component } from 'src/app/modules/user/user-v4/modals/bank-verification-modal-v4/bank-verification-modal-v4.component';
import { ConfirmMicroDepositModalV4Component } from 'src/app/modules/user/user-v4/modals/confirm-micro-deposit-modal-v4/confirm-micro-deposit-modal-v4.component';

@Component({
  selector: 'app-sp-bank-ac-dropdown',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    MatTooltip,
    ScrollToEndDirective,
    SpDropdownShellComponent
  ],
  templateUrl: './sp-bank-ac-dropdown.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SpBankAcDropdownComponent),
      multi: true
    }
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpBankAcDropdownComponent extends BankAcDropdownV4Component {
  readonly LandmarkIcon = Landmark;
  readonly VerifiedIcon = BadgeCheck;
  readonly ChevronRightIcon = ChevronRight;
  override readonly PlusIcon = Plus;
  override readonly StarIcon = Star;

  // Overridable so a sibling section can relabel the same control.
  readonly label = input('Select a bank account');
  readonly tooltip = input('Choose the specific account to pay from.');
  readonly required = input(false);

  readonly open = signal(false);
  readonly term = signal('');
  readonly selected = signal<IBankDropdown | null | undefined>(null);

  private wasOpen = false;
  private dialog = inject(MatDialog);

  constructor() {
    super();

    this.selectedBankAccount.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((value) => this.selected.set(value ?? null));

    effect(
      () => {
        const isOpen = this.open();
        if (isOpen === this.wasOpen) {
          return;
        }
        this.wasOpen = isOpen;
        if (isOpen) {
          this.dropdownOpen.emit();
        } else {
          this.term.set('');
          this.onDropdownClose();
        }
      },
      { allowSignalWrites: true }
    );
  }

  override clearSelection(): void {
    this.selectedBankAccount.setValue(null);
    this.clear();
  }

  override close(): void {
    this.open.set(false);
  }

  override addNewBankAccount(): void {
    this.open.set(false);
    super.addNewBankAccount();
  }

  onSelectBank(bank: IBankDropdown): void {
    if (bank.id === this.disableSelectionId()) {
      return;
    }
    this.open.set(false);
    this.selectedBankAccount.setValue(bank);
  }

  onSearchInput(value: string): void {
    this.term.set(value);
    this.search({
      type: 'keyup',
      target: { value }
    } as unknown as KeyboardEvent);
  }

  onStarClick(event: Event, bank: IBankDropdown): void {
    event.stopPropagation();
    if (!this.isStarEnabled(bank)) {
      return;
    }
    // Favouriting is not a selection: the reference leaves the list open so a
    // second star can be set without reopening it.
    this.starClick.emit(bank);
  }

  /** Row-level "Verify" / "Confirm deposit" link: opens the same modals the bank table uses. */
  onVerifyClick(event: Event, bank: IBankDropdown): void {
    event.stopPropagation();
    this.open.set(false);
    if (this.getVerificationState(bank) === 'confirmMD') {
      this.dialog.open(ConfirmMicroDepositModalV4Component, {
        width: '100%',
        maxWidth: '480px',
        panelClass: 'paddingless-modal-rounded',
        disableClose: true,
        data: { bankAccountId: bank.id }
      });
      return;
    }
    this.dialog.open(BankVerificationModalV4Component, {
      width: '100%',
      maxWidth: '480px',
      panelClass: 'paddingless-modal-rounded',
      disableClose: true,
      data: { bankId: bank.id, bankDetails: { verifiedBy: bank.verifiedBy } }
    });
  }

  getBankDisplayName(bank: IBankDropdown): string {
    return bank.nickName ?? bank.name ?? '';
  }

  /** "xxxx8547" -> "••8547": shorter and reads as a mask, not as data. */
  maskAccount(bank: IBankDropdown): string {
    return String(bank.accountNumber ?? '').replace(/^[xX*•]+/, '••');
  }

  getBankSubText(bank: IBankDropdown): string {
    return [bank.bankName, this.maskAccount(bank)].filter(Boolean).join(' ').trim();
  }

  isAchBadgeVisible(bank: IBankDropdown): boolean {
    return (
      (!!bank.isItZil || bank.achApplicationStatus === 1) &&
      (Number(bank.verifiedBy) === 1 || Number(bank.verified) === 1)
    );
  }

  getVerificationState(
    bank: IBankDropdown
  ): 'verified' | 'confirmMD' | 'pending' | 'notVerified' {
    if (Number(bank.verifiedBy) === 1 || Number(bank.verified) === 1) {
      return 'verified';
    }
    if (Number(bank.verifiedBy) === 3) {
      return 'confirmMD';
    }
    if (Number(bank.verifiedBy) === 4) {
      return 'pending';
    }
    return 'notVerified';
  }
}

import {
  ChangeDetectionStrategy,
  Component,
  effect,
  forwardRef,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatTooltip } from '@angular/material/tooltip';
import { LucideAngularModule, CreditCard, Plus, Star } from 'lucide-angular';

import type { IExistingCreditCards } from 'src/app/models/payment-switch-board';
import { CardsDropdownV4Component } from 'src/app/shared/components/v4/dropdowns/cards-dropdown-v4/cards-dropdown-v4.component';
import { OpenAddCardV4Service } from 'src/app/shared/service/open-add-card/open-add-card-v4.service';
import { SpDropdownShellComponent } from '../dropdown-shell/sp-dropdown-shell.component';

@Component({
  selector: 'app-sp-cards-dropdown',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    MatTooltip,
    SpDropdownShellComponent
  ],
  templateUrl: './sp-cards-dropdown.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SpCardsDropdownComponent),
      multi: true
    }
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpCardsDropdownComponent extends CardsDropdownV4Component {
  override readonly CreditCardIcon = CreditCard;
  override readonly PlusIcon = Plus;
  override readonly StarIcon = Star;

  /** The add-card modal is fetched before it opens; the row says so meanwhile. */
  readonly addingCard = inject(OpenAddCardV4Service).isLoading;

  readonly open = signal(false);
  readonly term = signal('');
  readonly selected = signal<IExistingCreditCards | null | undefined>(null);

  private wasOpen = false;

  constructor() {
    super();

    this.selectedCard.valueChanges
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
          this.onDropdownOpen();
        } else {
          this.term.set('');
        }
      },
      { allowSignalWrites: true }
    );
  }

  /**
   * Clearing is not closing. The base calls this on its way into the add-card
   * modal, so closing here shut the list before the row could say it was
   * opening. The reference clears the selection and leaves the list up.
   */
  override clearSelection(): void {
    this.selectedCard.setValue(undefined);
  }

  close(): void {
    this.open.set(false);
  }

  override addNewCard(
    gatewayTypeOverride?: number,
    fromTransLimitApi?: boolean
  ): void {
    if (this.addingCard()) {
      return;
    }
    super.addNewCard(gatewayTypeOverride, fromTransLimitApi);
  }

  get visibleCards(): IExistingCreditCards[] {
    const search = this.term().trim().toLowerCase();
    if (!search) {
      return this.cards;
    }
    return this.cards.filter(
      (card) =>
        card.nickName?.toLowerCase().includes(search) ||
        card.cardMasked?.toLowerCase().includes(search) ||
        card.last4?.includes(search) ||
        card.cardType?.toLowerCase().includes(search)
    );
  }

  onSearchInput(value: string): void {
    this.term.set(value);
  }

  onSelectCard(card: IExistingCreditCards): void {
    this.open.set(false);
    this.selectedCard.setValue(card);
  }

  onStarClick(event: Event, card: IExistingCreditCards): void {
    event.stopPropagation();
    // Favouriting is not a selection: the reference leaves the list open so a
    // second star can be set without reopening it.
    this.starClick.emit(card);
  }

  getCardTitle(card: IExistingCreditCards): string {
    return card.nickName || this.getCardMaskedLast4(card);
  }

  getCardMaskedLast4(card: IExistingCreditCards): string {
    const last4 = card.last4 ?? card.cardMasked?.slice(-4) ?? '****';
    return `•••• ${last4}`;
  }
}

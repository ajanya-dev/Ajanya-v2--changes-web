import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  ViewEncapsulation,
  effect,
  inject,
  input,
  output,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgSelectModule } from '@ng-select/ng-select';
import { Store } from '@ngrx/store';
import { LucideAngularModule, Check, LoaderCircle } from 'lucide-angular';
import { Observable, Subscription, debounceTime, take } from 'rxjs';
import { IV3DropDownOnReady } from 'src/app/models/common';
import { IExistingCreditCards } from 'src/app/models/payment-switch-board';
import { CardsActions } from 'src/app/modules/store/cards/cards.actions';
import {
  selectCards,
  selectIsCardsLoading
} from 'src/app/modules/store/cards/cards.selectors';

/**
 * @description V4 Drop down component for cards with multi select.
 */
@Component({
  standalone: true,
  imports: [
    CommonModule,
    NgSelectModule,
    FormsModule,
    MatTooltipModule,
    LucideAngularModule
  ],
  selector: 'app-cards-multi-select-dropdown-v4',
  templateUrl: './cards-multi-select-dropdown-v4.component.html',
  styleUrls: ['./cards-multi-select-dropdown-v4.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class CardsMultiSelectDropdownV4Component
  implements OnInit, AfterViewInit
{
  private store = inject(Store);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  readonly CheckIcon = Check;
  readonly LoaderIcon = LoaderCircle;

  placeholder = input('All Cards');
  appendTo = input('body');
  sliceNumber = input<number>(5);
  isSliceNeed = input<boolean>(true);
  selectedCardIds = input<string[]>([]);

  selectionEvent = output<IExistingCreditCards[]>();
  ready = output<IV3DropDownOnReady>();

  cards = signal<IExistingCreditCards[]>([]);
  selectedCards = signal<IExistingCreditCards[]>([]);
  selectIsCardsLoading$: Observable<boolean>;

  constructor() {
    effect(
      () => {
        const ids = this.selectedCardIds();
        if (ids?.length) {
          this.setItemsWithIds(ids);
        }
      },
      { allowSignalWrites: true }
    );
  }

  ngOnInit(): void {
    this.initStoreSelectors();
  }

  ngAfterViewInit(): void {
    this.ready.emit({
      setItemWithId: this.setItemWithId
    });
  }

  private initStoreSelectors(): void {
    this.store.dispatch(CardsActions.loadCards({ showAllCards: false }));
    this.store
      .select(selectCards)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.cards.set(res ?? []);
        this.cdr.detectChanges();
      });
    this.selectIsCardsLoading$ = this.store.select(selectIsCardsLoading);
  }

  /**
   * Adds a card with the given ID to the current selection once cards finish loading.
   * Matches the v3 `setItemWithId` API but adapted for multi-select (dedupes existing).
   */
  setItemWithId = (id: string): void => {
    this.setItemsWithIds([id]);
  };

  /**
   * Preloads multiple cards by ID once the store finishes loading.
   */
  setItemsWithIds = (ids: string[]): void => {
    if (!ids?.length) return;
    let loadingSubscription: Subscription;
    // eslint-disable-next-line prefer-const
    loadingSubscription = this.selectIsCardsLoading$
      .pipe(debounceTime(100), take(2))
      .subscribe((isLoading) => {
        if (!isLoading) {
          const matched = this.cards().filter((c) => ids.includes(c.cardId));
          if (matched.length) {
            const existing = this.selectedCards();
            const seen = new Set(existing.map((c) => c.cardId));
            const merged = [
              ...existing,
              ...matched.filter((c) => !seen.has(c.cardId))
            ];
            this.selectedCards.set(merged);
            this.selectionEvent.emit(merged);
            this.cdr.detectChanges();
          }
          loadingSubscription.unsubscribe();
        }
      });
  };

  compareById = (a: IExistingCreditCards, b: IExistingCreditCards): boolean =>
    a?.cardId === b?.cardId;

  onChange(event: IExistingCreditCards[]): void {
    const value = Array.isArray(event) ? event : [];
    this.selectedCards.set(value);
    this.selectionEvent.emit(value);
  }

  clear(): void {
    this.selectedCards.set([]);
    this.selectionEvent.emit([]);
  }

  clearItem(cardId: string): void {
    const next = this.selectedCards().filter((c) => c.cardId !== cardId);
    this.selectedCards.set(next);
    this.selectionEvent.emit(next);
  }

  getMoreItemsTooltip(items: IExistingCreditCards[]): string {
    return (items ?? []).map((i) => i.nickName).join(', ');
  }
}

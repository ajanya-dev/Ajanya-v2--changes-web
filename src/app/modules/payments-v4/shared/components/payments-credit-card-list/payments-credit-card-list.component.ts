import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  effect,
  inject,
  input,
  output,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, filter, take } from 'rxjs';
import {
  LucideAngularModule,
  Search,
  X,
  CreditCard,
  Plus
} from 'lucide-angular';
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngrx/store';

import type { IExistingCreditCards } from 'src/app/models/payment-switch-board';
import { IHeaderData } from 'src/app/layout/model/header';
import { CardsActions } from 'src/app/modules/store/cards/cards.actions';
import { selectCards, selectCardsStates, selectIsCardsLoading } from 'src/app/modules/store/cards/cards.selectors';
import { OpenAddCardV4Service } from 'src/app/shared/service/open-add-card/open-add-card-v4.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { MapSourceWithBusinessModalV4Component } from 'src/app/modules/payments/shared/modal/v4/map-source-with-business-modal-v4/map-source-with-business-modal-v4.component';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';

@Component({
  selector: 'app-payments-credit-card-list',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './payments-credit-card-list.component.html',
  styleUrl: './payments-credit-card-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaymentsCreditCardListComponent implements OnInit {
  private store = inject(Store);
  private openAddCardService = inject(OpenAddCardV4Service);
  private destroyRef = inject(DestroyRef);
  private dialog = inject(MatDialog);
  private alertService = inject(V4AlertService);
  private headerService = inject(HeaderService);
  public paymentsService = inject(PaymentsService);

  cardId = input<string | null>(null);
  preSelectedCard = input<IExistingCreditCards | null>(null);
  gatewayType = input<number | undefined>(undefined);
  cardSelected = output<IExistingCreditCards | null>();
  closeParentModal = output<void>();

  readonly cards = signal<IExistingCreditCards[]>([]);
  readonly loading = signal(true);
  readonly selectedCard = signal<IExistingCreditCards | null>(null);
  searchTerm = '';
  private selectNewlyAdded = false;
  private allCards: IExistingCreditCards[] = [];
  /** widened locally — the API also returns 4, which the shared header model predates */
  private creditCardGatewaySwitchingStatus: 1 | 2 | 3 | 4;

  readonly SearchIcon = Search;
  readonly XIcon = X;
  readonly CreditCardIcon = CreditCard;
  readonly PlusIcon = Plus;
  readonly addingCard = this.openAddCardService.isLoading;

  gatewayTypeEffect = effect(() => {
    const gatewayType = this.gatewayType();
    const selectedCard = this.selectedCard();
    if (selectedCard && gatewayType !== undefined && gatewayType !== null) {
      if (Number(selectedCard.gatewayType) !== Number(gatewayType)) {
        this.alertService
          .infoAlert({
            content: `This payment amount requires you to reselect your card. Please select your card again to continue. If your card is not listed, please add it again to proceed.`,
            isOk: true
          })
          .afterClosed()
          .subscribe(() => {
            this.selectedCard.set(null);
            this.cardSelected.emit(null);
          });
      }
    }
  }, { allowSignalWrites: true });

  ngOnInit(): void {
    this.store.select(selectCardsStates).pipe(take(1)).subscribe((state) => {
      if (!state.cards.length && !state.isLoading) {
        this.store.dispatch(CardsActions.loadCards({ showAllCards: true }));
      }
    });

    this.store
      .select(selectCards)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((cards) => {
        this.allCards = cards ?? [];
        // Every saved card is listed — no gateway-type filtering is applied here.
        this.cards.set(this.allCards);
        if (this.selectNewlyAdded && cards?.length) {
          this.selectNewlyAdded = false;
          this.selectCard(cards[cards.length - 1]);
        }
      });

    this.store
      .select(selectIsCardsLoading)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((loading) => this.loading.set(loading));

    this.getHeaderData();

    const direct = this.preSelectedCard();
    // Prefer looking up the fresh card from the store by id — the object
    // hanging off IPaymentDetails.source does not carry isMapped, so using it
    // as-is incorrectly triggers the "Map Card to Business" warning on edit.
    const directId = direct?.id ?? direct?.cardId ?? null;
    if (directId) {
      this.setCardById(directId);
    } else if (direct) {
      this.selectCard(direct);
    } else if (this.cardId()) {
      this.setCardById(this.cardId());
    }
  }

  private getHeaderData(): void {
    // eslint-disable-next-line no-underscore-dangle
    this.headerService._headerData
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        const headerData = res as unknown as IHeaderData;
        this.creditCardGatewaySwitchingStatus =
          headerData.credit_card_gateway_switching_status;
      });
  }

  private isGatewaySwitchingBypassed(): boolean {
    // Matches v3: both 3 and 4 bypass gateway switching.
    return (
      this.creditCardGatewaySwitchingStatus === 3 ||
      this.creditCardGatewaySwitchingStatus === 4
    );
  }

  setCardById(id: string | null): void {
    if (!id) return;
    this.store
      .select(selectCards)
      .pipe(
        filter((cards) => !!cards?.length),
        debounceTime(100),
        take(1),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((cards) => {
        const card = (cards ?? []).find((c) => c.id === id || c.cardId === id);
        if (card) {
          this.selectCard(card);
        }
      });
  }

  clearSearch(): void {
    this.searchTerm = '';
  }

  get isFilterOn(): boolean {
    return this.searchTerm.trim().length > 0;
  }

  get displayedCards(): IExistingCreditCards[] {
    return this.cards().slice(0, 3);
  }

  get filteredCards(): IExistingCreditCards[] {
    const term = this.searchTerm.toLowerCase();
    return this.cards().filter(
      (c) =>
        c.nickName?.toLowerCase().includes(term) ||
        c.cardMasked?.toLowerCase().includes(term) ||
        c.last4?.includes(term) ||
        c.cardType?.toLowerCase().includes(term)
    );
  }

  onCardClick(card: IExistingCreditCards): void {
    this.paymentsService.clearGatewaySkip();
    this.selectCard(card);
  }

  selectCard(card: IExistingCreditCards): void {
    if (!(card as IExistingCreditCards & { isMapped?: boolean }).isMapped) {
      this.handleUnmappedCard(card);
      return;
    }
    if (
      card.notAvailableGateway &&
      !this.paymentsService.isGatewaySkip(card.cardId)
    ) {
      this.addCardWithPrefill(card, card.notAvailableGateway);
      return;
    }
    this.selectedCard.set(card);
    this.cardSelected.emit(card);
  }

  private handleUnmappedCard(card: IExistingCreditCards): void {
    this.alertService.warningAlert({
      title: 'Warning',
      content: 'This card is not mapped to a business. Please map the card to a business to continue.',
      doneMsg: 'Map Card to Business'
    }).afterClosed().subscribe(() => {
      const dialogRef = this.dialog.open(MapSourceWithBusinessModalV4Component, {
        maxWidth: '430px',
        width: '100%',
        disableClose: true,
        autoFocus: false,
        panelClass: 'paddingless-modal-rounded',
        data: { type: 'card', card }
      });

      dialogRef.afterClosed().subscribe((res) => {
        if (res?.addNewBusiness) {
          this.closeParentModal.emit();
          return;
        }
        if (res?.success) {
          const mappedCard = { ...card, isMapped: true } as IExistingCreditCards;
          // Reload cards to get updated mapping status from backend
          this.store.dispatch(CardsActions.loadCards({showAllCards:true}));
          this.selectedCard.set(mappedCard);
          this.cardSelected.emit(mappedCard);
          this.alertService.successAlert({ content: 'Card mapped to business successfully.', timeout: 3000 });
        }
      });
    });
  }

  removeSelectedCard(): void {
    this.selectedCard.set(null);
    this.cardSelected.emit(null);
  }

  clearSelection(): void {
    this.selectedCard.set(null);
    this.cardSelected.emit(null);
  }

  populateDuplicateCard(card: IExistingCreditCards): void {
    if (!card?.cardId) return;
    const exists = this.allCards.some((c) => c.cardId === card.cardId);
    if (!exists) {
      this.store.dispatch(CardsActions.addCard({ card }));
    }
    this.selectedCard.set(card);
    this.cardSelected.emit(card);
  }

  addCardWithPrefill(card: IExistingCreditCards, gatewayType: number): void {
    if (this.openAddCardService.isLoading()) return;
    this.clearSelection();

    this.openAddCardService
      .openAddCardWithPrefill(card.cardId, gatewayType, card.nickName ?? '', card.bgColor ?? '', card.allowSkipGatewayAddition)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((dialogRef) => {
        if (!dialogRef) {
          this.addNewCard(gatewayType, true);
          return;
        }
        dialogRef.afterClosed().subscribe((res) => {
          if (res?.success) {
            this.selectNewlyAdded = true;
            this.store.dispatch(CardsActions.loadCards({ showAllCards: true }));
          } else if (res?.skipGatewayAddition) {
            this.paymentsService.markGatewaySkip(card.cardId);
            this.selectedCard.set(card);
            this.cardSelected.emit(card);
          } else if (res?.cardCreated) {
            // Backed out of "Confirm Card": the card exists (unconfirmed).
            this.store.dispatch(CardsActions.loadCards({ showAllCards: true }));
          }
        });
      });
  }

  addNewCard(gatewayTypeOverride?: number, fromTransLimitApi?: boolean): void {
    if (this.addingCard()) return;
    this.clearSelection();

    let gatewayTypeParam: number | undefined;
    if (fromTransLimitApi === true) {
      gatewayTypeParam = gatewayTypeOverride;
    } else if (this.isGatewaySwitchingBypassed()) {
      gatewayTypeParam = undefined;
    } else {
      gatewayTypeParam = this.gatewayType();
    }

    this.openAddCardService
      .openAddCard(gatewayTypeParam)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((dialogRef) => {
        dialogRef?.afterClosed().subscribe((res) => {
          if (res?.success) {
            this.selectNewlyAdded = true;
            this.store.dispatch(CardsActions.loadCards({ showAllCards: true }));
          } else if (res?.cardCreated) {
            // Backed out of "Confirm Card": the card exists (unconfirmed).
            this.store.dispatch(CardsActions.loadCards({ showAllCards: true }));
          }
        });
      });
  }

  getDisplayName(card: IExistingCreditCards): string {
    const last4 = card.last4 ?? card.cardMasked?.slice(-4) ?? '****';
    return `**** **** **** ${last4}`;
  }

  getSubText(card: IExistingCreditCards): string {
    return card.nickName ?? '';
  }
}

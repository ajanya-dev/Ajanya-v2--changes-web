import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  computed,
  Input
} from '@angular/core';
import { Subscription } from 'rxjs';
import { CybersourceService } from 'src/app/shared/service/cybersource/cybersource.service';
import { CardsDataServiceService } from 'src/app/modules/cards/services/cards-data-service.service';
import { MatDialog } from '@angular/material/dialog';
import { NewCreditCardModalComponent } from 'src/app/shared/modal/cyber-source-modals/new-credit-card-modal/new-credit-card-modal.component';
import {
  PsbSteps,
  IExistingCreditCards
} from 'src/app/models/payment-switch-board';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { Store } from '@ngrx/store';
import { CardsActions } from 'src/app/modules/store/cards/cards.actions';
import { MatIcon } from '@angular/material/icon';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { MatTooltip } from '@angular/material/tooltip';
import {
  FaIconComponent,
  FontAwesomeModule
} from '@fortawesome/angular-fontawesome';
import { NgClass, JsonPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import {
  faTrash,
  faEllipsisVertical,
  faEdit
} from '@fortawesome/pro-solid-svg-icons';
import { V35CommonDropDownSelectorComponent } from '../../../../../../shared/v3/v35-dropdown/v35-common-dropdown-selector.component';
import { CommonListSkeltonComponent } from '../../../../../../shared/v3/common-components/common-list-skelton/common-list-skelton.component';
import { TruncatePipe } from '../../../../../../pipes/truncate.pipe';
import { SearchFilterPipe } from '../../../../../../pipes/search-filter.pipe';

/**
 * @class
 * @description Credit card list component. used in card page in v3. shown when user selects credit cards tab in cards list base component.
 */
@Component({
  selector: 'app-credit-cards-list-ocw-v35',
  templateUrl: './credit-cards-ocw-v35.component.html',
  styleUrls: ['./credit-cards-ocw-v35.component.scss'],
  standalone: true,
  imports: [
    V35CommonDropDownSelectorComponent,
    FormsModule,
    NgClass,
    FaIconComponent,
    MatTooltip,
    MatMenuTrigger,
    MatMenu,
    MatMenuItem,
    MatIcon,
    CommonListSkeltonComponent,
    JsonPipe,
    TruncatePipe,
    SearchFilterPipe,
    FontAwesomeModule
  ]
})
export class CreditCardsOcwV35Component implements OnInit, OnDestroy {
  @Input() resize = false;

  private cyberSourceService = inject(CybersourceService);
  private cardsDataService = inject(CardsDataServiceService);
  private dialog = inject(MatDialog);
  private alertService = inject(AlertService);
  private headerService = inject(HeaderService);
  private store = inject(Store);
  private sharedService = inject(SharedService);

  subscriptions: Subscription[] = [];
  totalAmount = 0;
  pageId: PsbSteps = 'select_card';
  faEllipsis = faEllipsisVertical;
  faEdit = faEdit;
  faTrash = faTrash;

  cardList = computed(() => this.cardsDataService.cardsData().cards);
  loading = computed(() => this.cardsDataService.cardsData().isLoading);
  searchKey = computed(() => this.cardsDataService.cardsData().searchTerm);
  selectedCard = computed(
    () => this.cardsDataService.cardsData().selectedCards.creditCard
  );

  set SelectorSelectedValue(card: string) {
    const c = JSON.parse(card);
    this.selectCard(c);
  }

  ngOnInit(): void {
    this.cardsDataService.cardsData.update((cardsData) => ({
      ...cardsData,
      searchTerm: ''
    }));
    this.getCards();
    this.observeNewCardAdded();
  }

  /**
   * @description Getting all the cards from api. and setting necessary data to varaibles , and sending Selected card to service to show it in details page.
   */
  private async getCards() {
    await this.cardsDataService.getCreditCards();

    if (this.cardList().length) {
      let toSelectCard = this.cardList()[0];
      if (this.selectedCard()) {
        toSelectCard = this.cardList().filter(
          (card) => card.cardId === this.selectedCard()?.cardId
        )[0];
      }
      this.cardsDataService.cardsData.update((currentCardsData) => ({
        ...currentCardsData,
        selectedCards: {
          creditCard: toSelectCard
        }
      }));

      this.cardsDataService.setCreditCard(toSelectCard);
    }
  }

  /**
   * @description Oberving to get an event if a new card added from details component. if any, updating cards list.
   */
  observeNewCardAdded() {
    this.cardsDataService.newCardAddedSubject.subscribe(async () => {
      await this.cardsDataService.getCreditCards();
    });
  }

  /**
   * @description Selecting a card, Sending Selected card to service to show it in details page.
   */
  selectCard(card: IExistingCreditCards) {
    this.sharedService.selectedPayees.reset();
    this.cardsDataService.setCreditCard(card);
    this.cardsDataService.cardsData.update((currentCardsData) => ({
      ...currentCardsData,
      selectedCards: {
        ...currentCardsData.selectedCards,
        creditCard: card
      }
    }));
  }

  addNewButtonClick() {
    this.cardsDataService.openAddNewModal('credit');
  }

  selectAll() {
    this.sharedService.selectedPayees.reset();
    this.cardsDataService.cardsData.update((currentCardsData) => ({
      ...currentCardsData,
      selectedCards: {
        ...currentCardsData.selectedCards,
        creditCard: undefined
      }
    }));
    this.cardsDataService.setCreditCard(undefined);
  }

  /**
   * Deletes Credit Card
   * @param card - {IExistingCreditCards} passed as from cardList00
   */
  deleteCard(card: IExistingCreditCards) {
    this.alertService
      .confirmAlert({
        content: 'Are you sure you want to delete this card permanently?'
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.subscriptions.push(
            this.cyberSourceService
              .deleteCard(card.cardId)
              .subscribe((cRes) => {
                if (cRes?.success) {
                  this.cardsDataService.cardsData.update(
                    (currentCardsData) => ({
                      ...currentCardsData,
                      cards: currentCardsData.cards.filter(
                        (c) => c.cardId !== card.cardId
                      ),
                      isLoading: false,
                      isError: false
                    })
                  );
                  this.cardsDataService.cardsData.update(
                    (currentCardsData) => ({
                      ...currentCardsData,
                      selectedCards: {
                        ...currentCardsData.selectedCards,
                        creditCard: currentCardsData.cards[0]
                      }
                    })
                  );
                  this.cardsDataService.setCreditCard(
                    this.cardsDataService.cardsData().cards[0]
                  );

                  this.store.dispatch(CardsActions.loadCards({ showAllCards: false }));
                  this.alertService.successAlert({
                    content: 'Deleted Successfully'
                  });
                  this.headerService.refreshDynamicHeader.next(true);
                }
              })
          );
        }
      });
  }

  /**
   * Edits nickname of Credit Card
   * @param card - {IExistingCreditCards} passed as from cardList
   * @returns
   */
  editCard(card: IExistingCreditCards) {
    if (card) {
      this.selectCard(card);
      this.dialog
        .open(NewCreditCardModalComponent, {
          width: '400px',
          data: { mode: 'EDIT', cardId: card.cardId, nickName: card.nickName }
        })
        .afterClosed()
        .subscribe(() => {
          this.cardsDataService.getCreditCards();
        });
    }
  }

  /**
   * @description Matching Selected card with all cards when looping in template to to add special styles for the selected one.
   * @param card - accepts a credit card
   * @returns boolean, true if card is matched , else false
   */
  matchSelectedCard(card: IExistingCreditCards) {
    let selectedCard;
    let incomingCard;
    try {
      selectedCard = JSON.stringify(this.selectedCard());
      incomingCard = JSON.stringify(card);
    } catch (err) {
      return false;
    }
    return selectedCard === incomingCard;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((el) => el.unsubscribe());
  }
}

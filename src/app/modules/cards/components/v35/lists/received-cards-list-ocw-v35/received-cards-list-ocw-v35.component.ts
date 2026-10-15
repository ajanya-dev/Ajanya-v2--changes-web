import { Component, inject, OnInit, OnDestroy, computed } from '@angular/core';
import { Subscription } from 'rxjs';
import { ISendReceiveVirtualCard } from 'src/app/data/data/virtual-card';
import { CardsDataServiceService } from 'src/app/modules/cards/services/cards-data-service.service';
import { CommonLayoutToggleService } from 'src/app/shared/service/common/shared/common-layout/common-layout-toggle.service';
import { FormsModule } from '@angular/forms';
import { NgClass, JsonPipe } from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { SearchFilterPipe } from '../../../../../../pipes/search-filter.pipe';
import { TruncatePipe } from '../../../../../../pipes/truncate.pipe';
import { CommonListSkeltonComponent } from '../../../../../../shared/v3/common-components/common-list-skelton/common-list-skelton.component';
import { V35CommonDropDownSelectorComponent } from '../../../../../../shared/v3/v35-dropdown/v35-common-dropdown-selector.component';

/**
 * @class
 * @description Recieved card list component. used in card page in v3. shown when user selects recieved cards tab in cards list base component.
 */
@Component({
  selector: 'app-received-cards-list-ocw-v35',
  templateUrl: './received-cards-list-ocw-v35.component.html',
  styleUrls: ['./received-cards-list-ocw-v35.component.scss'],
  standalone: true,
  imports: [
    V35CommonDropDownSelectorComponent,
    FormsModule,
    NgClass,
    FaIconComponent,
    CommonListSkeltonComponent,
    JsonPipe,
    TruncatePipe,
    SearchFilterPipe
  ]
})
export class ReceivedCardsListOcwV35Component implements OnInit, OnDestroy {
  private cardsDataService = inject(CardsDataServiceService);
  private commonLayoutToggleService = inject(CommonLayoutToggleService);

  subscriptions: Subscription[] = [];
  selectedCard: ISendReceiveVirtualCard;
  showDropDown = false;
  resize = false;

  cardList = computed(() => this.cardsDataService.cardsData().receivedCards);
  loading = computed(() => this.cardsDataService.cardsData().isLoading);
  searchKey = computed(() => this.cardsDataService.cardsData().searchTerm);

  ngOnInit(): void {
    this.cardsDataService.cardsData.update((cardsData) => ({
      ...cardsData,
      searchTerm: ''
    }));
    this.getCards();
    this.checkResize();
  }

  checkResize(): void {
    this.subscriptions.push(
      this.commonLayoutToggleService.toggleChange$.subscribe((res) => {
        this.resize = res;
      })
    );
  }

  set selectorSelectedValue(card: string) {
    const selectedCard = JSON.parse(card);
    this.selectCard(selectedCard);
  }

  /**
   * @description Getting all the cards from api. and setting necessary data to varaibles , and sending Selected card to service to show it in details page.
   */
  private async getCards() {
    if (!this.cardList().length) {
      await this.cardsDataService.getReceivedCards(this.searchKey());
    }

    if (this.cardList().length) {
      this.selectedCard = this.cardList()[0];
      this.cardsDataService.setReceivedCard(this.cardList()[0]);
      this.cardsDataService.setNoReceivedCard(false);
      this.cardsDataService.cardsData.update((currentCardsData) => ({
        ...currentCardsData,
        selectedCards: {
          ...currentCardsData.selectedCards,
          receiveCard: this.cardList()[0]
        }
      }));
    } else {
      this.cardsDataService.setNoReceivedCard(true);
    }
  }

  /**
   * @description Selecting a card, Sending Selected card to service to show it in details page.
   */
  selectCard(card: ISendReceiveVirtualCard) {
    this.selectedCard = card;
    this.cardsDataService.setReceivedCard(card);
    this.cardsDataService.cardsData.update((currentCardsData) => ({
      ...currentCardsData,
      selectedCards: {
        ...currentCardsData.selectedCards,
        receiveCard: card
      }
    }));
  }

  /**
   * @description Toggling dropdown when the screen size in tablet size
   */
  toggleDropDown() {
    this.showDropDown = !this.showDropDown;
  }

  /**
   * @description Searching through cards. calling the same get cards api but with a search term.
   * @param ev - KeyBoard Event
   */
  search(ev: KeyboardEvent): void {
    if (ev?.key === 'Enter') {
      this.getCards();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((el) => el.unsubscribe());
  }
}

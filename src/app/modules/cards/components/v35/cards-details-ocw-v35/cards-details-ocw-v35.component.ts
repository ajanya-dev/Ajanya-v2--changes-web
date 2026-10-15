import { Component, computed, inject } from '@angular/core';

import { CardsDataServiceService } from '../../../services/cards-data-service.service';
import { RecievedCardsDetailsOcwV35Component } from '../details/received-cards-details-ocw-v35/received-cards-details-ocw-v35.component';
import { SentCardsDetailsOcwV35Component } from '../details/sent-cards-details-ocw-v35/sent-cards-details-ocw-v35.component';
import { CreditCardsDetailsOcwV35Component } from '../details/credit-cards-details-ocw-v35/credit-cards-details-ocw-v35.component';
import { ScrollListenerDirective } from '../../../../../directive/scroll-listner.directive';

/**
 * @description Cards details component for v35 cards page. it is a base component for details pages like credit, sent, recieved cads details components.
 * @class
 */
@Component({
  selector: 'app-cards-details-ocw-v35',
  templateUrl: './cards-details-ocw-v35.component.html',
  styleUrls: ['./cards-details-ocw-v35.component.scss'],
  standalone: true,
  imports: [
    ScrollListenerDirective,
    CreditCardsDetailsOcwV35Component,
    SentCardsDetailsOcwV35Component,
    RecievedCardsDetailsOcwV35Component
  ]
})
export class CardsDetailsOcwV35Component {
  private cardsDataService = inject(CardsDataServiceService);

  currentTab = computed(() => this.cardsDataService.cardsData().currentTab);
}

import { Component, computed, HostBinding, inject } from '@angular/core';
import { CommonLayoutV4Component } from 'src/app/layout/v4-layout/common-layout-v4/common-layout-v4.component';
import { CardsListV4Component } from '../../components/v4/cards-list-v4/cards-list-v4.component';
import { CardsHeaderV4Component } from '../../components/v4/cards-header-v4/cards-header-v4.component';
import { CardsDetailsV4Component } from '../../components/v4/cards-details-v4/cards-details-v4.component';
import { CardsTransactionsV4Component } from '../../components/v4/cards-transactions-v4/cards-transactions-v4.component';
import { CardsDataServiceService } from '../../services/cards-data-service.service';

@Component({
  selector: 'app-cards-ocw-v4',
  templateUrl: './cards-ocw-v4.component.html',
  styleUrls: ['./cards-ocw-v4.component.scss'],
  standalone: true,
  imports: [CommonLayoutV4Component]
})
export class CardsOcwV4Component {
  // min-h-[720px]: short screens scroll the page, not the panes (common-layout-v4).
  @HostBinding('class') hostClass = 'flex flex-col flex-1 min-h-[720px]';

  private cardsDataService = inject(CardsDataServiceService);

  headerComponent = CardsHeaderV4Component;
  listComponent = CardsListV4Component;
  detailsComponent = CardsDetailsV4Component;
  transactionsComponent = CardsTransactionsV4Component;

  transactionsPanelEmpty = computed(
    () => this.cardsDataService.cardsData().cards.length === 0
  );
}

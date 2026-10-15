import { Component } from '@angular/core';
import { CardsListOcwV35Component } from '../../components/v35/cards-list-ocw-v35/cards-list-ocw-v35.component';
import { CardsDetailsOcwV35Component } from '../../components/v35/cards-details-ocw-v35/cards-details-ocw-v35.component';
import { CommonLayoutV35Component } from '../../../../layout/v3-layout/common-layout-v35/common-layout-v35.component';

/**
 * @description Cards component for v3 cards page. it is a base component for pages like credit, sent, recieved cads  components.
 * @class
 */
@Component({
  selector: 'app-cards-ocw-v3',
  templateUrl: './cards-ocw-v3.component.html',
  styleUrls: ['./cards-ocw-v3.component.scss'],
  standalone: true,
  imports: [CommonLayoutV35Component]
})
export class CardsOcwV3Component {
  listComponent = CardsListOcwV35Component;
  detailsComponent = CardsDetailsOcwV35Component;
}

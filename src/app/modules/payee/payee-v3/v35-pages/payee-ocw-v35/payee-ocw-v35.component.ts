import { Component, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { PayeeDetailsOcwV35Component } from '../../v35-components/payee-details-ocw-v35/payee-details-ocw-v35.component';
import { PayeeListOcwV35Component } from '../../v35-components/payee-list-ocw-v35/payee-list-ocw-v35.component';
import { PayeeDataV35Service } from '../../v35-services/payee-data-v35.service';
import { CommonLayoutV35Component } from '../../../../../layout/v3-layout/common-layout-v35/common-layout-v35.component';

@Component({
  selector: 'app-payee-ocw-v35',
  templateUrl: './payee-ocw-v35.component.html',
  styleUrls: ['./payee-ocw-v35.component.scss'],
  standalone: true,
  imports: [CommonLayoutV35Component]
})
export class PayeeOcwV35Component {
  public payeeDataService = inject(PayeeDataV35Service);

  isGridView = true;
  subscriptions: Subscription[] = [];
  listComponent = PayeeListOcwV35Component;
  detailsComponent = PayeeDetailsOcwV35Component;
}

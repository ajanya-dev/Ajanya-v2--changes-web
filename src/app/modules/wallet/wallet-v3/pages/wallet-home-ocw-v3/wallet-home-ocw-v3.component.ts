import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { WalletListV35Component } from '../../components-V35/wallet-list-v35/wallet-list-v35.component';
import { WalletDetailsV35Component } from '../../components-V35/wallet-details-v35/wallet-details-v35.component';
import { WalletDataV35Service } from '../../services/wallet-data-v35.service';
import { CommonLayoutV35Component } from '../../../../../layout/v3-layout/common-layout-v35/common-layout-v35.component';

@Component({
  selector: 'app-wallet-home-ocw-v3',
  templateUrl: './wallet-home-ocw-v3.component.html',
  styleUrls: ['./wallet-home-ocw-v3.component.scss'],
  standalone: true,
  imports: [CommonLayoutV35Component]
})
export class WalletHomeOcwV3Component implements OnInit, OnDestroy {
  /* Injecting dependencies using inject method */
  public walletDataService = inject(WalletDataV35Service);

  /* Variables */
  subscriptions: Subscription[] = [];
  listComponent = WalletListV35Component;
  detailsComponent = WalletDetailsV35Component;

  ngOnInit() {
    this.loadWalletAccounts();
  }

  /**
   * @description Loads wallet accounts for the user.
   *
   */
  loadWalletAccounts() {
    this.walletDataService.setWallets();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}

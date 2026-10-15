import { Component, computed, HostBinding, OnInit, inject, Type } from '@angular/core';
import { CommonLayoutV4Component } from 'src/app/layout/v4-layout/common-layout-v4/common-layout-v4.component';
import { WalletHeaderV4Component } from '../../v4-components/wallet-header-v4/wallet-header-v4.component';
import { WalletListV4Component } from '../../v4-components/wallet-list-v4/wallet-list-v4.component';
import { WalletDetailsV4Component } from '../../v4-components/wallet-details-v4/wallet-details-v4.component';
import { WalletTransactionsV4Component } from '../../v4-components/wallet-transactions-v4/wallet-transactions-v4.component';
import { WalletDataV35Service } from '../../../wallet-v3/services/wallet-data-v35.service';

@Component({
  selector: 'app-wallet-ocw-v4',
  templateUrl: './wallet-ocw-v4.component.html',
  styleUrls: ['./wallet-ocw-v4.component.scss'],
  standalone: true,
  imports: [CommonLayoutV4Component]
})
export class WalletOcwV4Component implements OnInit {
  // min-h-[720px]: short screens scroll the page, not the panes (common-layout-v4).
  @HostBinding('class') hostClass = 'flex flex-col flex-1 min-h-[720px]';

  private walletDataService = inject(WalletDataV35Service);

  headerComponent = WalletHeaderV4Component;
  listComponent = WalletListV4Component;
  detailsComponent = WalletDetailsV4Component;
  transactionsComponent = computed<Type<unknown> | undefined>(() => {
    const data = this.walletDataService.walletAccountsSignal()?.data;
    return data && data.length > 0 ? WalletTransactionsV4Component : undefined;
  });

  ngOnInit() {
    this.loadWalletAccounts();
  }

  loadWalletAccounts() {
    this.walletDataService.setWallets();
  }
}

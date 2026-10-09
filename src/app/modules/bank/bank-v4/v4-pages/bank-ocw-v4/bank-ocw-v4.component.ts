import { Component, HostBinding, OnInit, computed, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonLayoutV4Component } from 'src/app/layout/v4-layout/common-layout-v4/common-layout-v4.component';
import { BankHeaderV4Component } from '../../v4-components/bank-header-v4/bank-header-v4.component';
import { BankListV4Component } from '../../v4-components/bank-list-v4/bank-list-v4.component';
import { BankDetailsV4Component } from '../../v4-components/bank-details-v4/bank-details-v4.component';
import { BankTransactionsV4Component } from '../../v4-components/bank-transactions-v4/bank-transactions-v4.component';
import { BankAccountsDataTableV4Component } from '../../v4-components/bank-accounts-data-table-v4/bank-accounts-data-table-v4.component';
import { BankDataV35Service } from '../../../bank-v3/v35-services/bank-data-v35.service';
import { BankDataV4Service } from '../../v4-services/bank-data-v4.service';

@Component({
  selector: 'app-bank-ocw-v4',
  templateUrl: './bank-ocw-v4.component.html',
  styleUrls: ['./bank-ocw-v4.component.scss'],
  standalone: true,
  imports: [CommonLayoutV4Component]
})
export class BankOcwV4Component implements OnInit {
  // min-h-[720px]: short screens scroll the page, not the panes (common-layout-v4).
  @HostBinding('class') hostClass = 'flex flex-col flex-1 min-h-[720px]';

  private bankDataService = inject(BankDataV35Service);
  private bankDataV4Service = inject(BankDataV4Service);
  private activatedRoute = inject(ActivatedRoute);

  headerComponent = BankHeaderV4Component;
  listComponent = BankListV4Component;
  detailsComponent = BankDetailsV4Component;
  transactionsComponent = BankTransactionsV4Component;
  listviewComponent = BankAccountsDataTableV4Component;

  /**
   * Mirrors the `@if` at the top of bank-transactions-v4's template. When that
   * guard is false the component renders nothing, and the layout would
   * otherwise hold a full-height empty slot (plus its gap) below the detail
   * card — the hole seen on the Audit Trail tab.
   */
  transactionsPanelEmpty = computed(() => {
    const tab = this.bankDataV4Service.selectedDetailsTab();
    return (
      !this.bankDataService.bankAccountCountSignal() ||
      (tab !== 'account' && tab !== 'all')
    );
  });

  ngOnInit() {
    this.loadBankAccounts();
  }

  loadBankAccounts() {
    const filterId = this.activatedRoute.snapshot.queryParams.id ?? undefined;
    this.bankDataService.setAccounts(undefined, filterId);
    this.bankDataService.setTotalBankAccountsCount();
  }
}

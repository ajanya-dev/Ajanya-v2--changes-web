import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BankDataV35Service } from '../../v35-services/bank-data-v35.service';
import { BankAccountsDetailsOcwV35Component } from '../../v35-components/bank-accounts-details-ocw-v35/bank-accounts-details-ocw-v35.component';
import { BankAccountsListOcwV35Component } from '../../v35-components/bank-accounts-list-ocw-v35/bank-accounts-list-ocw-v35.component';
import { CommonLayoutV35Component } from '../../../../../layout/v3-layout/common-layout-v35/common-layout-v35.component';

@Component({
  selector: 'app-bank-ocw-v35',
  templateUrl: './bank-ocw-v35.component.html',
  styleUrls: ['./bank-ocw-v35.component.scss'],
  standalone: true,
  imports: [CommonLayoutV35Component]
})
export class BankOcwV35Component implements OnInit {
  /* Injecting dependencies using inject method */
  public bankDataService = inject(BankDataV35Service);
  public activatedRotue = inject(ActivatedRoute);

  /**
   * Variables
   */
  listComponent = BankAccountsListOcwV35Component;
  detailsComponent = BankAccountsDetailsOcwV35Component;

  ngOnInit() {
    this.loadBankAccounts();
  }

  /**
   * @description Load first 300 bank accounts and select first bank account of the list
   */
  loadBankAccounts() {
    const filterId = this.getFilterId();
    this.bankDataService.setAccounts(undefined, filterId);
    this.bankDataService.setTotalBankAccountsCount();
  }

  getFilterId(): string | undefined {
    return this.activatedRotue.snapshot.queryParams.id ?? undefined;
  }
}

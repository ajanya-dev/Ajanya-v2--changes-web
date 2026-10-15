import { Component } from '@angular/core';
import { V3CommonTransactionTableComponent } from '../../../../v3-common-transactions-table/components/v3-common-transaction-table/v3-common-transaction-table.component';

/**
 * @description Ag grid table with bank acccount transaction details
 */
@Component({
  selector: 'app-bank-accounts-transactions-ocw-v35',
  templateUrl: './bank-accounts-transactions-ocw-v35.component.html',
  styleUrls: ['./bank-accounts-transactions-ocw-v35.component.scss'],
  standalone: true,
  imports: [V3CommonTransactionTableComponent]
})
export class BankAccountsTransactionsOcwV35Component {
  commonTransactionTableType = 'BANK';
}

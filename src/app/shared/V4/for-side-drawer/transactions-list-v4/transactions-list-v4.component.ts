import { Component, computed, input, signal } from '@angular/core';
import { PdDateTimeComponent } from 'src/app/shared/V4/pd-date-time/pd-date-time.component';

/** Single transaction row for display (input-driven; no API dependency). */
export interface ITransactionListEntry {
  date: string;
  description: string;
  amount: string;
  status: string;
  method: string;
}

@Component({
  standalone: true,
  selector: 'app-transactions-list-v4',
  templateUrl: './transactions-list-v4.component.html',
  styleUrls: ['./transactions-list-v4.component.scss'],
  imports: [PdDateTimeComponent]
})
export class TransactionsListV4Component {
  transactions = input<ITransactionListEntry[]>([]);
  total = input<string>('$0.00');
  title = input<string>('Last 10 Transactions from this Payer');
  showStatus = input<boolean>(true);
  showTotal = input<boolean>(true);
  /** Drop the outer card chrome so it can nest inside another card. */
  bare = input<boolean>(false);
  /** Rows shown before "Show more". */
  collapsedCount = input<number>(5);
  /** Force all rows (e.g. when the parent panel is expanded). */
  forceExpand = input<boolean>(false);
  /** Cap on the scroll area, so a host panel can shrink it to fit a tile. */
  maxHeight = input<string>('490px');
  dateHeading = input<string>('DATE');
  descriptionHeading = input<string>('DESCRIPTION');
  amountHeading = input<string>('AMOUNT');
  statusHeading = input<string>('STATUS');
  methodHeading = input<string>('METHOD');

  showAll = signal(false);
  visibleTransactions = computed(() =>
    this.showAll() || this.forceExpand()
      ? this.transactions()
      : this.transactions().slice(0, this.collapsedCount())
  );

  canShowMore = computed(
    () =>
      !this.forceExpand() && this.transactions().length > this.collapsedCount()
  );
}

import { Component, inject, OnDestroy, computed, effect } from '@angular/core';
import { Subscription } from 'dexie';
import { finalize } from 'rxjs/operators';
import {
  ISendRecievedVirtualCardInfo,
  IVirtualCardTxn
} from 'src/app/data/data/virtual-card';
import { VirtualCardService } from 'src/app/shared/service/virtual-card/virtual-card.service';
import { DatePipe, NgClass, CurrencyPipe, NgOptimizedImage } from '@angular/common';
import { CardsDataServiceService } from 'src/app/modules/cards/services/cards-data-service.service';
import { TruncatePipe } from '../../../../../../pipes/truncate.pipe';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { SentRecvCommonCardTableV35Component } from '../sent-recv-common-card-table-v35/sent-recv-common-card-table-v35.component';
import { MatTooltip } from '@angular/material/tooltip';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';

/**
 * @class
 * @description Sent card details component. used in card page in v3. shown when user selects sent cards tab in cards list component.
 */
@Component({
  selector: 'app-sent-cards-details-ocw-v35',
  templateUrl: './sent-cards-details-ocw-v35.component.html',
  styleUrls: ['./sent-cards-details-ocw-v35.component.scss'],
  standalone: true,
  imports: [
    NgClass,
    MatTooltip,
    SentRecvCommonCardTableV35Component,
    FaIconComponent,
    CurrencyPipe,
    TruncatePipe,
    NgOptimizedImage
  ]
})
export class SentCardsDetailsOcwV35Component implements OnDestroy {
  private virtualCardService = inject(VirtualCardService);
  private datePipe = inject(DatePipe);
  private cardsDataService = inject(CardsDataServiceService);

  subscriptions: Subscription[] = [];
  cardDetails: ISendRecievedVirtualCardInfo;
  cardLoading = true;
  cardTransactions: IVirtualCardTxn[] = [];
  page = 1;
  transactionItems: number;
  transactionLoading = false;
  limit = 10;
  tableId = DTTableId.sendVirtualCardTransactions;

  selectedCard = computed(
    () => this.cardsDataService.cardsData().selectedCards.sendCard
  );
  noCards = computed(
    () => this.cardsDataService.cardsData().sentCards.length === 0
  );
  loading = computed(() => this.cardsDataService.cardsData().isLoading);

  /**
   * @description Side effects for `this.selectedCard` signal changes.
   * It will be invoked for every changes to `selectedCard` signal.
   */
  cardSelectedEffect = effect(() => {
    if (this.selectedCard()) {
      this.cardLoading = false;
      this.getTransactionDetails();
      this.getCardDetails();
    }
  });

  /**
   * @description Getting Selected card details from api. Being called when user selects a card
   */
  getCardDetails(): void {
    this.cardLoading = true;
    this.subscriptions.push(
      this.virtualCardService
        .sendeCardDetails(this.selectedCard()?.id as string)
        .pipe(
          finalize(() => {
            this.cardLoading = false;
          })
        )
        .subscribe((res) => {
          this.cardDetails = res?.data;
        })
    );
  }

  /**
   * @description Getting Transaction details for selected card from api. these data are shown in a table.
   */
  getTransactionDetails(): void {
    this.transactionLoading = true;
    this.subscriptions.push(
      this.virtualCardService
        ?.sendTransaction(
          this.selectedCard()?.id as string,
          this.page,
          this.limit
        )
        .pipe(
          finalize(() => {
            this.transactionLoading = false;
          })
        )
        .subscribe((res) => {
          this.cardTransactions = res?.data;
          this.transactionItems = res.data?.length;
        })
    );
  }

  /**
   * @description Next function for pagination of transaction table. changing page number and calling getTransactionDetails api with changed page number
   */
  next(): void {
    if (this.transactionItems >= 9) {
      this.page = this.page + 1;
      this.getTransactionDetails();
    }
  }

  /**
   * @description Previous function for pagination of transaction table. changing page number and calling getTransactionDetails api with changed page number
   */
  previous() {
    if (this.page > 1) {
      this.page = this.page === 1 ? 1 : this.page - 1;
      this.getTransactionDetails();
    }
  }

  /**
   * @description Formatting Date to a specific format.
   * @param date - accepts a date( should be string )
   * @returns
   */
  formateDate(date: string) {
    const myDate = new Date(date);
    const formattedDate = this.datePipe.transform(myDate, 'MM/dd/yyyy');
    return formattedDate;
  }

  /**
   * @description Being called when user clicks add card button. simply navigates to payments page.
   */
  addCard() {
    this.cardsDataService.openAddNewModal('sent');
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((el) => el.unsubscribe());
  }
}

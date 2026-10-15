import { DatePipe, NgClass, CurrencyPipe, NgOptimizedImage } from '@angular/common';
import { Component, OnDestroy, inject, computed, effect } from '@angular/core';
import { Subscription } from 'rxjs';
import {
  ISendReceiveVirtualCard,
  ISendRecievedVirtualCardInfo,
  IVirtualCardTxn
} from 'src/app/data/data/virtual-card';
import { VirtualCardService } from 'src/app/shared/service/virtual-card/virtual-card.service';
import { finalize } from 'rxjs/operators';
import { CardsDataServiceService } from 'src/app/modules/cards/services/cards-data-service.service';
import { TruncatePipe } from '../../../../../../pipes/truncate.pipe';
import { SentRecvCommonCardTableV35Component } from '../sent-recv-common-card-table-v35/sent-recv-common-card-table-v35.component';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatTooltip } from '@angular/material/tooltip';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
/**
 * @class
 * @description Recived card details component. used in card page in v3. shown when user selects recived cards tab in cards list component.
 */
@Component({
  selector: 'app-received-cards-details-ocw-v35',
  templateUrl: './received-cards-details-ocw-v35.component.html',
  styleUrls: ['./received-cards-details-ocw-v35.component.scss'],
  standalone: true,
  imports: [
    NgClass,
    MatTooltip,
    FaIconComponent,
    SentRecvCommonCardTableV35Component,
    CurrencyPipe,
    TruncatePipe,
    NgOptimizedImage
  ]
})
export class RecievedCardsDetailsOcwV35Component implements OnDestroy {
  private virtualCradService = inject(VirtualCardService);
  private datePipe = inject(DatePipe);
  private cardsDataService = inject(CardsDataServiceService);

  subscriptions: Subscription[] = [];
  cardList: ISendReceiveVirtualCard[];
  cardTransactions: IVirtualCardTxn[];
  transactionLoading = false;
  cardLoading = false;
  itemsPerPage = 10;
  currentPage = 1;
  page = 1;
  limit = 10;
  cardDetails: ISendRecievedVirtualCardInfo;
  searchInput = '';
  cardNumber: string;
  cvc: string;
  total: number;
  transactionItems: number;
  isCardNoShown = false;
  isCvcShown = false;
  tableId = DTTableId.receivedVirtualCardTransactions;

  selectedCard = computed(
    () => this.cardsDataService.cardsData().selectedCards.receiveCard
  );
  noCards = computed(
    () => this.cardsDataService.cardsData().receivedCards.length === 0
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
      this.recievedCardDetails();
    }
  });

  /**
   * @description Getting Transaction details for selected card from api. these data are shown in a table.
   */
  getTransactionDetails(): void {
    this.transactionLoading = true;
    this.subscriptions.push(
      this.virtualCradService
        .recievedTransaction(
          this.selectedCard()?.id ?? '',
          this.page,
          this.limit
        )
        .pipe(finalize(() => (this.transactionLoading = false)))
        .subscribe((res) => {
          this.cardTransactions = res?.data;
          this.transactionItems = res?.data?.length;
        })
    );
  }

  /**
   * @description formatting the card number to a specific format. (XXXX XXXX XXXX). Being called in template where card number is shown.
   * @param number - Perticularly card number
   * @returns
   */
  formatNumber(number: number): string {
    const numberString = number?.toString();
    let formattedNumber = '';
    for (let i = 0; i < numberString?.length; i += 4) {
      formattedNumber += numberString?.slice(i, i + 4) + ' ';
    }
    return formattedNumber?.trim();
  }

  /**
   * @description Getting Selected card details from api. Being called when user selects a card
   */
  recievedCardDetails(): void {
    this.cardLoading = true;
    this.subscriptions.push(
      this.virtualCradService
        .recievedCardDetails(this.selectedCard()?.id ?? '')
        .pipe(finalize(() => (this.cardLoading = false)))
        .subscribe((res) => {
          this.cardDetails = res?.data;
          this.cardNumber = this.cardDetails?.card_number;
          this.cvc = this.cardDetails?.cvc;
        })
    );
  }

  /**
   * @description Formatting Date to a specific format.
   * @param date - accepts a date( should be a string )
   * @returns
   */
  formateDate(date: string) {
    const myDate = new Date(date);
    const formattedDate = this.datePipe.transform(myDate, 'MM/dd/yyyy');
    return formattedDate;
  }

  /**
   * @description Toggling view of card number in template.
   */
  viewCard(): void {
    this.isCardNoShown = !this.isCardNoShown;
    this.removeSkelton();
  }

  /**
   * @description Toggling view of cvc number in template.
   */
  viewCvc(): void {
    this.isCvcShown = !this.isCvcShown;
  }

  /**
   * @description Next function for pagination of transaction table. changing page number and calling getTransactionDetails api with changed page number
   */
  next(): void {
    if (this.transactionItems >= 3) {
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
   * @description removing skelton programmatically. Basically removing skelton calss from classlist.
   */
  removeSkelton() {
    this.cardLoading = false;
    this.transactionLoading = false;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((el) => el?.unsubscribe());
  }
}

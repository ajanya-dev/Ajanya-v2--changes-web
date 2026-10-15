import { Component, OnDestroy, inject, computed } from '@angular/core';
import { Subscription } from 'rxjs';
import { CardsDataServiceService } from 'src/app/modules/cards/services/cards-data-service.service';
import { Router } from '@angular/router';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { TruncatePipe } from '../../../../../../pipes/truncate.pipe';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { V3CommonTransactionTableComponent } from '../../../../../v3-common-transactions-table/components/v3-common-transaction-table/v3-common-transaction-table.component';
import { DemoVideoComponent } from '../../../../../../shared/components/demo-video/demo-video.component';
import { NgClass, NgOptimizedImage } from '@angular/common';
import { CommonButtonV35Component } from '../../../../../../shared/v3/buttons/common-button-v35/common-button-v35.component';
import { environment } from 'src/environments/environment';
// import { AlertService } from 'src/app/shared/service/alert/alert.service';

/**
 * @class
 * @description Credit card details component. used in card page in v3. shown when user selects credit cards tab in cards list component.
 */
@Component({
  selector: 'app-credit-cards-details-ocw-v35',
  templateUrl: './credit-cards-details-ocw-v35.component.html',
  styleUrls: ['./credit-cards-details-ocw-v35.component.scss'],
  standalone: true,
  imports: [
    CommonButtonV35Component,
    NgClass,
    DemoVideoComponent,
    V3CommonTransactionTableComponent,
    FaIconComponent,
    TruncatePipe,
    NgOptimizedImage
  ]
})
export class CreditCardsDetailsOcwV35Component implements OnDestroy {
  private cardsDataService = inject(CardsDataServiceService);
  private router = inject(Router);
  private paymentsService = inject(PaymentsService);
  // private alertService = inject(AlertService);

  env = environment;

  subscriptions: Subscription[] = [];
  commonTransactionTableType = 'CARD';

  selectedCard = computed(
    () => this.cardsDataService.cardsData().selectedCards.creditCard
  );

  isThereCards = computed(
    () => this.cardsDataService.cardsData().cards.length > 0
  );

  loading = computed(() => this.cardsDataService.cardsData().isLoading);

  sendMoney() {
    const card = this.selectedCard();

    // if (card?.cardType === '003') {
    //   this.alertService.infoAlert({
    //     content:
    //       'Our Amex card service is temporarily unavailable as we work on enhancements for a smoother user experience and will be back soon.'
    //   });
    //   return;
    // }

    this.paymentsService.initiatePaymentForm = { card: card ?? undefined };

    this.router.navigate(['/manage/payments/main/pay/card/ach'], {
      state: { backUrl: this.router.url }
    });
  }

  addCard() {
    this.cardsDataService.openAddNewModal('credit');
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((el) => el.unsubscribe());
  }
}

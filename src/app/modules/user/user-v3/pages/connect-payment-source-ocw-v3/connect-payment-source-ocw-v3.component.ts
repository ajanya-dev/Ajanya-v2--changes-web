import { Component, inject, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Location, NgFor, NgIf, NgClass } from '@angular/common';
import { Subscription } from 'rxjs';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { environment } from 'src/environments/environment';
import { OpenAddCardService } from 'src/app/shared/service/open-add-card/open-add-card.service';

@Component({
  selector: 'app-connect-payment-source-ocw-v3',
  templateUrl: './connect-payment-source-ocw-v3.component.html',
  styleUrls: ['./connect-payment-source-ocw-v3.component.scss'],
  standalone: true,
  imports: [NgFor, NgIf, NgClass]
})
export class ConnectPaymentSourceOcwV3Component implements OnDestroy {
  /* dependency injectioin using inject method */
  location = inject(Location);
  router = inject(Router);
  private openAddCardService = inject(OpenAddCardService);
  private alertService = inject(AlertService);

  env = environment;
  subscriptions: Subscription[] = [];
  cardsData = (() => {
    const cardArr = [
      {
        id: 1,
        icon: 'fa-building-columns',
        content: 'Add Bank Account',
        onClickUrl: '/manage/users/add-bank-account'
      },
      {
        id: 2,
        icon: 'fa-credit-card',
        content: 'Add Credit Card',
        onClickUrl: 'cardModal'
      },
      {
        id: 3,
        content: 'Create Cloud Bank',
        fdic: true,
        onClickUrl: '/manage/cloud-bank/index'
      }
    ];
    return cardArr;
  })();

  onCardClick(url: string) {
    if (url === 'cardModal') {
      if(this.openAddCardService.isLoading()) return;
      const sub = this.openAddCardService
        .openAddCard()
        .subscribe((cardModal) => {
          if(cardModal){
            cardModal
            .afterClosed()
            .subscribe((res) => {
              if (res && res.success) {
                this.alertService.successAlert({ content: res.data.message });
                this.router.navigateByUrl('/manage/verification/index');
              }
            });
          }
        });
      this.subscriptions.push(sub);
    } else {
      this.router.navigateByUrl(url);
    }
  }

  onBackClick(): void {
    this.location.back();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((el: Subscription) => el.unsubscribe());
  }
}

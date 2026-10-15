import { NgClass } from '@angular/common';
import { Component, inject, Input, OnDestroy, OnInit } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCreditCard } from '@fortawesome/pro-regular-svg-icons';
import {
  faCircleCheck,
  faCircleExclamation,
  faClock,
  faPlus
} from '@fortawesome/pro-solid-svg-icons';
import { finalize, Subscription } from 'rxjs';
import { IExistingCreditCards } from 'src/app/models/payment-switch-board';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { CybersourceService } from 'src/app/shared/service/cybersource/cybersource.service';
import { OpenAddCardService } from 'src/app/shared/service/open-add-card/open-add-card.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { IGettingStartedAPI } from 'src/app/models/getting-started';
import { Router } from '@angular/router';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { MatTooltip } from '@angular/material/tooltip';
import { CommonTablePaginationComponent } from '../common-table-pagination/common-table-pagination.component';

@Component({
  selector: 'app-verification-center-cards',
  standalone: true,
  imports: [
    FontAwesomeModule,
    NgClass,
    CommonTablePaginationComponent,
    MatTooltip
  ],
  templateUrl: './verification-center-cards-new.component.html',
  styleUrl: './verification-center-cards.component.scss'
})
export class VerificationCenterCardsComponent implements OnInit, OnDestroy {
  private cyberSourceService = inject(CybersourceService);
  @Input() verifications: IGettingStartedAPI;
  subscriptions: Subscription[] = [];
  private openAddCardService = inject(OpenAddCardService);
  private localStorageService = inject(LocalStorageService);
  private alertService = inject(AlertService);
  private router = inject(Router);
  private headerService = inject(HeaderService);

  page = 1;
  perPage = 10;
  startIndex = 0;
  lastIndex = this.perPage;

  isLoadingContent = true;
  cards: IExistingCreditCards[] = [];
  cardsPaginated: IExistingCreditCards[] = [];
  faCheck = faCircleCheck;
  faClock = faClock;
  faExclamation = faCircleExclamation;
  faCreditCard = faCreditCard;
  faPlus = faPlus;

  ngOnInit(): void {
    this.getCards();
  }

  /**
   * @description Fetches details of solid and other businesses.
   */
  getCards(): void {
    this.isLoadingContent = true;
    this.subscriptions.push(
      this.cyberSourceService
        .getExistingCards()
        .pipe(
          finalize(() => {
            this.isLoadingContent = false;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.cards = res.data as IExistingCreditCards[];
            this.paginate();
          }
        })
    );
  }

  addNewCard(): void {
    if (
      !this.verifications.verification &&
      !this.verifications.adp?.isCardAdded
    ) {
      // this.localStorageService.setItem('verificationStep', 'card');
      this.router.navigateByUrl('manage/users/verify-email-phone');
      return;
    }
    if (this.openAddCardService.isLoading()) return;
    const sub = this.openAddCardService.openAddCard().subscribe((cardModal) => {
      if (cardModal) {
        cardModal.afterClosed().subscribe((res) => {
          if (res && res.success) {
            this.getCards();
            this.localStorageService.updateNestedData(
              'gettingStartedData',
              'adp.isCardAdded',
              1
            );
            this.headerService.refreshDynamicHeader.next(true);
            this.alertService.successAlert({ content: res.data.message });
          } else if (res?.cardCreated) {
            // Backed out of "Confirm Card": the card exists (unconfirmed).
            this.getCards();
          }
        });
      }
    });
    this.subscriptions.push(sub);
  }

  onClickEvent(clcikType: 'prev' | 'next'): void {
    if (clcikType === 'next') {
      this.page += 1;
      this.startIndex += 5;
      this.lastIndex += 5;
    } else {
      this.page -= 1;
      this.startIndex -= 5;
      this.lastIndex -= 5;
    }
    this.isLoadingContent = true;
    setTimeout(() => {
      this.paginate();
    }, 1000);
  }

  formatedCardNumber(unFormatedNum: string): string {
    const value = unFormatedNum.replace(/\D/g, '');

    // Match and group digits
    let formattedValue = value.replace(/(\d{4})(?=\d)/g, '$1 ');
    formattedValue = `xxxx xxxx xxxx ${formattedValue}`;

    return formattedValue;
  }

  paginate(): void {
    this.isLoadingContent = false;
    this.cardsPaginated = [];
    this.cardsPaginated = this.cards.slice(this.startIndex, this.lastIndex);
  }

  viewAll(): void {
    this.router.navigateByUrl('manage/cards');
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((el) => {
      el.unsubscribe();
    });
  }
}

import { Component, computed, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { CardsDataServiceService } from 'src/app/modules/cards/services/cards-data-service.service';
import { CybersourceService } from 'src/app/shared/service/cybersource/cybersource.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { V4NewCreditCardModalComponent } from 'src/app/shared/modal/cyber-source-modals/new-credit-card-modal/v4/v4-new-credit-card-modal.component';
import { CardsActions } from 'src/app/modules/store/cards/cards.actions';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faPaperPlane, faPencilAlt } from '@fortawesome/pro-solid-svg-icons';
import { VerificationRequiredModalComponent } from 'src/app/shared/modal/verification-required-modal/verification-required-modal.component';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { Router } from '@angular/router';
import { RelativeTimePipe } from 'src/app/pipes/relative-time.pipe';

@Component({
  standalone: true,
  selector: 'app-cards-details-v4',
  imports: [
    CommonModule,
    LucideAngularModule,
    NgOptimizedImage,
    CommonButtonV4Component,
    RelativeTimePipe
  ],
  templateUrl: './cards-details-v4.component.html',
  styleUrls: ['./cards-details-v4.component.scss']
})
export class CardsDetailsV4Component {
  private cardsDataService = inject(CardsDataServiceService);
  private cyberSourceService = inject(CybersourceService);
  private dialog = inject(MatDialog);
  private alertService = inject(V4AlertService);
  private headerService = inject(HeaderService);
  private store = inject(Store);
  private router = inject(Router);
  private paymentsService = inject(PaymentsService);
  private destroyRef = inject(DestroyRef);
  private faIconLibrary = inject(FaIconLibrary);
  private localStorageService = inject(LocalStorageService);
  activeTab: 'account' | 'info' | 'audit' = 'account';

  constructor() {
    this.faIconLibrary.addIcons(faPaperPlane, faPencilAlt);
    // The transactions grid below sits in a sibling component with no handle on
    // this one, so its empty-state CTA asks for the flow through the shared
    // cards service instead of re-implementing the verification gate and
    // payment payload.
    this.cardsDataService.sendMoneyRequested$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.sendMoney());
  }

  selectedCard = computed(
    () => this.cardsDataService.cardsData().selectedCards.creditCard
  );

  isThereCards = computed(
    () => this.cardsDataService.cardsData().cards.length > 0
  );

  cardCount = computed(() => this.cardsDataService.cardsData().cards.length);

  // Owned by the transactions grid (the only thing that sees the rows), read
  // here for the All Cards summary — same split as bank.
  lastTransactionDate = this.cardsDataService.lastTransactionDate;
  lastTransactionFetched = this.cardsDataService.lastTransactionFetched;

  loading = computed(() => this.cardsDataService.cardsData().isLoading);

  cardTypeLogoConfig = computed(() => {
    const configs: Record<string, { icon: string; width: number; height: number }> = {
      '001': { icon: 'assets/images/card-providers/visa-logo.png',       width: 40, height: 14 },
      '002': { icon: 'assets/images/card-providers/master-card-logo.png', width: 40, height: 31 },
      '003': { icon: 'assets/images/card-providers/american-express.png', width: 50, height: 40 },
      '004': { icon: 'assets/images/card-providers/discover-logo-transparent.png',   width: 40, height: 26 }
    };
    return configs[this.selectedCard()?.cardType ?? ''] ?? null;
  });

  editCard(): void {
    const card = this.selectedCard();
    if (card) {
      this.dialog
        .open(V4NewCreditCardModalComponent, {
          width: '400px',
          maxWidth: '95vw',
          panelClass: 'paddingless-modal-rounded',
          data: { cardId: card.cardId, nickName: card.nickName }
        })
        .afterClosed()
        .subscribe(() => {
          this.cardsDataService.getCreditCards();
        });
    }
  }

  deleteCard(): void {
    const card = this.selectedCard();
    if (!card) return;

    this.alertService
      .confirmAlert({
        content: 'Are you sure you want to delete this card permanently?',
        icon: 'failure'
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.cyberSourceService
            .deleteCard(card.cardId)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((cRes) => {
              if (cRes?.success) {
                this.cardsDataService.cardsData.update((currentCardsData) => ({
                  ...currentCardsData,
                  cards: currentCardsData.cards.filter(
                    (c) => c.cardId !== card.cardId
                  ),
                  isLoading: false,
                  isError: false
                }));
                this.cardsDataService.cardsData.update((currentCardsData) => ({
                  ...currentCardsData,
                  selectedCards: {
                    ...currentCardsData.selectedCards,
                    creditCard: currentCardsData.cards[0]
                  }
                }));
                this.cardsDataService.setCreditCard(
                  this.cardsDataService.cardsData().cards[0]
                );

                this.store.dispatch(
                  CardsActions.loadCards({ showAllCards: false })
                );
                this.alertService.successAlert({
                  content: 'Deleted Successfully'
                });
                this.headerService.refreshDynamicHeader.next(true);
              }
            });
        }
      });
  }

  sendMoney(): void {
    const card = this.selectedCard();
    this.dialog.closeAll();

    const phoneVerified = this.localStorageService.getItem('phoneVerified');
    const emailVerified = this.localStorageService.getItem('emailVerified');

    if (phoneVerified === 0 || emailVerified === 0) {
      this.dialog.open(VerificationRequiredModalComponent, {
        width: '400px',
        disableClose: true,
        panelClass: 'paddingless-modal-rounded',
        data: {
          description:
            'You need to verify your email and phone number to send payments.'
        }
      });
      return;
    }
    this.paymentsService.initiatePaymentForm = card ? { card } : {};
    this.router.navigate(['/v4/manage/payments/pay/card/ach'], {
      state: { backUrl: this.router.url }
    });
  }

  addNewCard(): void {
    this.cardsDataService.openAddNewModalV4('credit');
  }
}

import {
  Component,
  DestroyRef,
  inject,
  OnInit,
  computed,
  Input
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgClass, JsonPipe } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltip } from '@angular/material/tooltip';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { CybersourceService } from 'src/app/shared/service/cybersource/cybersource.service';
import { CardsDataServiceService } from 'src/app/modules/cards/services/cards-data-service.service';
import { IExistingCreditCards } from 'src/app/models/payment-switch-board';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { CardsActions } from 'src/app/modules/store/cards/cards.actions';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { CommonLayoutToggleV4Service } from 'src/app/shared/service/common/shared/common-layout/common-layout-toggle-v4.service';
import { V4NewCreditCardModalComponent } from 'src/app/shared/modal/cyber-source-modals/new-credit-card-modal/v4/v4-new-credit-card-modal.component';
import { CommonListSkeltonComponent } from 'src/app/shared/v3/common-components/common-list-skelton/common-list-skelton.component';
import { TruncatePipe } from 'src/app/pipes/truncate.pipe';
import { SearchFilterPipe } from 'src/app/pipes/search-filter.pipe';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';

@Component({
  selector: 'app-credit-cards-ocw-v4',
  templateUrl: './credit-cards-ocw-v4.component.html',
  styleUrls: ['./credit-cards-ocw-v4.component.scss'],
  standalone: true,
  imports: [
    NgClass,
    JsonPipe,
    LucideAngularModule,
    MatTooltip,
    MatMenuTrigger,
    MatMenu,
    MatMenuItem,
    CommonListSkeltonComponent,
    TruncatePipe,
    SearchFilterPipe
  ]
})
export class CreditCardsOcwV4Component implements OnInit {
  @Input() resize = false;

  private cyberSourceService = inject(CybersourceService);
  private cardsDataService = inject(CardsDataServiceService);
  private dialog = inject(MatDialog);
  private alertService = inject(V4AlertService);
  private headerService = inject(HeaderService);
  private store = inject(Store);
  private sharedService = inject(SharedService);
  private commonLayoutToggleV4Service = inject(CommonLayoutToggleV4Service);

  private destroyRef = inject(DestroyRef);

  cardList = computed(() => this.cardsDataService.cardsData().cards);
  loading = computed(() => this.cardsDataService.cardsData().isLoading);
  searchKey = computed(() => this.cardsDataService.cardsData().searchTerm);
  selectedCard = computed(
    () => this.cardsDataService.cardsData().selectedCards.creditCard
  );

  ngOnInit(): void {
    this.cardsDataService.cardsData.update((cardsData) => ({
      ...cardsData,
      searchTerm: ''
    }));
    this.getCards();
    this.observeNewCardAdded();
  }

  private async getCards() {
    const previousCardId =
      this.cardsDataService.cardsData().selectedCards.creditCard?.cardId;
    await this.cardsDataService.getCreditCards();
    const isPreviousCardListed = this.cardsDataService
      .cardsData()
      .cards.some((card) => card.cardId === previousCardId);
    if (isPreviousCardListed) return;
    this.cardsDataService.cardsData.update((currentCardsData) => ({
      ...currentCardsData,
      selectedCards: {
        ...currentCardsData.selectedCards,
        creditCard: undefined
      }
    }));
    this.cardsDataService.setCreditCard(undefined);
  }

  observeNewCardAdded() {
    this.cardsDataService.newCardAddedSubject.subscribe(async () => {
      await this.cardsDataService.getCreditCards();
    });
  }

  selectCard(card: IExistingCreditCards) {
    this.sharedService.selectedPayees.reset();
    this.cardsDataService.setCreditCard(card);
    this.cardsDataService.cardsData.update((currentCardsData) => ({
      ...currentCardsData,
      selectedCards: {
        ...currentCardsData.selectedCards,
        creditCard: card
      }
    }));
    this.commonLayoutToggleV4Service.navigateToDetail();
  }

  addNewButtonClick() {
    this.cardsDataService.openAddNewModalV4('credit');
  }

  selectAll() {
    this.sharedService.selectedPayees.reset();
    this.cardsDataService.cardsData.update((currentCardsData) => ({
      ...currentCardsData,
      selectedCards: {
        ...currentCardsData.selectedCards,
        creditCard: undefined
      }
    }));
    this.cardsDataService.setCreditCard(undefined);
    this.commonLayoutToggleV4Service.navigateToDetail();
  }

  deleteCard(card: IExistingCreditCards) {
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

  editCard(card: IExistingCreditCards) {
    if (card) {
      this.selectCard(card);
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

  matchSelectedCard(card: IExistingCreditCards) {
    let selectedCard;
    let incomingCard;
    try {
      selectedCard = JSON.stringify(this.selectedCard());
      incomingCard = JSON.stringify(card);
    } catch (err) {
      return false;
    }
    return selectedCard === incomingCard;
  }
}

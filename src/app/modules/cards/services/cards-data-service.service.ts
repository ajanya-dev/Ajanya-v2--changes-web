import {
  BehaviorSubject,
  Subject,
  Subscription,
  catchError,
  of,
  takeUntil,
  firstValueFrom,
  timeout
} from 'rxjs';
import { Injectable, OnDestroy, inject, signal } from '@angular/core';
import { IExistingCreditCards } from 'src/app/models/payment-switch-board';
import { IVirtualSendCard } from 'src/app/modules/outside/model/outside';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CybersourceService } from 'src/app/shared/service/cybersource/cybersource.service';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { Router } from '@angular/router';
import { VirtualCardService } from 'src/app/shared/service/virtual-card/virtual-card.service';
import { ICardsStates } from 'src/app/models/card';
import { OpenAddCardService } from 'src/app/shared/service/open-add-card/open-add-card.service';
import { OpenAddCardV4Service } from 'src/app/shared/service/open-add-card/open-add-card-v4.service';
import { UserProfileService } from 'src/app/shared/service/user/user-profile.service';
import { Store } from '@ngrx/store';
import { IAppState } from 'src/app/store/app-state.model';
import { UserManagementActions } from 'src/app/modules/store/userManagement/userManagement.actions';
import { VerificationRequiredModalComponent } from 'src/app/shared/modal/verification-required-modal/verification-required-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { TCardsTabs } from '../components/v35/models/cards-ocw-v35.interface';
import { V3PaymentsTableService } from '../../v3-payments-table/shared/components/v3-payments-table/v3-payments-table.service';

interface ICards {
  creditCard?: IExistingCreditCards;
  sentCard?: IVirtualSendCard;
  receiveCard?: IVirtualSendCard;
}

interface INoCards {
  creditCard?: boolean;
  sentCard?: boolean;
  receiveCard?: boolean;
}

/**
 * @description Service for cards module in v3. Used as data service between components in cards module.
 * @class
 */
@Injectable({
  providedIn: 'root'
})
export class CardsDataServiceService implements OnDestroy {
  /**
   * Fired when something outside the card detail panel wants the "Send Money"
   * flow — today the v4 transactions grid's empty-state CTA. The flow itself
   * (verification gate, payment payload, route) stays in
   * `CardsDetailsV4Component`, which is always mounted alongside the grid, so
   * there is exactly one copy of it.
   */
  readonly sendMoneyRequested$ = new Subject<void>();

  /**
   * Feeds the "Last Transaction" tile on the All Cards panel. Set by the v4
   * transactions grid once it has loaded, the same way `BankDataV4Service`
   * carries it for the All Bank Accounts panel — the grid is the only thing
   * that knows the newest transaction, and the detail panel is a sibling.
   */
  readonly lastTransactionDate = signal<string | undefined>(undefined);
  readonly lastTransactionFetched = signal(false);

  private selectedCard = new BehaviorSubject<ICards>({});
  private isThereCards = new BehaviorSubject<INoCards>({
    creditCard: false,
    sentCard: false,
    receiveCard: false
  });

  public cardsData = signal<ICardsStates>({
    cards: [] as IExistingCreditCards[],
    pageNo: 0,
    isFilterOn: false,
    searchTerm: '',
    cardsFiltered: [] as IExistingCreditCards[],
    filteredPageNo: 0,
    isLoading: false,
    isError: false,
    selectedCards: {},
    receivedCards: [],
    sentCards: [],
    currentTab: 'credit'
  });

  private destroy$ = new Subject<void>();

  private openAddCardService = inject(OpenAddCardService);
  private openAddCardV4Service = inject(OpenAddCardV4Service);
  private alertService = inject(AlertService);
  private v4AlertService = inject(V4AlertService);
  private cyberSourceService = inject(CybersourceService);
  private router = inject(Router);
  private paymentsService = inject(PaymentsService);
  private virtualCardService = inject(VirtualCardService);
  private v3PaymentsTableService = inject(V3PaymentsTableService);
  private userProfileService = inject(UserProfileService);
  private dialog = inject(MatDialog);
  private store = inject(Store<IAppState>);

  newCardAddedSubject = new Subject();
  currentTab: TCardsTabs = 'credit';
  subscriptions: Subscription[] = [];
  isNotVerified: boolean;

  /**
   * @description Getting called when user changing tabs
   * @param tab - Accepts a tab id
   */
  changeTab(tab: TCardsTabs) {
    this.currentTab = tab;
  }

  /**
   * @description Getter for selected card property, Getting access to whole slected card object
   * @returns Selected card in list component
   */
  getSelectedCard() {
    return this.selectedCard;
  }

  /**
   * @description Setter for credit card property selected card object
   * @param card - Accepts a credit card
   */
  setCreditCard(card?: IExistingCreditCards) {
    this.selectedCard.next({ creditCard: card });
  }

  /**
   * @description Being called when user adding a card. Opens a modal, after closed calling cybersoruce get data api. or  navigating to v3 payment component, and also setting required details in initiatePaymentForm proeprty from paymentsService
   */
  openAddNewModal(tab: TCardsTabs, creditCardGatewayType?: 4 | 5) {
    this.isUserVerified();
    if (this.isNotVerified) {
      this.router.navigate(['/manage/users/verify-email-phone']);
      return;
    }
    if (tab === 'credit') {
      if (this.openAddCardService.isLoading()) return;
      const knownCardIds = this.getKnownCardIds();
      const sub = this.openAddCardService
        .openAddCard(creditCardGatewayType)
        .subscribe((cardModal) => {
          if (cardModal) {
            cardModal.afterClosed().subscribe((res) => {
              if (res?.success) {
                this.getCreditCards(res.data?.metaData?.cardId, knownCardIds);
                this.alertService.successAlert({ content: res.data?.message });
              } else if (res?.cardCreated) {
                // Backed out of "Confirm Card": the card exists (unconfirmed).
                // No cardId comes back on this path, so the refreshed list is
                // diffed against `knownCardIds` to select the card just added.
                this.getCreditCards(undefined, knownCardIds);
              }
            });
          }
        });
      this.subscriptions.push(sub);
    } else if (tab === 'sent') {
      this.paymentsService.initiatePaymentForm = {
        card: this.selectedCard ?? undefined
      };
      this.router.navigate(['/manage/payments/main/pay/wallet/virtual-card'], {
        state: { backUrl: this.router.url }
      });
    }
  }

  async openAddNewModalV4(tab: TCardsTabs) {
    this.store.dispatch(UserManagementActions.loadUserVerification());
    const verification = await firstValueFrom(
      this.userProfileService.UserVerification$.pipe(
        timeout({ first: 5000, with: () => of(null) })
      )
    );
    const isNotVerified = verification
      ? verification.email_verified === 0 || verification.phone_verified === 0
      : false;

    if (isNotVerified) {
      this.dialog.open(VerificationRequiredModalComponent, {
        width: '400px',
        disableClose: true,
        panelClass: 'paddingless-modal-rounded',
        data: {
          description:
            'You need to verify your email and phone number to add a card.'
        }
      });
      return;
    }
    if (tab === 'credit') {
      if (this.openAddCardV4Service.isLoading()) return;
      const knownCardIds = this.getKnownCardIds();
      const sub = this.openAddCardV4Service
        .openAddCard()
        .subscribe((cardModal) => {
          if (cardModal) {
            cardModal.afterClosed().subscribe((res) => {
              if (res?.success) {
                this.getCreditCards(res.data?.metaData?.cardId, knownCardIds);
                this.v4AlertService.successAlert({
                  content: res.data?.message
                });
              } else if (res?.cardCreated) {
                // Backed out of "Confirm Card": the card exists (unconfirmed).
                // No cardId comes back on this path, so the refreshed list is
                // diffed against `knownCardIds` to select the card just added.
                this.getCreditCards(undefined, knownCardIds);
              }
            });
          }
        });
      this.subscriptions.push(sub);
    }
  }

  /**
   * @description Snapshot of the card ids currently in the list, taken before
   * the add-card flow opens. Used to identify the card the user just created
   * when the flow closes without handing back a cardId.
   */
  private getKnownCardIds(): string[] {
    return this.cardsData().cards.map((card) => card.cardId);
  }

  /**
   * @description Checks the user verification status and updates the `isNotVerified` property accordingly.
   */
  isUserVerified() {
    this.subscriptions.push(
      this.userProfileService.UserVerification$.subscribe((res) => {
        this.isNotVerified =
          res.email_verified === 0 || res.phone_verified === 0;
      })
    );
  }

  /**
   * @description Method for navigating to email and phone verification page.
   * @param msg -Error message
   */
  verifyEmailAndMobile(msg: string) {
    const ref = this.alertService.warningAlert({
      content: msg,
      doneMsg: 'Verify Now',
      isCancel: true,
      cancelMsg: 'Cancel'
    });

    ref.afterClosed().subscribe((res) => {
      if (res) {
        this.router.navigate(['/manage/users/verify-email-phone']);
      }
    });
  }

  /**
   * @description Setter for credit card property selected card object
   * @param card - Accepts a sent card
   */
  setSentCard(card: IVirtualSendCard) {
    this.selectedCard.next({ sentCard: card });
  }

  /**
   * @description Setter for recieved card property selected card object
   * @param card - Accepts a recieved card
   */
  setReceivedCard(card: IVirtualSendCard) {
    this.selectedCard.next({ receiveCard: card });
  }

  /**
   * @description Getter for isThereCards property, Getting access to whole isThereCard object
   * @returns isThereCard
   */
  getNoCards() {
    return this.isThereCards;
  }

  /**
   * @description Setter for no credit card property in isThereCard object
   * @param noCard - should be a boolean. if there is cards when calling api for credit cards it should be a true, else false.
   */
  setNoCreditCard(noCard: boolean) {
    this.isThereCards.next({ creditCard: noCard });
  }

  /**
   * @description Setter for no sent card property in isThereCard object
   * @param noCard - should be a boolean. if there is cards when calling api for sent cards it should be a true, else false.
   */
  setNoSentCard(noCard: boolean) {
    this.isThereCards.next({ sentCard: noCard });
  }

  /**
   * @description Setter for no recieved card property in isThereCard object
   * @param noCard - should be a boolean. if there is cards when calling api for recieved cards it should be a true, else false.
   */
  setNoReceivedCard(noCard: boolean) {
    this.isThereCards.next({ receiveCard: noCard });
  }

  /**
   * @description Method to load credit card data.
   * @param selectCardID - Card to select once the list is refreshed.
   * @param knownCardIds - Card ids present before an add-card flow ran. When
   * `selectCardID` is unknown, the card missing from this list is the one the
   * user just added, so it gets selected instead of falling back to the
   * previous selection.
   */
  async getCreditCards(selectCardID?: string, knownCardIds?: string[]) {
    this.cardsData.update((currentCardsData) => ({
      ...currentCardsData,
      isLoading: true,
      isError: false
    }));

    const res = await firstValueFrom(
      this.cyberSourceService.getExistingCards().pipe(
        catchError(() => of(false)),
        takeUntil(this.destroy$)
      )
    );

    if (typeof res === 'boolean') {
      this.v3PaymentsTableService.cardsDataDispatched = false;
      this.cardsData.update((currentCardsData) => ({
        ...currentCardsData,
        cards: [],
        cardsFiltered: [],
        isLoading: false,
        isError: true
      }));
      return;
    }

    if (res.success) {
      const updatedData = res.data.map((c) => {
        let bgColor = 'green';
        if (c.bgColor === '#E5F8F2') {
          bgColor = 'green';
        } else if (c.bgColor === '#EDEBFF') {
          bgColor = 'violet';
        } else if (c.bgColor === '#E9F3FF') {
          bgColor = 'blue';
        } else if (c.bgColor === '#FAEFF5') {
          bgColor = 'red';
        }

        const colorClasses = {
          bg: `common-secondary-${bgColor}-color`,
          text: `common-${bgColor}-color`
        };
        const last4 = c.card.slice(c.card.length - 4);
        return {
          ...c,
          bgColor,
          last4,
          cardMasked: `*******${last4}`,
          colorClasses
        };
      });
      let cardIdToSelect = selectCardID;
      if (!cardIdToSelect && knownCardIds) {
        cardIdToSelect = updatedData.find(
          (card) => !knownCardIds.includes(card.cardId)
        )?.cardId;
      }

      let selectedCard = this.cardsData().selectedCards.creditCard;
      if (cardIdToSelect) {
        selectedCard = updatedData.find(
          (card) => card.cardId === cardIdToSelect
        );
        const itemIndex = updatedData.findIndex(
          (card) => card.cardId === cardIdToSelect
        );
        if (itemIndex !== -1) {
          // moving the selected card into first index
          const itemToMove = updatedData.splice(itemIndex, 1)[0];
          updatedData.unshift(itemToMove);
        }
      } else {
        selectedCard = updatedData.find(
          (card) =>
            card.cardId === this.cardsData().selectedCards.creditCard?.cardId
        );
      }
      this.cardsData.update((currentCardsData) => ({
        ...currentCardsData,
        cards: updatedData ?? [],
        cardsFiltered: updatedData ?? [],
        isFilterOn: false,
        isLoading: false,
        isError: false,
        selectedCards: {
          creditCard: selectedCard ?? updatedData[0]
        }
      }));
      if (selectedCard) {
        this.setCreditCard(selectedCard);
      } else {
        this.setCreditCard(updatedData[0]);
      }
    } else {
      this.cardsData.update((currentCardsData) => ({
        ...currentCardsData,
        cards: [],
        cardsFiltered: [],
        isLoading: false,
        isError: true
      }));
      this.alertService.failedAlert({
        content: res.message ?? 'Something went wrong!'
      });
    }
  }

  /**
   * @description Method to get received cards data.
   * @param searchKey - Search key.
   */
  async getReceivedCards(searchKey: string) {
    this.cardsData.update((currentCardsData) => ({
      ...currentCardsData,
      isLoading: true,
      isError: false
    }));

    const res = await firstValueFrom(
      this.virtualCardService.getRecievedCards(searchKey).pipe(
        catchError(() => of(false)),
        takeUntil(this.destroy$)
      )
    );

    if (typeof res === 'boolean') {
      this.alertService.failedAlert({ content: 'Something went wrong!' });
      return;
    }

    if (!res.success) {
      this.alertService.failedAlert({
        content: res.message || 'Something went wrong!'
      });
    }

    this.cardsData.update((currentCardsData) => ({
      ...currentCardsData,
      receivedCards: res.data,
      isLoading: false
    }));
  }

  /**
   * @description Method to get sent cards data.
   */
  async getSentCards() {
    this.cardsData.update((currentCardsData) => ({
      ...currentCardsData,
      isLoading: true,
      isError: false
    }));

    const res = await firstValueFrom(
      this.virtualCardService.sendCards().pipe(
        catchError(() => of(false)),
        takeUntil(this.destroy$)
      )
    );

    if (typeof res === 'boolean') {
      this.alertService.failedAlert({ content: 'Something went wrong!' });
      return;
    }

    if (!res.success) {
      this.alertService.failedAlert({ content: 'Something went wrong!' });
      return;
    }

    this.cardsData.update((currentCardsData) => ({
      ...currentCardsData,
      sentCards: res.data,
      isLoading: false
    }));
  }

  /**
   * @description Method to reset cards data.
   */
  private resetCardsData() {
    this.cardsData.set({
      cards: [] as IExistingCreditCards[],
      pageNo: 0,
      isFilterOn: true,
      searchTerm: '',
      cardsFiltered: [] as IExistingCreditCards[],
      filteredPageNo: 0,
      isLoading: true,
      isError: false,
      selectedCards: {},
      receivedCards: [],
      sentCards: [],
      currentTab: 'credit'
    });
  }

  ngOnDestroy(): void {
    this.resetCardsData();
    this.destroy$.next();
    this.destroy$.complete();
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }
}

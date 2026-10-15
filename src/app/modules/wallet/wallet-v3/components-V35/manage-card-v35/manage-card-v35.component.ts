import { MatTooltip } from '@angular/material/tooltip';
import {
  Component,
  computed,
  ElementRef,
  inject,
  input,
  InputSignal,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { Router } from '@angular/router';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { Utils } from 'src/app/data/utils';
import { ListHeaderV35Component } from 'src/app/shared/v3/common-components/list-header-v35/list-header-v35.component';
import {
  NgClass,
  NgOptimizedImage,
  NgStyle,
  TitleCasePipe,
  NgTemplateOutlet
} from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { CommonListSkeltonComponent } from 'src/app/shared/v3/common-components/common-list-skelton/common-list-skelton.component';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { SearchFilterPipe } from 'src/app/pipes/search-filter.pipe';
import { CamelToTitlePipe } from 'src/app/pipes/camel-to-title.pipe';
import { WhiteLabelPipe } from 'src/app/pipes/white-label.pipe';
import { ICardList, IGiftCardList, IWalletData } from 'src/app/models/wallet';
import {
  debounceTime,
  distinctUntilChanged,
  Subject,
  Subscription
} from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';
import { faCreditCard } from '@fortawesome/pro-regular-svg-icons';
import { faCheck, faGift, faTimes } from '@fortawesome/pro-solid-svg-icons';
import { MatDialog } from '@angular/material/dialog';
import { ScrollToEndDirective } from 'src/app/directive/scroll-to-end.directive';
import { TruncatePipe } from 'src/app/pipes/truncate.pipe';
import { WalletDataV35Service } from '../../services/wallet-data-v35.service';
import { RainCardTransactionsV35Component } from '../rain-card-transactions-v35/rain-card-transactions-v35.component';
import { RaincardHelperService } from '../../services/raincard-helper.service';
import { AddFundToGiftcardComponent } from '../../modals-v35/add-fund-to-giftcard/add-fund-to-giftcard.component';
import { ImportVirtualCardComponent } from '../../modals-v35/import-virtual-card/import-virtual-card.component';

@Component({
  selector: 'app-manage-card-v35',
  standalone: true,
  templateUrl: './manage-card-v35.component.html',
  styleUrl: './manage-card-v35.component.scss',
  imports: [
    ListHeaderV35Component,
    NgClass,
    FaIconComponent,
    CommonListSkeltonComponent,
    NgStyle,
    NgOptimizedImage,
    CommonButtonV35Component,
    TitleCasePipe,
    SearchFilterPipe,
    CamelToTitlePipe,
    WhiteLabelPipe,
    RainCardTransactionsV35Component,
    NgTemplateOutlet,
    ScrollToEndDirective,
    MatTooltip,
    TruncatePipe
  ]
})
export class ManageCardV35Component implements OnInit, OnDestroy {
  @ViewChild('mainSection') mainSection: ElementRef<HTMLDivElement>;

  private router = inject(Router);
  private alertService = inject(AlertService);
  private raincardHelperService = inject(RaincardHelperService);
  private dialog = inject(MatDialog);

  public walletDataService = inject(WalletDataV35Service);
  cardSearchSubject = new Subject<string>();

  hasMoreResults = computed(() =>
    this.walletDataService.cardHasMoreResultsSignal()
  );

  isLoadingMoreResults = computed(() =>
    this.walletDataService.cardPaginationLoadingSignal()
  );


  isShadow = false;
  subscriptions: Subscription[] = [];
  public utils = Utils;
  public newPin: string = '';
  cardSearchString: string = '';
  giftCardSearchString: string = '';
  isCardSearch: boolean = false;
  totalCount: number = 0;
  pageSize: number = 13;

  // Pagination properties for search
  currentPage: number = 1;

  faCreditCard = faCreditCard;
  faGift = faGift;
  faCheck = faCheck;
  faTimes = faTimes;

  tabs = [
    {
      label: 'Visa Spend Card',
      value: 'zilDebitCards',
      icon: this.faCreditCard
    },
    {
      label: 'Visa Gift Cards',
      value: 'giftCards',
      icon: this.faGift
    }
  ] as const;

  currentTab: 'zilDebitCards' | 'giftCards' = 'zilDebitCards';

  showAllCards: InputSignal<boolean> = input<boolean>(true);

  ngOnInit(): void {
    if (
      this.walletDataService.onBoardingStatusSignal() === 'welcome' ||
      this.walletDataService.onBoardingStatusSignal() === 'rejected'
    ) {
      this.walletDataService.selectedWalletTab = { tab: 'details' };
      return;
    }
    this.checkOnBoardingStatus();
    this.getSelectedTab();
    this.subscriptions.push(
      this.cardSearchSubject
        .pipe(debounceTime(500), distinctUntilChanged())
        .subscribe((value) => {
          this.cardSearch(value);
        })
    );

    // Subscribe to card loading state to ensure selection after search
    this.subscriptions.push(
      toObservable(this.walletDataService.cardLoadingSignal).subscribe(
        (loading: boolean) => {
          if (!loading && this.isCardSearch && this.cardSearchString) {
            // Ensure a card is selected after search results are loaded
            this.ensureCardSelection();
          }
        }
      )
    );
  }

  /**
   * Ensures a card is selected after search results are loaded
   */
  private ensureCardSelection() {
    const selectedCard = this.walletDataService.selectedCardSignal();
    const { cardsList } = this;
    if (!selectedCard && cardsList.length > 0) {
      this.selectCard(cardsList[0]);
    } else if (selectedCard && cardsList.length === 0) {
      this.walletDataService.selectCard(undefined);
    }
  }

  // Gets cards based on current mode
  get cardsList(): ICardList[] {
    const walletId = this.walletDataService.walletDataSignal()?.uuId ?? '';
    
    // Get the wallet cards from the service
    const walletCards = this.walletDataService.walletCardListSignal();
    if (this.isCardSearch && this.cardSearchString) {
      // Return the current wallet's cards (which will be search results)
      return walletCards[walletId] ?? [];
    }

    if (this.showAllCards()) {
      // Show all cards from all wallets
      const allCards = Object.values(walletCards)
        .flat()
        .filter((card) => card !== undefined);
      return allCards;
    }
    // Normal mode: show only current wallet's cards
    const currentWalletCards = walletCards[walletId] ?? [];
    return currentWalletCards;
  }

  get giftCardsList(): IGiftCardList[] {
    const walletId = this.walletDataService.walletDataSignal()?.uuId ?? '';
    return this.walletDataService.giftCardListSignal()[walletId] ?? [];
  }

  onScroll() {
    const mainSectionElement = this.mainSection.nativeElement;
    if (mainSectionElement.scrollTop > 0) {
      this.isShadow = true;
    } else {
      this.isShadow = false;
    }
  }

  getSelectedTab() {
    this.subscriptions.push(
      this.walletDataService.selectedCardTab$.subscribe((val) => {
        this.currentTab = val.tab;
      })
    );
  }

  toggleAccountDetails(tab: 'zilDebitCards' | 'giftCards'): void {
    if (this.currentTab === tab) {
      return;
    }
    this.currentTab = tab;
    this.walletDataService.selectedCardTab = {
      tab: this.currentTab
    };
  }

  addFund(card: IGiftCardList) {
    const modal = this.dialog.open(AddFundToGiftcardComponent, {
      width: '450px',
      maxWidth: '93%',
      disableClose: true,
      data: card.id || undefined,
      autoFocus: false
    });
    modal.afterClosed().subscribe((res) => {
      if (res.success) {
        this.walletDataService.giftCardUpdatedOrAdded = true;
        this.walletDataService.getGiftCardDetails(
          'select',
          this.walletDataService.walletDataSignal()?.uuId,
          card.id
        );
        this.walletDataService.setWallets();
      }
    });
  }

  checkOnBoardingStatus(): void {
    // Check physical card status
    if (!this.walletDataService.virtualCardStatusSignal()) {
      this.raincardHelperService.handleVirtualCardDisabled();
      this.walletDataService.selectedWalletTab = { tab: 'details' };
      return;
    }

    const isNotLoading = !this.walletDataService.onBoardingLoadingSignal();
    const onboardingStatus = this.walletDataService.onBoardingStatusSignal();

    // Handle different onboarding statuses
    if (isNotLoading && onboardingStatus === 'welcome') {
      this.raincardHelperService.initiateCardCreationFlow();
    } else if (
      (isNotLoading && onboardingStatus === 'submitted') ||
      onboardingStatus === 'rejected'
    ) {
      // User onboarding under review or rejected
      this.router.navigate(['/manage/wallet/transactions']);
      this.walletDataService.selectedWalletTab = { tab: 'card' };
    }
  }

  createCard(wallet?: IWalletData, isGiftCard?: boolean): void {
    this.checkOnBoardingStatus();

    const queryParams: {
      walletId?: string;
      businessId?: string;
      isGiftCard?: boolean;
    } = {
      walletId: wallet?.uuId,
      businessId: this.walletDataService.onBoardedBusinessSignal()
    };

    // Only add isGiftCard if it's true
    if (isGiftCard) {
      queryParams.isGiftCard = isGiftCard;
    }

    this.router.navigate(['/manage/wallet/card/create-card'], {
      queryParams
    });
  }

  onCardSearch(value: string) {
    // Update the search string
    this.cardSearchString = value;
    this.isCardSearch = !!value && value.trim() !== '';

    // Reset pagination for new search
    this.currentPage = 1;
    this.walletDataService.cardHasMoreResultsSignal.set(true);

    // Emit the search value to trigger debounced search
    this.cardSearchSubject.next(value);
  }

  selectCard(card: ICardList) {
    this.walletDataService.selectCard(card);
  }

  selectGiftCard(card: IGiftCardList) {
    this.walletDataService.selectGiftCard(card);
  }

  editCard(card: ICardList) {
    this.router.navigate(['/manage/wallet/card/create-card'], {
      queryParams: {
        walletId: this.walletDataService.walletDataSignal()?.uuId,
        businessId: this.walletDataService.onBoardedBusinessSignal(),
        cardId: card.id
      }
    });
  }

  revealCard(card: ICardList) {
    this.walletDataService.revealCard(card);
  }

  changeStatus(card: ICardList) {
    const statusAlert = this.alertService.confirmAlert({
      content:
        card.cardStatus === 'active'
          ? 'Are you sure you want to make this card inactive?'
          : 'Are you sure you want to make this card active?',
      doneMsg: 'Yes'
    });
    statusAlert.afterClosed().subscribe((res) => {
      if (res) {
        this.walletDataService.changeStatus(card);
      }
    });
  }

  showPinInput() {
    this.walletDataService.setPinInputVisibility(true);
  }

  /**
   * @description returns font size based on the current window size
   */
  get cardSize() {
    if (window.innerWidth < 1366) {
      return '0.9rem';
    }
    return '1.1rem';
  }

  importFromExcel() {
    const walletId = this.walletDataService.walletDataSignal()?.uuId;
    this.dialog
      .open(ImportVirtualCardComponent, {
        width: '700px',
        maxWidth: '93%',
        disableClose: true,
        data: walletId
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.walletDataService.giftCardUpdatedOrAdded = true;
          this.walletDataService.getGiftCardDetails('', walletId);
        }
      });
  }

  private cardSearch(searchString: string) {
    const walletId = this.walletDataService.walletDataSignal()?.uuId;
    if (!walletId) return;

    // Reset page for new search
    this.currentPage = 1;
    this.walletDataService.cardHasMoreResultsSignal.set(true);

    if (!searchString || searchString.trim() === '') {
      this.isCardSearch = false;
      this.cardSearchString = '';
      // Reset to show all cards for the current wallet
      this.walletDataService.getCardDetails('', walletId, '', this.currentPage);
    } else {
      this.isCardSearch = true;
      this.cardSearchString = searchString.trim();
      this.walletDataService.getCardDetails(
        '',
        walletId,
        '',
        this.currentPage,
        this.cardSearchString
      );
    }
  }

  onScrollToEnd() {
    const walletId = this.walletDataService.walletDataSignal()?.uuId;

    if (!walletId || !this.hasMoreResults() || this.isLoadingMoreResults()) {
      return;
    }

    const currentCards = this.cardsList.length;

    if (currentCards > 0 && currentCards % this.pageSize === 0) {
      this.walletDataService.cardPaginationLoadingSignal.set(true);
      this.currentPage += 1;

      // Use same method for both search and normal pagination
      const searchTerm = this.isCardSearch ? this.cardSearchString : undefined;
      this.walletDataService.getCardDetails(
        'loadMore',
        walletId,
        '',
        this.currentPage,
        searchTerm
      );
    } else {
      this.walletDataService.cardHasMoreResultsSignal.set(false);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}

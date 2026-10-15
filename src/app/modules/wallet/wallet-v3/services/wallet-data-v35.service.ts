import {
  Injectable,
  OnDestroy,
  Signal,
  WritableSignal,
  computed,
  inject,
  signal
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  Subject,
  Subscription,
  Observable,
  finalize,
  take,
  debounceTime,
  distinctUntilChanged,
  tap
} from 'rxjs';
import {
  ICardList,
  ICardRestrictionDetails,
  IInternationalPayment,
  IGiftCardList,
  IGiftCardsDetails,
  IKybRecords,
  IWalletAchSignalState,
  IWalletAchTransaction,
  IWalletCardsDetails,
  IWalletData,
  IWalletRoot,
  TimeRestriction,
  IWalletInternationaPaymentAcceptPayload
} from 'src/app/models/wallet';
import { WalletService } from 'src/app/shared/service/wallet/wallet.service';
import { Router } from '@angular/router';
import { DownloadStatementComponent } from 'src/app/modules/cloud-bank/cloud-bank-v2/modals/download-statement/download-statement.component';
import { PayeeOnboardingService } from 'src/app/modules/payee-onboarding/services/payee-onboarding.service';
import { TransferDetailsService } from 'src/app/modules/transfers/services/transfer-details.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { OtpModalComponent } from 'src/app/modules/cloud-bank/cloud-bank-v2/modals/otp-modal/otp-modal.component';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { WalletsActions } from 'src/app/modules/store/wallets/wallets.actions';
import { Store } from '@ngrx/store';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { WithdrawFundsV35Component } from '../modals-v35/withdraw-funds-v35/withdraw-funds-v35.component';
import { FundYourWalletV35Component } from '../modals-v35/fund-your-wallet-v35/fund-your-wallet-v35.component';
import { RechargeMyCreditV35Component } from '../modals-v35/recharge-my-credit-v35/recharge-my-credit-v35.component';

@Injectable({
  providedIn: 'root'
})
export class WalletDataV35Service implements OnDestroy {
  private walletService = inject(WalletService);
  private payeeOnboardingService = inject(PayeeOnboardingService);
  private alertService = inject(AlertService);
  private v4AlertService = inject(V4AlertService);
  private transferDetailsService = inject(TransferDetailsService);
  private headerService = inject(HeaderService);
  // Track original cards separately from search results
  private originalCardsCache: { [walletId: string]: ICardList[] } = {};
  // private originalGiftCardsCache: { [walletId: string]: IGiftCardList[] } = {};
  private store = inject(Store);

  // Subject for search pagination
  private searchCardDataSubject = new Subject<{
    data: ICardList[];
    total?: number;
    type: 'search' | 'scroll';
  }>();

  // Signals for card pagination state
  cardPaginationLoadingSignal = signal(false);
  cardHasMoreResultsSignal = signal(true);

  /**
   * @description Private BehaviorSubject for storing wallet data.
   * The initial value of the BehaviorSubject is an empty IWalletData object.
   */
  walletDataSignal: WritableSignal<IWalletData | undefined> = signal({
    displayName: '',
    id: '',
    uuId: '',
    availableBalance: '',
    currentBalance: '',
    bankAccount_id: '',
    walletName: '',
    walletType: 0,
    bankAccountName: '',
    bankAccountNickName: '',
    bankAccountNumber: '',
    bankAccountNatureType: 0
  });

  defaultWalletAchRequests = {
    walletAchTransferRequests: undefined,
    walletAchTransaction: [],
    walletAchloading: false
  };

  // state
  private defaultState = {
    walletCards: {},
    selectedCard: undefined,
    cardLoading: false,
    cardStatusLoading: false,
    cardNumber: '',
    cardExpiry: '',
    cardSecurity: '',
    cardPinURL: '',
    cardNumberLoading: false,
    cardExpiryLoading: false,
    cardSecurityLoading: false,
    cardPinLoading: false,
    setCardPinLoading: false,
    showPinInput: false
  };

  defaultOnboarding = {
    onBoardingStatus: '', // 'rejected'|'welcome'|'index'|'submitted';
    onBoardingLoading: false,
    physicalCardStatus: false,
    virtualCardStatus: false,
    giftCardStatus: false,
    userKybRecords: [] as IKybRecords[],
    onBoardedBusiness: '' as string | undefined
  };

  defaultCardRestriction = {
    cardId: '',
    masterCardId: '',
    restrictionLoading: false,
    allowedMerchantCategoryCode: [] as string[],
    allowedMerchantCountry: [] as string[],
    allowedMerchantCity: [] as string[],
    allowedTime: {} as TimeRestriction,
    validTill: ''
  } as ICardRestrictionDetails;

  private giftCardDefaultState = {
    giftCards: {},
    selectedGiftCard: undefined,
    cardLoading: false,
    cardStatusLoading: false,
    cardNumber: '',
    cardExpiry: '',
    cardSecurity: '',
    cardBalance: '',
    cardNumberLoading: false,
    cardExpiryLoading: false
  };

  public transactionUpdated$ = new Subject<boolean>();

  externalTokenSignal = computed(
    () => this.payeeOnboardingService.payeeOnboardingSignal().externalToken
  );

  /**
   * @description Private Subject for storing wallet accounts data.
   */
  walletAccountsSignal = signal<IWalletRoot | undefined>(undefined);
  walletAccountsListSignal = computed(() => this.walletAccountsSignal()?.data);

  walletAccountsLisCardDatatSignal = signal<IWalletRoot['data']>([]);
  raincardModalLoadSignal = signal(false);

  searchWalletAccountsSignal = signal<IWalletRoot | undefined>(undefined);
  searchWalletAccountsListSignal = computed(
    () => this.walletAccountsSignal()?.data
  );

  private walletAchRequestsSignal = signal<IWalletAchSignalState>(
    this.defaultWalletAchRequests
  );

  walletAchRequestDetailsSignal = computed(
    () => this.walletAchRequestsSignal()?.walletAchTransferRequests
  );

  walletAchTransactionSignal = computed(
    () => this.walletAchRequestsSignal()?.walletAchTransaction
  );

  walletAchLoadingSignal = computed(
    () => this.walletAchRequestsSignal()?.walletAchloading
  );

  onBoardingStateSignal = signal(this.defaultOnboarding);

  onBoardingStatusSignal = computed(
    () => this.onBoardingStateSignal()?.onBoardingStatus
  );

  onBoardingLoadingSignal = computed(
    () => this.onBoardingStateSignal()?.onBoardingLoading
  );

  physicalCardStatusSignal = computed(
    () => this.onBoardingStateSignal()?.physicalCardStatus
  );

  virtualCardStatusSignal = computed(
    () => this.onBoardingStateSignal()?.virtualCardStatus
  );

  giftCardStatusSignal = computed(
    () => this.onBoardingStateSignal()?.giftCardStatus
  );

  userKybRecordsSignal = computed(
    () => this.onBoardingStateSignal()?.userKybRecords
  );

  onBoardedBusinessSignal = computed(
    () => this.onBoardingStateSignal().onBoardedBusiness
  );

  private selectedTabSignal = signal<{
    tab: 'details' | 'card';
  }>({
    tab: 'details'
  });

  private selectedTabObservable = toObservable(this.selectedTabSignal);

  set selectedWalletTab(tabInfo: { tab: 'details' | 'card' }) {
    this.selectedTabSignal.set(tabInfo);
  }

  get selectedWalletTab$(): Observable<{
    tab: 'details' | 'card';
  }> {
    return this.selectedTabObservable;
  }

  private cardTabSignal = signal<{
    tab: 'zilDebitCards' | 'giftCards';
  }>({
    tab: 'zilDebitCards'
  });

  private cardTabObservable = toObservable(this.cardTabSignal);

  set selectedCardTab(tabInfo: { tab: 'zilDebitCards' | 'giftCards' }) {
    this.cardTabSignal.set(tabInfo);
  }

  get selectedCardTab$(): Observable<{
    tab: 'zilDebitCards' | 'giftCards';
  }> {
    return this.cardTabObservable;
  }

  private requestWalletData$ = new Subject<{
    searchInput: string;
    type: 'scroll' | 'search';
  }>();

  private cardRestrictionSignal = signal<ICardRestrictionDetails>(
    this.defaultCardRestriction
  );

  // Selectors
  cardIdSignal = computed(() => this.cardRestrictionSignal()?.cardId);
  masterCardIdSignal = computed(
    () => this.cardRestrictionSignal()?.masterCardId
  );

  restrictionLoadingSignal = computed(
    () => this.cardRestrictionSignal()?.restrictionLoading
  );

  allowedMerchantNameSignal = computed(
    () => this.cardRestrictionSignal()?.allowedMerchantName
  );

  allowedMerchantIdSignal = computed(
    () => this.cardRestrictionSignal()?.allowedMerchantId
  );

  allowedMerchantCategoryCodeSignal = computed(
    () => this.cardRestrictionSignal()?.allowedMerchantCategoryCode
  );

  allowedMerchantCountrySignal = computed(
    () => this.cardRestrictionSignal()?.allowedMerchantCountry
  );

  allowedMerchantCitySignal = computed(
    () => this.cardRestrictionSignal()?.allowedMerchantCity
  );

  allowedTimeSignal = computed(() => this.cardRestrictionSignal()?.allowedTime);
  validTillSignal = computed(() => this.cardRestrictionSignal()?.validTill);

  private rainCardSignal = signal<IWalletCardsDetails>(this.defaultState);

  // Selectors
  walletCardListSignal = computed(() => this.rainCardSignal()?.walletCards);
  selectedCardSignal = computed(() => this.rainCardSignal()?.selectedCard);
  cardLoadingSignal = computed(() => this.rainCardSignal()?.cardLoading);
  cardStatusLoadingSignal = computed(
    () => this.rainCardSignal()?.cardStatusLoading
  );

  cardNumberURLSignal = computed(() => this.rainCardSignal()?.cardNumber);
  cardExpiryURLSignal = computed(() => this.rainCardSignal()?.cardExpiry);
  cardSecurityURLSignal = computed(() => this.rainCardSignal()?.cardSecurity);

  cardPinURLSignal = computed(() => this.rainCardSignal()?.cardPinURL);
  cardNumberLoadingSignal = computed(
    () => this.rainCardSignal()?.cardNumberLoading
  );

  cardExpiryLoadingSignal = computed(
    () => this.rainCardSignal()?.cardExpiryLoading
  );

  cardSecurityLoadingSignal = computed(
    () => this.rainCardSignal()?.cardSecurityLoading
  );

  cardPinLoadingSignal = computed(() => this.rainCardSignal()?.cardPinLoading);

  setCardPinLoadingSignal = computed(
    () => this.rainCardSignal()?.setCardPinLoading
  );

  showPinInputSignal = computed(() => this.rainCardSignal()?.showPinInput);

  private giftCardSignal = signal<IGiftCardsDetails>(this.giftCardDefaultState);

  // Selectors
  giftCardListSignal = computed(() => this.giftCardSignal()?.giftCards);
  selectedGiftCardSignal = computed(
    () => this.giftCardSignal()?.selectedGiftCard
  );

  giftCardLoadingSignal = computed(() => this.giftCardSignal()?.cardLoading);
  giftCardNumberSignal = computed(() => this.giftCardSignal()?.cardNumber);
  giftCardExpirySignal = computed(() => this.giftCardSignal()?.cardExpiry);
  giftCardSecuritySignal = computed(() => this.giftCardSignal()?.cardSecurity);
  giftCardBalanceSignal = computed(() => this.giftCardSignal()?.cardBalance);

  giftCardNumberLoadingSignal = computed(
    () => this.giftCardSignal()?.cardNumberLoading
  );

  giftCardExpiryLoadingSignal = computed(
    () => this.giftCardSignal()?.cardExpiryLoading
  );

  public internationalPayment = signal<IInternationalPayment>({
    selectedWallet: null,
    selectedCurrency: null,
    selectedAmount: null,
    selectedRecipient: null,
    recipientType: null,
    version: null
  });

  public internationalPaymentPayloadSignal = signal<
    IWalletInternationaPaymentAcceptPayload | undefined
  >(undefined);

  // Getter for search card data observable
  getSearchCardData(): Observable<{
    data: ICardList[];
    total?: number;
    type: 'search' | 'scroll';
  }> {
    return this.searchCardDataSubject.asObservable();
  }

  interSelectedWalletSignal = computed(
    () => this.internationalPayment()?.selectedWallet
  );

  interSelectedCurrencySignal = computed(
    () => this.internationalPayment()?.selectedCurrency
  );

  interAmountSignal = computed(
    () => this.internationalPayment()?.selectedAmount
  );

  interSelectedRecipientSignal = computed(
    () => this.internationalPayment()?.selectedRecipient
  );

  // private walletListLastPage$ = new Subject<IWalletData[]>();
  private walletListLastPage$ = new Subject<IWalletRoot>();
  private dialog = inject(MatDialog);
  private router = inject(Router);
  public isLoading = false;
  subscriptions: Subscription[] = [];
  page = 1;
  isGridView = true;
  searchInput: string;
  searchFlag = false;
  tempSeletedItem: IWalletData;
  requestType: string;
  scolled = false;
  cardUpdatedOrAdded: boolean = false;
  giftCardUpdatedOrAdded: boolean = false;
  totalCreatedcardCount = signal<number>(0);

  toggleView(value: { gridView: boolean }) {
    this.isGridView = value.gridView;
  }

  /**
   * Opens a modal based on the provided action.
   * @param {Object} action - The  object containing walletId and walletAction.
   */
  openModal(action: { wallet?: IWalletData; walletAction: number },isV4 = false) {
    if (action.walletAction === 1) {
      this.openFundYourSpecificWalletModal(action.wallet);
      return;
    }
    if (action.walletAction === 2) {
      this.openRechargeMySpecificCreditsModal(action.wallet);
      return;
    }
    if (action.walletAction === 3) {
      this.openTransferSpecificFundsModal();
      return;
    }
    if (action.walletAction === 4) {
      this.openWithdrawSpecificFundsModal(action.wallet);
    }

    if (action.walletAction === 5) {
      this.downloadStatement(action.wallet?.uuId as string);
    }

    if (action.walletAction === 6) {
      if (!action.wallet) return;
      this.makeFavorite(action.wallet,isV4);
    }
  }

  makeFavorite(wallet: IWalletData,isV4 = false) {
    this.walletService
      .makeFavorite(wallet.id, wallet.isFavorite ? 'unfavorite' : 'favorite')
      .subscribe((val) => {
        if (val.success) {
          const data = [...(this.walletAccountsSignal()?.data ?? [])];
          if (!data.length) return;

          let index: number | undefined;
          const item = data.find((el, i) => {
            index = i;
            return el.id === wallet.id;
          });

          if (!item || typeof index === 'undefined') return;

          data.splice(index, 1);

          const totalFavorites = data.reduce((prev, curr) => {
            if (curr.isFavorite === 1) {
              // eslint-disable-next-line no-param-reassign
              prev += 1;
              return prev;
            }
            return prev;
          }, 0);

          if (!wallet.isFavorite) {
            data.splice(totalFavorites, 0, { ...item, isFavorite: 1 });
          }

          if (wallet.isFavorite) {
            data.splice(totalFavorites, 0, {
              ...item,
              isFavorite: 0
            });
          }

          if(isV4) {
            this.v4AlertService.successAlert({ close: true });
          } else {
            this.alertService.successAlert({ close: true });
          }
          this.walletAccountsSignal.update((el) =>
            !el
              ? undefined
              : {
                  ...el,
                  data
                }
          );
        }
      });
  }

  /**
   * @description Opens the FundYourWallet modal for a specific wallet.
   * @param  wallet - Selected Wallet Data.
   */
  openFundYourSpecificWalletModal(wallet?: IWalletData): void {
    const modal = this.dialog.open(FundYourWalletV35Component, {
      width: '700px',
      maxWidth: '93%',
      disableClose: true,
      data: wallet || undefined
    });
    modal.afterClosed().subscribe((res) => {
      if (res?.closedFrom === 'close-button') {
        return;
      }
      if (res !== false) {
        this.subscriptions.push(
          this.refreshWalletDataAndStore().subscribe(() => {
            this.transactionUpdated$.next(true);
          })
        );
      }
    });
  }

  /**
   * Opens the RechargeMyCredits modal for a specific wallet.
   * @param  wallet - Selected Wallet Data.
   */
  openRechargeMySpecificCreditsModal(wallet?: IWalletData): void {
    const modal = this.dialog.open(RechargeMyCreditV35Component, {
      width: '650px',
      maxWidth: '93%',
      disableClose: true,
      data: wallet || undefined
    });
    modal.afterClosed().subscribe((res) => {
      if (res !== false) {
        this.subscriptions.push(
          this.refreshWalletDataAndStore().subscribe(() => {
            this.transactionUpdated$.next(true);
          })
        );
      }
    });
  }

  /**
   * Opens the TransferFunds modal for a specific wallet.
   * @param  wallet - Selected Wallet Data.
   */
  openTransferSpecificFundsModal(): void {
    if (this.externalTokenSignal()) {
      this.router.navigate(['/manage/payee-onboarding/set-password']);
      return;
    }

    if (!this.walletDataSignal()) return;

    this.transferDetailsService.setData({
      transferFrom: 2,
      transferFromId: this.walletDataSignal()?.uuId as string,
      displayName: this.walletDataSignal()?.walletName
        ? `${this.walletDataSignal()?.walletName} (${this.walletDataSignal()?.availableBalance}) (${this.walletDataSignal()?.bankAccountNumber})`
        : ''
    });
    this.router.navigate(['/manage/transfers']);
  }

  /**
   * @description Opens the WithdrawFunds modal for a specific wallet.
   * @param  wallet - Selected Wallet Data.
   */
  openWithdrawSpecificFundsModal(wallet?: IWalletData): void {
    const modal = this.dialog.open(WithdrawFundsV35Component, {
      width: '650px',
      maxWidth: '93%',
      disableClose: true,
      data: wallet || undefined
    });
    modal.afterClosed().subscribe((res) => {
      if (res !== false) {
        this.subscriptions.push(
          this.refreshWalletDataAndStore().subscribe(() => {
            this.transactionUpdated$.next(true);
          })
        );

      }
    });
  }

  /**
   * @description Refreshes both local wallet data and NgRx store
   */
  refreshWalletDataAndStore() {
    this.isLoading = true;
    const isV4 = this.router.url.includes('v4');
    const currentWalletId = isV4 ? this.walletDataSignal()?.id : undefined;
    const currentWalletUuId = isV4 ? this.walletDataSignal()?.uuId : undefined;

    return this.walletService
      .getWalletInformation(1, '', undefined, false)
      .pipe(
        finalize(() => {
          this.isLoading = false;
        }),
        tap((res) => {
          if (res) {
            this.headerService.onRefreshDynamicHeader = true;
            this.walletAccountsSignal.set(res);
            this.walletAccountsLisCardDatatSignal.set(res.data);

            // Master wallet logic
            if (this.payeeOnboardingService.payeeOnboardingSignal().initiatorId) {
              const masterWallet = res.data.find(val => val.walletName === 'Master Wallet');
              if (masterWallet) {
                isV4 ? this.walletDataSignal.set(masterWallet) : this.setData(masterWallet);
              }
            }

            // Store and header updates
            this.store.dispatch(WalletsActions.walletsReset());
            this.store.dispatch(WalletsActions.loadWallets({ searchTerm: '' }));

            // Version-specific balance refresh
            if (isV4) {
              this.refreshSelectedWalletV4(res, currentWalletId, currentWalletUuId);
            } else {
              this.refreshSelectedWalletV3();
            }
          }
        })
      );
  }

  /**
   * @description V3 balance refresh: uses setData() which respects searchFlag guard
   */
  private refreshSelectedWalletV3() {
    const current = this.walletAccountsSignal()?.data?.filter(
      (item) => item.uuId === this.walletDataSignal()?.uuId
    );
    if (current?.length) {
      this.transactionUpdated$.next(true);
      this.setData(current[0]);
    }
    if (!this.walletDataSignal()?.uuId) {
      const data = this.walletDataSignal();
      this.transactionUpdated$.next(true);
      if (data) this.setData(data);
    }
  }

  /**
   * @description V4 balance refresh: bypasses searchFlag, supports fallback fetch for wallets not on page 1
   */
  private refreshSelectedWalletV4(res: IWalletRoot, currentWalletId?: string, currentWalletUuId?: string) {
    if (currentWalletUuId) {
      const current = res.data?.find(
        (item) => item.uuId === currentWalletUuId
      );
      if (current) {
        this.walletDataSignal.set(current);
      } else if (currentWalletId) {
        // Wallet not on page 1, fetch it by ID
        this.walletService
          .getWalletInformationByIds([currentWalletId])
          .pipe(take(1))
          .subscribe((walletRes) => {
            const wallet = walletRes?.data?.find(
              (w) => w.uuId === currentWalletUuId
            );
            if (wallet) {
              this.walletDataSignal.set(wallet);
            }
            this.transactionUpdated$.next(true);
          });
      }
    }
    this.transactionUpdated$.next(true);
  }

  /**
   * @description download wallet statement.
   * @param walletId - Selected wallet uuId.
   */
  downloadStatement(walletId: string): void {
    this.dialog.open(DownloadStatementComponent, {
      width: '500px',
      maxWidth: '95%',
      disableClose: true,
      data: { page: 'wallet', id: walletId }
    });
  }

  /**
   * @description This method allows subscribing to changes in the wallet data.
   * @returns  An Signal of type IWalletData.
   */
  getData(): IWalletData | undefined {
    return this.walletDataSignal();
  }

  /**
   * @description This method updates the value of the wallet data with the provided value.
   * @param value - The new value of the wallet data.
   */
  setData(value: IWalletData) {
    if (this.searchFlag) return;
    this.walletDataSignal.set(value);
  }

  /**
   *
   * @description Retrieves the wallet accounts.
   * @returns An observable emitting the wallet accounts.
   */
  getWallets(): Signal<IWalletRoot | undefined> {
    return this.walletAccountsSignal;
  }

  /**
   * @description Retrieves and sets the wallet information for the user.
   */
  setWallets(page = 1, unmapped = false,cardProgram = false) {
    this.isLoading = true;
    this.subscriptions.push(
      this.walletService
        .getWalletInformation(page, '', undefined, unmapped,cardProgram)
        .pipe(
          finalize(() => {
            this.isLoading = false;
          })
        )
        .subscribe({
          next: (res) => {
            if (res) {
              this.walletAccountsSignal.set(res);
              this.walletAccountsLisCardDatatSignal.set(res.data);

              if (
                page === 1 &&
                this.payeeOnboardingService.payeeOnboardingSignal().initiatorId
              ) {
                const masterWallet = res.data.find(
                  (val) => val.walletName === 'Master Wallet'
                );

                if (masterWallet) {
                  this.setData(masterWallet);
                }
              }
            }
          },
          error: (err) => {
            if (err.error.permissionType === 'page') {
              this.router.navigateByUrl(
                this.router.url.includes('v4') ? '/v4/manage/permission-denied' : '/manage/permission-denied'
              );
            }
          }
        })
    );
  }

  /**
   * @description Method to set data to set wallet data request.
   * @param searchInput - Search term.
   * @param type - Type of event : scroll or search
   */
  setRequestWalletData(type: 'scroll' | 'search', searchInput = '') {
    this.requestType = type;
    this.requestWalletData$.next({ searchInput, type });
    this.searchInput = searchInput;
    if (searchInput.length === 0) {
      this.scolled = false;
    }
  }

  /**
   * @description Invokes `this.loadWalletData` when `this.requestWalletData$` subject gets data.
   */
  loadRequestWalletData() {
    this.subscriptions.push(
      this.requestWalletData$
        .pipe(debounceTime(700), distinctUntilChanged())
        .subscribe((res) => {
          if (res.type === 'scroll') {
            this.page += 1;
            if (this.searchInput.length > 0) {
              this.scolled = true;
            }
          } else if (res.type === 'search') {
            this.page = 1;
          }
          this.loadWalletData(this.page, res.searchInput);
        })
    );
  }

  /**
   * @description Loads 20 items from `getWalletInformation()` method of wallet service and
   *  sets it to `this.walletListLastPage$` subject.
   * @param page
   * @param searchInput
   */
  loadWalletData(page = 1, searchInput = '') {
    this.searchFlag = false;
    if (searchInput && this.scolled === false) {
      this.isLoading = true;
      this.walletAccountsSignal.update((val) =>
        !val
          ? undefined
          : {
              ...val,
              data: []
            }
      );
    }
    this.subscriptions.push(
      this.walletService
        .getWalletInformation(page, searchInput)
        .pipe(
          take(1),
          finalize(() => {
            this.isLoading = false;
          })
        )
        .subscribe((res) => {
          this.walletListLastPage$.next(res);
          if (res.data.length > 0) {
            if (searchInput && page === 1) {
              this.setData(res.data[0]);
              this.searchFlag = true;
            }
            if (this.tempSeletedItem?.id && searchInput.length === 0) {
              this.setData(this.tempSeletedItem);
            }
          }
        })
    );
  }

  /**
   * @description Getter method for `this.walletListLastPage$` subject.
   * @returns  `this.walletListLastPage$` subject as Observable.
   */
  getWalletData(): Observable<IWalletRoot> {
    return this.walletListLastPage$.asObservable();
  }

  /**
   * @description Get the wallet ach Tranfer requests details.
   * @param {string}id Selected transfer id.
   */
  getWalletAchRequests(id: string) {
    this.walletAchRequestsSignal.update((value) => ({
      ...value,
      walletAchloading: true
    }));
    this.subscriptions.push(
      this.walletService
        .getWalletAchReq(id)
        .pipe(
          finalize(() => {
            this.walletAchRequestsSignal.update((value) => ({
              ...value,
              walletAchloading: false
            }));
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.walletAchRequestsSignal.update((value) => ({
              ...value,
              walletAchTransferRequests: res.data.transferRequest
            }));
            this.updateStatus(res.data.achTransactions);
          }
        })
    );
  }

  /**
   * @description Update the status to corresponding value.
   * @param transactions Transaction data.
   */
  updateStatus(transactions: IWalletAchTransaction[]) {
    const updatedTransactions = transactions.map((item) => {
      const updatedItem = { ...item };

      switch (item.wallet_txn_status) {
        case 0:
          updatedItem.status = 'Pending';
          break;
        case 1:
          updatedItem.status = 'Processing';
          break;
        case 2:
          updatedItem.status = 'Success';
          break;
        case 3:
          updatedItem.status = 'Failed';
          break;
        default:
          updatedItem.status = 'Unknown';
      }

      return updatedItem;
    });
    transactions.splice(0, transactions.length, ...updatedTransactions);
    this.walletAchRequestsSignal.update((value) => ({
      ...value,
      walletAchTransaction: transactions
    }));
  }

  cardOnBoardingStatus(status?: 'submit', walletId?: string, cardId?: string) {
    if (status) {
      this.onBoardingStateSignal.update((value) => ({
        ...value,
        onBoardingStatus: 'submitted'
      }));
    }
    this.onBoardingStateSignal.update((value) => ({
      ...value,
      onBoardingLoading: true
    }));
    if (walletId) {
      this.selectCard(undefined);
      this.subscriptions.push(
        this.walletService
          .getCardOnboardingStatus(walletId)
          .pipe(
            finalize(() => {
              this.onBoardingStateSignal.update((value) => ({
                ...value,
                onBoardingLoading: false
              }));
            })
          )
          .subscribe((res) => {
            if (res.success) {
              this.totalCreatedcardCount.set(res.data.total_created_card_count);
              this.onBoardingStateSignal.update((value) => ({
                ...value,
                physicalCardStatus: res.data.physical_card_enabled,
                virtualCardStatus: res.data.virtual_card_enabled,
                giftCardStatus: res.data.gift_card_enabled,
                userKybRecords: res.data.active_user_kyb_records,
                onBoardedBusiness: res.data.wallet_onboard?.business_id
              }));
              switch (res.data.wallet_onboard?.status) {
                case 'completed':
                  this.onBoardingStateSignal.update((value) => ({
                    ...value,
                    onBoardingStatus: 'index'
                  }));
                  break;
                case 'pending':
                  this.onBoardingStateSignal.update((value) => ({
                    ...value,
                    onBoardingStatus: 'submitted'
                  }));
                  break;
                case 'onReview':
                  this.onBoardingStateSignal.update((value) => ({
                    ...value,
                    onBoardingStatus: 'submitted'
                  }));
                  break;
                case 'approved':
                  this.onBoardingStateSignal.update((value) => ({
                    ...value,
                    onBoardingStatus: 'submitted'
                  }));
                  break;
                case 'submitted':
                  this.onBoardingStateSignal.update((value) => ({
                    ...value,
                    onBoardingStatus: 'submitted'
                  }));
                  break;
                case 'error':
                  this.onBoardingStateSignal.update((value) => ({
                    ...value,
                    onBoardingStatus: 'submitted'
                  }));
                  break;
                case 'rejected':
                  this.onBoardingStateSignal.update((value) => ({
                    ...value,
                    onBoardingStatus: 'rejected'
                  }));
                  break;
                default:
                  this.onBoardingStateSignal.update((value) => ({
                    ...value,
                    onBoardingStatus: 'welcome'
                  }));
                  break;
              }
              if (this.onBoardingStatusSignal() === 'index') {
                if (cardId) {
                  this.getCardDetails('select', walletId, cardId);
                  this.getGiftCardDetails('select', walletId, cardId);
                } else {
                  this.getCardDetails('', walletId);
                  this.getGiftCardDetails('', walletId);
                }
              } else {
                this.selectCard(undefined);
              }
              if (
                this.onBoardingStatusSignal() === 'welcome' ||
                this.onBoardingStatusSignal() === 'rejected'
              ) {
                this.selectedWalletTab = { tab: 'details' };
              }
            }
          })
      );
      return;
    }
    this.subscriptions.push(
      this.walletService
        .getCardOnboardingStatus()
        .pipe(
          finalize(() => {
            this.onBoardingStateSignal.update((value) => ({
              ...value,
              onBoardingLoading: false
            }));
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.onBoardingStateSignal.update((value) => ({
              ...value,
              physicalCardStatus: res.data.physical_card_enabled,
              virtualCardStatus: res.data.virtual_card_enabled
            }));
            switch (res.data.status) {
              case 'Approved':
                this.onBoardingStateSignal.update((value) => ({
                  ...value,
                  onBoardingStatus: 'index'
                }));
                break;
              case 'In Review':
                this.onBoardingStateSignal.update((value) => ({
                  ...value,
                  onBoardingStatus: 'submitted'
                }));
                break;
              case 'Pending':
                this.onBoardingStateSignal.update((value) => ({
                  ...value,
                  onBoardingStatus: 'submitted'
                }));
                break;
              case 'No Application':
                this.onBoardingStateSignal.update((value) => ({
                  ...value,
                  onBoardingStatus: 'welcome'
                }));
                break;
              case 'Rejected':
                this.onBoardingStateSignal.update((value) => ({
                  ...value,
                  onBoardingStatus: 'rejected'
                }));
                break;
              case 'Suspended':
                this.onBoardingStateSignal.update((value) => ({
                  ...value,
                  onBoardingStatus: 'index'
                }));
                break;
              default:
                this.onBoardingStateSignal.update((value) => ({
                  ...value,
                  onBoardingStatus: 'welcome'
                }));
                break;
            }
          }
        })
    );
  }

  getCardDetails(
    type?: string,
    walId?: string,
    cardId?: string,
    page = 1,
    term?: string
  ) {
    const walletId = walId || this.walletAccountsSignal()?.data[0].uuId;
    if (!walletId) {
      return;
    }

    // Handle search vs normal load logic
    if (!term && type !== 'loadMore') {
      // Normal load: check cache first (but skip for pagination)
      const existingWalletIds = Object.keys(this.rainCardSignal().walletCards);
      if (existingWalletIds.includes(walletId) && !this.cardUpdatedOrAdded) {
        if (this.originalCardsCache[walletId]) {
          const walletCard = { [walletId]: this.originalCardsCache[walletId] };
          const walletCards = {
            ...this.rainCardSignal().walletCards,
            ...walletCard
          };
          this.rainCardSignal.update((value) => ({
            ...value,
            ...{ walletCards }
          }));
          // Use the correct reference
          const restoredCards = this.originalCardsCache[walletId];
          if (restoredCards && restoredCards.length > 0) {
            this.selectCard(restoredCards[0]);
          }
          return;
        }
      }
    }

    this.cardUpdatedOrAdded = false;
    this.rainCardSignal.update((value) => ({ ...value, cardLoading: true }));

    this.subscriptions.push(
      this.walletService
        .getCardDetails(walletId, page, term)
        .pipe(
          finalize(() => {
            this.rainCardSignal.update((value) => ({
              ...value,
              cardLoading: false
            }));
          })
        )
        .subscribe({
          next: (res) => {
            const { data } = res;

            if (data.length === 0 && type === 'loadMore') {
              this.cardPaginationLoadingSignal.set(false);
              this.cardHasMoreResultsSignal.set(false);
              return;
            }

            if (term) {
              // For search: handle both new search and load more
              let walletCard;
              if (walletId) {
                if (type === 'loadMore') {
                  // Append to existing search results
                  const existingCards =
                    this.rainCardSignal().walletCards[walletId] || [];
                  walletCard = { [walletId]: [...existingCards, ...data] };
                } else {
                  // Replace with new search results
                  walletCard = { [walletId]: data };
                }
              }

              const walletCards = {
                ...this.rainCardSignal().walletCards,
                ...walletCard
              };

              this.rainCardSignal.update((value) => ({
                ...value,
                ...{ walletCards }
              }));

              // Select first search result only for new search
              if (type !== 'loadMore') {
                if (data && data.length > 0) {
                  this.selectCard(data[0]);
                } else {
                  this.selectCard(undefined);
                }
              }

              // Handle pagination state for search operations
              if (type === 'loadMore') {
                this.cardPaginationLoadingSignal.set(false);
                this.cardHasMoreResultsSignal.set(data.length > 0 && data.length >= 13); // pageSize
              }

              // Emit search pagination data
              this.searchCardDataSubject.next({
                data,
                total: res.data.length,
                type: type === 'loadMore' ? 'scroll' : 'search'
              });
            } else {
              // For normal load: cache the results and update
              if (!this.originalCardsCache[walletId]) {
                this.originalCardsCache[walletId] = data;
              }

              let walletCard;
              if (walletId) {
                if (type === 'loadMore') {
                  // Append to existing cards for pagination
                  const existingCards =
                    this.rainCardSignal().walletCards[walletId] || [];
                  walletCard = { [walletId]: [...existingCards, ...data] };
                } else {
                  // Replace cards for normal load
                  walletCard = { [walletId]: data };
                }
              }
              const walletCards = {
                ...this.rainCardSignal().walletCards,
                ...walletCard
              };

              this.rainCardSignal.update((value) => ({
                ...value,
                ...{ walletCards }
              }));

              if (data && data.length) {
                if (type === 'edit') {
                  const selectedCardId =
                    this.rainCardSignal().selectedCard?.id ?? cardId;
                  const selectedCard = data.find(
                    (item) => item.id === selectedCardId
                  );
                  this.selectCard(selectedCard ?? data[0]);
                  return;
                }
                if (type === 'create') {
                  this.selectCard(data[data.length - 1]);
                  return;
                }
                if (type === 'select') {
                  const selectedCardId = cardId;
                  const selectedCard = data.find(
                    (item) => item.id === selectedCardId
                  );
                  this.selectCard(selectedCard ?? data[0]);
                  return;
                }
                if (type === 'loadMore') {
                  // For pagination, don't change selection but update pagination state
                  this.cardPaginationLoadingSignal.set(false);
                  this.cardHasMoreResultsSignal.set(data.length > 0 && data.length >= 13); // pageSize
                  return;
                }
                this.selectCard(data[0]);
                return;
              }
              this.selectCard(undefined);
            }
          },
          error: (error) => {
            // Error handling for card details fetch
            this.rainCardSignal.update((value) => ({
              ...value,
              cardLoading: false
            }));
            this.selectCard(undefined);
          }
        })
    );
  }

  /**
   * Gets gift card details from API
   * @param type Optional type for operation ('edit', 'create', or 'select')
   * @param walId Optional wallet ID
   * @param cardId Optional card ID to select
   */
  getGiftCardDetails(type?: string, walId?: string, cardId?: string) {
    const walletId = walId || this.walletAccountsSignal()?.data[0].uuId;
    if (!walletId) return;

    const existingWalletIds = Object.keys(this.giftCardSignal().giftCards);
    if (existingWalletIds.includes(walletId) && !this.giftCardUpdatedOrAdded) {
      const giftCard = this.giftCardSignal().giftCards[walletId];
      this.selectGiftCard(giftCard[0]);
      return;
    }

    this.giftCardUpdatedOrAdded = false;
    this.giftCardSignal.update((value) => ({ ...value, cardLoading: true }));

    this.subscriptions.push(
      this.walletService
        .getGiftCardDetails(walletId)
        .pipe(
          finalize(() => {
            this.giftCardSignal.update((value) => ({
              ...value,
              cardLoading: false
            }));
          })
        )
        .subscribe((res) => {
          const { data } = res;
          let giftCard;

          if (walletId) {
            giftCard = { [walletId]: data };
          }

          const giftCards = {
            ...this.giftCardSignal().giftCards,
            ...giftCard
          };

          this.giftCardSignal.update((value) => ({
            ...value,
            ...{ giftCards }
          }));

          if (data.length) {
            if (type === 'edit') {
              const selectedCardId =
                this.giftCardSignal().selectedGiftCard?.id ?? cardId;
              const selectedCard = data.find(
                (item) => item.id === selectedCardId
              );
              this.selectGiftCard(selectedCard ?? data[0]);
              return;
            }

            if (type === 'create') {
              this.selectGiftCard(data[data.length - 1]);
              return;
            }

            if (type === 'select') {
              const selectedCardId = cardId;
              const selectedCard = data.find(
                (item) => item.id === selectedCardId
              );
              this.selectGiftCard(selectedCard ?? data[0]);
              return;
            }

            this.selectGiftCard(data[0]);
            return;
          }

          this.selectGiftCard(undefined);
        })
    );
  }

  selectCard(data: ICardList | undefined) {
    this.rainCardSignal.update((value) => ({ ...value, selectedCard: data }));
    this.getCardRestrictionSettings(data?.id ?? '');
    this.clearCardInfo();
  }

  /**
   * Selects a gift card and updates relevant state
   * @param data The gift card to select or undefined to clear selection
   */
  selectGiftCard(data: IGiftCardList | undefined) {
    this.giftCardSignal.update((value) => ({
      ...value,
      selectedGiftCard: data
    }));
    this.clearGiftCardInfo();
  }

  getCardRestrictionSettings(cardId: string) {
    if (cardId) {
      this.cardRestrictionSignal.update((value) => ({
        ...value,
        restrictionLoading: true
      }));
      this.subscriptions.push(
        this.walletService
          .getCardRestriction(cardId)
          .pipe(
            finalize(() => {
              this.cardRestrictionSignal.update((value) => ({
                ...value,
                restrictionLoading: false
              }));
            })
          )
          .subscribe((res) => {
            if (res.success) {
              this.cardRestrictionSignal.update((value) => ({
                ...value,
                cardId: res.data.card_id,
                masterCardId: res.data.master_card_id,
                allowedMerchantName: res.data.allowed_merchant_names ?? [],
                allowedMerchantId: res.data.allowed_merchant_id ?? [],
                allowedMerchantCategoryCode:
                  res.data.allowed_merchant_category_code ?? [],
                allowedMerchantCountry: res.data.allowed_merchant_country ?? [],
                allowedMerchantCity: res.data.allowed_merchant_city ?? [],
                allowedTime: res.data.allowed_time ?? ({} as TimeRestriction),
                validTill: res.data.valid_till ?? ''
              }));
            }
          })
      );
    }
  }

  revealCard(card: ICardList) {
    const data = {};
    this.rainCardSignal.update((value) => ({
      ...value,
      cardNumberLoading: true
    }));
    this.subscriptions.push(
      this.walletService
        .showCard(card.id, data)
        .pipe(
          finalize(() => {
            this.rainCardSignal.update((value) => ({
              ...value,
              cardNumberLoading: false
            }));
          })
        )
        .subscribe({
          next: (res) => {
            const selectedCardId = this.rainCardSignal().selectedCard?.id;
            const {
              secretKey,
              token: { encryptedPan, encryptedCvc }
            } = res.data;
            if (card.id === selectedCardId) {
              this.decryptSecret(
                encryptedPan.data,
                encryptedPan.iv,
                secretKey
              ).then((decryptedcardNumber) => {
                this.rainCardSignal.update((value) => ({
                  ...value,
                  cardNumber:
                    decryptedcardNumber.match(/.{1,4}/g)?.join(' ') ||
                    decryptedcardNumber
                }));
              });
              this.decryptSecret(
                encryptedCvc.data,
                encryptedCvc.iv,
                secretKey
              ).then((security) => {
                this.rainCardSignal.update((value) => ({
                  ...value,
                  cardSecurity: security
                }));
              });
              this.rainCardSignal.update((value) => ({
                ...value,
                cardExpiry: `${res.data.expiryMonth?.toString()?.padStart(2, '0')}/${res.data.expiryYear?.slice(-2)}`
              }));
            }
          },
          error: (err) => {
            if (err.error.errorCode === '112') {
              this.openOtpModal(err.error, card);
            }
          }
        })
    );
  }

  async decryptSecret(
    base64Secret: string,
    base64Iv: string,
    secretKey: string
  ): Promise<string> {
    if (!base64Secret) throw new Error('base64Secret is required');
    if (!base64Iv) throw new Error('base64Iv is required');
    if (!secretKey || !/^[0-9A-Fa-f]+$/.test(secretKey)) {
      throw new Error('secretKey must be a hex string');
    }

    const secret = Uint8Array.from(atob(base64Secret), (c) => c.charCodeAt(0));
    const iv = Uint8Array.from(atob(base64Iv), (c) => c.charCodeAt(0));
    const secretKeyArrayBuffer = Uint8Array.from(
      (secretKey.match(/.{1,2}/g) ?? []).map((byte) => parseInt(byte, 16))
    );

    const cryptoKey = await window.crypto.subtle.importKey(
      'raw',
      secretKeyArrayBuffer,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );

    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv
      },
      cryptoKey,
      secret
    );

    return new TextDecoder().decode(decrypted);
  }

  openOtpModal(
    error: Record<string, unknown>,
    card: ICardList,
    isCardPin = false
  ) {
    const dialog = this.dialog.open(OtpModalComponent, {
      maxWidth: '410px',
      width: '100%',
      disableClose: true,
      autoFocus: false,
      data: error
    });
    dialog.afterClosed().subscribe((res) => {
      if (res) {
        if (!isCardPin) {
          this.revealCard(card);
        }
      }
    });
  }

  changeStatus(card: ICardList) {
    const data = {
      status: card.cardStatus === 'active' ? 'inactive' : 'active'
    };
    this.rainCardSignal.update((value) => ({
      ...value,
      cardStatusLoading: true
    }));
    this.subscriptions.push(
      this.walletService
        .toggleCardStatus(card.id, data)
        .pipe(
          finalize(() => {
            this.rainCardSignal.update((value) => ({
              ...value,
              cardStatusLoading: false
            }));
          })
        )
        .subscribe({
          next: (res) => {
            if (res.success) {
              this.alertService.successAlert({
                content: 'Status changed successfully'
              });
              const walletData = this.walletDataSignal();
              if (this.rainCardSignal().selectedCard && walletData?.uuId) {
                const updatedAccountCardList =
                  this.rainCardSignal().walletCards[walletData.uuId].map(
                    (val) => {
                      if (val.id === this.rainCardSignal().selectedCard?.id) {
                        const updatedCard = { ...val, cardStatus: data.status };
                        return updatedCard;
                      }
                      return val;
                    }
                  );
                this.rainCardSignal.update((value) => ({
                  ...value,
                  walletCards: {
                    ...this.rainCardSignal().walletCards,
                    [walletData.uuId ?? '']: updatedAccountCardList
                  },
                  selectedCard: {
                    ...(this.rainCardSignal().selectedCard as ICardList),
                    cardStatus: data.status
                  }
                }));
              }
            }
          },
          error: (err) => {
            if (err.error.errorCode === '112') {
              const dialog = this.dialog.open(OtpModalComponent, {
                maxWidth: '410px',
                width: '100%',
                disableClose: true,
                autoFocus: false,
                data: err.error
              });
              dialog.afterClosed().subscribe((response) => {
                if (response) {
                  this.changeStatus(card);
                }
              });
            }
          }
        })
    );
  }

  setPinInputVisibility(visible: boolean) {
    this.rainCardSignal.update((value) => ({
      ...value,
      showPinInput: visible
    }));
  }

  clearCardInfo() {
    this.rainCardSignal.update((value) => ({ ...value, cardNumber: '' }));
    this.rainCardSignal.update((value) => ({ ...value, cardExpiry: '' }));
    this.rainCardSignal.update((value) => ({ ...value, cardSecurity: '' }));
    this.rainCardSignal.update((value) => ({ ...value, cardPinURL: '' }));
  }

  /**
   * Clears gift card sensitive information
   */
  clearGiftCardInfo() {
    this.giftCardSignal.update((value) => ({
      ...value,
      cardNumber: '',
      cardExpiry: '',
      cardSecurity: '',
      cardBalance: ''
    }));
  }

  setWalletsForWalletenabled(page = 1, search = '', unmaped = false) {
    this.raincardModalLoadSignal.set(true);
    this.subscriptions.push(
      this.walletService
        .getWalletInformation(page, search, undefined, unmaped)
        .pipe(
          finalize(() => {
            this.raincardModalLoadSignal.set(false);
          })
        )
        .subscribe({
          next: (res) => {
            if (res) {
              const existingWallets = this.walletAccountsLisCardDatatSignal();
              const newWallets = res.data ?? [];

              const mergedWallets =
                page === 1 ? newWallets : [...existingWallets, ...newWallets];

              this.walletAccountsLisCardDatatSignal.set(mergedWallets);
            }
          },
          error: (err) => {
            if (err.error.permissionType === 'page') {
              this.router.navigateByUrl(
                this.router.url.includes('v4') ? '/v4/manage/permission-denied' : '/manage/permission-denied'
              );
            }
          }
        })
    );
  }

  getTransactionDetails() {
    return this.walletService.getTransactionDetails();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    this.walletDataSignal.set(undefined);
    this.walletAccountsSignal.set(undefined);
    this.walletAchRequestsSignal.set(this.defaultWalletAchRequests);
    this.onBoardingStateSignal.set(this.defaultOnboarding);
    this.originalCardsCache = {};
  }
}

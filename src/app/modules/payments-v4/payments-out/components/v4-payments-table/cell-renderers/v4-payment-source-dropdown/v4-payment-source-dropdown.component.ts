import { CommonFilterIconComponent } from 'src/app/shared/components/common-filter-icon/common-row-filter.component';
import { ICellRendererParams } from '@ag-grid-community/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { Actions, ofType } from '@ngrx/effects';
import {
  ChangeDetectorRef,
  Component,
  NgZone,
  OnDestroy,
  ViewChild,
  inject
} from '@angular/core';
import { closeOnOutsideScroll } from 'src/app/shared/utils/close-on-outside-scroll.util';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { PaymentSourceModalV4Component } from 'src/app/modules/verification-center-v4/modals/payment-source-modal-v4/payment-source-modal-v4.component';
import { PaymentSourceResult } from 'src/app/modules/verification-center-v4/models/verification-v4.model';
import { NgSelectComponent, NgSelectModule } from '@ng-select/ng-select';
import { ICommonTransactionTableData, ISource } from 'src/app/models/v3-common';
import {
  IUpdatePaymentBody,
  TPaymentSource
} from 'src/app/modules/payments/model/payments';
import { V3PaymentsTableService } from 'src/app/modules/v3-payments-table/shared/components/v3-payments-table/v3-payments-table.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { V3PaymentsTableData } from 'src/app/modules/v3-payments-table/shared/components/v3-payments-table/v3-payments-table-data';
import {
  Observable,
  Subscription,
  combineLatest,
  map,
  startWith,
  switchMap,
  take
} from 'rxjs';
import { IExistingCreditCards } from 'src/app/models/payment-switch-board';
import { IWalletData } from 'src/app/models/wallet';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { bankAccountsActions } from 'src/app/modules/store/bankAccounts/bank-accounts.actions';
import {
  selectBankAccountsState,
  selectIsBankAccountsByIdLoading
} from 'src/app/modules/store/bankAccounts/bank-accounts.selectors';
import { IBankAccountsState, IBankDropdown } from 'src/app/models/bank';
import { WalletsActions } from 'src/app/modules/store/wallets/wallets.actions';
import {
  selectFilteredWallets,
  selectIsWalletsByIdLoading,
  selectIsWalletsFilterOn,
  selectIsWalletsLoading,
  selectIsWalletsPermissionDenied,
  selectWallets
} from 'src/app/modules/store/wallets/wallets.selectors';
import { CardsActions } from 'src/app/modules/store/cards/cards.actions';
import {
  selectCards,
  selectIsCardsLoading
} from 'src/app/modules/store/cards/cards.selectors';
import { MatTooltip, MatTooltipModule } from '@angular/material/tooltip';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { environment } from 'src/environments/environment';
import { WhiteLabelDirective } from 'src/app/directive/white-label.directive';
import { AddBankMethodChoiceModalComponent } from 'src/app/modules/bank/bank-v4/v4-modals/add-bank-method-choice-modal/add-bank-method-choice-modal.component';
import { CustomDoubleSideModalService } from 'src/app/shared/modal/custom-double-side-modal';
import { LucideAngularModule } from 'lucide-angular';

interface IsourceType {
  sourceId: string;
  sourceType: string;
}

/**
 * A single row in the unified funding-source picker. Wallets, bank accounts and
 * cards are flattened into one list and grouped by `group`. `raw` is the value
 * the existing update logic expects for that type (bank → id string, wallet →
 * wallet object, card → card object).
 */
export interface IFundingSource {
  id: string;
  type: 'BANK' | 'WALLET' | 'CARD';
  group: 'Current Selected' | 'Wallets' | 'Bank Accounts' | 'Cards';
  name: string;
  subtitle: string;
  icon: string; // lucide icon name
  raw: string | IWalletData | IExistingCreditCards;
  /** Set on the pinned "Current Selected" clone so ng-select won't re-select it. */
  disabled?: boolean;
}

interface ICellRendererParamsExtended extends ICellRendererParams {
  checkStatus?: { value: string };
}

/**
 * Component for handling payment source selection.
 */
@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgSelectModule,
    MatTooltipModule,
    CommonFilterIconComponent,
    WhiteLabelDirective,
    LucideAngularModule,
    MatTooltip
  ],
  providers: [TitleCasePipe],
  selector: 'app-v4-payment-source-dropdown',
  templateUrl: './v4-payment-source-dropdown.component.html',
  styleUrls: ['./v4-payment-source-dropdown.component.scss']
})
export class V4PaymentSourceDropdownComponent implements OnDestroy {
  private alertService = inject(V4AlertService);
  public v3PaymentsTableService = inject(V3PaymentsTableService);
  private changeDetectorRef = inject(ChangeDetectorRef);
  public paymentsService = inject(PaymentsService);
  private store = inject(Store);
  private titleCasePipe = inject(TitleCasePipe);
  private dataTableService = inject(DataTableService);
  private dialog = inject(MatDialog);
  private v3DataTableService = inject(V3DataTableService);
  private customDoubleSideModalService = inject(CustomDoubleSideModalService);
  private actions$ = inject(Actions);
  private ngZone = inject(NgZone);
  private removeScrollListener?: () => void;

  /** One-shot listener armed while an add-bank flow is in progress. */
  private newBankWatch?: Subscription;

  private cardsWatch?: Subscription;

  /** Row's source type before the pending pick, restored if the confirm is cancelled. */
  private previousRowSourceType?: TPaymentSource;

  showFilterIcon = false;

  currentPaymentSourceType: string | undefined = '';
  currentPaymentSourceName: string | undefined;

  isFieldReadOnly = true;

  subscriptions: Subscription[] = [];

  commonTransactionTableRowData: ICommonTransactionTableData;
  agGridCellRendererParams: ICellRendererParamsExtended;

  temporaryPaymentSourceType: string | undefined | IsourceType = '';

  /** Lucide icon name for the read-only row's leading type icon. Same three
   * names the editable rows use via `IFundingSource.icon`. */
  selectedIcon = 'landmark';

  isTypeDropdownOpen: boolean;

  private preventScroll = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
  };

  isMapNow: boolean = false;

  selectedSource: string | IExistingCreditCards | IWalletData | undefined;

  isMapping = false;
  environment = environment;

  // ── Unified funding-source picker (wallets + banks + cards in one list) ──
  fundingSources$: Observable<IFundingSource[]>;
  /** Flat list of every source, subscribed from fundingSources$. */
  allSources: IFundingSource[] = [];
  /**
   * Filtered list bound to ng-select's [items]. Memoized (stable reference)
   * and recomputed ONLY when data/filter/search change — a fresh array on every
   * CD would rebuild the option DOM on hover and drop the click before it commits.
   */
  visibleSourcesList: IFundingSource[] = [];
  /** Real source count (excludes the pinned "Current Selected" clone) — for the header count. */
  visibleRealCount = 0;
  /** ng-select model — the currently-selected source (matched by id). */
  selectedFundingSource: IFundingSource | undefined;
  /** Restored if the change-confirmation dialog is cancelled. */
  private previousFundingSource: IFundingSource | undefined;
  /** Type-filter chip (Wallet / Bank / Card) + free-text search. One type is
   * always active — the list is never mixed. */
  sourceFilter: 'WALLET' | 'BANK' | 'CARD' = 'BANK';
  sourceSearch = '';
  /** Matches the selected model to its option by id (list loads async). */
  compareFunding = (a: IFundingSource, b: IFundingSource): boolean =>
    !!a && !!b && a.id === b.id;

  paymentSource: string = '';
  paymentSourceTypes: {
    sourceType: string;
    sourceId: string;
  }[] = [];

  // source
  temporaryPaymentSourceDropdownId:
    | string
    | IExistingCreditCards
    | IWalletData
    | undefined;

  private selectedData: string | IExistingCreditCards | IWalletData | undefined;
  public get selectedItem():
    | string
    | IExistingCreditCards
    | IWalletData
    | undefined {
    return this.selectedData;
  }

  public set selectedItem(
    value: string | IExistingCreditCards | IWalletData | undefined
  ) {
    this.selectedData = value;
    this.changeDetectorRef.markForCheck();
  }

  currentValue = '';
  convertedSourceType: TPaymentSource;

  isSourceBank = false;
  isSourceWallet = false;
  isSourceCard = false;
  isSourceCloud = false;
  addTag = false;

  bankAccountsState$: Observable<IBankAccountsState>;
  bankAccountsToList$: Observable<IBankDropdown[]>;
  selectIsBankAccountsByIdLoading$: Observable<boolean>;

  walletsToList$: Observable<IWalletData[]>;
  selectIsWalletsFilterOn$: Observable<boolean>;
  selectIsWalletsLoading$: Observable<boolean>;
  selectIsWalletsByIdLoading$: Observable<boolean>;

  cards: IExistingCreditCards[] = [];
  selectIsCardsLoading$: Observable<boolean>;

  /** Bypass ng-select client-side filtering — search is handled server-side. */
  searchFn = (): boolean => true;

  /** 600ms debounce before a typed term hits the API (same as the shared dropdowns). */
  private searchTimeout: ReturnType<typeof setTimeout>;

  /**
   * The type whose store list currently holds search-filtered results. Kept so the
   * term can be dropped again on tab switch / close — otherwise the next row to open
   * would inherit this row's search (the shared bank dropdown resets the same way).
   */
  private searchedType: 'BANK' | 'WALLET' | null = null;

  // Per-type store loading flags — drive [loading] and the "Loading..." empty text.
  private isBankLoading = false;
  private isWalletLoading = false;
  private isCardsLoading = false;
  /** Wallet 403 flag from the store; banks and cards report theirs via PaymentsService. */
  private isWalletPermissionDenied = false;

  /**
   * Access ng-select
   */
  @ViewChild('typeDropDown') typeDropDown: NgSelectComponent;
  @ViewChild('sourceDropdown') sourceDropdown: NgSelectComponent;

  constructor() {
    this.setPaymentSourceTypes();
  }

  /**
   * Initializes store selectors and dispatches an action to load bank accounts.
   */
  initStoreSelectorsForBank() {
    this.store.dispatch(
      bankAccountsActions.loadBankAccounts({ searchTerm: '' })
    );
    this.bankAccountsState$ = this.store.select(selectBankAccountsState);
    // Search is store-backed (like app-bank-ac-dropdown-v4), so the filtered list
    // is what the panel shows while a term is active — and loadMoreBankAccounts
    // keeps paginating that same term.
    this.bankAccountsToList$ = this.bankAccountsState$.pipe(
      map((bankAccountsState) =>
        bankAccountsState.isFilterOn
          ? bankAccountsState.bankAccountsFiltered
          : bankAccountsState.bankAccounts
      )
    );
    this.selectIsBankAccountsByIdLoading$ = this.store.select(
      selectIsBankAccountsByIdLoading
    );
  }

  /**
   * Initializes store selectors and dispatches an action to load wallets.
   */
  initStoreSelectorsForWallet() {
    // `disablePermission` matches app-wallet-dropdown-v4's dispatch exactly.
    this.store.dispatch(
      WalletsActions.loadWallets({ searchTerm: '', disablePermission: true })
    );
    const wallets$ = this.store.select(selectWallets);
    const walletsFiltered$ = this.store.select(selectFilteredWallets);
    this.selectIsWalletsFilterOn$ = this.store.select(selectIsWalletsFilterOn);
    this.selectIsWalletsLoading$ = this.store.select(selectIsWalletsLoading);
    this.selectIsWalletsByIdLoading$ = this.store.select(
      selectIsWalletsByIdLoading
    );
    // Store-backed search (like app-wallet-dropdown-v4): while a term is active the
    // filtered slice is the list, and loadMoreWallets pages that same term.
    this.walletsToList$ = this.selectIsWalletsFilterOn$.pipe(
      switchMap((isFilterOn) => (isFilterOn ? walletsFiltered$ : wallets$))
    );
  }

  /**
   * Initializes store selectors and dispatches an action to load cards.
   */
  initStoreSelectorsForCard() {
    if (!this.v3PaymentsTableService.cardsDataDispatched) {
      this.store.dispatch(CardsActions.loadCards({ showAllCards: false }));
      this.v3PaymentsTableService.cardsDataDispatched = true;
    }
    // This method re-runs on every source change, and one instance of this
    // renderer exists per row — so the watch has to replace itself rather than
    // stack, and be released on destroy like every other subscription here.
    this.cardsWatch?.unsubscribe();
    this.cardsWatch = this.store.select(selectCards).subscribe((res) => {
      this.cards = res;
      this.changeDetectorRef.detectChanges();
    });
    this.subscriptions.push(this.cardsWatch);
    this.selectIsCardsLoading$ = this.store.select(selectIsCardsLoading);
  }

  /**
   * Loads all three source types and combines them into one grouped list for the
   * unified picker. startWith([]) lets the list render as each store slice
   * resolves instead of waiting for all three.
   */
  private initAllFundingSources(): void {
    this.initStoreSelectorsForBank();
    this.initStoreSelectorsForWallet();
    this.initStoreSelectorsForCard();

    this.fundingSources$ = combineLatest([
      this.walletsToList$.pipe(startWith([] as IWalletData[])),
      this.bankAccountsToList$.pipe(startWith([] as IBankDropdown[])),
      this.store
        .select(selectCards)
        .pipe(startWith([] as IExistingCreditCards[]))
    ]).pipe(
      map(([wallets, banks, cards]) => [
        ...wallets.map((w) => this.toWalletSource(w)),
        ...banks.map((b) => this.toBankSource(b)),
        ...cards.map((c) => this.toCardSource(c))
      ])
    );

    this.subscriptions.push(
      this.fundingSources$.subscribe((list) => {
        this.allSources = list;
        this.resolveSelectedFromList(list); // swap stub → real option first
        this.recomputeVisibleSources(); // …so the pinned clone uses the real one
        this.changeDetectorRef.markForCheck();
      })
    );

    // Loading + permission signals, wired once (initStoreSelectorsFor* re-runs on
    // every source change, so they can't live in there without stacking up).
    this.subscriptions.push(
      this.bankAccountsState$.subscribe((state) => {
        this.isBankLoading = state.isLoading;
        this.changeDetectorRef.markForCheck();
      }),
      this.selectIsWalletsLoading$.subscribe((isLoading) => {
        this.isWalletLoading = isLoading;
        this.changeDetectorRef.markForCheck();
      }),
      this.selectIsCardsLoading$.subscribe((isLoading) => {
        this.isCardsLoading = isLoading;
        this.changeDetectorRef.markForCheck();
      }),
      this.store
        .select(selectIsWalletsPermissionDenied)
        .subscribe((isDenied) => {
          this.isWalletPermissionDenied = isDenied;
          this.changeDetectorRef.markForCheck();
        })
    );
  }

  /**
   * Active tab's permission. Bank/card come from the flags the store effects set
   * on a 403; wallets additionally carry an explicit denied flag in their state.
   */
  get hasActiveTypePermission(): boolean {
    if (this.sourceFilter === 'BANK') {
      return this.paymentsService.hasPermission.bank;
    }
    if (this.sourceFilter === 'CARD') {
      return this.paymentsService.hasPermission.card;
    }
    return (
      this.paymentsService.hasPermission.wallet &&
      !this.isWalletPermissionDenied
    );
  }

  /** Active tab's store loading flag — drives the in-panel loading text. */
  get isActiveTypeLoading(): boolean {
    if (this.sourceFilter === 'BANK') {
      return this.isBankLoading;
    }
    if (this.sourceFilter === 'CARD') {
      return this.isCardsLoading;
    }
    return this.isWalletLoading;
  }

  /** Empty-list message, mirroring the shared dropdowns' notFoundText. */
  get sourceNotFoundText(): string {
    if (!this.hasActiveTypePermission) {
      return 'Permission Denied';
    }
    return this.isActiveTypeLoading ? 'Loading...' : 'No sources found';
  }

  /**
   * Once the real options load, swap the initial stub for the matching option so
   * the selected ✓ and exact subtitle appear. Matched by id (source_id →
   * bank/wallet/card id) or, failing that, the current source's own info ids.
   */
  private resolveSelectedFromList(list: IFundingSource[]): void {
    const stub = this.selectedFundingSource;
    if (!stub || stub.raw !== '') {
      return; // already a real option (e.g. after a selection)
    }
    const info = this.commonTransactionTableRowData?.source?.info as
      | { cardId?: string; uuId?: string; id?: string }
      | undefined;
    const candidateIds = [stub.id, info?.cardId, info?.uuId, info?.id]
      .filter(Boolean)
      .map(String);
    const match = list.find((s) => candidateIds.includes(String(s.id)));
    if (match) {
      this.selectedFundingSource = match;
      this.previousFundingSource = match;
    }
  }

  /**
   * Recompute the memoized visible list after the type chip + search filters.
   * Assign a NEW array only here (on real input changes) so ng-select's [items]
   * reference stays stable across ordinary change detection.
   */
  private recomputeVisibleSources(): void {
    const q = this.sourceSearch.trim().toLowerCase();
    // Bank/wallet searches hit the API and already come back narrowed, so only
    // cards need client-side text filtering.
    const filterText = !!q && this.sourceFilter === 'CARD';
    const filtered = this.allSources.filter((s) => {
      const typeOk = s.type === this.sourceFilter;
      const textOk =
        !filterText ||
        s.name.toLowerCase().includes(q) ||
        s.subtitle.toLowerCase().includes(q);
      return typeOk && textOk;
    });
    this.visibleRealCount = filtered.length;
    // Pin the current selection as a first "Current Selected" group. It's a
    // disabled clone (same id → still shows the ✓) so it can't be re-selected,
    // and it always shows even if filters/search would otherwise hide it.
    const sel = this.selectedFundingSource;
    this.visibleSourcesList = sel
      ? [{ ...sel, group: 'Current Selected', disabled: true }, ...filtered]
      : filtered;
  }

  /** Count of visible sources in a group (shown next to the group header). */
  groupCount(group: string): number {
    return this.visibleSourcesList.filter((s) => s.group === group).length;
  }

  setSourceFilter(filter: 'WALLET' | 'BANK' | 'CARD'): void {
    // Each tab starts with a clean search — drop the previous tab's term so a
    // stale bank/wallet search can't narrow the list you just switched to.
    this.resetStoreSearch();
    this.sourceFilter = filter;
    this.sourceSearch = '';
    this.recomputeVisibleSources();
    this.changeDetectorRef.markForCheck();
  }

  /** "Search banks" / "Search wallets" / "Search cards" — follows the active tab. */
  get searchPlaceholder(): string {
    return `Search ${this.sourceFilter.toLowerCase()}s`;
  }

  /**
   * Header search box. Bank and wallet dispatch the same store search the shared
   * dropdowns use — 600ms debounce, `&` escaped — so the effects return page 1 of
   * the term and scroll-to-end keeps paging it. Cards have no search endpoint, so
   * they fall back to the client-side filter in recomputeVisibleSources().
   */
  onSourceSearch(): void {
    clearTimeout(this.searchTimeout);
    if (this.sourceFilter === 'CARD') {
      this.recomputeVisibleSources();
      this.changeDetectorRef.markForCheck();
      return;
    }
    const type = this.sourceFilter;
    const searchTerm = this.sourceSearch.replace(/&/g, '%26');
    this.searchTimeout = setTimeout(() => {
      this.dispatchStoreSearch(type, searchTerm);
    }, 600);
  }

  /**
   * Store-backed search for bank/wallet. An empty term is the "clear" dispatch —
   * it puts the unfiltered list back for every other row too.
   */
  private dispatchStoreSearch(
    type: 'BANK' | 'WALLET',
    searchTerm: string
  ): void {
    this.searchedType = searchTerm ? type : null;
    if (type === 'BANK') {
      this.store.dispatch(bankAccountsActions.loadBankAccounts({ searchTerm }));
    } else {
      this.store.dispatch(
        WalletsActions.loadWallets({ searchTerm, disablePermission: true })
      );
    }
  }

  /**
   * Drops any store-level search this row applied, so the next open (and every
   * other row's dropdown) sees the full list again. Mirrors the shared bank
   * dropdown's reset-on-close.
   */
  private resetStoreSearch(): void {
    clearTimeout(this.searchTimeout);
    if (this.searchedType) {
      this.dispatchStoreSearch(this.searchedType, '');
    }
  }

  /**
   * Infinite scroll — next page of the active type. The store effects carry the
   * current search term, so this pages search results too. Cards arrive in a
   * single call and have no paged endpoint.
   */
  onSourceScrollToEnd(): void {
    if (this.sourceFilter === 'BANK') {
      this.onGetBankAccounts();
    } else if (this.sourceFilter === 'WALLET') {
      this.onGetWallets();
    }
  }

  /**
   * A stand-in source built from the row's current source so the closed-cell
   * label shows the account name immediately, before the async lists resolve.
   * compareFunding() then aligns it to the real option once loaded.
   */
  private buildCurrentSourceStub(): IFundingSource | undefined {
    const data = this.commonTransactionTableRowData;
    if (!data?.source_id) {
      return undefined;
    }
    const src = String(data.source?.source ?? '').toLowerCase();
    let type: IFundingSource['type'] = 'BANK';
    if (src.includes('wallet')) type = 'WALLET';
    else if (src.includes('card')) type = 'CARD';
    const iconByType = {
      WALLET: 'wallet',
      CARD: 'credit-card',
      BANK: 'landmark'
    };
    const groupByType = {
      WALLET: 'Wallets',
      CARD: 'Cards',
      BANK: 'Bank Accounts'
    } as const;
    return {
      id: String(data.source_id),
      type,
      group: groupByType[type],
      name: this.currentPaymentSourceName || data.source?.name || '',
      subtitle: '',
      icon: iconByType[type],
      raw: ''
    };
  }

  private toWalletSource(w: IWalletData): IFundingSource {
    return {
      id: w.uuId,
      type: 'WALLET',
      group: 'Wallets',
      name: w.walletName || w.bankAccountNickName || 'Wallet',
      subtitle:
        w.availableBalance != null ? `$${w.availableBalance} available` : '',
      icon: 'wallet',
      raw: w
    };
  }

  private toBankSource(b: IBankDropdown): IFundingSource {
    // ponytail: account-nature ("Checking"/"Savings") isn't on IBankDropdown, so
    // default to "Checking" to match the design; swap in a real field if the API
    // starts exposing one.
    const masked = this.maskNumber(b.accountNumber);
    return {
      id: String(b.id),
      type: 'BANK',
      group: 'Bank Accounts',
      name: b.nickName || b.name || 'Bank',
      subtitle: masked ? `Checking ${masked}` : 'Checking',
      icon: 'landmark',
      raw: String(b.id)
    };
  }

  private toCardSource(c: IExistingCreditCards): IFundingSource {
    return {
      id: c.cardId,
      type: 'CARD',
      group: 'Cards',
      name: c.nickName || 'Card',
      // `card` is the masked pan a freshly added card comes back with — the
      // stored list uses last4/cardMasked instead.
      subtitle: this.maskNumber(c.last4 || c.cardMasked || c.card),
      icon: 'credit-card',
      raw: c
    };
  }

  private maskNumber(value?: string | number): string {
    const s = String(value ?? '');
    return s.length >= 4 ? `···· ${s.slice(-4)}` : s;
  }

  /**
   * Fired when a funding source is chosen from the unified picker. Reflects the
   * new type onto the row so the existing setSourceType()/setDropdownSourceId()
   * path resolves the correct id, then reuses valueChangedSource() (confirm +
   * updatePayment). previousFundingId restores the chip if the user cancels.
   */
  onFundingSourceChange(item: IFundingSource | undefined): void {
    if (!item) {
      return;
    }
    const typeMap: Record<IFundingSource['type'], TPaymentSource> = {
      BANK: 'bankaccount',
      WALLET: 'wallet',
      CARD: 'card'
    };
    // Kept so a cancelled confirm can put it back: the row object is shared with
    // the Type cell, which lists the types for whatever source it finds here.
    this.previousRowSourceType = this.commonTransactionTableRowData.source
      .source as TPaymentSource;
    this.commonTransactionTableRowData.source.source = typeMap[item.type];
    this.selectedItem = item.raw;
    this.valueChangedSource();
  }

  /**
   * Getting payment source type
   */
  setPaymentSourceTypes() {
    this.paymentSourceTypes = V3PaymentsTableData.getPayFromItems().map(
      (el) => ({ sourceType: el.sourceType as string, sourceId: el.id })
    );
  }

  /**
   * Initializes the component with the provided cell renderer parameters.
   *
   * @param params - The cell renderer parameters.
   */
  agInit(params: ICellRendererParams<ICommonTransactionTableData>): void {
    this.agGridCellRendererParams = params;
    if (params.data) {
      this.commonTransactionTableRowData = params.data;
    }

    if (params.data?.source.source) {
      this.currentPaymentSourceType = params?.data?.source?.source;
    } else {
      this.currentPaymentSourceType = 'BANK';
    }

    if (params.data?.source_name) {
      this.currentPaymentSourceName = params.data?.source_name;
    }

    if (
      (params.data?.status === 'PENDING' &&
        ![50, 52, 151, 152, 800, 801].includes(params.data?.cheque_status)) ||
      params.data?.status === 'APPROVAL_REQUIRED'
    ) {
      this.isFieldReadOnly = false;
    }

    if (this.currentPaymentSourceType === 'BANK') {
      this.selectedIcon = 'landmark';
    } else if (this.currentPaymentSourceType === 'WALLET') {
      this.selectedIcon = 'wallet';
    } else {
      this.selectedIcon = 'credit-card';
    }

    this.temporaryPaymentSourceType = this.currentPaymentSourceType;

    if (
      params.data?.source.source === 'wallet' ||
      (params.data?.source.source as string) === 'WALLET'
    ) {
      this.selectedItem = params.data?.source.name;
    } else {
      this.selectedItem = params.data?.source.info?.nickName;
    }

    if (
      params.data?.third_party_name !== null &&
      params.data?.source?.name === '' &&
      !params.data?.source_deleted
    ) {
      this.selectedItem =
        '<span class="text-common-red-color" > \u26A0 Map Now</span>';
      this.isMapping = true;
      if (params.data.transfer_type !== 'CHECK') {
        this.isFieldReadOnly = true;
      } else {
        this.isMapNow = true;
      }
    }

    if (params.data?.source_deleted && this.transferModeStatus === 'Pending') {
      this.selectedItem = undefined;
      this.isFieldReadOnly = false;
    }

    this.temporaryPaymentSourceDropdownId = this.selectedItem;

    // Seed the unified picker with the row's current source and load all types.
    if (!this.isFieldReadOnly) {
      this.selectedFundingSource = this.buildCurrentSourceStub();
      this.previousFundingSource = this.selectedFundingSource;
      this.initAllFundingSources();
    }

    this.setSourceType();
    this.listenForSourceTypeChange();
  }

  /**
   * @description Gets next 10 element on each scroll event
   */
  onGetBankAccounts() {
    this.store.dispatch(bankAccountsActions.loadMoreBankAccounts());
  }

  /**
   * @description Gets next 10 element on each scroll event
   */
  onGetWallets() {
    this.store.dispatch(WalletsActions.loadMoreWallets());
  }

  /**
   * @description Gets the source as string and converts it to the proper format and assigns
   * the correct dropdown for the row.
   */
  setSourceType() {
    if (
      (this.commonTransactionTableRowData.source.source as string) === 'BANK' ||
      (this.commonTransactionTableRowData.source.source as string) ===
        'bankaccount' ||
      (this.commonTransactionTableRowData.source.source as string) === ''
    ) {
      this.convertedSourceType = 'bankaccount';
      this.isSourceBank = true;
      this.isSourceCloud = false;
      this.isSourceWallet = false;
      this.isSourceCard = false;
    } else if (
      (this.commonTransactionTableRowData.source.source as string) ===
        'CLOUD BANK' ||
      (this.commonTransactionTableRowData.source.source as string) === 'cloud'
    ) {
      this.convertedSourceType = 'cloud';
      this.isSourceBank = false;
      this.isSourceCloud = true;
      this.isSourceWallet = false;
      this.isSourceCard = false;
    } else if (
      (this.commonTransactionTableRowData.source.source as string) ===
        'WALLET' ||
      (this.commonTransactionTableRowData.source.source as string) === 'wallet'
    ) {
      this.convertedSourceType = 'wallet';
      this.isSourceBank = false;
      this.isSourceCloud = false;
      this.isSourceWallet = true;
      this.isSourceCard = false;
    } else if (
      (this.commonTransactionTableRowData.source.source as string) === 'CARD' ||
      (this.commonTransactionTableRowData.source.source as string) === 'card'
    ) {
      this.convertedSourceType = 'card';
      this.isSourceBank = false;
      this.isSourceCloud = false;
      this.isSourceWallet = false;
      this.isSourceCard = true;
    } else {
      this.convertedSourceType =
        this.commonTransactionTableRowData.source.source;
    }
    this.changeDetectorRef.markForCheck();
    if (this.isSourceBank) {
      this.initStoreSelectorsForBank();
    } else if (this.isSourceWallet) {
      this.initStoreSelectorsForWallet();
    } else if (this.isSourceCard) {
      this.initStoreSelectorsForCard();
    }
  }

  /**
   * @description Subscribes to the getter that gets fired when we clear
   * the source name.
   */
  listenForSourceTypeChange() {
    this.subscriptions.push(
      this.v3PaymentsTableService.dynamicSourceNameClearing$.subscribe({
        next: (res) => {
          if (res.uuid === this.commonTransactionTableRowData.uu_id) {
            this.commonTransactionTableRowData.source_id = '';
            this.setSourceType();
            this.clear();
          }
        }
      })
    );
  }

  /**
   * Clear the field and send this data via the
   * ```updateDynamicPaymentFields``` setter.
   */
  clear() {
    if (this.selectedItem) {
      this.selectedItem = undefined;
    }
  }

  /**
   * @description Gets fired when the user clicks an option.
   */
  valueChangedSource() {
    const alertServiceData = {
      content: 'Are you sure you want to change this field?',
      doneMsg: 'Yes',
      cancelMsg: 'Cancel',
      isOk: true,
      isCancel: true
    };
    const action = this.alertService.confirmAlert(alertServiceData);

    action.afterClosed().subscribe((res) => {
      if (!res) {
        this.selectedItem = this.temporaryPaymentSourceDropdownId;
        this.selectedFundingSource = this.previousFundingSource; // revert picker
        if (this.previousRowSourceType) {
          // Nothing was saved, so the row must go back to its old source type -
          // otherwise the Type cell keeps offering the abandoned source's types.
          this.commonTransactionTableRowData.source.source =
            this.previousRowSourceType;
        }
      } else {
        this.applySourceChange();
      }
    });
  }

  /**
   * Commits the current selection to the payment. Split out of
   * valueChangedSource() so a source the user just added can be applied without
   * the "are you sure" step — they added it to use it.
   */
  private applySourceChange(): void {
    this.temporaryPaymentSourceDropdownId = this.selectedItem;
    this.setSourceType();
    const sourceId = this.setDropdownSourceId();

    this.commonTransactionTableRowData.source_id = sourceId || '';

    if (
      this.commonTransactionTableRowData?.third_party_name !== null &&
      this.commonTransactionTableRowData?.source?.name === ''
    ) {
      this.paymentsService.getCheckDetails(
        this.commonTransactionTableRowData.transfer_id,
        this.commonTransactionTableRowData.source_id
      );
      return;
    }

    if (!this.selectedItem) {
      return;
    }

    this.v3PaymentsTableService.paymentSourceChanged = {
      uuid: this.commonTransactionTableRowData.uu_id
    };

    const updatePayload: IUpdatePaymentBody = {
      sourceType: this.convertedSourceType,
      sourceId,
      transferType: this.commonTransactionTableRowData.transfer_type_code ?? ''
    };
    this.subscriptions.push(
      this.paymentsService
        .updatePayment(this.commonTransactionTableRowData.uu_id, updatePayload)
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.temporaryPaymentSourceDropdownId = this.selectedItem;
              this.previousFundingSource = this.selectedFundingSource; // accept

              this.commonTransactionTableRowData.source = response.data
                .source as ISource;
              this.commonTransactionTableRowData.source.source =
                this.convertedSourceType;
              this.commonTransactionTableRowData.source_id =
                response.data.sourceId;
              this.v3PaymentsTableService.triggerPaymentsTableValidation = true;
              this.alertService.successAlert({
                content: 'Payment source updated successfully.'
              });
            }
            this.v3PaymentsTableService.isSourceSelected.next({
              uuid: this.commonTransactionTableRowData.uu_id,
              transferType: updatePayload.transferType as string,
              transferId: response.data.transferId
            });
          },
          error: () => {
            this.selectedItem = undefined;
          }
        })
    );
  }

  /**
   * "+ Add funding source" — same flow the Verification Center uses: a chooser
   * modal (bank vs card), then the matching add flow. Whatever gets created is
   * pushed into its store list and becomes this row's selected source.
   */
  openAddFundingSource(): void {
    this.sourceDropdown?.close();
    this.subscriptions.push(
      this.dialog
        .open<PaymentSourceModalV4Component, undefined, PaymentSourceResult>(
          PaymentSourceModalV4Component,
          {
            width: '500px',
            maxWidth: '95vw',
            panelClass: 'paddingless-modal-rounded',
            autoFocus: false
          }
        )
        .afterClosed()
        .subscribe((result) => {
          if (!result) return;

          if (result.kind === 'bank') {
            // The choice modal closes itself before Plaid / the manual form even
            // opens, so its afterClosed() says nothing about the account — the
            // store action below is the only signal that carries the new bank.
            this.customDoubleSideModalService.open(
              AddBankMethodChoiceModalComponent,
              { width: '480px', disableClose: true }
            );
            this.awaitNewBankAccount();
            return;
          }

          // Card path: the chooser already opened the add-card dialog.
          const cardSub = result.cardModal?.afterClosed().subscribe((res) => {
            const card = res?.data?.metaData as
              | IExistingCreditCards
              | undefined;
            if (!res?.success || !card?.cardId) return;
            this.store.dispatch(CardsActions.addCard({ card }));
            this.selectNewSource(this.toCardSource(card));
          });
          if (cardSub) this.subscriptions.push(cardSub);
        })
    );
  }

  /**
   * Both add-bank routes — Plaid and the manual form — end by dispatching the
   * created account into the bank-accounts store, so one-shot listening to that
   * action covers either choice without touching the bank modals.
   */
  private awaitNewBankAccount(): void {
    this.newBankWatch?.unsubscribe();
    this.newBankWatch = this.actions$
      .pipe(
        ofType(bankAccountsActions.addCreatedBankAccountIntoBankAccounts),
        take(1)
      )
      .subscribe(({ bankAccount }) =>
        this.selectNewSource(this.toBankSource(bankAccount as IBankDropdown))
      );
    this.subscriptions.push(this.newBankWatch);
  }

  /**
   * Selects a source the user just added: shows it in the closed cell, switches
   * the picker to its type, and commits it to the payment (no "are you sure" —
   * adding it was the confirmation).
   */
  private selectNewSource(source: IFundingSource): void {
    if (!this.allSources.some((s) => s.id === source.id)) {
      this.allSources = [source, ...this.allSources];
    }
    this.sourceFilter = source.type;
    this.selectedFundingSource = source;
    this.commonTransactionTableRowData.source.source = {
      BANK: 'bankaccount',
      WALLET: 'wallet',
      CARD: 'card'
    }[source.type] as TPaymentSource;
    this.selectedItem = source.raw;
    this.recomputeVisibleSources();
    this.changeDetectorRef.markForCheck();
    this.applySourceChange();
  }

  onDropdownOpen() {
    this.isTypeDropdownOpen = true;
    this.removeScrollListener?.();
    this.removeScrollListener = closeOnOutsideScroll(this.ngZone, () =>
      this.sourceDropdown?.close()
    );
    // Reopening the picker means the add-bank flow is over (or was abandoned) —
    // drop the listener so a bank added elsewhere later can't hijack this row.
    this.newBankWatch?.unsubscribe();
    // Each open starts fresh with an empty search, on the tab matching the row's
    // current source (no "All" tab — the list is always one type).
    this.sourceFilter = this.selectedFundingSource?.type ?? 'BANK';
    this.sourceSearch = '';
    // Drop any search term still applied to the store so this open starts full.
    this.resetStoreSearch();
    this.recomputeVisibleSources();
    const viewport = this.agGridCellRendererParams?.eGridCell
      ?.closest('.ag-root-wrapper')
      ?.querySelector('.ag-body-viewport') as HTMLElement;
    if (viewport) {
      viewport.addEventListener('wheel', this.preventScroll, {
        passive: false
      });
      viewport.addEventListener('touchmove', this.preventScroll, {
        passive: false
      });
    }
  }

  onDropdownClose() {
    this.isTypeDropdownOpen = false;
    this.removeScrollListener?.();
    this.removeScrollListener = undefined;
    const viewport = this.agGridCellRendererParams?.eGridCell
      ?.closest('.ag-root-wrapper')
      ?.querySelector('.ag-body-viewport') as HTMLElement;
    if (viewport) {
      viewport.removeEventListener('wheel', this.preventScroll);
      viewport.removeEventListener('touchmove', this.preventScroll);
    }
    // ng-select drops its own search text on close, so the store's term has to go
    // with it — otherwise the next open renders the previous search's matches.
    this.resetStoreSearch();
  }

  /**
   * @description Each payment type has a different source Id so we choose the one we need and correctly assign it.
   * @returns The source Id based on the payment type.
   */
  setDropdownSourceId() {
    if (this.isSourceCard) {
      const cardSelectedItem = this.selectedItem as IExistingCreditCards;
      return cardSelectedItem.cardId;
    }
    if (this.isSourceWallet) {
      const walletSelectedItem = this.selectedItem as IWalletData;
      return walletSelectedItem.uuId;
    }
    if (this.isSourceBank) {
      return this.selectedItem as string;
    }

    return undefined;
  }

  /**
   * @description Gets fired when the user selects an option.
   */
  typeValueChanged() {
    let alertServiceData = {};
    let paymentSourceType;
    let transferType;
    let srcType;
    if (typeof this.currentPaymentSourceType === 'object') {
      paymentSourceType = typeof this.currentPaymentSourceType;
      transferType = this.commonTransactionTableRowData.transfer_type_code;
      srcType = (this.currentPaymentSourceType as IsourceType).sourceType;
    }
    if (
      paymentSourceType === 'object' &&
      ((transferType === 'check' &&
        (srcType === 'CARD' ||
          srcType === 'card' ||
          srcType === 'WALLET' ||
          srcType === 'wallet')) ||
        (transferType === 'checkMail' &&
          (srcType === 'BANK' || srcType === 'bank')))
    ) {
      alertServiceData = {
        content:
          'This source type is not compatibile with this payment type, are you sure you want to continue?',
        doneMsg: 'Yes',
        cancelMsg: 'Cancel',
        isOk: true,
        isCancel: true
      };
    } else {
      alertServiceData = {
        content: 'Are you sure you want to change this field?',
        doneMsg: 'Yes',
        cancelMsg: 'Cancel',
        isOk: true,
        isCancel: true
      };
    }
    const action = this.alertService.confirmAlert(alertServiceData);

    action.afterClosed().subscribe((res) => {
      if (!res) {
        this.currentPaymentSourceType = this
          .temporaryPaymentSourceType as string;
      } else if (typeof this.currentPaymentSourceType === 'object') {
        if (
          (this.currentPaymentSourceType as IsourceType)?.sourceType === 'BANK'
        ) {
          this.selectedIcon = 'landmark';
        } else if (
          (this.currentPaymentSourceType as IsourceType)?.sourceType ===
          'WALLET'
        ) {
          this.selectedIcon = 'wallet';
        } else {
          this.selectedIcon = 'credit-card';
        }
        this.commonTransactionTableRowData.source.source = (
          this.currentPaymentSourceType as IsourceType
        )?.sourceId as TPaymentSource;
        this.temporaryPaymentSourceType = (
          this.currentPaymentSourceType as IsourceType
        )?.sourceId;
        this.v3PaymentsTableService.dynamicSourceNameClearing = {
          uuid: this.commonTransactionTableRowData.uu_id
        };
      }
    });
  }

  trackBySource(
    index: number,
    item: IExistingCreditCards | IWalletData
  ): string {
    if (this.isSourceCard) {
      return (item as IExistingCreditCards).card;
    }
    return (item as IWalletData).id;
  }

  /**
   * Getter for transfer mod text. returns value with given conditions.
   * To be called in template.
   */
  get transferModeStatus(): string | undefined {
    const checkStatus = this.agGridCellRendererParams?.checkStatus;
    const status = this.titleCasePipe.transform(
      this.commonTransactionTableRowData?.status
    );
    if (this.commonTransactionTableRowData.transfer_type_code === 'check') {
      return checkStatus?.value ?? this.undersquareToWhitespace(status);
    }
    return this.undersquareToWhitespace(status);
  }

  /**
   * Returns a string after replacing all "_" with whitespaces from a given string.
   */
  undersquareToWhitespace(value?: string) {
    return value ? value.replace(/_/, ' ') : undefined;
  }

  onFilterClicked(): void {
    const sourceId =
      this.currentPaymentSourceType === 'CARD'
        ? this.commonTransactionTableRowData.source.info?.cardId
        : this.commonTransactionTableRowData.source_id;
    const cellValue = {
      filter: this.currentPaymentSourceType as string,
      field: 'Source',
      payee: undefined,
      subFilter: {
        name: 'source_type_name',
        value: this.currentPaymentSourceName as string,
        source_id: sourceId
      }
    };

    this.dataTableService.selectedCellValueSignal.set(cellValue);
    this.v3DataTableService.gridApi.deselectAll();
  }

  showFilterIconForRow(show?: boolean) {
    if (show) {
      this.showFilterIcon = true;
    } else {
      this.showFilterIcon = false;
    }
  }

  ngOnDestroy() {
    this.onDropdownClose();
    clearTimeout(this.searchTimeout);
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}

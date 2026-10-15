import { CommonFilterIconComponent } from 'src/app/shared/components/common-filter-icon/common-row-filter.component';
import { ICellRendererParams } from '@ag-grid-community/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { Store } from '@ngrx/store';
import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  ViewChild,
  inject
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgSelectComponent, NgSelectModule } from '@ng-select/ng-select';
import { ICommonTransactionTableData, ISource } from 'src/app/models/v3-common';
import {
  IUpdatePaymentBody,
  TPaymentSource
} from 'src/app/modules/payments/model/payments';
import { V3PaymentsTableService } from 'src/app/modules/v3-payments-table/shared/components/v3-payments-table/v3-payments-table.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { V3PaymentsTableData } from 'src/app/modules/v3-payments-table/shared/components/v3-payments-table/v3-payments-table-data';
import {
  BehaviorSubject,
  Observable,
  Subject,
  Subscription,
  catchError,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  of,
  switchMap,
  tap
} from 'rxjs';
import { IExistingCreditCards } from 'src/app/models/payment-switch-board';
import { IWalletData } from 'src/app/models/wallet';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { IconName } from '@fortawesome/fontawesome-svg-core';
import { bankAccountsActions } from 'src/app/modules/store/bankAccounts/bank-accounts.actions';
import {
  selectBankAccountsState,
  selectIsBankAccountsByIdLoading
} from 'src/app/modules/store/bankAccounts/bank-accounts.selectors';
import { IBankAccountsState, IBankDropdown } from 'src/app/models/bank';
import { BankAccountsService } from 'src/app/shared/service/bankAccounts/bank-accounts.service';
import { WalletsActions } from 'src/app/modules/store/wallets/wallets.actions';
import {
  selectFilteredWallets,
  selectIsWalletsByIdLoading,
  selectIsWalletsFilterOn,
  selectIsWalletsLoading,
  selectWallets
} from 'src/app/modules/store/wallets/wallets.selectors';
import { WalletService } from 'src/app/shared/service/wallet/wallet.service';
import { CardsActions } from 'src/app/modules/store/cards/cards.actions';
import {
  selectCards,
  selectIsCardsLoading
} from 'src/app/modules/store/cards/cards.selectors';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { environment } from 'src/environments/environment';
import { WhiteLabelDirective } from 'src/app/directive/white-label.directive';

interface IsourceType {
  sourceId: string;
  sourceType: string;
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
    FontAwesomeModule,
    MatTooltipModule,
    CommonFilterIconComponent,
    WhiteLabelDirective
  ],
  providers: [TitleCasePipe],
  selector: 'app-v35-payment-source-dropdown',
  templateUrl: './v35-payment-source-dropdown.component.html',
  styleUrls: ['./v35-payment-source-dropdown.component.scss']
})
export class V35PaymentSourceDropdownComponent implements OnDestroy {
  private alertService = inject(AlertService);
  public v3PaymentsTableService = inject(V3PaymentsTableService);
  private changeDetectorRef = inject(ChangeDetectorRef);
  public paymentsService = inject(PaymentsService);
  private store = inject(Store);
  private titleCasePipe = inject(TitleCasePipe);
  private dataTableService = inject(DataTableService);
  private v3DataTableService = inject(V3DataTableService);
  private bankAccountsService = inject(BankAccountsService);
  private walletService = inject(WalletService);

  showFilterIcon = false;

  currentPaymentSourceType: string | undefined = '';
  currentPaymentSourceName: string | undefined;

  isFieldReadOnly = true;

  subscriptions: Subscription[] = [];

  commonTransactionTableRowData: ICommonTransactionTableData;
  agGridCellRendererParams: ICellRendererParamsExtended;

  temporaryPaymentSourceType: string | undefined | IsourceType = '';

  selectedIcon: IconName;

  isTypeDropdownOpen: boolean;

  isMapNow: boolean = false;

  selectedSource: string | IExistingCreditCards | IWalletData | undefined;

  isMapping = false;
  environment = environment;

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

  private bankSearchSubject = new Subject<string>();
  private walletSearchSubject = new Subject<string>();

  /** Bypass ng-select client-side filtering — search is handled server-side. */
  searchFn = (): boolean => true;

  /**
   * Holds this row's own typed-in search results, kept out of the shared
   * bank/wallet NgRx store so searching in one row can never change what
   * another row's dropdown displays.
   */
  private bankSearchResults$ = new BehaviorSubject<IBankDropdown[] | null>(
    null
  );
  private walletSearchResults$ = new BehaviorSubject<IWalletData[] | null>(
    null
  );

  private bankSearchLoading$ = new BehaviorSubject<boolean>(false);
  private walletSearchLoading$ = new BehaviorSubject<boolean>(false);

  // Guards against re-adding a duplicate debounced search subscription every
  // time initStoreSelectorsForBank/ForWallet re-runs (setSourceType calls it
  // on every source change), which would otherwise fire duplicate API calls.
  private bankSearchSubscriptionWired = false;
  private walletSearchSubscriptionWired = false;

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
    const storeBankAccountsToList$ = this.bankAccountsState$.pipe(
      map((bankAccountsState) =>
        bankAccountsState.isFilterOn
          ? bankAccountsState.bankAccountsFiltered
          : bankAccountsState.bankAccounts
      )
    );
    // Local search results (if any) take over the list; otherwise fall back
    // to the shared store's unfiltered list, keeping other rows unaffected.
    this.bankAccountsToList$ = combineLatest([
      storeBankAccountsToList$,
      this.bankSearchResults$
    ]).pipe(map(([storeList, searchResults]) => searchResults ?? storeList));
    this.selectIsBankAccountsByIdLoading$ = this.store.select(
      selectIsBankAccountsByIdLoading
    );
    if (!this.bankSearchSubscriptionWired) {
      this.bankSearchSubscriptionWired = true;
      this.subscriptions.push(
        this.bankSearchSubject
          .pipe(
            debounceTime(600),
            distinctUntilChanged(),
            filter((term) => !!term),
            tap(() => this.bankSearchLoading$.next(true)),
            switchMap((term) =>
              this.bankAccountsService.getBankAccountList(1, term).pipe(
                catchError(() => {
                  this.bankSearchLoading$.next(false);
                  return of({ data: [] as IBankDropdown[] });
                })
              )
            )
          )
          .subscribe((res) => {
            this.bankSearchResults$.next(res?.data ?? []);
            this.bankSearchLoading$.next(false);
          })
      );
    }
  }

  /**
   * Initializes store selectors and dispatches an action to load wallets.
   */
  initStoreSelectorsForWallet() {
    this.store.dispatch(WalletsActions.loadWallets({ searchTerm: '' }));
    const wallets$ = this.store.select(selectWallets);
    const walletsFiltered$ = this.store.select(selectFilteredWallets);
    this.selectIsWalletsFilterOn$ = this.store.select(selectIsWalletsFilterOn);
    this.selectIsWalletsLoading$ = this.store.select(selectIsWalletsLoading);
    this.selectIsWalletsByIdLoading$ = this.store.select(
      selectIsWalletsByIdLoading
    );
    const storeWalletsToList$ = this.selectIsWalletsFilterOn$.pipe(
      switchMap((isFilterOn) => (isFilterOn ? walletsFiltered$ : wallets$))
    );
    // Local search results (if any) take over the list; otherwise fall back
    // to the shared store's unfiltered list, keeping other rows unaffected.
    this.walletsToList$ = combineLatest([
      storeWalletsToList$,
      this.walletSearchResults$
    ]).pipe(map(([storeList, searchResults]) => searchResults ?? storeList));
    if (!this.walletSearchSubscriptionWired) {
      this.walletSearchSubscriptionWired = true;
      this.subscriptions.push(
        this.walletSearchSubject
          .pipe(
            debounceTime(600),
            distinctUntilChanged(),
            filter((term) => !!term),
            tap(() => this.walletSearchLoading$.next(true)),
            switchMap((term) =>
              this.walletService.getWalletInformation(1, term).pipe(
                catchError(() => {
                  this.walletSearchLoading$.next(false);
                  return of({ data: [] as IWalletData[] });
                })
              )
            )
          )
          .subscribe((res) => {
            this.walletSearchResults$.next(res?.data ?? []);
            this.walletSearchLoading$.next(false);
          })
      );
    }
  }

  /**
   * Initializes store selectors and dispatches an action to load cards.
   */
  initStoreSelectorsForCard() {
    if (!this.v3PaymentsTableService.cardsDataDispatched) {
      this.store.dispatch(CardsActions.loadCards({ showAllCards: false }));
      this.v3PaymentsTableService.cardsDataDispatched = true;
    }
    this.store.select(selectCards).subscribe((res) => {
      this.cards = res;
      this.changeDetectorRef.detectChanges();
    });
    this.selectIsCardsLoading$ = this.store.select(selectIsCardsLoading);
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
      params.data?.status === 'PENDING' &&
      ![50, 52, 151, 152, 800, 801].includes(params.data?.cheque_status)
    ) {
      this.isFieldReadOnly = false;
    }

    if (this.currentPaymentSourceType === 'BANK') {
      this.selectedIcon = 'bank';
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

    // Approval required payments are never editable, regardless of the above.
    if (params.data?.status === 'APPROVAL_REQUIRED') {
      this.isFieldReadOnly = true;
    }

    this.temporaryPaymentSourceDropdownId = this.selectedItem;

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
   * @description Triggers a debounced API search for bank accounts as the user types.
   */
  onBankSearch(event: { term: string }) {
    const term = event.term?.trim() ?? '';
    if (!term) {
      // Revert to the unfiltered list immediately, no need to wait on the debounce.
      this.bankSearchResults$.next(null);
    }
    this.bankSearchSubject.next(term);
  }

  /**
   * @description Triggers a debounced API search for wallets as the user types.
   */
  onWalletSearch(event: { term: string }) {
    const term = event.term?.trim() ?? '';
    if (!term) {
      this.walletSearchResults$.next(null);
    }
    this.walletSearchSubject.next(term);
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
    const action = this.alertService.infoAlert(alertServiceData);

    action.afterClosed().subscribe((res) => {
      if (!res) {
        this.selectedItem = this.temporaryPaymentSourceDropdownId;
      } else {
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
        const updatePayload: IUpdatePaymentBody = {
          sourceType: this.convertedSourceType,
          sourceId,
          transferType: this.commonTransactionTableRowData.transfer_type_code
        };
        this.subscriptions.push(
          this.paymentsService
            .updatePayment(
              this.commonTransactionTableRowData.uu_id,
              updatePayload
            )
            .subscribe({
              next: (response) => {
                if (response.success) {
                  this.temporaryPaymentSourceDropdownId = this.selectedItem;

                  this.commonTransactionTableRowData.source = response.data
                    .source as ISource;
                  this.commonTransactionTableRowData.source.source =
                    this.convertedSourceType;
                  this.commonTransactionTableRowData.source_id =
                    response.data.sourceId;
                  this.v3PaymentsTableService.triggerPaymentsTableValidation =
                    true;
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
    });
  }

  onDropdownOpen() {
    this.isTypeDropdownOpen = true;
  }

  onDropdownClose() {
    this.isTypeDropdownOpen = false;
    // Reset this row's local search override so reopening shows the full
    // unfiltered list again, instead of the stale previous search results.
    this.bankSearchResults$.next(null);
    this.walletSearchResults$.next(null);
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
    const action = this.alertService.infoAlert(alertServiceData);

    action.afterClosed().subscribe((res) => {
      if (!res) {
        this.currentPaymentSourceType = this
          .temporaryPaymentSourceType as string;
      } else if (typeof this.currentPaymentSourceType === 'object') {
        if (
          (this.currentPaymentSourceType as IsourceType)?.sourceType === 'BANK'
        ) {
          this.selectedIcon = 'bank';
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
    const sourceId = this.currentPaymentSourceType === 'CARD' ? this.commonTransactionTableRowData.source.info?.cardId : this.commonTransactionTableRowData.source_id;
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
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
    this.bankSearchResults$.complete();
    this.walletSearchResults$.complete();
    this.bankSearchLoading$.complete();
    this.walletSearchLoading$.complete();
  }
}

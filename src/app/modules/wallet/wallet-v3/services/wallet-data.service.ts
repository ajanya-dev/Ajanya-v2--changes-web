import {
  Injectable,
  inject,
  OnDestroy,
  WritableSignal,
  signal
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable, Subject, Subscription } from 'rxjs';
import { debounceTime, finalize, take } from 'rxjs/operators';
import { IStatus, IWalletData, IWalletRoot } from 'src/app/models/wallet';
import { WalletService } from 'src/app/shared/service/wallet/wallet.service';
import { TransferFundsComponent } from '../../wallet-v2/modals/transfer-funds/transfer-funds.component';

/**
 * @description  Service for managing user wallets and transactions.
 */
@Injectable({
  providedIn: 'root'
})
export class WalletDataService implements OnDestroy {
  private walletService = inject(WalletService);

  /**
   * @description Private BehaviorSubject for storing wallet data.
   * The initial value of the BehaviorSubject is an empty IWalletData object.
   */
  private walletDataSignal: WritableSignal<IWalletData | undefined> = signal({
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
  /**
   * @description Private Subject for storing wallet accounts data.
   */
  private walletAccounts$ = new Subject<IWalletRoot>();
  private requestWalletData$ = new Subject<{
    searchInput: string;
    type: 'scroll' | 'search';
  }>();
  private walletListLastPage$ = new Subject<IWalletData[]>();
  private dialog = inject(MatDialog);
  public isLoading = false;
  walletTransactionTypes: IStatus[];
  subscriptions: Subscription[] = [];
  page = 1;
  walletData: IWalletData[] = [];
  walletTotal: { totalCurrentBalance: string; totalAvailableBalance: string };
  isGridView = true;

  constructor() {
    this.loadRequestWalletData();
  }

  toggleView(value: { gridView: boolean }) {
    this.isGridView = value.gridView;
  }

  /**
   * Opens a modal based on the provided action.
   * @param {Object} action - The  object containing walletId and walletAction.
   */
  openModal(action: { walletId: string; walletAction: number }) {
    if (action.walletAction === 3) {
      this.openTransferSpecificFundsModal(action.walletId);
    }
  }

  /**
   * Method for fetching wallet transaction type.
   */
  getWalletTransactionTypes() {
    this.walletTransactionTypes = [];
    this.subscriptions.push(
      this.walletService.getWalletStatus().subscribe((res) => {
        Object.keys(res.data).forEach((key: string | number) => {
          this.walletTransactionTypes.push(res.data[key as number]);
        });
      })
    );
  }

  /**
   * Opens the TransferFunds modal for a specific wallet.
   * @param  walletId - The ID of the wallet to fund.
   */
  openTransferSpecificFundsModal(walletId: string): void {
    const modal = this.dialog.open(TransferFundsComponent, {
      width: '722px',
      maxWidth: '93%',
      disableClose: true,
      data: walletId || undefined
    });
    modal.afterClosed().subscribe(() => {
      this.setWallets();
      this.getWallets().subscribe((wallets) => {
        const current = wallets.data.filter(
          (item) => item.uuId === this.walletDataSignal()?.uuId
        );
        if (current.length) {
          this.setData(current[0]);
        }
      });
    });
  }

  /**
   * @description This method allows subscribing to changes in the wallet data.
   * @returns  An Signl of type IWalletData.
   */
  getData(): IWalletData | undefined {
    return this.walletDataSignal();
  }

  /**
   * @description This method updates the value of the wallet data with the provided value.
   * @param value - The new value of the wallet data.
   */
  setData(value: IWalletData) {
    this.walletDataSignal.set(value);
  }

  /**
   *
   * @description Retrieves the wallet accounts.
   * @returns An observable emitting the wallet accounts.
   */
  getWallets(): Observable<IWalletRoot> {
    return this.walletAccounts$;
  }

  /**
   * @description Retrieves and sets the wallet information for the user.
   */
  setWallets(page = 1) {
    this.isLoading = true;
    this.subscriptions.push(
      this.walletService
        .getWalletInformation(page)
        .pipe(finalize(() => (this.isLoading = false)))
        .subscribe((res) => {
          if (res) {
            this.walletAccounts$.next(res);
          }
        })
    );
  }

  /**
   * @description Method to set data to set wallet data request.
   * @param searchInput - Search term.
   * @param type - Type of event : scroll or search
   */
  setRequestWalletData(searchInput = '', type: 'scroll' | 'search') {
    this.requestWalletData$.next({ searchInput, type });
  }

  /**
   * @description Invokes `this.loadWalletData` when `this.requestWalletData$` subject gets data.
   */
  loadRequestWalletData() {
    this.subscriptions.push(
      this.requestWalletData$.pipe(debounceTime(700)).subscribe((res) => {
        if (res.type === 'scroll') {
          this.page++;
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
    this.subscriptions.push(
      this.walletService
        .getWalletInformation(page, searchInput)
        .pipe(take(1))
        .subscribe((res) => {
          this.walletListLastPage$.next(res.data);
        })
    );
  }

  /**
   * @description Getter method for `this.walletListLastPage$` subject.
   * @returns  `this.walletListLastPage$` subject as Observable.
   */
  getWalletData(): Observable<IWalletData[]> {
    return this.walletListLastPage$.asObservable();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    this.walletDataSignal.set(undefined);
  }
}

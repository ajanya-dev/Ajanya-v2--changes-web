import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { Subscription, finalize, firstValueFrom } from 'rxjs';
import { IWalletData } from 'src/app/models/wallet';
import { WalletService } from 'src/app/shared/service/wallet/wallet.service';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CdkDragDrop, CdkDropList, CdkDrag } from '@angular/cdk/drag-drop';
import {
  faArrowRightArrowLeft,
  faDollar,
  faDownload,
  faMoneyFromBracket,
  faPenToSquare,
  faPlus,
  faSpinner,
  faStar,
  faWallet
} from '@fortawesome/pro-solid-svg-icons';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { MatTooltip } from '@angular/material/tooltip';
import { NgClass, JsonPipe, NgOptimizedImage } from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { CommonLayoutToggleService } from 'src/app/shared/service/common/shared/common-layout/common-layout-toggle.service';
import { environment } from 'src/environments/environment';
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { WalletsActions } from 'src/app/modules/store/wallets/wallets.actions';
import { WalletDataV35Service } from '../../services/wallet-data-v35.service';
import { TruncatePipe } from '../../../../../pipes/truncate.pipe';
import { CommonListSkeltonComponent } from '../../../../../shared/v3/common-components/common-list-skelton/common-list-skelton.component';
import { ScrollToEndDirective } from '../../../../../directive/scroll-to-end.directive';
import { ListHeaderV35Component } from '../../../../../shared/v3/common-components/list-header-v35/list-header-v35.component';
import { WalletDropdownV3Component } from '../../../../../shared/components/v3/drop-downs/wallet-dropdown-v3/wallet-dropdown-v3.component';
import { RaincardHelperService } from '../../services/raincard-helper.service';
import { WalletLogoUpdateModalComponent } from '../wallet-logo-update-modal/wallet-logo-update-modal.component';

@Component({
  selector: 'app-wallet-list-v35',
  templateUrl: './wallet-list-v35.component.html',
  styleUrls: ['./wallet-list-v35.component.scss'],
  standalone: true,
  imports: [
    WalletDropdownV3Component,
    FormsModule,
    ReactiveFormsModule,
    ListHeaderV35Component,
    FaIconComponent,
    ScrollToEndDirective,
    CdkDropList,
    NgClass,
    CdkDrag,
    MatTooltip,
    MatMenuTrigger,
    MatMenu,
    MatMenuItem,
    CommonListSkeltonComponent,
    JsonPipe,
    TruncatePipe,
    NgOptimizedImage
  ]
})
export class WalletListV35Component implements OnInit, OnDestroy {
  /* Injecting dependencies using inject method */
  public walletDataService = inject(WalletDataV35Service);
  private walletsService = inject(WalletService);
  private sharedService = inject(SharedService);
  private commonLayoutToggleService = inject(CommonLayoutToggleService);
  private rainCardService = inject(RaincardHelperService);
  private dialog = inject(MatDialog);
  private store = inject(Store);

  /**
   * Variables
   */
  nameSearchInput = '';
  availableBalanceSearchInput = '';
  currentBalanceSearchInput = '';
  searchInput = '';
  isWalletListLoading = false;
  walletListLastPage: IWalletData[];
  subscriptions: Subscription[] = [];
  securityDeposit: { available_balance: string };
  dropDownWallet: FormControl<IWalletData> = new FormControl();
  isDownload = signal(false);
  env = environment;

  faStar = faStar;
  faDollar = faDollar;
  faArrowRightArrowLeft = faArrowRightArrowLeft;
  faMoneyFromBracket = faMoneyFromBracket;
  faPlus = faPlus;
  faDownload = faDownload;
  faSpinner = faSpinner;
  grabbing = false;
  resize = false;
  searchFlag = false;
  faLogo = faPenToSquare;
  faWallet = faWallet;

  ngOnInit() {
    if (!this.walletDataService.walletDataSignal()?.id) {
      this.selectTotal();
    }
    this.loadInitialWalletData();
    this.getWalletData();
    this.getSecurityDeposit();
    this.changeWallet();
    this.walletDataService.loadRequestWalletData();
    this.checkResize();
  }

  checkResize(): void {
    this.subscriptions.push(
      this.commonLayoutToggleService.toggleChange$.subscribe((res) => {
        this.resize = res;
      })
    );
  }

  /**
   * @description Resets the selected wallet data to empty values.
   */
  selectTotal() {
    this.walletDataService.setData({
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
    this.sharedService.selectedPayees.reset();
    // To change the tab if wallet's cards tab is selected when selected all wallets.
    this.walletDataService.selectedWalletTab = {
      tab: 'details'
    };
  }

  /**
   * @description Changes the selected wallet and Sets the selected wallet data.
   * @param {IWalletData} wallet - The selected wallet data
   */
  changeWallet() {
    this.subscriptions.push(
      this.dropDownWallet.valueChanges.subscribe((walletItem) => {
        if (walletItem === null || walletItem === undefined) return;
        if (
          this.walletDataService.walletDataSignal()?.uuId !== walletItem.uuId
        ) {
          this.walletDataService.setData(walletItem);
          this.walletDataService.cardOnBoardingStatus(
            undefined,
            walletItem.uuId
          );
        }
      })
    );
  }

  /**
   * @description Sets the selected wallet data and updates the view.
   * @param item - The wallet data to select.
   */
  selectWallet(item: IWalletData) {
    if (item !== null && !this.rainCardService.onBoardingLoading) {
      this.sharedService.selectedPayees.reset();
      this.walletDataService.searchFlag = false;
      if (!this.searchInput) {
        this.walletDataService.tempSeletedItem = item;
      }
      if (item.id !== this.walletDataService.walletDataSignal()?.id) {
        this.walletDataService.cardOnBoardingStatus(undefined, item.uuId);
      }
      this.walletDataService.setData(item);
      this.dropDownWallet.setValue(item);
    }
  }

  /**
   * @description Executes an action on a wallet based on the provided parameters.
   * @param {IWalletData} wallet - Selected wallet.
   * @param {number} walletAction - The action code to perform on the wallet.
   */
  menuAction(wallet: IWalletData, walletAction: number) {
    if (walletAction === 7) {
      this.downloadFundingDetails(wallet?.uuId as string);
      return;
    }
    this.walletDataService.openModal({ wallet, walletAction });
  }

  downloadFundingDetails(walletId: string) {
    this.isDownload.set(true);
    this.subscriptions.push(
      this.walletsService
        .downloadFundingInfo(walletId)
        .pipe(finalize(() => this.isDownload.set(false)))
        .subscribe((res) => {
          if (res.success) {
            window.open(res.data.url, '_blank');
          }
        })
    );
  }

  /**
   * @description Method to load wallet data on scroll to end and search.
   */
  getWalletData() {
    this.subscriptions.push(
      this.walletDataService.getWalletData().subscribe((res) => {
        this.walletListLastPage = res.data;

        if (this.searchFlag && this.walletDataService.scolled === false) {
          this.walletDataService.walletAccountsSignal.set({
            success: true,
            data: [],
            totalCurrentBalance: res.totalCurrentBalance,
            totalAvailableBalance: res.totalAvailableBalance
          });
        }

        const currentWalletData = this.walletDataService.walletAccountsSignal();
        let newItems: IWalletData[] = [];
        if (currentWalletData) {
          // Filter out items that are already in the array
          newItems = res.data.filter(
            (newItem) =>
              !currentWalletData.data.some(
                (existingItem) => existingItem.id === newItem.id
              )
          );
          this.walletDataService.walletAccountsSignal()?.data.push(...newItems);
        } else {
          this.walletDataService.walletAccountsSignal()?.data.push(...res.data);
        }

        this.isWalletListLoading = false;

        if (this.searchInput) {
          this.searchFlag = true;
        } else {
          this.searchFlag = false;
        }
      })
    );
  }

  /**
   * @description Method to load initial set of wallets.
   */
  loadInitialWalletData() {
    this.walletDataService.page = 1;
  }

  /**
   * @description Get next 10 element on each scroll event
   */
  onScrollToEnd() {
    if (this.walletListLastPage && !this.walletListLastPage.length) return;
    this.isWalletListLoading = true;
    this.walletDataService.setRequestWalletData('scroll', this.searchInput);
  }

  /**
   * @description Get wallets that matches the search string.
   */
  onWalletSearch(event: string) {
    this.searchInput = event;
    this.isWalletListLoading = true;
    this.walletDataService.setRequestWalletData('search', this.searchInput);
  }

  /**
   * @description set available_balance in security deposit
   */
  getSecurityDeposit() {
    this.subscriptions.push(
      this.walletsService.getSecurityDepositBalance().subscribe((res) => {
        if (res.success) {
          this.securityDeposit = res.data;
        }
      })
    );
  }

  dropListSort(event: CdkDragDrop<IWalletData[]>) {
    this.walletDataService.walletAccountsSignal.update((val) => {
      if (!val) return undefined;

      const item = val.data[event.previousIndex];
      if (!item) return { ...val };

      const count = val.data.reduce((prev, curr) => {
        if (curr.isFavorite === 1) {
          // eslint-disable-next-line no-param-reassign
          prev += 1;
          return prev;
        }
        return prev;
      }, 0);

      if (event.currentIndex > count - 1) {
        return { ...val };
      }

      const array = [...val.data];
      array.splice(event.previousIndex, 1);
      array.splice(event.currentIndex, 0, item);

      const order = array
        .filter((el) => el.isFavorite === 1)
        .reduce(
          (obj, el, i) => {
            // eslint-disable-next-line no-param-reassign
            obj[el.id] = i;
            return obj;
          },
          {} as Record<string, number>
        );
      this.updateOrder(order);
      return { ...val, data: array };
    });
  }

  updateOrder(order: Record<string, number>) {
    firstValueFrom(this.walletsService.updateFavoriteOrder({ order }));
  }

  sortPredicate() {
    return (index: number, _: CdkDragDrop<IWalletData[]>) => {
      const data = this.walletDataService.walletAccountsSignal()?.data;
      if (!data) return false;
      const count = data.reduce((prev, curr) => {
        if (curr.isFavorite === 1) {
          // eslint-disable-next-line no-param-reassign
          prev += 1;
          return prev;
        }
        return prev;
      }, 0);

      return !(count - 1 < index);
    };
  }

  dragEvents(event: 'start' | 'end') {
    if (event === 'start') this.grabbing = true;
    if (event === 'end') this.grabbing = false;
  }

  openLogoUpdateModal(wallet: IWalletData) {
    const dialogRef = this.dialog.open(WalletLogoUpdateModalComponent, {
      disableClose: true,
      panelClass: 'paddingless-modal',
      width: '400px',
      data: {
        wallet,
        businessName: wallet.walletName || wallet.displayName || 'My Wallet',
        from: 'list'
      }
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result && result.success) {
        const updatedWallet = { ...wallet, logo: result.wallet } as IWalletData;
        this.walletDataService.walletDataSignal.set(updatedWallet);
        this.walletDataService.setWallets();
        this.store.dispatch(WalletsActions.walletsReset());
        this.store.dispatch(WalletsActions.loadWallets({ searchTerm: '' }));
      }
    });
  }

  /**
   * @description Unsubscribes from all subscriptions to prevent memory leaks.
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}

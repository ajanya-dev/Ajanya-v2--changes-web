import {
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
  HostBinding,
  computed
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, firstValueFrom } from 'rxjs';
import { IWalletData } from 'src/app/models/wallet';
import { WalletService } from 'src/app/shared/service/wallet/wallet.service';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CdkDragDrop, CdkDropList, CdkDrag } from '@angular/cdk/drag-drop';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { MatTooltip } from '@angular/material/tooltip';
import { NgClass, JsonPipe, NgOptimizedImage } from '@angular/common';
import {
  LucideAngularModule,
  CircleArrowDown,
  CircleArrowUp,
  Wallet
} from 'lucide-angular';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faStar } from '@fortawesome/pro-solid-svg-icons';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { CommonLayoutToggleV4Service } from 'src/app/shared/service/common/shared/common-layout/common-layout-toggle-v4.service';
import { environment } from 'src/environments/environment';
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { WalletsActions } from 'src/app/modules/store/wallets/wallets.actions';
import { WalletDataV35Service } from '../../../wallet-v3/services/wallet-data-v35.service';
import { TruncatePipe } from '../../../../../pipes/truncate.pipe';
import { CommonListSkeltonComponent } from '../../../../../shared/v3/common-components/common-list-skelton/common-list-skelton.component';
import { ScrollToEndDirective } from '../../../../../directive/scroll-to-end.directive';
import { ListHeaderV4Component } from '../../../../../shared/v4/common-components/list-header-v4/list-header-v4.component';
import { WalletDropdownV3Component } from '../../../../../shared/components/v3/drop-downs/wallet-dropdown-v3/wallet-dropdown-v3.component';
import { RaincardHelperService } from '../../../wallet-v3/services/raincard-helper.service';
import { WalletLogoUpdateV4ModalComponent } from '../../modals/wallet-logo-update-v4/wallet-logo-update-v4-modal.component';
import { RechargeCreditsV4ModalComponent } from '../../modals/recharge-credits-v4/recharge-credits-v4-modal.component';
import { WithdrawFundsV4ModalComponent } from '../../modals/withdraw-funds-v4/withdraw-funds-v4-modal.component';
import { FundYourWalletV4ModalComponent } from '../../modals/fund-your-wallet-v4/fund-your-wallet-v4-modal.component';
import { DownloadStatementV4ModalComponent } from '../../modals/download-statement-v4/download-statement-v4-modal.component';
import { V4TransferFundsModalComponent } from '../../../../../shared/modal/v4-transfer-funds/v4-transfer-funds-modal.component';

@Component({
  selector: 'app-wallet-list-v4',
  templateUrl: './wallet-list-v4.component.html',
  styleUrls: ['./wallet-list-v4.component.scss'],
  standalone: true,
  imports: [
    WalletDropdownV3Component,
    FormsModule,
    ReactiveFormsModule,
    ListHeaderV4Component,
    LucideAngularModule,
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
    NgOptimizedImage,
    FontAwesomeModule
  ]
})
export class WalletListV4Component implements OnInit {
  @HostBinding('class') hostClass = 'flex flex-col h-full overflow-hidden';

  faStar = faStar;

  /* Injecting dependencies using inject method */
  public walletDataService = inject(WalletDataV35Service);
  private walletsService = inject(WalletService);
  private sharedService = inject(SharedService);
  private commonLayoutToggleV4Service = inject(CommonLayoutToggleV4Service);
  private destroyRef = inject(DestroyRef);

  /** Expose layout toggle so template can hide All Wallets when panel is collapsed */
  isPanelCollapsed = this.commonLayoutToggleV4Service.toggle;
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
  isSearchLoading = false;
  walletListLastPage: IWalletData[];
  securityDeposit: { available_balance: string };
  dropDownWallet: FormControl<IWalletData> = new FormControl();
  isDownload = signal(false);
  env = environment;

  readonly CircleArrowDown = CircleArrowDown;
  readonly CircleArrowUp = CircleArrowUp;
  readonly WalletIcon = Wallet;
  grabbing = false;
  resize = false;
  searchFlag = false;

  activeCount = computed(
    () =>
      this.walletDataService.walletAccountsSignal()?.totalCount ??
      this.walletDataService.walletAccountsSignal()?.data?.length ??
      0
  );

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
    this.commonLayoutToggleV4Service.toggleChange$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.resize = res;
      });
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
   * @description Called when the user explicitly clicks "All Wallets".
   * Separates data reset from navigation so ngOnInit can call selectTotal()
   * without triggering the mobile detail navigation.
   */
  onSelectAllWallets() {
    this.selectTotal();
    this.commonLayoutToggleV4Service.navigateToDetail();
  }

  /**
   * @description Changes the selected wallet and Sets the selected wallet data.
   * @param {IWalletData} wallet - The selected wallet data
   */
  changeWallet() {
    this.dropDownWallet.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((walletItem) => {
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
      });
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
      this.commonLayoutToggleV4Service.navigateToDetail();
    }
  }

  /**
   * @description Executes an action on a wallet based on the provided parameters.
   * @param {IWalletData} wallet - Selected wallet.
   * @param {number} walletAction - The action code to perform on the wallet.
   */
  menuAction(wallet: IWalletData, walletAction: number) {
    if (walletAction === 1) {
      this.dialog.open(FundYourWalletV4ModalComponent, {
        width: '700px',
        maxWidth: '93%',
        disableClose: true,
        panelClass: 'paddingless-modal-rounded',
        data: wallet
      });
      return;
    }
    if (walletAction === 2) {
      this.dialog.open(RechargeCreditsV4ModalComponent, {
        width: '650px',
        maxWidth: '93%',
        disableClose: true,
        panelClass: 'paddingless-modal-rounded',
        data: wallet
      });
      return;
    }
    if (walletAction === 3) {
      this.dialog.open(V4TransferFundsModalComponent, {
        maxWidth: '560px',
        width: '100%',
        autoFocus: false,
        disableClose: true,
        panelClass: 'paddingless-modal-rounded',
        data: {
          transferFrom: 2,
          transferFromId: wallet.uuId
        }
      });
      return;
    }
    if (walletAction === 4) {
      this.dialog.open(WithdrawFundsV4ModalComponent, {
        width: '650px',
        maxWidth: '93%',
        disableClose: true,
        panelClass: 'paddingless-modal-rounded',
        data: wallet
      });
      return;
    }
    if (walletAction === 5) {
      this.dialog.open(DownloadStatementV4ModalComponent, {
        width: '480px',
        maxWidth: '95vw',
        disableClose: true,
        panelClass: 'paddingless-modal-rounded',
        data: wallet
      });
      return;
    }
    if (walletAction === 7) {
      this.downloadFundingDetails(wallet?.uuId as string);
      return;
    }
    this.walletDataService.openModal({ wallet, walletAction }, true);
  }

  downloadFundingDetails(walletId: string) {
    this.isDownload.set(true);
    this.walletsService
      .downloadFundingInfo(walletId)
      .pipe(
        finalize(() => this.isDownload.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          window.open(res.data.url, '_blank');
        }
      });
  }

  /**
   * @description Method to load wallet data on scroll to end and search.
   */
  getWalletData() {
    this.walletDataService
      .getWalletData()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
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
        this.isSearchLoading = false;

        if (this.searchInput) {
          this.searchFlag = true;
        } else {
          this.searchFlag = false;
        }
      });
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
    this.isSearchLoading = true;
    this.walletDataService.setRequestWalletData('search', this.searchInput);
  }

  /**
   * @description set available_balance in security deposit
   */
  getSecurityDeposit() {
    this.walletsService
      .getSecurityDepositBalance()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res.success) {
          this.securityDeposit = res.data;
        }
      });
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
    const dialogRef = this.dialog.open(WalletLogoUpdateV4ModalComponent, {
      disableClose: true,
      panelClass: 'paddingless-modal-rounded',
      width: '400px',
      data: {
        wallet,
        businessName: wallet.walletName || wallet.displayName || 'My Wallet',
        from: 'list'
      }
    });
    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result && result.success) {
          const updatedWallet = {
            ...wallet,
            logo: result.wallet
          } as IWalletData;
          this.walletDataService.walletDataSignal.set(updatedWallet);
          this.walletDataService.setWallets();
          this.store.dispatch(WalletsActions.walletsReset());
          this.store.dispatch(WalletsActions.loadWallets({ searchTerm: '' }));
        }
      });
  }
}

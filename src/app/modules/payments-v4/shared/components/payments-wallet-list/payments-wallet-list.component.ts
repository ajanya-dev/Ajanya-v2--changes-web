import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  effect,
  inject,
  input,
  output,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable, combineLatest, debounceTime, filter, map, take } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule, Search, X, Wallet, Plus } from 'lucide-angular';
import { MatDialog } from '@angular/material/dialog';

import { IWalletData } from 'src/app/models/wallet';
import { WalletsActions } from 'src/app/modules/store/wallets/wallets.actions';
import {
  selectWallets,
  selectFilteredWallets,
  selectIsWalletsFilterOn,
  selectIsWalletsLoading,
  selectWalletUploadPrompt
} from 'src/app/modules/store/wallets/wallets.selectors';
import { ScrollToEndDirective } from 'src/app/directive/scroll-to-end.directive';
import { WalletLogoUpdateV4ModalComponent } from 'src/app/modules/wallet/wallet-v4/modals/wallet-logo-update-v4/wallet-logo-update-v4-modal.component';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { WalletService } from 'src/app/shared/service/wallet/wallet.service';

/** Minimum wallet balance (USD) required to fund an international payment. */
const MIN_INTERNATIONAL_WALLET_BALANCE = 10;

@Component({
  selector: 'app-payments-wallet-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ScrollToEndDirective,
    LucideAngularModule
  ],
  templateUrl: './payments-wallet-list.component.html',
  styleUrl: './payments-wallet-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaymentsWalletListComponent implements OnInit {
  private store = inject(Store);
  private destroyRef = inject(DestroyRef);
  private matDialog = inject(MatDialog);
  private alertService = inject(V4AlertService);
  private walletsService = inject(WalletService);
  public paymentsService = inject(PaymentsService);

  walletId = input<string | null>(null);
  preSelectedWallet = input<IWalletData | null>(null);
  placeholder = input<string>('Select Your Wallet');
  isInternationalPayment = input<boolean>(false);
  walletSelected = output<IWalletData | null>();

  wallets$: Observable<IWalletData[]> = this.store.select(selectWallets);

  displayedWallets$: Observable<IWalletData[]> = this.wallets$.pipe(
    map((wallets) => wallets.slice(0, 3))
  );

  filteredWallets$: Observable<IWalletData[]> = this.store.select(
    selectFilteredWallets
  );

  isFilterOn$: Observable<boolean> = this.store.select(selectIsWalletsFilterOn);

  isLoading$: Observable<boolean> = this.store.select(selectIsWalletsLoading);

  selectedWallet = signal<IWalletData | null>(null);
  showLogoUpdateModal = true;
  walletLogoModalOpen = signal(false);
  searchTerm = '';
  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  readonly SearchIcon = Search;
  readonly XIcon = X;
  readonly WalletIcon = Wallet;
  readonly PlusIcon = Plus;

  constructor() {
    effect(() => {      
      if(this.isInternationalPayment()) {
        this.store.dispatch(WalletsActions.loadWallets({ searchTerm: '', context: { internationalPaymentWallets: this.isInternationalPayment() },isReload: true, disablePermission: true }));
        this.checkSelectedWalletInternationalPayment();
      }else{
        this.store.dispatch(WalletsActions.loadWallets({ searchTerm: '', isReload: true, disablePermission: true }));
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    this.store
      .select(selectWalletUploadPrompt)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((prompt) => {
        if (prompt === 1) {
          this.showLogoUpdateModal = false;
        }
      });

    const direct = this.preSelectedWallet();
    const directId = direct?.uuId ?? direct?.id ?? null;
    if (directId) {
      this.setWalletById(directId);
    } else if (direct) {
      this.setWalletSilently(direct);
    } else if (this.walletId()) {
      this.setWalletById(this.walletId());
    }
  }

  setWalletById(id: string | null): void {
    if (!id) return;

    combineLatest([this.wallets$, this.filteredWallets$])
      .pipe(
        filter(([wallets]) => !!wallets?.length),
        debounceTime(100),
        take(1),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(([wallets]) => {
        const item = wallets.find((w) => w.uuId === id || w.id === id);
        if (item) {
          this.setWalletSilently(item);
        } else if (this.preSelectedWallet()) {
          this.setWalletSilently(this.preSelectedWallet()!);
        }
      });
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.onSearch();
  }

  onSearch(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    const term = this.searchTerm.replace(/&/g, '%26');
    this.searchTimeout = setTimeout(() => {
      this.store.dispatch(WalletsActions.loadWallets({ searchTerm: term, disablePermission: true,context: { internationalPaymentWallets: this.isInternationalPayment() } }));
    }, 600);
  }

  onScrollToEnd(): void {
    this.store.dispatch(WalletsActions.loadMoreWallets());
  }

  setWalletSilently(wallet: IWalletData): void {
    this.selectedWallet.set(wallet);
    this.walletSelected.emit(wallet);
  }

  selectWallet(wallet: IWalletData): void {
    // International payments require the funding wallet to hold a minimum
    // balance. Reject the selection up-front and surface the error modal.
    if (
      this.isInternationalPayment() &&
      this.isBelowInternationalMinBalance(wallet)
    ) {
      this.alertService.failedAlert({
        title: 'Error',
        content: `Selected wallet has insufficient balance. A minimum balance of $${MIN_INTERNATIONAL_WALLET_BALANCE}.00 is required.`
      });
      return;
    }

    this.selectedWallet.set(wallet);
    this.walletSelected.emit(wallet);
    this.checkIfWalletHasLogo(wallet);
  }

  /** True when the wallet's available balance is under the international minimum. */
  private isBelowInternationalMinBalance(wallet: IWalletData): boolean {
    const balance = Number(
      String(wallet.availableBalance ?? wallet.currentBalance ?? '0').replace(
        /[$,]/g,
        ''
      )
    );
    return !isNaN(balance) && balance < MIN_INTERNATIONAL_WALLET_BALANCE;
  }

  removeSelectedWallet(): void {
    this.selectedWallet.set(null);
    this.walletSelected.emit(null);
  }

  checkIfWalletHasLogo(wallet: IWalletData): void {
    if (
      wallet &&
      !wallet.logo &&
      this.showLogoUpdateModal &&
      !this.walletLogoModalOpen()
    ) {
      this.walletLogoModalOpen.set(true);
      const dialogRef = this.matDialog.open(WalletLogoUpdateV4ModalComponent, {
        disableClose: true,
        panelClass: 'paddingless-modal-rounded',
        width: '400px',
        data: { wallet }
      });
      dialogRef.afterClosed().subscribe((result) => {
        this.walletLogoModalOpen.set(false);
        if (result && result.success) {
          if (result.dontAskAgain) {
            this.showLogoUpdateModal = false;
          }
          this.store.dispatch(WalletsActions.walletsReset());
          this.store.dispatch(WalletsActions.loadWallets({ searchTerm: '', disablePermission: true,context: { internationalPaymentWallets: this.isInternationalPayment() } }));
          const updatedWallet = { ...wallet, logo: result.wallet };
          this.selectedWallet.set(updatedWallet);
          this.walletSelected.emit(updatedWallet);
        }
      });
    }
  }

  getDisplayName(wallet: IWalletData): string {
    return wallet.walletName ?? wallet.bankAccountNickName ?? '';
  }

  getBalance(wallet: IWalletData): string {
    const balance = wallet.availableBalance ?? wallet.currentBalance ?? '0.00';
    return `$${Number(balance).toFixed(2)}`;
  }

  getMaskedAccount(wallet: IWalletData): string {
    const num = wallet.bankAccountNumber;
    if (!num) return '';
    const last4 = num.slice(-4);
    return `**** ${last4}`;
  }

  checkSelectedWalletInternationalPayment(): void {
    const selected = this.selectedWallet();
    if (!selected?.walletName) return;

    this.walletsService
      .getWalletInformationByIds([selected.id])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        const wallets = res?.data ?? [];
        const found = wallets.some(
          (w) =>
            w.walletName === selected.walletName ||
            w.uuId === selected.uuId ||
            w.id === selected.id
        );
        if (!found) {
          this.removeSelectedWallet();
          this.alertService.warningAlert({
            content:
              'You have no permission to select this wallet. Please choose another wallet.',
            isCancel: false
          });
        }
      });
  }

}

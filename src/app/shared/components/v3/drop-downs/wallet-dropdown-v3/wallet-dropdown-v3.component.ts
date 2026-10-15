import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  forwardRef,
  inject,
  input,
  signal
} from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { NgSelectModule } from '@ng-select/ng-select';
import {
  ControlValueAccessor,
  FormControl,
  FormsModule,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule
} from '@angular/forms';
import { Store } from '@ngrx/store';
import {
  Observable,
  Subscription,
  combineLatest,
  debounceTime,
  filter,
  switchMap,
  take,
  tap,
  EMPTY,
  distinctUntilChanged
} from 'rxjs';
import { IWalletData } from 'src/app/models/wallet';
import { WalletsActions } from 'src/app/modules/store/wallets/wallets.actions';
import {
  selectFilteredWallets,
  selectIsWalletsByIdLoading,
  selectIsWalletsFilterOn,
  selectIsWalletsLoading,
  selectWallets,
  selectWalletUploadPrompt
} from 'src/app/modules/store/wallets/wallets.selectors';
import { IV3DropDownOnReady } from 'src/app/models/common';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { WalletLogoUpdateModalComponent } from 'src/app/modules/wallet/wallet-v3/components-V35/wallet-logo-update-modal/wallet-logo-update-modal.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-wallet-dropdown-v3',
  standalone: true,
  imports: [
    CommonModule,
    NgSelectModule,
    FormsModule,
    ReactiveFormsModule,
    FontAwesomeModule,
    NgOptimizedImage
  ],
  templateUrl: './wallet-dropdown-v3.component.html',
  styleUrls: ['./wallet-dropdown-v3.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => WalletDropdownV3Component),
      multi: true
    }
  ]
})
export class WalletDropdownV3Component
  implements ControlValueAccessor, OnDestroy, AfterViewInit, OnInit, OnDestroy
{
  private store = inject(Store);
  public paymentsService = inject(PaymentsService);
  private matDialog = inject(MatDialog);

  /** Its better to pass a unique id always for avoiding conflict */
  @Input() id = 'id';
  @Input() enableAddNew = true;
  @Input() placeholder = 'Select Wallet';
  @Input() append = 'body';
  @Input() customHeight: '0' | '1' | '2' | '3' | '4' = '2';
  @Input() labelIconNeeded = true;
  @Input() dropdownIconNeeded = true;
  @Output() ready = new EventEmitter<IV3DropDownOnReady>();
  @Output() touch = new EventEmitter();
  @Output() dropdownOpenChange = new EventEmitter<boolean>();
  @Input() showLogoUpdateModal = true;

  dropdownPosition = input<string>('auto');

  walletsToList$: Observable<IWalletData[]>;
  selectIsWalletsFilterOn$: Observable<boolean>;
  selectIsWalletsLoading$: Observable<boolean>;
  subscriptions: Subscription[] = [];
  walletUploadPrompt$: Observable<number>;
  selectedWallet: FormControl<IWalletData | null | undefined> =
    new FormControl();

  searchTerm: string;
  searchTimeout: ReturnType<typeof setTimeout>;
  changesSubscription: Subscription;
  onReadyResponse: IV3DropDownOnReady = {};
  selectIsWalletsByIdLoading$: Observable<boolean>;
  isLoadingWithId: boolean = false;
  isDropdownOpen = false;
  walletLogo = signal<string | undefined>(undefined);
  walletLogoModalOpen = signal(false);
  permissionContext = input<string | undefined>(undefined);

  ngOnInit(): void {
    this.initStoreSelectors();
    this.subscriptions.push(
      this.selectedWallet.valueChanges
      .pipe(
        tap((value) => {
          this.walletLogo.set(value?.logo);
        }),
        filter((value) => value !== undefined),
        debounceTime(500),
        distinctUntilChanged((a, b) => a?.id === b?.id),
        switchMap((value) => this.checkIfWalletHasLogo(value))
      )
      .subscribe()
    );
  }

  ngAfterViewInit() {
    this.onReady();
  }

  /**
   * Initializes the store selectors and subscriptions for wallet-related data.
   */
  initStoreSelectors() {
    const context = this.getPermissionContext();
    this.store.dispatch(WalletsActions.loadWallets({ searchTerm: '', context }));
    const wallets$ = this.store.select(selectWallets);
    const walletsFiltered$ = this.store.select(selectFilteredWallets);
    this.selectIsWalletsFilterOn$ = this.store.select(selectIsWalletsFilterOn);
    this.selectIsWalletsLoading$ = this.store.select(selectIsWalletsLoading);
    this.selectIsWalletsByIdLoading$ = this.store.select(
      selectIsWalletsByIdLoading
    );
    this.walletsToList$ = this.selectIsWalletsFilterOn$.pipe(
      switchMap((isFilterOn) => (isFilterOn ? walletsFiltered$ : wallets$))
    );
    this.walletUploadPrompt$ = this.store.select(
      selectWalletUploadPrompt
    ) as Observable<number>;
    this.walletUploadPrompt$.subscribe((prompt) => {
      if (prompt === 1) {
        this.showLogoUpdateModal = false;
      }
    });
  }

  /**
   * Called when the component is ready. Emits a response with the setItemWithId function.
   */
  onReady() {
    this.onReadyResponse = {
      setItemWithId: this.setItemWithId
    };
    this.ready.emit(this.onReadyResponse);
  }

  /**
   * Sets an item with a specific ID in the wallet dropdown.
   *
   * @param id - The ID of the item to set.
   * @returns True if the item was set, false otherwise.
   */
  setItemWithId = (id: string) => {
    if (id === null) return;
    this.isLoadingWithId = true;
    let loadingSubscription: Subscription;
    // eslint-disable-next-line prefer-const
    loadingSubscription = combineLatest([
      this.walletsToList$,
      this.selectIsWalletsLoading$
    ])
      .pipe(
        debounceTime(500), // Optional debounce time if needed
        take(2) // Take the first combined value
      )
      .subscribe(([wallets, isLoading]) => {
        if (!isLoading) {
          const item = wallets.find((ele) => ele.id === id);
          if (item) {
            this.isLoadingWithId = false;
            this.selectedWallet.setValue(item);
          } else {
            this.loadItemsById(id);
          }
          loadingSubscription.unsubscribe();
        }
      });
  };

  /**
   * Loads wallet items by their IDs.
   *
   * @param id - The ID of the wallet item to load.
   */
  loadItemsById(id: string) {
    if (id === null) return;
    const context = this.getPermissionContext();
    this.store.dispatch(WalletsActions.loadWalletsByIds({ ids: [id], context }));
    let loadingSubscription: Subscription;
    this.placeholder = 'Loading...';
    this.isLoadingWithId = true;
    // eslint-disable-next-line prefer-const
    loadingSubscription = combineLatest([
      this.walletsToList$,
      this.selectIsWalletsByIdLoading$
    ])
      .pipe(
        debounceTime(10), // Optional debounce time if needed
        take(2) // Take the first combined value
      )
      .subscribe(([wallets, isLoading]) => {
        if (!isLoading) {
          const item =
            wallets.find((ele) => ele.id === id) ||
            wallets.find((ele) => ele.uuId === id);
          if (item) {
            this.isLoadingWithId = false;
            this.selectedWallet.setValue(item);
          }
          this.placeholder = 'Select Wallet';
          loadingSubscription.unsubscribe();
        }
      });
  }

  onTouched: (event?: Event) => void;
  /**
   * Writes a value to the selected wallet based on the provided value's ID.
   *
   * @param value - The value to write.
   */
  writeValue(value: IWalletData): void {
    if (value?.id) {
      this.setItemWithId(value.id);
    } else {
      this.selectedWallet.setValue(undefined);
    }
  }

  /**
   * Registers a callback function to be invoked when the selected wallet value changes.
   *
   * @param fn - The callback function.
   */
  registerOnChange(fn: (event?: IWalletData | null | undefined) => void): void {
    this.changesSubscription = this.selectedWallet.valueChanges.subscribe(fn);
  }

  /**
   * Registers a callback function to be invoked when the selected wallet is touched.
   *
   * @param fn - The callback function.
   */
  registerOnTouched(fn: (event?: Event | undefined) => void): void {
    this.onTouched = fn;
  }

  /**
   * @description Gets next 10 element on each scroll event
   */
  onScrollToEnd() {
    this.store.dispatch(WalletsActions.loadMoreWallets());
  }

  /**
   * @description Gets data based on search term.
   * @param event - event
   */
  search(event: KeyboardEvent | FocusEvent) {
    clearTimeout(this.searchTimeout);
    this.searchTerm = (event?.target as HTMLInputElement).value;
    const data = this.searchTerm.replace(/&/g, '%26');
    this.searchTerm = data;
    this.searchTimeout = setTimeout(() => {
      const context = this.getPermissionContext();
      this.store.dispatch(
        WalletsActions.loadWallets({ searchTerm: this.searchTerm, context })
      );
    }, 600);
  }

  /**
   * @description CLears the changes made.
   */
  clear() {
    this.searchTerm = '';
    const context = this.getPermissionContext();
    this.store.dispatch(
      WalletsActions.loadWallets({ searchTerm: this.searchTerm, context })
    );
  }

  trackByWallet(index: number, item: IWalletData) {
    return item.uuId;
  }

  /**
   * @description Checks if the wallet has a logo.
   * @param value - The value to check.
   */
  checkIfWalletHasLogo(value: IWalletData | null | undefined) {
    if (
      value &&
      !value.logo &&
      this.showLogoUpdateModal &&
      !this.walletLogoModalOpen()
    ) {
      this.walletLogoModalOpen.set(true);
      const dialogRef = this.matDialog.open(WalletLogoUpdateModalComponent, {
        disableClose: true,
        panelClass: 'paddingless-modal',
        width: '400px',
        data: {
          wallet: value
        }
      });
      return dialogRef.afterClosed()
      .pipe(tap((result) => {
          this.walletLogoModalOpen.set(false);
          if (result && result.success) {
            if (result.dontAskAgain) {
              this.showLogoUpdateModal = false;
            }
            this.store.dispatch(WalletsActions.walletsReset());
            this.store.dispatch(WalletsActions.loadWallets({ searchTerm: '' }));
            this.walletLogo.set(result.wallet);
            const updatedWallet = { ...value, logo: result.wallet };
            this.selectedWallet.setValue(updatedWallet);
          }
        })
      );
    }
    return EMPTY;
  }

  afterLogoUpdate(walletId: string) {
    this.store.dispatch(WalletsActions.loadWalletsByIds({ ids: [walletId] }));

    this.store.select(selectWallets).subscribe((wallets) => {
      const updatedWallet = wallets.find((w) => w.id === walletId);
      if (updatedWallet) {
        this.selectedWallet.setValue(updatedWallet);
      }
    });
  }

  ngOnDestroy(): void {
    this.changesSubscription?.unsubscribe();
  }

  /**
   * Gets the permission context based on the input signal
   */
  private getPermissionContext(): { internationalPaymentWallets?: boolean } | undefined {
    const permission = this.permissionContext();
    if (!permission) {
      return undefined;
    }

    switch (permission) {
      case 'international-payment-wallets':
        return { internationalPaymentWallets: true };
      default:
        return undefined;
    }
  }
}

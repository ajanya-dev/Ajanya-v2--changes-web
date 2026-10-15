import {
  AfterViewInit,
  Component,
  OnDestroy,
  OnInit,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  output,
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
import { MatTooltipModule } from '@angular/material/tooltip';
import { Store } from '@ngrx/store';
import {
  Observable,
  Subscription,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  filter,
  switchMap,
  take,
  tap
} from 'rxjs';
import { IWalletData } from 'src/app/models/wallet';
import { WalletsActions } from 'src/app/modules/store/wallets/wallets.actions';
import {
  selectFilteredWallets,
  selectIsWalletsByIdLoading,
  selectIsWalletsFilterOn,
  selectIsWalletsLoading,
  selectIsWalletsPermissionDenied,
  selectWallets,
  selectWalletUploadPrompt
} from 'src/app/modules/store/wallets/wallets.selectors';
import { IV3DropDownOnReady } from 'src/app/models/common';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { MatDialog } from '@angular/material/dialog';
// eslint-disable-next-line import/no-extraneous-dependencies
import { LucideAngularModule, Wallet, Star } from 'lucide-angular';
import { WalletLogoUpdateV4ModalComponent } from 'src/app/modules/wallet/wallet-v4/modals/wallet-logo-update-v4/wallet-logo-update-v4-modal.component';

@Component({
  selector: 'app-wallet-dropdown-v4',
  standalone: true,
  imports: [
    CommonModule,
    NgSelectModule,
    FormsModule,
    ReactiveFormsModule,
    LucideAngularModule,
    MatTooltipModule,
    NgOptimizedImage
  ],
  templateUrl: './wallet-dropdown-v4.component.html',
  styleUrls: ['./wallet-dropdown-v4.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => WalletDropdownV4Component),
      multi: true
    }
  ]
})
export class WalletDropdownV4Component
  implements ControlValueAccessor, OnDestroy, AfterViewInit, OnInit, OnDestroy
{
  protected store = inject(Store);
  public paymentsService = inject(PaymentsService);
  private matDialog = inject(MatDialog);

  // Lucide icons
  readonly WalletIcon = Wallet;
  readonly StarIcon = Star;

  /** Its better to pass a unique id always for avoiding conflict */
  id = input('id');
  enableAddNew = input(true);
  placeholder = input('Select Wallet');
  append = input('ng-select');
  customHeight = input<'0' | '1' >('0');
  labelIconNeeded = input(true);
  dropdownIconNeeded = input(true);
  ready = output<IV3DropDownOnReady>();
  touch = output<void>();
  dropdownOpenChange = output<boolean>();
  showLogoUpdateModal = input(true);
  dropdownPosition = input<string>('auto');
  isInvalid = input(false);
  /** render a per-row default star (opt-in; off elsewhere) */
  showDefaultStar = input(false);
  /** id of the wallet that is the saved default — filled/yellow star */
  defaultItemId = input<string | number | null>(null);
  /** a star was clicked — the caller sets this wallet as the default */
  starClick = output<IWalletData>();

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
  isPermissionDenied$: Observable<boolean>;
  isLoadingWithId: boolean = false;
  isDropdownOpen = false;
  walletLogo = signal<string | undefined>(undefined);
  walletLogoModalOpen = signal(false);
  permissionContext = input<string | undefined>(undefined);

  placeholderText = signal('Select Wallet');
  /**
   * Dismissing the prompt — "Don't ask again", or the account-level
   * `walletUploadPrompt` — holds for the rest of the session. It is kept apart from
   * the input so that a host toggling `showLogoUpdateModal` cannot revive it.
   */
  private readonly logoPromptSuppressed = signal(false);

  readonly showLogoUpdateModalFlag = computed(
    () => this.showLogoUpdateModal() && !this.logoPromptSuppressed()
  );

  constructor() {
    effect(() => {
      this.placeholderText.set(this.placeholder());
    },{ allowSignalWrites: true });
  }

  ngOnInit(): void {
    this.initStoreSelectors();
    // Re-emitting the same wallet — a patch, a re-hydration, an auto-populate —
    // must not re-open the logo prompt; only a genuine change of wallet may.
    this.subscriptions.push(
      this.selectedWallet.valueChanges
        .pipe(
          tap((value) => this.walletLogo.set(value?.logo)),
          filter((value) => value !== undefined),
          debounceTime(500),
          distinctUntilChanged((a, b) => a?.id === b?.id)
        )
        .subscribe((value) => this.checkIfWalletHasLogo(value))
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
    this.store.dispatch(
      WalletsActions.loadWallets({ searchTerm: '', context, disablePermission: true })
    );
    const wallets$ = this.store.select(selectWallets);
    const walletsFiltered$ = this.store.select(selectFilteredWallets);
    this.selectIsWalletsFilterOn$ = this.store.select(selectIsWalletsFilterOn);
    this.selectIsWalletsLoading$ = this.store.select(selectIsWalletsLoading);
    this.selectIsWalletsByIdLoading$ = this.store.select(
      selectIsWalletsByIdLoading
    );
    this.isPermissionDenied$ = this.store.select(
      selectIsWalletsPermissionDenied
    );
    this.walletsToList$ = this.selectIsWalletsFilterOn$.pipe(
      switchMap((isFilterOn) => (isFilterOn ? walletsFiltered$ : wallets$))
    );
    this.walletUploadPrompt$ = this.store.select(
      selectWalletUploadPrompt
    ) as Observable<number>;
    this.subscriptions.push(
      this.walletUploadPrompt$.subscribe((prompt) => {
        if (prompt === 1) {
          this.logoPromptSuppressed.set(true);
        }
      })
    );
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
    this.subscriptions.push(
      combineLatest([
        this.walletsToList$,
        this.selectIsWalletsLoading$,
        this.isPermissionDenied$
      ])
        .pipe(
          debounceTime(500), // Optional debounce time if needed
          // Wait for the load to settle instead of taking a fixed number of
          // emissions — `take(2)` could burn both on still-loading states and
          // leave `isLoadingWithId` stuck on forever.
          filter(([, isLoading, isPermissionDenied]) =>
            isPermissionDenied ? true : !isLoading
          ),
          take(1)
        )
        .subscribe(([wallets, , isPermissionDenied]) => {
          if (isPermissionDenied) {
            this.resetLoadingState();
            return;
          }
          const item = wallets.find((ele) => ele.id === id);
          if (item) {
            this.resetLoadingState();
            this.selectedWallet.setValue(item);
            return;
          }
          this.loadItemsById(id);
        })
    );
  };

  /**
   * Loads wallet items by their IDs.
   *
   * @param id - The ID of the wallet item to load.
   */
  loadItemsById(id: string) {
    if (id === null) return;
    const context = this.getPermissionContext();
    this.store.dispatch(
      WalletsActions.loadWalletsByIds({ ids: [id], context,disablePermission: true  })
    );
    this.placeholderText.set('Loading...');
    this.isLoadingWithId = true;
    this.subscriptions.push(
      combineLatest([
        this.walletsToList$,
        this.selectIsWalletsByIdLoading$,
        this.isPermissionDenied$
      ])
        .pipe(
          debounceTime(10), // Optional debounce time if needed
          filter(([, isLoading, isPermissionDenied]) =>
            isPermissionDenied ? true : !isLoading
          ),
          take(1)
        )
        .subscribe(([wallets, , isPermissionDenied]) => {
          // The lookup is cleared whatever the outcome. Leaving it set when the
          // wallet can't be resolved (no permission, deleted wallet) keeps
          // ng-select in its loading state, and ng-select renders its own
          // "Loading..." instead of `notFoundText` while `[loading]` is true.
          this.resetLoadingState();
          if (isPermissionDenied) {
            return;
          }
          const item =
            wallets.find((ele) => ele.id === id) ||
            wallets.find((ele) => ele.uuId === id);
          if (item) {
            this.selectedWallet.setValue(item);
          }
        })
    );
  }

  /**
   * Clears the "resolving a wallet by id" state and puts the placeholder back.
   */
  private resetLoadingState(): void {
    this.isLoadingWithId = false;
    this.placeholderText.set(this.placeholder());
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
        WalletsActions.loadWallets({ searchTerm: this.searchTerm, context, disablePermission: true })
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
      WalletsActions.loadWallets({ searchTerm: this.searchTerm, context, disablePermission: true })
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
      this.showLogoUpdateModalFlag() &&
      !this.walletLogoModalOpen()
    ) {
      this.walletLogoModalOpen.set(true);
      const dialogRef = this.matDialog.open(WalletLogoUpdateV4ModalComponent, {
        disableClose: true,
        panelClass: 'paddingless-modal-rounded',
        width: '400px',
        data: {
          wallet: value
        }
      });
      dialogRef.afterClosed().subscribe((result) => {
        this.walletLogoModalOpen.set(false);
        if (result && result.success) {
          if (result.dontAskAgain) {
            this.logoPromptSuppressed.set(true);
          }
          this.store.dispatch(WalletsActions.walletsReset());
          this.store.dispatch(WalletsActions.loadWallets({ searchTerm: '', disablePermission: true }));
          this.walletLogo.set(result.wallet);
          const updatedWallet = { ...value, logo: result.wallet };
          this.selectedWallet.setValue(updatedWallet);
        }
      });
    }
  }

  afterLogoUpdate(walletId: string) {
    this.store.dispatch(WalletsActions.loadWalletsByIds({ ids: [walletId],disablePermission: true  }));

    this.store.select(selectWallets).subscribe((wallets) => {
      const updatedWallet = wallets.find((w) => w.id === walletId);
      if (updatedWallet) {
        this.selectedWallet.setValue(updatedWallet);
      }
    });
  }

  ngOnDestroy(): void {
    this.changesSubscription?.unsubscribe();
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.subscriptions = [];
  }

  /**
   * Gets the permission context based on the input signal
   */
  protected getPermissionContext():
    | { internationalPaymentWallets?: boolean }
    | undefined {
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

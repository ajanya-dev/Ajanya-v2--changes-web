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
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgSelectModule } from '@ng-select/ng-select';
import {
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
  switchMap,
  take
} from 'rxjs';
import { IWalletData } from 'src/app/models/wallet';
import { WalletsActions } from 'src/app/modules/store/wallets/wallets.actions';
import {
  selectFilteredWallets,
  selectIsWalletsByIdLoading,
  selectIsWalletsFilterOn,
  selectIsWalletsLoading,
  selectWallets
} from 'src/app/modules/store/wallets/wallets.selectors';
import { IV3DropDownOnReady } from 'src/app/models/common';

@Component({
  selector: 'app-wallet-dropdown-multi-select',
  standalone: true,
  imports: [
    CommonModule,
    NgSelectModule,
    FormsModule,
    ReactiveFormsModule,
    FontAwesomeModule
  ],
  templateUrl: './wallet-dropdown-multi-select.component.html',
  styleUrl: './wallet-dropdown-multi-select.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => WalletDropdownMultiSelectComponent),
      multi: true
    }
  ]
})
export class WalletDropdownMultiSelectComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  private store = inject(Store);

  /** Its better to pass a unique id always for avoiding conflict */
  @Input() id = 'id';
  @Input() enableAddNew = true;
  @Input() placeholder = 'Select Wallet';
  @Input() append = 'body';
  @Input() customHeight: '0' | '1' | '2' | '3' | '4' | '5' = '5';
  @Input() labelIconNeeded = true;
  @Input() dropdownIconNeeded = true;
  @Output() ready = new EventEmitter<IV3DropDownOnReady>();
  @Output() touch = new EventEmitter();

  walletsToList$: Observable<IWalletData[]>;
  selectIsWalletsFilterOn$: Observable<boolean>;
  selectIsWalletsLoading$: Observable<boolean>;

  selectedWallet: FormControl<IWalletData | null | undefined> =
    new FormControl();

  searchTerm: string;
  searchTimeout: ReturnType<typeof setTimeout>;
  changesSubscription: Subscription;
  onReadyResponse: IV3DropDownOnReady = {};
  selectIsWalletsByIdLoading$: Observable<boolean>;
  isLoadingWithId: boolean = false;

  ngOnInit(): void {
    this.initStoreSelectors();
  }

  ngAfterViewInit() {
    this.onReady();
  }

  /**
   * Initializes the store selectors and subscriptions for wallet-related data.
   */
  initStoreSelectors() {
    this.store.dispatch(WalletsActions.loadWallets({ searchTerm: '' }));
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
    this.store.dispatch(WalletsActions.loadWalletsByIds({ ids: [id] }));
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
      this.store.dispatch(
        WalletsActions.loadWallets({ searchTerm: this.searchTerm })
      );
    }, 600);
  }

  /**
   * @description CLears the changes made.
   */
  clear() {
    this.searchTerm = '';
    this.store.dispatch(
      WalletsActions.loadWallets({ searchTerm: this.searchTerm })
    );
  }

  trackByWallet(index: number, item: IWalletData) {
    return item.uuId;
  }

  ngOnDestroy(): void {
    this.changesSubscription?.unsubscribe();
  }
}

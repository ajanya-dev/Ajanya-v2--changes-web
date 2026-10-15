import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Injector,
  OnInit,
  ViewEncapsulation,
  effect,
  inject,
  input,
  output,
  signal
} from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgSelectModule } from '@ng-select/ng-select';
import { Store } from '@ngrx/store';
import { LucideAngularModule, Check, LoaderCircle } from 'lucide-angular';
import { Observable, Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { IWalletData } from 'src/app/models/wallet';
import { WalletsActions } from 'src/app/modules/store/wallets/wallets.actions';
import {
  selectFilteredWallets,
  selectIsWalletsFilterOn,
  selectIsWalletsLoading,
  selectWallets
} from 'src/app/modules/store/wallets/wallets.selectors';

/**
 * @description V4 wallets multi-select dropdown.
 *
 * Two modes:
 *  - Store mode (default): the component dispatches to NgRx and reads from selectors.
 *  - External mode (`externalMode=true`): the parent supplies `items`, `loading`,
 *    `selectedWallets`, and handles `scrollToEnd`, `searchEvent`, `clearEvent`.
 */
@Component({
  standalone: true,
  imports: [
    CommonModule,
    NgSelectModule,
    FormsModule,
    MatTooltipModule,
    LucideAngularModule
  ],
  selector: 'app-wallet-multi-select-dropdown-v4',
  templateUrl: './wallet-multi-select-dropdown-v4.component.html',
  styleUrls: ['./wallet-multi-select-dropdown-v4.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class WalletMultiSelectDropdownV4Component implements OnInit {
  private store = inject(Store);
  private injector = inject(Injector);

  readonly CheckIcon = Check;
  readonly LoaderIcon = LoaderCircle;

  placeholder = input('All Wallets');
  appendTo = input('body');
  sliceNumber = input<number>(5);
  isSliceNeed = input<boolean>(true);

  // External mode inputs (presentational)
  externalMode = input<boolean>(false);
  items = input<IWalletData[]>([]);
  loading = input<boolean>(false);
  selectedWalletsInput = input<IWalletData[]>([], { alias: 'selectedWallets' });

  selectionEvent = output<IWalletData[]>();
  scrollToEnd = output<void>();
  searchEvent = output<string>();
  clearEvent = output<void>();

  isSelectedWallets = signal<IWalletData[]>([]);
  walletsToList$: Observable<IWalletData[]>;
  selectIsWalletsLoading$: Observable<boolean>;

  searchTerm = '';
  searchTimeout: ReturnType<typeof setTimeout>;

  private subjectKeyUp = new Subject<string>();

  constructor() {
    effect(
      () => {
        this.isSelectedWallets.set(this.selectedWalletsInput() ?? []);
      },
      { allowSignalWrites: true }
    );

    this.subjectKeyUp
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe((term) => this.searchEvent.emit(term));
  }

  ngOnInit(): void {
    if (this.externalMode()) {
      this.walletsToList$ = toObservable(this.items, { injector: this.injector });
      this.selectIsWalletsLoading$ = toObservable(this.loading, {
        injector: this.injector
      });
      return;
    }
    this.initStoreSelectors();
  }

  private initStoreSelectors(): void {
    this.store.dispatch(WalletsActions.loadWallets({ searchTerm: '' }));
    const wallets$ = this.store.select(selectWallets);
    const walletsFiltered$ = this.store.select(selectFilteredWallets);
    const selectIsWalletsFilterOn$ = this.store.select(selectIsWalletsFilterOn);
    this.selectIsWalletsLoading$ = this.store.select(selectIsWalletsLoading);
    this.walletsToList$ = selectIsWalletsFilterOn$.pipe(
      switchMap((isFilterOn) => (isFilterOn ? walletsFiltered$ : wallets$))
    );
  }

  onChange(event: IWalletData[]): void {
    const value = Array.isArray(event) ? event : [];
    this.isSelectedWallets.set(value);
    this.selectionEvent.emit(value);
  }

  onScrollToEnd(): void {
    if (this.externalMode()) {
      this.scrollToEnd.emit();
      return;
    }
    this.store.dispatch(WalletsActions.loadMoreWallets());
  }

  search(event: KeyboardEvent | FocusEvent): void {
    const term = (event?.target as HTMLInputElement)?.value ?? '';
    if (this.externalMode()) {
      this.subjectKeyUp.next(term);
      return;
    }
    clearTimeout(this.searchTimeout);
    this.searchTerm = term.replace(/&/g, '%26');
    this.searchTimeout = setTimeout(() => {
      this.store.dispatch(
        WalletsActions.loadWallets({ searchTerm: this.searchTerm })
      );
    }, 600);
  }

  clear(): void {
    this.searchTerm = '';
    this.isSelectedWallets.set([]);
    if (this.externalMode()) {
      this.clearEvent.emit();
      this.selectionEvent.emit([]);
      return;
    }
    this.store.dispatch(WalletsActions.loadWallets({ searchTerm: '' }));
    this.selectionEvent.emit([]);
  }

  clearItem(walletId: string): void {
    const next = this.isSelectedWallets().filter((w) => w.id !== walletId);
    this.isSelectedWallets.set(next);
    this.selectionEvent.emit(next);
  }

  compareById = (a: IWalletData, b: IWalletData): boolean => a?.id === b?.id;

  getMoreItemsTooltip(items: IWalletData[]): string {
    return (items ?? [])
      .map((i) => i.walletName ?? i.bankAccountNickName ?? i.id)
      .join(', ');
  }
}

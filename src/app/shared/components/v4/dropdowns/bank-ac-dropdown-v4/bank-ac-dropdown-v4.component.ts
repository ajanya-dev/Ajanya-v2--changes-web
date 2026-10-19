import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  effect,
  forwardRef,
  inject,
  input,
  output,
  signal,
  viewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import {
  IBankAccountsState,
  IBankCreateRes,
  IBankDropdown
} from 'src/app/models/bank';
import {
  Observable,
  Subscription,
  combineLatest,
  debounceTime,
  filter,
  map,
  take,
  timeout
} from 'rxjs';
import { bankAccountsActions } from 'src/app/modules/store/bankAccounts/bank-accounts.actions';
import {
  selectBankAccountsState,
  selectIsBankAccountsByIdLoading
} from 'src/app/modules/store/bankAccounts/bank-accounts.selectors';
import { NgSelectComponent, NgSelectModule } from '@ng-select/ng-select';
import {
  FormControl,
  FormsModule,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  ControlValueAccessor
} from '@angular/forms';
import { IV3DropDownOnReady } from 'src/app/models/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { BankModalService } from 'src/app/shared/bank-modal/service/bank-modal.service';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
// eslint-disable-next-line import/no-extraneous-dependencies
import { LucideAngularModule, Building2, Check, Plus, Star } from 'lucide-angular';

@Component({
  selector: 'app-bank-ac-dropdown-v4',
  standalone: true,
  imports: [
    CommonModule,
    NgSelectModule,
    FormsModule,
    ReactiveFormsModule,
    MatTooltipModule,
    LucideAngularModule
  ],
  templateUrl: './bank-ac-dropdown-v4.component.html',
  styleUrls: ['./bank-ac-dropdown-v4.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => BankAcDropdownV4Component),
      multi: true
    }
  ]
})
export class BankAcDropdownV4Component
  implements ControlValueAccessor, OnDestroy, OnInit
{
  private store = inject(Store);
  private changeDetectionRef = inject(ChangeDetectorRef);
  private headerService = inject(HeaderService);
  private bankModalService = inject(BankModalService);
  public paymentsService = inject(PaymentsService);

  // Lucide icons
  readonly BankIcon = Building2;
  readonly PlusIcon = Plus;
  readonly StarIcon = Star;
  readonly CheckIcon = Check;

  // Inputs
  id = input('id');
  config = input({ enableAddBtn: true, enableAchStatus: true });
  append = input('ng-select');
  placeholder = input('Select Bank Account');
  enableAddNew = input(true);
  customHeight = input<'0' | '1'>('0');
  labelIconNeeded = input(true);
  dropdownIconNeeded = input(true);
  isDropdownDisabled = input(false);
  isFromCloneCheck = input(false);
  dropdownType = input('');
  icon = input(Building2);
  disableSelectionId = input<string>('');
  shouldReload = input<boolean>(false);
  permissionContext = input<string | undefined>(undefined);
  zIndex = input<number>(998);
  isInvalid = input(false);
  showVerificationBadge = input(false);
  showVerificationBadgeOnLabel = input(false);
  excludeVerified = input(false);
  searchable = input(false);
  fontClass = input('font-funnel');
  /** render a per-row default star (opt-in; off elsewhere) */
  showDefaultStar = input(false);
  /**
   * Compact rows: nickname and the last four digits only ("•••• 4094"), no bank
   * name line. For pickers where the account is the only thing to choose, such
   * as the deposit slip form, so the list does not drown people in data.
   */
  compactRows = input(false);
  /** id of the account that is the saved default — filled/yellow star */
  defaultItemId = input<string | number | null>(null);
  /** the selected payment method id — non-ACH methods (checks) enable the star for any bank */
  selectedMethodId = input<string | null>(null);

  // Outputs
  changeEvent = output<IBankDropdown | null | undefined>();
  ready = output<IV3DropDownOnReady>();
  touch = output<void>();
  clearEvent = output<boolean | undefined>();
  dropdownOpen = output<void>();
  dropdownClose = output<void>();
  bankAccountCreated = output<IBankDropdown>();
  /** a star was clicked — the caller sets this account as the default */
  starClick = output<IBankDropdown>();

  // ViewChild
  ngSelectComponent = viewChild(NgSelectComponent);

  // Internal writable signal for placeholder (mutated in loadItemsById)
  placeholderText = signal('Select Bank Account');
  hasValue = signal(false);

  bankAccountsToList$: Observable<IBankDropdown[]>;
  selectedBankAccount: FormControl<IBankDropdown | null | undefined> =
    new FormControl();

  searchTerm: string;
  searchTimeout: ReturnType<typeof setTimeout>;
  changesSubscription: Subscription;
  bankAccountsState$: Observable<IBankAccountsState>;
  onReadyResponse: IV3DropDownOnReady = {};
  selectIsBankAccountsByIdLoading$: Observable<boolean>;
  isLoadingWithId: boolean = false;
  subscriptions: Subscription[] = [];
  addNew = false;

  constructor() {
    effect(
      () => {
        this.placeholderText.set(this.placeholder());
      },
      { allowSignalWrites: true }
    );
    effect(
      () => {
        const isReload = this.shouldReload();
        if (!isReload) return;
        if (isReload) {
          this.reloadBankAccounts();
        }
      },
      { allowSignalWrites: true }
    );
  }

  ngOnInit(): void {
    this.initStoreSelectors();
    this.onReady();

    this.subscriptions.push(
      this.selectedBankAccount.valueChanges.subscribe((value) => {
        this.hasValue.set(!!value);
        this.changeEvent.emit(value);
      })
    );
  }

  private reloadBankAccounts(): void {
    this.store.dispatch(
      bankAccountsActions.loadBankAccounts({
        searchTerm: '',
        context: undefined,
        isReload: true
      })
    );
  }

  setDisabledState(isDisabled: boolean): void {
    if (isDisabled) {
      this.selectedBankAccount.disable();
    } else {
      this.selectedBankAccount.enable();
    }
  }

  /**
   * Initializes store selectors and dispatches an action to load bank accounts.
   */
  initStoreSelectors() {
    const context = this.getPermissionContext();
    this.store.dispatch(
      bankAccountsActions.loadBankAccounts({
        searchTerm: '',
        context
      })
    );
    this.bankAccountsState$ = this.store.select(selectBankAccountsState);
    this.bankAccountsToList$ = this.bankAccountsState$.pipe(
      map((bankAccountsState) => {
        // Function to remove duplicates
        const removeDuplicates = (accounts: IBankDropdown[]) => {
          const uniqueIds = new Set();
          return accounts.filter((account) => {
            const isDuplicate = uniqueIds.has(account.id);
            uniqueIds.add(account.id);
            return !isDuplicate;
          });
        };

        // Apply the removeDuplicates function to both arrays
        const uniqueBankAccounts = removeDuplicates(
          bankAccountsState.bankAccounts
        );
        const uniqueFilteredAccounts = removeDuplicates(
          bankAccountsState.bankAccountsFiltered
        );

        // Update the state with deduplicated arrays
        const updatedState = {
          ...bankAccountsState,
          bankAccounts: uniqueBankAccounts,
          bankAccountsFiltered: uniqueFilteredAccounts
        };
        // Return the appropriate array based on the filter state
        let result = updatedState.isFilterOn
          ? updatedState.bankAccountsFiltered
          : updatedState.bankAccounts;

        // Exclude verified and ACH verified banks if enabled
        if (this.excludeVerified()) {
          result = result.filter(
            (account) =>
              +(account.verifiedBy ?? 0) !== 1 && +(account.verified ?? 0) !== 1
          );
        }

        return result;
      })
    );
    this.selectIsBankAccountsByIdLoading$ = this.store.select(
      selectIsBankAccountsByIdLoading
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
   * Sets an item with a specific ID in the selected bank account.
   * @param id - The ID of the bank account to set.
   */
  setItemWithId = (id: string) => {
    this.isLoadingWithId = true;
    let loadingSubscription: Subscription;
    // Wait for the store to finish loading (a preset value often arrives while the
    // list is still in flight, e.g. opening a cloned deposit slip straight from the
    // list); if it never settles, fall back to loading the one account by id.
    // eslint-disable-next-line prefer-const
    loadingSubscription = this.bankAccountsState$
      .pipe(
        debounceTime(10),
        filter((bankAccountsState) => !bankAccountsState.isLoading),
        take(1),
        timeout(10000)
      )
      .subscribe({
        next: (bankAccountsState) => {
          const item = bankAccountsState.bankAccounts.find(
            (ele) => String(ele.id) === String(id)
          );
          if (item) {
            this.selectedBankAccount.setValue(item);
            this.isLoadingWithId = false;
          } else {
            this.loadItemsById(id);
          }
          loadingSubscription?.unsubscribe();
        },
        error: () => {
          this.loadItemsById(id);
        }
      });
  };

  /** "•••• 4094" from an account number held as "xxxx4094", "****4094" or a number. */
  maskedNumber(item: IBankDropdown): string {
    const digits = String(item?.accountNumber ?? '').replace(/\D/g, '');
    return digits ? `•••• ${digits.slice(-4)}` : '';
  }

  /**
   * Loads bank account items by their IDs.
   * @param id - The ID of the bank account to load.
   */
  loadItemsById(id: string) {
    const context = this.getPermissionContext();
    this.store.dispatch(
      bankAccountsActions.loadBankAccountsByIds({ ids: [id], context })
    );
    let loadingSubscription: Subscription;
    let attemptCount = 0;
    const maxAttempts = 20; // Maximum attempts to find the item

    this.placeholderText.set('Loading...');
    this.isLoadingWithId = true;
    this.changeDetectionRef.detectChanges();

    // eslint-disable-next-line prefer-const
    loadingSubscription = combineLatest([
      this.bankAccountsToList$,
      this.selectIsBankAccountsByIdLoading$
    ])
      .pipe(
        debounceTime(100), // Increased debounce time for better stability
        timeout(10000) // 10 second timeout
      )
      .subscribe({
        next: ([bankAccounts, isLoading]) => {
          attemptCount += 1;
          this.isLoadingWithId = isLoading;

          // Check if item exists in the list
          const item = bankAccounts.find((ele) => ele.id === id);

          if (item) {
            // Item found, set it and clean up
            this.isLoadingWithId = false;
            this.selectedBankAccount.setValue(item);
            this.placeholderText.set('Select Bank Account');
            this.changeDetectionRef.detectChanges();
            loadingSubscription.unsubscribe();
          } else if (!isLoading && attemptCount >= maxAttempts) {
            // Loading completed but item not found after max attempts
            this.isLoadingWithId = false;
            this.placeholderText.set('Select Bank Account');
            this.changeDetectionRef.detectChanges();
            loadingSubscription.unsubscribe();
          }
        },
        error: () => {
          // Handle timeout or other errors
          this.isLoadingWithId = false;
          this.placeholderText.set('Select Bank Account');
          this.changeDetectionRef.detectChanges();
        }
      });
  }

  onTouched = (_?: Event) => {};

  /**
   * Writes a value to the form control.
   *
   * @param value - The value to write.
   */
  writeValue(value: IBankDropdown): void {
    if (value?.id) {
      this.setItemWithId(value.id);
    } else {
      this.selectedBankAccount.setValue(undefined);
    }
  }

  /**
   * Registers a callback function to be invoked when the form control value changes.
   *
   * @param fn - The callback function.
   */
  registerOnChange(
    fn: (event?: IBankDropdown | null | undefined) => void
  ): void {
    this.changesSubscription =
      this.selectedBankAccount.valueChanges.subscribe(fn);
  }

  /**
   * Registers a callback function to be invoked when the form control is touched.
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
    this.store.dispatch(bankAccountsActions.loadMoreBankAccounts());
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
    if (event?.type === 'focus') return;
    this.searchTimeout = setTimeout(() => {
      const context = this.getPermissionContext();
      this.store.dispatch(
        bankAccountsActions.loadBankAccounts({
          searchTerm: this.searchTerm,
          context
        })
      );
    }, 600);
  }

  /**
   * @description CLears the changes made.
   */
  clear() {
    // A keyup from the same interaction may still have a debounced search
    // pending — let it fire and it would re-dispatch after this reset.
    clearTimeout(this.searchTimeout);
    this.searchTerm = '';
    const context = this.getPermissionContext();
    this.store.dispatch(
      bankAccountsActions.loadBankAccounts({
        searchTerm: this.searchTerm,
        context
      })
    );
    if (this.addNew) {
      this.clearEvent.emit(this.addNew);
      this.addNew = false;
    } else {
      this.clearEvent.emit(undefined);
    }
  }

  /**
   * Clears the selection in the ng-select component.
   */
  clearSelection() {
    this.ngSelectComponent()?.handleClearClick();
  }

  close(): void {
    this.ngSelectComponent()?.close();
  }

  /**
   * ng-select drops its own search text when the panel closes, so the store's
   * search term has to go with it. Otherwise the next open renders the previous
   * search's matches — with an empty search box — and nothing refreshes them.
   */
  onDropdownClose(): void {
    this.dropdownClose.emit();
    if (!this.searchTerm) return;
    clearTimeout(this.searchTimeout);
    this.searchTerm = '';
    this.store.dispatch(
      bankAccountsActions.loadBankAccounts({
        searchTerm: '',
        context: this.getPermissionContext()
      })
    );
  }

  /**
   * @description Opens modal dialog for adding new bank account. Emits `newBankAccountAdded` event, on success.
   */
  addNewBankAccount() {
    this.ngSelectComponent()?.close();
    if (this.bankModalService.isBankPermissionChecking()) return;
    this.subscriptions.push(
      this.bankModalService.openAddBankV4Modal().subscribe((bankModal) => {
        if (!bankModal) return;
        // eslint-disable-next-line no-param-reassign
        bankModal.componentInstance.skipVerification = true;
        if (bankModal) {
          this.subscriptions.push(
            bankModal.afterClosed().subscribe((res) => {
              if (res?.success) {
                const bankAccount = {
                  accountNumber: `xxxx${(
                    res?.bankAcData as IBankCreateRes
                  )?.bankAccountNumber.slice(-4)}`,
                  achApplicationStatus: null,
                  bankName: res?.bankAcData?.bankName,
                  cashAccount: 0,
                  id: res?.bankAcData?.id,
                  isItZil: 0,
                  mAch: 0,
                  name: (res?.bankAcData as IBankCreateRes)?.bankAccountName,
                  nickName: (res?.bankAcData as IBankCreateRes)
                    ?.bankAccountNickName,
                  routingNumber: res.bankAcData?.routingNumber,
                  status: '',
                  statusDescription: '',
                  verifiedBy: null,
                  verified: 0
                } as unknown as IBankDropdown;
                this.store.dispatch(
                  bankAccountsActions.addCreatedBankAccountIntoBankAccounts({
                    bankAccount
                  })
                );
                this.bankAccountCreated.emit(bankAccount);
                this.writeValue(bankAccount);
                this.headerService.refreshDynamicHeader.next(true);
              }
            })
          );
        }
      })
    );
  }

  /**
   * Onchange event for ng-select.
   */
  onChange(value: IBankDropdown | null | undefined | 'add-new') {
    if (value === 'add-new') {
      this.addNewBankAccount();
      this.addNew = true;
      this.clearSelection();
    } else {
      this.selectedBankAccount.setValue(value);
    }
  }

  /** ACH-capable: a Zil bank, or an ACH-approved and verified bank. */
  isBankAchVerified(item: IBankDropdown): boolean {
    return (
      (!!item.isItZil || item.achApplicationStatus === 1) &&
      (Number(item.verifiedBy) === 1 || Number(item.verified) === 1)
    );
  }

  /**
   * The default star is enabled when the method allows this bank: ACH / Wire need an
   * ACH-verified bank; every other method (e.g. checks) allows any bank account.
   */
  isStarEnabled(item: IBankDropdown): boolean {
    const method = this.selectedMethodId();    
    const needsAch = method === 'ach' || method === 'wire' ||method === 'let-payee-choose' ;
    return !needsAch || this.isBankAchVerified(item);
  }

  /**
   * Gets the permission context based on the input signal
   */
  private getPermissionContext(): IBankAccountsState['context'] | undefined {
    const permission = this.permissionContext();
    if (!permission) {
      return undefined;
    }

    // Map the permission string to the appropriate context
    switch (permission) {
      case 'forPaymentLink':
        return { forPaymentLink: true };
      case 'forInvoice':
        return { forInvoice: true };
      case 'forCreditMemo':
        return { forCreditMemo: true };
      case 'forBill':
        return { forBill: true };
      case 'forCheckDraft':
        return { forCheckDraft: true };
      case 'forCashExpense':
        return { forCashExpense: true };
      case 'fromDepositSlip':
        return { fromDepositSlip: true };
      case 'forPayment':
        return { forPayment: true };
      default:
        return undefined;
    }
  }

  ngOnDestroy(): void {
    clearTimeout(this.searchTimeout);
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
    this.changesSubscription?.unsubscribe();
  }
}

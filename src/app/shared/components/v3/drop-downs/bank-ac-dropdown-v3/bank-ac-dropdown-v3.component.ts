import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
  effect,
  forwardRef,
  inject,
  input
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { MatDialog } from '@angular/material/dialog';
import { IBankAccountsState, IBankCreateRes, IBankDropdown } from 'src/app/models/bank';
import {
  Observable,
  Subscription,
  combineLatest,
  debounceTime,
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
import { CloneDesignComponent } from 'src/app/modules/bank/bank-v2/modals/clone-design/clone-design.component';
import { faBuildingColumns } from '@fortawesome/pro-solid-svg-icons';
import { BankModalService } from 'src/app/shared/bank-modal/service/bank-modal.service';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';

@Component({
  selector: 'app-bank-ac-dropdown-v3',
  standalone: true,
  imports: [
    CommonModule,
    NgSelectModule,
    FormsModule,
    ReactiveFormsModule,
    FontAwesomeModule,
    MatTooltipModule
  ],
  templateUrl: './bank-ac-dropdown-v3.component.html',
  styleUrls: ['./bank-ac-dropdown-v3.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => BankAcDropdownV3Component),
      multi: true
    }
  ]
})
export class BankAcDropdownV3Component
  implements ControlValueAccessor, OnDestroy, OnInit
{
  private store = inject(Store);
  private dialog = inject(MatDialog);
  private changeDetectionRef = inject(ChangeDetectorRef);
  private headerService = inject(HeaderService);
  private bankModalService = inject(BankModalService);
  public paymentsService = inject(PaymentsService);

  @Input() id = 'id'; // Its better to pass a unique id always for avoiding conflict.
  @Input() config = {
    enableAddBtn: true,
    enableAchStatus: true
  };

  @Input() append = 'ng-select';
  @Input() placeholder = 'Select Bank Account';
  @Input() enableAddNew = true;
  @Input() customHeight: '0' | '1' | '2' | '3' | '4' = '2';
  @Input() labelIconNeeded = true;
  @Input() dropdownIconNeeded = true;
  @Input() isDropdownDisabled = false;
  @Input() isFromCloneCheck = false;
  @Input() dropdownType = '';
  @Input() icon = faBuildingColumns;

  @Output() changeEvent = new EventEmitter<IBankDropdown | null | undefined>();
  @Output() ready = new EventEmitter<IV3DropDownOnReady>();
  @Output() touch = new EventEmitter();
  @Output() clearEvent = new EventEmitter<boolean | undefined>();
  disableSelectionId = input<string>('');
  shouldReload  = input<boolean>(false);
  permissionContext = input<string | undefined>(undefined);
  zIndex = input<number>(998);

  /**
   * Access to the ng-select component.
   *
   * @type {NgSelectComponent}
   * @memberof V35CommonDropDownSelectorComponent
   */
  @ViewChild(NgSelectComponent) ngSelectComponent: NgSelectComponent;

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
    effect(() => {
      const isReload = this.shouldReload();      
      if (!isReload) return;
      if (isReload) {
        this.reloadBankAccounts();
      }
    },{allowSignalWrites: true});
  }

  ngOnInit(): void {
    this.initStoreSelectors();
    this.onReady();

    this.subscriptions.push(
      this.selectedBankAccount.valueChanges.subscribe((value) => {
        this.changeEvent.emit(value);
      })
    );
  }

  private reloadBankAccounts(): void {    
    this.store.dispatch(bankAccountsActions.loadBankAccounts({ 
      searchTerm: '', 
      context: undefined,
      isReload:true
    }));
  }

  setDisabledState(isDisabled: boolean): void {
    if(isDisabled) {
      this.selectedBankAccount.disable();
    } else{
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
        return updatedState.isFilterOn
          ? updatedState.bankAccountsFiltered
          : updatedState.bankAccounts;
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
    // eslint-disable-next-line prefer-const
    loadingSubscription = this.bankAccountsState$
      .pipe(
        debounceTime(10), // Optional debounce time if needed
        take(2) // Take the first combined value
      )
      .subscribe((bankAccountsState) => {
        this.isLoadingWithId = bankAccountsState.isLoading;
        if (!bankAccountsState.isLoading) {
          const item = bankAccountsState.bankAccounts.find(
            (ele) => ele.id === id
          );
          if (item) {
            this.selectedBankAccount.setValue(item);
            this.isLoadingWithId = false;
          } else {
            this.loadItemsById(id);
          }
          loadingSubscription.unsubscribe();
        }
      });
  };

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
    
    this.placeholder = 'Loading...';
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
            this.placeholder = 'Select Bank Account';
            this.changeDetectionRef.detectChanges();
            loadingSubscription.unsubscribe();
          } else if (!isLoading && attemptCount >= maxAttempts) {
            // Loading completed but item not found after max attempts
            this.isLoadingWithId = false;
            this.placeholder = 'Select Bank Account';
            this.changeDetectionRef.detectChanges();
            loadingSubscription.unsubscribe();
          }
        },
        error: () => {
          // Handle timeout or other errors
          this.isLoadingWithId = false;
          this.placeholder = 'Select Bank Account';
          this.changeDetectionRef.detectChanges();
        }
      });
  }

  onTouched = (_?:  Event) => {};

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
    if(event?.type === 'focus') return;
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
      this.clearEvent.emit();
    }
  }

  /**
   * Clears the selection in the ng-select component.
   */
  clearSelection() {
    this.ngSelectComponent.handleClearClick();
  }

  /**
   * @description Opens modal dialog for adding new bank account. Emits `newBankAccountAdded` event, on success.
   */
  addNewBankAccount() {
    if (this.isFromCloneCheck) {
      const dialogRef = this.dialog.open(CloneDesignComponent, {
        maxWidth: '510px',
        width: '100%',
        disableClose: true,
        autoFocus: false
      });

      dialogRef.afterClosed().subscribe((res) => {
        if (res?.success) {
          const bankAccount = {
            accountNumber: `xxxx${res.bankAcData.bankAccountNumber.slice(-4)}`,
            achApplicationStatus: null,
            bankName: res.bankAcData.bankName,
            cashAccount: 0,
            id: res.bankAcData.id,
            isItZil: 0,
            mAch: 0,
            name: res.bankAcData.bankAccountName,
            nickName: res.bankAcData.bankAccountNickName,
            routingNumber: res.bankAcData.routingNumber,
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
          this.writeValue(bankAccount);
          this.headerService.refreshDynamicHeader.next(true);
        }
      });
      return;
    }

    if(this.bankModalService.isBankPermissionChecking()) return;
    this.subscriptions.push(
      this.bankModalService.openAddBankOptimizedModal().subscribe((bankModal) => {
        if (bankModal) {
          this.subscriptions.push(
            bankModal.afterClosed().subscribe((res) => {
              if (res?.success) {
                const bankAccount = {
                  accountNumber: `xxxx${(res?.bankAcData as IBankCreateRes)?.bankAccountNumber.slice(
                    -4
                  )}`,
                  achApplicationStatus: null,
                  bankName: res?.bankAcData?.bankName,
                  cashAccount: 0,
                  id: res?.bankAcData?.id,
                  isItZil: 0,
                  mAch: 0,
                  name: (res?.bankAcData as IBankCreateRes)?.bankAccountName,
                  nickName: (res?.bankAcData as IBankCreateRes)?.bankAccountNickName,
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

  onDropdownClose(): void {
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

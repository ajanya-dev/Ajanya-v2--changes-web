import { PayeeModalService } from 'src/app/shared/service/payee-modal/payee-modal.service';
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
  forwardRef,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgSelectComponent, NgSelectModule } from '@ng-select/ng-select';
import {
  ControlValueAccessor,
  FormControl,
  FormsModule,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule
} from '@angular/forms';
import { Store } from '@ngrx/store';
import { payeesActions } from 'src/app/modules/store/payees/payees.actions';
import {
  Observable,
  Subscription,
  combineLatest,
  debounceTime,
  map,
  take
} from 'rxjs';
import {
  selectFilteredPayees,
  selectIsPayeesByIdLoading,
  selectIsPayeesFilterOn,
  selectIsPayeesLoading,
  selectPayees
} from 'src/app/modules/store/payees/payees.selectors';
import { IV3DropDownOnReady } from 'src/app/models/common';
import { IPayeeDropdown } from 'src/app/modules/payee/payee-v2/model/payee';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { environment } from 'src/environments/environment';
import { PayeeDataV35Service } from 'src/app/modules/payee/payee-v3/v35-services/payee-data-v35.service';
import { TruncatePipe } from 'src/app/pipes/truncate.pipe';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';

@Component({
  selector: 'app-payee-dropdown-v3',
  standalone: true,
  imports: [
    CommonModule,
    NgSelectModule,
    FormsModule,
    FontAwesomeModule,
    ReactiveFormsModule,
    TruncatePipe
  ],
  templateUrl: './payee-dropdown-v3.component.html',
  styleUrls: ['./payee-dropdown-v3.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PayeeDropdownV3Component),
      multi: true
    }
  ]
})
export class PayeeDropdownV3Component
  implements OnInit, ControlValueAccessor, OnDestroy
{
  private store = inject(Store);
  private changeDetectionRef = inject(ChangeDetectorRef);
  private payeeService = inject(PayeeService);
  private payeeDataService = inject(PayeeDataV35Service);
  private alertService = inject(AlertService);
  private payeeModalService = inject(PayeeModalService);
  public paymentsService = inject(PaymentsService);

  whiteLabelName = environment.env_id === 'compass' ? 'Vendor' : 'Payee';

  @Input() id = 'id'; // Its better to pass a unique id always for avoiding conflict.
  @Input() enableAddNew = true;
  @Input() placeholder = `Select Your ${this.whiteLabelName}`;
  @Input() customHeight: '0' | '1' | '2' | '3' | '4' = '2';
  @Input() labelIconNeeded = true;
  @Input() clearable = true;
  @Input() searchable = true;
  @Input() dropdownIconNeeded = true;
  @Input() appendTo = 'ng-select';
  @Input() blockFrozenPayee = false;
  @Output() ready = new EventEmitter<IV3DropDownOnReady>();
  @Output() clearEvent = new EventEmitter();
  @Output() changeEvent = new EventEmitter<IPayeeDropdown | null | undefined>();

  /**
   * Access to the ng-select component.
   *
   * @type {NgSelectComponent}
   * @memberof V35CommonDropDownSelectorComponent
   */
  @ViewChild(NgSelectComponent) ngSelectComponent: NgSelectComponent;

  subscriptions: Subscription[] = [];
  payees$: Observable<IPayeeDropdown[]>;
  filteredPayee$: Observable<IPayeeDropdown[]>;
  payeesFiltered$: Observable<IPayeeDropdown[]>;
  selectIsPayeesFilterOn$: Observable<boolean>;
  selectIsPayeesLoading$: Observable<boolean>;

  selectedPayee = new FormControl<IPayeeDropdown | null | undefined>(undefined);
  searchTerm: string;
  searchTimeout: ReturnType<typeof setTimeout>;
  onReadyResponse: IV3DropDownOnReady = {};
  selectIsPayeesByIdLoading$: Observable<boolean>;
  isLoadingWithId: boolean = false;

  payeeType = [
    { value: '0', name: '' },
    { value: '1', name: 'Customer' },
    { value: '2', name: 'Vendor' },
    { value: '3', name: 'Employee' }
  ];

  activePayee: IPayeeDropdown;

  ngOnInit(): void {
    this.initStoreSelectors();
    this.onReady();
    if (
      this.payeeService.paymentSuccess.getValue() ||
      this.payeeService.fromCloudSendBtn.getValue()
    ) {
      this.clear();
    }

    this.subscriptions.push(
      this.selectedPayee.valueChanges.subscribe((value) => {
        this.changeEvent.emit(value);
      })
    );
  }

  /**
   * Initializes store selectors and dispatches an action to load payees.
   */
  initStoreSelectors() {
    this.store.dispatch(
      payeesActions.loadPayees({ searchTerm: '', skipEmpty: true })
    );
    this.payees$ = this.store.select(selectPayees);
    this.applyFilter();
    this.payeesFiltered$ = this.store.select(selectFilteredPayees);
    this.selectIsPayeesFilterOn$ = this.store.select(selectIsPayeesFilterOn);
    this.selectIsPayeesLoading$ = this.store.select(selectIsPayeesLoading);
    this.selectIsPayeesByIdLoading$ = this.store.select(
      selectIsPayeesByIdLoading
    );
  }

  applyFilter() {
    this.filteredPayee$ = this.payees$.pipe(
      map((payees) =>
        payees.filter((payee) => payee.name && payee.name.trim() !== '')
      )
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
   * Sets an item with a specific ID in the selected payee.
   * @param id - The ID of the payee to set.
   */
  setItemWithId = (id: string) => {
    if (!id || id === null) return;
    this.isLoadingWithId = true;
    
    // Use combineLatest to wait for both payees and filtered list to be ready
    // This ensures the item is available in the filtered options before setting
    const loadingSubscription = combineLatest([
      this.payees$,
      this.filteredPayee$
    ])
      .pipe(
        debounceTime(100), // Wait for store updates
        take(1) // Take only the current state
      )
      .subscribe(([payees, filteredPayees]) => {
        const item = payees.find((ele) => ele.id === id);
        
        if (item) {
          // Item found in store
          if (item?.name === 'Payee Name') {
            this.alertService.infoAlert({
              content: 'Please select a valid payee'
            });
            this.clearSelection();
            this.isLoadingWithId = false;
            loadingSubscription.unsubscribe();
            return;
          }

          if (this.blockFrozenPayee && item?.isFreezed) {
            this.alertService.infoAlert({
              content: 'This payee is temporarily restricted from processing payments'
            });
            this.clearSelection();
            this.isLoadingWithId = false;
            loadingSubscription.unsubscribe();
            return;
          }

          // Use setTimeout to ensure ng-select has processed the options
          // Small delay if item not in filtered list yet to allow filter to update
          setTimeout(() => {
            // Set value with emitEvent: true to properly trigger valueChanges
            this.selectedPayee.setValue(item, { emitEvent: true });
            this.payeeDataService.payeeDataSignal.set(item);
            this.activePayee = item;
            this.isLoadingWithId = false;
            
            // Manually trigger change detection
            this.changeDetectionRef.detectChanges();
            
            loadingSubscription.unsubscribe();
          }, 0); // Small delay if item not in filtered list yet
        } else {
          // Item not in store, load it
          loadingSubscription.unsubscribe();
          this.loadItemsById(id);
        }
      });
  };

  /**
   * Loads items by ID and updates the selected payee.
   * @param id - The ID of the payee to load.
   */

  loadItemsById(id: string) {
    if (!id || id === null) return;
    this.store.dispatch(payeesActions.loadPayeesByIds({ ids: [id] }));
    let loadingSubscription: Subscription;
    this.placeholder = 'Loading...';
    this.isLoadingWithId = true;
    this.changeDetectionRef.detectChanges();
    // eslint-disable-next-line prefer-const
    loadingSubscription = combineLatest([
      this.payees$,
      this.selectIsPayeesByIdLoading$
    ])
      .pipe(
        debounceTime(100), // Increased debounce time for better stability
        take(2)
      )
      .subscribe(([payees, isLoading]) => {
        this.isLoadingWithId = isLoading;
        // Only proceed when loading is complete
        if (!isLoading) {
          const item = payees.find((ele) => ele.id === id);
          
          if (item) {
            if (item?.name === 'Payee Name') {
              this.alertService.infoAlert({
                content: 'Please select a valid payee'
              });
              this.clearSelection();
              this.isLoadingWithId = false;
              this.placeholder = `Select Your ${this.whiteLabelName}`;
              this.changeDetectionRef.detectChanges();
              loadingSubscription.unsubscribe();
              return;
            }
            if (this.blockFrozenPayee && item?.isFreezed) {
              this.alertService.infoAlert({
                content: 'This payee is temporarily restricted from processing payments'
              });
              this.clearSelection();
              this.isLoadingWithId = false;
              this.placeholder = `Select Your ${this.whiteLabelName}`;
              this.changeDetectionRef.detectChanges();
              loadingSubscription.unsubscribe();
              return;
            }
            this.selectedPayee.setValue(item);
            this.payeeDataService.payeeDataSignal.set(item);
            this.activePayee = item;
            this.isLoadingWithId = false;
            this.placeholder = `Select Your ${this.whiteLabelName}`;
            this.changeDetectionRef.detectChanges();
            loadingSubscription.unsubscribe();
          } else if (!this.isLoadingWithId) {
            // If still not found and not loading, reset placeholder
            this.placeholder = `Select Your ${this.whiteLabelName}`;
            this.changeDetectionRef.detectChanges();
            loadingSubscription.unsubscribe();
          }
        }
      });
  }

  onTouched = (_?: Event) => {
    //
  };

  /**
   * Writes a value to the form control.
   * @param value - The value to write.
   */
  writeValue(value: IPayeeDropdown): void {
    // Subscribe to getPayeeEditedData - this subscription is managed in subscriptions array
    // Only update if the emitted value is valid (not null/undefined)
    this.subscriptions.push(
      this.payeeService.getPayeeEditedData().subscribe((res) => {
        // Only update if res is a valid object and not null/undefined
        // This prevents the subscription from clearing values set by setItemWithId
        if (res && typeof res === 'object' && res.id) {
          this.selectedPayee.setValue(res, { emitEvent: true });
          this.payeeDataService.payeeDataSignal.set(res);
          this.activePayee = res;
          this.changeDetectionRef.detectChanges();
        }
      })
    );
    
    // Set the initial value if provided
    if (value && typeof value === 'object' && value.id) {
      this.selectedPayee.setValue(value, { emitEvent: false });
      this.payeeDataService.payeeDataSignal.set(value);
      this.changeDetectionRef.detectChanges();
    }
  }

  /**
   * Registers a callback function to be invoked when the form control value changes.
   * @param fn - The callback function.
   */
  registerOnChange(
    fn: (event?: IPayeeDropdown | null | undefined) => void
  ): void {
    this.selectedPayee.valueChanges.subscribe(fn);
  }

  /**
   * Registers a callback function to be invoked when the form control is touched.
   * @param fn - The callback function.
   */
  registerOnTouched(fn: (event?: Event | undefined) => void): void {
    this.onTouched = fn;
  }

  /**
   * @description Gets next 10 element on each scroll event
   */
  onScrollToEnd() {
    this.store.dispatch(payeesActions.loadMorePayees({ skipEmpty: true }));
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
        payeesActions.loadPayees({
          searchTerm: this.searchTerm,
          skipEmpty: true
        })
      );
    }, 600);
  }

  /**
   * @description CLears the changes made.
   */
  clear() {
    this.searchTerm = '';
    this.store.dispatch(
      payeesActions.loadPayees({ searchTerm: this.searchTerm, skipEmpty: true })
    );
    this.payeeDataService.payeeDataSignal.set(undefined);
    this.clearEvent.emit();
  }

  /**
   * Clears the selection in the ng-select component.
   */
  clearSelection() {
    this.ngSelectComponent.handleClearClick();
    this.payeeDataService.payeeDataSignal.set(undefined);
  }

  /**
   * @description Opens the add payee modal and processes the result.
   */
  addNewPayee() {
    this.subscriptions.push(
      this.payeeModalService
        .openAddPayee('addPayeeModal')
        .subscribe((payeeModal) => {
          if (payeeModal) {
            this.subscriptions.push(
              payeeModal.afterClosed().subscribe((res) => {
                if (res?.success) {
                  const payee = {
                    id: res.id,
                    name: res.name,
                    nickName: res.nickName ?? '',
                    phone: res.phone ?? '',
                    addressLine1: res.addressLine1 ?? '',
                    addressLine2: res.addressLine2 ?? '',
                    city: res.city ?? '',
                    company: res.company ?? '',
                    country: res.country ?? '',
                    email: res.email ?? '',
                    entityType: res.entityType ?? '',
                    encryptedId: res.id,
                    state: res.state ?? '',
                    zip: res.zip ?? '',
                    payeeIdNumber: res.payeeIdNumber ?? '',
                    payeeTypeId: res.payeeTypeId,
                    merchantCategory: res.merchantCategory,
                    createdAt: '',
                    typeDetails: {
                      id: '',
                      createdAt: '',
                      customerAccountNumber: '',
                      customerBankAccountId: '',
                      customerCompanyName: '',
                      customerDefaultPayMethod: '',
                      customerFirstName: '',
                      customerLastName: '',
                      customerMiddleName: '',
                      customerNote: '',
                      customerType: '',
                      deletedAt: '',
                      employeeAccountNumber: '',
                      employeeBankAccountId: '',
                      employeeDefaultPayMethod: '',
                      employeeDob: '',
                      employeeFillingStatus: '',
                      employeeFirstName: '',
                      employeeHourlyRate: '',
                      employeeLastName: '',
                      employeeMiddleName: '',
                      employeeNote: '',
                      employeeOvertimeRate: '',
                      employeePaymentSchedule: '',
                      employeeSsn: '',
                      employeeType: '',
                      employeeYtdEarning: '',
                      employeeYtdTax: '',
                      payee: {
                        payeeId: res.id,
                        payeeAccountNumber: '',
                        payeeMobilePhone: res.phone ?? ''
                      },
                      updatedAt: '',
                      vendor1099: '',
                      vendorAccountNumber: '',
                      vendorBankAccountId: '',
                      vendorCompanyName: '',
                      vendorDefaultPayMethod: '',
                      vendorFirstName: '',
                      vendorLastName: '',
                      vendorMiddleName: '',
                      vendorNote: '',
                      vendorPaymentTerms: '',
                      vendorTaxId: '',
                      vendorType: ''
                    }
                  };
                  this.store.dispatch(
                    payeesActions.addCreatedPayeeIntoPayees({ payee })
                  );
                  // Set value with emitEvent: true to notify parent form control
                  this.selectedPayee.setValue(payee, { emitEvent: true });
                  this.payeeDataService.payeeDataSignal.set(payee);
                  this.activePayee = payee;
                  this.changeDetectionRef.detectChanges();
                }
              })
            );
          }
        })
    );
  }

  /**
   * @description Emits `selectionEvent` when selection is made. Opens add new payee dialog if 'add-new' is selected.
   * @param event - selection event in template.
   */
  getChange(event: null | undefined | 'add-new' | IPayeeDropdown) {
    this.payeeService.paymentSuccess.next(false);
    if (event === 'add-new') {
      this.addNewPayee();
      this.clearSelection();
      return;
    }

    if (event?.name === 'Payee Name') {
      this.alertService.infoAlert({ content: 'Please select a valid payee' });
      this.clearSelection();
      return;
    }

    if (this.blockFrozenPayee && event && typeof event === 'object' && (event as IPayeeDropdown).isFreezed) {
      this.alertService.infoAlert({
        content: 'This payee is temporarily restricted from processing payments'
      });
      this.clearSelection();
      return;
    }

    // Only update if event is not null and is a valid payee object
    if (event !== null && event !== undefined && typeof event === 'object' && event.id) {
      this.payeeDataService.payeeDataSignal.set(event);
      // Use emitEvent: true here since this is a user-initiated change
      this.selectedPayee.setValue(event, { emitEvent: true });
    } else if (event === null) {
      // Explicitly handle null case
      this.selectedPayee.setValue(null, { emitEvent: true });
      this.payeeDataService.payeeDataSignal.set(undefined);
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
    this.payeeDataService.payeeDataSignal.set(undefined);
  }
}

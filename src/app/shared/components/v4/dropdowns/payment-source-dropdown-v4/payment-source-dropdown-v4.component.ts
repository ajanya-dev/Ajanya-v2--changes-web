import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  forwardRef,
  input,
  output
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IBankDropdown } from 'src/app/models/bank';
import { NgSelectModule } from '@ng-select/ng-select';
import {
  ControlValueAccessor,
  FormControl,
  FormsModule,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule
} from '@angular/forms';
import { IWalletData } from 'src/app/models/wallet';
import { Observable, Subscription, merge } from 'rxjs';
import { IDropdownMetaData, IV3DropDownOnReady } from 'src/app/models/common';
import { IExistingCreditCards } from 'src/app/models/payment-switch-board';
import { TPaymentSource } from 'src/app/modules/payments/model/payments';
import { BankAcDropdownV4Component } from '../bank-ac-dropdown-v4/bank-ac-dropdown-v4.component';
import { WalletDropdownV4Component } from '../wallet-dropdown-v4/wallet-dropdown-v4.component';
import { CardsDropdownV4Component } from '../cards-dropdown-v4/cards-dropdown-v4.component';

@Component({
  selector: 'app-payment-source-dropdown-v4',
  standalone: true,
  imports: [
    CommonModule,
    NgSelectModule,
    FormsModule,
    ReactiveFormsModule,
    BankAcDropdownV4Component,
    WalletDropdownV4Component,
    CardsDropdownV4Component
  ],
  templateUrl: './payment-source-dropdown-v4.component.html',
  styleUrls: ['./payment-source-dropdown-v4.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PaymentSourceDropdownV4Component),
      multi: true
    }
  ]
})
export class PaymentSourceDropdownV4Component
  implements ControlValueAccessor, OnInit, OnDestroy
{
  pageType = input<string>('');
  paymentSourceType$ = input<Observable<TPaymentSource>>();
  displayIcon = input<boolean>(true);
  customHeight = input<'0' | '1'>('0');
  isInvalid = input(false);
  /** Pass-through: suppress the card dropdown's inline help "?" icon (opt-in) */
  hideInlineHelpIcon = input(false);
  ready = output<IV3DropDownOnReady>();
  // @Input() paymentSourceType$: Observable<TPaymentSource>;
  // @Input() displayIcon = true;
  // @Output() ready = new EventEmitter<IV3DropDownOnReady>();

  selectedSource: FormControl<
    IBankDropdown | IExistingCreditCards | IWalletData | null
  > = new FormControl();

  selectedCard: FormControl<IExistingCreditCards> = new FormControl();
  selectedCardsDropDownHelpers: IDropdownMetaData = {};
  selectedBankAccount: FormControl<IBankDropdown> = new FormControl();
  selectedBankAcDropDownHelpers: IDropdownMetaData = {};
  selectedWallet: FormControl<IWalletData> = new FormControl();
  selectedWalletDropDownHelpers: IDropdownMetaData = {};
  onTouched: (event?: Event) => void;
  subscriptions: Subscription[] = [];
  onReadyResponse: IV3DropDownOnReady = {};
  paymentSourceType: TPaymentSource;

  ngOnInit(): void {
    this.initFormAndManageValueChanges();
    this.onReady();
  }

  /**
   * Called when the component is ready. Emits a response with the setItemWithId function.
   */
  onReady() {
    this.onReadyResponse = {
      setItemWithId: this.setItemWithId
    };
    this.onReadyResponse.dropDownData = {
      paymentSourceType: this.paymentSourceType
    };
    this.ready.emit(this.onReadyResponse);
  }

  /**
   * Sets an item with a specific ID based on the payment source type.
   * @param id - The ID of the item to set.
   * @returns True if the item was set, false otherwise.
   */
  setItemWithId = (id: string) => {
    switch (this.paymentSourceType) {
      case 'bankaccount':
        this.selectedBankAcDropDownHelpers.selectableId = id;
        return this.checkIdToBindDropDown(this.selectedBankAcDropDownHelpers);
      case 'card':
        this.selectedCardsDropDownHelpers.selectableId = id;
        return this.checkIdToBindDropDown(this.selectedCardsDropDownHelpers);
      case 'wallet':
        this.selectedWalletDropDownHelpers.selectableId = id;
        return this.checkIdToBindDropDown(this.selectedWalletDropDownHelpers);
      default:
        return false;
    }
    return false;
  };

  /**
   * Checks whether an item can be bound to a dropdown based on its metadata.
   * @param dropdownMetaData - The dropdown metadata.
   * @returns True if the item was bound, false otherwise.
   */
  checkIdToBindDropDown(dropdownMetaData: IDropdownMetaData): boolean {
    if (
      dropdownMetaData?.selectableId &&
      dropdownMetaData?.dropDownAPI?.setItemWithId
    ) {
      return dropdownMetaData.dropDownAPI?.setItemWithId(
        dropdownMetaData.selectableId
      );
    }
    return false;
  }

  /**
   * Sets the dropdown API and binds an item ID.
   * @param dropdownMetaData - The dropdown metadata.
   * @param onReady - The dropdown API.
   */
  setDropDownAPIAndBindId(
    dropdownMetaData: IDropdownMetaData,
    onReady: IV3DropDownOnReady
  ) {
    // eslint-disable-next-line no-param-reassign
    dropdownMetaData.dropDownAPI = onReady;
    this.checkIdToBindDropDown(dropdownMetaData);
  }

  /**
   * Initializes the form and manages value changes.
   */
  initFormAndManageValueChanges() {
    merge(
      this.selectedCard.valueChanges,
      this.selectedBankAccount.valueChanges,
      this.selectedWallet.valueChanges
    ).subscribe((sourceValue) => {
      this.selectedSource.setValue(sourceValue);
    });
    const paymentSource$ = this.paymentSourceType$();
    if (paymentSource$) {
      this.subscriptions.push(
        paymentSource$.subscribe((res) => {
          this.paymentSourceType = res;
          this.setSourceValueBasedOnPaymentSource();
        })
      );
    }
  }

  /**
   * Sets the source value based on the payment source type.
   */
  setSourceValueBasedOnPaymentSource() {
    switch (this.paymentSourceType) {
      case 'bankaccount':
        this.selectedSource.setValue(this.selectedBankAccount.value);
        break;
      case 'card':
        this.selectedSource.setValue(this.selectedCard.value);
        break;
      case 'wallet':
        this.selectedSource.setValue(this.selectedWallet.value);
        break;
      default:
        break;
    }
  }

  /**
   * Writes a value to the form based on the payment source type.
   * @param value - The value to write.
   */
  writeValue(
    value: IBankDropdown | IExistingCreditCards | IWalletData | null
  ): void {
    switch (this.paymentSourceType) {
      case 'bankaccount':
        this.selectedBankAccount.setValue(value as IBankDropdown);
        break;
      case 'card':
        this.selectedCard.setValue(value as IExistingCreditCards);
        break;
      case 'wallet':
        this.selectedWallet.setValue(value as IWalletData);
        break;
      default:
        break;
    }
  }

  /**
   * Registers a callback function to be invoked when the form control value changes.
   * @param fn - The callback function.
   */
  registerOnChange(
    fn: (
      event?:
        | IWalletData
        | IBankDropdown
        | IExistingCreditCards
        | null
        | undefined
    ) => void
  ): void {
    this.subscriptions.push(this.selectedSource.valueChanges.subscribe(fn));
  }

  /**
   * Registers a callback function to be invoked when the form control is touched.
   * @param fn - The callback function.
   */
  registerOnTouched(fn: (event?: Event | undefined) => void): void {
    this.onTouched = fn;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((res) => res.unsubscribe());
  }
}

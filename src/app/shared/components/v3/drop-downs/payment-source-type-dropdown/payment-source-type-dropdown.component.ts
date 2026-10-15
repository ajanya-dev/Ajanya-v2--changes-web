import {
  Component,
  ChangeDetectionStrategy,
  forwardRef,
  OnDestroy,
  Output,
  EventEmitter,
  AfterViewInit,
  input
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgSelectModule } from '@ng-select/ng-select';
import {
  ControlValueAccessor,
  FormControl,
  FormsModule,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule
} from '@angular/forms';
import { Subscription } from 'rxjs';
import { IV3DropDownOnReady } from 'src/app/models/common';
import { V3PaymentsTableData } from 'src/app/modules/v3-payments-table/shared/components/v3-payments-table/v3-payments-table-data';
import { IPayFromItem } from 'src/app/modules/payments/model/payments';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'app-payment-source-type-dropdown',
  standalone: true,
  imports: [
    CommonModule,
    NgSelectModule,
    FormsModule,
    ReactiveFormsModule,
    FontAwesomeModule
  ],
  templateUrl: './payment-source-type-dropdown.component.html',
  styleUrls: ['./payment-source-type-dropdown.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PaymentSourceTypeDropdownComponent),
      multi: true
    }
  ]
})
export class PaymentSourceTypeDropdownComponent
  implements ControlValueAccessor, AfterViewInit, OnDestroy
{
  @Output() ready = new EventEmitter<IV3DropDownOnReady>();
  isShowOnlyOneSource = input<boolean>(false);
  sourceName = input<string>('');
  
  paymentSourceTypes = V3PaymentsTableData.getPayFromItems();
  selectedPaymentSourceType: FormControl<IPayFromItem | null | undefined> =
    new FormControl();

  changesSubscription: Subscription;
  onReadyResponse: IV3DropDownOnReady = {};

  onTouched: (event?: Event | undefined) => void;

  ngAfterViewInit(): void {
    if(this.isShowOnlyOneSource()) {
      this.paymentSourceTypes = this.paymentSourceTypes.filter(ele => ele.id === this.sourceName());
    }
    this.onReady();
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
   * Sets an item with a specific ID in the payment source type dropdown.
   *
   * @param id - The ID of the item to set.
   * @returns True if the item was set, false otherwise.
   */
  setItemWithId = (id: string): boolean => {
    const payfromItem = this.paymentSourceTypes.find((ele) => ele.id === id);
    if (payfromItem) {
      this.selectedPaymentSourceType.setValue(payfromItem);
      return true;
    }
    return false;
  };

  /**
   * Writes a value to the payment source type dropdown based on the provided value.
   *
   * @param value - The value to write.
   */
  writeValue(value: IPayFromItem): void {
    if (value) {
      this.selectedPaymentSourceType.setValue(
        this.paymentSourceTypes.find((ele) => ele.id === value.id)
      );
    }
  }

  /**
   * Registers a callback function to be invoked when the payment source type dropdown value changes.
   *
   * @param fn - The callback function.
   */
  registerOnChange(
    fn: (event?: IPayFromItem | null | undefined) => void
  ): void {
    this.changesSubscription =
      this.selectedPaymentSourceType.valueChanges.subscribe(fn);
  }

  /**
   * Registers a callback function to be invoked when the payment source type dropdown is touched.
   *
   * @param fn - The callback function.
   */
  registerOnTouched(fn: (event?: Event | undefined) => void): void {
    this.onTouched = fn;
  }

  ngOnDestroy(): void {
    this.changesSubscription?.unsubscribe();
  }
}

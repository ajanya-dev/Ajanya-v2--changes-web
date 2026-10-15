import { Subscription } from 'dexie';
import {
  Component,
  ChangeDetectionStrategy,
  Input,
  forwardRef,
  OnChanges,
  SimpleChanges,
  Output,
  EventEmitter,
  AfterViewInit,
  inject,
  OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ControlValueAccessor,
  FormControl,
  FormsModule,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule
} from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { IV3DropDownOnReady } from 'src/app/models/common';
import { IPayAsItem } from 'src/app/modules/payments/model/payments';
import { PaymentTypeAccessService } from 'src/app/shared/service/common/shared/payment-type-access/payment-type-access.service';

@Component({
  selector: 'app-payment-method-dropdown',
  standalone: true,
  imports: [CommonModule, NgSelectModule, FormsModule, ReactiveFormsModule],
  templateUrl: './payment-method-dropdown.component.html',
  styleUrls: ['./payment-method-dropdown.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PaymentMethodDropdownComponent),
      multi: true
    }
  ]
})
export class PaymentMethodDropdownComponent
  implements ControlValueAccessor, OnChanges, AfterViewInit, OnDestroy
{
  @Input() paymentMethods: IPayAsItem[];
  @Input() loading: boolean = false;
  @Output() ready = new EventEmitter<IV3DropDownOnReady>();

  public paymentTypeAccessService = inject(PaymentTypeAccessService);

  subscription: Subscription[] = [];
  isDisabledPayTypeLoading = false;
  onReadyResponse: IV3DropDownOnReady = {};
  selectedPaymentMethod: FormControl<IPayAsItem | null | undefined> =
    new FormControl();

  onChange: (event?: IPayAsItem | null | undefined) => void;
  onTouched: (event?: Event) => void;

  /**
   * Lifecycle hook called after the view has been initialized.
   */
  ngAfterViewInit(): void {
    this.onReady();
  }

  /**
   * Called when the component is ready. Emits a response with the setItemWithId function.
   */
  onReady() {
    this.paymentTypeAccessService.initialize({ pageId: 'payment_home_page' });
    this.onReadyResponse = {
      setItemWithId: this.setItemWithId
    };
    this.ready.emit(this.onReadyResponse);
    this.subscription.push(
      this.paymentTypeAccessService.isDisabledPaymentSelected$.subscribe(
        (state) => {
          if (
            state &&
            this.selectedPaymentMethod.value?.id === (state as string) || this.selectedPaymentMethod.value?.extraId === (state as string)
          ) {
            this.selectedPaymentMethod.setValue(undefined);
          }
        }
      )
    );
  }

  /**
   * Lifecycle hook called when input properties change.
   *
   * @param inputChanges - Object containing changes to input properties.
   */
  ngOnChanges(inputChanges: SimpleChanges) {
    if (!inputChanges.paymentMethods?.isFirstChange()) {
      this.checkAssignedValueIsInArray();
    }
  }

  /**
   * Checks if the assigned value is in the paymentMethods array and sets it to undefined if not.
   */
  checkAssignedValueIsInArray() {
    if (
      !this.paymentMethods.find(
        (ele) => ele.id == this.selectedPaymentMethod.value?.id
      )
    ) {
      this.selectedPaymentMethod.setValue(undefined);
    }
  }
  /**
   * Sets an item with a specific ID in the selected payment method.
   *
   * @param id - The ID of the payment method to set.
   * @returns True if the item with the given ID was found and set, otherwise false.
   */
  setItemWithId = (id: string): boolean => {
    const item = this.paymentMethods.find((ele) => ele.id == id);
    if (item) {
      this.selectedPaymentMethod.setValue(item);
      this.onInputChanges();
      return true;
    }
    return false;
  };

  /**
   * Writes a value to the form control.
   * @param value - The value to write.
   */
  writeValue(value: IPayAsItem): void {
    if (value) {
      setTimeout(() => {
        this.selectedPaymentMethod.setValue(
          this.paymentMethods.find((ele) => ele.id == value.id)
        );
        this.onInputChanges();
      }, 0);
    }
  }

  /**
   * Registers a callback function to be invoked when the form control value changes.
   * @param fn - The callback function.
   */
  registerOnChange(fn: (event?: IPayAsItem | null | undefined) => void): void {
    this.selectedPaymentMethod.valueChanges.subscribe(fn);
  }

  /**
   * Registers a callback function to be invoked when the form control is touched.
   * @param fn - The callback function.
   */
  registerOnTouched(fn: (event?: Event | undefined) => void): void {
    this.onTouched = fn;
  }

  onInputChanges() {
    this.paymentTypeAccessService.onInputChanges(
      (this.selectedPaymentMethod.value as IPayAsItem)?.extraId ?? (this.selectedPaymentMethod.value as IPayAsItem)?.id
    );
  }

  ngOnDestroy(): void {
    this.subscription.forEach((s) => s.unsubscribe());
  }
}

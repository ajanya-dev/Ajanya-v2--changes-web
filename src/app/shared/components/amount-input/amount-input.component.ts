import { CommonModule, CurrencyPipe } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnInit,
  Output,
  ViewChild,
  forwardRef,
  inject
} from '@angular/core';
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule
} from '@angular/forms';
import { NgxMaskDirective, NgxMaskPipe } from 'ngx-mask';
import { Utils } from 'src/app/data/utils';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { NgClass } from '@angular/common';
import { faCalculator } from '@fortawesome/pro-thin-svg-icons';
import { OverlayModule } from '@angular/cdk/overlay';
import { CdkOverlayOrigin } from '@angular/cdk/overlay';
import { CommonButtonV35Component } from '../../v3/buttons/common-button-v35/common-button-v35.component';
import { MatDialog } from '@angular/material/dialog';
import { CalculatorComponent } from '../calculator/calculator.component';

@Component({
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    ReactiveFormsModule,
    NgxMaskDirective,
    NgxMaskPipe,
    FaIconComponent,
    NgClass,
    OverlayModule,
    CommonButtonV35Component
  ],
  selector: 'app-amount-input',
  templateUrl: './amount-input.component.html',
  styleUrls: ['./amount-input.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AmountInputComponent),
      multi: true
    },
    CurrencyPipe
  ]
})

/**
 * @description Custom input field for amount field with auto formating
 */
export class AmountInputComponent implements ControlValueAccessor, OnInit, OnChanges {
  currencyPipe = inject(CurrencyPipe);
  private elementRef = inject(ElementRef);
  private dialog = inject(MatDialog);

  @ViewChild('trigger') trigger!: CdkOverlayOrigin;
  @ViewChild('breakdownPanelRef') breakdownPanelRef!: ElementRef;
  @ViewChild('amountInput') amountInputRef!: ElementRef<HTMLInputElement>;

  @Input() customClass = ''; // for changing style between home screen amount input and normal amount input
  @Input() maxLength = 14;
  @Input() isReadOnly: boolean;
  @Input() isDisabled: boolean;
  @Input() formatOnInput: boolean;
  @Input() isRequired = true;
  @Input() fieldLabel = '';
  @Input() height = '';
  @Input() border = true;
  @Input() enableBreakdown: boolean = false;
  @Input() showBreakdownPanel: boolean = false;
  @Input() savedDenominations: {value: number, count: number}[] = [];
  @Input() isCalculator: boolean = false;
  utils = Utils;

  @Output() toggleBreakdownRequest = new EventEmitter<void>();
  @Output() blurEvent = new EventEmitter<string>();
  @Output() breakdownApplied = new EventEmitter<{
    amount: string;
    denominations: {value: string, count: number}[];
  }>();
  @Output() focused = new EventEmitter<void>();

  amount = '';
  originalAmount = '';
  showField: boolean;

  denominations = [
    { value: 100.00, count: 0 },
    { value: 50.00, count: 0 },
    { value: 20.00, count: 0 },
    { value: 10.00, count: 0 },
    { value: 5.00, count: 0 },
    { value: 1.00, count: 0 },
    { value: 0.50, count: 0 },
    { value: 0.25, count: 0 },
    { value: 0.10, count: 0 },
    { value: 0.05, count: 0 },
    { value: 0.01, count: 0 }
  ];
  breakdownSummary = '';
  totalAmount = 0;
  faCalculator = faCalculator;
  panelPosition = { top: 0, left: 0 };
  wrapperElement: HTMLElement;

  get totalDenomination(): number {
    return this.denominations.reduce((sum, d) => sum + d.value * d.count, 0);
  }

  onChange: ((value: string) => void) | undefined;
  onTouched: ((event?: Event) => void) | undefined;

  ngOnInit(): void {
    this.showField = true;
    if (this.savedDenominations?.length > 0) {
    this.denominations.forEach((denom) => {
      const match = this.savedDenominations.find(d => Number(d.value) === denom.value);
      denom.count = match ? match.count : 0;
    });

    this.breakdownSummary = this.denominations
      .filter((d) => d.count > 0)
      .map((d) => 
      {
        const label = d.value >= 1 ? `$${d.value}` : `${d.value * 100}¢`;
        return `${label}×${d.count}`;
      }
    )
      .join(', ');
    }
  }

  ngOnChanges(): void {
    if (!this.savedDenominations || this.savedDenominations.length === 0) {
      this.breakdownSummary = '';
      this.denominations.forEach(d => d.count = 0);
    }
  }

  /**
   * @description Used to update the value of the control programmatically
   * @param input
   */
  writeValue(input: string): void {
    const value = input || '0';
    const formattedAmount = this.currencyPipe.transform(value);
    if (formattedAmount) {
      this.amount = formattedAmount;
    } else {
      this.amount = value;
    }
  }

  /**
   * @description This ensures that the internal form control value is kept in sync with the visual representation of the amount in the input field
   * @param value
   */
  valChange(value: Event) {
    const event = value.target as HTMLInputElement;
    const rawInput = event.value;

    const amount =
      rawInput[0] === '$'
        ? rawInput.substring(1).replaceAll(',', '')
        : rawInput;
    
    this.onChange?.(amount);

    if (!amount || amount === '0' || rawInput === '$') {
      this.breakdownSummary = '';
      this.denominations.forEach(d => d.count = 0);
    }
  }

  /**
   * @description  Registers a function that will be called when the control value changes
   * @param fn
   */
  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  /**
   * @description Registers a function that will be called when the control is touched
   * @param fn
   */
  registerOnTouched(fn: (event?: Event) => void): void {
    this.onTouched = fn;
  }

  onDenominationChange(item: {value: number, count: number}) {
    if (item.count < 0 || isNaN(item.count)) {
      item.count = 0;
    }
  }

  clearIfZero(item: {value: number, count: number | null}) {
    if (item.count === 0) {
      item.count = null;
    }
  }

  restoreIfEmpty(item: {value: number, count: number | null }) {
    if (item.count === null || item.count === undefined) {
      item.count = 0;
    }
  }

  preventNegativeInput(event: KeyboardEvent) {
    const invalidKeys = ['-', 'e', 'E', '+', '.', ','];
    if (invalidKeys.includes(event.key)) {
      event.preventDefault();
    }
  }

  applyBreakdown() {
    this.totalAmount = this.denominations.reduce(
      (sum, d) => sum + d.value * d.count,
      0
    );
    this.amount = this.totalAmount.toFixed(2);
    this.onChange?.(this.amount);
    this.breakdownSummary = this.denominations
      .filter((d) => d.count > 0)
      .map((d) => 
      {
        const label = d.value >= 1 ? `$${d.value}` : `${d.value * 100}¢`;
        return `${label}×${d.count}`;
      }
    )
      .join(', ');
    this.showBreakdownPanel = false;

    const selectedDenominations =  this.denominations
    .filter((d) => d.count > 0)
    .map((d) => ({
      value: parseFloat(d.value.toString()).toFixed(2),
      count: d.count
    }));

    this.breakdownApplied.emit({
      amount: this.amount,
      denominations: selectedDenominations
    });

  }

  /**
   * @description Resets the amount to its unformatted value when focused
   * @returns
   */
  onFocus() {
    if (this.isDisabled) {
      return;
    }
    // Emit to notify the parent that this field was focused
    this.focused.emit();
 
    if (this.amount === '$0.00') {
      this.amount = '';
      this.breakdownSummary = '';
      return;
    }
    if (this.amount[0] === '$') {
      this.amount = parseFloat(
        this.amount.substring(1).replaceAll(',', '')
      ).toString();
    } else {
      this.amount = parseFloat(this.amount).toString();
    }
  }

  /**
   * @description Formats the amount value when the field loses focus
   * @returns
   */
  onBlur() {
    if (this.isDisabled) {
      return;
    }

    if (this.amount === '$.') {
      this.amount = '';
      this.onChange?.(this.amount);
    }

    const amount = this.amount ? this.amount : '0';
    const formattedAmount =
      this.amount[0] === '$'
        ? this.amount
        : this.currencyPipe.transform(amount);
    if (formattedAmount) {
      this.amount = formattedAmount;
    } else {
      this.amount = amount;
    }
    this.blurEvent.emit(this.amount);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    if (this.showBreakdownPanel && this.enableBreakdown) {
      const target = event.target as HTMLElement;

      const clickedInsideComponent = this.elementRef.nativeElement.contains(target);
      const clickedInsidePanel = this.breakdownPanelRef?.nativeElement.contains(target);
      const clickedTrigger = this.trigger?.elementRef.nativeElement.contains(target);

      if (!clickedInsideComponent && !clickedInsidePanel && !clickedTrigger) {
        this.toggleBreakdownRequest.emit();
      }

    }
  }

  /** Programmatically focuses the amount input. */
  focusInput(): void {
    this.amountInputRef?.nativeElement?.focus();
  }

  openCalculator(): void {
    const dialogRef = this.dialog.open(CalculatorComponent, {
      maxWidth: '286px',
      width: '95%',
      data: { addAmountButton: true }
    });
    dialogRef.afterClosed().subscribe((calculatedValue) => {
      if (calculatedValue) {
        this.amount = calculatedValue;
      }
    });
  }
}

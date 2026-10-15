import { CommonModule, CurrencyPipe } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  HostBinding,
  HostListener,
  OnChanges,
  OnInit,
  ViewChild,
  forwardRef,
  inject,
  input,
  output,
  model
} from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule
} from '@angular/forms';
import { NgxMaskDirective } from 'ngx-mask';
import { Utils } from 'src/app/data/utils';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faCalculator } from '@fortawesome/pro-thin-svg-icons';
import { OverlayModule, CdkOverlayOrigin } from '@angular/cdk/overlay';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonButtonV4Component } from '../buttons/common-button-v4/common-button-v4.component';
import { CalculatorComponent } from '../../components/calculator/calculator.component';
import { V4ControlMessageComponent } from '../control-message-v4/control-message-v4.component';

/**
 * CommonAmountInputV4Component - A reusable currency amount input with auto-formatting,
 * denomination breakdown panel, and calculator integration.
 * Implements ControlValueAccessor for seamless reactive form integration.
 *
 * Uses V3-style class pattern: static `class="default-input"` is the base,
 * pass `[customClass]="'hero-input'"` to override with hero styling.
 *
 * @example
 * <!-- Default -->
 * <app-common-amount-input-v4 [fieldLabel]="'Amount'" formControlName="amount" />
 *
 * @example
 * <!-- Hero (large centered) -->
 * <app-common-amount-input-v4 [customClass]="'hero-input'" formControlName="amount" />
 */
@Component({
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    ReactiveFormsModule,
    NgxMaskDirective,
    FaIconComponent,
    OverlayModule,
    MatTooltipModule,
    CommonButtonV4Component,
    V4ControlMessageComponent
  ],
  selector: 'app-common-amount-input-v4',
  templateUrl: './common-amount-input-v4.component.html',
  styleUrls: ['./common-amount-input-v4.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CommonAmountInputV4Component),
      multi: true
    },
    CurrencyPipe
  ]
})
export class CommonAmountInputV4Component
  implements ControlValueAccessor, OnInit, OnChanges, AfterViewInit
{
  currencyPipe = inject(CurrencyPipe);
  private elementRef = inject(ElementRef);
  private dialog = inject(MatDialog);

  @ViewChild('trigger') trigger!: CdkOverlayOrigin;
  @ViewChild('breakdownPanelRef') breakdownPanelRef!: ElementRef;
  @ViewChild('heroInput') heroInputRef?: ElementRef<HTMLInputElement>;

  /** Cached CSS baseline (default minimum) width; invalidated on resize. */
  private heroBaseWidth: number | null = null;
  /** Reused canvas context for measuring the rendered amount width. */
  private heroMeasureCtx: CanvasRenderingContext2D | null = null;

  /** Custom CSS class - pass 'hero-input' for hero styling */
  customClass = input('');
  /** Maximum characters allowed in input */
  maxLength = input(20);
  /** Prevents input editing */
  isReadOnly = input(false);
  /** Disables the input field */
  isDisabled = input(false);
  /** Shows required indicator (*) on label */
  isRequired = input(true);
  /** Label text displayed above the input */
  fieldLabel = input('');
  /** Custom height for the input field */
  height = input<'44px' | '32px'>('44px');
  /** Whether to show input border (applies to default variant) */
  border = input(true);
  /** Enables denomination breakdown UI */
  enableBreakdown = input(false);
  /** Controls visibility of breakdown panel */
  showBreakdownPanel = model(false);
  /** Pre-populated denomination data */
  savedDenominations = input<{ value: number; count: number }[]>([]);
  /** Shows calculator button to open calculator modal */
  isCalculator = input(false);
  /** Form control for validation display */
  control = input<AbstractControl>();
  /** Label for validation error messages */
  errorLabel = input('');
  /** HTML autocomplete attribute for the native input */
  autocomplete = input('');
  
  forPayment = input(false);

  /**
   * The payment page's hero is its own size, and it used to reach in with
   * `::ng-deep` to get it — which also let a width cap out there silently
   * override the width this field measures for itself. A class on the host
   * keeps the sizing where the rest of the sizing lives.
   */
  @HostBinding('class.for-payment') get isForPayment(): boolean {
    return this.forPayment();
  }

  /** Whether hero-input class is active */
  get isHero(): boolean {
    return this.customClass() === 'hero-input';
  }

  utils = Utils;

  /** Emitted when user clicks breakdown/calculator icon */
  toggleBreakdownRequest = output<void>();
  /** Emitted on blur with formatted amount */
  blurEvent = output<string>();
  /** Emitted when breakdown is applied */
  breakdownApplied = output<{
    amount: string;
    denominations: { value: string; count: number }[];
  }>();

  /** Emitted when input gains focus */
  focused = output<void>();

  amount = '';
  originalAmount = '';
  showField: boolean;
  isFocused = false;

  denominations: { value: number; count: number | null }[] = [
    { value: 100.0, count: 0 },
    { value: 50.0, count: 0 },
    { value: 20.0, count: 0 },
    { value: 10.0, count: 0 },
    { value: 5.0, count: 0 },
    { value: 1.0, count: 0 },
    { value: 0.5, count: 0 },
    { value: 0.25, count: 0 },
    { value: 0.1, count: 0 },
    { value: 0.05, count: 0 },
    { value: 0.01, count: 0 }
  ];

  breakdownSummary = '';
  totalAmount = 0;
  faCalculator = faCalculator;

  get totalDenomination(): number {
    return this.denominations.reduce(
      (sum, d) => sum + d.value * (d.count ?? 0),
      0
    );
  }

  onChange: ((value: string) => void) | undefined;
  onTouched: ((event?: Event) => void) | undefined;

  ngOnInit(): void {
    this.showField = true;
    if (this.savedDenominations()?.length > 0) {
      this.denominations.forEach((denom, index) => {
        const match = this.savedDenominations().find(
          (d) => Number(d.value) === denom.value
        );
        this.denominations[index].count = match ? match.count : 0;
      });

      this.breakdownSummary = this.denominations
        .filter((d) => (d.count ?? 0) > 0)
        .map((d) => {
          const label = d.value >= 1 ? `$${d.value}` : `${d.value * 100}¢`;
          return `${label}×${d.count}`;
        })
        .join(', ');
    }
  }

  ngOnChanges(): void {
    if (!this.savedDenominations() || this.savedDenominations().length === 0) {
      this.breakdownSummary = '';
      this.denominations.forEach((_d, index) => {
        this.denominations[index].count = 0;
      });
    }
  }

  ngAfterViewInit(): void {
    this.scheduleHeroWidthAdjust();
  }

  private scheduleHeroWidthAdjust(): void {
    if (!this.isHero) {
      return;
    }
    // Wait for ngModel to flush the new value to the DOM before measuring.
    requestAnimationFrame(() => this.adjustHeroWidth());
  }

  private adjustHeroWidth(): void {
    const el = this.heroInputRef?.nativeElement;
    if (!this.isHero || !el) {
      return;
    }
    const baseWidth = this.getHeroBaseWidth();

    const text = this.amount;
    // const text = this.getHeroDisplayText();
    let needed = baseWidth;
    if (text) {
      // +24px buffer covers the caret and minor canvas font-metric differences.
      const contentWidth = this.measureHeroTextWidth(el, text) + 24;
      if (contentWidth > baseWidth) {
        const step = Math.max(40, baseWidth * 0.25);
        needed = baseWidth + Math.ceil((contentWidth - baseWidth) / step) * step;
      }
    }

    if (needed <= baseWidth) {
      el.style.width = '';
    } else {
      el.style.width = `${needed}px`;
    }
  }

  /** CSS baseline width, measured once without an inline override or transition. */
  private getHeroBaseWidth(): number {
    if (this.heroBaseWidth !== null) {
      return this.heroBaseWidth;
    }
    const node = this.heroInputRef?.nativeElement;
    if (!node) {
      return 0;
    }
    const prevTransition = node.style.transition;
    const prevWidth = node.style.width;
    node.style.transition = 'none';
    node.style.width = '';
    this.heroBaseWidth = node.clientWidth;
    node.style.width = prevWidth;
    // Force a reflow so the width restore commits before transitions re-enable.
    node.getBoundingClientRect();
    node.style.transition = prevTransition;
    return this.heroBaseWidth;
  }

  private measureHeroTextWidth(el: HTMLInputElement, text: string): number {
    if (!this.heroMeasureCtx) {
      this.heroMeasureCtx = document.createElement('canvas').getContext('2d');
    }
    const ctx = this.heroMeasureCtx;
    if (!ctx) {
      return 0;
    }
    const cs = getComputedStyle(el);
    ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    return ctx.measureText(text).width;
  }

  writeValue(val: string): void {
    if (val === null || val === undefined || val === '') {
      this.amount = '';
      this.scheduleHeroWidthAdjust();
      return;
    }
    const cleaned = val.toString().replace(/^\$\s*/, '').replaceAll(',', '').trim();
    const parsed = parseFloat(cleaned) || 0;
    this.amount = parsed.toFixed(2);
    this.scheduleHeroWidthAdjust();
  }

  onAmountModelChange(rawValue: string): void {
    const value = rawValue ?? '';
    this.amount = value;

    const amount =
      value[0] === '$'
        ? value.substring(1).replaceAll(',', '')
        : value.replaceAll(',', '');

    this.onChange?.(amount);

    if (!amount || amount === '0' || value === '$') {
      this.breakdownSummary = '';
      this.denominations.forEach((_d, index) => {
        this.denominations[index].count = 0;
      });
    }

    // Resize the hero field to fit the current amount length (grow or shrink).
    this.scheduleHeroWidthAdjust();
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: (event?: Event) => void): void {
    this.onTouched = fn;
  }

  onDenominationChange(item: { value: number; count: number }) {
    const index = this.denominations.findIndex((d) => d.value === item.value);
    if (index !== -1 && (item.count < 0 || Number.isNaN(item.count))) {
      this.denominations[index].count = 0;
    }
  }

  clearIfZero(item: { value: number; count: number | null }) {
    const index = this.denominations.findIndex((d) => d.value === item.value);
    if (index !== -1 && item.count === 0) {
      this.denominations[index].count = null;
    }
  }

  restoreIfEmpty(item: { value: number; count: number | null }) {
    const index = this.denominations.findIndex((d) => d.value === item.value);
    if (index !== -1 && (item.count === null || item.count === undefined)) {
      this.denominations[index].count = 0;
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
      (sum, d) => sum + d.value * (d.count ?? 0),
      0
    );
    this.amount = this.totalAmount.toFixed(2);
    this.onChange?.(this.amount);
    this.breakdownSummary = this.denominations
      .filter((d) => (d.count ?? 0) > 0)
      .map((d) => {
        const label = d.value >= 1 ? `$${d.value}` : `${d.value * 100}¢`;
        return `${label}×${d.count}`;
      })
      .join(', ');
    this.showBreakdownPanel.set(false);

    const selectedDenominations = this.denominations
      .filter((d): d is { value: number; count: number } => (d.count ?? 0) > 0)
      .map((d) => ({
        value: parseFloat(d.value.toString()).toFixed(2),
        count: d.count
      }));

    this.breakdownApplied.emit({
      amount: this.amount,
      denominations: selectedDenominations
    });
  }

  onFocus() {
    if (this.isDisabled()) {
      return;
    }
    this.focused.emit();
    this.isFocused = true;

    if (!this.amount || this.amount === '$0.00' || this.amount === '$ 0.00') {
      this.amount = '';
      this.breakdownSummary = '';
      return;
    }
    if (this.amount[0] === '$') {
      const parsed = parseFloat(this.amount.substring(1).replaceAll(',', ''));
      this.amount = parsed && parsed !== 0 ? parsed.toString() : '';
    } else {
      const parsed = parseFloat(this.amount.replaceAll(',', ''));
      this.amount = parsed && parsed !== 0 ? parsed.toString() : '';
    }
  }

  onBlur() {
    this.isFocused = false;
    if (this.isDisabled()) {
      return;
    }

    if (this.amount === '$.' || this.amount === '$ .') {
      this.amount = '';
      this.onChange?.(this.amount);
    }


    const rawAmount = this.amount
      ? this.amount.replace(/^\$\s*/, '').replaceAll(',', '').trim() || '0'
      : '0';
    const numericStr = (parseFloat(rawAmount) || 0).toFixed(2);
    this.amount = numericStr;
    this.onChange?.(numericStr);
    this.blurEvent.emit(numericStr);
    this.scheduleHeroWidthAdjust();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    if (this.showBreakdownPanel() && this.enableBreakdown()) {
      const target = event.target as HTMLElement;

      const clickedInsideComponent =
        this.elementRef.nativeElement.contains(target);
      const clickedInsidePanel =
        this.breakdownPanelRef?.nativeElement.contains(target);
      const clickedTrigger =
        this.trigger?.elementRef.nativeElement.contains(target);

      if (!clickedInsideComponent && !clickedInsidePanel && !clickedTrigger) {
        this.toggleBreakdownRequest.emit();
      }
    }
  }

  openCalculator(): void {
    const dialogRef = this.dialog.open(CalculatorComponent, {
      maxWidth: '286px',
      width: '95%',
      data: { addAmountButton: true,isV4: true }
    });
    dialogRef.afterClosed().subscribe((calculatedValue) => {
      if (calculatedValue) {
        this.amount = calculatedValue;
      }
    });
  }
}

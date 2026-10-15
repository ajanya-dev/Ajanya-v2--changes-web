import { Component, computed, forwardRef, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgSelectModule } from '@ng-select/ng-select';
import {
  ControlValueAccessor,
  FormControl,
  FormsModule,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule
} from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
// eslint-disable-next-line import/no-extraneous-dependencies
import {
  LucideAngularModule,
  Zap,
  Send,
  Landmark,
  FileCheck,
  Globe,
  Users,
  CreditCard,
  Mail,
  Printer,
  Info,
  Lock,
  Star
} from 'lucide-angular';

/**
 * A single payment-method ("pay as") option. Modeled after the payments-v35
 * `IPayAsItem` — a method with an optional tooltip and a `locked` flag for
 * options that are shown but not selectable for the chosen source.
 */
export interface IPaymentMethodOption {
  id: string;
  name: string;
  /** lucide icon key — maps into METHOD_ICONS */
  icon: string;
  /** plain-language tooltip (from the v35 payOptions data) */
  toolTip?: string;
  /** shown but not selectable for the current source (v35 isSelectable=false) */
  locked?: boolean;
  /** how long the method takes to land — rendered as the green subtext */
  processingTime?: string;
  /** optional arrival estimate — kept for standalone use, unused by v35 data */
  eta?: string;
  /** optional helper line under the name */
  desc?: string;
  /** optional formatted fee label, e.g. "+$1.00" */
  fee?: string;
  disableStar?:boolean;
  disabled?: boolean;
}

const METHOD_ICONS: Record<string, object> = {
  landmark: Landmark,
  bank: Landmark,
  globe: Globe,
  'credit-card': CreditCard,
  'file-check': FileCheck,
  check: FileCheck,
  zap: Zap,
  mail: Mail,
  printer: Printer,
  send: Send,
  vendor: Users,
  users: Users
};

const DEFAULT_METHODS: IPaymentMethodOption[] = [
  {
    id: 'ach',
    name: 'ACH / Direct Deposit',
    icon: 'landmark',
    toolTip:
      '• Standard electronic bank transfer. \n• Takes 1-3 business days to arrive.'
  },
  {
    id: 'wire',
    name: 'Wire',
    icon: 'globe',
    toolTip: '• Immediate bank-to-bank transfer. \n• Available within hours.'
  }
];

/**
 * Payment-method dropdown (ACH / Wire / Check / Vendor / International ...).
 * Mirrors the design of the other v4 dropdowns (ng-select + shared mixin +
 * lucide icons) but is fed by a static option list. Implements
 * ControlValueAccessor so it can be used with reactive forms.
 */
@Component({
  selector: 'app-payment-method-dropdown-v4',
  standalone: true,
  imports: [
    CommonModule,
    NgSelectModule,
    FormsModule,
    ReactiveFormsModule,
    LucideAngularModule,
    MatTooltipModule
  ],
  templateUrl: './payment-method-dropdown-v4.component.html',
  styleUrls: ['./payment-method-dropdown-v4.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PaymentMethodDropdownV4Component),
      multi: true
    }
  ]
})
export class PaymentMethodDropdownV4Component implements ControlValueAccessor {
  id = input('id');
  placeholder = input('Select or search a method');
  append = input('ng-select');
  customHeight = input<'0' | '1' >('0');
  labelIconNeeded = input(true);
  dropdownIconNeeded = input(true);
  clearable = input(false);
  searchable = input(false);
  isInvalid = input(false);
  /** override the static list if a caller wants custom methods */
  methods = input<IPaymentMethodOption[]>(DEFAULT_METHODS);
  /** render a per-item default star (opt-in; off elsewhere) */
  showDefaultStar = input(false);
  /** id of the item that is the saved default — filled/yellow star */
  defaultItemId = input<string | null>(null);

  readonly options = computed<IPaymentMethodOption[]>(() =>
    this.methods().map((method) => ({ ...method, disabled: !!method.locked }))
  );

  changeEvent = output<IPaymentMethodOption | null | undefined>();
  /** a star was clicked — the caller sets this item as the default */
  starClick = output<IPaymentMethodOption>();

  readonly icons = METHOD_ICONS;
  readonly LockIcon = Lock;
  readonly InfoIcon = Info;
  readonly StarIcon = Star;

  selectedMethod: FormControl<IPaymentMethodOption | null | undefined> =
    new FormControl();

  onChange: (value?: IPaymentMethodOption | null) => void = () => {};
  onTouched: () => void = () => {};

  getIcon(key: string): object {
    return this.icons[key] ?? FileCheck;
  }

  writeValue(value: IPaymentMethodOption | null | undefined): void {
    if (value?.id) {
      const match = this.options().find((m) => m.id === value.id);
      this.selectedMethod.setValue(match ?? value, { emitEvent: false });
    } else {
      this.selectedMethod.setValue(value ?? undefined, { emitEvent: false });
    }
  }

  registerOnChange(fn: (value?: IPaymentMethodOption | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  getChange(value: IPaymentMethodOption | null | undefined): void {
    this.onChange(value);
    this.changeEvent.emit(value);
  }

  /** Star click sets the default and closes the panel (ng-select's own select is suppressed). */
  onStar(event: Event, item: IPaymentMethodOption): void {
    event.stopPropagation();
    event.preventDefault();
    if (item.disableStar) {
      return;
    }
    // Favouriting is not a selection: the reference leaves the list open so a
    // second star can be set without reopening it.
    this.starClick.emit(item);
  }
}

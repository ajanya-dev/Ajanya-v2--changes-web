import { Component, forwardRef, input, output } from '@angular/core';
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
  Wallet,
  CreditCard,
  Landmark,
  Cloud,
  Star
} from 'lucide-angular';
import { IPaymentMethodOption } from '../payment-method-dropdown-v4/payment-method-dropdown-v4.component';

/**
 * A "pay from" source type option. Modeled after the payments-v35
 * `IPayFromItem`: each source carries its own `payOptions` (the "pay as"
 * payment-method list that becomes available once this source is selected).
 */
export interface IPayFromSource {
  id: string;
  name: string;
  /** short label, e.g. "Bank", "Card" */
  shortLabel?: string;
  /** lucide icon key — maps into SOURCE_ICONS */
  icon: string;
  /** shown as a "Soon" pill and disables the option */
  soon?: boolean;
  /** payment methods available for this source (v35 payOptions) */
  payOptions?: IPaymentMethodOption[];
}

const SOURCE_ICONS: Record<string, object> = {
  bankaccount: Landmark,
  bank: Landmark,
  card: CreditCard,
  credit: CreditCard,
  wallet: Wallet,
  cloud: Cloud
};

/**
 * Pay-from source list — mirrors PaymentData.getPayFromItems() from
 * payments-main-v35 (labels, ids, and per-source payOptions with tooltips /
 * isSelectable flags), adapted to lucide icons. UI-only static data.
 */
export const PAY_FROM_SOURCES: IPayFromSource[] = [
  {
    id: 'bankaccount',
    name: 'Bank Account',
    shortLabel: 'Bank',
    icon: 'bankaccount',
    payOptions: [
      {
        id: 'check',
        name: 'Check',
        icon: 'file-check',
        toolTip:
          '• Print check yourself or mail it. \n• Payee can deposit via mobile.',
        processingTime: 'Depends on delivery',
        locked: false
      },
      {
        id: 'let-payee-choose',
        name: 'Let the vendor decide',
        icon: 'vendor',
        toolTip:
          '• Payment is sent directly to the vendor’s Wallet. \n• The vendor has full control over how they receive their funds.',
        processingTime: '1–3 business days',
        locked: false
      },
      {
        id: 'ach',
        name: 'ACH / Direct Deposit',
        icon: 'landmark',
        toolTip:
          '• Standard electronic bank transfer. \n• Takes 4-6 business days to arrive.',
        processingTime: '4–6 business days',
        locked: false
      },
      {
        id: 'wire',
        name: 'Wire',
        icon: 'globe',
        toolTip:
          '• Immediate bank-to-bank transfer. \n• Available within hours.',
        processingTime: '0-1 business day (depending on if submitted before bank closing hours)',
        locked: false
      },
      {
        id: 'virtual-card',
        name: 'Virtual Card',
        icon: 'credit-card',
        toolTip:
          '• Digital payment card via email. \n• Recipient can use immediately online.',
        processingTime: 'Instant',
        locked: false
      },
      {
        id: 'rtp',
        name: 'Real Time Instant Payment',
        icon: 'zap',
        toolTip:
          '• Money available immediately 24/7. \n• Instant transfer any time.',
        processingTime: 'Instant',
        locked: true
      },
      {
        id: 'same-ach',
        name: 'Same Day ACH',
        icon: 'landmark',
        toolTip:
          '• Cut-off: 10:30 AM PST (12:30 PM CST). \n• Same-day processing if submitted on time. \n• Late submissions process next business day.',
        processingTime: 'Expedited · 1–3 business days',
        locked: false
      },
      {
        id: 'international-payment',
        name: 'International Payment',
        icon: 'globe',
        toolTip:
          '• Send money outside United States. \n• Includes currency conversion. \n• Wallet to Bank transfer.',
        processingTime: '0–1 days',
        locked: false
      }
    ]
  },
  {
    id: 'card',
    name: 'Credit Card',
    shortLabel: 'Card',
    icon: 'card',
    payOptions: [
      {
        id: 'let-payee-choose',
        name: 'Let the vendor decide',
        icon: 'vendor',
        toolTip:
          '• Payment is sent directly to the vendor’s Wallet. \n• The vendor has full control over how they receive their funds.',
        processingTime: '2–5 business days',
        locked: false
      },
      {
        id: 'same-ach',
        name: 'Same Day ACH',
        icon: 'landmark',
        toolTip:
          '• Cut-off: 10:30 AM PST (12:30 PM CST). \n• Same-day processing if submitted on time. \n• Late submissions process next business day.',
        processingTime: '0-1 business day (depending on if submitted before bank closing hours)',
        locked: false
      },
      {
        id: 'ach',
        name: 'ACH / Direct Deposit',
        icon: 'landmark',
        toolTip:
          '• Standard electronic bank transfer. \n• Takes 4-6 business days to arrive.',
        processingTime: '4–6 business days',
        locked: false
      },
      {
        id: 'wire',
        name: 'Wire',
        icon: 'globe',
        toolTip:
          '• Immediate bank-to-bank transfer. \n• Available within hours.',
        processingTime: '0-1 business day (depending on if submitted before bank closing hours)',
        locked: false
      },
      {
        id: 'virtual-card',
        name: 'Virtual Card',
        icon: 'credit-card',
        toolTip:
          '• Digital payment card via email. \n• Recipient can use immediately online.',
        processingTime: 'Instant',
        locked: false
      },
      {
        id: 'check_mail',
        name: 'Check Mail (USPS / FedEx)',
        icon: 'mail',
        toolTip:
          '• Physical Check Mailed to the recipient. \n• Cut-off Time: USPS – 12:30 PM CST | FedEx – 1:00 PM CST.',
        processingTime: 'Depending on shipping type',
        locked: false
      },
      {
        id: 'rtp',
        name: 'Real Time Instant Payment',
        icon: 'zap',
        toolTip:
          '• Money available immediately 24/7. \n• Instant transfer any time.',
        processingTime: 'Instant',
        locked: true
      },
      {
        id: 'international-payment',
        name: 'International Payment',
        icon: 'globe',
        toolTip:
          '• Send money outside United States. \n• Includes currency conversion. \n• Wallet to Bank transfer.',
        processingTime: 'Varies',
        locked: false
      },
      // {
      //   id: 'check_print',
      //   name: 'Check Print',
      //   icon: 'printer',
      //   toolTip:
      //     '• Instantly print the check using your own printer. \n• You can use either check paper or regular white paper.',
      //   processingTime: 'Instant',
      //   locked: true
      // }
    ]
  },
  {
    id: 'wallet',
    name: 'Wallet',
    shortLabel: 'Wallet',
    icon: 'wallet',
    payOptions: [
      {
        id: 'let-payee-choose',
        name: 'Let the vendor decide',
        icon: 'vendor',
        toolTip:
          '• Payment is sent directly to the vendor’s Wallet. \n• The vendor has full control over how they receive their funds.',
        processingTime: 'Instant',
        locked: false
      },
      {
        id: 'same-ach',
        name: 'Same Day ACH',
        icon: 'landmark',
        toolTip:
          '• Cut-off: 10:30 AM PST (12:30 PM CST). \n• Same-day processing if submitted on time. \n• Late submissions process next business day.',
        processingTime: '0-1 business day (depending on if submitted before bank closing hours)',
        locked: false
      },
      {
        id: 'ach',
        name: 'ACH / Direct Deposit',
        icon: 'landmark',
        toolTip:
          '• Standard electronic bank transfer. \n• Takes 1-3 business days to arrive.',
        processingTime: '1–3 business days',
        locked: false
      },
      {
        id: 'wire',
        name: 'Wire',
        icon: 'globe',
        toolTip:
          '• Immediate bank-to-bank transfer. \n• Available within hours.',
        processingTime: '0-1 business day (depending on if submitted before bank closing hours)',
        locked: false
      },
      {
        id: 'international-payment',
        name: 'International Payment',
        icon: 'globe',
        toolTip:
          '• Send money outside United States. \n• Includes currency conversion. \n• Wallet to Bank transfer.',
        processingTime: '0-1 business day',
        locked: false
      },
      {
        id: 'virtual-card',
        name: 'Virtual Card',
        icon: 'credit-card',
        toolTip:
          '• Digital payment card via email. \n• Recipient can use immediately online.',
        processingTime: 'Instant',
        locked: false
      },
      {
        id: 'check',
        name: 'Check',
        icon: 'file-check',
        toolTip:
          '• Print check yourself or mail it. \n• Payee can deposit via mobile.',
        processingTime: 'Depends on delivery',
        locked: false
      },
      {
        id: 'rtp',
        name: 'Real Time Instant Payment',
        icon: 'zap',
        toolTip:
          '• Money available immediately 24/7. \n• Instant transfer any time.',
        processingTime: 'Instant',
        locked: true
      },
      // {
      //   id: 'check_mail',
      //   name: 'Check Mail (USPS / FedEx)',
      //   icon: 'mail',
      //   toolTip:
      //     '• Physical Check Mailed to the recipient. \n• Cut-off Time: USPS – 12:30 PM CST | FedEx – 1:00 PM CST.',
      //   locked: false
      // },
      // {
      //   id: 'check_email',
      //   name: 'Check Email (Instant)',
      //   icon: 'mail',
      //   toolTip:
      //     '• Check is instantly emailed to the recipient. \n• Recipient can print and deposit it easily.',
      //   locked: false
      // },
      // {
      //   id: 'check_print',
      //   name: 'Check Print (Yourself)',
      //   icon: 'printer',
      //   toolTip:
      //     '• Instantly print the check using your own printer. \n• You can use either check paper or regular white paper.',
      //   locked: false
      // }
    ]
  },
  {
    id: 'cloud',
    name: 'Cloud Bank',
    shortLabel: 'Cloud',
    icon: 'cloud',
    soon: true,
    payOptions: [
      {
        id: 'ach',
        name: 'ACH',
        icon: 'landmark',
        toolTip:
          '• Standard electronic bank transfer. \n• Takes 1-3 business days to arrive.',
        processingTime: '1–3 days',
        locked: false
      },
      {
        id: 'domestic',
        name: 'Wire - Domestic',
        icon: 'globe',
        toolTip:
          '• Immediate bank-to-bank transfer. \n• Available within hours.',
        processingTime: '0–1 day',
        locked: false
      },
      {
        id: 'international',
        name: 'Wire - International',
        icon: 'globe',
        toolTip:
          '• Send money outside United States. \n• Includes currency conversion.',
        processingTime: 'Varies',
        locked: false
      },
      {
        id: 'virtual-card',
        name: 'Virtual Card',
        icon: 'credit-card',
        toolTip:
          '• Digital payment card via email. \n• Recipient can use immediately online.',
        processingTime: 'Instant',
        locked: true
      },
      {
        id: 'rtp',
        name: 'Real Time Instant Payment',
        icon: 'zap',
        toolTip:
          '• Money available immediately 24/7. \n• Instant transfer any time.',
        processingTime: '24/7',
        locked: true
      },
      {
        id: 'same-ach',
        name: 'Same Day ACH',
        icon: 'landmark',
        toolTip:
          '• Cut-off: 10:30 AM PST (12:30 PM CST). \n• Same-day processing if submitted on time. \n• Late submissions process next business day.',
        processingTime: 'Same day',
        locked: true
      },
      {
        id: 'international-payment',
        name: 'International Payment',
        icon: 'globe',
        toolTip:
          '• Send money outside United States. \n• Includes currency conversion. \n• Wallet to Bank transfer.',
        processingTime: 'Varies',
        locked: true
      },
      {
        id: 'check_mail',
        name: 'Check Mail (USPS / FedEx)',
        icon: 'mail',
        toolTip:
          '• Physical Check Mailed to the recipient. \n• Cut-off Time: USPS – 12:30 PM CST | FedEx – 1:00 PM CST.',
        processingTime: '1–5 days',
        locked: true
      },
      {
        id: 'check_print',
        name: 'Check Print',
        icon: 'printer',
        toolTip:
          '• Instantly print the check using your own printer. \n• You can use either check paper or regular white paper.',
        processingTime: 'Instant',
        locked: true
      }
    ]
  }
];

/**
 * Pay-from source-type dropdown (Bank Account / Credit Card / Wallet / Cloud
 * Bank). Mirrors the design of the other v4 dropdowns (ng-select + shared
 * mixin + lucide icons) but is fed by a static option list adapted from
 * payments-main-v35. Implements ControlValueAccessor for reactive forms.
 */
@Component({
  selector: 'app-pay-from-dropdown-v4',
  standalone: true,
  imports: [
    CommonModule,
    NgSelectModule,
    FormsModule,
    ReactiveFormsModule,
    MatTooltipModule,
    LucideAngularModule
  ],
  templateUrl: './pay-from-dropdown-v4.component.html',
  styleUrls: ['./pay-from-dropdown-v4.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PayFromDropdownV4Component),
      multi: true
    }
  ]
})
export class PayFromDropdownV4Component implements ControlValueAccessor {
  id = input('id');
  placeholder = input('Select a source');
  append = input('ng-select');
  customHeight = input<'0' | '1'>('0');
  labelIconNeeded = input(true);
  dropdownIconNeeded = input(true);
  clearable = input(false);
  searchable = input(false);
  isInvalid = input(false);
  /** override the static list if a caller wants custom sources */
  sources = input<IPayFromSource[]>(PAY_FROM_SOURCES);
  /** render a per-item default star (opt-in; off elsewhere) */
  showDefaultStar = input(false);
  /** id of the item that is the saved default — filled/yellow star */
  defaultItemId = input<string | null>(null);

  changeEvent = output<IPayFromSource | null | undefined>();
  /** a star was clicked — the caller sets this item as the default */
  starClick = output<IPayFromSource>();

  readonly icons = SOURCE_ICONS;
  readonly StarIcon = Star;

  selectedSource: FormControl<IPayFromSource | null | undefined> =
    new FormControl();

  onChange: (value?: IPayFromSource | null) => void = () => {};
  onTouched: () => void = () => {};

  getIcon(key: string): object {
    return this.icons[key] ?? Wallet;
  }

  writeValue(value: IPayFromSource | null | undefined): void {
    if (value?.id) {
      const match = this.sources().find((s) => s.id === value.id);
      this.selectedSource.setValue(match ?? value, { emitEvent: false });
    } else {
      this.selectedSource.setValue(value ?? undefined, { emitEvent: false });
    }
  }

  registerOnChange(fn: (value?: IPayFromSource | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  getChange(value: IPayFromSource | null | undefined): void {
    this.onChange(value);
    this.changeEvent.emit(value);
  }

  /** Star click sets the default and closes the panel (ng-select's own select is suppressed). */
  onStar(event: Event, item: IPayFromSource): void {
    event.stopPropagation();
    event.preventDefault();
    // Favouriting is not a selection: the reference leaves the list open so a
    // second star can be set without reopening it.
    this.starClick.emit(item);
  }
}

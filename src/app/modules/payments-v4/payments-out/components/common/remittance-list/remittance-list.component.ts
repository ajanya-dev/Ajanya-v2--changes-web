import { Component, input, output, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ChevronDown, ChevronUp, LucideAngularModule } from 'lucide-angular';

export interface IRemittanceEntry {
  invoiceNumber?: string;
  invoiceDate?: string;
  itemName?: string;
  itemDescription?: string;
  description?: string;
  grossAmount?: string | number;
  discountAmount?: string | number;
  netAmount?: string | number;
  amount?: string | number;
  thisPayment?: string | number;
}

@Component({
  standalone: true,
  selector: 'app-po-remittance-list',
  templateUrl: './remittance-list.component.html',
  styleUrls: ['./remittance-list.component.scss'],
  imports: [DatePipe, LucideAngularModule]
})
export class PoRemittanceListComponent {
  readonly ChevronDownIcon = ChevronDown;
  readonly ChevronUpIcon = ChevronUp;
  collapsed = signal(false);

  remittanceItems = input<IRemittanceEntry[] | null>(null);
  total = input<string | null>(null);
  maxHeight = input<string | null>('400px');
  /** Embedded flush in a host card: drop our own frame and title header. */
  bare = input(false);
  closed = output<void>();

  toggleFold(): void {
    this.collapsed.update((v) => !v);
  }

  /** Money cell: `$12.00`, or '' so an absent value leaves the cell blank
   * rather than showing a lone `$`. Callers pass the raw API value. */
  money(value?: string | number | null): string {
    return value === null || value === undefined || value === ''
      ? ''
      : `$${value}`;
  }
}

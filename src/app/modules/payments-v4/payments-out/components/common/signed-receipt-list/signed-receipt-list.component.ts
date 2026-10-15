import { Component, input, output, signal } from '@angular/core';
import { ChevronDown, ChevronUp, LucideAngularModule } from 'lucide-angular';
import { PdDateTimeComponent } from 'src/app/shared/V4/pd-date-time/pd-date-time.component';
import { PdEmptyStateComponent } from 'src/app/shared/V4/pd-empty-state/pd-empty-state.component';
import { CommonButtonV4Component } from '../../../../../../shared/V4/buttons/common-button-v4/common-button-v4.component';

export interface ISignedReceiptEntry {
  date: string;
  status: string;
  sentTo: string;
  method: string;
}

@Component({
  standalone: true,
  selector: 'app-po-signed-receipt-list',
  templateUrl: './signed-receipt-list.component.html',
  styleUrls: ['./signed-receipt-list.component.scss'],
  imports: [
    PdEmptyStateComponent,
    CommonButtonV4Component,
    LucideAngularModule,
    PdDateTimeComponent
  ]
})
export class PoSignedReceiptListComponent {
  readonly ChevronDownIcon = ChevronDown;
  readonly ChevronUpIcon = ChevronUp;
  collapsed = signal(false);

  receipts = input<ISignedReceiptEntry[] | null>(null);
  /** Opt-in: renders the icon + title + hint empty state instead of the plain sentence. */
  emptyHint = input('');
  maxHeight = input<string | null>('400px');
  /** Embedded flush in a host card: drop our own frame and title header. */
  bare = input(false);
  signatureUrl = input<string | null>(null);
  paymentReceiptsId = input<string | null>(null);
  isLoading = input(false);
  /** True while the host is resolving the receipt URL after a click. */
  viewing = input(false);

  viewReceipt = output<void>();
  requestSignedReceipt = output<void>();
  sendSignedReceipt = output<void>();
  closed = output<void>();

  toggleFold(): void {
    this.collapsed.update((v) => !v);
  }
}

import { Component, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

export interface ISignedReceiptEntry {
  date: string;
  status: string;
  sentTo: string;
  method: string;
}

@Component({
  standalone: true,
  selector: 'app-signed-receipt-activity-list-v4',
  templateUrl: './signed-receipt-activity-list-v4.component.html',
  styleUrls: ['./signed-receipt-activity-list-v4.component.scss'],
  imports: [LucideAngularModule]
})
export class SignedReceiptActivityListV4Component {
  receipts = input<ISignedReceiptEntry[] | null>(null);
  maxHeight = input<string | null>('400px');
  signatureUrl = input<string | null>(null);
  requestSignedReceipt = output<void>();
  closed = output<void>();
}

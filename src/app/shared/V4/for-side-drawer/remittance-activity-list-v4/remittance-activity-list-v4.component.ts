import { Component, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

export interface IRemittanceActivityEntry {
  invoiceNumber?: string;
  itemName?: string;
  itemDescription?: string;
  itemQuantity?: string;
  itemUnitCost?: string;
  netAmount?: string | number;
  invoiceDate?: string;
}

@Component({
  standalone: true,
  selector: 'app-remittance-activity-list-v4',
  templateUrl: './remittance-activity-list-v4.component.html',
  styleUrls: ['./remittance-activity-list-v4.component.scss'],
  imports: [LucideAngularModule]
})
export class RemittanceActivityListV4Component {
  remittanceItems = input<IRemittanceActivityEntry[] | null>(null);
  total = input<string | null>(null);
  maxHeight = input<string | null>('400px');
  closed = output<void>();
}

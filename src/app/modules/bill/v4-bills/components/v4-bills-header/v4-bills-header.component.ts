import { Component, HostBinding, output } from '@angular/core';
import { V4PageHeaderComponent } from 'src/app/shared/V4/v4-page-header/v4-page-header.component';
import { IV4HeaderAction } from 'src/app/shared/V4/v4-page-header/v4-page-header.model';

@Component({
  selector: 'app-v4-bills-header',
  standalone: true,
  imports: [V4PageHeaderComponent],
  templateUrl: './v4-bills-header.component.html'
})
export class V4BillsHeaderComponent {
  @HostBinding('class') class = 'block';

  newBill = output<void>();
  vendorCredit = output<void>();
  importBills = output<void>();

  readonly headerActions: IV4HeaderAction[] = [
    {
      id: 'import',
      text: 'Import Bills',
      style: 'navy',
      lucideIcon: 'download',
      toolTip: 'Bulk import bills from a file or external source'
    },
    {
      id: 'vendorCredit',
      text: 'Vendor Credit',
      style: 'navy',
      lucideIcon: 'wallet',
      toolTip: 'View and manage vendor credits'
    },
    {
      id: 'new',
      text: 'New Bill',
      style: 'primary',
      lucideIcon: 'plus',
      toolTip: 'Create a new bill'
    }
  ];

  onAction(id: string | number): void {
    if (id === 'import') this.onImportBills();
    if (id === 'vendorCredit') this.onVendorCredit();
    if (id === 'new') this.onNewBill();
  }

  onNewBill(): void {
    this.newBill.emit();
  }

  onVendorCredit(): void {
    this.vendorCredit.emit();
  }

  onImportBills(): void {
    this.importBills.emit();
  }
}

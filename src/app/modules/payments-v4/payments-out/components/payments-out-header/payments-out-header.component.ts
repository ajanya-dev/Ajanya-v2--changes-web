import { Component, HostBinding, inject, output } from '@angular/core';
import { Router } from '@angular/router';
import { V4PageHeaderComponent } from 'src/app/shared/V4/v4-page-header/v4-page-header.component';
import { IV4HeaderAction } from 'src/app/shared/V4/v4-page-header/v4-page-header.model';

@Component({
  selector: 'app-payments-out-header',
  standalone: true,
  imports: [V4PageHeaderComponent],
  templateUrl: './payments-out-header.component.html'
})
export class PaymentsOutHeaderComponent {
  @HostBinding('class') class = 'block';

  private router = inject(Router);

  newClick = output<void>();

  readonly headerActions: IV4HeaderAction[] = [
    { id: 'bulk', text: 'Bulk payments', style: 'navy', lucideIcon: 'layers',toolTip:'Process multiple payments at once – manual entry, Excel import, or saved templates' },
    { id: 'new', text: 'New payment', style: 'primary', lucideIcon: 'plus',toolTip:'Create new payment – Check, ACH, Wire, and more' }
  ];

  onAction(id: string | number): void {
    if (id === 'bulk') this.navigateToBulkPayments();
    if (id === 'new') this.newClick.emit();
  }

  navigateToBulkPayments() {
    this.router.navigate(['/v4/manage/bulk-payments/index']);
  }
}

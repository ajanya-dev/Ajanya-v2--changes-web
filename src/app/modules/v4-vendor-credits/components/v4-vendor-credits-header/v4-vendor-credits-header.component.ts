import { Component, HostBinding, inject, output } from '@angular/core';
import { Router } from '@angular/router';
import { V4PageHeaderComponent } from 'src/app/shared/V4/v4-page-header/v4-page-header.component';
import { IV4HeaderAction } from 'src/app/shared/V4/v4-page-header/v4-page-header.model';

@Component({
  selector: 'app-v4-vendor-credits-header',
  standalone: true,
  imports: [V4PageHeaderComponent],
  templateUrl: './v4-vendor-credits-header.component.html'
})
export class V4VendorCreditsHeaderComponent {
  @HostBinding('class') class = 'block';

  private router = inject(Router);

  newCredit = output<void>();
  backToBills = output<void>();

  readonly headerActions: IV4HeaderAction[] = [
    {
      id: 'billList',
      text: 'Bill List',
      style: 'navy',
      lucideIcon: 'list',
      toolTip: 'View all bills'
    },
    {
      id: 'new',
      text: 'New Vendor Credit',
      style: 'primary',
      lucideIcon: 'plus',
      toolTip: 'Create a new vendor credit'
    }
  ];

  onAction(id: string | number): void {
    if (id === 'billList') this.onBillList();
    if (id === 'new') this.onNewCredit();
  }

  onNewCredit(): void {
    this.newCredit.emit();
  }

  onBackToBills(): void {
    this.router.navigate(['/v4/manage/bill']);
  }

  onBillList(): void {
    this.router.navigate(['/v4/manage/bill/detailed']);
  }
}

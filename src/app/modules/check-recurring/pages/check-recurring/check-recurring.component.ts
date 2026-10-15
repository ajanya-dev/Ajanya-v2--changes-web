import { Component, inject, input } from '@angular/core';
import { AchRecurringListComponent } from '../../components/ach-recurring-list/ach-recurring-list.component';
import { CheckRecurringListComponent } from '../../components/check-recurring-list/check-recurring-list.component';
import { EmailRecurringListComponent } from '../../components/email-recurring-list/email-recurring-list.component';
import { GiftCardRecurringListComponent } from '../../components/gift-card-recurring-list/gift-card-recurring-list.component';
import { ActivatedRoute } from '@angular/router';

/**
 * @description Represents check recurring component.
 */
@Component({
  selector: 'app-check-recurring',
  templateUrl: './check-recurring.component.html',
  styleUrls: ['./check-recurring.component.scss'],
  standalone: true,
  imports: [CheckRecurringListComponent, AchRecurringListComponent, EmailRecurringListComponent, GiftCardRecurringListComponent]
})
export class CheckRecurringComponent {
  table = 1;

  isFromPaymentsV3 = input(false);
  private route = inject(ActivatedRoute);

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const tabParam = params.get('tab');
      if (tabParam && !isNaN(Number(tabParam))) {
        this.table = Number(tabParam);
      }
    });
  }

  onTableChange(ev: number) {
    this.table = ev;
  }
}

import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { RequestAchPaymentsV4Component } from 'src/app/modules/check-recurring/components/request-ach-payments-v4/request-ach-payments-v4.component';
import {
  CommonTabV4Component,
  ITabItem
} from 'src/app/shared/V4/common-tab-v4/common-tab-v4.component';
import { RecurringService } from '../../../../receive-payments/services/recurring.service';
import { AchRecurringV4Component } from '../ach-recurring-v4/ach-recurring-v4.component';
import { GpbfRecurringV4Component } from '../gpbf-recurring-v4/gpbf-recurring-v4.component';

@Component({
  selector: 'app-recurring-v4',
  templateUrl: './recurring-v4.component.html',
  styleUrls: ['./recurring-v4.component.scss'],
  standalone: true,
  imports: [
    CommonTabV4Component,
    GpbfRecurringV4Component,
    AchRecurringV4Component,
    RequestAchPaymentsV4Component
  ]
})
export class RecurringV4Component implements OnInit, OnDestroy {
  private recurringService = inject(RecurringService);
  public activatedRoute = inject(ActivatedRoute);

  getToggleVal: number;

  destroy$ = new Subject();
  activeFilterIndex = 0;
  /** Tab values mirror `activeFilterIndex` — the `?ach=` deep link is numeric. */
  readonly recurringTabs: ITabItem[] = [
    { label: 'Recurring Payment Form', value: '0' },
    { label: 'Recurring ACH', value: '1' },
    { label: 'Request Payments', value: '2' }
  ];

  get activeTabValue(): string {
    return String(this.activeFilterIndex);
  }

  ngOnInit(): void {
    this.getToggleValue();
    this.getCurrentTab();
  }

  getToggleValue() {
    this.recurringService
      .getToggle()
      .pipe(takeUntil(this.destroy$))
      .subscribe((val) => {
        this.getToggleVal = val;
      });
  }

  getCurrentTab() {
    this.activatedRoute.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((val) => {
        if (val?.ach) {
          this.activeFilterIndex = Number(val.ach);
        }
      });
  }

  onTabChange(value: string): void {
    this.activeFilterIndex = Number(value);
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
  }
}

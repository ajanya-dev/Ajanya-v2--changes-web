import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { NgClass } from '@angular/common';
import { RecurringService } from '../../services/recurring.service';
import { AchRecurringComponent } from '../ach-recurring/ach-recurring.component';
import { GpbfRecurringComponent } from '../gpbf-recurring/gpbf-recurring.component';
import { CommonBackButtonV35Component } from '../../../../shared/v3/buttons/common-back-button-v35/common-back-button-v35.component';
import { RequestAchPaymentsComponent } from 'src/app/modules/check-recurring/components/request-ach-payments/request-ach-payments.component';

@Component({
  selector: 'app-recurring',
  templateUrl: './recurring.component.html',
  styleUrls: ['./recurring.component.scss'],
  standalone: true,
  imports: [
    CommonBackButtonV35Component,
    NgClass,
    GpbfRecurringComponent,
    AchRecurringComponent,
    RequestAchPaymentsComponent
  ]
})
export class RecurringComponent implements OnInit, OnDestroy {
  private recurringService = inject(RecurringService);
  public activatedRoute = inject(ActivatedRoute);

  getToggleVal: number;

  destroy$ = new Subject();
  activeFilterIndex = 0;
  paymentsFilterArray = [
    { id: 0, filterName: 'Recurring Payment Form' },
    { id: 1, filterName: 'Recurring ACH' },
    { id: 2, filterName: 'Request Payments' }
  ] as const;

  ngOnInit(): void {
    this.getToggleValue();
    this.getCurrentTab();
  }

  getToggleValue(){
    this.recurringService
      .getToggle()
      .pipe(takeUntil(this.destroy$))
      .subscribe((val) => {
        this.getToggleVal = val;
      });
  }

  getCurrentTab(){
    this.activatedRoute.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((val) => {
        if(val?.ach){
          this.activeFilterIndex = Number(val.ach);
        }
      });
  }

  changeTable(id: (typeof this.paymentsFilterArray)[number]['id']) {
    this.activeFilterIndex = id;
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
  }
}

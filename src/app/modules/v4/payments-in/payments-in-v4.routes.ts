import { Routes } from '@angular/router';
import { PaymentsInPageV4Component } from './pages/payments-in-v4/payments-in-page-v4.component';
import { EpaymentsV4Component } from './pages/epayments/epayments-v4.component';
import { RecurringV4Component } from './components/recurring-v4/recurring-v4.component';
import { OverviewTabV4Component } from './components/overview-tab-v4/overview-tab-v4.component';
import { DetailedTabV4Component } from './components/detailed-tab-v4/detailed-tab-v4.component';

export const paymentsInV4Routes: Routes = [
  {
    path: '',
    component: PaymentsInPageV4Component,
    children: [
      { path: '', redirectTo: 'detailed', pathMatch: 'full' },
      { path: 'overview', component: OverviewTabV4Component },
      { path: 'detailed', component: DetailedTabV4Component },
      { path: 'recurring', component: RecurringV4Component },
      // Legacy deep link — recurring is now a sub-tab inside e-payments.
      { path: 'e-payments/recurring', redirectTo: 'e-payments' },
      { path: 'e-payments', component: EpaymentsV4Component }
    ]
  }
];

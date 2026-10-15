import { Routes } from '@angular/router';
import { PaymentLinksComponent } from './payment-links.component';

export const routes: Routes = [
  {
    path: '',
    component: PaymentLinksComponent,
    children: [
      {
        path: '',
        redirectTo: 'index',
        pathMatch: 'full'
      },
      {
        path: 'index',
        loadComponent: () =>
          import(
            './pages/payment-links-index/payment-links-index.component'
          ).then((c) => c.PaymentLinksIndexComponent)
      },
      {
        path: 'create',
        loadComponent: () =>
          import(
            './pages/payment-links-update/payment-links-update.component'
          ).then((c) => c.PaymentLinksUpdateComponent)
      },
      {
        path: 'update/:id',
        loadComponent: () =>
          import(
            './pages/payment-links-update/payment-links-update.component'
          ).then((c) => c.PaymentLinksUpdateComponent)
      },
      {
        path: 'payment-settings',
        loadComponent: () =>
          import(
            '../payment-link/pages/e-payment-settings/e-payment-settings.component'
          ).then((c) => c.EPaymentSettingsComponent)
      }
    ]
  }
];

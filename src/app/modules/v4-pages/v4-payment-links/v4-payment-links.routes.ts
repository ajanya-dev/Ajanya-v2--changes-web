import { Routes } from '@angular/router';
import { V4PaymentLinksComponent } from './v4-payment-links.component';

export const v4PaymentLinksRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        redirectTo: 'index',
        pathMatch: 'full'
      },
      {
        path: 'index',
        component: V4PaymentLinksComponent
      },
      {
        path: 'create',
        loadComponent: () =>
          import(
            './components/v4-payment-links-create/v4-payment-links-create.component'
          ).then((c) => c.V4PaymentLinksCreateComponent)
      },
      {
        path: 'update/:id',
        loadComponent: () =>
          import(
            './components/v4-payment-links-create/v4-payment-links-create.component'
          ).then((c) => c.V4PaymentLinksCreateComponent)
      },
      {
        path: 'payment-settings',
        loadComponent: () =>
          import(
            './components/v4-e-payment-settings/v4-e-payment-settings.component'
          ).then((c) => c.V4EPaymentSettingsComponent)
      }
    ]
  }
];


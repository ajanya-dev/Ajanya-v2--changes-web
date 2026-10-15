import { Routes } from '@angular/router';

export const internationalPaymentV4Routes: Routes = [
  {
    path: '',
    redirectTo: 'index',
    pathMatch: 'full'
  },
  {
    path: 'index',
    loadComponent: () =>
      import(
        './pages/international-payment-index-v4/international-payment-index-v4.component'
      ).then((m) => m.InternationalPaymentIndexV4Component),
    data: { title: 'International Payment' }
  }
];

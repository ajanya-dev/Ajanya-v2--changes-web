import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import(
        './v4-pages/v4-shipping-label-list/v4-shipping-label-list.component'
      ).then((m) => m.V4ShippingLabelListComponent),
    data: { title: 'Shipping Label' }
  },
  {
    path: 'quick-label',
    loadComponent: () =>
      import('./v4-pages/v4-quick-label/v4-quick-label.component').then(
        (m) => m.V4QuickLabelComponent
      ),
    data: { title: 'Quick Label' }
  },
  {
    path: 'create',
    loadComponent: () =>
      import(
        './v4-pages/v4-create-shipping-label/v4-create-shipping-label.component'
      ).then((m) => m.V4CreateShippingLabelComponent),
    data: { title: 'Create Shipping Label' }
  }
];

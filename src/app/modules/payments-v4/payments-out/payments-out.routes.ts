import { Routes } from '@angular/router';

export const paymentsOutRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./payments-out.component').then((m) => m.PaymentsOutComponent),
    data: { title: 'Payments Out' },
    children: [
      { path: '', redirectTo: 'detailed/all', pathMatch: 'full' },
      {
        path: 'overview',
        loadComponent: () =>
          import('./components/overview-tab/overview-tab.component').then(
            (m) => m.OverviewTabComponent
          )
      },
      { path: 'detailed', redirectTo: 'detailed/all', pathMatch: 'full' },
      {
        path: 'detailed/:filter',
        loadComponent: () =>
          import('./components/detailed-tab/detailed-tab.component').then(
            (m) => m.DetailedTabComponent
          )
      }
    ]
  }
];

import { Routes } from '@angular/router';

export const recentTransactionRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./recent-transaction.component').then((m) => m.RecentTransactionComponent)
  }
];

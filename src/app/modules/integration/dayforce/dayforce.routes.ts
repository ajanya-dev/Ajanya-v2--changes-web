import { Routes } from '@angular/router';

export const dayforceRoutes: Routes = [
  { path: '', redirectTo: 'index', pathMatch: 'full' },
  {
    path: 'index',
    loadComponent: () =>
      import('./pages/dayforce-home/dayforce-home.component').then(
        (c) => c.DayforceHomeComponent
      ),
    data: { title: 'Dayforce Home' }
  }
];

import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'index', pathMatch: 'full' },
  {
    path: 'index',
    loadComponent: () =>
      import('./verification-center-v4.component').then(
        (m) => m.VerificationCenterV4Component
      )
  }
];

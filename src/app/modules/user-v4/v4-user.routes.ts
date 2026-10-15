import { Routes } from '@angular/router';

export const v4UserRoutes: Routes = [
  { path: '', redirectTo: 'index', pathMatch: 'full' },
  {
    path: 'index',
    loadComponent: () =>
      import('./pages/v4-user-profile/v4-user-profile.component').then(
        (m) => m.V4UserProfileComponent
      ),
    data: { title: 'My Profile' }
  },
  {
    path: 'changepassword',
    loadComponent: () =>
      import('./pages/v4-user-profile/v4-user-profile.component').then(
        (m) => m.V4UserProfileComponent
      ),
    data: { title: 'My Profile' }
  },
  {
    path: 'verify-business',
    loadComponent: () =>
      import(
        './pages/v4-verification-index/v4-verification-index.component'
      ).then((m) => m.V4VerificationIndexComponent),
    data: { title: 'Business Verification' }
  },
  {
    path: 'user-settings',
    loadComponent: () =>
      import('./pages/v4-user-settings/v4-user-settings.component').then(
        (m) => m.V4UserSettingsComponent
      ),
    data: { title: 'App Settings' }
  }
];

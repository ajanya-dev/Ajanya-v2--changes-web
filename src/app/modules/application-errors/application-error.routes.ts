import { Routes } from '@angular/router';
import { ApplicationErrorListComponent } from './pages/application-error-list/application-error-list.component';

export const applicationErrorRoutes: Routes = [
  {
    path: '',
    redirectTo: 'index',
    pathMatch: 'full'
  },
  {
    path: 'index',
    component: ApplicationErrorListComponent
  }
];

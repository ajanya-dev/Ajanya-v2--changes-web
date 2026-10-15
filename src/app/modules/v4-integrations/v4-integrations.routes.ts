import { Routes } from '@angular/router';
import { V4IntegrationMainComponent } from './pages/v4-integration-main/v4-integration-main.component';

export const v4IntegrationsRoutes: Routes = [
  { path: '', redirectTo: 'index', pathMatch: 'full' },
  {
    path: 'index',
    component: V4IntegrationMainComponent,
    data: { title: 'App Integrations' }
  }
];

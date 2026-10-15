import { Routes } from '@angular/router';

export const v4DeveloperPanelRoutes: Routes = [
  {
    path: '',
    redirectTo: 'index',
    pathMatch: 'full'
  },
  {
    path: 'index',
    loadComponent: () =>
      import(
        './pages/v4-developer-panel-main/v4-developer-panel-main.component'
      ).then((c) => c.V4DeveloperPanelMainComponent)
  },
  {
    path: 'api-logs',
    loadComponent: () =>
      import('./pages/api-logs-v4/api-logs-v4.component').then(
        (c) => c.ApiLogsV4Component
      )
  },
  {
    path: 'webhook-logs',
    loadComponent: () =>
      import('./pages/webhook-logs-v4/webhook-logs-v4.component').then(
        (c) => c.WebhookLogsV4Component
      )
  }
];

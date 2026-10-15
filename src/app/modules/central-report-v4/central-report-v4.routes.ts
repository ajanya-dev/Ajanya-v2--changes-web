import { Routes } from '@angular/router';

export const centralReportV4Routes: Routes = [
  { path: '', redirectTo: 'index', pathMatch: 'full' },
  {
    path: 'index',
    loadComponent: () =>
      import(
        './pages/central-report-list-v4/central-report-list-v4.component'
      ).then((m) => m.CentralReportListV4Component),
    data: { title: 'Central Report' }
  }
];

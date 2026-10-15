import { Routes } from '@angular/router';

export const COMPANY_MANAGEMENT_V4_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import(
        './v4-pages/company-management-v4/company-management-v4.component'
      ).then((m) => m.CompanyManagementV4Component),
    data: { title: 'Company Management' }
  }
];

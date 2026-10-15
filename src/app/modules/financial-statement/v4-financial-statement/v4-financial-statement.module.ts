import { Routes } from '@angular/router';
import { FinancialStatementListV4Component } from './pages/financial-statement-list-v4/financial-statement-list-v4.component';

export const financialStatementV4Routes: Routes = [
  {
    path: '',
    redirectTo: 'index',
    pathMatch: 'full'
  },

  {
    path: 'index',
    component: FinancialStatementListV4Component
  }
];

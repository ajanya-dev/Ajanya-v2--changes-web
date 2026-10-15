import { Routes } from '@angular/router';

export const cashExpenseV4Routes: Routes = [
  { path: '', redirectTo: 'index', pathMatch: 'full' },
  {
    path: 'index',
    loadComponent: () =>
      import(
        './pages/cash-expense-v4-main/cash-expense-v4-main.component'
      ).then((m) => m.CashExpenseV4MainComponent),
    data: { title: 'Cash Expense' }
  }
];

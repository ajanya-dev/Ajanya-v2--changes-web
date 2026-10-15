import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/bank-data-v4-page/bank-data-v4-page.component').then(
        (c) => c.BankDataV4PageComponent
      ),
    data: { title: 'Bank Data' },
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      {
        path: 'overview',
        loadComponent: () =>
          import(
            './pages/tabs/overview-tab/bank-data-v4-overview-tab.component'
          ).then((c) => c.BankDataV4OverviewTabComponent)
      },
      {
        path: 'transactions',
        loadComponent: () =>
          import(
            './pages/tabs/transactions-tab/bank-data-v4-transactions-tab.component'
          ).then((c) => c.BankDataV4TransactionsTabComponent)
      },
      {
        path: 'rules',
        loadComponent: () =>
          import(
            './pages/tabs/rules-tab/bank-data-v4-rules-tab.component'
          ).then((c) => c.BankDataV4RulesTabComponent)
      },
      {
        path: 'accounts',
        loadComponent: () =>
          import(
            './pages/tabs/accounts-tab/bank-data-v4-accounts-tab.component'
          ).then((c) => c.BankDataV4AccountsTabComponent)
      },
      {
        path: 'company',
        loadComponent: () =>
          import(
            './pages/tabs/company-tab/bank-data-v4-company-tab.component'
          ).then((c) => c.BankDataV4CompanyTabComponent)
      },
      {
        path: 'category',
        loadComponent: () =>
          import(
            './pages/tabs/category-tab/bank-data-v4-category-tab.component'
          ).then((c) => c.BankDataV4CategoryTabComponent)
      }
    ]
  }
];

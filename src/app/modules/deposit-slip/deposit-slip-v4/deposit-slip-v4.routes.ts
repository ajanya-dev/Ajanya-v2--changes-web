import { Routes } from '@angular/router';

export const depositSlipV4Routes: Routes = [
  {
    path: '',
    redirectTo: 'index',
    pathMatch: 'full'
  },
  {
    path: 'index',
    loadComponent: () =>
      import(
        './v4-pages/deposit-slip-index-v4/deposit-slip-index-v4.component'
      ).then((m) => m.DepositSlipIndexV4Component),
    data: { title: 'Deposit Slip' }
  },
  {
    path: 'create',
    loadComponent: () =>
      import(
        './v4-pages/create-deposit-slip-v4/create-deposit-slip-v4.component'
      ).then((m) => m.CreateDepositSlipV4Component),
    data: { title: 'Create Deposit Slip', mode: 'create' }
  },
  {
    path: 'edit/:slipId',
    loadComponent: () =>
      import(
        './v4-pages/create-deposit-slip-v4/create-deposit-slip-v4.component'
      ).then((m) => m.CreateDepositSlipV4Component),
    data: { title: 'Edit Deposit Slip', mode: 'edit' }
  },
  {
    path: 'clone/:slipId',
    loadComponent: () =>
      import(
        './v4-pages/create-deposit-slip-v4/create-deposit-slip-v4.component'
      ).then((m) => m.CreateDepositSlipV4Component),
    data: { title: 'Clone Deposit Slip', mode: 'clone' }
  }
];

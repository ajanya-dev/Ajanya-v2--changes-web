import { Routes } from '@angular/router';
import { WalletOcwV4Component } from './v4-pages/wallet-ocw-v4/wallet-ocw-v4.component';
import { PrenoteAchTransactionV4Component } from './v4-components/prenote-ach-transaction-v4/prenote-ach-transaction-v4.component';

export const walletV4Routes: Routes = [
  {
    path: '',
    component: WalletOcwV4Component
  },
  {
    path: 'index',
    component: WalletOcwV4Component
  },
  {
    path: 'prenote-ach',
    component: PrenoteAchTransactionV4Component
  }
];

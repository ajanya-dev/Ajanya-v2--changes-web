import { Routes } from '@angular/router';
import { BankOcwV4Component } from './v4-pages/bank-ocw-v4/bank-ocw-v4.component';

export const bankV4Routes: Routes = [
  {
    path: '',
    component: BankOcwV4Component
  },
  {
    path: 'index',
    component: BankOcwV4Component
  }
];

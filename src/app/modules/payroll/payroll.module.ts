import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PayrollComponent } from './pages/payroll/payroll.component';
import { RouterModule, Routes } from '@angular/router';
import { PaymyrollComponent } from './pages/paymyroll/paymyroll.component';

const routes: Routes = [
  { path: '', redirectTo: 'index', pathMatch: 'full' },
  {
    path: 'index',
    component: PayrollComponent,
    data: { title: 'Payroll ' }
  },
  {
    path: 'paymyroll',
    component: PaymyrollComponent,
    data: { title: 'Paymyroll ' }
  }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    PayrollComponent,
    PaymyrollComponent
  ]
})
export class PayrollModule {}

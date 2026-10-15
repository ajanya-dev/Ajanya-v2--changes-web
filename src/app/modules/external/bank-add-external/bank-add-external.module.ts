import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { YodleeOutsideComponent } from './pages/yodlee-outside/yodlee-outside.component';
import { RouterModule, Routes } from '@angular/router';
import { BankSharedModule } from '../../bank/bank-v2/shared/bank-shared.module';
import { YodleeModule } from 'src/app/shared/yodlee/yodlee.module';

const routes: Routes = [
  {
    path: '',
    component: YodleeOutsideComponent
  }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    YodleeModule,
    BankSharedModule,
    YodleeOutsideComponent
  ]
})
export class BankAddExternalModule {}

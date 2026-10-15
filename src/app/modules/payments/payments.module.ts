import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AngularMaterialModule } from '../angular-material/angular-material.module';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { SharedModule } from 'src/app/shared/shared.module';
import { PaymentsPageComponent } from './pages/payments-page/payments-page.component';
import { RouterModule, Routes } from '@angular/router';
import { PaymentSharedModule } from './shared/payment-shared.module';
import { CloudAccountDropdownV35Component } from 'src/app/shared/components/v3/drop-downs/cloud-account-dropdown-v35/cloud-account-dropdown-v35.component';

const routes: Routes = [
  {
    path: 'main/:type1/:type2/:type3',
    component: PaymentsPageComponent,
    data: { title: 'Payments' }
  },
  {
    path: 'main/:mode/:id',
    component: PaymentsPageComponent,
    data: { title: 'Payments' }
  },
  {
    path: 'main',
    component: PaymentsPageComponent,
    data: { title: 'Home Page' }
  }
];
@NgModule({
  imports: [
    CommonModule,
    AngularMaterialModule,
    FormsModule,
    NgSelectModule,
    SharedModule,
    PaymentSharedModule,
    RouterModule.forChild(routes),
    CloudAccountDropdownV35Component,
    PaymentsPageComponent
  ],
  exports: []
})
export class PaymentsModule {}

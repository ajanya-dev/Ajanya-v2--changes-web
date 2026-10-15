import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { StackVendorComponent } from './pages/stack-vendor/stack-vendor.component';
import { RedeemComponent } from './pages/redeem/redeem.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

const routes: Routes = [
  {
    path: 'stack-vendor',
    component: StackVendorComponent,
    pathMatch: 'full'
  },
  {
    path: 'redeem',
    component: RedeemComponent
  }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    FormsModule,
    ReactiveFormsModule,
    StackVendorComponent,
    RedeemComponent
  ]
})
export class CouponModule {}

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { SharedModule } from 'src/app/shared/shared.module';
import { NgxMaskDirective, NgxMaskPipe } from 'ngx-mask';
import { OcwBackButtonComponent } from 'src/app/shared/components/ocw-back-button/ocw-back-button.component';
import { AmountInputComponent } from 'src/app/shared/components/amount-input/amount-input.component';
import { faCircleCheck, faTimes } from '@fortawesome/pro-solid-svg-icons';
import {
  FaIconLibrary,
  FontAwesomeModule
} from '@fortawesome/angular-fontawesome';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PipesModule } from 'src/app/pipes/pipes.module';
import { FeatureApplyCouponModalComponent } from './modals/feature-apply-coupon-modal/feature-apply-coupon-modal.component';
import { UpdateCardComponent } from './pages/update-card/update-card.component';
import { RefillCreditRechargeModalComponent } from './modals/refill-credit-recharge-modal/refill-credit-recharge-modal.component';
import { RefillCreditComponent } from './pages/refill-credit/refill-credit.component';

const routes: Routes = [
  { path: '', redirectTo: 'show-refillform', pathMatch: 'full' },
  {
    path: 'show-refillform',
    component: RefillCreditComponent,
    data: { title: 'Recharge My Credits' }
  },
  {
    path: 'update-card',
    component: UpdateCardComponent,
    data: { title: 'Update Card' }
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    AmountInputComponent,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    MatDialogModule,
    SharedModule,
    OcwBackButtonComponent,
    NgxMaskDirective,
    NgxMaskPipe,
    CommonButtonV35Component,
    FontAwesomeModule,
    MatTooltipModule,
    PipesModule,
    RefillCreditComponent,
    RefillCreditRechargeModalComponent,
    UpdateCardComponent,
    FeatureApplyCouponModalComponent
  ]
})
export class RefillCreditModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(faTimes, faCircleCheck);
  }
}

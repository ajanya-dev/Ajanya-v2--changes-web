import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardPaymentModalComponent } from './card-payment-modal/card-payment-modal.component';
import { AngularMaterialModule } from 'src/app/modules/angular-material/angular-material.module';
import { NgxMaskDirective, NgxMaskPipe } from 'ngx-mask';
import { StripeModule } from 'stripe-angular';
import { SharedModule } from '../../shared.module';

@NgModule({
  imports: [
    CommonModule,
    AngularMaterialModule,
    NgxMaskDirective,
    NgxMaskPipe,
    StripeModule.forRoot(''),
    SharedModule,
    CardPaymentModalComponent
  ]
})
export class CardPaymentModalModule {}

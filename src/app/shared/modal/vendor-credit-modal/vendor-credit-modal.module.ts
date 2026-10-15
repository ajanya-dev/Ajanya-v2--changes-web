import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NewVendorCreditModalComponent } from './new-vendor-credit-modal/new-vendor-credit-modal.component';
import { AngularMaterialModule } from 'src/app/modules/angular-material/angular-material.module';
import { SharedModule } from '../../shared.module';
import { DropDownCategoryComponent } from '../../components/drop-downs/drop-down-category/drop-down-category.component';
import { DropDownBankComponent } from '../../components/drop-downs/drop-down-bank/drop-down-bank.component';
import { DropDownPayeeComponent } from '../../components/drop-downs/drop-down-payee/drop-down-payee.component';
import { NgxMaskDirective, NgxMaskPipe } from 'ngx-mask';
import { AmountInputComponent } from '../../components/amount-input/amount-input.component';

@NgModule({
  imports: [
    CommonModule,
    AngularMaterialModule,
    SharedModule,
    DropDownPayeeComponent,
    AmountInputComponent,
    DropDownBankComponent,
    DropDownCategoryComponent,
    NgxMaskDirective,
    NgxMaskPipe,
    NewVendorCreditModalComponent
  ]
})
export class VendorCreditModalModule {}

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CreateBankOptionsModalComponent } from '../modals/create-bank-options-modal/create-bank-options-modal.component';
import { AngularMaterialModule } from '../../../angular-material/angular-material.module';

@NgModule({
  imports: [
    CommonModule,
    AngularMaterialModule,
    CreateBankOptionsModalComponent
  ],
  exports: [CreateBankOptionsModalComponent]
})
export class BankSharedModule {}

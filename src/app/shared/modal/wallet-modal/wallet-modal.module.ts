import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AngularMaterialModule } from 'src/app/modules/angular-material/angular-material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { WhiteLabelPipe } from 'src/app/pipes/white-label.pipe';
import { WalletActionViewModalComponent } from './wallet-action-view-modal/wallet-action-view-modal.component';
import { SharedModule } from '../../shared.module';

import { DropDownBankComponent } from '../../components/drop-downs/drop-down-bank/drop-down-bank.component';
import { DropDownBankProComponent } from '../../components/drop-downs/drop-down-bank-pro/drop-down-bank-pro.component';
import { AmountInputComponent } from '../../components/amount-input/amount-input.component';

@NgModule({
  imports: [
    CommonModule,
    AngularMaterialModule,
    SharedModule,
    DropDownBankProComponent,
    DropDownBankComponent,
    FormsModule,
    ReactiveFormsModule,
    NgSelectModule,
    AmountInputComponent,
    WhiteLabelPipe,
    WalletActionViewModalComponent
  ]
})
export class WalletModalModule {}

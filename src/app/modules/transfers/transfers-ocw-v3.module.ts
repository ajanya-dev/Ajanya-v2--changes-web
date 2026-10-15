import { NgModule } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/shared/shared.module';
import { NgSelectModule } from '@ng-select/ng-select';
import { DropDownWalletComponent } from 'src/app/shared/components/drop-downs/drop-down-wallet/drop-down-wallet.component';
import { DropDownBankComponent } from 'src/app/shared/components/drop-downs/drop-down-bank/drop-down-bank.component';
import { NgxMaskDirective, NgxMaskPipe } from 'ngx-mask';
import { BankAcDropdownV3Component } from 'src/app/shared/components/v3/drop-downs/bank-ac-dropdown-v3/bank-ac-dropdown-v3.component';
import { WalletDropdownV3Component } from 'src/app/shared/components/v3/drop-downs/wallet-dropdown-v3/wallet-dropdown-v3.component';
import { CloudAccountDropdownV35Component } from 'src/app/shared/components/v3/drop-downs/cloud-account-dropdown-v35/cloud-account-dropdown-v35.component';
import {
  FontAwesomeModule,
  FaIconLibrary
} from '@fortawesome/angular-fontawesome';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { AmountInputComponent } from 'src/app/shared/components/amount-input/amount-input.component';
import {
  faArrowDown,
  faCircleArrowDown
} from '@fortawesome/pro-solid-svg-icons';
import { CommonBackButtonV35Component } from 'src/app/shared/v3/buttons/common-back-button-v35/common-back-button-v35.component';
import { TransfersMainComponent } from './pages/transfers-main/transfers-main.component';
import { AngularMaterialModule } from '../angular-material/angular-material.module';

const routes: Routes = [
  { path: '', redirectTo: 'index', pathMatch: 'full' },
  { path: 'index', component: TransfersMainComponent }
];

@NgModule({
  imports: [
    CommonModule,
    AngularMaterialModule,
    RouterModule.forChild(routes),
    FormsModule,
    NgSelectModule,
    AmountInputComponent,
    NgxMaskDirective,
    NgxMaskPipe,
    SharedModule,
    BankAcDropdownV3Component,
    WalletDropdownV3Component,
    CloudAccountDropdownV35Component,
    FontAwesomeModule,
    DropDownBankComponent,
    DropDownWalletComponent,
    CommonButtonV35Component,
    CommonBackButtonV35Component,
    NgOptimizedImage,
    TransfersMainComponent
  ]
})
export class TransfersOcwV3Module {
  constructor(library: FaIconLibrary) {
    library.addIcons(faArrowDown, faCircleArrowDown);
  }
}

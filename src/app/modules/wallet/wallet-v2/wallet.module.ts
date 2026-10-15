import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { MatExpansionModule } from '@angular/material/expansion';
import { AngularMaterialModule } from '../../angular-material/angular-material.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PayeeModalModule } from 'src/app/shared/modal/payee-modal/payee-modal.module';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgxMaskDirective, NgxMaskPipe } from 'ngx-mask';
import { DataTableModule } from '../../data-table/data-table.module';
import { WalletModalModule } from 'src/app/shared/modal/wallet-modal/wallet-modal.module';
import { CardPaymentModalModule } from 'src/app/shared/modal/card-payment-modal/card-payment-modal.module';
import { SearchFilterPipe } from 'src/app/pipes/search-filter.pipe';
import { PipesModule } from 'src/app/pipes/pipes.module';

import { DownloadWireTransferFormComponent } from './modals/download-wire-transfer-form/download-wire-transfer-form.component';
import { TransactionTypeComponent } from './components/dt-components/transaction-type';
import { TransferFundsComponent } from './modals/transfer-funds/transfer-funds.component';
import { DropDownBankProComponent } from 'src/app/shared/components/drop-downs/drop-down-bank-pro/drop-down-bank-pro.component';
import { DropDownBankComponent } from 'src/app/shared/components/drop-downs/drop-down-bank/drop-down-bank.component';
import { WhiteLabelPipe } from '../../../pipes/white-label.pipe';
import { AmountInputComponent } from 'src/app/shared/components/amount-input/amount-input.component';
import {
  faCalculator,
  faCalendar,
  faCircle,
  faCircleInfo,
  faMagnifyingGlass,
  faPaperclip,
  faPlus,
  faQuestionCircle,
  faTrash
} from '@fortawesome/pro-solid-svg-icons';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'transactions',
    pathMatch: 'full'
  }
];

@NgModule({
  providers: [SearchFilterPipe],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    MatExpansionModule,
    FormsModule,
    ReactiveFormsModule,
    AngularMaterialModule,
    SharedModule,
    AmountInputComponent,
    DropDownBankComponent,
    DropDownBankProComponent,
    PayeeModalModule,
    NgSelectModule,
    DataTableModule,
    NgxMaskDirective,
    NgxMaskPipe,
    WalletModalModule,
    CardPaymentModalModule,
    PipesModule,
    WhiteLabelPipe,
    DownloadWireTransferFormComponent,
    TransferFundsComponent,
    TransactionTypeComponent
  ]
})
export class WalletModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(
      faPlus,
      faTrash,
      faMagnifyingGlass,
      faCircleInfo,
      faCalendar,
      faCircle,
      faCalculator,
      faQuestionCircle,
      faPaperclip
    );
  }
}

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { SharedModule } from 'src/app/shared/shared.module';
import { NgxMaskDirective, NgxMaskPipe } from 'ngx-mask';
import { PipesModule } from 'src/app/pipes/pipes.module';
import { CardPaymentModalModule } from 'src/app/shared/modal/card-payment-modal/card-payment-modal.module';

import { V3ModeOfTransferComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-mode-of-transfer/v3-mode-of-transfer.component';
import { V3NoRowsToShowOverlayComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-no-rows-to-show-overlay/v3-no-rows-to-show-overlay.component';
import { V3PayeeNameComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-payee-name/v3-payee-name.component';
import { V3StatusComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-status/v3-status.component';
import { V3UpdatedAtComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-updated-at/v3-updated-at.component';
import { V3ActionButtonComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-action-button/v3-action-button.component';
import { V3ViewButtonComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-view-button/v3-view-button.component';
import { CommonLayoutV35Component } from 'src/app/layout/v3-layout/common-layout-v35/common-layout-v35.component';
import { ListHeaderV35Component } from 'src/app/shared/v3/common-components/list-header-v35/list-header-v35.component';
import {
  FaIconLibrary,
  FontAwesomeModule
} from '@fortawesome/angular-fontawesome';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { CommonListSkeltonComponent } from 'src/app/shared/v3/common-components/common-list-skelton/common-list-skelton.component';
import { V35CommonDropDownSelectorComponent } from 'src/app/shared/v3/v35-dropdown/v35-common-dropdown-selector.component';
import { CommonInputFieldComponent } from 'src/app/shared/v3/common-input-field/common-input-field.component';
import { BankAcDropdownV3Component } from 'src/app/shared/components/v3/drop-downs/bank-ac-dropdown-v3/bank-ac-dropdown-v3.component';
import { WalletDropdownV3Component } from 'src/app/shared/components/v3/drop-downs/wallet-dropdown-v3/wallet-dropdown-v3.component';
import { V35ControlMessageComponent } from 'src/app/shared/v3/control-message-v35/control-message-v35.component';
import { ScrollListenerDirective } from 'src/app/directive/scroll-listner.directive';
import {
  faEllipsisVertical,
  faGear,
  faLock,
  faQuestionCircle,
  faWallet,
  faXmark
} from '@fortawesome/pro-solid-svg-icons';
import { AmountInputComponent } from 'src/app/shared/components/amount-input/amount-input.component';
import { DemoVideoComponent } from 'src/app/shared/components/demo-video/demo-video.component';
import { CdkDrag, CdkDropList } from '@angular/cdk/drag-drop';
import { V3DataTableModule } from '../../v3-data-table/v3-data-table.module';
import { DataTableModule } from '../../data-table/data-table.module';
import { AngularMaterialModule } from '../../angular-material/angular-material.module';
import { WalletHomeOcwV3Component } from './pages/wallet-home-ocw-v3/wallet-home-ocw-v3.component';
import { V3CommonTransactionTableModule } from '../../v3-common-transactions-table/v3-common-transaction-table.module';
import { WalletListV35Component } from './components-V35/wallet-list-v35/wallet-list-v35.component';
import { WalletDetailsV35Component } from './components-V35/wallet-details-v35/wallet-details-v35.component';
import { WalletTransactionsV35Component } from './components-V35/wallet-transactions-v35/wallet-transactions-v35.component';
import { WithdrawFundsV35Component } from './modals-v35/withdraw-funds-v35/withdraw-funds-v35.component';
import { FundYourWalletV35Component } from './modals-v35/fund-your-wallet-v35/fund-your-wallet-v35.component';
import { RechargeMyCreditV35Component } from './modals-v35/recharge-my-credit-v35/recharge-my-credit-v35.component';
import { WalletSettingV35Component } from './modals-v35/wallet-setting-v35/wallet-setting-v35.component';
import { WireTypeV35Component } from './modals-v35/wire-type-v35/wire-type-v35.component';
import { AchRequestDataTableComponent } from './components-V35/ach-request-data-table/ach-request-data-table.component';
import { AchRequestViewComponent } from './components-V35/ach-request-view/ach-request-view.component';
import { ManualAchRequestDataTableComponent } from './components-V35/ach-request-data-table-new/manual-ach-request-data-table.component';
import { ZelleTransactionTableComponent } from './components-V35/zelle-transaction-table/zelle-transaction-table.component';
import { CreateCardComponent } from './pages/create-card/create-card.component';
import { ManageCardV35Component } from './components-V35/manage-card-v35/manage-card-v35.component';
import { PrenoteAchTransactionComponent } from './components-V35/prenote-ach-transaction/prenote-ach-transaction.component';

const routes: Routes = [
  { path: '', redirectTo: 'transactions', pathMatch: 'full' },
  {
    path: 'transactions',
    component: WalletHomeOcwV3Component,
    data: { title: 'Wallets' }
  },
  {
    path: 'ach/request',
    component: AchRequestDataTableComponent,
    data: { title: 'Wallets' }
  },
  {
    path: 'view/:id',
    component: AchRequestViewComponent,
    data: { title: 'Wallets' }
  },
  {
    path: 'manual-ach/request',
    component: ManualAchRequestDataTableComponent,
    data: { title: 'Wallets' }
  },
  {
    path: 'zelle/transactions',
    component: ZelleTransactionTableComponent,
    data: { title: 'Wallets' }
  },
  {
    path: 'card/create-card',
    component: CreateCardComponent,
    data: { title: 'Wallets' }
  },
  {
    path: 'card/all',
    component: ManageCardV35Component,
    data: { title: 'Wallets' }
  },
  {
    path: 'prenote-ach',
    component: PrenoteAchTransactionComponent,
    data: { title: 'Wallets' }
  }
];

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule.forChild(routes),
    AngularMaterialModule,
    HttpClientModule,
    DataTableModule,
    AmountInputComponent,
    SharedModule,
    NgxMaskDirective,
    NgxMaskPipe,
    PipesModule,
    CardPaymentModalModule,
    DemoVideoComponent,
    V3DataTableModule,
    V3ModeOfTransferComponent,
    V3NoRowsToShowOverlayComponent,
    V3UpdatedAtComponent,
    V3StatusComponent,
    V3PayeeNameComponent,
    V3ActionButtonComponent,
    V3ViewButtonComponent,
    V3CommonTransactionTableModule,
    CommonLayoutV35Component,
    ListHeaderV35Component,
    FontAwesomeModule,
    CommonListSkeltonComponent,
    CommonButtonV35Component,
    V35CommonDropDownSelectorComponent,
    CommonInputFieldComponent,
    WalletDropdownV3Component,
    BankAcDropdownV3Component,
    V35ControlMessageComponent,
    ScrollListenerDirective,
    CdkDropList,
    CdkDrag,
    WalletHomeOcwV3Component,
    WalletListV35Component,
    WalletDetailsV35Component,
    WalletTransactionsV35Component,
    WithdrawFundsV35Component,
    FundYourWalletV35Component,
    RechargeMyCreditV35Component,
    WalletSettingV35Component,
    WireTypeV35Component
  ]
})
export class WalletOcwV3Module {
  constructor(library: FaIconLibrary) {
    library.addIcons(
      faGear,
      faEllipsisVertical,
      faLock,
      faWallet,
      faXmark,
      faQuestionCircle
    );
  }
}

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { SharedModule } from 'src/app/shared/shared.module';
import { NgxMaskDirective, NgxMaskPipe } from 'ngx-mask';
import { PipesModule } from 'src/app/pipes/pipes.module';

import { V3ActionButtonComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-action-button/v3-action-button.component';
import { V3ModeOfTransferComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-mode-of-transfer/v3-mode-of-transfer.component';
import { V3NoRowsToShowOverlayComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-no-rows-to-show-overlay/v3-no-rows-to-show-overlay.component';
import { V3PayeeNameComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-payee-name/v3-payee-name.component';
import { V3StatusComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-status/v3-status.component';
import { V3UpdatedAtComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-updated-at/v3-updated-at.component';
import { V3ViewButtonComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-view-button/v3-view-button.component';
import { CommonLayoutV35Component } from 'src/app/layout/v3-layout/common-layout-v35/common-layout-v35.component';
import { CommonListSkeltonComponent } from 'src/app/shared/v3/common-components/common-list-skelton/common-list-skelton.component';
import { V35CommonDropDownSelectorComponent } from 'src/app/shared/v3/v35-dropdown/v35-common-dropdown-selector.component';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { ListViewToggleComponent } from 'src/app/shared/v3/common-components/list-view-toggle/list-view-toggle.component';
import { ListHeaderV35Component } from 'src/app/shared/v3/common-components/list-header-v35/list-header-v35.component';
import {
  FaIconLibrary,
  FontAwesomeModule
} from '@fortawesome/angular-fontawesome';
import {
  faArrowDownToLine,
  faArrowUpToLine,
  faBadgeCheck,
  faBallotCheck,
  faBuildingColumns,
  faCircle,
  faCircleCheck,
  faClone,
  faEdit,
  faEllipsisVertical,
  faExchange,
  faEye,
  faEyeSlash,
  faPencil,
  faPlus,
  faTrash,
  faTriangleExclamation,
  faWallet
} from '@fortawesome/pro-solid-svg-icons';
import { ScrollListenerDirective } from 'src/app/directive/scroll-listner.directive';
import { DemoVideoComponent } from 'src/app/shared/components/demo-video/demo-video.component';
import { CheckDesignModule } from '../../check-design/check-design.module';
import { V3DataTableModule } from '../../v3-data-table/v3-data-table.module';
import { V3CommonTransactionTableModule } from '../../v3-common-transactions-table/v3-common-transaction-table.module';
import { DataTableModule } from '../../data-table/data-table.module';
import { AngularMaterialModule } from '../../angular-material/angular-material.module';
import { BankAccountsListOcwV35Component } from './v35-components/bank-accounts-list-ocw-v35/bank-accounts-list-ocw-v35.component';
import { BankAccountsDetailsOcwV35Component } from './v35-components/bank-accounts-details-ocw-v35/bank-accounts-details-ocw-v35.component';
import { BankAccountsTransactionsOcwV35Component } from './v35-components/bank-accounts-transactions-ocw-v35/bank-accounts-transactions-ocw-v35.component';
import { BankAccountsDataTableV35Component } from './v35-components/bank-accounts-data-table-v35/bank-accounts-data-table-v35.component';
import { BankOcwV35Component } from './v35-pages/bank-ocw-v35/bank-ocw-v35.component';
import { V35BankAccountsDataTableActionsComponent } from './v35-components/v35-bank-accounts-data-table-actions/v35-bank-accounts-data-table-actions.component';
import { WhiteLabelPipe } from '../../../pipes/white-label.pipe';
import { CdkDrag, CdkDropList } from '@angular/cdk/drag-drop';

const routes: Routes = [
  { path: '', redirectTo: 'index', pathMatch: 'full' },
  {
    path: 'index',
    component: BankOcwV35Component,
    data: { title: 'Bank Accounts ' }
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
    SharedModule,
    NgxMaskDirective,
    NgxMaskPipe,
    PipesModule,
    CheckDesignModule,
    DemoVideoComponent,
    V3DataTableModule,
    V3ActionButtonComponent,
    V3ModeOfTransferComponent,
    V3NoRowsToShowOverlayComponent,
    V3ViewButtonComponent,
    V3UpdatedAtComponent,
    V3StatusComponent,
    CdkDropList,
    CdkDrag,
    V3PayeeNameComponent,
    V3CommonTransactionTableModule,
    CommonLayoutV35Component,
    ListHeaderV35Component,
    CommonListSkeltonComponent,
    V35CommonDropDownSelectorComponent,
    CommonButtonV35Component,
    ListViewToggleComponent,
    FontAwesomeModule,
    WhiteLabelPipe,
    ScrollListenerDirective,
    BankAccountsListOcwV35Component,
    BankAccountsDetailsOcwV35Component,
    BankAccountsTransactionsOcwV35Component,
    BankAccountsDataTableV35Component,
    BankOcwV35Component,
    V35BankAccountsDataTableActionsComponent
  ]
})
export class BankOcwV3Module {
  constructor(library: FaIconLibrary) {
    library.addIcons(
      faTrash,
      faEllipsisVertical,
      faArrowUpToLine,
      faWallet,
      faBuildingColumns,
      faCircleCheck,
      faTriangleExclamation,
      faArrowDownToLine,
      faEye,
      faEyeSlash,
      faCircle,
      faEdit,
      faPencil,
      faExchange,
      faClone,
      faBallotCheck,
      faPlus,
      faBadgeCheck
    );
  }
}

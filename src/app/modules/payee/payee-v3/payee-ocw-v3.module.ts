import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { PipesModule } from 'src/app/pipes/pipes.module';
import { HttpClientModule } from '@angular/common/http';
import { SharedModule } from 'src/app/shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxMaskDirective, NgxMaskPipe } from 'ngx-mask';

import { V3ActionButtonComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-action-button/v3-action-button.component';
import { V3ModeOfTransferComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-mode-of-transfer/v3-mode-of-transfer.component';
import { V3NoRowsToShowOverlayComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-no-rows-to-show-overlay/v3-no-rows-to-show-overlay.component';
import { V3PayeeNameComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-payee-name/v3-payee-name.component';
import { V3StatusComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-status/v3-status.component';
import { V3UpdatedAtComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-updated-at/v3-updated-at.component';
import { V3ViewButtonComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-view-button/v3-view-button.component';
import { CommonLayoutV35Component } from 'src/app/layout/v3-layout/common-layout-v35/common-layout-v35.component';
import { MatTabsModule } from '@angular/material/tabs';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { ListHeaderV35Component } from 'src/app/shared/v3/common-components/list-header-v35/list-header-v35.component';
import { CommonListSkeltonComponent } from 'src/app/shared/v3/common-components/common-list-skelton/common-list-skelton.component';
import { V35CommonDropDownSelectorComponent } from 'src/app/shared/v3/v35-dropdown/v35-common-dropdown-selector.component';
import { ListViewToggleComponent } from 'src/app/shared/v3/common-components/list-view-toggle/list-view-toggle.component';
import {
  FaIconLibrary,
  FontAwesomeModule
} from '@fortawesome/angular-fontawesome';
import { WhiteLabelDirective } from 'src/app/directive/white-label.directive';
import { EllipsisActiveDirective } from 'src/app/directive/ellipsis-active.directive';
import {
  faAddressBook,
  faArrowDownToLine,
  faArrowUpToLine,
  faCaretDown,
  faCodeMerge,
  faEdit,
  faEllipsisVertical,
  faExternalLink,
  faEye,
  faEyeSlash,
  faGlobe,
  faGrid2,
  faMagnifyingGlass,
  faPenToSquare,
  faTable,
  faTrash
} from '@fortawesome/pro-solid-svg-icons';
import { DemoVideoComponent } from 'src/app/shared/components/demo-video/demo-video.component';
import { AngularMaterialModule } from '../../angular-material/angular-material.module';
import { DataTableModule } from '../../data-table/data-table.module';
import { V3DataTableModule } from '../../v3-data-table/v3-data-table.module';
import { PayeeOcwV35Component } from './v35-pages/payee-ocw-v35/payee-ocw-v35.component';
import { PayeeListOcwV35Component } from './v35-components/payee-list-ocw-v35/payee-list-ocw-v35.component';
import { PayeeDetailsOcwV35Component } from './v35-components/payee-details-ocw-v35/payee-details-ocw-v35.component';
import { PayeeTableOcwV35Component } from './v35-components/payee-table-ocw-v35/payee-table-ocw-v35.component';
import { PayeeTransactionsOcwV35Component } from './v35-components/payee-transactions-ocw-v35/payee-transactions-ocw-v35.component';
import { PayeeBankAccV35Component } from './v35-components/payee-bank-acc-v35/payee-bank-acc-v35.component';
import { PayeeInternationalAccV35Component } from './v35-components/payee-international-acc-v35/payee-international-acc-v35.component';
import { PayeeViewOcwV35Component } from './v35-components/payee-view-ocw-v35/payee-view-ocw-v35.component';
import { DtBankActionButtonV35Component } from './v35-components/bank-action-button-v35/bank-action-button-v35.component';
import { DtInternationalBankActionV35Component } from './v35-components/international-bank-action-v35/international-bank-action-v35.component';
import { PayeeListActionV35Component } from './v35-components/payee-list-action-v35/payee-list-action-v35.component';
import { PayeeImportModalComponent } from './v35-components/payee-connection-modal/payee-import-modal.component';

const routes: Routes = [
  { path: '', component: PayeeOcwV35Component, data: { title: 'Payees' } },
  { path: ':id', component: PayeeOcwV35Component, data: { title: 'Payees' } },
];

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule.forChild(routes),
    AngularMaterialModule,
    HttpClientModule,
    SharedModule,
    NgxMaskDirective,
    NgxMaskPipe,
    DemoVideoComponent,
    PipesModule,
    V3DataTableModule,
    V3ActionButtonComponent,
    V3ModeOfTransferComponent,
    V3NoRowsToShowOverlayComponent,
    V3ViewButtonComponent,
    V3UpdatedAtComponent,
    V3StatusComponent,
    V3PayeeNameComponent,
    DataTableModule,
    CommonLayoutV35Component,
    MatTabsModule,
    CommonButtonV35Component,
    ListHeaderV35Component,
    CommonListSkeltonComponent,
    V35CommonDropDownSelectorComponent,
    ListViewToggleComponent,
    FontAwesomeModule,
    WhiteLabelDirective,
    EllipsisActiveDirective,
    PayeeOcwV35Component,
    PayeeListOcwV35Component,
    PayeeDetailsOcwV35Component,
    PayeeTableOcwV35Component,
    PayeeTransactionsOcwV35Component,
    PayeeBankAccV35Component,
    PayeeInternationalAccV35Component,
    PayeeViewOcwV35Component,
    DtBankActionButtonV35Component,
    DtInternationalBankActionV35Component,
    PayeeImportModalComponent,
    PayeeListActionV35Component
  ]
})
export class PayeeOcwV3Module {
  constructor(library: FaIconLibrary) {
    library.addIcons(
      faEye,
      faEyeSlash,
      faTrash,
      faGlobe,
      faMagnifyingGlass,
      faArrowUpToLine,
      faCaretDown,
      faAddressBook,
      faCodeMerge,
      faEllipsisVertical,
      faArrowDownToLine,
      faTable,
      faGrid2,
      faPenToSquare,
      faExternalLink,
      faEdit
    );
  }
}

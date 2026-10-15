import { NgModule } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from 'src/app/shared/shared.module';
import { PipesModule } from 'src/app/pipes/pipes.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { NgxMaskDirective, NgxMaskPipe } from 'ngx-mask';
import { MatFormFieldModule } from '@angular/material/form-field';
import { NgSelectModule } from '@ng-select/ng-select';

import { NgxImageZoomModule } from 'ngx-image-zoom';
import { DateRangeComponent } from 'src/app/shared/components/date-range/date-range.component';
import { DropDownWalletComponent } from 'src/app/shared/components/drop-downs/drop-down-wallet/drop-down-wallet.component';
import { DropDownBankComponent } from 'src/app/shared/components/drop-downs/drop-down-bank/drop-down-bank.component';
import { V3ActionButtonComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-action-button/v3-action-button.component';
import { V3DataTableSelectBoxComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-data-table-select-box/v3-data-table-select-box.component';
import { V3NoRowsToShowOverlayComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-no-rows-to-show-overlay/v3-no-rows-to-show-overlay.component';
import { V3PayeeNameComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-payee-name/v3-payee-name.component';
import { V3PaymentTypeComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-payment-type/v3-payment-type.component';
import { V3StatusComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-status/v3-status.component';
import { V3UpdatedAtComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-updated-at/v3-updated-at.component';
import { V3ViewButtonComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-view-button/v3-view-button.component';
import { CommonLayoutV35Component } from 'src/app/layout/v3-layout/common-layout-v35/common-layout-v35.component';
import { ListHeaderV35Component } from 'src/app/shared/v3/common-components/list-header-v35/list-header-v35.component';
import {
  FaIconLibrary,
  FontAwesomeModule
} from '@fortawesome/angular-fontawesome';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { CommonListSkeltonComponent } from 'src/app/shared/v3/common-components/common-list-skelton/common-list-skelton.component';
import { CommonInputFieldComponent } from 'src/app/shared/v3/common-input-field/common-input-field.component';
import { ListViewToggleComponent } from 'src/app/shared/v3/common-components/list-view-toggle/list-view-toggle.component';
import { V35CommonDropDownSelectorComponent } from 'src/app/shared/v3/v35-dropdown/v35-common-dropdown-selector.component';
import { CloudAccountDropdownV35Component } from 'src/app/shared/components/v3/drop-downs/cloud-account-dropdown-v35/cloud-account-dropdown-v35.component';
import { WalletDropdownV3Component } from 'src/app/shared/components/v3/drop-downs/wallet-dropdown-v3/wallet-dropdown-v3.component';
import { BankAcDropdownV3Component } from 'src/app/shared/components/v3/drop-downs/bank-ac-dropdown-v3/bank-ac-dropdown-v3.component';
import { DataRangeV35Component } from 'src/app/shared/components/date-range-v35/data-range-v35.component';
import {
  faArrowLeft,
  faCaretDown,
  faChevronRight,
  faCircle,
  faCircleArrowDown,
  faCreditCard,
  faDownload,
  faEye,
  faFilterList,
  faGear,
  faPenToSquare,
  faPlus,
  faCircleCheck,
  faCircleXmark,
  faCaretRight,
  faBan,
  faPaperPlaneTop
} from '@fortawesome/pro-solid-svg-icons';
import { StepperV35Component } from 'src/app/shared/v3/common-components/stepper-v35/stepper-v35.component';
import { WhiteLabelDirective } from 'src/app/directive/white-label.directive';
import { CommonBackButtonV35Component } from 'src/app/shared/v3/buttons/common-back-button-v35/common-back-button-v35.component';
import { ScrollListenerDirective } from 'src/app/directive/scroll-listner.directive';
import { CamelToTitlePipe } from 'src/app/pipes/camel-to-title.pipe';
import { WhiteLabelPipe } from 'src/app/pipes/white-label.pipe';
import { V35ControlMessageComponent } from 'src/app/shared/v3/control-message-v35/control-message-v35.component';
import { CommonComponentsModule } from '../../common-components/common-components.module';
import { CloudWelcomePageV3Component } from './components/cloud-welcome-page-v3/cloud-welcome-page-v3.component';
import { CloudSubmittedV3Component } from './components/cloud-submitted-v3/cloud-submitted-v3.component';
import { AddFundV3Component } from './pages/add-fund-v3/add-fund-v3.component';
import { V3DataTableModule } from '../../v3-data-table/v3-data-table.module';
import { DataTableModule } from '../../data-table/data-table.module';
import { CreateCardComponent } from './pages/create-card/create-card.component';
import { AngularMaterialModule } from '../../angular-material/angular-material.module';
import { CloudBankIndexComponent } from './pages/cloud-bank-index/cloud-bank-index.component';
import { CloudBankListV35Component } from './components-v35/cloud-bank-list-v35/cloud-bank-list-v35.component';
import { CloudBankDetailsV35Component } from './components-v35/cloud-bank-details-v35/cloud-bank-details-v35.component';
import { ManageCloudCardV35Component } from './components-v35/manage-cloud-card-v35/manage-cloud-card-v35.component';
import { CloudListTableActionV35Component } from './components-v35/cloud-bank-list-v35/table-components/cloud-list-table-action-v35.component';
import { CloudListTableAccountNameV35Component } from './components-v35/cloud-bank-list-v35/table-components/cloud-list-table-account-name-v35.component';
import { CloudListTableBusinessNameV35Component } from './components-v35/cloud-bank-list-v35/table-components/cloud-list-table-business-name-v35.component';
import { CloudAccountInfoModalComponent } from './modals/cloud-account-info-modal/cloud-account-info-modal.component';
import { CloudAccountDataTableV3Component } from './components/cloud-account-data-table-v3/cloud-account-data-table-v3.component';
import { CloudAccountDataTableV3ActionComponent } from './components/cloud-account-data-table-v3/cloud-account-data-table-v3-action.component';

const routes: Routes = [
  { path: '', redirectTo: 'index', pathMatch: 'full' },
  {
    path: 'index',
    component: CloudBankIndexComponent,
    data: { title: 'Cloud Bank ' }
  },
  {
    path: 'card/create-card',
    component: CreateCardComponent
  },
  {
    path: 'add-fund',
    component: AddFundV3Component
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    SharedModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    MatDatepickerModule,
    AngularMaterialModule,
    BankAcDropdownV3Component,
    WalletDropdownV3Component,
    CloudAccountDropdownV35Component,
    NgxMaskDirective,
    NgxMaskPipe,
    MatFormFieldModule,
    DataTableModule,
    NgSelectModule,
    DropDownBankComponent,
    DropDownWalletComponent,
    PipesModule,
    NgxImageZoomModule,
    CommonComponentsModule,
    V3DataTableModule,
    V3ActionButtonComponent,
    V3NoRowsToShowOverlayComponent,
    V3DataTableSelectBoxComponent,
    V3ViewButtonComponent,
    V3UpdatedAtComponent,
    V3StatusComponent,
    V3PaymentTypeComponent,
    V3PayeeNameComponent,
    DateRangeComponent,
    CommonLayoutV35Component,
    StepperV35Component,
    CommonButtonV35Component,
    ListHeaderV35Component,
    FontAwesomeModule,
    CommonButtonV35Component,
    CommonListSkeltonComponent,
    CommonInputFieldComponent,
    ListViewToggleComponent,
    V35CommonDropDownSelectorComponent,
    V35ControlMessageComponent,
    WhiteLabelDirective,
    DataRangeV35Component,
    CommonBackButtonV35Component,
    CamelToTitlePipe,
    ScrollListenerDirective,
    WhiteLabelPipe,
    NgOptimizedImage,
    CloudBankIndexComponent,
    CreateCardComponent,
    CloudWelcomePageV3Component,
    CloudSubmittedV3Component,
    AddFundV3Component,
    CloudBankListV35Component,
    CloudBankDetailsV35Component,
    ManageCloudCardV35Component,
    CloudListTableActionV35Component,
    CloudListTableAccountNameV35Component,
    CloudListTableBusinessNameV35Component,
    CloudAccountDataTableV3Component,
    CloudAccountInfoModalComponent,
    CloudAccountDataTableV3ActionComponent
  ]
})
export class CloudBankV3Module {
  constructor(library: FaIconLibrary) {
    library.addIcons(
      faGear,
      faCircle,
      faChevronRight,
      faPlus,
      faPenToSquare,
      faEye,
      faDownload,
      faCaretDown,
      faCaretDown,
      faArrowLeft,
      faCircleArrowDown,
      faFilterList,
      faCreditCard,
      faCircleCheck,
      faCircleXmark,
      faCaretDown,
      faCaretRight,
      faPaperPlaneTop,
      faBan
    );
  }
}

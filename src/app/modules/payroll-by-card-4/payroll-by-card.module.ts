import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormsModule } from '@angular/forms';
import { NgxMaskDirective, NgxMaskPipe } from 'ngx-mask';
import {
  FaIconLibrary,
  FontAwesomeModule
} from '@fortawesome/angular-fontawesome';
import {
  faArrowDownToLine,
  faCheck,
  faCircle,
  faCircleCheck,
  faCircleInfo,
  faCirclePlay,
  faEllipsisVertical,
  faEnvelope,
  faEye,
  faHeadset,
  faMagnifyingGlass,
  faMessage,
  faPenToSquare,
  faUsers,
  faXmark
} from '@fortawesome/pro-solid-svg-icons';
import { CommonLayoutV4Component } from 'src/app/layout/v4-layout/common-layout-v4/common-layout-v4.component';
import { PipesModule } from 'src/app/pipes/pipes.module';
import { DateRangeComponent } from 'src/app/shared/components/date-range/date-range.component';
import { DemoVideoComponent } from 'src/app/shared/components/demo-video/demo-video.component';
import { DropDownBankComponent } from 'src/app/shared/components/drop-downs/drop-down-bank/drop-down-bank.component';
import { DropDownCardComponent } from 'src/app/shared/components/drop-downs/drop-down-card/drop-down-card.component';
import { CardsDropdownV3Component } from 'src/app/shared/components/v3/drop-downs/cards-dropdown-v3/cards-dropdown-v3.component';
import { BankAcDropdownV3Component } from 'src/app/shared/components/v3/drop-downs/bank-ac-dropdown-v3/bank-ac-dropdown-v3.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { CommonUploadButtonV35Component } from 'src/app/shared/v3/buttons/common-upload-button-v35/common-upload-button-v35.component';
import { CommonListSkeltonComponent } from 'src/app/shared/v3/common-components/common-list-skelton/common-list-skelton.component';
import { ListHeaderV35Component } from 'src/app/shared/v3/common-components/list-header-v35/list-header-v35.component';
import { V35CommonDropDownSelectorComponent } from 'src/app/shared/v3/v35-dropdown/v35-common-dropdown-selector.component';
import { AngularMaterialModule } from '../angular-material/angular-material.module';
import { DataTableModule } from '../data-table/data-table.module';
import { V3DataTableModule } from '../v3-data-table/v3-data-table.module';
import { PayrollOcwV4Component } from './pages/payroll-ocw-v4/payroll-ocw-v4.component';
import { PayrollDataTableV4Component } from './components/payroll-data-table-v4/payroll-data-table-v4.component';
import { PayrollTransactionsTableV4Component } from './components/payroll-transactions-table-v4/payroll-transactions-table-v4.component';
import { PayrollConnectionModalV4Component } from './components/payroll-connection-modal-v4/payroll-connection-modal-v4.component';
import { V4PayrollActionComponent } from './components/v4-payroll-action/v4-payroll-action.component';
import { ProcessMethodeModalV4Component } from './components/process-methode-modal-v4/process-methode-modal-v4.component';
import { TableInputFieldV4Component } from './components/table-input-field-v4/table-input-field-v4.component';
import { ConfirmPayrollModalV4Component } from './components/confirm-payroll-modal-v4/confirm-payroll-modal-v4.component';
import { AddPayrollModalV4Component } from './components/add-payroll-modal-v4/add-payroll-modal-v4.component';
import { BusinessNameModalV4Component } from './components/business-name-modal-v4/business-name-modal-v4.component';
import { PayrollStatementVerificationV4Component } from './components/payroll-statement-verification-v4/payroll-statement-verification-v4.component';
import { PayrollListV4Component } from './components-v4/payroll-list-v4/payroll-list-v4.component';
import { PayrollDetailsV4Component } from './components-v4/payroll-details-v4/payroll-details-v4.component';

const routes: Routes = [
  { path: '', redirectTo: 'index', pathMatch: 'full' },
  {
    path: 'index',
    component: PayrollOcwV4Component,
    data: { title: 'Payroll by Credit Card' }
  }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    AngularMaterialModule,
    BankAcDropdownV3Component,
    CardsDropdownV3Component,
    SharedModule,
    NgSelectModule,
    DataTableModule,
    DateRangeComponent,
    PipesModule,
    V3DataTableModule,
    DropDownBankComponent,
    DropDownCardComponent,
    FormsModule,
    NgxMaskDirective,
    NgxMaskPipe,
    DemoVideoComponent,
    CommonLayoutV4Component,
    ListHeaderV35Component,
    V35CommonDropDownSelectorComponent,
    FontAwesomeModule,
    CommonListSkeltonComponent,
    CardsDropdownV3Component,
    BankAcDropdownV3Component,
    CommonButtonV35Component,
    CommonUploadButtonV35Component,
    PayrollDataTableV4Component,
    PayrollTransactionsTableV4Component,
    PayrollConnectionModalV4Component,
    V4PayrollActionComponent,
    ProcessMethodeModalV4Component,
    TableInputFieldV4Component,
    ConfirmPayrollModalV4Component,
    AddPayrollModalV4Component,
    PayrollOcwV4Component,
    PayrollListV4Component,
    PayrollDetailsV4Component,
    BusinessNameModalV4Component,
    PayrollStatementVerificationV4Component
  ]
})
export class PayrollModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(
      faXmark,
      faMagnifyingGlass,
      faCircleInfo,
      faCircleCheck,
      faMessage,
      faCircle,
      faEllipsisVertical,
      faHeadset,
      faEnvelope,
      faMessage,
      faUsers,
      faEye,
      faArrowDownToLine,
      faPenToSquare,
      faCheck,
      faCirclePlay
    );
  }
}

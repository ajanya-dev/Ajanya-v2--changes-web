import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { PayrollOcwV35Component } from './pages/payroll-ocw-v35/payroll-ocw-v35.component';
import { PayrollDataTableComponent } from './components/payroll-data-table/payroll-data-table.component';
import { PayrollTransactionsTableComponent } from './components/payroll-transactions-table/payroll-transactions-table.component';
import { PayrollConnectionModalComponent } from './components/payroll-connection-modal/payroll-connection-modal.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { AngularMaterialModule } from '../angular-material/angular-material.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { DataTableModule } from '../data-table/data-table.module';
import { DateRangeComponent } from 'src/app/shared/components/date-range/date-range.component';
import { PipesModule } from 'src/app/pipes/pipes.module';
import { V3DataTableModule } from '../v3-data-table/v3-data-table.module';
import { V3PayrollActionComponent } from './components/v3-payroll-action/v3-payroll-action.component';
import { DropDownBankComponent } from 'src/app/shared/components/drop-downs/drop-down-bank/drop-down-bank.component';
import { DropDownCardComponent } from 'src/app/shared/components/drop-downs/drop-down-card/drop-down-card.component';
import { ProcessMethodeModalComponent } from './components/process-methode-modal/process-methode-modal.component';
import { FormsModule } from '@angular/forms';
import { NgxMaskDirective, NgxMaskPipe } from 'ngx-mask';
import { TableInputFieldComponent } from './components/table-input-field/table-input-field.component';
import { ConfirmPayrollModalComponent } from './components/confirm-payroll-modal/confirm-payroll-modal.component';
import { AddPayrollModalComponent } from './components/add-payroll-modal/add-payroll-modal.component';
import { DemoVideoComponent } from 'src/app/shared/components/demo-video/demo-video.component';
import { BusinessNameModalComponent } from './components/business-name-modal/business-name-modal.component';
import { CommonLayoutV35Component } from 'src/app/layout/v3-layout/common-layout-v35/common-layout-v35.component';
import { PayrollListV35Component } from './components-v35/payroll-list-v35/payroll-list-v35.component';
import { ListHeaderV35Component } from 'src/app/shared/v3/common-components/list-header-v35/list-header-v35.component';
import { V35CommonDropDownSelectorComponent } from 'src/app/shared/v3/v35-dropdown/v35-common-dropdown-selector.component';
import {
  FaIconLibrary,
  FontAwesomeModule
} from '@fortawesome/angular-fontawesome';
import { CommonListSkeltonComponent } from 'src/app/shared/v3/common-components/common-list-skelton/common-list-skelton.component';
import { PayrollDetailsV35Component } from './components-v35/payroll-details-v35/payroll-details-v35.component';
import { CardsDropdownV3Component } from 'src/app/shared/components/v3/drop-downs/cards-dropdown-v3/cards-dropdown-v3.component';
import { BankAcDropdownV3Component } from 'src/app/shared/components/v3/drop-downs/bank-ac-dropdown-v3/bank-ac-dropdown-v3.component';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
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
import { PayrollStatementVerificationComponent } from './components/payroll-statement-verification/payroll-statement-verification.component';
import { CommonUploadButtonV35Component } from 'src/app/shared/v3/buttons/common-upload-button-v35/common-upload-button-v35.component';

const routes: Routes = [
  { path: '', redirectTo: 'index', pathMatch: 'full' },
  {
    path: 'index',
    component: PayrollOcwV35Component,
    data: { title: 'Payroll by Card' }
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
    CommonLayoutV35Component,
    ListHeaderV35Component,
    V35CommonDropDownSelectorComponent,
    FontAwesomeModule,
    CommonListSkeltonComponent,
    CardsDropdownV3Component,
    BankAcDropdownV3Component,
    CommonButtonV35Component,
    CommonUploadButtonV35Component,
    PayrollDataTableComponent,
    PayrollTransactionsTableComponent,
    PayrollConnectionModalComponent,
    V3PayrollActionComponent,
    ProcessMethodeModalComponent,
    TableInputFieldComponent,
    ConfirmPayrollModalComponent,
    AddPayrollModalComponent,
    PayrollOcwV35Component,
    PayrollListV35Component,
    PayrollDetailsV35Component,
    BusinessNameModalComponent,
    PayrollStatementVerificationComponent
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

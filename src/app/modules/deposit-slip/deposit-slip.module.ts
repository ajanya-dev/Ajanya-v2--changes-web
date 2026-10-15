import { DepositSlipActivitylogComponent } from './components/deposit-slip-activitylog/deposit-slip-activitylog.component';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
// User Components
import { SharedModule } from 'src/app/shared/shared.module';
import { NgSelectModule } from '@ng-select/ng-select';
import { TextEditorComponent } from 'src/app/shared/components/text-editor/text-editor.component';
import { NgxMaskDirective, NgxMaskPipe } from 'ngx-mask';
import { BankModalModule } from 'src/app/shared/bank-modal/bank-modal.module';
import {
  faCalendar,
  faCircle,
  faCircleInfo,
  faCopy,
  faEllipsisV,
  faExternalLink,
  faFloppyDisk,
  faPlus,
  faPrint,
  faQuestionCircle,
  faSave,
  faTrash,
  faBan
} from '@fortawesome/pro-solid-svg-icons';
import {
  faPrint as farPrint,
  faCheck as farCheck,
  faBan as farBan
} from '@fortawesome/pro-regular-svg-icons';
import {
  FaIconLibrary,
  FontAwesomeModule
} from '@fortawesome/angular-fontawesome';
import { AmountInputComponent } from 'src/app/shared/components/amount-input/amount-input.component';

import { BankAcDropdownV3Component } from 'src/app/shared/components/v3/drop-downs/bank-ac-dropdown-v3/bank-ac-dropdown-v3.component';
import { DataTableModule } from '../data-table/data-table.module';
import { ViewDepositSlipComponent } from './pages/view-deposit-slip/view-deposit-slip.component';
import { DepositSlipSettingsComponent } from './pages/deposit-slip-settings/deposit-slip-settings.component';
import { AngularMaterialModule } from '../angular-material/angular-material.module';
import { CreateDepositSlipComponent } from './pages/create-deposit-slip/create-deposit-slip.component';
import { DepositSlipListComponent } from './pages/deposit-slip-list/deposit-slip-list.component';
import { OcwBackButtonComponent } from 'src/app/shared/components/ocw-back-button/ocw-back-button.component';
import { CommonBackButtonV35Component } from 'src/app/shared/v3/buttons/common-back-button-v35/common-back-button-v35.component';
import { V3DataTableModule } from '../v3-data-table/v3-data-table.module';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { DepositSlipAttachmentsComponent } from './components/depositSlip-attachments/depositSlip-attachments.component';
import { DepositSlipCommentsComponent } from './components/depositSlip-comments/depositSlip-comments.component';

const routes: Routes = [
  { path: '', redirectTo: 'index', pathMatch: 'full' },
  {
    path: 'index',
    component: DepositSlipListComponent,
    data: { title: 'Deposit Slip List ' }
  },
  {
    path: 'create',
    component: CreateDepositSlipComponent,
    data: { mode: 'create', title: 'Create Deposit Slip ' }
  },
  {
    path: 'edit/:slipId',
    component: CreateDepositSlipComponent,
    data: { mode: 'edit', title: 'Update Deposit Slip ' }
  },
  {
    path: 'clone/:slipId',
    component: CreateDepositSlipComponent,
    data: { mode: 'clone', title: 'Clone Deposit Slip ' }
  },
  {
    path: 'view/:slipId',
    component: ViewDepositSlipComponent
  },
  {
    path: 'settings',
    component: DepositSlipSettingsComponent
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DataTableModule,
    V3DataTableModule,
    RouterModule.forChild(routes),
    AmountInputComponent,
    SharedModule,
    BankAcDropdownV3Component,
    TextEditorComponent,
    AngularMaterialModule,
    NgSelectModule,
    BankModalModule,
    NgxMaskDirective,
    NgxMaskPipe,
    FontAwesomeModule,
    OcwBackButtonComponent,
    CommonBackButtonV35Component,
    CommonButtonV35Component,
    DepositSlipActivitylogComponent,
    DepositSlipAttachmentsComponent,
    DepositSlipCommentsComponent,
    DepositSlipListComponent,
    CreateDepositSlipComponent,
    DepositSlipSettingsComponent,
    ViewDepositSlipComponent
  ]
})
export class DepositSlipModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(
      faPlus,
      faCircleInfo,
      faPrint,
      faCircle,
      faCalendar,
      faQuestionCircle,
      faTrash,
      faSave,
      faEllipsisV,
      faFloppyDisk,
      farPrint,
      farCheck,
      faExternalLink,
      faCopy,
      faBan,
      farBan
    );
  }
}

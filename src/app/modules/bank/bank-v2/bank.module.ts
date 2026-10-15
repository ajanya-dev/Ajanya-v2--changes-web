import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { SharedModule } from 'src/app/shared/shared.module';
import { NgxMaskDirective, NgxMaskPipe } from 'ngx-mask';
import { PipesModule } from 'src/app/pipes/pipes.module';
import { NewPhoneInputComponent } from 'src/app/shared/components/new-phone-input/new-phone-input.component';
import { DropDownBankComponent } from 'src/app/shared/components/drop-downs/drop-down-bank/drop-down-bank.component';
import {
  faArrowDownToLine,
  faArrowUpToLine,
  faBriefcase,
  faChevronRight,
  faCircle,
  faCircleCheck,
  faPlus,
  faQrcode,
  faTimes,
  faTrash,
  faTriangleExclamation,
  faUniversity,
  faUpload,
  faX,
  faXmark
} from '@fortawesome/pro-solid-svg-icons';
import {
  FaIconLibrary,
  FontAwesomeModule
} from '@fortawesome/angular-fontawesome';
import { CommonUploadButtonV35Component } from 'src/app/shared/v3/buttons/common-upload-button-v35/common-upload-button-v35.component';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { AngularMaterialModule } from '../../angular-material/angular-material.module';
import { ImportBankAccountStep1Component } from './pages/import-bank-account-step1/import-bank-account-step1.component';
import { ImportBankAccountStep2Component } from './pages/import-bank-account-step2/import-bank-account-step2.component';
import { CloneDesignComponent } from './modals/clone-design/clone-design.component';
import { EditBankAccountModalComponent } from './modals/edit-bank-account-modal/edit-bank-account-modal.component';
import { ChangeStartingNumberComponent } from './modals/change-starting-number/change-starting-number.component';
import { ImportBankAccountStep3Component } from './pages/import-bank-account-step3/import-bank-account-step3.component';
import { MicroDepositModalComponent } from './modals/micro-deposit-modal/micro-deposit-modal.component';
import { DtVerifyComponent } from './components/dt-verify/dt-verify.component';
import { ConfirmMicroDepositModalComponent } from './modals/confirm-micro-deposit-modal/confirm-micro-deposit-modal.component';
import { ApplayAchComponent } from './shared/applay-ach';
import { DataTableModule } from '../../data-table/data-table.module';
import { SelectBusinessComponent } from './modals/select-business/select-business.component';
import { PersonalAccountDetailsComponent } from './modals/personal-account-details/personal-account-details.component';
import { BankSharedModule } from './shared/bank-shared.module';

const routes: Routes = [
  { path: '', redirectTo: 'index', pathMatch: 'full' },
  {
    path: 'import-bankaccount/step1',
    component: ImportBankAccountStep1Component
  },
  {
    path: 'import-bankaccount/step2',
    component: ImportBankAccountStep2Component
  },
  {
    path: 'import-bankaccount/step4',
    component: ImportBankAccountStep3Component
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
    DropDownBankComponent,
    NewPhoneInputComponent,
    NgxMaskDirective,
    NgxMaskPipe,
    BankSharedModule,
    PipesModule,
    FontAwesomeModule,
    CommonUploadButtonV35Component,
    CommonButtonV35Component,
    DtVerifyComponent,
    ImportBankAccountStep1Component,
    ImportBankAccountStep2Component,
    CloneDesignComponent,
    EditBankAccountModalComponent,
    ChangeStartingNumberComponent,
    ImportBankAccountStep3Component,
    MicroDepositModalComponent,
    ConfirmMicroDepositModalComponent,
    ApplayAchComponent,
    SelectBusinessComponent,
    PersonalAccountDetailsComponent
  ]
})
export class BankModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(
      faXmark,
      faPlus,
      faTrash,
      faArrowDownToLine,
      faArrowUpToLine,
      faCircleCheck,
      faCircle,
      faChevronRight,
      faTimes,
      faUniversity,
      faBriefcase,
      faQrcode,
      faX,
      faUpload,
      faTriangleExclamation
    );
  }
}

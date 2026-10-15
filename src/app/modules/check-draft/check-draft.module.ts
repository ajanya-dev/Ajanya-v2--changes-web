import { NgModule } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from 'src/app/shared/shared.module';
import { NgxMaskDirective, NgxMaskPipe } from 'ngx-mask';
import { NgSelectModule } from '@ng-select/ng-select';
import { PipesModule } from 'src/app/pipes/pipes.module';
import { TruncatePipe } from 'src/app/pipes/truncate.pipe';
import { ReactiveFormsModule } from '@angular/forms';
import { OcwBackButtonComponent } from 'src/app/shared/components/ocw-back-button/ocw-back-button.component';
import { DropDownCategoryComponent } from 'src/app/shared/components/drop-downs/drop-down-category/drop-down-category.component';
import { DropDownPayeeBankComponent } from 'src/app/shared/components/drop-downs/drop-down-payee-bank/drop-down-payee-bank.component';
import { DropDownBankComponent } from 'src/app/shared/components/drop-downs/drop-down-bank/drop-down-bank.component';
import { DropDownPayeeComponent } from 'src/app/shared/components/drop-downs/drop-down-payee/drop-down-payee.component';
import {
  faAngleRight,
  faArrowDownToLine,
  faCalculator,
  faCalendar,
  faDownload,
  faEllipsisV,
  faExternalLink,
  faFile,
  faLevelUp,
  faMinus,
  faPaperPlane,
  faPaperPlaneTop,
  faPlus,
  faPrint,
  faRefresh,
  faSave,
  faTimes,
  faFileLines,
  faList,
  faPaperclip,
  faTrash
} from '@fortawesome/pro-solid-svg-icons';
import { faMessageDots } from '@fortawesome/pro-regular-svg-icons';
import {
  FaIconLibrary,
  FontAwesomeModule
} from '@fortawesome/angular-fontawesome';
import { AmountInputComponent } from 'src/app/shared/components/amount-input/amount-input.component';
import { NewPhoneInputComponent } from 'src/app/shared/components/new-phone-input/new-phone-input.component';
import { ExcelCsvImportComponent } from './pages/excel-csv-import/excel-csv-import.component';
import { CheckDraftRecuriingChecksComponent } from './pages/check-draft-recuriing-checks/check-draft-recuriing-checks.component';
import { SetRecurringModalComponent } from './modal/set-recurring-modal/set-recurring-modal.component';
import { AngularMaterialModule } from '../angular-material/angular-material.module';
import { ResendPermissionModalComponent } from './modal/resend-permission-modal/resend-permission-modal.component';
import { CheckDraftAddAttachmentCommentComponent } from './pages/check-draft-list/att-cmmnt-status';
import { SuccessApplicationComponent } from './modal/success-application/success-application.component';
import { CheckDraftComponent } from './pages/check-draft.component';
import { DataTableModule } from '../data-table/data-table.module';
import { CheckDraftRecurringViewComponent } from './pages/check-draft-recurring-view/check-draft-recurring-view.component';
import { ImportStep2Component } from './pages/import-step2/import-step2.component';
import { ImportStep3Component } from './pages/import-step3/import-step3.component';
import { CheckDraftLandingPageComponent } from './pages/check-draft-landing-page/check-draft-landing-page.component';
import { CheckDraftListComponent } from './pages/check-draft-list/check-draft-list.component';
import { CheckDraftViewComponent } from './pages/check-draft-view/check-draft-view.component';
import { NewCheckDraftComponent } from './pages/new-check-draft/new-check-draft.component';
import { V3DataTableModule } from '../v3-data-table/v3-data-table.module';
import { CommonBackButtonV35Component } from 'src/app/shared/v3/buttons/common-back-button-v35/common-back-button-v35.component';

/**
 * @description Available routes in the module.
 */
const routes: Routes = [
  {
    path: '',
    component: CheckDraftComponent
  },
  {
    path: 'step-1',
    component: CheckDraftLandingPageComponent
  },
  {
    path: 'index',
    component: CheckDraftListComponent,
    data: { title: 'Check Draft ' }
  },
  {
    path: 'view/:id',
    component: CheckDraftViewComponent
  },
  {
    path: 'recurringView/:id',
    component: CheckDraftRecurringViewComponent
  },
  {
    path: 'new',
    component: NewCheckDraftComponent,
    data: { title: 'New Check Draft ' }
  },
  {
    path: 'import/step1',
    component: ExcelCsvImportComponent
  },
  {
    path: 'import/step2',
    component: ImportStep2Component
  },
  {
    path: 'import/step3',
    component: ImportStep3Component
  },
  {
    path: 'recurring',
    component: CheckDraftRecuriingChecksComponent
  }
];

/**
 * @description NgModule for managing check draft related functionality and components.
 */
@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    DataTableModule,
    V3DataTableModule,
    SharedModule,
    DropDownPayeeComponent,
    AmountInputComponent,
    DropDownBankComponent,
    DropDownPayeeBankComponent,
    DropDownCategoryComponent,
    OcwBackButtonComponent,
    AngularMaterialModule,
    NgSelectModule,
    NgxMaskDirective,
    NgxMaskPipe,
    PipesModule,
    ReactiveFormsModule,
    FontAwesomeModule,
    NewPhoneInputComponent,
    CommonBackButtonV35Component,
    CheckDraftLandingPageComponent,
    CheckDraftListComponent,
    CheckDraftViewComponent,
    NewCheckDraftComponent,
    ExcelCsvImportComponent,
    CheckDraftRecuriingChecksComponent,
    SetRecurringModalComponent,
    ResendPermissionModalComponent,
    CheckDraftAddAttachmentCommentComponent,
    SuccessApplicationComponent,
    CheckDraftComponent,
    CheckDraftRecurringViewComponent,
    ImportStep2Component,
    ImportStep3Component
  ],
  providers: [DecimalPipe, TruncatePipe]
})
export class CheckDraftModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(
      faPlus,
      faPaperPlaneTop,
      faPrint,
      faCalculator,
      faFile,
      faTrash,
      faPaperPlane,
      faSave,
      faLevelUp,
      faMinus,
      faPrint,
      faRefresh,
      faDownload,
      faExternalLink,
      faEllipsisV,
      faTimes,
      faAngleRight,
      faCalendar,
      faFileLines,
      faList,
      faPaperclip,
      faMessageDots,
      faArrowDownToLine
    );
  }
}

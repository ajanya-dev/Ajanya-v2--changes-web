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
import { CommonBackButtonV35Component } from 'src/app/shared/v3/buttons/common-back-button-v35/common-back-button-v35.component';
import { V4CheckDraftRecuriingChecksComponent } from './pages/v4-check-draft-recuriing-checks/v4-check-draft-recuriing-checks.component';
import { V4SetRecurringModalComponent } from './modal/v4-set-recurring-modal/v4-set-recurring-modal.component';
import { AngularMaterialModule } from '../angular-material/angular-material.module';
import { V4ResendPermissionModalComponent } from './modal/v4-resend-permission-modal/v4-resend-permission-modal.component';
import { V4CheckDraftAddAttachmentCommentComponent } from './pages/v4-check-draft-list/v4-att-cmmnt-status';
import { V4CheckDraftComponent } from './pages/v4-check-draft.component';
import { DataTableModule } from '../data-table/data-table.module';
import { V4CheckDraftRecurringViewComponent } from './pages/v4-check-draft-recurring-view/v4-check-draft-recurring-view.component';
import { V4CheckDraftListComponent } from './pages/v4-check-draft-list/v4-check-draft-list.component';
import { V4CheckDraftViewComponent } from './pages/v4-check-draft-view/v4-check-draft-view.component';
import { V3DataTableModule } from '../v3-data-table/v3-data-table.module';
import { V4CheckDraftIndexComponent } from './pages/v4-check-draft-index/v4-check-draft-index.component';

/**
 * @description Available routes in the module.
 */
const routes: Routes = [
  {
    path: '',
    component: V4CheckDraftComponent
  },
  {
    path: 'index',
    component: V4CheckDraftIndexComponent,
    data: { title: 'Check Draft' }
  },
  {
    path: 'view/:id',
    component: V4CheckDraftViewComponent
  },
  {
    path: 'recurringView/:id',
    component: V4CheckDraftRecurringViewComponent
  },
  {
    path: 'recurring',
    component: V4CheckDraftRecuriingChecksComponent
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
    V4CheckDraftListComponent,
    V4CheckDraftViewComponent,
    V4CheckDraftRecuriingChecksComponent,
    V4SetRecurringModalComponent,
    V4ResendPermissionModalComponent,
    V4CheckDraftAddAttachmentCommentComponent,
    V4CheckDraftComponent,
    V4CheckDraftRecurringViewComponent,
    V4CheckDraftIndexComponent
  ],
  providers: [DecimalPipe, TruncatePipe]
})
export class V4CheckDraftModule {
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

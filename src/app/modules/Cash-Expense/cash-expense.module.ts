import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { PayeeModalModule } from 'src/app/shared/modal/payee-modal/payee-modal.module';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxMaskDirective, NgxMaskPipe } from 'ngx-mask';
import { SharedModule } from 'src/app/shared/shared.module';
import { NgSelectModule } from '@ng-select/ng-select';
import { DropDownComponent } from 'src/app/shared/components/drop-downs/drop-down/drop-down.component';
import { DemoVideoComponent } from 'src/app/shared/components/demo-video/demo-video.component';
import { DropDownCategoryComponent } from 'src/app/shared/components/drop-downs/drop-down-category/drop-down-category.component';
import { DropDownBankComponent } from 'src/app/shared/components/drop-downs/drop-down-bank/drop-down-bank.component';
import { DropDownPayeeComponent } from 'src/app/shared/components/drop-downs/drop-down-payee/drop-down-payee.component';
import {
  faCalculator,
  faEdit,
  faEnvelope,
  faExternalLink,
  faMinus,
  faPaperPlane,
  faPlus,
  faPlusSquare,
  faCalendar,
  faPrint,
  faReceipt,
  faSave,
  faTimes,
  faTrash,
  faTrashAlt,
  faComment,
  faPaperclip
} from '@fortawesome/pro-solid-svg-icons';
import {
  FaIconLibrary,
  FontAwesomeModule
} from '@fortawesome/angular-fontawesome';
import { NewCashComponent } from './pages/new cash/new-cash.component';
import { AngularMaterialModule } from '../angular-material/angular-material.module';

// User Components
import { CashExpenseListComponent } from './pages/cash-exp-list/cash-expense-list.component';
import { ViewCashComponent } from './pages/view cash/view-cash.component';
import { CashExpActivityLogComponent } from './components/cash-exp-activity-log/cash-exp-activity-log.component';
import { CashExpCommentsComponent } from './components/cash-exp-comments/cash-exp-comments.component';
import { CashExpAttachmentComponent } from './components/cash-exp-attachment/cash-exp-attachment.component';
import { CashExpLastTransactionComponent } from './components/cash-exp-last-transaction/cash-exp-last-transaction.component';
import { CashExpDetailComponent } from './components/cash-exp-detail/cash-exp-detail.component';
import { AuditTrailModalComponent } from './modals/audit-trail-modal/audit-trail-modal.component';
import { CashExpenseGetReceiptModalComponent } from './modals/cash-expense-get-receipt-modal/cash-expense-get-receipt-modal.component';
import { CashExpenseAddAttachmentsCommentsComponent } from './pages/cash-exp-list/cash-exp-add-attachments-comments';
import { DropDownBankCashComponent } from './components/drop-down-bank-cash/drop-down-bank-cash.component';
import { NewCashAccountModalComponent } from './modals/new-cash-account-modal/new-cash-account-modal.component';
import { DataTableModule } from '../data-table/data-table.module';
import { CashExpListSignedReceiptPrintComponent } from './pages/cash-exp-list-signed-receipt-print/cash-exp-list-signed-receipt-print.component';
import { AmountInputComponent } from 'src/app/shared/components/amount-input/amount-input.component';
import { NewPhoneInputComponent } from 'src/app/shared/components/new-phone-input/new-phone-input.component';
import { OcwBackButtonComponent } from 'src/app/shared/components/ocw-back-button/ocw-back-button.component';
import { CommonBackButtonV35Component } from 'src/app/shared/v3/buttons/common-back-button-v35/common-back-button-v35.component';
import { V3DataTableModule } from '../v3-data-table/v3-data-table.module';

const routes: Routes = [
  { path: '', redirectTo: 'index', pathMatch: 'full' },

  {
    path: 'new-cash',
    component: NewCashComponent,
    data: { mode: 'create', title: 'New Cash Expense ' }
  },

  {
    path: 'view/:id',
    component: ViewCashComponent
  },
  {
    path: 'index',
    component: CashExpenseListComponent,
    data: { title: 'Cash Expense List ' }
  },
  {
    path: 'outside/getSignature',
    component: CashExpListSignedReceiptPrintComponent
  },
  {
    path: 'outside/getSignaturePrint',
    component: CashExpListSignedReceiptPrintComponent
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    DataTableModule,
    AngularMaterialModule,
    PayeeModalModule,
    AmountInputComponent,
    SharedModule,
    DropDownPayeeComponent,
    DropDownBankComponent,
    DropDownCategoryComponent,
    DemoVideoComponent,
    NgSelectModule,
    DropDownComponent,
    NgxMaskDirective,
    NgxMaskPipe,
    NewPhoneInputComponent,
    FontAwesomeModule,
    OcwBackButtonComponent,
    CommonBackButtonV35Component,
    V3DataTableModule,
    CashExpenseListComponent,
    NewCashComponent,
    ViewCashComponent,
    CashExpActivityLogComponent,
    CashExpCommentsComponent,
    CashExpAttachmentComponent,
    CashExpLastTransactionComponent,
    CashExpDetailComponent,
    AuditTrailModalComponent,
    CashExpenseGetReceiptModalComponent,
    CashExpenseAddAttachmentsCommentsComponent,
    DropDownBankCashComponent,
    NewCashAccountModalComponent,
    CashExpListSignedReceiptPrintComponent
  ],
  providers: [DatePipe],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class CashExpenseModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(
      faPaperPlane,
      faCalculator,
      faTrash,
      faPlus,
      faCalendar,
      faExternalLink,
      faTimes,
      faSave,
      faPrint,
      faPlusSquare,
      faEnvelope,
      faReceipt,
      faTrashAlt,
      faEdit,
      faMinus,
      faComment,
      faReceipt,
      faPaperclip
    );
  }
}

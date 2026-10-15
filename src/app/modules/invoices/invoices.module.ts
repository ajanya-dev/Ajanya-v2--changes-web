import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from 'src/app/shared/shared.module';
import { NgSelectModule } from '@ng-select/ng-select';
import { InvoiceModalModule } from 'src/app/shared/modal/invoice-modal/invoice-modal.module';
import { NgxMaskDirective, NgxMaskPipe } from 'ngx-mask';
import { ThirdpartyImportsModule } from 'src/app/shared/modal/thirdparty-imports/thirdparty-imports.module';
import { DropDownComponent } from 'src/app/shared/components/drop-downs/drop-down/drop-down.component';
import { OcwBackButtonComponent } from 'src/app/shared/components/ocw-back-button/ocw-back-button.component';

import { DropZoneComponent } from 'src/app/shared/components/drop-zone/drop-zone.component';
import { DropDownCategoryComponent } from 'src/app/shared/components/drop-downs/drop-down-category/drop-down-category.component';
import { DropDownBankComponent } from 'src/app/shared/components/drop-downs/drop-down-bank/drop-down-bank.component';
import { DropDownPayeeComponent } from 'src/app/shared/components/drop-downs/drop-down-payee/drop-down-payee.component';
import { NewPhoneInputComponent } from 'src/app/shared/components/new-phone-input/new-phone-input.component';
import {
  faArrowDownToLine,
  faArrowUpRightFromSquare,
  faArrowUpToLine,
  faBan,
  faCalendar,
  faCircle,
  faCircleInfo,
  faClose,
  faEllipsisV,
  faEnvelope,
  faListAlt,
  faMagnifyingGlass,
  faPlus,
  faPrint,
  faTimes,
  faTrash,
  faTriangleExclamation
} from '@fortawesome/pro-solid-svg-icons';
import {
  FaIconLibrary,
  FontAwesomeModule
} from '@fortawesome/angular-fontawesome';
import { AmountInputComponent } from 'src/app/shared/components/amount-input/amount-input.component';
import { V35ControlMessageComponent } from 'src/app/shared/v3/control-message-v35/control-message-v35.component';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { V3DataTableSelectBoxComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-data-table-select-box/v3-data-table-select-box.component';
import { CommonBackButtonV35Component } from 'src/app/shared/v3/buttons/common-back-button-v35/common-back-button-v35.component';
import { AddInvoiceItemComponent } from './modals/add-invoice-item/add-invoice-item.component';
import { AngularMaterialModule } from '../angular-material/angular-material.module';
import { CreditMemoComponent } from './pages/credit-memo/credit-memo.component';
import { AddCreditMemoComponent } from './modals/add-credit-memo/add-credit-memo.component';

import { InvoiceListComponent } from './pages/invoice-list/invoice-list.component';
import { InvoiceTaxListComponent } from './pages/invoice-tax-list/invoice-tax-list.component';
import { AddInvoiceTaxComponent } from './modals/add-invoice-tax/add-invoice-tax.component';
import { AddInvoiceComponent } from './modals/add-invoice/add-invoice.component';
import { AddPaymentComponent } from './modals/add-payment/add-payment.component';
import { CreditAuditTrailComponent } from './modals/credit-audit-trail/credit-audit-trail.component';
import { InvoiceAuditTrailComponent } from './modals/invoice-audit-trail/invoice-audit-trail.component';
import { ViewInvoiceComponent } from './pages/view-invoice/view-invoice.component';
import { ViewCreditComponent } from './pages/view-credit/view-credit.component';
import { EmailSmsComponent } from './modals/email-sms/email-sms.component';
import { DataTableModule } from '../data-table/data-table.module';
import { CreditMemoAddAttachmentCommentComponent } from './pages/credit-memo/addAttachmentComment';
import { InvoiceAddAttachmentModalComponent } from './modals/invoice-add-attachment/invoice-add-attachment.component';
import { InvoiceItemListComponent } from './pages/invoice-item-list/invoice-item-list.component';
import { V3DataTableModule } from '../v3-data-table/v3-data-table.module';
import { InvoiceRuleListComponent } from './pages/invoice-rule-list/invoice-rule-list.component';

// import { DropDownComponent } from 'src/app/shared/components/drop-down/drop-down.component';

const routes: Routes = [
  {
    path: '',
    component: InvoiceListComponent,
    data: { title: 'Invoice List ' }
  },
  {
    path: 'items',
    component: InvoiceItemListComponent
  },
  {
    path: 'taxes',
    component: InvoiceTaxListComponent
  },
  {
    path: 'memo',
    component: CreditMemoComponent,
    data: { title: 'Credit Memo ' }
  },
  {
    path: 'credit-view',
    component: ViewCreditComponent
  },
  {
    path: 'statement',
    component: ViewInvoiceComponent
  },
  {
    path: 'rules',
    component: InvoiceRuleListComponent
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    SharedModule,
    DropDownPayeeComponent,
    DropDownBankComponent,
    AmountInputComponent,
    DropDownCategoryComponent,
    OcwBackButtonComponent,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    AngularMaterialModule,
    DataTableModule,
    NgSelectModule,
    InvoiceModalModule,
    NgxMaskDirective,
    NgxMaskPipe,
    ThirdpartyImportsModule,
    DropZoneComponent,
    DropDownComponent,
    NewPhoneInputComponent,
    FontAwesomeModule,
    V35ControlMessageComponent,
    CommonButtonV35Component,
    V3DataTableModule,
    V3DataTableSelectBoxComponent,
    CommonBackButtonV35Component,
    InvoiceItemListComponent,
    AddInvoiceItemComponent,
    CreditMemoComponent,
    AddCreditMemoComponent,
    InvoiceListComponent,
    InvoiceTaxListComponent,
    AddInvoiceTaxComponent,
    AddInvoiceComponent,
    AddPaymentComponent,
    CreditAuditTrailComponent,
    InvoiceAuditTrailComponent,
    ViewInvoiceComponent,
    ViewCreditComponent,
    EmailSmsComponent,
    CreditMemoAddAttachmentCommentComponent,
    InvoiceAddAttachmentModalComponent
    // DropDownComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class InvoicesModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(
      faPlus,
      faMagnifyingGlass,
      faCircleInfo,
      faCircle,
      faTriangleExclamation,
      faArrowUpToLine,
      faArrowDownToLine,
      faTimes,
      faTrash,
      faArrowUpRightFromSquare,
      faCalendar,
      faListAlt,
      faEllipsisV,
      faClose,
      faEnvelope,
      faPrint,
      faBan
    );
  }
}

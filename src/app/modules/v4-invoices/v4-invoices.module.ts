import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {
  FontAwesomeModule,
  FaIconLibrary
} from '@fortawesome/angular-fontawesome';
import {
  faBan,
  faCircleInfo,
  faEnvelope,
  faTrash
} from '@fortawesome/pro-solid-svg-icons';

import { V4InvoicePageComponent } from './pages/v4-invoice-page/v4-invoice-page.component';
import { V4InvoiceItemListComponent } from './pages/v4-invoice-item-list/v4-invoice-item-list.component';
import { V4InvoiceTaxListComponent } from './pages/v4-invoice-tax-list/v4-invoice-tax-list.component';
import { V4CreditMemoComponent } from './pages/v4-credit-memo/v4-credit-memo.component';
import { ViewCreditComponent } from '../invoices/pages/view-credit/view-credit.component';
import { ViewInvoiceComponent } from '../invoices/pages/view-invoice/view-invoice.component';
import { InvoiceRuleListComponent } from '../invoices/pages/invoice-rule-list/invoice-rule-list.component';

const routes: Routes = [
  {
    path: '',
    component: V4InvoicePageComponent,
    data: { title: 'Invoice' }
  },
  {
    path: 'items',
    component: V4InvoiceItemListComponent
  },
  {
    path: 'taxes',
    component: V4InvoiceTaxListComponent
  },
  {
    path: 'memo',
    component: V4CreditMemoComponent,
    data: { title: 'Credit Memo' }
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
  imports: [RouterModule.forChild(routes), FontAwesomeModule]
})
export class V4InvoicesModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(faCircleInfo, faTrash, faEnvelope, faBan);
  }
}

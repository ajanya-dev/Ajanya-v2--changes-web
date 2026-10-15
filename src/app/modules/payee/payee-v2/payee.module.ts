import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PayeeModalModule } from 'src/app/shared/modal/payee-modal/payee-modal.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { NgxMaskDirective, NgxMaskPipe } from 'ngx-mask';
import { NgSelectModule } from '@ng-select/ng-select';
import { DynamicFormComponent } from 'src/app/shared/components/dynamic-form/dynamic-form.component';
import {
  faArrowDownToLine,
  faArrowUpToLine,
  faCalendar,
  faCode,
  faCodeMerge,
  faGrid2,
  faPlus,
  faQuestionCircle,
  faTable,
  faTrash
} from '@fortawesome/pro-solid-svg-icons';
import {
  FaIconLibrary,
  FontAwesomeModule
} from '@fortawesome/angular-fontawesome';
import { WhiteLabelDirective } from 'src/app/directive/white-label.directive';
import { CommonCountryDropDownComponent } from 'src/app/shared/v3/common-country-drop-down/common-country-drop-down.component';
import { AngularMaterialModule } from '../../angular-material/angular-material.module';
import { PayeeTransactionHistoryComponent } from './pages/payee-transaction-history/payee-transaction-history.component';
import { CheckListTableComponent } from './pages/check-list-table/check-list-table.component';
import { CashExpenseTableComponent } from './pages/cash-expense-table/cash-expense-table.component';
import { BillingTableComponent } from './pages/billing-table/billing-table.component';
import { InvoiceTableComponent } from './pages/invoice-table/invoice-table.component';
import { AmountRendererComponent } from './pages/payee-transaction-history/amountRenderer';
import { AddNewBankAccountModalComponent } from './modals/add-new-bank-account-modal/add-new-bank-account-modal.component';
import { PayeeMergeModalComponent } from './modals/payee-merge-modal/payee-merge-modal.component';
import { DataTableModule } from '../../data-table/data-table.module';
import { ImportPayeeComponent } from './pages/import-payee/import-payee.component';
import { ImportPayeeStep2Component } from './pages/import-payee-step2/import-payee-step2.component';
import { NewInternationalAccountComponent } from './modals/new-international-account/new-international-account.component';
import { WalletTableComponent } from './pages/wallet-table/wallet-table.component';
import { V3DataTableModule } from '../../v3-data-table/v3-data-table.module';
import { PayeeListV4Component } from '../payee-v4/v4-pages/payee-list-v4/payee-list-v4.component';

const routes: Routes = [
  {
    path: '',
    component: PayeeListV4Component
  },
  {
    path: 'payee_data_import/step1',
    component: ImportPayeeComponent
  },
  {
    path: 'payee_data_import/step2',
    component: ImportPayeeStep2Component
  },
  {
    path: 'transaction-history/:payeeId',
    component: PayeeTransactionHistoryComponent,
    children: [
      {
        path: '',
        redirectTo: '1',
        pathMatch: 'full'
      },
      {
        path: '1',
        component: CheckListTableComponent
      },
      {
        path: '2',
        component: CashExpenseTableComponent
      },
      {
        path: '3',
        component: BillingTableComponent
      },
      {
        path: '4',
        component: InvoiceTableComponent
      },
      {
        path: '5',
        component: WalletTableComponent
      }
    ]
  },
  {
    path: ':id',
    component: PayeeListV4Component
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    AngularMaterialModule,
    HttpClientModule,
    DataTableModule,
    PayeeModalModule,
    SharedModule,
    DynamicFormComponent,
    NgxMaskDirective,
    NgxMaskPipe,
    WhiteLabelDirective,
    NgSelectModule,
    CommonCountryDropDownComponent,
    FontAwesomeModule,
    V3DataTableModule,
    PayeeTransactionHistoryComponent,
    CheckListTableComponent,
    CashExpenseTableComponent,
    BillingTableComponent,
    InvoiceTableComponent,
    AmountRendererComponent,
    AddNewBankAccountModalComponent,
    PayeeMergeModalComponent,
    ImportPayeeComponent,
    ImportPayeeStep2Component,
    NewInternationalAccountComponent,
    WalletTableComponent
  ]
})
export class PayeeModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(
      faTable,
      faPlus,
      faGrid2,
      faTrash,
      faArrowUpToLine,
      faCalendar,
      faCodeMerge,
      faCode,
      faQuestionCircle,
      faArrowDownToLine
    );
  }
}

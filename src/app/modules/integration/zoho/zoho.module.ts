import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ZohoBookComponent } from './pages/zoho-book/zoho-book.component';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AngularMaterialModule } from '../../angular-material/angular-material.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { ZohoPayrollComponent } from './pages/zoho-payroll-index/zoho-payroll.component';
import { ZohoPayrollImportPayPeriodComponent } from './components/zoho-payroll-import-pay-period/zoho-payroll-import-pay-period.component';
import { ZohobookMapBankAccountModalComponent } from './modals/zohobook-map-bank-account-modal/zohobook-map-bank-account-modal.component';
import { ZohoPayrollMapBankAccountComponent } from './pages/zoho-payroll-map-bank-account/zoho-payroll-map-bank-account.component';
import { ZohoPayrollMapBankAccountModalComponent } from './modals/zoho-payroll-map-bank-account-modal/zoho-payroll-map-bank-account-modal.component';
import { CustomerSupportComponent } from 'src/app/shared/components/customer-support/customer-support.component';
import { DemoVideoComponent } from 'src/app/shared/components/demo-video/demo-video.component';
import { OcwBackButtonComponent } from 'src/app/shared/components/ocw-back-button/ocw-back-button.component';
import { DropDownBankComponent } from 'src/app/shared/components/drop-downs/drop-down-bank/drop-down-bank.component';
import {
  faArrowDownToLine,
  faArrowUpToLine,
  faEye,
  faEyeSlash
} from '@fortawesome/pro-solid-svg-icons';
import { faPenToSquare as farPenToSquare } from '@fortawesome/pro-regular-svg-icons';
import {
  FaIconLibrary,
  FontAwesomeModule
} from '@fortawesome/angular-fontawesome';
import { CommonBackButtonV35Component } from 'src/app/shared/v3/buttons/common-back-button-v35/common-back-button-v35.component';

const routes: Routes = [
  {
    path: 'zoho_books',
    component: ZohoBookComponent
  },
  {
    path: 'zoho_payroll',
    component: ZohoPayrollComponent
  },
  {
    path: 'zoho_payroll/bank-maps',
    component: ZohoPayrollMapBankAccountComponent
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    AngularMaterialModule,
    SharedModule,
    DropDownBankComponent,
    OcwBackButtonComponent,
    DemoVideoComponent,
    CustomerSupportComponent,
    FontAwesomeModule,
    CommonBackButtonV35Component,
    ZohoBookComponent,
    ZohoPayrollComponent,
    ZohoPayrollImportPayPeriodComponent,
    ZohobookMapBankAccountModalComponent,
    ZohoPayrollMapBankAccountComponent,
    ZohoPayrollMapBankAccountModalComponent
  ]
})
export class ZohoModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(
      faArrowDownToLine,
      faArrowUpToLine,
      faEye,
      faEyeSlash,
      farPenToSquare
    );
  }
}

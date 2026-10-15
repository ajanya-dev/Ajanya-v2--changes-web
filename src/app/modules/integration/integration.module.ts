import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/shared/shared.module';
import { PipesModule } from 'src/app/pipes/pipes.module';
import { SearchFilterPipe } from 'src/app/pipes/search-filter.pipe';
import { CustomerSupportComponent } from 'src/app/shared/components/customer-support/customer-support.component';
import { DemoVideoComponent } from 'src/app/shared/components/demo-video/demo-video.component';
import { OcwBackButtonComponent } from 'src/app/shared/components/ocw-back-button/ocw-back-button.component';
import { DropDownBankComponent } from 'src/app/shared/components/drop-downs/drop-down-bank/drop-down-bank.component';
import {
  FaIconLibrary,
  FontAwesomeModule
} from '@fortawesome/angular-fontawesome';
import {
  faDownToLine,
  faEyeSlash,
  faEyes,
  faPenToSquare,
  faPlus,
  faTimes,
  faTrash,
  faUpload
} from '@fortawesome/pro-solid-svg-icons';
import { faPenToSquare as farPenToSquare } from '@fortawesome/pro-regular-svg-icons';
import { AngularMaterialModule } from '../angular-material/angular-material.module';
import { PayrollcheckIntegrationComponent } from './pages/payrollcheck-integration/payrollcheck-integration.component';
import { MapBankAccountModalComponent } from './modals/map-bank-account-modal/map-bank-account-modal.component';
import { BillDotComComponent } from './pages/bill-dot-com/bill-dot-com.component';
import { BillDotComConnectModalComponent } from './modals/bill-dot-com-connect-modal/bill-dot-com-connect-modal.component';
import { QuickbooksOnlineComponent } from './quick-books/pages/quickboks-online/quickbooks-online.component';
import { QuickbooksDesktopComponent } from './quick-books/pages/quickbooks-desktop/quickbooks-desktop.component';
import { QBDesktopDownloadfileModalComponent } from './modals/qb-desktop-downloadfile-modal/qb-desktop-downloadfile-modal.component';
import { BankAccountMappingsComponent } from './pages/bank-account-mappings/bank-account-mappings.component';
import { QuickbooksDesktopOldComponent } from './quick-books/components/quickbooks-desktop-old/quickbooks-desktop-old.component';
import { QBODuplicatedMappingsModalComponent } from './modals/qbo-duplicated-mappings-modal/qbo-duplicated-mappings-modal.component';
import { IntegrationMainComponent } from './pages/integration-main/integration-main.component';
import { CommonBackButtonV35Component } from 'src/app/shared/v3/buttons/common-back-button-v35/common-back-button-v35.component';
import { SquareImportsComponent } from 'src/app/modules/integration/square/square-integration.component';
import { AdpRunV2Component } from './adp-run-v2/adp-run-v2.component';
import { OdooHomeComponent } from './odoo/pages/odoo-home/odoo-home.component';
import { OdooMappingComponent } from './odoo/pages/odoo-mapping/odoo-mapping.component';

const routes: Routes = [
  { path: '', redirectTo: 'index', pathMatch: 'full' },
  {
    path: 'index',
    component: IntegrationMainComponent,
    data: { title: 'Apps ' }
  },
  {
    path: 'quickBooks',
    loadChildren: () =>
      import('./quick-books/quick-books.module').then(
        (m) => m.QuickBooksModule
      ),
    data: { title: 'QuickBooks ' }
  },
  {
    path: 'quickbooks_online',
    component: QuickbooksOnlineComponent
  },
  {
    path: 'qb_desktop',
    component: QuickbooksDesktopComponent
  },
  {
    path: 'qb_desktop_old',
    component: QuickbooksDesktopOldComponent
  },
  {
    path: 'zapier',
    loadChildren: () =>
      import('./zapier/zapier.module').then((m) => m.ZapierModule)
  },
  {
    path: 'gusto',
    loadChildren: () =>
      import('./gusto/gusto.module').then((m) => m.GustoModule)
  },
  {
    path: 'zoho',
    loadChildren: () => import('./zoho/zoho.module').then((m) => m.ZohoModule)
  },
  {
    path: 'xero',
    loadChildren: () => import('./xero/xero.module').then((m) => m.XeroModule)
  },
  {
    path: 'wave',
    loadChildren: () => import('./wave/wave.module').then((m) => m.WaveModule)
  },
  {
    path: 'netsuite',
    loadChildren: () =>
      import('./netsuite/netsuite.module').then((m) => m.NetsuiteModule)
  },
  {
    path: 'freeagent',
    loadChildren: () =>
      import('./freeagent/freeagent.module').then((m) => m.FreeAgentModule)
  },
  {
    path: 'odoo/main',
    component: OdooHomeComponent,
    data: { title: 'Odoo Integration' }
  },
  {
    path: 'odoo/mapping',
    component: OdooMappingComponent,
    data: { title: 'Odoo Mapping' }
  },
  {
    path: 'square',
    component: SquareImportsComponent
  },
  {
    path: 'bill-dot-com',
    component: BillDotComComponent
  },
  {
    path: 'payrollcheck',
    component: PayrollcheckIntegrationComponent
  },
  {
    path: 'quickbooks-payroll',
    loadComponent: () =>
      import('./pages/quickbooks-payroll/quickbooks-payroll.component').then(
        (m) => m.QuickbooksPayrollComponent
      ),
    data: { title: 'QuickBooks Online Payroll' }
  },
  {
    path: 'quickbooks-payroll/mapping',
    loadComponent: () =>
      import(
        './pages/quickbooks-payroll/quickbooks-payroll-mapping/quickbooks-payroll-mapping.component'
      ).then((m) => m.QuickbooksPayrollMappingComponent),
    data: { title: 'QuickBooks Online Payroll Mapping' }
  },
  {
    path: 'bank-maps',
    component: BankAccountMappingsComponent
  },
  {
    path: 'bank-maps',
    component: BankAccountMappingsComponent
  },
  {
    path: 'adp',
    loadChildren: () => import('./adp/adp.module').then((m) => m.AdpModule),
    data: {
      title: 'ADP Integration'
    }
  },
  {
    path: 'sage-business',
    loadChildren: () =>
      import('./sage-business/sage-business.module').then(
        (m) => m.SageBusinessModule
      )
  },
  {
    path: 'freshbooks',
    loadChildren: () =>
      import('./freshbooks/freshbooks.module').then((m) => m.FreshbooksModule)
  },
  {
    path: 'clearbooks',
    loadChildren: () =>
      import('./clearbooks/clearbooks.module').then((m) => m.ClearBooksModule)
  },
  {
    path: 'microsoft-dynamics-365',
    loadChildren: () =>
      import('./microsoftdynamics365/microsoftdynamics365.module').then(
        (m) => m.MicrosoftDynamics365Module
      )
  },
  {
    path: 'workday',
    loadChildren: () =>
      import('./workday/workday.module').then((m) => m.WorkDayModule)
  },
  {
    path: 'sage-intacct',
    loadChildren: () =>
      import('./sageintacct/sage-intacct.module').then(
        (m) => m.SageIntacctModule
      )
  },
  {
    path: 'adp-run-v2/dashboad',
    component: AdpRunV2Component
  },
  {
    path: 'salesforce',
    loadChildren: () =>
      import('./salesforce/salesforce.module').then((m) => m.SalesforceModule)
  },
  {
    path: 'hubspot',
    loadComponent: () =>
      import('./hubspot/pages/hubspot-home/hubspot-home.component').then((m) => m.HubspotHomeComponent)
  },
  {
    path: 'slack',
    loadComponent: () =>
      import('./slack/pages/slack-home/slack-home.component').then((m) => m.SlackHomeComponent)
  },
  {
    path: 'jobber',
    loadComponent: () =>
      import('./jobber/pages/jobber-home/jobber-home.component').then((m) => m.JobberHomeComponent)
  },
  {
    path: 'clio',
    loadComponent: () =>
      import('./clio/pages/clio-home/clio-home.component').then((m) => m.ClioHomeComponent)
  },
  {
    path: 'dayforce',
    loadChildren: () =>
      import('./dayforce/dayforce.routes').then((m) => m.dayforceRoutes)
  },
  {
    path: 'shopify',
    loadComponent: () =>
      import('./shopify/pages/shopify-home/shopify-home.component').then((m) => m.ShopifyHomeComponent)
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
    PipesModule,
    FontAwesomeModule,
    CommonBackButtonV35Component,
    PayrollcheckIntegrationComponent,
    MapBankAccountModalComponent,
    BankAccountMappingsComponent,
    BillDotComComponent,
    BillDotComConnectModalComponent,
    QBDesktopDownloadfileModalComponent,
    BankAccountMappingsComponent,
    QBODuplicatedMappingsModalComponent,
    IntegrationMainComponent,
    AdpRunV2Component
  ],
  providers: [SearchFilterPipe]
})
export class IntegrationModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(
      faPenToSquare,
      faTrash,
      faUpload,
      faPlus,
      faTimes,
      faEyes,
      faEyeSlash,
      faDownToLine,
      farPenToSquare
    );
  }
}

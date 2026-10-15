import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NewCheckComponent } from './pages/new-check/new-check.component';
// User Componets
import { CheckListComponent } from './pages/check-list/check-list.component';
import { CheckViewComponent } from './pages/check-view/check-view.component';
import { MultiImportStep1Component } from './pages/multi-import-step1/multi-import-step1.component';
import { MultiCheckComponent } from './pages/multi-check/multi-check.component';
import { GroupsComponent } from './pages/groups/groups.component';
import { MultiImportStep2Component } from './pages/multi-import-step2/multi-import-step2.component';
import { MultiImportStep3Component } from './pages/multi-import-step3/multi-import-step3.component';
import { GetRestrictedDataComponent } from './pages/get-restricted-data/get-restricted-data.component';
import { CustomCheckReportComponent } from './pages/custom-check-report/custom-check-report.component';
import { TxtfileToChecksImportLaststepComponent } from './pages/txtfile-to-checks-import-laststep/txtfile-to-checks-import-laststep.component';
import { TxtfileToChecksImportComponent } from './pages/txtfile-to-checks-import/txtfile-to-checks-import.component';
import { MulitImportEqStep1Component } from './pages/mulit-import-eq-step1/mulit-import-eq-step1.component';
import { MulitImportEqStep2Component } from './pages/mulit-import-eq-step2/mulit-import-eq-step2.component';
import { MulitImportEqStep3Component } from './pages/mulit-import-eq-step3/mulit-import-eq-step3.component';
import { SharedCheckModule } from './shared-check.module';
import { EntImportChecksStep2Component } from './pages/ent-import-checks-step2/ent-import-checks-step2.component';
import { EntImportChecksStep3Component } from './pages/ent-import-checks-step3/ent-import-checks-step3.component';
import { EntImportChecksComponent } from './pages/ent-import-checks/ent-import-checks.component';
import { EnterpriseMultiImportComponent } from './pages/enterprise-multi-import/enterprise-multi-import.component';
import { HaloImportCheckComponent } from './pages/halo-import-check/halo-import-check.component';
import { SpectrumImportComponent } from './pages/spectrum-import-check/spectrum-import/spectrum-import.component';
import { CheckReconciliationStep1Component } from './pages/check-reconciliation-step1/check-reconciliation-step1.component';
import { CheckReconciliationStep2Component } from './pages/check-reconciliation-step2/check-reconciliation-step2.component';
import { CheckReconciliationStep3Component } from './pages/check-reconciliation-step3/check-reconciliation-step3.component';
import { SalesforceImportCheckComponent } from './pages/salesforce-import-check/salesforce-import-check.component';
import { ReprintedRequestCheckListComponent } from './pages/reprinted-request-check-list/reprinted-request-check-list.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'checkrecords',
    pathMatch: 'full',
    data: { title: 'Check Records ' }
  },
  {
    path: 'checkrecords',
    component: CheckListComponent,
    data: { title: 'Check Records ' }
  },
  {
    path: 'create',
    component: NewCheckComponent,
    data: { title: 'New Check ' }
  },
  {
    path: 'view/:id',
    component: CheckViewComponent
  },
  {
    path: 'get-restricted-data',
    component: GetRestrictedDataComponent
  },
  {
    path: 'enterprise-multi-import',
    component: EnterpriseMultiImportComponent,
    data: { title: 'Import Checks' }
  },
  {
    path: 'multi_import/step1',
    component: MultiImportStep1Component,
    data: { title: 'Import Checks' }
  },
  {
    path: 'multi_import/step2',
    component: MultiImportStep2Component,
    data: { title: 'Import Checks' }
  },
  {
    path: 'multi_import/step3',
    component: MultiImportStep3Component,
    data: { title: 'Import Checks' }
  },
  {
    path: 'multi_import/txt-to-check2',
    component: TxtfileToChecksImportLaststepComponent,
    data: { title: 'Import Checks' }
  },
  {
    path: 'multi_import/txt-to-check1',
    component: TxtfileToChecksImportComponent,
    data: { title: 'Import Checks' }
  },
  {
    path: 'multi_import_eq/step1',
    component: MulitImportEqStep1Component,
    data: { title: 'Import Checks' }
  },
  {
    path: 'multi_import_eq/step2',
    component: MulitImportEqStep2Component,
    data: { title: 'Import Checks' }
  },
  {
    path: 'multi_import_eq/step3',
    component: MulitImportEqStep3Component,
    data: { title: 'Import Checks' }
  },
  {
    path: 'multiplecheck/create',
    data: {
      name: 'checks',
      mode: 'create',
      pageName: 'Multiple Checks',
      title: 'Multiple Checks'
    },
    component: MultiCheckComponent
  },
  {
    path: 'group/create',
    data: {
      name: 'group',
      mode: 'create',
      pageName: 'Create Group',
      title: 'Create Group'
    },
    component: MultiCheckComponent
  },
  {
    path: 'group/edit',
    data: {
      name: 'group',
      mode: 'edit',
      pageName: 'Update Group',
      title: 'Update Group'
    },
    component: MultiCheckComponent
  },
  {
    path: 'group/index',
    component: GroupsComponent
  },
  {
    path: 'check-report-custom',
    component: CustomCheckReportComponent,
    data: { title: 'Check Report' }
  },
  {
    path: 'v4-check-report',
    loadComponent: () =>
      import(
        './pages/v4-custom-check-report/v4-custom-check-report.component'
      ).then((m) => m.V4CustomCheckReportComponent),
    data: { title: 'Check Report' }
  },
  {
    path: 'v4-get-restricted-data',
    loadComponent: () =>
      import(
        './pages/v4-get-restricted-data/v4-get-restricted-data.component'
      ).then((m) => m.V4GetRestrictedDataComponent)
  },
  {
    path: 'hamaspik-import/step1',
    component: EntImportChecksComponent
  },
  {
    path: 'hamaspik-import/step2',
    component: EntImportChecksStep2Component
  },
  {
    path: 'hamaspik-import/step3',
    component: EntImportChecksStep3Component
  },
  {
    path: 'halo-import',
    component: HaloImportCheckComponent
  },
  {
    path: 'salesforce-import',
    component: SalesforceImportCheckComponent
  },
  {
    path: 'spectrum-import',
    component: SpectrumImportComponent
  },
  {
    path: 'reconciliation/step1',
    component: CheckReconciliationStep1Component,
    data: { title: 'Check Reconciliation' }
  },
  {
    path: 'reconciliation/step2',
    component: CheckReconciliationStep2Component,
    data: { title: 'Check Reconciliation' }
  },
  {
    path: 'reconciliation/step3',
    component: CheckReconciliationStep3Component,
    data: { title: 'Check Reconciliation' }
  },
  {
    path: 'reprinted-requests',
    component: ReprintedRequestCheckListComponent,
    data: { title: 'Reprinted Dashboard' }
  }
];
@NgModule({
  imports: [RouterModule.forChild(routes), SharedCheckModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class CheckModule {}

import { Routes } from '@angular/router';
import { MoreItemsListComponent } from './pages/more-items-list/more-items-list.component';
import { ReportsComponent } from './pages/reports/reports.component';
import { VoidCheckDataTableV4Component } from './pages/reports/void-check-data-table-v4/void-check-data-table-v4.component';
import { DeleteCheckDataTableV4Component } from './pages/reports/delete-check-data-table-v4/delete-check-data-table-v4.component';
import { CustomJobsReportV4Component } from './pages/reports/custom-jobs-report-v4/custom-jobs-report-v4.component';
import { ComingSoonPageV4Component } from 'src/app/shared/V4/coming-soon-page-v4/coming-soon-page-v4.component';

export const moreV4Routes: Routes = [
  {
    path: '',
    redirectTo: 'index',
    pathMatch: 'full'
  },
  {
    path: 'index',
    component: MoreItemsListComponent
  },
  {
    path: 'report',
    component: ReportsComponent
  },
  {
    path: 'report/void',
    component: VoidCheckDataTableV4Component
  },
  {
    path: 'report/delete',
    component: DeleteCheckDataTableV4Component
  },
  {
    path: 'report/custom-jobs',
    component: CustomJobsReportV4Component
  },
  {
    path: 'refer',
    component: ComingSoonPageV4Component,
    data: { subtitle: 'We\'re building something exciting to help you grow your business. Soon, you\'ll be able to explore and connect useful apps and services right inside Zil Money Software.' }
  }
];

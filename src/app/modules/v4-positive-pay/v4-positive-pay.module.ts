import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ModuleRegistry } from '@ag-grid-community/core';
import { ServerSideRowModelModule } from '@ag-grid-enterprise/server-side-row-model';
import { V4PositivePayRestrictionsComponent } from './pages/v4-positive-pay-restrictions/v4-positive-pay-restrictions.component';
import { V4PositivePayManagementComponent } from './pages/v4-positive-pay-management/v4-positive-pay-management.component';
import { V4PositivePayLogsComponent } from './pages/v4-positive-pay-logs/v4-positive-pay-logs.component';
import { V4PostivePayDownloadHistoryComponent } from './pages/v4-postive-pay-download-history/v4-postive-pay-download-history.component';

ModuleRegistry.registerModules([ServerSideRowModelModule]);

const routes: Routes = [
  { path: '', redirectTo: 'index', pathMatch: 'full' },
  { path: 'restrictions', component: V4PositivePayRestrictionsComponent },
  { path: 'index', component: V4PositivePayManagementComponent },
  { path: 'logs/:id', component: V4PositivePayLogsComponent },
  {
    path: 'download-history/:id',
    component: V4PostivePayDownloadHistoryComponent
  }
];

@NgModule({
  imports: [
    RouterModule.forChild(routes),
    V4PositivePayRestrictionsComponent,
    V4PositivePayManagementComponent,
    V4PositivePayLogsComponent,
    V4PostivePayDownloadHistoryComponent
  ]
})
export class V4PositivePayModule {}

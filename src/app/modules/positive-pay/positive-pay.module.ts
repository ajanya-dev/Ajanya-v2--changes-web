import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  faBuildingColumns,
  faChevronRight,
  faCircle,
  faCircleInfo,
  faClone,
  faCog,
  faFileExport,
  faLock,
  faTimes,
  faXmark
} from '@fortawesome/pro-solid-svg-icons';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from 'src/app/shared/shared.module';
import { MatDialogModule } from '@angular/material/dialog';
import { NgSelectModule } from '@ng-select/ng-select';
import { MatMenuModule } from '@angular/material/menu';
import { DropDownBankMultiSelectComponent } from 'src/app/shared/components/drop-downs/drop-down-bank-multi-select/drop-down-bank-multi-select.component';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { PositivePayManagementComponent } from './pages/positive-pay-management/positive-pay-management.component';
import { SetPositivePayModalComponent } from './modals/set-positive-pay-modal/set-positive-pay-modal.component';
import { SettingsModalComponent } from './modals/settings-modal/settings-modal.component';
import { GenerateSshModalComponent } from './modals/generate-ssh-modal/generate-ssh-modal.component';
import { ExportModalComponent } from './modals/export-modal/export-modal.component';
import { AngularMaterialModule } from '../angular-material/angular-material.module';
import { PositivePayLogsComponent } from './pages/positive-pay-logs/positive-pay-logs.component';
import { DataTableModule } from '../data-table/data-table.module';
import { PositivepayBankaccountsComponent } from './pages/positivepay-bankaccounts/positivepay-bankaccounts.component';
import { PositivePayRestrictionsComponent } from './pages/positive-pay-restrictions/positive-pay-restrictions.component';
import { V3DataTableModule } from '../v3-data-table/v3-data-table.module';
import { PostivePayDownloadHistoryComponent } from './pages/postive-pay-download-history/postive-pay-download-history.component';

const routes: Routes = [
  { path: '', redirectTo: 'index', pathMatch: 'full' },
  {
    path: 'index',
    component: PositivePayManagementComponent
  },
  {
    path: 'logs/:id',
    component: PositivePayLogsComponent
  },
  {
    path: 'getPositivePayRestrictions',
    component: PositivePayRestrictionsComponent
  },
  {
    path: 'download-history/:id',
    component: PostivePayDownloadHistoryComponent
  }
];

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule.forChild(routes),
    DataTableModule,
    SharedModule,
    MatDialogModule,
    AngularMaterialModule,
    NgSelectModule,
    MatMenuModule,
    DropDownBankMultiSelectComponent,
    V3DataTableModule,
    PositivePayManagementComponent,
    SetPositivePayModalComponent,
    SettingsModalComponent,
    GenerateSshModalComponent,
    ExportModalComponent,
    PositivePayLogsComponent,
    PositivePayRestrictionsComponent,
    PositivepayBankaccountsComponent
  ],
  providers: []
})
export class PositivePayModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(
      faXmark,
      faBuildingColumns,
      faCircleInfo,
      faCircle,
      faChevronRight,
      faTimes,
      faFileExport,
      faLock,
      faClone,
      faCog
    );
  }
}

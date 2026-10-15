import { AngularMaterialModule } from 'src/app/modules/angular-material/angular-material.module';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/shared/shared.module';
import { CustomerSupportComponent } from 'src/app/shared/components/customer-support/customer-support.component';
import { DemoVideoComponent } from 'src/app/shared/components/demo-video/demo-video.component';
import { OcwBackButtonComponent } from 'src/app/shared/components/ocw-back-button/ocw-back-button.component';
import { DropDownBankComponent } from 'src/app/shared/components/drop-downs/drop-down-bank/drop-down-bank.component';
import {
  FaIconLibrary,
  FontAwesomeModule
} from '@fortawesome/angular-fontawesome';
import {
  faArrowDownToLine,
  faArrowUpToLine,
  faCog,
  faPenToSquare,
  faTrash
} from '@fortawesome/pro-solid-svg-icons';
import { faPenToSquare as farPenToSquare } from '@fortawesome/pro-regular-svg-icons';
import { XeroSettingsModalComponent } from './modals/xero-settings-modal/xero-settings-modal.component';
import { XeroMapBankAccountModalComponent } from './modals/xero-map-bank-account-modal/xero-map-bank-account-modal.component';
import { XeroMappingListComponent } from './pages/xero-mapping-list/xero-mapping-list.component';
import { XeroImportDataModalComponent } from './modals/xero-import-data-modal/xero-import-data-modal.component';
import { XeroHomeComponent } from './pages/xero-home/xero-home.component';
import { CommonBackButtonV35Component } from 'src/app/shared/v3/buttons/common-back-button-v35/common-back-button-v35.component';

const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  {
    path: 'home',
    component: XeroHomeComponent
  },
  {
    path: 'mapping',
    component: XeroMappingListComponent
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AngularMaterialModule,
    RouterModule.forChild(routes),
    SharedModule,
    DropDownBankComponent,
    OcwBackButtonComponent,
    DemoVideoComponent,
    CustomerSupportComponent,
    FontAwesomeModule,
    CommonBackButtonV35Component,
    XeroImportDataModalComponent,
    XeroHomeComponent,
    XeroMappingListComponent,
    XeroMapBankAccountModalComponent,
    XeroSettingsModalComponent
  ]
})
export class XeroModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(
      faArrowDownToLine,
      faArrowUpToLine,
      faPenToSquare,
      faCog,
      faTrash,
      farPenToSquare
    );
  }
}

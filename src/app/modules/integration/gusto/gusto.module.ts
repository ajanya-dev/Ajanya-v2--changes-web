import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from 'src/app/shared/shared.module';
import { CustomerSupportComponent } from 'src/app/shared/components/customer-support/customer-support.component';
import { DemoVideoComponent } from 'src/app/shared/components/demo-video/demo-video.component';
import { OcwBackButtonComponent } from 'src/app/shared/components/ocw-back-button/ocw-back-button.component';
import { DropDownBankComponent } from 'src/app/shared/components/drop-downs/drop-down-bank/drop-down-bank.component';
import {
  faCog,
  faPenToSquare,
  faTimes,
  faTrashCan
} from '@fortawesome/pro-solid-svg-icons';
import {
  FaIconLibrary,
  FontAwesomeModule
} from '@fortawesome/angular-fontawesome';
import {
  faPenToSquare as farPenToSquare,
  faTrashCan as farTrashCan
} from '@fortawesome/pro-regular-svg-icons';
import { GustoIntegrationComponent } from './pages/gusto-integration/gusto-integration.component';
import { AngularMaterialModule } from '../../angular-material/angular-material.module';
import { CreateGustoNewCompanyModalComponent } from './modals/create-gusto-new-company-modal/create-gusto-new-company-modal.component';
import { GustoPayrollListComponent } from './components/gusto-payroll-list/gusto-payroll-list.component';
import { ViewGustoPayrollComponent } from './components/view-gusto-payroll/view-gusto-payroll.component';
import { ViewDetailedGustoPayrollComponent } from './components/view-detailed-gusto-payroll/view-detailed-gusto-payroll.component';
import { GustoMappingComponent } from './pages/gusto-mapping/gusto-mapping.component';
import { GustoMapBankAccountModalComponent } from './components/gusto-map-bank-account-modal/gusto-map-bank-account-modal.component';
import { CommonBackButtonV35Component } from 'src/app/shared/v3/buttons/common-back-button-v35/common-back-button-v35.component';

const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  {
    path: 'home',
    component: GustoIntegrationComponent
  },
  {
    path: 'mapping',
    component: GustoMappingComponent
  }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    AngularMaterialModule,
    SharedModule,
    DropDownBankComponent,
    OcwBackButtonComponent,
    DemoVideoComponent,
    CustomerSupportComponent,
    FontAwesomeModule,
    CommonBackButtonV35Component,
    GustoIntegrationComponent,
    CreateGustoNewCompanyModalComponent,
    GustoPayrollListComponent,
    ViewGustoPayrollComponent,
    ViewDetailedGustoPayrollComponent,
    GustoMappingComponent,
    GustoMapBankAccountModalComponent
  ]
})
export class GustoModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(
      faTrashCan,
      faTimes,
      faCog,
      faPenToSquare,
      farPenToSquare,
      farTrashCan
    );
  }
}

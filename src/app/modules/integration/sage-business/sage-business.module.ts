import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from 'src/app/shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
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
  faPenToSquare,
  faTrash
} from '@fortawesome/pro-solid-svg-icons';
import { faPenToSquare as farPenToSquare } from '@fortawesome/pro-regular-svg-icons';
import { AngularMaterialModule } from '../../angular-material/angular-material.module';
import { SageBusinessMapBankAccountModalComponent } from './modals/sage-business-map-bank-account-modal/sage-business-map-bank-account-modal.component';
import { SageBusinessMappingComponent } from './pages/sage-business-mapping/sage-business-mapping.component';
import { SageBusinessHomeComponent } from './pages/sage-business-home/sage-business-home.component';
import { CommonBackButtonV35Component } from 'src/app/shared/v3/buttons/common-back-button-v35/common-back-button-v35.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    component: SageBusinessHomeComponent
  },
  {
    path: 'mapping',
    component: SageBusinessMappingComponent
  }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    SharedModule,
    DropDownBankComponent,
    OcwBackButtonComponent,
    DemoVideoComponent,
    CustomerSupportComponent,
    FormsModule,
    ReactiveFormsModule,
    AngularMaterialModule,
    FontAwesomeModule,
    CommonBackButtonV35Component,
    SageBusinessHomeComponent,
    SageBusinessMappingComponent,
    SageBusinessMapBankAccountModalComponent
  ]
})
export class SageBusinessModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(
      faArrowDownToLine,
      faArrowUpToLine,
      faPenToSquare,
      faTrash,
      farPenToSquare
    );
  }
}

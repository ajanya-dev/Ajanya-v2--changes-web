import { NetsuiteHomeComponent } from './pages/netsuite-home/netsuite-home.component';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AngularMaterialModule } from 'src/app/modules/angular-material/angular-material.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { ImportPayeeNetsuiteModalComponent } from './modals/import-payee-netsuite-modal/import-payee-netsuite-modal.component';
import { CustomerSupportComponent } from 'src/app/shared/components/customer-support/customer-support.component';
import { OcwBackButtonComponent } from 'src/app/shared/components/ocw-back-button/ocw-back-button.component';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import {
  faArrowDownToLine,
  faArrowUpToLine,
  faXmark
} from '@fortawesome/pro-solid-svg-icons';
import { DemoVideoComponent } from 'src/app/shared/components/demo-video/demo-video.component';
import { NetsuiteMappingComponent } from './pages/netsuite-mapping/netsuite-mapping.component';

const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  {
    path: 'home',
    component: NetsuiteHomeComponent
  },
  {
    path: 'mapping',
    component: NetsuiteMappingComponent
  }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    FormsModule,
    ReactiveFormsModule,
    AngularMaterialModule,
    SharedModule,
    OcwBackButtonComponent,
    CustomerSupportComponent,
    DemoVideoComponent,
    NetsuiteHomeComponent,
    ImportPayeeNetsuiteModalComponent
  ]
})
export class NetsuiteModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(faArrowDownToLine, faArrowUpToLine, faXmark);
  }
}

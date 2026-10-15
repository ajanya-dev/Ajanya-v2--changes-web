import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AngularMaterialModule } from 'src/app/modules/angular-material/angular-material.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { CustomerSupportComponent } from 'src/app/shared/components/customer-support/customer-support.component';
import { DemoVideoComponent } from 'src/app/shared/components/demo-video/demo-video.component';
import { OcwBackButtonComponent } from 'src/app/shared/components/ocw-back-button/ocw-back-button.component';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faArrowsDownToLine, faX } from '@fortawesome/pro-solid-svg-icons';
import { WaveImportPayeeModalComponent } from './modals/wave-import-payee-modal/wave-import-payee-modal.component';
import { WaveHomeComponent } from './pages/wave-home/wave-home.component';

const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  {
    path: 'home',
    component: WaveHomeComponent
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
    DemoVideoComponent,
    CustomerSupportComponent,
    WaveHomeComponent,
    WaveImportPayeeModalComponent
  ]
})
export class WaveModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(faArrowsDownToLine, faX);
  }
}

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from 'src/app/shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FreshbooksHomeComponent } from './pages/freshbooks-home/freshbooks-home.component';
import { FreshbooksSettingsModalComponent } from './modals/freshbooks-settings-modal/freshbooks-settings-modal.component';
import { CustomerSupportComponent } from 'src/app/shared/components/customer-support/customer-support.component';
import { DemoVideoComponent } from 'src/app/shared/components/demo-video/demo-video.component';
import { OcwBackButtonComponent } from 'src/app/shared/components/ocw-back-button/ocw-back-button.component';

const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  {
    path: 'home',
    component: FreshbooksHomeComponent
  }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    SharedModule,
    OcwBackButtonComponent,
    DemoVideoComponent,
    CustomerSupportComponent,
    FormsModule,
    ReactiveFormsModule,
    FreshbooksHomeComponent,
    FreshbooksSettingsModalComponent
  ]
})
export class FreshbooksModule {}

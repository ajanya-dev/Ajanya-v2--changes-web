import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { DemoVideoComponent } from 'src/app/shared/components/demo-video/demo-video.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { SalesforceHomeComponent } from './pages/salesforce-home/salesforce-home.component';

const routes: Routes = [
  {
    path: '',
    component: SalesforceHomeComponent
  }
];


@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    DemoVideoComponent,
    SharedModule,
    SalesforceHomeComponent

  ]
})
export class SalesforceModule { }

import { WorkdayHomeComponent } from './workday-home/workday-home.component';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AngularMaterialModule } from 'src/app/modules/angular-material/angular-material.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { CustomerSupportComponent } from 'src/app/shared/components/customer-support/customer-support.component';
import { OcwBackButtonComponent } from 'src/app/shared/components/ocw-back-button/ocw-back-button.component';

const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  {
    path: 'home',
    component: WorkdayHomeComponent
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
    CustomerSupportComponent,
    OcwBackButtonComponent,
    WorkdayHomeComponent
  ]
})
export class WorkDayModule {}

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmAlertComponent } from './components/confirm-alert/confirm-alert.component';
import { FailedAlertComponent } from './components/failed-alert/failed-alert.component';
import { InfoAlertComponent } from './components/info-alert/info-alert.component';
import { SuccessAlertComponent } from './components/success-alert/success-alert.component';
import { WarningAlertComponent } from './components/warning-alert/warning-alert.component';
import { AngularMaterialModule } from 'src/app/modules/angular-material/angular-material.module';

@NgModule({
  imports: [
    AngularMaterialModule,
    CommonModule,
    ConfirmAlertComponent,
    FailedAlertComponent,
    InfoAlertComponent,
    SuccessAlertComponent,
    WarningAlertComponent
  ]
})
export class AlertModule {}

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeviceModalComponent } from './device-modal/device-modal.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AngularMaterialModule } from 'src/app/modules/angular-material/angular-material.module';
import { SharedModule } from '../../shared.module';

@NgModule({
  imports: [
    AngularMaterialModule,
    ReactiveFormsModule,
    CommonModule,
    SharedModule,
    FormsModule,
    DeviceModalComponent
  ]
})
export class DeviceModalModule {}

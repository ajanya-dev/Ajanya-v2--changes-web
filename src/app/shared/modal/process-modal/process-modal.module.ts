import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AddEmailPayeeModalComponent } from './add-email-payee-modal/add-email-payee-modal.component';
import { AngularMaterialModule } from 'src/app/modules/angular-material/angular-material.module';
import { SharedModule } from '../../shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatDialogModule } from '@angular/material/dialog';

@NgModule({
  imports: [
    AngularMaterialModule,
    ReactiveFormsModule,
    CommonModule,
    RouterModule,
    FormsModule,
    SharedModule,
    MatDialogModule,
    AddEmailPayeeModalComponent
  ],
  exports: [AddEmailPayeeModalComponent]
})
export class ProcessModalModule {}

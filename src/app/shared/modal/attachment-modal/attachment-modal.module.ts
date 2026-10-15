import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AngularMaterialModule } from 'src/app/modules/angular-material/angular-material.module';
import { ReactiveFormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { AddAttachmentModalComponent } from './add-attachment-modal/add-attachment-modal.component';
import { DropZoneComponent } from '../../components/drop-zone/drop-zone.component';
import { CommonButtonV35Component } from '../../v3/buttons/common-button-v35/common-button-v35.component';

@NgModule({
  imports: [
    CommonModule,
    AngularMaterialModule,
    ReactiveFormsModule,
    FontAwesomeModule,
    DropZoneComponent,
    CommonButtonV35Component,
    AddAttachmentModalComponent
  ]
})
export class AttachmentModalModule {}

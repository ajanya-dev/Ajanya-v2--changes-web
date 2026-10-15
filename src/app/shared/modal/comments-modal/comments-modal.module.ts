import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AngularMaterialModule } from 'src/app/modules/angular-material/angular-material.module';
import { ReactiveFormsModule } from '@angular/forms';
import { AddCommentsModalComponent } from './add-comments-modal/add-comments-modal.component';
import { SharedModule } from '../../shared.module';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CommonButtonV35Component } from '../../v3/buttons/common-button-v35/common-button-v35.component';

@NgModule({
  imports: [
    AngularMaterialModule,
    ReactiveFormsModule,
    CommonModule,
    SharedModule,
    FontAwesomeModule,
    CommonButtonV35Component,
    AddCommentsModalComponent
  ]
})
export class CommentsModalModule {}

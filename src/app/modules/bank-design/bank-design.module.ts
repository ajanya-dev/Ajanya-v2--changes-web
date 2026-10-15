import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/shared/shared.module';
import { NgxMaskDirective, NgxMaskPipe } from 'ngx-mask';
import { ImageCropperModule } from 'ngx-image-cropper';
import { MatDialogModule } from '@angular/material/dialog';
import { UploadPanelModule } from 'src/app/shared/components/upload-panel/upload-panel.module';
import {
  faExclamationCircle,
  faPlus,
  faPlusCircle,
  faTimes,
  faTimesCircle
} from '@fortawesome/pro-solid-svg-icons';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { LogoUploadModalComponent } from './modals/logo-upload-modal/logo-upload-modal.component';
import { SignUploadModalComponent } from './modals/sign-upload-modal/sign-upload-modal.component';
import { AngularMaterialModule } from '../angular-material/angular-material.module';
import { NewBankNickNameModalComponent } from './modals/new-bank-nick-name-modal/new-bank-nick-name-modal.component';
import { StepTwoComponent } from './pages/step-two/step-two.component';

const routes: Routes = [
  { path: '', redirectTo: 'step-1', pathMatch: 'full' },
  {
    path: 'step-2',
    component: StepTwoComponent
  }
];

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule.forChild(routes),
    SharedModule,
    NgxMaskDirective,
    NgxMaskPipe,
    ImageCropperModule,
    MatDialogModule,
    UploadPanelModule,
    AngularMaterialModule,
    StepTwoComponent,
    LogoUploadModalComponent,
    SignUploadModalComponent,
    NewBankNickNameModalComponent
  ]
})
export class BankDesignModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(
      faPlus,
      faTimes,
      faTimesCircle,
      faPlusCircle,
      faExclamationCircle
    );
  }
}

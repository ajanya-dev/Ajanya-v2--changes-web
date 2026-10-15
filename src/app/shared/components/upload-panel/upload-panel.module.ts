import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxMaskDirective, NgxMaskPipe } from 'ngx-mask';
import { AngularMaterialModule } from 'src/app/modules/angular-material/angular-material.module';
import { signatureUploadPanelComponent } from './signature-upload-panel/signature-upload-panel.component';
import { LogoUploadPanelComponent } from './logo-upload-panel/logo-upload-panel.component';

@NgModule({
  imports: [
    AngularMaterialModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    NgxMaskDirective,
    NgxMaskPipe,
    signatureUploadPanelComponent,
    LogoUploadPanelComponent
  ],
  exports: [signatureUploadPanelComponent, LogoUploadPanelComponent]
})
export class UploadPanelModule {}

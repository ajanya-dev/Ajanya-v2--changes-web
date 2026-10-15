import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { AngularMaterialModule } from 'src/app/modules/angular-material/angular-material.module';
import { PaymentSharedModule } from 'src/app/modules/payments/shared/payment-shared.module';
import { PipesModule } from 'src/app/pipes/pipes.module';
import { signatureUploadPanelComponent } from 'src/app/shared/components/upload-panel/signature-upload-panel/signature-upload-panel.component';
import { UploadPanelModule } from 'src/app/shared/components/upload-panel/upload-panel.module';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { CommonUploadButtonV35Component } from 'src/app/shared/v3/buttons/common-upload-button-v35/common-upload-button-v35.component';
import { IntroService } from '../../service/intro.service';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    FontAwesomeModule,
    AngularMaterialModule,
    UploadPanelModule,
    PaymentSharedModule,
    CommonButtonV35Component,
    PipesModule,
    NgOptimizedImage,
    CommonUploadButtonV35Component
  ],
  selector: 'app-verify-card-modal',
  templateUrl: './verify-card-modal.component.html',
  styleUrls: ['./verify-card-modal.component.scss']
})
export class VerifyCardModalComponent {
  private matDialog = inject(MatDialog);
  dialogRef = inject(MatDialogRef<VerifyCardModalComponent>);
  private introService = inject(IntroService);

  fileUploaded = false;

  step = 1;

  loading = false;

  card = {
    nickName: 'newton indian',
    card: 'XXXXXXXXXXXXXX0005'
  };

  userName = 'TestUser';
  invoiceNumber = '123ssdf334';
  payeeName: 'SomePayee';
  amount = 222;
  cardHolderName = 'TestUser';
  cardNumber = '123456789998765';

  signatureUrl: string;
  signaturePadImg = '';

  fileUpload(file: File) {
    if (file.name) {
      this.fileUploaded = true;
    } else {
      this.fileUploaded = false;
    }
    setTimeout(() => {
      this.introStepUpdate('#intro-verify-invoice-next-button');
    }, 100);
  }

  nextButtonClick() {
    if (this.step === 2) {      
      this.dialogRef.close('processed');
      return;
    }
    this.step = 2;
    this.introStepUpdate('.intro-verify-invoice-signature-div');
  }

  close(){
    this.dialogRef.close();
    this.matDialog.closeAll();

  }

  addSignature() {
    if (this.signaturePadImg !== '') return;

    const dialogRef = this.matDialog.open(signatureUploadPanelComponent, {
      maxWidth: '690px',
      width: '93%',
      panelClass: 'upload_panel_wrapper',
      minHeight: '410px',
      disableClose: true
    });

    dialogRef.afterOpened().subscribe(() => {
      this.introStepUpdate('.intro-signature-div');
    });

    dialogRef.afterClosed().subscribe((signImg) => {
      if (signImg) {
        this.signatureUrl = signImg.signatureUrl?.split('the_img=')[1];
        if (signImg.signPad) {
          this.signaturePadImg = signImg.signPad;
        }
        if (signImg.existSign) {
          this.signaturePadImg = signImg.existSign;
          this.signatureUrl = signImg.existSign?.split('the_img=')[1];
        }
        if (signImg.uploadSign) {
          this.signaturePadImg = signImg.uploadSign;
        }
        if (signImg.digitalSign) {
          this.signaturePadImg = signImg.digitalSign;
        }
      }
      this.introStepUpdate('#intro-verify-invoice-next-button');
    });
  }

  removeSign(event: Event) {
    event.stopPropagation();
    this.signaturePadImg = '';
  }

  introStepUpdate(selector: string) {
    this.introService.introStepChange.next(selector);
  }
}

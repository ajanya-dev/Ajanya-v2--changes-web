import { finalize } from 'rxjs/operators';
import { PlexeService } from '../../../../../shared/service/plexe/plexe.service';
import { Subscription } from 'rxjs';
import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  OnDestroy
} from '@angular/core';
import { IAgreementData } from 'src/app/modules/business-tools/plexe/model/plexe';
import { signatureUploadPanelComponent } from 'src/app/shared/components/upload-panel/signature-upload-panel/signature-upload-panel.component';
import { MatDialogRef, MatDialog } from '@angular/material/dialog';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { WarningAlertComponent } from 'src/app/shared/alert/components/warning-alert/warning-alert.component';
import { RouterLink } from '@angular/router';
import { NgIf, NgClass } from '@angular/common';

@Component({
  selector: 'app-plexe-agreement',
  templateUrl: './plexe-agreement.component.html',
  styleUrls: ['./plexe-agreement.component.scss'],
  standalone: true,
  imports: [NgIf, NgClass, RouterLink]
})
export class PlexeAgreementComponent implements OnInit, OnDestroy {
  @Output() nextStep = new EventEmitter<boolean>();
  @Input() applicationId: string;
  subscrption: Subscription[] = [];
  isLoading = false;
  platformAgreement: IAgreementData;
  firstSign: string;
  secondSign: string;
  signaturePadImg: string | undefined;
  firstSignUrl: string;
  secondSignUrl: string;
  showNext = false;
  agreementContainer: string | undefined;
  conditionsContainer1: string | undefined;
  conditionsContainer2: string | undefined;
  btnDisable = false;

  constructor(
    private _plexeService: PlexeService,
    private _dialog: MatDialog,
    private _alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.getContractAgreement();
  }

  /**
   * @description Get plexe agreements with application id.
   *
   */
  getContractAgreement(): void {
    this.isLoading = true;
    this.subscrption.push(
      this._plexeService
        .gePlexeAgreement(this.applicationId)
        .pipe(
          finalize(() => {
            this.isLoading = false;
          })
        )
        .subscribe(
          (res) => {
            if (res?.success) {
              if (res?.data?.platformAgreementHTML) {
                this.platformAgreement = res?.data;
                this.agreementContainer =
                  this.platformAgreement.platformAgreementHTML;
                this.conditionsContainer1 =
                  res?.data?.platformAgreementSignCondition1;
                this.conditionsContainer2 =
                  res?.data?.platformAgreementSignCondition2;
              }
            }
          },
          (err) => {
            if (err.error.errorMsg) {
              this.isLoading = false;
            }
          }
        )
    );
  }

  /**
   * @description  Open sign modal.
   *
   */
  openSignModal(signature: number): void {
    const dialogRef: MatDialogRef<signatureUploadPanelComponent> =
      this._dialog.open(signatureUploadPanelComponent, {
        maxWidth: '690px',
        width: '93%',
        panelClass: 'upload_panel_wrapper',
        minHeight: '410px',
        disableClose: true
      });
    dialogRef.afterClosed().subscribe((signImg) => {
      if (signature === 1) {
        //======> Sign tap values
        sessionStorage.setItem('signTipVal', JSON.stringify(false));

        this.firstSign = signImg.signatureUrl;
        if (signImg) {
          if (signImg.signPad) {
            this.signaturePadImg = signImg.signPad;
          }
          if (signImg.existSign) {
            this.signaturePadImg = signImg.existSign;
            this.firstSign = signImg.existSign;
          }
          if (signImg.uploadSign) {
            this.signaturePadImg = signImg.uploadSign;
          }
          if (signImg.digitalSign) {
            this.signaturePadImg = signImg.digitalSign;
          }
          this.firstSignUrl = this.firstSign.split('the_img=')[1];
        }
      }
      if (signature === 2) {
        sessionStorage.setItem('signTipVal', JSON.stringify(false));

        this.secondSign = signImg.signatureUrl;
        if (signImg) {
          if (signImg.signPad) {
            this.signaturePadImg = signImg.signPad;
          }
          if (signImg.existSign) {
            this.signaturePadImg = signImg.existSign;
            this.secondSign = signImg.existSign;
          }
          if (signImg.uploadSign) {
            this.signaturePadImg = signImg.uploadSign;
          }
          if (signImg.digitalSign) {
            this.signaturePadImg = signImg.digitalSign;
          }
          this.secondSignUrl = this.secondSign.split('the_img=')[1];
        }
      }
    });
  }

  /**
   * @description  Submit signature.
   *
   */
  onSubmit(): void {
    const signData: { signature: string; signature2: string } = {
      signature: this.firstSignUrl,
      signature2: this.secondSignUrl
    };

    this.btnDisable = true;
    this.subscrption.push(
      this._plexeService
        .setSignContract(this.applicationId, signData)
        .pipe(
          finalize(() => {
            this.btnDisable = false;
          })
        )
        .subscribe((res) => {
          if (res?.success) {
            this.nextStep.emit(true);
          }
        })
    );
  }

  /**
   * @description checking signatures.
   *
   */
  gotoNext(): void {
    if (this.firstSign) {
      this.showNext = true;
    } else {
      this.showNext = false;
      this.openWarningAlert('Please add signature');
    }
  }

  /**
   * @description Warning alert.
   *
   */
  openWarningAlert(
    content: string,
    doneMsg?: string
  ): MatDialogRef<WarningAlertComponent, boolean> {
    const openWarningAlertData = {
      title: 'Error',
      content: content,
      doneMsg: doneMsg ? doneMsg : 'OK'
    };
    return this._alertService.warningAlert(openWarningAlertData);
  }

  ngOnDestroy(): void {
    this.subscrption.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}

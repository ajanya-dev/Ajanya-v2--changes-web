import { Component, OnInit, inject } from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialog
} from '@angular/material/dialog';
import { NgOptimizedImage } from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faCircleInfo, faPaperPlane } from '@fortawesome/pro-solid-svg-icons';
import {
  ICheckMailTrackDetails,
  ICheckTrackingDetails,
  ICheckTrackingInfo,
  USPS_FIRST_CLASS_MAILED_TYPE
} from '../../model/check';
import { CommonButtonV35Component } from '../../../../shared/v3/buttons/common-button-v35/common-button-v35.component';
import { SendTrackingComponent } from '../../modal/send-tracking/send-tracking.component';

@Component({
  selector: 'app-mail-tracking-modal',
  templateUrl: './mail-tracking-modal.component.html',
  styleUrls: ['./mail-tracking-modal.component.scss'],
  standalone: true,
  imports: [
    MatDialogClose,
    FaIconComponent,
    NgOptimizedImage,
    CommonButtonV35Component
  ]
})
export class MailTrackingModalComponent implements OnInit {
  public dialogRef = inject(MatDialogRef<MailTrackingModalComponent>);
  private dialog = inject(MatDialog);
  public data: {
    trackDate: ICheckMailTrackDetails;
    id: string;
    mode: 'check' | 'invoice' | 'mail-doc';
  } = inject(MAT_DIALOG_DATA);

  shipdata: ICheckTrackingDetails;
  trackingDetails: ICheckTrackingInfo[];
  delivery = 'Delivered On';
  mailedType: number;
  themeTextColor = 'common-green-color';
  faPaperPlane = faPaperPlane;
  faCircleInfo = faCircleInfo;
  isImbLimitedTracking = false;

  ngOnInit(): void {
    this.shipdata = this.data.trackDate.trackingData.data;
    this.trackingDetails = this.data.trackDate.trackingData.data.details;
    this.mailedType = this.data.trackDate.mailedType;
    this.isImbLimitedTracking =
      this.mailedType === USPS_FIRST_CLASS_MAILED_TYPE;
    if (this.shipdata.status === 'delivered') {
      this.delivery = 'Delivered On';
    } else {
      this.delivery = 'Estimate Delivery';
    }
  }

  openDetails(trackingCode: string) {
    window.open(`/external/mail-track/${trackingCode}`);
  }

  /**
   * Converts a status string to a readable format.
   * @param {string} status - The status string to convert.
   * @returns {string} The converted status.
   */
  convertToReadable(status: string): string {
    return status
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  sendTrack() {
    this.dialog.open(SendTrackingComponent, {
      maxWidth: '465px',
      width: '93%',
      disableClose: true,
      data: {
        mode: this.data.mode,
        id: this.data.id,
        trackingUrl: this.data.trackDate.trackingUrl,
        payee:this.data.trackDate.payee
      }
    });
  }
}

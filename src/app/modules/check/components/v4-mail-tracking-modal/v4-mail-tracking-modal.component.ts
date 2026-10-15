import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialog
} from '@angular/material/dialog';
import { NgOptimizedImage } from '@angular/common';
import {
  LucideAngularModule,
  X,
  Truck,
  MapPin,
  Barcode,
  Check,
  Info
} from 'lucide-angular';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { getMailTrackUrl } from 'src/app/shared/utils/v4-external.util';
import {
  ICheckMailTrackDetails,
  ICheckTrackingDetails,
  ICheckTrackingInfo,
  USPS_FIRST_CLASS_MAILED_TYPE
} from '../../model/check';
import { V4SendTrackingComponent } from '../v4-send-tracking/v4-send-tracking.component';

@Component({
  selector: 'app-v4-mail-tracking-modal',
  templateUrl: './v4-mail-tracking-modal.component.html',
  styleUrls: ['./v4-mail-tracking-modal.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogClose,
    NgOptimizedImage,
    LucideAngularModule,
    CommonButtonV4Component
  ]
})
export class V4MailTrackingModalComponent implements OnInit {
  private dialog = inject(MatDialog);
  public data: {
    trackDate: ICheckMailTrackDetails;
    id: string;
    mode: 'check' | 'invoice' | 'mail-doc';
  } = inject(MAT_DIALOG_DATA);

  readonly XIcon = X;
  readonly TruckIcon = Truck;
  readonly MapPinIcon = MapPin;
  readonly BarcodeIcon = Barcode;
  readonly CheckIcon = Check;
  readonly InfoIcon = Info;

  shipdata: ICheckTrackingDetails;
  trackingDetails: ICheckTrackingInfo[];
  delivery = 'Delivered On';
  mailedType: number;
  isImbLimitedTracking = false;

  readonly steps = ['pre_transit', 'in_transit', 'out_for_delivery', 'delivered'];
  readonly stepLabels = ['Pre-Transit', 'In Transit', 'Out for Delivery', 'Delivered'];

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

  getStepState(stepIndex: number): 'complete' | 'active' | 'inactive' {
    const currentIndex = this.steps.indexOf(this.shipdata?.status);
    if (currentIndex === -1) {
      return stepIndex === 0 ? 'active' : 'inactive';
    }
    if (stepIndex < currentIndex) return 'complete';
    if (stepIndex === currentIndex) return 'active';
    return 'inactive';
  }

  openDetails(trackingCode: string) {
    window.open(getMailTrackUrl(trackingCode), '_blank');
  }

  convertToReadable(status: string): string {
    return status
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  getProgressPercent(): number {
    const currentIndex = this.steps.indexOf(this.shipdata?.status);
    if (currentIndex <= 0) return 0;
    return (currentIndex / (this.steps.length - 1)) * 100;
  }

  sendTrack() {
    this.dialog.open(V4SendTrackingComponent, {
      maxWidth: '465px',
      width: '93%',
      disableClose: true,
      panelClass: 'paddingless-modal-rounded',
      data: {
        mode: this.data.mode,
        id: this.data.id,
        trackingCode: this.data.trackDate.trackingCode,
        payee: this.data.trackDate.payee
      }
    });
  }
}

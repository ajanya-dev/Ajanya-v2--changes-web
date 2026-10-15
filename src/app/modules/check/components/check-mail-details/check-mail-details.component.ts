import { Component, Input, OnDestroy, OnInit, inject, output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subscription, finalize } from 'rxjs';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { NgClass } from '@angular/common';
import { MailTrackingModalComponent } from '../mail-tracking-modal/mail-tracking-modal.component';
import { V4MailTrackingModalComponent } from '../v4-mail-tracking-modal/v4-mail-tracking-modal.component';
import { ICheckCustomAddress, ICheckMailTrackDetails, ICustomShippingToCarrierDetails, IMailedAttachment, USPS_FIRST_CLASS_MAILED_TYPE } from '../../model/check';
import { Router } from '@angular/router';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';

@Component({
  selector: 'app-check-mail-details',
  templateUrl: './check-mail-details.component.html',
  styleUrls: ['./check-mail-details.component.scss'],
  standalone: true,
  imports: [NgClass]
})
export class CheckMailDetailsComponent implements OnInit, OnDestroy {
  checkService = inject(CheckService);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private localStorageService = inject(LocalStorageService);

  @Input() checkId: string;
  @Input() isCustomAddress: boolean = false;
  @Input() customShippingTo: string;
  @Input() payeeAddress: ICheckCustomAddress;
  @Input() customTrackingDetails: ICustomShippingToCarrierDetails;
  @Input() shippingMethod: string;
  @Input() customShippingFrom: string;
  @Input() groupMailingDetails: {check_mailing_group_check_ids:string[],check_mailing_group_name:string,check_mailing_group_id:string};

  mailAttachment = output<IMailedAttachment[]>();
  subscriptions: Subscription[] = [];
  mailDetails: ICheckMailTrackDetails;
  trackingDetails: ICheckMailTrackDetails;
  loading = false;
  loadingData = false;
  customAddress: {
    fromAddress: ICheckCustomAddress | undefined;
    toAddress: ICheckCustomAddress | undefined;
  };

  customAddressTo: ICheckCustomAddress;
  customAddressFrom: ICheckCustomAddress;

  readonly isV4 = this.localStorageService.getItem('isV4LayoutEnabled') === 1;

  get isImbLimitedTracking(): boolean {
    return this.mailDetails?.mailedType === USPS_FIRST_CLASS_MAILED_TYPE;
  }


  ngOnInit(): void {
    if(!this.isCustomAddress){
      this.getCheckMailDetails();
      this.getMailCustomAddress();
    }else{
      this.getMailFromCustomAddress();
      this.getMailToCustomAddress();
    }
    
  }

  getMailCustomAddress() {
    this.customAddress = {
      fromAddress: this.checkService.checkData.customFromAddress ?? undefined,
      toAddress: this.checkService.checkData.customToAddress ?? undefined
    };
  }

  getCheckMailDetails() {
    this.loadingData = true;
    this.subscriptions.push(
      this.checkService
        .getCheckTracking(this.checkId)
        .pipe(
          finalize(() => {
            this.loadingData = false;
          })
        )
        .subscribe((data) => {
          if (data?.success) {
            this.mailDetails = data.data;
            if (data.data.trackingData.success) {
              this.trackingDetails = data.data;
            }
            if(data.data.mailedAttachments){
              this.mailAttachment.emit(data.data.mailedAttachments);
            }
          }
        })
    );
  }

  track() {
    if (this.trackingDetails && this.trackingDetails.trackingData?.data?.details && this.trackingDetails.trackingData?.data?.details.length > 0) {
      this.loading = true;
      const updatedTrackDetails = JSON.parse(JSON.stringify(this.trackingDetails));
      if (updatedTrackDetails.trackingData?.data?.details) {
        updatedTrackDetails.trackingData.data.details = updatedTrackDetails.trackingData.data.details.reverse();
      }
      const dialogData = { trackDate: updatedTrackDetails, id: this.checkId, mode: 'check' as const };
      const dialogRef = this.isV4
        ? this.dialog.open(V4MailTrackingModalComponent, {
            disableClose: true,
            maxWidth: '1010px',
            width: '99%',
            maxHeight: '83%',
            autoFocus: false,
            panelClass: 'paddingless-modal-rounded',
            data: dialogData
          })
        : this.dialog.open(MailTrackingModalComponent, {
            disableClose: true,
            maxWidth: '1010px',
            width: '99%',
            maxHeight: '83%',
            autoFocus: false,
            data: dialogData
          });
      dialogRef.afterClosed().subscribe(() => {
        this.loading = false;
      });
    } else {
      open(this.mailDetails.trackingUrl, '_blank');
    }
  }


  getMailToCustomAddress() {
    this.loadingData = true;
    this.subscriptions.push(
      this.checkService.getToSingleId(this.customShippingTo).pipe(finalize(() => {
        this.loadingData = false;
      })).subscribe((res) => {
        this.customAddressTo = res.data;
      })
    );
  }

  getMailFromCustomAddress() {
    this.loadingData = true;
    this.subscriptions.push(
      this.checkService.getFromSingleId(this.customShippingFrom).pipe(finalize(() => {
        this.loadingData = false;
      })).subscribe((res) => {
        this.customAddressFrom = res.data;
      })
    );
  }

  openGroupMailingDetails(id: string) {
    this.router.navigate(['/manage/business-tools/mail-dashboard/group-mailing/details', id]);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((e) => e.unsubscribe());
  }
}

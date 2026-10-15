import {
  Component,
  OnInit,
  inject,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnDestroy,
  signal
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import {
  FaIconLibrary,
  FontAwesomeModule
} from '@fortawesome/angular-fontawesome';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import {
  faCheck,
  faEnvelope,
  faEye,
  faEyeSlash,
  faTruckFast,
  faVanShuttle,
  faBarcode
} from '@fortawesome/pro-solid-svg-icons';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { finalize, Subject, takeUntil } from 'rxjs';
import { ITrackingDetails } from '../../external-interface';
import { ExternalService } from '../../external-service';

@Component({
  selector: 'app-mail-track',
  templateUrl: './mail-track.component.html',
  styleUrls: ['./mail-track.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FontAwesomeModule,
    CommonModule,
    CommonButtonV35Component,
    NgOptimizedImage
  ]
})
export class MailTrackComponent implements OnInit, OnDestroy {
  externalV3Service = inject(ExternalService);
  route = inject(ActivatedRoute);
  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);
  router = inject(Router);
  cdr = inject(ChangeDetectorRef);

  constructor(library: FaIconLibrary) {
    library.addIcons(
      faEyeSlash,
      faEye,
      faCheck,
      faEnvelope,
      faTruckFast,
      faVanShuttle,
      faBarcode
    );
  }

  trackingDetails!: ITrackingDetails;
  trackingCode: string | undefined;
  shipmentDetails: typeof this.trackingDetails.tracking_details;
  destroy$ = new Subject();

  themeTextColor = 'common-green-color';
  logoUrl = '/assets/images/mail-track/ocwMailLogo.svg';

  noTrackingPage: boolean = false;
  showTracking: boolean = true;
  isDownload = signal(false);

  /**
   * Initializes the component.
   * Retrieves the tracking code from the route parameters and fetches the corresponding mail tracking data.
   * If the status code of the response is 200, it sets the tracking details.
   * If the status code is not 200, it sets the `noTrackingPage` flag to true.
   */
  ngOnInit() {
    setTimeout(() => {
      this.showTracking = false;
      this.cdr.detectChanges();
    }, 3000);

    this.trackingCode =
      this.route.snapshot.paramMap.get('tracking_code') || undefined;
    if (this.trackingCode) {
      this.externalV3Service
        .getMailTrackingData(this.trackingCode)
        .pipe(takeUntil(this.destroy$))
        .subscribe((res) => {
          if (res.status_code === 200) {
            this.trackingDetails = res;
            this.shipmentDetails = res.tracking_details.reverse();
            if (this.trackingDetails.shipment.user_id === 834703) {
              this.themeTextColor = 'ottimate-color';
              this.logoUrl = '/assets/images/mail-track/OttimateMailLogo.png';
            }
            this.cdr.detectChanges();
          } else {
            this.noTrackingPage = true;
          }
        });
    }
  }

  /**
   * Navigates to the "manage/cheque/checkrecords" route.
   */
  goHome() {
    this.router.navigate(['manage/cheque/checkrecords']);
  }

  /**
   * Navigates to the "manage/cheque/checkrecords" route.
   */
  openChat() {
    this.dynamicWhiteLabelService.goToLiveChat();
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

  downlaodPod() {
    this.isDownload.set(true);
    this.externalV3Service
      .downloadProof(this.trackingCode as string)
      .pipe(
        finalize(() => {
          this.isDownload.set(false);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        if (res.success) {
          window.open(res.data);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}

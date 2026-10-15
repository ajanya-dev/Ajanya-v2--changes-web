import { NgOptimizedImage } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faEnvelope, faMessage, faPhone } from '@fortawesome/pro-regular-svg-icons';
import { faCirclePlay, faHeadset } from '@fortawesome/pro-solid-svg-icons';
import { faPaperPlane } from '@fortawesome/pro-thin-svg-icons';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { DemoVideoComponent } from 'src/app/shared/components/demo-video/demo-video.component';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-inter-welcome',
  standalone: true,
  imports: [NgOptimizedImage,CommonButtonV35Component,FaIconComponent,DemoVideoComponent],
  templateUrl: './inter-welcome.component.html',
  styleUrl: './inter-welcome.component.scss'
})
export class InterWelcomeComponent {
  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);
  private alertService = inject(AlertService);
  private localStorageService = inject(LocalStorageService);
  private router = inject(Router);
  public staticWhiteLabelConditions = StaticWhiteLabelConditions;

  faPaperPlane = faPaperPlane;
  faHeadset = faHeadset;
  faMessage = faMessage;
  faPhone = faPhone;
  faCirclePlay = faCirclePlay;
  faEnvelope = faEnvelope;

  env = environment;

  goToLiveChat(): void {
    this.dynamicWhiteLabelService.goToLiveChat();
  }

  callSupport() {
    if (this.staticWhiteLabelConditions.customerSupportNo) {
      window.open(`tel:${this.staticWhiteLabelConditions.customerSupportNo}`, '_self');
    } else {
      window.open(this.staticWhiteLabelConditions.helpWebsite, '_self');
    }
  }

  goToEmailSupport() {
    window.open(`mailto:${this.staticWhiteLabelConditions.customerSupportEmail}`, '_self');
  }

  onStartTransferClick(){
    // Get ripple payment settings from local storage
    const businessPaymentEnabled = this.localStorageService.getItem('rippleBusinessInternationalPaymentEnabled');
    const personalPaymentEnabled = this.localStorageService.getItem('ripplePersonalInternationalPaymentEnabled');

    const isBusinessEnabled = Number(businessPaymentEnabled) === 1;
    const isPersonalEnabled = Number(personalPaymentEnabled) === 1;
    
    // If either one is enabled, proceed to international payment page
    if (isBusinessEnabled || isPersonalEnabled) {
      this.router.navigate(['/manage/international-payment/new'], {
        state: {
          tab: 'new-payment'
        }
      });
    } else {
      // Only show alert if both are disabled (0 or not set)
      this.openAlert();
    }
  }

  openAlert(){
    const data = {
      content: 'International Payment transfer is not enabled for this account. Please contact the support team to enable it.',
      isOk: true,
      isCancel: true,
      doneMsg: 'Contact Now',
      cancelMsg: 'Not Now'
    };
    const dialog = this.alertService.infoAlert(data);
    dialog.afterClosed().subscribe((res) => {
      if (res) {
        this.dynamicWhiteLabelService.goToLiveChat();
      }
    });
  }

}

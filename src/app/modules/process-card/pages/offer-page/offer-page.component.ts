import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Utils } from 'src/app/data/utils';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { ProcessCardService } from 'src/app/shared/service/provess-card/process-card.service';

@Component({
  selector: 'app-offer-page',
  templateUrl: './offer-page.component.html',
  styleUrls: ['./offer-page.component.scss'],
  standalone: true
})
export class OfferPageComponent implements OnInit, OnDestroy {
  public dynamicWhiteLabelService = inject(DynamicWhiteLabelService);
  private router = inject(Router);
  private processCardService = inject(ProcessCardService);
  private alertService = inject(AlertService);

  subscriptions: Subscription[] = [];
  applicationStatus = 0;
  isProcessCardEligble = 0;
  utils = Utils;

  ngOnInit(): void {
    this.checkStatus();
  }

  checkStatus() {
    this.subscriptions.push(
      this.processCardService.processCardStstus().subscribe((res) => {
        if (res.success) {
          this.applicationStatus = res?.data?.applicationStatus;
          this.isProcessCardEligble = res?.data?.isProcessCardEligble;
          if (this.isProcessCardEligble !== 0) {
            this.goToApplication('');
          }
        }
      })
    );
  }

  goToApplication(ev: string) {
    if (this.isProcessCardEligble === 0) {
      const data = {
        content:
          'You have to be ACH approved or cloud bank user to enable this feature. Please contact support for more information.',
        doneMsg: 'Contact Now',
        cancelMsg: 'Not Now',
        isOk: true,
        isCancel: true
      };
      const action = this.alertService.infoAlert(data);
      action.afterClosed().subscribe((res) => {
        if (res) {
          this.dynamicWhiteLabelService.goToLiveChat();
        }
      });
      return;
    }

    if (ev === 'form' && this.applicationStatus === 0) {
      this.router.navigateByUrl('/manage/business-tools/process-card/process');
    } else if (ev !== 'form' && this.applicationStatus === 0) {
      this.router.navigateByUrl('/manage/business-tools/process-card');
    } else if (this.applicationStatus === 1) {
      this.router.navigate(['/manage/business-tools/process-card/success'], {
        queryParams: { status: 'submitted' }
      });
    } else if (this.applicationStatus === 2) {
      this.router.navigate(['/manage/business-tools/process-card/success'], {
        queryParams: { status: 'approved' }
      });
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}

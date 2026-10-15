import { Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { BusinessToolsService } from 'src/app/shared/service/business-tools/business-tools.service';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-terms-and-conditions',
  templateUrl: './terms-and-conditions.component.html',
  styleUrls: ['./terms-and-conditions.component.scss'],
  standalone: true,
  imports: [NgIf]
})
export class TermsAndConditionsComponent implements OnDestroy {
  subscriptions: Subscription[] = [];
  providerCompanyName = StaticWhiteLabelConditions.productName;
  loading: boolean;
  constructor(
    private businessToolsService: BusinessToolsService,
    private router: Router
  ) {}

  /**
   * @description Save accepted terms.
   */
  saveAcceptTermsResponse() {
    const sendingData = { accept: 1 };
    this.loading = true;
    this.subscriptions.push(
      this.businessToolsService
        .saveAcceptTermsResponse(sendingData)
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.router.navigate(['/manage/business-tools/sms-panel']);
          }
        })
    );
  }

  /**
   * @description Decline the terms.
   */
  decline() {
    this.router.navigate(['/manage/business-tools']);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}

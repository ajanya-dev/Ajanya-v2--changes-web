import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ScriptService } from 'src/app/core/services/script.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { NgIf } from '@angular/common';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-subscription-completed',
  templateUrl: './subscription-completed.component.html',
  styleUrls: ['./subscription-completed.component.scss'],
  standalone: true,
  imports: [NgIf]
})
export class SubscriptionCompletedComponent implements OnInit {
  isCardUpdated = false;
  subscribedInvoiceId: string;
  subscribedTotalAmount: string;
  subscribedPlanCode: string;
  environment = environment;

  paymentMethods: { [key: string]: string } = {
    1: 'pay-card',
    2: 'pay-wallet',
    3: 'pay-check'
  };

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private scriptService: ScriptService,
    private localStorageService: LocalStorageService
  ) {}

  ngOnInit(): void {
    this.loadQueryParams();
  }

  loadQueryParams(): void {
    this.route.queryParams.subscribe((res) => {
      if (res?.type === '1') {
        // From card updating
        this.isCardUpdated = true;
      }
      if (res?.amount) {
        // Subscribed amount
        this.subscribedTotalAmount = res.amount;
      }
      if (res?.invoiceId) {
        // Invoice id of the subscription
        this.subscribedInvoiceId = res.invoiceId;
        this.gtagEvent(res?.paymentMethod, this.subscribedTotalAmount);
      }
      if (res?.planCode) {
        // Subscribed plan code
        this.subscribedPlanCode = res.planCode;
      }
      this.loadAwinScript();
      this.outBrainScript();
      this.loadAffiliateScript();
      // this.loadMatomoTrackEvent(this.subscribedPlanCode);
    });
  }

  // On subcription success
  outBrainScript() {
    const prop = `'track', 'PURCHASE', { orderValue: ${this.subscribedTotalAmount?.toString()}, currency: 'USD' }`;
    this.scriptService.emitOutBrainEvent(prop);
  }

  loadAwinScript(): void {
    const userId = `odr-${this.localStorageService.getItem('userId')}-${this.subscribedInvoiceId}`;
    this.scriptService.onRunAwinCode(
      this.subscribedTotalAmount,
      userId,
      this.subscribedPlanCode
    );
  }

  loadAffiliateScript(): void {
    const userId = `odr-${this.localStorageService.getItem('userId')}-${this.subscribedInvoiceId}`;
    this.scriptService.affiliateScript(
      this.subscribedTotalAmount,
      userId,
      this.subscribedPlanCode
    );
  }

  loadMatomoTrackEvent(planCode: string): void {
    const userId = this.localStorageService.getItem('userId');
    this.scriptService.trackMatomoEvent(
      'Subscription',
      'Subscription_success',
      'Subscription_success',
      userId,
      { planCode }
    );
  }

  onNextButton() {
    if (this.router.url.includes('update-card')) {
      this.router.navigate(['/manage/refill-credit/show-refillform']);
    } else {
      this.router.navigate(['/manage/subscription/dashboard']);
    }
  }

  gtagEvent(paymentMethod: string, subAmount: string) {
    const method = paymentMethod || '1';
    const event = this.paymentMethods[method];
    const amount = subAmount?.toString();
    this.scriptService.gtagSubscriptionEvent(event, amount);
  }
}

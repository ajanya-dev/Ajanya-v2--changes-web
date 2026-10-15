import { Component, OnInit, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  LucideAngularModule,
  CircleCheckBig,
  Check,
  ArrowLeft
} from 'lucide-angular';
import { ScriptService } from 'src/app/core/services/script.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-v4-subscription-completed',
  standalone: true,
  imports: [LucideAngularModule, CommonButtonV4Component, CurrencyPipe],
  templateUrl: './v4-subscription-completed.component.html',
  styleUrl: './v4-subscription-completed.component.scss'
})
export class V4SubscriptionCompletedComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private scriptService = inject(ScriptService);
  private localStorageService = inject(LocalStorageService);
  private headerService = inject(HeaderService);

  readonly CircleCheckBigIcon = CircleCheckBig;
  readonly CheckIcon = Check;
  readonly ArrowLeftIcon = ArrowLeft;

  isCardUpdated = false;
  environment = environment;

  subscribedInvoiceId = '';
  subscribedTotalAmount = '';
  subscribedPlanCode = '';
  paymentMethodLabel = 'Card';

  private paymentMethods: Record<string, string> = {
    1: 'Card',
    2: 'Wallet',
    3: 'Check'
  };

  private paymentMethodEvents: Record<string, string> = {
    1: 'pay-card',
    2: 'pay-wallet',
    3: 'pay-check'
  };

  ngOnInit(): void {
    this.headerService.setHeaderValueChanged(true);
    this.loadQueryParams();
  }

  loadQueryParams(): void {
    this.route.queryParams.subscribe((res) => {
      if (res?.type === '1') {
        this.isCardUpdated = true;
      }
      if (res?.amount) {
        this.subscribedTotalAmount = res.amount;
      }
      if (res?.invoiceId) {
        this.subscribedInvoiceId = res.invoiceId;
        this.gtagEvent(res?.paymentMethod, this.subscribedTotalAmount);
      }
      if (res?.planCode) {
        this.subscribedPlanCode = res.planCode;
      }
      if (res?.paymentMethod) {
        this.paymentMethodLabel =
          this.paymentMethods[res.paymentMethod] || 'Card';
      }
      this.loadAwinScript();
      this.outBrainScript();
      this.loadAffiliateScript();
      // this.loadMatomoTrackEvent(this.subscribedPlanCode);
    });
  }

  outBrainScript(): void {
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

  onNextButton(): void {
    if (this.router.url.includes('update-card')) {
      this.router.navigate(['/v4/manage/refill-credit/show-refillform']);
    } else {
      this.router.navigate(['/v4/manage/user-profile/index'], {
        queryParams: { tab: 'myPlan' }
      });
    }
  }

  gtagEvent(paymentMethod: string, subAmount: string): void {
    const method = paymentMethod || '1';
    const event = this.paymentMethodEvents[method];
    const amount = subAmount?.toString();
    this.scriptService.gtagSubscriptionEvent(event, amount);
  }
}

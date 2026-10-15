import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { Subscription } from 'rxjs';
import { IPaymentConfig } from '../../model/payments';
import { PaymentsMainV35Component } from '../../shared/components/payments-main-v35/payments-main-v35.component';

@Component({
  selector: 'app-payments-page',
  templateUrl: './payments-page.component.html',
  styleUrls: ['./payments-page.component.scss'],
  standalone: true,
  imports: [PaymentsMainV35Component]
})
export class PaymentsPageComponent implements OnInit, OnDestroy {
  private activatedRoute = inject(ActivatedRoute);
  private appSettingsService = inject(AppSettingsService);

  config: IPaymentConfig;
  backUrl: string;
  isHide = true;
  mode = this.activatedRoute.snapshot.queryParams.mode ?? 'PAY';
  subscriptions: Subscription[] = [];

  ngOnInit(): void {
    this.createConfiguration();
    let titleToUpdate = 'Home page';
    if (this.config?.type1?.toLowerCase() === 'receive')
      titleToUpdate = 'Request Payment';
    this.appSettingsService.setPageTitle(titleToUpdate);
  }

  createConfiguration() {
    const roterParams = this.activatedRoute.snapshot.params;
    this.config = {
      id: roterParams?.id,
      mode: roterParams?.mode?.toUpperCase() ?? 'CREATE',
      type1: roterParams?.type1?.toUpperCase(),
      type2: roterParams?.type2,
      type3: roterParams?.type3
    };
  }

  changeConfigMode(mode: IPaymentConfig['mode']) {
    this.config.mode = mode;
  }

  /**
   * @description Every payment type changes calls the function and set the type payment config
   * @param type Type of payment wheather 'PAY' | 'RECIEVE'
   */
  onPaymentTypeChange(type: IPaymentConfig['type1']) {
    this.config.type1 = type;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}

import { Component, HostBinding, inject, OnInit } from '@angular/core';
import { V4PageHeaderComponent } from 'src/app/shared/V4/v4-page-header/v4-page-header.component';
import { IV4HeaderAction } from 'src/app/shared/V4/v4-page-header/v4-page-header.model';
import { PaymentsV4Service } from 'src/app/modules/payments-v4/shared/services/payments-v4.service';
import {
  PaymentSource,
  PaymentMethod
} from 'src/app/modules/payments-v4/send-payment/models/send-payment.enums';
import { PaymentTypeAccessService } from 'src/app/shared/service/common/shared/payment-type-access/payment-type-access.service';

@Component({
  standalone: true,
  selector: 'app-international-payment-header-v4',
  imports: [V4PageHeaderComponent],
  templateUrl: './international-payment-header-v4.component.html'
})
export class InternationalPaymentHeaderV4Component implements OnInit {
  @HostBinding('class') class = 'block';

  private paymentsV4Service = inject(PaymentsV4Service);
  private paymentTypeAccessService = inject(PaymentTypeAccessService);

  readonly headerActions: IV4HeaderAction[] = [
    {
      id: 'new',
      text: 'New International Payment',
      style: 'primary',
      lucideIcon: 'plus',
      toolTip: 'Send money abroad from your wallet, bank account, or card'
    }
  ];

  ngOnInit(): void {
    this.paymentTypeAccessService.initialize({ pageId: 'payment_home_page' });
  }

  onAction(id: string | number): void {
    if (id === 'new') this.onNewPayment();
  }

  onNewPayment(): void {
    const disabled = this.paymentTypeAccessService.disabledMethods$.getValue();
    if (disabled.includes(PaymentMethod.InternationalPayment)) {
      this.paymentTypeAccessService.openAlertMessage(
        PaymentMethod.InternationalPayment,
        true
      );
      return;
    }
    this.paymentsV4Service.openSendModal({
      paymentSource: PaymentSource.Wallet,
      paymentMethod: PaymentMethod.InternationalPayment
    });
  }
}

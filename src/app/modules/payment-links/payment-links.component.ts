import { Component, OnDestroy, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PaymentLinksService } from './services/payment-links.service';

@Component({
  selector: 'app-payment-links',
  standalone: true,
  imports: [RouterOutlet],
  template: ` <router-outlet /> `,
  styles: ''
})
export class PaymentLinksComponent implements OnDestroy {
  private paymentLinksService = inject(PaymentLinksService);

  ngOnDestroy(): void {
    this.paymentLinksService.selectedLink.update(() => undefined);
  }
}

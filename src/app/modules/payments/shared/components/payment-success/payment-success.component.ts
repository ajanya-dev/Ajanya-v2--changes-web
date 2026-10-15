import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  inject
} from '@angular/core';
import { Router } from '@angular/router';
import { CloudBankDetailsDataV35Service } from 'src/app/modules/cloud-bank/cloud-bank-v3/services/cloud-bank-details-data-v35.service';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import { IPaymentSuccessData } from 'src/app/modules/payments/model/payments';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import {
  IRecurringRedirectInfo,
  RecurringRedirectService
} from 'src/app/shared/service/recurring-redirect/recurring-redirect.service';

@Component({
  selector: 'app-payment-success',
  templateUrl: './payment-success.component.html',
  styleUrls: ['./payment-success.component.scss'],
  standalone: true
})
export class PaymentSuccessComponent implements OnInit {
  @Output() newPaymentClick = new EventEmitter<{
    data: { title: string; content: string };
  }>();

  @Input() data: IPaymentSuccessData;

  private router = inject(Router);
  private payeeService = inject(PayeeService);
  private cloudBankDetailsDataService = inject(CloudBankDetailsDataV35Service);
  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);
  private recurringRedirect = inject(RecurringRedirectService);

  /** Set when the completed payment was recurring/scheduled (email/mail/ACH). */
  recurringInfo: IRecurringRedirectInfo | null = null;

  ngOnInit(): void {
    this.payeeService.paymentSuccess.next(true);
    this.recurringInfo = this.recurringRedirect.consume();
  }

  get displayTitle(): string {
    if (this.recurringInfo) {
      return this.recurringInfo.isRecurring
        ? 'Recurring Payment Set Up'
        : 'Payment Scheduled';
    }
    return this.data?.title ? this.data.title : 'Payment Success';
  }

  get displayContent(): string {
    if (this.recurringInfo) {
      return this.recurringInfo.isRecurring
        ? 'Your recurring payment has been set up successfully. You can manage it from the recurring list.'
        : 'Your payment has been scheduled successfully. You can manage it from the recurring list.';
    }
    return this.data?.content
      ? this.data.content
      : 'Your payment is initiated, please check the status in your records';
  }

  newPayment() {
    this.newPaymentClick.emit();
  }

  viewPayment() {
    if (this.recurringInfo) {
      this.router.navigate(['/manage/checkmailing/recurring'], {
        queryParams: { tab: this.recurringRedirect.tabIndex(this.recurringInfo.delivery) }
      });
    } else if (this.data?.type === 'receive') {
      this.router.navigateByUrl('manage/receivedchecks/index');
    } else if (this.data?.sourceType === 'cloud') {
      this.cloudBankDetailsDataService.bypassTransactionCheck = true;
      this.router.navigateByUrl('/manage/cloud-bank/index');
    } else if(this.dynamicWhiteLabelService.dynamicWhiteLabelFlagChecker('isCompassRequirement')) {
      this.router.navigateByUrl('/manage/payments-table/check');
    }else{
      this.router.navigateByUrl('/manage/payments-table/index');
    }
  }
}

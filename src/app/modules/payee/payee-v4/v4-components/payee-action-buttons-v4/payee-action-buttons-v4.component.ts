import { Component, ViewEncapsulation, inject } from '@angular/core';
import { ICellRendererParams } from '@ag-grid-community/core';
import { IPayeeData } from 'src/app/modules/payee/payee-v2/model/payee';
import {
  CommonButtonV4Component,
  TCButtonType
} from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { Router } from '@angular/router';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';

@Component({
  selector: 'app-payee-action-buttons-v4',
  templateUrl: './payee-action-buttons-v4.component.html',
  styleUrls: ['./payee-action-buttons-v4.component.scss'],
  standalone: true,
  imports: [CommonButtonV4Component],
  encapsulation: ViewEncapsulation.None
})
export class PayeeActionButtonsV4Component {
  private paymentService = inject(PaymentsService);
  private router = inject(Router);

  payee: IPayeeData;

  /** Static refs to avoid signal input re-render issues.
   *  Send is the primary action, Receive the secondary one — same pairing the
   *  page header uses for Add Payee / Import. */
  static readonly SEND_TYPE: TCButtonType = {
    name: 'v2-1',
    size: 'sm',
    style: 'primary'
  };

  static readonly RECEIVE_TYPE: TCButtonType = {
    name: 'v2-1',
    size: 'sm',
    style: 'navy'
  };

  get sendType(): TCButtonType {
    return PayeeActionButtonsV4Component.SEND_TYPE;
  }

  get receiveType(): TCButtonType {
    return PayeeActionButtonsV4Component.RECEIVE_TYPE;
  }

  agInit(params: ICellRendererParams): void {
    this.payee = params.data;
  }

  refresh(): boolean {
    return false;
  }

  onSend(): void {
    const {payee} = this;
    this.paymentService.initiatePaymentForm = { payee };
    this.router.navigate(['/v4/manage/payments/pay/bankaccount/check'], {
      state: { backUrl: this.router.url }
    });
  }

  onReceive(): void {
    const {payee} = this;
    this.paymentService.initiatePaymentForm = { payee };
    this.router.navigate(['/v4/manage/payments/receive'], {
      state: { backUrl: this.router.url }
    });
  }
}

import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import {
  IPaymentDetails,
  IRecurringDetails
} from 'src/app/modules/payments/model/payments';
import { MatDialog } from '@angular/material/dialog';
import { IApiRes } from 'src/app/models/api';
import { environment } from 'src/environments/environment';
import { IPayeeDropdown } from 'src/app/modules/payee/payee-v2/model/payee';
import type { IExistingCreditCards } from 'src/app/models/payment-switch-board';
import type { IWalletData } from 'src/app/models/wallet';
import { Router,NavigationExtras } from '@angular/router';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import {
  IPayablesStats,
  IPaymentOutQuickCards,
  IReceivablesStats
} from '../models/payments-v4.models';
// eslint-disable-next-line import/no-cycle
import { PaymentConfirmationModalV4Component } from '../modals/payment-confirmation-modal-v4/payment-confirmation-modal-v4.component';
// eslint-disable-next-line import/no-cycle
import {
  IPaymentSuccessV4Data,
  PaymentSuccessModalV4Component,
  PaymentSuccessResult
} from '../modals/payment-success-modal-v4/payment-success-modal-v4.component';
import {
  PaymentMethod,
  PaymentSource,
  SendPaymentMode
} from '../../send-payment/models/send-payment.enums';

export interface IReceiveModalData {
  payeeId?: string;
  bankId?: string;
}

export interface ISendModalData {
  mode?: SendPaymentMode;
  amount?: number;
  payeeId?: string;
  payee?: IPayeeDropdown;
  paymentId?: string;
  paymentDetails?: IPaymentDetails;
  /** Bill IDs to pre-fill the payment form from bill data */
  billIds?: string[];
  /** Pre-selected credit card to use as the payment source */
  card?: IExistingCreditCards;
  /** Pre-selected wallet to use as the payment source */
  wallet?: IWalletData;
  /** Pre-selected bank account ID */
  bankId?: string;
  /** Pre-selected payment source type */
  paymentSource?: PaymentSource;
  /** Pre-selected payment method */
  paymentMethod?: PaymentMethod;
  /** Whether vendor credit was applied to the bill before payment */
  payWithVendorCredit?: boolean;
}

export type PaymentFlowModalResult =
  | { submitted: boolean; newPayment?: boolean }
  | undefined;

@Injectable({
  providedIn: 'root'
})
export class PaymentsV4Service {
  private dialog = inject(MatDialog);
  private http = inject(HttpClient);
  private router = inject(Router);
  private paymentService = inject(PaymentsService);
  private ROOT_URL = environment.rootUrl;

  /** Emits when a payment is completed and the table should be refreshed */
  paymentCompleted$ = new Subject<void>();
  private readonly payBase = '/v4/manage/payments/pay';
  private readonly payCheckRoute = `${this.payBase}/bankaccount/check`;

  getPaymentOutQuickCards(): Observable<IApiRes<IPaymentOutQuickCards>> {
    return this.http.get<IApiRes<IPaymentOutQuickCards>>(
      `${this.ROOT_URL}/zil-payments/quick-cards/payment-out`
    );
  }

  getPayablesStats(): Observable<IApiRes<IPayablesStats>> {
    return this.http.post<IApiRes<IPayablesStats>>(
      `${this.ROOT_URL}/zil-payments/stats`,
      {}
    );
  }

  getReceivablesStats(): Observable<IApiRes<IReceivablesStats>> {
    return this.http.post<IApiRes<IReceivablesStats>>(
      `${this.ROOT_URL}/invoices/stats`,
      {}
    );
  }

  openReceiveModal(){
    this.router.navigate(['/v4/manage/payments/receive']);
  }

  openSendModal(data: ISendModalData = {}) {
    const { mode, paymentId, billIds, payWithVendorCredit, paymentSource, paymentMethod, payeeId } = data;
  
    if (mode && paymentId) {
      this.router.navigate([`/v4/manage/payments/${mode.toLowerCase()}/${paymentId}`]);
      return;
    }
  
    if (billIds || payWithVendorCredit) {
      const extras: NavigationExtras = { queryParams: { billId: billIds } };
      if (payWithVendorCredit) {
        extras.state = { backUrl: this.router.url, payWithVendorCredit };
      }
      this.router.navigate([this.payCheckRoute], extras);
      return;
    }
  
    if (paymentSource) {
      const route = paymentMethod
        ? `${this.payBase}/${paymentSource}/${paymentMethod}`
        : `${this.payBase}/${paymentSource}`;
      this.router.navigate([route]);
      return;
    }
  
    if (payeeId) {
      this.paymentService.initiatePaymentForm = { payee: { encrypted_id: payeeId } };
      this.router.navigateByUrl(this.payCheckRoute);
      return;
    }
  
    this.router.navigate([this.payCheckRoute]);
  }

  openPaymentNewConfirmationModal(data: {
    accNumber?: string | number;
    bankName?: string;
    payeeName?: string;
    paymentMethod?: string;
    amount: number | string;
    type?: string;
    shippingType?: string;
    recurringDetails?: IRecurringDetails;
    mode?: 'send' | 'receive';
    from?: string;
    toBankAccount?: string;
    isPayeeBankVerified?: boolean;
    // The modal derives "Processing Time" from these — without them the row is hidden.
    source?: PaymentSource;
    method?: PaymentMethod;
    processingTimeOverride?: string;
    paymentMethodLabelOverride?: string;
  }) {
    return this.dialog.open<
      PaymentConfirmationModalV4Component,
      {
        accNumber?: string | number;
        bankName?: string;
        payeeName?: string;
        paymentMethod?: string;
        amount?: number | string;
        type?: string;
        shippingType?: string;
        recurringDetails?: IRecurringDetails;
        mode?: 'send' | 'receive';
        from?: string;
        toBankAccount?: string;
        isPayeeBankVerified?: boolean;
        source?: PaymentSource;
        method?: PaymentMethod;
        processingTimeOverride?: string;
        paymentMethodLabelOverride?: string;
      },
      boolean
    >(PaymentConfirmationModalV4Component, {
      width: '510px',
      panelClass: 'paddingless-modal-rounded',
      data: {
        accNumber: data.accNumber,
        bankName: data.bankName,
        payeeName: data.payeeName,
        paymentMethod: data.paymentMethod,
        amount: data.amount,
        type: data.type,
        shippingType: data.shippingType,
        recurringDetails: data.recurringDetails,
        mode: data.mode,
        from: data.from,
        toBankAccount: data.toBankAccount,
        // The modal shows an unverified-payee-bank warning when this is false.
        isPayeeBankVerified: data.isPayeeBankVerified,
        source: data.source,
        method: data.method,
        processingTimeOverride: data.processingTimeOverride,
        paymentMethodLabelOverride: data.paymentMethodLabelOverride
      },
      disableClose: true
    });
  }

  openPaymentSuccessModal(data: IPaymentSuccessV4Data) {
    return this.dialog.open<
      PaymentSuccessModalV4Component,
      IPaymentSuccessV4Data,
      PaymentSuccessResult
    >(PaymentSuccessModalV4Component, {
      width: '510px',
      panelClass: 'paddingless-modal-rounded',
      data,
      disableClose: true
    });
  }
}

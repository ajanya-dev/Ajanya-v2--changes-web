import {
  IPaymentMethodList,
  ISubscriptionOffers
} from 'src/app/modules/subscription/model/subscription';

//==== PAYMENT DETAILS
export class PaymentSection {
  static payMethordList(): IPaymentMethodList[] {
    return [
      {
        type: 'Card',
        icon: '../../../assets/images/subscription/credit.svg',
        icon2: '../../../assets/images/subscription/paypal.svg'
      },
      {
        type: 'Wallet',
        icon: '../../../assets/images/subscription/wallet.svg'
      },
      // {
      //   type: 'Check',
      //   icon: '../../../assets/images/subscription/cheque.svg'
      // }
    ];
  }
}

export const subscriptionOffers: ISubscriptionOffers = {
  // remaining days: offer num
  13: { offerPerc: 50, value: 1 },
  8: { offerPerc: 30, value: 2 },
  3: { offerPerc: 20, value: 3 },
  0: { offerPerc: 10, value: 4 }
} as const;

/**
 * @description live  plancodes
 */
export class SelectedPlanCodes {
  static planCodeList(): string[] {
    return [
      'pay-as-you-go-monthly',
      'pay-as-you-go-yearly',
      'business-2-monthly-v2',
      'business-monthly-v2'
    ];
  }
}

/**
 * @description hide addon in addonpage based on plancodes
 */
export class SelectedAddonCodes {
  static addonCodeList(): string[] {
    return [
      'bankaccount-monthly',
      'bankaccount-yearly',
      'user-create-monthly',
      'user-create-yearly'
    ];
  }
}

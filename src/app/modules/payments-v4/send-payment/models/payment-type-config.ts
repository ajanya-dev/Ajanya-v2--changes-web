import { environment } from 'src/environments/environment';
import { PaymentMethod, PaymentSource } from './send-payment.enums';
import type { IPaymentSourceConfig } from './send-payment.models';

/**
 * Static configuration for payment sources and their available methods.
 * Ported from payments-data-v35.ts and restructured for V4 UI.
 *
 * Icons use Lucide icon names (strings) to be resolved in templates.
 * Feature flag mapping is in `PAYMENT_METHOD_FEATURE_FLAGS`.
 */
export class SendPaymentTypeConfig {
  static getPaymentSources(): IPaymentSourceConfig[] {
    const envId = (environment as any).env_id;

    // CSNHC: Bank Account + Check only
    if (envId === 'csnhc') {
      return SendPaymentTypeConfig.getCsnhcPaymentSources();
    }

    // Compass: Bank Account + Check/ACH/Wire/VirtualCard
    if (envId === 'compass') {
      return SendPaymentTypeConfig.getCompassPaymentSources();
    }
    return [
      {
        label: 'Wallet',
        shortLabel: 'Wallet',
        id: PaymentSource.Wallet,
        icon: 'wallet',
        isDisabled: false,
        badgeText: 'Fund once, pay anytime.',
        methods: [
          {
            label: 'Let the vendor decide',
            id: PaymentMethod.LetPayeeChoose,
            icon: 'users',
            description: 'Payment is sent directly to the vendor’s Wallet, giving the vendor full control over how they receive their funds.',
            isSelectable: true,
            processingTime: 'Instant'
          },
          {
            label: 'Same Day ACH',
            id: PaymentMethod.SameDayACH,
            icon: 'building-2',
            description: 'Cut-off: 10:30 AM PST (12:30 PM CST). Same-day processing if submitted on time.',
            isSelectable: true,
            processingTime: 'Same day'
          },
          {
            label: 'ACH / Direct Deposit',
            id: PaymentMethod.ACH,
            icon: 'building-2',
            description: 'Standard electronic bank transfer. Perfect for everyday business payments.',
            isSelectable: true,
            processingTime: '1-3 days'
          },
          {
            label: 'Wire',
            id: PaymentMethod.Wire,
            icon: 'send',
            description: 'Immediate bank-to-bank transfer. Available within hours.',
            isSelectable: true,
            processingTime: '1–3 days'
          },
          {
            label: 'Virtual Card',
            id: PaymentMethod.VirtualCard,
            icon: 'credit-card',
            description: 'Digital payment card via email. Recipient can use immediately online.',
            isSelectable: true,
            processingTime: 'Instant'
          },
          {
            
            label: 'Check Mail',
            id: PaymentMethod.CheckMail,
            icon: 'mail',
            description: 'Physical Check Mailed to the recipient. Cut-off Time: USPS – 12:30 PM CST | FedEx – 1:00 PM CST.',
            isSelectable: true,
            processingTime: '1–5 days'
          },
          {
            label: 'Check Email',
            id: PaymentMethod.CheckEmail,
            icon: 'send',
            description: 'Check is instantly emailed to the recipient. Recipient can print and deposit it easily.',
            isSelectable: true,
            processingTime: 'Instant'
          },
          {
            label: 'Check Print',
            id: PaymentMethod.CheckPrint,
            icon: 'printer',
            description: 'Instantly print the check using your own printer. Use check paper or regular white paper.',
            isSelectable: true,
            processingTime: 'Instant'
          },
          {
            label: 'International Payment',
            id: PaymentMethod.InternationalPayment,
            icon: 'globe',
            description: 'Send money outside United States. Includes currency conversion.',
            isSelectable: true,
            processingTime: 'Varies'
          },
          {
            label: 'Real Time Instant',
            id: PaymentMethod.RTP,
            icon: 'send',
            description: 'Money available immediately 24/7. Instant transfer any time.',
            isSelectable: false,
            processingTime: '24/7'
          },
        ]
      },
      {
        label: 'Credit Card',
        shortLabel: 'Card',
        id: PaymentSource.CreditCard,
        icon: 'credit-card',
        isDisabled: false,
        badgeText: 'Earn Points!',
        methods: [
          {
            label: 'Let the vendor decide',
            id: PaymentMethod.LetPayeeChoose,
            icon: 'users',
            description: 'Payment is sent directly to the vendor’s Wallet, giving the vendor full control over how they receive their funds.',
            isSelectable: true,
            processingTime: '2–5 business days'
          },
          {
            label: 'ACH / Direct Deposit',
            id: PaymentMethod.ACH,
            icon: 'building-2',
            description: 'Standard electronic bank transfer. Takes 4-6 business days to arrive.',
            isSelectable: true,
            processingTime: '1–3 days'
          },
          {
            label: 'Wire',
            id: PaymentMethod.Wire,
            icon: 'send',
            description: 'Immediate bank-to-bank transfer. Available within hours.',
            isSelectable: true,
            processingTime: '0–1 day'
          },
          {
            label: 'Check Mail',
            id: PaymentMethod.CheckMail,
            icon: 'mail',
            description: 'Physical Check Mailed to the recipient. Cut-off Time: USPS – 12:30 PM CST | FedEx – 1:00 PM CST..',
            isSelectable: true,
            processingTime: '1–5 days'
          },
          {
            label: 'Same Day ACH',
            id: PaymentMethod.SameDayACH,
            icon: 'building-2',
            description: 'Cut-off: 10:30 AM PST (12:30 PM CST). Same-day processing if submitted on time.',
            isSelectable: false,
            processingTime: 'Same day'
          },
          {
            label: 'Virtual Card',
            id: PaymentMethod.VirtualCard,
            icon: 'credit-card',
            description: 'Digital payment card via email. Recipient can use immediately online.',
            isSelectable: false,
            processingTime: 'Instant'
          },
          {
            label: 'Real Time Instant',
            id: PaymentMethod.RTP,
            icon: 'send',
            description: 'Money available immediately 24/7. Instant transfer any time.',
            isSelectable: false,
            processingTime: '24/7'
          },
          {
            label: 'International Payment',
            id: PaymentMethod.InternationalPayment,
            icon: 'globe',
            description: 'Send money outside United States. Includes currency conversion.',
            isSelectable: false,
            processingTime: 'Varies'
          }
        ]
      },
      {
        label: 'Bank Account',
        shortLabel: 'Bank',
        id: PaymentSource.BankAccount,
        icon: 'landmark',
        isDisabled: false,
        badgeText: 'Direct',
        methods: [
          {
            label: 'Let the vendor decide',
            id: PaymentMethod.LetPayeeChoose,
            icon: 'users',
            description: 'Payment is sent directly to the vendor’s Wallet, giving the vendor full control over how they receive their funds.',
            isSelectable: true,
            processingTime: '1–3 business days'
          },
          {
            label: 'Check',
            id: PaymentMethod.Check,
            icon: 'file-check',
            description: 'Print check yourself or mail it. Payee can deposit via mobile.',
            isSelectable: true,
            processingTime: 'Instant'
          },
          {
            label: 'ACH / Direct Deposit',
            id: PaymentMethod.ACH,
            icon: 'building-2',
            description: 'Standard electronic bank transfer. Perfect for everyday business payments.',
            isSelectable: true,
            processingTime: '4-6 days'
          },
          {
            label: 'Same Day ACH',
            id: PaymentMethod.SameDayACH,
            icon: 'building-2',
            description: 'Cut-off: 10:30 AM PST (12:30 PM CST). Same-day processing if submitted on time.',
            isSelectable: false,
            processingTime: 'Same day'
          },
          {
            label: 'Wire',
            id: PaymentMethod.Wire,
            icon: 'send',
            description: 'Immediate bank-to-bank transfer. Available within hours.',
            isSelectable: false,
            processingTime: '0\u20131 day'
          },
          {
            label: 'Virtual Card',
            id: PaymentMethod.VirtualCard,
            icon: 'credit-card',
            description: 'Digital payment card via email. Recipient can use immediately online.',
            isSelectable: false,
            processingTime: 'Instant'
          },
          {
            label: 'Real Time Instant',
            id: PaymentMethod.RTP,
            icon: 'send',
            description: 'Money available immediately 24/7. Instant transfer any time.',
            isSelectable: false,
            processingTime: 'Instant'
          },
          {
            label: 'International Payment',
            id: PaymentMethod.InternationalPayment,
            icon: 'globe',
            description: 'Send money outside United States. Includes currency conversion.',
            isSelectable: false,
            processingTime: '1\u20135 days'
          }
        ]
      },
      {
        label: 'Cloud Bank',
        shortLabel: 'Cloud',
        id: PaymentSource.CloudBank,
        icon: 'cloud',
        isDisabled: true,
        methods: []
      }
    ];
  }

  /**
   * Maps feature flag keys to PaymentMethod IDs.
   * Used by PaymentTypeAccessService to enable/disable methods at runtime.
   */
  static readonly PAYMENT_METHOD_FEATURE_FLAGS: Record<string, PaymentMethod | PaymentSource> = {
    isVirtualCardSendEnabled: PaymentMethod.VirtualCard,
    isCheckMailSendEnabled: PaymentMethod.CheckMail,
    isPaymentWireTransferEnabled: PaymentMethod.Wire,
    isPaymentRtpTransferEnabled: PaymentMethod.RTP,
    isInternationalPaymentEnabled: PaymentMethod.InternationalPayment
  };

  /**
   * Maps source + method combinations to display-friendly processing time strings.
   */
  static getProcessingTime(source: PaymentSource, method: PaymentMethod): string {
    const key = `${source}:${method}`;
    const times: Record<string, string> = {
      // Bank Account
      [`${PaymentSource.BankAccount}:${PaymentMethod.LetPayeeChoose}`]:
        '1–3 business days',
      [`${PaymentSource.BankAccount}:${PaymentMethod.Check}`]: 'Instant',
      [`${PaymentSource.BankAccount}:${PaymentMethod.ACH}`]: '4-6 business days',
      [`${PaymentSource.BankAccount}:${PaymentMethod.SameDayACH}`]: '0-1 business day (depending on if submitted before bank closing hours)',
      [`${PaymentSource.BankAccount}:${PaymentMethod.Wire}`]: '0-1 business day (depending on if submitted before bank closing hours)',
      [`${PaymentSource.BankAccount}:${PaymentMethod.VirtualCard}`]: 'Instant',
      [`${PaymentSource.BankAccount}:${PaymentMethod.RTP}`]: 'Instant',
      [`${PaymentSource.BankAccount}:${PaymentMethod.InternationalPayment}`]: '0-1 business day',
      // Credit Card
      [`${PaymentSource.CreditCard}:${PaymentMethod.LetPayeeChoose}`]:
        '2–5 business days',
      [`${PaymentSource.CreditCard}:${PaymentMethod.ACH}`]: '4-6 business days',
      [`${PaymentSource.CreditCard}:${PaymentMethod.SameDayACH}`]: '0-1 business day (depending on if submitted before bank closing hours)',
      [`${PaymentSource.CreditCard}:${PaymentMethod.Wire}`]: '0-1 business day (depending on if submitted before bank closing hours)',
      [`${PaymentSource.CreditCard}:${PaymentMethod.CheckMail}`]: 'Depending on shipping type',
      [`${PaymentSource.CreditCard}:${PaymentMethod.CheckPrint}`]: 'Instant',
      [`${PaymentSource.CreditCard}:${PaymentMethod.RTP}`]: 'Instant',
      // Wallet
      [`${PaymentSource.Wallet}:${PaymentMethod.LetPayeeChoose}`]: 'Instant',
      [`${PaymentSource.Wallet}:${PaymentMethod.ACH}`]: '1-3 business days',
      [`${PaymentSource.Wallet}:${PaymentMethod.SameDayACH}`]: '0-1 business day (depending on if submitted before bank closing hours)',
      [`${PaymentSource.Wallet}:${PaymentMethod.Wire}`]: '0-1 business day (depending on if submitted before bank closing hours)',
      [`${PaymentSource.Wallet}:${PaymentMethod.RTP}`]: 'Instant',
      [`${PaymentSource.Wallet}:${PaymentMethod.VirtualCard}`]: 'Instant',
      [`${PaymentSource.Wallet}:${PaymentMethod.CheckMail}`]: 'Depending on shipping type',
      [`${PaymentSource.Wallet}:${PaymentMethod.CheckEmail}`]: 'Instant',
      [`${PaymentSource.Wallet}:${PaymentMethod.CheckPrint}`]: 'Instant',
      [`${PaymentSource.Wallet}:${PaymentMethod.InternationalPayment}`]: '0-1 business day'
    };
    return times[key] ?? '';
  }

  /** Check Mail timings, keyed by carrier — mirrors the confirmation modal. */
  private static readonly SHIPPING_TIMINGS: Record<string, string> = {
    USPS_FIRST_CLASS_MAIL: '1-5 business days',
    USPS_FIRST_CLASS_WITH_TRACKING: '1-5 business days',
    USPS_PRIORITY_MAIL: '1-3 business days',
    FEDEX_NEXT_DAY_PM: '1 business day',
    USPS_EXPRESS_MAIL: '2 business days',
    'First Class Canada': '1-5 business days',
    'Fed Ex Overnight': '1 business day',
    'Fed Ex Overnight Canada': '1 business day',
    'First class international': '7-21 business days',
    'Fed Ex International': '3-5 business days'
  };

  /**
   * The single "Processing Time" resolver both the confirmation and success modals
   * need: an explicit override wins, then a Check Mail carrier timing, then the
   * source+method lookup.
   */
  static resolveProcessingTime(input: {
    source?: PaymentSource;
    method?: PaymentMethod;
    processingTimeOverride?: string;
    shippingType?: string;
  }): string {
    if (input.processingTimeOverride !== undefined) {
      return input.processingTimeOverride;
    }
    if (input.shippingType) {
      return this.SHIPPING_TIMINGS[input.shippingType] ?? '';
    }
    if (input.source && input.method) {
      return this.getProcessingTime(input.source, input.method);
    }
    return '';
  }

  private static getCompassPaymentSources(): IPaymentSourceConfig[] {
    return [
      {
        label: 'Bank',
        shortLabel: 'Bank',
        id: PaymentSource.BankAccount,
        icon: 'landmark',
        isDisabled: false,
        badgeText: 'Direct',
        methods: [
          {
            label: 'Check',
            id: PaymentMethod.Check,
            icon: 'file-check',
            description: 'Print check yourself or mail it. Payee can deposit via mobile.',
            isSelectable: true,
            processingTime: 'Instant'
          },
          {
            label: 'ACH / Direct Deposit',
            id: PaymentMethod.ACH,
            icon: 'building-2',
            description: 'Standard electronic bank transfer. Perfect for everyday business payments.',
            isSelectable: true,
            processingTime: '4-6 days'
          },
          {
            label: 'Wire',
            id: PaymentMethod.Wire,
            icon: 'send',
            description: 'Immediate bank-to-bank transfer. Available within hours.',
            isSelectable: false,
            processingTime: '0\u20131 day'
          },
          {
            label: 'Virtual Card',
            id: PaymentMethod.VirtualCard,
            icon: 'credit-card',
            description: 'Digital payment card via email. Recipient can use immediately online.',
            isSelectable: false,
            processingTime: 'Instant'
          }
        ]
      }
    ];
  }

  private static getCsnhcPaymentSources(): IPaymentSourceConfig[] {
    return [
      {
        label: 'Bank',
        shortLabel: 'Bank',
        id: PaymentSource.BankAccount,
        icon: 'landmark',
        isDisabled: false,
        badgeText: 'Direct',
        methods: [
          {
            label: 'Check',
            id: PaymentMethod.Check,
            icon: 'file-check',
            description: 'Print check yourself or mail it. Payee can deposit via mobile.',
            isSelectable: true,
            processingTime: 'Instant'
          }
        ]
      }
    ];
  }
}

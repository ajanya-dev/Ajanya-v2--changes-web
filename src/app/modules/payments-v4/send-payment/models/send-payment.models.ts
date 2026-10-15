import { FormControl } from '@angular/forms';
import type { IBankDropdown, IRemittanceDetails } from 'src/app/models/bank';
import type { ICategoryDropdown } from 'src/app/modules/category/model/category';
import type {
  IPayeeDropdown,
  IPayeeViewBank
} from 'src/app/modules/payee/payee-v2/model/payee';
import type { IWalletData } from 'src/app/models/wallet';
import type { IExistingCreditCards } from 'src/app/models/payment-switch-board';
import type {
  IPaymentDetails,
  IPaymentFeeDetails
} from 'src/app/modules/payments/model/payments';
import { PaymentMethod, PaymentSource, SendPaymentMode } from './send-payment.enums';

/** Data passed when opening the send payment modal */
export interface ISendPaymentModalData {
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

/** Union type for all source account types */
export type SourceAccount = IBankDropdown | IWalletData | IExistingCreditCards;

/** Reactive form interface for the send payment form */
export interface ISendPaymentForm {
  amount: FormControl<string | null>;
  payee: FormControl<IPayeeDropdown | null>;
  memo: FormControl<string | null>;
  issueDate: FormControl<string | null>;
  scheduleDate: FormControl<string | null>;
  category: FormControl<ICategoryDropdown | null>;
  invoiceNumber: FormControl<string | null>;
  checkNumber: FormControl<number | null>;
  payeeBankAccount: FormControl<IPayeeViewBank | null>;
  payeeEmail: FormControl<string | null>;
  payeeName: FormControl<string | null>;
  payeePhone: FormControl<string | null>;
  sendSms: FormControl<boolean | null>;
  payeeIdNumber: FormControl<string | null>;
  needRecurring: FormControl<boolean | null>;
  recurringFrequency: FormControl<string | null>;
  recurringStartDate: FormControl<string | null>;
  recurringEndSelect: FormControl<string | null>;
  recurringCount: FormControl<number | null>;
  shippingType: FormControl<string | null>;
  noAmount: FormControl<boolean | null>;
  noSign: FormControl<boolean | null>;
  noPayee: FormControl<boolean | null>;
  noDate: FormControl<boolean | null>;
  commentIds: FormControl<string[] | null>;
  attachmentIds: FormControl<string[] | null>;
  remittance: FormControl<IRemittanceDetails[] | null>;
  remittanceType: FormControl<number | null>;
  sentWithAttachment: FormControl<boolean | null>;
  paperType: FormControl<string | null>;
  isCustomAddress: FormControl<boolean | null>;
  internationalPurpose: FormControl<string | null>;
  internationalSource: FormControl<string | null>;
  internationalSourceName: FormControl<string | null>;
  internationalRecipientType: FormControl<string | null>;
}

/** Configuration for a single payment method option */
export interface IPaymentMethodConfig {
  label: string;
  id: PaymentMethod;
  icon: string;
  description?: string;
  toolTip?: string;
  isSelectable: boolean;
  processingTime?: string;
  badgeText?: string;
}

/** Configuration for a payment source */
export interface IPaymentSourceConfig {
  label: string;
  shortLabel: string;
  id: PaymentSource;
  icon: string;
  isDisabled: boolean;
  badgeText?: string;
  /** Dynamic subtitle (e.g. "$48,234", "3 cards", "4 accounts") set at runtime */
  subtitle?: string;
  methods: IPaymentMethodConfig[];
}

/** Delivery method option for check-details selector */
export interface IDeliveryMethodOption {
  id: string;         // 'mail' | 'email' | 'printCheck' | 'printWhiteCheck' | 'ach'
  label: string;
  icon: string;       // Lucide icon name
  processingTime: string;
}

/** Fee display data passed to the fee component */
export interface ISendPaymentFeeDisplay {
  feeDetails: IPaymentFeeDetails | null;
  isLoading: boolean;
  isError: boolean;
}

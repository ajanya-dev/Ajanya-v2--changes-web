export type PsbSteps =
  | 'select_payee'
  | 'select_payee_amount'
  | 'payment_method'
  | 'select_card'
  | 'select_bank'
  | 'select_payee_receive_type'
  | 'check_information'
  | 'mail'
  | 'email'
  | 'ach'
  | 'payment_success'
  | 'select_wallet'
  | 'wire'
  | 'card';
export type PsbPaymentMethodIds = 'card' | 'bank' | 'cloud' | 'wallet';
export type PsbRecieveMethodIds =
  | 'ach'
  | 'mail'
  | 'email'
  | 'print'
  | 'wire'
  | 'card';

export interface IPsbPaymentMethods {
  id: PsbPaymentMethodIds;
  img: string;
  heading: string;
  description: string;
  isDisabled?: boolean;
}
export interface IPsbPaymentRecieveMethods {
  id: PsbRecieveMethodIds;
  img: string;
  heading: string;
  description: string;
  nextStep: string;
  isDisabled?: boolean;
  toolTip?: string;
  supportedMethods?: { id: string; name: string }[];
}

export interface IExistingCreditCards {
  bgColor: string;
  card: string;
  cardMasked?: string;
  cardId: string;
  nickName: string;
  isLatest?: number;
  id?: string;
  last4?: string;
  colorClasses?: {
    bg?: string;
    text?: string;
  };
  customerVaultId?: string;
  gatewayType?: number;
  cardType?: string
  isMapped?: boolean;
  notAvailableGateway?:number
  allowSkipGatewayAddition?: boolean
}

export interface IPsbPayeeDetails {
  added_amount: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  company: string;
  country: string;
  createdAt: string;
  email: string;
  encryptedId: string;
  id: string;
  label: string;
  name: string;
  nickName: string;
  payeeTypeId: string;
  phone: string;
  state: string;
  typeDetails: string;
  zip: string;
}

export interface IPsbtransactionFee {
  featureCode: string;
  transactionAmount: number;
  shipping_type?: string;
  samedayFeatureCode?: string;
  /** 1 while the payee is being texted — the SMS is priced with the payment. */
  send_sms?: 0 | 1;
}

export interface IPsbBankAccount {
  id: string;
  accountNumber: string;
  bankName: string;
  cashAccount: number;
  name: string;
  nickName: string;
  routingNumber: string;
  status: string | number;
  statusDescription: string;
  verified: number;
  mAch: number;
  isItZil: number;
  achApplicationStatus?: number;
  verifiedBy?: number;
}

export interface IPsbVirtualCards {
  card_id: string;
  card_holder_name: string;
  card_holder_email: string;
  card_holder_phone: string;
  last4: string;
  expiry: string;
  status: string;
  card_amount: string;
  subject_type_description: string;
}

export interface IPaidStatement {
  zil_payment_id: string;
  status: string;
  description: string;
  changes: string;
  ip_address: string;
  device: string;
  task_by: string;
  created_at: string;
  updated_at: string;
}

export interface IGetPaidByLinkRes {
  id: string;
  name: string;
  formTemplateId: number;
  bankAccountId: string;
  redirectUrl: string;
  autoRedirect: number;
  shortUrl: string;
  bottomText: any;
  logoUrl: string;
  bankVerificationRequired: number;
  isBankVerifyDisabled: number;
  companyName: string;
  isPayeeCompanyRequired: string;
  deductServiceFeeFromMainAmount: string;
  addressNeeded: string | number;
  allowCheckNumber: string;
  customFields?: string | string[];  // Backend sends as JSON string "[\"Invoice\"]" or array
  custom_fields?: string[];  // Keeping for backward compatibility
  bankAccount: {
    bankAccountId: string;
    bankAccountName: string;
    bankAccountNickName: string;
  };
  paymentOption: {
    [key: `${number}`]: {
      status: number | string;
      id: number | string;
    };
  };
  stripeCredentials: string;
  paypalCredentials: string;
  bitpayCredentials: string;
  stripeCheckoutCredentials: string;
  expiry_rules: {
    expiryDate: string;
    maxTransactionCount: number;
    maxTotalAmount: string;
  };
}

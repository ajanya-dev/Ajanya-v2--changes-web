export interface IGettingStartedData {
  isEmailVerificationDone: boolean;
  isPhoneVerificationDone: boolean;
  isBankAccountLinkingDone: boolean;
  isBankAccountVerificationDone: boolean;
  isFirstPayeeDone: boolean;
  isFirstPaymentDone: boolean;
  isKycStatusDone: boolean;
  isKybStatusDone: boolean;
  adp?: IAdpGettingStartedData;
}

export interface IAdpGettingStartedData {
  isCardAdded: number;
  isPhoneVerified: number;
  verifyBankAcStatus: number;
}
export interface IGettingStartedProgressBar {
  gettingStartedStatusCode: number;
  gettingStartedState: string;
  gettingStartedProgress: number;
  isGettingStartedEnabled: boolean;
}

export interface IGettingStartedAPI {
  v3NewDesignPopup: number;
  bankAccount: number;
  payee: number;
  payment: number;
  kycStatus: number;
  kybStatus: number;
  ach: number;
  verification: number;
  adp?: IAdpGettingStartedData;
}

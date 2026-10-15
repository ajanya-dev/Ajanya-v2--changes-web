import { IBankData } from './bank';

export interface yodleeAccDetails {
  accountName: string;
  accountNickName: string;
  accountNo4Validation: string;
  accountNumber: string;
  bankFormData: {
    bankAccountAddressLine1: string;
    bankAccountAddressLine2: string;
    bankAccountCity: string;
    bankAccountCountry: string;
    bankAccountName: string;
    bankAccountNickName: string;
    bankAccountNumber: string;
    bankAccountState: string;
    bankAccountZip: string;
    bankRoutingNumber: string;
  };
  bankName: string;
  fullAccountNumber: string;
  hiddenAccountNumber: string;
  hiddenFullAccountNumber: string;
  isAddressVerificationRequired: number;
  isChecked: boolean;
  isValid: boolean;
  isVerificationRequired: number;
  profile: IYodleeProfile | [];
  providerId: string;
  routingNumber: string;
  ydId: number;
  isChase: boolean;
}

export interface IUnlinkBanks {
  unlinkedAccounts: number;
  bankData: IUnlinkBankList[];
  key: string;
  errorCode?: string;
}

export interface IUnlinkBankList {
  routingNumber: string;
  accountNumber: string;
  fullAccountNumber: string;
  hiddenFullAccountNumber: string;
  hiddenAccountNumber: string;
  bankName: string;
  accountName: string;
  accountNickName: string;
  ydId: number;
  providerId: string;
  isVerificationRequired: number;
  profile: IProfile;
  isAddressVerificationRequired: number;
}

export interface IYodleeProfile {
  address: string;
  address2: string;
  city: string;
  country: string;
  state: string;
  zip: string;
}

export interface IBankModalOptionData {
  success: boolean;
  data: {
    unlinkedAccounts: number;
    key: string;
    bankData: bankAcItem[];
  };
}

interface bankAcItem {
  accountName: string;
  accountNickName: string;
  accountNumber: string;
  bankName: string;
  fullAccountNumber: string;
  hiddenAccountNumber: string;
  hiddenFullAccountNumber: string;
  providerId: string;
  routingNumber: string;
  ydId: string;
  isChecked?: boolean;
}

export interface IConnectBank {
  dialogueInitializationData: {
    mode: string;
    verifyNowAccountData?: IBankData;
    key?: string;
  };
  isModal: boolean;
  singleSelection?: unknown;
}

export interface ISelectYodleeAccount {
  bankAccounts: ISelectAccountData[];
  key: string;
  alreadyAddedAccounts?: IAlreadyAccount[];
  verified?: boolean;
  verifiedAccounts?: IverifiedAccounts[];
  unlinkedAccounts?: IverifiedAccounts[];
}

export interface ISelectAccountData {
  accountName: string;
  accountNickName: string;
  accountNumber: string;
  bankName: string;
  fullAccountNumber: string;
  hiddenAccountNumber: string;
  hiddenFullAccountNumber: string;
  isAddressVerificationRequired: number;
  isChecked: boolean;
  isVerificationRequired: number;
  providerId: string;
  routingNumber: string;
  ydId: string;
  profile: IProfile;
}

interface IProfile {
  address: string;
  address2: string;
  city: string;
  country: string;
  state: string;
  zip: string;
}

interface IAlreadyAccount {
  accountName: string;
  accountNumber: string;
}

export interface IverifiedAccounts {
  routingNumber: string;
  accountNumber: string;
  accountName: string;
  nickName: string;
  hiddenAccountNumber: string;
}

export interface IYodleeParentData {
  key?: string;
  mode?: string;
  unlinkedBankAccounts: IBankAcItem[];
  verifyNowAccountData?: string | { pk?: string } | IPlexeYodleeData;
  directDepositReceiving?: boolean;
  externalToken?: string;
}

interface IPlexeYodleeData {
  bank_account_account_number: string;
  id: string;
  accountName: string;
  routingNumber: string;
  name?: string | undefined;
  vb?: number | undefined;
  mav: number;
  eligibility: number;
  provider_id: string;
}

interface IBankAcItem {
  accountName: string;
  accountNickName: string;
  accountNumber: string;
  bankName: string;
  fullAccountNumber: string;
  hiddenAccountNumber: string;
  hiddenFullAccountNumber: string;
  providerId: string;
  routingNumber: string;
  ydId: string;
  isChecked?: boolean;
}

export interface IYodleeParentCommonData {
  dialogueInitializationData:
    | { mode?: string; verifyNowAccountData?: IBankData }
    | boolean
    | IYodleeParentData;
  singleSelection?: boolean | undefined;
  isModal?: boolean;
}

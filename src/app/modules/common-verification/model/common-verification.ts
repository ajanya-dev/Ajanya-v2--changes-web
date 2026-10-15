import { FormControl } from '@angular/forms';

export interface IUserBusiness {
  businessAddress: string;
  businessCity: string;
  businessCountry: string;
  businessName: string;
  business_name?: string;
  businessState: string;
  businessZip: string;
  businessdba: string;
  ein: string;
  entityType: string;
  formationDate: string;
  id: string;
  industryType: string;
  status: number;
  userId: number;
  attachments: any;
}

export interface IAddBizData {
  sourceType: CVSourceType;
  bankAccountId?: string;
}

export interface ISelectBizData {
  sourceType: CVSourceType;
  applicationStatus: { kycStatus: number; kybStatus: number };
  bankData: any;
  applyCloudBank?: boolean;
  applyCheckDraft?: boolean;
  applyACH?: boolean;
  isShowBankDropDown?: boolean;
  from?: string;
}

export interface IActionLoaderData {
  type: {
    ach?: { businessId: string; bankAccountId: string };
    checkDraft?: { businessId: string; bankAccountId: string };
    cloudBank?: { businessId: string };
    cloudBankPersonalAccount?: FormData;
  };
}

export interface IBusinessOwners {
  firstName: string | null;
  lastName: string;
  title: string;
  fullSsn: string;
  birthDate: string;
  phoneNumber: string;
  ownershipPercentage: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  email: string;
  phoneNo?: string;
}

export enum CVSourceType {
  'getting_started' = '1',
  'ACH' = '2',
  'cloud_bank' = '3',
  'check_draft' = '4',
  'credit_card' = '5',
  'other' = '6',
  'add_new_business' = '7',
  'getting_started_v3' = '8',
  'subscription' = '9',
  'form-1099' = '11',
  'rain_card' = '13'
}

export interface IBusinessOwnershipForm {
  firstName: FormControl<string | null>;
  lastName: FormControl<string | null>;
  title: FormControl<string | null>;
  fullSsn: FormControl<string | null>;
  birthDate: FormControl<string | null>;
  phoneNumber: FormControl<string | null>;
  ownershipPercentage: FormControl<string | null>;
  address: FormControl<string | null>;
  city: FormControl<string | null>;
  state: FormControl<string | null>;
  zip: FormControl<string | null>;
  country: FormControl<string | null>;
  email: FormControl<string | null>;
  phoneNo?: FormControl<string | null>;
}

import { FormControl } from '@angular/forms';
import { ICompanyInfo } from '../../../model/login';

export interface ISocialIcon {
  name: string;
  image: string;
  url: string;
  styles?: {
    img?: { width: string; height: string };
    a?: { width: string };
  };
}

export type IRegisterResponse = {
  success: boolean;
  access_token: string;
  name: string;
  companyInfo: ICompanyInfo;
  userInfo: {
    userId: number;
    encryptedUserId: string;
  };
  showComplianceModal: number;
  trialStartDate: string;
  trialEndDate: string;
  trialDuration: number;
  trialPlanType: string;
};

export interface ISetPasswordExternalPayload {
  email: string;
  password: string;
  passwordConfirmation: string; 
  externalLogin: string;
  termsAndCondition: boolean; 
}

export interface IRegisterForm {
  name: FormControl<string | null>;
  email: FormControl<string | null>;
  password: FormControl<string | null>;
  password_confirmation: FormControl<string | null>;
  phone: FormControl<string | null>;
  coupon_code: FormControl<string | null>;
  phone_no: FormControl<string | null>;
  termsAndCondition: FormControl<boolean | null>;
  eSign: FormControl<boolean | null>;
  ccpa: FormControl<boolean | null>;
}

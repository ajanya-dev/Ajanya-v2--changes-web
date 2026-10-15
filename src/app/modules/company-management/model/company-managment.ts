export interface ICompanyDetails {
  businessInfo: IBusinessInfo;
}

export interface IBusinessInfo {
  companyName: string;
  companyAddressLine1: string;
  companyAddressLine2: string;
  companyCity: string;
  companyState: string;
  companyZip: string;
  companyCountry: string;
  entityType: string;
  dba: string;
  formationDate: string;
  industryType: string;
  ein: string;
  companyLogo: string;
  companyLogoUrl: string;
}

export interface IOwnCompanies {
  id: string;
  companyId: string;
  companyName: string;
  isItDefault?: number;
  companyLogo?: string;
  companyLogoUrl?: string;
  createdAt?: string;
  status?: number;
}

export interface IDeletedCompanies {
  id: string;
  companyId: string;
  companyName: string;
  createdAt: string;
  isItDefault: unknown;
  scheduledOn: string;
  deleteOn: string;
}

export interface ICancelDelete {
  id: number;
  name: string;
  message: string;
}

export interface IOnboardingLinkPayload {
  customerRef: string;
  sendEmail?: boolean;
  email?: string;
}

export interface IOnboardingLink {
  customerRef: string;
  onboardingUrl: string;
  expiresAt: string;
  emailSent: boolean;
  sentTo: string | null;
  emailError?: string;
}

export interface IOnboardingLinkRes {
  success: boolean;
  data: IOnboardingLink;
  errorMsg?: string;
}

export interface IDeletedCompany {
  id: string;
  name: string;
  deletionScheduledAt: string;
}

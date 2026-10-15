export interface ICurrencyDetails {
  formId?: number;
  currencyName: string;
  currencyCode: string;
  formData?: string;
}

export interface ICountryDetails {
  countryCode: string;
  countryName: string;
  currency: ICurrencyDetails[];
}

export interface IInternationalBankAccountRequest {
  id?: string;
  accountNumber: string;
  identifierType: string;
  identifierCode: string;
  accountType: string;
  bankName: string;
  beneficiary: IBeneficiary;
  beneficiaryBankDetails: IBeneficiaryBankDetails;
  payeeId: string;
  ifsc: string;
  payeePhone?: string;
}

export interface IInternationalPayeeAccount {
  id?: number;
  payee_id: string | undefined;
  bank_name: string;
  account_number: string;
  routing_number?: string;
  swift_or_bic: string;
  payee_name?: string;
  payee_nationality?: string;
  currency?: string;
  payment_purpose?: string;
  country?: string;
  location?: string;
  pan?: string;
  ifsc?: string;
  contact_phone?: string;
  purpose_code?: string;
  account_type: string;
  identifierType?: string;
  identifierCode?: string;
  bank_identifier_type: string;
  bank_identifier_code: string;
  encrypted_id: string;
  beneficiary: IBeneficiary;
  beneficiaryBankDetails: IBeneficiaryBankDetails;
  is_default_for_business?: number;
  is_default_for_personal?: number;
}

export interface IBeneficiary {
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  idType?: string;
  poBox?: string;
  dateOfBirth?: string;
  beneficiaryIdNumber?: string;
  beneficiaryIdDocumentType?: string;
  organisationIdNumber?: string;
  dateOfIncorporation?: string;
  countryOfIncorporation?: string;
  businessLegalName?: string;
  organisationIdType?: string;
  givenName?: string;
  familyName?: string;
  routing_or_sort_code?: string;
  email?: string;
  phone?: string;
}

export interface IBeneficiaryBankDetails {
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  bankingInstituteName: string;
  identifierCode?: string;
}

export interface IPuposeCodes {
  code: string;
  description: string;
  country: string;
}

export interface IInternationalBanksPayee {
  id: string;
  bank_name: string;
  bankName?: string;
  payee_name: string;
  country: string;
  account_number: string;
  currency: string;
  biz_id: string;
}

export interface IIndustryTypes {
  mcc_code: string;
  mcc_description: string;
  main_category: number;
}

export interface IInternationalPayeeBankJsonData {
  // Business fields
  business_legal_name?: string;
  organisation_id_number?: string;
  date_of_incorporation?: string;
  country_of_incorporation?: string;

  // Personal fields
  beneficiary_given_name?: string;
  beneficiary_family_name?: string;

  // Common fields
  branch_code?: string;
  relationship?: string;

  // Address fields for beneficiary
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;

  // Bank address fields
  bank_address_line_1?: string;
  bank_address_line_2?: string;
  bank_city?: string;
  bank_state?: string;
  bank_zip?: string;
  bank_country?: string;
}

export interface IInternationalPayeeBankResponse {
  id: number;
  payee_id: string | undefined;
  bank_name: string;
  account_number: string;
  holder_type: string | null;
  account_type: string;
  routing_number: string | undefined;
  bank_identifier_type: string;
  bank_identifier_code: string;
  swift_or_bic: string;
  payee_name: string | undefined;
  account_name: string | null;
  payee_nationality: string | undefined;
  currency: string;
  payment_purpose: string | null;
  json_data: string;
  created_for_id: number;
  created_by_id: number;
  biz_id: number | null;
  pp_account_id: number | null;
  country: string | null;
  kyc_location: string | null;
  location: string | null;
  pan: string | null;
  ifsc: string;
  address: string | null;
  contact_phone: string | null;
  purpose_code: string | null;
  sort_code: string | null;
  status: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  encrypted_id: string;
  beneficiary: IBeneficiary;
  beneficiaryBankDetails: IBeneficiaryBankDetails;
  is_default_for_business?: number;
  is_default_for_personal?: number;
}

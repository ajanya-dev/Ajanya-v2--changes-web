import { IPayeeSingleBankData } from 'src/app/modules/check-draft/model/Checkdraft';
import {
  IBeneficiary,
  IBeneficiaryBankDetails,
  IInternationalBanksPayee,
  IInternationalPayeeAccount
} from '../../../cloud-bank/cloud-bank-v2/model/internationalPayments';

export interface IPayeesState {
  payees: IPayeeDropdown[];
  pageNo: number;
  isFilterOn: boolean;
  searchTerm: string;
  searchIds: string[];
  payeesFiltered: IPayeeDropdown[];
  filteredPageNo: number;
  isLoading: boolean;
  isPayeesByIdsLoading: boolean;
  isError: boolean;
  /** Whether the last page of each list has been reached. */
  hasMore: boolean;
  filteredHasMore: boolean;
  skipEmpty?:boolean;
  isReload?:boolean;
  disablePermission?: boolean;
}

export interface INewPayee {
  payeeTypeId: string;

  name: string;
  payeeNickName: string;
  payeeEmail: string;
  payeePhone: string;
  payeeCompanyName: string;
  payeeAddressLine1: string;
  payeeAddressLine2: string;
  payeeCity: string;
  payeeState: string;
  payeeCountry: string;
  payeeZip: string;
  payeeName?: string;
  payeeAccountNo?: string;
  payeeAddress1?: string;
  payeeCompany?: string;
  payeeIdNumber?: string;
  merchantCategory?: string | number;
  entityType?:string;

  customerAccountNumber: string;
  vendorAccountNumber: string;
  employeeAccountNumber: string;
  isRequestedBankInfo: string | boolean;
  payeeCompanyWebsite?: string;

  bankData: IPayeeBankDetails[] | IPayeeSingleBankData[];
  internationalWirePayeeAccounts:
    | IInternationalBanksPayee[]
    | IInternationalWirePayeeAccounts[];

  customerBankAccountId: string;
  customerCategory: string;
  customerDefaultPayMethod: string;
  customerFirstName: string;
  customerLastName: string;
  customerType: string;
  customerCompanyName: string;
  vendorBankAccountId: string;
  vendorCategory: string;
  vendorDefaultPayMethod: string;
  vendorFirstName: string;
  vendorLastName: string;
  vendorType: string;
  vendorPaymentTerms: string;
  vendorTaxId: string;
  vendor_1099: string;
  vendorCompanyName: string;

  employeeFirstName: string;
  employeeLastName: string;
  employeeDob: string;
  employeeSsn: string;
  employeeType: string;
  employeeHourlyRate: string;
  employeePaymentSchedule: string;
  employeeFillingStatus: string;
  employeeOvertimeRate: string;
  employeeYtdEarning: string;
  employeeYtdTax: string;
  employeeBankAccountId: string;
  employeeCategory: string;
  employeeDefaultPayMethod: string;
  is_requested_bank_info: number;
  permission_email: number;
  permission_sms: number;
}
export interface IPayeeBankData {
  id: string;
  accountNumber: string;
  routingNumber: string;
  accountType: string;
  bankName: string;
  defaultDDAccount: string;
}

// payee international bank acc

export interface IInternationalWirePayeeAccounts {
  payeeId: string;
  id: string;
  accountNumber: string;
  identifierCode: string;
  identifierType: string;
  bankIdentifierCode: string;
  bankIdentifierType: string;
  accountType: string;
  bankName: string;
  ifsc: string;
  beneficiary: IBeneficiary;
  beneficiaryBankDetails: IBeneficiaryBankDetails;
  json_data?: string;
}

///payee dropdown
export interface IPayeeDropdown {
  id: string;
  name: string;
  nickName?: string;
  phone?: string;
  addressLine1?: any;
  addressLine2?: any;
  city?: string;
  company?: string;
  country?: string;
  createdAt?: string;
  email?: string;
  encryptedId?: string;
  payeeTypeId?: string;
  encrypted_id?: string;
  state?: string;
  zip?: string;
  payeeIdNumber?: string;
  entityType?: string;
  merchantCategory?: number | string;
  isFreezed?: boolean;
  netsuitePayee?:{
    qbId:number;
    status:number;
  }

  typeDetails?: {
    id: string;
    createdAt: string;
    customerAccountNumber: string;
    customerBankAccountId: string;
    customerCompanyName: string;
    customerDefaultPayMethod: string;
    customerFirstName: string;
    customerLastName: string;
    customerMiddleName: string;
    customerNote: string;
    customerType: string;
    deletedAt: string;
    employeeAccountNumber: string;
    employeeBankAccountId: string;
    employeeDefaultPayMethod: string;
    employeeDob: string;
    employeeFillingStatus: string;
    employeeFirstName: string;
    employeeHourlyRate: string;
    employeeLastName: string;
    employeeMiddleName: string;
    employeeNote: string;
    employeeOvertimeRate: string;
    employeePaymentSchedule: string;
    employeeSsn: string;
    employeeType: string;
    employeeYtdEarning: string;
    employeeYtdTax: string;
    payee: {
      payeeId: string;
      payeeAccountNumber: string;
      payeeMobilePhone: string;
    };
    updatedAt: string;
    vendor1099: string;
    vendorAccountNumber: string;
    vendorBankAccountId: string;
    vendorCompanyName: string;
    vendorDefaultPayMethod: string;
    vendorFirstName: string;
    vendorLastName: string;
    vendorMiddleName: string;
    vendorNote: string;
    vendorPaymentTerms: string;
    vendorTaxId: string;
    vendorType: string;
  };
}

export interface IPayeeBankDetails {
  id: string;
  /** The same account by its plain id — what `checks/direct-deposit` names it by. */
  decryptedId?: number;
  accountNumber: number;
  accountType: string;
  bankName: string;
  defaultCDAccount: number;
  defaultDDAccount: number;
  routingNumber: number;
  verified: number;
}

export interface IViewPayee {
  accountNumber: string;
  accountType: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  company: string;
  country: string;
  email: string;
  id: string;
  name: string;
  nickName: string;
  payeeIdNumber: string;
  phone: string;
  routingNumber: string;
  state: string;
  zip: string;
  heading?: string;
  hiddenAccountNum?: string;
  entityType?: string;
  merchantCategory?: number;
  isPayer?: boolean;
}

export interface IPayeeDetails {
  customerAccountNumber: string;
  customerBankAccountId: string;
  customerCompanyName: string;
  customerDefaultPayMethod: string;
  customerFirstName: string;
  customerLastName: string;
  customerMiddleName: string;
  customerNote: string;
  customerType: string;
  customerCategory: string;
  employeeAccountNumber: string;
  employeeBankAccountId: string;
  employeeDefaultPayMethod: string;
  employeeDob: string;
  employeeFillingStatus: string;
  employeeFirstName: string;
  employeeLastName: string;
  employeeMiddleName: string;
  employeeNote: string;
  employeeOvertimeRate: string;
  employeePaymentSchedule: string;
  employeeHourlyRate: string;
  employeeSsn: string;
  employeeType: string;
  employeeYtdEarning: string;
  employeeYtdTax: string;
  employeeCategory: string;
  name: string;
  payeeAddressLine1: string;
  payeeAddressLine2: string;
  payeeCity: string;
  payeeCompanyName: string;
  payeeCountry: string;
  payeeEmail: string;
  payeeNickName: string;
  payeePhone: string;
  payeeState: string;
  payeeTypeId: string;
  payeeZip: string;
  vendorAccountNumber: string;
  vendorBankAccountId: string;
  vendorCompanyName: string;
  vendorDefaultPayMethod: string;
  vendorFirstName: string;
  vendorLastName: string;
  vendorMiddleName: string;
  vendorNote: string;
  vendorPaymentTerms: string;
  vendorTaxId: string;
  vendorType: string;
  vendor_1099: string;
  vendorCategory: string;
  merchantCategory: number;
  entityType?:string;
  payeeCompanyWebsite?: string;
}

export interface IPayeeVendorcredit {
  count: number;
  total: string;
}

export interface IPayeeTransaction {
  amount: string;
  bankAccount: string;
  date: string;
  id: string;
  memo: string;
}

export interface IPayeeViewDetails {
  success: boolean;
  data: IPayeeView;
}

export interface IPayeeView {
  payee_information: IPayeeViewInfo;
  payee_more_information: IPayeeViewMoreInfo;
  payeeEncryptedId: string;
  bank_accounts: IPayeeViewBank[];
  international_payee_accounts: IInternationalPayeeAccount[];
  is_payee_banned:number;
}

export interface IPayeeViewBank {
  id?: number | string;
  bank_name: string;
  routing_number: string;
  account_number: string;
  account_type: string;
  is_default_for_check_draft?: number;
  is_default_for_direct_deposit?: number;
  address_line_1?: string;
  bank_account_address2?: string;
  first_name?: string;
  last_name?: string;
  country?: string;
  bank_zip?: string;
  bank_city?: string;
  bank_state?: string;
  beneficiaryBankDetails?: IBeneficiaryBankDetails;
  encrypted_id?: string;
  /**
   * The account's plain id, as the payee bank list returns it (`decryptedId`).
   * Only `checks/direct-deposit` names an account by it; everything else in
   * these flows uses `id` / `encrypted_id`.
   */
  decrypted_id?: number | string;
  is_allow_wire?: number;
  verified?: number;
}

export interface IPayeeBankCreateBody {
  id: string;
  payeeId?: string;
  bankName: string;
  routingNumber: string;
  accountNumber: string;
  accountType: string;
  isAllowWire: number;
  bankAccountFirstName?: string;
  bankAccountLastName?: string;
  bankAccountAddress1?: string;
  bankAccountAddress2?: string;
  bankAccountCity?: string;
  bankAccountState?: string;
  bankAccountZip?: string;
  bankAccountCountry?: string;

  bankingInstituteName?: string;
  bankingInstituteAddressLine1?: string;
  bankingInstituteAddressLine2?: string;
  bankingInstituteCity?: string;
  bankingInstituteState?: string;
  bankingInstituteZip?: string;
  bankingInstituteCountry?: string;
}

export interface IPayeeViewInfo {
  account_number: number;
  id: string;
  payee_address_line_1: string;
  payee_address_line_2: string;
  payee_city: string;
  payee_company_name: string;
  payee_country: string;
  payee_email: string;
  payee_name: string;
  payee_nick_name: string;
  payee_phone: string;
  payee_state: string;
  payee_type_id: number;
  payee_type_name: string;
  payee_zip: string;
  payee_id_number?: string;
  entity_type?: string;
  merchant_category:string
}

export interface IPayeeViewMoreInfo {
  customer_account_number: number;
  customer_bank_account_id: string;
  customer_bank_account_name: string;
  customer_company_name: string;
  customer_default_pay_method: number;
  customer_first_name: string;
  customer_last_name: string;
  customer_middle_name: string;
  customer_note: string;
  customer_type: number;
  employee_account_number: number;
  employee_bank_account_id: string;
  employee_bank_account_name: string;
  employee_default_pay_method: number;
  employee_dob: Date;
  employee_filling_status: number;
  employee_first_name: string;
  employee_hourly_rate: number;
  employee_payment_schedule: number;
  employee_ssn: string;
  employee_type: string;
  employee_ytd_earning: string;
  employee_ytd_tax: string;
  vendor_1099: number;
  vendor_account_number: number;
  vendor_bank_account_id: string;
  vendor_bank_account_name: string;
  vendor_company_name: string;
  vendor_default_pay_method: string;
  vendor_first_name: string;
  vendor_last_name: string;
  vendor_middle_name: string;
  vendor_note: string;
  vendor_payment_terms: string;
  vendor_tax_id: string;
  vendor_type: number;
  entity_type:string
}

export interface IShowPayeeDetails {
  id: string;
  name: string;
  nickName: string;
  company: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  accountNumber: string;
  routingNumber: string;
  accountType: string;
  payeeIdNumber: string;
  cheque_category: string;
  cheque_category_name: string;
  bill_category: string;
  bill_category_name: string;
  invoice_category?: string;
  invoice_category_name?: string;
  invoice_po_no?: string;
  invoice_account_number?: string;
  previous_check_id: string;
}

export interface IPayeeSingleBankAccount {
  id: string;
  accountNumber: string;
  routingNumber: string;
  accountType: string;
  bankName: string;
}

export interface IPaidAmount {
  inThisMonth: string;
  inThisYear: string;
  totalPaid: string;
  paidByDate: string;
}

export interface ICreateDetails {
  id: string;
  bankName: string;
  routingNumber: string;
  accountNumber: string;
  accountType: string;
}

export interface IPayeeDetailsEvent {
  payeeDropdownDetails:
    | IPayeeDropdown
    | IPayeeModalData
    | IViewPayee
    | undefined;
  isMoreDetailsLoading: boolean;
  payeeMoreDetails?: IPayeeView;
  payeeBankDetails?: IPayeeViewBank | null;
  payeeInterBankData?: IInternationalPayeeAccount;
  selectedPayeeDetails?: IPayeeModalData | IPayeeDropdown | undefined;
}

export interface IPayeeEditedData {
  selectedPayeeBank?: IPayeeViewBank;
  selectedInternationalPayeeBank?: IInternationalPayeeAccount;
  selectedPayeeDetails?: IPayeeModalData | IPayeeDropdown | undefined;
  payeeDropdownDetails?:
    | IPayeeDropdown
    | IPayeeModalData
    | IViewPayee
    | undefined;
  updatedPayeePhone?: string;
}

export interface IPayeeModalData {
  accountNumber: string;
  accountType: string;
  zip: string;
  success: boolean;
  state: string;
  routingNumber: string;
  phone: string;
  payeeIdNumber: string;
  nickName: string;
  name: string;
  id: string;
  email: string;
  entityType: string;
  country: string;
  company: string;
  city: string;
  addressLine2: string;
  addressLine1: string;
}

export interface IPayeeChange {
  payeeName: string;
  payeeNickName: string;
}

export interface IPayeeData {
  id: string;
  created_at: string;
  payee_name: string;
  payee_nick_name: string;
  payee_address_line_1: string;
  payee_address_line_2: string;
  payee_city: string;
  payee_state: string;
  payee_zip: string;
  payee_country: string;
  payee_phone: string;
  payee_email: string;
  payee_company_name: string;
  payee_type_id: string;
  encrypted_id: string;
  netsuite_payee?:{
    qb_id:number;
    status:number;
  }
  type_details: {
    id: string;
    createdAt: string;
    customerAccountNumber: string;
    customerBankAccountId: string;
    customerCompanyName: string;
    customerDefaultPayMethod: string;
    customerFirstName: string;
    customerLastName: string;
    customerMiddleName: string;
    customerNote: string;
    customerType: string;
    deletedAt: string;
    employeeAccountNumber: string;
    employeeBankAccountId: string;
    employeeDefaultPayMethod: string;
    employeeDob: string;
    employeeFillingStatus: string;
    employeeFirstName: string;
    employeeHourlyRate: string;
    employeeLastName: string;
    employeeMiddleName: string;
    employeeNote: string;
    employeeOvertimeRate: string;
    employeePaymentSchedule: string;
    employeeSsn: string;
    employeeType: string;
    employeeYtdEarning: string;
    employeeYtdTax: string;
    payee: {
      payeeId: string;
      payeeAccountNumber: string;
      payeeMobilePhone: string;
    };
    updatedAt: string;
    vendor1099: string;
    vendorAccountNumber: string;
    vendorBankAccountId: string;
    vendorCompanyName: string;
    vendorDefaultPayMethod: string;
    vendorFirstName: string;
    vendorLastName: string;
    vendorMiddleName: string;
    vendorNote: string;
    vendorPaymentTerms: string;
    vendorTaxId: string;
    vendorType: string;
  };
  payee_created_by?: {
    id: number,
    name: string
},
}

export interface IPayeeBankEditData {
  editMode: boolean;
  edit: boolean;
  isFromQuickPay: boolean;
  from: string;
  id?: string;
  account: {
    is_allow_wire: boolean;
    routing_number: string;
    encrypted_id: string;
    bank_name: string;
    account_number: string;
    account_type: string;
  };
  data: {
    accountNumber: string;
    accountType: string;
    bankName: string;
    default_dd_account: number;
    id: string;
    routingNumber: string;
  };
}

export interface IPayeeAuditTrialItem {
  formattedCreatedAt: string;
  status: string;
  userName: string;
  deviceName: string;
  note: string;
}

export interface IPayeeStates {
  name: string;
  country_code: string;
  iso2: string;
}


export interface IDisableUserOptionEvent {
  detail: number | string;
  id: string;
  target: {
    value: string | number;
    checked: boolean;
  };
  controls: {
    item: {
      value: string;
    };
  };
}

export interface IPayeeImportStep2 {
  header: { [key: string]: string }[];
  fileHeader: unknown[];
  file_headers: unknown[];
  rows: IPayeeImportStepTwoRowData[],
  template: unknown[];
}

export interface IPayeeImportStepTwoRowData{
  [key:string]:string
}

export interface IPayeeBank {
  id: string
  bank_name: string
  routing_number: string
  account_number: string
  account_type: string
  is_default_for_check_draft: number
  is_default_for_direct_deposit: number
  is_allow_wire: number
  verified?: number
  bank_account_first_name: string
  bank_account_last_name: string
  bank_account_address1: string
  bank_account_address2?: string
  bank_account_city: string
  bank_account_state: string
  bank_account_zip: string
  bank_account_country: string
  banking_institute_name: string
  banking_institute_address_line1: string
  banking_institute_address_line2: string
  banking_institute_city: string
  banking_institute_state: string
  banking_institute_zip: string
  banking_institute_country: string
}

export interface IPayeeInterBank {
  id: string
  payee_name: string
  bank_name: string
  routing_number: string
  account_number: string
  swift_or_bic: string
  bank_identifier_type: string
  account_type: string
  payment_purpose: string
  created_at: string
  updated_at: string
  currency: string
  kyc_location: string
  account_name: string
  bank_account_details: IBankAccountDetails
  is_default_for_business?:number
  is_default_for_personal?:number
}

interface IBankAccountDetails {
  beneficiary_bank_country: string
}
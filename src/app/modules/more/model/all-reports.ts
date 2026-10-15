import { ColDef } from '@ag-grid-community/core';
import { IGoogleAddress } from 'src/app/modules/more/model/google-autocomplete';

export type TReportIds =
  | 'payee-report'
  | 'bank-report'
  | 'nec'
  | 'check-register-report'
  | 'user-summary-report'
  | 'job-processing-summary'
  | 'job-detail-report'
  | 'delete-report'
  | 'void-report'
  | 'payment'
  | 'central-report';

export interface IPayeeReport {
  payeeIds: string[];
  type: number;
  typeIds: string[];
  categoryIds: string[];
  fromDate: string;
  toDate: string;
  fileFormat: string;
  reportType: string;
  email?: string;
}

export interface IIndividualPayeeReport {
  type: 'xlsx' | 'csv';
  fromDate: string;
  toDate: string;
}

export interface INecForm {
  payeeIds: string[];
  businessId?: string;
  fromDate: string;
  toDate: string;
  businessLegalName?: string;
  ein?: string;
  businessAddress?: IGoogleAddress;
}

export interface IPayeePostData {
  payeeIds: string[];
  fromDate: string;
  toDate: string;
}

export interface IPayeeTotalPayementResponse {
  id: string;
  payee_name: string;
  payee_address_line_1: string;
  payee_address_line_2?: string;
  payee_city: string;
  payee_state: string;
  payee_zip: string;
  payee_country: string;
  total_amount: string;
  payee_ssn: string;
  payee_ein: string;
  payee_type_id: number;
}

export interface INecPayeeDetailsData {
  payeeDetails: IPayeeTotalPayementResponse[];
  formDetails: INecForm;
  manualBusinessDetailsIsEnabled: boolean;
  fromDate: string;
  toDate: string;
}

export interface payeeDetailsForm {
  id: string;
  payeeName: string;
  taxIdNumber: string;
  taxIdType: string;
  payeeAddress: string;
  payeeAddressArray?: IGoogleAddress;
  payeeTotalAmount: string | number;
}

export interface INecReportPostForm {
  businessId?: string;
  ein?: string;
  businessLegalName?: string;
  businessAddress?: string;
  businessCity?: string;
  businessState?: string;
  businessZip?: string;
  businessCountry?: string;
  manualBusinessDetailsIsEnabled: boolean;
  payeeDetails: IPayeeDetail[];
  toDate: string;
  fromDate: string;
}
export interface IPayeeDetail {
  id: string;
  payeeName: string;
  taxIdNumber?: string;
  taxIdType: string;
  totalPayment: string;
  address: string;
  city: string;
  state: string;
  zip: number;
  country: string;
}
export interface ICommonReportRequest {
  type?: string;
  start_date: string;
  end_date: string;
}

export interface IColumnField {
  id: string;
  name: string;
  isDisabled: boolean;
  colDef: ColDef;
  isChecked: boolean;
}

export interface IActionComponent {
  name: string;
  id: string;
  icon: string;
}

export interface IHeaderElement {
  buttons: {
    name: string;
    id: string;
    icon: string;
    cssClass: string;
  }[];
}

export interface ICellRenderer {
  action: IActionComponent[];
}

export interface IActionComponentProp {
  actionButton: boolean;
  eyeButton: boolean;
  bankNotVerified?: boolean;
}

export interface IReferalDetails {
  clicked: string;
  ip: string;
  ipAddress: string;
  signUp: string;
  subscribed: string;
  total: number;
}

export interface IFloatingFilterComponent {
  selectDate: Array<{ id: string; initialRange: string }>;
}

export interface IcellRendererActionClickEvent {
  id: string;
  selectedRow: {
    action: string;
  };
}

export interface IAddNewModalData {
  title: string;
  url: string;
  item: {
    encrypted_id: string;
    title: string;
    url: string;
  };
}

export interface IWebTabSelected {
  created_at: string;
  encrypted_id: string;
  index: string;
  title: string;
  url: string;
}

export interface IDocumentMailSummary {
  total_documents: number;
  new_documents: number;
  mailed_documents: number;
  total_shipping_cost: string;
}

export interface IDocumentMailFromAddress {
  id: string;
  payee_name: string;
  payee_company_name: string;
  payee_address_line_1: string;
  payee_address_line_2: string;
  payee_city: string;
  payee_state: string;
  payee_zip: string;
  payee_phone: string;
  payee_email: string;
  payee_country: string;
  created_for_id: number;
  created_by_id: number;
  created_at: string;
  updated_at: string;
  deleted_at: string;
}

export type TDocumentMailAddAddress = Omit<
  IDocumentMailFromAddress,
  | 'id'
  | 'created_for_id'
  | 'created_by_id'
  | 'created_at'
  | 'updated_at'
  | 'deleted_at'
>;

export interface IDocumentMailDataTableRowData {
  id: string;
  document_title: string;
  payee_name: string;
  status_name: string;
  status: number;
  postage_label_pdf_url?: string;
  document: string;
}

export interface IDocumentMailDataFilesTableRowData {
  id: string;
  document_title: string;
  document_name: string;
  document_url: string;
  created_at: string;
  status: number;
}

export interface IDocumentMailStatements {
  status: number;
  status_name: string;
  created_at: string;
  ip: string;
}

export interface IDocumentMailShippingType {
  id: number;
  name: string;
  amount: string;
  country: string;
}

export interface IDocumentMailUpload {
  id: string;
  message: string;
  document_title: string;
  document_name: string;
}

export interface IDocumentMailComments {
  id: string;
  encrypted_id?: string;
  comment: string;
  created_at: string;
  updated_at: string;
}


export interface IDocumentMailActivityLog {
  id: string;
  activity: string;
  created_at: string;
  updated_at: string;
}

export interface IDocumentMailById {
  id: string;
  document_title: string;
  document_name: string;
  document_url: string;
  status: number | string;
  count_page: number;
  created_at: string;
  updated_at: string;
  tracking: ITracking;
}

interface ITracking {
  tracking_code: string;
  tracking_url: string;
  postage_label_url: string;
  mail_type: number;
  mail_type_name: string;
  status: number;
  status_name: string;
  payee_name: string;
  payee_address_line_1: string;
  payee_address_line_2: string;
  payee_city: string;
  payee_state: string;
  payee_zip: string;
  payee_country: string;
  payee_email: string;
  payee_phone: string;
  shipping_cost: string;
  total_fee: string;
}

export interface IPdfPage {
  pageNumber: number;
  thumbnail: string;
  selected: boolean;
  pdfIndex: number;
  originalPageNumber: number;
}

export interface IPdfDocument {
  file: File;
  name?: string;
  numPages?: number;
  pages?: IPdfPage[];
  startPageNumber?: number;
}

export interface IDocumentUploadAdditionalData {
  idempotency_key: string;
  document_title: string;
}

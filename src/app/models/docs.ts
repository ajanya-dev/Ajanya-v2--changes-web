export interface IRequestedDocsDetails {
  id: number;
  uu_id: string;
  created_for_id: number;
  requested_by: number;
  subject: string;
  message: string;
  requested_document_types: string;
  status: string;
  reference_type: string;
  reference_id: string;
  email: string;
  phone: string;
  template: string;
  created_at: string;
  updated_at: string;
  deleted_at: string;
  document_type: DocumentType;
  status_details: string;
  formated_date: string;
}

export interface DocumentType {
  [key: string]: string;
}

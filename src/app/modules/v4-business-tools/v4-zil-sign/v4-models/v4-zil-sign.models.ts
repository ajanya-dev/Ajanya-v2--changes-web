export interface IRequestSign {
  files: File[];
  recipients: IRecipient[];
}

export interface IRecipient {
  id: number;
  name: string;
  email: string;
  note?: string;
  role?: 'owner' | 'signer' | 'receives_copy';
  order?: number;
}

export type FieldType =
  | 'signature'
  | 'initial'
  | 'text'
  | 'date'
  | 'company'
  | 'name'
  | 'email'
  | 'title'
  | 'sign_date'
  | 'checkbox'
  | 'radio'
  | 'attachment';

export type ValidationOption =
  | 'none'
  | 'numeric'
  | 'alphabet'
  | 'email'
  | 'custom';

export interface ISignatureField {
  id?: string;
  type: FieldType;
  x: number;
  y: number;
  width: number;
  height: number;
  pageNumber: number;
  recipientId?: number | null;
  label?: string;
  required?: boolean;
  value?: string;
  readOnly?: boolean;
  fixedWidth?: boolean;
  fixedHeight?: boolean;
  defaultValue?: string;
  fieldName?: string;
  characterLimit?: number;
  dataLabel?: string;
  validation?: ValidationOption;
  filename?: string;
  maxFileSizeMB?: number;
  groupName?: string;
  minRequired?: number;
  maxRequired?: number;
}

export interface IPdfPage {
  pageNumber: number;
  canvas: HTMLCanvasElement;
  overlay?: HTMLDivElement;
  offsetY: number;
  width: number;
  height: number;
  thumbnail?: string;
  pdfWidth: number;
  pdfHeight: number;
  viewportScale: number;
}

export interface IDocumentDetails {
  id: string;
  name: string;
  pdfUrl: string;
  recipients: IRecipient[];
  fields?: ISignatureField[];
  currentRecipientId?: number;
  already_signed?: boolean;
  status?: 'pending' | 'completed' | 'cancelled' | 'signed';
}

export interface ICreateFieldRequest {
  documentId: string;
  type: FieldType;
  x: number;
  y: number;
  width: number;
  height: number;
  pageNumber: number;
  recipientId?: number | null;
  label?: string;
  required?: boolean;
  applyToAllPages?: boolean;
  readOnly?: boolean;
  fixedWidth?: boolean;
  fixedHeight?: boolean;
  defaultValue?: string;
  fieldName?: string;
  characterLimit?: number;
  dataLabel?: string;
  validation?: ValidationOption;
  groupName?: string;
  minRequired?: number;
  maxRequired?: number;
  maxFileSizeMB?: number;
}

export interface ICreateFieldResponse {
  id: string;
  type: FieldType;
  x: number;
  y: number;
  width: number;
  height: number;
  pageNumber: number;
  recipientId?: number;
  label?: string;
  required?: boolean;
}

export interface ISendDocumentRequest {
  documentId: string;
  recipients: IRecipient[];
  fields: ISignatureField[];
}

export interface ISendDocumentResponse {
  success: boolean;
  message: string;
  documentId: string;
}

export interface IFieldValue {
  fieldId: string;
  value: string;
  type: FieldType;
  filename?: string;
}

export interface ISubmitFieldValuesRequest {
  documentId: string;
  token: string;
  fields: IFieldValue[];
}

export interface IDocumentView {
  id: string;
  name: string;
  size: string;
  pages: number;
  url?: string;
}

export interface IRecipientView {
  id: number | string;
  name: string;
  email: string;
  note?: string;
  role: string;
  order?: number;
  status: 'pending' | 'signed';
  signedDate?: string;
  sentFrom?: {
    name: string;
    email: string;
  };
}

export interface IDocumentViewDetails {
  id: string;
  name?: string;
  pdfUrl?: string;
  status: 'pending' | 'completed' | 'cancelled' | 'signed';
  createdDate?: string;
  signedDate?: string;
  sentFrom?: {
    name: string;
    email: string;
  };
  recipientsCount?: number;
  description?: string | null;
  documents?: IDocumentView[];
  recipients?: IRecipientView[];
  fields?: Array<{
    id: string | number;
    type: string;
    x: string | number;
    y: string | number;
    width: string | number;
    height: string | number;
    pageNumber: number;
    recipientId?: number | null;
    label?: string | null;
  }>;
}

export interface IActivity {
  id: string;
  type: 'created' | 'sent' | 'signed' | 'cancelled' | 'resent';
  description: string;
  timestamp: string;
  formatted_date?: string;
  actor?: string;
  user?: string;
  ip_address?: string;
}

export interface IRequestSignResponse {
  id: string;
  document_id: number;
  name: string;
  status: 'pending' | 'completed' | 'cancelled' | 'signed';
  recipients: IRecipient[];
}

export interface IZilSignDocumentRow {
  uuid: string;
  name: string;
  created_at: string;
  status: 'pending' | 'in_progress' | 'signed' | 'cancelled';
}

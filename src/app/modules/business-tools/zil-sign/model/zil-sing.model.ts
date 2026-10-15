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

export type FieldType = 'signature' | 'initial' | 'text' | 'date' | 'company' | 'name' | 'email' | 'title' | 'sign_date' | 'checkbox' | 'radio' | 'attachment';

export type ValidationOption = 'none' | 'numeric' | 'alphabet' | 'email' | 'custom';

export interface ISignatureField {
  id?: string;
  type: FieldType;
  x: number;  // RELATIVE to page left edge
  y: number;  // RELATIVE to page top edge
  width: number;
  height: number;
  pageNumber: number;
  recipientId?: number | null;
  label?: string; // Optional custom label
  required?: boolean;
  value?: string; // Prefilled value (base64 for signature/initials, text for others)
  // Field settings
  readOnly?: boolean;
  fixedWidth?: boolean;
  fixedHeight?: boolean;
  defaultValue?: string;
  fieldName?: string;
  characterLimit?: number;
  dataLabel?: string;
  validation?: ValidationOption;
  filename?: string;         // Original filename for attachment fields
  maxFileSizeMB?: number;    // Max upload size in MB for attachment fields
  groupName?: string; // Radio button group identifier
  minRequired?: number; // Min checkboxes to check in group (checkbox only)
  maxRequired?: number; // Max checkboxes that can be checked in group (checkbox only)
}

export interface IPdfPage {
  pageNumber: number;
  canvas: HTMLCanvasElement;
  overlay?: HTMLDivElement;  // Overlay div for fields on this page
  offsetY: number;  // Absolute Y position in container
  width: number;  // Viewport width in pixels
  height: number;  // Viewport height in pixels
  thumbnail?: string;
  pdfWidth: number;  // PDF page width in points (72 DPI)
  pdfHeight: number;  // PDF page height in points (72 DPI)
  viewportScale: number;  // Scale factor: viewport.width / pdfWidth
}

export interface IDocumentDetails {
  id: string;
  name: string;
  pdfUrl: string;
  recipients: IRecipient[];
  fields?: ISignatureField[];
  currentRecipientId?: number; // ID of the recipient viewing in signer mode
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
  // Field settings
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
  value: string; // Base64 image for signature/initials, text for other types
  type: FieldType;
  filename?: string; // Original filename for attachment fields
}

export interface ISubmitFieldValuesRequest {
  documentId: string;
  token: string;
  fields: IFieldValue[];
}

// Document View Models
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
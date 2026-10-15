export interface INewBill {
  accountNumber: number;
  allAttachments?: string[];
  allComments?: string[];
  amount: number;
  bankAccount: string;
  categoryId: string;
  dueDate: Date | undefined;
  invoiceDate: Date | undefined;
  invoiceNumber: number;
  memo: string;
  payee: string;
  poNumber: string;
  vendorCredit: string;
  item: ICurrentItem[];
  message_id?: string; // Added for invoice-to-bill conversion flow
}

export interface ICurrentItem {
  cost: string;
  description: string;
  item: string;
  qty: string;
  total: string;
}

export interface IBillData {
  accountNo: string;
  amount: string;
  bankAccount: {
    bankAccountName: string;
    bankAccountNickName: string;
    bankAccountNumber: string;
    bankaccountId: string;
  };
  billTotal: number;
  category: {
    categoryId: string;
    categoryName: string;
  };
  checkId: string;
  creditApplied: string;
  dueDate: string;
  id: string;
  invDate: string;
  invNo: string;
  items: string;
  memo: string;
  payee: {
    payeeAddressLine1: string;
    payeeAddressLine2: string;
    payeeCity: string;
    payeeId: string;
    payeeName: string;
    payeeNickName: string;
    payeeState: string;
    payeeZip: string;
  };
  poNumber: string;
  status: number;
  discountAmount: string;
  adjustment: string;
  TotalTax: string;
  amountCredited: string;
  paidAmount: string;
  paidOrAllocated: string;
  importedFrom: string;
  isApprovedXero: number;
}

export interface IGetBills {
  bills: IBill[];
  pagination: IPagination;
}

export interface IBill {
  billId: string;
  invNo: string;
  invDate: string;
  dueDate: string | null;
  amount: string;
  billGrandTotal: string;
  creditApplied: string | null;
  status: string;
  memo: string;
  payee: IPayee;
  isVendorCreditAvailable: number;
  vendorCreditAmount: string;  
  bankAccount: IBankAccount;
}

export interface IBankAccount {
  bankAccountId: string;
  bankAccountName: string;
  bankAccountNickName: string;
  bankAccountNumber: string;
  bankName: string;
}

export interface IPayee {
  payeeId: string;
  payeeName: string;
  payeeNickName: string;
}

export interface IPagination {
  currentPage: number;
  lastPage: number;
  perPage: number;
  total: number;
}

export interface IBillItems {
  id: string;
  description: string;
  item: string;
  itemName?: string;
  quantity: number;
  total: number;
  unitPrice: string;
}

export interface IBillRowData {
  account_no: string;
  action: string;
  amount: string;
  bank_account_account_name: number;
  bank_account_account_number: number;
  bank_name: string;
  bankaccount_id: string;
  bill_grand_total: string;
  bill_status: string | number;
  check_id: string;
  clients: string;
  created_at: string;
  credit_applied: string;
  dueDate: string;
  due_date: string;
  enc_payeeid: string;
  encryptedbancaccid: string;
  enc_category_id: string;
  id: string;
  importedFrom: string;
  inv_date: string;
  inv_no: string;
  invoiceDate: string;
  isApprovedXero: number;
  is_third_party: string;
  memo: string;
  name: string;
  nick_name: string;
  payee_id: string;
  payee_name: string;
  payee_nick_name: string;
  third_party_bill: string;
  isVendorCreditAvailable: number;
  vendor_credit_count:number;
  zil_payment_uu_id?: string;
  payeeId?: string;
  availableCreditAmount?: string | number;
}
export interface IBillComment {
  commentable_id: number;
  commentable_type: string;
  comments: string;
  created_at: string;
  created_by_id: number;
  created_for_id: number;
  encrypted_id: string;
  formated_date: string;
  id: number;
  updated_at: string;
  user: string;
  user_name: string;
}
export interface IBillAttachement {
  attachable_id: number;
  attachable_type: string;
  created_at: string;
  created_by_id: number;
  created_for_id: number;
  encrypted_id: string;
  formated_date: string;
  file_name: string;
  file_nick_name: string;
  id: number;
  updated_at: string;
  page_count: number;
}
export interface IUplaodExtractionResult {
  INVOICE_RECEIPT_ID: string;
  SUBTOTAL: string;
  TAX: string;
  TOTAL: number;
  INVOICE_RECEIPT_DATE?: string;
  DUE_DATE?: string;
  RECIEVER_ADDRESS?: string;
  PAYMENT_TERMS?: string;
  TAX_PAYER_ID?: string;
  ITEM_NAME?: string;
  PRICE?: string;
  QUANTITY?: string;
}

export interface IAttachmentModalData {
  id: string | number;
  type: string;
  existingData?: IBillAttachement[] | IBillComment[];
}

export interface IExtractedItem {
  id?: string | number;
  description?: string;
  quantity?: number;
  price?: number;
  amount?: number;
  ITEM?: string;
  UNIT_PRICE?: string;
  PRICE?: string;
  QUANTITY?: string;
  DESCRIPTION?: string;
}

export interface IExtractedContact {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface IMode {
  mode: string;
  billId: string;
  extractedData?: {
    payee?: string;
    inv_no?: string;
    inv_date?: string;
    due_date?: string;
    amount?: number;
    memo?: string;
    vendor?: IExtractedContact;
    billTo?: IExtractedContact;
    items?: IExtractedItem[];
    po_no?: string;
  };
}

export interface IBillBulkPaymentData {
  totalAmount: string | number;
  bankAccount: {
    bankAccountId: string;
    bankAccountName: string;
    bankAccountNickName: string;
  };
  invoiceNumbers: string;
  payee: {
    payeeId: string;
    payeeName: string;
    payeeNickName: string;
  };
  memo: null | string;
  providerType: number;
  attachments: IBillAttachment[];
  comment_count: number;
  category_id: string;
  remittance?: IBillRemittance[];
  isVendorCreditAvailable: number;
  totalVendorCreditAmount: string;
  amountAfterCreditApplied: string;
  totalBillAmount: string;
  totalCreditApplied: string;
  paymentGroups: IBillBulkPaymentDataGroup[];
}

export interface IBillBulkPaymentDataGroup {
  totalAmount: number;
  totalBillAmount: string;
  totalCreditApplied: string;
  amountAfterCreditApplied: string;
  bankAccount: {
    bankAccountId: string;
    bankAccountName: string;
    bankAccountNickName: string;
  };
  invoiceNumbers: string;
  payee: {
    payeeId: string;
    payeeName: string;
    payeeNickName: string;
  };
  memo: string | null;
  providerType: number;
  category_id: string;
  attachments: IBillAttachment[];
  attachment_count: number;
  comment_count: number;
  remittance: IBillRemittance[];
  isVendorCreditAvailable: number;
  totalVendorCreditAmount: string;
  vendorCredits: unknown[];
  billIds: string[];
}
export interface IBillRemittance {
  item: string
  description: string
  qty: string
  cost: number
  total: string
  item_name: string
  item_id: number,
  invoiceNumber: string,
  invoiceDate: string,
}


export interface IEmailBillItem {
  // Core identification fields
  id: number;
  message_id: string;
  created_for_id: number;

  // Email metadata
  from_email: string;
  from_name: string;
  to_email: string;
  subject: string;
  received_at: string;

  // Processing status
  extraction_status:
    | 'pending'
    | 'processed'
    | 'failed'
    | 'extracted'
    | 'processing'
    | 'retry';

  // Timestamps
  created_at: string;
  updated_at: string;

  // Extracted invoice data (populated after processing) - Updated structure
  extracted_data?: Array<{
    vendor_info?: {
      name?: string;
      address?: string;
      phone?: string;
      address_line_1?: string;
      address_line_2?: string;
      city?: string;
      state?: string;
      country?: string;
      zip?: string;
      url?: string;
    };
    invoice_info?: {
      invoice_id?: string;
      invoice_date?: string;
      due_date?: string;
      total_amount?: string;
      subtotal?: string | null;
      tax?: string | null;
    };
    receiver_info?: {
      name?: string;
      address?: string;
    };
    items?: Array<{
      id?: string | number;
      ITEM?: string;
      PRICE?: string;
      QUANTITY?: string;
      EXPENSE_ROW?: string;
    }>;
    other_data?: {
      OTHER?: string;
    };
  }>;

  // File attachments
  attachments?: Array<{
    id: number;
    filename: string;
    file_nick_name?: string; // Display name
    file_size: number;
    file_type: string;
    file_url: string;
    public_url?: string; // Direct access URL
    uploaded_at: string;
    encrypted_id: string;
  }>;

  // Processing metadata
  processing_metadata?: {
    extraction_confidence?: number; // 0-100 confidence score
    extraction_method?: string; // 'ai', 'ocr', 'manual', etc.
    processing_time_ms?: number;
    error_message?: string;
    retry_count?: number;
    last_retry_at?: string;
  };

  // Business logic fields
  isSelected?: boolean;
  is_processed?: boolean;
  is_archived?: boolean;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  category?: string;
  tags?: string[];

  // Integration fields
  external_id?: string; // ID from external system
  integration_status?: 'pending' | 'synced' | 'failed' | 'ignored';
  last_sync_at?: string;

  // User interaction fields
  viewed_at?: string;
  viewed_by?: number;
  assigned_to?: number;
  notes?: string;

  // Audit fields
  created_by?: number;
  updated_by?: number;
  deleted_at?: string;
  deleted_by?: number;
}

export interface IEmailBillsResponse {
  success: boolean;
  mappedEmail: string;
  data: {
    current_page: number;
    data: IEmailBillItem[];
    first_page_url: string;
    from: number;
    last_page: number;
    last_page_url: string;
    links: Array<{
      url: string | null;
      label: string;
      active: boolean;
    }>;
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number;
    total: number;
  };
}

export interface IAttachment {
  id: number;
  filename: string;
  file_nick_name?: string;
  file_size: number;
  file_type: string;
  file_url: string;
  public_url?: string;
  uploaded_at: string;
  encrypted_id: string;
}

export interface IBillAttachment {
  id: string;
  filename: string;
  file_nick_name?: string;
  pageCount: number;
  created_at: string;
  file_name: string;
  encrypted_id: string;
  formated_date: string;
}

export interface IValidateCreditBillData {
  billId: string;
  billAmount: string;
  billGrandTotal: string;
  creditApplied: string;
  creditAmount: string;
  availableCredit: string;
  amountAfterCreditApplied: string;
}
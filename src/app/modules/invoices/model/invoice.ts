import { ICheckMailTrackDetails } from '../../check/model/check';

export interface AddinvoiceItem {
  product_name: string;
  unit_price: number;
  note: string;
  private_note: string;
}

export interface IInvoiceSummary {
  grand_total: number;
  paid: number;
  balance: number;
}

export interface AddinvoiceTaxInterface {
  tax_name: string;
  tax_percentage: number;
  note: string;
}

export interface INewInvoice {
  accountNumber: number;
  allAttachments: string[];
  bankAccountId: string;
  creditMemo: string;
  creditMemoApplied: string;
  creditmemo: string;
  creditMemoNo: number;
  date: string | null;
  discount: string;
  discountType: number;
  discountTotal: string;
  dueDate: string | null;
  grandTotal: number;
  hiddenPayee: string;
  invoiceCategory: string;
  invoiceNo: string;
  invoiceTaxId: string;
  invoiceTotal: number;
  memo: string;
  poNo: string;
  privateNote: string;
  taxTotal: number;
  totalTotal: number;
  item: InvoiceItem[];
  userId?:string,
  logo?: File | FormData | string | null
}

export interface InvoiceItem {
  cost: string;
  description: string;
  item: string;
  itemDiscount: string;
  itemDiscountApplied: string;
  itemDiscountType: number;
  qty: number;
  rowTotal: number;
  stock: number;
  total: number;
}

export interface AddCreditmemoInterface {
  bankAccountId: string;
  payeeId: string;
  creditMemoDate: string | null;
  creditMemoNo: string;
  poNo: string;
  accountNumber: string;
  note: string;
  memo: string;
  totalTotal: number;
  creditGrandTotal: number;
  creditMemoId: string;
  creditTaxTotal: number;
  taxId: string;
  item: CreditInvoiceItem[];
}

export interface CreditInvoiceItem {
  item: string;
  description: string;
  qty: number;
  cost: number;
  total: number;
  stock: number;
}

export interface AddPaymentInterface {
  InvoicePaymentAmount: number;
  InvoicePaymentType: string;
  InvoicePaymentDate: string;
  InvoicePaymentReference: string;
}

export interface IInvoiceDropdown {
  id: string;
  name: string;
  unitPrice: number;
  uuId?: string;
  stock?: number;
  note?: string;
  tax?: number;
  privateNote?: string;
  ruleId?:string
}

export interface IInvoiceRowData {
  id: number | string;
  invoice_date: string;
  paid: number;
  grand_total: string;
  invoice_no: string;
  balance: string;
  memo?: string;
  created_at: string;
  is_mailed: number;
  is_emailed?: number;
  bank_account_id: string | number;
  payee_name: string;
  payee_id: string;
  status: number;
  bank_account_account_name?: string;
  bank_account_nick_name?: string;
  is_third_party?: number;
  third_party_invoice?: ThirdPartyInvoice;
  action: string;
  importedFrom: string;
  enableTriangle: number;
  isApprovedXero: number;
}

export interface ThirdPartyInvoice {
  id: number;
  uu_id: string;
  created_for_id: number;
  created_by_id: string;
  datas: string;
  reference_id: string;
  realm_id: string;
  provider_type: number;
  ocw_id: number;
  created_at: string;
  updated_at: string;
  deleted_at: string;
}

export interface IAttachments {
  attachable_id: number;
  attachable_type: string;
  created_at: string;
  encrypted_id: string;
  file_name: string;
  file_path: string;
  formated_date: string;
  id: number;
  page_count: number;
  user_name: string;
  checked?: boolean;
}

export interface IEditInvoice {
  action: string;
  encript_id: string;
  id: string;
  index: string;
  item_name: string;
  note: string;
  private_note: string;
  stock: string;
  tax: string;
  unit_price: string;
  uu_id: string;
}

export interface IInvoiceData {
  bankAccount: BankAccount;
  payee: Payee;
  category: Category;
  invoiceDate: string;
  dueDate: string;
  invoiceNo: string;
  poNo: string;
  accountNumber: string;
  logoUrl?: string;
  discount: number;
  discountType: number;
  paid: string;
  totalTax: string;
  taxId: string;
  balance: string;
  total: number;
  discountApplied: string;
  memo: string;
  invoiceId: string;
  note: string;
  items: Item[];
  status: number;
  creditMemoDetails: unknown[];
  creditMemoApplied: string;
  grandTotal: string;
  statements: IInvoiceStatements;
  shippingCharge: number;
  adjustment: number;
  isZohoInvoice: number;
  adjustmentText: string;
  importedFrom: string;
  isImported: number;
  amountCredited: number;
  providerType: number;
  paidFromThirdParty: number;
  thirdPartyAppName: string;
}

export interface BankAccount {
  bankAccountId: string;
  bankAccountName: string;
  bankAccountNickName: string;
}

export interface Payee {
  payeeId: string;
  payeeName: string;
  payeeNickName: string;
  payeeAddress1: string;
  payeeAddress2: string;
  payeeCity: string;
  payeeState: string;
  payeeCountry: string;
  payeeZip: string;
}

export interface Category {
  categoryId: string;
  categoryName: string;
}

export interface Item {
  itemId: string;
  itemName: string;
  note: string;
  unitPrice: string;
  discountType: number;
  discountApplied: string;
  discountAmount: any;
  units: string;
  total: string;
  itemTotal: string;
  stock: string;
}

export interface IInvoiceStatements {
  invoiceDate: string;
  last10Invoice: Last10Invoice[];
  invoice: Invoice;
  items: Item2[];
  invoicePayments: IInvoicePayments[];
  totalPaid: number;
  encryptedId: string;
  status: unknown[];
}

export interface IInvoicePayments {
  paymentDate: string;
  amount: string;
  paymentType: string;
  reference: string;
}

export interface Last10Invoice {
  invoiceDate: string;
  grandTotal: string;
}

export interface Invoice {
  invoiceNo: string;
  invoiceDate: string;
  payeeName: string;
  total: string;
  totalTax: string;
  discountApplied: string;
  grandTotal: string;
  balance: string;
  memo: any;
  invFrom: string;
}

export interface Item2 {
  itemName: string;
  note: string;
  unitPrice: string;
  discountType: number;
  taxAmount: string;
  units: string;
  total: string;
  itemTotal: string;
}

export interface IAuditTrailList {
  deviceName: string;
  formattedCreatedAt: string;
  ipAddress: string;
  note: string;
  status: string;
  userName: string;
}

export interface IAttachmentsList {
  formated_date: string;
  user_name: string;
  file_name: string;
  encrypted_id: string;
  status: {
    status_text: string;
  };
}

export interface IinvoiceitemList {
  id: string;
  name: string;
  note: string;
  privateNote: string;
  stock: string | number;
  tax: string | number;
  unitPrice: string | number;
  uuId: string;
}

export interface ItaxList {
  id: string;
  name: string;
  taxPercentage: string;
  note: string;
  createdAt: string;
}

export interface IgetSingleTaxData {
  id: string;
  name: string;
  taxPercentage: number;
  note: string;
  createdAt: string;
  taxName: string;
}

export interface INumberOnlyEvent {
  which: number;
  keyCode: number;
}

export interface IEvent {
  detail: number | string;
  id: string;
  target: {
    value: string;
    checked: boolean;
  };
  controls: {
    item: {
      value: string;
    };
  };
}

export interface IMailData {
  invoice_data: Invoicedata[] | ITransaction[];
  nonEmailInvoice: unknown[];
}

export interface Invoicedata {
  bankAccountAccountName: string;
  grandTotal: string;
  id: string;
  invoiceNo: string;
  payableLinkId: string;
  payeeEmail: string;
  payeeName: string;
  payee_id?: string;
  payeePhone: string;
  payeeDeleted: string;
  bankAccountDeleted: string;
}

export interface ICreatedExistingAtachments {
  attachable_id: number;
  attachable_type: string;
  created_at: string;
  created_by_id: number;
  created_for_id: number;
  encrypted_id: string;
  file_name: string;
  file_nick_name: string;
  formated_date: string;
  id: number;
  page_count: number;
  updated_at: string;
}

export interface IOpenAttachmentModalData {
  id: string | number;
  type: string;
  existingData: ICreatedExistingAtachments[] | string;
}

export interface IOpenAttachmentModalResponse {
  attachable_id: number;
  attachable_type: string;
  created_at: string;
  created_by_id: number;
  created_for_id: number;
  encrypted_id: string;
  file_name: string;
  file_nick_name: string;
  formated_date: string;
  id: number;
  page_count: number;
  updated_at: string;
}

export interface IAuditList {
  deviceName: string;
  formattedCreatedAt: string;
  ipAddress: string;
  note: string;
  status: string;
  userName: string;
}

export interface ICommentList {
  id?: number;
  encrypted_id?: string;
  formated_date: string;
  user_name: string;
  comments: string;
  status: { status_text: string };
}

export interface ITransaction {
  id: string;
  payeeName: string;
  invoiceNo: string;
  bankAccountAccountName: string;
  grandTotal: string;
  payeeEmail: string;
  payeePhone: string;
  payeeDeleted: string;
  bankAccountDeleted: string;
  payableLinkId: string;
}

export interface ICreditData {
  id: string;
  payeeName: string;
  invoiceNo: string;
  bankAccountAccountName: string;
  grandTotal: string;
  payeeEmail: string;
  payeePhone: string;
  payeeDeleted: string;
  bankAccountDeleted: string;
  payableLinkId: string;
}

export interface IFloatingFilterComponent {
  selectBox: ISelectBox[];
  selectDate: ISelectdate[];
}

export interface ISelectBox {
  id: string;
  values: ISelectBoxValues[];
}

export interface ISelectBoxValues {
  value: number;
  name: string;
}

export interface ISelectdate {
  id: string;
  initialRange: string;
  isPrimary: boolean;
}

export interface IcellRendererInvoice {
  action: ICelRendererAction[];
}
export interface ICelRendererAction {
  name: string;
  id: string;
  icon: string;
}

export interface IAlertRes {
  message: string;
  success: boolean;
  error?: {
    errorCode: number;
  };
}

export interface IOpenAttachmentsRes {
  data: string;
  success: boolean;
}

export interface ICreditViewData {
  amount: string;
  creditMemoDate: string;
  balance: string;
  creditMemoNo: string;
  payeeName: string;
  bankAccountName: string;
  memo: string;
  used: number;
  items: ICreditViewItem[];
  status: number;
}

export interface ICreditViewItem {
  itemName: string;
  note: string;
  unitPrice: string;
  units: string;
  total: string;
}

export interface IactionComponentProp {
  actionButton: boolean;
  eyeButton: boolean;
}

export interface IInvoiceColumnFields {
  id: string;
  name: string;
  isDisabled?: boolean;
  colDef: any;
  isChecked: boolean;
}

export interface ICelRendererActionEvent {
  id: string;
  selectedRow: ICellselectedRow;
  tableId: string | undefined;
}

export interface ICellselectedRow {
  created_at: string;
  id: string;
  index: string;
  note: string;
  tax_name: string;
  tax_percentage: string;
}
export interface IInvoiceTaxlistHeaderButtonEvent {
  id: string;
  selectedRow: ICellselectedRow[];
  tableId: string | undefined;
}

export interface IgetInvoiceNo {
  lastInvoiceNo: string;
  invoiceNo: string;
  logoUrl: string;
}

export interface IgetCreditBalance {
  availableCreditMemo: string;
}

export interface AttachmentData {
  ids: string[];
  fileName: string;
}

export interface ICreditMemoTransaction {
  amount: string;
  payment_date: string;
  reference: string;
  invoice_no: string;
}

export interface ICreditMemoData {
  action: string;
  amount: string;
  balance: string;
  credit_memo_date: string;
  credit_memo_no: string;
  formated_credit_memo_date: string;
  id: number;
  index: string;
  memo: string;
  name: string;
  payee_name: string;
  po_no: string;
  status: number;
  transactions?: ICreditMemoTransaction[];
}

export interface ICreditMemoDetails {
  accountNo: string;
  amount: string;
  bankAccount: {
    bankAccountId: string;
    bankAccountName: string;
    bankAccountNickName: string;
  };
  creditMemoDate: string;
  creditMemoId: string;
  creditMemoNo: string;
  items: ICreditMemoOItemDetails[]; // You might want to specify a more specific type for the "items" array.
  memo: string;
  payee: {
    payeeId: string;
    payeeName: string;
    payeeNickName: string;
  };
  poNo: string;
  privateNote: string;
  taxId: string;
  taxPercentage: string;
}

export interface ICreditMemoOItemDetails {
  itemId: string;
  itemName: string;
  note: string;
  stock: string;
  tax: string;
  taxAmount: string;
  total: string;
  unitPrice: string;
  units: string;
}

export interface IPrintData {
  printData: string;
}

export interface IInvoiceEventData {
  selectedRow: IInvoiceRowData;
  id: string;
  tableId: string | undefined;
}

export interface IAddinterfaceRes {
  data: { id: string };
  success: boolean;
  message: string;
}

export interface IAddTaxRes {
  data: { id: string };
  success: boolean;
  message: string;
}

export interface IAddTaxModalRes {
  created_at: string;
  id: string;
  index: string;
  note: string;
  tax_name: string;
  tax_percentage: string;
  mode?: string;
}

export interface IIds {
  ids: string[];
}

export interface IAddCreditMemo {
  accountNo: string;
  amount: number | string;
  bankAccount: {
    bankAccountId: string;
    bankAccountName: string;
    bankAccountNickName: string;
  };
  creditMemoDate: string;
  creditMemoId: string;
  creditMemoNo: string;
  items: {
    itemId: string;
    itemName: string;
    note: string;
    tax: string;
    taxAmount: string;
    unitPrice: string;
    units: string;
    total: string;
  }[];
  memo: string;
  payee: {
    payeeId: string;
    payeeName: string;
    payeeNickName: string;
  };
  poNo: string;
  privateNote: string;
  taxId: string;
  taxPercentage: string;
}

export interface IEmailSmsDialogData {
  // Define the properties you expect in the data object
  invoice_data: ITransaction[] | Invoicedata[];
  nonEmailInvoice: string[];
}

export interface IEmailSmsItems {
  invoicesIds: string[];
  sendPayeeEmail: { [key: string]: string };
  sms_checkbox: { [key: string]: string | boolean };
  send_with_custom_link: { [key: string]: string };
  sendPayeePhone: { [key: string]: string };
}

export interface IEmailSmsAttachment {
  [id: string]: string | undefined;
  fileName?: string;
}

export interface IAddInvoiceDialog {
  isV3: boolean;
  isClone: boolean;
  data: {
    invoiceId: string;
    creditMemoDetails: {
      applied_amount: {
        payment: string;
      }[];
    };
    bankAccount: {
      bankAccountId: string;
      bankAccountNickName: string;
      bankAccountName: string;
    };
    invoiceDate: string;
    dueDate: string;
    taxId: string;
    payee: {
      payeeName: string;
      payeeId: string;
    };
    category: {
      categoryId: string;
      categoryName: string;
    };
    discount: string;
    discountType: string;
    invoiceNo: string;
    poNo: string;
    accountNumber: string;
    note: string;
    memo: string;
    creditmemo: string;
    creditMemoApplied: string;
    total: string;
    totalTax: string;
    invoicetotal: string;
    grandTotal: number;
    creditMemoNo: string;
    amount: number;
    createdById?:string;
    items: {
      itemName: string;
      itemId: string;
      unitPrice: string;
      note: string;
      units: string;
      total: string;
      itemTotal: string;
      stock: number;
      discountType: string;
      discountAmount: string;
      discountApplied: string;
      ruleId?:string
    }[];
    logo?: File | FormData | string | null;
    logoUrl?: string;
  };
}

export interface ICreditMemoDetail {
  success: boolean;
  data: ICreditMemoData;
}

export interface ICreditMemoItem {
  itemName: string;
  note: string;
  unitPrice: string;
  units: string;
  total: string;
}

export interface IViewBill {
  id: string;
  payee: {
    payeeId: string;
    payeeName: string;
    payeeNickName: string;
    payeeAddressLine1: string;
    payeeAddressLine2: string;
    payeeCity: string;
    payeeState: string;
    payeeZip: string;
  };
  bankAccount: {
    bankaccountId: string;
    bankAccountName: string;
    bankAccountNickName: string;
    bankAccountNumber: string;
  };
  checkId: string | undefined;
  category: {
    categoryId: string;
    categoryName: string;
  };
  invNo: string;
  invDate: string;
  amount: string;
  billTotal: string;
  creditApplied: string;
  dueDate: string;
  accountNo: string;
  memo: string;
  status: string;
  poNumber: string;
  items: IItemsViewBill[] | string;
  paidFromThirdParty?: number;
  thirdPartyAppName?: string;
  isApprovedXero?: number;
  isZohoBill?: number;
  importedFrom?: string;
  discountAmount?: number;
  adjustment?: number;
  adjustmentText?: string;
  paidAmount?: number;
  amountCredited?: number;
  paidOrAllocated?: number;
  TotalTax?: number;
  name?: string;
  created_at?: string;
  paidAmountText?: string;
  zil_payment_uu_id?: string;
}
export interface IItemsViewBill {
  description: string;
  qty: string;
  cost: string;
  total: string;
  itemName: string;
  itemId: string;
  discount: string;
}

export interface ICredits {
  id: string;
  amount: string;
  payment: string;
}
export interface IUpdateBill {
  message: string;
}
export interface ICreateBill {
  id: string;
}

export interface IInvoiceMailTrack {
  mailTrackDetails: ICheckMailTrackDetails | undefined;
  isLoading: boolean;
}

export interface IInvoiceRule{
  name: string;
  description: string;
  payeeIds: string[];
  itemIds: string[];
  unitPrice: number;
}

export interface IInvoiceRuleRow {
  id: string
  name: string
  description: string
  unit_price: number
  created_at: string
  updated_at: string
  rule_details: IRuleDetail[]
}

interface IRuleDetail {
  id: number
  rule_id: string
  payee_id: string
  item_id: string
  item: IItem
}

interface IItem {
  id: number
  item_name: string
  encript_id: string
}
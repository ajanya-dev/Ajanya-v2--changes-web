export interface IFinancialStatementRowData {
  id: string;
  old_amount: string;
  amount: string;
  operation_type: number;
  operation: number;
  new_amount: string;
  description: string;
  created_at: string;
  json_data?: IJsonData;
  reference_id: string;
  has_json_data: boolean;
  created_date: string;
  credit: string;
  debit: string;
  action: string;
}

export interface IJsonData {
  invoice_id?: number;
  invoice_no?: string;
  shipping_type: string;
  page_cost: string;
  sms_cost: string;
  paper_type_amount: string;
  shipping_charge: string;
  total: string;
  check_id?: number;
  check_no?: string;
  attachments_count?: number;
  attchments_pages_count?: number;
  total_attchment_cost?: string;
  total_sms_cost: unknown;
  data?: IGroupMailData[];
  shipping_fee_total?: string;
}

export interface IGroupMailData {
  check_id: number;
  check_no: string;
  paper_type_amount?: number;
  attchment_cost?: string;
  sms_cost?: string;
  single_item_cost?: number;
  total?: number;
}

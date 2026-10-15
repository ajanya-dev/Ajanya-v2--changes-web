export interface IApplicationErrorData {
  id: number;
  error_source: string;
  error_type: string;
  error_message: string;
  error_details: IApplicationErrorDetails;
  external_transaction_id: string;
  internal_reference_id: string;
  created_for_id: number;
  created_by_id: string;
  created_at: string;
  updated_at: string;
}

export interface IApplicationErrorDetails {
  bill_id: string;
  payee_id: string;
  vendor_error: string;
}

export interface IApplicationErrorStats {
  total_errors: number;
  by_source: {
    [key: string]: number;
  };
  by_type: {
    [key: string]: number;
  };
}

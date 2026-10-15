export interface IExportModalData {
  bank_accounts_count: number;
  bank_id: number;
  bank_routing_number: string;
  bank_name: string;
  real_bank_name: string;
  id: string;
}

export interface IExportPayload {
  checkIssueFromDate: string | null;
  checkIssueToDate: string | null;
  fileType: string | null | undefined;
  routingNumber: string;
}

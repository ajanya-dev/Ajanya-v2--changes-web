import { FormArray, FormControl } from '@angular/forms';

export interface EmailFormControls {
  emails: FormArray;
  scheduleDate: FormControl<string | null>;
  recurring_include_check: FormControl<boolean | null>;
  frequency: FormControl<string | null>;
  start_date: FormControl<string | null>;
  end_select: FormControl<number | null>;
  count: FormControl<number | null>;
  until: FormControl<string | null>;
}

export interface EmailRow {
  bank_account_account_name: string;
  bank_account_nick_name: string;
  cheque_amount: string;
  cheque_serial_number: string;
  cheque_status: number;
  enc_bank_account_id: string;
  enc_cheque_id: string;
  enc_payee_id: string;
  existing_attach: number;
  payee_email: string;
  payee_name: string;
  payee_phone: string;
  success: boolean;
  checked: boolean;
  subfee: number;
  added_attachments: number;
  attachments: string[];
}

export interface CheckItem {
  action: string;
}

export interface EmailChecksData {
  is_auto_attachment_enabled?: number;
  email: EmailRow[];
  user_notification_sms_enabled: boolean;
}

export interface ProcessData {
  processable_data: {
    emailChequeIds: string[];
  };
}

export interface CheckEmailDialogData {
  type?: string;
  data?: CheckItem[];
  serverData?: EmailChecksData;
  needRecurring?: boolean;
  processData?: ProcessData;
  rowData?: unknown;
  status?: unknown;
  hideSuccessAlert?: boolean;
  paymentMethod?: string;
}

export interface ApiErrorResponse {
  error: {
    errorCode: number | string;
    errorMsg?: string;
  };
}

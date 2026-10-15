export interface IQuickPayBody {
  type: string;
  accountId: string;
  payee: string[];
  payeeBankAccount?: string[];
  amount: string;
  memo: string;
  all_attachments: string[];
  all_comments: string[];
  session_key: string;
  isBehalfOf: number;
  behalfOf?: string;
  quickPay: 1;
}

export interface IComments {
  commentable_id: number;
  commentable_type: string;
  comments: string;
  created_at: string;
  created_by_id: string;
  created_for_id: string;
  encrypted_id: string;
  formated_date: string;
  id: string;
  updated_at: string;
  user: string;
  user_name: string;
}

export interface IAttachments {
  attachable_id: number;
  attachable_type: string;
  created_at: string;
  created_by_id: number;
  created_for_id: number;
  encrypted_id: string;
  file_name: string;
  file_nick_name: string;
  formated_date: string;
  id: string;
  page_count: number;
  updated_at: string;
}

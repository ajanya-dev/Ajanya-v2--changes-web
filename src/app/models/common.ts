import { IRemittanceDetails } from './bank';
import { ICheckComments } from './v3-datatable';

export interface commentInterface {
  comment: string;
}
export interface ICustomDateRangeModel {
  fromDate: string;
  toDate: string;
  colId: string;
  dateRangeId?:
    | 'today'
    | 'yesterday'
    | 'last-7-days'
    | 'this-month'
    | 'last-month'
    | 'last-3-months'
    | 'this-year'
    | 'last-year'
    | 'all-time'
    | 'custom';
}
export interface IDateFilterItem {
  id: string;
  initialRange?: string;
  isPrimary?: boolean;
  isCustomDateFilter?: boolean;
  startDate?: string;
  endDate?: string;
}
export interface IGetAttachment {
  attachable_id: number;
  attachable_type: string;
  created_at: string;
  fileName: string;
  encrypted_id: string;
  file_name: string;
  formated_date: string;
  id: number | string;
  page_count: number;
  user_name: string;
  billAttach: boolean;
  checked?: boolean;
  created_by_id?: number;
  created_for_id?: number;
  file_nick_name?: string;
  status?: string | null;
  all_attachment_status?: {
    status_text: string;
  };
}
export interface IGetComment {
  commentable_id: number;
  commentable_type: string;
  comments: string;
  created_at: string;
  encrypted_id: string;
  formated_date: string;
  id: number;
  user: string;
  user_name: string;
  status?: string |{
    status_text: string;
  } | null;
}

export interface IAttachmentItem {
  fileName?: string;
  formated_date?: string;
  id: string;
  pageCount?: string;
  payment_id?: string;
  user_name?: string;
  encrypted_id: string;
  paymentType?: string;
}

export interface ISetCustomDateRange {
  fromDate: string;
  toDate: string;
  filterType: string;
}

export interface ICountryModel {
  name: string;
  dial_code: string;
  code: string;
  flage_url: string;
  length:{
    min:number|undefined;
    max:number|undefined;
  }
  mask: string;
}

export interface IOtpResponse {
  userId: number;
  message: string;
  success: boolean;
  timer: {
    success: boolean;
    diff: number;
  };
}
export interface IWindowMessageModel {
  eventType: 'success' | 'error' | 'message';
  data: {
    message: string;
    more: any;
  };
}

export interface IComment {
  success: boolean;
  data: IGetComment[] | ICheckComments[];
}

export interface IGetExistLogo {
  id: string;
  fileName: string;
  imageUrl: string;
  imageUrlNoAuth: string;
  imageType: number;
  nickName: string;
}

export interface IV3DropDownOnReady {
  setItemWithId?: (id: string) => any;
  dropDownData?: object;
}

export interface IDropdownMetaData {
  selectableId?: string;
  dropDownAPI?: IV3DropDownOnReady;
}

export interface IUpdatedVersion {
  version: string;
}

export interface IGetRemitance {
  id: number;
  remittable_id: number;
  remittable_type: string;
  date: string;
  total: string;
  created_by_id: number;
  items: string;
  created_for_id: number;
  created_at: string;
  updated_at: string;
  items_by_array: IRemittanceDetails[];
  type: number;
}

export interface ICheckCommentInterface {
  comments: string;
  created_at: string;
  created_by_id: string;
  id:string;
}
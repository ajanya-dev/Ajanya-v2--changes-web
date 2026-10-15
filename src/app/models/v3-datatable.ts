import {
  ColDef,
  ColumnVO,
  IFloatingFilterParams,
  SortModelItem
} from '@ag-grid-community/core';
import { Params } from '@angular/router';
/**
 * @description fields for colDef in ag grid. Built-in ColDef is inherited, so that all the built-in fields like 'cellRenderer', 'cellClass' etc. will be accessible.
 * @summary Fields in colDef in ag grid
 */
export interface ICoulmnDefFields extends ColDef {
  field: string;
  minWidth?: number;
  headerName?: string;
  floatingFilterComponent?: string;
  filter?: string | boolean;
  floatingFilter?: boolean;
  floatingFilterComponentParams?: IFloatingFilterComponentParams;
  sortable?: boolean;
  checkboxSelection?: boolean;
  resizable?: boolean;
  headerClass?: string;
  lockPosition?: boolean;
  headerCheckboxSelection?: boolean;
  showDisabledCheckboxes?: boolean;
  maxWidth?: number;
  pinned?: 'left' | 'right';
}

export interface IFloatingFilterComponentParams {
  tableId?: number;
  tableName?: string;
}

export interface ICoulmnDefFieldsResponse<Type> {
  rowData: Type[];
  rowCount: number;
  storeInfo: unknown[];
  debug: unknown;
  errorMsg?: string;
  permissionRequired?: string;
  permissionType?: string;
  success?: boolean;
  queryGeneratedTime: number | undefined;
}

export interface ISelectBoxFilterArray {
  [filterName: string]: ISelectBoxFilterValues;
}

export interface ISelectBoxFilterValues {
  filter?: string | number;
  filterType?: string;
  type?: string;
}

export interface IFilterModel {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export interface IDefaultPayload {
  filterModel: IFilterModel;
  startRow: number | undefined;
  endRow?: number;
  rowGroupCols: [];
  valueCols: [];
  pivotCols: [];
  pivotMode: boolean;
  groupKeys: [];
  sortModel: { colId: string; sort: 'asc' | 'desc' | null | undefined }[];
  account_id?: string;
  payeeId?: string;
  payeeIds?: string[];
  card_id?: string;
  app_id?: string;
  companyId?: string;
  companyType?: string;
  transfer_status?: string;
  lastUpdatedAt?: number | undefined;
  payee_email?: string;
  received_type?: number;
  cashAccountIds?: string[];
  batchId?: string;
  permissionUserId?: string;
  transfer_type?: string;
  source_id?: string;
  is_payee_bank_verification_held?: number;
  is_micro_deposit_initiated?:number
}

export interface ICheckAttachmentsCount {
  id: string;
  attachment: number;
  comment: number;
  reprint: number;
}

export interface ICheckComments {
  id: string;
  date: string;
  time: string;
  comment: string;
  createdBy: string;
  encrypted_id: string;
  formated_date?: string;
  user_name?: string;
  comments?: string;
  all_comment_status?: {
    status_text: string;
  };
  status?: {
    status_text: string;
  };
}
export interface IMessage {
  non_mailiable_checks: unknown[];
  user_sms_enabled: boolean;
  is_auto_attachment_enabled: number;
}
export interface Data {
  total: string;
  single_items: string[];
  subtotal: string;
  group_shipping_fee: string;
}

export interface IZilPyamentLists {
  id: string;
  sourceId: string;
  sourceType: string;
  amount: string;
  payeeId: string;
  transferId: string;
  transferType: string;
  transferTypeCode: string;
  transferMode: string;
  source: unknown;
  transfer: IZilTransfer[];
  referenceNo: string;
  status: string;
  description: string;
  payee: unknown;
  createdAt: string;
  updatedAt: string;
}
export interface IZilTransfer {
  id: string;
}

export interface IViewActionItem {
  label: string;
  icon: string;
  disabled?: boolean;
}

export interface IRequestPayload {
  startRow: number | undefined;
  endRow: number | undefined;
  rowGroupCols: ColumnVO[];
  valueCols: ColumnVO[];
  pivotCols: ColumnVO[];
  pivotMode: boolean;
  groupKeys: string[];
  filterModel: IFilterModel;
  sortModel: SortModelItem[];
}
export interface IUpdatedFloatingFilter extends IFloatingFilterParams {
  tableId?: string;
  data: Params;
}

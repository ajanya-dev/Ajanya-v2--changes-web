export interface ISMSHeaderElements {
  panelButtons: never[];
  buttons: {
    name: string;
    id: string;
    icon: string;
    cssClass: string;
    toolTip: string;
  }[];
  videoButton: never[];
}

export interface ISMSPanelRowData {
  approval_status: string;
  campaignName: string;
  created_at: string;
  delivered_count: number;
  fromNumber: string;
  groupName: string;
  groupNickName: string;
  id: string;
  index: string;
  message: string;
  not_delivered_count: number;
  status: number;
  total_contacts: string;
}

export interface ISMSPanelSelectedRow<T> {
  id: string;
  selectedRow: T;
  tableId: string;
}

export interface ICampaignRowData {
  contact_id: string;
  created_at: string;
  delivered: number;
  id: string;
  not_delivery_reason: string;
  phone: string;
  sms_charge: string;
  groupName?: string;
}

export interface IContactRowData {
  address1: string;
  address2: string;
  city: string;
  company: string;
  created_at: string;
  created_by_id: number;
  created_for_id: number;
  email: string;
  id: string;
  index: string;
  meta_data: string;
  name: string;
  nickname: string;
  other: string;
  phone: string;
  state: string;
  status: number;
  updated_at: string;
  zip: string;
}

export interface IGroupTableRowData {
  contacts: number;
  created_at: string;
  description: string;
  id: string;
  index: string;
  name: string;
  nick_name: string;
}

export interface IInboxTableRowData {
  id: string;
  data: string;
  fromNumber: string;
  toNumber: string;
  message?: string;
  status?: string;
  created_for_id: number;
  created_at: string;
}

export interface IEntryMessage {
  id: string;
  fromNumber: string;
  groupId: string;
  groupName: string;
  contacts: number;
  entryCode: string;
  message: string;
  fromNumberId: string;
  createdAt: string;
  updatedAt: string;
}

export interface IExtractedContactData {
  header: IExtractedContactHeader[];
  rows: IExtractedContactRowData[];
  groupId: string;
}

export interface IExtractedContactHeader {
  value: string | number;
  displayName: string;
}

export interface IExtractedContactRowData {
  Name: string;
  'Phone Number': number;
  'eMail Address': string;
  Company: string;
  'Address 1': string;
  'Address 2': string;
  City: string;
  State: string;
  Zip: number;
}

export interface IUploadContactFormData {
  template: string;
  excelFile: File;
  includeHeader: boolean;
  groupId: string;
}

export interface IImportedContactData {
  message: string;
  dupilcatedContacts: any[];
  importedContactCount: number;
  duplicateCount: number;
}

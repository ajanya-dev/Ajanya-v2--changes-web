export interface ITabItem {
  id: number;
  name?: string;
  selectedSubTab?: { id: string };
}

export interface IContactDetails1 {
  name: string;
  phone: string;
  id: string;
}

export interface IContactDetails2 {
  address1?: string;
  address2?: string;
  city?: string;
  company?: string;
  createdAt?: string;
  email?: string;
  id: string;
  metaData?: string;
  name?: string;
  phone: string;
  state?: string;
  updatedAt?: string;
  zip?: string;
}
export interface IMessageItem {
  message: string | undefined;
  status: string;
  fromNumber: string;
  dateTime: string | undefined;
}

export interface IPhonenumberUpdateModel {
  name?: string;
  phonenumber?: string;
}

export interface IBuyPhonenumberDetailsModel {
  charge?: number;
  numbers?: string;
  phoneNumberType?: string;
}
export interface IPhonenumberDetailsModel {
  comment?: string;
  fromNumber?: string;
  id?: string;
  name?: string;
  status?: string;
}
export interface IGroupDetails {
  contact: number;
  description?: string;
  id: string;
  name: string;
  nick_name?: string;
}
export interface IDefaultMessageDetails {
  createdAt?: string;
  fromNumber?: string;
  groupName?: string;
  id?: string;
  message?: string;
  serviceId?: string;
  updatedAt?: string;
}

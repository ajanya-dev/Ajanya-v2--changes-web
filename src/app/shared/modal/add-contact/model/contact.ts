export interface IGetContact {
  contact_type: string;
  contactable_id: string;
  email: string;
  encrypted_id: string;
  id: number;
  name: string;
  phone_number: string;
  user_name: string;
}

export interface IContactBody {
  name: string;
  email: string;
  phoneNumber: string;
  contactType: string;
}

export interface IData {
  id: string;
  type: string;
  editMode: boolean;
  data: IGetContact;
}

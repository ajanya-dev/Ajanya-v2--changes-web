export type ShippingSteps =
  | 'delivery_address'
  | 'existing_addr'
  | 'from_address'
  | 'package_page'
  | 'rate_page';
export type shipOptions = { name: string; icon: string };
export type QuickLabelOptions = { code: string; name: string; icon: string };

export interface IShippingData {
  success: boolean;
  data: {
    nextStep: ShippingSteps;
    prevStep?: ShippingSteps;
    selectedFromAddress?: IShippingLabelAddress;
    selectedDeliveryAddress?: IShippingLabelAddress;
    addressDetails?: {
      deliverAddressId?: string | null;
      fromAddressId?: string | null;
      returnAddressId?: string | null;
      detailsAddressId?: string;
    };
    packageType?: string;
    carrierType?: string;
    isExistaddress?: boolean;
    deletedDeliverId?: string | null;
    deletedFromId?: string | null;
    fromAddressExist?: boolean;
  };
}

export interface IShippingLabelAddress {
  id?: string;
  address1: string;
  address2: string;
  city: string;
  company: string;
  country: string;
  email: string;
  name: string;
  nickName?: string;
  phone: string;
  state: string;
  zip: string;
  returnAddressId?: string;
}

export interface IAddressDetails {
  deliverAddressId?: string | null;
  fromAddressId?: string | null;
  returnAddressId?: string | null;
  detailsAddressId?: string;
}
export interface IAddressList {
  id: string;
  address1: string;
  address2: string;
  city: string;
  company: string;
  country: string;
  email: string;
  name: string;
  phone: string;
  state: string;
  zip: string;
}

export interface ICreateParcel {
  id?: string;
  toAddressId?: string | null;
  fromAddressId?: string | null;
  returnAddressId?: string | null;
  detailsAddressId?: string | null;
  length: string;
  width: string;
  height: string;
  weight: string;
}

export interface IBuyShipment {
  shipmentId?: string;
  service?: string;
  detailsAddressId?: string;
  indexId?: number;
  carrier?: string;
  comment?: string;
}

export interface IShippView {
  address1: string;
  address2: string;
  city: string;
  comment: string;
  company: string;
  country: string;
  created_at: string;
  email: string;
  id: string;
  name: string;
  phone: string;
  shipping_type: string;
  state: string;
  tracking_number: string;
  zip: string;
  shipping_service: string;
}

export interface IShippingType {
  id: string;
  name: string;
}

export interface IGetQuickLabel {
  deliverAddressId: string;
  fromAddressId: string;
  isReturnAddressSame: number;
  packageCode: string;
  returnAddressId: string;
  length?: string;
  width?: string;
  height?: string;
  weight?: string;
  unit?: string;
}

export interface IToolTipDimension {
  height: string;
  length: string;
  weight: string;
  width: string;
  package_code: string;
}

export interface IQuicklabelDetails {
  services: IParcelDetails[];
  detailsAddressId: string;
}

export interface IParcelDetails {
  service: string;
  carrier: string;
  rate: number;
  originalRate: string;
  ourCharges: number;
  shipmentId: string;
  indexId: number;
  deliveryDays?: number;
  deliveryDate?: string;
}

export interface ICarrierData {
  carrierName: string;
  packageCode: string | undefined;
  service: string;
}

export interface IGetPrintSize {
  id: string;
  carrier_name: string;
  length: string;
  width: string;
  service: string;
  package_code: string;
  name: string;
}

export interface IUserData {
  name: string;
  company: string;
  email: string;
  phone: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  id: string;
  nickName: string;
}

export interface IRowData {
  action: string;
  address1: string;
  comment: string;
  created_at: string;
  id: string;
  name: string;
  shipping_type: string;
  tracking_number: string;
}

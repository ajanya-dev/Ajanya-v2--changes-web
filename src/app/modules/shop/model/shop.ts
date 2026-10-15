export interface IProducts {
  carrier_name: string;
  category_id: number;
  description: string;
  enc_id: string;
  image: string;
  name: string;
  predefined_package_name: string;
  price: string;
  service_level: string;
  shipping_charge: string;
  stock_available: boolean;
}

export interface IOrderDetails {
  data: IOrderData;
  success: boolean;
}

export interface IOrderData {
  gross_price: string;
  items: IOrderedItem[];
  shipping: IShippingAddress;
  status: string;
}

export interface IShippingAddress {
  address_line_1: string;
  address_line_2: string;
  city: string;
  company_name: string;
  country: string;
  first_name: string;
  last_name: string;
  phone: string;
  state: string;
  zip: string;
}

export interface IOrderedItem {
  price: string;
  product_name: string;
  quantity: number;
  shipping_fee: string;
  total: string;
  tracker_url: string;
}

export interface ICartDetails {
  data: ICartData;
  success: boolean;
}

export interface ICartData {
  grand_total: number;
  products: ICartProduct[];
  shipping_charge: number;
  total_item: number;
}

export interface ICartProduct {
  carrier_name: string;
  id: string;
  item_price: number;
  package_name: string;
  product_id: number;
  product_name: string;
  quantity: number;
  shipping_charge: number;
  stock_available: boolean;
  total_price: number;
  total_shipping_fee: number;
}

export interface IUserAddress extends IShippingAddress {
  created_at: string;
  created_by_id: number;
  deleted_at: string | null;
  enc_id: string;
  updated_at: string;
  user_id: number;
}

export interface ITrackingDetails {
  status_code: number;
  message: string;
  shipment: {
    id: number;
    user_id: number;
    check_id: number;
    check_number: string;
    shipment_id: string;
    label_url: string;
    carrier: string;
    tracking_code: string;
    tracking_url: string;
    current_status: string;
    est_delivery_date: string;
  };
  tracking_details: Array<{
    id: number;
    status: string;
    est_delivery_date: string;
    message: string;
    tracking_status: string;
    tracking_datetime: string;
    city: string;
    state: string;
    country: string;
    zip: string;
  }>;
}

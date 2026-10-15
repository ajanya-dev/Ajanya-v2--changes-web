import { IDefaultPayment } from 'src/app/modules/payments/model/payments';

export interface IDefaultPaymentRes {
  id: number;
  created_for_id: number;
  default_payment_method: IDefaultPayment;
  created_at: string;
  updated_at: string;
}

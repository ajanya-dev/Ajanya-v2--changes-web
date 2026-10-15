import { FormControl } from '@angular/forms';

export interface IPayerBankForm {
  amount: FormControl;
  payee: FormControl;
  bank: FormControl;
  senderBankAccount: FormControl;
  payerId: FormControl;
  memo: FormControl;
  payeeBankAc: FormControl;
  requestPaymentType: FormControl;
  paymentMethod: FormControl;
  link: FormControl;
  directLink: FormControl;
  payeeEmail: FormControl;
  recurring: FormControl;
  editable: FormControl;
  startDate: FormControl;
  endSelect: FormControl;
  months: FormControl;
  frequency: FormControl;
  cheque_date: FormControl;
  invoiceNumber: FormControl<string | null>;
}

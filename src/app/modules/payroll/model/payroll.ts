export interface IPaymyRoll {
  success: boolean;
  data: IPaymyRollValue;
}

export interface IPaymyRollValue {
  url: string;
}

export interface IPayrollApps {
  id: string;
  name: string;
  manual: number;
  icon: string | Array<string>;
  companyId?: string;
  bypassed: 1 | 0;
}

export interface IPayrollBody {
  payrollId: string | undefined;
  companyType: string;
  processingAmount: number | string;
}

export interface IPayrollSettings {
  bankAccountId: string;
  creditCardId: string;
  processMethod: number;
  manual: number;
  amount: number;
  syncStatus: number;
  transferMode: number;
}

export interface IRunKybBypass {
  kybBypassedUser: number;
  bypassedFor: number;
  bypassedBusinessName: string;
}
export interface IServiceFee {
  serviceFeePercentage: number;
}

export interface IEditGrossPay {
  grossPayAmount?: number;
  payrollId: string;
  manual: number;
  payrollDate?: string;
}

export interface ITransactionData {
  statements: Statement[];
  metaData: MetaData;
}

export interface Statement {
  formattedCreatedAt: string;
  deviceName: string | null;
  ipAddress: string;
  note: string;
  status: string;
  userName: string;
}

export interface MetaData {
  bankAccountName: string;
  cardName: string;
  bankAccountNumber: string;
  payrollAmount: string;
  processedAmount: string;
  imad: string | null;
  serviceFee: string;
  cardNumber:string;
}

export interface IAdditionalFee {
  transaction_fee: number;
  is_deduct_fee_from_card: boolean;
  new_user: number;
}

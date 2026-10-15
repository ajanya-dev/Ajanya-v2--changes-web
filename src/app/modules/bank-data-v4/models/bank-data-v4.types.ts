export type TBankDataV4Tab =
  | 'overview'
  | 'transactions'
  | 'rules'
  | 'accounts'
  | 'company'
  | 'category';

export type TBankDataV4AccountType = 'bank' | 'wallet';

export type TBankDataV4TxnType = 'credit' | 'debit';

export interface IBankDataV4Account {
  id: string;
  name: string;
  number: string;
  balance: number;
  type: 'checking' | 'savings' | 'wallet';
  color: string;
  accountType: TBankDataV4AccountType;
}

export interface IBankDataV4Transaction {
  id: string;
  vendor: string;
  amount: number;
  bank: string;
  bankId: string;
  category: string;
  date: string;
  type: TBankDataV4TxnType;
  description: string;
  status: string;
  accountType: TBankDataV4AccountType;
}

export interface IBankDataV4ProcessingRule {
  id: string;
  name: string;
  condition: string;
  targetBank: string;
  isActive: boolean;
  timesTriggered: number;
}

export interface IBankDataV4VendorCondition {
  operator: 'Contains' | 'Equals' | 'Starts With' | 'Ends With';
  value: string;
}

export interface IBankDataV4RoutingRule {
  id: string;
  name: string;
  conditions: {
    vendors: IBankDataV4VendorCondition[];
    amountRange: { min: string; max: string };
    categories: string[];
    logic: 'AND' | 'OR';
  };
  action: {
    bankAccount: string;
    bankAccountId: string;
    paymentType: string;
  };
  isActive: boolean;
  timesTriggered: number;
}

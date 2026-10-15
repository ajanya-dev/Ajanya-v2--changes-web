import { IAttachmentItem } from 'src/app/models/common';
import { IComments } from 'src/app/data/data/cloud-quick-pay';
import { TPaymentSource } from '../../payments/model/payments';
import { IQBExpenseListItem } from '../../check/model/check';

export interface IGroupPaymentsState {
  mode: 'CREATE' | 'UPDATE';
  isLoading: boolean;
  groupDetails: {
    groupId?: string;
    groupData?: IGroupPaymentsDetails;
  };
}

export interface IGroupPaymentsCreate {
  groupName?: string;
  groupNameOnly?: boolean;
  initiatedFrom?: 1 | 2;
  payments?: IGroupPaymentsItem[];
}

export interface IGroupPaymentsDetails {
  groupName: string;
  resources: IGroupPaymentsItem[];
}

export interface IGroupPaymentsItem {
  sourceType: TPaymentSource;
  sourceId: string;
  transferType: string;
  /** 'check_print' or 'check_email' on wallet check rows. */
  paymentMethod?: string;
  payeeId: string;
  amount: number;
  date?: string;
  position?: string;
  memo?: string;
  category?: string;
  invoiceNumber?: string;
  expenseDetails?: IQBExpenseListItem[];
  companyId?: string;
  qbBankId?: string;
  customFieldPosition?: string;
  qbdExpense?: {
    id: string;
    name: string;
  },
  selected?: boolean;
  attachments?: IAttachmentItem[] | string[];
  comments?: IComments[];
  billIds?: string[];
  payeeBankAccountId?: string;
  realmId?: string;
  mappingId?: string;
  qboData?: {
    realmId?: string;
    mappingId?: string;
    categoryDetails?: {
      categoryId?: string;
      description?: string;
      customerId?: string;
      classId?: string;
      amount?: string;
      attach_category_to_check?: string;
    };
  };
}

export interface IMultiPaymentsSave {
  payments: IGroupPaymentsItem[];
}

export interface GroupPaymentExcelMapping {
  header: GroupPaymentExcelMappingHeader[];
  rows: GroupPaymentExcelMappingRow[];
  mapping: Record<string, string>;
}

export interface GroupPaymentExcelMappingHeader {
  value: number | '';
  displayName: string;
}

export interface GroupPaymentExcelMappingRow {
  [key: string]:
    | string
    | number
    | { date: string; timezone: string; timezone_type: number };
}

export interface GroupPaymentExcelMappedData {
  sourceType: string;
  transferType: string;
  amount: string;
  date: string;
  category: string;
  invoice_number: string;
  memo: string;
  payeeId: string;
  payeeBankAccountId?: string;
}

/** Payee bank account from an Excel import, tied to the payee it was imported with. */
export interface IImportedPayeeBank {
  payeeId: string;
  payeeBankAccountId: string;
}

/** Returns the imported bank account id only while the row still has the payee it was imported with. */
export function getImportedPayeeBankAccountId(
  importedPayeeBank: IImportedPayeeBank | null | undefined,
  payeeId: string | undefined
): string | undefined {
  return importedPayeeBank && importedPayeeBank.payeeId === payeeId
    ? importedPayeeBank.payeeBankAccountId
    : undefined;
}

export interface IGroupPaymentsItemCheck {
  bank_account_id: string;
  payee_id: string;
  amount: number;
  memo: string;
  category_id: string;
  check_issue_date: string;
  note: string;
  invoice_no: string;
  bill_ids?: string[] | null;
}

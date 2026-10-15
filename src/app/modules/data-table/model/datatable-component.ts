export interface IDataTable {
  filterBody: IDataTableCheck[];
}

export interface IDataTableCheck {
  bankAccountId: string;
  fromDate: string;
  toDate: string;
  statusId: string;
  categoryId: string;
  items: string[];
  method?: string;
}

export interface IExportFilterDataWallet {
  walletId: string;
  fromDate: string;
  toDate: string;
}

export interface IExportFilterDataAch {
  status: string;
  fromDate: string;
  toDate: string;
}

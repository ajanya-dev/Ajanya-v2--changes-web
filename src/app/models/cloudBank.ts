import { HttpErrorResponse } from '@angular/common/http';
import {
  ICloudAccountDetails2,
  ICloudBankAccountDetails,
  ICloudBankAccountDetailsAirwallex
} from '../modules/cloud-bank/model/cloudbank';

export interface ICloudBankStates {
  bankAccountsGrouped: {
    title: string;
    accountDetail: ICloudAccountDetails2[];
  }[];
  bankAccounts: (ICloudAccountDetails2 | ICloudBankAccountDetails)[];
  pageNo: number;
  isFilterOn: boolean;
  searchTerm: string;
  bankAccountsFiltered: (ICloudAccountDetails2 | ICloudBankAccountDetails)[];
  filteredPageNo: number;
  isLoading: boolean;
  isError: boolean | string | HttpErrorResponse | unknown;
  bankAccountsAirwallex: ICloudBankAccountDetailsAirwallex[];
}

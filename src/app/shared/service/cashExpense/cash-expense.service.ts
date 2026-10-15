import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  ICashAccount,
  ICashExpenseActivity,
  ICashExpenseDetails,
  ICashexpenseAttachments,
  ICashexpenseComments,
  ICashexpensePayeeSummary,
  INewCashExpense
} from 'src/app/modules/Cash-Expense/model/CashExpense';
import { IApiRes } from 'src/app/models/api';
import { IBankAccountEditDetails, IBankDropdown } from 'src/app/models/bank';
import { IPaymentsProofPayload } from 'src/app/modules/payments/model/payments';
import { ICashExpenseExport } from 'src/app/modules/v3-data-table/models/v3-data-table';

interface ICreateCashExpense {
  id: string;
}

interface INewCashAccount {
  cashAccountId?: string;
  bankAccountName?: string;
}

export interface ICashExpenseBalance {
  balances: { [key: string]: { previous_balance: string; current_balance: string } };
  current_balances: {
    [key: string]: string;
  }
}

@Injectable({
  providedIn: 'root'
})
export class CashExpenseService {
  ROOT_URL = environment.rootUrl;
  newCashAccountCreatedId$ = new BehaviorSubject<INewCashAccount | null>({
    cashAccountId: '',
    bankAccountName: ''
  });

  constructor(private http: HttpClient) {}

  createCashExpense(
    cashExpenseBody: INewCashExpense
  ): Observable<IApiRes<ICreateCashExpense>> {
    return this.http.post<IApiRes<ICreateCashExpense>>(
      `${this.ROOT_URL}/cash-expenses`,
      cashExpenseBody
    );
  }

  updateCashExpense(
    id: string,
    cashExpenseBody: INewCashExpense
  ): Observable<IApiRes<string>> {
    return this.http.put<IApiRes<string>>(
      `${this.ROOT_URL}/cash-expenses/${id}`,
      cashExpenseBody
    );
  }

  getCashExpensesById(
    cashId: string
  ): Observable<IApiRes<ICashExpenseDetails[] | ICashExpenseDetails>> {
    return this.http.get<IApiRes<ICashExpenseDetails[] | ICashExpenseDetails>>(
      `${this.ROOT_URL}/cash-expenses/${cashId}`
    );
  }

  deleteCashexpense(cashExpId: string): Observable<IApiRes<string>> {
    return this.http.delete<IApiRes<string>>(
      `${this.ROOT_URL}/cash-expenses/${cashExpId}`
    );
  }

  bulkDeleteCashexpense(cashExpenseIds: {
    ids: string[];
  }): Observable<IApiRes<string>> {
    // code will be converted to post instead of delete to synchronize the standard coding followed.
    return this.http.post<IApiRes<string>>(
      `${this.ROOT_URL}/cash-expenses/bulk-delete`,
      cashExpenseIds
    );
  }

  printCashExpense(
    cashExpId: string
  ): Observable<IApiRes<{ printData: string }>> {
    return this.http.post<IApiRes<{ printData: string }>>(
      `${this.ROOT_URL}/cash-expenses/${cashExpId}/print`,
      {}
    );
  }

  bulkPrintCashExpense(
    cashExpIds: string[]
  ): Observable<IApiRes<{ printData: string }>> {
    return this.http.post<IApiRes<{ printData: string }>>(
      `${this.ROOT_URL}/cash-expenses/bulk-print`,
      { ids: cashExpIds }
    );
  }

  getPayeeSummary(
    payeeId: string
  ): Observable<IApiRes<ICashexpensePayeeSummary>> {
    return this.http.get<IApiRes<ICashexpensePayeeSummary>>(
      `${this.ROOT_URL}/payees/${payeeId}/cash-expense-transactions`
    );
  }

  getCashExpenseRemittanceItems(
    page: number,
    term: string | number
  ): Observable<IApiRes<string[]>> {
    return this.http.get<IApiRes<string[]>>(
      `${this.ROOT_URL}/cash-expenses/remittance-items?page=${page}&&search=${term}`
    );
  }

  getCashExpenseSerialNo(
    cashExpId: string
  ): Observable<IApiRes<{ serialNo: number }[]>> {
    return this.http.get<IApiRes<{ serialNo: number }[]>>(
      `${this.ROOT_URL}/bank-accounts/${cashExpId}/cash-expnse-serial-number`
    );
  }

  getCashExpenseActivity(
    cashExpId: string
  ): Observable<IApiRes<ICashExpenseActivity[]>> {
    return this.http.get<IApiRes<ICashExpenseActivity[]>>(
      `${this.ROOT_URL}/cash-expenses/${cashExpId}/activities`
    );
  }

  getCashExpenseComments(
    cashExpId: string
  ): Observable<IApiRes<ICashexpenseComments[]>> {
    return this.http.get<IApiRes<ICashexpenseComments[]>>(
      `${this.ROOT_URL}/cash-expenses/${cashExpId}/comments`
    );
  }

  deleteCashExpenseComment(
    cashExpId: string,
    commentId: string
  ): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(
      `${this.ROOT_URL}/cash-expenses/${cashExpId}/comments/${commentId}`
    );
  }

  getCashExpenseAttachment(
    cashExpId: string
  ): Observable<IApiRes<ICashexpenseAttachments[]>> {
    return this.http.get<IApiRes<ICashexpenseAttachments[]>>(
      `${this.ROOT_URL}/cash-expenses/${cashExpId}/attachments`
    );
  }

  deleteCashexpenseAttachment(
    cashExpId: string,
    attachmentId: string
  ): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(
      `${this.ROOT_URL}/cash-expenses/${cashExpId}/attachments/${attachmentId}`
    );
  }

  openCashExpenseAttachment(
    cashExpenseId: string,
    attachmentId: string
  ): Observable<IApiRes<string>> {
    return this.http.get<IApiRes<string>>(
      `${this.ROOT_URL}/cash-expenses/${cashExpenseId}/attachments/${attachmentId}`
    );
  }

  getPayeeTransactions(
    payeeId: string
  ): Observable<IApiRes<ICashexpensePayeeSummary>> {
    return this.http.get<IApiRes<ICashexpensePayeeSummary>>(
      `${this.ROOT_URL}/payees/${payeeId}/cash-expense-transactions`
    );
  }

  sendEmail(
    cashExpenseId: string,
    emails: { email: string }
  ): Observable<{ success: boolean; data?: string; errorMsg?: string }> {
    return this.http.post<{
      success: boolean;
      data?: string;
      errorMsg?: string;
    }>(`${this.ROOT_URL}/cash-expenses/${cashExpenseId}/email`, emails);
  }

  sendSignOnReceiptSMS(
    cashExpenseId: string,
    sms: { sms: string }
  ): Observable<IApiRes<string>> {
    return this.http.post<IApiRes<string>>(
      `${this.ROOT_URL}/cash-expenses/${cashExpenseId}/get-sign-on-receipt-sms2`,
      sms
    );
  }

  sendSignOnReceiptEmail(
    cashExpenseId: string,
    emails: { email: string }
  ): Observable<{ success: boolean; data?: string; errorMsg?: string }> {
    return this.http.post<{
      success: boolean;
      data?: string;
      errorMsg?: string;
    }>(
      `${this.ROOT_URL}/cash-expenses/${cashExpenseId}/get-sign-on-receipt-email2`,
      emails
    );
  }

  AddCashAccount(
    cashAccountContext: ICashAccount
  ): Observable<IApiRes<{ id: string }>> {
    return this.http.post<IApiRes<{ id: string }>>(
      `${this.ROOT_URL}/cash-expenses/save-cash-account`,
      cashAccountContext
    );
  }

  getBankAndCashAccounts(
    page: number,
    term = '',
    verify?: number,
    type?: number
  ): Observable<IApiRes<IBankDropdown[]>> {
    let append = '';
    if (page !== 0) {
      append += `page=${page}`;
    }
    if (term) {
      append += `&&term=${term}`;
    }
    if (verify) {
      append += `&& verified=${verify}`;
    }
    if (type) {
      append += `&&forCashExpense=${type}`;
    }

    append += `&&cash_account=1`;

    return this.http.get<IApiRes<IBankDropdown[]>>(
      `${this.ROOT_URL}/bank-accounts?${append}`
    );
  }

  viewBankAndCashAccountById(
    bankId: string
  ): Observable<IApiRes<IBankAccountEditDetails>> {
    return this.http.get<IApiRes<IBankAccountEditDetails>>(
      `${this.ROOT_URL}/bank-accounts/${bankId}`
    );
  }

  getNewCashAccountCreatedData(): Observable<INewCashAccount | null> {
    return this.newCashAccountCreatedId$;
  }

  setNewCashAccountCreatedData(data: INewCashAccount | null): void {
    this.newCashAccountCreatedId$.next(data);
  }

  getSignImageUrl(url: string): Observable<string> {
    return this.http.get(
      `${this.ROOT_URL}/cash-expenses/loadImage?the_img=${url}`,
      { responseType: 'text' }
    );
  }

  sendPaymentProof(uuId: string, postData: IPaymentsProofPayload) {
    return this.http.post<IApiRes<string>>(
      `${this.ROOT_URL}/cash-expenses/${uuId}/send`,
      postData
    );
  }

  exportCashExpense(filterBody: ICashExpenseExport, payeeId?: string) {
    return this.http.post<IApiRes<{url: string}>>(`${this.ROOT_URL}/cash-expenses/export`, {...filterBody, payeeId});
  }

  getCashExpenseSummary() {
    return this.http.get<IApiRes<{income: string; expense: string;net: string}>>(`${this.ROOT_URL}/cash-expenses/summary`);
  }

  getCashExpenseBalance(cashExpId: string[],type:number =1) {
    return this.http.post<IApiRes<ICashExpenseBalance>>(`${this.ROOT_URL}/cash-expenses/calculate-balances`,{ids:cashExpId,type});
  }
}

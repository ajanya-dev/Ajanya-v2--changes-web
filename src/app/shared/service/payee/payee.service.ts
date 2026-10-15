import { IApiRes, IApiResMesssage } from 'src/app/models/api';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  Subject,
  catchError,
  finalize,
  of
} from 'rxjs';
import { environment } from 'src/environments/environment';
import {
  ICreateDetails,
  IInternationalWirePayeeAccounts,
  INewPayee,
  IPaidAmount,
  IPayeeAuditTrialItem,
  IPayeeBankDetails,
  IPayeeChange,
  IPayeeDetails,
  IPayeeDropdown,
  IPayeeView,
  IShowPayeeDetails,
  IViewPayee
} from 'src/app/modules/payee/payee-v2/model/payee';
import { ISwiftResponseData } from 'src/app/models/bank';
import { IIndustryTypes, IInternationalBanksPayee, IInternationalPayeeBankResponse } from 'src/app/modules/cloud-bank/cloud-bank-v2/model/internationalPayments';
import { IPayeeSingleBankData } from 'src/app/modules/check-draft/model/Checkdraft';
import { UserPermissionAlertService } from '../permission/user-permission-alert.service';

@Injectable({
  providedIn: 'root'
})
export class PayeeService {
  ROOT_URL = environment.rootUrl;
  isFromGrid = false;
  private selectedPayee$ = new BehaviorSubject<IPayeeChange>({
    payeeName: '',
    payeeNickName: ''
  });

  private payeeBankData = new BehaviorSubject<IPayeeSingleBankData | undefined>(
    undefined
  );

  private payeeInternationalBankData = new BehaviorSubject<
    IInternationalWirePayeeAccounts | undefined
  >(undefined);

  private payeeEdited = new Subject<IPayeeDropdown>();
  private payeeAdded = new Subject<IPayeeDropdown>();
  private userPermissionService = inject(UserPermissionAlertService);
  paymentSuccess = new BehaviorSubject<boolean>(false);
  fromCloudSendBtn = new BehaviorSubject<boolean>(false);
  isPayeePermissionChecking = signal<boolean>(false);
  updatePayeeInternationalBankList = new BehaviorSubject<
    IInternationalBanksPayee[] | undefined
  >(undefined);

  /**
   * OpenPayeeEditModal is a BehaviorSubject that is used to control the visibility of the edit payee modal.
   * It can be set to true to show the modal, or to an object with a 'page' property to specify which page of the modal to display.
   */
  openPayeeEditModal = new BehaviorSubject<
    | boolean
    | {
        page?:
          | 'addBankDetails'
          | 'addAddress'
          | 'addInternationalBankDetails'
          | 'addCompany'
          | 'payeeEmail';
      }
  >(false);

  payeeTotalCountSignal = signal<number>(0);

  /**
   * @description subject to updated the edited back accoutn id
   */
  public bankToEdit = '';

  constructor(private http: HttpClient) {}

  set checkPayeeNameUpdate(payee: IPayeeChange) {
    this.selectedPayee$.next(payee);
  }

  get checkPayeeNameUpdate$(): Observable<{
    payeeName: string;
    payeeNickName: string;
  }> {
    return this.selectedPayee$.asObservable();
  }

  /**
   * @description Method to set the payee bank data to the `this.payeeBankData` BehaviorSubject.
   * @param data - Payee bank data
   */
  setbankData(data: IPayeeSingleBankData | undefined) {
    this.payeeBankData.next(data);
  }

  /**
   * @description Method to get the payee bank data from the  BehaviorSubject `this.payeeBankData` as an Observable.
   * @returns Payee bank data as Observable.
   */
  get getbankData() {
    return this.payeeBankData.asObservable();
  }

  /**
   * @description Method to set the payee edited data.
   */
  setPayeeEditedData(payee: IPayeeDropdown) {
    this.payeeEdited.next(payee);
  }

  /**
   * @description Method to get the payee edited data.
   */
  getPayeeEditedData(): Observable<IPayeeDropdown> {
    return this.payeeEdited.asObservable();
  }

  /**
   * @description Method to set the international bank data to the BehaviorSubject `this.payeeInternationalBankData`.
   * @param data - International bank data.
   */
  setInternationalbankData(data: IInternationalWirePayeeAccounts | undefined) {
    this.payeeInternationalBankData.next(data);
  }

  /**
   * @description Method to set payee added status as boolean
   */
  setNewPayee(data: IPayeeDropdown) {
    this.payeeAdded.next(data);
  }

  /**
   * @description Method to get payee added status as boolean
   */
  getNewPayee() {
    return this.payeeAdded.asObservable();
  }

  /**
   * @description Method to get the international bank data from the  BehaviorSubject `this.payeeInternationalBankData` as an Observable.
   * @returns International bank data as Observable.
   */
  get getInternationalbankData() {
    return this.payeeInternationalBankData.asObservable();
  }

  getPayees(
    page: number,
    term = '',
    headerOption?: HttpHeaders,
    skipEmpty?: boolean
  ): Observable<IApiRes<IPayeeDropdown[]>> {
    return this.http.get<IApiRes<IPayeeDropdown[]>>(
      `${this.ROOT_URL}/payees?page=${page}&term=${term}&skipEmpty=${skipEmpty}`,
      { headers: headerOption }
    );
  }

  getFilteredPayees(page: number, type: number, term = '') {
    return this.http.get<{ status: boolean; data: IPayeeDropdown[] }>(
      `${this.ROOT_URL}/payees?type=${type}&page=${page}&term=${term}`
    );
  }

  getPayeeSeggest(term = ''): Observable<any> {
    return this.http.get<any>(
      `${this.ROOT_URL}/payees/payeeSuggest?term=${term}`
    );
  }

  /**
   * Retrieves multiple payees by their IDs.
   * @param {string[]} ids - An array of payee IDs to retrieve.
   * @returns {Observable<IApiRes<IPayeeDropdown[]>>} An observable that emits the response containing the payees.
   */
  getPayeesByIds(ids: string[]): Observable<IApiRes<IPayeeDropdown[]>> {
    return this.http.post<IApiRes<IPayeeDropdown[]>>(
      `${this.ROOT_URL}/payees/get-multiple`,
      { ids }
    );
  }

  // ShowPayeeLastCheck(payeeId:string):Observable<any>{
  //   return this.http.get<any>(`${this.ROOT_URL}/payees/${payeeId}/last-check`);
  // }

  /**
   * @description -API function for getting payee details
   * @param payeeId -Payload for the API
   * @returns
   */
  showPayee(payeeId: string): Observable<IApiRes<IShowPayeeDetails>> {
    return this.http.get<IApiRes<IShowPayeeDetails>>(
      `${this.ROOT_URL}/payees/${payeeId}`
    );
  }

  createPayee(data: INewPayee): Observable<IApiRes<IViewPayee>> {
    return this.http
      .post<IApiRes<IViewPayee>>(`${this.ROOT_URL}/payees`, data)
      .pipe(
        catchError((error) => {
          this.userPermissionService.handleErrorsAndPermissions(error, () => {
            this.userPermissionService.payeeCreate(error);
          });
          throw error;
        })
      );
  }

  getPayeeEditData(payeeId: string): Observable<IApiRes<IPayeeDetails>> {
    return this.http.get<IApiRes<IPayeeDetails>>(
      `${this.ROOT_URL}/payees/${payeeId}/edit`
    );
  }

  /**
   * @description -API Function for update single payees
   * @returns
   */
  updatePayee(
    payeeId: string,
    data: INewPayee
  ): Observable<IApiRes<IViewPayee>> {
    return this.http.put<IApiRes<IViewPayee>>(
      `${this.ROOT_URL}/payees/${payeeId}`,
      data
    );
  }

  /**
   * @description -API Function for delete single payees
   * @returns
   */
  deleteSinglePayee(
    payeeId: string,
    warn: 1 | 0 = 0,
    confirmed: 1 | 0 = 0
  ): Observable<IApiResMesssage> {
    return this.http.delete<IApiResMesssage>(
      `${this.ROOT_URL}/payees/${payeeId}?warn=${warn}&confirmed=${confirmed}`
    );
  }

  /**
   * @description -API Function for delete multiple payees
   * @param data
   * @returns
   */
  deleteMultiPayee(data: { ids?: string[] },confirmed?:number): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/payees/multi-delete`,
      {...data,confirmed}
    );
  }

  mergePayeeRequest(data: { payeeIds: string[] }): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/payees/merge/merge-request`,
      data
    );
  }

  mergePayee(data: any): Observable<any> {
    return this.http.post<any>(
      `${this.ROOT_URL}/payees/merge/merge-payee`,
      data
    );
  }
  //----------------------------------Payee Bank--------------------------------
  addPayeeBank(data: any): Observable<IApiRes<ICreateDetails>> {
    return this.http.post<IApiRes<ICreateDetails>>(
      `${this.ROOT_URL}/payees/bank-accounts`,
      data
    );
  }

  getPayeeBankData(payeeId: string): Observable<IApiRes<IPayeeBankDetails[]>> {
    return this.http.get<IApiRes<IPayeeBankDetails[]>>(
      `${this.ROOT_URL}/payees/${payeeId}/get-bank-accounts`
    );
  }

  getMultiPayeeBankAccounts(payee_ids: string[]): Observable<any> {
    return this.http.post(`${this.ROOT_URL}/payees/bank-accounts/multi`, {
      payee_ids
    });
  }
  /**
   * @description Audit trial data of selected payee
   * @param id  payee id
   * @returns
   */
  getPayeeAuditTrail(id: string): Observable<IApiRes<IPayeeAuditTrialItem[]>> {
    return this.http.get<IApiRes<IPayeeAuditTrialItem[]>>(
      `${this.ROOT_URL}/payees/${id}/activities`
    );
  }

  getPayeeSingleBankData(payeeId: string, bankId: string) {
    return this.http.get<IApiRes<IPayeeSingleBankData>>(
      `${this.ROOT_URL}/payees/bank-accounts/${payeeId}/get-bank-account/${bankId}`
    );
  }

  deletePayeeBank(payeeId: string, bankId: string): Observable<any> {
    return this.http.delete(
      `${this.ROOT_URL}/payees/bank-accounts/${payeeId}/delete-bank-account/${bankId}`
    );
  }

  deleteMultiplePayeeBank(data: any): Observable<any> {
    return this.http.post(
      `${this.ROOT_URL}/payees/bank-accounts/multi-delete`,
      data
    );
  }

  updatePayeeBank(bankId: string, data: any): Observable<any> {
    return this.http.put(
      `${this.ROOT_URL}/payees/bank-accounts/${bankId}`,
      data
    );
  }

  setDefaultDDBankAcc(data: any): Observable<any> {
    return this.http.post(
      `${this.ROOT_URL}/payees/bank-accounts/set-default-for-dd`,
      data
    );
  }

  requestPayeeDetails(data: any): Observable<any> {
    return this.http.post(
      `${this.ROOT_URL}/payees/request-payee-details`,
      data
    );
  }

  requestPayeeAdd(data: any): Observable<any> {
    return this.http.post(`${this.ROOT_URL}/payees/request-bank-info`, data);
  }

  //Vendor Credit
  getVendorCredit(payeeId: string): Observable<any> {
    return this.http.get(`${this.ROOT_URL}/payees/${payeeId}/vendor-credit`);
  }

  /**
   * The last transactions on a record. `{id}` is read as a cheque's unless
   * `is_payee` says otherwise — the callers that hand it a cheque predate the
   * payee being addressable at all, so omitting the flag has to keep meaning
   * what it always meant.
   */
  getPayeeTransactions(
    id: string,
    noOfTransaction = 10,
    isPayee = false
  ): Observable<any> {
    return this.http.get<any>(
      `${this.ROOT_URL}/cheques/payee-transaction/${id}/${noOfTransaction}${
        isPayee ? '?is_payee=1' : ''
      }`
    );
  }

  addPayeetoEmail(id: string, data: any): Observable<any> {
    return this.http.put<any>(
      `${this.ROOT_URL}/payees/${id}/update-email`,
      data
    );
  }

  addPayeeToBankAccount(data: any): Observable<any> {
    return this.http.post<any>(`${this.ROOT_URL}/payees/bank-accounts`, data);
  }

  getTransactionHistory(
    payeeId: string,
    type: string,
    queryParam: string
  ): Observable<IApiRes<IPaidAmount>> {
    return this.http.get<IApiRes<IPaidAmount>>(
      `${this.ROOT_URL}/payee-transaction-histories/${payeeId}/${type}?${queryParam}`
    );
  }

  multiImportStep2(body: FormData): Observable<any> {
    return this.http.post(`${this.ROOT_URL}/imports/payee/step2`, body);
  }

  multiImportStep3(body: any): Observable<any> {
    return this.http.post(`${this.ROOT_URL}/imports/payee/step3`, body);
  }

  checkWhetherIsBankingACHUser(): Observable<any> {
    return this.http.get<any>(`${this.ROOT_URL}/imports/payee/step1`);
  }

  payeeSummery(id: string): Observable<any> {
    return this.http.get<any>(`${this.ROOT_URL}/payees/${id}/summary`);
  }

  updatePaymentMethod(body: any): Observable<any> {
    return this.http.post(
      `${this.ROOT_URL}/payees/default-payment-method`,
      body
    );
  }

  viewPayee(id: string, type?: string): Observable<IApiRes<IPayeeView>> {
    const url = type
      ? `${this.ROOT_URL}/payees/${id}/payee-information?type=${type}`
      : `${this.ROOT_URL}/payees/${id}/payee-information`;
    return this.http.get<IApiRes<IPayeeView>>(url);
  }

  //----------------------------------International Payee Bank cloudbank--------------------------------
  addPayeeInternationalBankAccount(
    sendingData: IInternationalWirePayeeAccounts
  ): Observable<IApiRes<{ id: string }>> {
    return this.http.post<IApiRes<{ id: string }>>(
      `${this.ROOT_URL}/international-payment-payee/new`,
      sendingData
    );
  }

  updatePayeeInternationalBankAccount(
    bankId: string,
    data: IInternationalWirePayeeAccounts
  ): Observable<any> {
    return this.http.put(
      `${this.ROOT_URL}/international-payment-payee/new/${bankId}`,
      data
    );
  }

  getInternationalPayeeBanksByType(
    payeeId: string,
    recipientType: 'business' | 'personal'
  ): Observable<IApiRes<IInternationalPayeeBankResponse[]>> {
    return this.http.get<IApiRes<IInternationalPayeeBankResponse[]>>(`${this.ROOT_URL}/international-payment-payee/new/${payeeId}/${recipientType}`);
  }

  /**
   * @description Method to get the payee identifier code details.
   * @param swift_code - Swift code.
   * @param swift - Type.
   * @returns An Observable with payee identifier details.
   */
  getPayeeIdentifierCodeDetails(
    swift_code: string,
    swift: string
  ): Observable<IApiRes<ISwiftResponseData>> {
    return this.http.get<IApiRes<ISwiftResponseData>>(
      `${this.ROOT_URL}/routing-number/${swift_code}/${swift}`
    );
  }
  //----------------------------------International Payee Bank cloudbank end--------------------------------
  DeletePayeeIPBank(bankId: string): Observable<any> {
    return this.http.delete(
      `${this.ROOT_URL}/international-payment-payee/delete-international-bank/${bankId}`,
      {}
    );
  }

  getInternationalBank(payeeId: string, Id: string): Observable<any> {
    return this.http.get(
      `${this.ROOT_URL}/international-payment-payee/${payeeId}/get-international-bank/${Id}`
    );
  }

  /**
   * @description Method to get the international banks of payee.
   * @param payeeId - Id of payee
   * @returns Observable with list of banks.
   */
  internationalBanksPayee(
    payeeId: string
  ): Observable<IApiRes<IInternationalBanksPayee[]>> {
    return this.http.post<IApiRes<IInternationalBanksPayee[]>>(
      `${this.ROOT_URL}/international-payment-payee/details`,
      { payee_id: payeeId }
    );
  }

  getPayeeTypePermission(): Observable<IApiRes<{ [key: string]: number }>> {
    return this.http.get<IApiRes<{ [key: string]: number }>>(
      `${this.ROOT_URL}/users/payee-type-permission`
    );
  }

  getTemplates(): Observable<IApiRes<string[]>> {
    return this.http.get<IApiRes<string[]>>(
      `${this.ROOT_URL}/payees/compass/templates`
    );
  }

  sendInvite(body: {
    payeeIds: string[];
    template: string;
  }): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/payees/compass/send-ach-invite`,
      body
    );
  }

  syncWithNetSuite(bankId: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(
      `${this.ROOT_URL}/integrations/netsuite/add-payee-bank`,
      { id: bankId }
    );
  }

  checkPermissionToCreatePayee() {
    if (this.isPayeePermissionChecking()) {
      return of({ success: false });
    }
    this.isPayeePermissionChecking.set(true);
    return this.http
      .post<{
        success: boolean;
      }>(`${this.ROOT_URL}/payees`, { permissionCheckToCreatePayee: true })
      .pipe(
        finalize(() => {
          this.isPayeePermissionChecking.set(false);
        })
      );
  }

  checkPermissionToEditPayee(payeeId: string) {
    if (this.isPayeePermissionChecking()) {
      return of({ success: false });
    }
    this.isPayeePermissionChecking.set(true);
    return this.http
      .put<{
        success: boolean;
      }>(`${this.ROOT_URL}/payees/${payeeId}`, {
        permissionCheckToUpdatePayee: true
      })
      .pipe(
        finalize(() => {
          this.isPayeePermissionChecking.set(false);
        })
      );
  }

  getPayeeSendLink(paylod: { payee_type: string,add_bank:number }) {
    return this.http.post<IApiRes<string>>(
      `${this.ROOT_URL}/payees/request-payee-details-link`,
      paylod
    );
  }

  getIndustryTypes(): Observable<IApiRes<IIndustryTypes[]>> {
    return this.http.get<IApiRes<IIndustryTypes[]>>(
      `${this.ROOT_URL}/industry-types`
    );
  }

  updateIndustryType(payeeId: string, body: { merchant_category: number }) {
    return this.http.patch<IApiResMesssage>(
      `${this.ROOT_URL}/payees/${payeeId}/update-industry-type`,
      body
    );
  }
}

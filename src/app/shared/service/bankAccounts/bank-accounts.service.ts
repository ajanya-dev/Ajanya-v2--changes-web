import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import {
  IBank,
  IBankAccountEditDetails,
  IBankEditForm,
  ICloneFormBody,
  IMicroDepositData,
  IBankDropdown,
  IGetRoutingNumber,
  IUploadFromPhoneResponse,
  IDocumentInfo,
  IAILogoGeneratePayload,
  IBankAccountsState,
  IConfirmVirtualAccount,
  IImportedBanksUpdates
} from 'src/app/models/bank';
import { IApiRes, IApiResMesssage, IApiResWithMsg } from 'src/app/models/api';
import { IGetExistLogo } from 'src/app/models/common';
import { IBankSource } from 'src/app/modules/v3-bulk-payment/model/v3-bulk-payment';
import { ISelectYodleeAccount, IUnlinkBanks } from 'src/app/models/yodlee';
import { environment } from 'src/environments/environment';
import { IBankBalancePlaidRes } from 'src/app/modules/bank/bank-v3/model/bank-v35';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { MoEngageService } from 'src/app/core/services/moengage.service';
import { AlertService } from '../alert/alert.service';
import { IYodleeBanks } from '../../yodlee/components/connect-your-bank/yodlee-bank-model';

export interface IBankAccountsStats {
  connectedAccountCount: number;
  walletBalance: string;
  activeCardCount: number;
}

interface IConfirmMicroDep {
  amount1: number;
  amount2: number;
  bankAccountId: string;
}

@Injectable({
  providedIn: 'root'
})
export class BankAccountsService {
  private moEngageService = inject(MoEngageService);
  companyName: string;
  isPermissionPopupEnabled = false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bancAcEvents = new Subject<any>();
  requestNewBankAccount$ = new Subject<void>();

  ROOT_URL = environment.rootUrl;
  headers = new HttpHeaders().set('disablePermission', 'true');

  constructor(
    private http: HttpClient,
    private alertService: AlertService
  ) {}

  /**
   * method for bank permission alert
   */
  openPermissionPopup(content: string, doneMsg?: string) {
    const data = {
      title: 'Error',
      content,
      doneMsg: doneMsg || 'OK'
    };
    const permissionPopup = this.alertService.warningAlert(data);
    permissionPopup.afterClosed().subscribe(() => {
      this.isPermissionPopupEnabled = false;
    });
  }

  /** ******************************************All api services*********************************************************** */

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  AddBank(bankaccountContext: any): Observable<any> {
    const initialtionTime = this.moEngageService.bankInitiatedTime();
    let headers = new HttpHeaders();
    if (initialtionTime) {
      headers = headers.set('setup-started-at', initialtionTime);
    }
    return this.http.post<IBank>(
      `${this.ROOT_URL}/bank-accounts`,
      bankaccountContext,
      { headers }
    );
  }

  getBankAccountsStats(): Observable<IApiRes<IBankAccountsStats>> {
    return this.http.get<IApiRes<IBankAccountsStats>>(
      `${this.ROOT_URL}/bank-accounts/stats`
    );
  }

  getroutingNumber(rout_no: string): Observable<IApiRes<IGetRoutingNumber>> {
    if (!StaticWhiteLabelConditions.bankAccountDetailsUsingRoutingNo)
      return new Observable();
    return this.http.get<IApiRes<IGetRoutingNumber>>(
      `${this.ROOT_URL}/routing-number/${rout_no}`
    );
  }

  /**
   * @description Get Bank account details based on the params.
   *
   * @param page
   * @param term
   * @param verified
   * @param ismapping
   * @param routingNumber
   * @param perPage
   * @returns `IBankDropdown[]`:- Bank account details.
   */
  getBankAccounts(
    page: number,
    term = '',
    verified?: number,
    ismapping?: string,
    routingNumber?: number,
    headerOptions?: HttpHeaders,
    perPage?: number,
    context?: IBankAccountsState['context'],
    showDemoAccounts?: boolean
  ): Observable<IApiRes<IBankDropdown[]>> {
    let params = new HttpParams();
    if (page) {
      params = params.append('page', page);
    }
    if (perPage) {
      params = params.append('perPage', perPage);
    }
    if (term) {
      params = params.append('term', term);
    }
    if (verified) {
      params = params.append('verified', verified);
    }
    if (ismapping) {
      params = params.append('ismapping', ismapping);
    }
    if (routingNumber) {
      params = params.append('routingNumber', routingNumber);
    }
    if (context?.fromDepositSlip === true) {
      params = params.append('forDepositslip', '1');
    }
    if (context?.forInvoice === true) {
      params = params.append('forInvoice', '1');
    }
    if (context?.forCreditMemo === true) {
      params = params.append('forCreditMemo', '1');
    }
    if (context?.forPaymentLink === true) {
      params = params.append('forPaymentLink', '1');
    }
    if (context?.forBill === true) {
      params = params.append('forBill', '1');
    }
    if (context?.forCheckDraft === true) {
      params = params.append('forCheckDraft', '1');
    }
    if (context?.forCashExpense === true) {
      params = params.append('forCashExpense', '1');
      params = params.append('cash_account', '1');
    }
    if (showDemoAccounts === false) {
      params = params.append('showDemoAccounts', false);
    }
    if (context?.forPayment === true) {
      params = params.append('forPayment', '1');
    }

    return this.http.get<IApiRes<IBankDropdown[]>>(
      `${this.ROOT_URL}/bank-accounts`,
      { params, headers: headerOptions }
    );
  }

  /**
   * @description Get Bank account details based on the routing number and perPage wise.
   * @param perPage
   * @param routingNumber
   * @returns `IBankDropdown[]`:- Bank account details.
   */
  getBankAccountsPerPage(pageNumber: number, routingNumber: string) {
    let params = new HttpParams();
    if (routingNumber) {
      params = params.append('routingNumber', routingNumber);
    }
    if (pageNumber) {
      params = params.append('perPage', pageNumber);
    }
    return this.http.get<IApiRes<IBankDropdown[]>>(
      `${this.ROOT_URL}/bank-accounts`,
      { params }
    );
  }

  /**
   * Retrieves multiple bank accounts by their IDs using an HTTP POST request.
   * @param ids - An array of bank account IDs to retrieve.
   * @returns An observable of the API response containing bank account data.
   */
  getBankAccountByIds(
    ids: string[],
    context?: IBankAccountsState['context']
  ): Observable<IApiRes<IBankDropdown[]>> {
    return this.http.post<IApiRes<IBankDropdown[]>>(
      `${this.ROOT_URL}/bank-accounts/get-multiple`,
      { ids, forPayment: context?.forPayment },
      { headers: this.headers }
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getCheckSerialNo(id: any): Observable<any> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.http.get<any>(
      `${this.ROOT_URL}/bank-accounts/${id}/serialNumber`
    );
  }

  /**
   * @description API function for Retrieve bank details for the selected bank account.
   * @param bankId -Payload for the API
   */
  viewBankById(bankId: string): Observable<IApiRes<IBankAccountEditDetails>> {
    return this.http.get<IApiRes<IBankAccountEditDetails>>(
      `${this.ROOT_URL}/bank-accounts/${bankId}`
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  viewBank(id: any): Observable<IApiRes<IBankAccountEditDetails>> {
    return this.http.get<IApiRes<IBankAccountEditDetails>>(
      `${this.ROOT_URL}/bank-accounts/${id.id}`
    );
  }

  updateBankAccount(
    id: string,
    data: IBankEditForm
  ): Observable<IApiResMesssage> {
    return this.http.put<IApiResMesssage>(
      `${this.ROOT_URL}/bank-accounts/${id}`,
      data
    );
  }

  deleteBankAccount(id: string, confirmed = 0): Observable<IApiResMesssage> {
    return this.http.delete<IApiResMesssage>(
      `${this.ROOT_URL}/bank-accounts/${id}`,
      { params: new HttpParams().set('confirmed', confirmed) }
    );
  }

  multiDeleteBankAccount(
    data: { ids: string[] },
    confirmed = 0
  ): Observable<IApiResMesssage> {
    return this.http.delete<IApiResMesssage>(`${this.ROOT_URL}/bank-accounts`, {
      body: { ...data, confirmed }
      // params: new HttpParams().set('confirmed', confirmed)
    });
  }

  deleteBankAccountInfo(data: { ids: string[] }): Observable<IApiResMesssage> {
    return this.http.delete<IApiResMesssage>(
      `${this.ROOT_URL}/bank-accounts/bank-account-delete`,
      { body: data }
    );
  }

  cloneBankAccount(
    id: string,
    data: ICloneFormBody
  ): Observable<IApiRes<string>> {
    return this.http.post<IApiRes<string>>(
      `${this.ROOT_URL}/bank-clone-design/${id}`,
      data
    );
  }

  getBankAccountList(page: number, term = '', headerOptions?: HttpHeaders) {
    return this.http.get<IApiRes<IBankDropdown[]>>(
      `${this.ROOT_URL}/bank-accounts?page=${page}&&term=${term}`,
      { headers: headerOptions }
    );
  }

  changeStartinNo(
    id: string,
    data: { newValue: string }
  ): Observable<{ success: boolean }> {
    return this.http.post<{
      success: boolean;
    }>(`${this.ROOT_URL}/bank-accounts/${id}/check-no`, data);
  }

  //* ***********************import******************** */

  private importHeaders = new HttpHeaders({ isDisable422: 'true' });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  uploadXlDocStep2(data: any): Observable<any> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.http.post<any>(
      `${this.ROOT_URL}/imports/bank-accounts/step2`,
      data,
      { headers: this.importHeaders }
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  uploadXlDocStep3(data: any): Observable<any> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.http.put<any>(
      `${this.ROOT_URL}/imports/bank-accounts/step3`,
      data,
      { headers: this.importHeaders }
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  uploadXlDocStep4(): Observable<any> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.http.get<any>(`${this.ROOT_URL}/imports/bank-accounts/step4`, {
      headers: this.importHeaders
    });
  }

  uploadXlDocStep5(data: {
    ids: string[];
    allowDuplicate?: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }): Observable<any> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.http.post<any>(
      `${this.ROOT_URL}/imports/bank-accounts/step5`,
      data,
      { headers: this.importHeaders }
    );
  }

  //* ****************************bank verification**************/

  checkBankStatementStatus(
    bankAccountId: string
  ): Observable<{ success: boolean; status: number }> {
    return this.http.get<{ success: boolean; status: number }>(
      `${this.ROOT_URL}/bank-account-verify/${bankAccountId}/bank-statement-status`
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  verifyBankAccount(id: any): Observable<any> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.http.get<any>(`${this.ROOT_URL}/bank-accounts/${id}/verify`);
  }

  getUnlinkedAccounts(): Observable<IApiRes<IUnlinkBanks>> {
    return this.http.get<IApiRes<IUnlinkBanks>>(
      `${this.ROOT_URL}/bank-account-verify/get-unlinked-accounts`
    );
  }

  instantVerification(data: {
    verifyType: number;
  }): Observable<{ success: boolean; url: string; link?: string }> {
    return this.http.post<{ success: boolean; url: string; link?: string }>(
      `${this.ROOT_URL}/bank-account-verify/get-url`,
      data
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  yodleeGetBankDetails(uuId: any): Observable<any> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.http.get<any>(
      `${this.ROOT_URL}/bank-account-verify/verify/${uuId}`
    );
  }

  yodleeGetBankDetailsStep2(
    uuId: string
  ): Observable<IApiRes<ISelectYodleeAccount[]>> {
    return this.http.get<IApiRes<ISelectYodleeAccount[]>>(
      `${this.ROOT_URL}/bank-account-verify/verify-step2/${uuId}`
    );
  }

  microDeposit(
    data:
      | FormData
      | {
          bankAccountId: string;
          attachments: IDocumentInfo[];
          use_kyc: boolean;
          kyb_reference_id: string;
        }
  ) {
    return this.http.post<IApiRes<string> & { message: string }>(
      `${this.ROOT_URL}/bank-account-verify/micro-deposit`,
      data
    );
  }

  microDepositDetailsById(id: string): Observable<IApiRes<IMicroDepositData>> {
    return this.http.get<IApiRes<IMicroDepositData>>(
      `${this.ROOT_URL}/bank-account-verify/${id}`
    );
  }

  /**
   * @description API function for Check the wire routing number and saves the setup accordingly.
   * @param sendingData -Payload for the API
   */
  validateWireRoutingNumber(sendingData: {
    bankAccountId: string;
    wireRoutingNumber?: string;
  }): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/bank-accounts/validate-wire-routing`,
      sendingData
    );
  }
  //* ***********************micro deposit****************************** */

  getConfirmMicroDeposit(
    id: string
  ): Observable<IApiRes<{ attemptLeft: number; bankAccountNumber: string }>> {
    return this.http.get<
      IApiRes<{ attemptLeft: number; bankAccountNumber: string }>
    >(`${this.ROOT_URL}/bank-account-verify/${id}/get-verification-attempt`);
  }

  uploadFromPhone(data: {
    requestType: string;
    documentType: string[];
    bankAccountNumber: string;
    bankAccountId: string;
  }): Observable<{
    data: IUploadFromPhoneResponse;
    errorMsg: number;
    success: boolean;
  }> {
    return this.http.post<{
      data: IUploadFromPhoneResponse;
      errorMsg: number;
      success: boolean;
    }>(`${this.ROOT_URL}/bank-account-verify/upload-file-from-phone`, data);
  }

  confirmMicroDeposit(data: IConfirmMicroDep): Observable<IApiRes<string>> {
    return this.http.post<IApiRes<string>>(
      `${this.ROOT_URL}/bank-account-verify/confirm-micro-deposit`,
      data
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  yodleeAddBankAcc(data: any): Observable<IApiResWithMsg<IBankSource[]>> {
    return this.http.post<IApiResWithMsg<IBankSource[]>>(
      `${this.ROOT_URL}/bank-account-verify/add-selected-yd-account`,
      data
    );
  }

  //* ****************************bank design sign****************************** */
  SignSaveOnScreen(
    signatureInfo: {
      signature: string;
      nickName: string;
      initial?: string;
    },
    mode?: string
  ): Observable<IApiRes<IGetExistLogo>> {
    let params = new HttpParams();
    if (mode) {
      params = params.append('purpose', 1);
    }
    return this.http.post<IApiRes<IGetExistLogo>>(
      `${this.ROOT_URL}/signature`,
      signatureInfo,
      { params }
    );
  }

  logoSaveOnScreen(data: FormData): Observable<IApiRes<IGetExistLogo>> {
    return this.http.post<IApiRes<IGetExistLogo>>(
      `${this.ROOT_URL}/check-design-images?type=1`,
      data
    );
  }

  getExistingPadImages(
    type: number,
    mode?: string
  ): Observable<IApiRes<IGetExistLogo[]>> {
    let params = new HttpParams();
    if (mode) {
      params = params.append('mode', mode);
    }
    return this.http.get<IApiRes<IGetExistLogo[]>>(
      `${this.ROOT_URL}/check-design-images?type=${type}`,
      { params }
    );
  }

  deleteExistingSign(id: number, type: number): Observable<IApiResMesssage> {
    return this.http.delete<IApiResMesssage>(
      `${this.ROOT_URL}/check-design-images/${id}?type=${type}`
    );
  }

  deleteExistingLogos(id: number, type: number): Observable<IApiResMesssage> {
    return this.http.delete<IApiResMesssage>(
      `${this.ROOT_URL}/check-design-images/${id}?type=${type}`
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  QRCodeScanSignature(id: number, type: number): Observable<any> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.http.delete<any>(
      `${this.ROOT_URL}/check-design-images/${id}?type=${type}`
    );
  }

  getQrCodeToken(): Observable<IApiRes<{ qrCodeToken: string }>> {
    return this.http.get<IApiRes<{ qrCodeToken: string }>>(
      `${this.ROOT_URL}/signature/qr-code-token`
    );
  }

  sendSms(smsData: { phone: string }): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/signature/0/send-sms`,
      smsData
    );
  }

  sendEmail(emailData: { email: string }): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/signature/0/send-email`,
      emailData
    );
  }

  /** generate ai logo */
  generateAILogo(data: IAILogoGeneratePayload): Observable<IApiRes<string[]>> {
    return this.http.post<IApiRes<string[]>>(
      `${this.ROOT_URL}/check-design-images/generate-ai-images`,
      data
    );
  }

  savAiImage(data: {
    type?: number;
    imageUrl: string;
  }): Observable<IApiRes<IGetExistLogo>> {
    return this.http.post<IApiRes<IGetExistLogo>>(
      `${this.ROOT_URL}/check-design-images/save-ai-image`,
      data
    );
  }

  bankAccountFavorite(id: string, action: 'favorite' | 'unfavorite') {
    return this.http.post<IApiRes<string>>(
      `${this.ROOT_URL}/bank-accounts/${id}/favorite`,
      { action }
    );
  }

  updateFavoriteOrder(payload: { order: Record<string, number> }) {
    return this.http.post<IApiRes<string>>(
      `${this.ROOT_URL}/bank-accounts/favorites/update-order`,
      payload
    );
  }

  /** Method to updated cheque signature */
  addSignature(id: string, signatureUrl: string) {
    return this.http.post<IApiRes<string>>(
      `${this.ROOT_URL}/bank-accounts/${id}/add-signature`,
      { signatureUrl }
    );
  }

  fetchBankBalance(id: string) {
    return this.http.get<
      IApiRes<{ balance: number; plaid_response: IBankBalancePlaidRes }>
    >(`${this.ROOT_URL}/bank-accounts/${id}/fetch-balance`);
  }

  mapYodleeAccount(id: string) {
    return this.http.get<
      IApiRes<{ is_mapped: boolean; yd_account_id?: string }>
    >(`${this.ROOT_URL}/bank-accounts/${id}/map-yodlee-account`);
  }

  mapPlaidAccount(id: string) {
    return this.http.get<
      IApiRes<{ is_mapped: boolean; plaid_account_id?: string }>
    >(`${this.ROOT_URL}/bank-accounts/${id}/map-plaid-account`);
  }

  getYodleeId(id: string) {
    return this.http.get<IApiRes<{ yd_account_id: string }>>(
      `${this.ROOT_URL}/bank-accounts/${id}/yd-details`
    );
  }

  getPlaidId(id: string) {
    return this.http.get<IApiRes<{ plaid_account_id: string }>>(
      `${this.ROOT_URL}/bank-accounts/${id}/plaid-details`
    );
  }

  getYodleeBanks(
    type: 'initial' | 'search',
    searchTerm?: string
  ): Observable<IYodleeBanks> {
    let params = new HttpParams();

    if (type === 'initial') {
      params = params.set('priority', 'popular');
    } else {
      params = params.set('name', searchTerm ?? '');
    }

    return this.http.get<IYodleeBanks>(
      `${this.ROOT_URL}/bank-data/search-provider`,
      { params }
    );
  }

  checkPermissionToCreateBank() {
    return this.http.post<{
      success: boolean;
    }>(`${this.ROOT_URL}/bank-accounts`, {
      permission_check_to_create_bank_account: true
    });
  }

  /**
   * @description Confirms a virtual bank account by updating its virtual account details
   * @param id - The bank account ID
   * @param data - The confirmation data containing bank account details
   * @returns Observable of the API response
   */
  confirmVirtualAccount(
    id: string,
    data: IConfirmVirtualAccount,
    headerOptions?: HttpHeaders
  ): Observable<IApiResMesssage> {
    return this.http.put<IApiResMesssage>(
      `${this.ROOT_URL}/bank-accounts/update-virtual-account/${id}`,
      data,
      { headers: headerOptions }
    );
  }

  uploadBankStatement(data: FormData): Observable<IApiRes<IApiResMesssage>> {
    return this.http.post<IApiRes<IApiResMesssage>>(
      `${this.ROOT_URL}/bank-account-verify/upload-statement`,
      data
    );
  }

  updateImportedBanksSampleFile() {
    return this.http.get<{ success: boolean; data: { sampleFileUrl: string } }>(
      `${this.ROOT_URL}/imports/bank-accounts-update/step1`
    );
  }

  updateImportedBanksStep1(data: FormData) {
    return this.http.post<
      IApiRes<{ header: string[]; rows: (string | number)[][] }>
    >(`${this.ROOT_URL}/imports/bank-accounts-update/step2`, data);
  }

  updateImportedBanksStep2(data: { mapping: (number | '')[] }) {
    return this.http.put<IApiRes<IImportedBanksUpdates[]>>(
      `${this.ROOT_URL}/imports/bank-accounts-update/step3`,
      data
    );
  }

  updateImportedBanksStep3(data: { data: IImportedBanksUpdates[] }) {
    return this.http.post<IApiRes<IImportedBanksUpdates[]>>(
      `${this.ROOT_URL}/imports/bank-accounts-update/step4`,
      data
    );
  }

  updateImportedBanksStep4(data: { data: IImportedBanksUpdates[] }) {
    return this.http.post<{ success: boolean }>(
      `${this.ROOT_URL}/imports/bank-accounts-update/step5`,
      data
    );
  }
}

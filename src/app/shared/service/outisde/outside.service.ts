import { HttpClient, HttpEvent, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IVirtualCardTxn } from 'src/app/data/data/virtual-card';
import { Utils } from 'src/app/data/utils';
import { IApiRes, IApiResMesssage } from 'src/app/models/api';
import { IShareCollectData } from 'src/app/modules/business-tools/document-vault/models/document-vault.models';
import {
  ICloudCardDetailsRes,
  ICloudCardFullDetails,
  ICloudCardTransactions,
  IPaymentMetaData,
  IVcnVirtualCardInfo,
  IMicroDepositMetaData,
  IPaymentDetails,
  IExternalPayeePayload,
  IWalletCardData,
  IGiftCardTransactions,
  IBillingAddressPayload,
  IVcnCardHolderUpdatePayload,
  IOutsidePersonaEnquiryData,
  IBankDetails,
  IExternalMicroDepositPayload,
  IDocumentVerificationData,
  IPayeeBankVerificationInfo,
  IPayeeBankVerificationSavePayload,
  IPayeeBankVerificationSaveRes,
  IPayeeVerificationPlaidVerifyPayload
} from 'src/app/modules/outside/model/outside';
import { environment } from 'src/environments/environment';
import { LocalStorageService } from '../storage/local-storage.service';
import {
  ICallBackPayload,
  IPlaidCallBackRes
} from 'src/app/shared/plaid/service/plaid.service';

interface IEverifyCheckData {
  account_name: string;
  bank_account: string;
  bank_account_account_name: string;
  bank_account_account_number: string;
  bank_name: string;
  bank_routing_number: string;
  cheque_amount: string;
  cheque_created_for_id: number;
  cheque_issue_date: string;
  cheque_serial_number: string;
  id: number;
  mark_as_verified: string;
  payee_name: string;
}


interface IPayeeUpdateOutsideInfo{
  payee_name:string;
  payee_nick_name:string;
  payee_address_line_1:string;
  payee_address_line_2:string;
  payee_city:string;
  payee_state:string;
  payee_zip:string;
  payee_country:string;
  payee_phone:string;
}

@Injectable({
  providedIn: 'root'
})
export class OutsideService {
  private http = inject(HttpClient);
  private localStorageService = inject(LocalStorageService);

  ROOT_URL = environment.rootUrl;
  OUTSIDE_ROOT_URL = environment.rootUrl.split('/api/v4')[0];

  verifySignatureToken(token: string): Observable<{success:boolean}> {
    return this.http.get<{success:boolean}>(`${this.ROOT_URL}/outside/signature/${token}`);
  }

  saveSignature(
    token: string,
    body: { signature: string; nick_name: string }
  ): Observable<{ success: boolean}> {
    return this.http.post<{ success: boolean}>(`${this.ROOT_URL}/outside/signature/${token}`, body);
  }

  everifyCheck(id: string): Observable<IApiRes<IEverifyCheckData>> {
    return this.http.get<IApiRes<IEverifyCheckData>>(
      `${this.ROOT_URL}/outside/everify/${id}`
    );
  }

  paymentStatus(id: string) {
    return this.http.get<IApiRes<IPaymentDetails[]>>(
      `${this.ROOT_URL}/outside/payment-status/${id}`
    );
  }

  /** Cloud bank credit card  start */
  cardUserLoginUsingKey(data: {
    user: { email: string; password: string };
    key: string;
  }): Observable<{ card_id: string; token: string; success: boolean }> {
    return this.http.post<{ card_id: string; token: string; success: boolean }>(
      `${this.ROOT_URL}/vcn/auth/token/${data.key}`,
      data.user
    );
  }

  getCardDetails(
    id: string
  ): Observable<HttpEvent<ICloudCardDetailsRes> | any> {
    return this.http.get<ICloudCardDetailsRes>(
      `${this.ROOT_URL}/vcn/cards/${id}`,
      Utils.httpHeaders({
        'card-token': this.localStorageService.getItem('card-token')
      })
    );
  }

  getCardFullDetails(
    id: string
  ): Observable<HttpEvent<IApiRes<ICloudCardFullDetails>> | any> {
    return this.http.get<IApiRes<ICloudCardFullDetails>>(
      `${this.ROOT_URL}/vcn/cards/${id}/show-details`,
      Utils.httpHeaders({
        'card-token': this.localStorageService.getItem('card-token')
      })
    );
  }

  getCardTransactions(
    id: string,
    page: number,
    limit: number
  ): Observable<
    | HttpEvent<{
        success: boolean;
        data: ICloudCardTransactions;
        total: number;
      }>
    | any
  > {
    return this.http.get<{
      success: boolean;
      data: ICloudCardTransactions;
      total: number;
    }>(
      `${this.ROOT_URL}/vcn/cards/${id}/transactions?limit=${limit}&page=${page}`,
      Utils.httpHeaders({
        'card-token': this.localStorageService.getItem('card-token')
      })
    );
  }
  /** Cloud bank credit card  end */

  virtualCardLogin(data: {
    user: { email: string; password: string };
    key: string;
  }): Observable<{ card_id: string; token: string; success: boolean }> {
    return this.http.post<{ card_id: string; token: string; success: boolean }>(
      `${this.ROOT_URL}/vcn/auth/virtual-card/token/${data?.key}`,
      data?.user
    );
  }

  virtualCardInfo(id: string): Observable<IApiRes<IVcnVirtualCardInfo>> {
    const cardToken: string | null =
      this.localStorageService.getItem('card-token');
    return this.http.get<IApiRes<IVcnVirtualCardInfo>>(
      `${this.ROOT_URL}/vcn/virtual-card/${id}`,
      {
        headers: new HttpHeaders({
          'card-token': cardToken ??''
        })
      }
    );
  }

  virtualCardTransactions(
    id: string,
    page: number,
    limit: number
  ): Observable<{ success: boolean; total: number; data: IVirtualCardTxn[] }> {
    const cardToken: string | null =
      this.localStorageService.getItem('card-token');
    return this.http.get<{
      success: boolean;
      total: number;
      data: IVirtualCardTxn[];
    }>(
      `${this.ROOT_URL}/vcn/virtual-card/${id}/transactions?limit=${limit}&page=${page}`,
      {
        headers: new HttpHeaders({
          'card-token': cardToken ??  ''
        })
      }
    );
  }

  uploadPaymentVerificationDocument(
    body: FormData
  ): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(
      `${this.OUTSIDE_ROOT_URL}/outside/payment/upload-document`,
      body
    );
  }

  /**
   *  API function for upload deposit slip attachment from outside
   */
  uploadDepositSlipAttachments(
    body: FormData
  ): Observable<{ success: boolean;errorMsg?: string }> {
    return this.http.post<{ success: boolean; errorMsg?: string }>(
      `${this.OUTSIDE_ROOT_URL}/outside/deposit-slips/upload-document`,
      body
    );
  }

  /**
   *  API function for upload check attachment from outside
   */
  uploadChecksAttachments(body: FormData): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(
      `${this.OUTSIDE_ROOT_URL}/outside/checks/upload-document`,
      body
    );
  }

  uploadCardDetailsAttachments(body: FormData): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(
      `${this.OUTSIDE_ROOT_URL}/outside/card-details/upload-document`,
      body
    );
  }

  /**
   *  API function for upload card attachment from outside
   */
  uploadCardAttachments(body: FormData): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(
      `${this.OUTSIDE_ROOT_URL}/outside/card-program/upload-document`,
      body
    );
  }

  /**
   * @description Upload microdeposit files
   * @param body formData includes bank details and uploaded files
   * @returns
   */
  uploadMicroDepositOutsideDocumentVerify(
    body: FormData
  ): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(
      `${this.OUTSIDE_ROOT_URL}/outside/bank-account-verify/upload-document`,
      body
    );
  }

  getPaymentMetaData(uuId: string): Observable<IApiRes<IPaymentMetaData>> {
    return this.http.get<IApiRes<IPaymentMetaData>>(
      `${this.OUTSIDE_ROOT_URL}/outside/payment/${uuId}/meta-data`
    );
  }

  /**
   * API function for getting deposit slip meta data from outside
   */
  getDepositSlipMetaData(
    uuId: string,
    headerOption?: HttpHeaders
  ): Observable<IApiRes<IPaymentMetaData>> {
    return this.http.get<IApiRes<IPaymentMetaData>>(
      `${this.OUTSIDE_ROOT_URL}/outside/deposit-slips/${uuId}/meta-data`,
      { headers: headerOption }
    );
  }

  /**
   * API function for getting check meta data from outside
   */
  getcheckMetaData(
    uuId: string,
    headerOption?: HttpHeaders
  ): Observable<IApiRes<IPaymentMetaData>> {
    return this.http.get<IApiRes<IPaymentMetaData>>(
      `${this.OUTSIDE_ROOT_URL}/outside/checks/${uuId}/meta-data`,
      { headers: headerOption }
    );
  }

  /**
   * @description Get metadata includes the bank details using uuId
   * @param uuId Unique id
   * @returns
   */
  getMicroDepositMetaData(
    uuId: string
  ): Observable<IApiRes<IMicroDepositMetaData>> {
    return this.http.get<IApiRes<IMicroDepositMetaData>>(
      `${this.OUTSIDE_ROOT_URL}/outside/bank-account-verify/${uuId}/meta-data`
    );
  }

  uploadPod(payload: FormData) {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/outside/payment-proof-of-delivery/upload`,
      payload
    );
  }

  getPodMetaData(uuId:string, headerOption?: HttpHeaders){
    return this.http.get<IApiRes<{documentType: string[];}>>(`${this.ROOT_URL}/outside/request-payments-pod/${uuId}/meta-data`,{ headers: headerOption });
  }

  uploadPodFile(payload: FormData) {
    return this.http.post<{success:boolean}>(
      `${this.ROOT_URL}/outside/request-payments-pod/upload-document`,
      payload
    );
  }
  
  externalBankStatus(id: string) {
    return this.http.get<{ success: boolean; errorMsg?: string,data:{email?:string,payee_id?:string,token?:string,plugins: string[],direct_deposit?:boolean,logo?:string} }>(
      `${this.ROOT_URL}/outside/external-bank-form/bank/${id}`
    );
  }

  addExternalBank(
    id: string,
    payload: {
      bank_name: string;
      routing_number: string;
      account_number: string;
      account_type: string;
      plaid_account_id?: string;
    }
  ) {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/outside/external-bank-form/bank/save/${id}`,
      payload
    );
  }

  addDirectDepositBank(payload: {
    routing_number: string;
    account_number: string;
    account_type: string;
    plaid_account_id?: string;
    uniqueId: string; // transactionId
    account_name: string;
    plaid_provider_id?: string;
    account_number_last4?: string;
    account_address?: string;
  }){
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/outside/external-bank-form/create-bank-account`,
      payload
    );
  }

  getPlaidConnectionData(sendingData:  { email: string; ref_id: string, ref_type: string }) {
    return this.http.post<IApiRes<{ token: string; key: string }>>(
      `${this.OUTSIDE_ROOT_URL}/outside/widget/plaid-connect`,
      sendingData,
      { headers: { noLoadingStop: 'true' } }
    );
  }

  getPlaidConnectionDataDirectDeposit(sendingData:  { user_id: string }) {
    return this.http.post<IApiRes<{ token: string; key: string }>>(
      `${this.OUTSIDE_ROOT_URL}/outside/widget/user-plaid-connect`,
      sendingData,
      { headers: { noLoadingStop: 'true' } }
    );
  }

  addExternalPayee(id:string,payload:IExternalPayeePayload){
    return this.http.post<{success:boolean,message:string,token:string}>(
      `${this.ROOT_URL}/outside/external-payee-form/payee-form/${id}`,
      payload
    );
  }

  getExternalPayeeToken(id:string){
    return this.http.get<{ success: boolean; errorMsg?: string,data:{payeeType?:string,payeeEmail?:string,token?:string,plugins:string[],senderCompanyName?:string, payee?:IPayeeUpdateOutsideInfo} }>(
      `${this.ROOT_URL}/outside/external-payee-form/payee-form/${id}`
    );
  }

  giftCardLogin(data: {
    password: string;
    key: string;
  }){
    return this.http.post<{ card_id: string; token: string; success: boolean }>(
      `${this.ROOT_URL}/vcn/auth/wallet-card/token/${data?.key}`,
      {password:data?.password}
    );
  }

  giftCardInfo(id: string) {
    const cardToken: string | null =
      this.localStorageService.getItem('card-token');
    return this.http.get<IApiRes<IWalletCardData>>(
      `${this.ROOT_URL}/vcn/wallet-card/${id}`,
      {
        headers: new HttpHeaders({
          'card-token': cardToken || ''
        })
      }
    );
  }

  giftCardTransactions(
    id: string,
    page:number,
    limit:number
  ) {
    const cardToken: string | null =
      this.localStorageService.getItem('card-token');
    return this.http.get<IApiRes<{data:IGiftCardTransactions[],total:number}>>(
      `${this.ROOT_URL}/vcn/wallet-card/${id}/transactions?limit=${limit}&page=${page}`,
      {
        headers: new HttpHeaders({
          'card-token': cardToken || ''
        })
      }
    );
  }

  activeGiftCard(id: string) {
    const cardToken: string | null =
      this.localStorageService.getItem('card-token');
    return this.http.put<IApiResMesssage>(
      `${this.ROOT_URL}/vcn/wallet-card/${id}/activate`,
      {},
      {
        headers: new HttpHeaders({
          'card-token': cardToken || ''
        })
      }
    );
  }

  updateBillingAddress(id: string, payload: {billing_address:Partial<IBillingAddressPayload>}) {
    const cardToken: string | null =
      this.localStorageService.getItem('card-token');
    return this.http.put<IApiResMesssage>(
      `${this.ROOT_URL}/vcn/wallet-card/${id}/update-billing`,
      payload,
      {
        headers: new HttpHeaders({
          'card-token': cardToken || ''
        })
      }
    );
  }

  logoutVcn(){
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/vcn/auth/logOut`,{}
    );
  }

  getVcnCardHolderDetail(id:string){
    return this.http.get<{success: boolean; errorMsg?: string,data:{holder:{first_name:string,last_name:string,email:string,phone:string}}}>(`${this.ROOT_URL}/vcn/card-holder/${id}`);
  }

  vcnCardHolderDetailUpdate(id:string,vcnCardPayload:IVcnCardHolderUpdatePayload){
    return this.http.put<{success:boolean,message:string}>(
      `${this.ROOT_URL}/vcn/card-holder/${id}/update`,
      vcnCardPayload
    );
  }

  getPersonaEnquiryId(id:string){
    return this.http.get<IApiRes<IOutsidePersonaEnquiryData>>(`${this.OUTSIDE_ROOT_URL}/outside/payee-kyb-verification/${id}`);
  }

  savePersonaData(payload:{inquiry_id: string, receiver_id: string}) {
    return this.http.post<IApiResMesssage>(`${this.OUTSIDE_ROOT_URL}/outside/payee-kyb-verification/inquiry/save`, payload);
  }
  
  uploadPaymentReceipt(payload: FormData, id: string) {
    return this.http.post<{success:boolean, message: string}>(
      `${this.OUTSIDE_ROOT_URL}/outside/card-payment-receipt-upload/${id}`,
      payload
    );
  }

  getBankDetails(bankAccountId: string,requestId: string) {
    return this.http.get<IApiRes<IBankDetails>>(`${this.ROOT_URL}/outside/micro-deposit/get-bank-details/${bankAccountId}/${requestId}`);
  }

  confirmExternalMicroDeposit(payload:IExternalMicroDepositPayload) {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/outside/micro-deposit/confirm`,
      payload
    );
  }

  /**
   * Gets share/collect page data using token.
   *
   * @param token - The token from the URL to retrieve page configuration.
   * @returns Observable of the API response containing page data.
   */
  getShareCollectData(token: string): Observable<IApiRes<IShareCollectData>> {
    return this.http.get<IApiRes<IShareCollectData>>(
      `${this.ROOT_URL}/outside/document-vault-upload/${token}/details`
    );
  }

  /**
   * Submits files to a share/collect link.
   *
   * @param token - The token from the URL.
   * @param data - FormData containing files and optional comment and PIN.
   * @returns Observable of the API response for the file submission.
   */
  submitShareCollectFiles(token: string, data: FormData): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/outside/document-vault-upload/${token}`,
      data
    );
  }

  /**
   * Gets download link data and file listing.
   *
   * @param token - The token from the URL to retrieve download page configuration.
   * @param pin - Optional PIN for protected links.
   * @returns Observable of the API response containing download page data and file list.
   */
  getDownloadLinkData(token: string, pin?: string): Observable<IApiRes<{
    share_token: string;
    target_name: string;
    target_type: string;
    company_name: string;
    logo_url: string | null;
    message: string;
    pin_enabled: boolean;
    max_downloads: number;
    current_downloads: number;
    expires_at: string;
    items: Array<{
      id: number;
      name: string;
      type: 'file' | 'folder';
      parent_id: number | null;
      file_size?: number;
      file_type?: string;
      s3_url?: string;
    }>;
  }>> {
    const headers = pin ? new HttpHeaders({ 'pin': pin }) : undefined;
    return this.http.get<IApiRes<any>>(
      `${this.ROOT_URL}/outside/document-vault-download/${token}/details`,
      { headers }
    );
  }

  /**
   * Verifies PIN for download link.
   *
   * @param token - The token from the URL.
   * @param pin - The PIN to verify.
   * @returns Observable of the API response.
   */
  verifyDownloadPin(token: string, pin: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(
      `${this.ROOT_URL}/outside/document-vault-download/${token}/verify-pin`,
      { pin }
    );
  }

  /**
   * Downloads an individual file.
   *
   * @param token - The token from the URL.
   * @param fileId - The ID of the file to download.
   * @param pin - Optional PIN for protected links.
   * @returns Observable of the file blob.
   */
  downloadFile(token: string, fileId: string, pin?: string): Observable<Blob> {
    const headers = pin ? new HttpHeaders({ 'pin': pin }) : undefined;
    return this.http.get(
      `${this.ROOT_URL}/outside/document-vault-download/${token}/file/${fileId}`,
      { headers, responseType: 'blob' }
    );
  }

  /**
   * Downloads all files as ZIP.
   *
   * @param token - The token from the URL.
   * @param pin - Optional PIN for protected links.
   * @returns Observable of the ZIP file blob.
   */
  downloadFolderAsZip(token: string, pin?: string): Observable<Blob> {
    const headers = pin ? new HttpHeaders({ 'pin': pin }) : undefined;
    return this.http.get(
      `${this.ROOT_URL}/outside/document-vault-download/${token}/zip`,
      { headers, responseType: 'blob' }
    );
  }

  getDocumentVerificationData(uuid: string, userId: string): Observable<IApiRes<IDocumentVerificationData>> {
    return this.http.get<IApiRes<IDocumentVerificationData>>(
      `${this.ROOT_URL}/outside/get-attachment-names/${uuid}/${userId}`
    );
  }
  
  uploadDocument(body: FormData): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(
      `${this.ROOT_URL}/outside/upload-attachment`,
      body
    );
  }

  getPayeeBankVerificationInfo(
    token: string
  ): Observable<IApiRes<IPayeeBankVerificationInfo>> {
    return this.http.get<IApiRes<IPayeeBankVerificationInfo>>(
      `${this.ROOT_URL}/outside/payee-bank-verification/info/${token}`
    );
  }

  savePayeeBankMicroDeposit(
    payload: IPayeeBankVerificationSavePayload
  ): Observable<IApiRes<IPayeeBankVerificationSaveRes>> {
    return this.http.post<IApiRes<IPayeeBankVerificationSaveRes>>(
      `${this.ROOT_URL}/outside/payee-bank-verification/save-micro-deposit`,
      payload
    );
  }

  getPayeeVerificationPlaidToken(
    token: string
  ): Observable<IApiRes<{ token: string; key: string }>> {
    return this.http.post<IApiRes<{ token: string; key: string }>>(
      `${this.OUTSIDE_ROOT_URL}/outside/payee-bank-verification/plaid/get-link-token`,
      { token },
      { headers: { noLoadingStop: 'true' } }
    );
  }

  payeeVerificationPlaidCallback(
    payload: ICallBackPayload
  ): Observable<IApiRes<IPlaidCallBackRes & { selectedBankId: string }>> {
    return this.http.post<IApiRes<IPlaidCallBackRes & { selectedBankId: string }>>(
      `${this.OUTSIDE_ROOT_URL}/outside/payee-bank-verification/plaid/callback`,
      payload
    );
  }

  verifyPayeeVerificationPlaid(
    payload: IPayeeVerificationPlaidVerifyPayload
  ): Observable<IApiRes<IPayeeBankVerificationSaveRes>> {
    return this.http.post<IApiRes<IPayeeBankVerificationSaveRes>>(
      `${this.OUTSIDE_ROOT_URL}/outside/payee-bank-verification/plaid/verify`,
      payload
    );
  }
}

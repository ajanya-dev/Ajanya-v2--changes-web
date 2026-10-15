import { IApiRes, IApiResMesssage } from 'src/app/models/api';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, Subject, catchError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { IPhysicalCardShippingDetails } from 'src/app/modules/wallet/wallet-v3/pages/create-card/create-card.component';
import {
  IWalletRoot,
  IStatus,
  IWalletSettings,
  IWalletTransactionStatements,
  IRechargeCredits,
  IWidthdrawFunds,
  ITransferFunds,
  IFundWallet,
  IFundWalletResponse,
  IWalletAchRequest,
  IOnBoardingPayeeWalletDetails,
  IWithdrawFundFee,
  ICardOnBoardingStatus,
  ICreateNewCard,
  ICardList,
  IShowCardData,
  IMCCCode,
  ICardRestrictionData,
  ICardRestrictionSettings,
  IGiftCardExcelResponse,
  ICreateGiftCard,
  IGiftCardList,
  IAddFund,
  IWalletInternationaPaymentCreate,
  IWalletInternationaPaymentAcceptPayload,
  IInternationalPaymentHistory,
  IWalletWalletRainCardDialogPaylod,
  ICryptoWalletFunding,
  ICryptoChainList,
  IStatementResponse,
  IComment,
  IAttachmentFile,
  IPayeeAddressDetails
} from '../../../models/wallet';
import { UserPermissionAlertService } from '../permission/user-permission-alert.service';

@Injectable({
  providedIn: 'root'
})
export class WalletService {
  private subject = new Subject<string>();

  private userPermissionService = inject(UserPermissionAlertService);
  private baseUrl = environment.rootUrl;
  constructor(private http: HttpClient) {}

  updateWalletAsPerID(walletName: string) {
    this.subject.next(walletName);
  }

  getWalletAsPerID() {
    return this.subject.asObservable();
  }

  /**
   * @description Method to get wallet list.
   * @param page - Pagination page number
   * @param term - Search term
   * @returns Observable with wallet list.
   */
  getWalletInformation(
    page = 1,
    term = '',
    headerOptions?: HttpHeaders,
    unmapped?: boolean,
    cardProgram?: boolean,
    internationalPaymentWallet?: boolean
  ): Observable<IWalletRoot> {
    const params: Record<string, string> = {};

    if (unmapped) {
      params.un_mapped_wallet = '1';
      params.card_program_wallet = '1';
    }

    if (cardProgram) {
      params.card_program_wallet = '1';
    }

    if (internationalPaymentWallet) {
      params.international_payment_wallet = '1';
    }

    return this.http.get<IWalletRoot>(
      `${this.baseUrl}/wallets?term=${term}&page=${page}`,
      { headers: headerOptions, params }
    );
  }

  getWalletStatus(): Observable<IApiRes<IStatus[]>> {
    return this.http.get<IApiRes<IStatus[]>>(
      `${this.baseUrl}/wallets/service-names`
    );
  }

  /**
   * Retrieves wallet information by their IDs from the server.
   *
   * @param {string[]} ids - An array of wallet IDs to retrieve.
   * @returns {Observable<IWalletRoot>} An observable containing wallet information.
   */
  getWalletInformationByIds(ids: string[], internationalPaymentWallet?: boolean,headerOptions?: HttpHeaders,): Observable<IWalletRoot> {
    const params: Record<string, string> = {};
    if (internationalPaymentWallet) {
      params.international_payment_wallet = '1';
    }
    return this.http.post<IWalletRoot>(
      `${this.baseUrl}/wallets/get-multple-wallets`,
      { ids },
      { headers: headerOptions,params }
    );
  }

  // Recharge Credits
  rechargeCredits(data: IRechargeCredits): Observable<IApiRes<string>> {
    return this.http
      .post<IApiRes<string>>(`${this.baseUrl}/wallets/refill-credits`, data)
      .pipe(
        catchError((error) => {
          this.userPermissionService.handleErrorsAndPermissions(error, () => {
            this.userPermissionService.walletWithdrawn(error);
          });
          throw error;
        })
      );
  }

  // Withdraw Funds
  withdrawFunds(
    data: IWidthdrawFunds,
    headerOption?: HttpHeaders
  ): Observable<IApiRes<string>> {
    return this.http
      .post<IApiRes<string>>(`${this.baseUrl}/wallets/withdraw-fund`, data, {
        headers: headerOption
      })
      .pipe(
        catchError((error) => {
          throw error;
        })
      );
  }

  // Transfer Funds
  transferFunds(data: ITransferFunds): Observable<IApiRes<string>> {
    return this.http
      .post<IApiRes<string>>(`${this.baseUrl}/wallets/transfer-fund`, data)
      .pipe(
        catchError((error) => {
          throw error;
        })
      );
  }

  // Fund Wallet
  fundWallet(
    data: IFundWallet,
    headerOption?: HttpHeaders
  ): Observable<IFundWalletResponse> {
    return this.http
      .post<IFundWalletResponse>(`${this.baseUrl}/wallets/fund-wallet`, data, {
        headers: headerOption
      })
      .pipe(
        catchError((error) => {
          throw error;
        })
      );
  }

  /**
   *   Fund Wallet from outside bank
   */
  fundWalletOutside(data: IFundWallet): Observable<IFundWalletResponse> {
    return this.http.post<IFundWalletResponse>(
      `${this.baseUrl}/wallets/fund-wallet-outside`,
      data
    );
  }

  wireApplicationForm(
    applicationUuid: string
  ): Observable<IApiRes<{ url: string }>> {
    return this.http.post<IApiRes<{ url: string }>>(
      `${this.baseUrl}/wallets/fund-wallet/wire-application-form/${applicationUuid}`,
      {}
    );
  }

  /**
   *   Wire application form for outside bank
   */
  outsideWireApplicationForm(
    applicationUuid: string
  ): Observable<IApiRes<{ url: string }>> {
    return this.http.post<IApiRes<{ url: string }>>(
      `${this.baseUrl}/wallets/fund-wallet/outside-wire-application-form/${applicationUuid}`,
      {}
    );
  }

  /**
   * @description Funding application form of a wallet transaction.
   * @param transactionUuId - uu_id of the wallet transaction.
   */
  getFundingApplicationForm(
    transactionUuId: string
  ): Observable<IApiRes<{ url: string }>> {
    return this.http.post<IApiRes<{ url: string }>>(
      `${this.baseUrl}/wallets/transactions/${transactionUuId}/funding-application-form`,{}
    );
  }

  getWalletSettings(): Observable<IApiRes<IWalletSettings>> {
    return this.http.get<IApiRes<IWalletSettings>>(
      `${this.baseUrl}/wallets/settings`
    );
  }

  updateWalletSettings(body: IWalletSettings): Observable<IApiRes<string>> {
    return this.http.post<IApiRes<string>>(
      `${this.baseUrl}/wallets/settings`,
      body
    );
  }

  getTransactionStatements(
    transactionId: string
  ): Observable<IApiRes<IWalletTransactionStatements>> {
    return this.http.get<IApiRes<IWalletTransactionStatements>>(
      `${this.baseUrl}/wallets/${transactionId}/transaction-statements`
    );
  }

  /**
   * @description Method to get wallet history details of directly onboarding payee through email link..
   * @returns Observable with wallet history data.
   */
  getOnboardingPayeeWalletDetails(): Observable<
    IApiRes<IOnBoardingPayeeWalletDetails>
  > {
    return this.http.get<IApiRes<IOnBoardingPayeeWalletDetails>>(
      `${this.baseUrl}/wallets/transaction/get-latest-wallet-transaction-detail`
    );
  }

  /**
   * @returns available_balance in security deposit
   */
  getSecurityDepositBalance(): Observable<
    IApiRes<{ available_balance: string }>
  > {
    return this.http.get<IApiRes<{ available_balance: string }>>(
      `${this.baseUrl}/wallets/security-deposit-balance`
    );
  }

  /**
   * @description Used to download wallet statement.
   */
  downloadStatement(
    id: string,
    data: Record<string, string | number>
  ): Observable<IApiRes<IStatementResponse>> {
    return this.http.post<IApiRes<IStatementResponse>>(
      `${this.baseUrl}/wallets/${id}/statement`,
      data
    );
  }

  /**
   * @description Get wallet ACH informations
   */
  getWalletAchReq(uuId: string): Observable<IApiRes<IWalletAchRequest>> {
    return this.http.get<IApiRes<IWalletAchRequest>>(
      `${this.baseUrl}/wallets/ach-transfer-request/${uuId}`
    );
  }

  makeFavorite(id: string, action: 'favorite' | 'unfavorite') {
    return this.http.post<IApiRes<string>>(
      `${this.baseUrl}/wallets/${id}/favorite`,
      { action }
    );
  }

  updateFavoriteOrder(payload: { order: Record<string, number> }) {
    return this.http.post<IApiRes<string>>(
      `${this.baseUrl}/wallets/favorites/update-order`,
      payload
    );
  }

  downloadFundingInfo(id: string) {
    return this.http.post<IApiRes<{ url: string }>>(
      `${this.baseUrl}/wallets/${id}/wallet-fund-without-request`,
      {}
    );
  }

  withdrawFundFee(payload: {
    amount: number;
    transfer_method: string;
  }): Observable<IApiRes<IWithdrawFundFee>> {
    return this.http.post<IApiRes<IWithdrawFundFee>>(
      `${this.baseUrl}/wallets/withdraw-fund-fee`,
      payload
    );
  }

  getCardOnboardingStatus(
    walletId?: string
  ): Observable<IApiRes<ICardOnBoardingStatus>> {
    let url = `${this.baseUrl}/banking-as-service/card-program-onboarding-status`;

    // Add walletId as a query parameter if it is provided
    if (walletId) {
      url = `${url}?wallet_id=${walletId}`;
    }

    // Make the HTTP GET request
    return this.http.get<IApiRes<ICardOnBoardingStatus>>(url, { headers: { disablePermission: 'true' } });
  }

  applyCard(
    businessId: string,
    walletId: string,
    relatedWallets?: string[]
  ): Observable<{ success: boolean }> {
    const payload: IWalletWalletRainCardDialogPaylod = {
      businessId,
      walletId
    };

    if (relatedWallets && relatedWallets.length > 0) {
      payload.relatedWallets = relatedWallets;
    }

    return this.http.post<{ success: boolean }>(
      `${this.baseUrl}/banking-as-service/card-program-onboarding`,
      payload
    );
  }

  createGiftCard(data: ICreateGiftCard) {
    return this.http.post<{
      success: boolean;
      code?: string;
      errorCode?: string;
      errorMsg?: string;
      session_key?: string;
      expiredIn?: number;
      createdAt?: number;
    }>(
      `${this.baseUrl}/banking-as-service/wallet/gift-card/create`,
      data
    );
  }

  getGiftCardDetails(walletId: string): Observable<IApiRes<IGiftCardList[]>> {
    return this.http.get<IApiRes<IGiftCardList[]>>(
      `${this.baseUrl}/banking-as-service/wallet/gift-card/send-cards-list?wallet_id=${walletId}`
    );
  }

  addFundToGiftCard(data: IAddFund) {
    return this.http.post<{ success: boolean }>(
      `${this.baseUrl}/banking-as-service/wallet/gift-card/add-fund`,
      data
    );
  }

  createCard(data: ICreateNewCard) {
    return this.http.post<{ success: boolean }>(
      `${this.baseUrl}/banking-as-service/cards/create`,
      data
    );
  }

  updateCardDetails(cardId: string, data: ICreateNewCard) {
    return this.http.put<{ success: boolean; errorMsg?: string }>(
      `${this.baseUrl}/banking-as-service/cards/${cardId}`,
      data
    );
  }

  updateCardRestriction(cardId: string, data: ICardRestrictionSettings) {
    return this.http.post<{ success: boolean; errorMsg?: string }>(
      `${this.baseUrl}/banking-as-service/cards/restriction-settings/${cardId}`,
      data
    );
  }

  getCardDetails(
    walletId: string,
    page = 1,
    term: string = ''
  ): Observable<IApiRes<ICardList[]>> {
    return this.http.get<IApiRes<ICardList[]>>(
      `${this.baseUrl}/banking-as-service/cards?wallet_id=${walletId}&page=${page}&term=${term}`
    );
  }

  showCard(cardID: string, data: unknown): Observable<IApiRes<IShowCardData>> {
    return this.http.post<IApiRes<IShowCardData>>(
      `${this.baseUrl}/banking-as-service/cards/${cardID}/show`,
      data
    );
  }

  toggleCardStatus(
    cardId: string,
    data: unknown
  ): Observable<IApiRes<ICardList>> {
    return this.http.post<IApiRes<ICardList>>(
      `${this.baseUrl}/banking-as-service/cards/${cardId}/change-status`,
      data
    );
  }

  getMCCcodes(): Observable<IApiRes<IMCCCode[]>> {
    return this.http.get<IApiRes<IMCCCode[]>>(
      `${this.baseUrl}/banking-as-service/mcc-codes`
    );
  }

  getCardRestriction(
    cardId: string
  ): Observable<IApiRes<ICardRestrictionData>> {
    return this.http.get<IApiRes<ICardRestrictionData>>(
      `${this.baseUrl}/banking-as-service/cards/restriction-settings/${cardId}`,
      { headers: { disablePermission: 'true' } }
    );
  }

  importGiftCard(payload: FormData) {
    return this.http.post<IGiftCardExcelResponse>(
      `${this.baseUrl}/banking-as-service/wallet/gift-card/upload`,
      payload
    );
  }

  createBulkGiftCard(payload: { wallet_id: string; batch_id: string }) {
    return this.http.post<{ success: boolean }>(
      `${this.baseUrl}/banking-as-service/wallet/gift-card/bulk-create`,
      payload
    );
  }

  editGiftCardRow(
    id: string,
    payload: {
      firstname: string;
      lastname: string;
      email: string;
      phone: string;
      amount: string;
      type: string;
    }
  ) {
    return this.http.put<IApiResMesssage>(
      `${this.baseUrl}/banking-as-service/wallet/gift-card/update-import/${id}`,
      payload
    );
  }

  deleteGiftCardRow(id: string) {
    return this.http.delete<IApiResMesssage>(
      `${this.baseUrl}/banking-as-service/wallet/gift-card/delete-import/${id}`
    );
  }

  downloadGiftCardSampleFile() {
    return this.http.get<IApiRes<{ sampleFileUrl: string }>>(
      `${this.baseUrl}/banking-as-service/wallet/gift-card/sample-file`
    );
  }

  getExchangeRate(payload: {
    countryCode: string;
    payoutCurrencyCode: string;
  }) {
    return this.http.post<IApiRes<{ exchange_amount: string }>>(
      `${this.baseUrl}/zil-payments/international-payments/exchange-rate`,
      payload
    );
  }

  createQuote(payload: {
    countryCode: string;
    payoutCurrencyCode: string;
    amount: number;
    type: string;
    isReceivingAmount?: number;
  }) {
    return this.http.post<IApiRes<IWalletInternationaPaymentCreate>>(
      `${this.baseUrl}/zil-payments/international-payments/quote/create`,
      payload
    );
  }

  acceptQoute(
    payload: IWalletInternationaPaymentAcceptPayload,
    headerOption?: HttpHeaders
  ) {
    return this.http.post<IApiRes<IInternationalPaymentHistory>>(
      `${this.baseUrl}/zil-payments/international-payments/quote/accept`,
      payload,
      { headers: headerOption }
    );
  }

  getSourceOfCash(payload: {countryCode: string, type: string}) {
    return this.http.post<IApiRes<{ [key: string]: string }[]>>(
      `${this.baseUrl}/zil-payments/international-payments/sources`,payload
    );
  }

  getPurpose(payload: {countryCode: string, type: string}) {
    return this.http.post<IApiRes<{ [key: string]: string }[]>>(
      `${this.baseUrl}/zil-payments/international-payments/purposes`,payload
    );
  }

  checkTransactionLimit(payload: {
    quoteId: string;
    payeeId: string;
    countryCode: string;
    type: string;
    purposeCode: string;
    paymentMemo: string;
    isProceedPayment: string;
  }) {
    return this.http.post<IApiRes<{ [key: string]: unknown }>>(
      `${this.baseUrl}/zil-payments/international-payments/check-transaction-limit`,
      payload
    );
  }

  getRelationship() {
    return this.http.get<IApiRes<{ [key: string]: string }[]>>(
      `${this.baseUrl}/zil-payments/international-payments/relationship`
    );
  }

  getCryptoFundingSources() {
    return this.http.get<IApiRes<ICryptoChainList[]>>(
      `${this.baseUrl}/banking-as-service/card-program/wallet-funding-source`
    );
  }

  cryptoWalletFundingSource(payload: ICryptoWalletFunding) {
    return this.http.post<IApiRes<{ [key: string]: string }[]>>(
      `${this.baseUrl}/banking-as-service/card-program/wallet-funding`,
      payload
    );
  }

  updateWalletLogo(walletId: string, file: FormData) {
    return this.http.post<IApiRes<{ data: string }>>(
      `${this.baseUrl}/wallets/${walletId}/logo`,
      file
    );
  }

  updateWalletLogoDontAskAgain(walletId: string) {
    return this.http.post<IApiRes<{ data: string }>>(
      `${this.baseUrl}/wallets/${walletId}/logo/prompt`,
      { key: 'wallet_logo_upload_prompt' }
    );
  }

  getShippingTypeDetailsForPhysicalCard(payload: {country: string, method: string}) {
    return this.http.post<IApiRes<IPhysicalCardShippingDetails>>(
      `${this.baseUrl}/banking-as-service/cards/get-shipping-charge`,
      { shippingAddress: payload }
    );
  }

  setDefaultBank(payload: {
    accountId: string;
    payeeId: string;
    type: string;
  }) {
    return this.http.post<IApiResMesssage>(
      `${this.baseUrl}/international-payment-payee/set-account-as-default`,
      payload
    );
  }

  completeWalletMapping(walletId: string, kybId: string) {
    return this.http.post<IApiResMesssage>(
      `${this.baseUrl}/wallets/map-kyb`,
      { walletId, kybId }
    );
  }

  addCommentInternationalPayment(id: string, payload: {
    comment: string;
  }) {
    return this.http.post<IApiResMesssage>(
      `${this.baseUrl}/zil-payments/international-payments/${id}/comments`,
      payload
    );
  }

  deleteCommentInternationalPayment(id: string, commentId: string) {
    return this.http.delete<IApiResMesssage>(
      `${this.baseUrl}/zil-payments/international-payments/${id}/comments/${commentId}`,
    );
  }

  getAttachmentsInternationalPayment(id: string) {
    return this.http.get<IApiRes<IAttachmentFile[]>>(
      `${this.baseUrl}/zil-payments/international-payments/${id}/attachments`
    );
  }

  getAttachmentByIdInternationalPayment(id: string, attachmentId: string) {
    return this.http.get<IApiRes<IAttachmentFile>>(
      `${this.baseUrl}/zil-payments/international-payments/${id}/attachments/${attachmentId}`
    );
  }

  deleteAttachmentInternationalPayment(id: string, attachmentId: string) {
    return this.http.delete<IApiResMesssage>(
      `${this.baseUrl}/zil-payments/international-payments/${id}/attachments/${attachmentId}`
    );
  }

  addAttachmentInternationalPayment(id: string, payload: {
    image: File;
  }) {
    const formData = new FormData();
    formData.append('image', payload.image);
    return this.http.post<IApiResMesssage>(
      `${this.baseUrl}/zil-payments/international-payments/${id}/attachments`,
      formData
    );
  }

  getCommentsInternationalPayment(id: string) {
    return this.http.get<IApiRes<IComment[]>>(
      `${this.baseUrl}/zil-payments/international-payments/${id}/comments`
    );
  }


  getTransactionDetails(){
    return this.http.get<IApiRes<{exists: boolean}>>(
      `${this.baseUrl}/zil-payments/international-payments/transactions/exists`
    );
  }

  existingBeneficiaryDetails(countryCode: string, type: 'business' | 'personal',payeeId: string): Observable<IApiRes<IPayeeAddressDetails>> {
    return this.http.post<IApiRes<IPayeeAddressDetails>>(`${this.baseUrl}/zil-payments/international-payments/existing-beneficiary-details`, 
      { countryCode, type, payeeId });
  }

  markAsSettled(ids: string[]): Observable<IApiRes<{ success: boolean }>> {
    return this.http.post<IApiRes<{ success: boolean }>>(`${this.baseUrl}/zil-payments/international-payments/mark-as-settled`, { ids });
  }

}

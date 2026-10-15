import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import {
  IAccountDetails,
  IAirWallexTransactionStatement,
  ICloudInternalTransferPayload,
  ICloudIntraTransferPayload
} from 'src/app/data/data/cloud-bank';
import { BehaviorSubject, Observable, Subject, catchError } from 'rxjs';
import {
  IApiRes,
  IApiResMesssage,
  IApiResSuccessOnly,
  IApiResWithUrl
} from 'src/app/models/api';
import {
  ICloudBankPhoneNumberLookup,
  IGetAccountDetailsData,
  IPhoneDetailsUpdater,
  ISelectedAccountDetails,
  IpaymentSettings,
  ICloudSendPaymentPayloadAirwallex,
  ICloudBankAccountDetailsAirwallex,
  ICloudAccountStatus,
  IAirWallexAccDetails,
  ICreateNewCard,
  ICardList2,
  IShowCardData,
  ICloudGetTypes,
  ICloudInternationalPayloadAirwallex,
  ICloudAirwallexAccountInfo
} from 'src/app/modules/cloud-bank/model/cloudbank';
import { environment } from 'src/environments/environment';
import { IPayeeStates, IPayeeViewBank } from 'src/app/modules/payee/payee-v2/model/payee';
import { toObservable } from '@angular/core/rxjs-interop';
import { ICloudBankDetailsRes } from 'src/app/modules/payments/model/payments';
import { UserPermissionAlertService } from '../permission/user-permission-alert.service';

type HttpOptions = Parameters<HttpClient['post']>[2];
interface IGenericResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

@Injectable({
  providedIn: 'root'
})
export class CloudBankService {
  private userPermissionService = inject(UserPermissionAlertService);
  private selectedAccountName = new BehaviorSubject<string>('');
  selectedAccountId: string;
  selectedCloudAccountdata: IApiRes<IGetAccountDetailsData>;

  private accountDetails =
    new BehaviorSubject<ICloudBankAccountDetailsAirwallex>({
      accountName: '',
      accountType: '',
      accountStatus: '',
      accountNumber: '',
      accountNickName: '',
      id: '',
      routingNumber: '',
      swiftCode: ''
    });

  ROOT_URL = environment.rootUrl;
  btnDisabled$ = new BehaviorSubject<'true' | 'false'>('false');
  isSelectedClosedAccount$ = new BehaviorSubject<boolean>(false);

  phoneDetailsInital: IPhoneDetailsUpdater = {
    phone: '',
    countryCode: 'US'
  };

  editedPayeeData$ = new Subject<IPayeeViewBank>();

  private selectedAccountDetails = new BehaviorSubject<ISelectedAccountDetails>(
    {
      type: 1,
      balance: 0
    }
  );

  private selectedCardDetails = new BehaviorSubject<{
    id: string;
    accountId: string;
  }>({
    id: '',
    accountId: ''
  });

  private selectedTabSignal = signal<{
    tab: 'account' | 'card';
  }>({
    tab: 'account'
  });

  private selectedTabObservable = toObservable(this.selectedTabSignal);

  private selectedAction = new BehaviorSubject<{ action: string }>({
    action: ''
  });

  isGridView = true;
  isCloudLoading = false;
  phoneDetails = new BehaviorSubject<IPhoneDetailsUpdater>(
    this.phoneDetailsInital
  );

  allowedCountries = new BehaviorSubject<{ [key: string]: string }>({});

  refreshCount$ = new Subject();
  constructor(private http: HttpClient) {}

  /**
   * @description This method is used to update the back account name
   * @param accountName name of the bank account to be updated.
   */
  setSelectedAccountName(accountName: string) {
    this.selectedAccountName.next(accountName);
  }

  /**
   *
   * @returns Returns an observable to access the updated bank account name.
   */
  getSelectedAccountName(): Observable<string> {
    return this.selectedAccountName;
  }

  /**
   * @description toggle between grid view and list view
   * @param value value of the event emited from list component
   */
  toggleView(value: { gridView: boolean }): void {
    this.isGridView = value.gridView;
  }

  set selectedAccountData(accountInfo: ISelectedAccountDetails) {
    this.selectedAccountDetails.next(accountInfo);
  }

  get selectedAccountData$(): BehaviorSubject<ISelectedAccountDetails> {
    return this.selectedAccountDetails;
  }

  set selectedCardData(cardInfo: { id: string; accountId: string }) {
    this.selectedCardDetails.next(cardInfo);
  }

  get selectedCardData$(): Observable<{ id: string; accountId: string }> {
    return this.selectedCardDetails.asObservable();
  }

  set selectedCloudTab(tabInfo: { tab: 'account' | 'card' }) {
    this.selectedTabSignal.set(tabInfo);
  }

  get selectedCloudTab$(): Observable<{
    tab: 'account' | 'card';
  }> {
    return this.selectedTabObservable;
  }

  /**
   * @description It is used for if user take any action in card like cancel card or edit card
   * that changes is effected in card list.It is Used in the case of All card list
   * @param action it's value edit and cancel or empty string
   */
  set selectedCardActions(actionInfo: { action: string }) {
    this.selectedAction.next(actionInfo);
  }

  get selectedCardActions$(): Observable<{ action: string }> {
    return this.selectedAction;
  }

  getCheckVal$ = new BehaviorSubject<'set' | 'unset'>('set');

  getTheVal(): Observable<'set' | 'unset'> {
    return this.getCheckVal$;
  }

  setTheVal(data: 'set' | 'unset'): void {
    this.getCheckVal$.next(data);
  }

  billCheck$ = new BehaviorSubject<'checked' | 'unchecked'>('unchecked');

  getbillCheckVal(): Observable<'checked' | 'unchecked'> {
    return this.billCheck$;
  }

  setbillCheckVal(data: 'checked' | 'unchecked'): void {
    this.billCheck$.next(data);
  }

  getBankAccData$ = new BehaviorSubject<boolean>(false);

  getNewBankCreatedData(): Observable<boolean> {
    return this.getBankAccData$;
  }

  setNewBankCreatedData(data: boolean): void {
    this.getBankAccData$.next(data);
  }

  paymentSettings$ = new BehaviorSubject<IpaymentSettings | undefined>(
    undefined
  );

  get paymentSettings(): Observable<IpaymentSettings | undefined> {
    return this.paymentSettings$.asObservable();
  }

  set paymentSettings(value: IpaymentSettings) {
    this.paymentSettings$.next(value);
  }

  /**
   * @description New getAccounts() method with Airwallex
   * implements in cloud ach and wire for now.
   */
  getAccountsAirwallex(): Observable<
    IApiRes<ICloudBankAccountDetailsAirwallex[]>
  > {
    return this.http
      .get<
        IApiRes<ICloudBankAccountDetailsAirwallex[]>
      >(`${this.ROOT_URL}/banking-as-service/accounts`)
      .pipe(
        catchError((error) => {
          this.userPermissionService.handleErrorsAndPermissions(error, () => {
            this.userPermissionService.cloudAccountDetails(error);
          });
          throw error;
        })
      );
  }

  getAccountdetails(
    accountId: string
  ): Observable<IApiRes<IGetAccountDetailsData>> {
    return this.http.get<IApiRes<IGetAccountDetailsData>>(
      `${this.ROOT_URL}/banking-as-service/accounts/${accountId}`
    );
  }

  getAirWallexAccountdetails(
    accountId: string
  ): Observable<IApiRes<IAirWallexAccDetails>> {
    return this.http.get<IApiRes<IAirWallexAccDetails>>(
      `${this.ROOT_URL}/banking-as-service/accounts/${accountId}`
    );
  }

  /**
   * Getting cloud account trasaction statement file url.
   */
  getTransactionReport(accountId: string, txnId: string) {
    return this.http.post<{ success: boolean; url: string }>(
      `${this.ROOT_URL}/banking-as-service/accounts/${accountId}/transactions/${txnId}/download-pdf`,
      {}
    );
  }

  getCloudBalance(accountId: string): Observable<{ balance: number }> {
    return this.http.get<{ balance: number }>(
      `${this.ROOT_URL}/banking-as-service/accounts/${accountId}/balance`
    );
  }

  getCardDetails(accountId: string): Observable<IApiRes<ICardList2[]>> {
    return this.http.get<IApiRes<ICardList2[]>>(
      `${this.ROOT_URL}/banking-as-service/cards?accountId=${accountId}`
    );
  }

  showCard(cardID: string, data: unknown): Observable<IApiRes<IShowCardData>> {
    return this.http.post<IApiRes<IShowCardData>>(
      `${this.ROOT_URL}/banking-as-service/cards/${cardID}/show`,
      data
    );
  }

  downloadStatement(
    data: Record<string, string | number>,
    id: string
  ): Observable<IApiResWithUrl> {
    return this.http.post<IApiResWithUrl>(
      `${this.ROOT_URL}/banking-as-service/accounts/${id}/banking-statement`,
      data
    );
  }

  toggleCardStatus(
    cardID: string,
    data: unknown
  ): Observable<IApiRes<ICardList2>> {
    return this.http.post<IApiRes<ICardList2>>(
      `${this.ROOT_URL}/banking-as-service/cards/${cardID}/change-status`,
      data
    );
  }

  setCardPin(cardID: string, data: unknown): Observable<IApiRes<ICardList2>> {
    return this.http.post<IApiRes<ICardList2>>(
      `${this.ROOT_URL}/banking-as-service/cards/${cardID}/setpin`,
      data
    );
  }

  updateCardDetail(cardID: string, data: unknown) {
    return this.http.put<{ success: boolean; errorMsg?: string }>(
      `${this.ROOT_URL}/banking-as-service/cards/${cardID}`,
      data
    );
  }

  createCard(data: ICreateNewCard) {
    return this.http.post<{ success: boolean }>(
      `${this.ROOT_URL}/banking-as-service/cards/create`,
      data
    );
  }

  /**
   * @description New send payment method with Airwallex integration.
   * @param data Payload for sending payment
   * @returns {success: boolean}
   */
  sendPaymentAirwallex(
    data: ICloudSendPaymentPayloadAirwallex
  ): Observable<{ success: boolean }> {
    return this.http
      .post<{
        success: boolean;
      }>(`${this.ROOT_URL}/banking-as-service/send-payment`, data)
      .pipe(
        catchError((error) => {
          this.userPermissionService.handleErrorsAndPermissions(error, () => {
            this.userPermissionService.cloudPaymentPermission(error);
          });
          throw error;
        })
      );
  }

  /**
   * @description  send international payment method with Airwallex integration.
   * @param data Payload for sending payment
   * @returns {success: boolean}
   */
  sendInternationalPaymentAirwallex(
    data: ICloudInternationalPayloadAirwallex
  ): Observable<{ success: boolean }> {
    return this.http
      .post<{
        success: boolean;
      }>(
        `${this.ROOT_URL}/banking-as-service/send-payment/internationalWire`,
        data
      )
      .pipe(
        catchError((error) => {
          this.userPermissionService.handleErrorsAndPermissions(error, () => {
            this.userPermissionService.cloudPaymentPermission(error);
          });
          throw error;
        })
      );
  }

  confirmOtp(data: unknown, headers?: HttpHeaders) {
    return this.http.post<IApiResSuccessOnly & { errorCode: number }>(
      `${this.ROOT_URL}/otp-verificaton/confirm`,
      data,
      { headers }
    );
  }

  addIfscCode(
    internationalAccountId: string,
    body: { payee_id?: string; ifsc: string }
  ): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/international-payment-payee/new/${internationalAccountId}`,
      body
    );
  }

  cloudBankStatus() {
    return this.http.get<ICloudAccountStatus>(
      `${this.ROOT_URL}/banking-as-service/onboarding-status`
    );
  }

  phoneNumberLookup(
    phone: string
  ): Observable<IApiRes<ICloudBankPhoneNumberLookup>> {
    return this.http.get<IApiRes<ICloudBankPhoneNumberLookup>>(
      `${this.ROOT_URL}/sms/phone-number/lookUp?phone=${phone}`
    );
  }

  set phoneDetailsUpdater(phoneDetails: IPhoneDetailsUpdater) {
    this.phoneDetails.next(phoneDetails);
  }

  get phoneDetailsUpdater$(): Observable<IPhoneDetailsUpdater> {
    return this.phoneDetails.asObservable();
  }

  /**
   * Gettilg allowed countries.
   * @returns - Observable<IApiRes<string>>
   */
  getAllowedCountries() {
    return this.http.get<IApiRes<{ [key: string]: string }>>(
      `${this.ROOT_URL}/cloud-bank/allowed-countries`
    );
  }

  /**
   * Gettilg entity type and industry type.
   */
  getTypes() {
    return this.http.get<IApiRes<ICloudGetTypes>>(
      `${this.ROOT_URL}/cloud-bank/application/types`
    );
  }

  getBtnDisabled(): Observable<'true' | 'false'> {
    return this.btnDisabled$;
  }

  setBtnDisabled(data: 'true' | 'false'): void {
    this.btnDisabled$.next(data);
  }

  getEditPayee(): Observable<IPayeeViewBank> {
    return this.editedPayeeData$;
  }

  setEditPayee(data: IPayeeViewBank): void {
    this.editedPayeeData$.next(data);
  }

  getAirWallexTransactionStatement(
    accountId: string
  ): Observable<IAirWallexTransactionStatement[]> {
    return this.http.get<IAirWallexTransactionStatement[]>(
      `${this.ROOT_URL}/banking-as-service/accounts/${accountId}/transaction-histories`
    );
  }

  applyCloudBank(businessId: string) {
    return this.http.post<{ success: boolean }>(
      `${this.ROOT_URL}/banking-as-service/onboarding`,
      { businessId }
    );
  }

  verifyLink(
    uuId: string,
    payloadData: { phone: string }
  ): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(
      `${this.ROOT_URL}/zilbank/pay-with-zil/auth/${uuId}`,
      payloadData
    );
  }

  verifyOtp(payloadData: {
    phone: string;
    otp: string;
  }): Observable<IApiRes<{ token: string }>> {
    return this.http.post<IApiRes<{ token: string }>>(
      `${this.ROOT_URL}/zilbank/pay-with-zil/verify-otp`,
      payloadData
    );
  }

  payWithZilAccounts(httpOptions: HttpOptions) {
    return this.http.get(
      `${this.ROOT_URL}/zilbank/pay-with-zil/accounts`,
      httpOptions
    );
  }

  sendPaymentPayWithZil(
    uuId: string,
    payloadData: { accountId: string; amount: string; memo: string },
    httpOptions: HttpOptions
  ) {
    return this.http.post(
      `${this.ROOT_URL}/zilbank/pay-with-zil/send-payment/${uuId}`,
      payloadData,
      httpOptions
    );
  }

  getAccountDetailsOutside(uuid: string): Observable<IApiRes<IAccountDetails>> {
    return this.http.get<IApiRes<IAccountDetails>>(
      `${this.ROOT_URL}/zilbank/pay-with-zil/receiver-account-details/${uuid}`
    );
  }

  cloudBankInternalTransfer(
    payload: ICloudInternalTransferPayload
  ): Observable<IApiRes<any>> {
    return this.http.post<IApiRes<any>>(
      `${this.ROOT_URL}/banking-as-service/internal-transfer`,
      payload
    );
  }

  cloudBankIntraTransfer(
    payload: ICloudIntraTransferPayload
  ): Observable<IApiRes<ICloudBankDetailsRes>> {
    return this.http.post<IApiRes<ICloudBankDetailsRes>>(
      `${this.ROOT_URL}/banking-as-service/send-payment/intra-transfer`,
      payload
    );
  }

  set AccountDetails(data: ICloudBankAccountDetailsAirwallex) {
    this.accountDetails.next(data);
  }

  get AccountDetails$(): Observable<ICloudBankAccountDetailsAirwallex> {
    return this.accountDetails.asObservable();
  }

  /**
   * @description Retrieves the selected cloud account details through an observable.
   * @param {string}accountId Selected account id.
   * @returns {Observable<IApiRes<IGetAccountDetailsData>>}  An Observable that emits an IApiRes object containing cloud account details.
   */
  getSelectedAccountDetails(
    accountId: string
  ): Observable<IApiRes<IGetAccountDetailsData>> {
    return new Observable((observe) => {
      /**
       * @description Here check the previos id and current is equel then observe emit the previous result, otherwise call the api again.
       */
      if (accountId === this.selectedAccountId) {
        observe.next(this.selectedCloudAccountdata);
        return;
      }
      this.selectedAccountId = accountId;
      this.getAccountdetails(accountId).subscribe({
        next: (res) => {
          this.selectedCloudAccountdata = res;
          observe.next(res);
          observe.complete();
        },
        error: (err) => {
          observe.next(err);
          observe.complete();
        }
      });
    });
  }

  cloudAccountInfo(
    accountId: string,
    type: string,
    item?: string,
    email?: string
  ): Observable<IGenericResponse<ICloudAirwallexAccountInfo>> {
    let params = new HttpParams();
    params = params.append('type', type);
    if (email) {
      params = params.append('email', email);
    }
    if (item === 'international') {
      params = params.append('action', 'internationalWire');
    }
    return this.http.get<IGenericResponse<ICloudAirwallexAccountInfo>>(
      `${this.ROOT_URL}/banking-as-service/accounts/${accountId}/funding-info`,
      { params }
    );
  }

  verificationLetter(
    accountId: string,
    type: string
  ): Observable<IApiRes<{ url: string }>> {
    let params = new HttpParams();
    params = params.append('type', type);
    return this.http.get<IApiRes<{ url: string }>>(
      `${this.ROOT_URL}/banking-as-service/accounts/${accountId}/verification-letter`,
      { params }
    );
  }

  /**
   * @description Adds or updates the nickname of a cloud bank account.
   * @param {string} accountId - The ID of the selected account.
   * @param {string} body.accountNickName - The new nickname for the account.
   * @returns {Observable<{ success: boolean }>} An Observable emitting an object indicating the success status of the operation.
   */
  addNickName(
    accountId: string,
    body: { accountNickName: string }
  ): Observable<{ success: boolean }> {
    return this.http.put<{ success: boolean }>(
      `${this.ROOT_URL}/banking-as-service/accounts/${accountId}`,
      body
    );
  }

  /**
   * API function for getting states based on country
   */
  getStates(
    country_code: string,
    state_name: string = ''
  ): Observable<{ success: boolean; data: IPayeeStates[] }> {
    return this.http.get<{ success: boolean; data: IPayeeStates[] }>(
      `${this.ROOT_URL}/states?country_code=${country_code}&state_name=${state_name}`
    );
  }
}

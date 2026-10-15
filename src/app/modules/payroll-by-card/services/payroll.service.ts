import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import {
  Observable,
  Subject,
  BehaviorSubject,
  ReplaySubject,
  catchError
} from 'rxjs';
import { IApiRes, IApiResMesssage } from 'src/app/models/api';
import { IBankAccountEditDetails, IBankDropdown } from 'src/app/models/bank';
import { environment } from 'src/environments/environment';
import { UserPermissionAlertService } from 'src/app/shared/service/permission/user-permission-alert.service';
import { MatDialog } from '@angular/material/dialog';
import { IFreeAgentData } from '../../integration/model/integration';
import { IExistingCreditCards } from '../../../models/payment-switch-board';
import {
  IAdditionalFee,
  IEditGrossPay,
  IPayrollApps,
  IPayrollBody,
  IPayrollSettings,
  IRunKybBypass,
  IServiceFee,
  ITransactionData
} from '../../payroll/model/payroll';
import { ExistingBusinessComponent } from '../../cloud-bank/cloud-bank-v2/modals/existing-business/existing-business.component';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare let MergeLink: any;

/**
 * Number of past days a payroll check date can be back dated to. Shared by the
 * add payroll modal and the payroll table date cell, in both V3 and V4, so the
 * `min` on the date input, the validator and the error message all stay in sync.
 */
export const PAYROLL_DATE_LIMIT = 15;

export const payrollFees = {
  additionalWireFee: 10,
  additionalAchFee: 0.2
};

export const payrollSamples = [
  {
    name: 'paychexWireTransfer',
    logo: '/assets/images/integration/paychex.png',
    samplePdf: '',
    width: 'w-[70px]'
  },
  {
    name: 'gustoPaymentStatement',
    logo: '/assets/images/integration/Gusto_text.png',
    samplePdf: '',
    width: 'w-[50px]'
  },
  {
    name: 'adpPayrollSummary',
    logo: '/assets/images/integration/adp-logo1.png',
    samplePdf: '',
    helpVideo: 'https://www.youtube.com/watch?v=1CgEVhBZ_hM',
    width: 'w-[30px]'
  }
];
@Injectable({
  providedIn: 'root'
})
export class PayrollService {
  private userPermissionService = inject(UserPermissionAlertService);

  ROOT_URL = environment.rootUrl;
  previousToken: string;
  publicToken: string;
  isConnectedSuccess = new Subject<boolean>();
  payrollAppId = new ReplaySubject<IPayrollApps>(1);
  amountChangeSubject = new Subject<{
    amount: number;
    rowIndex: number | null;
  }>();

  resetPayrollDetails = new Subject<boolean>();
  gatewayTypeChanged = new Subject<number | undefined>();
  addNewCard = new Subject<IExistingCreditCards | null>();
  showDuplicateCard = new Subject<IExistingCreditCards | undefined>();

  selectedPaymentMethod = new BehaviorSubject<number>(6);
  selectedApp: IPayrollApps;
  selectedBank: IBankAccountEditDetails | IBankDropdown | undefined;
  selectedCardId: IExistingCreditCards | undefined;
  chargeData: { [key: string]: number } = {};
  editedGrossPay: { [key: string]: number } = {};
  kybBypassedUser: number;
  disableMethods: string[] = ['cloud'];
  isSelectedPaymentDisabled = false;
  payrollStatementApplicationSuccess = new Subject<boolean>();
  checkPaymentMethodAllowedToUse = new BehaviorSubject<boolean>(false);
  creditCardFee: number;
  isNoSearchResult = new Subject<boolean>();
  isWireRoutingSkipped = signal<boolean>(false);
  selectedPayrollBank = signal<IBankDropdown | undefined>(undefined);

  private dialog = inject(MatDialog);

  constructor(private http: HttpClient) {}

  /**
   * @description - Integrates a 3rd party application through the MergeLink using the provided token and app name.
   * @param token -The token for integrating the 3rd party application.
   * @param app - The name of the 3rd party application.
   */
  mergeLink(token: string): void {
    if (token) {
      MergeLink.linkToken = '';
      MergeLink.initialize({
        linkToken: token,
        onSuccess: (public_token: string) => this.onSuccesss(public_token),
        shouldSendTokenOnSuccessfulLink: false
      });
      MergeLink.openLink();
      const iframe = document.getElementById(
        'merge-link-iframe'
      ) as HTMLIFrameElement;
      if (iframe && iframe.style.display === 'none') {
        iframe.style.display = 'block';
      }
    }
  }

  /**
   * @description Handles the success callback after obtaining a token from MergeLink.
   * If the token is the same as the previous token, it returns early.
   * Updates the previous token with the current token.
   * Sets the public token and performs further actions if a token is available.
   * Sends the account token, notifies the successful connection, and unsubscribes from the accountToken subscription.
   *
   * @param  token - The public token obtained from MergeLink.
   * @param  app - The name of the application.
   */
  onSuccesss(token: string): void {
    if (token === this.previousToken) {
      return;
    }
    this.previousToken = token;

    this.publicToken = token;
    if (token) {
      const accountToken = this.sendAccountToken(token).subscribe(() => {
        this.isConnectedSuccess.next(true);

        accountToken.unsubscribe();
      });
    }
  }

  /**
   * @description Sends the account token to the backend API for connecting with a third-party application.
   * Performs the necessary HTTP request to establish the connection.
   *
   * @param token - The account token to be sent.
   */
  sendAccountToken(token: string): Observable<IApiRes<IFreeAgentData>> {
    return this.http.post<IApiRes<IFreeAgentData>>(
      `${this.ROOT_URL}/integrations/merge/get-unified-account-token/${token}`,
      {}
    );
  }

  /**
   * @description Fetches the details of payroll applications from the server.
   *
   */
  getPayrollDetails(): Observable<IApiRes<IPayrollApps[]>> {
    return this.http
      .get<
        IApiRes<IPayrollApps[]>
      >(`${this.ROOT_URL}/integrations/merge/get-payroll-apps`)
      .pipe(
        catchError((error) => {
          this.userPermissionService.handleErrorsAndPermissions(error, () => {
            this.userPermissionService.payrollDetails(error);
          });
          throw error;
        })
      );
  }

  /**
   * @description -Adds a manual payroll system for a business.
   * @param businessId -The business ID to associate the manual payroll system with.
   *
   */
  addManualPayroll(
    businessId: { businessId: string } | { adpRunUser: number } | IRunKybBypass
  ): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/integrations/merge/create-manual-payroll-system`,
      businessId
    );
  }

  /**
   * @description -Adds a manual payroll system for a business.
   * @param businessId -The business ID to associate the manual payroll system with.
   *
   */
  addManualPayrollData(body: object): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/integrations/merge/create-manual-payroll`,
      body
    );
  }

  getFeeDetails(): Observable<IApiRes<IServiceFee>> {
    return this.http.get<IApiRes<IServiceFee>>(
      `${this.ROOT_URL}/payment-methods/card/service-fee-percentage`
    );
  }

  /**
   * @description - Sync Payroll data.
   * @param appId -The app ID to associate the  payroll system with.
   *
   */
  syncPayrollData(appId: string): Observable<IApiResMesssage> {
    return this.http.get<IApiResMesssage>(
      `${this.ROOT_URL}/integrations/merge/sync_data/${appId}`
    );
  }

  /**
   * Importing payroll data in backend with company id.
   * @param companyId - company id
   * @returns - standart api response with message
   */
  importPayrollData(companyId: string) {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/integrations/gusto/import-payroll`,
      {
        companyId
      }
    );
  }

  /**
   * Importing zoho payroll data in backend with company id.
   * @param companyId - company id
   * @returns - standart api response with message
   */
  importZohoPayrollData(companyId: string) {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/integrations/zoho-payroll/import-payroll`,
      {
        companyId
      }
    );
  }

  /**
   * @description - Saves payroll settings for a specific app.
   * @param body - The payroll settings data to be saved.
   * @param appId - The ID of the app for which the settings are being saved.
   */
  savePayrollSetttings(
    body: IPayrollSettings,
    appId: string
  ): Observable<{ success: boolean; update_wire_routing_number: number }> {
    return this.http.post<{
      success: boolean;
      update_wire_routing_number: number;
    }>(
      `${this.ROOT_URL}/integrations/merge/save-payroll-app-settings/${appId}`,
      body
    );
  }

  /**
   * @description -Retrieves payroll settings for a specific app.
   * @param appId -The ID of the app for which the settings are being retrieved.
   */
  getPayrollSettings(
    appId: string,
    isManual: number
  ): Observable<IApiRes<IPayrollSettings>> {
    return this.http.get<IApiRes<IPayrollSettings>>(
      `${this.ROOT_URL}/integrations/merge/payroll-app-settings/${appId}?manual=${isManual}`
    );
  }

  /**
   *@description -Initiates a payroll transaction for a specific app.
   * @param paymentBody - The payment details for the transaction.
   * @param id - The ID of the app for which the payroll transaction is being processed.
   */
  payrollTransaction(
    paymentBody: IPayrollBody,
    id: string
  ): Observable<IApiRes<string>> {
    return this.http.post<IApiRes<string>>(
      `${this.ROOT_URL}/payment-methods/payroll/${id}/process`,
      paymentBody
    );
  }

  /**
   * @description -Retrieves payroll trasaction details for a specific transaction.
   * @param appId -The ID of the transaction for which the details are being retrieved.
   */
  getPayrollTransactionDetails(
    paymentId: string
  ): Observable<IApiRes<ITransactionData>> {
    return this.http.get<IApiRes<ITransactionData>>(
      `${this.ROOT_URL}/payment-methods/payroll/transactions/${paymentId}`
    );
  }

  /**
   * @description - Service method for payroll statement verification.
   * @param data - Data to be passed to the backend.
   * @param bankAccountId - id of the baank account to be verified.
   */
  verifyPayrollStatement(bankAccountId: string, data: FormData) {
    return this.http.post<{ success: boolean }>(
      `${this.ROOT_URL}/bank-accounts/payroll-bank/${bankAccountId}/upload-statement`,
      data
    );
  }

  /**
   * @description Used to update gross pay amount.
   * @param appId The ID of the transaction for which the details are being retrieved.
   * @param data Data to be passed to the backend.
   */
  updateGrossPayAmount(
    appId: string,
    data: IEditGrossPay
  ): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(
      `${this.ROOT_URL}/integrations/merge/update/${appId}/payroll`,
      data
    );
  }

  /**
   * @description Method for getting attachment.
   */
  getAttachment(id: string): Observable<{ success: boolean; data: string }> {
    return this.http.get<{ success: boolean; data: string }>(
      `${this.ROOT_URL}/integrations/merge/attachments/${id}`
    );
  }

  openBusinessListModal(): void {
    this.dialog.open<ExistingBusinessComponent>(ExistingBusinessComponent, {
      maxWidth: '440px',
      width: '95%',
      disableClose: true,
      autoFocus: false,
      data: { from: 'payroll' }
    });
  }

  connectToPaychex(displayId: string): Observable<
    IApiRes<{
      Link: string;
      msg: string;
      errorCode: number;
    }>
  > {
    return this.http.get<
      IApiRes<{
        Link: string;
        msg: string;
        errorCode: number;
      }>
    >(`${this.ROOT_URL}/integrations/paychex/connect?displayId=${displayId}`);
  }

  confirmPaychexConnection(
    displayID: string
  ): Observable<IApiRes<{ is_connected: number }>> {
    return this.http.get<IApiRes<{ is_connected: number }>>(
      `${this.ROOT_URL}/integrations/paychex/is-company-connected?displayId=${displayID}`
    );
  }

  deletePayroll(id: string): Observable<IApiResMesssage> {
    return this.http.delete<IApiResMesssage>(
      `${this.ROOT_URL}/integrations/merge/delete-manual-payroll/${id}`
    );
  }

  chromeExtensionKey(
    payload: {
      companyId: string;
      manual: number;
    },
    type: 'get' | 'generate'
  ) {
    return this.http.post<IApiRes<string>>(
      `${this.ROOT_URL}/integrations/payroll-chrome-extension/${type}-key`,
      payload
    );
  }

  /**
   * API function for setting user WIRE routing number
   */
  addWireRouting(data: {
    bankAccountId: string;
    wireRoutingNumber: string;
  }): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.ROOT_URL}/bank-accounts/update-bank`,
      data
    );
  }

  downloadTransaction(transactionId: string) {
    return this.http.post<IApiRes<string>>(
      `${this.ROOT_URL}/payment-methods/payroll/transactions/${transactionId}/download`,
      {}
    );
  }

  getAdditionalFee(payload:{
    transfer_type:string,
    transaction_type:number,
    transaction_amount:number,
  }): Observable<IAdditionalFee> {
    return this.http.post<IAdditionalFee>(
      `${this.ROOT_URL}/payment-methods/card/additional-fee`,
      payload
    );
  }

}

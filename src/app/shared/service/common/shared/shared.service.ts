import { IApiRes, IApiResMesssage } from 'src/app/models/api';
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import {
  IGetAttachment,
  IGetComment,
  IGetRemitance
} from 'src/app/models/common';
import { IRemittanceDetails } from 'src/app/models/bank';
import { IBusinessList, IShippingTypes } from 'src/app/modules/business-tools/plexe/model/plexe';
import { ICashExpenseActivity } from 'src/app/modules/Cash-Expense/model/CashExpense';
import { ICheckComments } from 'src/app/models/v3-datatable';
import {
  IQBOImportData,
  IQBOSettingsData
} from 'src/app/modules/integration/model/integration';
import {
  ICheckAttachmentData,
  IQuickBookBody,
  IQuickBookOnlineChecksResponse
} from 'src/app/modules/check/model/check';
import { FormControl } from '@angular/forms';
import { IPayeeDropdown } from 'src/app/modules/payee/payee-v2/model/payee';
import { IGetBills } from 'src/app/modules/bill/model/Bill';

@Injectable({
  providedIn: 'root'
})
export class SharedService {
  private _router = inject(Router);

  ROOT_URL = environment.rootUrl;

  newBankCreatedId$ = new BehaviorSubject<any>(null); //This subject is being used in many components. So setting type and changing null is a huge change, as it requires changes in many components. So skipping for now.
  newCategoryCreatedId$ = new BehaviorSubject<any>([]);
  newPayeeCreatedId$ = new BehaviorSubject<any>([]);
  newDateCreatedId$ = new BehaviorSubject<any>('');
  newInvoiceItemCreatedId$ = new BehaviorSubject<any>([]);
  refresher = new BehaviorSubject<any>([]);
  vgsResponse$ = new BehaviorSubject<any>([]);
  canApplyForCloud$ = new BehaviorSubject<any>([]);
  dateChanged$ = new BehaviorSubject<any>([]);
  InternationalPaychanged$ = new BehaviorSubject<any>([]);
  selectedPayeeRemover$ = new BehaviorSubject<boolean>(false);
  recivesdData: any;
  editDebitCardDetails$ = new BehaviorSubject<boolean>(false);
  selectedPayees: FormControl<IPayeeDropdown[]> = new FormControl();

  private previousUrl: string;
  private currentUrl: string;
  private previousUrl2: string;
  enabledForProcessNow = false;
  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.serCurrentUrl();
  }

  /**
   * @description this service used for remove selected payee from common payee dropdown
   * @returns
   */
  getPayeeData(): Observable<boolean> {
    return this.selectedPayeeRemover$;
  }

  addNonCheckAttachment(attachment: File, id: number | string) {
    const formData = new FormData();
    formData.append('image', attachment);
    return this.http.post<IApiRes<ICheckAttachmentData>>(
      `${this.ROOT_URL}/zil-payments/${id}/attachments`,
      formData
    );
  }

  /**
   * @description this service used for remove selected payee from common payee dropdown
   * @returns
   */
  setPayeeData(data: boolean): void {
    this.selectedPayeeRemover$.next(data);
  }

  //............bank..................

  getNewBankCreatedData(): Observable<any> {
    return this.newBankCreatedId$;
  }

  /**
   * @description -API function for New Bank Account modal submission.
   * @param data _Payload for the API
   */
  setNewBankCreatedData(data?: unknown): void {
    this.newBankCreatedId$.next(data);
  }

  //............payee..................

  getNewPayeeCreatedData(): Observable<any> {
    return this.newPayeeCreatedId$;
  }

  setNewPayeeCreatedData(data: any): void {
    this.newPayeeCreatedId$.next(data);
  }

  //............category..................

  getNewCategoryCreatedData(): Observable<any> {
    return this.newCategoryCreatedId$;
  }

  setNewCategoryCreatedData(data: any): void {
    this.newCategoryCreatedId$.next(data);
  }
  //............date....................

  //...........................................................................

  setData(data: any): void {
    this.recivesdData = data;
  }

  getData(): void {
    return this.recivesdData;
  }

  //............Invoice..................

  getNewDate(): Observable<any> {
    return this.newDateCreatedId$;
  }

  setNewDate(id: any): void {
    this.newDateCreatedId$.next(id);
  }

  //............Invoice..................
  getNewInvoiceItemCreatedData(): Observable<any> {
    return this.newInvoiceItemCreatedId$;
  }

  setNewInvoiceItemCreatedData(id: any): void {
    this.newInvoiceItemCreatedId$.next(id);
  }

  //=====================cloud bank===========
  getVgsResponse(): Observable<any> {
    return this.vgsResponse$;
  }

  setVgsResponse(data: any): void {
    this.vgsResponse$.next(data);
  }

  //=====check can apply cloud bank========
  getCanApplyForCloudBank(): Observable<any> {
    return this.canApplyForCloud$;
  }

  setCanApplyForCloudBank(data: any): void {
    this.canApplyForCloud$.next(data);
  }

  //===========change date formate to mm/ddyyyy======

  getDateChanged(): Observable<any> {
    return this.dateChanged$;
  }

  setDateChanged(data: any): void {
    this.dateChanged$.next(data);
  }

  //............ Attachment ..................

  /**
   * @description -API function for Add a new attachment.
   * @param type -Payload for the API
   * @param id -Payload for the API
   * @param data -payload for the API
   */
  addAttachment(
    type: string,
    id: string | number,
    data: FormData
  ): Observable<IApiRes<IGetAttachment>> {
    return this.http.post<IApiRes<IGetAttachment>>(
      `${this.ROOT_URL}/${type}/${id}/attachments`,
      data
    );
  }

  /**
   * @description -API function for Retrieve the attachments for the current type and ID.
   * @param type -Payload for the API
   * @param id -Payload for the API
   */
  getAttachment(
    type: string,
    id: string | number
  ): Observable<IApiRes<IGetAttachment[]>> {
    return this.http.get<IApiRes<IGetAttachment[]>>(
      `${this.ROOT_URL}/${type}/${id}/attachments`
    );
  }

  openAttachment(
    type: string,
    id: string | number,
    attachmentId: string
  ): Observable<IApiRes<string>> {
    return this.http.get<IApiRes<string>>(
      `${this.ROOT_URL}/${type}/${id}/attachments/${attachmentId}`
    );
  }

  /**
   * @description -API function for Delete an attachment.
   * @param type -Payload for the API
   * @param id -Payload for the API
   * @param attachmentId -Payload for the API
   */
  deleteAttachment(
    type: string,
    id: string | number,
    attachmentId?: string
  ): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(
      `${this.ROOT_URL}/${type}/${id}/attachments/${attachmentId}`
    );
  }

  //............ comments ..................
  addComment(
    type: string,
    id: string | number,
    data: { comment: string }
  ): Observable<IApiRes<IGetComment>> {
    return this.http.post<IApiRes<IGetComment>>(
      `${this.ROOT_URL}/${type}/${id}/comments`,
      data
    );
  }

  /**
   * @description - Retrieves comments for a Zil Payment identified by the given ID.
   * @param id - The ID of the Zil Payment.
   */
  getZilPaymentsComments(
    id: string | number
  ): Observable<IApiRes<IGetComment[]>> {
    return this.http.get<IApiRes<IGetComment[]>>(
      `${this.ROOT_URL}/zil-payments/${id}/comments`
    );
  }

  /**
   * @description - Retrieves remitance for a Zil Payment identified by the given ID.
   * @param id - The ID of the Zil Payment.
   */
  getZilPaymentsRemitance(id: string): Observable<IApiRes<IGetRemitance>> {
    return this.http.get<IApiRes<IGetRemitance>>(
      `${this.ROOT_URL}/zil-payments/${id}/remittances`
    );
  }

  /**
   * @description - Update comments for a Zil Payment identified by the given ID.
   * @param id - The ID of the Zil Payment.
   */
  updateZilRemitance(
    body: { amount: number | undefined; items: IRemittanceDetails[] },
    id: string
  ): Observable<IApiRes<IGetComment>> {
    return this.http.post<IApiRes<IGetComment>>(
      `${this.ROOT_URL}/zil-payments/${id}/remittances`,
      body
    );
  }

  getAllComments(
    type: string,
    id: string | number
  ): Observable<IApiRes<IGetComment[] | ICheckComments[]>> {
    return this.http.get<IApiRes<IGetComment[] | ICheckComments[]>>(
      `${this.ROOT_URL}/${type}/${id}/comments`
    );
  }

  deleteComment(
    type: string,
    id: string | number,
    data: string
  ): Observable<IApiResMesssage> {
    return this.http.delete<IApiResMesssage>(
      `${this.ROOT_URL}/${type}/${id}/comments/${data}`
    );
  }

  //Device
  getDeviceData(
    deviceAddress: string
  ): Observable<IApiRes<{ deviceAddress: string; deviceName: string }>> {
    return this.http.get<
      IApiRes<{ deviceAddress: string; deviceName: string }>
    >(`${this.ROOT_URL}/devices/${deviceAddress}`);
  }

  postDeviceData(data: any): Observable<any> {
    return this.http.post<any>(`${this.ROOT_URL}/devices`, data);
  }

  //................Audit trail ................//
  getAuditTrail(
    type: string,
    id: string,
    suffix?: string
  ): Observable<IApiRes<ICashExpenseActivity[]>> {
    return this.http.get<IApiRes<ICashExpenseActivity[]>>(
      `${this.ROOT_URL}/${type}/${id}/${suffix ?? 'activities'}`
    );
  }

  //............ Import From Quick Books ..................
  getImportFromQuickBookData(): Observable<IApiRes<IQBOImportData[]>> {
    return this.http.get<IApiRes<IQBOImportData[]>>(
      `${this.ROOT_URL}/quickbooks-online-imports`
    );
  }

  postImportFromQuickBookData(
    body: IQuickBookBody
  ): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(
      `${this.ROOT_URL}/quickbooks-online-imports`,
      body
    );
  }

  getQuickBookOnlineChecks(body:{realmIds: string[], importTime: string, type: string[]}) {
    return this.http.post<IApiRes<IQuickBookOnlineChecksResponse>>(
      `${this.ROOT_URL}/quickbooks-online-imports/list-items`,
      body
    );
  }

  deleteQuickBookImportItems(ids: string[]) {
    return this.http.delete<IApiResMesssage>(
      `${this.ROOT_URL}/quickbooks-online-imports/import-item`,
      { body: { ids } }
    );
  }

  getTrialExpiredStats(): Observable<any> {
    return this.http.get(
      `${this.ROOT_URL}/dashboard/data-new/trial-expired-stats`
    );
  }

  getSettingData(): Observable<IApiRes<IQBOSettingsData>> {
    return this.http.get<IApiRes<IQBOSettingsData>>(
      `${this.ROOT_URL}/integrations/quickbooks-online/settings`
    );
  }

  // get current url for finding previous url
  serCurrentUrl(): void {
    this.currentUrl = this.router.url;
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.previousUrl2 = this.previousUrl;
        this.previousUrl = this.currentUrl;
        this.currentUrl = event.url;
      }
    });
  }

  public getPreviousUrl() {
    return this.previousUrl;
  }

  /**
   * Function to navigate back or to a default URL.
   */
  goBack() {
    if (
      this.previousUrl &&
      this.previousUrl != this.currentUrl &&
      this.previousUrl2 != this.currentUrl
    ) {
      this._router.navigateByUrl(this.previousUrl);
    } else {
      this._router.navigate(['/manage/home']);
    }
  }

  /**
   * @description This service return the list of business.
   * @returns {Observable<IApiRes<IBusinessList[]>>} An observable that emits an API response containing an array of business lists.
   */
  getVerifiedBusiness(): Observable<IApiRes<IBusinessList[]>> {
    return this.http.get<IApiRes<IBusinessList[]>>(
      `${this.ROOT_URL}/working-capital/on-board/kyb`
    );
  }

  /**
   * @description Function allows user to paste otp on the field
   * @param event - event occured on the field
   */
  onPaste(event: ClipboardEvent): void {
    const pastedText = event.clipboardData?.getData('text');
    if (!isNaN(Number(pastedText))) {
      if (pastedText) {
        const lastIndex = pastedText.length - 1;
        const otpArray = pastedText.split('');
        // V3: id-based inputs (otp0, otp1 …); V4: class-based inputs (otp_box_v4)
        const v4Inputs = document.querySelectorAll<HTMLInputElement>('input.otp_box_v4');
        const useV4 = v4Inputs.length > 0;
        otpArray.forEach((num, index) => {
          const field = useV4
            ? v4Inputs[index]
            : (document.getElementById(`otp${index}`) as HTMLInputElement);
          if (field) {
            if (index === lastIndex) {
              field.select();
            }
            field.value = num;
          }
        });
      }
    }
  }

  getWalletShippingTypes(): Observable<IApiRes<IShippingTypes[]>> {
    return this.http.get<IApiRes<IShippingTypes[]>>(
      `${this.ROOT_URL}/zil-payments/check-mail/get-shipping-type`
    );
  }

  //............ Bills ..................

  getBills(page: number, term: string): Observable<IApiRes<IGetBills>> {
    return this.http.get<IApiRes<IGetBills>>(
      `${this.ROOT_URL}/get-bills?page=${page}&term=${term}`
    );
  }

}

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  Subject,
  Subscription,
  catchError
} from 'rxjs';
import { environment } from 'src/environments/environment';
import {
  IpushBackEnableBody,
  IQBDCompanyDetails,
  ILocation,
  IQBOPushBackEnable
} from 'src/app/modules/integration/model/integration';
import {
  IAttachmentFromPhoneCheckDetails,
  ICheckAttachmentData,
  ICheckShipingTypes,
  IDirectDepositData,
  IShipingCheckPaperType,
  IMailBulkShippingAddress,
  IMailSingleShippingAddress,
  IMultipleCheckImportEqStep2,
  IMultipleCheckImportEqStep4,
  IMultipleCheckImportEqStep1,
  ICheckCustomMetaData,
  ICheckDetailsData,
  ICreateCheck,
  INewCheck,
  ICheckStatus,
  ICheckPayee,
  IMultiCheckImport,
  IImportCheckData,
  ICheckData,
  ICheckMailTrackDetails,
  IAchBody,
  IShippingCostCalculation,
  ICheckSummary,
  IMultiCheckEditData,
  IProcessCheckPayload,
  IProcessCheck,
  ICheckProcessData,
  ICheckListTabs,
  ICheckListData,
  IMailingSettingsActivities,
  IReconciliationData,
  IReconciliationCheckStep3Data,
  IChequedata,
  IMailShippingCalculations,
} from 'src/app/modules/check/model/check';
import { MailTrackingModalComponent } from 'src/app/modules/check/components/mail-tracking-modal/mail-tracking-modal.component';
import { V4MailTrackingModalComponent } from 'src/app/modules/check/components/v4-mail-tracking-modal/v4-mail-tracking-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { LocalStorageService } from '../storage/local-storage.service';
import { finalize } from 'rxjs/operators';
import { INetSuitePushBack } from 'src/app/modules/integration/netsuite/model/netsuite';
import { IUploadFromPhoneResponse } from 'src/app/models/bank';
import { getMailTrackUrl } from 'src/app/shared/utils/v4-external.util';
import { IApiRes, IApiResMesssage, IApiResMesssageWithPayments, IApiResWithMsg } from './../../../models/api';
import { UserPermissionAlertService } from '../permission/user-permission-alert.service';

@Injectable({
  providedIn: 'root'
})
export class CheckService {
  private userPermissionService = inject(UserPermissionAlertService);
  private localStorageService = inject(LocalStorageService);
  private http = inject(HttpClient);

  ROOT_URL = environment.rootUrl;
  checkTrackingUrls = new BehaviorSubject<any>(null);
  private _checkMailEvents = new Subject<{
    isSuccess?: boolean;
    emailType?: 'immediate' | 'recurring' | 'scheduled';
    scheduledDate?: string;
    recurringDetails?: {
      frequency: string;
      startDate: string;
      endCriteria: string;
    };
  }>();
  
  // private _checkMailEvents = new Subject<{ isSuccess?: boolean }>();
  private totalCheckSumSubject = new BehaviorSubject<number | null>(null);
  private totalCheckSumPayeeIdsSubject = new BehaviorSubject<(string | number)[]>([]);
  checkData: ICheckDetailsData;
  activeMailPayeeId: string | null = null;

  private dialog = inject(MatDialog);
  subscription: Subscription[] = [];
  isLoading = false;

  public getCheckMailEvents() {
    return this._checkMailEvents.asObservable();
  }

  public setCheckMailEvents(value: {
    isSuccess?: boolean;
    emailType?: 'immediate' | 'recurring' | 'scheduled';
    scheduledDate?: string;
    recurringDetails?: {
      frequency: string;
      startDate: string;
      endCriteria: string;
    };
  }) {
    this._checkMailEvents.next(value);
  }

  getTotalCheckSumUpdates() {
    return this.totalCheckSumSubject.asObservable();
  }

  setTotalCheckSumValue(value: number) {
    this.totalCheckSumSubject.next(value);
  }

  getTotalCheckSumPayeeIds() {
    return this.totalCheckSumPayeeIdsSubject.getValue();
  }

  setTotalCheckSumPayeeIds(payeeIds: (string | number)[]) {
    this.totalCheckSumPayeeIdsSubject.next(payeeIds);
  }

  getChecksById(
    checkId: string,
    headerOption?: HttpHeaders
  ): Observable<IApiRes<ICheckDetailsData>> {
    return this.http.get<IApiRes<ICheckDetailsData>>(
      `${this.ROOT_URL}/checks/${checkId}`,
      { headers: headerOption }
    );
  }

  createCheck(checkData: INewCheck): Observable<IApiRes<ICreateCheck>> {
    return this.http
      .post<IApiRes<ICreateCheck>>(`${this.ROOT_URL}/checks`, checkData)
      .pipe(
        catchError((error) => {
          this.userPermissionService.handleErrorsAndPermissions(error, () => {});
          throw error;
        })
      );
  }

  createBlankChecks(blankCheckBody: FormData): Observable<IApiRes<string>> {
    return this.http
      .post<IApiRes<string>>(`${this.ROOT_URL}/blank-checks`, blankCheckBody)
      .pipe(
        catchError((error) => {
          this.userPermissionService.handleErrorsAndPermissions(error, () => {
            this.userPermissionService.blankCheckPermission(error);
          });
          throw error;
        })
      );
  }

  updateCheck(
    checkId: string,
    checkBody: INewCheck
  ): Observable<IApiRes<{ id: string }>> {
    return this.http.put<IApiRes<{ id: string }>>(
      `${this.ROOT_URL}/checks/${checkId}`,
      checkBody
    );
  }

  getCheckStatus() {
    return this.http.get<IApiRes<Record<string, ICheckStatus>>>(
      `${this.ROOT_URL}/status/checks`
    );
  }

  deleteCheck(checkId: string): Observable<IApiResMesssage> {
    return this.http
      .delete<IApiResMesssage>(`${this.ROOT_URL}/checks/${checkId}`)
      .pipe(
        catchError((error) => {
          this.userPermissionService.handleErrorsAndPermissions(error, () => {
            this.userPermissionService.deleteCheckPermission(error);
          });
          throw error;
        })
      );
  }

  deleteMulitpleCheck(checkIds: {
    ids: string[];
  }): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/checks/multi/delete`,
      checkIds
    );
  }

  voidCheck(checkId: string): Observable<IApiResMesssage> {
    return this.http
      .post<IApiResMesssage>(`${this.ROOT_URL}/checks/${checkId}/void`, checkId)
      .pipe(
        catchError((error) => {
          this.userPermissionService.handleErrorsAndPermissions(error, () => {
            this.userPermissionService.voidCheckPermission(error);
          });
          throw error;
        })
      );
  }

  voidmultipleCheck(checkIds: { ids: string[] }): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/checks/multi/voids`,
      checkIds
    );
  }

  getCheckRemiitanceItems(
    page: number,
    term: string | number
  ): Observable<IApiRes<{ items: string[] }>> {
    return this.http.get<IApiRes<{ items: string[] }>>(
      `${this.ROOT_URL}/checks/remittance-items?page=${page}&&term=${term}`
    );
  }

  getPayeeSummary(payeeId: string): Observable<ICheckPayee> {
    return this.http.get<ICheckPayee>(
      `${this.ROOT_URL}/payees/${payeeId}/summary`
    );
  }

  // IMPORT CHECKS

  getTemplates(source: 'checks-import' | 'wallet-checks' = 'checks-import'): Observable<IApiRes<IMultipleCheckImportEqStep1>> {
    return this.http.get<IApiRes<IMultipleCheckImportEqStep1>>(
      `${this.ROOT_URL}/imports/${source}/step1/`
    );
  }

  enterpriseMultiImport(body: FormData): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/imports/checks-import/milwaukee/step1`,
      body
    );
  }

  multiImportStep2(body: FormData): Observable<IApiRes<IMultiCheckImport>> {
    return this.http.post<IApiRes<IMultiCheckImport>>(
      `${this.ROOT_URL}/imports/checks-import/step2`,
      body
    );
  }

  multiImportStep3(body: {
    mapping: string[];
    uploadFromImport: string;
    proceedForCheckNumber?: number;
  },
  source: 'checks-import' | 'wallet-checks' = 'checks-import'
  ): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/imports/${source}/step3`,
      body
    );
  }

  multiImportStep4(source: 'checks-import' | 'wallet-checks' = 'checks-import'): Observable<IApiRes<IImportCheckData[]>> {
    return this.http.get<IApiRes<IImportCheckData[]>>(
      `${this.ROOT_URL}/imports/${source}/step4`
    );
  }

  multiImportStep5(body: {
    entry: string[];
  },
  source: 'checks-import' | 'wallet-checks' = 'checks-import'
  ): Observable<IApiResMesssageWithPayments> {
    return this.http.post<IApiResMesssageWithPayments>(
      `${this.ROOT_URL}/imports/${source}/step5`,
      body
    );
  }

  saveNewTemplate(body: {
    template: string[];
    nick_name: string;
  }): Observable<IApiRes<string[]>> {
    return this.http.post<IApiRes<string[]>>(
      `${this.ROOT_URL}/imports/checks-import/save-template`,
      body
    );
  }

  // IMPORT CHECKS FROM WALLET
  multiImportStep2FromWallet(body: FormData): Observable<IApiRes<IMultiCheckImport>> {
    return this.http.post<IApiRes<IMultiCheckImport>>(
      `${this.ROOT_URL}/imports/wallet-checks/step2`,
      body
    );
  }

  // IMPORT CHECKS EQ

  /**
   * @description Gettng Templates of User for Eq multiple check import, and also getting a example file. This is the first step
   */
  getTemplatesEq(): Observable<IApiRes<IMultipleCheckImportEqStep1>> {
    return this.http.get<IApiRes<IMultipleCheckImportEqStep1>>(
      `${this.ROOT_URL}/imports/checks-import/eq-checks/step1`
    );
  }

  /**
   * @description Step 2 of Eq multiple check Import passing the File to backend and getting datas in the file as response
   */
  multiImportEqStep2(
    body: FormData
  ): Observable<IApiRes<IMultipleCheckImportEqStep2>> {
    return this.http.post<IApiRes<IMultipleCheckImportEqStep2>>(
      `${this.ROOT_URL}/imports/checks-import/eq-checks/step2`,
      body
    );
  }

  /**
   * @description Step 3 of Eq multiple check Import, Sending Mapping to backend,
   */
  multiImportEqStep3(body: {
    mapping: string[];
    uploadFromImport: 'yes' | 'no';
  }): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.ROOT_URL}/imports/checks-import/eq-checks/step3`,
      body
    );
  }

  /**
   * @description Step 4 of Eq multiple check Import, Getting Mapped and organized data from backend with headers included for each column
   */
  multiImportEqStep4(): Observable<IApiRes<IMultipleCheckImportEqStep4>> {
    return this.http.get<IApiRes<IMultipleCheckImportEqStep4>>(
      `${this.ROOT_URL}/imports/checks-import/eq-checks/step4`
    );
  }

  /**
   * @description Step 5 of Eq multiple check Import, Sending necessary Data to backend and processing check Import, here where the check is being created
   */
  multiImportEqStep5(body: {
    entry: string[];
  }): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.ROOT_URL}/imports/checks-import/eq-checks/step5`,
      body
    );
  }

  /********* HAMASPIK ***********/
  /**
   * @description Gettng Templates of User for Eq multiple check import, and also getting a example file. This is the first step
   */
  gethamaspikTemplates(): Observable<IApiRes<IMultipleCheckImportEqStep1>> {
    return this.http.get<IApiRes<IMultipleCheckImportEqStep1>>(
      `${this.ROOT_URL}/imports/checks-import/hamaspik/step1`
    );
  }

  /**
   * @description Step 2 of Eq multiple check Import passing the File to backend and getting datas in the file as response
   */
  hamaspikImportEqStep2(
    body: FormData
  ): Observable<IApiRes<IMultipleCheckImportEqStep2>> {
    return this.http.post<IApiRes<IMultipleCheckImportEqStep2>>(
      `${this.ROOT_URL}/imports/checks-import/hamaspik/step2`,
      body
    );
  }

  /**
   * @description Step 3 of Eq multiple check Import, Sending Mapping to backend,
   */
  hamaspikImportEqStep3(body: {
    mapping: string[];
    uploadFromImport: 'yes' | 'no';
  }): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.ROOT_URL}/imports/checks-import/hamaspik/step3`,
      body
    );
  }

  /**
   * @description Step 4 of Eq multiple check Import, Getting Mapped and organized data from backend with headers included for each column
   */
  hamaspikImportEqStep4(): Observable<IApiRes<IImportCheckData[]>> {
    return this.http.get<IApiRes<IImportCheckData[]>>(
      `${this.ROOT_URL}/imports/checks-import/hamaspik/step4`
    );
  }

  /**
   * @description Step 5 of Eq multiple check Import, Sending necessary Data to backend and processing check Import, here where the check is being created
   */
  hamaspikImportEqStep5(body: {
    entry: string[];
  }): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.ROOT_URL}/imports/checks-import/hamaspik/step5`,
      body
    );
  }

  /**
   * @description Saving New EQ multi check import template data. template and name should be passed to backend
   * @param body
   * @returns
   */
  saveNewHamaspikTemplate(body: {
    template: string[];
    nick_name: string;
  }): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.ROOT_URL}/imports/checks-import/hamaspik/save-template`,
      body
    );
  }

  /**
   * @description Saving New EQ multi check import template data. template and name should be passed to backend
   * @param body
   * @returns
   */
  saveNewEqTemplate(body: {
    template: string[];
    nick_name: string;
  }): Observable<any> {
    return this.http.post(
      `${this.ROOT_URL}/imports/checks-import/eq-checks/save-template`,
      body
    );
  }

  multiImportTxtToCheckstep1(body: FormData): Observable<IApiRes<any[]>> {
    return this.http.post<IApiRes<any[]>>(
      `${this.ROOT_URL}/imports/checks-import/text-file/step1`,
      body
    );
  }

  multiImportTxtToCheckGetLatest(): Observable<
    IApiRes<{ rows: any[]; rowCount: number; totalAmount: number }>
  > {
    return this.http.get<
      IApiRes<{ rows: any[]; rowCount: number; totalAmount: number }>
    >(`${this.ROOT_URL}/imports/checks-import/text-file/step2`);
  }

  multiImportTxtToCheckLastStep(body: {
    entry: string[];
  }): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/imports/checks-import/text-file/step3`,
      body
    );
  }

  getTemplateMapping(templateId: string): Observable<any> {
    return this.http.get(
      `${this.ROOT_URL}/imports/import-templates/multi_import_data/${templateId}`
    );
  }

  postMultipleChecks(body: any, isGroup?: boolean): Observable<any> {
    let url = `${this.ROOT_URL}/multiple-cheques`;
    if (isGroup) {
      url += '?group-payment=true';
    }
    return this.http.post(url, body);
  }

  postGroupChecks(body: any): Observable<any> {
    return this.http.post(`${this.ROOT_URL}/cheque-groups`, body);
  }

  deleteGroup(groupIds: string[]): Observable<any> {
    return this.http.delete(`${this.ROOT_URL}/cheque-groups`, {
      body: { ids: groupIds }
    });
  }

  getEditChequeGroup(
    groupId: string
  ): Observable<IApiRes<IMultiCheckEditData[]>> {
    return this.http.get<IApiRes<IMultiCheckEditData[]>>(
      `${this.ROOT_URL}/cheque-groups/${groupId}`
    );
  }

  updateGroup(groupId: string, body: any): Observable<any> {
    return this.http.put(`${this.ROOT_URL}/cheque-groups/${groupId}`, body);
  }

  markAsClearedCheck(checkIds: any): Observable<any> {
    return this.http.post<any>(
      `${this.ROOT_URL}/checks/multi/mark-as-cleared`,
      checkIds
    );
  }

  getEmails(body: any): Observable<any> {
    return this.http
      .post<any>(`${this.ROOT_URL}/email-checks/get-data`, body)
      .pipe(
        catchError((error) => {
          this.userPermissionService.handleErrorsAndPermissions(error, () => {
            this.userPermissionService.emailCheckPermission(error);
          });
          throw error;
        })
      );
  }

  sendEmail(body: any, headerOption?: HttpHeaders): Observable<any> {
    return this.http.post(`${this.ROOT_URL}/email-checks/`, body, {
      headers: headerOption
    });
  }

  reEmailCheck(checkId: string): Observable<IApiResMesssage> {
    return this.http
      .post<IApiResMesssage>(`${this.ROOT_URL}/email-checks/re-email-check/`, {
        checkId
      })
      .pipe(
        catchError((error) => {
          this.userPermissionService.handleErrorsAndPermissions(error, () => {
            this.userPermissionService.emailCheckPermission(error);
          });
          throw error;
        })
      );
  }

  /***************************************** Mail **********************************************/

  // Custom Address From

  getAddressFrom(headerOption?: HttpHeaders): Observable<IApiRes<Array<IMailBulkShippingAddress>>> {
    return this.http.get<IApiRes<Array<IMailBulkShippingAddress>>>(
      `${this.ROOT_URL}/cheques/from-address`,
      { headers: headerOption }
    );
  }

  addMailFrom(data: any): Observable<any> {
    return this.http.post<any>(`${this.ROOT_URL}/cheques/from-address`, data);
  }

  updateMailFrom(id: string, data: any): Observable<any> {
    return this.http.put<any>(
      `${this.ROOT_URL}/cheques/from-address/${id}`,
      data
    );
  }

  getFromSingleId(id: string): Observable<IApiRes<IMailSingleShippingAddress>> {
    return this.http.get<IApiRes<IMailSingleShippingAddress>>(
      `${this.ROOT_URL}/cheques/from-address/${id}`
    );
  }

  deleteAddressFrom(id: string): Observable<any> {
    return this.http.delete<any>(`${this.ROOT_URL}/cheques/from-address/${id}`);
  }

  // Custom Address To

  getAddressTo(headerOption?: HttpHeaders): Observable<IApiRes<Array<IMailBulkShippingAddress>>> {
    return this.http.get<IApiRes<Array<IMailBulkShippingAddress>>>(
      `${this.ROOT_URL}/cheques/to-address`,
      { headers: headerOption }
    );
  }

  updateMailTo(id: string, data: any): Observable<any> {
    return this.http.put<any>(
      `${this.ROOT_URL}/cheques/to-address/${id}`,
      data
    );
  }

  getToSingleId(id: string): Observable<IApiRes<IMailSingleShippingAddress>> {
    return this.http.get<IApiRes<IMailSingleShippingAddress>>(
      `${this.ROOT_URL}/cheques/to-address/${id}`
    );
  }

  addMailTo(data: any): Observable<any> {
    return this.http.post<any>(`${this.ROOT_URL}/cheques/to-address`, data);
  }

  deleteAddressTo(id: string): Observable<any> {
    return this.http.delete(`${this.ROOT_URL}/cheques/to-address/${id}`);
  }

  // Common section

  getShippingType(): Observable<IApiRes<ICheckShipingTypes[]>> {
    return this.http.get<IApiRes<ICheckShipingTypes[]>>(
      `${this.ROOT_URL}/cheques/get-shipping-type`
    );
  }

  getpaperType(): Observable<IApiRes<IShipingCheckPaperType[]>> {
    return this.http.get<IApiRes<IShipingCheckPaperType[]>>(
      `${this.ROOT_URL}/cheques/get-check-paper-type`
    );
  }

  getChequeDetails(data: {
    ids: string[];
    is_signature?: 0 | 1;
  }): Observable<IApiRes<ICheckData['chequedata']>> {
    return this.http
      .post<IApiRes<ICheckData['chequedata']>>(
        `${this.ROOT_URL}/cheques/cheque-details`,
        data,
        { headers: new HttpHeaders({ isDisable422: 'true' }) }
      )
      .pipe(
        catchError((error) => {
          this.userPermissionService.handleErrorsAndPermissions(error, () => {
            this.userPermissionService.maillCheckPermission(error);
          });
          throw error;
        })
      );
  }

  /**
   * @description Getting check Custom details. Some checks may have custom deails like mail type and all. we can get it through this api. check ids should be passed as param
   * @param data
   * @returns
   */
  getChequeCustomDetails(data: {
    cheque_ids: string[];
  }): Observable<IApiRes<ICheckCustomMetaData[]>> {
    return this.http.post<IApiRes<ICheckCustomMetaData[]>>(
      `${this.ROOT_URL}/cheques/checks-custom-data`,
      data
    );
  }

  bankvalidation(data: any): Observable<any> {
    return this.http.post<any>(`${this.ROOT_URL}/cheques/validate/bank`, data);
  }

  payeevalidation(data: any): Observable<any> {
    return this.http.post<any>(`${this.ROOT_URL}/cheques/validate/check`, data);
  }

  //=====>Check Comments
  addCommentCheck(id: any, data: any): Observable<any> {
    return this.http.post<any>(`${this.ROOT_URL}/checks/${id}/comments`, data);
  }

  getAllCheckComments(checkId: string | number): Observable<any> {
    return this.http.get<any>(`${this.ROOT_URL}/checks/${checkId}/comments`);
  }

  //=====>Check Attachments
  getCheckAttachment(
    checkId: string
  ): Observable<IApiRes<ICheckAttachmentData[]>> {
    return this.http.get<IApiRes<ICheckAttachmentData[]>>(
      `${this.ROOT_URL}/checks/${checkId}/attachments`
    );
  }

  deleteCheckAttachment(
    checkId: string,
    attachmentId: string
  ): Observable<any> {
    return this.http.delete(
      `${this.ROOT_URL}/cheques/attachment/${checkId}/${attachmentId}`
    );
  }

  openCheckAttachment(
    checkId: string,
    attachmentId: string
  ): Observable<IApiRes<string>> {
    return this.http.get<IApiRes<string>>(
      `${this.ROOT_URL}/checks/${checkId}/attachments/${attachmentId}`
    );
  }

  viewAttachmentDocument(attachmentId: string): Observable<IApiRes<{ id: string; URL: string; fileName: string }>> {
    return this.http.get<IApiRes<{ id: string; URL: string; fileName: string }>>(
      `${this.ROOT_URL}/cheque-tracking/attachment/${attachmentId}`
    );
  }

  addCheckAttachment(checkId: any, data: any): Observable<any> {
    //add attachment(also accept without check id)
    const formData = new FormData();
    formData.append('attachment', data);
    return this.http.post<any>(
      `${this.ROOT_URL}/checks/${checkId}/attachments`,
      formData
    );
  }

  addAttachmentWithMobileDevice(
    checkId: string,
    data: { phone: string }
  ): Observable<IApiRes<{ url: string; uuid: string }>> {
    return this.http.post<IApiRes<{ url: string; uuid: string }>>(
      `${this.ROOT_URL}/checks/${checkId}/attachment-using-phone`,
      data
    );
  }

  addAttachmentFromMobileDevice(
    formData: FormData
  ): Observable<IApiRes<string[]>> {
    return this.http.post<IApiRes<string[]>>(
      `${this.ROOT_URL}/outside/attachments-from-phone`,
      formData
    );
  }

  getMobileAttachmentCheckData(
    uuId: string
  ): Observable<IApiRes<IAttachmentFromPhoneCheckDetails>> {
    return this.http.get<IApiRes<IAttachmentFromPhoneCheckDetails>>(
      `${this.ROOT_URL}/outside/attachments-from-phone/${uuId}`
    );
  }

  //Check Activity
  getCheckActivity(checkId: string): Observable<any> {
    return this.http.get(`${this.ROOT_URL}/checks/${checkId}/activities`);
  }

  printSingleCheck(checkId: string, body?: any): Observable<any> {
    return this.http.post(`${this.ROOT_URL}/checks/${checkId}/print`, body);
  }

  printMultiCheck(body: {
    checkId: string[];
    paperType: number | string;
  }, headerOption?: HttpHeaders): Observable<IApiRes<{ url: string }>> {
    return this.http.post<IApiRes<{ url: string }>>(
      `${this.ROOT_URL}/checks/multi/print`,
      body,
      { headers: headerOption }
    );
  }

  getCheckPaperType(): Observable<any> {
    return this.http.get(`${this.ROOT_URL}/checks/default-paper-type`);
  }

  postCheckPaperType(paperType: any): Observable<any> {
    return this.http.put(
      `${this.ROOT_URL}/checks/default-paper-type`,
      paperType
    );
  }

  getEmailMessage(checkId: string): Observable<any> {
    return this.http.get(`${this.ROOT_URL}/email-checks/message/${checkId}`);
  }

  saveEmailMessage(body: any): Observable<any> {
    return this.http.post(`${this.ROOT_URL}/email-checks/message`, body);
  }

  forcePrinted(body: any): Observable<any> {
    return this.http.post(
      `${this.ROOT_URL}/email-checks/markas-forcefully-printed`,
      body
    );
  }

  getHaloSampleFile(): Observable<IApiRes<{ sampleFileUrl: string }>> {
    return this.http.get<IApiRes<{ sampleFileUrl: string }>>(
      `${this.ROOT_URL}/imports/checks-import/halo/step1`
    );
  }

  importHaloChecks(body: FormData): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/imports/checks-import/halo/step2`,
      body
    );
  }
  
  getSalesForceSampleFile(): Observable<IApiRes<{ sampleFileUrl: string }>> {
    return this.http.get<IApiRes<{ sampleFileUrl: string }>>(
      `${this.ROOT_URL}/imports/checks-import/sales-force/step1`
    );
  }

  importSalesForceChecks(body: FormData): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/imports/checks-import/sales-force/step2`,
      body
    );
  }

  //Direct Deposit, DD
  getDirectDepostModalData(
    body: any
  ): Observable<IApiResWithMsg<IDirectDepositData[]>> {
    return this.http
      .post<IApiResWithMsg<IDirectDepositData[]>>(
        `${this.ROOT_URL}/checks/get-direct-deposit-modal`,
        body
      )
      .pipe(
        catchError((error) => {
          this.userPermissionService.handleErrorsAndPermissions(error, () => {
            this.userPermissionService.DDCheckPermission(error);
          });
          throw error;
        })
      );
  }

  /**
   * @description -API function to submit DD modal data
   */
  postDirectDepostModalData(
    body: IAchBody,
    headerOption?: HttpHeaders
  ): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/checks/multiple-direct-deposit-create`,
      body,
      { headers: headerOption }
    );
  }

  // Check Approve Reject message status Data
  getCheckListData(): Observable<IApiRes<ICheckListData>> {
    return this.http.get<IApiRes<ICheckListData>>(
      `${this.ROOT_URL}/checks/check-list-data`
    );
  }

  /**
   * @description -Approves multiple checks by sending a POST request to the server
   * @param data -- The data containing information about the checks to be approved.
   *
   */
  approveCheck(data: any): Observable<any> {
    return this.http.post(`${this.ROOT_URL}/checks/multi/approve`, data).pipe(
      catchError((error) => {
        this.userPermissionService.handleErrorsAndPermissions(error, () => {
          this.userPermissionService.approveCheck(error);
        });
        throw error;
      })
    );
  }

  /**
   * @description -reject multiple checks by sending a POST request to the server
   * @param data -- The data containing information about the checks to be rejected.
   *
   */
  rejectCheck(data: any): Observable<any> {
    return this.http.post(`${this.ROOT_URL}/checks/multi/reject`, data).pipe(
      catchError((error) => {
        this.userPermissionService.handleErrorsAndPermissions(error, () => {
          this.userPermissionService.approveCheck(error);
        });
        throw error;
      })
    );
  }

  //Check Activity Log
  getActivityLog(id: string): Observable<any> {
    return this.http.get(`${this.ROOT_URL}/checks/${id}/activities`);
  }

  // process check
  getprocesscheck(data: {
    cheque_id: string[];
  }): Observable<IApiRes<ICheckProcessData[]>> {
    return this.http.post<IApiRes<ICheckProcessData[]>>(
      `${this.ROOT_URL}/check-process/get-data`,
      data
    );
  }

  processchecks(
    data: IProcessCheckPayload
  ): Observable<IApiRes<IProcessCheck>> {
    return this.http.post<IApiRes<IProcessCheck>>(
      `${this.ROOT_URL}/check-process/process-now`,
      data
    );
  }

  // Shipping Cost Calculation
  ShippingCostCalculationGroup(
    data: any
  ): Observable<IApiRes<IShippingCostCalculation>> {
    return this.http.post<IApiRes<IShippingCostCalculation>>(
      `${this.ROOT_URL}/cheques/shipping-cost-calculation`,
      data
    );
  }

  /**
   * Prices a mailing before the check exists, so the fee can be shown while the
   * form is still being filled. `shipping-cost-calculation` cannot do this —
   * it prices `mail_check_ids`, which do not exist yet.
   */
  previewShippingCost(
    payload: unknown
  ): Observable<IApiRes<IShippingCostCalculation>> {
    return this.http.post<IApiRes<IShippingCostCalculation>>(
      `${this.ROOT_URL}/cheques/preview-shipping-cost`,
      payload
    );
  }

  /**
   * Bank, payee and mailing options in one call, before the check exists.
   * Replaces the pair `/cheques/validate/bank` + `/cheques/validate/check`,
   * which both needed a cheque to validate against. Sends no mail and does not
   * touch the payee. Needs `check-mail` permission.
   */
  validateMailing(payload: unknown): Observable<any> {
    return this.http.post<any>(
      `${this.ROOT_URL}/cheques/validate/mailing`,
      payload,
      { headers: new HttpHeaders({ isDisable422: 'true' }) }
    );
  }

  // Sent Mail
  sendmail(data: any, type: any): Observable<IApiRes<string>> {
    return this.http.post<IApiRes<string>>(
      `${this.ROOT_URL}/cheques/sent-mail/${type}`,
      data
    );
  }

  /**********************************************payee in check ********************************/

  updatepayee(data: any): Observable<any> {
    return this.http.post(`${this.ROOT_URL}/payees/multi-update`, data);
  }

  getpayee(data: any): Observable<any> {
    return this.http.post(`${this.ROOT_URL}/payees/get-multiple-payee`, data);
  }

  /**********************************************bank in check ********************************/

  getbank(data: any): Observable<any> {
    return this.http.post(
      `${this.ROOT_URL}/bank-accounts/get-bank-details`,
      data
    );
  }

  /** Consolidated Send-Payment bank→check→mail endpoint (creates + mails in one call). */
  sendCheckMail(payload: unknown, headers?: HttpHeaders): Observable<any> {
    return this.http.post<any>(
      `${this.ROOT_URL}/payments/check-mail`,
      payload,
      headers ? { headers } : {}
    );
  }

  /** Consolidated Send-Payment bank→check→email endpoint (creates + emails in one call). */
  sendCheckEmail(payload: unknown, headers?: HttpHeaders): Observable<unknown> {
    return this.http.post<unknown>(
      `${this.ROOT_URL}/payments/check-email`,
      payload,
      headers ? { headers } : {}
    );
  }

  /** Consolidated Send-Payment bank→check→direct-deposit endpoint. */
  sendCheckDirectDeposit(
    payload: unknown,
    headers?: HttpHeaders
  ): Observable<unknown> {
    return this.http.post<unknown>(
      `${this.ROOT_URL}/payments/check-direct-deposit`,
      payload,
      headers ? { headers } : {}
    );
  }

  /** What one payee SMS costs, for the mailed-check cost line. */
  getSmsCost(): Observable<IApiRes<unknown>> {
    return this.http.get<IApiRes<unknown>>(
      `${this.ROOT_URL}/cheques/get-sms-cost`
    );
  }

  /** Stateless live check-preview data (no cheque row written, no serial consumed). */
  getCheckPreviewData(payload: unknown): Observable<any> {
    return this.http.post<any>(`${this.ROOT_URL}/checks/preview`, payload);
  }

  updatebank(data: any): Observable<any> {
    return this.http.post(
      `${this.ROOT_URL}/bank-accounts/update-multiple-bank`,
      data
    );
  }

  getCheckListTabs(): Observable<IApiRes<ICheckListTabs>> {
    return this.http.get<IApiRes<ICheckListTabs>>(
      `${this.ROOT_URL}/checks/user-tabs`
    );
  }

  getCheckTracking(
    chequeId: string
  ): Observable<IApiRes<ICheckMailTrackDetails>> {
    return this.http.get<IApiRes<ICheckMailTrackDetails>>(
      `${this.ROOT_URL}/cheque-tracking/${chequeId}`
    );
  }

  getTrackingUrl(chequeIds: string[]): void {
    this.subscription.push(
      this.http
        .post(`${this.ROOT_URL}/cheque-tracking/tracking-url/`, {
          ids: chequeIds
        })
        .subscribe((data: any) => {
          if (data?.success && data.data?.length) {
            const urls = {};
            data.data.forEach((e: any) => {
              // eslint-disable-next-line @typescript-eslint/ban-types
              urls[e.chequeId as keyof Object] = e;
            });

            if (Object.keys(urls)?.length) {
              this.checkTrackingUrls.next(urls);
            }
          }
        })
    );
  }

  //-------------------- custom check report ------------------------/

  getCustomChecksReportSummary(data: {
    fromDate: string;
    toDate: string;
  }): Observable<IApiRes<Record<string, ICheckSummary>>> {
    return this.http.post<IApiRes<Record<string, ICheckSummary>>>(
      `${this.ROOT_URL}/checks/summary`,
      data
    );
  }

  getRequestPaymentReportSummary(data: {
    fromDate: string;
    toDate: string;
  }): Observable<IApiRes<Record<string, ICheckSummary>>> {
    return this.http.post<IApiRes<Record<string, ICheckSummary>>>(
      `${this.ROOT_URL}/request-payments/summary`,
      data
    );
  }

  //-------------------- custom check report end------------------------/

  /********************************************** QuickBooks online push back ********************************/

  isPushBackEnable(): Observable<IApiRes<IQBOPushBackEnable>> {
    return this.http.get<IApiRes<IQBOPushBackEnable>>(
      `${this.ROOT_URL}/checks/qbo/settings`
    );
  }

  getCompanies(id: string): Observable<any> {
    return this.http.get<any>(`${this.ROOT_URL}/checks/qbo/companies/${id}`);
  }

  getLocations(realmId: string): Observable<IApiRes<ILocation[]>> {
    return this.http.get<IApiRes<ILocation[]>>(
      `${this.ROOT_URL}/checks/qbo/locations/${realmId}`
    );
  }

  getCompany(page: number, term: any, id: string): Observable<any> {
    return this.http.get<any>(
      `${this.ROOT_URL}/checks/qbo/companies/${id}?page=${page}&&term=${term}`
    );
  }

  GetCompanyDetails(type: string, realmId: string): Observable<any> {
    return this.http.get<any>(`${this.ROOT_URL}/checks/qbo/${type}/${realmId}`);
  }

  GetQBBankAccount(realmId: string, bankId: string): Observable<any> {
    return this.http.get<any>(
      `${this.ROOT_URL}/checks/qbo/qb-bank-accounts/${realmId}/${bankId}`
    );
  }

  GetQBBankAccountPaination(
    realmId: string,
    bankId: string,
    page: number,
    term: string
  ): Observable<any> {
    return this.http.get<any>(
      `${this.ROOT_URL}/checks/qbo/qb-bank-accounts/${realmId}/${bankId}?page=${page}&&term=${term}`
    );
  }

  GetCompanyDetailsPagination(
    type: string,
    realmId: number,
    page: number,
    term: any
  ): Observable<any> {
    return this.http.get<any>(
      `${this.ROOT_URL}/checks/qbo/${type}/${realmId}?page=${page}&&term=${term}`
    );
  }

  /********************************************** QuickBooks Desktop Push Back ********************************/

  isQBDPushBackEnable(): Observable<IApiRes<IpushBackEnableBody>> {
    return this.http.get<IApiRes<IpushBackEnableBody>>(
      `${this.ROOT_URL}/checks/qbd/settings`
    );
  }

  getQBDCompanies(id: string): Observable<IApiRes<IQBDCompanyDetails>> {
    return this.http.get<IApiRes<IQBDCompanyDetails>>(
      `${this.ROOT_URL}/checks/qbd/company-details/${id}`
    );
  }

  GetQBDCompanyDetailsPagination(
    type: string,
    realmId: string,
    page: number,
    term: string | number
  ): Observable<IApiRes<{ name: string; id: string }[]>> {
    return this.http.get<IApiRes<{ name: string; id: string }[]>>(
      `${this.ROOT_URL}/checks/qbd/${type}/${realmId}?page=${page}&term=${term}`
    );
  }

  /**
   * @description Get payee default category details
   * @param id
   * @returns
   */
  getPayeeCategory(id: string) {
    return this.http.get<IApiRes<{ id: string; name: string; type: number }>>(
      `${this.ROOT_URL}/payees/${id}/category`
    );
  }

  /**
   * @description API function to delete import check template
   * @param id
   * @returns
   */
  deleteTemplate(data: { id: string }): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/imports/checks-import/delete-template`,
      data
    );
  }

  /**
   * @description API function to get specific  QB category
   */
  getQbCategory(
    realmId: string,
    categoryId: string
  ): Observable<IApiRes<{ id: string; name: string }>> {
    return this.http.get<IApiRes<{ id: string; name: string }>>(
      `${this.ROOT_URL}/checks/qbo/get-category/${realmId}/${categoryId}`
    );
  }

  isNetSuitePushBackEnable(): Observable<IApiRes<INetSuitePushBack>> {
    return this.http.get<IApiRes<INetSuitePushBack>>(
      `${this.ROOT_URL}/checks/netsuite/settings`
    );
  }

  /**
   * @description Get the check mail tracking details.
   * @param {string}checkid - selected check id.
   */
  getCheckTrackingUrls(checkId: string) {
    this.isLoading = true;
    this.subscription.push(
      this.getCheckTracking(checkId)
        .pipe(
          finalize(() => {
            this.isLoading = false;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            if (res.data.trackingData.success) {
              this.openTrackingModal(res.data, 'check', checkId);
            } else if (res.data.trackingCode && this.localStorageService.getItem('isV4LayoutEnabled') === 1) {
              window.open(getMailTrackUrl(res.data.trackingCode), '_blank');
            } else if (res.data.trackingUrl) {
              open(res.data.trackingUrl, '_blank');
            }
          }
        })
    );
  }

  /**
   * API function for get spectrum firl
   */
  getSpectrumSampleFile(): Observable<IApiRes<{ sampleFileUrl: string }>> {
    return this.http.get<IApiRes<{ sampleFileUrl: string }>>(
      `${this.ROOT_URL}/imports/checks-import/spectrum/step1`
    );
  }

  /**
   * API function for import spectrum checks
   */
  importSpectrumChecks(body: FormData): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/imports/checks-import/spectrum/step2`,
      body
    );
  }

  /**
   * @description Open track deteails modal.
   * @param {ICheckMailTrackDetails} trackDetails - track details.
   */
  openTrackingModal(
    trackDetails: ICheckMailTrackDetails,
    type: 'check' | 'invoice' | 'mail-doc',
    checkId: string
  ) {
    const updatedTrackDetails = JSON.parse(JSON.stringify(trackDetails));
    updatedTrackDetails.trackingData.data.details =
      updatedTrackDetails.trackingData.data.details.reverse();
    const isV4 = this.localStorageService.getItem('isV4LayoutEnabled') === 1;
    const dialogData = { trackDate: updatedTrackDetails, id: checkId, mode: type };
    if (isV4) {
      this.dialog.open(V4MailTrackingModalComponent, {
        disableClose: true,
        maxWidth: '1010px',
        width: '99%',
        maxHeight: '83%',
        autoFocus: false,
        panelClass: 'paddingless-modal-rounded',
        data: dialogData
      });
    } else {
      this.dialog.open(MailTrackingModalComponent, {
        disableClose: true,
        maxWidth: '1010px',
        width: '99%',
        maxHeight: '83%',
        autoFocus: false,
        data: dialogData
      });
    }
  }

  checksUploadFromPhoneLink(
    id: string | number,
    body: {
      documentType: 'checks';
      requestType: 'sms' | 'qr';
      phone?: number;
    }
  ): Observable<{
    data: IUploadFromPhoneResponse;
    errorMsg: number;
    success: boolean;
  }> {
    return this.http.post<{
      data: IUploadFromPhoneResponse;
      errorMsg: number;
      success: boolean;
    }>(`${this.ROOT_URL}/checks/${id}/attachment-using-phone`, body);
  }

  deleteCheckPermanently(checkIds: { ids: string[]; }):Observable<IApiResMesssage>{
    return this.http.post<IApiResMesssage>(`${this.ROOT_URL}/checks/delete-permanently`,checkIds);
  }
  
  sentTrackingUrl(
    mode: string,
    payload: {
      id: string;
      type: string;
      phone?: string;
      email?: string;
      is_invoice?: boolean;
    }
  ) {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/${mode}/sent-tracking-url`,
      payload
    );
  }

  setDafaultMailingType(payload:{default_mailing_type_us:number,default_mailing_type_canada:number}){
    return this.http.post<IApiRes<{success:boolean}>>(`${this.ROOT_URL}/cheques/set-default-mailing-type`,payload);
  }

  getMailingSettingsActivities() {
    return this.http.get<IApiRes<IMailingSettingsActivities[]>>(`${this.ROOT_URL}/cheques/check-mail-settings/activities`);
  }

  getReconciliationSampleFile(){
    return this.http.get<IApiRes<{ sampleFileUrl: string }>>(
      `${this.ROOT_URL}/imports/checks-import/verified-checks/step1`
    );
  }

  importReconciliationFile(payload:FormData){
    return this.http.post<IApiRes<IReconciliationData>>(
      `${this.ROOT_URL}/imports/checks-import/verified-checks/step2`,
      payload
    );
  }

  checkReconciliationStep3(payload:{mapping: string[];uploadFromImport: string;proceedForCheckNumber?: number;}){
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/imports/checks-import/verified-checks/step3`,
      payload
    );
  }

  checkReconciliationStep4(){
    return this.http.get<IApiRes<IReconciliationCheckStep3Data>>(
      `${this.ROOT_URL}/imports/checks-import/verified-checks/step4`);
  }

  
  checkReconciliationStep5(payload:{entry: string[];}){
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/imports/checks-import/verified-checks/step5`,
      payload
    );
  }

  getNetsuiteExpense(expenseId:string){
    return this.http.get<IApiRes<{id:string,name:string}>>(`${this.ROOT_URL}/checks/netsuite/get-expense/${expenseId}`);
  }

  getBeazleySampleFile(){
    return this.http.get<IApiRes<{ sampleFileUrl: string }>>(
      `${this.ROOT_URL}/imports/checks-import/lis-beazley/step1`
    );
  }

  importBeazleyChecks(payload:FormData){
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/imports/checks-import/lis-beazley/step2`,
      payload
    );
  }

  getTotalCheckSum(payload: {
    start_date?: string;
    end_date?: string;
    transfer_type?: string;
    transfer_status?: number;
    payee_id?: number;
    payee_ids?: (number | string)[];
    status?: number;
    source_type?: string;
  }){
    return this.http.post<IApiRes<{ total_amount: number }>>(`${this.ROOT_URL}/zil-payments/total-payment-summary`, payload);
  }

  /** Group Mail Create API */
  groupMailCreate(payload:FormData){
    return this.http.post<{success:boolean,checkIds:string[],data:string}>(`${this.ROOT_URL}/business-tool/group-mailing/create`, payload);
  }

  /** Group Mail Cheque Details API */
  groupMailChequeDetails(payload:{is_signature:number,auto_add_attachments:number,ids:string[]}){
    return this.http.post<IApiRes<IChequedata>>(`${this.ROOT_URL}/business-tool/group-mailing/cheque-details`, payload);
  }

  /** Group Mail Shipping cost calculation API */
  groupMailShippingCostCalculation(payload:IMailShippingCalculations){
    return this.http.post<IApiRes<IShippingCostCalculation>>(`${this.ROOT_URL}/business-tool/group-mailing/shipping-cost-calculation`, payload);
  }

  /** Group Mail Add Attachments API */
  groupMailAddAttachments(checkId:string,payload:FormData){
    return this.http.post<IApiRes<ICheckAttachmentData>>(`${this.ROOT_URL}/business-tool/group-mailing/${checkId}/attachments`, payload);
  }

  /** Group Mail get Attachments API */
  groupMailGetAttachments(checkId:string){
    return this.http.get<IApiRes<ICheckAttachmentData[]>>(`${this.ROOT_URL}/business-tool/group-mailing/${checkId}/attachments`);
  }

  /** Group Mail Check Create API */
  groupMailCheckCreate(payload: { ids: string[] }){
    return this.http.post<{success:boolean,checkIds:string[],message:string}>(`${this.ROOT_URL}/business-tool/group-mailing/multiple-cheques`, payload);
  }

  deleteGroupPaymentsAttachment(attachmentId:string){
    return this.http.delete<IApiResMesssage>(`${this.ROOT_URL}/business-tool/group-mailing/attachments/${attachmentId}`);
  }


  getGroupPaymentsAttachment(attachmentId:string){
    return this.http.get<IApiRes<string>>(`${this.ROOT_URL}/business-tool/group-mailing/attachments/${attachmentId}`);
  }

  
  /**
   * @description Requests re-print approval for the given payment IDs.
   * @param paymentidList - List of payment IDs.
   * @returns Observable with success or failure response.
   */
  requestRePrint(paymentidList: string[]) {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/checks/multi/reprint-request`, {checkId:paymentidList}
    );
  }

  /**
   * @description Approves re-print requested checks.
   * @param paymentidList - List of payment IDs.
   * @param endPoints - The endpoint to be used. 'reprint-approve' for approval and 'reprint-reject' for rejection.
   * @returns Observable with success or failure response.
   */
  reviewReprintCheckRequest(paymentidList: string[],endPoints:'reprint-approve' | 'reprint-reject') {
    return this.http.post<IApiResMesssage>(`${this.ROOT_URL}/checks/multi/${endPoints}`, {checkId:paymentidList});
  }

  unSubscribe() {
    this.subscription.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}

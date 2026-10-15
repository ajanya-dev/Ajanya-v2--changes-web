import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import {
  ICheckDraftActivityLog,
  ICheckDraftAttachments,
  ICheckDraftCloneData,
  ICheckDraftComments,
  ICheckDraftMultiPrint,
  ICheckDraftPayeeSummary,
  ICheckDraftRecurringView,
  ICheckDraftView,
  IImportStep2,
  IImportStep4,
  INewCheckDraft
} from 'src/app/modules/check-draft/model/Checkdraft';
import { IApiRes, IApiResMesssage, IApiResWithMsg } from 'src/app/models/api';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CheckDraftService {
  ROOT_URL = environment.rootUrl;

  /** Tracks the check draft application status (-1=loading, 0=approved, 1=not applied, 2=applied/pending, 3=rejected) */
  checkDraftAppStatus = signal(-1);

  /** Currently active panel tab filter (all, new, pending, approved) */
  selectedPanelButton = signal('all');

  /** Shared between header and list — disables "Create Deposit Slip" button when no rows are selected */
  depositSlipDisabled = signal(true);

  /** Shared between header and list — selected check design template id ('1'=Check On Top, '4'=Three Per Page) */
  checkDesignTemplate = signal('1');

  /** Shared between header and list — display name for the selected check design template */
  checkDesignTemplateName = signal('Check On Top');

  /** Toggles between check draft list and recurring list in the details section */
  showRecurringList = signal(false);

  /** Recurring header button state — shared between header and recurring component */
  recurringPauseLoading = signal(false);
  recurringResumeLoading = signal(false);
  recurringCancelLoading = signal(false);
  recurringPauseDisabled = signal(false);
  recurringResumeDisabled = signal(false);
  recurringCancelDisabled = signal(false);

  /** Header clicks Pause/Resume/Cancel → recurring component listens */
  triggerRecurringAction$ = new Subject<string>();

  triggerApply$ = new Subject<void>();

  /** Used by header to communicate button clicks (panel tabs, check design, etc.) to the list component */
  triggerHeaderButton$ = new Subject<string>();

  constructor(private http: HttpClient) {}

  // check draft status

  checkDraftStatus() {
    return this.http.get<IApiRes<number>>(
      `${this.ROOT_URL}/cheque-drafts/application-status`
    );
  }

  // check draft step1 status

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getcheckDraftStatus(): Observable<any> {
    return this.http.get(`${this.ROOT_URL}/cheque-drafts/step-1`);
  }

  // Action buttons

  getPrint(id: string) {
    return this.http.post<IApiRes<ICheckDraftMultiPrint>>(
      `${this.ROOT_URL}/cheque-drafts/${id}/print`,
      ''
    );
  }

  CheckDraftMultiPrint(data: { check_design_templete: string; ids: string[] }) {
    return this.http.post<IApiRes<ICheckDraftMultiPrint>>(
      `${this.ROOT_URL}/cheque-drafts/multi-print`,
      data
    );
  }

  deleteCheckDraft(id: string) {
    return this.http.delete<{ success: boolean }>(
      `${this.ROOT_URL}/cheque-drafts/${id}`
    );
  }

  bulkdeleteCheckDraft(data: { ids: string[] }) {
    return this.http.post<{ success: boolean }>(
      `${this.ROOT_URL}/cheque-drafts/multi-delete`,
      data
    );
  }

  // applayCheckDraftApplication(data:any): Observable<any>
  // {
  //   return this.http.post(`${this.ROOT_URL}/cheque-drafts/application`,data);
  // }

  applayCheckDraft(data: {
    bankAccountId: string;
    businessId: string;
  }): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/cheque-drafts/application/apply-checkdraft`,
      data
    );
  }

  getSerialNumber(): Observable<IApiRes<Record<string, unknown>>> {
    return this.http.get<IApiRes<Record<string, unknown>>>(
      `${this.ROOT_URL}/cheque-drafts/serial-number`
    );
  }

  /**
   * @description -API function for creating new check draft;
   */
  createNewCheckDraft(data: INewCheckDraft, headerOption?: HttpHeaders) {
    return this.http.post<IApiRes<{ id: string }>>(
      `${this.ROOT_URL}/cheque-drafts/`,
      data,
      { headers: headerOption }
    );
  }

  /**
   * @description -API function for creating new check draft with recurring;
   */
  createNewCheckDraftWithRecurring(
    data: unknown,
    headerOption?: HttpHeaders
  ): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/cheque-drafts/set-recurring`,
      data,
      { headers: headerOption }
    );
  }

  setRecurringToCheckDraft(data: unknown): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/cheque-drafts/set-recurring-index`,
      data
    );
  }

  validationRecurringData(data: { id: string }) {
    return this.http.post<{ success: boolean }>(
      `${this.ROOT_URL}/cheque-drafts/validate-recurring-data`,
      data
    );
  }

  singleRecurring(id: string, data: { status: number }) {
    return this.http.post<{ success: boolean }>(
      `${this.ROOT_URL}/cheque-drafts/recurring/${id}/change-status`,
      data
    );
  }

  bulkRecurring(data: { ids: string[]; status: number }) {
    return this.http.post<{ success: boolean }>(
      `${this.ROOT_URL}/cheque-drafts/recurring/change-status`,
      data
    );
  }

  checkDraftView(id: string) {
    return this.http.get<IApiRes<ICheckDraftView>>(
      `${this.ROOT_URL}/cheque-drafts/${id}/details`
    );
  }

  getActivityLogs(id: string) {
    return this.http.get<IApiRes<ICheckDraftActivityLog[]>>(
      `${this.ROOT_URL}/cheque-drafts/${id}/activities`
    );
  }

  recurringView(id: string) {
    return this.http.get<IApiRes<ICheckDraftRecurringView>>(
      `${this.ROOT_URL}/cheque-drafts/recurring/${id}`
    );
  }

  directDeposit(data: { ids: string[] }) {
    return this.http.post<IApiRes<string>>(
      `${this.ROOT_URL}/cheque-drafts/create-direct-deposit/`,
      data
    );
  }

  resendPermission(id: string, data: { email: string; sms: string }) {
    return this.http.post<{ success: boolean }>(
      `${this.ROOT_URL}/cheque-drafts/${id}/resend-permission/`,
      data
    );
  }

  getCloneData(id: string) {
    return this.http.get<IApiRes<ICheckDraftCloneData>>(
      `${this.ROOT_URL}/cheque-drafts/${id}/clone/`
    );
  }

  setDefaultCDBankAcc(data: unknown): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/payees/bank-accounts/set-default-for-cd`,
      data
    );
  }

  lastTransactions(id: string) {
    return this.http.get<IApiRes<ICheckDraftPayeeSummary>>(
      `${this.ROOT_URL}/payees/${id}/check-draft-transactions`
    );
  }

  getAttachments(id: string) {
    return this.http.get<IApiRes<ICheckDraftAttachments[]>>(
      `${this.ROOT_URL}/cheque-drafts/${id}/attachments`
    );
  }

  openAttachment(id: string, fileId: string) {
    return this.http.get<IApiRes<string>>(
      `${this.ROOT_URL}/cheque-drafts/${id}/attachments/${fileId}`
    );
  }

  getComments(id: string) {
    return this.http.get<IApiRes<ICheckDraftComments[]>>(
      `${this.ROOT_URL}/cheque-drafts/${id}/comments`
    );
  }

  getTemplates(): Observable<IApiRes<{ sampleFileUrl: string }>> {
    return this.http.get<IApiRes<{ sampleFileUrl: string }>>(
      `${this.ROOT_URL}/imports/check-draft-import/step1/`
    );
  }

  importCheckDraftStep2(body: FormData): Observable<IApiRes<IImportStep2>> {
    return this.http.post<IApiRes<IImportStep2>>(
      `${this.ROOT_URL}/imports/check-draft-import/step2`,
      body
    );
  }

  importCheckDraftStep3(
    body: unknown
  ): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.ROOT_URL}/imports/check-draft-import/step3`,
      body
    );
  }

  importCheckDraftStep4(): Observable<IApiRes<IImportStep4[]>> {
    return this.http.get<IApiRes<IImportStep4[]>>(
      `${this.ROOT_URL}/imports/check-draft-import/step4`
    );
  }

  importCheckDraftStep5(body: {
    entry: string[];
  }): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.ROOT_URL}/imports/check-draft-import/step5`,
      body
    );
  }

  getCheckDraftPrintType(): Observable<IApiResWithMsg<{ printType: number }>> {
    return this.http.get<IApiResWithMsg<{ printType: number }>>(
      `${this.ROOT_URL}/cheque-drafts/print-type`
    );
  }

  postCheckDraftPrintType(payloadData: {
    type: number;
  }): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/cheque-drafts/print-type`,
      payloadData
    );
  }

  /**
   * API function for exporting check darft tabel
   */
  exportTable(body: {
    type: string;
    fromDate: string | Date;
    toDate: string | Date;
    items: string[];
  }) {
    return this.http.post<IApiResWithMsg<{ url: string }>>(
      `${this.ROOT_URL}/cheque-drafts/export`,
      body
    );
  }
}

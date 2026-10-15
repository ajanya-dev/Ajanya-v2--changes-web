import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { IApiMailCheckRes, IApiMailCheckResMessage, IApiRes, IApiResMesssage } from 'src/app/models/api';
import { 
  IChequeData,
  IGroupMailingActivityLog,
  IGroupMailingDetailData,
  IGroupMailingLogs,
  IMailingDashboardReport,
  IMultipleCheckMailStep1,
  } from '../models/group-mailing.model';
import { IMultiCheckImport } from 'src/app/modules/check/model/check';

@Injectable({
  providedIn: 'root'
})
export class GroupMailingService {
  private http = inject(HttpClient);
  
  ROOT_URL = environment.rootUrl;  

  /**
   * Get group mailing details by ID
   */
  getGroupMailingDetails(id: string): Observable<IApiRes<IGroupMailingDetailData>> {
    return this.http.get<IApiRes<IGroupMailingDetailData>>(
      `${this.ROOT_URL}/business-tool/group-mailing/${id}`
    );
  }

  updatePayeeName(payload: {id: string, name: string}): Observable<IApiResMesssage> {
    return this.http.patch<IApiResMesssage>(
      `${this.ROOT_URL}/business-tool/group-mailing/update`,
      payload
    );
  }


  getActivityLog(id: string): Observable<IApiRes<IGroupMailingActivityLog[]>> {
    return this.http.get<IApiRes<IGroupMailingActivityLog[]>>(
      `${this.ROOT_URL}/business-tool/group-mailing/${id}/activities`
    );
  }

  getMailingDashboardReport(fromDate?: string, toDate?: string) {
    const payload: {from_date?: string, to_date?: string} = {};
    if (fromDate) {
      payload.from_date = fromDate;
    }
    if (toDate) {
      payload.to_date = toDate;
    }
    return this.http.post<IApiRes<IMailingDashboardReport>>(`${this.ROOT_URL}/business-tool/check-mailing/report`, payload);
  }

  getSampleFiles(): Observable<IApiRes<IMultipleCheckMailStep1>> {
    return this.http.get<IApiRes<IMultipleCheckMailStep1>>(
      `${this.ROOT_URL}/imports/check-mailing/step1`
    );
  }

  importMultyChecks(body: FormData): Observable<IApiRes<IMultiCheckImport>> {
    return this.http.post<IApiRes<IMultiCheckImport>>(
      `${this.ROOT_URL}/imports/check-mailing/step2`,
      body
    );
  }

  /**
   * Process multi check mail step 2 - mapping and validation
   */
  processMultiCheckMailStep2(body: {
    mapping: string[];
    uploadFromImport: string;
    proceedForCheckNumber?: number;
    batch_id?: string;
    batch_name?: string;
  }): Observable<IApiMailCheckRes<IChequeData[]>> {
    return this.http.post<IApiMailCheckRes<IChequeData[]>>(
      `${this.ROOT_URL}/imports/check-mailing/step3`,
      body
    );
  }


  editMailRow(body: IChequeData): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/imports/check-mailing/edit`,
      body
    );
  }

  deleteMailRow(id: string): Observable<IApiResMesssage> {
    return this.http.delete<IApiResMesssage>(
      `${this.ROOT_URL}/imports/check-mailing/${id}`
    );
  }

  /**
   * Get mail import step 3 data
   */
  submitMailImportStep3Data(data: { entry: string[],batch_id: string }): Observable<IApiMailCheckResMessage> {
    return this.http.post<IApiMailCheckResMessage>(
      `${this.ROOT_URL}/imports/check-mailing/step4`,
      data
    );
  }

  /**
   * Submit mail import final step
   */
  submitMailImport(body: { batch_id: string }): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/imports/check-mailing/step5`,
      body
    );
  }

  editBatch(batch_id: string, name: string): Observable<IApiResMesssage> {
    return this.http.put<IApiResMesssage>(
      `${this.ROOT_URL}/imports/check-mailing/batch/${batch_id}`,
      {
        batch_name: name,
        batch_id: batch_id
      }
    );
  }

  getBatchLogs(id: string): Observable<IApiRes<IGroupMailingLogs>> {
    return this.http.get<IApiRes<IGroupMailingLogs>>(
      `${this.ROOT_URL}/imports/check-mailing/activities/${id}`
    );
  }

}
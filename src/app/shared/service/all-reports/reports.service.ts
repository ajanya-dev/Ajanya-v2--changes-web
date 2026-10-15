import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';
import {
  ICommonReportRequest,
  IIndividualPayeeReport,
  INecReportPostForm,
  IPayeePostData,
  IPayeeReport,
  IPayeeTotalPayementResponse
} from 'src/app/modules/more/model/all-reports';
import { IApiRes, IApiResWithMsg, IApiResWithUrl } from 'src/app/models/api';

interface ICheckReport extends IApiResWithUrl{
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReportsService {
  private http = inject(HttpClient);

  ROOT_URL = environment?.rootUrl;

  /**
   * API function for Handle the final form submission to generate the report.
   * @param postData - Payload for the API.
   */
  payeeTransactionReports(
    postData: IPayeeReport
  ): Observable<IApiResWithMsg<{ url?: string }>> {
    return this.http.post<IApiResWithMsg<{ url?: string }>>(
      `${this.ROOT_URL}/payees/report/payee-transaction-report`,
      postData
    );
  }

  /**
   * Individual Payee reports download
   * @param id - Payee id
   * @param body - Payload of the API
   */
  individualPayeeReport(id: string, body: IIndividualPayeeReport) {
    return this.http.post<IApiRes<{ url: string }>>(
      `${this.ROOT_URL}/payees/${id}/transaction-export`,
      body
    );
  }

  /**
   * API function for Generate a check register report.
   * @param postData - Payload for the API.
   */
  getCheckRegisterReport(
    postData: ICommonReportRequest
  ): Observable<IApiRes<string>> {
    return this.http.post<IApiResWithMsg<string>>(
      `${this.ROOT_URL}/imports/checks-import/text-file/check-register`,
      postData
    );
  }

  /**
   * API function for Generate a job processing summary report.
   * @param postData - Payload for the API.
   */
  getJobProcesingSummaryReport(postData: {
    type: string;
  }): Observable<IApiResWithMsg<string>> {
    return this.http.post<IApiResWithMsg<string>>(
      `${this.ROOT_URL}/imports/checks-import/text-file/job-process-summary`,
      postData
    );
  }

  /**
   * API function for Generate a user summary report.
   * @param postData - Payload for the API.
   */
  getUserJobSummaryReport(
    postData: ICommonReportRequest
  ): Observable<IApiResWithMsg<string>> {
    return this.http.post<IApiResWithMsg<string>>(
      `${this.ROOT_URL}/imports/checks-import/text-file/user-job-summary`,
      postData
    );
  }

  /**
   * @description  API function for Retrieve Uploaded file for a specific ID.
   * @param data Payload for the API
   */
  getUploadedFile(id: string): Observable<IApiResWithMsg<string>> {
    return this.http.get<IApiResWithMsg<string>>(
      `${this.ROOT_URL}/imports/checks-import/text-file/${id}/download`
    );
  }

  /**
   *@description  API function for Retrieve the Job Details Report for a specific ID.
   * @param {string} id - The ID of the report.
   */
  getJobDetailsReport(id: string): Observable<IApiResWithMsg<string>> {
    return this.http.post<IApiResWithMsg<string>>(
      `${this.ROOT_URL}/imports/checks-import/text-file/job-detail-report`,
      { file_id: id }
    );
  }

  /**
   *@description  API function for Retrieve  Job Audit Report for a specific ID.
   * @param {string} id - The ID of the report.
   */
  getJobAuditReport(id: string): Observable<IApiResWithMsg<string>> {
    return this.http.post<IApiResWithMsg<string>>(
      `${this.ROOT_URL}/imports/checks-import/text-file/job-audit-report`,
      { file_id: id }
    );
  }

  /**
   * @description  API function for the business details and payee details
   * @param data Payload for the API
   */
  payeeTotalPayments(
    data: IPayeePostData
  ): Observable<IApiRes<IPayeeTotalPayementResponse>> {
    return this.http.post<IApiRes<IPayeeTotalPayementResponse>>(
      `${this.ROOT_URL}/payees/report/payee-total-payment`,
      data
    );
  }

  /**
   * @description  API function for NEC form report
   * @param data Payload for the API
   */
  getNecFormReport(data: INecReportPostForm): Observable<IApiRes<string>> {
    return this.http.post<IApiRes<string>>(
      `${this.ROOT_URL}/payees/report/payee-nec-form-report`,
      data
    );
  }

  /**
   * @description  API function for checking report permission.
   */
  getReportPermission(): Observable<{payee_view_permission:number}> {
    return this.http.get<{payee_view_permission:number}>(
      `${this.ROOT_URL}/more-report`
    );
  }

  checkReport(type:string,payload:{method:string}):Observable<ICheckReport>{
    return this.http.post<ICheckReport>(`${this.ROOT_URL}/checks/report/${type}-report`,payload);
  }

}

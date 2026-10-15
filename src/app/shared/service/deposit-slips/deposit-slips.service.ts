import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import {
  INewSaveSlipBody,
  INewBlankDepositSlip,
  ICheckDeposit,
  IDepositSlip,
  IDepositSlipLastTransaction
} from 'src/app/modules/deposit-slip/model/depositslips';
import { IApiRes, IApiResWithMsg } from 'src/app/models/api';

@Injectable({
  providedIn: 'root'
})
export class DepositSlipsService {
  private http = inject(HttpClient);

  ROOT_URL = environment.rootUrl;

  getRefId(): Observable<any> {
    return this.http.get(`${this.ROOT_URL}/deposit-slips/ref-id`);
  }

  getPayeeItems(): Observable<any> {
    return this.http.get(`${this.ROOT_URL}/deposit-slips/payeeitems`);
  }

  getChecksForm(): Observable<any> {
    return this.http.get(`${this.ROOT_URL}/deposit-slips/checkfrom`);
  }

  getEditBody(depositSlipId: string): Observable<IApiRes<IDepositSlip>> {
    return this.http.get<IApiRes<IDepositSlip>>(
      `${this.ROOT_URL}/deposit-slips/${depositSlipId}`
    );
  }

  getCheckDetails(slipId: string): Observable<any> {
    return this.http.get(
      `${this.ROOT_URL}/deposit-slips/${slipId}/check-deposits-slips`
    );
  }

  saveDepositSlip(body: INewSaveSlipBody): Observable<any> {
    return this.http.post(`${this.ROOT_URL}/deposit-slips`, body);
  }

  updateDepositSlip(
    body: INewSaveSlipBody,
    depositSlipId: string
  ): Observable<any> {
    return this.http.put(
      `${this.ROOT_URL}/deposit-slips/${depositSlipId}`,
      body
    );
  }

  verifySlip(depositSlipId: string): Observable<any> {
    return this.http.post(
      `${this.ROOT_URL}/deposit-slips/${depositSlipId}/verify`,
      {}
    );
  }

  multiVerify(ids: string[]): Observable<any> {
    return this.http.post(`${this.ROOT_URL}/deposit-slips/verify`, { ids });
  }

  deleteSlip(depositSlipId: string): Observable<any> {
    return this.http.delete(`${this.ROOT_URL}/deposit-slips/${depositSlipId}`);
  }

  multiDelete(ids: string[]): Observable<any> {
    return this.http.delete(`${this.ROOT_URL}/deposit-slips`, {
      body: { ids }
    });
  }

  getStub(): Observable<any> {
    return this.http.get(`${this.ROOT_URL}/deposit-slips/stub`);
  }

  saveStub(emailCustomMessage: string): Observable<any> {
    return this.http.post(`${this.ROOT_URL}/deposit-slips/stub`, {
      emailCustomMessage
    });
  }

  printSlip(depositSlipId: string): Observable<any> {
    return this.http.post(
      `${this.ROOT_URL}/deposit-slips/${depositSlipId}/print`,
      {}
    );
  }

  printBulk(
    ids: string[]
  ): Observable<IApiRes<{ printData: string; url: string }>> {
    return this.http.post<IApiRes<{ printData: string; url: string }>>(
      `${this.ROOT_URL}/deposit-slips/bulk-print`,
      { ids }
    );
  }

  createSlip(
    id: string[],
    referenceType: string
  ): Observable<IApiRes<ICheckDeposit[][]>> {
    return this.http.post<IApiRes<ICheckDeposit[][]>>(
      `${this.ROOT_URL}/deposit-slips/check-deposits`,
      { id, referenceType }
    );
  }

  blankDepositslip(body: INewBlankDepositSlip): Observable<any> {
    return this.http.post(`${this.ROOT_URL}/deposit-slips/blank`, body);
  }

  updateblankdepositslip(
    body: INewBlankDepositSlip,
    depositSlipId: string
  ): Observable<any> {
    return this.http.put(
      `${this.ROOT_URL}/deposit-slips/${depositSlipId}/blank`,
      body
    );
  }

  /** API function for getting deposit slip activities  */
  getDepositSlipActivites(
    slipId: string
  ): Observable<IApiResWithMsg<{ [key: string]: string }[]>> {
    return this.http.get<IApiResWithMsg<{ [key: string]: string }[]>>(
      `${this.ROOT_URL}/deposit-slips/${slipId}/activities`
    );
  }

  /** API function for getting deposit slip attachment  */
  getDepositSlipAttachments(
    slipId: string
  ): Observable<IApiResWithMsg<{ [key: string]: string }[]>> {
    return this.http.get<IApiResWithMsg<{ [key: string]: string }[]>>(
      `${this.ROOT_URL}/deposit-slips/${slipId}/attachments`
    );
  }

  /** API function for getting deposit slip attachment details */
  openDepositSlipAttachment(
    depositSlipId: string,
    attachmentId: string
  ): Observable<IApiRes<string>> {
    return this.http.get<IApiRes<string>>(
      `${this.ROOT_URL}/deposit-slips/${depositSlipId}/attachments/${attachmentId}`
    );
  }

  /** API function for deleting deposit slip attachmnet */
  deleteDepositSlipAttachment(
    depositSlipId: string,
    attachmentId: string
  ): Observable<IApiRes<string>> {
    return this.http.delete<IApiRes<string>>(
      `${this.ROOT_URL}/deposit-slips/${depositSlipId}/attachments/${attachmentId}`
    );
  }

  /** API function for deleting deposit slip comment */
  deleteDepositSlipComment(
    depositSlipId: string,
    attachmentId: string
  ): Observable<IApiRes<string>> {
    return this.http.delete<IApiRes<string>>(
      `${this.ROOT_URL}/deposit-slips/${depositSlipId}/comments/${attachmentId}`
    );
  }

  depositSlipLastTransaction(slipId: string) {
    return this.http.get<IApiRes<IDepositSlipLastTransaction[]>>(
      `${this.ROOT_URL}/deposit-slips/${slipId}/last-transactions`
    );
  }

  multiVoid(ids: string[]) {
    return this.http.post<{ success: boolean }>(
      `${this.ROOT_URL}/deposit-slips/void`,
      { ids }
    );
  }
}

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IApiRes } from 'src/app/models/api';
import { IPaymentLinksListItem } from 'src/app/modules/data-table/components/data-table/data-table.model';
import { IGetPaidByLinkRes } from 'src/app/modules/payment-link/model/Paymentlink';
import { IPaymentLinkAuditTrail } from 'src/app/modules/payment-links/models/payment-links.model';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PaymentLinkService {
  ROOT_URL = environment.rootUrl;

  constructor(private http: HttpClient) {}

  getAllLinks(page?: number, term?: string) {
    return this.http.get<
      IApiRes<IPaymentLinksListItem[]> & { creditCardFormToken: string | null }
    >(`${this.ROOT_URL}/get-paid-by-links`, {
      params: {
        page: page ?? 1,
        term: term ?? ''
      }
    });
  }

  shortUrlCheck(id: string): Observable<any> {
    return this.http.get<any>(
      `${this.ROOT_URL}/get-paid-by-link-settings/availability/${id}`
    );
  }

  activePaymentLink(id: string): Observable<IApiRes<string>> {
    return this.http.post<IApiRes<string>>(
      `${this.ROOT_URL}/get-paid-by-links/${id}/unpause`,
      ''
    );
  }
  
  inactivePaymentLink(id: string): Observable<IApiRes<string>> {
    return this.http.post<IApiRes<string>>(
      `${this.ROOT_URL}/get-paid-by-links/${id}/pause`,
      ''
    );
  }

  getRedirectUrl() {
    return this.http.get<IApiRes<string[]>>(
      `${this.ROOT_URL}/get-paid-by-links/redirect-url`
    );
  }

  getTemplate(): Observable<any> {
    return this.http.get<any>(
      `${this.ROOT_URL}/get-paid-by-links/templete-types`
    );
  }

  createLink(data: FormData) {
    return this.http.post<IApiRes<{ id: string }>>(
      `${this.ROOT_URL}/get-paid-by-links/`,
      data
    );
  }


  duplicateLink(id: string): Observable<IApiRes<IGetPaidByLinkRes>> {
    return this.http.post<IApiRes<IGetPaidByLinkRes>>(
      `${this.ROOT_URL}/get-paid-by-links`,
      {
        cloned_parent_id: id
      }
    );
  }

  updateLink(data: any, id: string): Observable<any> {
    return this.http.post<any>(
      `${this.ROOT_URL}/get-paid-by-links/${id}`,
      data
    );
  }

  paymentOptions(): Observable<any> {
    return this.http.get<any>(`${this.ROOT_URL}/payment-settings/`);
  }

  // ePAYMENT SETTINGS

  addNewLink(data: any): Observable<any> {
    return this.http.post<any>(`${this.ROOT_URL}/payment-settings/`, data);
  }

  updateCurrentLink(data: any, id: string): Observable<any> {
    return this.http.put<any>(`${this.ROOT_URL}/payment-settings/${id}`, data);
  }

  getLinkData(id: string): Observable<any> {
    return this.http.get<any>(`${this.ROOT_URL}/payment-settings/${id}`);
  }

  deletePaymentLink(id: string): Observable<any> {
    return this.http.delete<any>(`${this.ROOT_URL}/payment-settings/${id}`);
  }

  deletePaymentLinkBulk(data: any): Observable<any> {
    return this.http.post<any>(
      `${this.ROOT_URL}/payment-settings/bulk-delete`,
      data
    );
  }

  deletePaymentLinkBulkGPF(data: any): Observable<any> {
    return this.http.post<any>(
      `${this.ROOT_URL}/get-paid-by-links/bulk-delete`,
      data
    );
  }

  // payment settings

  viewGPBLSettinga(id: string): Observable<any> {
    return this.http.get<any>(
      `${this.ROOT_URL}/custom-advance-links/gpbl/${id}`
    );
  }

  updateShortUrl(id: string, data: any): Observable<any> {
    return this.http.put<any>(`${this.ROOT_URL}/get-paid-by-links/${id}`, data);
  }

  getDandILink(id: string) {
    return this.http.get<
      IApiRes<{
        dynamicAmountLink: string;
        iframe: string;
      }>
    >(`${this.ROOT_URL}/custom-advance-links/${id}/dynamic-iframe-link`);
  }

  eCommercebutton(id: string): Observable<any> {
    return this.http.get<any>(
      `${this.ROOT_URL}/custom-advance-links/${id}/e-commerse-buttons`
    );
  }

  revokePaymentOption(id: string, type: number): Observable<any> {
    return this.http.post<any>(
      `${this.ROOT_URL}/get-paid-by-links/${id}/payment-settings/${type}/revoke`,
      ''
    );
  }

  attachPaymentOption(id: string, uuId: string): Observable<any> {
    return this.http.post<any>(
      `${this.ROOT_URL}/get-paid-by-links/${id}/payment-settings/${uuId}`,
      ''
    );
  }

  CreateCustomAdvanceLink(data: any): Observable<any> {
    return this.http.post<any>(`${this.ROOT_URL}/custom-advance-links/`, data);
  }

  UpdateCustomAdvanceLink(data: any, id: string): Observable<any> {
    return this.http.put<any>(
      `${this.ROOT_URL}/custom-advance-links/${id}`,
      data
    );
  }

  DeleteCustomAdvanceLink(id: string): Observable<any> {
    return this.http.delete<any>(`${this.ROOT_URL}/custom-advance-links/${id}`);
  }

  MultiDeleteCustomAdvanceLink(data: { ids: string[] }) {
    return this.http.post<IApiRes<unknown>>(
      `${this.ROOT_URL}/custom-advance-links/multi-delete`,
      data
    );
  }

  // email link

  emailLink(data: any, id: string): Observable<any> {
    return this.http.post<any>(
      `${this.ROOT_URL}/custom-advance-links/${id}/email`,
      data
    );
  }

  smsLink(data: any, id: string): Observable<any> {
    return this.http.post<any>(
      `${this.ROOT_URL}/custom-advance-links/${id}/message`,
      data
    );
  }

  // Message

  getMessageStyle(): Observable<IApiRes<string>> {
    return this.http.get<IApiRes<string>>(
      `${this.ROOT_URL}/get-paid-by-link-settings/`
    );
  }

  saveStyleMessage(data: { message?: string }): Observable<IApiRes<string>> {
    return this.http.put<IApiRes<string>>(
      `${this.ROOT_URL}/get-paid-by-link-settings/`,
      data
    );
  }

  // edit payment link

  getPaymentLinkData(id: string) {
    return this.http.get<IApiRes<IGetPaidByLinkRes>>(
      `${this.ROOT_URL}/get-paid-by-links/${id}`
    );
  }

  // payment link action button

  getPrintPaymentLink(id: string): Observable<IApiRes<{ printData: string }>> {
    return this.http.get<IApiRes<{ printData: string }>>(
      `${this.ROOT_URL}/get-paid-by-links/${id}/print-qr`
    );
  }

  deletePaymentLinkMain(id: string) {
    return this.http.delete<IApiRes<string>>(
      `${this.ROOT_URL}/get-paid-by-links/${id}?is_archive=1`
    );
  }

  getArchivedPaymentLinks(page?: number, term?: string): Observable<IApiRes<IPaymentLinksListItem[]>> {
    return this.http.get<IApiRes<IPaymentLinksListItem[]>>(
      `${this.ROOT_URL}/get-paid-by-links/archived`,
      {
        params: {
          page: page ?? 1,
          term: term ?? ''
        }
      }
    );
  }

  restorePaymentLink(id: string) {
    return this.http.post<IApiRes<string>>(
      `${this.ROOT_URL}/get-paid-by-links/${id}/restore-link`,{}
    );
  }

  getAuditTrail(id: string): Observable<IApiRes<IPaymentLinkAuditTrail[]>> {
    return this.http.get<IApiRes<IPaymentLinkAuditTrail[]>>(
      `${this.ROOT_URL}/get-paid-by-links/${id}/audit-trail`
    );
  }

  // payment links  action buttons

  //****** delete payment logo ******/

  deletePaymentLogo(id: string): Observable<any> {
    return this.http.delete<any>(
      `${this.ROOT_URL}/get-paid-by-links/${id}/delete-logo/`
    );
  }

  // Bulk Import Custom Advance Links

  getBulkImportSampleFile(): Observable<IApiRes<{ sampleFileUrl: string }>> {
    return this.http.get<IApiRes<{ sampleFileUrl: string }>>(
      `${this.ROOT_URL}/custom-advance-links/bulk-import/sample`
    );
  }

  uploadBulkImportFile(formData: FormData): Observable<IApiRes<{
    batch_uuid: string;
    data: Array<{ name: string; email: string; amount: string }>;
    total_rows: number;
  }>> {
    return this.http.post<IApiRes<{
      batch_uuid: string;
      data: Array<{ name: string; email: string; amount: string }>;
      total_rows: number;
    }>>(
      `${this.ROOT_URL}/custom-advance-links/bulk-import/upload`,
      formData
    );
  }

  getBulkImportData(batchUuid: string): Observable<IApiRes<{
    data: Array<{ name: string; email: string; amount: string }>;
    created_at: string;
  }>> {
    return this.http.get<IApiRes<{
      data: Array<{ name: string; email: string; amount: string }>;
      created_at: string;
    }>>(
      `${this.ROOT_URL}/custom-advance-links/bulk-import/${batchUuid}`
    );
  }

  updateBulkImportData(batchUuid: string, data: Array<{ name: string; email: string; amount: string }>): Observable<IApiRes<{ success: boolean }>> {
    return this.http.put<IApiRes<{ success: boolean }>>(
      `${this.ROOT_URL}/custom-advance-links/bulk-import/${batchUuid}`,
      { data }
    );
  }

  createBulkImportLinks(batchUuid: string, parentLinkId: string): Observable<IApiRes<{ success: boolean }>> {
    return this.http.post<IApiRes<{ success: boolean }>>(
      `${this.ROOT_URL}/custom-advance-links/bulk-import/${batchUuid}/create`,
      { parent_link_id: parentLinkId }
    );
  }
}

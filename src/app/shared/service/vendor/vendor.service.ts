import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IApiRes } from 'src/app/models/api';
import {
  IVendorData,
  IVendorUpdateBody,
  IVendorViewData
} from 'src/app/modules/vendor-credit/model/vendor';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class VendorService {
  ROOT_URL = environment.rootUrl;

  constructor(private http: HttpClient) {}

  addVendorCredit(body: IVendorUpdateBody): Observable<IApiRes<string>> {
    return this.http.post<IApiRes<string>>(
      `${this.ROOT_URL}/vendor-credits`,
      body
    );
  }

  getVendor(vendorId: string, headers?: HttpHeaders): Observable<IApiRes<IVendorData[]>> {
    return this.http.get<IApiRes<IVendorData[]>>(
      `${this.ROOT_URL}/vendor-credits/${vendorId}`,
      { headers }
    );
  }

  updateVendor(
    vendorId: string,
    body: IVendorUpdateBody
  ): Observable<IApiRes<string>> {
    return this.http.put<IApiRes<string>>(
      `${this.ROOT_URL}/vendor-credits/${vendorId}`,
      body
    );
  }

  getVendorView(vendorId: string){
    return this.http.get<IApiRes<IVendorViewData>>(`${this.ROOT_URL}/vendor-credits/${vendorId}/view/`);
  }

  getVendorCreditAmount(payeeId: string): Observable<any> {
    return this.http.get(`${this.ROOT_URL}/payees/${payeeId}/vendor-credit`);
  }

  getVendorCreditApplied(data: any): Observable<any> {
    return this.http.post(`${this.ROOT_URL}/vendor-credits/get-applied`, data);
  }

  markAsReconciled(vendorId: string): Observable<any> {
    return this.http.post(`${this.ROOT_URL}/vendor-credits/${vendorId}`, {});
  }

  markAsVoid(vendorId: string): Observable<any> {
    return this.http.post(
      `${this.ROOT_URL}/vendor-credits/${vendorId}/void`,
      {}
    );
  }

  multiVoid(vendorIds: string[]): Observable<any> {
    return this.http.post(`${this.ROOT_URL}/vendor-credits/multi-void`, {
      ids: vendorIds
    });
  }

  unVoid(vendorId: string): Observable<any> {
    return this.http.post(
      `${this.ROOT_URL}/vendor-credits/${vendorId}/unvoid`,
      {}
    );
  }

  deleteVendorCredit(ids: string[]): Observable<any> {
    return this.http.delete(`${this.ROOT_URL}/vendor-credits`, {
      body: { ids }
    });
  }

  getActivities(vendorCreditId: string): Observable<any> {
    return this.http.get(
      `${this.ROOT_URL}/vendor-credits/${vendorCreditId}/activities`
    );
  }

  getComments(vendorCreditId: string): Observable<any> {
    return this.http.get(
      `${this.ROOT_URL}/vendor-credits/${vendorCreditId}/comments`
    );
  }

  getAttachments(vendorCreditId: string): Observable<any> {
    return this.http.get(
      `${this.ROOT_URL}/vendor-credits/${vendorCreditId}/attachments`
    );
  }
}

import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IApiRes } from 'src/app/models/api';
import { environment } from 'src/environments/environment';
import { IOdooConnectionPayload, IOdooMapedBankList } from '../model/odoo';

@Injectable({
  providedIn: 'root'
})
export class OdooService {
  private http = inject(HttpClient);

  private ROOT_URL = environment.rootUrl;

  constructor() {}

  getOdooConnectionDetails(): Observable<
    IApiRes<{ id: string; connected: number }>
  > {
    return this.http.get<IApiRes<{ id: string; connected: number }>>(
      `${this.ROOT_URL}/integrations/odoo/details`
    );
  }

  authenticateOdoo(
    body: IOdooConnectionPayload
  ): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.ROOT_URL}/integrations/odoo/authenticate`,
      body
    );
  }

  disconnectOdoo(
    id: string
  ): Observable<IApiRes<{ id: string; connected: number }>> {
    return this.http.get<IApiRes<{ id: string; connected: number }>>(
      `${this.ROOT_URL}/integrations/odoo/disconnect`
    );
  }

  getMappedBankList(): Observable<IApiRes<IOdooMapedBankList[]>> {
    return this.http.get<IApiRes<IOdooMapedBankList[]>>(
      `${this.ROOT_URL}/integrations/odoo/bank-account/get-banks`
    );
  }

  importOdooData(body: {
    type: number;
    time: number;
  }): Observable<IApiRes<{ success: boolean; message: string }>> {
    return this.http.post<IApiRes<{ success: boolean; message: string }>>(
      `${this.ROOT_URL}/integrations/odoo/importData`,
      body
    );
  }
  importOdooBankAccounts(): Observable<
    IApiRes<{ success: boolean; message: string }>
  > {
    return this.http.get<IApiRes<{ success: boolean; message: string }>>(
      `${this.ROOT_URL}/integrations/odoo/bank-account/import-bank-accounts`
    );
  }

  removeMapping(
    id: string
  ): Observable<IApiRes<{ success: boolean; message: string }>> {
    return this.http.post<IApiRes<{ success: boolean; message: string }>>(
      `${this.ROOT_URL}/integrations/odoo/bank-account/unmap-bank-account`,
      { id }
    );
  }

  mapBank(body: {
    id: string;
    bankAccountId: string;
  }): Observable<{ success: boolean; message: string; errorMsg: string }> {
    const headers = { isDisable422: 'true' };
    return this.http.post<{
      success: boolean;
      message: string;
      errorMsg: string;
    }>(
      `${this.ROOT_URL}/integrations/odoo/bank-account/map-bank-account`,
      body,
      { headers }
    );
  }

  deleteBank(
    id: string
  ): Observable<IApiRes<{ success: boolean; message: string }>> {
    const headers = { isDisable422: 'true' };
    return this.http.post<IApiRes<{ success: boolean; message: string }>>(
      `${this.ROOT_URL}/integrations/odoo/bank-account/delete-bank-account`,
      { id },
      { headers }
    );
  }

  updateOdooMapingBankAcc(body: {
    id: string;
    bankAccountId: string;
  }): Observable<{ success: boolean; message: string; errorMsg: string }> {
    const headers = { isDisable422: 'true' };
    return this.http.post<{
      success: boolean;
      message: string;
      errorMsg: string;
    }>(`${this.ROOT_URL}/integrations/odoo/bank-account/edit-mapping`, body, {
      headers
    });
  }
}
